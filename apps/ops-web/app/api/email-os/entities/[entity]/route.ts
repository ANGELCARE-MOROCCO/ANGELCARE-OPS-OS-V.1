import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import {
  EMAIL_OS_TABLES,
  isEmailOSEntity,
  makeEmailOSId
} from "@/lib/email-os-core/schema"
import {
  cleanUndefined,
  normalize,
  toDb
} from "@/lib/email-os-core/map"
import { audit } from "@/lib/email-os-core/audit"

function debug(error: unknown) {
  if (error && typeof error === "object") {
    const e = error as Record<string, unknown>

    return {
      message: String(e.message || e.error || "Unknown error"),
      code: e.code,
      details: e.details,
      hint: e.hint
    }
  }

  return {
    message: error instanceof Error
      ? error.message
      : "Unknown error"
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ entity: string }> }
) {
  const { entity } = await context.params

  if (!isEmailOSEntity(entity)) {
    return NextResponse.json(
      { ok: false, error: "Unknown entity" },
      { status: 404 }
    )
  }

  try {
    const db = createEmailOSCoreDb()
    const table = EMAIL_OS_TABLES[entity]

    const order =
      entity === "audit"
        ? "created_at"
        : entity === "queue"
          ? "scheduled_at"
          : "updated_at"

    const { data, error } = await db
      .from(table)
      .select("*")
      .order(order, { ascending: false })
      .limit(250)

    if (error) throw error

    return NextResponse.json({
      ok: true,
      data: (data || []).map((r) => normalize(entity, r))
    })
  } catch (error) {
    const d = debug(error)

    return NextResponse.json(
      {
        ok: false,
        error: d.message,
        debug: d
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ entity: string }> }
) {
  const { entity } = await context.params

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

    const row = cleanUndefined(
      toDb(entity, {
        ...body,
        id: body.id || makeEmailOSId()
      })
    )

    const { data, error } = await db
      .from(table)
      .insert(row)
      .select("*")
      .single()

    if (error) throw error

    try {
      await audit(`${entity}.created`, {
        targetType: entity,
        targetId: data?.id || row.id
      })
    } catch {
      // non-blocking
    }

    return NextResponse.json({
      ok: true,
      data: normalize(entity, data)
    })
  } catch (error) {
    const d = debug(error)

    return NextResponse.json(
      {
        ok: false,
        error: d.message,
        debug: d
      },
      { status: 500 }
    )
  }
}