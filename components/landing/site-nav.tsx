"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { Wordmark } from "@/components/wordmark";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function SiteNav() {
  const hidden = useScrollDirection();

  return (
    <nav
      className={cn(
        "fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md transition-transform duration-300",
        hidden ? "-translate-y-full" : "translate-y-0",
      )}
    >
      {/* Highlighter hairline — the legal-pad rule that brands every page. */}
      <div aria-hidden className="h-0.5 bg-highlight" />
      <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-6 sm:px-10">
        <Link href="/" className="group" aria-label="Waive home">
          <Wordmark className="text-xl" />
        </Link>
        <div className="flex items-center gap-7">
          <a
            href="#how"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            How it works
          </a>
          <a
            href="#try"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            See an example
          </a>
          <ThemeToggle />
          <Link
            href="/app"
            className="group inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110"
          >
            Open the tool
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
