import { createClient } from '@/lib/supabase/server'

type AutomationRule = {
  id: string
  name?: string | null
  trigger_type?: string | null
  trigger?: string | null
  action?: string | null
  status?: string | null
  is_active?: boolean | null
  conditions?: any
  max_runs_per_day?: number | null
}

type RunResult = {
  checked: number
  executed: number
  skipped: number
  errors: number
  logs: Array<{ rule: string; status: string; message: string }>
}

function normalize(value: any) {
  return String(value || '').trim().toLowerCase()
}

function getTrigger(rule: AutomationRule) {
  return normalize(rule.trigger_type || rule.trigger)
}

function getAction(rule: AutomationRule) {
  const raw = normalize(rule.action)
  if (raw) return raw

  const name = normalize(rule.name)
  if (name.includes('follow')) return 'create_follow_up_task'
  if (name.includes('priority') || name.includes('urgent')) return 'raise_priority'
  if (name.includes('appointment')) return 'flag_appointment_review'
  if (name.includes('owner')) return 'flag_missing_owner'
  return 'create_follow_up_task'
}

function isRuleEnabled(rule: AutomationRule) {
  const status = normalize(rule.status)
  return rule.is_active === true || ['active', 'enabled', 'running'].includes(status)
}

async function logAutomation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entry: {
    rule?: AutomationRule
    entity_type?: string
    entity_id?: string | null
    status: 'success' | 'skipped' | 'error'
    message: string
    payload?: any
    error?: string
  }
) {
  await supabase.from('bd_automation_logs').insert({
    rule_id: entry.rule?.id || null,
    rule_name: entry.rule?.name || null,
    trigger_type: entry.rule ? getTrigger(entry.rule) : null,
    action: entry.rule ? getAction(entry.rule) : null,
    entity_type: entry.entity_type || null,
    entity_id: entry.entity_id || null,
    status: entry.status,
    message: entry.message,
    payload: entry.payload || {},
    error: entry.error || null,
  })
}

async function createFollowUpTask(supabase: Awaited<ReturnType<typeof createClient>>, rule: AutomationRule) {
  const trigger = getTrigger(rule)

  if (trigger === 'prospect') {
    const { data: prospects, error } = await supabase
      .from('bd_prospects')
      .select('id, name, status, owner_id, assigned_to, next_action, next_action_at, updated_at')
      .limit(25)

    if (error) throw error

    let created = 0
    for (const p of prospects || []) {
      const owner = p.owner_id || p.assigned_to || null
      const title = `Follow up prospect: ${p.name || 'Unnamed prospect'}`

      const { data: existing } = await supabase
        .from('bd_tasks')
        .select('id')
        .or(`related_id.eq.${p.id},linked_id.eq.${p.id}`)
        .ilike('title', `%${p.name || 'prospect'}%`)
        .limit(1)

      if (existing?.length) {
        await logAutomation(supabase, {
          rule,
          entity_type: 'prospect',
          entity_id: p.id,
          status: 'skipped',
          message: 'Skipped duplicate follow-up task.',
        })
        continue
      }

      const { error: insertError } = await supabase.from('bd_tasks').insert({
        title,
        description: `Automation generated follow-up from rule: ${rule.name || 'Automation Rule'}`,
        status: 'open',
        priority: 'medium',
        assigned_to: owner,
        related_type: 'prospect',
        related_id: p.id,
        linked_type: 'prospect',
        linked_id: p.id,
        due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })

      if (insertError) throw insertError
      created += 1

      await logAutomation(supabase, {
        rule,
        entity_type: 'prospect',
        entity_id: p.id,
        status: 'success',
        message: 'Created prospect follow-up task.',
      })
    }

    return created
  }

  return 0
}

async function raisePriority(supabase: Awaited<ReturnType<typeof createClient>>, rule: AutomationRule) {
  const trigger = getTrigger(rule)

  if (trigger === 'prospect') {
    const { data, error } = await supabase
      .from('bd_prospects')
      .select('id, name, priority, estimated_value')
      .limit(25)

    if (error) throw error

    let updated = 0
    for (const p of data || []) {
      if (normalize(p.priority) === 'high' || normalize(p.priority) === 'critical') continue

      const { error: updateError } = await supabase
        .from('bd_prospects')
        .update({ priority: 'high' })
        .eq('id', p.id)

      if (updateError) throw updateError
      updated += 1

      await logAutomation(supabase, {
        rule,
        entity_type: 'prospect',
        entity_id: p.id,
        status: 'success',
        message: 'Raised prospect priority to high.',
      })
    }

    return updated
  }

  return 0
}

