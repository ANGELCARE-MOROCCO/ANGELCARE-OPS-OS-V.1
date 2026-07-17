import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId, nowIso } from "@/lib/email-os-core/schema"

function clean(value: unknown) {
  return String(value ?? "").trim()
}

function normalizeTemplate(row: any) {
  return {
    id: clean(row?.id),
    mailbox_id: row?.mailbox_id || null,
    mailboxId: row?.mailbox_id || null,
    name: clean(row?.name || row?.title || "Untitled template"),
    category: clean(row?.category || row?.department || row?.type || "other"),
    subject: clean(row?.subject || row?.subject_template || ""),
    subject_template: clean(row?.subject_template || row?.subject || ""),
    body: clean(row?.body || row?.body_template || row?.content || row?.instructions || ""),
    body_template: clean(row?.body_template || row?.body || row?.content || row?.instructions || ""),
    language: clean(row?.language || "fr"),
    status: clean(row?.status || "active"),
    created_by: row?.created_by || null,
    variables: row?.variables || [],
    archived_at: row?.archived_at || null,
    created_at: row?.created_at || null,
    updated_at: row?.updated_at || null,
    raw: row
  }
}

async function loadTemplates(db: ReturnType<typeof createEmailOSCoreDb>, table: string) {
  const { data, error } = await db
    .from(table)
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(500)

  if (error) return []
  return data || []
}

export async function GET() {
  try {
    const db = createEmailOSCoreDb()
    const [responseTemplates, coreTemplates] = await Promise.all([
      loadTemplates(db, "email_os_response_templates"),
      loadTemplates(db, "email_os_core_templates")
    ])

    return NextResponse.json({
      ok: true,
      data: [...responseTemplates, ...coreTemplates].map(normalizeTemplate)
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Templates load failed"
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const db = createEmailOSCoreDb()
    const row = {
      id: clean(body.id || makeEmailOSId()),
      mailbox_id: body.mailboxId || body.mailbox_id || null,
      name: clean(body.name || body.title || "Untitled template"),
      category: clean(body.category || "other"),
      subject_template: clean(body.subject_template || body.subject || ""),
      body_template: clean(body.body_template || body.body || ""),
      language: clean(body.language || "fr"),
      status: clean(body.status || "active"),
      created_by: clean(body.created_by || body.createdBy || ""),
      variables: Array.isArray(body.variables) ? body.variables : [],
      archived_at: body.status === "archived" ? nowIso() : null,
      created_at: nowIso(),
      updated_at: nowIso()
    }

    const { data, error } = await db.from("email_os_response_templates").insert(row).select("*").single()
    if (error) throw error

    return NextResponse.json({ ok: true, data: normalizeTemplate(data) })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Template create failed" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const id = clean(body.id)
    if (!id) {
      return NextResponse.json({ ok: false, error: "Template id is required" }, { status: 400 })
    }

    const db = createEmailOSCoreDb()
    const updates = {
      mailbox_id: body.mailboxId || body.mailbox_id || null,
      name: body.name ? clean(body.name) : undefined,
      category: body.category ? clean(body.category) : undefined,
      subject_template: body.subject_template !== undefined ? clean(body.subject_template) : undefined,
      body_template: body.body_template !== undefined ? clean(body.body_template) : undefined,
      language: body.language ? clean(body.language) : undefined,
      status: body.status ? clean(body.status) : undefined,
      created_by: body.created_by ? clean(body.created_by) : undefined,
      variables: Array.isArray(body.variables) ? body.variables : undefined,
      archived_at: body.status === "archived" ? nowIso() : body.archived_at || null,
      updated_at: nowIso()
    }

    const { data, error } = await db
      .from("email_os_response_templates")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, data: normalizeTemplate(data) })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Template update failed" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const id = clean(body.id)
    if (!id) {
      return NextResponse.json({ ok: false, error: "Template id is required" }, { status: 400 })
    }

    const db = createEmailOSCoreDb()
    const { data, error } = await db
      .from("email_os_response_templates")
      .update({ status: "archived", archived_at: nowIso(), updated_at: nowIso() })
      .eq("id", id)
      .select("*")
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, data: normalizeTemplate(data) })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Template archive failed" },
      { status: 500 }
    )
  }
}
