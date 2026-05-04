'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'

type Lead = {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  organization: string | null
  segment: string
  source: string
  need_type: string
  city: string | null
  status: string
  priority: string
  assigned_to: string | null
  next_action: string | null
  next_action_at: string | null
  value_estimate: number | null
  loss_reason: string | null
  care_zone?: string | null
  service_frequency?: string | null
  preferred_start_date?: string | null
  family_context?: string | null
  decision_maker?: string | null
  objection?: string | null
  created_at: string
  updated_at?: string
}

type Task = {
  id: string
  lead_id: string | null
  title: string
  task_type: string
  status: string
  priority: string
  assigned_to: string | null
  due_at: string | null
}

type Activity = {
  id: string
  lead_id: string | null
  activity_type: string
  outcome: string
  note: string | null
  created_by: string | null
  created_at: string
}

type Offer = {
  id: string
  lead_id: string | null
  title: string
  amount: number
  status: string
  valid_until: string | null
  note: string | null
}

type Partner = {
  id: string
  organization: string
  contact_name: string | null
  phone: string | null
  partner_type: string
  stage: string
  assigned_to: string | null
  next_action: string | null
  note?: string | null
}

type Campaign = {
  id: string
  name: string
  channel: string
  status: string
  owner: string | null
  target_segment: string | null
  objective: string | null
}

type ConfigOption = { category: string; label: string; value: string }

type SelectOption = { label: string; value: string }

const supabase = createClient()

const leadStages: SelectOption[] = [
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Need confirmed', value: 'need_confirmed' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Care plan', value: 'care_plan' },
  { label: 'Offer sent', value: 'offer_sent' },
  { label: 'Follow-up', value: 'follow_up' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
]

const campaignStatuses = ['planned', 'live', 'paused', 'completed']
const partnerStages = ['prospecting', 'contacted', 'meeting', 'agreement', 'active', 'inactive']

const emptyLead = {
  full_name: '',
  phone: '',
  email: '',
  organization: '',
  segment: 'B2C Family',
  source: 'Manual',
  need_type: "Garde d'enfants à domicile",
  city: 'Casablanca',
  care_zone: '',
  service_frequency: 'Ponctuel',
  preferred_start_date: '',
  family_context: '',
  decision_maker: '',
  value_estimate: '0',
  assigned_to: '',
}

const defaultOptions: Record<string, string[]> = {
  segment: ['B2C Family', 'Senior / Patient Family', 'School', 'Clinic', 'Hotel', 'Company', 'Agency / Partner'],
  source: ['Manual', 'Phone inbound', 'WhatsApp', 'Meta Ads', 'Referral', 'Field prospecting', 'Website', 'Partner'],
  need_type: ["Garde d'enfants à domicile", 'Aide à domicile', 'Garde malade', 'Nounou régulière', 'Accompagnement senior', 'Service institutionnel', 'Partenariat commercial'],
  priority: ['low', 'normal', 'high', 'urgent'],
  agent: ['Agent 1', 'Agent 2', 'Supervisor'],
  service_frequency: ['Ponctuel', 'Hebdomadaire', 'Quotidien', 'Mensuel', 'Urgence'],
  care_zone: ['Casablanca', 'Rabat', 'Temara', 'Mohammedia', 'Marrakech', 'Autre'],
}

