import {
  CANONICAL_TABLE_COLUMNS,
  COLUMN_ALIASES,
  DROP_FILTERS,
  INSERT_DEFAULTS,
  MISSING_RPC_SHIMS,
  RELATION_ALIASES,
  RESPONSE_DEFAULTS,
  SPECIAL_RELATION_RULES,
  TABLE_SINKS,
} from './canonical-contract-runtime'

type AnyRecord = Record<string, any>
type AnyClient = any

type RelationContext = {
  logical: string
  physical: string
  sink?: string
  scope?: Record<string, unknown>
}

const WRAPPED = Symbol.for('angelcare.supabase.contract.wrapped')
const FILTER_METHODS = new Set([
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in',
  'contains', 'containedBy', 'rangeGt', 'rangeGte', 'rangeLt', 'rangeLte',
  'filter',
])

function asObject(value: unknown): AnyRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as AnyRecord : {}
}

function isUuid(value: unknown): boolean {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function canonicalColumns(table: string): Set<string> {
  return new Set<string>((CANONICAL_TABLE_COLUMNS as AnyRecord)[table] || [])
}

function relationContext(logical: string): RelationContext {
  const alias = (RELATION_ALIASES as AnyRecord)[logical] as AnyRecord | undefined
  const physical = alias?.table || logical
  return {
    logical,
    physical,
    sink: alias?.sink || (TABLE_SINKS as AnyRecord)[physical] || (TABLE_SINKS as AnyRecord)[logical] || undefined,
    scope: alias?.scope || undefined,
  }
}

function columnAlias(ctx: RelationContext, column: string): string | null | undefined {
  const logicalMap = (COLUMN_ALIASES as AnyRecord)[ctx.logical] as AnyRecord | undefined
  if (logicalMap && Object.prototype.hasOwnProperty.call(logicalMap, column)) return logicalMap[column]
  const physicalMap = (COLUMN_ALIASES as AnyRecord)[ctx.physical] as AnyRecord | undefined
  if (physicalMap && Object.prototype.hasOwnProperty.call(physicalMap, column)) return physicalMap[column]
  return undefined
}

function shouldDropFilter(ctx: RelationContext, column: string): boolean {
  const logical = ((DROP_FILTERS as AnyRecord)[ctx.logical] || []) as string[]
  const physical = ((DROP_FILTERS as AnyRecord)[ctx.physical] || []) as string[]
  return logical.includes(column) || physical.includes(column)
}

function mapFilterValue(ctx: RelationContext, logicalColumn: string, value: unknown): unknown {
  const special = (SPECIAL_RELATION_RULES as AnyRecord)[ctx.logical] as AnyRecord | undefined
  if (ctx.logical === 'hr_employee_360_idempotency' && logicalColumn === 'employee_id' && special?.scopePrefix) {
    return `${special.scopePrefix}${String(value ?? '')}`
  }
  return value
}

function mapColumn(ctx: RelationContext, column: string, purpose: 'filter' | 'order' | 'select' | 'write'): string | null {
  if (!column || column === '*') return column
  const cols = canonicalColumns(ctx.physical)
  if (cols.has(column)) return column

  const alias = columnAlias(ctx, column)
  if (typeof alias === 'string' && cols.has(alias)) return alias

  if (purpose === 'filter' && shouldDropFilter(ctx, column)) return null

  if (ctx.sink && cols.has(ctx.sink)) {
    if (purpose === 'order') {
      if (cols.has('updated_at')) return 'updated_at'
      if (cols.has('created_at')) return 'created_at'
      return null
    }
    if (purpose === 'filter') return `${ctx.sink}->>${column}`
  }

  return null
}

function splitTopLevelSelect(input: string): string[] {
  const result: string[] = []
  let buffer = ''
  let depth = 0
  let quote: string | null = null

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i]
    if (quote) {
      buffer += ch
      if (ch === quote && input[i - 1] !== '\\') quote = null
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      buffer += ch
      continue
    }
    if (ch === '(' || ch === '[') depth += 1
    if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1)
    if (ch === ',' && depth === 0) {
      if (buffer.trim()) result.push(buffer.trim())
      buffer = ''
      continue
    }
    buffer += ch
  }
  if (buffer.trim()) result.push(buffer.trim())
  return result
}

