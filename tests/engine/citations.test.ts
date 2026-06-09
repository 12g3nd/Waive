import { describe, expect, it } from "vitest";
import { InMemoryCitationResolver, isVerified } from "@/engine";
import { fakeCorpus } from "./fixtures";

describe("citation verification", () => {
  it("flags TODO_CITATION placeholders as unverified", () => {
    expect(isVerified("POMS GN 02250.005")).toBe(true);
    expect(isVerified("TODO_CITATION (pending)")).toBe(false);
    expect(isVerified("  todo_citation lowercase ")).toBe(false);
  });
});

describe("InMemoryCitationResolver", () => {
  const resolver = new InMemoryCitationResolver(fakeCorpus);

  it("derives the verified flag from the citation text", () => {
    expect(resolver.resolve("fake-deadline")?.verified).toBe(true);
    expect(resolver.resolve("fake-unverified")?.verified).toBe(false);
  });

  it("resolves references and records each usage context, de-duplicated", () => {
    const resolved = resolver.resolveReferences([
      { id: "fake-remedy", usedFor: "Routed remedy" },
      { id: "fake-remedy", usedFor: "Also cited here" },
      { id: "fake-remedy", usedFor: "Routed remedy" }, // duplicate context
    ]);
    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.usedFor).toEqual(["Routed remedy", "Also cited here"]);
  });

  it("never silently drops an unknown id — surfaces it as unresolved+unverified", () => {
    const resolved = resolver.resolveReferences([
      { id: "ghost", usedFor: "Some rule" },
    ]);
    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.verified).toBe(false);
    expect(resolved[0]?.topic).toMatch(/unresolved/i);
  });
});
