'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Activity, AlertTriangle, Archive, ArrowLeft, BarChart3, CalendarDays, CheckCircle2,
  ChevronRight, ClipboardCheck, ClipboardList, Copy, DollarSign, Edit3, Eye, FileText,
  Flag, Flame, Gauge, Layers, Megaphone, MessageSquare, PauseCircle, PenLine,
  PlayCircle, Plus, RefreshCw, Rocket, Search, ShieldCheck, Sparkles, Target,
  Timer, Trash2, Users, Wand2
} from 'lucide-react'
import { executeMarketAction, fetchMarketOSCore } from '@/lib/market-os/client-actions'

type CampaignForm = {
  title: string
  objective: string
  channel: string
  budget: string
  dailyBudget: string
  ownerAgent: string
  city: string
  audience: string
  persona: string
  serviceLine: string
  funnelStage: string
  lifecycleStage: string
  offerAngle: string
  hook: string
  cta: string
  landingPage: string
  creativeBrief: string
  startDate: string
  endDate: string
  expectedLeads: string
  expectedCpl: string
  complianceNote: string
  notes: string
}

type EditForm = {
  title: string
  status: string
  priority: string
  ownerAgent: string
  budget: string
  note: string
}

const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-rose-100'
const objectives = ['Qualified leads', 'Bookings', 'Awareness', 'Traffic', 'Retargeting', 'Ambassador activation', 'Service launch', 'Referral growth']
const channels = ['Meta', 'Google', 'TikTok', 'WhatsApp', 'Email', 'SEO', 'Partnership', 'Multi-channel']
const serviceLines = ['Childcare', 'Post-partum support', 'Senior care', 'Housekeeping', 'School pickup', 'Emergency family support', 'Premium nanny matching']
const funnelStages = ['Acquisition', 'Retargeting', 'Lead capture', 'Qualification', 'Booking push', 'Reactivation']
const lifecycleStages = ['idea', 'build', 'validate', 'ready', 'live', 'scale', 'optimize', 'closed']
const statuses = ['draft', 'active', 'paused', 'review', 'risk', 'completed', 'cancelled', 'archived']
const priorities = ['low', 'normal', 'high', 'critical', 'urgent']
const ctas = ['Book an assessment', 'Request callback', 'Send WhatsApp message', 'Reserve consultation', 'Get matched', 'Join waitlist']
const personas = ['Busy parent seeking safe, reliable care', 'New mother needing calm post-partum support', 'Adult child managing senior care', 'Working parent needing school pickup', 'Family seeking premium supervised help']

const emptyForm: CampaignForm = {
  title: '', objective: 'Qualified leads', channel: 'Meta', budget: '', dailyBudget: '', ownerAgent: '',
  city: 'Rabat / Témara / Salé', audience: 'Mothers 25-45', persona: personas[0], serviceLine: 'Childcare',
  funnelStage: 'Acquisition', lifecycleStage: 'build', offerAngle: 'Premium trusted family care',
  hook: '', cta: 'Book an assessment', landingPage: '', creativeBrief: '', startDate: '', endDate: '',
  expectedLeads: '', expectedCpl: '', complianceNote: '', notes: '',
}

const scenarios = [
  { title: 'Rabat childcare lead capture', objective: 'Qualified leads', channel: 'Meta', audience: 'Mothers 25-45', serviceLine: 'Childcare', city: 'Rabat / Témara / Salé', offerAngle: 'Safe, supervised childcare with AngelCare matching', hook: 'A trusted childcare plan built around your family routine.', cta: 'Book an assessment' },
  { title: 'Post-partum premium support sprint', objective: 'Bookings', channel: 'Meta', audience: 'New mothers', serviceLine: 'Post-partum support', city: 'Rabat', offerAngle: 'Recover with calm, supervised home support', hook: 'Support at home when recovery and peace matter most.', cta: 'Request callback' },
  { title: 'Senior care trust campaign', objective: 'Qualified leads', channel: 'WhatsApp', audience: 'Adult children managing parent care', serviceLine: 'Senior care', city: 'Rabat / Salé', offerAngle: 'Reliable caregivers with supervision and follow-up', hook: 'Care for your parent with daily reliability and oversight.', cta: 'Send WhatsApp message' },
  { title: 'Emergency family support push', objective: 'Bookings', channel: 'Multi-channel', audience: 'Families needing urgent help', serviceLine: 'Emergency family support', city: 'Rabat / Témara', offerAngle: 'Fast response, safe matching, operational follow-up', hook: 'When family support cannot wait, AngelCare organizes the help.', cta: 'Request callback' },
  { title: 'Premium nanny matching authority', objective: 'Awareness', channel: 'Google', audience: 'Premium households', serviceLine: 'Premium nanny matching', city: 'Rabat', offerAngle: 'Matched profiles, supervision, and reliable family fit', hook: 'Find a care profile that actually fits your family standards.', cta: 'Get matched' },
  { title: 'Referral and ambassador growth', objective: 'Referral growth', channel: 'Partnership', audience: 'Existing parents and local partners', serviceLine: 'Childcare', city: 'Rabat / Témara / Salé', offerAngle: 'Families trust families — refer with confidence', hook: 'Help another family find safe care and grow AngelCare trust.', cta: 'Join waitlist' },
]

const qaRules = [
  'Trust and supervision are clearly explained.',
  'Target audience is emotionally precise.',
  'CTA is direct and operational.',
  'Service line is not mixed with another offer.',
  'Lead handoff path is ready before launch.',
  'Budget owner and daily monitoring routine are assigned.',
  'Landing page or WhatsApp path is ready.',
  'Message uses concrete family outcomes.',
]

