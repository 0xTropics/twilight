"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import UploadZone from "@/components/convert/UploadZone";
import ImagePreview from "@/components/convert/ImagePreview";
import ProcessingState from "@/components/convert/ProcessingState";
import ConversionResult from "@/components/convert/ConversionResult";
import { motion, AnimatePresence } from "framer-motion";

type ConvertState = "idle" | "selected" | "processing" | "completed" | "error";

interface ConversionData {
  id: string;
  original_url: string;
  result_url: string;
  processing_time_ms: number;
}

export default function ConvertPage() {
  const [state, setState] = useState<ConvertState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [conversion, setConversion] = useState<ConversionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  );

  useEffect(() => {
    async function fetchCredits() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("credits")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) setCredits((data as { balance: number }).balance);
    }
    fetchCredits();
  }, []);

  const handleFileSelected = useCallback((f: File) => {
    setFile(f);
    setState("selected");
    setError(null);
  }, []);

  const handleRemove = useCallback(() => {
    setFile(null);
    setState("idle");
    setError(null);
    setConversion(null);
  }, []);

  const handleConvert = useCallback(async () => {
    if (!file) return;
    if (credits !== null && credits < 1) {
      setShowNoCreditsModal(true);
      return;
    }
    setState("processing");
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Conversion failed");
      }

      setConversion(data.conversion);
      setCredits((c) => (c !== null ? c - 1 : null));
      setState("completed");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Conversion failed");
      setState("error");
    }
  }, [file, credits]);

  const handleConvertAnother = useCallback(() => {
    setFile(null);
    setConversion(null);
    setState("idle");
    setError(null);
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Transform to Twilight
        </h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Upload a daytime property photo and watch it transform
        </p>
      </div>

      {credits !== null && credits > 0 && credits <= 2 && state !== "completed" && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-[#c8a55c]/20 bg-[#c8a55c]/5 p-4">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-[#c8a55c]" strokeWidth={1.5} />
          <p className="text-sm text-[#c8a55c]">
            Running low on credits — you have {credits} remaining.{" "}
            <Link
              href="/credits"
              className="font-medium underline underline-offset-2 transition-colors hover:text-[#e8d5a3]"
            >
              Buy more
            </Link>
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {state === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <UploadZone onFileSelected={handleFileSelected} />
          </motion.div>
        )}

        {state === "selected" && file && (
          <motion.div
            key="selected"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <ImagePreview
              file={file}
              onRemove={handleRemove}
              onConvert={handleConvert}
            />
          </motion.div>
        )}

        {state === "processing" && previewUrl && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <ProcessingState previewUrl={previewUrl} />
          </motion.div>
        )}

        {state === "completed" && conversion && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <ConversionResult
              originalUrl={conversion.original_url}
              resultUrl={conversion.result_url}
              processingTimeMs={conversion.processing_time_ms}
              creditsRemaining={credits ?? 0}
              originalFilename={file?.name}
              onConvertAnother={handleConvertAnother}
            />
          </motion.div>
        )}

        {state === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400" strokeWidth={1.5} />
                <p className="font-medium text-red-400">{error}</p>
              </div>
              <div className="mt-5 flex gap-3">
                {file && (
                  <button
                    onClick={handleConvert}
                    className="rounded-xl bg-[#c8a55c] px-5 py-2.5 text-sm font-semibold text-[#09090b] transition-all duration-300 hover:bg-[#b8933f] active:scale-[0.98]"
                  >
                    Try Again
                  </button>
                )}
                <button
                  onClick={handleConvertAnother}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-zinc-400 transition-all duration-300 hover:border-white/[0.1] hover:text-foreground"
                >
                  Upload Different Image
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No credits modal */}
      <AnimatePresence>
        {showNoCreditsModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowNoCreditsModal(false);
            }}
          >
            <div className="absolute inset-0 bg-[#09090b]/80 backdrop-blur-sm" />
            <motion.div
              className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#121214] p-6"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  Out of Credits
                </h3>
                <button
                  onClick={() => setShowNoCreditsModal(false)}
                  className="text-zinc-500 transition-colors hover:text-foreground"
                >
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                Purchase more credits to continue converting photos into
                twilight shots.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowNoCreditsModal(false)}
                  className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zinc-400 transition-all duration-300 hover:border-white/[0.1] hover:text-foreground"
                >
                  Cancel
                </button>
                <Link
                  href="/credits"
                  className="flex flex-1 items-center justify-center rounded-xl bg-[#c8a55c] px-4 py-2.5 text-sm font-semibold text-[#09090b] transition-all duration-300 hover:bg-[#b8933f]"
                >
                  Buy Credits
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
