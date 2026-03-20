import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin/verify";
import { createAdminClient } from "@/lib/supabase/admin";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const adminId = await verifyAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "0", 10);
  const status = searchParams.get("status") ?? "all";
  const dateRange = searchParams.get("date") ?? "all";

  const admin = createAdminClient();

  // Build query
  let query = admin
    .from("conversions")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  if (dateRange !== "all") {
    const now = Date.now();
    let since: string;
    if (dateRange === "today") {
      since = new Date(now - 86400000).toISOString();
    } else if (dateRange === "7days") {
      since = new Date(now - 7 * 86400000).toISOString();
    } else {
      since = new Date(now - 30 * 86400000).toISOString();
    }
    query = query.gte("created_at", since);
  }

  const { data: conversions, count } = await query;

  type ConversionRow = {
    id: string;
    user_id: string;
    original_url: string;
    original_filename: string;
    status: string;
    processing_time_ms: number | null;
    api_cost: number | null;
    created_at: string;
    error_message: string | null;
  };

  // Get user emails
  const typedConversions = (conversions ?? []) as ConversionRow[];
  const userIds = Array.from(
    new Set(typedConversions.map((c) => c.user_id))
  );
  let emailMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email")
      .in("id", userIds);
    if (profiles) {
      emailMap = Object.fromEntries(
        (profiles as Array<{ id: string; email: string }>).map((p) => [p.id, p.email])
      );
    }
  }

  // Failed alert (last 24h)
  const { data: failedData, count: failedCount } = await admin
    .from("conversions")
    .select("error_message", { count: "exact" })
    .eq("status", "failed")
    .gte("created_at", new Date(Date.now() - 86400000).toISOString())
    .order("created_at", { ascending: false })
    .limit(1);

  const rows = typedConversions.map((c) => ({
    id: c.id,
    user_email: emailMap[c.user_id] ?? "Unknown",
    original_url: c.original_url,
    original_filename: c.original_filename,
    status: c.status,
    processing_time_ms: c.processing_time_ms,
    api_cost: c.api_cost,
    created_at: c.created_at,
    error_message: c.error_message,
  }));

  return NextResponse.json({
    conversions: rows,
    total: count ?? 0,
    failedAlert: {
      count: failedCount ?? 0,
      error: ((failedData ?? []) as Array<{ error_message: string | null }>)[0]?.error_message ?? null,
    },
  });
}
