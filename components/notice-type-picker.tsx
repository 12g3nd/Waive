"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import type { NoticeType } from "@/lib/notice-types";

interface NoticeTypePickerProps {
  types: NoticeType[];
  value: string; // the resolved packId
  onChange: (packId: string) => void;
  disabled?: boolean;
}

/** Which type does this packId belong to? */
function typeOf(types: NoticeType[], packId: string): NoticeType | undefined {
  return types.find(
    (t) => t.packId === packId || t.locations.some((l) => l.packId === packId),
  );
}

/**
 * Two-part notice selector: first the type (what happened), then — only when the
 * type spans jurisdictions — the location. The resolved value is always a packId.
 */
export function NoticeTypePicker({ types, value, onChange, disabled }: NoticeTypePickerProps) {
  const locationId = useId();
  if (types.length === 0) return null;

  const activeType = typeOf(types, value) ?? types[0]!;

  function selectType(t: NoticeType) {
    if (t.locations.length === 0 && t.packId) {
      onChange(t.packId);
      return;
    }
    const first = t.locations[0];
    if (first) onChange(first.packId);
  }

  return (
    <fieldset disabled={disabled} className="mb-4 space-y-3">
      <div className="space-y-2">
        <legend className="text-sm font-medium text-foreground">
          What kind of notice is this?
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {types.map((t) => {
            const active = t.domain === activeType.domain;
            return (
              <button
                key={t.domain}
                type="button"
                onClick={() => selectType(t)}
                aria-pressed={active}
                className={cn(
                  "rounded-xl border p-3 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeType.locations.length > 0 && (
        <div className="space-y-1.5">
          <label htmlFor={locationId} className="text-sm font-medium text-foreground">
            Where were you served?
          </label>
          <select
            id={locationId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {activeType.locations.map((l) => (
              <option key={l.packId} value={l.packId}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </fieldset>
  );
}
