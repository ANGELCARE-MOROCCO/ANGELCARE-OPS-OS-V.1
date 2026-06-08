'use client'

import { getInvestorCommunicationTemplate, INVESTOR_COMMUNICATION_TEMPLATE_COUNT } from '@/lib/capital-command-center/investor-communication-templates'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type EntityKey = 'investors' | 'opportunities' | 'commitments' | 'payments' | 'diligence' | 'trainings' | 'documents' | 'notes'
type ViewKey = 'command' | 'investors' | 'fundraising' | 'deals' | 'diligence' | 'trainings' | 'commitments' | 'payments' | 'dataroom' | 'reports'
type ModalMode = 'create' | 'edit' | 'view'
type AnyRecord = Record<string, any>

const NAV: { key: ViewKey; label: string; sub: string; icon: string; theme: string }[] = [
  { key: 'command', label: 'Command Overview', sub: 'Executive control tower', icon: '⌂', theme: 'blue' },
  { key: 'investors', label: 'Investor CRM', sub: 'LPs, partners, institutions', icon: '♙', theme: 'indigo' },
  { key: 'fundraising', label: 'Fundraising Pipeline', sub: 'Lead to close workflow', icon: '◇', theme: 'violet' },
  { key: 'deals', label: 'Deal Room', sub: 'Opportunities and theses', icon: '▣', theme: 'cyan' },
  { key: 'diligence', label: 'Due Diligence', sub: 'Legal, finance, risk', icon: '☑', theme: 'orange' },
  { key: 'trainings', label: 'Fundraising Training', sub: 'Staff HTML courses', icon: '▧', theme: 'blue' },
  { key: 'commitments', label: 'Commitments', sub: 'Soft, signed, closed', icon: '▤', theme: 'emerald' },
  { key: 'payments', label: 'Capital Ledger', sub: 'Receipts and balances', icon: '◈', theme: 'green' },
  { key: 'dataroom', label: 'Data Room', sub: 'Documents and access', icon: '▱', theme: 'sky' },
  { key: 'reports', label: 'Board Reporting', sub: 'Capital report center', icon: '◎', theme: 'slate' },
]

const ENTITY_META: Record<EntityKey, { title: string; short: string; endpoint: EntityKey; color: string; icon: string }> = {
  investors: { title: 'Investor / LP Dossier', short: 'Investor', endpoint: 'investors', color: '#2563eb', icon: '♙' },
  opportunities: { title: 'Capital Raise / Investment Opportunity', short: 'Opportunity', endpoint: 'opportunities', color: '#7c3aed', icon: '◇' },
  commitments: { title: 'Capital Commitment', short: 'Commitment', endpoint: 'commitments', color: '#0f766e', icon: '▤' },
  payments: { title: 'Capital Payment / Receipt', short: 'Payment', endpoint: 'payments', color: '#16a34a', icon: '◈' },
  diligence: { title: 'Due Diligence Work Item', short: 'Diligence', endpoint: 'diligence', color: '#ea580c', icon: '☑' },
  trainings: { title: 'Fundraising Staff Training HTML Page', short: 'Training page', endpoint: 'trainings', color: '#2563eb', icon: '▧' },
  documents: { title: 'Data Room Document', short: 'Document', endpoint: 'documents', color: '#0891b2', icon: '▱' },
  notes: { title: 'Investor / Deal Note', short: 'Note', endpoint: 'notes', color: '#475569', icon: '✎' },
}

const EMPTY_STATE: AnyRecord = {
  investors: [], opportunities: [], commitments: [], payments: [], diligence: [], trainings: [], documents: [], notes: [],
  stats: { investors: 0, opportunities: 0, activeOpportunities: 0, targetAmount: 0, committedAmount: 0, receivedAmount: 0, pendingAmount: 0, overduePayments: 0, diligenceOpen: 0, dataRoomDocs: 0, trainingPages: 0, nextCloseDays: null },
}

function money(value: any) {
  const n = Number(value || 0)
  if (!Number.isFinite(n)) return '0'
  return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(n)
}
function numberValue(value: any) { const n = Number(value || 0); return Number.isFinite(n) ? n : 0 }
function pct(part: any, total: any) { const p = numberValue(part), t = numberValue(total); return t ? Math.round((p / t) * 100) : 0 }
function today() { return new Date().toISOString().slice(0, 10) }
function statusTone(status: any) {
  const s = String(status || '').toLowerCase()
  if (['paid', 'closed', 'completed', 'signed', 'committed', 'approved', 'received'].includes(s)) return 'green'
  if (['pending', 'soft_commit', 'diligence', 'negotiation', 'screening', 'prospect', 'active'].includes(s)) return 'blue'
  if (['rejected', 'cancelled', 'lost', 'blocked', 'overdue', 'expired'].includes(s)) return 'red'
  if (['high', 'urgent'].includes(s)) return 'orange'
  return 'slate'
}
function initials(value: any) { return String(value || 'CC').split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('') || 'CC' }
function daysUntil(value: any) { if (!value) return null; const d = new Date(String(value)); return Number.isNaN(d.getTime()) ? null : Math.ceil((d.getTime() - Date.now()) / 86400000) }
function refLabel(prefix: string) { return `${prefix}-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}` }
function dataOf(record: AnyRecord) { return record?.data && typeof record.data === 'object' && !Array.isArray(record.data) ? record.data : {} }


function makeCapitalRecordId(prefix = 'record') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function emptyFollowupAction() {
  return {
    id: makeCapitalRecordId('followup'),
    note: '',
    status: 'open',
    due_at: '',
    owner: '',
    created_at: new Date().toISOString(),
  }
}

function communicationLabel(value: any) {
  const map: Record<string, string> = {
    investor_intro: 'Introduction investisseur',
    follow_up: 'Relance structurée',
    data_room_invite: 'Invitation data room',
    nda_request: 'Demande NDA',
    meeting_request: 'Demande de réunion',
    soft_commit_request: 'Demande de soft commitment',
    closing_followup: 'Relance closing',
    reporting_update: 'Mise à jour reporting',
  }
  return map[String(value || '')] || String(value || 'Communication')
}

function phaseLabel(value: any) {
  const map: Record<string, string> = {
    prospect: 'Prospect',
    contacted: 'Contact initial',
    nda: 'NDA',
    data_room: 'Data room',
    negotiation: 'Négociation',
    soft_commit: 'Soft commit',
    closed: 'Clôturé',
  }
  return map[String(value || '')] || String(value || 'Phase')
}

function normalizePhoneDigits(value: any) {
  return String(value || '').replace(/[^\d]/g, '')
}

function normalizePhoneUrl(value: any) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  return `tel:${raw.replace(/\s+/g, '')}`
}

function normalizeWhatsappUrl(value: any) {
  const digits = normalizePhoneDigits(value)
  return digits ? `https://wa.me/${digits}` : ''
}

function makeCommunicationTemplate(action: AnyRecord, investor: AnyRecord, contact: AnyRecord) {
  const ticketRange = investor?.ticket_size_min || investor?.ticket_size_max
    ? `${money(investor?.ticket_size_min || 0)} à ${money(investor?.ticket_size_max || 0)} ${investor?.currency || 'Dhs'}`
    : ''

  return getInvestorCommunicationTemplate({
    type: action?.type || 'investor_intro',
    phase: action?.phase || investor?.stage || 'prospect',
    channel: action?.channel || 'email',
    investorName: investor?.investor_name || 'votre organisation',
    contactName: contact?.full_name || action?.contact_name || 'Madame, Monsieur',
    ticketRange,
    currency: investor?.currency || 'Dhs',
    relationshipOwner: investor?.relationship_owner || 'AngelCare Capital Command Center',
  })
}

function hydrateCommunicationMessage(action: AnyRecord, investor: AnyRecord, contact: AnyRecord): AnyRecord {
  const generated = makeCommunicationTemplate(action, investor, contact)

  return {
    ...action,
    subject: generated.subject,
    message: generated.message,
    updated_at: action?.updated_at || new Date().toISOString(),
  }
}

