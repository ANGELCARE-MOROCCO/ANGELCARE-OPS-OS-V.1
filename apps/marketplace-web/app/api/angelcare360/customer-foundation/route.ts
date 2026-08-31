import { publicAngelcare360Error } from '@/lib/angelcare360/server/public-error'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Angelcare360AccessError, requireAngelcare360Permission } from '@/lib/angelcare360/server'
import { executeProductRealityCommand } from '@/lib/angelcare360/server/product-reality'

export const runtime = 'nodejs'

type Body = { entity?: string; operation?: string; id?: string; payload?: Record<string, unknown> }
function value(payload: Record<string, unknown>, key: string) { const item = payload[key]; return item === null || item === undefined ? null : String(item) }

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as Body | null
    if (!body?.entity || !body.operation) return NextResponse.json({ ok: false, error: 'La demande de gouvernance est incomplète.' }, { status: 422 })
    const payload = body.payload || {}
    const context = await requireAngelcare360Permission(body.entity === 'duplicate-case' ? 'eleves.update' : 'administration.update')
    if (!context.school) return NextResponse.json({ ok: false, error: 'Établissement actif introuvable.' }, { status: 403 })
    const client = await createServiceClient()

    if (body.entity === 'management-decision') {
      if (body.operation === 'create') {
        const title = value(payload, 'title')?.trim()
        if (!title) return NextResponse.json({ ok: false, error: 'Le titre de la décision est requis.' }, { status: 422 })
        const { data, error } = await client.from('angelcare360_customer_management_decisions').insert({
          school_id: context.school.id,
          title,
          detail: value(payload, 'detail'),
          domain: value(payload, 'domain') || 'direction',
          severity: value(payload, 'severity') || 'info',
          due_at: value(payload, 'dueAt'),
          related_entity_type: value(payload, 'relatedEntityType'),
          related_entity_id: value(payload, 'relatedEntityId'),
          operation_key: value(payload, 'operationKey'),
          operation_payload: payload.operationPayload && typeof payload.operationPayload === 'object' ? payload.operationPayload : {},
          owner_user_id: value(payload, 'ownerUserId'),
          status: 'open',
          created_by: context.user.id,
        }).select('*').single()
        if (error) throw new Error(error.message)
        return NextResponse.json({ ok: true, message: 'Décision enregistrée dans la file de direction.', record: data })
      }
      if (body.operation === 'resolve') {
        const { data: decision, error: readError } = await client.from('angelcare360_customer_management_decisions').select('*').eq('school_id', context.school.id).eq('id', body.id || '').single()
        if (readError) throw new Error(readError.message)
        const operationKey = value(decision as Record<string, unknown>, 'operation_key')
        let execution: unknown = null
        if (operationKey) {
          execution = await executeProductRealityCommand({
            operationKey,
            entityId: value(decision as Record<string, unknown>, 'related_entity_id'),
            idempotencyKey: `management-decision:${body.id}`,
            reason: value(payload, 'reason') || value(decision as Record<string, unknown>, 'detail'),
            payload: (decision as Record<string, unknown>).operation_payload as Record<string, unknown> || {},
          })
        }
        const { error } = await client.from('angelcare360_customer_management_decisions').update({ status: 'resolved', decision_result: execution || {}, resolved_at: new Date().toISOString(), resolved_by: context.user.id }).eq('school_id', context.school.id).eq('id', body.id || '')
        if (error) throw new Error(error.message)
        return NextResponse.json({ ok: true, message: operationKey ? 'Décision exécutée, clôturée et auditée.' : 'Décision clôturée et auditée.', execution })
      }
    }

    if (body.entity === 'duplicate-case' && body.operation === 'resolve') {
      const resolution = value(payload, 'resolution') || 'kept_separate'
      const { data: duplicate, error: duplicateError } = await client.from('angelcare360_people_duplicate_cases').select('*').eq('school_id', context.school.id).eq('id', body.id || '').single()
      if (duplicateError) throw new Error(duplicateError.message)
      let execution: unknown = null
      if (resolution === 'merged') {
        const duplicateRow = duplicate as Record<string, unknown>
        const survivorPersonId = value(payload, 'survivorPersonId') || value(duplicateRow, 'left_person_id')
        const sourcePersonId = value(payload, 'sourcePersonId') || value(duplicateRow, 'right_person_id')
        if (!survivorPersonId || !sourcePersonId) return NextResponse.json({ ok: false, error: 'Les deux personnes à fusionner sont requises.' }, { status: 422 })
        execution = await executeProductRealityCommand({
          operationKey: 'person.merge.execute',
          entityId: body.id,
          idempotencyKey: `person-merge:${body.id}`,
          reason: value(payload, 'reason') || 'Fusion approuvée depuis la qualité des données.',
          payload: { survivorPersonId, sourcePersonId, duplicateCaseId: body.id },
        })
      }
      const { error } = await client.from('angelcare360_people_duplicate_cases').update({ status: 'resolved', resolution, resolution_reason: value(payload, 'reason'), execution_result: execution || {}, resolved_at: new Date().toISOString(), resolved_by: context.user.id }).eq('school_id', context.school.id).eq('id', body.id || '')
      if (error) throw new Error(error.message)
      return NextResponse.json({ ok: true, message: resolution === 'merged' ? 'Fusion exécutée et cas de doublon résolu.' : 'Cas de doublon résolu avec justification.', execution })
    }

    return NextResponse.json({ ok: false, error: 'Opération de gouvernance inconnue.' }, { status: 400 })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
    return NextResponse.json({ ok: false, error: publicAngelcare360Error(error) }, { status: 500 })
  }
}
