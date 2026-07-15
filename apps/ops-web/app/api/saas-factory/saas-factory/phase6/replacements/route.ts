import { NextResponse } from "next/server";
import { buildPhase6Report } from "@/lib/saas-factory/phase6-report";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    ...buildPhase6Report(),
  });
}
