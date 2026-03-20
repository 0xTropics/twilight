import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, Plus } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName = user?.user_metadata?.full_name || user?.email || "there";

  const recentRes = await supabase
    .from("conversions")
    .select("id, original_url, result_url, status, created_at, original_filename")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(8);

  const recentConversions = (recentRes.data ?? []) as Array<{
    id: string;
    original_url: string;
    result_url: string | null;
    status: string;
    created_at: string;
    original_filename: string;
  }>;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Welcome back, {displayName}
        </h1>
        <Link
          href="/convert"
          className="flex items-center gap-2 rounded-xl bg-[#c8a55c] px-5 py-2.5 text-sm font-semibold text-[#09090b] transition-all duration-300 hover:bg-[#b8933f] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          New Conversion
        </Link>
      </div>

      {/* Recent conversions list */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-600">
            Recent Conversions
          </h2>
          {recentConversions.length > 0 && (
            <Link
              href="/gallery"
              className="flex items-center gap-1 text-xs font-medium text-[#c8a55c] transition-colors duration-300 hover:text-[#e8d5a3]"
            >
              View All
              <ArrowRight className="h-3 w-3" strokeWidth={2} />
            </Link>
          )}
        </div>

        {recentConversions.length === 0 ? (
          <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
            <p className="text-sm text-zinc-500">
              No conversions yet. Transform your first photo into a twilight shot.
            </p>
            <Link
              href="/convert"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#c8a55c] transition-colors duration-300 hover:text-[#e8d5a3]"
            >
              Get started
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-white/[0.04] bg-white/[0.02]">
            {recentConversions.map((c, i) => (
              <Link
                key={c.id}
                href="/gallery"
                className={`flex items-center gap-4 px-4 py-3 transition-colors duration-300 hover:bg-white/[0.03] ${
                  i !== 0 ? "border-t border-white/[0.04]" : ""
                }`}
              >
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-white/[0.04]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${supabaseUrl}/storage/v1/object/public/images/${
                      c.status === "completed" && c.result_url
                        ? c.result_url
                        : c.original_url
                    }`}
                    alt={c.original_filename}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {c.original_filename}
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-600">
                    {new Date(c.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`flex-shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium ${
                    c.status === "completed"
                      ? "bg-green-500/10 text-green-400"
                      : c.status === "failed"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-[#c8a55c]/10 text-[#c8a55c]"
                  }`}
                >
                  {c.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
