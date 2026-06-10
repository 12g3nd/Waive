import { cn } from "@/lib/utils";

interface WordmarkProps {
  className?: string;
  /** "ink" for light backgrounds (nav, app); "light" for the dark footer. */
  tone?: "ink" | "light";
}

/**
 * The Waive wordmark — the "ai" hidden in the name picked out in a gradient,
 * signaling AI authorship without shouting. Adapts to the active theme via the
 * --primary token.
 */
export function Wordmark({ className, tone = "ink" }: WordmarkProps) {
  return (
    <span
      className={cn(
        "font-display font-bold tracking-tight",
        tone === "light" ? "text-primary-foreground" : "text-foreground",
        className,
      )}
    >
      W<span className="ai-letters">ai</span>ve
    </span>
  );
}
