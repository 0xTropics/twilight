import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin/verify";
import { createAdminClient } from "@/lib/supabase/admin";

const PAGE_SIZE = 20;

type AmountRow = { amount: number };
type TransactionRow = {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string | null;
  created_at: string;
};

export async function GET(request: NextRequest) {
  const adminId = await verifyAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "0", 10);

  const admin = createAdminClient();

  // Stats
  const [purchaseRes, usageRes] = await Promise.all([
    admin.from("transactions").select("amount").eq("type", "purchase"),
    admin.from("transactions").select("amount").eq("type", "usage"),
  ]);

  const totalCreditsSold = ((purchaseRes.data ?? []) as AmountRow[]).reduce(
    (sum, t) => sum + t.amount,
    0
  );
  const totalCreditsUsed = ((usageRes.data ?? []) as AmountRow[]).reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0
  );
  const creditsOutstanding = totalCreditsSold - totalCreditsUsed;
  const estimatedRevenue = totalCreditsSold * 10;

  // Paginated transactions
  const { data: transactions, count } = await admin
    .from("transactions")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  // Get user emails
  const typedTransactions = (transactions ?? []) as TransactionRow[];
  const userIds = Array.from(
    new Set(typedTransactions.map((t) => t.user_id))
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

  const rows = typedTransactions.map((t) => ({
    id: t.id,
    user_email: emailMap[t.user_id] ?? "Unknown",
    type: t.type,
    amount: t.amount,
    description: t.description,
    created_at: t.created_at,
  }));

  return NextResponse.json({
    stats: {
      totalCreditsSold,
      totalCreditsUsed,
      creditsOutstanding,
      estimatedRevenue,
    },
    transactions: rows,
    total: count ?? 0,
  });
}
