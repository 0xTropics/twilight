"use client";

import { Download, RotateCcw } from "lucide-react";
import BeforeAfterSlider from "./BeforeAfterSlider";

interface ConversionResultProps {
  originalUrl: string;
  resultUrl: string;
  processingTimeMs: number;
  creditsRemaining: number;
  originalFilename?: string;
  onConvertAnother: () => void;
}

export default function ConversionResult({
  originalUrl,
  resultUrl,
  processingTimeMs,
  creditsRemaining,
  originalFilename,
  onConvertAnother,
}: ConversionResultProps) {
  async function handleDownload() {
    const response = await fetch(resultUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const baseName = originalFilename
      ? `twilight-${originalFilename.replace(/\.[^.]+$/, "")}.png`
      : "twilight-result.png";
    a.download = baseName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <BeforeAfterSlider beforeUrl={originalUrl} afterUrl={resultUrl} />

      <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
        <span>Processed in {(processingTimeMs / 1000).toFixed(1)}s</span>
        <span>{creditsRemaining} credits remaining</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#c8a55c] px-4 py-3.5 text-sm font-semibold text-[#09090b] transition-all duration-300 hover:bg-[#b8933f] active:scale-[0.98]"
        >
          <Download className="h-4 w-4" strokeWidth={1.5} />
          Download Result
        </button>
        <button
          onClick={onConvertAnother}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3.5 text-sm font-semibold text-zinc-300 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.06] hover:text-foreground active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
          Convert Another
        </button>
      </div>
    </div>
  );
}
