'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { buildActivationPlan, dueIso } from '@/lib/revenueActivationEngine'

export async function runSystemActivation() {
  const supabase = await createClient()

  const [{ data: prospects }, { data: tasks }, { data: appointments }] = await Promise.all([
    supabase.from('bd_prospects').select('*'),
    supabase.from('bd_tasks').select('*'),
    supabase.from('bd_appointments').select('*'),
  ])

  const plan = buildActivationPlan({
    prospects: prospects || [],
    tasks: tasks || [],
    appointments: appointments || [],
  })

  const { data: run, error: runError } = await supabase.from('bd_activation_runs').insert({
    run_type: 'manual',
    status: 'completed',
    prospects_scanned: (prospects || []).length,
    tasks_scanned: (tasks || []).length,
    appointments_scanned: (appointments || []).length,
  }).select('id').single()

  if (runError) throw new Error(runError.message)

  let followupsCreated = 0
  let tasksCreated = 0
  let insightsCreated = 0
  let escalationsCreated = 0

  for (const event of plan as any[]) {
    await supabase.from('bd_activation_events').insert({
      run_id: run.id,
      event_type: event.event_type,
      severity: event.severity,
      title: event.title,
      message: event.message,
      related_type: event.related_type,
      related_id: event.related_id,
      action_taken: event.action_taken,
    })

    await supabase.from('bd_decision_insights').insert({
      insight_type: event.event_type,
      severity: event.severity,
      title: event.title,
      message: event.message,
      recommendation: event.action_taken,
      related_type: event.related_type,
      related_id: event.related_id,
      status: 'open',
    })
    insightsCreated++

    if (event.related_type === 'prospect') {
      const prospect = (prospects || []).find((p: any) => p.id === event.related_id)
      const dueAt = dueIso(event.payload?.due_hours || 24)

      await supabase.from('bd_tasks').insert({
        title: event.payload?.task_title || event.title,
        description: event.message,
        status: 'open',
        priority: event.payload?.task_priority || event.severity,
        assigned_to: prospect?.owner_id || null,
        owner_id: prospect?.owner_id || null,
        related_type: 'prospect',
        related_id: event.related_id,
        due_at: dueAt,
        planned_end_at: dueAt,
        auto_generated: true,
      })
      tasksCreated++

      await supabase.from('bd_followups').insert({
        title: event.payload?.followup_title || event.title,
        related_type: 'prospect',
        related_id: event.related_id,
        owner_id: prospect?.owner_id || null,
        due_at: dueAt,
        priority: event.payload?.task_priority || event.severity,
        status: 'pending',
      })
      followupsCreated++
    }

    if (event.related_type === 'task') {
      await supabase.from('bd_tasks').update({
        escalation_level: event.payload?.escalation_level || 1,
        priority: 'critical',
        blocker: event.message,
        updated_at: new Date().toISOString(),
      }).eq('id', event.related_id)
      escalationsCreated++
    }

    if (event.related_type === 'appointment') {
      const appointment = (appointments || []).find((a: any) => a.id === event.related_id)
      const dueAt = dueIso(event.payload?.due_hours || 12)

      await supabase.from('bd_tasks').insert({
        title: event.payload?.task_title || event.title,
        description: event.message,
        status: 'open',
        priority: event.payload?.task_priority || 'high',
        assigned_to: appointment?.owner_id || null,
        owner_id: appointment?.owner_id || null,
        related_type: 'appointment',
        related_id: event.related_id,
        due_at: dueAt,
        planned_end_at: dueAt,
        auto_generated: true,
      })
      tasksCreated++
    }
  }

  await supabase.from('bd_activation_runs').update({
    followups_created: followupsCreated,
    tasks_created: tasksCreated,
    insights_created: insightsCreated,
    escalations_created: escalationsCreated,
  }).eq('id', run.id)

  revalidatePath('/revenue-command-center/system-activation')
  revalidatePath('/revenue-command-center/control-tower')
  revalidatePath('/revenue-command-center/follow-ups')
  revalidatePath('/revenue-command-center/tasks')
}
