import { describe, expect, it } from "vitest";
import { buildRegistry } from "@/packs";

/**
 * The "what kind of notice is this?" upload picker is built from the registered
 * packs, so guard that they're all present with usable labels.
 */
describe("pack registry (drives the upload notice-type picker)", () => {
  it("registers the benefits pack and all three debt jurisdictions", () => {
    const ids = buildRegistry()
      .list()
      .map((p) => p.id)
      .sort();
    expect(ids).toEqual(["answer-bc", "answer-ca", "answer-on", "benefits"]);
  });

  it("every pack exposes a human-readable display name (not the raw id)", () => {
    for (const p of buildRegistry().list()) {
      expect(p.displayName.length).toBeGreaterThan(0);
      expect(p.displayName).not.toBe(p.id);
    }
  });
});
