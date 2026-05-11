import { NextResponse } from "next/server"
import { listCsvImportJobs } from "@/lib/csv/server/csv-import-audit"

export async function GET() {
  try {
    const jobs = await listCsvImportJobs()
    return NextResponse.json({ ok: true, jobs })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown history error",
      },
      { status: 500 }
    )
  }
}