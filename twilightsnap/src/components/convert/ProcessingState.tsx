"use client";

import { useEffect, useState } from "react";

interface ProcessingStateProps {
  previewUrl: string;
}

export default function ProcessingState({ previewUrl }: ProcessingStateProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="relative overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="Processing"
          className="max-h-[400px] w-full object-contain opacity-30"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#09090b]/60 backdrop-blur-[2px]">
          {/* Pulsing ring loader */}
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 animate-ping rounded-full border border-[#c8a55c]/30" />
            <div className="absolute inset-1 rounded-full border-2 border-[#c8a55c]/20 border-t-[#c8a55c] animate-spin" />
          </div>
          <p className="mt-5 text-sm font-medium text-foreground">
            Transforming your photo
          </p>
          <p className="mt-1.5 font-mono text-xs text-zinc-500">
            {elapsed}s elapsed
          </p>
        </div>
      </div>
    </div>
  );
}
