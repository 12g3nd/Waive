"use client";

import { useId } from "react";
import { Info } from "lucide-react";
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

/** Info icon revealing "common things to notice" on hover or keyboard focus. */
function NoticeTips({ tips }: { tips: string[] }) {
  if (tips.length === 0) return null;
  return (
    <span className="group/tip relative shrink-0">
      <button
        type="button"
        aria-label="Common things to notice"
        className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Info className="size-4" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 top-8 z-20 w-64 rounded-lg border border-border bg-card p-3 text-left text-xs leading-relaxed text-foreground/80 opacity-0 shadow-lg transition-opacity duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
      >
        <span className="mb-1.5 block font-semibold text-foreground">Common things to notice</span>
        <ul className="list-disc space-y-1 pl-4">
          {tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </span>
    </span>
  );
}

/**
 * Two-part notice selector: first the type (what happened), then — only when the
 * type spans jurisdictions — the location. Each type carries a hover tip of common
 * things to look for. The resolved value is always a packId.
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
              <div
                key={t.domain}
                className={cn(
                  "relative flex items-start gap-1 rounded-xl border pr-1 transition-colors",
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/50",
                )}
              >
                <button
                  type="button"
                  onClick={() => selectType(t)}
                  aria-pressed={active}
                  className={cn(
                    "flex-1 rounded-xl p-3 text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                </button>
                <div className="pt-1.5">
                  <NoticeTips tips={t.tips} />
                </div>
              </div>
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
