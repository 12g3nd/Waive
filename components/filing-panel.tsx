import {
  Banknote,
  Building2,
  CalendarClock,
  Globe,
  Mail,
  Phone,
  Printer,
  Send,
  type LucideIcon,
} from "lucide-react";
import type { FilingChannel, FilingGuide, ResolvedCitation } from "@/engine";
import { humanDate } from "@/engine/dates";
import { Card, CardContent } from "@/components/ui/card";
import { CitationChip } from "@/components/citation-chip";

const CHANNEL_ICON: Record<FilingChannel["method"], LucideIcon> = {
  online: Globe,
  mail: Mail,
  "in-person": Building2,
  fax: Printer,
  phone: Phone,
};

interface FilingPanelProps {
  filing: FilingGuide;
  /** The primary deadline, restated here so "how" and "by when" sit together. */
  deadline?: { label: string; dateISO: string };
  citations: ResolvedCitation[];
}

/**
 * "How to file this" — turns the deterministic filing guide into a clear, scannable
 * step: by when, where it goes, the ways to submit it, and the fee / fee-waiver reality.
 */
export function FilingPanel({ filing, deadline, citations }: FilingPanelProps) {
  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="flex items-center gap-2">
          <Send className="size-5 text-primary" />
          <h2 className="font-display text-xl font-semibold tracking-tight">How to file this</h2>
        </div>

        {deadline && (
          <div className="flex items-start gap-2.5 rounded-xl border border-urgent/30 bg-urgent/[0.07] p-3.5">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-urgent" />
            <p className="text-sm text-foreground/85">
              <span className="font-semibold">File by {humanDate(deadline.dateISO)}.</span>{" "}
              {deadline.label}.
            </p>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Where it goes
          </p>
          <p className="mt-1 text-sm text-foreground/90">{filing.whereToSend}</p>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ways to file
          </p>
          <ul className="space-y-3">
            {filing.channels.map((ch) => {
              const Icon = CHANNEL_ICON[ch.method];
              return (
                <li key={`${ch.method}-${ch.label}`} className="flex gap-3">
                  <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-semibold">{ch.label}</p>
                    <p className="text-sm text-foreground/80">{ch.detail}</p>
                    {ch.url && (
                      <a
                        href={ch.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block break-all text-xs font-medium text-primary underline-offset-2 hover:underline"
                      >
                        {ch.url.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-border bg-secondary/30 p-3.5">
          <Banknote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="space-y-0.5 text-sm">
            <p className="text-foreground/90">{filing.fee.summary}</p>
            {filing.fee.feeWaiver && <p className="text-foreground/70">{filing.fee.feeWaiver}</p>}
          </div>
        </div>

        {filing.citationId && <CitationChip id={filing.citationId} citations={citations} />}
      </CardContent>
    </Card>
  );
}
