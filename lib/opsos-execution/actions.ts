'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'

function s(formData: FormData, key: string, fallback = ''): string {
  const out = String(formData.get(key) || '').trim()
  return out || fallback
}

function n(formData: FormData, key: string, fallback = 0): number {
  const value = Number(formData.get(key))
  return Number.isFinite(value) ? value : fallback
}

async function logSync(eventType: string, source: string, target: string, summary: string) {
  const supabase = await createClient()
  await supabase.from('opsos_sync_events').insert([{ event_type: eventType, source_module: source, target_module: target, status: 'ok', summary }])
}

export async function createOpsosWorkflow(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const payload = {
    title: s(formData, 'title'),
    module_key: s(formData, 'module_key', 'global'),
    workflow_type: s(formData, 'workflow_type', 'general'),
    status: s(formData, 'status', 'open'),
    priority: s(formData, 'priority', 'medium'),
    owner: user?.id || null,
    current_step: s(formData, 'current_step', 'created'),
    progress: n(formData, 'progress', 5),
    source_route: s(formData, 'source_route', '/enterprise-command'),
    target_route: s(formData, 'target_route', '/execution-engine'),
    notes: s(formData, 'notes'),
  }

  const { error } = await supabase.from('opsos_workflows').insert([payload])
  if (error) throw new Error(error.message)

  await logSync('workflow_created', payload.module_key, 'execution_engine', `Workflow created: ${payload.title}`)
  revalidatePath('/execution-engine')
  revalidatePath('/execution-engine/workflows')
}

export async function updateOpsosWorkflowStatus(formData: FormData) {
  const supabase = await createClient()
  const id = s(formData, 'workflow_id')
  const status = s(formData, 'status', 'in_progress')
  const currentStep = s(formData, 'current_step', status)
  const progress = n(formData, 'progress', 25)

  const { error } = await supabase.from('opsos_workflows').update({ status, current_step: currentStep, progress, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)

  await logSync('workflow_updated', 'execution_engine', 'execution_engine', `Workflow updated: ${id}`)
  revalidatePath('/execution-engine')
  revalidatePath('/execution-engine/workflows')
}

export async function createOpsosCommandAction(formData: FormData) {
  const supabase = await createClient()
  const payload = {
    title: s(formData, 'title'),
    module_key: s(formData, 'module_key', 'global'),
    action_type: s(formData, 'action_type', 'execute'),
    status: s(formData, 'status', 'open'),
    priority: s(formData, 'priority', 'medium'),
    route: s(formData, 'route', '/enterprise-command'),
    payload: { notes: s(formData, 'notes') },
  }

  const { error } = await supabase.from('opsos_command_actions').insert([payload])
  if (error) throw new Error(error.message)

  await logSync('command_action_created', payload.module_key, 'execution_engine', `Action created: ${payload.title}`)
  revalidatePath('/execution-engine')
  revalidatePath('/execution-engine/command-actions')
}

export async function createOpsosEscalation(formData: FormData) {
  const supabase = await createClient()
  const payload = {
    title: s(formData, 'title'),
    source_module: s(formData, 'source_module', 'global'),
    target_module: s(formData, 'target_module', 'executive'),
    severity: s(formData, 'severity', 'medium'),
    status: s(formData, 'status', 'open'),
    summary: s(formData, 'summary'),
    route: s(formData, 'route', '/execution-engine/escalations'),
  }

  const { error } = await supabase.from('opsos_escalations').insert([payload])
  if (error) throw new Error(error.message)

  await logSync('escalation_created', payload.source_module, payload.target_module, `Escalation created: ${payload.title}`)
  revalidatePath('/execution-engine')
  revalidatePath('/execution-engine/escalations')
}
