import { describe, expect, it } from "vitest";
import { buildNoticeTypes } from "@/lib/notice-types";
import { buildRegistry } from "@/packs";

describe("notice types (drive the upload picker)", () => {
  it("offers SSA (no location) and debt (with jurisdictions)", () => {
    const types = buildNoticeTypes();
    expect(types.map((t) => t.domain).sort()).toEqual(["answer", "benefits"]);

    const benefits = types.find((t) => t.domain === "benefits")!;
    expect(benefits.packId).toBe("benefits");
    expect(benefits.locations).toHaveLength(0);

    const debt = types.find((t) => t.domain === "answer")!;
    expect(debt.locations.map((l) => l.packId).sort()).toEqual([
      "answer-bc",
      "answer-ca",
      "answer-on",
      "answer-qc",
    ]);
  });

  it("every selectable packId points to a registered pack", () => {
    const registry = buildRegistry();
    for (const t of buildNoticeTypes()) {
      const ids = t.packId ? [t.packId] : t.locations.map((l) => l.packId);
      for (const id of ids) expect(registry.get(id), `pack ${id} should exist`).toBeTruthy();
    }
  });

  it("each type carries 'common things to notice' tips", () => {
    for (const t of buildNoticeTypes()) {
      expect(t.tips.length).toBeGreaterThan(0);
    }
  });
});
