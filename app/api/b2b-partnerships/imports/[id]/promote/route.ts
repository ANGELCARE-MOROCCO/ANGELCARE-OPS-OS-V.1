import { NextResponse } from 'next/server'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getServerB2BDatabaseClient()
    const actor = await getCurrentB2BAppUser()
    if (!actor?.id) return NextResponse.json({ ok:false, error:'Authentication required.' }, { status:401 })
    const permission = requireB2BPermission('create', { actorId: actor.id, actorRole: actor.role || actor.role_key })
    if (!permission.ok) return NextResponse.json({ ok:false, error:permission.error }, { status:permission.status })
    const { data: batch } = await db.from('b2b_import_batches').select('*').eq('id', params.id).single()
    if (!batch) return NextResponse.json({ ok:false, error:'Import batch not found.' }, { status:404 })
    const { data: rows, error: rowsError } = await db.from('b2b_import_rows').select('*').eq('batch_id', params.id).eq('validation_status', 'Valid')
    if (rowsError) return NextResponse.json({ ok:false, error:'Unable to load valid rows.' }, { status:500 })
    const created:any[] = []
    for (const row of rows || []) {
      if (row.promoted_prospect_id) continue
      const n = row.normalized_data || {}
      const { data: prospect, error } = await db.from('b2b_prospects').insert({
        ...n,
        status: 'New',
        relationship_warmth: 'Cold',
        assigned_owner_id: batch.default_owner_id || actor.id,
        created_by: actor.id,
        updated_by: actor.id,
        source_channel: batch.source,
        source_batch_id: batch.id,
        source_row_id: row.id,
      }).select('*').single()
      if (!error && prospect) {
        created.push(prospect)
        await db.from('b2b_import_rows').update({ promoted_prospect_id: prospect.id, promoted_at: new Date().toISOString(), validation_status: 'Promoted' }).eq('id', row.id)
      }
    }
    await db.from('b2b_import_batches').update({ status: 'Promoted', promoted_rows: created.length, promoted_at: new Date().toISOString() }).eq('id', params.id)
    return NextResponse.json({ ok:true, data:{ promoted: created.length, prospects: created } })
  } catch (error) {
    console.error('[B2B_IMPORT_PROMOTE_CRASHED]', error)
    return NextResponse.json({ ok:false, error:'Unable to promote import rows.' }, { status:500 })
  }
}
