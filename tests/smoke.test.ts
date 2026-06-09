import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("scaffold smoke test", () => {
  it("the test runner and @/ alias both work", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
});
