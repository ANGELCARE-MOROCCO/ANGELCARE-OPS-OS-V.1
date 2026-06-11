import { NextRequest, NextResponse } from 'next/server'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()

    if (!actor?.id) {
      return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
    }

    const permission = requireB2BPermission('update', {
      actorId: actor.id,
      actorRole: actor.role || actor.role_key,
      permissions: actor.permissions,
    })

    if (!permission.ok) {
      return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })
    }

    const body = await req.json()

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.status !== undefined) updatePayload.status = body.status
    if (body.priority_score !== undefined) updatePayload.priority_score = body.priority_score
    if (body.relationship_warmth !== undefined) updatePayload.relationship_warmth = body.relationship_warmth
    if (body.next_action !== undefined) updatePayload.next_action = body.next_action || null
    if (body.next_follow_up_at !== undefined) updatePayload.next_follow_up_at = body.next_follow_up_at || null

    const { data, error } = await db
      .from('b2b_prospects')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('[B2B_PROSPECT_STATUS_PATCH_FAILED]', error)
      return NextResponse.json({ ok: false, error: 'Unable to update prospect status.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('[B2B_PROSPECT_STATUS_PATCH_CRASHED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to update prospect status.' }, { status: 500 })
  }
}
