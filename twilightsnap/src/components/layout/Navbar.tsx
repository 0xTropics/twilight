"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Coins } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);

  const isDashboard =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/convert") ||
    pathname.startsWith("/gallery") ||
    pathname.startsWith("/credits");

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase
          .from("credits")
          .select("balance")
          .eq("user_id", user.id)
          .single()
          .then(({ data }) => {
            if (data) setCreditBalance((data as { balance: number }).balance);
          });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [pathname]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-50 glass-panel-strong">
      <div className="mx-auto flex h-14 items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-0.5">
          <span className="text-base font-semibold tracking-tight gold-gradient">
            Twilight
          </span>
          <span className="text-base font-semibold tracking-tight text-foreground">
            Snap
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-1.5">
              {isDashboard && creditBalance !== null && (
                <Link
                  href="/credits"
                  className="flex items-center gap-1.5 rounded-l-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all duration-300 hover:border-[#c8a55c]/20 hover:text-[#c8a55c]"
                >
                  <Coins className="h-3 w-3" strokeWidth={1.5} />
                  <span className="font-mono font-semibold text-foreground">
                    {creditBalance}
                  </span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className={`border border-white/[0.06] bg-white/[0.03] px-4 py-1.5 text-xs font-medium text-zinc-400 transition-all duration-300 hover:border-white/[0.1] hover:text-foreground ${
                  isDashboard && creditBalance !== null
                    ? "rounded-r-lg border-l-0"
                    : "rounded-lg"
                }`}
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors duration-300 hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-[#c8a55c] px-5 py-2 text-sm font-semibold text-[#09090b] transition-all duration-300 hover:bg-[#b8933f] active:scale-[0.98]"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
