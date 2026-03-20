"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png"];

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
}

export default function UploadZone({ onFileSelected }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Invalid file type. Only JPG and PNG are accepted.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File too large. Maximum size is 20MB.";
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const err = validate(file);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      onFileSelected(file);
    },
    [validate, onFileSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-20 transition-all duration-500 ${
          dragOver
            ? "border-[#c8a55c]/40 bg-[#c8a55c]/5"
            : "border-white/[0.08] bg-white/[0.02] hover:border-[#c8a55c]/20 hover:bg-white/[0.04]"
        }`}
      >
        <div className="mb-5 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-4">
          <UploadCloud className="h-8 w-8 text-zinc-500" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium text-zinc-300">
          Drag and drop your photo here
        </p>
        <p className="mt-1.5 text-xs text-zinc-600">or click to browse</p>
        <p className="mt-5 text-xs uppercase tracking-widest text-zinc-700">
          JPG, PNG &mdash; Max 20MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
      {error && (
        <p className="mt-3 text-center text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
