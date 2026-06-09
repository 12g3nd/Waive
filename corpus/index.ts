import { InMemoryCitationResolver, type CitationEntry } from "@/engine";
import benefits from "./benefits.json";
import answer from "./answer.json";

type RawCitation = Omit<CitationEntry, "verified">;

/**
 * All citation corpora, combined. Each pack's rules reference entries here by id;
 * the engine resolves them exactly (no vector guessing for legal claims). Add a
 * pack by importing its JSON and spreading it in.
 */
export const allCitations: RawCitation[] = [
  ...(benefits as RawCitation[]),
  ...(answer as RawCitation[]),
];

/** Build a fresh resolver over the full corpus. */
export function buildCorpusResolver(): InMemoryCitationResolver {
  return new InMemoryCitationResolver(allCitations);
}

/** Shared singleton resolver for the app. */
export const corpus = buildCorpusResolver();
