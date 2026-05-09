import { NextResponse } from "next/server"
import { createRealEmailOSDb } from "@/lib/email-os/real/real-db"
import { createRealEmailOSId, isRealEmailOSEntity, nowIso, realEmailOSTableMap } from "@/lib/email-os/real/table-map"
import { normalizeRecord, toDbPayload } from "@/lib/email-os/real/normalizers"

export async function GET(
  _request: Request,
  context: { params: Promise<{ entity: string }> }
) {
  const { entity } = await context.params

  if (!isRealEmailOSEntity(entity)) {
    return NextResponse.json({ ok: false, error: "Unknown Email-OS entity" }, { status: 404 })
  }

  try {
    const db = createRealEmailOSDb()
    const table = realEmailOSTableMap[entity]
    const orderColumn =
      entity === "outbox" ? "scheduled_at" :
      entity === "approvals" ? "created_at" :
      entity === "audit" ? "created_at" :
      entity === "runtime-events" ? "created_at" :
      "updated_at"

    const { data, error } = await db
      .from(table)
      .select("*")
      .order(orderColumn, { ascending: false })
      .limit(250)

    if (error) throw error

    return NextResponse.json({
      ok: true,
      data: (data || []).map((row) => normalizeRecord(entity, row))
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load records" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ entity: string }> }
) {
  const { entity } = await context.params

  if (!isRealEmailOSEntity(entity)) {
    return NextResponse.json({ ok: false, error: "Unknown Email-OS entity" }, { status: 404 })
  }

  try {
    const db = createRealEmailOSDb()
    const table = realEmailOSTableMap[entity]
    const body = await request.json().catch(() => ({}))

    const prefix =
      entity === "mailboxes" ? "mbx" :
      entity === "templates" ? "tpl" :
      entity === "automation" ? "auto" :
      entity === "outbox" ? "job" :
      entity === "audit" ? "audit" :
      entity === "runtime-events" ? "evt" :
      "rec"

    let row: any = { ...body, id: body.id || createRealEmailOSId(prefix) }

    if (entity === "approvals") {
      row = {
        id: row.id,
        target_id: body.targetId || body.target_id || "manual",
        target_type: body.targetType || body.target_type || "manual",
        decision: body.decision || "pending",
        decided_by: body.decidedBy || body.decided_by || null,
        reason: body.reason || null,
        created_at: nowIso()
      }
    } else if (entity === "audit") {
      row = {
        id: row.id,
        action: body.action || "manual.audit",
        actor_id: body.actorId || null,
        mailbox_id: body.mailboxId || null,
        thread_id: body.threadId || null,
        draft_id: body.draftId || null,
        severity: body.severity || "info",
        details: body.details || {},
        created_at: nowIso()
      }
    } else if (entity === "runtime-events") {
      row = {
        id: row.id,
        type: body.type || "manual.event",
        actor_id: body.actorId || null,
        mailbox_id: body.mailboxId || null,
        thread_id: body.threadId || null,
        payload: body.payload || {},
        created_at: nowIso()
      }
    } else {
      row = toDbPayload(entity, row)
    }

    const { data, error } = await db.from(table).insert(row).select("*").single()
    if (error) throw error

    return NextResponse.json({ ok: true, data: normalizeRecord(entity, data) })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to create record" },
      { status: 500 }
    )
  }
}
