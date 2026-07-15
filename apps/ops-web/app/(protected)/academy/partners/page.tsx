import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { CSSProperties, ReactNode } from 'react'

import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth/requireAccess'

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
  return s(name, 'AC').split(/\s+/).slice(0, 2).map((p: string) => p[0]?.toUpperCase()).join('') || 'AC'
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

export 
async function createPartnerPlacementCaseAction(formData: FormData) {
  'use server'
  await requireAccess('academy.manage')
  const supabase = await createClient()

  const partnerId = s(formData.get('partner_id'), '')
  const partnerName = s(formData.get('partner_name'), 'Partner')
  const role = s(formData.get('preferred_role'), '')
  const city = s(formData.get('target_city'), '')
  const status = s(formData.get('status'), 'employer_outreach')
  const priority = s(formData.get('priority'), 'normal')
  const notes = s(formData.get('notes'), '')

  if (!partnerId) redirect('/academy/partners?error=missing_partner')

  const refCode = `PLC-PARTNER-${Date.now().toString(36).toUpperCase()}`
  const payload: AnyRow = {
    partner_id: partnerId,
    partner_name: partnerName,
    ref_code: refCode,
    preferred_role: role || 'Placement demand',
    target_city: city,
    status,
    priority,
    match_score: Number(formData.get('match_score') || 0),
    advisor_name: s(formData.get('advisor_name'), 'Academy Partner Team'),
    availability: s(formData.get('availability'), 'to_confirm'),
    notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('academy_placement_cases').insert(payload)
  if (error) {
    console.error('[PARTNER_PLACEMENT_CASE_CREATE_FAILED]', error.message)
    redirect(`/academy/partners?partner=${partnerId}&modal=partner-management&error=placement_case_create_failed`)
  }

  revalidatePath('/academy/partners')
  revalidatePath('/academy/job-placement')
  redirect(`/academy/partners?partner=${partnerId}&modal=partner-management&created=placement_case`)
}

async function createPartnerTaskAction(formData: FormData) {
  'use server'
  await requireAccess('academy.manage')
  const supabase = await createClient()

  const partnerId = s(formData.get('partner_id'), '')
  const partnerName = s(formData.get('partner_name'), 'Partner')
  const title = s(formData.get('title'), '')
  if (!partnerId || !title) redirect('/academy/partners?error=missing_partner_task')

  const payload: AnyRow = {
    partner_id: partnerId,
    partner_name: partnerName,
    title,
    action_type: s(formData.get('action_type'), 'task'),
    status: s(formData.get('status'), 'open'),
    priority: s(formData.get('priority'), 'normal'),
    due_date: s(formData.get('due_date'), ''),
    owner: s(formData.get('owner'), 'Academy Partner Team'),
    notes: s(formData.get('notes'), ''),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('academy_partner_activities').insert(payload)
  if (error) {
    console.error('[PARTNER_TASK_CREATE_FAILED]', error.message)
    redirect(`/academy/partners?partner=${partnerId}&modal=partner-management&error=partner_task_create_failed`)
  }

  revalidatePath('/academy/partners')
  redirect(`/academy/partners?partner=${partnerId}&modal=partner-management&created=task`)
}

async function deletePartnerTaskAction(formData: FormData) {
  'use server'
  await requireAccess('academy.manage')
  const supabase = await createClient()

  const partnerId = s(formData.get('partner_id'), '')
  const taskId = s(formData.get('task_id'), '')
  if (!partnerId || !taskId) redirect('/academy/partners?error=missing_partner_task_delete')

  const { error } = await supabase.from('academy_partner_activities').delete().eq('id', taskId)
  if (error) {
    console.error('[PARTNER_TASK_DELETE_FAILED]', error.message)
    redirect(`/academy/partners?partner=${partnerId}&modal=partner-management&error=partner_task_delete_failed`)
  }

  revalidatePath('/academy/partners')
  redirect(`/academy/partners?partner=${partnerId}&modal=partner-management&deleted=task`)
}


async function createPartnerAction(formData: FormData) {
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
    notes: buildPartnerDossierNotes(formData),
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


function buildPartnerDossierNotes(formData: FormData) {
  const baseNotes = s(formData.get('notes'), '')
  const fields = [
    ['Partner legal name', formData.get('legal_name')],
    ['Brand / commercial name', formData.get('brand_name')],
    ['Partner segment', formData.get('segment')],
    ['Partnership stage', formData.get('partnership_stage')],
    ['Priority', formData.get('priority')],
    ['Account owner', formData.get('account_owner')],
    ['Decision maker', formData.get('decision_maker')],
    ['Decision maker role', formData.get('decision_maker_role')],
    ['WhatsApp', formData.get('whatsapp')],
    ['Website', formData.get('website')],
    ['Full address', formData.get('address')],
    ['Neighborhood / zone', formData.get('zone')],
    ['Potential monthly demand', formData.get('monthly_demand')],
    ['Needed profiles', formData.get('needed_profiles')],
    ['Placement urgency', formData.get('placement_urgency')],
    ['Contract type', formData.get('contract_type')],
    ['Revenue potential MAD', formData.get('revenue_potential')],
    ['Billing model', formData.get('billing_model')],
    ['Next meeting date', formData.get('next_meeting_date')],
    ['Next meeting agenda', formData.get('next_meeting_agenda')],
    ['Risk / blockers', formData.get('risk_blockers')],
    ['Internal execution notes', formData.get('execution_notes')],
  ]

  const dossierLines = fields
    .map(([label, value]) => {
      const clean = s(value, '')
      return clean ? `${label}: ${clean}` : ''
    })
    .filter(Boolean)

  return [
    baseNotes ? `GENERAL NOTES:\n${baseNotes}` : '',
    dossierLines.length ? `\nPARTNER DOSSIER DETAILS:\n${dossierLines.join('\n')}` : '',
  ].filter(Boolean).join('\n\n').trim()
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


const academyPartnersSidebarItems = [
  ['⌂', 'Command Center', '/academy'],
  ['👥', 'Trainees', '/academy/trainees'],
  ['▣', 'Enrollments', '/academy/enrollments'],
  ['▦', 'Programs', '/academy/programs'],
  ['▥', 'Cohorts', '/academy/cohorts'],
  ['♙', 'Trainers', '/academy/trainers'],
  ['☑', 'Attendance', '/academy/attendance'],
  ['◎', 'Certificates', '/academy/certificates'],
  ['▤', 'Payments', '/academy/payments'],
  ['♣', 'Partners', '/academy/partners'],
  ['💼', 'Job Placement', '/academy/job-placement'],
  ['⌁', 'Reports', '/academy/reports'],
  ['⚙', 'Automation', '/academy/automation'],
  ['🔗', 'Integrations', '/academy/integrations'],
  ['⚙', 'Settings', '/academy/settings'],
] as const

function AcademyPartnersImageSidebar() {
  return (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: 292,
        zIndex: 60,
        overflowY: 'auto',
        background: '#fff',
        borderRight: '1px solid #e7edf6',
        boxShadow: '18px 0 45px rgba(15,23,42,.06)',
        padding: '30px 18px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 42 }}>
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: 18,
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(135deg,#1d4ed8,#2583ff)',
            color: '#fff',
            fontSize: 29,
            fontWeight: 1000,
            boxShadow: '0 18px 34px rgba(37,99,235,.24)',
          }}
        >
          ✦
        </div>
        <div>
          <strong
            style={{
              display: 'block',
              color: '#1d4ed8',
              fontSize: 24,
              lineHeight: 1,
              letterSpacing: '-.04em',
              fontWeight: 1000,
            }}
          >
            ANGELCARE
          </strong>
          <span
            style={{
              display: 'block',
              marginTop: 9,
              color: '#7282a0',
              fontSize: 18,
              letterSpacing: '.22em',
              fontWeight: 1000,
            }}
          >
            ACADEMY
          </span>
        </div>
      </div>

      <p
        style={{
          margin: '0 0 20px',
          color: '#738097',
          fontSize: 16,
          letterSpacing: '.28em',
          fontWeight: 1000,
        }}
      >
        ACADEMY
      </p>

      <nav style={{ display: 'grid', gap: 7 }}>
        {academyPartnersSidebarItems.map(([icon, label, href]) => {
          const active = label === 'Partners'
          return (
            <Link
              key={label}
              href={href}
              style={{
                display: 'grid',
                gridTemplateColumns: '34px 1fr',
                alignItems: 'center',
                gap: 14,
                minHeight: 56,
                padding: '0 18px',
                borderRadius: 16,
                textDecoration: 'none',
                color: active ? '#fff' : '#172033',
                background: active ? 'linear-gradient(135deg,#1f5cff,#225cff)' : 'transparent',
                boxShadow: active ? '0 18px 34px rgba(37,99,235,.24)' : 'none',
                fontSize: 18,
                fontWeight: 1000,
              }}
            >
              <span style={{ fontSize: 17, textAlign: 'center' }}>{icon}</span>
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      <div
        style={{
          marginTop: 42,
          border: '1px solid #e3eaf5',
          borderRadius: 22,
          padding: 20,
          background: 'linear-gradient(180deg,#ffffff,#f8fbff)',
        }}
      >
        <strong style={{ display: 'block', color: '#172033', fontSize: 17, marginBottom: 12 }}>
          Need Help?
        </strong>
        <p style={{ margin: 0, color: '#7282a0', fontSize: 16, lineHeight: 1.6, fontWeight: 850 }}>
          Visit Academy placement help center
        </p>
      </div>
    </aside>
  )
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

  const partners = partnersRaw.filter((row: AnyRow) => {
    const hay = `${row.name} ${row.type} ${row.city} ${row.contact_name} ${row.email} ${row.phone} ${row.status}`.toLowerCase()
    const statusOk = statusFilter === 'all' || s(row.status).toLowerCase() === statusFilter.toLowerCase()
    const typeOk = typeFilter === 'all' || s(row.type).toLowerCase() === typeFilter.toLowerCase()
    const cityOk = cityFilter === 'all' || s(row.city).toLowerCase() === cityFilter.toLowerCase()
    return (!q || hay.includes(q)) && statusOk && typeOk && cityOk
  })

  const selectedPartner = partners.find((p: AnyRow) => String(p.id) === selectedId) || partners[0] || null
  const modalPartner = partners.find((p: AnyRow) => String(p.id) === s(params.partner || params.id || params.selected, '')) || selectedPartner
  const partnerTypes: string[] = Array.from(new Set(partnersRaw.map((p: AnyRow) => s(p.type, '')).filter(Boolean)))
  const cities: string[] = Array.from(new Set(partnersRaw.map((p: AnyRow) => s(p.city, '')).filter(Boolean)))
  const statuses: string[] = Array.from(new Set(partnersRaw.map((p: AnyRow) => s(p.status, '')).filter(Boolean)))

  const activePartners = partnersRaw.filter((p: AnyRow) => s(p.status).toLowerCase().includes('active')).length
  const atRiskPartners = partnersRaw.filter((p: AnyRow) => partnerStage(p) === 'At-Risk').length
  const totalRevenue = payments.reduce((sum: number, p: AnyRow) => sum + n(p.amount || p.amount_mad || p.paid_amount), 0)
  const partnerLinkedTrainees = (partner: AnyRow) => placementCases.filter((c: AnyRow) => String(c.partner_id || '') === String(partner.id || '')).length
  const opportunities = placementCases.length
  const openMeetings = activitiesRaw.length
  const contracts = partnersRaw.filter((p: AnyRow) => ['contracting', 'active', 'expansion'].includes(partnerStage(p).toLowerCase())).length
  const slaHealth = partnersRaw.length ? Math.max(78, Math.round(((partnersRaw.length - atRiskPartners) / partnersRaw.length) * 100)) : 100

  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: '#f6f8fc', paddingLeft: 292, boxSizing: 'border-box' }}>
      <AcademyPartnersImageSidebar />
      <main
        style={{
          width: 'calc(100vw - 292px)',
          maxWidth: 'none',
          minWidth: 0,
          margin: 0,
          padding: '26px 28px 56px',
          boxSizing: 'border-box',
          overflowX: 'hidden',
        }}
      >

        <section
          data-partners-dashboard-hero
          style={{
            display: 'grid',
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid #e3eaf6',
              borderRadius: 28,
              background: 'linear-gradient(135deg,#ffffff 0%,#eef4ff 58%,#f8fbff 100%)',
              boxShadow: '0 24px 60px rgba(15,23,42,.08)',
              padding: 22,
            }}
          >
            <div
              style={{
                position: 'absolute',
                right: -60,
                top: -70,
                width: 220,
                height: 220,
                borderRadius: '50%',
                background: 'radial-gradient(circle at center, rgba(37,99,235,.16), rgba(37,99,235,0))',
              }}
            />

            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: 0, color: '#64748b', fontSize: 11, fontWeight: 1000, letterSpacing: '.18em' }}>
                  ANGELCARE ACADEMY
                </p>
                <h1 style={{ margin: '8px 0 6px', color: '#0f172a', fontSize: 30, lineHeight: 1, letterSpacing: '-.055em' }}>
                  Partners & Employers Command Center
                </h1>
                <p style={{ margin: 0, color: '#64748b', fontSize: 13, fontWeight: 850 }}>
                  B2B partner lifecycle, employer relationships, placement dispatch, contracts, and revenue execution.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Link href="/academy/partners?modal=new-partner" style={primaryButton}>+ New Partner</Link>
                <Link href="/academy/job-placement?modal=new-placement" style={purpleButton}>+ New Opportunity</Link>
                <Link href="/academy/partners?modal=new-note" style={lightButton}>📅 Schedule Meeting</Link>
                <Link href="/academy/partners?export=partners" style={lightButton}>⇩ Export</Link>
              </div>
            </div>

            <div
              style={{
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: 'minmax(280px,1.7fr) repeat(4,minmax(150px,.7fr))',
                gap: 10,
                marginTop: 18,
              }}
            >
              <input
                name="q"
                defaultValue={String(params.q || '')}
                placeholder="Search partners, employers, contacts..."
                style={filterInput}
              />
              <select name="type" defaultValue={String(params.type || '')} style={filterInput}>
                <option value="">Partner Type</option>
                {partnerTypes.map((item: string) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select name="status" defaultValue={String(params.status || '')} style={filterInput}>
                <option value="">Status</option>
                {statuses.map((item: string) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select name="city" defaultValue={String(params.city || '')} style={filterInput}>
                <option value="">City</option>
                {cities.map((item: string) => <option key={item} value={item}>{item}</option>)}
              </select>
              <Link href="/academy/partners" style={lightButton}>Save View</Link>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8,minmax(138px,1fr))',
              gap: 12,
            }}
          >
            {[
              ['🏢', 'Active Partners', String(activePartners), 'live academy_partners', '#2563eb'],
              ['🤝', 'Employer Accounts', String(partnersRaw.length), 'partners & employers', '#7c3aed'],
              ['📍', 'Placement Opportunities', String(opportunities), 'academy_placement_cases', '#f97316'],
              ['📅', 'Open Meetings', String(openMeetings), 'follow-ups & activity', '#06b6d4'],
              ['📄', 'Contracts in Progress', String(contracts), 'active contract lanes', '#64748b'],
              ['💵', 'Monthly Revenue Impact', money(totalRevenue), 'academy_payments total', '#16a34a'],
              ['⚠️', 'At-Risk Partners', String(atRiskPartners), 'needs attention', '#e11d48'],
              ['🛡️', 'SLA Health', `${slaHealth}%`, 'partner health index', '#0f766e'],
            ].map(([icon, label, value, sub, color]: string[]) => (
              <article
                key={label}
                style={{
                  minHeight: 98,
                  border: '1px solid #e4ebf6',
                  borderRadius: 20,
                  background: '#fff',
                  boxShadow: '0 16px 36px rgba(15,23,42,.055)',
                  padding: 14,
                  display: 'grid',
                  gap: 8,
                }}
              >
                <span style={{ width: 34, height: 34, borderRadius: 12, display: 'grid', placeItems: 'center', background: `${color}12`, color, fontSize: 16 }}>
                  {icon}
                </span>
                <div>
                  <p style={{ margin: 0, color: '#64748b', fontSize: 10, fontWeight: 950 }}>{label}</p>
                  <strong style={{ display: 'block', marginTop: 3, color: '#0f172a', fontSize: 20, letterSpacing: '-.04em' }}>{s(value, 'N/A')}</strong>
                  <small style={{ color: '#16a34a', fontSize: 10, fontWeight: 900 }}>↗ {sub}</small>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,minmax(0,1fr))', gap: 20, alignItems: 'start' }}>
          <Panel title="1. Partner Directory" action={`${partners.length} partners`} style={{ gridColumn: 'span 5', minWidth: 0 }}>
            <PartnerDirectory
              partners={partnersRaw}
              selectedPartner={selectedPartner}
              placementCases={placementCases}
              params={params}
              partnerTypes={partnerTypes}
              cities={cities}
              statuses={statuses}
            />
          </Panel>

          <Panel title="2. Partnership Pipeline" action={`${opportunities || partners.length} signals`} style={{ gridColumn: 'span 7', minWidth: 0, overflow: 'hidden' }}>
            <PipelineBoard partners={partnersRaw} placementCases={placementCases} payments={payments} params={params} partnerTypes={partnerTypes} cities={cities} />
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

        {modal === 'partner-management' && modalPartner ? (
          <PartnerManagementModal
            partner={modalPartner}
            placementCases={placementCases}
            activities={activitiesRaw}
            trainees={trainees}
            payments={payments}
            params={params}
          />
        ) : null}

        {modal === 'new-partner' ? <NewPartnerModal /> : null}
        {modal === 'edit-partner' && modalPartner ? <EditPartnerModal partner={modalPartner} /> : null}
        {modal === 'new-note' && modalPartner ? <PartnerNoteModal partner={modalPartner} /> : null}
      </main>
    </div>
  )
}



const filterInput: CSSProperties = {
  width: '100%',
  minHeight: 42,
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  background: '#fff',
  color: '#0f172a',
  padding: '0 13px',
  fontSize: 12,
  fontWeight: 850,
  outline: 'none',
  boxShadow: '0 10px 22px rgba(15,23,42,.035)',
}


const primaryButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 40,
  padding: '0 14px',
  borderRadius: 14,
  border: '1px solid #2563eb',
  background: 'linear-gradient(135deg,#2563eb,#3b82f6)',
  color: '#fff',
  textDecoration: 'none',
  fontSize: 12,
  fontWeight: 950,
  boxShadow: '0 14px 28px rgba(37,99,235,.22)',
  whiteSpace: 'nowrap',
}

const purpleButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 40,
  padding: '0 14px',
  borderRadius: 14,
  border: '1px solid #7c3aed',
  background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)',
  color: '#fff',
  textDecoration: 'none',
  fontSize: 12,
  fontWeight: 950,
  boxShadow: '0 14px 28px rgba(124,58,237,.22)',
  whiteSpace: 'nowrap',
}

const lightButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 40,
  padding: '0 14px',
  borderRadius: 14,
  border: '1px solid #e2e8f0',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  fontSize: 12,
  fontWeight: 950,
  boxShadow: '0 10px 22px rgba(15,23,42,.045)',
  whiteSpace: 'nowrap',
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
          {partnerTypes.map((item: string) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select name="status" defaultValue={param(params, 'status', 'all')} style={input}>
          <option value="all">Status</option>
          {statuses.map((item: string) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select name="city" defaultValue={param(params, 'city', 'all')} style={input}>
          <option value="all">City</option>
          {cities.map((item: string) => <option key={item} value={item}>{item}</option>)}
        </select>
        <button style={filterBtn}>Filters</button>
        <Link href="/academy/partners" style={saveViewBtn}>Save View</Link>
      </form>
    </section>
  )
}



function PartnerDirectory({
  partners,
  selectedPartner,
  placementCases,
  params,
  partnerTypes,
  cities,
  statuses,
}: {
  partners: AnyRow[]
  selectedPartner: AnyRow | null
  placementCases: AnyRow[]
  params: SearchParams
  partnerTypes: string[]
  cities: string[]
  statuses: string[]
}) {
  const q = s(params.pd_q || '', '').toLowerCase()
  const typeFilter = s(params.pd_type || '', '')
  const cityFilter = s(params.pd_city || '', '')
  const statusFilter = s(params.pd_status || '', '')
  const healthFilter = s(params.pd_health || '', '')
  const opsFilter = s(params.pd_ops || '', '')

  const rows = partners.filter((partner) => {
    const partnerId = s(partner.id, '')
    const linkedCases = placementCases.filter((item) => s(item.partner_id, '') === partnerId)
    const openOps = linkedCases.filter((item) => !['placed', 'completed', 'closed'].includes(s(item.status, '').toLowerCase())).length
    const health = selectedPartner && s(selectedPartner.id, '') === partnerId ? 'selected' : 'live'

    const hay = [
      partner.name,
      partner.type,
      partner.city,
      partner.status,
      partner.owner,
      partner.account_owner,
      partner.contact_name,
      partner.phone,
      partner.email,
      partner.notes,
    ].map((item) => s(item, '').toLowerCase()).join(' ')

    const qOk = !q || hay.includes(q)
    const typeOk = !typeFilter || s(partner.type, '') === typeFilter
    const cityOk = !cityFilter || s(partner.city, '') === cityFilter
    const statusOk = !statusFilter || s(partner.status, '') === statusFilter
    const healthOk = !healthFilter || health === healthFilter
    const opsOk =
      !opsFilter ||
      (opsFilter === 'with_ops' && openOps > 0) ||
      (opsFilter === 'no_ops' && openOps === 0)

    return qOk && typeOk && cityOk && statusOk && healthOk && opsOk
  })

  const activeFilterCount = [q, typeFilter, cityFilter, statusFilter, healthFilter, opsFilter].filter(Boolean).length
  const linkedPartners = rows.filter((partner) => placementCases.some((item) => s(item.partner_id, '') === s(partner.id, ''))).length
  const openOpsTotal = rows.reduce((sum, partner) => {
    const partnerId = s(partner.id, '')
    return sum + placementCases.filter((item) => s(item.partner_id, '') === partnerId && !['placed', 'completed', 'closed'].includes(s(item.status, '').toLowerCase())).length
  }, 0)

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <form
        action="/academy/partners"
        method="get"
        style={{
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #e3eaf6',
          borderRadius: 24,
          background: 'linear-gradient(135deg,#ffffff 0%,#f8fbff 56%,#eef4ff 100%)',
          boxShadow: '0 18px 42px rgba(15,23,42,.055)',
          padding: 16,
          display: 'grid',
          gap: 14,
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -55,
            top: -70,
            width: 190,
            height: 190,
            borderRadius: '50%',
            background: 'radial-gradient(circle at center, rgba(37,99,235,.13), rgba(37,99,235,0))',
          }}
        />

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
              <strong style={{ color: '#0f172a', fontSize: 16, letterSpacing: '-.035em' }}>
                Partner Directory Command Filter
              </strong>
              <span style={directoryFilterBadge}>{rows.length} shown</span>
              <span style={directoryFilterBadge}>{activeFilterCount} active filters</span>
            </div>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 12, fontWeight: 850 }}>
              Search, classify, isolate operational accounts and open partner management dossiers.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/academy/partners" style={lightButton}>Clear</Link>
            <button type="submit" style={{ ...primaryButton, cursor: 'pointer' }}>Apply filters</button>
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: 'minmax(260px,1.4fr) repeat(5,minmax(135px,.8fr))',
            gap: 10,
          }}
        >
          <input
            name="pd_q"
            defaultValue={s(params.pd_q || '', '')}
            placeholder="Search name, phone, city, owner, notes..."
            style={directoryFilterInput}
          />

          <select name="pd_type" defaultValue={typeFilter} style={directoryFilterInput}>
            <option value="">All types</option>
            {partnerTypes.map((item: string) => <option key={item} value={item}>{item}</option>)}
          </select>

          <select name="pd_status" defaultValue={statusFilter} style={directoryFilterInput}>
            <option value="">All statuses</option>
            {statuses.map((item: string) => <option key={item} value={item}>{item}</option>)}
          </select>

          <select name="pd_city" defaultValue={cityFilter} style={directoryFilterInput}>
            <option value="">All cities</option>
            {cities.map((item: string) => <option key={item} value={item}>{item}</option>)}
          </select>

          <select name="pd_health" defaultValue={healthFilter} style={directoryFilterInput}>
            <option value="">All health</option>
            <option value="selected">Selected</option>
            <option value="live">Live</option>
          </select>

          <select name="pd_ops" defaultValue={opsFilter} style={directoryFilterInput}>
            <option value="">All ops</option>
            <option value="with_ops">With open ops</option>
            <option value="no_ops">No open ops</option>
          </select>
        </div>

        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10 }}>
          {[
            ['Filtered partners', String(rows.length), '#2563eb'],
            ['Linked partners', String(linkedPartners), '#16a34a'],
            ['Open operations', String(openOpsTotal), '#f97316'],
            ['Total directory', String(partners.length), '#7c3aed'],
          ].map(([label, value, color]: string[]) => (
            <div
              key={label}
              style={{
                border: '1px solid #e3eaf5',
                borderRadius: 18,
                background: '#ffffffcc',
                padding: 12,
                boxShadow: '0 12px 26px rgba(15,23,42,.035)',
              }}
            >
              <span style={{ display: 'block', color: '#64748b', fontSize: 10, fontWeight: 1000, textTransform: 'uppercase', letterSpacing: '.07em' }}>
                {label}
              </span>
              <strong style={{ display: 'block', marginTop: 5, color, fontSize: 22, letterSpacing: '-.045em' }}>
                {value}
              </strong>
            </div>
          ))}
        </div>
      </form>

      <div
        style={{
          border: '1px solid #e6edf7',
          borderRadius: 24,
          background: '#fff',
          overflow: 'hidden',
          boxShadow: '0 18px 44px rgba(15,23,42,.055)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 1080, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Partner / Employer', 'Type', 'City', 'Owner', 'Status', 'Health', 'Linked Trainees', 'Open Ops'].map((head) => (
                  <th
                    key={head}
                    style={{
                      textAlign: 'left',
                      padding: '14px 16px',
                      color: '#64748b',
                      fontSize: 10,
                      fontWeight: 1000,
                      textTransform: 'uppercase',
                      letterSpacing: '.08em',
                      borderBottom: '1px solid #edf2f7',
                      whiteSpace: 'nowrap',
                      background: '#f8fbff',
                    }}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 30).map((partner) => {
                const partnerId = s(partner.id, '')
                const selected = selectedPartner && s(selectedPartner.id, '') === partnerId
                const linkedCases = placementCases.filter((item) => s(item.partner_id, '') === partnerId)
                const openOps = linkedCases.filter((item) => !['placed', 'completed', 'closed'].includes(s(item.status, '').toLowerCase())).length

                return (
                  <tr key={partnerId || partner.name}>
                    <td colSpan={8} style={{ padding: 0, borderBottom: '1px solid #edf2f7' }}>
                      <Link
                        href={`/academy/partners?partner=${encodeURIComponent(partnerId)}&modal=partner-management`}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1.45fr .7fr 1fr .85fr .7fr .7fr .7fr .7fr',
                          gap: 12,
                          alignItems: 'center',
                          padding: '16px',
                          textDecoration: 'none',
                          color: '#0f172a',
                          background: selected ? '#eff6ff' : '#fff',
                          borderLeft: selected ? '5px solid #2563eb' : '5px solid transparent',
                          transition: 'all .18s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                          <span
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 14,
                              display: 'grid',
                              placeItems: 'center',
                              background: selected ? '#dbeafe' : '#eef4ff',
                              color: '#2563eb',
                              fontSize: 11,
                              fontWeight: 1000,
                            }}
                          >
                            {initials(s(partner.name, 'P'))}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <strong style={{ display: 'block', fontSize: 13, fontWeight: 1000, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {s(partner.name, 'N/A')}
                            </strong>
                            <small style={{ color: '#64748b', fontSize: 11, fontWeight: 850 }}>Open management dossier →</small>
                          </div>
                        </div>

                        <strong style={partnerCellText}>{s(partner.type, 'N/A')}</strong>
                        <strong style={partnerCellText}>{s(partner.city, 'N/A')}</strong>
                        <strong style={partnerCellText}>{s(partner.owner || partner.account_owner || partner.contact_name || partner.phone, 'N/A')}</strong>
                        <span style={partnerStatusPill}>{s(partner.status, 'N/A')}</span>
                        <span style={selected ? partnerSelectedHealthPill : partnerHealthPill}>{selected ? 'SELECTED' : 'LIVE'}</span>
                        <strong style={partnerCellText}>{linkedCases.length}</strong>
                        <strong style={partnerCellText}>{openOps}</strong>
                      </Link>
                    </td>
                  </tr>
                )
              })}

              {!rows.length ? (
                <tr>
                  <td colSpan={8} style={{ padding: 24 }}>
                    <div style={emptyStateBox}>No partners match the current directory filters.</div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const directoryFilterInput: CSSProperties = {
  width: '100%',
  minHeight: 42,
  border: '1px solid #dfe8f5',
  borderRadius: 14,
  background: '#fff',
  color: '#0f172a',
  padding: '0 12px',
  fontSize: 12,
  fontWeight: 850,
  outline: 'none',
  boxShadow: '0 10px 22px rgba(15,23,42,.035)',
}

const directoryFilterBadge: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  border: '1px solid #dbeafe',
  background: '#eff6ff',
  color: '#2563eb',
  padding: '6px 10px',
  fontSize: 10,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '.05em',
}

const partnerCellText: CSSProperties = {
  color: '#334155',
  fontSize: 12,
  fontWeight: 900,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const partnerStatusPill: CSSProperties = {
  display: 'inline-flex',
  justifyContent: 'center',
  borderRadius: 999,
  background: '#f1f5f9',
  border: '1px solid #e2e8f0',
  color: '#475569',
  padding: '6px 9px',
  fontSize: 10,
  fontWeight: 1000,
  textTransform: 'uppercase',
}

const partnerHealthPill: CSSProperties = {
  display: 'inline-flex',
  justifyContent: 'center',
  borderRadius: 999,
  background: '#ecfdf5',
  border: '1px solid #bbf7d0',
  color: '#15803d',
  padding: '6px 9px',
  fontSize: 10,
  fontWeight: 1000,
  textTransform: 'uppercase',
}

const partnerSelectedHealthPill: CSSProperties = {
  ...partnerHealthPill,
  background: '#dbeafe',
  border: '1px solid #bfdbfe',
  color: '#1d4ed8',
}




function pipelinePartnerStage(partner: AnyRow) {
  const explicit = s(
    partner.pipeline_stage ||
    partner.partnership_stage ||
    partner.lifecycle_stage ||
    partner.stage,
    '',
  ).toLowerCase().trim()

  const status = s(partner.status, '').toLowerCase().trim()
  const health = s(partner.health_status || partner.health, '').toLowerCase().trim()
  const notes = s(partner.notes, '').toLowerCase()

  const source = [explicit, status, health, notes].filter(Boolean).join(' ')

  if (/(at[\s-_]?risk|risk|critical|blocked|churn)/.test(source)) return 'At-Risk'
  if (/(expansion|upsell|renewal|growth)/.test(source)) return 'Expansion'
  if (/(active|live|onboarded|signed|running|operational)/.test(source)) return 'Active'
  if (/(contracting|contract|agreement|mou)/.test(source)) return 'Contracting'
  if (/(negotiation|proposal|quotation|quote|review)/.test(source)) return 'Negotiation'
  if (/(qualified|validated|approved|ready)/.test(source)) return 'Qualified'
  if (/(prospecting|prospect|lead|new)/.test(source)) return 'Prospecting'

  return 'Prospecting'
}

function pipelineStagePalette(stage: string) {
  if (stage === 'Prospecting') return { line: '#2563eb', bg: '#eff6ff', soft: '#dbeafe', text: '#1d4ed8' }
  if (stage === 'Qualified') return { line: '#7c3aed', bg: '#f5f3ff', soft: '#ede9fe', text: '#6d28d9' }
  if (stage === 'Negotiation') return { line: '#f97316', bg: '#fff7ed', soft: '#ffedd5', text: '#c2410c' }
  if (stage === 'Contracting') return { line: '#d97706', bg: '#fffbeb', soft: '#fef3c7', text: '#b45309' }
  if (stage === 'Active') return { line: '#16a34a', bg: '#ecfdf5', soft: '#dcfce7', text: '#15803d' }
  if (stage === 'Expansion') return { line: '#0891b2', bg: '#ecfeff', soft: '#cffafe', text: '#0e7490' }
  return { line: '#e11d48', bg: '#fff1f2', soft: '#ffe4e6', text: '#be123c' }
}

function PipelineBoard({
  partners,
  placementCases = [],
  payments = [],
  params,
  partnerTypes = [],
  cities = [],
}: {
  partners: AnyRow[]
  placementCases?: AnyRow[]
  payments?: AnyRow[]
  params: SearchParams
  partnerTypes?: string[]
  cities?: string[]
}) {
  const stages = ['Prospecting', 'Qualified', 'Negotiation', 'Contracting', 'Active', 'Expansion', 'At-Risk']

  const q = s(params.pp_q, '').toLowerCase().trim()
  const stageFilter = s(params.pp_stage, '')
  const typeFilter = s(params.pp_type, '')
  const cityFilter = s(params.pp_city, '')
  const healthFilter = s(params.pp_health, '')

  const partnerHealth = (partner: AnyRow) => {
    const raw = s(partner.health_status || partner.health, '').toLowerCase()
    const stage = pipelinePartnerStage(partner)
    if (raw.includes('risk') || stage === 'At-Risk') return 'at-risk'
    if (raw.includes('good') || raw.includes('healthy') || ['Active', 'Expansion'].includes(stage)) return 'healthy'
    return 'watch'
  }

  const linkedCasesCount = (partner: AnyRow) => {
    const partnerId = s(partner.id, '')
    return placementCases.filter((item) => s(item.partner_id, '') === partnerId).length
  }

  const openOpsCount = (partner: AnyRow) => {
    const partnerId = s(partner.id, '')
    return placementCases.filter((item) => {
      const itemStatus = s(item.status, '').toLowerCase()
      return s(item.partner_id, '') === partnerId && !['placed', 'completed', 'closed', 'cancelled'].includes(itemStatus)
    }).length
  }

  const revenueSignal = (partner: AnyRow) => {
    const partnerId = s(partner.id, '')
    const relatedCaseIds = new Set(
      placementCases
        .filter((item) => s(item.partner_id, '') === partnerId)
        .map((item) => s(item.id, ''))
    )
    const relatedPayments = payments.filter((payment) => {
      const paymentPartner = s(payment.partner_id, '')
      const paymentCase = s(payment.placement_case_id || payment.case_id, '')
      return paymentPartner === partnerId || relatedCaseIds.has(paymentCase)
    })
    return relatedPayments.reduce((sum: number, payment: AnyRow) => sum + n(payment.amount || payment.amount_mad || payment.paid_amount), 0)
  }

  const filteredPartners = partners.filter((partner) => {
    const stage = pipelinePartnerStage(partner)
    const health = partnerHealth(partner)
    const hay = [
      s(partner.name, ''),
      s(partner.type, ''),
      s(partner.city, ''),
      s(partner.phone, ''),
      s(partner.email, ''),
      s(partner.contact_name, ''),
      s(partner.status, ''),
      stage,
      health,
    ].join(' ').toLowerCase()

    const qOk = !q || hay.includes(q)
    const stageOk = !stageFilter || stage === stageFilter
    const typeOk = !typeFilter || s(partner.type, '') === typeFilter
    const cityOk = !cityFilter || s(partner.city, '') === cityFilter
    const healthOk = !healthFilter || health === healthFilter

    return qOk && stageOk && typeOk && cityOk && healthOk
  })

  const totalOpenOps = filteredPartners.reduce((sum, partner) => sum + openOpsCount(partner), 0)
  const totalSignals = filteredPartners.length
  const totalCases = filteredPartners.reduce((sum, partner) => sum + linkedCasesCount(partner), 0)
  const totalRisk = filteredPartners.filter((partner) => partnerHealth(partner) === 'at-risk').length
  const totalLive = filteredPartners.filter((partner) => ['Active', 'Expansion', 'Contracting'].includes(pipelinePartnerStage(partner))).length

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5,minmax(0,1fr))',
          gap: 12,
        }}
      >
        {[
          { label: 'Filtered partners', value: totalSignals, tone: '#2563eb', bg: '#eff6ff' },
          { label: 'Linked placement cases', value: totalCases, tone: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Open operations', value: totalOpenOps, tone: '#f97316', bg: '#fff7ed' },
          { label: 'Live pipeline', value: totalLive, tone: '#16a34a', bg: '#ecfdf5' },
          { label: 'At-risk accounts', value: totalRisk, tone: '#e11d48', bg: '#fff1f2' },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              borderRadius: 18,
              border: '1px solid #e2e8f0',
              background: '#fff',
              padding: 14,
              boxShadow: '0 12px 30px rgba(15,23,42,.05)',
            }}
          >
            <div style={{ color: '#64748b', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.08em' }}>
              {item.label}
            </div>
            <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  borderRadius: 12,
                  background: item.bg,
                  color: item.tone,
                  padding: '7px 10px',
                  fontSize: 24,
                  lineHeight: 1,
                  fontWeight: 1000,
                }}
              >
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      <form
        method="get"
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr repeat(4,minmax(140px,1fr)) auto auto',
          gap: 10,
          alignItems: 'center',
          border: '1px solid #e2e8f0',
          background: '#fff',
          borderRadius: 20,
          padding: 12,
          boxShadow: '0 14px 34px rgba(15,23,42,.045)',
        }}
      >
        <input
          name="pp_q"
          defaultValue={s(params.pp_q, '')}
          placeholder="Search partner, city, owner, contact..."
          style={{
            height: 42,
            borderRadius: 12,
            border: '1px solid #dbe3f0',
            padding: '0 14px',
            fontSize: 13,
            fontWeight: 800,
            color: '#0f172a',
            background: '#f8fbff',
            outline: 'none',
          }}
        />
        <select
          name="pp_stage"
          defaultValue={stageFilter}
          style={{
            height: 42,
            borderRadius: 12,
            border: '1px solid #dbe3f0',
            padding: '0 12px',
            fontSize: 13,
            fontWeight: 800,
            color: '#0f172a',
            background: '#fff',
          }}
        >
          <option value="">All stages</option>
          {stages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
        </select>
        <select
          name="pp_type"
          defaultValue={typeFilter}
          style={{
            height: 42,
            borderRadius: 12,
            border: '1px solid #dbe3f0',
            padding: '0 12px',
            fontSize: 13,
            fontWeight: 800,
            color: '#0f172a',
            background: '#fff',
          }}
        >
          <option value="">All types</option>
          {partnerTypes.map((item: string) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select
          name="pp_city"
          defaultValue={cityFilter}
          style={{
            height: 42,
            borderRadius: 12,
            border: '1px solid #dbe3f0',
            padding: '0 12px',
            fontSize: 13,
            fontWeight: 800,
            color: '#0f172a',
            background: '#fff',
          }}
        >
          <option value="">All cities</option>
          {cities.map((item: string) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select
          name="pp_health"
          defaultValue={healthFilter}
          style={{
            height: 42,
            borderRadius: 12,
            border: '1px solid #dbe3f0',
            padding: '0 12px',
            fontSize: 13,
            fontWeight: 800,
            color: '#0f172a',
            background: '#fff',
          }}
        >
          <option value="">All health</option>
          <option value="healthy">Healthy</option>
          <option value="watch">Watch</option>
          <option value="at-risk">At-risk</option>
        </select>

        <button
          type="submit"
          style={{
            height: 42,
            border: 0,
            borderRadius: 12,
            background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
            color: '#fff',
            padding: '0 16px',
            fontSize: 12,
            fontWeight: 1000,
            cursor: 'pointer',
          }}
        >
          Apply
        </button>

        <Link
          href="/academy/partners"
          style={{
            height: 42,
            borderRadius: 12,
            border: '1px solid #dbe3f0',
            background: '#fff',
            color: '#475569',
            padding: '0 16px',
            fontSize: 12,
            fontWeight: 1000,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Reset
        </Link>
      </form>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7,minmax(210px,1fr))',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 6,
        }}
      >
        {stages.map((stage) => {
          const palette = pipelineStagePalette(stage)
          const rows = filteredPartners.filter((partner) => pipelinePartnerStage(partner) === stage)

          return (
            <section
              key={stage}
              style={{
                minHeight: 340,
                border: `1px solid ${palette.soft}`,
                borderTop: `4px solid ${palette.line}`,
                borderRadius: 24,
                background: `linear-gradient(180deg,${palette.bg} 0%,#ffffff 100%)`,
                padding: 12,
                boxShadow: '0 16px 38px rgba(15,23,42,.055)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <strong style={{ color: palette.text, fontSize: 13, fontWeight: 1000 }}>{stage}</strong>
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    display: 'grid',
                    placeItems: 'center',
                    background: '#fff',
                    border: `1px solid ${palette.soft}`,
                    color: palette.text,
                    fontSize: 11,
                    fontWeight: 1000,
                  }}
                >
                  {rows.length}
                </span>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                {rows.slice(0, 5).map((partner) => {
                  const partnerId = s(partner.id, '')
                  const ops = openOpsCount(partner)
                  const cases = linkedCasesCount(partner)
                  const revenue = revenueSignal(partner)
                  const health = partnerHealth(partner)

                  return (
                    <Link
                      key={partnerId || partner.name}
                      href={`/academy/partners?partner=${encodeURIComponent(partnerId)}&modal=partner-management`}
                      style={{
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'grid',
                        gap: 9,
                        textDecoration: 'none',
                        color: '#0f172a',
                        border: '1px solid #e3eaf5',
                        borderLeft: `5px solid ${palette.line}`,
                        borderRadius: 18,
                        background: '#fff',
                        padding: 13,
                        boxShadow: '0 12px 28px rgba(15,23,42,.06)',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          right: -26,
                          top: -34,
                          width: 96,
                          height: 96,
                          borderRadius: '50%',
                          background: `radial-gradient(circle at center, ${palette.soft}, rgba(255,255,255,0))`,
                        }}
                      />

                      <div style={{ position: 'relative', display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                        <span
                          style={{
                            width: 34,
                            height: 34,
                            flex: '0 0 34px',
                            borderRadius: 13,
                            display: 'grid',
                            placeItems: 'center',
                            background: palette.bg,
                            color: palette.text,
                            fontSize: 11,
                            fontWeight: 1000,
                          }}
                        >
                          {initials(s(partner.name, 'P'))}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <strong
                            style={{
                              display: 'block',
                              fontSize: 13,
                              fontWeight: 1000,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {s(partner.name, 'N/A')}
                          </strong>
                          <small style={{ color: '#64748b', fontSize: 11, fontWeight: 850 }}>
                            {s(partner.type, 'N/A')} · {s(partner.city, 'N/A')}
                          </small>
                        </div>
                      </div>

                      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 7 }}>
                        <span style={{ display: 'grid', gap: 2, border: '1px solid #e8eef7', borderRadius: 13, background: '#f8fbff', padding: 8 }}>
                          <b style={{ fontSize: 15 }}>{cases}</b>
                          <small style={{ color: '#64748b', fontSize: 10, fontWeight: 900 }}>cases</small>
                        </span>
                        <span style={{ display: 'grid', gap: 2, border: '1px solid #e8eef7', borderRadius: 13, background: '#f8fbff', padding: 8 }}>
                          <b style={{ fontSize: 15 }}>{ops}</b>
                          <small style={{ color: '#64748b', fontSize: 10, fontWeight: 900 }}>ops</small>
                        </span>
                        <span style={{ display: 'grid', gap: 2, border: '1px solid #e8eef7', borderRadius: 13, background: '#f8fbff', padding: 8 }}>
                          <b style={{ fontSize: 15 }}>{money(revenue)}</b>
                          <small style={{ color: '#64748b', fontSize: 10, fontWeight: 900 }}>MAD</small>
                        </span>
                      </div>

                      <div style={{ position: 'relative', display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999, border: `1px solid ${palette.soft}`, background: palette.bg, color: palette.text, padding: '5px 8px', fontSize: 10, fontWeight: 1000, textTransform: 'uppercase' }}>
                          open dossier
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', padding: '5px 8px', fontSize: 10, fontWeight: 1000, textTransform: 'uppercase' }}>
                          {health}
                        </span>
                      </div>
                    </Link>
                  )
                })}

                {!rows.length ? (
                  <div
                    style={{
                      border: `1px dashed ${palette.soft}`,
                      borderRadius: 18,
                      background: 'rgba(255,255,255,.68)',
                      padding: 16,
                      color: '#64748b',
                      fontSize: 12,
                      fontWeight: 850,
                      lineHeight: 1.55,
                    }}
                  >
                    No partner currently in {stage}. Adjust partner lifecycle fields || filters to populate this lane.
                  </div>
                ) : null}

                {rows.length > 5 ? (
                  <Link
                    href={`/academy/partners?pp_stage=${encodeURIComponent(stage)}`}
                    style={{
                      color: palette.text,
                      fontSize: 12,
                      fontWeight: 1000,
                      textDecoration: 'none',
                      padding: '5px 2px',
                    }}
                  >
                    + {rows.length - 5} more
                  </Link>
                ) : null}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function MeetingsPanel({ partners, activities }: { partners: AnyRow[]; activities: AnyRow[] }) {
  const rows = activities.length ? activities.slice(0, 5) : partners.slice(0, 5).map((p, i) => ({ partner_id: p.id, title: ['Contract renewal discussion', 'Placement needs review', 'Expansion opportunity', 'Partnership proposal', 'Introduction meeting'][i] || 'Partner follow-up', owner_name: p.contact_name, status: i % 2 ? 'scheduled' : 'confirmed', created_at: p.updated_at || p.created_at, partner_name: p.name }))
  return <div style={{ display: 'grid', gap: 10 }}>{rows.map((row, i) => <InfoRow key={i} left={date(row.created_at)} title={s(row.partner_name || s((row as AnyRow).name || (row as AnyRow).partner || (row as AnyRow).title, 'Activity'))} sub={s(row.title || (row as AnyRow).notes)} right={<Pill tone={toneForStatus(row.status)}>{s(row.status, 'scheduled')}</Pill>} />)}</div>
}

function DispatchPanel({ trainees, cases }: { trainees: AnyRow[]; cases: AnyRow[] }) {
  const matched = cases.filter((c: AnyRow) => ['matched', 'interviewing', 'placed', 'offer_stage'].some((s1) => s(c.status).toLowerCase().includes(s1))).length
  const inProgress = cases.filter((c: AnyRow) => !s(c.status).toLowerCase().includes('placed')).length
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={miniStats}><Metric label="Total Demands" value={cases.length} /><Metric label="Matched" value={matched} /><Metric label="In Progress" value={inProgress} /><Metric label="Trainees" value={trainees.length} /></div>
      {['Caregivers', 'Childcare Workers', 'Nursing Assistants', 'Administrative Staff'].map((label, i) => <Progress key={label} label={label} value={Math.max(12, Math.min(96, matched * 10 + i * 13))} />)}
      <Link href="/academy/job-placement" style={inlineLink}>View placement center →</Link>
    </div>
  )
}

function RevenuePanel({ payments, partners }: { payments: AnyRow[]; partners: AnyRow[] }) {
  const total = payments.reduce((sum: number, p: AnyRow) => sum + n(p.amount || p.amount_mad || p.paid_amount), 0)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(520px,.95fr) minmax(720px,1.35fr)', gap: 14, alignItems: 'center' }}>
      <div><small style={mutedCaps}>Revenue Impact</small><strong style={{ display: 'block', fontSize: 27, marginTop: 8 }}>{money(total)}</strong><Sparkline /></div>
      <div style={donutWrap}><div style={donut}><span>{money(total).replace(' MAD','')}</span><small>MAD</small></div><Legend label="Active Contracts" value={partners.filter((p: AnyRow) => partnerStage(p) === 'Active').length} color="#16a34a" /><Legend label="Expansion" value={partners.filter((p: AnyRow) => partnerStage(p) === 'Expansion').length} color="#0891b2" /><Legend label="At-Risk" value={partners.filter((p: AnyRow) => partnerStage(p) === 'At-Risk').length} color="#e11d48" /></div>
    </div>
  )
}

function PartnerSnapshot({ partner, placementCases, payments }: { partner: AnyRow | null; placementCases: AnyRow[]; payments: AnyRow[] }) {
  if (!partner) return <Panel title="Partner Snapshot"><EmptyState title="No partner selected" text="Select a partner from the directory to view the operational snapshot." /></Panel>
  const linked = placementCases.filter((c: AnyRow) => String(c.partner_id || '') === String(partner.id || '')).length
  const score = Math.min(100, 72 + linked * 4)
  return (
    <div style={snapshotCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><div><Avatar name={partner.name} large /><h3 style={{ margin: '12px 0 4px' }}>{s(partner.name)}</h3><p style={{ margin: 0, color: '#64748b', fontWeight: 800 }}>{s(partner.type)} · {s(partner.city)}</p></div><Link href={`/academy/partners?partner=${partner.id}&modal=edit-partner`} style={inlineLink}>Edit</Link></div>
      <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
        <InfoLine label="Account Owner" value={s(partner.contact_name || partner.owner)} />
        <InfoLine label="Since" value={date(partner.created_at)} />
        <div style={healthBox}><small>Account Health Score</small><strong>{score}<span>/100</span></strong><Pill tone={score > 85 ? 'green' : score > 70 ? 'blue' : 'orange'}>{score > 85 ? 'Excellent' : score > 70 ? 'Good' : 'Watchlist'}</Pill><Sparkline /></div>
        <InfoLine label="Linked Trainees" value={String(linked)} />
        <InfoLine label="Open Opportunities" value={String(placementCases.filter((c: AnyRow) => String(c.partner_id || '') === String(partner.id || '') && !s(c.status).toLowerCase().includes('placed')).length)} />
        <InfoLine label="Revenue Signal" value={money(payments.reduce((sum: number, p: AnyRow) => sum + n(p.amount || p.amount_mad), 0))} />
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
  return <div style={{ display: 'grid', gap: 10 }}>{rows.map((row, i) => <InfoRow key={i} left="●" title={s(row.title || `Partner updated: ${row.name}`)} sub={s((row as AnyRow).notes || row.type || 'Partner lifecycle event')} right={<small>{date(row.created_at)}</small>} />)}</div>
}

function AlertsPanel({ partners, atRiskPartners, contracts }: { partners: AnyRow[]; atRiskPartners: number; contracts: number }) {
  const alerts = [`${atRiskPartners} partners require risk review`, `${contracts} contract lanes need follow-up`, `${partners.length} partner records in command center`, 'SLA and placement feedback should be reviewed weekly']
  return <div style={{ display: 'grid', gap: 10 }}>{alerts.map((a, i) => <InfoRow key={a} left={['⚠️','📄','🧭','🔔'][i]} title={a} sub="Operational alert" right={<Link href="/academy/partners" style={inlineLink}>Review</Link>} />)}</div>
}



function PartnerManagementModal({
  partner,
  placementCases,
  activities,
  trainees,
  payments,
  params,
}: {
  partner: AnyRow
  placementCases: AnyRow[]
  activities: AnyRow[]
  trainees: AnyRow[]
  payments: AnyRow[]
  params: SearchParams
}) {
  const partnerId = s(partner.id, '')
  const monthFilter = s(params.month, '')
  const partnerCases = placementCases.filter((item) => s(item.partner_id, '') === partnerId)
  const filteredCases = monthFilter
    ? partnerCases.filter((item) => s(item.created_at || item.updated_at, '').startsWith(monthFilter))
    : partnerCases

  const partnerTasks = activities.filter((item) => s(item.partner_id, '') === partnerId)
  const openTasks = partnerTasks.filter((item) => !['done', 'closed', 'cancelled', 'completed'].includes(s(item.status, '').toLowerCase()))
  const revenueSignal = payments.reduce((sum: number, item: AnyRow) => sum + n(item.amount || item.amount_mad || item.paid_amount), 0)

  const modalLabel: CSSProperties = {
    color: '#64748b',
    fontSize: 10,
    fontWeight: 1000,
    letterSpacing: '.08em',
    textTransform: 'uppercase',
  }

  const modalInput: CSSProperties = {
    width: '100%',
    minHeight: 42,
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    background: '#fff',
    color: '#0f172a',
    padding: '0 12px',
    fontSize: 12,
    fontWeight: 850,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const modalTextarea: CSSProperties = {
    ...modalInput,
    minHeight: 92,
    padding: 12,
    resize: 'vertical',
    lineHeight: 1.55,
  }

  return (
    <section
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 130,
        background: 'rgba(15,23,42,.52)',
        backdropFilter: 'blur(10px)',
        padding: '112px 28px 44px',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: 'min(1420px, calc(100vw - 340px))',
          marginLeft: 292,
          borderRadius: 34,
          overflow: 'hidden',
          border: '1px solid rgba(226,232,240,.9)',
          background: '#f8fbff',
          boxShadow: '0 38px 95px rgba(15,23,42,.30)',
        }}
      >
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(135deg,#0f172a 0%,#1e3a8a 52%,#0ea5e9 100%)',
            color: '#fff',
            padding: 28,
          }}
        >
          <div style={{ position: 'absolute', right: -70, top: -80, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle at center, rgba(255,255,255,.18), rgba(255,255,255,0))' }} />

          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
              <span style={{ width: 64, height: 64, borderRadius: 22, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.22)', fontSize: 22, fontWeight: 1000 }}>
                {initials(s(partner.name, 'P'))}
              </span>
              <div>
                <p style={{ margin: 0, opacity: .72, fontSize: 11, fontWeight: 1000, letterSpacing: '.18em' }}>PARTNER MANAGEMENT DOSSIER</p>
                <h2 style={{ margin: '8px 0 8px', fontSize: 32, lineHeight: 1, letterSpacing: '-.055em' }}>{s(partner.name, 'N/A')}</h2>
                <p style={{ margin: 0, opacity: .80, fontSize: 13, fontWeight: 850 }}>
                  {s(partner.type, 'N/A')} · {s(partner.city, 'N/A')} · {s(partner.status, 'N/A')}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <Link href="/academy/partners" style={{ ...lightButton, color: '#fff', background: 'rgba(255,255,255,.12)', borderColor: 'rgba(255,255,255,.22)' }}>Close</Link>
              <Link href={`/academy/partners?partner=${partnerId}&modal=edit-partner`} style={{ ...primaryButton, minHeight: 40 }}>Edit partner</Link>
              <Link href={`/academy/partners?partner=${partnerId}&modal=new-note`} style={{ ...purpleButton, minHeight: 40 }}>Add follow-up</Link>
            </div>
          </div>

          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 12, marginTop: 22 }}>
            {[
              ['Live cases', String(partnerCases.length), '#38bdf8'],
              ['Open tasks', String(openTasks.length), '#f97316'],
              ['Linked trainees', String(new Set(partnerCases.map((c) => s(c.trainee_id, '')).filter(Boolean)).size), '#22c55e'],
              ['Revenue signal', money(revenueSignal), '#a78bfa'],
              ['Health score', `${Math.max(72, 100 - openTasks.length * 6)}%`, '#2dd4bf'],
            ].map(([label, value, color]: string[]) => (
              <article key={label} style={{ border: '1px solid rgba(255,255,255,.18)', borderRadius: 18, background: 'rgba(255,255,255,.10)', padding: 14 }}>
                <p style={{ margin: 0, opacity: .70, fontSize: 10, fontWeight: 1000, textTransform: 'uppercase' }}>{label}</p>
                <strong style={{ display: 'block', marginTop: 7, fontSize: 22, letterSpacing: '-.04em', color }}>{s(value, 'N/A')}</strong>
              </article>
            ))}
          </div>
        </div>

        <div style={{ padding: 22, display: 'grid', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 18 }}>
            <Panel title="1. Partner intelligence snapshot" action="live profile">
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  ['Name', partner.name],
                  ['Type', partner.type],
                  ['City', partner.city],
                  ['Contact', partner.contact_name || partner.phone],
                  ['Phone', partner.phone],
                  ['Email', partner.email],
                  ['Status', partner.status],
                  ['Created', partner.created_at ? date(partner.created_at) : 'N/A'],
                ].map(([label, value]: any[]) => (
                  <div key={label} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12, padding: 12, borderRadius: 16, border: '1px solid #e8eef7', background: '#fff' }}>
                    <span style={{ color: '#64748b', fontSize: 11, fontWeight: 1000, textTransform: 'uppercase' }}>{label}</span>
                    <strong style={{ color: '#0f172a', fontSize: 13, fontWeight: 950 }}>{s(value, 'N/A')}</strong>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="2. Add live job placement demand" action="synced case">
              <form action={createPartnerPlacementCaseAction} style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }}>
                <input type="hidden" name="partner_id" value={partnerId} />
                <input type="hidden" name="partner_name" value={s(partner.name, '')} />

                <label style={{ display: 'grid', gap: 7 }}>
                  <span style={modalLabel}>Needed role</span>
                  <input name="preferred_role" placeholder="Caregiver, nursery assistant..." style={modalInput} />
                </label>
                <label style={{ display: 'grid', gap: 7 }}>
                  <span style={modalLabel}>Target city</span>
                  <input name="target_city" defaultValue={s(partner.city, '')} style={modalInput} />
                </label>
                <label style={{ display: 'grid', gap: 7 }}>
                  <span style={modalLabel}>Lifecycle status</span>
                  <select name="status" defaultValue="employer_outreach" style={modalInput}>
                    <option value="ready_for_placement">Ready for placement</option>
                    <option value="employer_outreach">Employer outreach</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="offer_stage">Offer stage</option>
                    <option value="placed">Placed</option>
                    <option value="follow_up">Follow-up</option>
                    <option value="at_risk">At-risk</option>
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 7 }}>
                  <span style={modalLabel}>Priority</span>
                  <select name="priority" defaultValue="normal" style={modalInput}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 7 }}>
                  <span style={modalLabel}>Match score</span>
                  <input name="match_score" type="number" min="0" max="100" defaultValue="0" style={modalInput} />
                </label>
                <label style={{ display: 'grid', gap: 7 }}>
                  <span style={modalLabel}>Advisor</span>
                  <input name="advisor_name" defaultValue="Academy Partner Team" style={modalInput} />
                </label>
                <label style={{ display: 'grid', gap: 7, gridColumn: '1/-1' }}>
                  <span style={modalLabel}>Case notes</span>
                  <textarea name="notes" placeholder="Demand context, profile requirements, salary range, partner expectations..." style={modalTextarea} />
                </label>
                <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button type="submit" style={{ ...primaryButton, borderColor: '#16a34a', background: 'linear-gradient(135deg,#16a34a,#22c55e)', cursor: 'pointer' }}>
                    Save placement case
                  </button>
                </div>
              </form>
            </Panel>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 18 }}>
            <Panel title="3. Live placement lifecycle cases" action={`${partnerCases.length} cases`}>
              <div style={{ display: 'grid', gap: 12 }}>
                {partnerCases.length ? partnerCases.map((item) => {
                  const status = s(item.status, 'N/A')
                  const tone = status.includes('placed') ? '#16a34a' : status.includes('interview') ? '#f97316' : status.includes('offer') ? '#7c3aed' : status.includes('risk') ? '#e11d48' : '#2563eb'
                  return (
                    <Link
                      key={s(item.id, item.ref_code)}
                      href={`/academy/job-placement?case=${encodeURIComponent(s(item.id, ''))}&modal=case-management`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.2fr .7fr .7fr .7fr',
                        gap: 12,
                        alignItems: 'center',
                        textDecoration: 'none',
                        color: '#0f172a',
                        border: '1px solid #e3eaf5',
                        borderLeft: `6px solid ${tone}`,
                        borderRadius: 20,
                        background: '#fff',
                        padding: 14,
                        boxShadow: '0 14px 28px rgba(15,23,42,.045)',
                      }}
                    >
                      <div>
                        <strong style={{ display: 'block', fontSize: 13 }}>{s(item.ref_code, `CASE-${s(item.id, '').slice(0, 8)}`)}</strong>
                        <small style={{ color: '#64748b', fontWeight: 850 }}>{s(item.preferred_role, 'N/A')} · {s(item.target_city, 'N/A')}</small>
                      </div>
                      <strong style={{ color: tone, fontSize: 12, textTransform: 'uppercase' }}>{status}</strong>
                      <span style={partnerStatusPill}>{s(item.priority, 'N/A')}</span>
                      <strong style={{ color: '#0f172a', fontSize: 12 }}>{n(item.match_score)}%</strong>
                    </Link>
                  )
                }) : (
                  <div style={emptyStateBox}>No placement case linked to this partner yet.</div>
                )}
              </div>
            </Panel>

            <Panel title="4. Monthly placement history" action={monthFilter || 'All months'}>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Link href={`/academy/partners?partner=${partnerId}&modal=partner-management`} style={lightButton}>All</Link>
                  {[0, 1, 2, 3, 4, 5].map((offset) => {
                    const d = new Date()
                    d.setMonth(d.getMonth() - offset)
                    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                    return <Link key={value} href={`/academy/partners?partner=${partnerId}&modal=partner-management&month=${value}`} style={lightButton}>{value}</Link>
                  })}
                </div>
                <div style={{ display: 'grid', gap: 9 }}>
                  {filteredCases.length ? filteredCases.map((item) => (
                    <div key={s(item.id, item.ref_code)} style={{ border: '1px solid #e3eaf5', borderRadius: 16, background: '#fff', padding: 12 }}>
                      <strong style={{ display: 'block', fontSize: 12 }}>{s(item.ref_code, 'N/A')}</strong>
                      <small style={{ color: '#64748b', fontWeight: 850 }}>{s(item.status, 'N/A')} · {item.created_at ? date(item.created_at) : 'N/A'}</small>
                    </div>
                  )) : <div style={emptyStateBox}>No case history for this filter.</div>}
                </div>
              </div>
            </Panel>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <Panel title="5. Partner tasks & action queue" action={`${openTasks.length} open`}>
              <div style={{ display: 'grid', gap: 14 }}>
                <form action={createPartnerTaskAction} style={{ display: 'grid', gridTemplateColumns: '1.2fr .65fr .65fr auto', gap: 10 }}>
                  <input type="hidden" name="partner_id" value={partnerId} />
                  <input type="hidden" name="partner_name" value={s(partner.name, '')} />
                  <input name="title" placeholder="Add task / action..." required style={modalInput} />
                  <select name="priority" defaultValue="normal" style={modalInput}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <select name="status" defaultValue="open" style={modalInput}>
                    <option value="open">Open</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="done">Done</option>
                  </select>
                  <button type="submit" style={{ ...primaryButton, cursor: 'pointer' }}>Add</button>
                </form>

                <div style={{ display: 'grid', gap: 10 }}>
                  {partnerTasks.length ? partnerTasks.map((task) => (
                    <div key={s(task.id, task.title)} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', border: '1px solid #e3eaf5', borderRadius: 18, background: '#fff', padding: 13 }}>
                      <div>
                        <strong style={{ display: 'block', color: '#0f172a', fontSize: 13 }}>{s(task.title || task.action_type, 'N/A')}</strong>
                        <small style={{ color: '#64748b', fontWeight: 850 }}>{s(task.status, 'open')} · {s(task.priority, 'normal')} · {task.created_at ? date(task.created_at) : 'N/A'}</small>
                      </div>
                      {task.id ? (
                        <form action={deletePartnerTaskAction}>
                          <input type="hidden" name="partner_id" value={partnerId} />
                          <input type="hidden" name="task_id" value={s(task.id, '')} />
                          <button style={dangerMiniButton}>Remove</button>
                        </form>
                      ) : null}
                    </div>
                  )) : <div style={emptyStateBox}>No partner task yet.</div>}
                </div>
              </div>
            </Panel>

            <Panel title="6. Operations, revenue & useful signals" action="management">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
                {[
                  ['Contract status', s(partner.contract_status || partner.status, 'N/A')],
                  ['Revenue signal', money(revenueSignal)],
                  ['Open placement ops', String(partnerCases.length)],
                  ['Available trainee pool', String(trainees.length)],
                  ['Account owner', s(partner.owner || partner.account_owner || partner.contact_name, 'N/A')],
                  ['Latest update', partner.updated_at ? date(partner.updated_at) : 'N/A'],
                ].map(([label, value]: any[]) => (
                  <div key={label} style={{ border: '1px solid #e3eaf5', borderRadius: 18, background: '#fff', padding: 14 }}>
                    <span style={{ display: 'block', color: '#64748b', fontSize: 10, fontWeight: 1000, textTransform: 'uppercase' }}>{label}</span>
                    <strong style={{ display: 'block', marginTop: 8, color: '#0f172a', fontSize: 15 }}>{s(value, 'N/A')}</strong>
                  </div>
                ))}
                <div style={{ gridColumn: '1/-1', border: '1px solid #e3eaf5', borderRadius: 18, background: '#fff', padding: 14 }}>
                  <span style={{ display: 'block', color: '#64748b', fontSize: 10, fontWeight: 1000, textTransform: 'uppercase' }}>Partner notes</span>
                  <p style={{ margin: '8px 0 0', color: '#334155', fontSize: 12, fontWeight: 850, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{s(partner.notes, 'N/A')}</p>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </section>
  )
}

