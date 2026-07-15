import { NextRequest, NextResponse } from 'next/server'
import { createResource, listResource, logActivity } from '@/lib/capital-command-center/tasks-store'
import { ac360GuardBlockedResponse, buildAc360IdempotencyKey, runAc360WiredAction } from '@/lib/ac360/action-wiring'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AnyRecord = Record<string, any>

const ALLOWED_TASK_FIELDS = new Set([
  'tenant_id','project_id','cycle_id','module_id','title','description','department','workspace','status','priority','assignee_id','assignee_name','created_by','created_by_name','start_date','due_date','completed_at','estimate_points','tags','labels','related_entity_type','related_entity_id','investor_name','partner_name','client_name','fundraising_stage','capital_impact','risk_level','blocker_reason','evidence_url','completion_notes','metadata',
])
const VALID_STATUSES = new Set(['backlog','planned','in_progress','waiting','blocked','needs_review','completed','cancelled'])
const VALID_PRIORITIES = new Set(['critical','high','medium','low'])
const VALID_RISKS = new Set(['normal','watch','high','critical'])

function trimString(value: unknown) {
  return typeof value === 'string' ? value.trim() : value
}

function cleanArray(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  if (typeof value === 'string') return value.split(/[;,]/).map((item) => item.trim()).filter(Boolean)
  return []
}

