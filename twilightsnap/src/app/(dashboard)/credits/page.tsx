"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CREDIT_PACKS } from "@/lib/stripe/config";

type TransactionType = "purchase" | "usage" | "refund" | "bonus";

interface TransactionRow {
  id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  created_at: string;
}

const TYPE_STYLES: Record<TransactionType, string> = {
  purchase: "bg-green-500/10 text-green-400",
  usage: "bg-red-500/10 text-red-400",
  refund: "bg-blue-500/10 text-blue-400",
  bonus: "bg-[#c8a55c]/10 text-[#c8a55c]",
};

export default function CreditsPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState(false);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [creditsRes, txRes] = await Promise.all([
      supabase
        .from("credits")
        .select("balance")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("transactions")
        .select("id, type, amount, description, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    setBalance((creditsRes.data as { balance: number } | null)?.balance ?? 0);
    setTransactions((txRes.data as TransactionRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!sessionId) return;

    async function verifyPayment() {
      try {
        const res = await fetch(
          `/api/stripe/verify?session_id=${sessionId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setSuccessBanner(true);
            setBalance(data.credits);
            await fetchData();
          }
        }
      } catch {
        setTimeout(fetchData, 2000);
      }
    }

    verifyPayment();
  }, [sessionId, fetchData]);

  async function handlePurchase(packId: string) {
    setPurchaseLoading(packId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned");
        setPurchaseLoading(null);
      }
    } catch {
      setPurchaseLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-white/[0.06] border-t-[#c8a55c] animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Success banner */}
      {successBanner && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-400" strokeWidth={1.5} />
          <p className="text-sm font-medium text-green-400">
            Payment successful! Your credits have been added.
          </p>
        </div>
      )}

      {/* Header with balance */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Credits
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            <span className="font-mono text-foreground">{balance ?? 0}</span> credits available
          </p>
        </div>
        {balance === 0 && (
          <p className="text-sm text-[#c8a55c]/70">
            Purchase credits to continue converting
          </p>
        )}
      </div>

      {/* Purchase Section */}
      <div className="mt-6">
        <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">
          Purchase Credits
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-500 ${
                pack.popular
                  ? "border-[#c8a55c]/30 bg-white/[0.04] glow-gold-subtle"
                  : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]"
              }`}
            >
              {pack.popular && (
                <div className="bg-[#c8a55c] px-3 py-1.5 text-center text-[10px] font-semibold uppercase tracking-widest text-[#09090b]">
                  Most Popular
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-sm font-semibold text-foreground">
                  {pack.name}
                </h3>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                  {pack.priceDisplay}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {pack.perCredit} per conversion
                </p>
                {pack.id !== "pack_5" ? (
                  <p className="mt-2 text-xs font-medium text-green-400">
                    {pack.description}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-zinc-600">Base price</p>
                )}
                <div className="mt-auto pt-5">
                  <button
                    onClick={() => handlePurchase(pack.id)}
                    disabled={purchaseLoading === pack.id}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 active:scale-[0.98] disabled:opacity-40 ${
                      pack.popular
                        ? "bg-[#c8a55c] text-[#09090b] hover:bg-[#b8933f]"
                        : "border border-white/[0.06] bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
                    }`}
                  >
                    {purchaseLoading === pack.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Purchase"
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div className="mt-10">
        <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">
          Transaction History
        </h2>
        {transactions.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
            <p className="text-sm text-zinc-500">No transactions yet</p>
            <Link
              href="/convert"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#c8a55c] transition-colors duration-300 hover:text-[#e8d5a3]"
            >
              Convert your first photo
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-white/[0.06]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/[0.04] bg-white/[0.02]">
                <tr>
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
                {transactions.map((t) => (
                  <tr
                    key={t.id}
                    className="transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${TYPE_STYLES[t.type]}`}
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
                    <td className="max-w-[250px] truncate px-4 py-3 text-zinc-500">
                      {t.description ?? "\u2014"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                      {new Date(t.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {balance !== null && balance > 0 && balance <= 2 && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-[#c8a55c]/20 bg-[#c8a55c]/5 p-4">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-[#c8a55c]" strokeWidth={1.5} />
          <p className="text-sm text-[#c8a55c]">
            Running low on credits — you have {balance} remaining
          </p>
        </div>
      )}
    </div>
  );
}
