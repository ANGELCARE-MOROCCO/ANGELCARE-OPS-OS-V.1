'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { computeRevenueSignals } from '@/lib/revenueDecisionEngine'

function clean(v: any) {
  return String(v || '').trim() || null
}

export async function generateControlTowerInsights() {
  const supabase = await createClient()

  const [{ data: prospects }, { data: tasks }, { data: appointments }] = await Promise.all([
    supabase.from('bd_prospects').select('*'),
    supabase.from('bd_tasks').select('*'),
    supabase.from('bd_appointments').select('*'),
  ])

  const signals = computeRevenueSignals({
    prospects: prospects || [],
    tasks: tasks || [],
    appointments: appointments || [],
  })

  await supabase.from('bd_revenue_forecasts').insert({
    gross_pipeline: signals.grossPipeline,
    weighted_pipeline: signals.weightedPipeline,
    overdue_tasks: signals.overdueTasks,
    missing_next_actions: signals.missingNextActions,
    active_prospects: signals.activeProspects,
    confidence_score: signals.confidenceScore,
  })

  for (const risk of signals.risks as any[]) {
    await supabase.from('bd_decision_insights').insert({
      insight_type: risk.type,
      severity: risk.severity,
      title: risk.title,
      message: risk.message,
      recommendation: risk.recommendation,
      status: 'open',
    })
  }

  revalidatePath('/revenue-command-center/control-tower')
}

export async function createTowerAction(formData: FormData) {
  const supabase = await createClient()

  const title = clean(formData.get('title'))
  const description = clean(formData.get('description'))
  const severity = clean(formData.get('severity')) || 'medium'
  const dueAt = clean(formData.get('due_at'))

  if (!title) throw new Error('Missing action title.')

  const { error } = await supabase.from('bd_control_tower_actions').insert({
    title,
    description,
    severity,
    due_at: dueAt,
    status: 'open',
  })

  if (error) throw new Error(error.message)

  revalidatePath('/revenue-command-center/control-tower')
}

export async function closeInsight(formData: FormData) {
  const supabase = await createClient()
  const id = clean(formData.get('id'))
  if (!id) throw new Error('Missing insight id.')

  const { error } = await supabase.from('bd_decision_insights').update({
    status: 'closed',
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/revenue-command-center/control-tower')
}

export async function closeTowerAction(formData: FormData) {
  const supabase = await createClient()
  const id = clean(formData.get('id'))
  if (!id) throw new Error('Missing action id.')

  const { error } = await supabase.from('bd_control_tower_actions').update({
    status: 'completed',
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/revenue-command-center/control-tower')
}
