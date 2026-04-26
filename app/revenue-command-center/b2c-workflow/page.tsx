import AppShell from '@/app/components/erp/AppShell'
import { ERPPanel, MetricCard, StatusPill } from '@/app/components/erp/ERPPrimitives'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

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

function shortDate(v: unknown) {
  if (!v) return 'No date'
  try {
    return new Date(String(v)).toLocaleDateString()
  } catch {
    return String(v)
  }
}

function urgencyScore(lead: any) {
  let score = 40
  const service = low(lead.service_interest)
  const source = low(lead.source)
  const city = low(lead.city)
  const status = low(lead.status)

  if (service.includes('post') || service.includes('bébé') || service.includes('baby') || service.includes('accouchement')) score += 25
  if (service.includes('spécial') || service.includes('special') || service.includes('autis') || service.includes('besoin')) score += 25
  if (source.includes('whatsapp') || source.includes('meta') || source.includes('ads') || source.includes('instagram')) score += 10
  if (city.includes('rabat') || city.includes('casablanca') || city.includes('casa') || city.includes('témara') || city.includes('temara') || city.includes('salé') || city.includes('sale')) score += 8
  if (status === 'new' || status === 'pending') score += 5
  if (status === 'lost') score -= 20
  if (status === 'won' || status === 'converted') score -= 15

  return Math.max(0, Math.min(score, 100))
}

function urgencyTone(score: number) {
  if (score >= 80) return 'red'
  if (score >= 60) return 'amber'
  if (score >= 45) return 'blue'
  return 'green'
}

function nextAction(status: unknown) {
  const s = low(status)
  if (s === 'new' || s === 'pending') return 'Call + WhatsApp now'
  if (s === 'contacted') return 'Diagnose need + qualify'
  if (s === 'qualified') return 'Send offer + price logic'
  if (s === 'offer_sent') return 'Follow up and close'
  if (s === 'won' || s === 'converted') return 'Prepare contract / mission'
  if (s === 'lost') return 'Recovery sequence'
  if (s === 'archived') return 'Archived'
  return 'Review lead'
}

function isOverdue(reminder: any) {
  if (!reminder?.remind_at || low(reminder.status) === 'done') return false
  return new Date(String(reminder.remind_at)).getTime() < Date.now()
}

function groupByLead(rows: any[]) {
  return rows.reduce((acc: any, row: any) => {
    const key = row.lead_id
    if (!acc[key]) acc[key] = []
    acc[key].push(row)
    return acc
  }, {})
}

async function logActivity(supabase: any, leadId: any, type: string, description: string) {
  await supabase.from('lead_activities').insert({ lead_id: leadId, type, description })
}

async function createB2CLead(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const payload = {
    name: String(formData.get('name') || '').trim(),
    phone: String(formData.get('phone') || '').trim(),
    city: String(formData.get('city') || '').trim(),
    source: String(formData.get('source') || 'manual'),
    service_interest: String(formData.get('service_interest') || '').trim(),
    status: 'new',
    is_archived: false,
  }

  const { data: inserted, error } = await supabase.from('leads').insert(payload).select().single()

  if (error) {
    console.error('CREATE B2C LEAD ERROR:', error)
    throw new Error(error.message)
  }

  if (inserted) {
    await logActivity(supabase, inserted.id, 'creation', 'Lead created from B2C Enterprise Workspace')
    if (urgencyScore(inserted) >= 80) {
      await supabase.from('lead_alerts').insert({ lead_id: inserted.id, type: 'high_urgency', status: 'active' })
      await logActivity(supabase, inserted.id, 'alert', 'High urgency alert generated')
    }
  }

  revalidatePath('/revenue-command-center/b2c-workflow')
}

async function updateLeadStatus(formData: FormData) {
  'use server'

  const id = formData.get('id')
  const status = formData.get('status')
  if (!id || !status) return

  const supabase = await createClient()
  const { data: oldLead } = await supabase.from('leads').select('status').eq('id', String(id)).single()
  const { error } = await supabase.from('leads').update({ status: String(status) }).eq('id', String(id))

  if (error) {
    console.error('UPDATE LEAD STATUS ERROR:', error)
    throw new Error(error.message)
  }

  await logActivity(supabase, id, 'status_change', `Status changed from ${oldLead?.status || 'unknown'} to ${String(status)}`)

  if (String(status) === 'lost') {
    await supabase.from('lead_alerts').insert({ lead_id: id, type: 'lost_recovery', status: 'active' })
    await logActivity(supabase, id, 'alert', 'Lost recovery alert generated')
  }

  revalidatePath('/revenue-command-center/b2c-workflow')
}

