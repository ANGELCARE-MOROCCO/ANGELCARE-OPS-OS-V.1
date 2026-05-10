import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { EMAIL_OS_TABLES, isEmailOSEntity, nowIso } from "@/lib/email-os-core/schema"
import { audit } from "@/lib/email-os-core/audit"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const deletedRecordId = body.deletedRecordId

    if (!deletedRecordId) {
      return NextResponse.json({ ok: false, error: "Missing deletedRecordId" }, { status: 400 })
    }

    const db = createEmailOSCoreDb()

    const { data: deletedRecord, error: loadError } = await db
      .from("email_os_core_deleted_records")
      .select("*")
      .eq("id", deletedRecordId)
      .single()

    if (loadError) throw loadError
    if (!deletedRecord) throw new Error("Deleted record not found")

    const entity = deletedRecord.entity
    if (!isEmailOSEntity(entity)) {
      return NextResponse.json({ ok: false, error: "Entity cannot be recovered by core recovery API" }, { status: 400 })
    }

    const table = EMAIL_OS_TABLES[entity]
    const payload = deletedRecord.payload || {}

    const { data, error } = await db
      .from(table)
      .upsert(payload)
      .select("*")
      .single()

    if (error) throw error

    await db
      .from("email_os_core_deleted_records")
      .update({ recovery_status: "recovered" })
      .eq("id", deletedRecordId)

    await audit("governance.recovered", {
      targetType: entity,
      targetId: deletedRecord.record_id,
      recoveredAt: nowIso()
    })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Recovery failed" }, { status: 500 })
  }
}
