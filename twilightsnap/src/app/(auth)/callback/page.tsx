"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      router.replace("/login?error=auth");
      return;
    }

    const supabase = createClient();
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        router.replace("/login?error=auth");
      } else {
        router.replace("/dashboard");
      }
    });
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#F59E0B]" />
      <p className="mt-4 text-[#94A3B8]">Authenticating...</p>
    </main>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#F59E0B]" />
          <p className="mt-4 text-[#94A3B8]">Authenticating...</p>
        </main>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
