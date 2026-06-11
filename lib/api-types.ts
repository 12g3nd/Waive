import type {
  IntakeQuestion,
  NoticeExtraction,
  NoticeSource,
  PipelineResult,
  UserFacts,
} from "@/engine";
import type { LlmStatus, LlmProvider } from "@/lib/llm";

/** What the sample board renders (no precomputed extraction leaks to the client). */
export interface SampleCard {
  id: string;
  packId: string;
  title: string;
  blurb: string;
  badge: string;
  tone: "primary" | "urgent" | "highlight";
  imagePath?: string;
}

export type AnalyzeSource =
  | NoticeSource
  | { kind: "extraction"; extraction: NoticeExtraction };

export type AnalyzeRequest =
  | { mode: "sample"; sampleId: string; language?: string; provider?: LlmProvider }
  | {
      mode: "notice";
      packId: string;
      userFacts: UserFacts;
      language?: string;
      source: AnalyzeSource;
      provider?: LlmProvider;
    };

/** A selectable AI engine for the model picker. */
export interface ProviderOption {
  id: LlmProvider;
  label: string; // the real model, e.g. "Claude Haiku 4.5"
  description: string; // what it's good for
  available: boolean; // configured/reachable right now
}

export interface AnalyzeOk {
  ok: true;
  result: PipelineResult;
  llm: LlmStatus;
  /** The active pack's intake questions, so the UI can offer to refine an upload. */
  intake: IntakeQuestion[];
}

export interface AnalyzeErr {
  ok: false;
  code: string;
  error: string;
}

export type AnalyzeResponse = AnalyzeOk | AnalyzeErr;

/** A trimmed source the "Ask about your notice" feature grounds its answer in. */
export interface AskSource {
  topic: string;
  summary: string;
  cite: string; // official citation
}
