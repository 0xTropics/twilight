"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Coins,
  DollarSign,
  Info,
  Loader2,
  TrendingUp,
  Wallet,
} from "lucide-react";

interface RevenueStats {
  totalCreditsSold: number;
  totalCreditsUsed: number;
  creditsOutstanding: number;
  estimatedRevenue: number;
}

interface TransactionRow {
  id: string;
  user_email: string;
  type: "purchase" | "usage" | "refund" | "bonus";
  amount: number;
  description: string | null;
  created_at: string;
}

const PAGE_SIZE = 20;

const TYPE_STYLES: Record<string, string> = {
  purchase: "bg-green-400/10 text-green-400",
  usage: "bg-red-400/10 text-red-400",
  refund: "bg-blue-400/10 text-blue-400",
  bonus: "bg-[#c8a55c]/10 text-[#c8a55c]",
};

export default function AdminRevenuePage() {
  const [stats, setStats] = useState<RevenueStats>({
    totalCreditsSold: 0,
    totalCreditsUsed: 0,
    creditsOutstanding: 0,
    estimatedRevenue: 0,
  });
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/revenue?page=${page}`);
    if (res.ok) {
      const data = await res.json();
      setStats(data.stats);
      setTransactions(data.transactions);
      setTotalCount(data.total);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const statCards = [
    {
      label: "Credits Sold",
      value: stats.totalCreditsSold,
      icon: Coins,
    },
    {
      label: "Credits Used",
      value: stats.totalCreditsUsed,
      icon: TrendingUp,
    },
    {
      label: "Outstanding",
      value: stats.creditsOutstanding,
      icon: Wallet,
    },
    {
      label: "Est. Revenue",
      value: `$${stats.estimatedRevenue.toFixed(0)}`,
      icon: DollarSign,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Revenue
      </h1>

      {/* Note */}
      <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#c8a55c]" strokeWidth={1.5} />
        <p className="text-sm text-zinc-500">
          Stripe integration coming soon — revenue data will be pulled from
          actual payment records. Estimated revenue uses $10 average per credit
          purchase.
        </p>
      </div>

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
            <p className="mt-2 text-2xl font-semibold tracking-tight font-mono text-foreground">
              {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Transactions Table */}
      <div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
          Transaction History
        </h2>

        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#c8a55c]" strokeWidth={1.5} />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/[0.04] bg-white/[0.02]">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
                    User
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
                    Type
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
                    Description
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-zinc-600">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-zinc-500"
                    >
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr
                      key={t.id}
                      className="transition-colors duration-300 hover:bg-white/[0.02]"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                        {t.user_email}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-medium ${TYPE_STYLES[t.type] ?? ""}`}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-3 font-mono font-medium ${
                          t.amount > 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {t.amount > 0 ? "+" : ""}
                        {t.amount}
                      </td>
                      <td className="max-w-[300px] truncate px-4 py-3 text-zinc-500">
                        {t.description ?? "\u2014"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                        {new Date(t.created_at).toLocaleDateString("en-US", {
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
          <div className="mt-4 flex items-center justify-between">
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
    </div>
  );
}
