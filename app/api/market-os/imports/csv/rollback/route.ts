import { NextResponse } from "next/server"
import { listRollbackSnapshots } from "@/lib/csv/server/csv-rollback"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.jobId) {
      return NextResponse.json({ ok: false, error: "Missing jobId" }, { status: 400 })
    }

    const snapshots = await listRollbackSnapshots(body.jobId)

    return NextResponse.json({
      ok: true,
      snapshots,
      message: "Rollback preview only. Restore execution should be implemented after manual review.",
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown rollback error",
      },
      { status: 500 }
    )
  }
}