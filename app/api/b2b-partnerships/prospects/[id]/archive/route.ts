import { NextResponse } from 'next/server'
import { B2B_AUDIT_ACTIONS } from '@/lib/b2b-partnerships/constants'
import { logB2BAuditEvent, logB2BActivity } from '@/lib/b2b-partnerships/audit'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()

    if (!actor?.id) {
      return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
    }

    const { data: existing } = await db
      .from('b2b_prospects')
      .select('*')
      .eq('id', params.id)
      .is('archived_at', null)
      .single()

    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Prospect not found.' }, { status: 404 })
    }

    const permission = requireB2BPermission('archive', {
      actorId: actor.id,
      actorRole: actor.role,
      assignedOwnerId: existing.assigned_owner_id,
      createdBy: existing.created_by,
    })

    if (!permission.ok) {
      return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })
    }

    const { data, error } = await db
      .from('b2b_prospects')
      .update({ archived_at: new Date().toISOString(), updated_by: actor.id })
      .eq('id', params.id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ ok: false, error: 'Unable to archive prospect.' }, { status: 500 })
    }

    await logB2BActivity({
      db,
      prospectId: params.id,
      actorId: actor.id,
      activityType: 'prospect.archived',
      title: 'B2B prospect archived',
      description: `Prospect ${existing.name} was archived.`,
    })

    await logB2BAuditEvent({
      db,
      actorId: actor.id,
      entityType: 'b2b_prospect',
      entityId: params.id,
      action: B2B_AUDIT_ACTIONS.PROSPECT_ARCHIVED,
      beforeData: existing,
      afterData: data,
    })

    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('[B2B_PROSPECT_ARCHIVE_FAILED]', error)
    return NextResponse.json({ ok: false, error: 'Unexpected server error.' }, { status: 500 })
  }
}