async function addLeadNote(formData: FormData) {
  'use server'

  const leadId = formData.get('lead_id')
  const content = String(formData.get('content') || '').trim()
  if (!leadId || !content) return

  const supabase = await createClient()
  const { error } = await supabase.from('lead_notes').insert({
    lead_id: leadId,
    content,
    created_by: String(formData.get('created_by') || 'B2C Agent'),
  })

  if (error) {
    console.error('ADD NOTE ERROR:', error)
    throw new Error(error.message)
  }

  await logActivity(supabase, leadId, 'note', `Note added: ${content.slice(0, 90)}`)
  revalidatePath('/revenue-command-center/b2c-workflow')
}

async function addLeadReminder(formData: FormData) {
  'use server'

  const leadId = formData.get('lead_id')
  const remindAt = formData.get('remind_at')
  if (!leadId || !remindAt) return

  const supabase = await createClient()
  const { error } = await supabase.from('lead_reminders').insert({ lead_id: leadId, remind_at: String(remindAt), status: 'pending' })

  if (error) {
    console.error('ADD REMINDER ERROR:', error)
    throw new Error(error.message)
  }

  await logActivity(supabase, leadId, 'reminder', `Reminder set for ${String(remindAt)}`)
  revalidatePath('/revenue-command-center/b2c-workflow')
}

async function completeReminder(formData: FormData) {
  'use server'

  const reminderId = formData.get('reminder_id')
  const leadId = formData.get('lead_id')
  if (!reminderId) return

  const supabase = await createClient()
  await supabase.from('lead_reminders').update({ status: 'done' }).eq('id', String(reminderId))
  if (leadId) await logActivity(supabase, leadId, 'reminder_done', 'Reminder marked as done')
  revalidatePath('/revenue-command-center/b2c-workflow')
}

async function closeAlert(formData: FormData) {
  'use server'

  const alertId = formData.get('alert_id')
  const leadId = formData.get('lead_id')
  if (!alertId) return

  const supabase = await createClient()
  await supabase.from('lead_alerts').update({ status: 'closed' }).eq('id', String(alertId))
  if (leadId) await logActivity(supabase, leadId, 'alert_closed', 'Alert closed')
  revalidatePath('/revenue-command-center/b2c-workflow')
}

async function archiveLead(formData: FormData) {
  'use server'

  const leadId = formData.get('lead_id')
  if (!leadId) return

  const supabase = await createClient()
  await supabase.from('leads').update({ is_archived: true, status: 'archived' }).eq('id', String(leadId))
  await logActivity(supabase, leadId, 'archive', 'Lead archived')
  revalidatePath('/revenue-command-center/b2c-workflow')
}

