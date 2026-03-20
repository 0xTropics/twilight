import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: { role: string } | null };

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="border-b border-white/[0.04]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#c8a55c]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#c8a55c]">
              Admin
            </span>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-medium text-zinc-500 transition-colors duration-300 hover:text-foreground"
          >
            Back to App
          </Link>
        </div>
        <AdminNav />
      </div>
      <main className="mx-auto max-w-7xl px-6 py-5">{children}</main>
    </div>
  );
}
