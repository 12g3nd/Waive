import type {
  IntakeQuestion,
  NoticeExtraction,
  NoticeSource,
  PipelineResult,
  UserFacts,
} from "@/engine";
import type { LlmStatus } from "@/lib/llm";

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

/** A selectable rule pack for the "what kind of notice is this?" upload picker. */
export interface PackOption {
  id: string;
  displayName: string;
  jurisdiction?: string;
}

export type AnalyzeSource =
  | NoticeSource
  | { kind: "extraction"; extraction: NoticeExtraction };

export type AnalyzeRequest =
  | { mode: "sample"; sampleId: string; language?: string }
  | {
      mode: "notice";
      packId: string;
      userFacts: UserFacts;
      language?: string;
      source: AnalyzeSource;
    };

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
