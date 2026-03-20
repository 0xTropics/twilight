"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
}

export default function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const draggingRef = useRef(false);
  const [, setDragTick] = useState(0);
  const [loaded, setLoaded] = useState({ before: false, after: false });

  const allLoaded = loaded.before && loaded.after;

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(pct);
  }, []);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      updatePosition(e.clientX);
    };

    const onPointerUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setDragTick((t) => t + 1);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [updatePosition]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      draggingRef.current = true;
      setDragTick((t) => t + 1);
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  return (
    <div
      ref={containerRef}
      className="relative cursor-col-resize select-none overflow-hidden rounded-2xl border border-white/[0.06]"
      onPointerDown={handlePointerDown}
      style={{ touchAction: "none" }}
    >
      {/* Loading skeleton */}
      {!allLoaded && (
        <div className="flex aspect-video items-center justify-center bg-white/[0.02]">
          <div className="h-8 w-8 rounded-full border-2 border-white/[0.06] border-t-[#c8a55c] animate-spin" />
        </div>
      )}

      {/* BEFORE image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={beforeUrl}
        alt="Before — Original"
        className={`block w-full ${allLoaded ? "" : "hidden"}`}
        draggable={false}
        onLoad={() => setLoaded((s) => ({ ...s, before: true }))}
      />

      {/* AFTER image — clipped */}
      {allLoaded && (
        <div
          className="absolute inset-0"
          style={{
            clipPath: `inset(0 0 0 ${position}%)`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={afterUrl}
            alt="After — Twilight"
            className="block h-full w-full object-cover"
            draggable={false}
          />
        </div>
      )}

      {/* Preload */}
      {!loaded.after && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={afterUrl}
          alt=""
          className="hidden"
          onLoad={() => setLoaded((s) => ({ ...s, after: true }))}
        />
      )}

      {/* Labels + Slider */}
      {allLoaded && (
        <>
          <span className="absolute left-3 top-3 z-[5] rounded-md bg-[#09090b]/70 px-2 py-1 text-[10px] font-medium uppercase tracking-widest text-zinc-300 backdrop-blur-sm">
            Before
          </span>
          <span className="absolute right-3 top-3 z-[5] rounded-md bg-[#09090b]/70 px-2 py-1 text-[10px] font-medium uppercase tracking-widest text-zinc-300 backdrop-blur-sm">
            After
          </span>

          <div
            className="absolute inset-y-0 z-10"
            style={{
              left: `${position}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="h-full w-px bg-[#c8a55c]/80" />
            <div className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#c8a55c]/60 bg-[#09090b]/80 backdrop-blur-sm">
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                className="text-[#c8a55c]"
              >
                <path
                  d="M5 3L1 8L5 13M11 3L15 8L11 13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