const emptyStateBox: CSSProperties = {
  border: '1px dashed #cbd5e1',
  borderRadius: 18,
  background: 'linear-gradient(135deg,#f8fafc,#ffffff)',
  padding: 18,
  color: '#64748b',
  fontSize: 13,
  fontWeight: 900,
}

const dangerMiniButton: CSSProperties = {
  border: '1px solid #fecdd3',
  borderRadius: 12,
  background: '#fff1f2',
  color: '#be123c',
  padding: '9px 12px',
  fontSize: 11,
  fontWeight: 1000,
  cursor: 'pointer',
}


function NewPartnerModal() {
  const modalField: CSSProperties = {
    display: 'grid',
    gap: 7,
  }

  const modalLabel: CSSProperties = {
    color: '#64748b',
    fontSize: 10,
    fontWeight: 1000,
    letterSpacing: '.08em',
    textTransform: 'uppercase',
  }

  const modalInput: CSSProperties = {
    width: '100%',
    minHeight: 44,
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    background: '#fff',
    color: '#0f172a',
    padding: '0 13px',
    fontSize: 13,
    fontWeight: 850,
    outline: 'none',
    boxShadow: '0 10px 22px rgba(15,23,42,.035)',
    boxSizing: 'border-box',
  }

  const modalTextarea: CSSProperties = {
    ...modalInput,
    minHeight: 104,
    padding: 13,
    resize: 'vertical',
    lineHeight: 1.55,
  }

  const blockTitle: CSSProperties = {
    margin: '0 0 12px',
    color: '#0f172a',
    fontSize: 15,
    letterSpacing: '-.035em',
    fontWeight: 1000,
  }

  const blockCard: CSSProperties = {
    border: '1px solid #e4ebf6',
    borderRadius: 24,
    background: 'linear-gradient(180deg,#ffffff,#fbfdff)',
    padding: 18,
    boxShadow: '0 16px 34px rgba(15,23,42,.045)',
  }

  return (
    <section
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        background: 'rgba(15,23,42,.50)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '118px 28px 40px',
        overflowY: 'auto',
      }}
    >
      <form
        action={createPartnerAction}
        style={{
          width: 'min(1280px, calc(100vw - 340px))',
          marginLeft: 292,
          borderRadius: 32,
          overflow: 'hidden',
          background: '#f8fbff',
          border: '1px solid rgba(226,232,240,.9)',
          boxShadow: '0 36px 90px rgba(15,23,42,.28)',
        }}
      >
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: 26,
            background: 'linear-gradient(135deg,#0f172a 0%,#1e3a8a 52%,#2563eb 100%)',
            color: '#fff',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: -70,
              top: -80,
              width: 260,
              height: 260,
              borderRadius: '50%',
              background: 'radial-gradient(circle at center, rgba(255,255,255,.18), rgba(255,255,255,0))',
            }}
          />

          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: 0, opacity: .72, fontSize: 11, fontWeight: 1000, letterSpacing: '.18em' }}>
                PARTNER DOSSIER CREATION
              </p>
              <h2 style={{ margin: '8px 0 8px', fontSize: 30, lineHeight: 1, letterSpacing: '-.055em' }}>
                New Partner / Employer Account
              </h2>
              <p style={{ margin: 0, maxWidth: 760, opacity: .76, fontSize: 13, fontWeight: 800, lineHeight: 1.6 }}>
                Create a complete partner dossier for B2B lifecycle tracking, employer relationships, placement demand,
                contracts, revenue potential, follow-ups and operational execution.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <Link
                href="/academy/partners"
                style={{
                  ...lightButton,
                  minHeight: 44,
                  background: 'rgba(255,255,255,.12)',
                  borderColor: 'rgba(255,255,255,.22)',
                  color: '#fff',
                }}
              >
                Cancel
              </Link>
              <button
                type="submit"
                style={{
                  ...primaryButton,
                  minHeight: 44,
                  borderColor: '#22c55e',
                  background: 'linear-gradient(135deg,#16a34a,#22c55e)',
                  boxShadow: '0 18px 34px rgba(34,197,94,.25)',
                  cursor: 'pointer',
                }}
              >
                Save Partner
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: 22, display: 'grid', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 18 }}>
            <section style={blockCard}>
              <h3 style={blockTitle}>1. Partner identity & classification</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
                <label style={modalField}>
                  <span style={modalLabel}>Partner name *</span>
                  <input name="name" required placeholder="Example: LE NIDO" style={modalInput} />
                </label>
                <label style={modalField}>
                  <span style={modalLabel}>Legal name</span>
                  <input name="legal_name" placeholder="Registered legal name" style={modalInput} />
                </label>
                <label style={modalField}>
                  <span style={modalLabel}>Brand / commercial name</span>
                  <input name="brand_name" placeholder="Public brand name" style={modalInput} />
                </label>
                <label style={modalField}>
                  <span style={modalLabel}>Partner type *</span>
                  <select name="type" required defaultValue="school" style={modalInput}>
                    <option value="school">School</option>
                    <option value="nursery">Nursery</option>
                    <option value="preschool">Preschool</option>
                    <option value="kindergarten">Kindergarten</option>
                    <option value="family">Private family</option>
                    <option value="hotel">Hotel / hospitality</option>
                    <option value="clinic">Clinic / healthcare</option>
                    <option value="corporate">Corporate</option>
                    <option value="professional">Professional employer</option>
                  </select>
                </label>
                <label style={modalField}>
                  <span style={modalLabel}>Segment</span>
                  <select name="segment" defaultValue="placement_partner" style={modalInput}>
                    <option value="placement_partner">Placement partner</option>
                    <option value="b2b_school_partner">B2B school partner</option>
                    <option value="employer_account">Employer account</option>
                    <option value="strategic_account">Strategic account</option>
                    <option value="pilot_partner">Pilot partner</option>
                    <option value="upsell_account">Upsell account</option>
                  </select>
                </label>
                <label style={modalField}>
                  <span style={modalLabel}>Status</span>
                  <select name="status" defaultValue="prospect" style={modalInput}>
                    <option value="prospect">Prospect</option>
                    <option value="qualified">Qualified</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="at_risk">At-risk</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
              </div>
            </section>

            <section style={blockCard}>
              <h3 style={blockTitle}>2. Location, contact & ownership</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
                <label style={modalField}>
                  <span style={modalLabel}>City</span>
                  <input name="city" placeholder="Rabat, Temara, Casablanca..." style={modalInput} />
                </label>
                <label style={modalField}>
                  <span style={modalLabel}>Zone / neighborhood</span>
                  <input name="zone" placeholder="Hay Riad, Agdal, Tamsna..." style={modalInput} />
                </label>
                <label style={{ ...modalField, gridColumn: '1/-1' }}>
                  <span style={modalLabel}>Full address</span>
                  <input name="address" placeholder="Full operational address" style={modalInput} />
                </label>
                <label style={modalField}>
                  <span style={modalLabel}>Main contact</span>
                  <input name="contact_name" placeholder="Contact person" style={modalInput} />
                </label>
                <label style={modalField}>
                  <span style={modalLabel}>Decision maker</span>
                  <input name="decision_maker" placeholder="Director / owner / HR manager" style={modalInput} />
                </label>
                <label style={modalField}>
                  <span style={modalLabel}>Decision maker role</span>
                  <input name="decision_maker_role" placeholder="Director, Founder, HR..." style={modalInput} />
                </label>
                <label style={modalField}>
                  <span style={modalLabel}>Account owner</span>
                  <input name="account_owner" placeholder="Internal owner" style={modalInput} />
                </label>
                <label style={modalField}>
                  <span style={modalLabel}>Phone</span>
                  <input name="phone" placeholder="+212..." style={modalInput} />
                </label>
                <label style={modalField}>
                  <span style={modalLabel}>WhatsApp</span>
                  <input name="whatsapp" placeholder="+212..." style={modalInput} />
                </label>
                <label style={modalField}>
                  <span style={modalLabel}>Email</span>
                  <input name="email" type="email" placeholder="contact@example.com" style={modalInput} />
                </label>
                <label style={modalField}>
                  <span style={modalLabel}>Website / social link</span>
                  <input name="website" placeholder="https://..." style={modalInput} />
                </label>
              </div>
            </section>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 18 }}>
            <section style={blockCard}>
              <h3 style={blockTitle}>3. Partnership lifecycle</h3>
              <div style={{ display: 'grid', gap: 14 }}>
                <label style={modalField}>
                  <span style={modalLabel}>Partnership stage</span>
                  <select name="partnership_stage" defaultValue="prospecting" style={modalInput}>
                    <option value="prospecting">Prospecting</option>
                    <option value="qualified">Qualified</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="contracting">Contracting</option>
                    <option value="active">Active</option>
                    <option value="expansion">Expansion</option>
                    <option value="at_risk">At-risk</option>
                  </select>
                </label>
                <label style={modalField}>
                  <span style={modalLabel}>Priority</span>
                  <select name="priority" defaultValue="medium" style={modalInput}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="strategic">Strategic</option>
                  </select>
                </label>
                <label style={modalField}>
                  <span style={modalLabel}>Risk / blockers</span>
                  <textarea name="risk_blockers" placeholder="Decision blockers, price resistance, contract risk..." style={modalTextarea} />
                </label>
              </div>
            </section>

            <section style={blockCard}>
              <h3 style={blockTitle}>4. Placement demand</h3>
              <div style={{ display: 'grid', gap: 14 }}>
                <label style={modalField}>
                  <span style={modalLabel}>Potential monthly demand</span>
                  <input name="monthly_demand" type="number" min="0" placeholder="0" style={modalInput} />
                </label>
                <label style={modalField}>
                  <span style={modalLabel}>Placement urgency</span>
                  <select name="placement_urgency" defaultValue="normal" style={modalInput}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="critical">Critical</option>
                  </select>
                </label>
                <label style={modalField}>
                  <span style={modalLabel}>Needed profiles</span>
                  <textarea name="needed_profiles" placeholder="Caregivers, childcare workers, nursery assistants..." style={modalTextarea} />
                </label>
              </div>
            </section>

            <section style={blockCard}>
              <h3 style={blockTitle}>5. Contract & revenue layer</h3>
              <div style={{ display: 'grid', gap: 14 }}>
                <label style={modalField}>
                  <span style={modalLabel}>Contract type</span>
                  <select name="contract_type" defaultValue="placement_agreement" style={modalInput}>
                    <option value="placement_agreement">Placement agreement</option>
                    <option value="b2b_service_contract">B2B service contract</option>
                    <option value="framework_agreement">Framework agreement</option>
                    <option value="pilot_contract">Pilot contract</option>
                    <option value="none_yet">None yet</option>
                  </select>
                </label>
                <label style={modalField}>
                  <span style={modalLabel}>Revenue potential MAD</span>
                  <input name="revenue_potential" type="number" min="0" placeholder="0" style={modalInput} />
                </label>
                <label style={modalField}>
                  <span style={modalLabel}>Billing model</span>
                  <select name="billing_model" defaultValue="per_placement" style={modalInput}>
                    <option value="per_placement">Per placement</option>
                    <option value="monthly_retainer">Monthly retainer</option>
                    <option value="service_package">Service package</option>
                    <option value="training_plus_placement">Training + placement</option>
                    <option value="custom">Custom</option>
                  </select>
                </label>
              </div>
            </section>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '.9fr 1.1fr', gap: 18 }}>
            <section style={blockCard}>
              <h3 style={blockTitle}>6. Next meeting & execution</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
                <label style={modalField}>
                  <span style={modalLabel}>Next meeting date</span>
                  <input name="next_meeting_date" type="datetime-local" style={modalInput} />
                </label>
                <label style={modalField}>
                  <span style={modalLabel}>Meeting agenda</span>
                  <input name="next_meeting_agenda" placeholder="Contract, placement demand, pilot..." style={modalInput} />
                </label>
                <label style={{ ...modalField, gridColumn: '1/-1' }}>
                  <span style={modalLabel}>Internal execution notes</span>
                  <textarea name="execution_notes" placeholder="What the team must do next, documents to prepare, decision logic..." style={modalTextarea} />
                </label>
              </div>
            </section>

            <section style={blockCard}>
              <h3 style={blockTitle}>7. General partner notes</h3>
              <textarea
                name="notes"
                placeholder="General account context, relationship history, special conditions, operational intelligence..."
                style={{ ...modalTextarea, minHeight: 188 }}
              />
            </section>
          </div>

          <div
            style={{
              position: 'sticky',
              bottom: 0,
              zIndex: 2,
              margin: '2px -22px -22px',
              padding: 18,
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              alignItems: 'center',
              borderTop: '1px solid #e2e8f0',
              background: 'rgba(248,251,255,.92)',
              backdropFilter: 'blur(14px)',
            }}
          >
            <p style={{ margin: 0, color: '#64748b', fontSize: 12, fontWeight: 850 }}>
              Saves to academy_partners and stores the extended dossier intelligence inside partner notes.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/academy/partners" style={lightButton}>Cancel</Link>
              <button
                type="submit"
                style={{
                  ...primaryButton,
                  borderColor: '#16a34a',
                  background: 'linear-gradient(135deg,#16a34a,#22c55e)',
                  boxShadow: '0 16px 32px rgba(22,163,74,.24)',
                  cursor: 'pointer',
                }}
              >
                Save Partner
              </button>
            </div>
          </div>
        </div>
      </form>
    </section>
  )
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
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(520px,.95fr) minmax(720px,1.35fr)', gap: 12 }}><Select name="type" label="Type" defaultValue={partner?.type} options={['employer', 'school', 'nursery', 'clinic', 'hotel', 'family', 'professional']} /><Select name="status" label="Status" defaultValue={partner?.status} options={['prospect', 'qualified', 'negotiation', 'contracting', 'active', 'expansion', 'at_risk', 'paused']} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(520px,.95fr) minmax(720px,1.35fr)', gap: 12 }}><Field name="city" label="City" defaultValue={partner?.city} /><Field name="contact_name" label="Account owner / contact" defaultValue={partner?.contact_name} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(520px,.95fr) minmax(720px,1.35fr)', gap: 12 }}><Field name="phone" label="Phone" defaultValue={partner?.phone} /><Field name="email" label="Email" defaultValue={partner?.email} /></div>
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

