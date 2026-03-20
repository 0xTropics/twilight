import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin/verify";
import { createAdminClient } from "@/lib/supabase/admin";

const PAGE_SIZE = 25;

export async function GET(request: NextRequest) {
  const adminId = await verifyAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "0", 10);

  const admin = createAdminClient();

  // Paginated logs
  const { data: logs, count } = await admin
    .from("api_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  // Stats (all time)
  const [totalRes, costRes, latencyRes, errorRes] = await Promise.all([
    admin.from("api_logs").select("id", { count: "exact", head: true }),
    admin.from("api_logs").select("cost_usd"),
    admin.from("api_logs").select("latency_ms"),
    admin
      .from("api_logs")
      .select("id", { count: "exact", head: true })
      .not("status_code", "gte", 200)
      .not("status_code", "lt", 300),
  ]);

  const totalCalls = totalRes.count ?? 0;
  const totalCost = ((costRes.data ?? []) as Array<{ cost_usd: number | null }>).reduce(
    (sum, l) => sum + (l.cost_usd ?? 0),
    0
  );
  const latencies = ((latencyRes.data ?? []) as Array<{ latency_ms: number | null }>)
    .map((l) => l.latency_ms)
    .filter((v): v is number => v != null);
  const avgLatency =
    latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0;

  // For error rate, count non-2xx status codes
  const errorCount = errorRes.count ?? 0;
  const errorRate = totalCalls > 0 ? (errorCount / totalCalls) * 100 : 0;

  // Get user emails for logs
  const userIds = Array.from(
    new Set(
      ((logs ?? []) as Array<{ user_id: string | null }>).map((l) => l.user_id).filter((id): id is string => !!id)
    )
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

  type ApiLogRow = {
    id: string;
    user_id: string | null;
    endpoint: string | null;
    model: string | null;
    latency_ms: number | null;
    cost_usd: number | null;
    status_code: number | null;
    error: string | null;
    created_at: string;
  };
  const rows = ((logs ?? []) as ApiLogRow[]).map((l) => ({
    id: l.id,
    user_email: l.user_id ? (emailMap[l.user_id] ?? "Unknown") : null,
    endpoint: l.endpoint,
    model: l.model,
    latency_ms: l.latency_ms,
    cost_usd: l.cost_usd,
    status_code: l.status_code,
    error: l.error,
    created_at: l.created_at,
  }));

  return NextResponse.json({
    logs: rows,
    total: count ?? 0,
    stats: {
      totalCalls,
      totalCost,
      avgLatency,
      errorRate,
    },
  });
}
