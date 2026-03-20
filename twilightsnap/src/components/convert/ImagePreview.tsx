"use client";

import { useMemo } from "react";
import { X } from "lucide-react";

interface ImagePreviewProps {
  file: File;
  onRemove: () => void;
  onConvert: () => void;
  disabled?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImagePreview({
  file,
  onRemove,
  onConvert,
  disabled,
}: ImagePreviewProps) {
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="relative overflow-hidden rounded-xl bg-white/[0.02]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="Preview"
          className="max-h-[400px] w-full object-contain"
        />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">{file.name}</p>
          <p className="mt-0.5 text-xs text-zinc-600">{formatSize(file.size)}</p>
        </div>
        <button
          onClick={onRemove}
          disabled={disabled}
          className="flex items-center gap-1.5 text-sm text-zinc-500 transition-colors duration-300 hover:text-foreground disabled:opacity-40"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          Remove
        </button>
      </div>
      <button
        onClick={onConvert}
        disabled={disabled}
        className="mt-5 w-full rounded-xl bg-[#c8a55c] px-4 py-3.5 text-sm font-semibold text-[#09090b] transition-all duration-300 hover:bg-[#b8933f] active:scale-[0.99] disabled:opacity-40"
      >
        Convert to Twilight
      </button>
    </div>
  );
}
