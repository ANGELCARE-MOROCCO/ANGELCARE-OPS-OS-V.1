import { NextRequest, NextResponse } from 'next/server'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'

type RouteContext = {
  params: Promise<{ id: string }>
}

async function guard(action: 'read' | 'create' | 'update' | 'archive' = 'read') {
  const db = await getServerB2BDatabaseClient()
  const actor = await getCurrentB2BAppUser()

  if (!actor?.id) {
    return { ok: false as const, db, actor, response: NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 }) }
  }

  const permission = requireB2BPermission(action, {
    actorId: actor.id,
    actorRole: actor.role || actor.role_key,
    permissions: actor.permissions,
  })

  if (!permission.ok) {
    return { ok: false as const, db, actor, response: NextResponse.json({ ok: false, error: permission.error }, { status: permission.status }) }
  }

  return { ok: true as const, db, actor }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const g = await guard('update')
    if (!g.ok) return g.response

    const body = await req.json()
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    for (const key of ['name', 'role', 'email', 'phone', 'mobile', 'whatsapp', 'linkedin', 'department', 'notes', 'is_primary', 'is_decision_maker']) {
      if (body[key] !== undefined) payload[key] = body[key] === '' ? null : body[key]
    }

    const { data, error } = await g.db
      .from('b2b_contacts')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('[B2B_CONTACT_PATCH_FAILED]', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('[B2B_CONTACT_PATCH_CRASHED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to update contact.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const g = await guard('archive')
    if (!g.ok) return g.response

    const { data, error } = await g.db
      .from('b2b_contacts')
      .update({
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('[B2B_CONTACT_DELETE_FAILED]', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('[B2B_CONTACT_DELETE_CRASHED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to delete contact.' }, { status: 500 })
  }
}
