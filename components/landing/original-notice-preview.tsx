/**
 * The "before": a dense, desaturated official notice — the dread Waive transforms.
 * Pairs with ResultCardPreview ("after") to tell the hero's story in one glance.
 * Pure decoration, so it's aria-hidden.
 */
export function OriginalNoticePreview() {
  return (
    <div
      aria-hidden
      className="relative rounded-xl border border-border bg-card/95 p-4 shadow-[0_10px_30px_-18px_rgba(20,20,30,0.4)]"
    >
      {/* Faux letterhead */}
      <div className="mb-3 flex items-center justify-between border-b border-dashed border-border pb-2">
        <div className="flex items-center gap-2">
          <div className="size-6 shrink-0 rounded-full border border-muted-foreground/40 bg-muted" />
          <div className="leading-tight">
            <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Social Security Admin.
            </p>
            <p className="font-mono text-[7px] uppercase tracking-wider text-muted-foreground/60">
              Notice of Overpayment
            </p>
          </div>
        </div>
        <p className="font-mono text-[7px] text-muted-foreground/50">OP-44821</p>
      </div>

      {/* Dense legalese — illegible grey bars, the wall of text people freeze at */}
      <div className="space-y-[5px]">
        <div className="h-1.5 w-2/3 rounded-full bg-muted-foreground/20" />
        <div className="h-1.5 w-full rounded-full bg-muted-foreground/12" />
        <div className="h-1.5 w-full rounded-full bg-muted-foreground/12" />
        <div className="h-1.5 w-5/6 rounded-full bg-muted-foreground/12" />

        <div className="flex items-baseline gap-2 py-1.5">
          <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground/70">
            Amount due
          </span>
          <span className="font-mono text-sm font-bold text-foreground/70 line-through decoration-muted-foreground/30">
            $1,240.00
          </span>
        </div>

        <div className="h-1.5 w-full rounded-full bg-muted-foreground/12" />
        <div className="h-1.5 w-11/12 rounded-full bg-muted-foreground/12" />
        <div className="h-1.5 w-full rounded-full bg-muted-foreground/12" />
        <div className="h-1.5 w-3/4 rounded-full bg-muted-foreground/12" />

        {/* Second paragraph — the part with the buried deadline */}
        <div className="pt-1.5" />
        <div className="h-1.5 w-1/2 rounded-full bg-muted-foreground/20" />
        <div className="h-1.5 w-full rounded-full bg-muted-foreground/12" />
        <div className="h-1.5 w-full rounded-full bg-muted-foreground/12" />
        <div className="h-1.5 w-2/3 rounded-full bg-muted-foreground/12" />
      </div>

      {/* Signature block */}
      <div className="mt-4 flex items-end justify-between border-t border-dashed border-border pt-3">
        <div className="space-y-1">
          <div className="h-4 w-20 -rotate-3 rounded-sm bg-muted-foreground/15" />
          <div className="h-1 w-16 rounded-full bg-muted-foreground/15" />
        </div>
        <div className="size-9 rounded-full border border-dashed border-muted-foreground/25" />
      </div>

      {/* The dread, stamped */}
      <span className="stamp absolute right-3 top-9 -rotate-[9deg] text-urgent opacity-90">
        Response required
      </span>
    </div>
  );
}
