import AppShell from '@/app/components/erp/AppShell'
import { ERPPanel, MetricCard, StatusPill } from '@/app/components/erp/ERPPrimitives'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const MONTHLY_TARGET_MAD = 800000
const AVG_B2C_DEAL_MAD = 4500
const DAILY_CALL_TARGET = 45
const DAILY_WHATSAPP_TARGET = 65
const DAILY_QUALIFIED_TARGET = 12
const DAILY_CLOSE_TARGET = 4

function low(v: unknown) {
  return String(v || '').toLowerCase()
}

function cleanPhone(v: unknown) {
  return String(v || '').replace(/\D/g, '')
}

function safeDate(v: unknown) {
  if (!v) return 'No date'
  try {
    return new Date(String(v)).toLocaleString()
  } catch {
    return String(v)
  }
}

function minutesSince(v: unknown) {
  if (!v) return 999999
  return Math.round((Date.now() - new Date(String(v)).getTime()) / 60000)
}

function todayKey() {
  return new Date().toDateString()
}

function pct(value: number, total: number) {
  if (!total) return 0
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)))
}

function projectedRevenue(leads: any[]) {
  const won = leads.filter((l: any) => ['won', 'converted'].includes(low(l.status))).length
  const qualified = leads.filter((l: any) => ['qualified', 'offer_sent'].includes(low(l.status))).length
  const hot = leads.filter((l: any) => revenueScore(l) >= 75).length
  return (won * AVG_B2C_DEAL_MAD) + Math.round(qualified * AVG_B2C_DEAL_MAD * 0.45) + Math.round(hot * AVG_B2C_DEAL_MAD * 0.18)
}

function revenueScore(lead: any) {
  let score = 30
  const service = low(lead.service_interest)
  const source = low(lead.source)
  const city = low(lead.city)
  const status = low(lead.status)
  const attempts = Number(lead.contact_attempts || 0)
  const ageMins = minutesSince(lead.created_at)
  const sinceContact = lead.last_contact_at ? minutesSince(lead.last_contact_at) : 999999

  if (service.includes('post') || service.includes('bébé') || service.includes('baby') || service.includes('accouchement')) score += 24
  if (service.includes('spécial') || service.includes('special') || service.includes('autis') || service.includes('besoin')) score += 24
  if (service.includes('domicile') || service.includes('garde')) score += 10
  if (source.includes('whatsapp') || source.includes('meta') || source.includes('ads') || source.includes('instagram')) score += 10
  if (city.includes('rabat') || city.includes('casablanca') || city.includes('casa') || city.includes('témara') || city.includes('temara') || city.includes('salé') || city.includes('sale')) score += 8
  if (status === 'new' || status === 'pending') score += 15
  if (status === 'contacted') score += 12
  if (status === 'qualified') score += 22
  if (status === 'offer_sent') score += 26
  if (status === 'lost') score += 6
  if (status === 'won' || status === 'converted') score -= 35
  if (attempts === 0 && ageMins > 15) score += 18
  if (attempts > 0 && sinceContact > 240 && !['won', 'converted', 'lost'].includes(status)) score += 12
  if (attempts >= 4 && status !== 'qualified') score -= 8

  return Math.max(0, Math.min(score, 100))
}

function scoreTone(score: number) {
  if (score >= 85) return 'red'
  if (score >= 65) return 'amber'
  if (score >= 45) return 'blue'
  return 'green'
}

function slaStatus(lead: any) {
  const s = low(lead.status)
  if (['won', 'converted', 'lost', 'archived'].includes(s)) return { label: 'closed', tone: 'green' }
  if (!lead.last_contact_at && minutesSince(lead.created_at) > 15) return { label: 'SLA breach', tone: 'red' }
  if (lead.last_contact_at && minutesSince(lead.last_contact_at) > 240) return { label: 'follow-up due', tone: 'amber' }
  return { label: 'on track', tone: 'green' }
}

function nextSdrAction(lead: any) {
  const s = low(lead.status)
  const attempts = Number(lead.contact_attempts || 0)
  if (s === 'new' || s === 'pending') return attempts === 0 ? 'Call + WhatsApp immediately' : 'Second attempt + qualification push'
  if (s === 'contacted') return 'Diagnose need, budget, timing, and qualify'
  if (s === 'qualified') return 'Send offer and create closing urgency'
  if (s === 'offer_sent') return 'Follow up, handle objection, close today'
  if (s === 'lost') return 'Run recovery script with alternative package'
  if (s === 'won' || s === 'converted') return 'Handoff to operations / contract'
  return 'Review and decide'
}