export default async function B2CWorkflowPage({ searchParams }: any) {
  const params = await searchParams
  const selectedLeadId = params?.leadId ? String(params.leadId) : null
  const view = String(params?.view || 'active')

  const supabase = await createClient()
  const includeArchived = view === 'archived'
  const statusFilter = view === 'closed' ? ['won', 'converted', 'lost'] : null

  let leadQuery = supabase
    .from('leads')
    .select('id,name,status,city,source,service_interest,phone,created_at,is_archived')
    .order('id', { ascending: false })
    .limit(300)

  if (includeArchived) leadQuery = leadQuery.eq('is_archived', true)
  else leadQuery = leadQuery.eq('is_archived', false)

  const { data: leadsData, error: leadsError } = await leadQuery
  if (leadsError) {
    console.error('B2C LEADS QUERY ERROR:', leadsError)
    throw new Error(leadsError.message)
  }

  let leads = leadsData || []
  if (statusFilter) leads = leads.filter((l: any) => statusFilter.includes(low(l.status)))

  const leadIds = leads.map((l: any) => l.id)
  const emptyPromise = Promise.resolve({ data: [] as any[] })

  const [notesRes, activitiesRes, remindersRes, alertsRes] = await Promise.all([
    leadIds.length ? supabase.from('lead_notes').select('*').in('lead_id', leadIds).order('created_at', { ascending: false }).limit(500) : emptyPromise,
    leadIds.length ? supabase.from('lead_activities').select('*').in('lead_id', leadIds).order('created_at', { ascending: false }).limit(500) : emptyPromise,
    leadIds.length ? supabase.from('lead_reminders').select('*').in('lead_id', leadIds).order('remind_at', { ascending: true }).limit(500) : emptyPromise,
    leadIds.length ? supabase.from('lead_alerts').select('*').in('lead_id', leadIds).order('created_at', { ascending: false }).limit(500) : emptyPromise,
  ])

  const notes = notesRes.data || []
  const activities = activitiesRes.data || []
  const reminders = remindersRes.data || []
  const alerts = alertsRes.data || []

  const notesByLead = groupByLead(notes)
  const activitiesByLead = groupByLead(activities)
  const remindersByLead = groupByLead(reminders)
  const alertsByLead = groupByLead(alerts)

  const newLeads = leads.filter((l: any) => ['new', 'pending'].includes(low(l.status)))
  const contacted = leads.filter((l: any) => low(l.status) === 'contacted')
  const qualified = leads.filter((l: any) => low(l.status) === 'qualified')
  const offerSent = leads.filter((l: any) => low(l.status) === 'offer_sent')
  const won = leads.filter((l: any) => ['won', 'converted'].includes(low(l.status)))
  const lost = leads.filter((l: any) => low(l.status) === 'lost')

  const hotLeads = leads.map((lead: any) => ({ ...lead, score: urgencyScore(lead) })).sort((a: any, b: any) => b.score - a.score).slice(0, 10)
  const overdueReminders = reminders.filter((r: any) => isOverdue(r))
  const activeAlerts = alerts.filter((a: any) => low(a.status) === 'active')
  const selectedLead = selectedLeadId ? leads.find((l: any) => String(l.id) === selectedLeadId) : hotLeads[0] || leads[0] || null

  return (
    <AppShell
      title="B2C Enterprise CRM Workspace"
      subtitle="Corporate family acquisition system with pipeline, registry, notes, reminders, timeline, alerts and compliance traceability."
      breadcrumbs={[{ label: 'Revenue Command Center' }, { label: 'B2C Workflow' }]}
    >
      <section style={heroStyle}>
        <div>
          <div style={heroBadgeStyle}>B2C Revenue Engine • Enterprise Mode</div>
          <h2 style={heroTitleStyle}>Convert Moroccan family demand into trusted AngelCare missions with full operational traceability.</h2>
          <p style={heroTextStyle}>
            Agents can create leads, prioritize hot opportunities, call, WhatsApp, qualify, add notes, set reminders,
            review history, manage alerts, close deals and track every revenue action.
          </p>
        </div>
        <div style={heroStatusStyle}>
          <strong>{leads.length}</strong>
          <span>visible leads</span>
          <small>{activeAlerts.length} active alerts • {overdueReminders.length} overdue reminders</small>
        </div>
      </section>

      <section style={metricGridStyle}>
        <MetricCard label="Total B2C leads" value={leads.length} sub="current filtered registry" icon="🏡" accent="#0f766e" />
        <MetricCard label="New / Pending" value={newLeads.length} sub="needs fast contact" icon="📥" accent="#7c3aed" />
        <MetricCard label="Qualified / Offer" value={qualified.length + offerSent.length} sub="conversion zone" icon="🎯" accent="#166534" />
        <MetricCard label="Won" value={won.length} sub={`${lost.length} lost / recovery`} icon="💰" accent="#15803d" />
        <MetricCard label="Alerts" value={activeAlerts.length} sub={`${overdueReminders.length} reminders overdue`} icon="🚨" accent="#991b1b" />
      </section>

      <div style={filterRowStyle}>
        <Link href="/revenue-command-center/b2c-workflow" style={view === 'active' ? activeTabStyle : tabStyle}>Active Leads</Link>
        <Link href="/revenue-command-center/b2c-workflow?view=closed" style={view === 'closed' ? activeTabStyle : tabStyle}>Closed / Won / Lost</Link>
        <Link href="/revenue-command-center/b2c-workflow?view=archived" style={view === 'archived' ? activeTabStyle : tabStyle}>Archived</Link>
      </div>

      <div style={twoColStyle}>
        <ERPPanel title="+ New B2C Lead" subtitle="Create a parent/family opportunity directly from the agent workspace.">
          <form action={createB2CLead} style={formGridStyle}>
            <input name="name" placeholder="Parent name" required style={inputStyle} />
            <input name="phone" placeholder="Phone / WhatsApp" required style={inputStyle} />
            <input name="city" placeholder="City: Rabat, Casa, Témara..." style={inputStyle} />
            <select name="source" defaultValue="manual" style={inputStyle}>
              <option value="manual">Manual</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="meta_ads">Meta Ads</option>
              <option value="referral">Referral</option>
              <option value="website">Website</option>
              <option value="instagram">Instagram</option>
              <option value="call">Phone Call</option>
              <option value="walk_in">Walk-in</option>
            </select>
            <select name="service_interest" defaultValue="Garde enfant à domicile" style={inputStyle}>
              <option value="Garde enfant à domicile">Garde enfant à domicile</option>
              <option value="Bébé post accouchement">Bébé post accouchement</option>
              <option value="Garde enfant spécial">Garde enfant spécial</option>
              <option value="Accompagnement école">Accompagnement école</option>
              <option value="Flashcards / éducation">Flashcards / éducation</option>
              <option value="AngelCare Academy">AngelCare Academy</option>
            </select>
            <button type="submit" style={primaryButtonStyle}>Create lead</button>
          </form>
        </ERPPanel>

        <ERPPanel title="Hot Priority Queue" subtitle="Lead order based on urgency, service type, source and city.">
          <div style={{ display: 'grid', gap: 10 }}>
            {hotLeads.length ? hotLeads.map((lead: any) => <LeadMini key={lead.id} lead={lead} />) : <div style={emptyStyle}>No leads yet. Create your first B2C lead.</div>}
          </div>
        </ERPPanel>
      </div>

      <ERPPanel title="B2C Lead Pipeline" subtitle="Agent-ready workflow: call, WhatsApp, qualify, update status and move leads across conversion path.">
        <div style={pipelineGridStyle}>
          <PipelineColumn title="New / Pending" leads={newLeads} tone="purple" notesByLead={notesByLead} remindersByLead={remindersByLead} alertsByLead={alertsByLead} />
          <PipelineColumn title="Contacted" leads={contacted} tone="blue" notesByLead={notesByLead} remindersByLead={remindersByLead} alertsByLead={alertsByLead} />
          <PipelineColumn title="Qualified" leads={qualified} tone="green" notesByLead={notesByLead} remindersByLead={remindersByLead} alertsByLead={alertsByLead} />
          <PipelineColumn title="Offer Sent" leads={offerSent} tone="amber" notesByLead={notesByLead} remindersByLead={remindersByLead} alertsByLead={alertsByLead} />
          <PipelineColumn title="Won / Lost" leads={[...won, ...lost]} tone="red" notesByLead={notesByLead} remindersByLead={remindersByLead} alertsByLead={alertsByLead} />
        </div>
      </ERPPanel>

      <div style={detailGridStyle}>
        <ERPPanel title="Lead Detail Panel" subtitle="Timeline, notes, reminders and alerts for the selected lead.">
          {selectedLead ? (
            <LeadDetail
              lead={selectedLead}
              notes={notesByLead[selectedLead.id] || []}
              activities={activitiesByLead[selectedLead.id] || []}
              reminders={remindersByLead[selectedLead.id] || []}
              alerts={alertsByLead[selectedLead.id] || []}
            />
          ) : <div style={emptyStyle}>Select or create a lead to open the detail panel.</div>}
        </ERPPanel>

        <ERPPanel title="Alert & Reminder Center" subtitle="Corporate control layer for overdue follow-ups and active lead risks.">
          <div style={{ display: 'grid', gap: 12 }}>
            <AlertReminderCenter leads={leads} reminders={overdueReminders} alerts={activeAlerts} />
          </div>
        </ERPPanel>
      </div>

      <ERPPanel title="Full Lead Registry" subtitle="All visible leads with status, last action indicators, notes count, reminders and alerts.">
        <div style={{ display: 'grid', gap: 10 }}>
          {leads.length ? leads.map((lead: any) => (
            <RegistryRow key={lead.id} lead={lead} notes={notesByLead[lead.id] || []} reminders={remindersByLead[lead.id] || []} alerts={alertsByLead[lead.id] || []} />
          )) : <div style={emptyStyle}>No leads in this view.</div>}
        </div>
      </ERPPanel>

      <ERPPanel title="B2C Agent Playbook" subtitle="Daily execution logic for Moroccan family conversion.">
        <div style={playbookGridStyle}>
          <Playbook title="1. Response SLA" text="New parent leads must receive WhatsApp + call attempt quickly. Speed protects conversion." />
          <Playbook title="2. Trust Building" text="Explain safety, trained caregivers, supervision, replacement policy and AngelCare quality control." />
          <Playbook title="3. Diagnosis" text="Identify child age, urgency, schedule, city, service type, emotional concern and budget sensitivity." />
          <Playbook title="4. Offer Framing" text="Present a clear service package with duration, price logic, process and next step." />
          <Playbook title="5. Closing Push" text="Use availability, urgency and premium positioning to secure confirmation." />
          <Playbook title="6. Recovery Loop" text="Lost or silent leads should receive follow-ups after 24h, 72h and 7 days." />
        </div>
      </ERPPanel>
    </AppShell>
  )
}

