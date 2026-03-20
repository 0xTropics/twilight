"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface ConversionRow {
  id: string;
  user_email: string;
  original_url: string;
  original_filename: string;
  status: "pending" | "processing" | "completed" | "failed";
  processing_time_ms: number | null;
  api_cost: number | null;
  created_at: string;
  error_message: string | null;
}

type StatusFilter = "all" | "completed" | "processing" | "failed";
type DateFilter = "all" | "today" | "7days" | "30days";

const PAGE_SIZE = 20;

export default function AdminConversionsPage() {
  const [conversions, setConversions] = useState<ConversionRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [failedAlert, setFailedAlert] = useState<{
    count: number;
    error: string | null;
  } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      status: statusFilter,
      date: dateFilter,
    });
    const res = await fetch(`/api/admin/conversions?${params}`);
    if (res.ok) {
      const data = await res.json();
      setConversions(data.conversions);
      setTotalCount(data.total);
      setFailedAlert(data.failedAlert);
    }
    setLoading(false);
  }, [page, statusFilter, dateFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleFilterChange(status: StatusFilter) {
    setStatusFilter(status);
    setPage(0);
  }

  function handleDateChange(date: DateFilter) {
    setDateFilter(date);
    setPage(0);
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const supabaseUrl =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
      : "";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Conversions</h1>

      {/* Failed alert */}
      {failedAlert && failedAlert.count > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-medium text-red-400">
              {failedAlert.count} failed conversion
              {failedAlert.count !== 1 ? "s" : ""} in the last 24 hours
            </p>
            {failedAlert.error && (
              <p className="mt-1 text-xs text-red-400/70">
                Latest: {failedAlert.error}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-xl border border-white/[0.04] bg-white/[0.02] p-1">
          {(
            [
              ["all", "All"],
              ["completed", "Completed"],
              ["processing", "Processing"],
              ["failed", "Failed"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleFilterChange(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
                statusFilter === key
                  ? "bg-white/[0.06] text-foreground"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-600">
            {totalCount} result{totalCount !== 1 ? "s" : ""}
          </span>
          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => handleDateChange(e.target.value as DateFilter)}
              className="appearance-none rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-1.5 pr-8 text-xs text-foreground transition-colors duration-300 focus:border-[#c8a55c] focus:outline-none"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-600" strokeWidth={1.5} />
          </div>
        </div>
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
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">Image</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">User</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
                  Filename
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">Time</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">Cost</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] bg-white/[0.02]">
              {conversions.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-zinc-500"
                  >
                    No conversions found.
                  </td>
                </tr>
              ) : (
                conversions.map((c) => (
                  <tr key={c.id} className="transition-colors duration-300 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="h-10 w-10 overflow-hidden rounded-lg bg-white/[0.04]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`${supabaseUrl}/storage/v1/object/public/images/${c.original_url}`}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                      {c.user_email}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-foreground">
                      {c.original_filename}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                          c.status === "completed"
                            ? "bg-[#22C55E]/10 text-[#22C55E]"
                            : c.status === "failed"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-[#c8a55c]/10 text-[#c8a55c]"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-zinc-500">
                      {c.processing_time_ms
                        ? `${(c.processing_time_ms / 1000).toFixed(1)}s`
                        : "\u2014"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-zinc-500">
                      {c.api_cost ? `$${(c.api_cost / 100).toFixed(2)}` : "\u2014"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                      {new Date(c.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
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