function groupBy(rows: any[], key: string) {
  return rows.reduce((acc: any, row: any) => {
    const k = row[key]
    if (!acc[k]) acc[k] = []
    acc[k].push(row)
    return acc
  }, {})
}

async function logActivity(supabase: any, leadId: any, type: string, description: string) {
  await supabase.from('lead_activities').insert({ lead_id: leadId, type, description })
}

async function assignLead(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const leadId = formData.get('lead_id')
  const assignedTo = String(formData.get('assigned_to') || '').trim()
  if (!leadId || !assignedTo) return
  await supabase.from('leads').update({ assigned_to: assignedTo }).eq('id', String(leadId))
  await logActivity(supabase, leadId, 'assignment', `Lead assigned to ${assignedTo}`)
  revalidatePath('/revenue-command-center/sdr-execution')
}

async function logLeadAction(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const leadId = formData.get('lead_id')
  const actionType = String(formData.get('type') || '')
  const note = String(formData.get('note') || '').trim()
  const agent = String(formData.get('agent') || 'SDR Agent').trim()
  if (!leadId || !actionType) return

  await supabase.from('lead_actions').insert({ lead_id: leadId, type: actionType, agent, note })
  const { data } = await supabase.from('leads').select('contact_attempts').eq('id', String(leadId)).single()
  await supabase.from('leads').update({
    last_contact_at: new Date().toISOString(),
    contact_attempts: Number(data?.contact_attempts || 0) + 1,
  }).eq('id', String(leadId))

  await logActivity(supabase, leadId, actionType, `${actionType} logged by ${agent}${note ? `: ${note}` : ''}`)
  await supabase.from('lead_alerts').update({ status: 'closed' }).eq('lead_id', String(leadId)).in('type', ['no_contact', 'sla_breach', 'follow_up_due'])
  revalidatePath('/revenue-command-center/sdr-execution')
}

async function updateLeadStatus(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const leadId = formData.get('lead_id')
  const status = formData.get('status')
  if (!leadId || !status) return
  const { data: oldLead } = await supabase.from('leads').select('status').eq('id', String(leadId)).single()
  await supabase.from('leads').update({ status: String(status) }).eq('id', String(leadId))
  await logActivity(supabase, leadId, 'status_change', `SDR changed status from ${oldLead?.status || 'unknown'} to ${String(status)}`)
  if (String(status) === 'lost') await supabase.from('lead_alerts').insert({ lead_id: leadId, type: 'lost_recovery', status: 'active' })
  revalidatePath('/revenue-command-center/sdr-execution')
}

async function setReminder(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const leadId = formData.get('lead_id')
  const remindAt = formData.get('remind_at')
  if (!leadId || !remindAt) return
  await supabase.from('lead_reminders').insert({ lead_id: leadId, remind_at: String(remindAt), status: 'pending' })
  await logActivity(supabase, leadId, 'reminder', `SDR follow-up reminder set for ${String(remindAt)}`)
  revalidatePath('/revenue-command-center/sdr-execution')
}

async function generateSlaAlerts() {
  'use server'
  const supabase = await createClient()
  const { data: leads } = await supabase.from('leads').select('id,status,created_at,last_contact_at,is_archived').eq('is_archived', false).limit(500)
  const activeLeads = (leads || []).filter((lead: any) => !['won', 'converted', 'lost', 'archived'].includes(low(lead.status)))
  const breaches = activeLeads.filter((lead: any) => !lead.last_contact_at && minutesSince(lead.created_at) > 15)
  const stale = activeLeads.filter((lead: any) => lead.last_contact_at && minutesSince(lead.last_contact_at) > 240)

  for (const lead of breaches) {
    await supabase.from('lead_alerts').insert({ lead_id: lead.id, type: 'sla_breach', status: 'active' })
    await logActivity(supabase, lead.id, 'alert', 'SLA breach alert generated')
  }
  for (const lead of stale) {
    await supabase.from('lead_alerts').insert({ lead_id: lead.id, type: 'follow_up_due', status: 'active' })
    await logActivity(supabase, lead.id, 'alert', 'Follow-up due alert generated')
  }
  revalidatePath('/revenue-command-center/sdr-execution')
}