function emptyCommunicationAction(contacts: AnyRecord[] = [], investor: AnyRecord = {}) {
  const firstContact = contacts[0] || {}
  const base = {
    id: makeCapitalRecordId('communication'),
    type: 'investor_intro',
    phase: investor?.stage || 'prospect',
    channel: firstContact.preferred_channel || 'email',
    contact_id: firstContact.id || '',
    contact_name: firstContact.full_name || firstContact.email || '',
    contact_email: firstContact.email || '',
    contact_phone: firstContact.phone || '',
    contact_whatsapp: firstContact.whatsapp || '',
    subject: '',
    message: '',
    status: 'planned',
    scheduled_at: '',
    completed_at: '',
    owner: investor?.relationship_owner || '',
    followups: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  return hydrateCommunicationMessage(base, investor, firstContact)
}


function withData(record: AnyRecord, key: string, value: any) { return { ...record, data: { ...dataOf(record), [key]: value } } }

function makeContactId() {
  return `contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeExternalUrl(value: any) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  if (/^mailto:|^tel:/i.test(raw)) return raw
  return `https://${raw}`
}

function emptyInvestorContact() {
  return {
    id: makeContactId(),
    full_name: '',
    title: '',
    department: '',
    email: '',
    phone: '',
    whatsapp: '',
    website: '',
    linkedin: '',
    preferred_channel: 'email',
    priority: 'secondary',
    notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function emptyInvestorLink() {
  return {
    id: makeContactId(),
    label: '',
    url: '',
    type: 'website',
    notes: '',
  }
}


function filterRows(rows: AnyRecord[], query: string, stage: string, keys: string[]) {
  const q = query.trim().toLowerCase()
  return rows.filter((row) => {
    const stageOk = stage === 'all' || String(row.stage || row.status || row.priority || '').toLowerCase() === stage.toLowerCase()
    if (!stageOk) return false
    if (!q) return true
    return keys.some((key) => String(row[key] || '').toLowerCase().includes(q))
  })
}
function byId(rows: AnyRecord[], id: any) { return rows.find((row) => String(row.id) === String(id)) }

function defaultRecord(entity: EntityKey, data: AnyRecord) {
  const investor = data.investors?.[0]
  const opportunity = data.opportunities?.[0]
  const commitment = data.commitments?.[0]
  const base: AnyRecord = { currency: 'Dhs', data: {} }
  if (entity === 'investors') return { ...base, reference_number: refLabel('INV'), investor_name: '', investor_type: 'family_office', stage: 'prospect', priority: 'high', country: '', city: '', contact_name: '', email: '', phone: '', relationship_owner: '', compliance_status: 'pending', ticket_size_min: 0, ticket_size_max: 0, next_followup_at: '', investor_profile: '', data: { source: 'direct', mandate: '', investment_preferences: [], required_documents: [], communication_log: [], risk_flags: [], contacts: [], links: [] } }
  if (entity === 'opportunities') return { ...base, reference_number: refLabel('CAPD'), opportunity_title: '', opportunity_type: 'fundraise', stage: 'screening', status: 'active', target_amount: 0, committed_amount: 0, received_amount: 0, valuation: 0, sector: '', geography: '', owner: '', probability: 25, closing_date: today(), thesis: '', risk_summary: '', data: { terms: [], strategic_fit: '', committee_decision: 'not_submitted', underwriting_assumptions: [], milestones: [] } }
  if (entity === 'commitments') return { ...base, reference_number: refLabel('COM'), investor_id: investor?.id || '', opportunity_id: opportunity?.id || '', commitment_type: 'soft_commitment', status: 'soft_commit', committed_amount: 0, received_amount: 0, commitment_date: today(), expected_close_date: '', documents_status: 'pending', conditions: '', data: { capital_call_schedule: [], conditions_precedent: [], signing_package: [] } }
  if (entity === 'payments') return { ...base, reference_number: refLabel('CPP'), investor_id: investor?.id || '', opportunity_id: opportunity?.id || '', commitment_id: commitment?.id || '', payment_type: 'capital_receipt', status: 'pending', amount: 0, due_date: today(), paid_date: '', payment_method: 'bank_transfer', payment_details: '', proof_url: '', finance_note: '', data: { bank_reconciliation: 'pending', receipt_preview: {}, allocations: [], audit_events: [] } }
  if (entity === 'diligence') return { reference_number: refLabel('DD'), opportunity_id: opportunity?.id || '', investor_id: investor?.id || '', task_title: '', category: 'finance', status: 'open', priority: 'normal', owner: '', due_date: today(), evidence_url: '', notes: '', data: { checklist: [], blockers: [], signoffs: [] } }
  if (entity === 'trainings') return { ...base, reference_number: refLabel('TRHTML'), investor_id: investor?.id || '', opportunity_id: opportunity?.id || '', training_title: '', training_source: 'AngelCare fundraising academy', category: 'fundraising_staff', status: 'draft', priority: 'normal', owner: '', audience: 'Fundraising staff', publish_status: 'draft', html_content: '', summary: '', duration_minutes: 360, data: { learning_objectives: [], modules: [], staff_roles: [], publishing_notes: '', version: 'v1', review_history: [], access_rules: [] } }
  if (entity === 'documents') return { reference_number: refLabel('CDR'), investor_id: investor?.id || '', opportunity_id: opportunity?.id || '', commitment_id: commitment?.id || '', document_title: '', category: 'data_room', status: 'draft', visibility: 'internal', file_url: '', version: 'v1', owner: '', expiry_date: '', data: { access_list: [], revision_notes: [], required_for: [] } }
  return { reference_number: refLabel('CN'), investor_id: investor?.id || '', opportunity_id: opportunity?.id || '', commitment_id: commitment?.id || '', category: 'general', priority: 'normal', note: '', owner: '', followup_at: '', data: { action_required: false, escalation: '', history: [] } }
}

export default function CapitalCommandCenterClient() {
  const [view, setView] = useState<ViewKey>('command')
  const [data, setData] = useState<AnyRecord>(EMPTY_STATE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState<{ entity: EntityKey; record: AnyRecord; mode: ModalMode; tab: string } | null>(null)
  const [detail, setDetail] = useState<AnyRecord | null>(null)
  const [query, setQuery] = useState('')
  const [stageFilter, setStageFilter] = useState('all')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/capital-command-center', { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.ok === false) throw new Error(json?.error || 'Unable to load Capital Command Center')
      setData({ ...EMPTY_STATE, ...(json.data || {}) })
    } catch (error: any) {
      alert(error?.message || 'Unable to load Capital Command Center')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const stats = data.stats || EMPTY_STATE.stats
  const investors = data.investors || []
  const opportunities = data.opportunities || []
  const commitments = data.commitments || []
  const payments = data.payments || []
  const diligence = data.diligence || []
  const documents = data.documents || []
  const trainings = data.trainings || []
  const notes = data.notes || []
  const filteredInvestors = useMemo(() => filterRows(investors, query, stageFilter, ['investor_name', 'contact_name', 'email', 'country', 'stage']), [investors, query, stageFilter])
  const filteredOpps = useMemo(() => filterRows(opportunities, query, stageFilter, ['opportunity_title', 'sector', 'geography', 'stage']), [opportunities, query, stageFilter])

  function open(entity: EntityKey, record?: AnyRecord, mode: ModalMode = 'create', tab = 'overview') {
    setModal({ entity, mode, tab, record: record ? { ...record, data: dataOf(record) } : defaultRecord(entity, data) })
  }

  async function saveModal() {
    if (!modal) return
    setSaving(true)
    try {
      const isUpdate = Boolean(modal.record.id)
      const url = isUpdate ? `/api/capital-command-center/${modal.entity}/${modal.record.id}` : `/api/capital-command-center/${modal.entity}`
      const res = await fetch(url, { method: isUpdate ? 'PATCH' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(modal.record) })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.ok === false) throw new Error(json?.error || 'Unable to save')
      await load()
      setModal({ ...modal, mode: 'view', record: { ...modal.record, ...(json.data || {}) } })
    } catch (error: any) { alert(error?.message || 'Unable to save') } finally { setSaving(false) }
  }

  async function archive(entity: EntityKey, id: any) {
    if (!confirm('Archive this record from the active workspace?')) return
    const res = await fetch(`/api/capital-command-center/${entity}/${id}`, { method: 'DELETE' })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || json?.ok === false) alert(json?.error || 'Unable to archive')
    else load()
  }

  const globalContext = { investors, opportunities, commitments, payments, diligence, trainings, documents, notes, open, archive, setDetail }

  return <main className="capital-shell">
    <CapitalSidebar view={view} setView={setView} />
    <section className="capital-main">
      <header className="capital-topbar">
        <div>
          <p className="eyebrow">Strategic Finance OS</p>
          <h1>Capital Command Center</h1>
          <p className="sub">A production workspace for investor relations, fundraising execution, diligence, commitments, capital receipts, data-room governance and board reporting.</p>
        </div>
        <div className="top-actions"><button onClick={load}>{loading ? 'Refreshing…' : 'Refresh Live'}</button><button className="primary" onClick={() => open('investors')}>+ Investor</button><button className="primary purple" onClick={() => open('opportunities')}>+ Opportunity</button><button className="primary" onClick={() => open('trainings')}>+ Training HTML</button></div>
      </header>

      <section className="kpi-grid premium">
        <Kpi icon="♙" label="Investors" value={stats.investors} sub="live CRM records" tone="blue" />
        <Kpi icon="◇" label="Target Raise" value={`${money(stats.targetAmount)} Dhs`} sub="active opportunities" tone="violet" />
        <Kpi icon="▤" label="Committed" value={`${money(stats.committedAmount)} Dhs`} sub={`${pct(stats.committedAmount, stats.targetAmount)}% of target`} tone="green" />
        <Kpi icon="◈" label="Received" value={`${money(stats.receivedAmount)} Dhs`} sub={`${money(stats.pendingAmount)} pending`} tone="teal" />
        <Kpi icon="☑" label="Diligence Open" value={stats.diligenceOpen} sub="active checkpoints" tone="orange" />
        <Kpi icon="▱" label="Data Room" value={stats.dataRoomDocs} sub="controlled documents" tone="slate" />
      </section>

      <section className="workspace-toolbar"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search investor, opportunity, owner, geography, stage…" /><select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}><option value="all">All stages</option><option value="prospect">Prospect</option><option value="screening">Screening</option><option value="diligence">Diligence</option><option value="negotiation">Negotiation</option><option value="soft_commit">Soft Commit</option><option value="signed">Signed</option><option value="paid">Paid</option></select></section>

      {view === 'command' && <CommandOverview stats={stats} ctx={globalContext} />}
      {view === 'investors' && <InvestorsWorkspace rows={filteredInvestors} ctx={globalContext} />}
      {view === 'fundraising' && <FundraisingWorkspace rows={filteredOpps} ctx={globalContext} />}
      {view === 'deals' && <DealRoomWorkspace rows={filteredOpps} ctx={globalContext} />}
      {view === 'diligence' && <DiligenceWorkspace rows={diligence} ctx={globalContext} />}
      {view === 'trainings' && <TrainingWorkspace rows={trainings} ctx={globalContext} />}
      {view === 'commitments' && <CommitmentsWorkspace rows={commitments} ctx={globalContext} />}
      {view === 'payments' && <PaymentsWorkspace rows={payments} ctx={globalContext} />}
      {view === 'dataroom' && <DataRoomWorkspace rows={documents} ctx={globalContext} />}
      {view === 'reports' && <ReportsWorkspace data={data} ctx={globalContext} />}
    </section>

    {modal && <EnterpriseModal modal={modal} setModal={setModal} data={data} saving={saving} onSave={saveModal} onClose={() => setModal(null)} />}
    {detail && <InvestmentDetailPanel record={detail} data={data} onClose={() => setDetail(null)} open={open} />}
    <style jsx global>{css}</style>
  </main>
}

function CapitalSidebar({ view, setView }: { view: ViewKey; setView: (v: ViewKey) => void }) {
  return <aside className="capital-sidebar">
    <div className="brand"><div className="brand-mark">C</div><div><strong>Capital</strong><span>Command Center</span></div></div>
    <nav>{NAV.map((item) => <button key={item.key} onClick={() => setView(item.key)} className={view === item.key ? 'active' : ''}><span>{item.icon}</span><b>{item.label}</b><small>{item.sub}</small></button>)}</nav>
    <div className="operator-card"><b>Capital OS</b><span>● Live workspace</span><small>Investor relations, fundraising, diligence, payments and board reporting are managed from a single governed command layer.</small></div>
  </aside>
}

function Kpi({ icon, label, value, sub, tone }: { icon: string; label: string; value: ReactNode; sub: string; tone: string }) { return <article className={`kpi ${tone}`}><span>{icon}</span><p>{label}</p><strong>{value}</strong><small>{sub}</small></article> }
function SectionTitle({ title, text, action }: { title: string; text: string; action?: ReactNode }) { return <header className="section-title"><div><h2>{title}</h2><p>{text}</p></div>{action}</header> }
function Badge({ value }: { value: any }) { const tone = statusTone(value); return <span className={`badge ${tone}`}>{String(value || 'open').replace(/_/g, ' ')}</span> }
function Empty({ title, text }: { title: string; text: string }) { return <div className="empty"><strong>{title}</strong><p>{text}</p></div> }
function Priority({ label, value }: { label: string; value: ReactNode }) { return <div className="priority"><span>{label}</span><b>{value}</b></div> }
function MiniProgress({ label, value }: { label: string; value: number }) { return <div><div className="mini-progress-label"><span>{label}</span><b>{value}%</b></div><div className="progress light"><i style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div></div> }

function CommandOverview({ stats, ctx }: { stats: AnyRecord; ctx: AnyRecord }) {
  const recent = [...ctx.opportunities, ...ctx.commitments, ...ctx.payments].sort((a: AnyRecord, b: AnyRecord) => String(b.updated_at || '').localeCompare(String(a.updated_at || ''))).slice(0, 7)
  return <section className="section-stack">
    <div className="command-grid">
      <div className="hero-panel"><div><p className="eyebrow">Capital readiness cockpit</p><h2>Run fundraising, investor confidence and capital receipts with board-grade operating discipline.</h2><div className="progress"><i style={{ width: `${pct(stats.committedAmount, stats.targetAmount)}%` }} /></div><p>{pct(stats.committedAmount, stats.targetAmount)}% committed against the active raise target.</p><div className="hero-actions"><button onClick={() => ctx.open('opportunities')} className="primary">Create opportunity</button><button onClick={() => ctx.open('commitments')}>Record commitment</button><button onClick={() => ctx.open('payments')}>Add payment</button></div></div></div>
      <div className="stack-panels"><Panel title="Finance alerts"><Priority label="Pending capital" value={`${money(stats.pendingAmount)} Dhs`} /><Priority label="Overdue payments" value={stats.overduePayments} /><Priority label="Diligence open" value={stats.diligenceOpen} /><Priority label="Next close" value={stats.nextCloseDays === null ? 'Not scheduled' : `${stats.nextCloseDays} days`} /></Panel><Panel title="Operating posture"><MiniProgress label="Commitment coverage" value={pct(stats.committedAmount, stats.targetAmount)} /><MiniProgress label="Cash received" value={pct(stats.receivedAmount, stats.committedAmount)} /><MiniProgress label="Pipeline activation" value={ctx.opportunities.length ? 72 : 0} /></Panel></div>
    </div>
    <div className="triple-grid"><Panel title="Investor Movement"><Timeline rows={ctx.investors.slice(0, 5)} titleKey="investor_name" empty="No investor activity yet." /></Panel><Panel title="Pipeline Movement"><Timeline rows={ctx.opportunities.slice(0, 5)} titleKey="opportunity_title" empty="No opportunities yet." /></Panel><Panel title="Recent Capital Operations"><Timeline rows={recent} titleKey="reference_number" empty="No recent operations." /></Panel></div>
  </section>
}
function Panel({ title, children }: { title: string; children: ReactNode }) { return <section className="panel"><h3>{title}</h3>{children}</section> }
function Timeline({ rows, titleKey, empty }: { rows: AnyRecord[]; titleKey: string; empty: string }) { return <div className="timeline-list">{rows.map((row) => <article key={`${titleKey}-${row.id}`}><span>{initials(row[titleKey] || row.reference_number)}</span><div><b>{row[titleKey] || row.reference_number}</b><small>{row.stage || row.status || row.updated_at || 'live record'}</small></div></article>)}{!rows.length && <Empty title="No activity" text={empty} />}</div> }

function InvestorsWorkspace({ rows, ctx }: { rows: AnyRecord[]; ctx: AnyRecord }) {
  return <section className="section-stack"><SectionTitle title="Investor CRM" text="Govern LPs, institutions, family offices and strategic relationships with detailed dossiers, compliance, follow-ups and ticket intelligence." action={<button className="primary" onClick={() => ctx.open('investors')}>+ Investor dossier</button>} /><div className="cards-grid">{rows.map((row) => <article key={row.id} className="investor-card premium-card"><div className="card-top"><div className="avatar">{initials(row.investor_name)}</div><div><h3>{row.investor_name}</h3><p>{row.investor_type} · {row.country || 'Global'}</p></div><Badge value={row.stage} /></div><div className="money-row"><small>Ticket range</small><b>{money(row.ticket_size_min)} → {money(row.ticket_size_max)} {row.currency || 'Dhs'}</b></div><div className="card-meta"><span>{row.priority || 'normal'}</span><span>{row.compliance_status || 'pending'}</span><span>{row.relationship_owner || 'Unassigned'}</span></div><p>{row.investor_profile || 'No investor thesis/profile captured yet.'}</p><div className="row-actions"><button onClick={() => ctx.open('investors', row, 'view')}>Open dossier</button><button onClick={() => ctx.open('notes', { investor_id: row.id }, 'create')}>+ Note</button><button onClick={() => ctx.archive('investors', row.id)}>Archive</button></div></article>)}{!rows.length && <Empty title="No investors yet" text="Create the first investor dossier to start the fundraising CRM." />}</div></section>
}
function FundraisingWorkspace({ rows, ctx }: { rows: AnyRecord[]; ctx: AnyRecord }) {
  const lanes = ['screening', 'diligence', 'negotiation', 'soft_commit', 'closed']
  return <section className="section-stack"><SectionTitle title="Fundraising Pipeline" text="A stage-by-stage fundraising command board from lead screening to closed capital." action={<button className="primary purple" onClick={() => ctx.open('opportunities')}>+ Opportunity</button>} /><div className="kanban">{lanes.map((lane) => <div key={lane} className="lane"><h3>{lane.replace(/_/g, ' ')}</h3>{rows.filter((x) => String(x.stage) === lane).map((row) => <article key={row.id} onClick={() => ctx.open('opportunities', row, 'view')}><div className="card-top"><b>{row.opportunity_title}</b><Badge value={row.stage} /></div><p>{row.sector || 'Sector not set'} · {row.geography || 'Global'}</p><Priority label="Target" value={`${money(row.target_amount)} ${row.currency || 'Dhs'}`} /><MiniProgress label="Probability" value={numberValue(row.probability)} /></article>)}{!rows.filter((x) => String(x.stage) === lane).length && <div className="lane-empty">No records</div>}</div>)}</div></section>
}
function DealRoomWorkspace({ rows, ctx }: { rows: AnyRecord[]; ctx: AnyRecord }) { return <section className="section-stack"><SectionTitle title="Deal Room" text="Investment opportunity workspaces with thesis, valuation, risk, closing readiness and IC preparation." action={<button onClick={() => ctx.open('opportunities')}>+ Deal</button>} /><div className="deal-room-grid">{rows.map((row) => <article key={row.id} className="deal-room-card"><div className="card-top"><div><p className="eyebrow">{row.reference_number}</p><h3>{row.opportunity_title}</h3></div><Badge value={row.status} /></div><p>{row.thesis || 'No thesis captured.'}</p><div className="deal-metrics"><span><small>Target</small><b>{money(row.target_amount)}</b></span><span><small>Valuation</small><b>{money(row.valuation)}</b></span><span><small>Close</small><b>{row.closing_date || '—'}</b></span></div><p className="risk-text">{row.risk_summary || 'No risk summary captured.'}</p><div className="row-actions"><button onClick={() => ctx.setDetail(row)}>Preview</button><button onClick={() => ctx.open('diligence', { opportunity_id: row.id }, 'create')}>+ DD</button><button onClick={() => ctx.open('opportunities', row, 'edit')}>Edit</button></div></article>)}{!rows.length && <Empty title="No opportunities" text="Create a deal or capital raise opportunity." />}</div></section> }
function DiligenceWorkspace({ rows, ctx }: { rows: AnyRecord[]; ctx: AnyRecord }) { const cats = ['finance', 'legal', 'commercial', 'risk', 'operations']; return <section className="section-stack"><SectionTitle title="Due Diligence Workspace" text="Separated workstreams for finance, legal, commercial, risk and operations. Each task is live, owned and evidence-linked." action={<button className="primary orange" onClick={() => ctx.open('diligence')}>+ DD task</button>} /><div className="dd-grid">{cats.map((cat) => <div key={cat} className="dd-column"><h3>{cat}</h3>{rows.filter((row) => String(row.category) === cat).map((row) => <article key={row.id}><b>{row.task_title}</b><p>{row.notes || 'No notes.'}</p><div className="card-meta"><Badge value={row.status} /><span>{row.owner || 'Unassigned'}</span><span>{row.due_date || 'No due date'}</span></div><div className="row-actions"><button onClick={() => ctx.open('diligence', row, 'view')}>Open</button><button onClick={() => ctx.open('documents', { opportunity_id: row.opportunity_id, category: 'evidence' }, 'create')}>Evidence</button></div></article>)}{!rows.filter((row) => String(row.category) === cat).length && <div className="lane-empty">Clear</div>}</div>)}</div></section> }

function TrainingWorkspace({ rows, ctx }: { rows: AnyRecord[]; ctx: AnyRecord }) {
  return <section className="section-stack">
    <SectionTitle title="Fundraising Staff Training Library" text="Create, govern and publish HTML training pages for AngelCare fundraising staff, investor relations, VC preparation, national funding programs and capital readiness." action={<button className="primary" onClick={() => ctx.open('trainings')}>+ Training HTML page</button>} />
    <div className="cards-grid dataroom-grid">{rows.map((row) => <article key={row.id} className="doc-card premium-card"><div className="card-top"><div><p className="eyebrow">{row.reference_number}</p><h3>{row.training_title || 'Untitled training page'}</h3></div><Badge value={row.publish_status || row.status} /></div><p>{row.summary || 'No training summary captured yet.'}</p><div className="card-meta"><span>{row.audience || 'Fundraising staff'}</span><span>{row.training_source || 'AngelCare Academy'}</span><span>{row.duration_minutes || 360} min</span></div><Priority label="Owner" value={row.owner || 'Unassigned'} /><Priority label="Category" value={String(row.category || 'fundraising_staff').replace(/_/g, ' ')} /><div className="row-actions"><button onClick={() => ctx.open('trainings', row, 'view')}>Open</button><button onClick={() => ctx.open('trainings', row, 'edit')}>Edit</button></div></article>)}{!rows.length && <Empty title="No training HTML pages" text="Create the first staff fundraising training page to make this workspace operational." />}</div>
  </section>
}

function CommitmentsWorkspace({ rows, ctx }: { rows: AnyRecord[]; ctx: AnyRecord }) { return <section className="section-stack"><SectionTitle title="Commitments Tracking" text="Soft commitments, signed commitments, received capital, outstanding balances and documents readiness." action={<button className="primary" onClick={() => ctx.open('commitments')}>+ Commitment</button>} /><DataTable rows={rows} columns={[['reference_number', 'Reference'], ['investor_id', 'Investor'], ['opportunity_id', 'Opportunity'], ['status', 'Status'], ['committed_amount', 'Committed'], ['received_amount', 'Received'], ['expected_close_date', 'Expected Close']]} onOpen={(row) => ctx.open('commitments', row, 'view')} /></section> }
function PaymentsWorkspace({ rows, ctx }: { rows: AnyRecord[]; ctx: AnyRecord }) { return <section className="section-stack"><SectionTitle title="Capital Payments Ledger" text="Track capital receipts, pending payments, rejected flows, proof links, audit notes and bank reconciliation state." action={<button className="primary green" onClick={() => ctx.open('payments')}>+ Payment</button>} /><DataTable rows={rows} columns={[['reference_number', 'Reference'], ['investor_id', 'Investor'], ['commitment_id', 'Commitment'], ['status', 'Status'], ['amount', 'Amount'], ['due_date', 'Due Date'], ['paid_date', 'Paid Date'], ['payment_method', 'Method']]} onOpen={(row) => ctx.open('payments', row, 'view')} /></section> }
function DataRoomWorkspace({ rows, ctx }: { rows: AnyRecord[]; ctx: AnyRecord }) { return <section className="section-stack"><SectionTitle title="Data Room" text="Controlled document library with visibility, versioning, expiry dates, owners and investor/deal links." action={<button className="primary" onClick={() => ctx.open('documents')}>+ Document</button>} /><div className="cards-grid dataroom-grid">{rows.map((row) => <article key={row.id} className="doc-card"><div className="card-top"><h3>{row.document_title}</h3><Badge value={row.status} /></div><p>{row.category} · {row.visibility} · {row.version}</p><Priority label="Owner" value={row.owner || 'Unassigned'} /><Priority label="Expiry" value={row.expiry_date || 'No expiry'} /><div className="row-actions"><button onClick={() => ctx.open('documents', row, 'view')}>Open</button>{row.file_url && <a className="buttonlike" href={row.file_url} target="_blank" rel="noreferrer">View file</a>}</div></article>)}{!rows.length && <Empty title="No documents" text="Add a data-room document to start governance." />}</div></section> }
function ReportsWorkspace({ data, ctx }: { data: AnyRecord; ctx: AnyRecord }) { const stats = data.stats || {}; return <section className="section-stack"><SectionTitle title="Board Reporting" text="Board-grade reporting layer for fundraising, commitments, diligence, payments and investor movement." action={<button onClick={() => window.print()}>Print screen</button>} /><div className="report-grid"><section><h3>Raise Summary</h3><Priority label="Target" value={`${money(stats.targetAmount)} Dhs`} /><Priority label="Committed" value={`${money(stats.committedAmount)} Dhs`} /><Priority label="Received" value={`${money(stats.receivedAmount)} Dhs`} /><MiniProgress label="Coverage" value={pct(stats.committedAmount, stats.targetAmount)} /></section><section><h3>Investor Quality</h3><Priority label="Investors" value={stats.investors || 0} /><Priority label="Pipeline" value={stats.opportunities || 0} /><Priority label="Diligence" value={stats.diligenceOpen || 0} /></section><section><h3>Finance Control</h3><Priority label="Pending" value={`${money(stats.pendingAmount)} Dhs`} /><Priority label="Overdue" value={stats.overduePayments || 0} /><Priority label="Documents" value={stats.dataRoomDocs || 0} /></section></div><Panel title="Report Actions"><div className="report-actions"><button onClick={() => ctx.open('notes', { category: 'board_report', note: 'Board report generated for review.' }, 'create')}>Create board note</button><button onClick={() => ctx.open('documents', { category: 'board_pack', document_title: 'Capital board pack' }, 'create')}>Create board pack document</button><button onClick={() => ctx.open('payments')}>Open payment control</button></div></Panel></section> }

function DataTable({ rows, columns, onOpen }: { rows: AnyRecord[]; columns: [string, string][]; onOpen: (row: AnyRecord) => void }) { return <div className="enterprise-table"><table><thead><tr>{columns.map(([_, label]) => <th key={label}>{label}</th>)}<th>Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{columns.map(([key]) => <td key={key}>{key.includes('amount') || key === 'amount' ? `${money(row[key])} ${row.currency || 'Dhs'}` : key === 'status' ? <Badge value={row[key]} /> : String(row[key] ?? '—')}</td>)}<td><button onClick={() => onOpen(row)}>Open</button></td></tr>)}</tbody></table>{!rows.length && <Empty title="No records" text="Nothing is currently registered in this workspace." />}</div> }

