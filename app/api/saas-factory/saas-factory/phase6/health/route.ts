import { NextResponse } from "next/server";
import { PHASE6_FIELD_REPLACEMENTS } from "@/lib/saas-factory/phase6-module-field-map";

export const dynamic = "force-dynamic";

export async function GET() {
  const critical = PHASE6_FIELD_REPLACEMENTS.filter((item) => item.priority === "critical").length;
  const high = PHASE6_FIELD_REPLACEMENTS.filter((item) => item.priority === "high").length;
  return NextResponse.json({
    ok: true,
    phase: 6,
    status: "ready",
    replacements: PHASE6_FIELD_REPLACEMENTS.length,
    critical,
    high,
    normal: PHASE6_FIELD_REPLACEMENTS.length - critical - high,
    message: "Phase 6 live field adapters and codemod plan are installed.",
  });
}