export default async function SDRExecutionPage({ searchParams }: any) {
  const params = await searchParams
  const agentFilter = String(params?.agent || '')
  const supabase = await createClient()

  const { data: leadsData, error: leadsError } = await supabase
    .from('leads')
    .select('id,name,status,city,source,service_interest,phone,created_at,is_archived,assigned_to,last_contact_at,contact_attempts')
    .eq('is_archived', false)
    .order('id', { ascending: false })
    .limit(500)

  if (leadsError) throw new Error(leadsError.message)

  let leads = leadsData || []
  if (agentFilter) leads = leads.filter((lead: any) => low(lead.assigned_to) === low(agentFilter))

  const leadIds = leads.map((l: any) => l.id)
  const [actionsRes, remindersRes, alertsRes] = await Promise.all([
    leadIds.length ? supabase.from('lead_actions').select('*').in('lead_id', leadIds).order('created_at', { ascending: false }).limit(1000) : Promise.resolve({ data: [] }),
    leadIds.length ? supabase.from('lead_reminders').select('*').in('lead_id', leadIds).order('remind_at', { ascending: true }).limit(800) : Promise.resolve({ data: [] }),
    leadIds.length ? supabase.from('lead_alerts').select('*').in('lead_id', leadIds).order('created_at', { ascending: false }).limit(800) : Promise.resolve({ data: [] }),
  ])

  const actions = actionsRes.data || []
  const reminders = remindersRes.data || []
  const alerts = alertsRes.data || []
  const actionsByLead = groupBy(actions, 'lead_id')
  const remindersByLead = groupBy(reminders, 'lead_id')
  const alertsByLead = groupBy(alerts, 'lead_id')

  const agents = Array.from(new Set(leads.map((l: any) => l.assigned_to).filter(Boolean))) as string[]
  const commandLeads = leads.map((lead: any) => ({ ...lead, score: revenueScore(lead), sla: slaStatus(lead) })).filter((lead: any) => !['won', 'converted'].includes(low(lead.status))).sort((a: any, b: any) => b.score - a.score)

  const hot = commandLeads.filter((l: any) => l.score >= 80)
  const slaBreaches = commandLeads.filter((l: any) => l.sla.label === 'SLA breach')
  const recovery = commandLeads.filter((l: any) => low(l.status) === 'lost')
  const overdueReminders = reminders.filter((r: any) => low(r.status) !== 'done' && new Date(String(r.remind_at)).getTime() < Date.now())
  const activeAlerts = alerts.filter((a: any) => low(a.status) === 'active')
  const won = leads.filter((l: any) => ['won', 'converted'].includes(low(l.status)))
  const qualified = leads.filter((l: any) => ['qualified', 'offer_sent'].includes(low(l.status)))
  const contactedToday = actions.filter((a: any) => new Date(String(a.created_at)).toDateString() === todayKey())
  const callsToday = contactedToday.filter((a: any) => low(a.type) === 'call')
  const whatsappToday = contactedToday.filter((a: any) => low(a.type) === 'whatsapp')
  const projected = projectedRevenue(leads)
  const targetGap = Math.max(0, MONTHLY_TARGET_MAD - projected)
  const neededDeals = Math.ceil(targetGap / AVG_B2C_DEAL_MAD)
  const requiredDailyDeals = Math.ceil(neededDeals / 22)
  const agentStats = buildAgentStats(leads, actions)

  const aiDirectives = [
    hot.length ? `Attack ${hot.length} hot leads first. No low-priority work before these leads receive call + WhatsApp.` : 'No hot lead pressure detected. Focus on creating qualified pipeline.',
    slaBreaches.length ? `${slaBreaches.length} SLA breaches detected. Manager must enforce immediate contact and log every attempt.` : 'SLA zone is clean. Maintain speed discipline.',
    targetGap > 0 ? `Target gap is ${targetGap.toLocaleString()} MAD. Minimum required: ${requiredDailyDeals} won deals/day at current average value.` : 'Projected revenue is at or above the 800,000 MAD control target.',
    recovery.length ? `${recovery.length} recovery leads available. Use alternative package, urgency framing, and final-value script.` : 'Recovery queue is light. Keep focus on qualification and close velocity.',
    qualified.length ? `${qualified.length} qualified/offer leads require closing pressure today. Push decision, objection handling, and commitment.` : 'Qualified pipeline is thin. SDRs must diagnose and qualify more leads today.',
  ]

  return (
    <AppShell
      title="SDR Revenue Strike Engine v20"
      subtitle="AI-supervised multi-agent command system for revenue pressure, SLA discipline, execution velocity and 800,000 MAD monthly target control."
      breadcrumbs={[{ label: 'Revenue Command Center' }, { label: 'SDR Execution' }]}
    >
      <section style={heroStyle}>
        <div>
          <div style={heroBadgeStyle}>AI Super Manager • Revenue Takeoff Mode</div>
          <h2 style={heroTitleStyle}>No guessing. The system diagnoses the situation, prioritizes actions, and forces SDR execution toward the 800,000 MAD target.</h2>
          <p style={heroTextStyle}>
            This workspace converts leads into disciplined revenue action: calls, WhatsApp, assignment, follow-ups, recovery,
            closing pressure, target-gap diagnosis, and manager-level directives.
          </p>
        </div>
        <form action={generateSlaAlerts} style={heroActionStyle}>
          <strong>Control Trigger</strong>
          <span>Scan active leads for SLA breaches and follow-up risk.</span>
          <button type="submit" style={primaryButtonStyle}>Run SLA Scan</button>
        </form>
      </section>

      <section style={metricGridStyle}>
        <MetricCard label="Projected revenue" value={`${projected.toLocaleString()} MAD`} sub={`${pct(projected, MONTHLY_TARGET_MAD)}% of 800K MAD target`} icon="MAD" accent="#166534" />
        <MetricCard label="Target gap" value={`${targetGap.toLocaleString()} MAD`} sub={`${neededDeals} deals needed`} icon="GAP" accent="#991b1b" />
        <MetricCard label="Command queue" value={commandLeads.length} sub="leads requiring action" icon="CMD" accent="#7c3aed" />
        <MetricCard label="Actions today" value={contactedToday.length} sub={`${callsToday.length} calls / ${whatsappToday.length} WhatsApp`} icon="ACT" accent="#1d4ed8" />
        <MetricCard label="Won leads" value={won.length} sub="handoff-ready" icon="WIN" accent="#166534" />
      </section>

      <ERPPanel title="AI Super Manager Diagnosis" subtitle="Current situation, revenue pressure, and right conducts to maintain target trajectory.">
        <div style={aiGridStyle}>
          {aiDirectives.map((d, i) => <AIDirective key={i} index={i + 1} text={d} />)}
        </div>
      </ERPPanel>

      <ERPPanel title="Premium Revenue Engine Widgets" subtitle="10 control widgets showing pressure, productivity, conversion, risk and strategic conduct.">
        <div style={widgetGridStyle}>
          <PremiumWidget title="Revenue Takeoff Index" value={`${pct(projected, MONTHLY_TARGET_MAD)}%`} text="Projected revenue vs 800K MAD target." tone={projected >= MONTHLY_TARGET_MAD ? 'green' : 'amber'} />
          <PremiumWidget title="Daily Close Requirement" value={`${requiredDailyDeals}/day`} text="Minimum daily won deals needed to close the gap." tone={requiredDailyDeals <= DAILY_CLOSE_TARGET ? 'green' : 'red'} />
          <PremiumWidget title="Hot Lead Firepower" value={hot.length} text="High-priority leads requiring immediate attack." tone={hot.length ? 'red' : 'green'} />
          <PremiumWidget title="SLA Discipline" value={slaBreaches.length} text="Late first contacts hurting conversion trust." tone={slaBreaches.length ? 'red' : 'green'} />
          <PremiumWidget title="Recovery Vault" value={recovery.length} text="Lost leads that can still be reactivated." tone={recovery.length ? 'amber' : 'green'} />
          <PremiumWidget title="Qualification Fuel" value={qualified.length} text="Leads ready for offer, pressure and close." tone={qualified.length ? 'green' : 'amber'} />
          <PremiumWidget title="Call Velocity" value={`${pct(callsToday.length, DAILY_CALL_TARGET)}%`} text={`${callsToday.length}/${DAILY_CALL_TARGET} call target today.`} tone={callsToday.length >= DAILY_CALL_TARGET ? 'green' : 'amber'} />
          <PremiumWidget title="WhatsApp Velocity" value={`${pct(whatsappToday.length, DAILY_WHATSAPP_TARGET)}%`} text={`${whatsappToday.length}/${DAILY_WHATSAPP_TARGET} WhatsApp target today.`} tone={whatsappToday.length >= DAILY_WHATSAPP_TARGET ? 'green' : 'amber'} />
          <PremiumWidget title="Alert Exposure" value={activeAlerts.length} text="Active risks requiring manager attention." tone={activeAlerts.length ? 'red' : 'green'} />
          <PremiumWidget title="Agent Accountability" value={agentStats.length} text="Agents visible in the performance engine." tone={agentStats.length ? 'green' : 'amber'} />
        </div>
      </ERPPanel>

      <div style={filterRowStyle}>
        <Link href="/revenue-command-center/sdr-execution" style={!agentFilter ? activeTabStyle : tabStyle}>All Agents</Link>
        {agents.map((agent) => (
          <Link key={agent} href={`/revenue-command-center/sdr-execution?agent=${encodeURIComponent(agent)}`} style={agentFilter === agent ? activeTabStyle : tabStyle}>{agent}</Link>
        ))}
      </div>

      <div style={twoColStyle}>
        <ERPPanel title="Daily SDR Command Board" subtitle="The system tells agents what to execute now.">
          <div style={{ display: 'grid', gap: 10 }}>
            {commandLeads.slice(0, 14).map((lead: any) => (
              <CommandLeadCard key={lead.id} lead={lead} reminders={remindersByLead[lead.id] || []} alerts={alertsByLead[lead.id] || []} actions={actionsByLead[lead.id] || []} />
            ))}
            {!commandLeads.length ? <div style={emptyStyle}>No active SDR actions right now.</div> : null}
          </div>
        </ERPPanel>

        <ERPPanel title="Revenue Pressure Center" subtitle="SLA, recovery and overdue follow-up pressure points.">
          <div style={{ display: 'grid', gap: 12 }}>
            <PressureBlock title="SLA Breaches" items={slaBreaches} tone="red" />
            <PressureBlock title="Overdue Reminders" items={overdueReminders.map((r: any) => leads.find((l: any) => l.id === r.lead_id)).filter(Boolean)} tone="amber" />
            <PressureBlock title="Lost Recovery" items={recovery} tone="purple" />
            <PressureBlock title="Active Alerts" items={activeAlerts.map((a: any) => leads.find((l: any) => l.id === a.lead_id)).filter(Boolean)} tone="red" />
          </div>
        </ERPPanel>
      </div>

      <ERPPanel title="Multi-Agent Performance Dashboard" subtitle="Daily accountability: calls, WhatsApp, attempts, assigned leads, wins and SLA cleanliness.">
        <div style={agentGridStyle}>
          {agentStats.length ? agentStats.map((agent: any) => (
            <div key={agent.name} style={agentCardStyle}>
              <div style={agentHeaderStyle}>
                <strong>{agent.name}</strong>
                <StatusPill tone={agent.score >= 80 ? 'green' : agent.score >= 50 ? 'amber' : 'red'}>{agent.score}%</StatusPill>
              </div>
              <div style={agentStatGridStyle}>
                <MiniStat label="Assigned" value={agent.assigned} />
                <MiniStat label="Actions today" value={agent.actionsToday} />
                <MiniStat label="Calls" value={agent.calls} />
                <MiniStat label="WhatsApp" value={agent.whatsapp} />
                <MiniStat label="Won" value={agent.won} />
                <MiniStat label="SLA clean" value={`${agent.slaClean}%`} />
              </div>
            </div>
          )) : <div style={emptyStyle}>No assigned agents yet. Assign leads from command cards.</div>}
        </div>
      </ERPPanel>

      <ERPPanel title="SDR Strategic Conduct Board" subtitle="What the team must execute immediately to reach and defend the 800,000 MAD revenue target.">
        <div style={strategyGridStyle}>
          <StrategyCard title="1. Attack qualified leads first" text="Offer-sent and qualified leads are closest to revenue. Call them before cold activity." />
          <StrategyCard title="2. Stop SLA leakage" text="Any lead not contacted fast loses trust. SLA breaches must be cleared before new exploration." />
          <StrategyCard title="3. Push premium packages" text="Postpartum and special-needs services should be framed as premium trust solutions, not generic babysitting." />
          <StrategyCard title="4. Recover lost leads" text="Lost leads get alternative package, lower-friction intro, or follow-up timing reset." />
          <StrategyCard title="5. Force action logging" text="Every call, WhatsApp and offer must be logged. No invisible work accepted." />
          <StrategyCard title="6. Daily close target" text={`The current gap requires around ${requiredDailyDeals} won deals/day at ${AVG_B2C_DEAL_MAD} MAD average deal value.`} />
        </div>
      </ERPPanel>

      <ERPPanel title="SDR Lead Execution Registry" subtitle="Complete action-ready list with owner, priority, SLA status, attempts and next action.">
        <div style={{ display: 'grid', gap: 10 }}>
          {commandLeads.map((lead: any) => (
            <RegistryRow key={lead.id} lead={lead} reminders={remindersByLead[lead.id] || []} alerts={alertsByLead[lead.id] || []} actions={actionsByLead[lead.id] || []} />
          ))}
          {!commandLeads.length ? <div style={emptyStyle}>No leads in execution registry.</div> : null}
        </div>
      </ERPPanel>
    </AppShell>
  )
}

