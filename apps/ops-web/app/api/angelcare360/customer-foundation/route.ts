import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Angelcare360AccessError, requireAngelcare360Permission } from '@/lib/angelcare360/server'

export const runtime = 'nodejs'

type Body = { entity?: string; operation?: string; id?: string; payload?: Record<string, unknown> }
function value(payload: Record<string, unknown>, key: string) { const item = payload[key]; return item === null || item === undefined ? null : String(item) }

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as Body | null
    if (!body?.entity || !body.operation) return NextResponse.json({ ok: false, error: 'La demande de gouvernance est incomplète.' }, { status: 422 })
    const payload = body.payload || {}
    const context = await requireAngelcare360Permission(body.entity === 'duplicate-case' ? 'eleves.update' : 'administration.update')
    const school = context.school
    if (!school) return NextResponse.json({ ok: false, error: 'Établissement actif introuvable.' }, { status: 403 })
    const client = await createClient()

    if (body.entity === 'management-decision') {
      if (body.operation === 'create') {
        const title = value(payload, 'title')?.trim()
        if (!title) return NextResponse.json({ ok: false, error: 'Le titre de la décision est requis.' }, { status: 422 })
        const { data, error } = await client.from('angelcare360_customer_management_decisions').insert({
          school_id: school.id, title, detail: value(payload, 'detail'), domain: value(payload, 'domain') || 'direction',
          severity: value(payload, 'severity') || 'info', due_at: value(payload, 'dueAt'), related_entity_type: value(payload, 'relatedEntityType'),
          related_entity_id: value(payload, 'relatedEntityId'), owner_user_id: value(payload, 'ownerUserId'), status: 'open', created_by: context.user.id,
        }).select('*').single()
        if (error) throw new Error(error.message)
        return NextResponse.json({ ok: true, message: 'Décision enregistrée dans la file de direction.', record: data })
      }
      if (body.operation === 'resolve') {
        const { error } = await client.from('angelcare360_customer_management_decisions').update({ status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: context.user.id }).eq('school_id', school.id).eq('id', body.id || '')
        if (error) throw new Error(error.message)
        return NextResponse.json({ ok: true, message: 'Décision clôturée et auditée.' })
      }
    }

    if (body.entity === 'duplicate-case' && body.operation === 'resolve') {
      const resolution = value(payload, 'resolution') || 'kept_separate'
      const { error } = await client.from('angelcare360_people_duplicate_cases').update({ status: 'resolved', resolution, resolution_reason: value(payload, 'reason'), resolved_at: new Date().toISOString(), resolved_by: context.user.id }).eq('school_id', school.id).eq('id', body.id || '')
      if (error) throw new Error(error.message)
      return NextResponse.json({ ok: true, message: 'Cas de doublon résolu avec justification.' })
    }

    return NextResponse.json({ ok: false, error: 'Opération de gouvernance inconnue.' }, { status: 400 })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Erreur inattendue.' }, { status: 500 })
  }
}
