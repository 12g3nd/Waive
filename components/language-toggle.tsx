"use client";

import { cn } from "@/lib/utils";

const LANGS = [
  { code: "en", label: "EN", full: "English" },
  { code: "es", label: "ES", full: "Español" },
  { code: "fr", label: "FR", full: "Français" },
] as const;

interface LanguageToggleProps {
  value: string;
  onChange: (lang: string) => void;
  disabled?: boolean;
}

export function LanguageToggle({ value, onChange, disabled }: LanguageToggleProps) {
  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center rounded-full border border-border bg-card p-0.5"
    >
      {LANGS.map((l) => {
        const active = value === l.code;
        return (
          <button
            key={l.code}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            title={l.full}
            onClick={() => onChange(l.code)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
              active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