function LeadMini({ lead }: any) {
  return (
    <Link href={`/revenue-command-center/b2c-workflow?leadId=${lead.id}`} style={miniLeadStyle}>
      <div>
        <strong style={{ color: '#0f172a' }}>{lead.name || `Lead #${lead.id}`}</strong>
        <div style={leadMetaStyle}>{lead.service_interest || 'Service pending'} • {lead.city || 'City pending'}</div>
      </div>
      <StatusPill tone={urgencyTone(lead.score)}>{lead.score}/100</StatusPill>
    </Link>
  )
}

function PipelineColumn({ title, leads, tone, notesByLead, remindersByLead, alertsByLead }: any) {
  return (
    <div style={columnStyle}>
      <div style={columnHeaderStyle}><strong>{title}</strong><StatusPill tone={tone}>{leads.length}</StatusPill></div>
      <div style={{ display: 'grid', gap: 10 }}>
        {leads.length ? leads.slice(0, 16).map((lead: any) => <LeadCard key={lead.id} lead={lead} notes={notesByLead[lead.id] || []} reminders={remindersByLead[lead.id] || []} alerts={alertsByLead[lead.id] || []} />) : <div style={emptyStyle}>No leads here.</div>}
      </div>
    </div>
  )
}

function LeadCard({ lead, notes, reminders, alerts }: any) {
  const phone = cleanPhone(lead.phone)
  const wa = phone ? `https://wa.me/${phone}?text=${encodeURIComponent('Bonjour, ici AngelCare. Nous vous contactons concernant votre demande de service.')}` : '#'
  const score = urgencyScore(lead)
  const openReminders = reminders.filter((r: any) => low(r.status) !== 'done')
  const activeAlerts = alerts.filter((a: any) => low(a.status) === 'active')

  return (
    <div style={leadCardStyle}>
      <div style={leadTopStyle}><strong style={{ color: '#0f172a' }}>{lead.name || `Lead #${lead.id}`}</strong><StatusPill tone={urgencyTone(score)}>{score}/100</StatusPill></div>
      <span style={leadMetaStyle}>{lead.service_interest || 'Service pending'} • {lead.city || 'City pending'}</span>
      <span style={leadMetaStyle}>Source: {lead.source || 'unknown'} • {lead.phone || 'no phone'}</span>
      <div style={tagRowStyle}>
        <StatusPill tone="blue">{notes.length} notes</StatusPill>
        <StatusPill tone={openReminders.length ? 'amber' : 'green'}>{openReminders.length} reminders</StatusPill>
        <StatusPill tone={activeAlerts.length ? 'red' : 'green'}>{activeAlerts.length} alerts</StatusPill>
      </div>
      <div style={nextActionStyle}>Next: {nextAction(lead.status)}</div>
      <div style={actionRowStyle}>
        <a href={phone ? `tel:${phone}` : '#'} style={smallButtonStyle}>Call</a>
        <a href={wa} target="_blank" rel="noreferrer" style={smallButtonStyle}>WhatsApp</a>
        <Link href={`/revenue-command-center/b2c-workflow?leadId=${lead.id}`} style={smallButtonStyle}>Detail</Link>
      </div>
      <form action={updateLeadStatus} style={formStyle}>
        <input type="hidden" name="id" value={lead.id} />
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
        <button type="submit" style={buttonStyle}>Update</button>
      </form>
      <form action={addLeadNote} style={noteFormStyle}>
        <input type="hidden" name="lead_id" value={lead.id} />
        <input name="content" placeholder="Quick note / objection..." style={smallInputStyle} />
        <button type="submit" style={buttonStyle}>Note</button>
      </form>
    </div>
  )
}