function rewriteSelect(ctx: RelationContext, selection?: string): string {
  if (!selection || selection.trim() === '*' || selection.includes('(*)')) return selection || '*'
  const cols = canonicalColumns(ctx.physical)
  const out: string[] = []
  let needsSink = false

  for (const token of splitTopLevelSelect(selection)) {
    if (!token || token === '*') {
      out.push(token || '*')
      continue
    }
    if (token.includes('(') || token.includes('!')) {
      out.push(token)
      continue
    }

    const colonIndex = token.indexOf(':')
    const responseAlias = colonIndex > 0 ? token.slice(0, colonIndex).trim() : null
    const rawColumn = colonIndex > 0 ? token.slice(colonIndex + 1).trim() : token.trim()
    const clean = rawColumn.replace(/^"|"$/g, '')

    if (cols.has(clean)) {
      out.push(token)
      continue
    }

    const mapped = mapColumn(ctx, clean, 'select')
    if (mapped && !mapped.includes('->>')) {
      out.push(responseAlias ? `${responseAlias}:${mapped}` : `${clean}:${mapped}`)
      continue
    }

    if (ctx.sink && cols.has(ctx.sink)) needsSink = true
  }

  if (needsSink && ctx.sink && !out.some((value) => value === ctx.sink || value.endsWith(`:${ctx.sink}`))) {
    out.push(ctx.sink)
  }

  return out.filter(Boolean).join(',') || '*'
}

function scopePayload(ctx: RelationContext, payload: AnyRecord): AnyRecord {
  if (!ctx.scope) return payload
  return { ...ctx.scope, ...payload }
}

function defaultPayload(ctx: RelationContext, payload: AnyRecord): AnyRecord {
  const defaults = (INSERT_DEFAULTS as AnyRecord)[ctx.logical] || {}
  const result = { ...defaults, ...payload }

  if (ctx.logical === 'hr_training_course_assignments' || ctx.logical === 'hr_training_course_command_extensions') {
    result.title ||= result.training_title || result.course_title || result.position_title || 'Assigned training'
    result.staff_id ||= result.employee_id || null
  }
  if (ctx.logical === 'intervention_config_items') {
    result.config_group ||= result.scope || 'intervention'
    result.config_key ||= result.code || result.item_key || 'item'
    result.label ||= result.config_key
    result.sort_order ??= 100
    result.is_active ??= true
  }
  if (ctx.logical === 'b2b_workspace_settings') {
    result.config_key ||= result.workspace_key || 'global'
    result.label ||= 'B2B Workspace Settings'
  }
  if (ctx.logical === 'ac_capital_command_activity') {
    result.command_key ||= result.client_action_id || `activity-${Date.now()}`
    result.workspace_key ||= 'ac-capital-os'
    result.status ||= 'completed'
  }
  if (ctx.logical === 'hr_employee_360_idempotency') {
    const special = (SPECIAL_RELATION_RULES as AnyRecord)[ctx.logical] as AnyRecord | undefined
    if (result.employee_id && special?.scopePrefix) result.scope = `${special.scopePrefix}${result.employee_id}`
    result.status ||= 'completed'
  }
  if (ctx.logical === 'marketing_ai_schedules') {
    result.name ||= result.command_code || 'Market AI schedule'
    result.command_code ||= result.name || 'market-ai'
    result.frequency ||= 'manual'
    result.objective ||= 'Market AI governed schedule'
  }
  return result
}

function sanitizeOne(ctx: RelationContext, input: AnyRecord, mode: 'insert' | 'update' | 'upsert'): AnyRecord {
  const cols = canonicalColumns(ctx.physical)
  const source = mode === 'update' ? { ...input } : defaultPayload(ctx, { ...input })
  const output: AnyRecord = {}
  const extras: AnyRecord = {}

  for (const [key, value] of Object.entries(source)) {
    if (value === undefined) continue

    let target = mapColumn(ctx, key, 'write')
    if (ctx.logical === 'hr_employee_360_idempotency' && key === 'employee_id') {
      target = 'scope'
    }

    if (target && cols.has(target)) {
      let nextValue = value
      if (ctx.logical === 'hr_employee_360_idempotency' && key === 'employee_id') {
        nextValue = mapFilterValue(ctx, key, value)
      }
      if (target === ctx.sink && typeof nextValue !== 'object') {
        extras[key] = nextValue
      } else if (target === ctx.sink && nextValue && typeof nextValue === 'object' && !Array.isArray(nextValue)) {
        output[target] = { ...asObject(output[target]), ...asObject(nextValue) }
      } else {
        output[target] = nextValue
      }
      continue
    }

    if (ctx.sink && cols.has(ctx.sink)) extras[key] = value
  }

  if (ctx.sink && cols.has(ctx.sink)) {
    const existing = asObject(output[ctx.sink])
    output[ctx.sink] = {
      ...existing,
      ...extras,
      __angelcare_contract_relation: ctx.logical,
    }
  }

  // Specific production safety defaults observed in the canonical paid database.
  if (ctx.physical === 'hr_recruitment_candidates' && (!output.source || String(output.source).trim() === '')) {
    output.source = 'angelcare_saas'
  }

  return scopePayload(ctx, output)
}

