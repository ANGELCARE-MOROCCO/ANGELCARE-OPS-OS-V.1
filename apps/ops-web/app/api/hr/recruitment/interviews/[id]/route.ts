import { NextRequest, NextResponse } from "next/server";
import {
  InterviewConflictError,
  InterviewConcurrencyError,
  cancelInterview,
  updateInterview,
} from "@/lib/hr-recruitment/interviews/server";
import type { InterviewInput } from "@/lib/hr-recruitment/interviews/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> | { id: string } };

function errorResponse(error: unknown) {
  if (error instanceof InterviewConflictError) {
    return NextResponse.json(
      { ok: false, code: "INTERVIEW_CONFLICT", error: error.message, conflicts: error.conflicts },
      { status: 409 },
    );
  }
  if (error instanceof InterviewConcurrencyError) {
    return NextResponse.json({ ok: false, code: "STALE_VERSION", error: error.message }, { status: 409 });
  }
  return NextResponse.json(
    { ok: false, code: "INTERVIEW_OPERATION_FAILED", error: error instanceof Error ? error.message : "Opération impossible." },
    { status: 500 },
  );
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { id } = await Promise.resolve(context.params);
    const input = (await request.json()) as InterviewInput;
    const result = await updateInterview(id, input);
    return NextResponse.json(result, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const { id } = await Promise.resolve(context.params);
    const body = (await request.json()) as { reason?: string; pipelineStage?: string | null; notes?: string | null; version?: number };
    const result = await cancelInterview(id, {
      reason: String(body.reason || "").trim(),
      pipelineStage: body.pipelineStage || null,
      notes: body.notes || null,
      version: Number(body.version || 0),
    });
    return NextResponse.json(result, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
