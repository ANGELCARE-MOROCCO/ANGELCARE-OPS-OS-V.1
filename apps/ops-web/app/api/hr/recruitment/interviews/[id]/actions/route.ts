import { NextRequest, NextResponse } from "next/server";
import {
  InterviewConcurrencyError,
  runInterviewAction,
} from "@/lib/hr-recruitment/interviews/server";
import type { InterviewActionInput } from "@/lib/hr-recruitment/interviews/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> | { id: string } };

export async function POST(request: NextRequest, context: Context) {
  try {
    const { id } = await Promise.resolve(context.params);
    const input = (await request.json()) as InterviewActionInput;
    const result = await runInterviewAction(id, input);
    return NextResponse.json(result, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    if (error instanceof InterviewConcurrencyError) {
      return NextResponse.json({ ok: false, code: "STALE_VERSION", error: error.message }, { status: 409 });
    }
    return NextResponse.json(
      { ok: false, code: "INTERVIEW_ACTION_FAILED", error: error instanceof Error ? error.message : "Action impossible." },
      { status: 500 },
    );
  }
}
