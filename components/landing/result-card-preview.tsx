export function ResultCardPreview() {
  return (
    <div
      className="relative animate-fade-up rounded-2xl border border-border bg-card shadow-xl"
      style={{ animationDelay: "150ms" }}
    >
      <span className="absolute -top-3 left-4 rounded-full bg-primary px-3 py-0.5 font-sans text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
        Decoded Notice
      </span>

      <div className="p-5">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border-[3px] border-urgent font-mono text-urgent">
            <span className="text-lg font-bold leading-none">8</span>
            <span className="text-[10px] font-medium">days</span>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">SSA Overpayment Notice</p>
            <p className="text-xs text-muted-foreground">Social Security Administration</p>
            <p className="font-mono text-xs font-semibold text-urgent">Claimed: $1,240.00</p>
          </div>
        </div>

        {/* Remedy */}
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-safe/30 bg-safe/10 px-3 py-2">
          <span className="font-bold text-safe">✓</span>
          <div>
            <p className="text-xs font-bold text-safe">Remedy found: Waiver</p>
            <p className="text-[11px] text-muted-foreground">Fault not required, SSA error likely</p>
          </div>
        </div>

        {/* Presumption */}
        <div className="mb-3 rounded-r-md border-l-2 border-highlight bg-highlight/10 py-1.5 pl-3 pr-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-highlight-foreground/70">
            ⚡ Presumption fires
          </p>
          <p className="text-xs text-highlight-foreground/80">
            Overpayment occurred while SSA had all the facts, shifts burden back
          </p>
        </div>

        {/* Draft */}
        <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
          <div className="flex h-6 w-8 shrink-0 items-center justify-center rounded bg-primary font-mono text-[9px] font-bold text-primary-foreground">
            SSA
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">SSA-632 draft ready</p>
            <p className="text-[11px] text-muted-foreground">Copy to clipboard · 3-section filing</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-safe" />
          Deadlines computed by tested code · sources cited
        </div>
      </div>
    </div>
  );
}