function buildAgentStats(leads: any[], actions: any[]) {
  const names = Array.from(new Set([...leads.map((l: any) => l.assigned_to).filter(Boolean), ...actions.map((a: any) => a.agent).filter(Boolean)]))
  return names.map((name: any) => {
    const assignedLeads = leads.filter((l: any) => l.assigned_to === name)
    const agentActions = actions.filter((a: any) => a.agent === name)
    const todayActions = agentActions.filter((a: any) => new Date(String(a.created_at)).toDateString() === todayKey())
    const calls = todayActions.filter((a: any) => low(a.type) === 'call').length
    const whatsapp = todayActions.filter((a: any) => low(a.type) === 'whatsapp').length
    const won = assignedLeads.filter((l: any) => ['won', 'converted'].includes(low(l.status))).length
    const slaClean = assignedLeads.length ? Math.round((assignedLeads.filter((l: any) => slaStatus(l).label !== 'SLA breach').length / assignedLeads.length) * 100) : 100
    const score = Math.min(100, Math.round((todayActions.length * 8) + (won * 20) + (slaClean * 0.4)))
    return { name, assigned: assignedLeads.length, actionsToday: todayActions.length, calls, whatsapp, won, slaClean, score }
  }).sort((a: any, b: any) => b.score - a.score)
}

