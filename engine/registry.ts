import type { PackLookup, RulePack } from "./types";

export class UnknownPackError extends Error {
  constructor(id: string, known: string[]) {
    super(
      `Unknown rule pack "${id}". Registered packs: ${
        known.length ? known.join(", ") : "(none)"
      }`,
    );
    this.name = "UnknownPackError";
  }
}

/**
 * Holds the registered rule packs. The engine looks packs up here by id and never
 * branches on which pack it got — adding an injustice is `register(new Pack())`.
 */
export class PackRegistry implements PackLookup {
  private readonly packs = new Map<string, RulePack>();

  register(pack: RulePack): this {
    if (this.packs.has(pack.id)) {
      throw new Error(`Rule pack "${pack.id}" is already registered.`);
    }
    this.packs.set(pack.id, pack);
    return this;
  }

  get(id: string): RulePack | undefined {
    return this.packs.get(id);
  }

  require(id: string): RulePack {
    const pack = this.packs.get(id);
    if (!pack) throw new UnknownPackError(id, [...this.packs.keys()]);
    return pack;
  }

  list(): RulePack[] {
    return [...this.packs.values()];
  }
}
