import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { EMAIL_OS_TABLES, isEmailOSEntity } from "@/lib/email-os-core/schema"

function csvEscape(value: unknown) {
  const text = typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "")
  return `"${text.replaceAll('"', '""')}"`
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ entity: string }> }
) {
  try {
    const { entity } = await context.params

    if (!isEmailOSEntity(entity)) {
      return NextResponse.json({ ok: false, error: "Unknown entity" }, { status: 404 })
    }

    const db = createEmailOSCoreDb()
    const table = EMAIL_OS_TABLES[entity]

    const { data, error } = await db.from(table).select("*").limit(1000)
    if (error) throw error

    const rows = data || []
    const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))

    const csv = [
      headers.join(","),
      ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))
    ].join("\n")

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="email-os-${entity}.csv"`
      }
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 }
    )
  }
}
