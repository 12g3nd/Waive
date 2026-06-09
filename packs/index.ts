import { PackRegistry, type RulePack } from "@/engine";
import { benefitsPack } from "./benefits";
import { answerPack } from "./answer";

/**
 * All registered rule packs. Adding an injustice = implement a RulePack, add its
 * corpus entries + samples, and register it here. The engine needs no changes.
 */
export const allPacks: RulePack[] = [benefitsPack, answerPack];

export function buildRegistry(): PackRegistry {
  const registry = new PackRegistry();
  for (const pack of allPacks) registry.register(pack);
  return registry;
}

export { benefitsPack } from "./benefits";
export { answerPack } from "./answer";