function Kpi({ icon, label, value, sub, tone }: { icon: string; label: string; value: any; sub: string; tone: Tone }) { return <div style={kpiCard}><span style={iconBubble(tone)}>{icon}</span><div><p style={kpiLabel}>{label}</p><strong style={kpiValue}>{s(value, 'N/A')}</strong><small style={kpiSub}>↗ {sub}</small></div></div> }
function Panel({ title, action, children, style }: { title: string; action?: string; children: ReactNode; style?: CSSProperties }) { return <section style={{ ...panel, ...style }}><div style={panelHead}><h3>{title}</h3>{action ? <span>{action}</span> : null}</div>{children}</section> }
type Tone = 'blue' | 'green' | 'orange' | 'rose' | 'purple' | 'cyan' | 'slate'
function Pill({ children, tone = 'slate' }: { children: ReactNode; tone?: Tone }) { const c = toneMap[tone]; return <span style={{ border: `1px solid ${c}30`, background: `${c}12`, color: c, borderRadius: 999, padding: '5px 9px', fontSize: 10, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>{children}</span> }
function Avatar({ name, large }: { name: any; large?: boolean }) { return <span style={{ width: large ? 54 : 26, height: large ? 54 : 26, borderRadius: '50%', display: 'inline-grid', placeItems: 'center', background: '#eef2ff', color: '#355df6', fontSize: large ? 18 : 10, fontWeight: 950, flex: '0 0 auto' }}>{initials(name)}</span> }
function MiniAvatar({ name }: { name: any }) { return <span style={{ display: 'inline-grid', placeItems: 'center', width: 22, height: 22, borderRadius: '50%', background: '#f5f3ff', color: '#7c3aed', fontSize: 9, fontWeight: 950 }}>{initials(name)}</span> }
function EmptyState({ title, text, href, label }: { title: string; text: string; href?: string; label?: string }) { return <div style={emptyBox}><strong>{title}</strong><p>{text}</p>{href ? <Link href={href} style={primaryBtn}>{label || 'Create'}</Link> : null}</div> }
function InfoRow({ left, title, sub, right }: { left?: ReactNode; title: string; sub?: string; right?: ReactNode }) { return <div style={infoRow}>{left ? <span style={rowIcon}>{left}</span> : null}<div style={{ minWidth: 0 }}><strong>{title}</strong>{sub ? <p>{sub}</p> : null}</div><div style={{ marginLeft: 'auto' }}>{right}</div></div> }
function Metric({ label, value }: { label: string; value: any }) { return <div style={metric}><small>{label}</small><strong>{s(value, 'N/A')}</strong></div> }
function Progress({ label, value }: { label: string; value: number }) { return <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 900 }}><span>{label}</span><span>{value}%</span></div><div style={progressTrack}><span style={{ ...progressFill, width: `${Math.min(100, value)}%` }} /></div></div> }
function Legend({ label, value, color }: { label: string; value: any; color: string }) { return <p style={{ margin: '6px 0', fontSize: 11, fontWeight: 850 }}><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 99, background: color, marginRight: 6 }} />{label} · {value}</p> }
function Sparkline() { return <div style={{ display: 'flex', alignItems: 'end', gap: 3, height: 42, marginTop: 12 }}>{[18, 30, 22, 36, 28, 44, 34, 46, 38, 52, 42, 58].map((h, i) => <span key={i} style={{ width: 7, height: h, borderRadius: 8, background: 'linear-gradient(180deg,#60a5fa,#355df6)' }} />)}</div> }
function InfoLine({ label, value }: { label: string; value: string }) { return <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, fontWeight: 900 }}><span style={{ color: '#64748b' }}>{label}</span><strong>{s(value, 'N/A')}</strong></div> }

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