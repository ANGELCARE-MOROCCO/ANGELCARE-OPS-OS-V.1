import { NextResponse } from "next/server"
import { runCsvServerSync } from "@/lib/csv/server/csv-server-sync"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const result = await runCsvServerSync({
      datasetType: body.datasetType,
      fileName: body.fileName ?? "uploaded.csv",
      syncMode: body.syncMode ?? "dry_run",
      rows: body.rows ?? [],
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown CSV sync error",
      },
      { status: 500 }
    )
  }
}