function sanitizePayload(ctx: RelationContext, value: unknown, mode: 'insert' | 'update' | 'upsert'): unknown {
  if (Array.isArray(value)) return value.map((row) => sanitizeOne(ctx, asObject(row), mode))
  return sanitizeOne(ctx, asObject(value), mode)
}

function transformOne(ctx: RelationContext, row: AnyRecord): AnyRecord {
  const merged = ctx.sink && row[ctx.sink] && typeof row[ctx.sink] === 'object' && !Array.isArray(row[ctx.sink])
    ? { ...row, ...row[ctx.sink] }
    : { ...row }

  const logicalMap = (COLUMN_ALIASES as AnyRecord)[ctx.logical] as AnyRecord | undefined
  if (logicalMap) {
    for (const [oldName, newName] of Object.entries(logicalMap)) {
      if (merged[oldName] !== undefined) continue
      if (typeof newName === 'string' && merged[newName] !== undefined) merged[oldName] = merged[newName]
    }
  }

  if (ctx.logical === 'hr_employee_360_idempotency' && typeof merged.scope === 'string') {
    const prefix = ((SPECIAL_RELATION_RULES as AnyRecord)[ctx.logical] || {}).scopePrefix || ''
    if (prefix && merged.scope.startsWith(prefix)) merged.employee_id = merged.scope.slice(prefix.length)
    if (merged.response_payload === undefined) merged.response_payload = merged.result
  }
  if (ctx.logical === 'intervention_config_items') {
    merged.id ??= merged.item_key || merged.config_key
    merged.scope ??= merged.config_group
    merged.code ??= merged.config_key
  }
  if (ctx.logical === 'b2b_workspace_settings') {
    merged.workspace_key ??= merged.config_key
    merged.settings ??= merged.value
  }

  const defaults = (RESPONSE_DEFAULTS as AnyRecord)[ctx.logical] || (RESPONSE_DEFAULTS as AnyRecord)[ctx.physical] || {}
  return { ...defaults, ...merged }
}

function transformData(ctx: RelationContext, data: unknown): unknown {
  if (Array.isArray(data)) return data.map((row) => row && typeof row === 'object' ? transformOne(ctx, row as AnyRecord) : row)
  if (data && typeof data === 'object') return transformOne(ctx, data as AnyRecord)
  return data
}

function transformResponse(ctx: RelationContext, response: any): any {
  if (!response || typeof response !== 'object' || !('data' in response)) return response
  return { ...response, data: transformData(ctx, response.data) }
}

function rewriteOnConflict(ctx: RelationContext, options: AnyRecord | undefined): AnyRecord | undefined {
  if (!options?.onConflict || typeof options.onConflict !== 'string') return options
  const mapped = options.onConflict
    .split(',')
    .map((column: string) => {
      const clean = column.trim()
      if (ctx.logical === 'hr_employee_360_idempotency' && clean === 'employee_id') return 'scope'
      return mapColumn(ctx, clean, 'filter') || clean
    })
    .join(',')
  return { ...options, onConflict: mapped }
}

function applyScope(builder: any, ctx: RelationContext): any {
  if (!ctx.scope) return builder
  let next = builder
  for (const [column, value] of Object.entries(ctx.scope)) next = next.eq(column, value)
  return next
}

function rewriteOrExpression(ctx: RelationContext, expression: string): string {
  if (!expression || typeof expression !== 'string') return expression
  return expression.replace(/(^|,)([A-Za-z_][A-Za-z0-9_]*)(\.)/g, (match, prefix, column, dot) => {
    const mapped = mapColumn(ctx, column, 'filter')
    return mapped ? `${prefix}${mapped}${dot}` : match
  })
}

