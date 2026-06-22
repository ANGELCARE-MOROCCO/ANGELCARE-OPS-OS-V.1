import { NextRequest, NextResponse } from 'next/server'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'

type AnyRow = Record<string, any>

async function guard(action: 'create' = 'create') {
  const db = await getServerB2BDatabaseClient()
  const actor = await getCurrentB2BAppUser()

  if (!actor?.id) {
    return {
      ok: false as const,
      db,
      actor,
      response: NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 }),
    }
  }

  const permission = requireB2BPermission(action, {
    actorId: actor.id,
    actorRole: actor.role || actor.role_key,
    permissions: actor.permissions,
  })

  if (!permission.ok) {
    return {
      ok: false as const,
      db,
      actor,
      response: NextResponse.json({ ok: false, error: permission.error }, { status: permission.status }),
    }
  }

  return { ok: true as const, db, actor }
}

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

function pick(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const value = clean(row[key])
    if (value) return value
  }
  return ''
}

function normalizeStatus(value: string) {
  const raw = value.toLowerCase().trim()
  const map: Record<string, string> = {
    todo: 'todo',
    'to do': 'todo',
    'à faire': 'todo',
    planned: 'planned',
    planifiee: 'planned',
    planifiée: 'planned',
    in_progress: 'in_progress',
    'in progress': 'in_progress',
    encours: 'in_progress',
    'en cours': 'in_progress',
    waiting: 'waiting',
    attente: 'waiting',
    'en attente': 'waiting',
    done: 'done',
    termine: 'done',
    terminée: 'done',
    completed: 'done',
    blocked: 'blocked',
    bloquee: 'blocked',
    bloquée: 'blocked',
  }

  return map[raw] || 'todo'
}

function normalizePriority(value: string) {
  const raw = value.toLowerCase().trim()
  const map: Record<string, string> = {
    low: 'low',
    basse: 'low',
    normal: 'normal',
    medium: 'normal',
    moyenne: 'normal',
    high: 'high',
    haute: 'high',
    urgent: 'urgent',
    urgente: 'urgent',
  }

  return map[raw] || 'normal'
}

function toIsoOrNull(value: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function buildDescription(row: AnyRow) {
  const objective = pick(row, ['objective', 'objectif', 'description'])
  const nextAction = pick(row, ['next_action', 'next action', 'action_suivante'])
  const notes = pick(row, ['notes', 'note', 'comments', 'commentaires'])
  const prospectName = pick(row, ['prospect_name', 'prospect', 'account', 'company_name', 'client'])
  const assigneeName = pick(row, ['assignee_name', 'owner', 'assignee', 'assigned_to_name'])

  return [
    objective ? `Objective: ${objective}` : '',
    nextAction ? `Next action: ${nextAction}` : '',
    notes ? `Notes: ${notes}` : '',
    prospectName ? `Imported prospect/account: ${prospectName}` : '',
    assigneeName ? `Imported owner/assignee: ${assigneeName}` : '',
  ].filter(Boolean).join('\n\n') || null
}

function normalizeRowKeys(row: AnyRow) {
  const normalized: AnyRow = {}

  for (const [key, value] of Object.entries(row || {})) {
    const normalizedKey = key
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/-/g, '_')

    normalized[normalizedKey] = value
  }

  return normalized
}

export async function POST(req: NextRequest) {
  try {
    const g = await guard('create')
    if (!g.ok) return g.response

    const body = await req.json()
    const incomingRows = Array.isArray(body?.rows) ? body.rows : Array.isArray(body?.tasks) ? body.tasks : []

    if (!incomingRows.length) {
      return NextResponse.json({ ok: false, error: 'No CSV rows received.' }, { status: 400 })
    }

    if (incomingRows.length > 500) {
      return NextResponse.json({ ok: false, error: 'Maximum 500 tasks per import.' }, { status: 400 })
    }

    const { data: prospects } = await g.db.from('b2b_prospects').select('*').limit(2000)
    const prospectByName = new Map<string, string>()

    for (const prospect of prospects || []) {
      const id = clean(prospect.id)
      if (!id) continue

      for (const key of ['name', 'prospect_name', 'company_name', 'account_name', 'organization', 'client_name']) {
        const value = clean(prospect[key])
        if (value) prospectByName.set(value.toLowerCase(), id)
      }
    }

    const report: Array<{ row: number; ok: boolean; title?: string; error?: string; id?: string }> = []
    const created: AnyRow[] = []

    for (let index = 0; index < incomingRows.length; index += 1) {
      const rowNumber = index + 2
      const row = normalizeRowKeys(incomingRows[index])

      const title = pick(row, ['title', 'task_title', 'task', 'name', 'subject'])
      if (!title) {
        report.push({ row: rowNumber, ok: false, error: 'Missing required title.' })
        continue
      }

      const prospectIdFromCsv = pick(row, ['prospect_id', 'account_id'])
      const prospectName = pick(row, ['prospect_name', 'prospect', 'account', 'company_name', 'client'])
      const prospectId = prospectIdFromCsv || (prospectName ? prospectByName.get(prospectName.toLowerCase()) || null : null)

      const status = normalizeStatus(pick(row, ['status', 'task_status']))
      const priority = normalizePriority(pick(row, ['priority', 'urgency']))
      const startAt = toIsoOrNull(pick(row, ['start_at', 'start', 'start_date', 'starts_at']))
      const dueDate = toIsoOrNull(pick(row, ['due_at', 'due_date', 'deadline', 'end_at', 'end_date']))
      const nextAction = pick(row, ['next_action', 'next action', 'action_suivante'])
      const notes = pick(row, ['notes', 'note', 'comments', 'commentaires'])

      const basePayload: AnyRow = {
        title,
        task_type: pick(row, ['task_type', 'type']) || 'B2B execution',
        prospect_id: prospectId,
        assigned_to: pick(row, ['assigned_to', 'owner_id', 'assignee_id']) || g.actor.id,
        priority,
        status,
        due_date: dueDate,
        description: buildDescription(row),
        created_by: g.actor.id,
        completed_at: status === 'done' ? new Date().toISOString() : null,
      }

      const extendedPayload: AnyRow = {
        ...basePayload,
        start_at: startAt,
        next_action: nextAction || null,
        completion_notes: notes || null,
      }

      let insertPayload = extendedPayload
      let inserted: AnyRow | null = null
      let insertError: any = null

      const first = await g.db.from('b2b_tasks').insert(insertPayload).select('*').single()
      inserted = first.data
      insertError = first.error

      if (insertError) {
        const retry = await g.db.from('b2b_tasks').insert(basePayload).select('*').single()
        inserted = retry.data
        insertError = retry.error
      }

      if (insertError || !inserted) {
        console.error('[B2B_TASKS_IMPORT_ROW_FAILED]', { row: rowNumber, error: insertError })
        report.push({ row: rowNumber, ok: false, title, error: insertError?.message || 'Unable to create task.' })
        continue
      }

      created.push(inserted)
      report.push({ row: rowNumber, ok: true, title, id: inserted.id })
    }

    return NextResponse.json({
      ok: true,
      createdCount: created.length,
      failedCount: report.filter((item) => !item.ok).length,
      data: created,
      report,
    }, { status: 201 })
  } catch (error) {
    console.error('[B2B_TASKS_IMPORT_CRASHED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to import B2B tasks.' }, { status: 500 })
  }
}