function LeadDetail({ lead, notes, activities, reminders, alerts }: any) {
  const phone = cleanPhone(lead.phone)
  const wa = phone ? `https://wa.me/${phone}?text=${encodeURIComponent('Bonjour, ici AngelCare. Suite à votre demande, nous revenons vers vous pour finaliser les détails.')}` : '#'

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={detailHeaderStyle}>
        <div><h3 style={detailTitleStyle}>{lead.name || `Lead #${lead.id}`}</h3><p style={leadMetaStyle}>{lead.service_interest || 'Service pending'} • {lead.city || 'City pending'} • Source: {lead.source || 'unknown'}</p></div>
        <StatusPill tone={urgencyTone(urgencyScore(lead))}>{urgencyScore(lead)}/100</StatusPill>
      </div>
      <div style={actionRowStyle}><a href={phone ? `tel:${phone}` : '#'} style={smallButtonStyle}>Call</a><a href={wa} target="_blank" rel="noreferrer" style={smallButtonStyle}>WhatsApp</a><Link href={`/leads/${lead.id}`} style={smallButtonStyle}>Open CRM</Link></div>
      <div style={detailFormsGridStyle}>
        <form action={addLeadNote} style={verticalFormStyle}><input type="hidden" name="lead_id" value={lead.id} /><strong style={miniTitleStyle}>Add comment / note</strong><textarea name="content" placeholder="Agent note, client reaction, objection, family situation..." style={textareaStyle} required /><button type="submit" style={primaryButtonStyle}>Save note</button></form>
        <form action={addLeadReminder} style={verticalFormStyle}><input type="hidden" name="lead_id" value={lead.id} /><strong style={miniTitleStyle}>Set reminder / follow-up</strong><input type="datetime-local" name="remind_at" style={inputStyle} required /><button type="submit" style={primaryButtonStyle}>Set reminder</button></form>
        <form action={archiveLead} style={verticalFormStyle}><input type="hidden" name="lead_id" value={lead.id} /><strong style={miniTitleStyle}>Compliance action</strong><p style={leadMetaStyle}>Archive only when this lead is no longer useful for active sales or recovery.</p><button type="submit" style={dangerButtonStyle}>Archive lead</button></form>
      </div>
      <div style={detailFormsGridStyle}>
        <MiniPanel title="Notes / Comments">{notes.length ? notes.slice(0, 8).map((n: any) => <TimelineItem key={n.id} title={n.created_by || 'Agent'} text={n.content} date={n.created_at} />) : <div style={emptyStyle}>No notes yet.</div>}</MiniPanel>
        <MiniPanel title="Reminders">{reminders.length ? reminders.slice(0, 8).map((r: any) => <ReminderItem key={r.id} reminder={r} leadId={lead.id} />) : <div style={emptyStyle}>No reminders yet.</div>}</MiniPanel>
        <MiniPanel title="Alerts">{alerts.length ? alerts.slice(0, 8).map((a: any) => <AlertItem key={a.id} alert={a} leadId={lead.id} />) : <div style={emptyStyle}>No active alerts.</div>}</MiniPanel>
      </div>
      <MiniPanel title="Timeline / Activity History">{activities.length ? activities.slice(0, 16).map((a: any) => <TimelineItem key={a.id} title={a.type || 'activity'} text={a.description || 'No description'} date={a.created_at} />) : <div style={emptyStyle}>No activity yet.</div>}</MiniPanel>
    </div>
  )
}

