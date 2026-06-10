import type { ComponentType, ReactNode } from "react";
import {
  BookMarked,
  CalendarClock,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Signpost,
  Workflow,
} from "lucide-react";
import type { PipelineResult } from "@/engine";
import { humanDate } from "@/engine/dates";
import { formatMoney } from "@/engine/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CitationChip } from "@/components/citation-chip";
import { cn } from "@/lib/utils";

type Actor = "model" | "code";

const ACTOR_STYLE: Record<Actor, { bubble: string; tag: string }> = {
  // The model only *reads* — amber, to set it apart from the green decisions.
  model: {
    bubble: "border-highlight/40 bg-highlight/20 text-highlight-foreground",
    tag: "text-highlight-foreground/80",
  },
  // Everything load-bearing is deterministic code — the emerald "relief" colour.
  code: {
    bubble: "border-primary/30 bg-primary/10 text-primary",
    tag: "text-primary",
  },
};

interface StepShellProps {
  icon: ComponentType<{ className?: string }>;
  actor: Actor;
  actorLabel: string;
  title: string;
  last?: boolean;
  children: ReactNode;
}

function Step({ icon: Icon, actor, actorLabel, title, last, children }: StepShellProps) {
  const style = ACTOR_STYLE[actor];
  return (
    <li className="flex gap-4">
      <div className="flex flex-col items-center">
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-full border", style.bubble)}>
          <Icon className="size-4" />
        </span>
        {!last && <span aria-hidden className="mt-1 w-px flex-1 bg-border" />}
      </div>
      <div className={cn("min-w-0 flex-1", last ? "pb-0" : "pb-7")}>
        <p className={cn("font-mono text-[10px] font-semibold uppercase tracking-[0.18em]", style.tag)}>
          {actorLabel}
        </p>
        <h3 className="mt-0.5 font-display text-base font-semibold tracking-tight">{title}</h3>
        <div className="mt-2 space-y-2 text-sm text-foreground/80">{children}</div>
      </div>
    </li>
  );
}

interface DecisionTraceProps {
  result: PipelineResult;
}

/**
 * The deterministic pipeline, made visible. This is the project's core claim
 * rendered as UI rather than prose: the model only reads the notice into fields;
 * every number, route, and catch below is computed by tested code and carries a
 * real citation. "Show your work" promoted to a first-class, auditable panel.
 */
export function DecisionTrace({ result }: DecisionTraceProps) {
  const { extraction: e, deadlines, remedy, presumptions, citations, confidence, usedModel } =
    result;
  const anchorDate = e.noticeDate ?? e.serviceOrReceiptDate;
  const verifiedCount = citations.filter((c) => c.verified).length;
  const hasCatches = presumptions.catches.length > 0;

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="flex items-start gap-2.5">
          <Workflow className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">
              How Waive reached this
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The model only reads your notice into fields. Every deadline, route, and catch below
              is computed by tested code and traces to a real source — nothing here is guessed.
            </p>
          </div>
        </div>

        <ol className="pl-0.5">
          {/* 1 — the only step the model touches. */}
          <Step
            icon={ScanLine}
            actor="model"
            actorLabel={usedModel ? "AI · reads" : "Input · read"}
            title="Read your notice into fields"
          >
            <p>
              {usedModel
                ? "A local AI model turned the letter into structured fields. It never decides your outcome."
                : "Structured fields from this sample — no model needed to run everything below."}
            </p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg border border-border bg-secondary/30 p-3 text-xs">
              <Fact label="From" value={e.issuer} />
              <Fact label="Type" value={e.claimType} />
              <Fact
                label="Amount"
                value={e.amount !== null ? formatMoney(e.amount, e.currency) : "—"}
              />
              <Fact label="Dated" value={anchorDate ? humanDate(anchorDate) : "—"} />
            </dl>
          </Step>

          {/* 2 — deterministic date math, golden-tested, shows its work. */}
          <Step
            icon={CalendarClock}
            actor="code"
            actorLabel="Code · computes"
            title="Computed your deadline"
          >
            <ul className="space-y-2.5">
              {deadlines.deadlines.map((d) => (
                <li key={d.id} className="space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold">
                      {d.label}
                      {d.id === deadlines.primaryDeadlineId && (
                        <Badge variant="primary" className="ml-2 align-middle">
                          your clock
                        </Badge>
                      )}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {humanDate(d.dateISO)}
                    </span>
                  </div>
                  <p className="rounded-md bg-secondary/40 p-2 font-mono text-[0.72rem] leading-relaxed text-foreground/75">
                    {d.rule}
                  </p>
                  <CitationChip id={d.citationId} citations={citations} />
                </li>
              ))}
            </ul>
          </Step>

          {/* 3 — deterministic routing through the decision tree. */}
          <Step
            icon={Signpost}
            actor="code"
            actorLabel="Code · routes"
            title="Routed your remedy"
            last={!hasCatches}
          >
            <div className="rounded-lg border border-primary/25 bg-primary/[0.06] p-3">
              <p className="font-semibold leading-snug">{remedy.selected.label}</p>
              <p className="mt-1 text-sm text-foreground/80">{remedy.selected.why}</p>
              <div className="mt-2">
                <CitationChip id={remedy.selected.citationId} citations={citations} />
              </div>
            </div>
            {remedy.integrityNote && (
              <div className="flex gap-2.5 rounded-lg border border-warn/40 bg-warn/10 p-3">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warn" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-warn">
                    Integrity check
                  </p>
                  <p className="mt-0.5 text-sm text-foreground/80">{remedy.integrityNote}</p>
                </div>
              </div>
            )}
          </Step>

          {/* 4 — the auto-qualifying catches, only when there are any. */}
          {hasCatches && (
            <Step
              icon={ShieldCheck}
              actor="code"
              actorLabel="Code · checks"
              title="Checked the catches"
              last
            >
              <ul className="space-y-2">
                {presumptions.catches.map((c) => (
                  <li key={c.id} className="rounded-lg border border-border bg-secondary/30 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{c.headline}</span>
                      <Badge variant={c.strength === "automatic" ? "safe" : "neutral"}>
                        {c.strength}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-foreground/75">{c.explanation}</p>
                    <div className="mt-2">
                      <CitationChip id={c.citationId} citations={citations} />
                    </div>
                  </li>
                ))}
              </ul>
            </Step>
          )}
        </ol>

        {/* Provenance footer: the law behind it, and any human-review escalation. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-sm">
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground/80">
            <BookMarked className="size-4 text-primary" />
            {verifiedCount} of {citations.length} sources verified
          </span>
          {confidence.escalate && (
            <span className="text-muted-foreground">
              · Low-confidence read — flagged for a legal-aid clinic to review.
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium text-foreground/90" title={value}>
        {value}
      </dd>
    </div>
  );
}