function AIDirective({ index, text }: any) {
  return <div style={aiDirectiveStyle}><strong>{String(index).padStart(2, '0')}</strong><span>{text}</span></div>
}

function PremiumWidget({ title, value, text, tone }: any) {
  const colors: any = { green: '#166534', amber: '#92400e', red: '#991b1b', blue: '#1d4ed8' }
  return (
    <div style={premiumWidgetStyle}>
      <div style={{ ...widgetAccentStyle, background: colors[tone] || '#0f172a' }} />
      <strong style={widgetTitleStyle}>{title}</strong>
      <div style={{ ...widgetValueStyle, color: colors[tone] || '#0f172a' }}>{value}</div>
      <p style={widgetTextStyle}>{text}</p>
    </div>
  )
}

function CommandLeadCard({ lead, reminders, alerts, actions }: any) {
  const phone = cleanPhone(lead.phone)
  const wa = phone ? `https://wa.me/${phone}?text=${encodeURIComponent('Bonjour, ici AngelCare. Nous revenons vers vous concernant votre demande. Est-ce que je peux vous appeler pour finaliser les détails ?')}` : '#'
  const score = revenueScore(lead)
  const sla = slaStatus(lead)
  const activeAlerts = alerts.filter((a: any) => low(a.status) === 'active')
  const overdueReminders = reminders.filter((r: any) => low(r.status) !== 'done' && new Date(String(r.remind_at)).getTime() < Date.now())

  return (
    <div style={leadCardStyle}>
      <div style={leadTopStyle}>
        <div>
          <strong style={{ color: '#0f172a' }}>{lead.name || `Lead #${lead.id}`}</strong>
          <div style={leadMetaStyle}>{lead.service_interest || 'Service pending'} • {lead.city || 'City pending'} • {lead.source || 'unknown'}</div>
        </div>
        <StatusPill tone={scoreTone(score)}>{score}/100</StatusPill>
      </div>

      <div style={tagRowStyle}>
       <StatusPill
  tone={
    ["blue", "green", "purple", "red", "amber", "slate"].includes(sla.tone)
      ? (sla.tone as "blue" | "green" | "purple" | "red" | "amber" | "slate")
      : "slate"
  }>
  {sla.label}
</StatusPill>
        <StatusPill tone="blue">{lead.assigned_to || 'unassigned'}</StatusPill>
        <StatusPill tone={activeAlerts.length ? 'red' : 'green'}>{activeAlerts.length} alerts</StatusPill>
        <StatusPill tone={overdueReminders.length ? 'amber' : 'green'}>{overdueReminders.length} overdue</StatusPill>
        <StatusPill tone="purple">{Number(lead.contact_attempts || 0)} attempts</StatusPill>
      </div>

      <div style={nextActionStyle}>Next: {nextSdrAction(lead)}</div>

      <div style={actionRowStyle}>
        <a href={phone ? `tel:${phone}` : '#'} style={smallButtonStyle}>Call</a>
        <a href={wa} target="_blank" rel="noreferrer" style={smallButtonStyle}>WhatsApp</a>
        <Link href={`/revenue-command-center/b2c-workflow?leadId=${lead.id}`} style={smallButtonStyle}>B2C Detail</Link>
      </div>

      <form action={assignLead} style={formStyle}>
        <input type="hidden" name="lead_id" value={lead.id} />
        <input name="assigned_to" placeholder="Assign to agent" defaultValue={lead.assigned_to || ''} style={smallInputStyle} />
        <button type="submit" style={buttonStyle}>Assign</button>
      </form>

      <form action={logLeadAction} style={actionLogGridStyle}>
        <input type="hidden" name="lead_id" value={lead.id} />
        <select name="type" defaultValue="call" style={selectStyle}>
          <option value="call">Call</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="no_answer">No Answer</option>
          <option value="qualified_call">Qualified Call</option>
          <option value="offer_sent">Offer Sent</option>
        </select>
        <input name="agent" placeholder="Agent name" defaultValue={lead.assigned_to || ''} style={smallInputStyle} />
        <input name="note" placeholder="Action note" style={smallInputStyle} />
        <button type="submit" style={buttonStyle}>Log</button>
      </form>

      <form action={updateLeadStatus} style={formStyle}>
        <input type="hidden" name="lead_id" value={lead.id} />
        <select name="status" defaultValue={lead.status || 'new'} style={selectStyle}>
          <option value="new">New</option>
          <option value="pending">Pending</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="offer_sent">Offer Sent</option>
          <option value="won">Won</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </select>
        <button type="submit" style={buttonStyle}>Status</button>
      </form>

      <form action={setReminder} style={formStyle}>
        <input type="hidden" name="lead_id" value={lead.id} />
        <input type="datetime-local" name="remind_at" style={smallInputStyle} />
        <button type="submit" style={buttonStyle}>Reminder</button>
      </form>

      <div style={activityPreviewStyle}>
        <strong>Last actions</strong>
        {actions.length ? actions.slice(0, 3).map((a: any) => <small key={a.id}>{a.type} • {a.agent || 'agent'} • {safeDate(a.created_at)}</small>) : <small>No actions logged yet.</small>}
      </div>
    </div>
  )
}

