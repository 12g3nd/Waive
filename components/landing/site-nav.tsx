"use client";

import Link from "next/link";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { cn } from "@/lib/utils";

export function SiteNav() {
  const hidden = useScrollDirection();

  return (
    <nav
      className={cn(
        "fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/90 px-6 backdrop-blur-md transition-transform duration-300 sm:px-10",
        hidden ? "-translate-y-full" : "translate-y-0",
      )}
    >
      <Link href="/" className="font-display text-xl font-bold text-foreground">
        W<span className="ai-letters">ai</span>ve
      </Link>
      <div className="flex items-center gap-6">
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
        <Link
          href="/app"
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Open the tool →
        </Link>
      </div>
    </nav>
  );
}
