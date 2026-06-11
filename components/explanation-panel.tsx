import { FileText, AlertTriangle, ArrowRight } from "lucide-react";
import type { PlainLanguageExplanation } from "@/engine";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReadAloudButton } from "@/components/read-aloud-button";

interface ExplanationPanelProps {
  explanation: PlainLanguageExplanation;
  /** Friendly name of the engine that rephrased this (shown when a model ran). */
  engine: string;
}

export function ExplanationPanel({ explanation, engine }: ExplanationPanelProps) {
  const rows = [
    { icon: FileText, label: "What this is", text: explanation.whatThisIs, tone: "text-foreground" },
    {
      icon: AlertTriangle,
      label: "What happens if you do nothing",
      text: explanation.whatHappensIfIgnored,
      tone: "text-urgent",
    },
    { icon: ArrowRight, label: "What to do now", text: explanation.whatToDoNow, tone: "text-primary" },
  ];
  const fullText = rows.map((r) => `${r.label}. ${r.text}`).join(" ");

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-xl font-semibold tracking-tight">In plain language</h2>
          <div className="flex items-center gap-2">
            <Badge variant={explanation.source === "llm" ? "primary" : "outline"}>
              {explanation.source === "llm" ? engine : "plain text"}
            </Badge>
            <ReadAloudButton text={fullText} language={explanation.language} />
          </div>
        </div>
        <dl className="space-y-4">
          {rows.map((r) => (
            <div key={r.label} className="flex gap-3">
              <r.icon className={`mt-0.5 size-5 shrink-0 ${r.tone}`} />
              <div className="space-y-0.5">
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {r.label}
                </dt>
                <dd className="text-[0.95rem] leading-relaxed text-foreground/90">{r.text}</dd>
              </div>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
