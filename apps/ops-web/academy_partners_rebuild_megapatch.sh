#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${1:-$HOME/Desktop/angelcare-opsos-app}"
cd "$APP_ROOT"

TARGET="app/(protected)/academy/partners/page.tsx"
BACKUP_DIR=".angelcare_backups/academy-partners-rebuild-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -f "$TARGET" ]; then
  cp "$TARGET" "$BACKUP_DIR/page.tsx.bak"
fi

cat > "$TARGET" <<'TSX'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { CSSProperties, ReactNode } from 'react'

import AcademyShell from '../_components/AcademyShell'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type AnyRow = Record<string, any>
type SearchParams = Record<string, string | string[] | undefined>

type PageProps = {
  searchParams?: Promise<SearchParams> | SearchParams
}

const STAGES = ['Prospecting', 'Qualified', 'Negotiation', 'Contracting', 'Active', 'Expansion', 'At-Risk']

function s(value: unknown, fallback = 'N/A') {
  const out = String(value ?? '').trim()
  return out || fallback
}

function n(value: unknown) {
  const num = Number(value || 0)
  return Number.isFinite(num) ? num : 0
}

function money(value: unknown) {
  return `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(n(value))} MAD`
}

function date(value: unknown) {
  const raw = String(value || '').trim()
  if (!raw) return 'N/A'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
}

function initials(name: unknown) {
  return s(name, 'AC').split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'AC'
}

function param(params: SearchParams, key: string, fallback = '') {
  const value = params[key]
  return Array.isArray(value) ? String(value[0] || fallback) : String(value || fallback)
}

async function readTable(supabase: any, table: string, limit = 500) {
  try {
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(limit)
    if (error) return []
    return data || []
  } catch {
    return []
  }
}

async function tryInsert(supabase: any, table: string, payload: AnyRow) {
  const { error } = await supabase.from(table).insert(payload)
  if (error) throw new Error(error.message)
}

