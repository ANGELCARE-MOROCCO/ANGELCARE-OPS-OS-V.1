import 'server-only'
import { randomUUID } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { requireAngelcare360Permission } from '@/lib/angelcare360/server/context'

type DatabaseClient = Awaited<ReturnType<typeof createClient>>

type CommandOptions<T> = {
  commandKey: string
  idempotencyKey: string
  permission: string
  schoolId?: string | null
  resourceType?: string
  resourceId?: string | null
  request?: Record<string, unknown>
  execute: (context: { client: DatabaseClient; schoolId: string; userId: string; correlationId: string }) => Promise<T>
}

export async function executeAngelcare360EnterpriseCommand<T>(options: CommandOptions<T>) {
  const access = await requireAngelcare360Permission(options.permission, { schoolId: options.schoolId || null, operation: options.commandKey })
  const schoolId = String(access.school!.id)
  const userId = String(access.user.id)
  const client = await createClient()
  const correlationId = randomUUID()

  const existing = await client
    .from('angelcare360_enterprise_commands')
    .select('id,state,result_json,failure_code,failure_message,correlation_id')
    .eq('school_id', schoolId)
    .eq('idempotency_key', options.idempotencyKey)
    .limit(1)
    .maybeSingle()
  if (existing.error) throw new Error(existing.error.message)
  if (existing.data) {
    if (existing.data.state === 'succeeded') return { replayed: true as const, result: existing.data.result_json as T, correlationId: String(existing.data.correlation_id) }
    if (existing.data.state === 'executing') throw new Error('Cette opération est déjà en cours.')
    if (existing.data.state === 'failed' || existing.data.state === 'rejected') throw new Error(existing.data.failure_message || 'Une tentative antérieure a échoué.')
  }

  const created = await client
    .from('angelcare360_enterprise_commands')
    .insert({
      school_id: schoolId,
      actor_app_user_id: userId,
      command_key: options.commandKey,
      idempotency_key: options.idempotencyKey,
      resource_type: options.resourceType || null,
      resource_id: options.resourceId || null,
      request_json: options.request || {},
      state: 'executing',
      correlation_id: correlationId,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (created.error || !created.data) {
    // Concurrent identical requests converge on the unique idempotency key.
    if (created.error?.code === '23505') return executeAngelcare360EnterpriseCommand(options)
    throw new Error(created.error?.message || 'Le reçu de commande n’a pas pu être créé.')
  }
  const commandId = String(created.data.id)

  try {
    const result = await options.execute({ client, schoolId, userId, correlationId })
    const finished = await client
      .from('angelcare360_enterprise_commands')
      .update({ state: 'succeeded', result_json: result, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('school_id', schoolId)
      .eq('id', commandId)
    if (finished.error) throw new Error(`La commande a réussi mais son reçu n’a pas été clôturé: ${finished.error.message}`)
    return { replayed: false as const, result, correlationId }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Échec de la commande.'
    await client
      .from('angelcare360_enterprise_commands')
      .update({ state: 'failed', failure_code: 'COMMAND_EXECUTION_FAILED', failure_message: message, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('school_id', schoolId)
      .eq('id', commandId)
    throw error
  }
}

export async function enqueueAngelcare360BackgroundJob(input: {
  schoolId: string
  jobType: string
  idempotencyKey: string
  payload: Record<string, unknown>
  priority?: number
  createdBy?: string | null
  runAfter?: string | null
}) {
  const client = await createClient()
  const { data, error } = await client.from('angelcare360_background_jobs').upsert({
    school_id: input.schoolId,
    job_type: input.jobType,
    idempotency_key: input.idempotencyKey,
    payload_json: input.payload,
    priority: input.priority ?? 50,
    run_after: input.runAfter || new Date().toISOString(),
    created_by: input.createdBy || null,
    state: 'queued',
  }, { onConflict: 'school_id,job_type,idempotency_key', ignoreDuplicates: true }).select('id,state').single()
  if (error && error.code !== '23505') throw new Error(error.message)
  return data || null
}

function workflowTransitionAllowed(schema: unknown, fromState: string, toState: string, transitionKey: string): boolean {
  const from = String(fromState || '').trim()
  const to = String(toState || '').trim()
  const key = String(transitionKey || '').trim()
  if (!from || !to) return false
  if (Array.isArray(schema)) {
    return schema.some((item) => {
      if (typeof item === 'string') return item === `${from}->${to}` || item === to || item === key
      if (!item || typeof item !== 'object' || Array.isArray(item)) return false
      const row = item as Record<string, unknown>
      const declaredFrom = String(row.from_state ?? row.from ?? row.source ?? '').trim()
      const declaredTo = String(row.to_state ?? row.to ?? row.target ?? '').trim()
      const declaredKey = String(row.transition_key ?? row.key ?? row.id ?? '').trim()
      const fromOk = !declaredFrom || declaredFrom === '*' || declaredFrom === from
      const toOk = declaredTo === to
      const keyOk = !declaredKey || declaredKey === key
      return fromOk && toOk && keyOk
    })
  }
  if (schema && typeof schema === 'object') {
    const record = schema as Record<string, unknown>
    const value = record[from] ?? record['*']
    if (Array.isArray(value)) return value.some((entry) => typeof entry === 'string' ? entry === to || entry === key : workflowTransitionAllowed([entry], from, to, key))
    if (value && typeof value === 'object') {
      const target = (value as Record<string, unknown>)[to]
      return target === true || target === key || Boolean(target && typeof target === 'object')
    }
  }
  return false
}

export async function transitionAngelcare360Workflow(input: {
  schoolId: string
  workflowInstanceId: string
  transitionKey: string
  toState: string
  actorAppUserId: string
  reason?: string | null
  metadata?: Record<string, unknown>
}) {
  const client = await createClient()
  const current = await client.from('angelcare360_workflow_instances').select('id,definition_id,workflow_key,current_state,status').eq('school_id', input.schoolId).eq('id', input.workflowInstanceId).eq('status', 'active').limit(1).maybeSingle()
  if (current.error || !current.data) throw new Error('Workflow actif introuvable.')
  if (!current.data.definition_id) throw new Error('Workflow sans définition gouvernée: transition refusée.')
  const definition = await client.from('angelcare360_workflow_definitions').select('id,workflow_key,version,transition_schema,status').eq('school_id', input.schoolId).eq('id', current.data.definition_id).eq('status', 'active').limit(1).maybeSingle()
  if (definition.error || !definition.data) throw new Error('Définition active du workflow introuvable.')
  if (!workflowTransitionAllowed(definition.data.transition_schema, String(current.data.current_state), input.toState, input.transitionKey)) {
    throw new Error(`Transition non autorisée: ${current.data.current_state} → ${input.toState}.`)
  }
  const now = new Date().toISOString()
  const terminal = ['completed','approved','rejected','cancelled'].includes(input.toState)
  const updated = await client.from('angelcare360_workflow_instances').update({
    current_state: input.toState,
    status: terminal ? (input.toState === 'cancelled' ? 'cancelled' : 'completed') : 'active',
    completed_at: terminal ? now : null,
    updated_at: now,
  }).eq('school_id', input.schoolId).eq('id', input.workflowInstanceId).eq('current_state', current.data.current_state).eq('status','active').select('id,current_state,status').maybeSingle()
  if (updated.error) throw new Error(updated.error.message)
  if (!updated.data) throw new Error('Le workflow a changé entre-temps. Rechargez avant de recommencer.')
  const transition = await client.from('angelcare360_workflow_transitions').insert({
    school_id: input.schoolId,
    workflow_instance_id: input.workflowInstanceId,
    from_state: current.data.current_state,
    to_state: input.toState,
    transition_key: input.transitionKey,
    reason: input.reason || null,
    actor_app_user_id: input.actorAppUserId,
    metadata_json: { ...(input.metadata || {}), workflow_key: current.data.workflow_key, definition_version: definition.data.version },
    occurred_at: now,
  })
  if (transition.error) {
    const rollback = await client.from('angelcare360_workflow_instances').update({ current_state: current.data.current_state, status:'active', completed_at:null, updated_at:new Date().toISOString() }).eq('school_id',input.schoolId).eq('id',input.workflowInstanceId).eq('current_state',input.toState).select('id').maybeSingle()
    if (rollback.error || !rollback.data) throw new Error(`Transition non journalisée et compensation impossible: ${transition.error.message}`)
    throw new Error(`Transition annulée car le journal de workflow n’a pas pu être écrit: ${transition.error.message}`)
  }
  return { fromState: current.data.current_state, toState: input.toState }
}
