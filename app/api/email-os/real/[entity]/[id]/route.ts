import { NextResponse } from "next/server"
import { createRealEmailOSDb } from "@/lib/email-os/real/real-db"
import { isRealEmailOSEntity, realEmailOSTableMap } from "@/lib/email-os/real/table-map"
import { normalizeRecord, toDbPayload } from "@/lib/email-os/real/normalizers"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ entity: string; id: string }> }
) {
  const { entity, id } = await context.params

  if (!isRealEmailOSEntity(entity)) {
    return NextResponse.json({ ok: false, error: "Unknown Email-OS entity" }, { status: 404 })
  }

  try {
    const db = createRealEmailOSDb()
    const table = realEmailOSTableMap[entity]
    const body = await request.json().catch(() => ({}))
    const payload = toDbPayload(entity, { ...body, id, createdAt: true })

    const { data, error } = await db
      .from(table)
      .update(payload)
      .eq("id", id)
      .select("*")
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, data: normalizeRecord(entity, data) })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to update record" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ entity: string; id: string }> }
) {
  const { entity, id } = await context.params

  if (!isRealEmailOSEntity(entity)) {
    return NextResponse.json({ ok: false, error: "Unknown Email-OS entity" }, { status: 404 })
  }

  try {
    const db = createRealEmailOSDb()
    const table = realEmailOSTableMap[entity]
    const { error } = await db.from(table).delete().eq("id", id)
    if (error) throw error

    return NextResponse.json({ ok: true, data: { id } })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to delete record" },
      { status: 500 }
    )
  }
}
