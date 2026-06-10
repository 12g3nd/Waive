import { cn } from "@/lib/utils";

interface WordmarkProps {
  className?: string;
  /** "ink" for light backgrounds (nav, app); "light" for the dark footer. */
  tone?: "ink" | "light";
}

/**
 * The Waive wordmark. A highlighter sweep catches the "ai" hidden inside the
 * name — the product's core gesture (the highlighter that surfaces the remedy
 * buried in a notice), turned on its own logo. Place inside a `group` element
 * to get the hover flourish.
 */
export function Wordmark({ className, tone = "ink" }: WordmarkProps) {
  return (
    <span
      className={cn(
        "relative inline-flex select-none items-baseline font-display font-bold tracking-tight",
        tone === "light" ? "text-primary-foreground" : "text-foreground",
        className,
      )}
    >
      W
      <span className="relative mx-[0.015em] inline-block">
        {/* Hand-drawn highlighter swipe behind the "ai" — sits low like a real
            marker pass, canted a touch, and leans further on hover. */}
        <span
          aria-hidden
          className="absolute inset-x-[-0.12em] bottom-[0.05em] top-[0.22em] z-0 -rotate-2 rounded-[0.12em] bg-highlight shadow-[0_1px_0_hsl(var(--highlight)/0.6)] transition-transform duration-300 ease-out group-hover:-rotate-[3.5deg] group-hover:scale-x-[1.08]"
        />
        <span className="relative z-10 text-highlight-foreground">ai</span>
      </span>
      ve
    </span>
  );
}