function EnterpriseModal({ modal, setModal, data, saving, onSave, onClose }: { modal: { entity: EntityKey; record: AnyRecord; mode: ModalMode; tab: string }; setModal: (m: any) => void; data: AnyRecord; saving: boolean; onSave: () => void; onClose: () => void }) {
  const meta = ENTITY_META[modal.entity]
  const locked = modal.mode === 'view'
  const record = modal.record
  const tabs = modalTabs(modal.entity)
  function update(key: string, value: any) { setModal({ ...modal, record: { ...record, [key]: value } }) }
  function updateData(key: string, value: any) { setModal({ ...modal, record: withData(record, key, value) }) }
  function switchMode(mode: ModalMode) { setModal({ ...modal, mode }) }
  return <div className="modal-backdrop"><div className="capital-modal mega-modal">
    <header className="modal-header-premium" style={{ borderTopColor: meta.color }}><div className="modal-title-block"><span className="modal-icon" style={{ background: meta.color }}>{meta.icon}</span><div><p className="eyebrow">{modal.mode === 'create' ? 'Create' : modal.mode === 'edit' ? 'Edit' : 'View'} · {meta.short}</p><h2>{meta.title}</h2><p>{record.reference_number || 'Reference generated on save'} · live Supabase record · governed capital operation</p></div></div><div className="modal-actions">{locked ? <button className="primary" onClick={() => switchMode('edit')}>Edit</button> : <button className="primary" onClick={onSave}>{saving ? 'Saving…' : 'Save live record'}</button>}<button onClick={onClose}>Close</button></div></header>
    <div className="modal-command-layout"><aside className="modal-tabs">{tabs.map((tab) => <button key={tab.key} onClick={() => setModal({ ...modal, tab: tab.key })} className={modal.tab === tab.key ? 'active' : ''}><b>{tab.label}</b><small>{tab.sub}</small></button>)}<div className="modal-audit-card"><b>Audit posture</b><span>{record.reference_number || 'Pending reference'}</span><small>Every field saves through the Capital Command API and keeps active finance records separated by entity.</small></div></aside>
      <section className="modal-workspace"><EntityForm entity={modal.entity} record={record} locked={locked} update={update} updateData={updateData} data={data} tab={modal.tab} /></section>
      <aside className="modal-right"><RecordSummary entity={modal.entity} record={record} data={data} /><ContextActions entity={modal.entity} record={record} setModal={setModal} modal={modal} /></aside>
    </div>
  </div></div>
}
function modalTabs(entity: EntityKey) {
  const entityName = String(entity || '').toLowerCase()

  if (entityName.includes('investor')) {
    return [
      { key: 'overview', label: 'Overview', sub: 'Investor identity and contacts' },
      { key: 'communication', label: 'Communication', sub: 'Lifecycle, scripts and follow-ups' },
      { key: 'finance', label: 'Finance', sub: 'Tickets and investment appetite' },
      { key: 'risk', label: 'Risk & Compliance', sub: 'KYC, documents and flags' },
      { key: 'operations', label: 'Operations', sub: 'Links, logs and actions' },
      { key: 'audit', label: 'Audit Trail', sub: 'References and history' },
    ]
  }

  if (entityName.includes('training')) {
    return [
      { key: 'overview', label: 'Overview', sub: 'Page identity' },
      { key: 'content', label: 'HTML Content', sub: 'Training page source' },
      { key: 'operations', label: 'Publishing', sub: 'Audience and workflow' },
      { key: 'audit', label: 'Audit Trail', sub: 'References and history' },
    ]
  }

  if (entityName.includes('document')) {
    return [
      { key: 'overview', label: 'Document Profile', sub: 'File identity and links' },
      { key: 'risk', label: 'Access Control', sub: 'Visibility and expiry' },
      { key: 'audit', label: 'Revision History', sub: 'Version governance' },
    ]
  }

  if (entityName.includes('diligence')) {
    return [
      { key: 'overview', label: 'Task Profile', sub: 'Work item details' },
      { key: 'operations', label: 'Evidence & Signoff', sub: 'Proof and approvals' },
      { key: 'risk', label: 'Risk Control', sub: 'Priority and blockers' },
      { key: 'audit', label: 'Audit Trail', sub: 'Ownership and dates' },
    ]
  }

  return [
    { key: 'overview', label: 'Overview', sub: 'Core identification' },
    { key: 'finance', label: 'Finance', sub: 'Amounts and terms' },
    { key: 'risk', label: 'Risk & Compliance', sub: 'Checks and controls' },
    { key: 'operations', label: 'Operations', sub: 'Tasks, notes, documents' },
    { key: 'audit', label: 'Audit Trail', sub: 'References and history' },
  ]
}
function EntityForm({ entity, record, locked, update, updateData, data, tab }: { entity: EntityKey; record: AnyRecord; locked: boolean; update: (k: string, v: any) => void; updateData: (k: string, v: any) => void; data: AnyRecord; tab: string }) {
  if (entity === 'investors') return <InvestorForm record={record} locked={locked} update={update} updateData={updateData} tab={tab} />
  if (entity === 'opportunities') return <OpportunityForm record={record} locked={locked} update={update} updateData={updateData} tab={tab} />
  if (entity === 'commitments') return <CommitmentForm record={record} locked={locked} update={update} updateData={updateData} data={data} tab={tab} />
  if (entity === 'payments') return <PaymentForm record={record} locked={locked} update={update} updateData={updateData} data={data} tab={tab} />
  if (entity === 'diligence') return <DiligenceForm record={record} locked={locked} update={update} updateData={updateData} data={data} tab={tab} />
  if (entity === 'trainings') return <TrainingForm record={record} locked={locked} update={update} updateData={updateData} data={data} tab={tab} />
  if (entity === 'documents') return <DocumentForm record={record} locked={locked} update={update} updateData={updateData} data={data} tab={tab} />
  return <NotesForm record={record} locked={locked} update={update} updateData={updateData} data={data} tab={tab} />
}
function Field({ label, value, onChange, locked, type = 'text', wide, placeholder }: { label: string; value: any; onChange: (v: any) => void; locked: boolean; type?: string; wide?: boolean; placeholder?: string }) { return <label className={wide ? 'span2' : ''}><span>{label}</span><input type={type} disabled={locked} value={value || ''} placeholder={placeholder} onChange={(e) => onChange(type === 'number' ? Number(e.target.value || 0) : e.target.value)} /></label> }
function SelectField({ label, value, onChange, locked, options, wide }: { label: string; value: any; onChange: (v: any) => void; locked: boolean; options: [string, string][]; wide?: boolean }) { return <label className={wide ? 'span2' : ''}><span>{label}</span><select disabled={locked} value={value || ''} onChange={(e) => onChange(e.target.value)}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label> }
function TextArea({ label, value, onChange, locked, wide = true, placeholder }: { label: string; value: any; onChange: (v: any) => void; locked: boolean; wide?: boolean; placeholder?: string }) { return <label className={wide ? 'span2' : ''}><span>{label}</span><textarea disabled={locked} value={value || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></label> }
function SmartList({ label, value, onChange, locked, placeholder }: { label: string; value: any[]; onChange: (v: any[]) => void; locked: boolean; placeholder: string }) { const rows = Array.isArray(value) ? value : []; return <div className="smart-list span2"><div className="smart-list-head"><b>{label}</b>{!locked && <button onClick={() => onChange([...rows, ''])}>+ Add row</button>}</div>{rows.map((row, i) => <div key={`${label}-${i}`} className="smart-row"><input disabled={locked} value={String(row || '')} placeholder={placeholder} onChange={(e) => onChange(rows.map((x, ix) => ix === i ? e.target.value : x))} />{!locked && <button onClick={() => onChange(rows.filter((_, ix) => ix !== i))}>×</button>}</div>)}{!rows.length && <p className="muted">No rows added yet.</p>}</div> }

function InvestorForm({ record, locked, update, updateData, tab }: any) {
  const d = dataOf(record)
  const contacts = Array.isArray(d.contacts) ? d.contacts : []
  const links = Array.isArray(d.links) ? d.links : []
  const communications = Array.isArray(d.communications) ? d.communications : []

  return (
    <FormShell>
      {tab === 'communication' && (
        <InvestorCommunicationLifecycle
          investor={record}
          contacts={contacts}
          communications={communications}
          locked={locked}
          onChange={(v: AnyRecord[]) => updateData('communications', v)}
        />
      )}


      {tab === 'overview' && (
        <>
          <Field label="Investor name" value={record.investor_name} onChange={(v) => update('investor_name', v)} locked={locked} />
          <SelectField label="Investor type" value={record.investor_type} onChange={(v) => update('investor_type', v)} locked={locked} options={[['individual','Individual'],['family_office','Family Office'],['institution','Institution'],['strategic_partner','Strategic Partner'],['fund','Fund'],['corporate','Corporate']]} />
          <SelectField label="Stage" value={record.stage} onChange={(v) => update('stage', v)} locked={locked} options={[['prospect','Prospect'],['contacted','Contacted'],['nda','NDA'],['data_room','Data Room'],['negotiation','Negotiation'],['soft_commit','Soft Commit'],['closed','Closed']]} />
          <SelectField label="Priority" value={record.priority} onChange={(v) => update('priority', v)} locked={locked} options={[['low','Low'],['normal','Normal'],['high','High'],['critical','Critical']]} />
          <Field label="Country" value={record.country} onChange={(v) => update('country', v)} locked={locked} />
          <Field label="City" value={record.city} onChange={(v) => update('city', v)} locked={locked} />
          <Field label="Relationship owner" value={record.relationship_owner} onChange={(v) => update('relationship_owner', v)} locked={locked} />
          <Field type="datetime-local" label="Next follow-up" value={record.next_followup_at} onChange={(v) => update('next_followup_at', v)} locked={locked} />
          <TextArea label="Investor profile" value={record.investor_profile} onChange={(v) => update('investor_profile', v)} locked={locked} placeholder="Mandate, background, relationship context, strategic appetite…" />
          <InvestorContactDirectory contacts={contacts} locked={locked} onChange={(v: any[]) => updateData('contacts', v)} />
        </>
      )}

      {tab === 'finance' && (
        <>
          <Field type="number" label="Minimum ticket" value={record.ticket_size_min} onChange={(v) => update('ticket_size_min', v)} locked={locked} />
          <Field type="number" label="Maximum ticket" value={record.ticket_size_max} onChange={(v) => update('ticket_size_max', v)} locked={locked} />
          <Field label="Currency" value={record.currency} onChange={(v) => update('currency', v)} locked={locked} />
          <SmartList label="Investment preferences" value={d.investment_preferences || []} onChange={(v) => updateData('investment_preferences', v)} locked={locked} placeholder="Sector, geography, ticket, return expectation…" />
        </>
      )}

      {tab === 'risk' && (
        <>
          <SelectField label="Compliance status" value={record.compliance_status} onChange={(v) => update('compliance_status', v)} locked={locked} options={[['pending','Pending'],['verified','Verified'],['needs_review','Needs review'],['rejected','Rejected']]} />
          <SmartList label="Required documents" value={d.required_documents || []} onChange={(v) => updateData('required_documents', v)} locked={locked} placeholder="KYC, NDA, mandate, bank confirmation…" />
          <SmartList label="Risk flags" value={d.risk_flags || []} onChange={(v) => updateData('risk_flags', v)} locked={locked} placeholder="PEP, sanctions, concentration, jurisdiction…" />
        </>
      )}

      {tab === 'operations' && (
        <>
          <InvestorLinksDirectory links={links} locked={locked} onChange={(v: any[]) => updateData('links', v)} />
          <SmartList label="Communication log" value={d.communication_log || []} onChange={(v) => updateData('communication_log', v)} locked={locked} placeholder="Call note, meeting recap, email follow-up…" />
        </>
      )}

      {tab === 'audit' && <AuditBlock record={record} />}
    </FormShell>
  )
}

function InvestorContactDirectory({ contacts, locked, onChange }: { contacts: AnyRecord[]; locked: boolean; onChange: (v: AnyRecord[]) => void }) {
  const rows = Array.isArray(contacts) ? contacts : []

  function addContact() {
    onChange([...rows, emptyInvestorContact()])
  }

  function updateContact(index: number, key: string, value: any) {
    onChange(rows.map((contact, i) => i === index ? { ...contact, [key]: value, updated_at: new Date().toISOString() } : contact))
  }

  function removeContact(index: number) {
    onChange(rows.filter((_, i) => i !== index))
  }

  return (
    <section className="investor-contact-directory span2">
      <div className="directory-head">
        <div>
          <h3>Investor Contact Directory</h3>
          <p>Manage multiple investor contact persons, direct communication channels, finance/legal contacts, assistants and board representatives.</p>
        </div>
        {!locked && <button type="button" className="primary" onClick={addContact}>+ Add contact person</button>}
      </div>

      <div className="contact-grid">
        {rows.map((contact, index) => (
          <article key={contact.id || index} className={`contact-card contact-${contact.priority || 'secondary'}`}>
            <div className="contact-card-top">
              <div className="contact-avatar">{initials(contact.full_name || contact.email || 'IC')}</div>
              <div>
                <strong>{contact.full_name || 'Unnamed contact'}</strong>
                <span>{contact.title || 'Role not set'}{contact.department ? ` · ${contact.department}` : ''}</span>
              </div>
              <Badge value={contact.priority || 'secondary'} />
            </div>

            {!locked ? (
              <div className="contact-fields">
                <Field label="Full name" value={contact.full_name} locked={locked} onChange={(v) => updateContact(index, 'full_name', v)} />
                <Field label="Role / title" value={contact.title} locked={locked} onChange={(v) => updateContact(index, 'title', v)} />
                <Field label="Department" value={contact.department} locked={locked} onChange={(v) => updateContact(index, 'department', v)} />
                <Field label="Email" value={contact.email} locked={locked} onChange={(v) => updateContact(index, 'email', v)} />
                <Field label="Phone" value={contact.phone} locked={locked} onChange={(v) => updateContact(index, 'phone', v)} />
                <Field label="WhatsApp" value={contact.whatsapp} locked={locked} onChange={(v) => updateContact(index, 'whatsapp', v)} />
                <Field label="Website / link" value={contact.website} locked={locked} onChange={(v) => updateContact(index, 'website', v)} />
                <Field label="LinkedIn / profile" value={contact.linkedin} locked={locked} onChange={(v) => updateContact(index, 'linkedin', v)} />
                <SelectField label="Preferred channel" value={contact.preferred_channel || 'email'} locked={locked} onChange={(v) => updateContact(index, 'preferred_channel', v)} options={[['email','Email'],['phone','Phone'],['whatsapp','WhatsApp'],['website','Website'],['linkedin','LinkedIn'],['assistant','Assistant']]} />
                <SelectField label="Priority / role" value={contact.priority || 'secondary'} locked={locked} onChange={(v) => updateContact(index, 'priority', v)} options={[['primary','Primary'],['secondary','Secondary'],['finance','Finance'],['legal','Legal'],['board','Board'],['assistant','Assistant'],['other','Other']]} />
                <TextArea label="Contact notes" value={contact.notes} locked={locked} onChange={(v) => updateContact(index, 'notes', v)} placeholder="Context, preferred hours, sensitivities, relationship history…" />
                <button type="button" className="danger-link span2" onClick={() => removeContact(index)}>Remove contact</button>
              </div>
            ) : (
              <div className="contact-view">
                <ContactActions contact={contact} />
                {contact.notes && <p className="contact-notes">{contact.notes}</p>}
              </div>
            )}
          </article>
        ))}

        {!rows.length && (
          <div className="empty contact-empty">
            <strong>No investor contacts added yet.</strong>
            <p>Add primary, finance, legal, board or assistant contacts to make the investor dossier operational.</p>
          </div>
        )}
      </div>
    </section>
  )
}

function ContactActions({ contact }: { contact: AnyRecord }) {
  const email = String(contact.email || '').trim()
  const phone = normalizePhoneUrl(contact.phone)
  const whatsapp = normalizeWhatsappUrl(contact.whatsapp || contact.phone)
  const website = normalizeExternalUrl(contact.website)
  const linkedin = normalizeExternalUrl(contact.linkedin)

  return (
    <div className="contact-actions">
      {email && <a href={`mailto:${email}`}>Email</a>}
      {phone && <a href={phone}>Call</a>}
      {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
      {website && <a href={website} target="_blank" rel="noopener noreferrer">Website</a>}
      {linkedin && <a href={linkedin} target="_blank" rel="noopener noreferrer">Profile</a>}
      {!email && !phone && !whatsapp && !website && !linkedin && <span>No action links yet</span>}
    </div>
  )
}

function InvestorLinksDirectory({ links, locked, onChange }: { links: AnyRecord[]; locked: boolean; onChange: (v: AnyRecord[]) => void }) {
  const rows = Array.isArray(links) ? links : []

  function addLink() {
    onChange([...rows, emptyInvestorLink()])
  }

  function updateLink(index: number, key: string, value: any) {
    onChange(rows.map((link, i) => i === index ? { ...link, [key]: value } : link))
  }

  function removeLink(index: number) {
    onChange(rows.filter((_, i) => i !== index))
  }

  return (
    <section className="investor-contact-directory span2">
      <div className="directory-head">
        <div>
          <h3>Investor Websites & External Links</h3>
          <p>Add one or more websites, data-room links, public profiles, reference pages or investor portals.</p>
        </div>
        {!locked && <button type="button" className="primary" onClick={addLink}>+ Add link</button>}
      </div>

      <div className="link-directory">
        {rows.map((link, index) => {
          const url = normalizeExternalUrl(link.url)
          return (
            <article key={link.id || index} className="link-card">
              {!locked ? (
                <div className="contact-fields">
                  <Field label="Label" value={link.label} locked={locked} onChange={(v) => updateLink(index, 'label', v)} />
                  <Field label="URL" value={link.url} locked={locked} onChange={(v) => updateLink(index, 'url', v)} />
                  <SelectField label="Type" value={link.type || 'website'} locked={locked} onChange={(v) => updateLink(index, 'type', v)} options={[['website','Website'],['linkedin','LinkedIn'],['data_room','Data room'],['profile','Profile'],['news','News'],['other','Other']]} />
                  <Field label="Notes" value={link.notes} locked={locked} onChange={(v) => updateLink(index, 'notes', v)} />
                  <button type="button" className="danger-link span2" onClick={() => removeLink(index)}>Remove link</button>
                </div>
              ) : (
                <div className="link-view">
                  <div>
                    <strong>{link.label || link.type || 'External link'}</strong>
                    <span>{link.notes || url || 'No link note'}</span>
                  </div>
                  {url ? <a href={url} target="_blank" rel="noopener noreferrer">Open link</a> : <span>No URL</span>}
                </div>
              )}
            </article>
          )
        })}

        {!rows.length && (
          <div className="empty contact-empty">
            <strong>No external links added yet.</strong>
            <p>Add websites, LinkedIn profiles, data-room links or public reference pages.</p>
          </div>
        )}
      </div>
    </section>
  )
}



function InvestorCommunicationLifecycle({
  investor,
  contacts,
  communications,
  locked,
  onChange,
}: {
  investor: AnyRecord
  contacts: AnyRecord[]
  communications: AnyRecord[]
  locked: boolean
  onChange: (v: AnyRecord[]) => void
}) {
  const rows = Array.isArray(communications) ? communications : []
  const contactRows = Array.isArray(contacts) ? contacts : []

  function selectedContact(action: AnyRecord) {
    return contactRows.find((contact) => String(contact.id) === String(action.contact_id)) || contactRows[0] || {}
  }

  function addCommunication() {
    onChange([emptyCommunicationAction(contactRows, investor), ...rows])
  }

  function updateCommunication(index: number, key: string, value: any) {
    const next = rows.map((action, i) => {
      if (i !== index) return action

      let updated: AnyRecord = { ...action, [key]: value, updated_at: new Date().toISOString() }

      if (key === 'contact_id') {
        const contact = contactRows.find((item) => String(item.id) === String(value)) || {}
        updated = {
          ...updated,
          contact_name: contact.full_name || contact.email || '',
          contact_email: contact.email || '',
          contact_phone: contact.phone || '',
          contact_whatsapp: contact.whatsapp || '',
          channel: contact.preferred_channel || updated.channel || 'email',
        }
        updated = hydrateCommunicationMessage(updated, investor, contact) as AnyRecord
      }

      if (['type', 'phase', 'channel'].includes(key)) {
        updated = hydrateCommunicationMessage(updated, investor, selectedContact(updated)) as AnyRecord
      }

      return updated
    })

    onChange(next)
  }

  function removeCommunication(index: number) {
    onChange(rows.filter((_, i) => i !== index))
  }

  function addFollowup(index: number) {
    onChange(rows.map((action, i) => i === index ? {
      ...action,
      followups: [...(Array.isArray(action.followups) ? action.followups : []), emptyFollowupAction()],
      updated_at: new Date().toISOString(),
    } : action))
  }

  function updateFollowup(index: number, followupIndex: number, key: string, value: any) {
    onChange(rows.map((action, i) => {
      if (i !== index) return action
      const followups = Array.isArray(action.followups) ? action.followups : []
      return {
        ...action,
        followups: followups.map((followup: AnyRecord, fIndex: number) =>
          fIndex === followupIndex ? { ...followup, [key]: value } : followup
        ),
        updated_at: new Date().toISOString(),
      }
    }))
  }

  function removeFollowup(index: number, followupIndex: number) {
    onChange(rows.map((action, i) => {
      if (i !== index) return action
      const followups = Array.isArray(action.followups) ? action.followups : []
      return {
        ...action,
        followups: followups.filter((_: AnyRecord, fIndex: number) => fIndex !== followupIndex),
        updated_at: new Date().toISOString(),
      }
    }))
  }

  return (
    <section className="communication-lifecycle span2">
      <div className="communication-head">
        <div>
          <h3>Communication Lifecycle</h3>
          <span className="template-count">168 integrated templates</span>
          <p>Plan, generate and track investor communication actions with professional French email, WhatsApp and call scripts.</p>
        </div>
        {!locked && <button type="button" className="primary" onClick={addCommunication}>+ Add communication action</button>}
      </div>

      <div className="communication-board">
        {rows.map((action, index) => {
          const contact = selectedContact(action)
          const email = String(action.contact_email || contact.email || '').trim()
          const phone = normalizePhoneUrl(action.contact_phone || contact.phone)
          const whatsapp = normalizeWhatsappUrl(action.contact_whatsapp || contact.whatsapp || contact.phone)
          const mailto = email ? `mailto:${email}?subject=${encodeURIComponent(action.subject || '')}&body=${encodeURIComponent(action.message || '')}` : ''
          const whatsappMessage = whatsapp ? `${whatsapp}?text=${encodeURIComponent(action.message || '')}` : ''

          return (
            <article key={action.id || index} className={`communication-card communication-${action.status || 'planned'}`}>
              <div className="communication-card-top">
                <div>
                  <strong>{communicationLabel(action.type)}</strong>
                  <span>{phaseLabel(action.phase)} · {action.channel || 'email'} · {action.contact_name || contact.full_name || 'No contact selected'}</span>
                </div>
                <Badge value={action.status || 'planned'} />
              </div>

              {!locked ? (
                <div className="communication-form">
                  <SelectField label="Type" value={action.type || 'investor_intro'} onChange={(v) => updateCommunication(index, 'type', v)} locked={locked} options={[['investor_intro','Introduction'],['follow_up','Follow-up'],['data_room_invite','Data room invite'],['nda_request','NDA request'],['meeting_request','Meeting request'],['soft_commit_request','Soft commitment'],['closing_followup','Closing follow-up'],['reporting_update','Reporting update']]} />
                  <SelectField label="Phase" value={action.phase || investor.stage || 'prospect'} onChange={(v) => updateCommunication(index, 'phase', v)} locked={locked} options={[['prospect','Prospect'],['contacted','Contacted'],['nda','NDA'],['data_room','Data Room'],['negotiation','Negotiation'],['soft_commit','Soft Commit'],['closed','Closed']]} />
                  <SelectField label="Mean" value={action.channel || 'email'} onChange={(v) => updateCommunication(index, 'channel', v)} locked={locked} options={[['email','Email'],['whatsapp','WhatsApp'],['call','Call script']]} />
                  <SelectField label="Investor contact" value={action.contact_id || contact.id || ''} onChange={(v) => updateCommunication(index, 'contact_id', v)} locked={locked} options={[
                    ['', 'Select contact'],
                    ...contactRows.map((item): [string, string] => [
                      String(item.id || ''),
                      `${item.full_name || item.email || 'Unnamed'} · ${item.priority || 'contact'}`,
                    ]),
                  ]} />
                  <SelectField label="Action status" value={action.status || 'planned'} onChange={(v) => updateCommunication(index, 'status', v)} locked={locked} options={[['planned','Planned'],['ready','Ready'],['sent','Sent'],['answered','Answered'],['follow_up','Follow-up'],['closed','Closed'],['cancelled','Cancelled']]} />
                  <Field type="datetime-local" label="Scheduled at" value={action.scheduled_at || ''} onChange={(v) => updateCommunication(index, 'scheduled_at', v)} locked={locked} />
                  <Field type="datetime-local" label="Completed at" value={action.completed_at || ''} onChange={(v) => updateCommunication(index, 'completed_at', v)} locked={locked} />
                  <Field label="Owner" value={action.owner || investor.relationship_owner || ''} onChange={(v) => updateCommunication(index, 'owner', v)} locked={locked} />
                  <Field label="Subject / title" value={action.subject || ''} onChange={(v) => updateCommunication(index, 'subject', v)} locked={locked} />
                  <TextArea label="Generated professional French message / email / call script" value={action.message || ''} onChange={(v) => updateCommunication(index, 'message', v)} locked={locked} placeholder="Generated communication content appears here…" />
                  <button type="button" className="danger-link span2" onClick={() => removeCommunication(index)}>Remove communication action</button>
                </div>
              ) : (
                <div className="communication-view">
                  <div className="communication-actions">
                    {mailto && <a href={mailto}>Open Email</a>}
                    {phone && <a href={phone}>Call</a>}
                    {whatsappMessage && <a href={whatsappMessage} target="_blank" rel="noopener noreferrer">Open WhatsApp</a>}
                    <button type="button" onClick={() => navigator.clipboard?.writeText(action.message || '')}>Copy script</button>
                  </div>
                  <div className="script-preview">
                    <b>{action.subject || 'Communication script'}</b>
                    <pre>{action.message || 'No message generated yet.'}</pre>
                  </div>
                </div>
              )}

              <CommunicationFollowups
                action={action}
                locked={locked}
                onAdd={() => addFollowup(index)}
                onUpdate={(followupIndex, key, value) => updateFollowup(index, followupIndex, key, value)}
                onRemove={(followupIndex) => removeFollowup(index, followupIndex)}
              />
            </article>
          )
        })}

        {!rows.length && (
          <div className="empty communication-empty">
            <strong>No communication action added yet.</strong>
            <p>Add an action to generate a professional French message, WhatsApp text or call script according to the selected type, phase and investor contact.</p>
          </div>
        )}
      </div>
    </section>
  )
}

function CommunicationFollowups({ action, locked, onAdd, onUpdate, onRemove }: { action: AnyRecord; locked: boolean; onAdd: () => void; onUpdate: (index: number, key: string, value: any) => void; onRemove: (index: number) => void }) {
  const followups = Array.isArray(action.followups) ? action.followups : []

  return (
    <div className="followup-box">
      <div className="followup-head">
        <b>Follow-up note actions</b>
        {!locked && <button type="button" onClick={onAdd}>+ Add follow-up</button>}
      </div>

      <div className="followup-list">
        {followups.map((followup: AnyRecord, index: number) => (
          <div key={followup.id || index} className="followup-row">
            <SelectField label="Status" value={followup.status || 'open'} locked={locked} onChange={(v) => onUpdate(index, 'status', v)} options={[['open','Open'],['waiting','Waiting'],['done','Done'],['cancelled','Cancelled']]} />
            <Field type="datetime-local" label="Due at" value={followup.due_at || ''} locked={locked} onChange={(v) => onUpdate(index, 'due_at', v)} />
            <Field label="Owner" value={followup.owner || ''} locked={locked} onChange={(v) => onUpdate(index, 'owner', v)} />
            <TextArea label="Follow-up note" value={followup.note || ''} locked={locked} onChange={(v) => onUpdate(index, 'note', v)} placeholder="Next action, investor response, objection, reminder or required document…" />
            {!locked && <button type="button" className="danger-link" onClick={() => onRemove(index)}>Remove</button>}
          </div>
        ))}
        {!followups.length && <p className="muted">No follow-up action yet.</p>}
      </div>
    </div>
  )
}


function OpportunityForm({ record, locked, update, updateData, tab }: any) { const d = dataOf(record); return <FormShell>{tab === 'overview' && <><Field label="Opportunity title" value={record.opportunity_title} onChange={(v) => update('opportunity_title', v)} locked={locked} /><SelectField label="Type" value={record.opportunity_type} onChange={(v) => update('opportunity_type', v)} locked={locked} options={[['fundraise','Fundraise'],['investment','Investment'],['strategic_finance','Strategic Finance'],['debt','Debt'],['equity','Equity']]} /><SelectField label="Stage" value={record.stage} onChange={(v) => update('stage', v)} locked={locked} options={[['screening','Screening'],['diligence','Diligence'],['negotiation','Negotiation'],['soft_commit','Soft Commit'],['closed','Closed'],['lost','Lost']]} /><Field label="Sector" value={record.sector} onChange={(v) => update('sector', v)} locked={locked} /><Field label="Geography" value={record.geography} onChange={(v) => update('geography', v)} locked={locked} /><Field label="Owner" value={record.owner} onChange={(v) => update('owner', v)} locked={locked} /><TextArea label="Investment / fundraising thesis" value={record.thesis} onChange={(v) => update('thesis', v)} locked={locked} /></>}{tab === 'finance' && <><Field type="number" label="Target amount" value={record.target_amount} onChange={(v) => update('target_amount', v)} locked={locked} /><Field type="number" label="Committed amount" value={record.committed_amount} onChange={(v) => update('committed_amount', v)} locked={locked} /><Field type="number" label="Received amount" value={record.received_amount} onChange={(v) => update('received_amount', v)} locked={locked} /><Field type="number" label="Valuation" value={record.valuation} onChange={(v) => update('valuation', v)} locked={locked} /><Field type="number" label="Probability %" value={record.probability} onChange={(v) => update('probability', v)} locked={locked} /><Field type="date" label="Closing date" value={record.closing_date} onChange={(v) => update('closing_date', v)} locked={locked} /><SmartList label="Term sheet points" value={d.terms || []} onChange={(v) => updateData('terms', v)} locked={locked} placeholder="Valuation, governance, preferences, closing conditions…" /></>}{tab === 'risk' && <><SelectField label="Status" value={record.status} onChange={(v) => update('status', v)} locked={locked} options={[['active','Active'],['blocked','Blocked'],['approved','Approved'],['rejected','Rejected'],['closed','Closed']]} /><TextArea label="Risk summary" value={record.risk_summary} onChange={(v) => update('risk_summary', v)} locked={locked} /><SmartList label="Underwriting assumptions" value={d.underwriting_assumptions || []} onChange={(v) => updateData('underwriting_assumptions', v)} locked={locked} placeholder="Assumption, source, sensitivity…" /></>}{tab === 'operations' && <><SelectField label="IC decision" value={d.committee_decision || 'not_submitted'} onChange={(v) => updateData('committee_decision', v)} locked={locked} options={[['not_submitted','Not submitted'],['submitted','Submitted'],['approved','Approved'],['approved_with_conditions','Approved with conditions'],['rejected','Rejected']]} /><SmartList label="Milestones" value={d.milestones || []} onChange={(v) => updateData('milestones', v)} locked={locked} placeholder="Milestone, owner, deadline…" /></>}{tab === 'audit' && <AuditBlock record={record} />}</FormShell> }
function CommitmentForm({ record, locked, update, updateData, data, tab }: any) { const d = dataOf(record); return <FormShell>{tab === 'overview' && <><LinkedSelect label="Investor" value={record.investor_id} rows={data.investors || []} titleKey="investor_name" onChange={(v) => update('investor_id', v)} locked={locked} /><LinkedSelect label="Opportunity" value={record.opportunity_id} rows={data.opportunities || []} titleKey="opportunity_title" onChange={(v) => update('opportunity_id', v)} locked={locked} /><SelectField label="Commitment type" value={record.commitment_type} onChange={(v) => update('commitment_type', v)} locked={locked} options={[['soft_commitment','Soft commitment'],['signed_commitment','Signed commitment'],['capital_call','Capital call'],['closed_commitment','Closed commitment']]} /><SelectField label="Status" value={record.status} onChange={(v) => update('status', v)} locked={locked} options={[['soft_commit','Soft commit'],['signed','Signed'],['committed','Committed'],['closed','Closed'],['cancelled','Cancelled']]} /></>}{tab === 'finance' && <><Field type="number" label="Committed amount" value={record.committed_amount} onChange={(v) => update('committed_amount', v)} locked={locked} /><Field type="number" label="Received amount" value={record.received_amount} onChange={(v) => update('received_amount', v)} locked={locked} /><Field label="Currency" value={record.currency} onChange={(v) => update('currency', v)} locked={locked} /><Field type="date" label="Commitment date" value={record.commitment_date} onChange={(v) => update('commitment_date', v)} locked={locked} /><Field type="date" label="Expected close date" value={record.expected_close_date} onChange={(v) => update('expected_close_date', v)} locked={locked} /><SmartList label="Capital call schedule" value={d.capital_call_schedule || []} onChange={(v) => updateData('capital_call_schedule', v)} locked={locked} placeholder="Date, amount, status…" /></>}{tab === 'risk' && <><SelectField label="Documents status" value={record.documents_status} onChange={(v) => update('documents_status', v)} locked={locked} options={[['pending','Pending'],['partial','Partial'],['complete','Complete'],['rejected','Rejected']]} /><TextArea label="Conditions" value={record.conditions} onChange={(v) => update('conditions', v)} locked={locked} /><SmartList label="Conditions precedent" value={d.conditions_precedent || []} onChange={(v) => updateData('conditions_precedent', v)} locked={locked} placeholder="Condition, owner, evidence…" /></>}{tab === 'operations' && <SmartList label="Signing package" value={d.signing_package || []} onChange={(v) => updateData('signing_package', v)} locked={locked} placeholder="Document, status, link…" />}{tab === 'audit' && <AuditBlock record={record} />}</FormShell> }
function PaymentForm({ record, locked, update, updateData, data, tab }: any) { const d = dataOf(record); return <FormShell>{tab === 'overview' && <><LinkedSelect label="Investor" value={record.investor_id} rows={data.investors || []} titleKey="investor_name" onChange={(v) => update('investor_id', v)} locked={locked} /><LinkedSelect label="Opportunity" value={record.opportunity_id} rows={data.opportunities || []} titleKey="opportunity_title" onChange={(v) => update('opportunity_id', v)} locked={locked} /><LinkedSelect label="Commitment" value={record.commitment_id} rows={data.commitments || []} titleKey="reference_number" onChange={(v) => update('commitment_id', v)} locked={locked} /><SelectField label="Payment type" value={record.payment_type} onChange={(v) => update('payment_type', v)} locked={locked} options={[['capital_receipt','Capital receipt'],['deposit','Deposit'],['subscription','Subscription'],['refund','Refund'],['adjustment','Adjustment']]} /></>}{tab === 'finance' && <><Field type="number" label="Amount" value={record.amount} onChange={(v) => update('amount', v)} locked={locked} /><Field label="Currency" value={record.currency} onChange={(v) => update('currency', v)} locked={locked} /><SelectField label="Status" value={record.status} onChange={(v) => update('status', v)} locked={locked} options={[['pending','Pending'],['paid','Paid'],['rejected','Rejected'],['cancelled','Cancelled']]} /><Field type="date" label="Due date" value={record.due_date} onChange={(v) => update('due_date', v)} locked={locked} /><Field type="date" label="Paid date" value={record.paid_date} onChange={(v) => update('paid_date', v)} locked={locked} /><SelectField label="Payment method" value={record.payment_method} onChange={(v) => update('payment_method', v)} locked={locked} options={[['bank_transfer','Bank transfer'],['cash','Cash'],['cheque','Cheque'],['wire','Wire'],['other','Other']]} /><TextArea label="Payment details" value={record.payment_details} onChange={(v) => update('payment_details', v)} locked={locked} /></>}{tab === 'risk' && <><Field label="Proof URL" value={record.proof_url} onChange={(v) => update('proof_url', v)} locked={locked} /><SelectField label="Bank reconciliation" value={d.bank_reconciliation || 'pending'} onChange={(v) => updateData('bank_reconciliation', v)} locked={locked} options={[['pending','Pending'],['matched','Matched'],['exception','Exception'],['rejected','Rejected']]} /><TextArea label="Finance note" value={record.finance_note} onChange={(v) => update('finance_note', v)} locked={locked} /></>}{tab === 'operations' && <SmartList label="Allocations / audit events" value={d.allocations || []} onChange={(v) => updateData('allocations', v)} locked={locked} placeholder="Allocation, amount, reference…" />}{tab === 'audit' && <AuditBlock record={record} />}</FormShell> }
function DiligenceForm({ record, locked, update, updateData, data, tab }: any) { const d = dataOf(record); return <FormShell>{tab === 'overview' && <><LinkedSelect label="Opportunity" value={record.opportunity_id} rows={data.opportunities || []} titleKey="opportunity_title" onChange={(v) => update('opportunity_id', v)} locked={locked} /><LinkedSelect label="Investor" value={record.investor_id} rows={data.investors || []} titleKey="investor_name" onChange={(v) => update('investor_id', v)} locked={locked} /><Field label="Task title" value={record.task_title} onChange={(v) => update('task_title', v)} locked={locked} /><SelectField label="Category" value={record.category} onChange={(v) => update('category', v)} locked={locked} options={[['finance','Finance'],['legal','Legal'],['commercial','Commercial'],['risk','Risk'],['operations','Operations']]} /><SelectField label="Status" value={record.status} onChange={(v) => update('status', v)} locked={locked} options={[['open','Open'],['in_progress','In progress'],['blocked','Blocked'],['completed','Completed']]} /><Field label="Owner" value={record.owner} onChange={(v) => update('owner', v)} locked={locked} /><Field type="date" label="Due date" value={record.due_date} onChange={(v) => update('due_date', v)} locked={locked} /><TextArea label="Notes" value={record.notes} onChange={(v) => update('notes', v)} locked={locked} /></>}{tab === 'operations' && <><Field label="Evidence URL" value={record.evidence_url} onChange={(v) => update('evidence_url', v)} locked={locked} /><SmartList label="Signoffs" value={d.signoffs || []} onChange={(v) => updateData('signoffs', v)} locked={locked} placeholder="Reviewer, role, decision, date…" /></>}{tab === 'risk' && <><SelectField label="Priority" value={record.priority} onChange={(v) => update('priority', v)} locked={locked} options={[['low','Low'],['normal','Normal'],['high','High'],['critical','Critical']]} /><SmartList label="Blockers" value={d.blockers || []} onChange={(v) => updateData('blockers', v)} locked={locked} placeholder="Blocker, impact, owner…" /><SmartList label="Checklist" value={d.checklist || []} onChange={(v) => updateData('checklist', v)} locked={locked} placeholder="Checklist item…" /></>}{tab === 'audit' && <AuditBlock record={record} />}</FormShell> }
function DocumentForm({ record, locked, update, updateData, data, tab }: any) { const d = dataOf(record); return <FormShell>{tab === 'overview' && <><Field label="Document title" value={record.document_title} onChange={(v) => update('document_title', v)} locked={locked} /><SelectField label="Category" value={record.category} onChange={(v) => update('category', v)} locked={locked} options={[['data_room','Data room'],['kyc','KYC'],['legal','Legal'],['financial','Financial'],['board_pack','Board pack'],['evidence','Evidence']]} /><Field label="File URL" value={record.file_url} onChange={(v) => update('file_url', v)} locked={locked} wide /><LinkedSelect label="Investor" value={record.investor_id} rows={data.investors || []} titleKey="investor_name" onChange={(v) => update('investor_id', v)} locked={locked} /><LinkedSelect label="Opportunity" value={record.opportunity_id} rows={data.opportunities || []} titleKey="opportunity_title" onChange={(v) => update('opportunity_id', v)} locked={locked} /><LinkedSelect label="Commitment" value={record.commitment_id} rows={data.commitments || []} titleKey="reference_number" onChange={(v) => update('commitment_id', v)} locked={locked} /></>}{tab === 'risk' && <><SelectField label="Visibility" value={record.visibility} onChange={(v) => update('visibility', v)} locked={locked} options={[['internal','Internal'],['investor','Investor'],['board','Board'],['restricted','Restricted']]} /><SelectField label="Status" value={record.status} onChange={(v) => update('status', v)} locked={locked} options={[['draft','Draft'],['approved','Approved'],['shared','Shared'],['expired','Expired'],['revoked','Revoked']]} /><Field label="Owner" value={record.owner} onChange={(v) => update('owner', v)} locked={locked} /><Field type="date" label="Expiry date" value={record.expiry_date} onChange={(v) => update('expiry_date', v)} locked={locked} /><SmartList label="Access list" value={d.access_list || []} onChange={(v) => updateData('access_list', v)} locked={locked} placeholder="Investor/user, role, permission…" /></>}{tab === 'audit' && <><Field label="Version" value={record.version} onChange={(v) => update('version', v)} locked={locked} /><SmartList label="Revision notes" value={d.revision_notes || []} onChange={(v) => updateData('revision_notes', v)} locked={locked} placeholder="Version note, author, date…" /><AuditBlock record={record} /></>}</FormShell> }

function TrainingForm({ record, locked, update, updateData, data, tab }: any) {
  const d = dataOf(record)

  return <FormShell>
    {tab === 'overview' && <>
      <Field label="Training title" value={record.training_title} onChange={(v) => update('training_title', v)} locked={locked} wide placeholder="Fundraising onboarding, VC readiness, investor relations…" />
      <Field label="Training source" value={record.training_source} onChange={(v) => update('training_source', v)} locked={locked} placeholder="AngelCare Academy / Capital Command" />
      <SelectField label="Category" value={record.category || 'fundraising_staff'} onChange={(v) => update('category', v)} locked={locked} options={[["fundraising_staff","Fundraising staff"],["investor_relations","Investor relations"],["vc_equity","VC & equity"],["national_funding","National funding programs"],["international_funding","International funding"],["financial_infrastructure","Financial infrastructure"],["partner_programs","Partner programs"],["compliance","Compliance"]]} />
      <SelectField label="Priority" value={record.priority || 'normal'} onChange={(v) => update('priority', v)} locked={locked} options={[["low","Low"],["normal","Normal"],["high","High"],["critical","Critical"]]} />
      <Field label="Owner" value={record.owner} onChange={(v) => update('owner', v)} locked={locked} />
      <Field type="number" label="Duration minutes" value={record.duration_minutes || 360} onChange={(v) => update('duration_minutes', v)} locked={locked} />
      <LinkedSelect label="Linked investor" value={record.investor_id} rows={data.investors || []} titleKey="investor_name" onChange={(v) => update('investor_id', v)} locked={locked} />
      <LinkedSelect label="Linked opportunity" value={record.opportunity_id} rows={data.opportunities || []} titleKey="opportunity_title" onChange={(v) => update('opportunity_id', v)} locked={locked} />
      <TextArea label="Training summary" value={record.summary} onChange={(v) => update('summary', v)} locked={locked} placeholder="Explain what this page teaches and which fundraising staff should use it." />
      <SmartList label="Learning objectives" value={d.learning_objectives || []} onChange={(v) => updateData('learning_objectives', v)} locked={locked} placeholder="Master investor pipeline qualification, build VC data-room logic…" />
    </>}

    {tab === 'content' && <>
      <TextArea label="HTML training page content" value={record.html_content} onChange={(v) => update('html_content', v)} locked={locked} wide placeholder="Paste the complete production HTML page here. This field is saved in Supabase and can be reused for staff training delivery." />
      <SmartList label="Modules / chapters" value={d.modules || []} onChange={(v) => updateData('modules', v)} locked={locked} placeholder="Module title, section objective, assessment point…" />
    </>}

    {tab === 'operations' && <>
      <Field label="Audience" value={record.audience} onChange={(v) => update('audience', v)} locked={locked} placeholder="Fundraising staff, investor relations team, capital command operators…" />
      <SelectField label="Publishing status" value={record.publish_status || record.status || 'draft'} onChange={(v) => { update('publish_status', v); update('status', v) }} locked={locked} options={[["draft","Draft"],["review","In review"],["approved","Approved"],["published","Published"],["archived","Archived"]]} />
      <SmartList label="Staff roles" value={d.staff_roles || []} onChange={(v) => updateData('staff_roles', v)} locked={locked} placeholder="Fundraising analyst, investor relations officer, partnership manager…" />
      <SmartList label="Access rules" value={d.access_rules || []} onChange={(v) => updateData('access_rules', v)} locked={locked} placeholder="Who can view, edit, approve, publish…" />
      <TextArea label="Publishing notes" value={d.publishing_notes || ''} onChange={(v) => updateData('publishing_notes', v)} locked={locked} placeholder="Review requirements, launch note, release conditions, staff assignment logic…" />
    </>}

    {tab === 'audit' && <>
      <Field label="Version" value={d.version || 'v1'} onChange={(v) => updateData('version', v)} locked={locked} />
      <SmartList label="Review history" value={d.review_history || []} onChange={(v) => updateData('review_history', v)} locked={locked} placeholder="Reviewed by, decision, date, changes requested…" />
      <AuditBlock record={record} />
    </>}
  </FormShell>
}

function NotesForm({ record, locked, update, updateData, data, tab }: any) { return <FormShell><LinkedSelect label="Investor" value={record.investor_id} rows={data.investors || []} titleKey="investor_name" onChange={(v) => update('investor_id', v)} locked={locked} /><LinkedSelect label="Opportunity" value={record.opportunity_id} rows={data.opportunities || []} titleKey="opportunity_title" onChange={(v) => update('opportunity_id', v)} locked={locked} /><LinkedSelect label="Commitment" value={record.commitment_id} rows={data.commitments || []} titleKey="reference_number" onChange={(v) => update('commitment_id', v)} locked={locked} /><SelectField label="Category" value={record.category} onChange={(v) => update('category', v)} locked={locked} options={[['general','General'],['investor_call','Investor call'],['board','Board'],['finance','Finance'],['legal','Legal'],['risk','Risk'],['followup','Follow-up']]} /><SelectField label="Priority" value={record.priority} onChange={(v) => update('priority', v)} locked={locked} options={[['low','Low'],['normal','Normal'],['high','High'],['critical','Critical']]} /><Field label="Owner" value={record.owner} onChange={(v) => update('owner', v)} locked={locked} /><Field type="datetime-local" label="Follow-up at" value={record.followup_at} onChange={(v) => update('followup_at', v)} locked={locked} /><TextArea label="Note" value={record.note} onChange={(v) => update('note', v)} locked={locked} /><AuditBlock record={record} /></FormShell> }
function FormShell({ children }: { children: ReactNode }) { return <div className="form-grid premium-form">{children}</div> }
function LinkedSelect({ label, value, rows, titleKey, onChange, locked }: { label: string; value: any; rows: AnyRecord[]; titleKey: string; onChange: (v: any) => void; locked: boolean }) { return <label><span>{label}</span><select disabled={locked} value={value || ''} onChange={(e) => onChange(e.target.value)}><option value="">Select</option>{rows.map((row) => <option key={row.id} value={row.id}>{row[titleKey] || row.reference_number || row.id}</option>)}</select></label> }
function AuditBlock({ record }: { record: AnyRecord }) { return <div className="audit-grid span2"><Priority label="Reference" value={record.reference_number || 'Generated after save'} /><Priority label="Audit code" value={record.audit_code || dataOf(record).audit_code || 'Live audit code pending'} /><Priority label="Created" value={record.created_at || 'Not saved'} /><Priority label="Updated" value={record.updated_at || 'Not saved'} /></div> }
function RecordSummary({ entity, record, data }: { entity: EntityKey; record: AnyRecord; data: AnyRecord }) { return <div className="summary-card"><p className="eyebrow">Record summary</p><h3>{record.investor_name || record.opportunity_title || record.training_title || record.document_title || record.task_title || record.reference_number || ENTITY_META[entity].short}</h3><Badge value={record.stage || record.status || record.priority} /><div className="summary-metrics"><Priority label="Reference" value={record.reference_number || 'Pending'} /><Priority label="Currency" value={record.currency || 'Dhs'} /><Priority label="Amount" value={`${money(record.amount || record.target_amount || record.committed_amount || record.ticket_size_max)} ${record.currency || 'Dhs'}`} /></div></div> }
function ContextActions({ entity, record, setModal, modal }: any) { return <div className="summary-card"><p className="eyebrow">Quick operations</p><button onClick={() => setModal({ ...modal, mode: 'edit' })}>Edit current record</button><button onClick={() => setModal({ ...modal, tab: 'audit' })}>Open audit tab</button><button onClick={() => navigator.clipboard?.writeText(record.reference_number || '')}>Copy reference</button><button onClick={() => window.print()}>Print screen view</button></div> }
function InvestmentDetailPanel({ record, data, onClose, open }: { record: AnyRecord; data: AnyRecord; onClose: () => void; open: any }) { const tasks = (data.diligence || []).filter((x: AnyRecord) => Number(x.opportunity_id) === Number(record.id)); const docs = (data.documents || []).filter((x: AnyRecord) => Number(x.opportunity_id) === Number(record.id)); return <div className="modal-backdrop"><div className="detail-modal"><header><div><p className="eyebrow">Investment opportunity preview</p><h2>{record.opportunity_title}</h2></div><button onClick={onClose}>Close</button></header><div className="detail-grid"><section><h3>Investment Thesis</h3><p>{record.thesis || 'No thesis captured yet.'}</p><h3>Risk Summary</h3><p>{record.risk_summary || 'No risk summary captured yet.'}</p></section><section><h3>Core Metrics</h3><Priority label="Target" value={`${money(record.target_amount)} ${record.currency || 'Dhs'}`} /><Priority label="Valuation" value={`${money(record.valuation)} ${record.currency || 'Dhs'}`} /><Priority label="Probability" value={`${record.probability || 0}%`} /><Priority label="Closing" value={record.closing_date || 'Not set'} /></section><section><h3>Execution Links</h3><Priority label="Diligence tasks" value={tasks.length} /><Priority label="Documents" value={docs.length} /><button onClick={() => open('diligence', { opportunity_id: record.id }, 'create')}>+ Add DD Task</button><button onClick={() => open('documents', { opportunity_id: record.id }, 'create')}>+ Add Document</button></section></div></div></div> }

const css = `
.capital-shell{min-height:calc(100vh - 86px);display:grid;grid-template-columns:306px minmax(0,1fr);background:#eef3f9;color:#0f172a;font-family:Inter,ui-sans-serif,system-ui}.capital-sidebar{position:sticky;top:86px;height:calc(100vh - 86px);overflow:auto;background:#fff;border-right:1px solid #dfe7f1;padding:22px}.brand{display:flex;gap:13px;align-items:center;margin-bottom:22px}.brand-mark{width:58px;height:58px;border-radius:22px;background:linear-gradient(135deg,#173ea5,#7c3aed);color:#fff;display:grid;place-items:center;font-weight:1000;font-size:30px}.brand strong{display:block;font-size:23px;letter-spacing:-.05em}.brand span{font-size:10px;text-transform:uppercase;letter-spacing:.28em;color:#64748b;font-weight:900}.capital-sidebar nav{display:grid;gap:8px}.capital-sidebar button{text-align:left;border:1px solid transparent;background:#fff;border-radius:18px;padding:13px;display:grid;grid-template-columns:32px 1fr;gap:4px 10px;color:#334155;font-weight:900;cursor:pointer}.capital-sidebar button span{grid-row:span 2;width:32px;height:32px;display:grid;place-items:center;border-radius:12px;background:#f1f5f9}.capital-sidebar button small{font-size:11px;color:#94a3b8}.capital-sidebar button.active{background:#eff6ff;border-color:#bfdbfe;color:#1d4ed8}.operator-card{margin-top:22px;border:1px solid #e2e8f0;border-radius:26px;padding:18px;background:linear-gradient(180deg,#f8fafc,#fff)}.operator-card b,.operator-card span,.operator-card small{display:block}.operator-card span{color:#16a34a;font-weight:900;margin-top:6px}.operator-card small{color:#64748b;margin-top:8px;line-height:1.5}.capital-main{min-width:0;padding:24px}.capital-topbar{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:18px}.eyebrow{margin:0 0 7px;color:#2563eb;text-transform:uppercase;font-size:11px;letter-spacing:.22em;font-weight:1000}.capital-topbar h1{font-size:40px;line-height:1;margin:0;letter-spacing:-.065em}.sub{margin:10px 0 0;color:#64748b;font-weight:750;max-width:820px}.top-actions,.hero-actions,.row-actions,.report-actions{display:flex;gap:10px;flex-wrap:wrap}button,.buttonlike{border:1px solid #dbe4ef;background:#fff;border-radius:14px;padding:10px 14px;font-weight:950;color:#0f172a;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}button.primary,.primary{background:#2563eb!important;color:#fff!important;border-color:#2563eb!important}.purple{background:#7c3aed!important;border-color:#7c3aed!important}.green{background:#16a34a!important;border-color:#16a34a!important}.orange{background:#ea580c!important;border-color:#ea580c!important}.kpi-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:14px;margin-bottom:16px}.kpi{background:#fff;border:1px solid #e2e8f0;border-radius:26px;padding:17px;box-shadow:0 16px 40px rgba(15,23,42,.045)}.kpi span{width:40px;height:40px;border-radius:15px;display:grid;place-items:center;background:#eff6ff;color:#1d4ed8}.kpi p{font-size:12px;color:#64748b;font-weight:900;margin:12px 0 4px}.kpi strong{font-size:22px;letter-spacing:-.04em}.kpi small{display:block;margin-top:5px;color:#94a3b8;font-weight:800}.workspace-toolbar{display:grid;grid-template-columns:1fr 220px;gap:12px;margin-bottom:16px}.workspace-toolbar input,.workspace-toolbar select,input,select,textarea{border:1px solid #dbe4ef;background:#fff;border-radius:16px;padding:12px 14px;font-weight:800;color:#0f172a;outline:none}.section-stack{display:grid;gap:16px}.section-title{display:flex;justify-content:space-between;align-items:center;background:#fff;border:1px solid #e2e8f0;border-radius:26px;padding:18px 20px}.section-title h2{margin:0;font-size:26px;letter-spacing:-.055em}.section-title p{margin:7px 0 0;color:#64748b;font-weight:700}.command-grid{display:grid;grid-template-columns:1.35fr .75fr;gap:16px}.stack-panels{display:grid;gap:16px}.hero-panel,.panel{background:#fff;border:1px solid #e2e8f0;border-radius:28px;padding:22px;box-shadow:0 18px 45px rgba(15,23,42,.045)}.hero-panel{background:radial-gradient(circle at top right,#8b5cf6,transparent 32%),linear-gradient(135deg,#0f2f68,#1d4ed8 58%,#7c3aed);color:#fff;min-height:300px;display:flex;align-items:end}.hero-panel .eyebrow,.hero-panel p{color:#dbeafe}.hero-panel h2{font-size:39px;letter-spacing:-.065em;max-width:710px}.progress{height:10px;background:rgba(255,255,255,.22);border-radius:999px;overflow:hidden;margin:20px 0}.progress.light{background:#e2e8f0;margin:7px 0}.progress i{display:block;height:100%;background:#fff;border-radius:999px}.progress.light i{background:#2563eb}.triple-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.priority{display:flex;justify-content:space-between;align-items:center;border:1px solid #e2e8f0;border-radius:16px;padding:13px;margin-top:10px}.priority span{color:#64748b;font-weight:850}.cards-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.investor-card,.deal-card,.deal-room-card,.doc-card{background:#fff;border:1px solid #e2e8f0;border-radius:26px;padding:18px}.premium-card{box-shadow:0 18px 42px rgba(15,23,42,.055)}.card-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.avatar{height:48px;width:48px;border-radius:18px;background:#dbeafe;color:#1d4ed8;display:grid;place-items:center;font-weight:1000}.investor-card p,.deal-card p,.deal-room-card p,.doc-card p{color:#64748b;font-weight:700;line-height:1.5}.card-meta{display:flex;gap:8px;flex-wrap:wrap}.card-meta span{background:#f1f5f9;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:900;color:#475569}.money-row{margin:14px 0;padding:13px;border-radius:16px;background:#f8fafc}.money-row small{display:block;color:#64748b}.badge{display:inline-flex;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:1000;text-transform:capitalize}.badge.green{background:#dcfce7!important;color:#15803d!important}.badge.blue{background:#dbeafe!important;color:#1d4ed8!important}.badge.red{background:#fee2e2!important;color:#b91c1c!important}.badge.orange{background:#ffedd5!important;color:#c2410c!important}.badge.slate{background:#f1f5f9!important;color:#475569!important}.kanban{display:grid;grid-template-columns:repeat(5,minmax(235px,1fr));gap:12px;overflow:auto}.lane{background:#f8fafc;border:1px solid #e2e8f0;border-radius:26px;padding:14px;min-height:390px}.lane h3{text-transform:capitalize;margin:0 0 12px}.lane article{background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:14px;margin-bottom:12px;cursor:pointer}.lane-empty{border:1px dashed #cbd5e1;border-radius:16px;padding:18px;text-align:center;color:#94a3b8;font-weight:900}.deal-room-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.deal-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:15px 0}.deal-metrics span{background:#f8fafc;border-radius:16px;padding:12px}.deal-metrics b,.deal-metrics small{display:block}.deal-metrics small{color:#64748b}.risk-text{background:#fff7ed;border:1px solid #fed7aa;border-radius:16px;padding:12px}.dd-grid{display:grid;grid-template-columns:repeat(5,minmax(190px,1fr));gap:12px}.dd-column{border:1px solid #e2e8f0;border-radius:24px;background:#f8fafc;padding:14px}.dd-column article{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:13px;margin-bottom:10px}.enterprise-table{background:#fff;border:1px solid #e2e8f0;border-radius:24px;overflow:auto}.enterprise-table table{width:100%;border-collapse:collapse}.enterprise-table th,.enterprise-table td{text-align:left;border-bottom:1px solid #edf2f7;padding:13px;font-size:13px}.enterprise-table th{background:#f8fafc;font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#64748b}.empty{background:#fff;border:1px dashed #cbd5e1;border-radius:24px;padding:36px;text-align:center;color:#64748b}.empty strong{display:block;color:#0f172a;font-size:20px}.report-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.report-grid section{background:#fff;border:1px solid #e2e8f0;border-radius:24px;padding:24px}.timeline-list{display:grid;gap:10px}.timeline-list article{display:flex;gap:10px;align-items:center;border:1px solid #e2e8f0;border-radius:16px;padding:10px}.timeline-list article span{width:34px;height:34px;border-radius:13px;background:#eff6ff;color:#1d4ed8;display:grid;place-items:center;font-weight:1000}.timeline-list article b,.timeline-list article small{display:block}.timeline-list article small{color:#64748b}.modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.52);z-index:10000;padding:24px;overflow:auto;backdrop-filter:blur(8px)}.capital-modal,.detail-modal{max-width:1780px;margin:auto;background:#fff;border-radius:34px;overflow:hidden;box-shadow:0 40px 120px rgba(15,23,42,.35)}.modal-header-premium{display:flex;justify-content:space-between;gap:16px;padding:22px 26px;border-bottom:1px solid #e2e8f0;border-top:8px solid #2563eb}.modal-title-block{display:flex;gap:16px}.modal-icon{width:58px;height:58px;border-radius:22px;color:#fff;display:grid;place-items:center;font-size:26px;font-weight:1000}.capital-modal h2,.detail-modal h2{margin:0;font-size:29px;letter-spacing:-.055em}.modal-actions{display:flex;gap:10px;align-items:flex-start}.modal-command-layout{display:grid;grid-template-columns:250px minmax(0,1fr) 340px;gap:18px;padding:22px;background:#f8fafc}.modal-tabs{display:grid;gap:9px;height:max-content}.modal-tabs button{text-align:left;border-radius:18px}.modal-tabs button.active{background:#eff6ff;border-color:#bfdbfe;color:#1d4ed8}.modal-tabs button b,.modal-tabs button small{display:block}.modal-tabs button small{color:#64748b}.modal-audit-card,.summary-card{background:#fff;border:1px solid #e2e8f0;border-radius:24px;padding:18px}.modal-audit-card span,.modal-audit-card small{display:block}.modal-audit-card span{color:#2563eb;font-weight:1000;margin-top:8px}.modal-audit-card small{color:#64748b;margin-top:8px;line-height:1.5}.modal-workspace{min-width:0}.modal-right{display:grid;gap:14px;height:max-content}.summary-card{display:grid;gap:10px}.summary-card h3{font-size:22px;margin:0;letter-spacing:-.04em}.summary-metrics{display:grid;gap:3px}.premium-form{background:#fff;border:1px solid #e2e8f0;border-radius:28px;padding:20px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.premium-form label{display:grid;gap:7px}.premium-form label span{font-size:12px;font-weight:950;color:#475569}.premium-form .span2{grid-column:span 3}.premium-form textarea{min-height:120px}.smart-list{border:1px solid #e2e8f0;border-radius:22px;background:#f8fafc;padding:14px}.smart-list-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.smart-row{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:8px}.muted{color:#94a3b8;font-weight:800}.audit-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.mini-progress-label{display:flex;justify-content:space-between;color:#64748b;font-size:12px;font-weight:900}.detail-grid{display:grid;grid-template-columns:1.2fr .75fr .9fr;gap:16px;padding:22px;background:#f8fafc}.detail-grid section{background:#fff;border:1px solid #e2e8f0;border-radius:24px;padding:20px}@media(max-width:1300px){.capital-shell{grid-template-columns:1fr}.capital-sidebar{position:relative;top:0;height:auto}.kpi-grid,.cards-grid,.command-grid,.deal-room-grid,.report-grid,.detail-grid,.triple-grid{grid-template-columns:1fr}.premium-form{grid-template-columns:1fr}.premium-form .span2{grid-column:auto}.modal-command-layout{grid-template-columns:1fr}.kanban,.dd-grid{grid-template-columns:1fr}.workspace-toolbar{grid-template-columns:1fr}}


.investor-contact-directory{grid-column:1/-1;border:1px solid #dbeafe;background:linear-gradient(135deg,#eff6ff,#ffffff);border-radius:30px;padding:22px;margin-top:6px}
.directory-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:18px}
.directory-head h3{font-size:18px;font-weight:950;color:#0f172a;margin:0}
.directory-head p{font-size:12px;font-weight:700;color:#64748b;margin:5px 0 0;max-width:760px}
.contact-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:16px}
.contact-card,.link-card{border:1px solid #e2e8f0;background:#fff;border-radius:26px;padding:18px;box-shadow:0 18px 45px rgba(15,23,42,.07)}
.contact-card-top{display:flex;align-items:center;gap:13px;margin-bottom:14px}
.contact-card-top strong{display:block;font-size:15px;font-weight:950;color:#0f172a}
.contact-card-top span{display:block;font-size:12px;font-weight:700;color:#64748b;margin-top:2px}
.contact-avatar{width:46px;height:46px;border-radius:18px;display:grid;place-items:center;background:#dbeafe;color:#1d4ed8;font-weight:950}
.contact-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.contact-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:8px}
.contact-actions a,.contact-actions span,.link-view a,.link-view span{border:1px solid #dbeafe;background:#eff6ff;color:#1d4ed8;border-radius:999px;padding:9px 12px;font-size:12px;font-weight:900;text-decoration:none}
.contact-notes{margin-top:12px;border-radius:18px;background:#f8fafc;padding:12px;font-size:12px;font-weight:700;color:#475569}
.danger-link{border:0;background:#fee2e2;color:#b91c1c;border-radius:16px;padding:10px 12px;font-weight:950;cursor:pointer}
.contact-primary{border-color:#bfdbfe}
.contact-finance{border-color:#bbf7d0}
.contact-legal{border-color:#fed7aa}
.contact-board{border-color:#ddd6fe}
.contact-empty{grid-column:1/-1}
.link-directory{display:grid;gap:12px}
.link-view{display:flex;justify-content:space-between;gap:14px;align-items:center}
.link-view strong{display:block;font-weight:950;color:#0f172a}
.link-view span{display:block;font-size:12px;font-weight:700;color:#64748b;margin-top:3px;background:transparent;border:0;padding:0}


.template-count{display:inline-flex;margin-top:8px;border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8;border-radius:999px;padding:7px 10px;font-size:11px;font-weight:950}


.communication-lifecycle{grid-column:1/-1;border:1px solid #dbeafe;background:linear-gradient(135deg,#eff6ff,#ffffff);border-radius:30px;padding:22px;margin-top:6px}
.communication-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:18px}
.communication-head h3{font-size:18px;font-weight:950;color:#0f172a;margin:0}
.communication-head p{font-size:12px;font-weight:700;color:#64748b;margin:5px 0 0;max-width:820px}
.template-count{display:inline-flex;margin-top:8px;border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8;border-radius:999px;padding:7px 10px;font-size:11px;font-weight:950}
.communication-board{display:grid;gap:14px}
.communication-card{border:1px solid #e2e8f0;background:#fff;border-radius:26px;padding:18px;box-shadow:0 18px 45px rgba(15,23,42,.07)}
.communication-card-top{display:flex;align-items:center;justify-content:space-between;gap:13px;margin-bottom:14px}
.communication-card-top strong{display:block;font-size:15px;font-weight:950;color:#0f172a}
.communication-card-top span{display:block;font-size:12px;font-weight:700;color:#64748b;margin-top:2px}
.communication-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.communication-form textarea{min-height:220px}
.communication-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:8px}
.communication-actions a,.communication-actions button{border:1px solid #dbeafe;background:#eff6ff;color:#1d4ed8;border-radius:999px;padding:9px 12px;font-size:12px;font-weight:900;text-decoration:none}
.script-preview{margin-top:14px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:22px;padding:16px}
.script-preview b{display:block;margin-bottom:10px;color:#0f172a}
.script-preview pre{white-space:pre-wrap;font-family:inherit;font-size:13px;line-height:1.55;color:#334155;margin:0}
.followup-box{margin-top:16px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:22px;padding:14px}
.followup-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.followup-row{display:grid;grid-template-columns:160px 200px 180px 1fr auto;gap:10px;align-items:end;margin-top:10px;padding:12px;background:#fff;border-radius:18px;border:1px solid #e2e8f0}
.communication-empty{grid-column:1/-1}
.communication-planned{border-color:#bfdbfe}.communication-ready{border-color:#ddd6fe}.communication-sent{border-color:#bbf7d0}.communication-answered{border-color:#86efac}.communication-follow_up{border-color:#fed7aa}

`
