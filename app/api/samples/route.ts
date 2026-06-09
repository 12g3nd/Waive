import { NextResponse } from "next/server";
import { SAMPLES } from "@/samples";
import type { SampleCard } from "@/lib/api-types";

export const runtime = "nodejs";

/** Sample cards for the judge's-choice board. Extractions stay on the server. */
export async function GET() {
  const samples: SampleCard[] = SAMPLES.map((s) => ({
    id: s.id,
    packId: s.packId,
    title: s.title,
    blurb: s.blurb,
    badge: s.badge,
    tone: s.tone,
    imagePath: s.imagePath,
  }));
  return NextResponse.json({ samples });
}