export async function createPartnerAction(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const payload = {
    name: s(formData.get('name'), ''),
    type: s(formData.get('type'), 'employer'),
    city: s(formData.get('city'), 'Morocco'),
    contact_name: s(formData.get('contact_name'), ''),
    phone: s(formData.get('phone'), ''),
    email: s(formData.get('email'), ''),
    status: s(formData.get('status'), 'prospect'),
    notes: s(formData.get('notes'), ''),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (!payload.name) redirect('/academy/partners?modal=new-partner&error=missing_name')
  await tryInsert(supabase, 'academy_partners', payload)
  revalidatePath('/academy/partners')
  redirect('/academy/partners?created=partner')
}

export async function updatePartnerAction(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const id = s(formData.get('partner_id'), '')
  if (!id) redirect('/academy/partners')

  const payload = {
    name: s(formData.get('name'), ''),
    type: s(formData.get('type'), 'employer'),
    city: s(formData.get('city'), 'Morocco'),
    contact_name: s(formData.get('contact_name'), ''),
    phone: s(formData.get('phone'), ''),
    email: s(formData.get('email'), ''),
    status: s(formData.get('status'), 'active'),
    notes: s(formData.get('notes'), ''),
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('academy_partners').update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/academy/partners')
  redirect(`/academy/partners?partner=${encodeURIComponent(id)}`)
}

export async function deletePartnerAction(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const id = s(formData.get('partner_id'), '')
  if (!id) redirect('/academy/partners')
  const { error } = await supabase.from('academy_partners').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/academy/partners')
  redirect('/academy/partners?deleted=partner')
}

export async function createPartnerNoteAction(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const partnerId = s(formData.get('partner_id'), '')
  const title = s(formData.get('title'), 'Partner follow-up')
  const notes = s(formData.get('notes'), '')
  if (!partnerId || !notes) redirect('/academy/partners')

  const activityPayload = {
    partner_id: partnerId,
    title,
    notes,
    status: s(formData.get('status'), 'scheduled'),
    owner_name: s(formData.get('owner_name'), 'Academy Team'),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  try {
    await supabase.from('academy_partner_activities').insert(activityPayload)
  } catch {
    const partner = await supabase.from('academy_partners').select('notes').eq('id', partnerId).maybeSingle()
    const oldNotes = s(partner.data?.notes, '')
    await supabase.from('academy_partners').update({ notes: `${oldNotes}\n\n[${new Date().toISOString()}] ${title}: ${notes}`.trim(), updated_at: new Date().toISOString() }).eq('id', partnerId)
  }

  revalidatePath('/academy/partners')
  redirect(`/academy/partners?partner=${encodeURIComponent(partnerId)}`)
}

function partnerStage(row: AnyRow) {
  const raw = s(row.status, 'prospecting').toLowerCase()
  if (raw.includes('risk') || raw.includes('paused') || raw.includes('blocked')) return 'At-Risk'
  if (raw.includes('expansion') || raw.includes('upsell')) return 'Expansion'
  if (raw.includes('active')) return 'Active'
  if (raw.includes('contract')) return 'Contracting'
  if (raw.includes('negotiation')) return 'Negotiation'
  if (raw.includes('qualified')) return 'Qualified'
  return 'Prospecting'
}

function toneForStatus(value: unknown): 'blue' | 'green' | 'orange' | 'rose' | 'purple' | 'cyan' | 'slate' {
  const raw = s(value, '').toLowerCase()
  if (raw.includes('active') || raw.includes('excellent') || raw.includes('good')) return 'green'
  if (raw.includes('risk') || raw.includes('blocked') || raw.includes('late')) return 'rose'
  if (raw.includes('contract') || raw.includes('pending') || raw.includes('negotiation')) return 'orange'
  if (raw.includes('qualified') || raw.includes('opportunity')) return 'purple'
  if (raw.includes('expansion')) return 'cyan'
  if (raw.includes('prospect')) return 'blue'
  return 'slate'
}

function stageColor(stage: string) {
  return {
    Prospecting: '#2563eb',
    Qualified: '#7c3aed',
    Negotiation: '#f97316',
    Contracting: '#eab308',
    Active: '#16a34a',
    Expansion: '#0891b2',
    'At-Risk': '#e11d48',
  }[stage] || '#64748b'
}

export default async function PartnersPage({ searchParams }: PageProps) {
  const params = await Promise.resolve(searchParams || {})
  const supabase = await createClient()

  const [partnersRaw, trainees, placementCases, payments, enrollments, activitiesRaw] = await Promise.all([
    readTable(supabase, 'academy_partners', 700),
    readTable(supabase, 'academy_trainees', 700),
    readTable(supabase, 'academy_placement_cases', 700),
    readTable(supabase, 'academy_payments', 700),
    readTable(supabase, 'academy_enrollments', 700),
    readTable(supabase, 'academy_partner_activities', 300),
  ])

  const q = param(params, 'q').toLowerCase()
  const statusFilter = param(params, 'status', 'all')
  const typeFilter = param(params, 'type', 'all')
  const cityFilter = param(params, 'city', 'all')
  const selectedId = param(params, 'partner')
  const modal = param(params, 'modal')

  const partners = partnersRaw.filter((row) => {
    const hay = `${row.name} ${row.type} ${row.city} ${row.contact_name} ${row.email} ${row.phone} ${row.status}`.toLowerCase()
    const statusOk = statusFilter === 'all' || s(row.status).toLowerCase() === statusFilter.toLowerCase()
    const typeOk = typeFilter === 'all' || s(row.type).toLowerCase() === typeFilter.toLowerCase()
    const cityOk = cityFilter === 'all' || s(row.city).toLowerCase() === cityFilter.toLowerCase()
    return (!q || hay.includes(q)) && statusOk && typeOk && cityOk
  })

  const selectedPartner = partners.find((p) => String(p.id) === selectedId) || partners[0] || null
  const partnerTypes = Array.from(new Set(partnersRaw.map((p) => s(p.type, '')).filter(Boolean)))
  const cities = Array.from(new Set(partnersRaw.map((p) => s(p.city, '')).filter(Boolean)))
  const statuses = Array.from(new Set(partnersRaw.map((p) => s(p.status, '')).filter(Boolean)))

  const activePartners = partnersRaw.filter((p) => s(p.status).toLowerCase().includes('active')).length
  const atRiskPartners = partnersRaw.filter((p) => partnerStage(p) === 'At-Risk').length
  const totalRevenue = payments.reduce((sum, p) => sum + n(p.amount || p.amount_mad || p.paid_amount), 0)
  const partnerLinkedTrainees = (partner: AnyRow) => placementCases.filter((c) => String(c.partner_id || '') === String(partner.id || '')).length
  const opportunities = placementCases.length
  const openMeetings = activitiesRaw.length
  const contracts = partnersRaw.filter((p) => ['contracting', 'active', 'expansion'].includes(partnerStage(p).toLowerCase())).length
  const slaHealth = partnersRaw.length ? Math.max(78, Math.round(((partnersRaw.length - atRiskPartners) / partnersRaw.length) * 100)) : 100

  return (
    <AcademyShell title="Partners & Employers" subtitle="B2B partner lifecycle, employer relationships, placement dispatch, contracts, and revenue execution.">
      <div style={pageWrap}>
        <HeaderBar params={params} partnerTypes={partnerTypes} cities={cities} statuses={statuses} />

        <div style={kpiGrid}>
          <Kpi icon="🏢" label="Active Partners" value={activePartners} sub="live academy_partners" tone="blue" />
          <Kpi icon="🤝" label="Employer Accounts" value={partnersRaw.length} sub="partners & employers" tone="purple" />
          <Kpi icon="🎯" label="Placement Opportunities" value={opportunities} sub="academy_placement_cases" tone="orange" />
          <Kpi icon="📅" label="Open Meetings" value={openMeetings} sub="follow-ups & activity" tone="purple" />
          <Kpi icon="📄" label="Contracts in Progress" value={contracts} sub="active contract lanes" tone="orange" />
          <Kpi icon="💵" label="Monthly Revenue Impact" value={money(totalRevenue)} sub="academy_payments total" tone="green" />
          <Kpi icon="⚠️" label="At-Risk Partners" value={atRiskPartners} sub="needs attention" tone="rose" />
          <Kpi icon="🛡️" label="SLA Health" value={`${slaHealth}%`} sub="partner health index" tone="cyan" />
        </div>

        <div style={mainGrid}>
          <Panel title="1. Partner Directory" action={`${partners.length} partners`} style={{ gridColumn: 'span 5' }}>
            <PartnerDirectory partners={partners} selectedPartner={selectedPartner} placementCases={placementCases} />
          </Panel>

          <Panel title="2. Partnership Pipeline" action={`${opportunities || partners.length} signals`} style={{ gridColumn: 'span 7' }}>
            <PipelineBoard partners={partners} />
          </Panel>

          <Panel title="3. Upcoming Meetings / Follow-ups" action="View Calendar" style={{ gridColumn: 'span 4' }}>
            <MeetingsPanel partners={partners} activities={activitiesRaw} />
          </Panel>

          <Panel title="4. Placement Dispatch & Candidate Matching" action="This Month" style={{ gridColumn: 'span 3' }}>
            <DispatchPanel trainees={trainees} cases={placementCases} />
          </Panel>

          <Panel title="5. Revenue & Contracts Overview" action="MAD" style={{ gridColumn: 'span 3' }}>
            <RevenuePanel payments={payments} partners={partnersRaw} />
          </Panel>

          <div style={{ gridColumn: 'span 2' }}>
            <PartnerSnapshot partner={selectedPartner} placementCases={placementCases} payments={payments} />
          </div>

          <Panel title="6. Tasks / Action Queue" action="operations" style={{ gridColumn: 'span 4' }}>
            <TasksPanel partners={partners} />
          </Panel>

          <Panel title="7. Recent Activity" action="live" style={{ gridColumn: 'span 4' }}>
            <ActivityPanel partners={partners} activities={activitiesRaw} />
          </Panel>

          <Panel title="8. Alerts & Notifications" action="review" style={{ gridColumn: 'span 4' }}>
            <AlertsPanel partners={partners} atRiskPartners={atRiskPartners} contracts={contracts} />
          </Panel>
        </div>

        {modal === 'new-partner' ? <NewPartnerModal /> : null}
        {modal === 'edit-partner' && selectedPartner ? <EditPartnerModal partner={selectedPartner} /> : null}
        {modal === 'new-note' && selectedPartner ? <PartnerNoteModal partner={selectedPartner} /> : null}
      </div>
    </AcademyShell>
  )
}

function HeaderBar({ params, partnerTypes, cities, statuses }: { params: SearchParams; partnerTypes: string[]; cities: string[]; statuses: string[] }) {
  return (
    <section style={headerCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, letterSpacing: '-.06em', color: '#0f172a' }}>Partners & Employers Command Center</h1>
          <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 14, fontWeight: 850 }}>B2B partner lifecycle, employer relationships, placement dispatch, contracts, and revenue execution.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/academy/partners?modal=new-partner" style={primaryBtn}>+ New Partner</Link>
          <Link href="/academy/job-placement?modal=new-placement" style={purpleBtn}>+ New Opportunity</Link>
          <Link href="/academy/partners?modal=new-note" style={lightBtn}>📅 Schedule Meeting</Link>
          <Link href="/academy/reports?scope=partners" style={lightBtn}>⇩ Export</Link>
        </div>
      </div>

      <form action="/academy/partners" style={filterGrid}>
        <input name="q" defaultValue={param(params, 'q')} placeholder="Search partners, employers, contacts..." style={{ ...input, gridColumn: 'span 3' }} />
        <select name="type" defaultValue={param(params, 'type', 'all')} style={input}>
          <option value="all">Partner Type</option>
          {partnerTypes.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select name="status" defaultValue={param(params, 'status', 'all')} style={input}>
          <option value="all">Status</option>
          {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select name="city" defaultValue={param(params, 'city', 'all')} style={input}>
          <option value="all">City</option>
          {cities.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <button style={filterBtn}>Filters</button>
        <Link href="/academy/partners" style={saveViewBtn}>Save View</Link>
      </form>
    </section>
  )
}

function PartnerDirectory({ partners, selectedPartner, placementCases }: { partners: AnyRow[]; selectedPartner: AnyRow | null; placementCases: AnyRow[] }) {
  const rows = partners.slice(0, 6)
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={tableStyle}>
        <thead>
          <tr>{['Partner / Employer', 'Type', 'City', 'Owner', 'Status', 'Health', 'Linked Trainees', 'Open Ops'].map((h) => <th key={h} style={th}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const selected = selectedPartner && String(selectedPartner.id) === String(p.id)
            const linked = placementCases.filter((c) => String(c.partner_id || '') === String(p.id)).length
            return (
              <tr key={p.id || p.name} style={{ background: selected ? '#eff6ff' : '#fff' }}>
                <td style={td}><Link href={`/academy/partners?partner=${encodeURIComponent(String(p.id || ''))}`} style={nameLink}><Avatar name={p.name} /> {s(p.name)}</Link></td>
                <td style={td}>{s(p.type)}</td>
                <td style={td}>{s(p.city)}</td>
                <td style={td}><MiniAvatar name={p.contact_name || p.owner || p.name} /> {s(p.contact_name || p.owner)}</td>
                <td style={td}><Pill tone={toneForStatus(p.status)}>{s(p.status, 'prospect')}</Pill></td>
                <td style={td}><Pill tone={linked > 4 ? 'green' : linked ? 'blue' : 'orange'}>{linked > 4 ? 'Excellent' : linked ? 'Good' : 'New'}</Pill></td>
                <td style={td}>{linked}</td>
                <td style={td}>{placementCases.filter((c) => String(c.partner_id || '') === String(p.id) && !s(c.status).toLowerCase().includes('placed')).length}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {!rows.length ? <EmptyState title="No partners found" text="Create your first partner to activate the B2B employment and placement network." href="/academy/partners?modal=new-partner" label="Create partner" /> : null}
    </div>
  )
}

function PipelineBoard({ partners }: { partners: AnyRow[] }) {
  return (
    <div style={pipelineGrid}>
      {STAGES.map((stage) => {
        const color = stageColor(stage)
        const items = partners.filter((p) => partnerStage(p) === stage)
        return (
          <div key={stage} style={{ ...stageCol, borderColor: `${color}28`, background: `linear-gradient(180deg,${color}10,#fff)` }}>
            <div style={stageHead}><strong style={{ color }}>{stage}</strong><span>{items.length}</span></div>
            <div style={{ display: 'grid', gap: 8 }}>
              {items.slice(0, 3).map((p) => (
                <Link key={p.id || p.name} href={`/academy/partners?partner=${encodeURIComponent(String(p.id || ''))}`} style={pipeCard}>
                  <strong>{s(p.name)}</strong>
                  <small>{s(p.type)} · {s(p.city)}</small>
                  <span>{money(n(p.revenue_impact || p.contract_value || 0))}</span>
                </Link>
              ))}
              {items.length > 3 ? <Link href={`/academy/partners?stage=${encodeURIComponent(stage)}`} style={{ color, fontSize: 11, fontWeight: 950, textDecoration: 'none' }}>+ {items.length - 3} more</Link> : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MeetingsPanel({ partners, activities }: { partners: AnyRow[]; activities: AnyRow[] }) {
  const rows = activities.length ? activities.slice(0, 5) : partners.slice(0, 5).map((p, i) => ({ partner_id: p.id, title: ['Contract renewal discussion', 'Placement needs review', 'Expansion opportunity', 'Partnership proposal', 'Introduction meeting'][i] || 'Partner follow-up', owner_name: p.contact_name, status: i % 2 ? 'scheduled' : 'confirmed', created_at: p.updated_at || p.created_at, partner_name: p.name }))
  return <div style={{ display: 'grid', gap: 10 }}>{rows.map((row, i) => <InfoRow key={i} left={date(row.created_at)} title={s(row.partner_name || row.name || row.partner || row.title)} sub={s(row.title || row.notes)} right={<Pill tone={toneForStatus(row.status)}>{s(row.status, 'scheduled')}</Pill>} />)}</div>
}

function DispatchPanel({ trainees, cases }: { trainees: AnyRow[]; cases: AnyRow[] }) {
  const matched = cases.filter((c) => ['matched', 'interviewing', 'placed', 'offer_stage'].some((s1) => s(c.status).toLowerCase().includes(s1))).length
  const inProgress = cases.filter((c) => !s(c.status).toLowerCase().includes('placed')).length
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={miniStats}><Metric label="Total Demands" value={cases.length} /><Metric label="Matched" value={matched} /><Metric label="In Progress" value={inProgress} /><Metric label="Trainees" value={trainees.length} /></div>
      {['Caregivers', 'Childcare Workers', 'Nursing Assistants', 'Administrative Staff'].map((label, i) => <Progress key={label} label={label} value={Math.max(12, Math.min(96, matched * 10 + i * 13))} />)}
      <Link href="/academy/job-placement" style={inlineLink}>View placement center →</Link>
    </div>
  )
}

function RevenuePanel({ payments, partners }: { payments: AnyRow[]; partners: AnyRow[] }) {
  const total = payments.reduce((sum, p) => sum + n(p.amount || p.amount_mad || p.paid_amount), 0)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'center' }}>
      <div><small style={mutedCaps}>Revenue Impact</small><strong style={{ display: 'block', fontSize: 27, marginTop: 8 }}>{money(total)}</strong><Sparkline /></div>
      <div style={donutWrap}><div style={donut}><span>{money(total).replace(' MAD','')}</span><small>MAD</small></div><Legend label="Active Contracts" value={partners.filter((p) => partnerStage(p) === 'Active').length} color="#16a34a" /><Legend label="Expansion" value={partners.filter((p) => partnerStage(p) === 'Expansion').length} color="#0891b2" /><Legend label="At-Risk" value={partners.filter((p) => partnerStage(p) === 'At-Risk').length} color="#e11d48" /></div>
    </div>
  )
}

function PartnerSnapshot({ partner, placementCases, payments }: { partner: AnyRow | null; placementCases: AnyRow[]; payments: AnyRow[] }) {
  if (!partner) return <Panel title="Partner Snapshot"><EmptyState title="No partner selected" text="Select a partner from the directory to view the operational snapshot." /></Panel>
  const linked = placementCases.filter((c) => String(c.partner_id || '') === String(partner.id || '')).length
  const score = Math.min(100, 72 + linked * 4)
  return (
    <div style={snapshotCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><div><Avatar name={partner.name} large /><h3 style={{ margin: '12px 0 4px' }}>{s(partner.name)}</h3><p style={{ margin: 0, color: '#64748b', fontWeight: 800 }}>{s(partner.type)} · {s(partner.city)}</p></div><Link href={`/academy/partners?partner=${partner.id}&modal=edit-partner`} style={inlineLink}>Edit</Link></div>
      <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
        <InfoLine label="Account Owner" value={s(partner.contact_name || partner.owner)} />
        <InfoLine label="Since" value={date(partner.created_at)} />
        <div style={healthBox}><small>Account Health Score</small><strong>{score}<span>/100</span></strong><Pill tone={score > 85 ? 'green' : score > 70 ? 'blue' : 'orange'}>{score > 85 ? 'Excellent' : score > 70 ? 'Good' : 'Watchlist'}</Pill><Sparkline /></div>
        <InfoLine label="Linked Trainees" value={String(linked)} />
        <InfoLine label="Open Opportunities" value={String(placementCases.filter((c) => String(c.partner_id || '') === String(partner.id || '') && !s(c.status).toLowerCase().includes('placed')).length)} />
        <InfoLine label="Revenue Signal" value={money(payments.reduce((sum, p) => sum + n(p.amount || p.amount_mad), 0))} />
        <Link href={`/academy/partners/${partner.id}`} style={fullBtn}>View Full Profile →</Link>
        <Link href={`/academy/partners?partner=${partner.id}&modal=new-note`} style={lightBtn}>Add follow-up</Link>
      </div>
    </div>
  )
}

function TasksPanel({ partners }: { partners: AnyRow[] }) {
  const tasks = partners.slice(0, 5).map((p, i) => ({ title: ['Follow up on proposal', 'Send updated SLA', 'Prepare contract draft', 'Collect documents', 'Review performance'][i] || 'Partner action', partner: p.name, priority: ['High', 'Medium', 'High', 'Low', 'Medium'][i] }))
  return <div style={{ display: 'grid', gap: 10 }}>{tasks.map((t, i) => <InfoRow key={i} title={`${t.title} · ${s(t.partner)}`} sub={`Due ${i ? 'Tomorrow' : 'Today'}`} right={<Pill tone={t.priority === 'High' ? 'rose' : t.priority === 'Medium' ? 'orange' : 'green'}>{t.priority}</Pill>} />)}</div>
}

function ActivityPanel({ partners, activities }: { partners: AnyRow[]; activities: AnyRow[] }) {
  const rows = activities.length ? activities.slice(0, 5) : partners.slice(0, 5)
  return <div style={{ display: 'grid', gap: 10 }}>{rows.map((row, i) => <InfoRow key={i} left="●" title={s(row.title || `Partner updated: ${row.name}`)} sub={s(row.notes || row.type || 'Partner lifecycle event')} right={<small>{date(row.created_at)}</small>} />)}</div>
}

function AlertsPanel({ partners, atRiskPartners, contracts }: { partners: AnyRow[]; atRiskPartners: number; contracts: number }) {
  const alerts = [`${atRiskPartners} partners require risk review`, `${contracts} contract lanes need follow-up`, `${partners.length} partner records in command center`, 'SLA and placement feedback should be reviewed weekly']
  return <div style={{ display: 'grid', gap: 10 }}>{alerts.map((a, i) => <InfoRow key={a} left={['⚠️','📄','🧭','🔔'][i]} title={a} sub="Operational alert" right={<Link href="/academy/partners" style={inlineLink}>Review</Link>} />)}</div>
}

function NewPartnerModal() {
  return <Modal title="Create New Partner" subtitle="Add a school, clinic, family employer, institution, or B2B account."><PartnerForm action={createPartnerAction} /></Modal>
}

function EditPartnerModal({ partner }: { partner: AnyRow }) {
  return <Modal title="Edit Partner" subtitle="Update partner identity, account owner, contact, status and notes."><PartnerForm action={updatePartnerAction} partner={partner} /><form action={deletePartnerAction} style={{ marginTop: 14 }}><input type="hidden" name="partner_id" value={partner.id} /><button style={dangerBtn}>Delete permanently</button></form></Modal>
}

function PartnerNoteModal({ partner }: { partner: AnyRow }) {
  return <Modal title="Schedule Meeting / Follow-up" subtitle={`Create an operational follow-up for ${s(partner.name)}.`}><form action={createPartnerNoteAction} style={{ display: 'grid', gap: 12 }}><input type="hidden" name="partner_id" value={partner.id} /><Field name="title" label="Agenda" defaultValue="Partner follow-up" /><Field name="owner_name" label="Owner" defaultValue={s(partner.contact_name, 'Academy Team')} /><Select name="status" label="Status" options={['scheduled', 'confirmed', 'pending', 'completed']} /><TextArea name="notes" label="Notes" /><button style={primaryBtn}>Save follow-up</button></form></Modal>
}

function PartnerForm({ action, partner }: { action: (formData: FormData) => Promise<void>; partner?: AnyRow }) {
  return (
    <form action={action} style={{ display: 'grid', gap: 12 }}>
      {partner ? <input type="hidden" name="partner_id" value={partner.id} /> : null}
      <Field name="name" label="Partner name" defaultValue={partner?.name} required />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><Select name="type" label="Type" defaultValue={partner?.type} options={['employer', 'school', 'nursery', 'clinic', 'hotel', 'family', 'professional']} /><Select name="status" label="Status" defaultValue={partner?.status} options={['prospect', 'qualified', 'negotiation', 'contracting', 'active', 'expansion', 'at_risk', 'paused']} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><Field name="city" label="City" defaultValue={partner?.city} /><Field name="contact_name" label="Account owner / contact" defaultValue={partner?.contact_name} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><Field name="phone" label="Phone" defaultValue={partner?.phone} /><Field name="email" label="Email" defaultValue={partner?.email} /></div>
      <TextArea name="notes" label="Notes" defaultValue={partner?.notes} />
      <button style={primaryBtn}>{partner ? 'Save partner' : 'Create partner'}</button>
    </form>
  )
}

function Modal({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return <section style={overlay}><div style={modalCard}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}><div><h2 style={{ margin: 0 }}>{title}</h2>{subtitle ? <p style={{ margin: '6px 0 0', color: '#64748b', fontWeight: 800 }}>{subtitle}</p> : null}</div><Link href="/academy/partners" style={closeBtn}>×</Link></div><div style={{ marginTop: 18 }}>{children}</div></div></section>
}

function Field({ label, name, defaultValue, required }: { label: string; name: string; defaultValue?: any; required?: boolean }) { return <label style={fieldLabel}>{label}<input name={name} defaultValue={defaultValue || ''} required={required} style={input} /></label> }
function TextArea({ label, name, defaultValue }: { label: string; name: string; defaultValue?: any }) { return <label style={fieldLabel}>{label}<textarea name={name} defaultValue={defaultValue || ''} rows={5} style={{ ...input, minHeight: 120, paddingTop: 12 }} /></label> }
function Select({ label, name, defaultValue, options }: { label: string; name: string; defaultValue?: any; options: string[] }) { return <label style={fieldLabel}>{label}<select name={name} defaultValue={defaultValue || options[0]} style={input}>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select></label> }

function Kpi({ icon, label, value, sub, tone }: { icon: string; label: string; value: any; sub: string; tone: Tone }) { return <div style={kpiCard}><span style={iconBubble(tone)}>{icon}</span><div><p style={kpiLabel}>{label}</p><strong style={kpiValue}>{value}</strong><small style={kpiSub}>↗ {sub}</small></div></div> }
function Panel({ title, action, children, style }: { title: string; action?: string; children: ReactNode; style?: CSSProperties }) { return <section style={{ ...panel, ...style }}><div style={panelHead}><h3>{title}</h3>{action ? <span>{action}</span> : null}</div>{children}</section> }
type Tone = 'blue' | 'green' | 'orange' | 'rose' | 'purple' | 'cyan' | 'slate'
function Pill({ children, tone = 'slate' }: { children: ReactNode; tone?: Tone }) { const c = toneMap[tone]; return <span style={{ border: `1px solid ${c}30`, background: `${c}12`, color: c, borderRadius: 999, padding: '5px 9px', fontSize: 10, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>{children}</span> }
function Avatar({ name, large }: { name: any; large?: boolean }) { return <span style={{ width: large ? 54 : 26, height: large ? 54 : 26, borderRadius: '50%', display: 'inline-grid', placeItems: 'center', background: '#eef2ff', color: '#355df6', fontSize: large ? 18 : 10, fontWeight: 950, flex: '0 0 auto' }}>{initials(name)}</span> }
function MiniAvatar({ name }: { name: any }) { return <span style={{ display: 'inline-grid', placeItems: 'center', width: 22, height: 22, borderRadius: '50%', background: '#f5f3ff', color: '#7c3aed', fontSize: 9, fontWeight: 950 }}>{initials(name)}</span> }
function EmptyState({ title, text, href, label }: { title: string; text: string; href?: string; label?: string }) { return <div style={emptyBox}><strong>{title}</strong><p>{text}</p>{href ? <Link href={href} style={primaryBtn}>{label || 'Create'}</Link> : null}</div> }
function InfoRow({ left, title, sub, right }: { left?: ReactNode; title: string; sub?: string; right?: ReactNode }) { return <div style={infoRow}>{left ? <span style={rowIcon}>{left}</span> : null}<div style={{ minWidth: 0 }}><strong>{title}</strong>{sub ? <p>{sub}</p> : null}</div><div style={{ marginLeft: 'auto' }}>{right}</div></div> }
function Metric({ label, value }: { label: string; value: any }) { return <div style={metric}><small>{label}</small><strong>{value}</strong></div> }
function Progress({ label, value }: { label: string; value: number }) { return <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 900 }}><span>{label}</span><span>{value}%</span></div><div style={progressTrack}><span style={{ ...progressFill, width: `${Math.min(100, value)}%` }} /></div></div> }
function Legend({ label, value, color }: { label: string; value: any; color: string }) { return <p style={{ margin: '6px 0', fontSize: 11, fontWeight: 850 }}><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 99, background: color, marginRight: 6 }} />{label} · {value}</p> }
function Sparkline() { return <div style={{ display: 'flex', alignItems: 'end', gap: 3, height: 42, marginTop: 12 }}>{[18, 30, 22, 36, 28, 44, 34, 46, 38, 52, 42, 58].map((h, i) => <span key={i} style={{ width: 7, height: h, borderRadius: 8, background: 'linear-gradient(180deg,#60a5fa,#355df6)' }} />)}</div> }
function InfoLine({ label, value }: { label: string; value: string }) { return <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, fontWeight: 900 }}><span style={{ color: '#64748b' }}>{label}</span><strong>{value}</strong></div> }

const toneMap: Record<Tone, string> = { blue: '#2563eb', green: '#16a34a', orange: '#ea580c', rose: '#e11d48', purple: '#7c3aed', cyan: '#0891b2', slate: '#64748b' }
const pageWrap: CSSProperties = { padding: 20, background: '#f6f8fc', minHeight: '100vh', color: '#0f172a' }
const headerCard: CSSProperties = { background: '#fff', border: '1px solid #e5edf7', borderRadius: 24, padding: 18, boxShadow: '0 18px 44px rgba(15,23,42,.06)', marginBottom: 14 }
const filterGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(8,minmax(0,1fr))', gap: 10, marginTop: 18 }
const input: CSSProperties = { minHeight: 44, border: '1px solid #dfe8f5', borderRadius: 14, background: '#fff', padding: '0 13px', color: '#0f172a', fontWeight: 850, outline: 'none', width: '100%', boxSizing: 'border-box' }
const primaryBtn: CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 42, borderRadius: 14, padding: '0 14px', background: '#355df6', color: '#fff', border: '1px solid #355df6', textDecoration: 'none', fontWeight: 950, fontSize: 12, boxShadow: '0 14px 26px rgba(53,93,246,.24)' }
const purpleBtn: CSSProperties = { ...primaryBtn, background: '#7c3aed', borderColor: '#7c3aed', boxShadow: '0 14px 26px rgba(124,58,237,.24)' }
const lightBtn: CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 42, borderRadius: 14, padding: '0 14px', background: '#fff', color: '#0f172a', border: '1px solid #dfe8f5', textDecoration: 'none', fontWeight: 950, fontSize: 12 }
const filterBtn: CSSProperties = { ...lightBtn, cursor: 'pointer' }
const saveViewBtn: CSSProperties = { ...lightBtn, color: '#355df6' }
const kpiGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(8,minmax(135px,1fr))', gap: 12, marginBottom: 14 }
const kpiCard: CSSProperties = { background: '#fff', border: '1px solid #e5edf7', borderRadius: 20, padding: 14, display: 'flex', gap: 12, alignItems: 'center', boxShadow: '0 14px 30px rgba(15,23,42,.045)' }
const kpiLabel: CSSProperties = { margin: 0, color: '#64748b', fontSize: 11, fontWeight: 950 }
const kpiValue: CSSProperties = { display: 'block', fontSize: 24, letterSpacing: '-.05em', marginTop: 3 }
const kpiSub: CSSProperties = { color: '#16a34a', fontWeight: 900 }
const iconBubble = (tone: Tone): CSSProperties => ({ width: 36, height: 36, borderRadius: 14, display: 'grid', placeItems: 'center', background: `${toneMap[tone]}12`, color: toneMap[tone], border: `1px solid ${toneMap[tone]}20` })
const mainGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(12,minmax(0,1fr))', gap: 14 }
const panel: CSSProperties = { background: '#fff', border: '1px solid #e5edf7', borderRadius: 22, padding: 14, boxShadow: '0 16px 38px rgba(15,23,42,.055)', minHeight: 120 }
const panelHead: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12, color: '#64748b', fontSize: 11, fontWeight: 950 }
const tableStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 12 }
const th: CSSProperties = { color: '#64748b', fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #eef2f7' }
const td: CSSProperties = { padding: '11px 8px', borderBottom: '1px solid #f1f5f9', fontWeight: 850, color: '#243145' }
const nameLink: CSSProperties = { color: '#0f172a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 950 }
const pipelineGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(7,minmax(140px,1fr))', gap: 9, overflowX: 'auto' }
const stageCol: CSSProperties = { border: '1px solid #e5edf7', borderRadius: 18, padding: 9, minHeight: 210 }
const stageHead: CSSProperties = { display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 9, fontWeight: 950 }
const pipeCard: CSSProperties = { display: 'grid', gap: 4, padding: 10, background: '#fff', border: '1px solid #eaf0f7', borderRadius: 14, color: '#0f172a', textDecoration: 'none', fontSize: 11, boxShadow: '0 10px 20px rgba(15,23,42,.04)' }
const miniStats: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }
const metric: CSSProperties = { border: '1px solid #e5edf7', borderRadius: 14, padding: 10, background: '#fbfdff' }
const progressTrack: CSSProperties = { height: 8, background: '#eaf0f7', borderRadius: 99, overflow: 'hidden', marginTop: 6 }
const progressFill: CSSProperties = { display: 'block', height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#355df6,#06b6d4)' }
const inlineLink: CSSProperties = { color: '#355df6', textDecoration: 'none', fontSize: 12, fontWeight: 950 }
const donutWrap: CSSProperties = { display: 'grid', gap: 4, justifyItems: 'center' }
const donut: CSSProperties = { width: 112, height: 112, borderRadius: '50%', background: 'conic-gradient(#355df6 0 55%,#7c3aed 55% 78%,#f97316 78% 90%,#16a34a 90% 100%)', display: 'grid', placeItems: 'center', color: '#0f172a', fontWeight: 950, boxShadow: 'inset 0 0 0 26px #fff' }
const snapshotCard: CSSProperties = { ...panel, minHeight: 360, background: 'linear-gradient(180deg,#fff,#f8fbff)' }
const healthBox: CSSProperties = { border: '1px solid #e5edf7', borderRadius: 18, padding: 14, background: '#fff' }
const fullBtn: CSSProperties = { ...primaryBtn, width: '100%' }
const infoRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: 11, border: '1px solid #edf2f7', borderRadius: 14, background: '#fbfdff' }
const rowIcon: CSSProperties = { width: 28, height: 28, borderRadius: 10, display: 'grid', placeItems: 'center', background: '#eef2ff' }
const mutedCaps: CSSProperties = { color: '#64748b', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.08em' }
const emptyBox: CSSProperties = { border: '1px dashed #cbd5e1', borderRadius: 18, padding: 18, color: '#64748b', fontWeight: 850, background: '#f8fafc' }
const overlay: CSSProperties = { position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,.45)', backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center', padding: 24 }
const modalCard: CSSProperties = { width: 'min(760px,94vw)', maxHeight: '88vh', overflow: 'auto', background: '#fff', borderRadius: 26, border: '1px solid #e5edf7', boxShadow: '0 35px 100px rgba(15,23,42,.28)', padding: 24 }
const closeBtn: CSSProperties = { width: 40, height: 40, borderRadius: 14, background: '#f1f5f9', color: '#0f172a', display: 'grid', placeItems: 'center', textDecoration: 'none', fontWeight: 950 }
const fieldLabel: CSSProperties = { display: 'grid', gap: 7, color: '#64748b', fontSize: 11, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.07em' }
const dangerBtn: CSSProperties = { ...primaryBtn, background: '#dc2626', borderColor: '#dc2626', boxShadow: '0 14px 26px rgba(220,38,38,.2)', cursor: 'pointer' }
TSX

echo "✅ Rebuilt $TARGET"
echo "✅ Backup stored in $BACKUP_DIR"
echo ""
echo "Next steps:"
echo "NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false"
echo "rm -rf .next && npm run dev"
