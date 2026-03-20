// To make yourself an admin, run this SQL in Supabase:
// UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';

import {
  Users,
  ImageIcon,
  Coins,
  DollarSign,
  AlertTriangle,
  Activity,
  HardDrive,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

interface DailyCount {
  date: string;
  count: number;
}

export default async function AdminOverviewPage() {
  const admin = createAdminClient();

  const [
    usersRes,
    completedRes,
    usageRes,
    purchaseRes,
    recentRes,
    logsRes,
    failedRecentRes,
    totalConversionsRes,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin
      .from("conversions")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
    admin
      .from("transactions")
      .select("amount")
      .eq("type", "usage"),
    admin
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("type", "purchase"),
    admin
      .from("conversions")
      .select("id, user_id, original_filename, status, processing_time_ms, created_at, error_message")
      .order("created_at", { ascending: false })
      .limit(10),
    admin
      .from("api_logs")
      .select("latency_ms, error, status_code, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    admin
      .from("conversions")
      .select("id, error_message", { count: "exact" })
      .eq("status", "failed")
      .gte("created_at", new Date(Date.now() - 86400000).toISOString()),
    admin
      .from("conversions")
      .select("id", { count: "exact", head: true }),
  ]);

  // Fetch user emails for recent conversions
  const recentConversions = (recentRes.data ?? []) as Array<{
    id: string;
    user_id: string;
    original_filename: string;
    status: string;
    processing_time_ms: number | null;
    created_at: string;
    error_message: string | null;
  }>;
  const userIds = Array.from(new Set(recentConversions.map((c) => c.user_id)));
  let userEmailMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email")
      .in("id", userIds);
    if (profiles) {
      userEmailMap = Object.fromEntries(
        (profiles as Array<{ id: string; email: string }>).map((p) => [p.id, p.email])
      );
    }
  }

  const totalUsers = usersRes.count ?? 0;
  const totalCompleted = completedRes.count ?? 0;
  const creditsConsumed = ((usageRes.data ?? []) as Array<{ amount: number }>).reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0
  );
  const totalPurchases = purchaseRes.count ?? 0;

  // API health
  const apiLogs = (logsRes.data ?? []) as Array<{
    latency_ms: number | null;
    error: string | null;
    status_code: number | null;
    created_at: string;
  }>;
  const avgLatency =
    apiLogs.length > 0
      ? Math.round(
          apiLogs.reduce((sum, l) => sum + (l.latency_ms ?? 0), 0) /
            apiLogs.length
        )
      : 0;
  const lastError = apiLogs.find((l) => l.error);
  const estimatedFiles = (totalConversionsRes.count ?? 0) * 2;

  const failedLast24h = failedRecentRes.count ?? 0;
  const latestFailedError = ((failedRecentRes.data ?? []) as Array<{ error_message: string | null }>)[0]?.error_message;

  // Chart data: conversions per day for last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: chartConversions } = await admin
    .from("conversions")
    .select("created_at")
    .eq("status", "completed")
    .gte("created_at", thirtyDaysAgo);

  const dailyCounts: DailyCount[] = [];
  const countMap: Record<string, number> = {};
  for (const c of (chartConversions ?? []) as Array<{ created_at: string }>) {
    const day = c.created_at.slice(0, 10);
    countMap[day] = (countMap[day] ?? 0) + 1;
  }
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    dailyCounts.push({ date: key, count: countMap[key] ?? 0 });
  }
  const maxCount = Math.max(1, ...dailyCounts.map((d) => d.count));

  const statCards = [
    { label: "Total Users", value: totalUsers, icon: Users },
    { label: "Total Conversions", value: totalCompleted, icon: ImageIcon },
    { label: "Credits Consumed", value: creditsConsumed, icon: Coins },
    { label: "Credit Purchases", value: totalPurchases, icon: DollarSign },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
          Dashboard
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          Admin Overview
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04]">
                <card.icon className="h-5 w-5 text-[#c8a55c]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-zinc-500">{card.label}</p>
                <p className="text-2xl font-semibold tracking-tight text-foreground font-mono">
                  {card.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Conversions Chart */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04]">
        <h2 className="mb-5 text-sm font-medium uppercase tracking-widest text-zinc-500">
          Conversions — Last 30 Days
        </h2>
        <div className="flex h-40 items-end gap-[2px]">
          {dailyCounts.map((d) => (
            <div
              key={d.date}
              className="group relative flex-1"
              title={`${d.date}: ${d.count}`}
            >
              <div
                className="w-full rounded-t bg-[#c8a55c] transition-colors duration-300 group-hover:bg-[#b8933f]"
                style={{
                  height: `${(d.count / maxCount) * 100}%`,
                  minHeight: d.count > 0 ? "4px" : "0px",
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between text-xs font-mono text-zinc-600">
          <span>{dailyCounts[0]?.date.slice(5)}</span>
          <span>{dailyCounts[dailyCounts.length - 1]?.date.slice(5)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04]">
          <h2 className="mb-5 text-sm font-medium uppercase tracking-widest text-zinc-500">
            Recent Activity
          </h2>
          {recentConversions.length === 0 ? (
            <p className="text-sm text-zinc-500">No conversions yet.</p>
          ) : (
            <div className="space-y-2">
              {recentConversions.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.03]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {c.original_filename}
                    </p>
                    <p className="text-xs text-zinc-600">
                      {userEmailMap[c.user_id] ?? "Unknown"}
                      {c.processing_time_ms
                        ? ` · ${(c.processing_time_ms / 1000).toFixed(1)}s`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                        c.status === "completed"
                          ? "bg-green-500/10 text-green-400"
                          : c.status === "failed"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-[#c8a55c]/10 text-[#c8a55c]"
                      }`}
                    >
                      {c.status}
                    </span>
                    <span className="whitespace-nowrap text-xs font-mono text-zinc-600">
                      {new Date(c.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Health */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04]">
          <h2 className="mb-5 text-sm font-medium uppercase tracking-widest text-zinc-500">
            System Health
          </h2>
          <div className="space-y-3">
            {/* OpenAI API */}
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04]">
                  <Activity className="h-4 w-4 text-[#c8a55c]" strokeWidth={1.5} />
                </div>
                <span className="text-sm font-medium text-foreground">
                  OpenAI API
                </span>
              </div>
              <div className="mt-3 space-y-1 text-xs text-zinc-500">
                <p>
                  Avg Latency (last 10):{" "}
                  <span className="font-mono font-medium text-foreground">
                    {avgLatency > 0
                      ? `${(avgLatency / 1000).toFixed(1)}s`
                      : "No data"}
                  </span>
                </p>
                {lastError && (
                  <p className="text-red-400">
                    Last error: {lastError.error}
                  </p>
                )}
              </div>
            </div>

            {/* Storage */}
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04]">
                  <HardDrive className="h-4 w-4 text-[#c8a55c]" strokeWidth={1.5} />
                </div>
                <span className="text-sm font-medium text-foreground">Storage</span>
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                Estimated files:{" "}
                <span className="font-mono font-medium text-foreground">
                  {estimatedFiles}
                </span>
              </p>
            </div>

            {/* Failed Conversions */}
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04]">
                  <AlertTriangle
                    className={`h-4 w-4 ${failedLast24h > 0 ? "text-red-400" : "text-green-400"}`}
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-sm font-medium text-foreground">
                  Failed (24h)
                </span>
              </div>
              <div className="mt-3 text-xs">
                {failedLast24h > 0 ? (
                  <>
                    <p className="font-mono font-medium text-red-400">
                      {failedLast24h} failure{failedLast24h !== 1 ? "s" : ""}
                    </p>
                    {latestFailedError && (
                      <p className="mt-1 truncate text-zinc-500">
                        Latest: {latestFailedError}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-green-400">No failures</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
