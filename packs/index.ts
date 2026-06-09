import { PackRegistry, type RulePack } from "@/engine";
import { benefitsPack } from "./benefits";
import { answerPacks } from "./answer";

/**
 * All registered rule packs. Adding an injustice = implement a RulePack, add its
 * corpus entries + samples, and register it here. The engine needs no changes.
 *
 * The debt domain ships three jurisdictions — Ontario, British Columbia, and
 * California — each generated from a verified profile via `makeDebtPack`. That is
 * the scalability story: same engine, config per province/state.
 */
export const allPacks: RulePack[] = [benefitsPack, ...answerPacks];

export function buildRegistry(): PackRegistry {
  const registry = new PackRegistry();
  for (const pack of allPacks) registry.register(pack);
  return registry;
}

export { benefitsPack } from "./benefits";
export { answerPack, answerPacks, makeDebtPack } from "./answer";
