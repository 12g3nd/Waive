import { NextResponse } from "next/server";
import { buildRegistry } from "@/packs";
import type { PackOption } from "@/lib/api-types";

export const runtime = "nodejs";

/**
 * The registered rule packs, so the upload flow can ask the person which kind of
 * notice they have instead of assuming one. Config-driven: a new pack shows up here
 * automatically once it's registered — the engine and this route never change.
 */
export async function GET() {
  const packs: PackOption[] = buildRegistry()
    .list()
    .map((p) => ({ id: p.id, displayName: p.displayName, jurisdiction: p.jurisdiction }));
  return NextResponse.json({ packs });
}
