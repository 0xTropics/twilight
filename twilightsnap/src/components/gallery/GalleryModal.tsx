"use client";

import { useCallback, useEffect } from "react";
import { Download, X } from "lucide-react";
import BeforeAfterSlider from "@/components/convert/BeforeAfterSlider";
import type { Conversion } from "@/types/database";

interface GalleryModalProps {
  conversion: Conversion;
  supabaseUrl: string;
  onClose: () => void;
}

export default function GalleryModal({
  conversion,
  supabaseUrl,
  onClose,
}: GalleryModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const originalUrl = `${supabaseUrl}/storage/v1/object/public/images/${conversion.original_url}`;
  const resultUrl = conversion.result_url
    ? `${supabaseUrl}/storage/v1/object/public/images/${conversion.result_url}`
    : null;

  async function handleDownload() {
    if (!resultUrl) return;
    const response = await fetch(resultUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `twilight-${conversion.original_filename.replace(/\.[^.]+$/, "")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-[#09090b]/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-4xl rounded-2xl border border-white/[0.08] bg-[#121214] p-5 sm:p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-zinc-400 transition-colors duration-300 hover:text-foreground"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>

        {conversion.status === "completed" && resultUrl ? (
          <>
            <BeforeAfterSlider
              beforeUrl={originalUrl}
              afterUrl={resultUrl}
            />
            <div className="mt-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {conversion.original_filename}
                </p>
                <p className="mt-0.5 text-xs text-zinc-600">
                  {new Date(conversion.created_at).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", year: "numeric" }
                  )}
                  {conversion.processing_time_ms &&
                    ` \u00B7 ${(conversion.processing_time_ms / 1000).toFixed(1)}s`}
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 rounded-xl bg-[#c8a55c] px-5 py-2.5 text-sm font-semibold text-[#09090b] transition-all duration-300 hover:bg-[#b8933f] active:scale-[0.98]"
              >
                <Download className="h-4 w-4" strokeWidth={1.5} />
                Download
              </button>
            </div>
          </>
        ) : conversion.status === "failed" ? (
          <div className="py-16 text-center">
            <p className="text-base font-medium text-red-400">
              Conversion Failed
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              {conversion.error_message || "An unknown error occurred."}
            </p>
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-base font-medium text-[#c8a55c]">
              Still processing...
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              This conversion is not yet complete. Check back shortly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
