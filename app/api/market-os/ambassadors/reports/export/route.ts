import { NextResponse } from "next/server"
import { buildCsv, datedFilename } from "@/lib/market-os/ambassadors/validation"

type AnyRecord = Record<string, any>

function normalizeRows(payload: any): AnyRecord[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.rows)) return payload.rows
  if (Array.isArray(payload?.records)) return payload.records
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

export async function GET() {
  const rows: AnyRecord[] = []
  const csv = buildCsv(rows)

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${datedFilename("ambassadors-report", "csv")}"`,
    },
  })
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}))
  const rows = normalizeRows(payload)
  const csv = buildCsv(rows)

  return NextResponse.json({
    ok: true,
    source: "ambassador-report-export-compat",
    filename: datedFilename("ambassadors-report", "csv"),
    data: csv,
    rows: rows.length,
  })
}
