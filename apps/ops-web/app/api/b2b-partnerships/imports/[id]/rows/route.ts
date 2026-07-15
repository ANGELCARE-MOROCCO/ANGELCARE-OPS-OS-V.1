import { NextResponse } from 'next/server'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()
    if (!actor?.id) return NextResponse.json({ ok:false, error:'Authentication required.' }, { status:401 })
    const permission = requireB2BPermission('read', { actorId: actor.id, actorRole: actor.role || actor.role_key })
    if (!permission.ok) return NextResponse.json({ ok:false, error:permission.error }, { status:permission.status })
    const { data, error } = await db.from('b2b_import_rows').select('*').eq('batch_id', params.id).order('row_index')
    if (error) return NextResponse.json({ ok:false, error:'Unable to load import rows.' }, { status:500 })
    return NextResponse.json({ ok:true, data:data || [] })
  } catch (error) {
    console.error('[B2B_IMPORT_ROWS_GET_CRASHED]', error)
    return NextResponse.json({ ok:false, error:'Unable to load import rows.' }, { status:500 })
  }
}