function getMeta(record: any) {
  return { ...(record?.payload || {}), ...(record?.metadata || {}) }
}

function safeDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

function readinessScore(record: any) {
  const meta = getMeta(record)
  const checks = [record?.title, record?.owner_agent || record?.owner, meta.objective, meta.channel, meta.audience, meta.serviceLine, meta.offerAngle, meta.hook, meta.cta, meta.budget, meta.landingPage || meta.landing_page, meta.complianceNote]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

function healthSignals(record: any) {
  const meta = getMeta(record)
  const signals: string[] = []
  if (!meta.budget) signals.push('Missing budget')
  if (!meta.cta) signals.push('Missing CTA')
  if (!meta.hook) signals.push('Missing hook')
  if (!meta.landingPage && !meta.landing_page) signals.push('No landing path')
  if (!record?.owner_agent && !record?.owner) signals.push('No owner')
  if (readinessScore(record) < 60) signals.push('Low readiness')
  return signals
}

function badgeClass(status: string) {
  if (['active', 'completed', 'approved', 'published'].includes(status)) return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (['risk', 'paused', 'blocked', 'cancelled'].includes(status)) return 'border-red-200 bg-red-50 text-red-700'
  if (['draft', 'review', 'queued', 'assigned'].includes(status)) return 'border-blue-200 bg-blue-50 text-blue-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function priorityClass(priority: string) {
  if (['urgent', 'critical'].includes(priority)) return 'border-red-200 bg-red-50 text-red-700'
  if (priority === 'high') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-slate-200 bg-slate-50 text-slate-600'
}

function stageClass(stage: string) {
  if (['live', 'scale'].includes(stage)) return 'bg-emerald-600 text-white'
  if (stage === 'optimize') return 'bg-amber-500 text-white'
  if (stage === 'closed') return 'bg-slate-700 text-white'
  if (stage === 'validate' || stage === 'ready') return 'bg-blue-600 text-white'
  return 'bg-slate-100 text-slate-700'
}

function statusIcon(status: string) {
  if (status === 'active') return <Rocket className="h-4 w-4" />
  if (status === 'paused') return <PauseCircle className="h-4 w-4" />
  if (status === 'risk') return <AlertTriangle className="h-4 w-4" />
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4" />
  if (status === 'archived') return <Archive className="h-4 w-4" />
  return <ClipboardList className="h-4 w-4" />
}

export default function CampaignLifecycleWorkspacePage() {
  const [records, setRecords] = useState<any[]>([])
  const [actions, setActions] = useState<any[]>([])
  const [audit, setAudit] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [form, setForm] = useState<CampaignForm>(emptyForm)
  const [editForm, setEditForm] = useState<EditForm>({ title: '', status: 'active', priority: 'normal', ownerAgent: '', budget: '', note: '' })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [stageFilter, setStageFilter] = useState('all')
  const [mode, setMode] = useState<'overview' | 'edit' | 'qa' | 'plan'>('overview')
  const [viewMode, setViewMode] = useState<'strategic' | 'operator'>('operator')

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const json = await fetchMarketOSCore()
      const campaignRecords = (json.records || []).filter((record: any) => {
        const kind = String(record.kind || record.record_type || '').toLowerCase()
        const engine = String(record.engine || '').toLowerCase()
        const moduleKey = String(record.metadata?.moduleKey || record.payload?.moduleKey || '').toLowerCase()
        return kind.includes('campaign') || engine === 'acquisition' || moduleKey.includes('campaign')
      })
      setRecords(campaignRecords)
      setActions((json.actions || []).filter((action: any) => String(action.engine || '').toLowerCase() === 'acquisition' || String(action.payload?.moduleKey || '').includes('campaign')))
      setAudit((json.audit || []).filter((event: any) => String(event.engine || '').toLowerCase() === 'acquisition' || String(event.payload?.moduleKey || '').includes('campaign')))
      setAgents(json.agents || [])
      if (!selectedId && campaignRecords[0]?.id) setSelectedId(campaignRecords[0].id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load campaign workspace')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    function refreshAfterAction() {
      load()
    }
    window.addEventListener('market-os-action-executed', refreshAfterAction)
    return () => window.removeEventListener('market-os-action-executed', refreshAfterAction)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selected = useMemo(() => records.find((record) => record.id === selectedId) || null, [records, selectedId])
  const selectedMeta = useMemo(() => getMeta(selected), [selected])

  useEffect(() => {
    if (!selected) return
    const meta = getMeta(selected)
    setEditForm({
      title: selected.title || '',
      status: selected.status || 'active',
      priority: selected.priority || 'normal',
      ownerAgent: selected.owner_agent || selected.owner || '',
      budget: meta.budget ? String(meta.budget) : '',
      note: '',
    })
  }, [selected?.id])

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase()
    return records.filter((record) => {
      const meta = getMeta(record)
      const matchesSearch =
        !q ||
        String(record.title || '').toLowerCase().includes(q) ||
        String(record.owner_agent || record.owner || '').toLowerCase().includes(q) ||
        String(record.status || '').toLowerCase().includes(q) ||
        String(meta.serviceLine || meta.service_line || '').toLowerCase().includes(q) ||
        String(meta.channel || '').toLowerCase().includes(q) ||
        String(meta.audience || '').toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter
      const matchesStage = stageFilter === 'all' || String(meta.lifecycleStage || meta.lifecycle_stage || 'build') === stageFilter
      return matchesSearch && matchesStatus && matchesStage
    })
  }, [records, search, statusFilter, stageFilter])

  const totals = useMemo(() => ({
    total: records.length,
    active: records.filter((r) => r.status === 'active').length,
    paused: records.filter((r) => r.status === 'paused').length,
    risk: records.filter((r) => r.status === 'risk' || r.priority === 'urgent' || r.priority === 'critical').length,
    draft: records.filter((r) => r.status === 'draft').length,
    avgReadiness: records.length ? Math.round(records.reduce((sum, r) => sum + readinessScore(r), 0) / records.length) : 0,
  }), [records])

  function updateForm(key: keyof CampaignForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function applyScenario(index: number) {
    const scenario = scenarios[index]
    setForm((current) => ({
      ...current,
      ...scenario,
      lifecycleStage: 'build',
      notes: `Scenario applied: ${scenario.title}`,
      creativeBrief: `Build creatives around: ${scenario.offerAngle}. Include trust, supervision, fast response, family reassurance, and AngelCare reliability.`,
      expectedLeads: '100',
      expectedCpl: '25',
    }))
  }

  async function createCampaign(status = 'draft') {
    try {
      setSaving('create_campaign')
      setError(null)
      setSuccess(null)
      const title = form.title.trim() || `Campaign · ${form.objective} · ${form.channel}`
      const result = await executeMarketAction({
        action: 'create_campaign',
        engine: 'acquisition' as any,
        recordType: 'campaign',
        title,
        description: form.notes || `Campaign objective: ${form.objective}`,
        status,
        priority: status === 'active' ? 'high' : 'normal',
        ownerAgent: form.ownerAgent,
        actorName: 'Market-OS Operator',
        payload: {
          moduleKey: 'campaign-lifecycle',
          ...form,
          budget: form.budget ? Number(form.budget) : null,
          dailyBudget: form.dailyBudget ? Number(form.dailyBudget) : null,
          expectedLeads: form.expectedLeads ? Number(form.expectedLeads) : null,
          expectedCpl: form.expectedCpl ? Number(form.expectedCpl) : null,
          start_date: form.startDate || null,
          end_date: form.endDate || null,
        },
      })
      setSuccess(`Campaign ${status === 'active' ? 'created and activated' : 'created'}${result?.recordId ? ` · ${String(result.recordId).slice(0, 8)}` : ''}`)
      setForm(emptyForm)
      setSelectedId(result?.recordId || null)
      window.dispatchEvent(new CustomEvent('market-os-action-executed', { detail: result }))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Campaign creation failed')
    } finally {
      setSaving(null)
    }
  }

  async function runCampaignAction(action: string, status?: string, priority?: string, extraPayload: Record<string, unknown> = {}, targetRecord = selected) {
    if (!targetRecord?.id) {
      setError('Select a campaign first')
      return
    }
    try {
      setSaving(action)
      setError(null)
      setSuccess(null)
      const result = await executeMarketAction({
        action,
        engine: 'acquisition' as any,
        recordId: targetRecord.id,
        recordType: 'campaign',
        title: targetRecord.title,
        description: targetRecord.description || '',
        status: status || targetRecord.status || 'active',
        priority: priority || targetRecord.priority || 'normal',
        ownerAgent: targetRecord.owner_agent || targetRecord.owner || '',
        actorName: 'Market-OS Operator',
        payload: { moduleKey: 'campaign-lifecycle', selected_campaign: targetRecord.title, previous_status: targetRecord.status, ...extraPayload },
      })
      setSuccess(`${action.replace(/_/g, ' ')} executed`)
      window.dispatchEvent(new CustomEvent('market-os-action-executed', { detail: result }))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Campaign action failed')
    } finally {
      setSaving(null)
    }
  }

  async function runBulkAction(action: string, status?: string, priority?: string) {
    const targets = records.filter((record) => selectedIds.includes(record.id))
    if (targets.length === 0) {
      setError('Select at least one campaign')
      return
    }
    try {
      setSaving(`bulk_${action}`)
      setError(null)
      setSuccess(null)
      for (const record of targets) {
        await executeMarketAction({
          action,
          engine: 'acquisition' as any,
          recordId: record.id,
          recordType: 'campaign',
          title: record.title,
          description: record.description || '',
          status: status || record.status || 'active',
          priority: priority || record.priority || 'normal',
          ownerAgent: record.owner_agent || record.owner || '',
          actorName: 'Market-OS Operator',
          payload: { moduleKey: 'campaign-lifecycle', bulk_action: true, previous_status: record.status },
        })
      }
      setSuccess(`${targets.length} campaign(s) updated`)
      setSelectedIds([])
      window.dispatchEvent(new CustomEvent('market-os-action-executed'))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk action failed')
    } finally {
      setSaving(null)
    }
  }

  async function saveEdit() {
    if (!selected) return
    await runCampaignAction('update_campaign_configuration', editForm.status, editForm.priority, {
      title_update: editForm.title,
      ownerAgent: editForm.ownerAgent,
      budget: editForm.budget ? Number(editForm.budget) : null,
      note: editForm.note,
      edited_at: new Date().toISOString(),
    })
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id])
  }

  return (
    <main className="min-h-screen bg-[#050816] text-slate-950">
      <section className="sticky top-0 z-30 border-b border-white/10 bg-[#050816]/90 px-5 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-white">
            <div className="rounded-2xl bg-gradient-to-br from-rose-500 to-orange-400 p-2 shadow-lg shadow-rose-900/30">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-rose-200">Campaign Lifecycle Command</p>
              <p className="text-sm font-bold text-slate-300">Plan · Build · Validate · Launch · Scale · Optimize</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {['builder', 'queue', 'selected', 'controls', 'planner', 'history'].map((id) => (
              <a key={id} href={`#${id}`} className="rounded-full border border-white/10 px-3 py-2 text-xs font-black capitalize text-white transition hover:-translate-y-0.5 hover:border-rose-300 hover:bg-white/10">{id}</a>
            ))}
            <button onClick={() => setViewMode(viewMode === 'operator' ? 'strategic' : 'operator')} className="rounded-full bg-rose-500 px-3 py-2 text-xs font-black text-white transition hover:-translate-y-0.5">{viewMode === 'operator' ? 'Operator Mode' : 'Strategic Mode'}</button>
            <Link href="/market-os" className="rounded-full bg-white px-3 py-2 text-xs font-black text-slate-950 transition hover:-translate-y-0.5"><ArrowLeft className="mr-1 inline h-3 w-3" />Hub</Link>
          </div>
        </div>
      </section>

      <section className="w-full max-w-none space-y-8 bg-[radial-gradient(circle_at_top_left,#fb7185_0,#f8fafc_23%,#dbeafe_55%,#e2e8f0_100%)] p-4 md:p-6">
        <header className="overflow-hidden rounded-[2.5rem] border border-white/80 bg-white/90 p-7 shadow-2xl shadow-slate-900/10 backdrop-blur">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_560px]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-black uppercase tracking-[0.25em] text-rose-700"><Sparkles className="h-4 w-4" /> AngelCare Market-OS / Acquisition</div>
              <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">Campaign Command Center V2</h1>
              <p className="mt-4 max-w-5xl text-base font-semibold leading-7 text-slate-600">
                Senior marketing officer workspace: dominant scenario builder, multi-select campaign control, bulk execution, lifecycle governance, performance signals, QA, planning, and operational proof.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={load} disabled={loading} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:scale-[1.02] hover:bg-slate-800 disabled:opacity-50"><RefreshCw className="mr-2 inline h-4 w-4" /> {loading ? 'Refreshing...' : 'Refresh command center'}</button>
                <a href="#builder" className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white transition hover:scale-[1.02] hover:bg-rose-700"><Plus className="mr-2 inline h-4 w-4" /> Build campaign</a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <KpiCard icon={<ClipboardList className="h-5 w-5" />} label="Campaigns" value={totals.total} />
              <KpiCard icon={<Rocket className="h-5 w-5" />} label="Active" value={totals.active} />
              <KpiCard icon={<PauseCircle className="h-5 w-5" />} label="Paused" value={totals.paused} />
              <KpiCard icon={<Flame className="h-5 w-5" />} label="Risk" value={totals.risk} />
              <KpiCard icon={<FileText className="h-5 w-5" />} label="Draft" value={totals.draft} />
              <KpiCard icon={<Gauge className="h-5 w-5" />} label="Readiness" value={totals.avgReadiness} suffix="%" />
            </div>
          </div>
        </header>

        {error && <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-black text-red-700"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</div>}
        {success && <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-black text-emerald-700"><CheckCircle2 className="mr-2 inline h-4 w-4" />{success}</div>}

        <section id="builder" className="grid w-full gap-6 2xl:grid-cols-[minmax(0,1.1fr)_460px]">
          <SectionShell title="Dominant campaign builder" eyebrow="Scenario-first campaign creation" icon={<Target className="h-5 w-5" />} tint="rose">
            <div className="grid gap-4 xl:grid-cols-3">
              {scenarios.map((scenario, index) => (
                <button key={scenario.title} onClick={() => applyScenario(index)} className="rounded-[2rem] border border-rose-100 bg-rose-50 p-5 text-left transition hover:-translate-y-1 hover:bg-rose-100 hover:shadow-xl">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-700">Scenario {index + 1}</p>
                  <p className="mt-2 text-lg font-black text-slate-950">{scenario.serviceLine}</p>
                  <p className="mt-2 text-sm font-bold text-rose-700">{scenario.title}</p>
                  <p className="mt-3 line-clamp-2 text-xs font-semibold text-slate-600">{scenario.hook}</p>
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              <FormBlock title="Campaign identity">
                <Field label="Campaign name" full><input value={form.title} onChange={(e) => updateForm('title', e.target.value)} placeholder="Example: Rabat childcare lead sprint" className={inputClass} /></Field>
                <Field label="Owner / agent"><input value={form.ownerAgent} onChange={(e) => updateForm('ownerAgent', e.target.value)} placeholder="Agent / owner" list="campaign-agents" className={inputClass} /></Field>
                <datalist id="campaign-agents">{agents.map((agent) => <option key={agent.id || agent.agent_key} value={agent.name} />)}</datalist>
                <Field label="Objective"><Select value={form.objective} onChange={(value) => updateForm('objective', value)} options={objectives} /></Field>
                <Field label="Channel"><Select value={form.channel} onChange={(value) => updateForm('channel', value)} options={channels} /></Field>
                <Field label="Service line"><Select value={form.serviceLine} onChange={(value) => updateForm('serviceLine', value)} options={serviceLines} /></Field>
                <Field label="Lifecycle stage"><Select value={form.lifecycleStage} onChange={(value) => updateForm('lifecycleStage', value)} options={lifecycleStages} /></Field>
                <Field label="Funnel stage"><Select value={form.funnelStage} onChange={(value) => updateForm('funnelStage', value)} options={funnelStages} /></Field>
                <Field label="CTA"><Select value={form.cta} onChange={(value) => updateForm('cta', value)} options={ctas} /></Field>
                <Field label="City / territory"><input value={form.city} onChange={(e) => updateForm('city', e.target.value)} className={inputClass} /></Field>
                <Field label="Target audience"><input value={form.audience} onChange={(e) => updateForm('audience', e.target.value)} className={inputClass} /></Field>
                <Field label="Persona" full><Select value={form.persona} onChange={(value) => updateForm('persona', value)} options={personas} /></Field>
              </FormBlock>

              <FormBlock title="Budget, targets and creative command">
                <Field label="Total budget"><input value={form.budget} onChange={(e) => updateForm('budget', e.target.value)} placeholder="MAD" type="number" className={inputClass} /></Field>
                <Field label="Daily budget"><input value={form.dailyBudget} onChange={(e) => updateForm('dailyBudget', e.target.value)} placeholder="MAD/day" type="number" className={inputClass} /></Field>
                <Field label="Expected leads"><input value={form.expectedLeads} onChange={(e) => updateForm('expectedLeads', e.target.value)} type="number" className={inputClass} /></Field>
                <Field label="Expected CPL"><input value={form.expectedCpl} onChange={(e) => updateForm('expectedCpl', e.target.value)} type="number" className={inputClass} /></Field>
                <Field label="Start date"><input value={form.startDate} onChange={(e) => updateForm('startDate', e.target.value)} type="date" className={inputClass} /></Field>
                <Field label="End date"><input value={form.endDate} onChange={(e) => updateForm('endDate', e.target.value)} type="date" className={inputClass} /></Field>
                <Field label="Landing page" full><input value={form.landingPage} onChange={(e) => updateForm('landingPage', e.target.value)} placeholder="URL or internal page reference" className={inputClass} /></Field>
                <Field label="Offer angle" full><textarea value={form.offerAngle} onChange={(e) => updateForm('offerAngle', e.target.value)} rows={2} className={inputClass} /></Field>
                <Field label="Hook" full><textarea value={form.hook} onChange={(e) => updateForm('hook', e.target.value)} rows={2} placeholder="Opening promise / emotion / trigger" className={inputClass} /></Field>
              </FormBlock>
            </div>

            <FormBlock title="Creative brief, compliance and notes">
              <Field label="Creative brief" full><textarea value={form.creativeBrief} onChange={(e) => updateForm('creativeBrief', e.target.value)} rows={5} placeholder="Visual direction, proof, CTA, ad copy, assets required..." className={inputClass} /></Field>
              <Field label="Compliance note"><textarea value={form.complianceNote} onChange={(e) => updateForm('complianceNote', e.target.value)} rows={4} placeholder="Sensitive claims, child/family trust language, brand rules..." className={inputClass} /></Field>
              <Field label="Operational notes"><textarea value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} rows={4} className={inputClass} /></Field>
            </FormBlock>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button onClick={() => createCampaign('draft')} disabled={Boolean(saving)} className="rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-sm transition hover:scale-[1.01] hover:bg-slate-800 disabled:opacity-50"><Plus className="mr-2 inline h-4 w-4" /> Save Draft</button>
              <button onClick={() => createCampaign('active')} disabled={Boolean(saving)} className="rounded-2xl bg-rose-600 px-5 py-4 text-sm font-black text-white shadow-sm transition hover:scale-[1.01] hover:bg-rose-700 disabled:opacity-50"><Rocket className="mr-2 inline h-4 w-4" /> Create Active</button>
            </div>
          </SectionShell>

          <SectionShell title="Marketing officer playbook" eyebrow="Decision support" icon={<ShieldCheck className="h-5 w-5" />} tint="slate">
            <div className="space-y-3">
              {qaRules.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-600" /> {item}
                </div>
              ))}
            </div>
          </SectionShell>
        </section>

        <section id="queue" className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_420px]">
          <SectionShell title="Campaign pipeline command" eyebrow="Multi-select production queue" icon={<Layers className="h-5 w-5" />} tint="blue">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-2">
                {['all', 'draft', 'active', 'risk', 'paused', 'completed'].map((status) => (
                  <button key={status} onClick={() => setStatusFilter(status)} className={`rounded-2xl px-4 py-2 text-xs font-black capitalize transition ${statusFilter === status ? 'bg-slate-950 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>{status}</button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none">
                  <option value="all">All stages</option>
                  {lifecycleStages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
                </select>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search campaign, owner, channel..." className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-9 pr-4 text-sm font-semibold outline-none xl:w-[420px]" />
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[2rem] border border-slate-200 bg-slate-950 p-4 text-white">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-rose-200">Bulk command bar</p>
                  <p className="text-sm font-bold text-slate-300">{selectedIds.length} selected · {filteredRecords.length} visible</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setSelectedIds(filteredRecords.map((record) => record.id))} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black hover:bg-white/20">Select visible</button>
                  <button onClick={() => setSelectedIds([])} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black hover:bg-white/20">Clear</button>
                  <button onClick={() => runBulkAction('bulk_launch_campaigns', 'active', 'high')} disabled={!selectedIds.length || Boolean(saving)} className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-white disabled:opacity-40">Launch</button>
                  <button onClick={() => runBulkAction('bulk_pause_campaigns', 'paused')} disabled={!selectedIds.length || Boolean(saving)} className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-black text-white disabled:opacity-40">Pause</button>
                  <button onClick={() => runBulkAction('bulk_complete_campaigns', 'completed')} disabled={!selectedIds.length || Boolean(saving)} className="rounded-xl bg-blue-500 px-3 py-2 text-xs font-black text-white disabled:opacity-40">Complete</button>
                  <button onClick={() => runBulkAction('bulk_archive_campaigns', 'archived')} disabled={!selectedIds.length || Boolean(saving)} className="rounded-xl bg-slate-600 px-3 py-2 text-xs font-black text-white disabled:opacity-40">Archive</button>
                  <button onClick={() => runBulkAction('bulk_delete_campaigns', 'cancelled', 'critical')} disabled={!selectedIds.length || Boolean(saving)} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white disabled:opacity-40">Delete/Cancel</button>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {loading && <p className="text-sm font-bold text-slate-500">Loading campaigns...</p>}
              {!loading && filteredRecords.length === 0 && <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">No campaign records yet.</p>}
              {filteredRecords.map((record) => {
                const meta = getMeta(record)
                const score = readinessScore(record)
                const signals = healthSignals(record)
                const stage = String(meta.lifecycleStage || meta.lifecycle_stage || 'build')
                const checked = selectedIds.includes(record.id)

                return (
                  <div key={record.id} className={`group rounded-[2rem] border p-4 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl ${selectedId === record.id ? 'border-slate-950 bg-white shadow-md' : 'border-slate-200 bg-slate-50/70'}`}>
                    <div className="flex items-start gap-3">
                      <input type="checkbox" checked={checked} onChange={() => toggleSelected(record.id)} className="mt-1 h-5 w-5 rounded border-slate-300" />
                      <button type="button" onClick={() => { setSelectedId(record.id); setMode('overview') }} className="w-full text-left">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-lg font-black group-hover:text-rose-600">{record.title || 'Untitled campaign'}</p>
                            <p className="text-xs font-bold text-slate-500">{record.owner_agent || record.owner || 'unassigned'} · {meta.channel || 'channel'} · {meta.serviceLine || meta.service_line || 'service'}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-black ${badgeClass(record.status)}`}>{statusIcon(record.status)} {record.status || 'active'}</span>
                            <span className={`rounded-full px-2 py-1 text-xs font-black ${stageClass(stage)}`}>{stage}</span>
                            <span className={`rounded-full border px-2 py-1 text-xs font-black ${priorityClass(record.priority)}`}>{record.priority || 'normal'}</span>
                          </div>
                        </div>

                        <div className="mt-3 grid gap-2 sm:grid-cols-4">
                          <Mini label="Objective" value={String(meta.objective || '—')} />
                          <Mini label="Audience" value={String(meta.audience || '—')} />
                          <Mini label="Budget" value={meta.budget ? `${meta.budget} MAD` : '—'} />
                          <Mini label="Ready" value={`${score}%`} />
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                          <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-slate-950" style={{ width: `${score}%` }} />
                        </div>
                      </button>
                    </div>

                    {signals.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {signals.slice(0, 4).map((signal) => (
                          <span key={signal} className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-black text-amber-700">{signal}</span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
                      <TinyButton onClick={() => { setSelectedId(record.id); setMode('overview') }} icon={<Eye className="h-3.5 w-3.5" />}>Open</TinyButton>
                      <TinyButton onClick={() => { setSelectedId(record.id); setMode('edit') }} icon={<Edit3 className="h-3.5 w-3.5" />}>Edit</TinyButton>
                      <TinyButton onClick={() => runCampaignAction('launch_campaign', 'active', 'high', {}, record)} icon={<PlayCircle className="h-3.5 w-3.5" />}>Launch</TinyButton>
                      <TinyButton onClick={() => runCampaignAction('pause_campaign', 'paused', 'normal', {}, record)} icon={<PauseCircle className="h-3.5 w-3.5" />}>Pause</TinyButton>
                      <TinyButton onClick={() => runCampaignAction('duplicate_campaign_blueprint', 'draft', 'normal', { duplicated_from: record.id }, record)} icon={<Copy className="h-3.5 w-3.5" />}>Duplicate</TinyButton>
                    </div>
                  </div>
                )
              })}
            </div>
          </SectionShell>

          <SectionShell title="Pipeline radar" eyebrow="Executive clarity" icon={<BarChart3 className="h-5 w-5" />} tint="slate">
            <div className="space-y-3">
              {lifecycleStages.map((stage) => {
                const count = records.filter((record) => String(getMeta(record).lifecycleStage || getMeta(record).lifecycle_stage || 'build') === stage).length
                return (
                  <div key={stage} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black capitalize">{stage}</p>
                      <span className={`rounded-full px-2 py-1 text-xs font-black ${stageClass(stage)}`}>{count}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-slate-950" style={{ width: `${records.length ? Math.min(100, (count / records.length) * 100) : 0}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </SectionShell>
        </section>

        <section id="selected" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_520px]">
          <SectionShell title="Selected campaign workspace" eyebrow="Open / edit / inspect / plan" icon={<Sparkles className="h-5 w-5" />} tint="violet">
            {!selected && <p className="text-sm font-bold text-slate-500">Select a campaign from the queue.</p>}
            {selected && (
              <>
                <div className="mb-4 flex flex-wrap gap-2">
                  {(['overview', 'edit', 'qa', 'plan'] as const).map((item) => (
                    <button key={item} onClick={() => setMode(item)} className={`rounded-full px-3 py-2 text-xs font-black capitalize ${mode === item ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{item}</button>
                  ))}
                </div>

                {mode === 'overview' && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-3xl font-black">{selected.title}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">{selected.description || 'No description provided.'}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <Info label="Status" value={selected.status || 'active'} />
                      <Info label="Priority" value={selected.priority || 'normal'} />
                      <Info label="Owner" value={selected.owner_agent || selected.owner || 'unassigned'} />
                      <Info label="Stage" value={String(selectedMeta.lifecycleStage || selectedMeta.lifecycle_stage || 'build')} />
                      <Info label="Channel" value={String(selectedMeta.channel || '—')} />
                      <Info label="Service" value={String(selectedMeta.serviceLine || selectedMeta.service_line || '—')} />
                      <Info label="Audience" value={String(selectedMeta.audience || '—')} />
                      <Info label="Budget" value={selectedMeta.budget ? `${selectedMeta.budget} MAD` : '—'} />
                    </div>
                    <BriefBlock title="Creative / operational brief" text={String(selectedMeta.creativeBrief || selectedMeta.offerAngle || selectedMeta.notes || 'No campaign brief stored yet.')} />
                  </div>
                )}

                {mode === 'edit' && (
                  <div className="space-y-3">
                    <input value={editForm.title} onChange={(e) => setEditForm((s) => ({ ...s, title: e.target.value }))} className={inputClass} />
                    <div className="grid grid-cols-2 gap-3">
                      <Select value={editForm.status} onChange={(value) => setEditForm((s) => ({ ...s, status: value }))} options={statuses} />
                      <Select value={editForm.priority} onChange={(value) => setEditForm((s) => ({ ...s, priority: value }))} options={priorities} />
                    </div>
                    <input value={editForm.ownerAgent} onChange={(e) => setEditForm((s) => ({ ...s, ownerAgent: e.target.value }))} placeholder="Owner / agent" className={inputClass} />
                    <input value={editForm.budget} onChange={(e) => setEditForm((s) => ({ ...s, budget: e.target.value }))} placeholder="Budget MAD" type="number" className={inputClass} />
                    <textarea value={editForm.note} onChange={(e) => setEditForm((s) => ({ ...s, note: e.target.value }))} rows={4} placeholder="Change note" className={inputClass} />
                    <button onClick={saveEdit} className="w-full rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white hover:bg-rose-700"><PenLine className="mr-1 inline h-4 w-4" /> Save Configuration</button>
                  </div>
                )}

                {mode === 'qa' && <div className="grid gap-3 sm:grid-cols-2">{qaRules.map((item) => <div key={item} className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-700"><CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-600" />{item}</div>)}</div>}

                {mode === 'plan' && (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Info label="Start" value={String(selectedMeta.start_date || '—')} />
                    <Info label="End" value={String(selectedMeta.end_date || '—')} />
                    <Info label="Expected leads" value={String(selectedMeta.expectedLeads || '—')} />
                    <Info label="Expected CPL" value={String(selectedMeta.expectedCpl || '—')} />
                  </div>
                )}
              </>
            )}
          </SectionShell>

          <SectionShell id="controls" title="Live command controls" eyebrow="Action execution" icon={<ShieldCheck className="h-5 w-5" />} tint="emerald">
            <div className="grid grid-cols-2 gap-3">
              <ActionButton disabled={!selected || Boolean(saving)} onClick={() => runCampaignAction('launch_campaign', 'active', 'high')} icon={<PlayCircle className="h-4 w-4" />}>Launch</ActionButton>
              <ActionButton disabled={!selected || Boolean(saving)} onClick={() => runCampaignAction('pause_campaign', 'paused')} icon={<PauseCircle className="h-4 w-4" />}>Pause</ActionButton>
              <ActionButton disabled={!selected || Boolean(saving)} onClick={() => runCampaignAction('create_test', 'active', 'high', { test_type: 'hook_audience_test' })} icon={<Wand2 className="h-4 w-4" />}>Create Test</ActionButton>
              <ActionButton disabled={!selected || Boolean(saving)} onClick={() => runCampaignAction('trigger_optimization_task', 'risk', 'urgent')} icon={<Flame className="h-4 w-4" />}>Optimize</ActionButton>
              <ActionButton disabled={!selected || Boolean(saving)} onClick={() => runCampaignAction('request_campaign_review', 'review', 'high')} icon={<FileText className="h-4 w-4" />}>Review</ActionButton>
              <ActionButton disabled={!selected || Boolean(saving)} onClick={() => runCampaignAction('flag_campaign_risk', 'risk', 'urgent')} icon={<Flag className="h-4 w-4" />}>Flag Risk</ActionButton>
              <ActionButton disabled={!selected || Boolean(saving)} onClick={() => runCampaignAction('complete_record', 'completed')} icon={<CheckCircle2 className="h-4 w-4" />}>Complete</ActionButton>
              <ActionButton disabled={!selected || Boolean(saving)} onClick={() => runCampaignAction('cancel_record', 'cancelled', 'critical')} icon={<Trash2 className="h-4 w-4" />}>Delete/Cancel</ActionButton>
              <ActionButton disabled={!selected || Boolean(saving)} onClick={() => runCampaignAction('create_content_request', 'active', 'high')} icon={<MessageSquare className="h-4 w-4" />}>Content Request</ActionButton>
              <ActionButton disabled={!selected || Boolean(saving)} onClick={() => runCampaignAction('schedule_campaign_review', 'review', 'normal')} icon={<CalendarDays className="h-4 w-4" />}>Schedule Review</ActionButton>
              <ActionButton disabled={!selected || Boolean(saving)} onClick={() => runCampaignAction('create_budget_adjustment', selected?.status || 'active', 'high')} icon={<DollarSign className="h-4 w-4" />}>Budget Change</ActionButton>
              <ActionButton disabled={!selected || Boolean(saving)} onClick={() => runCampaignAction('archive_record', 'archived')} icon={<Archive className="h-4 w-4" />}>Archive</ActionButton>
            </div>
          </SectionShell>
        </section>

        <section id="planner" className="grid gap-6 xl:grid-cols-3">
          <SectionShell title="Performance widgets" eyebrow="Live management" icon={<BarChart3 className="h-5 w-5" />} tint="blue">
            <Info label="Expected leads" value={String(selectedMeta.expectedLeads || '—')} />
            <Info label="Expected CPL" value={String(selectedMeta.expectedCpl || '—')} />
            <Info label="Budget" value={selectedMeta.budget ? `${selectedMeta.budget} MAD` : '—'} />
            <Info label="Readiness" value={selected ? `${readinessScore(selected)}%` : '—'} />
          </SectionShell>
          <SectionShell title="Daily operating rhythm" eyebrow="Marketing routine" icon={<Timer className="h-5 w-5" />} tint="amber">
            {['Morning: verify status, budget, CPL and lead handoff', 'Midday: adjust creative, audience, CTA, and budget', 'Evening: log result, decision and next optimization', 'Weekly: compare campaign angle, audience and service line performance'].map((item) => <div key={item} className="rounded-2xl bg-white p-3 text-sm font-bold text-slate-700">{item}</div>)}
          </SectionShell>
          <SectionShell title="Production shortcuts" eyebrow="Connected work" icon={<Users className="h-5 w-5" />} tint="slate">
            <Shortcut href="/market-os/content-brand-governance" label="Create related content" />
            <Shortcut href="/market-os/lead-intake-control" label="Check lead intake" />
            <Shortcut href="/market-os/risk-signals-ai" label="Open risk signals" />
            <Shortcut href="/market-os/marketing-calendar-execution" label="Plan calendar" />
          </SectionShell>
        </section>

        <section id="history" className="grid gap-6 xl:grid-cols-2">
          <SectionShell title="Recent campaign actions" eyebrow="Execution history" icon={<Activity className="h-5 w-5" />} tint="slate">
            {actions.length === 0 && <p className="text-sm font-bold text-slate-500">No campaign actions yet.</p>}
            {actions.slice(0, 16).map((action) => (
              <div key={action.id} className="rounded-2xl bg-slate-50 p-3">
                <p className="font-black">{action.action_label || action.action_key}</p>
                <p className="text-xs font-bold text-slate-500">{action.actor_name || 'operator'} · {safeDate(action.created_at)}</p>
              </div>
            ))}
          </SectionShell>
          <SectionShell title="Audit trail" eyebrow="Proof of work" icon={<ClipboardCheck className="h-5 w-5" />} tint="slate">
            {audit.length === 0 && <p className="text-sm font-bold text-slate-500">No campaign audit events yet.</p>}
            {audit.slice(0, 16).map((event) => (
              <div key={event.id} className="rounded-2xl bg-slate-50 p-3">
                <p className="font-black">{event.title || event.action_key}</p>
                <p className="text-xs font-bold text-slate-500">{event.summary || 'Audit event'} · {safeDate(event.created_at)}</p>
              </div>
            ))}
          </SectionShell>
        </section>
      </section>
    </main>
  )
}

function SectionShell({ id, title, eyebrow, icon, tint, children }: { id?: string; title: string; eyebrow: string; icon: React.ReactNode; tint: string; children: React.ReactNode }) {
  const tintClass = tint === 'rose' ? 'from-rose-500/15' : tint === 'blue' ? 'from-blue-500/15' : tint === 'emerald' ? 'from-emerald-500/15' : tint === 'amber' ? 'from-amber-500/15' : tint === 'violet' ? 'from-violet-500/15' : 'from-slate-500/10'
  return (
    <section id={id} className={`scroll-mt-24 rounded-[2.25rem] border border-white/70 bg-gradient-to-br ${tintClass} to-white p-5 shadow-lg shadow-slate-200/60`}>
      <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
        <div><p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">{eyebrow}</p><h2 className="mt-1 text-2xl font-black tracking-tight">{title}</h2></div>
        <span className="rounded-2xl bg-white p-3 text-slate-700 shadow-sm">{icon}</span>
      </div>
      {children}
    </section>
  )
}

function FormBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-5"><p className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-slate-500">{title}</p><div className="grid gap-4 lg:grid-cols-2">{children}</div></div>
}

function KpiCard({ label, value, icon, suffix = '' }: { label: string; value: number; icon: React.ReactNode; suffix?: string }) {
  return <div className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-lg shadow-slate-200/60 transition hover:-translate-y-1"><div className="flex items-center justify-between"><p className="text-xs font-black uppercase text-slate-500">{label}</p><span className="rounded-2xl bg-rose-50 p-2 text-rose-600">{icon}</span></div><p className="mt-2 text-3xl font-black">{value}{suffix}</p></div>
}

function ActionButton({ children, disabled, onClick, icon }: { children: React.ReactNode; disabled?: boolean; onClick: () => void; icon?: React.ReactNode }) {
  return <button type="button" onClick={onClick} disabled={disabled} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">{icon} {children}</button>
}

function TinyButton({ children, onClick, icon }: { children: React.ReactNode; onClick: () => void; icon?: React.ReactNode }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm">{icon} {children}</button>
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-black uppercase text-slate-500">{label}</p><p className="mt-1 font-black">{value}</p></div>
}

function BriefBlock({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">{title}</p><p className="mt-2 text-sm font-semibold text-slate-700">{text}</p></div>
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-white p-3"><p className="text-[10px] font-black uppercase text-slate-400">{label}</p><p className="mt-1 truncate text-xs font-black text-slate-700">{value}</p></div>
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <label className={full ? 'lg:col-span-2' : ''}><p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>{children}</label>
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>{options.map((item) => <option key={item}>{item}</option>)}</select>
}

function Shortcut({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-sm font-black transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm">{label}<ChevronRight className="h-4 w-4" /></Link>
}