import { NextRequest, NextResponse } from "next/server";
import {
  InterviewConflictError,
  InterviewConcurrencyError,
  createInterview,
  getInterviewCommandSnapshot,
} from "@/lib/hr-recruitment/interviews/server";
import type { InterviewInput } from "@/lib/hr-recruitment/interviews/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

export async function GET() {
  try {
    const snapshot = await getInterviewCommandSnapshot();
    return NextResponse.json({ ok: true, snapshot }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = (await request.json()) as InterviewInput;
    const result = await createInterview(input);
    return NextResponse.json(result, { status: 201, headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
