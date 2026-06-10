"use client";

import { cn } from "@/lib/utils";
import type { PackOption } from "@/lib/api-types";

interface NoticeTypePickerProps {
  options: PackOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

/**
 * Asks which kind of notice an upload is, so it routes to the right rule pack
 * instead of silently assuming one. Hidden until more than one pack is available.
 */
export function NoticeTypePicker({ options, value, onChange, disabled }: NoticeTypePickerProps) {
  if (options.length <= 1) return null;

  return (
    <fieldset disabled={disabled} className="mb-4 space-y-2">
      <legend className="text-sm font-medium text-foreground">What kind of notice is this?</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {o.displayName}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
