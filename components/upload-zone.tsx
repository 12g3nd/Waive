"use client";

import { useRef, useState } from "react";
import { ImageUp, FileUp, Loader2 } from "lucide-react";
import type { NoticeSource } from "@/engine";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onSelect: (source: NoticeSource) => void;
  busy?: boolean;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function UploadZone({ onSelect, busy }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    const isPdf = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");
    if (!isPdf && !isImage) {
      setError("Please upload an image (JPG/PNG) or a PDF.");
      return;
    }
    const dataBase64 = await fileToBase64(file);
    if (isPdf) {
      onSelect({ kind: "pdf", dataBase64, filename: file.name });
    } else {
      onSelect({ kind: "image", mediaType: file.type, dataBase64, filename: file.name });
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFile(e.dataTransfer.files[0]);
        }}
        className={cn(
          "group relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed bg-card/60 px-6 py-12 text-center transition-colors",
          dragging ? "border-primary bg-primary/[0.06]" : "border-border hover:border-primary/50",
        )}
      >
        {/* Crop marks: the corners of the document you're about to scan in. */}
        <span aria-hidden className="absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-muted-foreground/30 transition-colors group-hover:border-primary/50" />
        <span aria-hidden className="absolute right-3 top-3 h-4 w-4 border-r-2 border-t-2 border-muted-foreground/30 transition-colors group-hover:border-primary/50" />
        <span aria-hidden className="absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-muted-foreground/30 transition-colors group-hover:border-primary/50" />
        <span aria-hidden className="absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-muted-foreground/30 transition-colors group-hover:border-primary/50" />
        <div className="grid size-14 place-items-center rounded-full bg-primary/12 text-primary">
          {busy ? <Loader2 className="size-6 animate-spin" /> : <ImageUp className="size-6" />}
        </div>
        <div className="space-y-1">
          <p className="font-display text-lg font-semibold">Drop your notice here</p>
          <p className="text-sm text-muted-foreground">
            A photo or PDF of the letter. It’s read locally — nothing leaves your machine without a
            model you control.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="primary" onClick={() => inputRef.current?.click()} disabled={busy}>
            <FileUp /> Choose a file
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          aria-label="Upload a notice (image or PDF)"
          className="sr-only"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
      </div>
      {error && <p className="mt-2 text-sm text-urgent">{error}</p>}
    </div>
  );
}
