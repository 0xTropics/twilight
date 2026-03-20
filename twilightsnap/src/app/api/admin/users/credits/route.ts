import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin/verify";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const adminId = await verifyAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, amount } = body as { userId: string; amount: number };

  if (!userId || !amount || amount < 1) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: creditsData } = await admin
    .from("credits")
    .select("balance, lifetime_purchased")
    .eq("user_id", userId)
    .single();

  const credits = creditsData as { balance: number; lifetime_purchased: number } | null;

  if (!credits) {
    return NextResponse.json(
      { error: "User credits not found" },
      { status: 404 }
    );
  }

  const { error: updateError } = await (admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("credits") as any)
    .update({
      balance: credits.balance + amount,
      lifetime_purchased: credits.lifetime_purchased + amount,
    })
    .eq("user_id", userId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from("transactions") as any).insert({
    user_id: userId,
    type: "bonus",
    amount,
    description: "Admin granted credits",
  });

  return NextResponse.json({ success: true });
}
