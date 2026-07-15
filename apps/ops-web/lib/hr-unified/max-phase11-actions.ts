'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'

function s(formData: FormData, key: string, fallback = ''): string {
  return String(formData.get(key) || fallback)
}

function n(formData: FormData, key: string, fallback = 0): number {
  const value = Number(formData.get(key))
  return Number.isFinite(value) ? value : fallback
}

async function audit(action: string, entityType: string, entityId: string | null, metadata: Record<string, unknown>) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  await supabase.from('hr_audit_logs').insert([
    { actor_id: user?.id || null, action, entity_type: entityType, entity_id: entityId, status: 'ok', metadata },
  ])
}

export async function createHRSavedViewPhase11(formData: FormData) {
  const supabase = await createClient()
  const payload = {
    title: s(formData, 'title'),
    view_type: s(formData, 'view_type', 'dashboard'),
    route: s(formData, 'route', '/hr'),
    priority: s(formData, 'priority', 'medium'),
    status: s(formData, 'status', 'active'),
    filters: {
      area: s(formData, 'area'),
      owner: s(formData, 'owner'),
      status: s(formData, 'filter_status'),
    },
    notes: s(formData, 'notes'),
  }

  const { data, error } = await supabase.from('hr_saved_views').insert([payload]).select('id').single()
  if (error) throw new Error(error.message)

  await audit('create_saved_view_phase11', 'hr_saved_views', data?.id || null, payload)
  revalidatePath('/hr/saved-views')
  revalidatePath('/hr/enterprise-dashboard')
}

export async function createHRActivityTimelinePhase11(formData: FormData) {
  const supabase = await createClient()
  const payload = {
    title: s(formData, 'title'),
    event_type: s(formData, 'event_type', 'manual_note'),
    entity_type: s(formData, 'entity_type', 'hr'),
    severity: s(formData, 'severity', 'normal'),
    status: s(formData, 'status', 'active'),
    event_at: s(formData, 'event_at') || new Date().toISOString(),
    summary: s(formData, 'summary'),
    notes: s(formData, 'notes'),
  }

  const { data, error } = await supabase.from('hr_activity_timeline').insert([payload]).select('id').single()
  if (error) throw new Error(error.message)

  await audit('create_activity_timeline_phase11', 'hr_activity_timeline', data?.id || null, payload)
  revalidatePath('/hr/activity-timeline')
}

export async function createHRKPIDrilldownPhase11(formData: FormData) {
  const supabase = await createClient()
  const payload = {
    title: s(formData, 'title'),
    metric_key: s(formData, 'metric_key'),
    metric_area: s(formData, 'metric_area', 'operations'),
    current_value: n(formData, 'current_value', 0),
    target_value: n(formData, 'target_value', 0),
    status: s(formData, 'status', 'active'),
    insight: s(formData, 'insight'),
    action_plan: s(formData, 'action_plan'),
    notes: s(formData, 'notes'),
  }

  const { data, error } = await supabase.from('hr_kpi_drilldowns').insert([payload]).select('id').single()
  if (error) throw new Error(error.message)

  await audit('create_kpi_drilldown_phase11', 'hr_kpi_drilldowns', data?.id || null, payload)
  revalidatePath('/hr/kpi-drilldowns')
  revalidatePath('/hr/enterprise-dashboard')
}
