import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { recoveredLocalStorageSeed } from '@/lib/revenue-command-center/recoveredLocalStorageSeed'

const BATCH_KEY = 'staff-browser-recovery-20260514-v1'

type AnyRecord = Record<string, any>

function moduleFromStorageKey(storageKey: string) {
  if (storageKey.includes('prospects')) return 'prospects'
  if (storageKey.includes('appointments')) return 'appointments'
  if (storageKey.includes('sdr')) return 'sdr-execution'
  if (storageKey.includes('daily_tasks')) return 'daily-tasks'
  if (storageKey.includes('b2c_workflow')) return 'b2c-workflow'
  if (storageKey.includes('predictive')) return 'revenue-analytics'
  if (storageKey.includes('executive_briefing')) return 'executive-briefing'
  if (storageKey.includes('command_hq')) return 'executive-briefing'
  return 'revenue-command-center'
}

function titleOf(entity: AnyRecord) {
  return String(entity.title || entity.name || entity.familyName || entity.contactName || entity.company || entity.parentProspect || 'Recovered revenue record')
}

function valueOf(entity: AnyRecord) {
  return Number(entity.valueMad ?? entity.value_mad ?? entity.monthlyValueMad ?? 0) || 0
}

function statusOf(entity: AnyRecord) {
  return String(entity.stage || entity.status || 'open').replace(/\s+/g, '_').toLowerCase()
}

function priorityOf(entity: AnyRecord) {
  return String(entity.priority || (Number(entity.urgencyScore || entity.score || 0) > 85 ? 'critical' : 'high')).toLowerCase()
}

function dueOf(entity: AnyRecord) {
  return entity.nextContactDate || entity.dueDate || entity.date || entity.careStartDate || null
}

function ownerOf(entity: AnyRecord) {
  return entity.owner || entity.closer || entity.requester || entity.careCoordinator || entity.fieldCoordinator || null
}

function riskOf(entity: AnyRecord) {
  if (entity.health === 'risk' || entity.risk === 'critical' || entity.priority === 'critical') return 'critical'
  if (entity.health === 'watch' || entity.risk === 'high' || entity.priority === 'high') return 'high'
  if (entity.risk === 'medium') return 'medium'
  return 'low'
}

function descriptionOf(entity: AnyRecord) {
  return [
    entity.executiveSummary,
    entity.needSummary,
    entity.meetingObjective,
    entity.qualification,
    entity.nextAction,
    entity.notes,
  ].filter(Boolean).join(' | ') || null
}

function rowsFromSeed() {
  const rows: any[] = []
  const entities: any[] = []
  for (const [storageKey, raw] of Object.entries(recoveredLocalStorageSeed as Record<string, string>)) {
    const moduleKey = moduleFromStorageKey(storageKey)
    let parsed: AnyRecord = {}
    try { parsed = JSON.parse(raw) } catch { continue }
    for (const [entityType, list] of Object.entries(parsed)) {
      if (!Array.isArray(list)) continue
      if (entityType === 'logs' || entityType === 'automations') continue
      for (const entity of list as AnyRecord[]) {
        const externalId = String(entity.id || `${storageKey}-${entityType}-${rows.length}`)
        const title = titleOf(entity)
        const metadata = {
          recovery_batch: BATCH_KEY,
          recovered: true,
          recovered_storage_key: storageKey,
          recovered_entity_type: entityType,
          recovered_external_id: externalId,
          original_payload: entity,
        }
        rows.push({
          module_key: moduleKey,
          page_key: 'revenue-command-center',
          record_type: entityType.replace(/s$/, ''),
          title,
          description: descriptionOf(entity),
          owner_name: ownerOf(entity),
          department: 'Revenue Command',
          status: statusOf(entity),
          priority: priorityOf(entity),
          risk_level: riskOf(entity),
          value_mad: valueOf(entity),
          due_at: dueOf(entity),
          metadata,
          created_at: entity.createdAt || new Date().toISOString(),
          updated_at: entity.updatedAt || new Date().toISOString(),
        })
        entities.push({ batch_key: BATCH_KEY, storage_key: storageKey, module_key: moduleKey, entity_type: entityType, external_id: externalId, title, payload: entity })
      }
    }
  }
  return { rows, entities }
}

export async function GET() {
  return POST()
}

export async function POST(req?: Request) {
  try {
    const supabase = await createClient()
    const url = req ? new URL(req.url) : null
    const force = url?.searchParams.get('force') === '1'

    const { data: existing } = await supabase
      .from('revenue_command_recovered_entities')
      .select('id', { count: 'exact', head: false })
      .eq('batch_key', BATCH_KEY)
      .limit(1)

    if (!force && existing && existing.length > 0) {
      const { count } = await supabase.from('revenue_command_recovered_entities').select('*', { count: 'exact', head: true }).eq('batch_key', BATCH_KEY)
      return NextResponse.json({ ok: true, skipped: true, message: 'Recovery batch already imported. Add ?force=1 only if you intentionally want another import.', batchKey: BATCH_KEY, recoveredEntities: count || 0 })
    }

    if (force) {
      await supabase.from('revenue_command_recovered_entities').delete().eq('batch_key', BATCH_KEY)
      // Keep existing central records safe. We do not delete revenue_command_records automatically.
    }

    const payload = recoveredLocalStorageSeed as Record<string, string>
    await supabase.from('revenue_command_localstorage_backups').upsert({
      batch_key: BATCH_KEY,
      source_label: 'staff_browser_localstorage_backup',
      payload,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'batch_key' })

    const { rows, entities } = rowsFromSeed()
    const insertedRecords: any[] = []
    for (let i = 0; i < rows.length; i += 100) {
      const slice = rows.slice(i, i + 100)
      const { data, error } = await supabase.from('revenue_command_records').insert(slice).select('id,title,module_key,record_type')
      if (error) throw error
      insertedRecords.push(...(data || []))
    }

    const entityRows = entities.map((entity, idx) => ({ ...entity, central_record_id: insertedRecords[idx]?.id || null }))
    for (let i = 0; i < entityRows.length; i += 100) {
      const slice = entityRows.slice(i, i + 100)
      const { error } = await supabase.from('revenue_command_recovered_entities').upsert(slice, { onConflict: 'batch_key,storage_key,entity_type,external_id' })
      if (error) throw error
    }

    await supabase.from('revenue_command_action_logs').insert({
      module_key: 'recovery',
      page_key: 'revenue-command-center/recovery-import',
      action_key: 'staff_browser_recovery_imported',
      selected_count: insertedRecords.length,
      payload: { batchKey: BATCH_KEY, storageKeys: Object.keys(payload), insertedRecords: insertedRecords.length },
      status: 'completed',
    })

    return NextResponse.json({ ok: true, batchKey: BATCH_KEY, insertedRecords: insertedRecords.length, recoveredEntities: entityRows.length, storageKeys: Object.keys(payload) })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Recovery import failed. Confirm the SQL migration was run first.' }, { status: 500 })
  }
}
