import { PackRegistry, type RulePack } from "@/engine";
import { benefitsPack } from "./benefits";

/**
 * All registered rule packs. Adding an injustice = implement a RulePack, add its
 * corpus entries + samples, and register it here. The engine needs no changes.
 * (The Ontario `answer` pack joins in Phase 6.)
 */
export const allPacks: RulePack[] = [benefitsPack];

export function buildRegistry(): PackRegistry {
  const registry = new PackRegistry();
  for (const pack of allPacks) registry.register(pack);
  return registry;
}

export { benefitsPack } from "./benefits";