export default function BusinessDevTerminal() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [config, setConfig] = useState<ConfigOption[]>([])
  const [selectedLeadId, setSelectedLeadId] = useState<string>('')
  const [leadForm, setLeadForm] = useState(emptyLead)
  const [filter, setFilter] = useState('active')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('Ready. This terminal is execution-only: every control creates, updates, closes, or logs real work.')
  const [actionForm, setActionForm] = useState({
    note: '',
    next_action: '',
    due_at: '',
    assigned_to: '',
    offer_title: '',
    offer_amount: '',
    offer_note: '',
    loss_reason: '',
    objection: '',
  })
  const [campaignForm, setCampaignForm] = useState({ name: '', channel: 'Phone', owner: '', target_segment: '', objective: '' })
  const [partnerForm, setPartnerForm] = useState({ organization: '', contact_name: '', phone: '', partner_type: 'Referral', assigned_to: '', note: '' })

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) || leads[0]
  const selectedLeadTasks = tasks.filter((task) => task.lead_id === selectedLead?.id)
  const selectedLeadActivities = activities.filter((activity) => activity.lead_id === selectedLead?.id)
  const selectedLeadOffers = offers.filter((offer) => offer.lead_id === selectedLead?.id)

  const activeLeads = useMemo(() => leads.filter((lead) => !['won', 'lost'].includes(lead.status)), [leads])
  const overdueTasks = useMemo(() => tasks.filter((task) => task.status !== 'done' && task.due_at && new Date(task.due_at) < new Date()), [tasks])
  const todayTasks = useMemo(() => tasks.filter((task) => task.status !== 'done' && isToday(task.due_at)), [tasks])

  const visibleLeads = useMemo(() => {
    if (filter === 'active') return activeLeads
    if (filter === 'urgent') return leads.filter((lead) => ['urgent', 'high'].includes(lead.priority))
    if (filter === 'today') return leads.filter((lead) => isToday(lead.next_action_at))
    if (filter === 'overdue') return leads.filter((lead) => lead.next_action_at && new Date(lead.next_action_at) < new Date() && !['won', 'lost'].includes(lead.status))
    return leads.filter((lead) => lead.status === filter)
  }, [activeLeads, filter, leads])

  function optionValues(category: string) {
    const values = config.filter((item) => item.category === category).map((item) => item.value)
    return values.length ? values : defaultOptions[category] || []
  }

  async function loadAll() {
    const [leadRes, taskRes, activityRes, offerRes, partnerRes, campaignRes, configRes] = await Promise.all([
      supabase.from('bd_leads').select('*').order('updated_at', { ascending: false }).limit(150),
      supabase.from('bd_tasks').select('*').order('due_at', { ascending: true, nullsFirst: false }).limit(150),
      supabase.from('bd_activities').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('bd_offers').select('*').order('created_at', { ascending: false }).limit(120),
      supabase.from('bd_partners').select('*').order('updated_at', { ascending: false }).limit(80),
      supabase.from('bd_campaigns').select('*').order('updated_at', { ascending: false }).limit(80),
      supabase.from('bd_config_options').select('category,label,value').eq('is_active', true).order('sort_order', { ascending: true }),
    ])

    if (leadRes.error) {
      setMessage(`Database not ready: ${leadRes.error.message}. Run the production SQL migration first.`)
      return
    }

    setLeads(leadRes.data || [])
    setTasks(taskRes.data || [])
    setActivities(activityRes.data || [])
    setOffers(offerRes.data || [])
    setPartners(partnerRes.data || [])
    setCampaigns(campaignRes.data || [])
    setConfig(configRes.data || [])

    if (!selectedLeadId && leadRes.data?.[0]?.id) setSelectedLeadId(leadRes.data[0].id)
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function run(label: string, fn: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    setMessage(`Executing: ${label}`)
    try {
      await fn()
      await loadAll()
      setMessage(`Done: ${label}`)
    } catch (error: any) {
      setMessage(`Failed: ${error?.message || 'Unknown error'}`)
    } finally {
      setBusy(false)
    }
  }

  async function createLead() {
    const phoneOrEmail = leadForm.phone.trim() || leadForm.email.trim()
    if (!leadForm.full_name.trim()) return setMessage('Lead name is required.')
    if (!phoneOrEmail) return setMessage('Phone or email is required so the agent can execute follow-up.')

    await run('Create AngelCare opportunity', async () => {
      const { error } = await supabase.from('bd_leads').insert({
        full_name: leadForm.full_name.trim(),
        phone: leadForm.phone.trim() || null,
        email: leadForm.email.trim() || null,
        organization: leadForm.organization.trim() || null,
        segment: leadForm.segment,
        source: leadForm.source,
        need_type: leadForm.need_type,
        city: leadForm.city.trim() || null,
        care_zone: leadForm.care_zone.trim() || leadForm.city.trim() || null,
        service_frequency: leadForm.service_frequency,
        preferred_start_date: leadForm.preferred_start_date || null,
        family_context: leadForm.family_context.trim() || null,
        decision_maker: leadForm.decision_maker.trim() || null,
        value_estimate: Number(leadForm.value_estimate || 0),
        assigned_to: leadForm.assigned_to.trim() || null,
        priority: inferPriority(leadForm.service_frequency, leadForm.preferred_start_date),
        status: 'new',
        next_action: 'Premier contact + clarification besoin AngelCare',
      })
      if (error) throw error
      setLeadForm(emptyLead)
    })
  }

  async function updateLead(fields: Partial<Lead>, label = 'Update lead') {
    if (!selectedLead) return setMessage('Select a lead first.')
    await run(label, async () => {
      const { error } = await supabase.from('bd_leads').update(fields).eq('id', selectedLead.id)
      if (error) throw error
    })
  }

  async function moveLead(status: string) {
    if (!selectedLead) return setMessage('Select a lead first.')
    await run(`Move to ${status}`, async () => {
      const { error } = await supabase.from('bd_leads').update({ status }).eq('id', selectedLead.id)
      if (error) throw error
      const { error: activityError } = await supabase.from('bd_activities').insert({
        lead_id: selectedLead.id,
        activity_type: 'stage_change',
        outcome: status,
        note: `Moved to ${status}`,
        created_by: actionForm.assigned_to || selectedLead.assigned_to,
      })
      if (activityError) throw activityError
    })
  }

  async function logActivity(activity_type: string, outcome = 'logged') {
    if (!selectedLead) return setMessage('Select a lead first.')
    await run(`Log ${activity_type}`, async () => {
      const { error } = await supabase.from('bd_activities').insert({
        lead_id: selectedLead.id,
        activity_type,
        outcome,
        note: actionForm.note || null,
        created_by: actionForm.assigned_to || selectedLead.assigned_to || null,
      })
      if (error) throw error
      setActionForm((old) => ({ ...old, note: '' }))
    })
  }

  async function createTask(task_type: string, fallbackTitle: string) {
    if (!selectedLead) return setMessage('Select a lead first.')
    const title = actionForm.next_action || `${fallbackTitle} — ${selectedLead.full_name}`
    await run('Create task + next action', async () => {
      const { error } = await supabase.from('bd_tasks').insert({
        lead_id: selectedLead.id,
        title,
        task_type,
        priority: selectedLead.priority,
        assigned_to: actionForm.assigned_to || selectedLead.assigned_to,
        due_at: actionForm.due_at || null,
      })
      if (error) throw error

      const { error: leadError } = await supabase
        .from('bd_leads')
        .update({ next_action: title, next_action_at: actionForm.due_at || null, assigned_to: actionForm.assigned_to || selectedLead.assigned_to })
        .eq('id', selectedLead.id)
      if (leadError) throw leadError

      const { error: activityError } = await supabase.from('bd_activities').insert({
        lead_id: selectedLead.id,
        activity_type: 'task_created',
        outcome: task_type,
        note: title,
        created_by: actionForm.assigned_to || selectedLead.assigned_to,
      })
      if (activityError) throw activityError
      setActionForm((old) => ({ ...old, next_action: '', due_at: '' }))
    })
  }

  async function completeTask(task: Task) {
    await run('Complete task', async () => {
      const { error } = await supabase.from('bd_tasks').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', task.id)
      if (error) throw error
      await supabase.from('bd_activities').insert({ lead_id: task.lead_id, activity_type: 'task_completed', outcome: task.task_type, note: task.title })
    })
  }

  async function createOffer() {
    if (!selectedLead) return setMessage('Select a lead first.')
    if (!actionForm.offer_title.trim()) return setMessage('Offer title is required.')
    await run('Create AngelCare offer record', async () => {
      const { error } = await supabase.from('bd_offers').insert({
        lead_id: selectedLead.id,
        title: actionForm.offer_title.trim(),
        amount: Number(actionForm.offer_amount || 0),
        status: 'sent',
        note: actionForm.offer_note || null,
      })
      if (error) throw error
      const { error: stageError } = await supabase.from('bd_leads').update({ status: 'offer_sent', next_action: 'Relance offre + confirmation décision' }).eq('id', selectedLead.id)
      if (stageError) throw stageError
      await supabase.from('bd_activities').insert({ lead_id: selectedLead.id, activity_type: 'offer', outcome: 'sent', note: actionForm.offer_title.trim() })
      setActionForm((old) => ({ ...old, offer_title: '', offer_amount: '', offer_note: '' }))
    })
  }

  async function markWon() {
    if (!selectedLead) return setMessage('Select a lead first.')
    await run('Mark won + create handover task', async () => {
      const { error } = await supabase.from('bd_leads').update({ status: 'won', won_at: new Date().toISOString(), next_action: 'Handover operations: family/service onboarding' }).eq('id', selectedLead.id)
      if (error) throw error
      await supabase.from('bd_tasks').insert({ lead_id: selectedLead.id, title: `Handover operations — ${selectedLead.full_name}`, task_type: 'handover_operations', priority: 'high', assigned_to: selectedLead.assigned_to })
      await supabase.from('bd_activities').insert({ lead_id: selectedLead.id, activity_type: 'close', outcome: 'won', note: actionForm.note || 'Opportunity won; operations handover created.' })
    })
  }

  async function markLost() {
    if (!selectedLead) return setMessage('Select a lead first.')
    if (!actionForm.loss_reason.trim()) return setMessage('Loss reason is required.')
    await run('Mark lost', async () => {
      const { error } = await supabase.from('bd_leads').update({ status: 'lost', lost_at: new Date().toISOString(), loss_reason: actionForm.loss_reason }).eq('id', selectedLead.id)
      if (error) throw error
      await supabase.from('bd_activities').insert({ lead_id: selectedLead.id, activity_type: 'close', outcome: 'lost', note: actionForm.loss_reason })
      setActionForm((old) => ({ ...old, loss_reason: '' }))
    })
  }

  async function saveObjection() {
    if (!selectedLead) return setMessage('Select a lead first.')
    if (!actionForm.objection.trim()) return setMessage('Write the objection first.')
    await run('Save objection', async () => {
      const { error } = await supabase.from('bd_leads').update({ objection: actionForm.objection }).eq('id', selectedLead.id)
      if (error) throw error
      await supabase.from('bd_activities').insert({ lead_id: selectedLead.id, activity_type: 'objection', outcome: 'captured', note: actionForm.objection })
      setActionForm((old) => ({ ...old, objection: '' }))
    })
  }

  async function createCampaign() {
    if (!campaignForm.name.trim()) return setMessage('Campaign name is required.')
    await run('Create BD campaign', async () => {
      const { error } = await supabase.from('bd_campaigns').insert({
        name: campaignForm.name.trim(),
        channel: campaignForm.channel,
        owner: campaignForm.owner || null,
        target_segment: campaignForm.target_segment || null,
        objective: campaignForm.objective || null,
      })
      if (error) throw error
      setCampaignForm({ name: '', channel: 'Phone', owner: '', target_segment: '', objective: '' })
    })
  }

  async function updateCampaign(campaign: Campaign, status: string) {
    await run('Update campaign status', async () => {
      const { error } = await supabase.from('bd_campaigns').update({ status }).eq('id', campaign.id)
      if (error) throw error
    })
  }

  async function createPartner() {
    if (!partnerForm.organization.trim()) return setMessage('Partner organization is required.')
    await run('Create partner', async () => {
      const { error } = await supabase.from('bd_partners').insert({
        organization: partnerForm.organization.trim(),
        contact_name: partnerForm.contact_name || null,
        phone: partnerForm.phone || null,
        partner_type: partnerForm.partner_type,
        assigned_to: partnerForm.assigned_to || null,
        note: partnerForm.note || null,
      })
      if (error) throw error
      setPartnerForm({ organization: '', contact_name: '', phone: '', partner_type: 'Referral', assigned_to: '', note: '' })
    })
  }

  async function updatePartner(partner: Partner, stage: string) {
    await run('Update partner stage', async () => {
      const { error } = await supabase.from('bd_partners').update({ stage }).eq('id', partner.id)
      if (error) throw error
    })
  }

  return (
    <main style={pageStyle}>
      <section style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>AngelCare Business Development</p>
          <h1 style={titleStyle}>Agent Execution Workspace</h1>
          <p style={subStyle}>One operational terminal for lead intake, qualification, follow-up, offers, campaign execution and partner development. No executive pages. No passive buttons.</p>
        </div>
        <div style={statusBoxStyle}>{busy ? 'Executing…' : message}</div>
      </section>

      <section style={metricGridStyle}>
        <Metric label="Active opportunities" value={activeLeads.length} />
        <Metric label="Today actions" value={todayTasks.length} />
        <Metric label="Overdue actions" value={overdueTasks.length} />
        <Metric label="Open offers" value={offers.filter((offer) => ['draft', 'sent'].includes(offer.status)).length} />
      </section>

      <section style={gridStyle}>
        <Panel title="1. Intake" subtitle="Create an AngelCare work item with enough detail for real follow-up.">
          <div style={formGridStyle}>
            <Input label="Client / Contact name" value={leadForm.full_name} onChange={(value) => setLeadForm({ ...leadForm, full_name: value })} />
            <Input label="Phone" value={leadForm.phone} onChange={(value) => setLeadForm({ ...leadForm, phone: value })} />
            <Input label="Email" value={leadForm.email} onChange={(value) => setLeadForm({ ...leadForm, email: value })} />
            <Input label="Organization / Family ref" value={leadForm.organization} onChange={(value) => setLeadForm({ ...leadForm, organization: value })} />
            <Select label="Segment" value={leadForm.segment} options={optionValues('segment')} onChange={(value) => setLeadForm({ ...leadForm, segment: value })} />
            <Select label="Source" value={leadForm.source} options={optionValues('source')} onChange={(value) => setLeadForm({ ...leadForm, source: value })} />
            <Select label="AngelCare need" value={leadForm.need_type} options={optionValues('need_type')} onChange={(value) => setLeadForm({ ...leadForm, need_type: value })} />
            <Select label="Service frequency" value={leadForm.service_frequency} options={optionValues('service_frequency')} onChange={(value) => setLeadForm({ ...leadForm, service_frequency: value })} />
            <Input label="City" value={leadForm.city} onChange={(value) => setLeadForm({ ...leadForm, city: value })} />
            <Select label="Care zone" value={leadForm.care_zone} options={['', ...optionValues('care_zone')]} onChange={(value) => setLeadForm({ ...leadForm, care_zone: value })} />
            <Input label="Preferred start date" type="date" value={leadForm.preferred_start_date} onChange={(value) => setLeadForm({ ...leadForm, preferred_start_date: value })} />
            <Input label="Estimated value MAD" value={leadForm.value_estimate} onChange={(value) => setLeadForm({ ...leadForm, value_estimate: value })} />
            <Input label="Decision maker" value={leadForm.decision_maker} onChange={(value) => setLeadForm({ ...leadForm, decision_maker: value })} />
            <Select label="Assign" value={leadForm.assigned_to} options={['', ...optionValues('agent')]} onChange={(value) => setLeadForm({ ...leadForm, assigned_to: value })} />
          </div>
          <Textarea label="Family / care context" value={leadForm.family_context} onChange={(value) => setLeadForm({ ...leadForm, family_context: value })} />
          <button disabled={busy} style={primaryButtonStyle} onClick={createLead}>Create operational opportunity</button>
        </Panel>

        <Panel title="2. Work Queue" subtitle="Choose the exact item the agent will execute now.">
          <div style={tabsStyle}>{['active', 'today', 'overdue', 'urgent', ...leadStages.map((stage) => stage.value)].map((stage) => <button key={stage} style={filter === stage ? activeTabStyle : tabStyle} onClick={() => setFilter(stage)}>{stage}</button>)}</div>
          <div style={queueStyle}>
            {visibleLeads.map((lead) => (
              <button key={lead.id} style={selectedLead?.id === lead.id ? selectedCardStyle : cardButtonStyle} onClick={() => setSelectedLeadId(lead.id)}>
                <strong>{lead.full_name}</strong>
                <span>{lead.phone || lead.email || 'No contact'} • {lead.segment}</span>
                <small>{lead.status} / {lead.priority} / {lead.assigned_to || 'unassigned'} / {lead.need_type}</small>
                {lead.next_action && <small>Next: {lead.next_action}{lead.next_action_at ? ` — ${formatDate(lead.next_action_at)}` : ''}</small>}
              </button>
            ))}
            {!visibleLeads.length && <div style={emptyStyle}>No items in this lane.</div>}
          </div>
        </Panel>
      </section>

      <section style={consoleGridStyle}>
        <Panel title="3. Execution Console" subtitle={selectedLead ? `${selectedLead.full_name} • ${selectedLead.need_type} • ${selectedLead.status}` : 'Select a lead to execute.'}>
          {selectedLead ? <>
            <div style={stageGridStyle}>{leadStages.map((stage) => <button key={stage.value} disabled={busy} style={stage.value === selectedLead.status ? activeStageButtonStyle : stageButtonStyle} onClick={() => moveLead(stage.value)}>{stage.label}</button>)}</div>
            <div style={leadSnapshotStyle}>
              <strong>{selectedLead.segment}</strong>
              <span>{selectedLead.city || 'No city'} • {selectedLead.care_zone || 'No zone'} • {selectedLead.service_frequency || 'No frequency'}</span>
              <span>{selectedLead.family_context || 'No care context recorded yet.'}</span>
            </div>
            <div style={formGridStyle}>
              <Select label="Priority" value={selectedLead.priority} options={optionValues('priority')} onChange={(value) => updateLead({ priority: value }, 'Update priority')} />
              <Select label="Assign to" value={actionForm.assigned_to || selectedLead.assigned_to || ''} options={['', ...optionValues('agent')]} onChange={(value) => setActionForm({ ...actionForm, assigned_to: value })} />
              <Input label="Next action" value={actionForm.next_action} onChange={(value) => setActionForm({ ...actionForm, next_action: value })} />
              <Input label="Due datetime" type="datetime-local" value={actionForm.due_at} onChange={(value) => setActionForm({ ...actionForm, due_at: value })} />
              <Input label="Loss reason" value={actionForm.loss_reason} onChange={(value) => setActionForm({ ...actionForm, loss_reason: value })} />
              <Input label="Objection" value={actionForm.objection} onChange={(value) => setActionForm({ ...actionForm, objection: value })} />
            </div>
            <Textarea label="Note / outcome" value={actionForm.note} onChange={(value) => setActionForm({ ...actionForm, note: value })} />
            <div style={actionGridStyle}>
              <Action disabled={busy} label="Log call" onClick={() => logActivity('call')} />
              <Action disabled={busy} label="Log WhatsApp" onClick={() => logActivity('whatsapp')} />
              <Action disabled={busy} label="Log meeting" onClick={() => logActivity('meeting')} />
              <Action disabled={busy} label="First contact task" onClick={() => createTask('first_contact', 'Premier contact')} />
              <Action disabled={busy} label="Needs clarification" onClick={() => createTask('need_clarification', 'Clarifier besoin famille/service')} />
              <Action disabled={busy} label="Care plan task" onClick={() => createTask('care_plan', 'Préparer plan de service AngelCare')} />
              <Action disabled={busy} label="Send brochure task" onClick={() => createTask('send_brochure', 'Envoyer brochure AngelCare')} />
              <Action disabled={busy} label="Operations handover" onClick={() => createTask('handover_operations', 'Handover operations')} />
              <Action disabled={busy} label="Save objection" onClick={saveObjection} />
              <Action disabled={busy} label="Mark won" onClick={markWon} />
              <Action disabled={busy} label="Mark lost" onClick={markLost} />
            </div>
            <div style={offerBoxStyle}>
              <Input label="Offer title" value={actionForm.offer_title} onChange={(value) => setActionForm({ ...actionForm, offer_title: value })} />
              <Input label="Amount MAD" value={actionForm.offer_amount} onChange={(value) => setActionForm({ ...actionForm, offer_amount: value })} />
              <Input label="Offer note" value={actionForm.offer_note} onChange={(value) => setActionForm({ ...actionForm, offer_note: value })} />
              <button disabled={busy} style={primaryButtonStyle} onClick={createOffer}>Create sent offer record</button>
            </div>
          </> : <div style={emptyStyle}>No lead selected.</div>}
        </Panel>

        <Panel title="4. Work Detail" subtitle="Open tasks, offers and activity log for the selected item.">
          <h3 style={miniTitleStyle}>Tasks</h3>
          {selectedLeadTasks.slice(0, 8).map((task) => <div key={task.id} style={rowStyle}><span>{task.title}<small> {task.due_at ? `— ${formatDate(task.due_at)}` : ''}</small></span><button disabled={busy} style={smallButtonStyle} onClick={() => completeTask(task)}>Complete</button></div>)}
          {!selectedLeadTasks.length && <p style={emptyStyle}>No tasks yet.</p>}
          <h3 style={miniTitleStyle}>Offers</h3>
          {selectedLeadOffers.slice(0, 5).map((offer) => <div key={offer.id} style={rowStyle}><span>{offer.title}</span><strong>{Number(offer.amount || 0).toLocaleString()} MAD</strong></div>)}
          {!selectedLeadOffers.length && <p style={emptyStyle}>No offers yet.</p>}
          <h3 style={miniTitleStyle}>Activity</h3>
          {selectedLeadActivities.slice(0, 10).map((activity) => <div key={activity.id} style={activityStyle}><strong>{activity.activity_type} / {activity.outcome}</strong><span>{activity.note || 'No note'}</span><small>{formatDate(activity.created_at)}</small></div>)}
          {!selectedLeadActivities.length && <p style={emptyStyle}>No activity yet.</p>}
        </Panel>
      </section>

      <section style={bottomGridStyle}>
        <Panel title="5. Campaign Execution" subtitle="Operational campaigns only: create, start, pause, complete.">
          <div style={formGridStyle}>
            <Input label="Campaign name" value={campaignForm.name} onChange={(value) => setCampaignForm({ ...campaignForm, name: value })} />
            <Select label="Channel" value={campaignForm.channel} options={['Phone', 'WhatsApp', 'Meta', 'Field', 'Partner', 'Email']} onChange={(value) => setCampaignForm({ ...campaignForm, channel: value })} />
            <Select label="Target segment" value={campaignForm.target_segment} options={['', ...optionValues('segment')]} onChange={(value) => setCampaignForm({ ...campaignForm, target_segment: value })} />
            <Select label="Owner" value={campaignForm.owner} options={['', ...optionValues('agent')]} onChange={(value) => setCampaignForm({ ...campaignForm, owner: value })} />
          </div>
          <Textarea label="Objective" value={campaignForm.objective} onChange={(value) => setCampaignForm({ ...campaignForm, objective: value })} />
          <button disabled={busy} style={primaryButtonStyle} onClick={createCampaign}>Create campaign</button>
          {campaigns.slice(0, 8).map((campaign) => <div key={campaign.id} style={rowStyle}><span>{campaign.name} • {campaign.channel} • {campaign.status}</span><div>{campaignStatuses.map((status) => <button disabled={busy} key={status} style={smallButtonStyle} onClick={() => updateCampaign(campaign, status)}>{status}</button>)}</div></div>)}
        </Panel>

        <Panel title="6. Partnership Execution" subtitle="Referral and institutional partner pipeline for AngelCare.">
          <div style={formGridStyle}>
            <Input label="Organization" value={partnerForm.organization} onChange={(value) => setPartnerForm({ ...partnerForm, organization: value })} />
            <Input label="Contact" value={partnerForm.contact_name} onChange={(value) => setPartnerForm({ ...partnerForm, contact_name: value })} />
            <Input label="Phone" value={partnerForm.phone} onChange={(value) => setPartnerForm({ ...partnerForm, phone: value })} />
            <Select label="Type" value={partnerForm.partner_type} options={['Referral', 'School', 'Clinic', 'Hotel', 'Agency', 'Corporate', 'Association']} onChange={(value) => setPartnerForm({ ...partnerForm, partner_type: value })} />
            <Select label="Assign" value={partnerForm.assigned_to} options={['', ...optionValues('agent')]} onChange={(value) => setPartnerForm({ ...partnerForm, assigned_to: value })} />
          </div>
          <Textarea label="Partner note" value={partnerForm.note} onChange={(value) => setPartnerForm({ ...partnerForm, note: value })} />
          <button disabled={busy} style={primaryButtonStyle} onClick={createPartner}>Create partner</button>
          {partners.slice(0, 8).map((partner) => <div key={partner.id} style={rowStyle}><span>{partner.organization} • {partner.stage}</span><div>{partnerStages.map((stage) => <button disabled={busy} key={stage} style={smallButtonStyle} onClick={() => updatePartner(partner, stage)}>{stage}</button>)}</div></div>)}
        </Panel>
      </section>
    </main>
  )
}

