import { createClient } from '@/lib/supabase/server'

function rows(res: any): any[] { return Array.isArray(res?.data) ? res.data : [] }
function s(v: unknown, f='') { const out = String(v ?? '').trim(); return out || f }

export async function getAutomationData() {
  const supabase = await createClient()
  const [triggersRes, rulesRes, briefingsRes, runsRes] = await Promise.all([
    supabase.from('opsos_automation_triggers').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('opsos_automation_rules').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('opsos_intelligence_briefings').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('opsos_automation_runs').select('*').order('created_at', { ascending: false }).limit(500),
  ])

  const triggers = rows(triggersRes)
  const rules = rows(rulesRes)
  const briefings = rows(briefingsRes)
  const runs = rows(runsRes)
  const activeTriggers = triggers.filter((x:any) => s(x.status, 'active') === 'active')
  const urgentBriefings = briefings.filter((x:any) => ['high','critical'].includes(s(x.severity).toLowerCase()))

  return {
    triggers, rules, briefings, runs, activeTriggers, urgentBriefings,
    metrics: [
      { label: 'Active triggers', value: activeTriggers.length, detail: 'Automation listeners enabled', tone: 'blue' as const },
      { label: 'Rules', value: rules.length, detail: 'Condition/action rules', tone: 'purple' as const },
      { label: 'Briefings', value: briefings.length, detail: 'Operational intelligence notes', tone: 'green' as const },
      { label: 'Urgent signals', value: urgentBriefings.length, detail: 'High or critical briefings', tone: urgentBriefings.length ? 'red' as const : 'green' as const },
    ]
  }
}
