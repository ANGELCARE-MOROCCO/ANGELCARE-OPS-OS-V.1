import { NextRequest, NextResponse } from 'next/server'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()
    if (!actor?.id) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })
    const permission = requireB2BPermission('update', { actorId: actor.id, actorRole: actor.role || actor.role_key })
    if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })

    const body = await req.json()
    const { data, error } = await db.from('b2b_communication_templates').update({ ...body, updated_by: actor.id }).eq('id', params.id).select('*').single()
    if (error) return NextResponse.json({ ok: false, error: 'Unable to update template.' }, { status: 500 })
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('[B2B_TEMPLATE_PATCH_FAILED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to update template.' }, { status: 500 })
  }
}
