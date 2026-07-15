import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import {
  EMAIL_OS_TABLES,
  isEmailOSEntity
} from "@/lib/email-os-core/schema"
import { audit } from "@/lib/email-os-core/audit"

function debug(error: unknown) {
  return {
    message: error instanceof Error ? error.message : String(error)
  }
}

function cleanPayload(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  )
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ entity: string; id: string }> }
) {
  const { entity, id } = await context.params

  if (!isEmailOSEntity(entity)) {
    return NextResponse.json(
      { ok: false, error: "Unknown entity" },
      { status: 404 }
    )
  }

  try {
    const db = createEmailOSCoreDb()
    const table = EMAIL_OS_TABLES[entity]
    const body = await request.json().catch(() => ({}))

    const row = cleanPayload({
      ...body,
      id: undefined,
      createdAt: undefined,
      created_at: undefined
    })

    const { data, error } = await db
      .from(table)
      .update(row)
      .eq("id", id)
      .select("*")
      .single()

    if (error) throw error

    try {
      await audit(`${entity}.updated`, {
        targetType: entity,
        targetId: id
      })
    } catch {
      // audit is non-blocking
    }

    return NextResponse.json({
      ok: true,
      data
    })
  } catch (error) {
    const d = debug(error)

    return NextResponse.json(
      { ok: false, error: d.message, debug: d },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ entity: string; id: string }> }
) {
  const { entity, id } = await context.params

  if (!isEmailOSEntity(entity)) {
    return NextResponse.json(
      { ok: false, error: "Unknown entity" },
      { status: 404 }
    )
  }

  try {
    const db = createEmailOSCoreDb()
    const table = EMAIL_OS_TABLES[entity]

    const { error } = await db
      .from(table)
      .delete()
      .eq("id", id)

    if (error) throw error

    try {
      await audit(`${entity}.deleted`, {
        targetType: entity,
        targetId: id,
        severity: "warning"
      })
    } catch {
      // audit is non-blocking
    }

    return NextResponse.json({
      ok: true,
      deleted: id
    })
  } catch (error) {
    const d = debug(error)

    return NextResponse.json(
      { ok: false, error: d.message, debug: d },
      { status: 500 }
    )
  }
}