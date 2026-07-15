import { NextResponse } from "next/server";
import { scanFactoryAdoptionCandidates } from "@/lib/saas-factory/phase5-file-scanner";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const report = await scanFactoryAdoptionCandidates();
    return NextResponse.json({
      ok: true,
      ...report,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
