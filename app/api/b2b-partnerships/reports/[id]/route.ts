import { NextResponse } from 'next/server'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()
    if (!actor?.id) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 })

    const permission = requireB2BPermission('read', { actorId: actor.id, actorRole: actor.role })
    if (!permission.ok) return NextResponse.json({ ok: false, error: permission.error }, { status: permission.status })

    const { data, error } = await db.from('b2b_reports').select('*').eq('id', params.id).single()
    if (error || !data) return NextResponse.json({ ok: false, error: 'Report not found.' }, { status: 404 })
    return NextResponse.json({ ok: true, data })
  } catch {
    return NextResponse.json({ ok: false, error: 'Unexpected server error.' }, { status: 500 })
  }
}