function isToday(value?: string | null) {
  if (!value) return false
  return new Date(value).toDateString() === new Date().toDateString()
}

function formatDate(value?: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleString('fr-MA', { dateStyle: 'medium', timeStyle: 'short' })
}

function inferPriority(frequency: string, startDate: string) {
  if (frequency === 'Urgence') return 'urgent'
  if (!startDate) return 'normal'
  const days = Math.ceil((new Date(startDate).getTime() - Date.now()) / 86400000)
  if (days <= 1) return 'urgent'
  if (days <= 3) return 'high'
  return 'normal'
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <section style={panelStyle}><div style={panelHeadStyle}><h2>{title}</h2><p>{subtitle}</p></div>{children}</section>
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div style={metricStyle}><span>{label}</span><strong>{value}</strong></div>
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label style={labelStyle}><span>{label}</span><input style={inputStyle} type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label style={labelStyle}><span>{label}</span><textarea style={{ ...inputStyle, minHeight: 78, resize: 'vertical' }} value={value} onChange={(event) => onChange(event.target.value)} /></label>
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label style={labelStyle}><span>{label}</span><select style={inputStyle} value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option || 'Unassigned'}</option>)}</select></label>
}

function Action({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return <button disabled={disabled} style={actionButtonStyle} onClick={onClick}>{label}</button>
}

const pageStyle: CSSProperties = { minHeight: '100vh', padding: '32px', background: '#f3f4f6', color: '#0f172a', fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }
const headerStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr minmax(260px, 440px)', gap: 18, alignItems: 'stretch', marginBottom: 18 }
const eyebrowStyle: CSSProperties = { margin: 0, fontSize: 12, fontWeight: 900, letterSpacing: 1.8, textTransform: 'uppercase', color: '#7c3aed' }
const titleStyle: CSSProperties = { margin: '6px 0', fontSize: 36, lineHeight: 1, letterSpacing: -1, fontWeight: 950 }
const subStyle: CSSProperties = { margin: 0, maxWidth: 980, color: '#475569', fontWeight: 650 }
const statusBoxStyle: CSSProperties = { padding: 18, borderRadius: 24, background: '#0f172a', color: '#fff', fontWeight: 850, boxShadow: '0 18px 45px rgba(15,23,42,.18)' }
const metricGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14, marginBottom: 18 }
const metricStyle: CSSProperties = { borderRadius: 22, background: '#fff', padding: 18, border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(15,23,42,.06)' }
const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }
const consoleGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1.25fr .75fr', gap: 18, marginBottom: 18 }
const bottomGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }
const panelStyle: CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 28, padding: 18, boxShadow: '0 18px 45px rgba(15,23,42,.07)' }
const panelHeadStyle: CSSProperties = { marginBottom: 14 }
const formGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginBottom: 12 }
const labelStyle: CSSProperties = { display: 'grid', gap: 5, fontSize: 12, fontWeight: 850, color: '#475569', marginBottom: 10 }
const inputStyle: CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 14, padding: '11px 12px', fontWeight: 750, color: '#0f172a', background: '#fff', minWidth: 0 }
const primaryButtonStyle: CSSProperties = { border: 0, borderRadius: 16, padding: '12px 16px', background: '#7c3aed', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const tabsStyle: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }
const tabStyle: CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 999, padding: '8px 11px', background: '#fff', fontWeight: 800, cursor: 'pointer' }
const activeTabStyle: CSSProperties = { ...tabStyle, background: '#0f172a', color: '#fff' }
const queueStyle: CSSProperties = { display: 'grid', gap: 10, maxHeight: 520, overflow: 'auto' }
const cardButtonStyle: CSSProperties = { textAlign: 'left', display: 'grid', gap: 4, border: '1px solid #e2e8f0', borderRadius: 18, padding: 14, background: '#f8fafc', color: '#0f172a', cursor: 'pointer' }
const selectedCardStyle: CSSProperties = { ...cardButtonStyle, border: '2px solid #7c3aed', background: '#f5f3ff' }
const emptyStyle: CSSProperties = { padding: 14, borderRadius: 16, background: '#f8fafc', color: '#64748b', fontWeight: 750 }
const stageGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 8, marginBottom: 12 }
const stageButtonStyle: CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 14, padding: '10px 8px', background: '#fff', fontWeight: 850, cursor: 'pointer' }
const activeStageButtonStyle: CSSProperties = { ...stageButtonStyle, background: '#16a34a', borderColor: '#16a34a', color: '#fff' }
const leadSnapshotStyle: CSSProperties = { display: 'grid', gap: 4, padding: 12, borderRadius: 18, background: '#f8fafc', marginBottom: 12, color: '#334155', fontWeight: 700 }
const actionGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10, marginBottom: 12 }
const actionButtonStyle: CSSProperties = { border: 0, borderRadius: 16, padding: '11px 12px', background: '#0f172a', color: '#fff', fontWeight: 900, cursor: 'pointer' }
const offerBoxStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 150px 1fr 220px', gap: 10, alignItems: 'end', padding: 12, borderRadius: 18, background: '#f8fafc' }
const miniTitleStyle: CSSProperties = { margin: '14px 0 8px', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b' }
const rowStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 8, flexWrap: 'wrap' }
const smallButtonStyle: CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 12, padding: '7px 9px', background: '#fff', fontWeight: 850, cursor: 'pointer', margin: 2 }
const activityStyle: CSSProperties = { display: 'grid', gap: 3, padding: 10, borderRadius: 14, background: '#f8fafc', marginBottom: 7 }
