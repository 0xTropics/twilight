import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin/verify";
import { createAdminClient } from "@/lib/supabase/admin";

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
};
type CreditRow = { user_id: string; balance: number };
type ConversionRow = { user_id: string };

export async function GET() {
  const adminId = await verifyAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: profilesRaw } = await admin
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false });

  const profiles = (profilesRaw ?? []) as ProfileRow[];

  if (profiles.length === 0) {
    return NextResponse.json([]);
  }

  const userIds = profiles.map((p) => p.id);

  const [creditsRes, conversionsRes] = await Promise.all([
    admin.from("credits").select("user_id, balance").in("user_id", userIds),
    admin
      .from("conversions")
      .select("user_id")
      .in("user_id", userIds)
      .eq("status", "completed"),
  ]);

  const creditMap: Record<string, number> = {};
  for (const c of (creditsRes.data ?? []) as CreditRow[]) {
    creditMap[c.user_id] = c.balance;
  }

  const conversionCountMap: Record<string, number> = {};
  for (const c of (conversionsRes.data ?? []) as ConversionRow[]) {
    conversionCountMap[c.user_id] = (conversionCountMap[c.user_id] ?? 0) + 1;
  }

  const users = profiles.map((p) => ({
    id: p.id,
    email: p.email,
    full_name: p.full_name,
    role: p.role,
    created_at: p.created_at,
    credit_balance: creditMap[p.id] ?? 0,
    total_conversions: conversionCountMap[p.id] ?? 0,
  }));

  return NextResponse.json(users);
}
