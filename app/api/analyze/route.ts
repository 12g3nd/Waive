import { NextResponse } from "next/server";
import { runPipeline, type PipelineInput, type UserFacts } from "@/engine";
import { buildRegistry } from "@/packs";
import { corpus } from "@/corpus";
import { getLlm, readLlmConfig } from "@/lib/llm";
import { getSample, todayISO } from "@/samples";
import type { AnalyzeRequest } from "@/lib/api-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: AnalyzeRequest;
  try {
    body = (await req.json()) as AnalyzeRequest;
  } catch {
    return NextResponse.json(
      { ok: false, code: "bad_request", error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  try {
    const registry = buildRegistry();
    const cfg = readLlmConfig();
    const { llm, status } = await getLlm(cfg);

    let input: PipelineInput;
    let packId: string;

    if (body.mode === "sample") {
      const sample = getSample(body.sampleId);
      if (!sample) {
        return NextResponse.json(
          { ok: false, code: "unknown_sample", error: `Unknown sample "${body.sampleId}".` },
          { status: 404 },
        );
      }
      packId = sample.packId;
      input = {
        packId: sample.packId,
        userFacts: sample.presetFacts,
        source: { kind: "extraction", extraction: sample.buildExtraction(todayISO()) },
        language: body.language ?? "en",
      };
    } else {
      packId = body.packId;
      const userFacts: UserFacts = body.userFacts ?? { answers: {} };
      input = {
        packId: body.packId,
        userFacts,
        source: body.source,
        language: body.language ?? "en",
      };
    }

    const pack = registry.get(packId);
    const result = await runPipeline(input, { registry, llm, corpus });

    return NextResponse.json({
      ok: true,
      result,
      llm: status,
      intake: pack?.intake ?? [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const code = /extraction|ollama|model|image|vision/i.test(message)
      ? "extraction_failed"
      : "pipeline_error";
    return NextResponse.json({ ok: false, code, error: message }, { status: 422 });
  }
}