function wrapBuilder(builder: any, ctx: RelationContext): any {
  if (!builder || typeof builder !== 'object') return builder

  return new Proxy(builder, {
    get(target, prop, receiver) {
      if (prop === 'then') {
        return (resolve: any, reject: any) => Promise.resolve(target).then((value) => transformResponse(ctx, value)).then(resolve, reject)
      }
      if (prop === 'catch') {
        return (reject: any) => Promise.resolve(target).then((value) => transformResponse(ctx, value)).catch(reject)
      }
      if (prop === 'finally') {
        return (handler: any) => Promise.resolve(target).then((value) => transformResponse(ctx, value)).finally(handler)
      }

      const value = Reflect.get(target, prop, receiver)
      if (typeof value !== 'function') return value

      return (...args: any[]) => {
        const method = String(prop)
        let result: any

        if (method === 'select') {
          result = value.call(target, rewriteSelect(ctx, args[0]), args[1])
          result = applyScope(result, ctx)
          return wrapBuilder(result, ctx)
        }

        if (method === 'insert' || method === 'update' || method === 'upsert') {
          const mode = method as 'insert' | 'update' | 'upsert'
          const payload = sanitizePayload(ctx, args[0], mode)
          const options = method === 'upsert' ? rewriteOnConflict(ctx, args[1]) : args[1]
          result = value.call(target, payload, options)
          if (method === 'update') result = applyScope(result, ctx)
          return wrapBuilder(result, ctx)
        }

        if (method === 'delete') {
          result = value.apply(target, args)
          result = applyScope(result, ctx)
          return wrapBuilder(result, ctx)
        }

        if (FILTER_METHODS.has(method) && typeof args[0] === 'string') {
          const logicalColumn = args[0]
          const mapped = mapColumn(ctx, logicalColumn, 'filter')
          if (!mapped) return receiver
          const nextArgs = [...args]
          nextArgs[0] = mapped
          if (nextArgs.length > 1) nextArgs[nextArgs.length - 1] = mapFilterValue(ctx, logicalColumn, nextArgs[nextArgs.length - 1])
          result = value.apply(target, nextArgs)
          return wrapBuilder(result, ctx)
        }

        if (method === 'order' && typeof args[0] === 'string') {
          const mapped = mapColumn(ctx, args[0], 'order')
          if (!mapped) return receiver
          result = value.call(target, mapped, args[1])
          return wrapBuilder(result, ctx)
        }

        if (method === 'or' && typeof args[0] === 'string') {
          const nextArgs = [...args]
          nextArgs[0] = rewriteOrExpression(ctx, args[0])
          result = value.apply(target, nextArgs)
          return wrapBuilder(result, ctx)
        }

        result = value.apply(target, args)
        return result && typeof result === 'object' && typeof result.then === 'function' ? wrapBuilder(result, ctx) : result
      }
    },
  })
}

async function rpcConnectCurrentUserIds(client: AnyClient) {
  try {
    const response = await client.auth.getUser()
    const user = response?.data?.user
    return { data: user?.id ? [user.id] : [], error: null }
  } catch (error: any) {
    return { data: [], error: { message: error?.message || 'Unable to resolve current user.' } }
  }
}

async function rpcEnsureJourney(client: AnyClient, args: AnyRecord) {
  try {
    const payload = asObject(args?.p_payload)
    const staffId = isUuid(args?.p_staff_key) ? args.p_staff_key : null
    const candidateId = isUuid(args?.p_candidate_key) ? args.p_candidate_key : null

    let query = client.from('hr_onboarding_journeys').select('*').limit(1)
    if (staffId) query = query.eq('staff_id', staffId)
    else if (candidateId) query = query.eq('candidate_id', candidateId)
    else query = query.eq('email', String(payload.email || ''))

    const existing = await query.maybeSingle()
    if (existing?.data) {
      return { data: { ok: true, journeyKey: existing.data.id, taskCount: 0, documentCount: 0 }, error: null }
    }

    const inserted = await client.from('hr_onboarding_journeys').insert({
      title: payload.title || 'Onboarding journey',
      position: payload.position || null,
      department: payload.department || null,
      start_date: payload.startDate || null,
      manager: payload.manager || null,
      employment_type: payload.employmentType || null,
      email: payload.email || null,
      phone: payload.phone || null,
      owner: payload.owner || null,
      notes: payload.notes || null,
      staff_id: staffId,
      candidate_id: candidateId,
      status: 'In Progress',
      stage: 'preboarding',
      updated_at: new Date().toISOString(),
    }).select('*').single()

    if (inserted.error) return { data: null, error: inserted.error }
    return { data: { ok: true, journeyKey: inserted.data.id, taskCount: 0, documentCount: 0 }, error: null }
  } catch (error: any) {
    return { data: null, error: { message: error?.message || 'Unable to ensure onboarding journey.' } }
  }
}

