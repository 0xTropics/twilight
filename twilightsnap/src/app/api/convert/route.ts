import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { convertToTwilight } from "@/lib/openai/client";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | null = null;
  let conversionId: string | null = null;

  try {
    // Auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.id;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG and PNG are accepted." },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 20MB." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const timestamp = Date.now();
    const safeName = sanitizeFilename(file.name);

    // 1. Check credits
    const { data: credits, error: creditsError } = await admin
      .from("credits")
      .select("balance")
      .eq("user_id", userId)
      .single();
    if (creditsError || !credits) {
      return NextResponse.json(
        { error: "Could not verify credits" },
        { status: 500 }
      );
    }
    if ((credits as { balance: number }).balance < 1) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 }
      );
    }

    // 2. Upload original to storage
    const imageBuffer = Buffer.from(await file.arrayBuffer());
    const originalPath = `${userId}/originals/${timestamp}-${safeName}`;
    const { error: uploadError } = await admin.storage
      .from("images")
      .upload(originalPath, imageBuffer, {
        contentType: file.type,
        upsert: false,
      });
    if (uploadError) {
      throw new Error(`Failed to upload original: ${uploadError.message}`);
    }

    // 3. Create conversion record
    const { data: conversion, error: conversionError } = await (admin
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("conversions") as any)
      .insert({
        user_id: userId,
        original_url: originalPath,
        original_filename: file.name,
        status: "processing",
        model_used: "gpt-image-1",
      })
      .select("id")
      .single();
    if (conversionError || !conversion) {
      throw new Error(
        `Failed to create conversion record: ${conversionError?.message}`
      );
    }
    conversionId = (conversion as { id: string }).id;

    // 4. Call OpenAI
    let result;
    try {
      result = await convertToTwilight(imageBuffer, file.name);
    } catch (openaiError: unknown) {
      const errMsg =
        openaiError instanceof Error
          ? openaiError.message
          : "OpenAI conversion failed";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin.from("conversions") as any)
        .update({ status: "failed", error_message: errMsg })
        .eq("id", conversionId);
      await logApiCall(admin, userId, errMsg, Date.now() - startTime, 500);
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }

    // 5. Upload result
    const resultExt = safeName.toLowerCase().endsWith(".png") ? ".png" : ".png"; // OpenAI returns PNG from b64
    const resultPath = `${userId}/results/${timestamp}-twilight-${safeName.replace(/\.[^.]+$/, resultExt)}`;
    const { error: resultUploadError } = await admin.storage
      .from("images")
      .upload(resultPath, result.resultBuffer, {
        contentType: "image/png",
        upsert: false,
      });
    if (resultUploadError) {
      throw new Error(
        `Failed to upload result: ${resultUploadError.message}`
      );
    }

    const processingTime = Date.now() - startTime;

    // 6. Update conversion record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from("conversions") as any)
      .update({
        status: "completed",
        result_url: resultPath,
        processing_time_ms: processingTime,
        completed_at: new Date().toISOString(),
        api_cost: 8, // $0.08 in cents
      })
      .eq("id", conversionId);

    // 7. Deduct credit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from("credits") as any)
      .update({ balance: (credits as { balance: number }).balance - 1 })
      .eq("user_id", userId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from("transactions") as any).insert({
      user_id: userId,
      type: "usage",
      amount: -1,
      description: `Twilight conversion: ${file.name}`,
    });

    // 8. Log success
    await logApiCall(admin, userId, null, processingTime, 200);

    // Build public URLs
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const originalPublicUrl = `${supabaseUrl}/storage/v1/object/public/images/${originalPath}`;
    const resultPublicUrl = `${supabaseUrl}/storage/v1/object/public/images/${resultPath}`;

    return NextResponse.json({
      success: true,
      conversion: {
        id: conversionId,
        original_url: originalPublicUrl,
        result_url: resultPublicUrl,
        processing_time_ms: processingTime,
      },
    });
  } catch (error: unknown) {
    const errMsg =
      error instanceof Error ? error.message : "Internal server error";
    console.error("[Convert API] Error:", errMsg);

    if (conversionId) {
      const admin = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin.from("conversions") as any)
        .update({ status: "failed", error_message: errMsg })
        .eq("id", conversionId);
    }

    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

async function logApiCall(
  admin: ReturnType<typeof createAdminClient>,
  userId: string | null,
  error: string | null,
  latencyMs: number,
  statusCode: number
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from("api_logs") as any).insert({
      user_id: userId,
      endpoint: "/api/convert",
      method: "POST",
      model: "gpt-image-1",
      cost_usd: error ? null : 0.08,
      latency_ms: latencyMs,
      status_code: statusCode,
      error,
    });
  } catch (e) {
    console.error("[Convert API] Failed to log API call:", e);
  }
}
