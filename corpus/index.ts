import { InMemoryCitationResolver, type CitationEntry } from "@/engine";
import benefits from "./benefits.json";

type RawCitation = Omit<CitationEntry, "verified">;

/**
 * All citation corpora, combined. Each pack's rules reference entries here by id;
 * the engine resolves them exactly (no vector guessing for legal claims). Add a
 * pack by importing its JSON and spreading it in — the `answer` pack joins here in
 * Phase 6.
 */
export const allCitations: RawCitation[] = [...(benefits as RawCitation[])];

/** Build a fresh resolver over the full corpus. */
export function buildCorpusResolver(): InMemoryCitationResolver {
  return new InMemoryCitationResolver(allCitations);
}

/** Shared singleton resolver for the app. */
export const corpus = buildCorpusResolver();