function PressureBlock({ title, items, tone }: any) {
  return (
    <div style={pressureBlockStyle}>
      <div style={pressureHeaderStyle}><strong>{title}</strong><StatusPill tone={tone}>{items.length}</StatusPill></div>
      {items.length ? items.slice(0, 8).map((lead: any) => (
        <Link key={`${title}-${lead.id}`} href={`/revenue-command-center/b2c-workflow?leadId=${lead.id}`} style={pressureRowStyle}>
          <span>{lead.name || `Lead #${lead.id}`}</span>
          <small>{lead.service_interest || 'Service pending'} • {lead.city || 'City'}</small>
        </Link>
      )) : <div style={emptyStyle}>Clean.</div>}
    </div>
  )
}

function RegistryRow({ lead, reminders, alerts, actions }: any) {
  const score = revenueScore(lead)
  const sla = slaStatus(lead)
  return (
    <div style={registryRowStyle}>
      <strong>{lead.name || `Lead #${lead.id}`}</strong>
      <span>{lead.assigned_to || 'unassigned'}</span>
      <span>{lead.status || 'new'}</span>
      <StatusPill tone={scoreTone(score)}>{score}</StatusPill>
      <StatusPill tone={sla.tone}>{sla.label}</StatusPill>
      <span>{Number(lead.contact_attempts || 0)} attempts</span>
      <span>{actions.length} actions</span>
      <span>{reminders.filter((r: any) => low(r.status) !== 'done').length} reminders</span>
      <span>{alerts.filter((a: any) => low(a.status) === 'active').length} alerts</span>
      <Link href={`/revenue-command-center/b2c-workflow?leadId=${lead.id}`} style={smallButtonStyle}>Open</Link>
    </div>
  )
}