function ReminderItem({ reminder, leadId }: any) {
  return (
    <div style={timelineItemStyle}>
      <strong>{isOverdue(reminder) ? 'Overdue follow-up' : 'Follow-up'}</strong>
      <span>{safeDate(reminder.remind_at)}</span>
      <StatusPill tone={isOverdue(reminder) ? 'red' : low(reminder.status) === 'done' ? 'green' : 'amber'}>{reminder.status || 'pending'}</StatusPill>
      {low(reminder.status) !== 'done' ? <form action={completeReminder}><input type="hidden" name="reminder_id" value={reminder.id} /><input type="hidden" name="lead_id" value={leadId} /><button type="submit" style={miniButtonStyle}>Mark done</button></form> : null}
    </div>
  )
}

function AlertItem({ alert, leadId }: any) {
  return (
    <div style={timelineItemStyle}>
      <strong>{alert.type || 'Alert'}</strong>
      <span>Status: {alert.status || 'active'}</span>
      <small>{safeDate(alert.created_at)}</small>
      {low(alert.status) === 'active' ? <form action={closeAlert}><input type="hidden" name="alert_id" value={alert.id} /><input type="hidden" name="lead_id" value={leadId} /><button type="submit" style={miniButtonStyle}>Close alert</button></form> : null}
    </div>
  )
}

