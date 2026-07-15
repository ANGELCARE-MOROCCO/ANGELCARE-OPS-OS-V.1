import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { EMAIL_OS_TABLES } from "@/lib/email-os-core/schema"

async function countTable(db: ReturnType<typeof createEmailOSCoreDb>, table: string) {
  const { count, error } = await db.from(table).select("*", { count: "exact", head: true })
  if (error) return { ok: false, error: error.message, count: 0 }
  return { ok: true, count: count || 0 }
}

export async function GET() {
  const db = createEmailOSCoreDb()

  const tables: Record<string, unknown> = {}

  for (const [entity, table] of Object.entries(EMAIL_OS_TABLES)) {
    tables[entity] = {
      table,
      ...(await countTable(db, table))
    }
  }

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    tables,
    exports: Object.keys(EMAIL_OS_TABLES).map((entity) => `/api/email-os/export/${entity}`)
  })
}