function isPlainObject(value: unknown): value is AnyRecord {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isIsoDate(value: unknown) {
  const text = String(value || '').trim()
  if (!text) return true
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false
  const date = new Date(`${text}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text
}

async function nameLookup() {
  const [projects, cycles, modules] = await Promise.all([
    listResource('projects' as any).catch(() => []),
    listResource('cycles' as any).catch(() => []),
    listResource('modules' as any).catch(() => []),
  ])
const mapByName = (rows: AnyRecord[]): Map<string, AnyRecord> => {
    const entries: Array<[string, AnyRecord]> = []

    for (const row of rows) {
      const name = String(row.name || '').trim().toLowerCase()
      if (name) {
        entries.push([name, row])
      }
    }

    return new Map<string, AnyRecord>(entries)
  }
  return { projects: mapByName(projects as AnyRecord[]), cycles: mapByName(cycles as AnyRecord[]), modules: mapByName(modules as AnyRecord[]) }
}

function normalizeIncomingTask(row: AnyRecord, lookups: Awaited<ReturnType<typeof nameLookup>>, defaults: AnyRecord, importBatchId: string, filename: string, rowNumber: number) {
  const failed: string[] = []
  const payload: AnyRecord = {}
  const metadata: AnyRecord = isPlainObject(row.metadata) ? { ...row.metadata } : {}

  for (const [key, raw] of Object.entries(row)) {
    if (!ALLOWED_TASK_FIELDS.has(key) && !['project','cycle','module'].includes(key)) continue
    if (['project','cycle','module'].includes(key)) continue
    if (key === 'tags' || key === 'labels') payload[key] = cleanArray(raw)
    else if (key === 'estimate_points') payload[key] = Number.isFinite(Number(raw)) ? Math.trunc(Number(raw)) : 0
    else if (key === 'metadata') Object.assign(metadata, isPlainObject(raw) ? raw : {})
    else payload[key] = trimString(raw)
  }

  if (!payload.title || !String(payload.title).trim()) failed.push('title is required')
  if (payload.start_date && !isIsoDate(payload.start_date)) failed.push('invalid start_date')
  if (payload.due_date && !isIsoDate(payload.due_date)) failed.push('invalid due_date')

  payload.status = VALID_STATUSES.has(String(payload.status || '')) ? payload.status : 'backlog'
  payload.priority = VALID_PRIORITIES.has(String(payload.priority || '')) ? payload.priority : 'medium'
  payload.risk_level = VALID_RISKS.has(String(payload.risk_level || '')) ? payload.risk_level : 'normal'
  payload.workspace = payload.workspace || defaults.workspace || 'Capital Command'
  payload.department = payload.department || defaults.department || null

  if (!payload.project_id && defaults.project_id) payload.project_id = defaults.project_id
  if (!payload.cycle_id && defaults.cycle_id) payload.cycle_id = defaults.cycle_id
  if (!payload.module_id && defaults.module_id) payload.module_id = defaults.module_id

  const projectName = String(row.project || '').trim()
  const cycleName = String(row.cycle || '').trim()
  const moduleName = String(row.module || '').trim()
  if (!payload.project_id && projectName) {
    const matched = lookups.projects.get(projectName.toLowerCase())
    if (matched) payload.project_id = matched
    else metadata.import_project_name = projectName
  }
  if (!payload.cycle_id && cycleName) {
    const matched = lookups.cycles.get(cycleName.toLowerCase())
    if (matched) payload.cycle_id = matched
    else metadata.import_cycle_name = cycleName
  }
  if (!payload.module_id && moduleName) {
    const matched = lookups.modules.get(moduleName.toLowerCase())
    if (matched) payload.module_id = matched
    else metadata.import_module_name = moduleName
  }

  metadata.import_batch_id = importBatchId
  metadata.import_source_filename = filename || null
  metadata.imported_at = new Date().toISOString()
  metadata.import_row_number = rowNumber
  payload.metadata = metadata

  if (payload.status === 'completed' && !payload.completed_at) payload.completed_at = new Date().toISOString()
  return { payload, failed }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const rows = Array.isArray(body?.tasks) ? body.tasks : []
    if (!rows.length) return NextResponse.json({ ok: false, error: 'No tasks provided for import' }, { status: 400 })
    if (rows.length > 500) return NextResponse.json({ ok: false, error: 'Import limit is 500 tasks per CSV.' }, { status: 400 })

    const defaults = isPlainObject(body?.defaults) ? body.defaults : {}
    const importBatchId = String(body?.import_batch_id || `tasks_csv_${Date.now()}`).slice(0, 120)
    const filename = String(body?.filename || '').slice(0, 240)

    const guarded = await runAc360WiredAction('capital.tasks.import', async () => {
      const lookups = await nameLookup()
      const inserted: AnyRecord[] = []
      const failed: AnyRecord[] = []

      for (let i = 0; i < rows.length; i++) {
        const row = isPlainObject(rows[i]) ? rows[i] : {}
        const normalized = normalizeIncomingTask(row, lookups, defaults, importBatchId, filename, i + 2)
        if (normalized.failed.length) {
          failed.push({ row: i + 2, error: normalized.failed.join(', ') })
          continue
        }
        try {
          const created = await createResource('tasks', normalized.payload)
          inserted.push(created)
          await logActivity({
            action: 'task.imported',
            task_id: created?.id,
            actor_name: 'Tasks CSV Import',
            after: { id: created?.id, title: created?.title, import_batch_id: importBatchId, filename, row: i + 2, ac360_guarded: true },
          })
        } catch (error: any) {
          failed.push({ row: i + 2, title: row.title || null, error: error?.message || 'Insert failed' })
        }
      }

      return { inserted_count: inserted.length, failed_count: failed.length, inserted, failed, import_batch_id: importBatchId }
    }, {
      orgId: body.orgId || body.org_id,
      quantity: rows.length,
      idempotencyKey: body.idempotencyKey || body.idempotency_key || buildAc360IdempotencyKey('capital.tasks.import', `${importBatchId}:${rows.length}`),
      metadata: { importBatchId, filename, rowCount: rows.length, source: 'api.capital-command-center.tasks.import.POST' },
    })

    if (!guarded.ok) return ac360GuardBlockedResponse(guarded)
    return NextResponse.json({ ok: true, data: guarded.data, ac360: { guard: guarded.guard, usage: guarded.usage } })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to import tasks' }, { status: 500 })
  }
}