function TimelineItem({ title, text, date }: any) {
  return <div style={timelineItemStyle}><strong>{title}</strong><span>{text}</span><small>{safeDate(date)}</small></div>
}

function AlertReminderCenter({ leads, reminders, alerts }: any) {
  const leadName = (leadId: any) => leads.find((l: any) => String(l.id) === String(leadId))?.name || `Lead #${leadId}`
  return (
    <>
      <div style={controlBlockStyle}><strong>Overdue reminders</strong>{reminders.length ? reminders.slice(0, 8).map((r: any) => <Link key={r.id} href={`/revenue-command-center/b2c-workflow?leadId=${r.lead_id}`} style={centerRowStyle}><span>{leadName(r.lead_id)}</span><small>{safeDate(r.remind_at)}</small></Link>) : <div style={emptyStyle}>No overdue reminders.</div>}</div>
      <div style={controlBlockStyle}><strong>Active alerts</strong>{alerts.length ? alerts.slice(0, 8).map((a: any) => <Link key={a.id} href={`/revenue-command-center/b2c-workflow?leadId=${a.lead_id}`} style={centerRowStyle}><span>{leadName(a.lead_id)}</span><small>{a.type || 'alert'} • {shortDate(a.created_at)}</small></Link>) : <div style={emptyStyle}>No active alerts.</div>}</div>
    </>
  )
}

function RegistryRow({ lead, notes, reminders, alerts }: any) {
  const openReminders = reminders.filter((r: any) => low(r.status) !== 'done')
  const activeAlerts = alerts.filter((a: any) => low(a.status) === 'active')
  return <Link href={`/revenue-command-center/b2c-workflow?leadId=${lead.id}`} style={registryRowStyle}><strong>{lead.name || `Lead #${lead.id}`}</strong><span>{lead.service_interest || 'Service pending'}</span><span>{lead.city || 'City pending'}</span><StatusPill tone={urgencyTone(urgencyScore(lead))}>{urgencyScore(lead)}/100</StatusPill><StatusPill tone="blue">{lead.status || 'new'}</StatusPill><span>{notes.length} notes</span><span>{openReminders.length} reminders</span><span>{activeAlerts.length} alerts</span></Link>
}

function MiniPanel({ title, children }: any) {
  return <div style={miniPanelStyle}><strong style={miniTitleStyle}>{title}</strong><div style={{ display: 'grid', gap: 8 }}>{children}</div></div>
}

function Playbook({ title, text }: any) {
  return <div style={playbookCardStyle}><strong>{title}</strong><p>{text}</p></div>
}