function cleanPatch(input: AnyRecord, mapping: Record<string, string>): AnyRecord {
  const output: AnyRecord = {}
  for (const [key, target] of Object.entries(mapping)) {
    const value = input[key]
    if (value !== undefined && value !== null) output[target] = value
  }
  return output
}

async function rpcOnboardingExecute(client: AnyClient, args: AnyRecord) {
  const operation = String(args?.p_operation || '')
  const payload = asObject(args?.p_payload)
  try {
    const now = new Date().toISOString()

    if (operation === 'journey.create') {
      return rpcEnsureJourney(client, {
        p_staff_key: payload.staffKey,
        p_candidate_key: payload.candidateKey,
        p_payload: payload,
      })
    }

    if (operation.startsWith('journey.')) {
      const id = payload.journeyKey
      if (!id) return { data: null, error: { message: 'ONBOARDING_JOURNEY_KEY_REQUIRED' } }
      const patch = cleanPatch(payload, {
        title: 'title', position: 'position', department: 'department', startDate: 'start_date', manager: 'manager',
        location: 'location', employmentType: 'employment_type', email: 'email', phone: 'phone', owner: 'owner', notes: 'notes',
        targetPhase: 'stage', progress: 'progress',
      })
      if (operation === 'journey.archive') {
        patch.status = 'Archived'
        patch.notes = [patch.notes, payload.reason].filter(Boolean).join(' · ')
      } else if (operation === 'journey.activate') patch.status = 'In Progress'
      else if (operation === 'journey.complete') { patch.status = 'Completed'; patch.progress = 100 }
      patch.updated_at = now
      const result = await client.from('hr_onboarding_journeys').update(patch).eq('id', id).select('*').single()
      return result.error ? { data: null, error: result.error } : { data: { ok: true, record: result.data, message: 'Parcours onboarding enregistré.' }, error: null }
    }

    if (operation.startsWith('task.')) {
      const id = payload.taskKey
      if (operation === 'task.create') {
        const row = {
          onboarding_id: isUuid(payload.journeyKey) ? payload.journeyKey : null,
          title: payload.title,
          category: payload.groupName || 'general',
          stage: payload.phase || 'preboarding',
          status: payload.status || 'pending',
          priority: payload.priority || 'normal',
          due_at: payload.dueAt || null,
          notes: payload.notes || null,
          owner: payload.owner || null,
          created_at: now,
          updated_at: now,
          metadata: payload,
        }
        const result = await client.from('hr_onboarding_tasks').insert(row).select('*').single()
        return result.error ? { data: null, error: result.error } : { data: { ok: true, record: result.data }, error: null }
      }
      const patch = cleanPatch(payload, { title: 'title', groupName: 'category', phase: 'stage', status: 'status', priority: 'priority', dueAt: 'due_at', notes: 'notes', owner: 'owner', evidenceUrl: 'evidence_url' })
      if (operation === 'task.archive') patch.status = 'archived'
      patch.updated_at = now
      const result = await client.from('hr_onboarding_tasks').update(patch).eq('id', id).select('*').single()
      return result.error ? { data: null, error: result.error } : { data: { ok: true, record: result.data }, error: null }
    }

    if (operation.startsWith('document.')) {
      const id = payload.documentKey
      if (operation === 'document.create') {
        const row = {
          journey_id: String(payload.journeyKey || ''),
          onboarding_id: isUuid(payload.journeyKey) ? payload.journeyKey : null,
          title: payload.title,
          document_type: payload.documentType || payload.category || null,
          status: payload.status || 'requested',
          due_date: payload.dueDate || null,
          notes: payload.notes || null,
          created_at: now,
        }
        const result = await client.from('hr_onboarding_documents').insert(row).select('*').single()
        return result.error ? { data: null, error: result.error } : { data: { ok: true, record: result.data }, error: null }
      }
      const patch: AnyRecord = cleanPatch(payload, { title: 'title', documentType: 'document_type', status: 'status', dueDate: 'due_date', notes: 'notes', storagePath: 'file_url' })
      if (operation === 'document.archive') patch.status = 'archived'
      const result = await client.from('hr_onboarding_documents').update(patch).eq('id', id).select('*').single()
      return result.error ? { data: null, error: result.error } : { data: { ok: true, record: result.data }, error: null }
    }

    if (operation === 'activity.create') {
      const result = await client.from('hr_onboarding_activity').insert({
        journey_id: String(payload.journeyKey || ''),
        onboarding_id: isUuid(payload.journeyKey) ? payload.journeyKey : null,
        type: payload.type || 'note',
        status: payload.status || 'recorded',
        title: payload.title || 'Onboarding activity',
        body: payload.body || null,
        notes: payload.body || null,
        created_at: now,
      }).select('*').single()
      return result.error ? { data: null, error: result.error } : { data: { ok: true, record: result.data }, error: null }
    }

    if (operation.startsWith('checklist.')) {
      if (operation === 'checklist.create') {
        const result = await client.from('hr_onboarding_checklists').insert({
          name: payload.name || 'Onboarding checklist',
          checklist: Array.isArray(payload.items) ? payload.items : [],
          status: 'open',
          role_key: payload.roleKey || null,
          department_id: isUuid(payload.departmentKey) ? payload.departmentKey : null,
          notes: payload.notes || null,
          created_at: now,
          updated_at: now,
        }).select('*').single()
        return result.error ? { data: null, error: result.error } : { data: { ok: true, record: result.data }, error: null }
      }
      const id = payload.checklistKey
      const patch: AnyRecord = { updated_at: now }
      if (payload.name !== undefined) patch.name = payload.name
      if (payload.items !== undefined) patch.checklist = payload.items
      if (payload.notes !== undefined) patch.notes = payload.notes
      if (operation === 'checklist.archive') patch.status = 'archived'
      const result = await client.from('hr_onboarding_checklists').update(patch).eq('id', id).select('*').single()
      return result.error ? { data: null, error: result.error } : { data: { ok: true, record: result.data }, error: null }
    }

    return { data: null, error: { message: `Unsupported canonical onboarding operation: ${operation}` } }
  } catch (error: any) {
    return { data: null, error: { message: error?.message || `Onboarding operation failed: ${operation}` } }
  }
}

