"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
 * Lets the person choose which AI reads their notice — the real engine name, what each
 * is good for, and a learn-more link (privacy notice / set-up guide). Every option is
 * shown so people can see the trade-offs, but ones that aren't reachable right now are
 * dimmed and can't be selected. The list is empty only in a forced-offline deploy, where
 * there's nothing to choose — then the picker hides so the UI stays clean.
 */
export function ModelPicker({ options, value, onChange, disabled }: ModelPickerProps) {
  if (options.length === 0) return null;

  return (
    <fieldset disabled={disabled} className="mb-6 space-y-2">
      <legend className="text-sm font-medium text-foreground">Select Model:</legend>
      <p className="text-xs text-muted-foreground">All free to use — Waive provides the APIs.</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {options.map((o) => {
          const active = o.id === value;
          return (
            <div
              key={o.id}
              className={cn(
                "relative flex flex-col rounded-xl border transition-colors",
                active
                  ? "border-primary bg-primary/10"
                  : o.available
                    ? "border-border bg-card hover:border-primary/50"
                    : "border-border/60 bg-card/40",
              )}
            >
              <button
                type="button"
                onClick={() => onChange(o.id)}
                aria-pressed={active}
                disabled={!o.available}
                className={cn(
                  "flex-1 rounded-xl p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  !o.available && "cursor-not-allowed",
                )}
              >
                <span
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-semibold",
                    active
                      ? "text-foreground"
                      : o.available
                        ? "text-muted-foreground"
                        : "text-muted-foreground/60",
                  )}
                >
                  {o.label}
                  {o.id === "ollama" && (
                    <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-primary">
                      Default
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "mt-0.5 block text-xs leading-snug",
                    o.available ? "text-muted-foreground" : "text-muted-foreground/55",
                  )}
                >
                  {o.description}
                </span>
                {!o.available && o.unavailableHint && (
                  <span className="mt-1.5 block text-[0.7rem] font-medium text-warn/90">
                    {o.unavailableHint}
                  </span>
                )}
              </button>
              {o.link && (
                <Link
                  href={o.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mx-3 mb-2.5 inline-flex w-fit items-center gap-0.5 rounded text-[0.7rem] font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {o.link.label}
                  <ArrowUpRight className="size-3" aria-hidden />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