function MiniStat({ label, value }: any) {
  return <div style={miniStatStyle}><span>{label}</span><strong>{value}</strong></div>
}

function StrategyCard({ title, text }: any) {
  return <div style={strategyCardStyle}><strong>{title}</strong><p>{text}</p></div>
}

const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 20, padding: 26, borderRadius: 30, background: 'radial-gradient(circle at top left,#7f1d1d 0,#0f172a 48%,#020617 100%)', color: '#fff', marginBottom: 18, boxShadow: '0 28px 80px rgba(15,23,42,.22)' }
const heroBadgeStyle: React.CSSProperties = { display: 'inline-flex', padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#fecaca', fontSize: 12, fontWeight: 950, marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, color: '#fff', fontSize: 34, fontWeight: 950, letterSpacing: -1.1, maxWidth: 980 }
const heroTextStyle: React.CSSProperties = { color: '#dbeafe', fontWeight: 650, lineHeight: 1.7, maxWidth: 980, margin: '12px 0 0' }
const heroActionStyle: React.CSSProperties = { minWidth: 280, padding: 18, borderRadius: 24, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.16)', display: 'grid', gap: 8 }
const metricGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 14, marginBottom: 18 }
const aiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 12 }
const aiDirectiveStyle: React.CSSProperties = { display: 'grid', gap: 10, padding: 16, borderRadius: 18, background: 'linear-gradient(135deg,#0f172a,#1e1b4b)', color: '#fff', fontWeight: 850, lineHeight: 1.5 }
const widgetGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 14 }
const premiumWidgetStyle: React.CSSProperties = { position: 'relative', overflow: 'hidden', display: 'grid', gap: 8, padding: 18, borderRadius: 22, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 14px 34px rgba(15,23,42,.055)' }
const widgetAccentStyle: React.CSSProperties = { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 }
const widgetTitleStyle: React.CSSProperties = { color: '#0f172a', fontWeight: 950 }
const widgetValueStyle: React.CSSProperties = { fontSize: 28, fontWeight: 950, letterSpacing: -.7 }
const widgetTextStyle: React.CSSProperties = { margin: 0, color: '#64748b', fontSize: 13, fontWeight: 700, lineHeight: 1.45 }
const filterRowStyle: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }
const tabStyle: React.CSSProperties = { padding: '10px 14px', borderRadius: 999, border: '1px solid #cbd5e1', color: '#0f172a', textDecoration: 'none', fontWeight: 900, background: '#fff' }
const activeTabStyle: React.CSSProperties = { ...tabStyle, background: '#0f172a', color: '#fff' }
const twoColStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.25fr .75fr', gap: 18, marginBottom: 18 }
const leadCardStyle: React.CSSProperties = { display: 'grid', gap: 10, padding: 14, borderRadius: 18, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 10px 24px rgba(15,23,42,.035)' }
const leadTopStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }
const leadMetaStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 700, lineHeight: 1.4 }
const tagRowStyle: React.CSSProperties = { display: 'flex', gap: 6, flexWrap: 'wrap' }
const nextActionStyle: React.CSSProperties = { padding: 10, borderRadius: 12, background: '#fff7ed', color: '#9a3412', fontSize: 12, fontWeight: 900 }
const actionRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 6 }
const smallButtonStyle: React.CSSProperties = { padding: '8px 9px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontSize: 12, fontWeight: 900, textDecoration: 'none', textAlign: 'center' }
const formStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }
const actionLogGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8 }
const selectStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 800 }
const smallInputStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 700 }
const buttonStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 10, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', fontWeight: 900, cursor: 'pointer' }
const primaryButtonStyle: React.CSSProperties = { padding: '12px 14px', borderRadius: 14, border: '1px solid #fff', background: '#fff', color: '#0f172a', fontWeight: 950, cursor: 'pointer' }
const activityPreviewStyle: React.CSSProperties = { display: 'grid', gap: 4, padding: 10, borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569' }
const pressureBlockStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 14, borderRadius: 18, border: '1px solid #e2e8f0', background: '#fff' }
const pressureHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const pressureRowStyle: React.CSSProperties = { display: 'grid', gap: 4, padding: 10, borderRadius: 14, background: '#f8fafc', color: '#0f172a', textDecoration: 'none', fontWeight: 800 }
const agentGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }
const agentCardStyle: React.CSSProperties = { display: 'grid', gap: 12, padding: 16, borderRadius: 20, background: '#fff', border: '1px solid #e2e8f0' }
const agentHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10 }
const agentStatGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }
const miniStatStyle: React.CSSProperties = { display: 'grid', gap: 4, padding: 10, borderRadius: 14, background: '#f8fafc', color: '#64748b', fontWeight: 800 }
const registryRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.1fr .8fr .7fr .45fr .8fr .7fr .7fr .7fr .6fr .55fr', gap: 9, alignItems: 'center', padding: 12, borderRadius: 16, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 750 }
const strategyGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }
const strategyCardStyle: React.CSSProperties = { padding: 16, borderRadius: 18, border: '1px solid #e2e8f0', background: 'linear-gradient(180deg,#fff 0%,#f8fafc 100%)', color: '#0f172a' }
const emptyStyle: React.CSSProperties = { padding: 12, borderRadius: 14, border: '1px dashed #cbd5e1', color: '#64748b', background: '#fff', fontWeight: 700 }