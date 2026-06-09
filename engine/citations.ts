import type {
  CitationEntry,
  CitationReference,
  CitationResolver,
  ResolvedCitation,
} from "./types";

/** A citation is "verified" only if its officialCitation is not a TODO placeholder. */
export function isVerified(officialCitation: string): boolean {
  return !officialCitation.trim().toUpperCase().startsWith("TODO_CITATION");
}

/** Normalize a raw corpus record into a CitationEntry (derives `verified`). */
export function toCitationEntry(raw: Omit<CitationEntry, "verified">): CitationEntry {
  return { ...raw, verified: isVerified(raw.officialCitation) };
}

/**
 * In-memory citation store. The engine maps deterministic rule outputs to corpus
 * ids; this resolves those ids to displayable entries. No vector search is used for
 * legal claims — the mapping is exact, by id.
 */
export class InMemoryCitationResolver implements CitationResolver {
  private readonly entries = new Map<string, CitationEntry>();

  constructor(entries: ReadonlyArray<Omit<CitationEntry, "verified"> | CitationEntry>) {
    for (const e of entries) {
      const entry: CitationEntry =
        "verified" in e ? e : toCitationEntry(e);
      this.entries.set(entry.id, entry);
    }
  }

  has(id: string): boolean {
    return this.entries.has(id);
  }

  resolve(id: string): CitationEntry | undefined {
    return this.entries.get(id);
  }

  /**
   * Resolve a list of (possibly duplicated) citation references into unique
   * entries, recording every context each one was used in. Unknown ids are
   * surfaced as an explicit unresolved entry rather than silently dropped — a
   * missing citation is a bug we want to see, never a fabricated one.
   */
  resolveReferences(refs: ReadonlyArray<CitationReference>): ResolvedCitation[] {
    const byId = new Map<string, ResolvedCitation>();
    for (const ref of refs) {
      if (!ref.id) continue;
      const existing = byId.get(ref.id);
      if (existing) {
        if (!existing.usedFor.includes(ref.usedFor)) existing.usedFor.push(ref.usedFor);
        continue;
      }
      const entry = this.entries.get(ref.id);
      if (entry) {
        byId.set(ref.id, { ...entry, usedFor: [ref.usedFor] });
      } else {
        byId.set(ref.id, {
          id: ref.id,
          domain: "unknown",
          topic: "Unresolved citation",
          summary:
            "This citation id was referenced by a rule but is not present in the corpus. This is a build error to fix — it is never shown as a real legal source.",
          officialCitation: "TODO_CITATION (unresolved id)",
          sourceTitle: "(unresolved)",
          sourceUrl: "",
          verified: false,
          usedFor: [ref.usedFor],
        });
      }
    }
    return [...byId.values()];
  }

  list(): CitationEntry[] {
    return [...this.entries.values()];
  }
}