const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 20, padding: 26, borderRadius: 30, background: 'radial-gradient(circle at top left,#134e4a 0,#0f172a 48%,#020617 100%)', color: '#fff', marginBottom: 18, boxShadow: '0 28px 80px rgba(15,23,42,.22)' }
const heroBadgeStyle: React.CSSProperties = { display: 'inline-flex', padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#a7f3d0', fontSize: 12, fontWeight: 950, marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, color: '#fff', fontSize: 34, fontWeight: 950, letterSpacing: -1.1, maxWidth: 980 }
const heroTextStyle: React.CSSProperties = { color: '#dbeafe', fontWeight: 650, lineHeight: 1.7, maxWidth: 980, margin: '12px 0 0' }
const heroStatusStyle: React.CSSProperties = { minWidth: 220, padding: 18, borderRadius: 24, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.16)', display: 'grid', gap: 4 }
const metricGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 14, marginBottom: 18 }
const filterRowStyle: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }
const tabStyle: React.CSSProperties = { padding: '10px 14px', borderRadius: 999, border: '1px solid #cbd5e1', color: '#0f172a', textDecoration: 'none', fontWeight: 900, background: '#fff' }
const activeTabStyle: React.CSSProperties = { ...tabStyle, background: '#0f172a', color: '#fff', border: '1px solid #0f172a' }
const twoColStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }
const formGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }
const inputStyle: React.CSSProperties = { padding: '12px 14px', borderRadius: 14, border: '1px solid #cbd5e1', fontWeight: 800, color: '#0f172a', background: '#fff' }
const textareaStyle: React.CSSProperties = { ...inputStyle, minHeight: 96, resize: 'vertical' }
const primaryButtonStyle: React.CSSProperties = { padding: '12px 14px', borderRadius: 14, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const dangerButtonStyle: React.CSSProperties = { ...primaryButtonStyle, background: '#991b1b', border: '1px solid #991b1b' }
const pipelineGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 14 }
const columnStyle: React.CSSProperties = { padding: 14, borderRadius: 22, border: '1px solid #e2e8f0', background: '#f8fafc', minHeight: 420 }
const columnHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, color: '#0f172a' }
const leadCardStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 12, borderRadius: 16, background: '#fff', border: '1px solid #e2e8f0' }
const leadTopStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }
const leadMetaStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 700, lineHeight: 1.4 }
const tagRowStyle: React.CSSProperties = { display: 'flex', gap: 6, flexWrap: 'wrap' }
const nextActionStyle: React.CSSProperties = { padding: 10, borderRadius: 12, background: '#ecfdf5', color: '#166534', fontSize: 12, fontWeight: 900 }
const actionRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 6 }
const smallButtonStyle: React.CSSProperties = { padding: '8px 9px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontSize: 12, fontWeight: 900, textDecoration: 'none', textAlign: 'center' }
const formStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }
const noteFormStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }
const selectStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 800 }
const smallInputStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 700 }
const buttonStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 10, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', fontWeight: 900, cursor: 'pointer' }
const miniLeadStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: 12, borderRadius: 16, background: '#fff', border: '1px solid #e2e8f0', textDecoration: 'none' }
const emptyStyle: React.CSSProperties = { padding: 12, borderRadius: 14, border: '1px dashed #cbd5e1', color: '#64748b', background: '#fff', fontWeight: 700 }
const detailGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.3fr .7fr', gap: 18, marginBottom: 18 }
const detailHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 14, padding: 16, borderRadius: 20, background: '#f8fafc', border: '1px solid #e2e8f0' }
const detailTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 24, fontWeight: 950 }
const detailFormsGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }
const verticalFormStyle: React.CSSProperties = { display: 'grid', gap: 10, padding: 14, borderRadius: 18, border: '1px solid #e2e8f0', background: '#fff' }
const miniPanelStyle: React.CSSProperties = { display: 'grid', gap: 10, padding: 14, borderRadius: 18, border: '1px solid #e2e8f0', background: '#fff' }
const miniTitleStyle: React.CSSProperties = { color: '#0f172a', fontWeight: 950 }
const timelineItemStyle: React.CSSProperties = { display: 'grid', gap: 4, padding: 10, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }
const miniButtonStyle: React.CSSProperties = { padding: '7px 9px', borderRadius: 10, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', fontWeight: 800, cursor: 'pointer' }
const controlBlockStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 14, borderRadius: 18, border: '1px solid #e2e8f0', background: '#fff' }
const centerRowStyle: React.CSSProperties = { display: 'grid', gap: 4, padding: 10, borderRadius: 14, background: '#f8fafc', color: '#0f172a', textDecoration: 'none', fontWeight: 800 }
const registryRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.2fr 1.2fr .8fr .6fr .8fr .6fr .8fr .6fr', gap: 10, alignItems: 'center', padding: 13, borderRadius: 16, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', textDecoration: 'none', fontWeight: 750 }
const playbookGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }
const playbookCardStyle: React.CSSProperties = { padding: 16, borderRadius: 18, border: '1px solid #e2e8f0', background: 'linear-gradient(180deg,#fff 0%,#f8fafc 100%)', color: '#0f172a' }