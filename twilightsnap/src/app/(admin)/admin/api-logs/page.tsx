"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Loader2,
} from "lucide-react";

interface LogRow {
  id: string;
  user_email: string | null;
  endpoint: string;
  model: string;
  latency_ms: number | null;
  cost_usd: number | null;
  status_code: number;
  error: string | null;
  created_at: string;
}

interface LogStats {
  totalCalls: number;
  totalCost: number;
  avgLatency: number;
  errorRate: number;
}

const PAGE_SIZE = 25;

export default function AdminApiLogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [stats, setStats] = useState<LogStats>({
    totalCalls: 0,
    totalCost: 0,
    avgLatency: 0,
    errorRate: 0,
  });
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/api-logs?page=${page}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setTotalCount(data.total);
      setStats(data.stats);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const statCards = [
    {
      label: "Total API Calls",
      value: stats.totalCalls.toLocaleString(),
      icon: Activity,
    },
    {
      label: "Total Cost",
      value: `$${stats.totalCost.toFixed(2)}`,
      icon: DollarSign,
    },
    {
      label: "Avg Latency",
      value: stats.avgLatency > 0 ? `${(stats.avgLatency / 1000).toFixed(1)}s` : "—",
      icon: Clock,
    },
    {
      label: "Error Rate",
      value: `${stats.errorRate.toFixed(1)}%`,
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        API Logs
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-colors duration-300"
          >
            <div className="flex items-center gap-2">
              <card.icon className="h-4 w-4 text-[#c8a55c]" strokeWidth={1.5} />
              <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">
                {card.label}
              </span>
            </div>
            <p className="mt-1 text-2xl font-semibold tracking-tight font-mono text-foreground">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#c8a55c]" strokeWidth={1.5} />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/[0.04] bg-white/[0.02]">
              <tr>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
                  User
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
                  Endpoint
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
                  Model
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
                  Latency
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
                  Cost
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
                  Error
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-zinc-500"
                  >
                    No API logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="transition-colors duration-300 hover:bg-white/[0.02]"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                      {new Date(log.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                      {log.user_email ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-foreground">
                      {log.endpoint}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                      {log.model}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-zinc-500">
                      {log.latency_ms
                        ? `${(log.latency_ms / 1000).toFixed(1)}s`
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-zinc-500">
                      {log.cost_usd != null
                        ? `$${log.cost_usd.toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium font-mono ${
                          log.status_code >= 200 && log.status_code < 300
                            ? "bg-green-400/10 text-green-400"
                            : log.status_code >= 400 && log.status_code < 500
                              ? "bg-[#c8a55c]/10 text-[#c8a55c]"
                              : "bg-red-400/10 text-red-400"
                        }`}
                      >
                        {log.status_code}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-xs text-red-400">
                      {log.error ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-600">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors duration-300 hover:text-foreground disabled:opacity-50"
            >
              <ChevronLeft className="h-3 w-3" strokeWidth={1.5} /> Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors duration-300 hover:text-foreground disabled:opacity-50"
            >
              Next <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