async function runRpcShim(client: AnyClient, fn: string, args: AnyRecord | undefined) {
  if (fn === 'connect_current_user_ids') return rpcConnectCurrentUserIds(client)
  if (fn === 'hr_onboarding_ensure_journey') return rpcEnsureJourney(client, args || {})
  if (fn === 'hr_onboarding_execute') return rpcOnboardingExecute(client, args || {})
  return null
}

export function wrapSupabaseClient<T>(client: T): T {
  const raw = client as AnyClient
  if (!raw || typeof raw !== 'object' || raw[WRAPPED]) return client

  return new Proxy(raw, {
    get(target, prop, receiver) {
      if (prop === WRAPPED) return true
      if (prop === 'from') {
        return (logical: string) => {
          const ctx = relationContext(logical)
          const alias = (RELATION_ALIASES as AnyRecord)[logical] as AnyRecord | undefined
          const hasCanonicalCompatibilityContract = canonicalColumns(ctx.physical).size > 0

          // V1.1 safety rule:
          // Relations that are NOT explicitly part of the compatibility contract
          // must behave exactly like native Supabase. Never sanitize a valid,
          // untouched production table into an empty/partial payload.
          if (!alias && !hasCanonicalCompatibilityContract) {
            return target.from(logical)
          }

          return wrapBuilder(target.from(ctx.physical), ctx)
        }
      }
      if (prop === 'rpc') {
        return (fn: string, args?: AnyRecord, options?: AnyRecord) => {
          if ((MISSING_RPC_SHIMS as readonly string[]).includes(fn)) return runRpcShim(target, fn, args)
          return target.rpc(fn, args, options)
        }
      }
      const value = Reflect.get(target, prop, receiver)
      return typeof value === 'function' ? value.bind(target) : value
    },
  }) as T
}