async function flagAppointmentReview(supabase: Awaited<ReturnType<typeof createClient>>, rule: AutomationRule) {
  const { data, error } = await supabase
    .from('bd_appointments')
    .select('id, title, scheduled_at, status, owner_id')
    .lt('scheduled_at', new Date().toISOString())
    .limit(25)

  if (error) throw error

  let created = 0
  for (const appointment of data || []) {
    if (['completed', 'cancelled', 'canceled'].includes(normalize(appointment.status))) continue

    const { error: insertError } = await supabase.from('bd_tasks').insert({
      title: `Review appointment outcome: ${appointment.title || 'Untitled appointment'}`,
      description: `Automation detected an appointment requiring outcome review.`,
      status: 'open',
      priority: 'high',
      assigned_to: appointment.owner_id || null,
      related_type: 'appointment',
      related_id: appointment.id,
      linked_type: 'appointment',
      linked_id: appointment.id,
      due_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    })

    if (insertError) throw insertError
    created += 1

    await logAutomation(supabase, {
      rule,
      entity_type: 'appointment',
      entity_id: appointment.id,
      status: 'success',
      message: 'Created appointment outcome review task.',
    })
  }

  return created
}

async function flagMissingOwner(supabase: Awaited<ReturnType<typeof createClient>>, rule: AutomationRule) {
  const trigger = getTrigger(rule)

  if (trigger === 'prospect') {
    const { data, error } = await supabase
      .from('bd_prospects')
      .select('id, name, owner_id, assigned_to')
      .limit(25)

    if (error) throw error

    let created = 0
    for (const p of data || []) {
      if (p.owner_id || p.assigned_to) continue

      const { error: insertError } = await supabase.from('bd_tasks').insert({
        title: `Assign owner to prospect: ${p.name || 'Unnamed prospect'}`,
        description: 'Automation detected prospect without owner.',
        status: 'open',
        priority: 'high',
        related_type: 'prospect',
        related_id: p.id,
        linked_type: 'prospect',
        linked_id: p.id,
      })

      if (insertError) throw insertError
      created += 1

      await logAutomation(supabase, {
        rule,
        entity_type: 'prospect',
        entity_id: p.id,
        status: 'success',
        message: 'Created missing owner task.',
      })
    }

    return created
  }

  return 0
}

export async function runRevenueAutomationEngine(): Promise<RunResult> {
  const supabase = await createClient()

  const { data: rules, error } = await supabase
    .from('bd_automation_rules')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const result: RunResult = {
    checked: rules?.length || 0,
    executed: 0,
    skipped: 0,
    errors: 0,
    logs: [],
  }

  for (const rule of (rules || []) as AutomationRule[]) {
    if (!isRuleEnabled(rule)) {
      result.skipped += 1
      result.logs.push({ rule: rule.name || rule.id, status: 'skipped', message: 'Rule is not active.' })
      continue
    }

    try {
      const action = getAction(rule)
      let count = 0

      if (action.includes('priority')) {
        count = await raisePriority(supabase, rule)
      } else if (action.includes('appointment')) {
        count = await flagAppointmentReview(supabase, rule)
      } else if (action.includes('owner')) {
        count = await flagMissingOwner(supabase, rule)
      } else {
        count = await createFollowUpTask(supabase, rule)
      }

      await supabase
        .from('bd_automation_rules')
        .update({
          last_run_at: new Date().toISOString(),
          run_count: Number((rule as any).run_count || 0) + 1,
        })
        .eq('id', rule.id)

      result.executed += count
      result.logs.push({ rule: rule.name || rule.id, status: 'success', message: `Executed ${count} action(s).` })
    } catch (err: any) {
      result.errors += 1
      result.logs.push({ rule: rule.name || rule.id, status: 'error', message: err?.message || 'Automation error.' })

      await logAutomation(supabase, {
        rule,
        status: 'error',
        message: 'Automation rule failed.',
        error: err?.message || String(err),
      })
    }
  }

  return result
}