"use client";

import { cn } from "@/lib/utils";
import type { ProviderOption } from "@/lib/api-types";
import type { LlmProvider } from "@/lib/llm";

interface ModelPickerProps {
  options: ProviderOption[];
  value: LlmProvider | undefined;
  onChange: (id: LlmProvider) => void;
  disabled?: boolean;
}

/**
 * Lets the person choose which AI reads their notice — showing the real model name
 * and what each is good for. Hidden when there's only one available engine (nothing
 * to choose between), so the UI stays clean.
 */
export function ModelPicker({ options, value, onChange, disabled }: ModelPickerProps) {
  const available = options.filter((o) => o.available);
  if (available.length < 2) return null;

  return (
    <fieldset disabled={disabled} className="mb-6 space-y-2">
      <legend className="text-sm font-medium text-foreground">Select Model:</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {available.map((o) => {
          const active = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              aria-pressed={active}
              className={cn(
                "rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                active
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50",
              )}
            >
              <span
                className={cn(
                  "block text-sm font-semibold",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {o.label}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                {o.description}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
