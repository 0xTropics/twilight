"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Clock, Shield } from "lucide-react";

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setLoggedIn(!!user);
    });
  }, []);

  return (
    <main className="relative min-h-[100dvh] overflow-hidden">
      {/* Background radial gradient */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(200,165,92,0.06) 0%, transparent 60%)",
        }}
      />

      {/* Hero */}
      <section className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 pb-32 pt-24 lg:grid-cols-2 lg:px-8 lg:pt-32">
        {/* Left — Copy */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c8a55c]" />
              Professional Real Estate Photography
            </span>
          </motion.div>

          <motion.h1
            className="mt-8 text-4xl font-semibold leading-[1.1] tracking-tighter text-foreground md:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            Transform listings
            <br />
            into{" "}
            <span className="gold-gradient">twilight</span>
            <br />
            masterpieces
          </motion.h1>

          <motion.p
            className="mt-6 max-w-[48ch] text-base leading-relaxed text-zinc-500"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            Convert daytime property photos into magazine-quality twilight shots
            in seconds. No reshoots, no scheduling around golden hour.
          </motion.p>

          <motion.div
            className="mt-10 flex items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              href={loggedIn ? "/convert" : "/signup"}
              className="group inline-flex items-center gap-2 rounded-xl bg-[#c8a55c] px-7 py-3.5 text-sm font-semibold text-[#09090b] transition-all duration-300 hover:bg-[#b8933f] active:scale-[0.98]"
            >
              Start Converting
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={2} />
            </Link>
            {loggedIn && (
              <Link
                href="/dashboard"
                className="text-sm font-medium text-zinc-500 transition-colors duration-300 hover:text-[#c8a55c]"
              >
                Open Dashboard
              </Link>
            )}
          </motion.div>
        </div>

        {/* Right — Feature Cards */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FeatureCard
              icon={<Sparkles className="h-5 w-5" strokeWidth={1.5} />}
              title="AI-Powered"
              description="Advanced neural rendering produces photorealistic twilight effects"
              delay={0.4}
            />
            <FeatureCard
              icon={<Clock className="h-5 w-5" strokeWidth={1.5} />}
              title="Under 60 Seconds"
              description="Get results faster than it takes to brew your morning coffee"
              delay={0.5}
            />
            <FeatureCard
              icon={<Shield className="h-5 w-5" strokeWidth={1.5} />}
              title="MLS Ready"
              description="Output resolution matches your original — ready for any listing"
              delay={0.6}
              className="sm:col-span-2"
            />
          </div>

          {/* Ambient glow behind cards */}
          <div className="pointer-events-none absolute -inset-8 -z-10 rounded-3xl opacity-40"
            style={{
              background: "radial-gradient(ellipse at center, rgba(200,165,92,0.08), transparent 70%)",
            }}
          />
        </motion.div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  delay,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
  className?: string;
}) {
  return (
    <motion.div
      className={`group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-500 hover:border-white/[0.1] hover:bg-white/[0.04] ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-4 inline-flex rounded-xl border border-white/[0.06] bg-white/[0.04] p-2.5 text-[#c8a55c]">
        {icon}
      </div>
      <h3 className="text-sm font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
        {description}
      </p>
    </motion.div>
  );
}
