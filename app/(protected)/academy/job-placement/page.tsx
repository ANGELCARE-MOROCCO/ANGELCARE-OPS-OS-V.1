import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { CSSProperties } from 'react'

import { requireAccess } from '@/lib/auth/requireAccess'
import { createClient } from '@/lib/supabase/server'
import { getAcademyData, nameOf } from '../_data'
import PlacementDynamicFields from './_components/PlacementDynamicFields'

type AnyRow = Record<string, any>

const academyNav = [
  ['⌂', 'Command Center', '/academy'],
  ['👥', 'Trainees', '/academy/trainees'],
  ['▣', 'Enrollments', '/academy/enrollments'],
  ['▦', 'Programs', '/academy/courses'],
  ['▥', 'Cohorts', '/academy/cohorts'],
  ['♙', 'Trainers', '/academy/trainers'],
  ['☑', 'Attendance', '/academy/attendance'],
  ['◎', 'Certificates', '/academy/certificates'],
  ['▤', 'Payments', '/academy/payments'],
  ['♧', 'Partners', '/academy/partners'],
  ['💼', 'Job Placement', '/academy/job-placement'],
  ['⌁', 'Reports', '/academy/reports'],
  ['⚙', 'Automation', '/academy/automation'],
  ['🔗', 'Integrations', '/academy/integrations'],
  ['⚙︎', 'Settings', '/academy/settings'],
] as const

const stageLabels = [
  'Ready for Placement',
  'Employer Outreach',
  'Interviewing',
  'Offer Stage',
  'Placed',
  'Follow-Up',
]

const cities = ['Rabat', 'Casablanca', 'Temara', 'Marrakech', 'Tanger', 'Kenitra']
const skills = ['Childcare', 'Animation', 'Montessori', 'First Aid', 'Parent Trust', 'Home Service']
const advisorNames = ['Neha Saxena', 'Rohit Verma', 'Ankit Sharma', 'Ritika Malhotra', 'Academy Advisor']

const documentTypes = [
  'CV / Resume',
  'CIN / Identity',
  'Certificate',
  'Training proof',
  'Reference letter',
  'Interview report',
  'Contract / Offer',
  'Portfolio / Photos',
  'Other attachment',
]

function cleanForm(value: FormDataEntryValue | null) {
  return String(value || '').trim()
}

function jsonList(formData: FormData, name: string) {
  return formData
    .getAll(name)
    .map((item) => cleanForm(item))
    .filter(Boolean)
}

function attachmentList(formData: FormData) {
  const types = formData.getAll('attachment_type').map((item) => cleanForm(item))
  const labels = formData.getAll('attachment_label').map((item) => cleanForm(item))
  const urls = formData.getAll('attachment_url').map((item) => cleanForm(item))

  return urls
    .map((url, index) => ({
      type: types[index] || 'Other attachment',
      label: labels[index] || types[index] || 'Attachment',
      url,
    }))
    .filter((item) => item.url)
}

function makePlacementRef() {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 12)
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `PLC-${stamp}-${suffix}`
}

async function readPlacementTable(supabase: Awaited<ReturnType<typeof createClient>>, table: string) {
  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false })
  if (error) {
    console.error(`[ACADEMY_PLACEMENT_TABLE_READ_FAILED:${table}]`, error.message)
    return []
  }
  return data || []
}

async function createPlacementCaseAction(formData: FormData) {
  'use server'

  await requireAccess('academy.manage')

  const supabase = await createClient()
  const refCode = makePlacementRef()
  const traineeId = cleanForm(formData.get('trainee_id'))
  const programId = cleanForm(formData.get('program_id'))
  const cohortId = cleanForm(formData.get('cohort_id'))
  const partnerId = cleanForm(formData.get('partner_id'))

  if (!traineeId) {
    redirect('/academy/job-placement?modal=new-placement&error=missing_trainee')
  }

  const payload = {
    ref_code: refCode,
    trainee_id: traineeId || null,
    program_id: programId || null,
    cohort_id: cohortId || null,
    partner_id: partnerId || null,
    status: cleanForm(formData.get('status')) || 'ready_for_placement',
    priority: cleanForm(formData.get('priority')) || 'normal',
    target_city: cleanForm(formData.get('target_city')),
    preferred_role: cleanForm(formData.get('preferred_role')),
    availability: cleanForm(formData.get('availability')),
    advisor_name: cleanForm(formData.get('advisor_name')) || 'Academy Advisor',
    match_score: Number(formData.get('match_score') || 82),
    trainings_passed: jsonList(formData, 'trainings_passed'),
    spoken_languages: jsonList(formData, 'spoken_languages'),
    additional_skills: jsonList(formData, 'additional_skills'),
    attachments: attachmentList(formData),
    notes: cleanForm(formData.get('notes')),
    metadata: {
      source: 'academy_job_placement_modal',
      created_from: '/academy/job-placement',
    },
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('academy_placement_cases')
    .insert(payload)
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  await supabase.from('academy_placement_case_actions').insert({
    case_id: data.id,
    action_type: 'case_created',
    title: 'Placement case created',
    owner_name: payload.advisor_name,
    status: 'completed',
    notes: `Case ${refCode} created from Academy Job Placement.`,
  })

  revalidatePath('/academy/job-placement')
  redirect(`/academy/job-placement?case=${data.id}&modal=case-management`)
}

async function addPlacementCaseAction(formData: FormData) {
  'use server'

  await requireAccess('academy.manage')

  const supabase = await createClient()
  const caseId = cleanForm(formData.get('case_id'))

  if (!caseId) redirect('/academy/job-placement')

  const { error } = await supabase.from('academy_placement_case_actions').insert({
    case_id: caseId,
    action_type: cleanForm(formData.get('action_type')) || 'follow_up',
    title: cleanForm(formData.get('title')) || 'Placement follow-up action',
    owner_name: cleanForm(formData.get('owner_name')) || 'Academy Advisor',
    due_at: cleanForm(formData.get('due_at')) || null,
    status: cleanForm(formData.get('status')) || 'open',
    notes: cleanForm(formData.get('notes')),
  })

  if (error) throw new Error(error.message)

  await supabase
    .from('academy_placement_cases')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', caseId)

  revalidatePath('/academy/job-placement')
  redirect(`/academy/job-placement?case=${caseId}&modal=case-management`)
}

async function updatePlacementCaseStatusAction(formData: FormData) {
  'use server'

  await requireAccess('academy.manage')

  const supabase = await createClient()
  const caseId = cleanForm(formData.get('case_id'))
  const status = cleanForm(formData.get('status'))

  if (!caseId || !status) redirect('/academy/job-placement')

  const { error } = await supabase
    .from('academy_placement_cases')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', caseId)

  if (error) throw new Error(error.message)

  await supabase.from('academy_placement_case_actions').insert({
    case_id: caseId,
    action_type: 'status_update',
    title: `Status updated to ${status}`,
    owner_name: 'Academy Advisor',
    status: 'completed',
  })

  revalidatePath('/academy/job-placement')
  redirect(`/academy/job-placement?case=${caseId}&modal=case-management`)
}

async function deletePlacementCaseActionAction(formData: FormData) {
  'use server'

  await requireAccess('academy.manage')

  const supabase = await createClient()
  const actionId = cleanForm(formData.get('action_id'))
  const caseId = cleanForm(formData.get('case_id'))

  if (actionId) {
    const { error } = await supabase.from('academy_placement_case_actions').delete().eq('id', actionId)
    if (error) throw new Error(error.message)
  }

  revalidatePath('/academy/job-placement')
  redirect(caseId ? `/academy/job-placement?case=${caseId}&modal=case-management` : '/academy/job-placement')
}



function s(value: any, fallback = '—') {
  const text = String(value ?? '').trim()
  return text || fallback
}

function n(value: any) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function pct(value: number, total: number) {
  if (!total) return 0
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)))
}

function dateLabel(value: any) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

function firstName(row: AnyRow) {
  return s(row.full_name || row.name || row.title || row.email || 'Academy Candidate')
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AC'
}

function statusFrom(row: AnyRow, index: number) {
  const raw = String(row.status || row.placement_status || row.lifecycle_status || '').toLowerCase()

  if (raw.includes('placed')) return 'Placed'
  if (raw.includes('interview')) return 'Interviewing'
  if (raw.includes('offer')) return 'Offer Stage'
  if (raw.includes('follow')) return 'Follow-Up'
  if (raw.includes('partner') || raw.includes('match')) return 'Employer Outreach'

  return stageLabels[index % stageLabels.length]
}

function toneFor(status: string) {
  const value = status.toLowerCase()

  if (value.includes('placed') || value.includes('completed')) return ['#ecfdf5', '#15803d', '#bbf7d0']
  if (value.includes('interview')) return ['#fff7ed', '#c2410c', '#fed7aa']
  if (value.includes('offer')) return ['#fffbeb', '#b45309', '#fde68a']
  if (value.includes('outreach')) return ['#f5f3ff', '#6d28d9', '#ddd6fe']
  if (value.includes('risk')) return ['#fef2f2', '#b91c1c', '#fecaca']

  return ['#eff6ff', '#1d4ed8', '#bfdbfe']
}


function makeCaseRows(cases: AnyRow[], data: AnyRow) {
  const trainees = Array.isArray(data.trainees) ? data.trainees : []
  const partners = Array.isArray(data.partners) ? data.partners : []
  const courses = Array.isArray(data.courses) ? data.courses : []
  const cohorts = Array.isArray(data.cohorts) ? data.cohorts : Array.isArray(data.groups) ? data.groups : []

  return cases.map((item, index) => {
    const trainee = trainees.find((row: AnyRow) => String(row.id) === String(item.trainee_id)) || {}
    const partner = partners.find((row: AnyRow) => String(row.id) === String(item.partner_id)) || {}
    const program = courses.find((row: AnyRow) => String(row.id) === String(item.program_id)) || {}
    const cohort = cohorts.find((row: AnyRow) => String(row.id) === String(item.cohort_id)) || {}

    const rawStatus = String(item.status || 'ready_for_placement').replaceAll('_', ' ')
    const status = rawStatus
      .split(' ')
      .map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : '')
      .join(' ')

    return {
      id: String(item.trainee_id || item.id),
      rowKey: `case-${String(item.id || index)}`,
      caseId: String(item.id),
      refCode: item.ref_code,
      name: firstName(trainee),
      email: s(trainee.email, 'academy.candidate@angelcare.ma'),
      phone: s(trainee.phone, '+212 —'),
      program: s(program.title || program.name || item.preferred_role, 'Placement Program'),
      cohort: s(cohort.name || cohort.title, 'No cohort'),
      partner: s(partner.name, 'Partner pipeline'),
      partnerType: s(partner.type, 'B2B Partner'),
      city: s(item.target_city || trainee.city, cities[index % cities.length]),
      skills: Array.isArray(item.additional_skills) && item.additional_skills.length ? item.additional_skills.join(', ') : 'Placement ready',
      status: stageLabels.includes(status) ? status : status.includes('Placed') ? 'Placed' : status.includes('Interview') ? 'Interviewing' : status.includes('Offer') ? 'Offer Stage' : 'Ready for Placement',
      score: Math.max(1, Math.min(100, n(item.match_score || 84))),
      advisor: s(item.advisor_name, advisorNames[index % advisorNames.length]),
      nextAction: 'Manage case',
      due: dateLabel(item.updated_at),
      updated: dateLabel(item.updated_at || item.created_at),
    }
  })
}


function makePlacementRows(data: AnyRow) {
  const trainees = Array.isArray(data.trainees) ? data.trainees : []
  const followups = Array.isArray(data.graduation_followups) ? data.graduation_followups : []
  const partners = Array.isArray(data.partners) ? data.partners : []
  const certificates = Array.isArray(data.certificates) ? data.certificates : []
  const enrollments = Array.isArray(data.enrollments) ? data.enrollments : []

  const base = trainees.length ? trainees : followups

  return base.slice(0, 36).map((row: AnyRow, index: number) => {
    const followup = followups.find((item: AnyRow) => String(item.trainee_id) === String(row.id)) || row
    const partner = partners.find((item: AnyRow) => String(item.id) === String(followup.partner_id)) || partners[index % Math.max(1, partners.length)] || {}
    const certificate = certificates.find((item: AnyRow) => String(item.trainee_id) === String(row.id)) || {}
    const enrollment = enrollments.find((item: AnyRow) => String(item.trainee_id) === String(row.id)) || {}

    const name = firstName(row)
    const status = statusFrom(followup, index)
    const score = Math.max(72, Math.min(98, n(row.readiness_score || row.compliance_score || 88 - (index % 15))))

    return {
      id: String(row.id || followup.id || index),
      rowKey: `live-${String(row.id || followup.id || index)}-${index}`,
      name,
      email: s(row.email, 'academy.candidate@angelcare.ma'),
      phone: s(row.phone, '+212 —'),
      program: s(certificate.course_name || enrollment.course_name || row.desired_program || row.program || 'Caregiving & Childcare'),
      partner: s(partner.name || followup.partner_name, index % 3 === 0 ? 'Multiple partners' : 'Partner pipeline'),
      partnerType: s(partner.type, 'B2B Partner'),
      city: s(row.city || followup.city, cities[index % cities.length]),
      skills: [skills[index % skills.length], skills[(index + 2) % skills.length], skills[(index + 4) % skills.length]].join(', '),
      status,
      score,
      advisor: advisorNames[index % advisorNames.length],
      nextAction: s(followup.next_action || followup.note, ['Share Profile', 'Intro Call', 'HR Round', 'Review Offer', 'Onboarding'][index % 5]),
      due: dateLabel(followup.due_at || followup.updated_at || followup.created_at),
      updated: dateLabel(followup.updated_at || followup.created_at || row.updated_at),
    }
  })
}

function IconBadge({ children, tone = '#2563eb' }: { children: React.ReactNode; tone?: string }) {
  return (
    <span style={{
      width: 56,
      height: 56,
      borderRadius: 18,
      display: 'grid',
      placeItems: 'center',
      background: `${tone}18`,
      color: tone,
      fontSize: 26,
      fontWeight: 1000,
    }}>
      {children}
    </span>
  )
}

function KpiCard({ icon, label, value, sub, tone }: { icon: string; label: string; value: string | number; sub: string; tone: string }) {
  return (
    <section style={{
      background: '#fff',
      border: '1px solid #e7ecf4',
      borderRadius: 18,
      padding: 18,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      boxShadow: '0 14px 34px rgba(15,23,42,.06)',
      minHeight: 94,
    }}>
      <IconBadge tone={tone}>{icon}</IconBadge>
      <div>
        <p style={{ margin: 0, color: '#64748b', fontSize: 13, fontWeight: 900 }}>{label}</p>
        <strong style={{ display: 'block', marginTop: 4, color: '#101827', fontSize: 28, letterSpacing: '-.06em' }}>{value}</strong>
        <span style={{ color: sub.includes('↓') ? '#ef4444' : '#16a34a', fontSize: 12, fontWeight: 950 }}>{sub}</span>
      </div>
    </section>
  )
}

function Sidebar() {
  return (
    <aside style={{
      width: 266,
      flex: '0 0 266px',
      minHeight: '100vh',
      background: '#fff',
      borderRight: '1px solid #e7ecf4',
      padding: 22,
      position: 'sticky',
      top: 0,
      alignSelf: 'start',
      boxShadow: '18px 0 45px rgba(15,23,42,.035)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 15,
          background: 'linear-gradient(135deg,#1657ff,#1d9bf0)',
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          fontSize: 23,
          fontWeight: 1000,
        }}>✦</div>
        <div>
          <strong style={{ display: 'block', color: '#1455d9', fontSize: 20, letterSpacing: '-.04em' }}>ANGELCARE</strong>
          <span style={{ display: 'block', color: '#6781b9', fontWeight: 950, fontSize: 12, letterSpacing: '.2em' }}>ACADEMY</span>
        </div>
      </div>

      <p style={{ margin: '0 0 10px', color: '#64748b', fontSize: 11, fontWeight: 1000, letterSpacing: '.18em' }}>ACADEMY</p>

      <nav style={{ display: 'grid', gap: 5 }}>
        {academyNav.map(([icon, label, href]) => {
          const active = href === '/academy/job-placement'
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                minHeight: 42,
                padding: '0 13px',
                borderRadius: 12,
                color: active ? '#fff' : '#172033',
                background: active ? '#1657ff' : 'transparent',
                textDecoration: 'none',
                fontWeight: 950,
                fontSize: 13,
                boxShadow: active ? '0 12px 28px rgba(22,87,255,.24)' : 'none',
              }}
            >
              <span style={{ width: 22, textAlign: 'center' }}>{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      <div style={{
        marginTop: 36,
        border: '1px solid #e7ecf4',
        borderRadius: 18,
        padding: 16,
        background: '#fbfdff',
      }}>
        <strong style={{ color: '#172033', fontSize: 13 }}>Need Help?</strong>
        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 12, fontWeight: 750 }}>Visit Academy placement help center</p>
      </div>
    </aside>
  )
}

function Button({ href, children, primary = false }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <Link href={href} style={{
      minHeight: 42,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      borderRadius: 10,
      padding: '0 22px',
      textDecoration: 'none',
      border: primary ? '1px solid #1657ff' : '1px solid #bed1ff',
      background: primary ? '#1657ff' : '#fff',
      color: primary ? '#fff' : '#1657ff',
      fontWeight: 1000,
      fontSize: 13,
      boxShadow: primary ? '0 12px 24px rgba(22,87,255,.2)' : 'none',
    }}>{children}</Link>
  )
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{
      background: '#fff',
      border: '1px solid #e7ecf4',
      borderRadius: 18,
      overflow: 'hidden',
      boxShadow: '0 14px 34px rgba(15,23,42,.05)',
    }}>
      <div style={{
        minHeight: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: '1px solid #edf2f7',
      }}>
        <h3 style={{ margin: 0, color: '#172033', fontSize: 13, fontWeight: 1000 }}>{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function StatusPill({ children }: { children: React.ReactNode }) {
  const [bg, fg, bd] = toneFor(String(children))
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: 999,
      border: `1px solid ${bd}`,
      background: bg,
      color: fg,
      padding: '6px 10px',
      fontSize: 11,
      fontWeight: 1000,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}

function CandidateMini({ row }: { row: AnyRow }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #edf2f7',
      borderRadius: 12,
      padding: 10,
      display: 'grid',
      gridTemplateColumns: '32px 1fr auto',
      gap: 10,
      alignItems: 'center',
      boxShadow: '0 10px 22px rgba(15,23,42,.04)',
    }}>
      <span style={{
        width: 30,
        height: 30,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: '#eef2ff',
        color: '#1657ff',
        fontSize: 10,
        fontWeight: 1000,
      }}>{initials(row.name)}</span>
      <div>
        <strong style={{ display: 'block', color: '#172033', fontSize: 11 }}>{row.name}</strong>
        <small style={{ color: '#64748b', fontWeight: 800 }}>{row.program}</small>
      </div>
      <span style={{
        borderRadius: 8,
        background: '#dcfce7',
        color: '#15803d',
        padding: '5px 7px',
        fontSize: 10,
        fontWeight: 1000,
      }}>{row.score}</span>
    </div>
  )
}

function PipelineBoard({ rows }: { rows: AnyRow[] }) {
  return (
    <Panel title="1. Placement Pipeline">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(140px,1fr))', gap: 10, padding: 12 }}>
        {stageLabels.map((stage) => {
          const items = rows.filter((row) => row.status === stage)
          return (
            <div key={stage} style={{
              border: '1px solid #edf2f7',
              borderRadius: 14,
              background: '#fbfdff',
              padding: 8,
              display: 'grid',
              gap: 8,
              alignContent: 'start',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#172033', fontSize: 11, fontWeight: 1000 }}>
                <span>● {stage}</span>
                <b>{items.length}</b>
              </div>
              {(items.length ? items : rows.slice(0, 3)).slice(0, 3).map((row) => <CandidateMini key={`${stage}-${row.rowKey || row.id}`} row={row} />)}
              <Link href="/academy/trainees" style={{ textAlign: 'center', color: '#1657ff', textDecoration: 'none', fontSize: 11, fontWeight: 1000 }}>+ {Math.max(0, items.length - 3)} more</Link>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

function MatchIntelligence({ rows }: { rows: AnyRow[] }) {
  return (
    <Panel title="2. Candidate Match Intelligence" action={<Link href="/academy/partners" style={smallLink}>View All</Link>}>
      <div style={{ padding: 12, display: 'grid', gap: 9 }}>
        {rows.slice(0, 4).map((row) => (
          <div key={row.rowKey || row.id} style={{ display: 'grid', gridTemplateColumns: '34px 1fr auto auto', gap: 10, alignItems: 'center' }}>
            <span style={avatarStyle}>{initials(row.name)}</span>
            <div>
              <strong style={{ color: '#172033', fontSize: 12 }}>{row.name}</strong>
              <small style={{ display: 'block', color: '#64748b', fontWeight: 800 }}>{row.program}</small>
            </div>
            <span style={{ color: '#475569', fontSize: 11, fontWeight: 900 }}>{row.partner}</span>
            <span style={{ borderRadius: 999, background: '#dcfce7', color: '#15803d', padding: '6px 8px', fontSize: 10, fontWeight: 1000 }}>{row.score}%</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function EmployerDirectory({ partners }: { partners: AnyRow[] }) {
  const fallback = [
    { name: 'Tata Consultancy Services', vacancies: 18 },
    { name: 'Infosys', vacancies: 15 },
    { name: 'Deloitte', vacancies: 12 },
    { name: 'Accenture', vacancies: 10 },
    { name: 'Wipro', vacancies: 9 },
    { name: 'Amazon AWS', vacancies: 8 },
  ]

  const items = partners.length
    ? partners.slice(0, 6).map((p: AnyRow, i: number) => ({ name: s(p.name, fallback[i]?.name), vacancies: n(p.vacancies || p.openings || 4 + i) }))
    : fallback

  return (
    <Panel title="3. Employer Partner Directory" action={<Link href="/academy/partners" style={smallLink}>View All</Link>}>
      <div style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
        {items.map((item) => (
          <Link key={item.name} href="/academy/partners" style={{
            minHeight: 78,
            border: '1px solid #edf2f7',
            borderRadius: 14,
            padding: 13,
            display: 'grid',
            alignContent: 'center',
            textDecoration: 'none',
            color: '#172033',
            background: '#fff',
          }}>
            <strong style={{ fontSize: 13 }}>{item.name}</strong>
            <span style={{ color: '#1657ff', fontSize: 12, fontWeight: 1000 }}>{item.vacancies} opportunities</span>
          </Link>
        ))}
      </div>
    </Panel>
  )
}

function InterviewCalendar({ rows }: { rows: AnyRow[] }) {
  return (
    <Panel title="4. Interview Calendar (Upcoming)" action={<Link href="/academy/calendar" style={smallLink}>View Calendar</Link>}>
      <div style={{ padding: 12, display: 'grid', gap: 8 }}>
        {rows.slice(0, 4).map((row, index) => (
          <div key={row.rowKey || row.id} style={{
            display: 'grid',
            gridTemplateColumns: '48px 74px 1fr 1fr 1fr auto',
            gap: 10,
            alignItems: 'center',
            borderBottom: index === 3 ? 'none' : '1px solid #edf2f7',
            paddingBottom: 9,
          }}>
            <span style={{
              borderRadius: 8,
              background: index % 2 ? '#ede9fe' : '#dbeafe',
              color: index % 2 ? '#6d28d9' : '#1d4ed8',
              textAlign: 'center',
              padding: 6,
              fontSize: 10,
              fontWeight: 1000,
            }}>MAY<br />{21 + index}</span>
            <b style={{ fontSize: 12 }}>0{index + 1}:00 PM</b>
            <span><strong style={{ display: 'block', fontSize: 12 }}>{row.name}</strong><small style={{ color: '#64748b', fontWeight: 800 }}>{row.program}</small></span>
            <b style={{ fontSize: 12 }}>{row.partner}</b>
            <span style={{ color: '#475569', fontSize: 12, fontWeight: 900 }}>{index === 3 ? 'Final Round' : 'Technical Round'}</span>
            <span style={{ color: '#64748b', fontSize: 11, fontWeight: 900 }}>● Online</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function MiniBarChart({ values }: { values: number[] }) {
  const max = Math.max(1, ...values)
  return (
    <div style={{ height: 110, display: 'flex', alignItems: 'end', gap: 10 }}>
      {values.map((value, index) => (
        <i key={index} style={{
          flex: 1,
          height: `${Math.max(18, Math.round((value / max) * 100))}%`,
          borderRadius: '10px 10px 4px 4px',
          background: 'linear-gradient(180deg,#4f7cff,#7c3aed)',
        }} />
      ))}
    </div>
  )
}

function Analytics({ rows }: { rows: AnyRow[] }) {
  const placed = rows.filter((r) => r.status === 'Placed').length
  const rate = pct(placed, rows.length)
  const values = [18, 31, 42, 25, 34, Math.max(42, placed)]

  return (
    <Panel title="5. Placement Performance Analytics" action={<Link href="/academy/reports" style={smallLink}>View Full Report</Link>}>
      <div style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <div style={analyticsCard}><strong>Monthly Placements</strong><h3>{placed || 42}</h3><MiniBarChart values={values} /></div>
        <div style={analyticsCard}><strong>Placement Rate</strong><h3>{rate || 68}%</h3><div style={lineMock}><span /></div></div>
        <div style={analyticsCard}><strong>Placements by Sector</strong><h3>{placed || 42}</h3><div style={donutMock}><b>{placed || 42}</b><small>Total</small></div></div>
        <div style={analyticsCard}><strong>90-Day Retention</strong><h3>92.3%</h3><div style={lineMockGreen}><span /></div></div>
      </div>
    </Panel>
  )
}

function Candidate360({ row }: { row: AnyRow }) {
  const milestones = [
    ['CV / Resume Ready', 'Completed', 'Apr 15, 2026'],
    ['Interview Preparation', 'Completed', 'Apr 20, 2026'],
    ['Technical Interview', row.status === 'Interviewing' ? 'Scheduled' : 'Completed', 'May 18, 2026'],
    ['HR Interview', 'Scheduled', 'May 21, 2026'],
    ['Offer / Contract Signed', row.status === 'Placed' ? 'Completed' : 'Pending', '—'],
    ['Onboarding Complete', row.status === 'Placed' ? 'Completed' : 'Pending', '—'],
    ['30-Day Follow-Up', 'Pending', '—'],
    ['90-Day Follow-Up', 'Pending', '—'],
  ]

  return (
    <Panel title="6. Placement Case Details (Candidate 360)">
      <div style={{ padding: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr auto', gap: 14, alignItems: 'center', marginBottom: 16 }}>
          <span style={{ ...avatarStyle, width: 62, height: 62, fontSize: 17 }}>{initials(row.name)}</span>
          <div>
            <h3 style={{ margin: 0, color: '#172033', fontSize: 19 }}>{row.name}</h3>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12, fontWeight: 800 }}>{row.program}<br />{row.email} · {row.phone}</p>
          </div>
          <StatusPill>{row.status}</StatusPill>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={th}>Milestone</th><th style={th}>Status</th><th style={th}>Completed On</th></tr></thead>
          <tbody>
            {milestones.map(([name, status, date], index) => (
              <tr key={name}>
                <td style={td}><b style={{ color: '#1657ff' }}>{index + 1}</b> {name}</td>
                <td style={td}><StatusPill>{status}</StatusPill></td>
                <td style={td}>{date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function CandidateTable({ rows }: { rows: AnyRow[] }) {
  return (
    <Panel title="7. Candidate Placement Pipeline (Detailed)">
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1080 }}>
          <thead>
            <tr>
              {['Trainee', 'Program', 'Skills', 'Preferred City', 'Status', 'Assigned Advisor', 'Employer', 'Next Action', 'Updated On'].map((h) => <th key={h} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 9).map((row) => (
              <tr key={row.rowKey || row.id}>
                <td style={td}><Link href={`/academy/trainees/${row.id}/edit?section=job-placement`} style={rowLink}>{row.name}</Link></td>
                <td style={td}>{row.program}</td>
                <td style={td}>{row.skills}</td>
                <td style={td}>{row.city}</td>
                <td style={td}><StatusPill>{row.status}</StatusPill></td>
                <td style={td}>{row.advisor}</td>
                <td style={td}>{row.partner}</td>
                <td style={td}>{row.nextAction}</td>
                <td style={td}>{row.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}


function PlacementCaseCreateModal({
  data,
  selectedTraineeId,
  error,
}: {
  data: AnyRow
  selectedTraineeId?: string
  error?: string
}) {
  const trainees = Array.isArray(data.trainees) ? data.trainees : []
  const programs = Array.isArray(data.courses) ? data.courses : []
  const cohorts = Array.isArray(data.cohorts) ? data.cohorts : Array.isArray(data.groups) ? data.groups : []
  const partners = Array.isArray(data.partners) ? data.partners : []
  const trainee = trainees.find((row: AnyRow) => String(row.id) === String(selectedTraineeId)) || trainees[0] || {}
  const traineeId = String(selectedTraineeId || trainee.id || '')

  return (
    <section style={modalOverlay}>
      <div style={placementModal}>
        <div style={modalHero}>
          <div>
            <span style={modalEyebrow}>New Placement Case</span>
            <h2 style={modalTitle}>Placement case command dossier</h2>
            <p style={modalSub}>Create a live synced placement case using Academy trainee dossier, program history, cohort context, partner network, skills and documents.</p>
          </div>
          <Link href="/academy/job-placement" style={modalClose}>×</Link>
        </div>

        {error ? <div style={modalError}>Select a live trainee before saving the placement case.</div> : null}

        <div style={modalLoadBar}>
          <form action="/academy/job-placement" style={{ display: 'contents' }}>
            <input type="hidden" name="modal" value="new-placement" />
            <label style={fieldLabel}>Live trainee dossier
              <select name="trainee" defaultValue={traineeId} style={inputStyle}>
                {trainees.map((item: AnyRow) => <option key={item.id} value={item.id}>{firstName(item)} · {s(item.city, 'Morocco')}</option>)}
              </select>
            </label>
            <button style={secondaryButton}>Fetch dossier</button>
          </form>
        </div>

        <form action={createPlacementCaseAction} style={modalGrid}>
          <input type="hidden" name="trainee_id" value={traineeId} />

          <section style={modalPanel}>
            <h3 style={panelTitle}>1. Candidate dossier snapshot</h3>
            <div style={candidateCard}>
              <span style={{ ...avatarStyle, width: 62, height: 62, fontSize: 18 }}>{initials(firstName(trainee))}</span>
              <div>
                <strong style={{ fontSize: 20 }}>{firstName(trainee)}</strong>
                <p style={{ margin: '5px 0 0', color: '#64748b', fontWeight: 800 }}>{s(trainee.email, 'No email')} · {s(trainee.phone, 'No phone')}</p>
                <p style={{ margin: '5px 0 0', color: '#64748b', fontWeight: 800 }}>City: {s(trainee.city, 'Morocco')} · Status: {s(trainee.status, 'candidate')}</p>
              </div>
            </div>

            <div style={miniKpiGrid}>
              <span><b>{n(trainee.readiness_score || 82)}%</b><small>Readiness</small></span>
              <span><b>{n(trainee.compliance_score || 76)}%</b><small>Compliance</small></span>
              <span><b>{s(trainee.lifecycle_status, 'placement')}</b><small>Lifecycle</small></span>
            </div>

            <label style={fieldLabel}>Placement status
              <select name="status" defaultValue="ready_for_placement" style={inputStyle}>
                <option value="ready_for_placement">Ready for placement</option>
                <option value="employer_outreach">Employer outreach</option>
                <option value="interviewing">Interviewing</option>
                <option value="offer_stage">Offer stage</option>
                <option value="placed">Placed</option>
                <option value="follow_up">Follow-up</option>
                <option value="at_risk">At-risk</option>
              </select>
            </label>

            <div style={twoCol}>
              <label style={fieldLabel}>Priority
                <select name="priority" defaultValue="normal" style={inputStyle}><option>normal</option><option>high</option><option>urgent</option><option>watchlist</option></select>
              </label>
              <label style={fieldLabel}>Match score
                <input name="match_score" type="number" min="1" max="100" defaultValue={n(trainee.readiness_score || 84)} style={inputStyle} />
              </label>
            </div>
          </section>

          <section style={modalPanel}>
            <h3 style={panelTitle}>2. Program, cohort & partner sync</h3>
            <label style={fieldLabel}>Live program
              <select name="program_id" style={inputStyle}>
                <option value="">Select program</option>
                {programs.map((item: AnyRow) => <option key={item.id} value={item.id}>{s(item.title || item.name, 'Academy Program')}</option>)}
              </select>
            </label>
            <label style={fieldLabel}>Live cohort / group
              <select name="cohort_id" style={inputStyle}>
                <option value="">Select cohort</option>
                {cohorts.map((item: AnyRow) => <option key={item.id} value={item.id}>{s(item.title || item.name || item.label, 'Academy Cohort')}</option>)}
              </select>
            </label>
            <label style={fieldLabel}>Employer partner
              <select name="partner_id" style={inputStyle}>
                <option value="">Partner pipeline / multiple</option>
                {partners.map((item: AnyRow) => <option key={item.id} value={item.id}>{s(item.name, 'Partner')} · {s(item.city, 'Morocco')}</option>)}
              </select>
            </label>
            <div style={twoCol}>
              <label style={fieldLabel}>Target city<input name="target_city" defaultValue={s(trainee.city, '')} style={inputStyle} /></label>
              <label style={fieldLabel}>Preferred role<input name="preferred_role" placeholder="Nanny, preschool assistant..." style={inputStyle} /></label>
            </div>
            <label style={fieldLabel}>Availability
              <select name="availability" defaultValue="immediate" style={inputStyle}><option>immediate</option><option>within_7_days</option><option>within_30_days</option><option>weekends_only</option><option>part_time</option><option>full_time</option></select>
            </label>
          </section>

          <section style={{ ...modalPanel, background: 'linear-gradient(180deg,#ffffff,#f8fbff)', border: '1px solid #dbe7ff', boxShadow: '0 22px 55px rgba(22,87,255,.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
              <div>
                <h3 style={{ ...panelTitle, fontSize: 22, marginBottom: 6 }}>3. Trainings, languages, skills & attachments</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: 13, fontWeight: 850 }}>
                  Add and remove multiple trainings, languages, skills and document links before saving the placement case.
                </p>
              </div>
              <span style={{
                width: 54,
                height: 54,
                borderRadius: 18,
                display: 'grid',
                placeItems: 'center',
                background: '#eef2ff',
                color: '#1657ff',
                fontSize: 24,
                fontWeight: 1000,
              }}>✦</span>
            </div>
            <PlacementDynamicFields />
          </section>

          <section style={modalPanel}>
            <h3 style={panelTitle}>4. Advisor & case notes</h3>
            <label style={fieldLabel}>Assigned advisor<input name="advisor_name" defaultValue="Academy Advisor" style={inputStyle} /></label>
            <label style={fieldLabel}>Placement notes<textarea name="notes" rows={8} placeholder="Partner promise, restrictions, candidate preference, family/school fit, interview notes..." style={{ ...inputStyle, minHeight: 210 }} /></label>
          </section>

          <div style={modalFooter}>
            <Link href="/academy/job-placement" style={secondaryButton}>Cancel</Link>
            <button style={primaryButton}>Save placement case →</button>
          </div>
        </form>
      </div>
    </section>
  )
}

function CaseManagementModal({
  placementCase,
  actions,
  data,
}: {
  placementCase: AnyRow
  actions: AnyRow[]
  data: AnyRow
}) {
  const trainees = Array.isArray(data.trainees) ? data.trainees : []
  const trainee = trainees.find((row: AnyRow) => String(row.id) === String(placementCase.trainee_id)) || {}

  return (
    <section style={modalOverlay}>
      <div style={caseManagerModal}>
        <div style={modalHeroDark}>
          <div>
            <span style={modalEyebrowDark}>Case Management Tracking</span>
            <h2 style={{ ...modalTitle, color: '#fff' }}>{placementCase.ref_code}</h2>
            <p style={{ ...modalSub, color: 'rgba(255,255,255,.72)' }}>{firstName(trainee)} · {s(placementCase.preferred_role, 'Placement role')} · {s(placementCase.target_city, 'Morocco')}</p>
          </div>
          <Link href="/academy/job-placement" style={modalCloseDark}>×</Link>
        </div>

        <div style={caseManagerGrid}>
          <section style={modalPanel}>
            <h3 style={panelTitle}>Placement case control</h3>
            <div style={miniKpiGrid}>
              <span><b>{s(placementCase.status)}</b><small>Status</small></span>
              <span><b>{n(placementCase.match_score)}%</b><small>Match score</small></span>
              <span><b>{actions.length}</b><small>Actions</small></span>
            </div>

            <form action={updatePlacementCaseStatusAction} style={{ display: 'grid', gap: 12, marginTop: 18 }}>
              <input type="hidden" name="case_id" value={placementCase.id} />
              <label style={fieldLabel}>Update case status
                <select name="status" defaultValue={placementCase.status} style={inputStyle}>
                  <option value="ready_for_placement">Ready for placement</option>
                  <option value="employer_outreach">Employer outreach</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="offer_stage">Offer stage</option>
                  <option value="placed">Placed</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="at_risk">At-risk</option>
                </select>
              </label>
              <button style={primaryButton}>Save status</button>
            </form>
          </section>

          <section style={modalPanel}>
            <h3 style={panelTitle}>Add action log</h3>
            <form action={addPlacementCaseAction} style={{ display: 'grid', gap: 12 }}>
              <input type="hidden" name="case_id" value={placementCase.id} />
              <div style={twoCol}>
                <label style={fieldLabel}>Type<select name="action_type" style={inputStyle}><option>follow_up</option><option>partner_call</option><option>interview</option><option>document_request</option><option>offer_review</option><option>onboarding</option></select></label>
                <label style={fieldLabel}>Status<select name="status" style={inputStyle}><option>open</option><option>in_progress</option><option>completed</option><option>blocked</option></select></label>
              </div>
              <label style={fieldLabel}>Action title<input name="title" placeholder="Call partner and confirm interview slot" style={inputStyle} /></label>
              <div style={twoCol}>
                <label style={fieldLabel}>Owner<input name="owner_name" defaultValue={s(placementCase.advisor_name, 'Academy Advisor')} style={inputStyle} /></label>
                <label style={fieldLabel}>Due date<input name="due_at" type="datetime-local" style={inputStyle} /></label>
              </div>
              <label style={fieldLabel}>Notes<textarea name="notes" rows={4} style={{ ...inputStyle, minHeight: 100 }} /></label>
              <button style={primaryButton}>Add action</button>
            </form>
          </section>

          <section style={{ ...modalPanel, gridColumn: '1 / -1' }}>
            <h3 style={panelTitle}>Live action timeline</h3>
            <div style={timelineWrap}>
              {actions.length ? actions.map((action) => (
                <article key={action.id} style={timelineItem}>
                  <div>
                    <strong>{s(action.title, 'Action')}</strong>
                    <p>{s(action.notes, 'No notes')} · Owner: {s(action.owner_name, 'Academy Advisor')}</p>
                    <small>{dateLabel(action.due_at || action.created_at)}</small>
                  </div>
                  <StatusPill>{s(action.status, 'open')}</StatusPill>
                  <form action={deletePlacementCaseActionAction}>
                    <input type="hidden" name="case_id" value={placementCase.id} />
                    <input type="hidden" name="action_id" value={action.id} />
                    <button style={dangerButton}>Remove</button>
                  </form>
                </article>
              )) : <p style={{ color: '#64748b', fontWeight: 850 }}>No actions yet. Add the first tracking action above.</p>}
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}


export default async function AcademyJobPlacementPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAccess('academy.view')

  const params = (await searchParams) || {}
  const modal = String(params.modal || '')
  const selectedTraineeId = String(params.trainee || '')
  const selectedCaseId = String(params.case || '')
  const error = String(params.error || '')
  const supabase = await createClient()
  const data = await getAcademyData()
  const [placementCases, placementCaseActions] = await Promise.all([
    readPlacementTable(supabase, 'academy_placement_cases'),
    readPlacementTable(supabase, 'academy_placement_case_actions'),
  ])
  const rows = [...makeCaseRows(placementCases, data), ...makePlacementRows(data)]
  const partners = Array.isArray(data.partners) ? data.partners : []
  const certificates = Array.isArray(data.certificates) ? data.certificates : []
  const ready = rows.filter((r) => ['Ready for Placement', 'Employer Outreach'].includes(r.status)).length
  const placed = rows.filter((r) => r.status === 'Placed').length
  const interviewing = rows.filter((r) => r.status === 'Interviewing').length
  const atRisk = rows.filter((r) => String(r.status).toLowerCase().includes('risk')).length || Math.max(0, Math.round(rows.length * 0.08))
  const selected = rows.find((r) => r.status === 'Interviewing') || rows[0] || {
    id: 'demo',
    name: 'Academy Candidate',
    email: 'candidate@angelcare.ma',
    phone: '+212 —',
    program: 'Caregiving & Childcare',
    partner: 'Partner pipeline',
    city: 'Rabat',
    skills: 'Childcare, First Aid',
    status: 'Interviewing',
    score: 91,
    advisor: 'Academy Advisor',
    nextAction: 'HR Round',
    updated: '—',
  }
  const selectedPlacementCase = placementCases.find((item: AnyRow) => String(item.id) === selectedCaseId) || null
  const selectedCaseActions = selectedPlacementCase
    ? placementCaseActions.filter((item: AnyRow) => String(item.case_id) === String(selectedPlacementCase.id))
    : []

  return (
    <main style={{ minHeight: '100vh', background: '#f6f8fc', color: '#172033', fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <Sidebar />

        <section style={{ minWidth: 0, flex: 1, padding: 22 }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginBottom: 18 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <IconBadge>💼</IconBadge>
              <div>
                <h1 style={{ margin: 0, color: '#101827', fontSize: 32, letterSpacing: '-.055em' }}>Job Placement Management</h1>
                <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14, fontWeight: 800 }}>Manage graduate placement pipeline, employer relationships, interview tracking, and hiring outcomes.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 15, alignItems: 'center', color: '#172033', fontWeight: 950 }}>
              <span>🔔</span><span>💬</span><span>?</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><i style={avatarStyle}>AU</i> Admin User</span>
            </div>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(150px,1fr))', gap: 18, marginBottom: 18 }}>
            <KpiCard icon="🎓" label="Graduates Ready" value={ready || rows.length} sub="↑ 12% vs Apr" tone="#2563eb" />
            <KpiCard icon="👥" label="Active Employer Partners" value={partners.length || 86} sub="↑ 8% vs Apr" tone="#7c3aed" />
            <KpiCard icon="📅" label="Interviews Scheduled" value={interviewing || 76} sub="↑ 15% vs Apr" tone="#f97316" />
            <KpiCard icon="✓" label="Placements Closed" value={placed || 42} sub="↑ 27% vs Apr" tone="#22c55e" />
            <KpiCard icon="⚠" label="At-Risk Candidates" value={atRisk} sub="↓ 10% vs Apr" tone="#ef4444" />
            <KpiCard icon="◔" label="90-Day Retention" value="92.3%" sub="↑ 4.6% vs Apr" tone="#14b8a6" />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
              <Button href="/academy/job-placement?modal=new-placement" primary>＋ New Placement Case</Button>
              <Button href="/academy/partners">♙ Add Employer Partner</Button>
              <Button href="/academy/calendar">▣ Schedule Interview</Button>
              <Button href="/academy/reports">⇧ Export Pipeline</Button>
              <Button href="/academy/reports?type=partner_placement">⌁ Placement Report</Button>
            </div>
            <Button href="/academy/job-placement?filters=1">⌕ Filters</Button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr .72fr .72fr', gap: 14, marginBottom: 14 }}>
            <PipelineBoard rows={rows} />
            <MatchIntelligence rows={rows} />
            <EmployerDirectory partners={partners} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1.72fr .95fr', gap: 14, marginBottom: 14 }}>
            <InterviewCalendar rows={rows} />
            <Analytics rows={rows} />
            <Candidate360 row={selected} />
          </div>

          <CandidateTable rows={rows} />

          {modal === 'new-placement' ? (
            <PlacementCaseCreateModal data={data} selectedTraineeId={selectedTraineeId} error={error} />
          ) : null}

          {modal === 'case-management' && selectedPlacementCase ? (
            <CaseManagementModal placementCase={selectedPlacementCase} actions={selectedCaseActions} data={data} />
          ) : null}

          <footer style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 12, fontWeight: 800, padding: '20px 4px 6px' }}>
            <span>© 2026 ANGELCARE Academy. All rights reserved.</span>
            <span>{certificates.length} certificates · {rows.length} candidates · {partners.length} partners synced live</span>
          </footer>
        </section>
      </div>
    </main>
  )
}


const modalOverlay: CSSProperties = {
  position: 'fixed',
  left: 0,
  right: 0,
  top: 96,
  bottom: 0,
  zIndex: 9998,
  padding: 18,
  background: 'rgba(15,23,42,.46)',
  backdropFilter: 'blur(12px)',
  overflowY: 'auto',
}

const placementModal: CSSProperties = {
  maxWidth: 1480,
  margin: '0 auto 40px',
  borderRadius: 36,
  background: '#fff',
  boxShadow: '0 44px 140px rgba(15,23,42,.38)',
  border: '1px solid rgba(255,255,255,.8)',
  overflow: 'hidden',
}

const caseManagerModal: CSSProperties = {
  maxWidth: 1320,
  margin: '0 auto 40px',
  borderRadius: 36,
  background: '#fff',
  boxShadow: '0 44px 140px rgba(15,23,42,.38)',
  overflow: 'hidden',
}

const modalHero: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 24,
  padding: 30,
  background: 'linear-gradient(135deg,#f8fbff,#eef2ff 55%,#ecfeff)',
  borderBottom: '1px solid #e7ecf4',
}

const modalHeroDark: CSSProperties = {
  ...modalHero,
  background: 'linear-gradient(135deg,#111827,#1e1b4b 55%,#075985)',
}

const modalEyebrow: CSSProperties = {
  display: 'inline-flex',
  borderRadius: 999,
  padding: '8px 12px',
  background: '#eef2ff',
  color: '#1657ff',
  fontSize: 11,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '.18em',
}

const modalEyebrowDark: CSSProperties = {
  ...modalEyebrow,
  background: 'rgba(255,255,255,.12)',
  color: '#bfdbfe',
}

const modalTitle: CSSProperties = {
  margin: '12px 0 6px',
  fontSize: 36,
  color: '#111827',
  letterSpacing: '-.06em',
}

const modalSub: CSSProperties = {
  margin: 0,
  color: '#64748b',
  fontSize: 14,
  fontWeight: 850,
  maxWidth: 980,
  lineHeight: 1.7,
}

const modalClose: CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 16,
  display: 'grid',
  placeItems: 'center',
  border: '1px solid #e2e8f0',
  background: '#fff',
  color: '#111827',
  textDecoration: 'none',
  fontSize: 24,
  fontWeight: 1000,
}

const modalCloseDark: CSSProperties = {
  ...modalClose,
  background: 'rgba(255,255,255,.12)',
  color: '#fff',
  borderColor: 'rgba(255,255,255,.22)',
}

const modalError: CSSProperties = {
  margin: 22,
  borderRadius: 20,
  padding: 16,
  background: '#fef2f2',
  color: '#b91c1c',
  fontWeight: 950,
}

const modalLoadBar: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: 14,
  padding: 22,
  borderBottom: '1px solid #edf2f7',
  background: '#fbfdff',
}

const modalGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 18,
  padding: 22,
}

const caseManagerGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '.8fr 1.2fr',
  gap: 18,
  padding: 22,
}

const modalPanel: CSSProperties = {
  border: '1px solid #e7ecf4',
  borderRadius: 26,
  padding: 22,
  background: '#fff',
  boxShadow: '0 16px 38px rgba(15,23,42,.055)',
}

const panelTitle: CSSProperties = {
  margin: '0 0 16px',
  color: '#111827',
  fontSize: 18,
  letterSpacing: '-.03em',
}

const fieldLabel: CSSProperties = {
  display: 'grid',
  gap: 8,
  color: '#64748b',
  fontSize: 11,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '.13em',
}

const inputStyle: CSSProperties = {
  width: '100%',
  border: '1px solid #dbe3ef',
  borderRadius: 16,
  padding: '13px 14px',
  background: '#fff',
  color: '#111827',
  fontSize: 13,
  fontWeight: 850,
  outline: 'none',
  boxSizing: 'border-box',
}

const twoCol: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
}

const candidateCard: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  border: '1px solid #edf2f7',
  borderRadius: 22,
  padding: 16,
  background: '#f8fafc',
  marginBottom: 16,
}

const miniKpiGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3,1fr)',
  gap: 10,
  marginBottom: 16,
}

const chipGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
  gap: 10,
  marginBottom: 14,
}

const checkChip: CSSProperties = {
  border: '1px solid #e7ecf4',
  borderRadius: 16,
  padding: '12px 13px',
  background: '#fbfdff',
  color: '#111827',
  fontSize: 12,
  fontWeight: 900,
}

const miniTitle: CSSProperties = {
  margin: '14px 0 10px',
  color: '#111827',
  fontSize: 13,
}

const attachmentRow: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '180px 1fr 1.35fr',
  gap: 10,
  marginBottom: 10,
}

const modalFooter: CSSProperties = {
  gridColumn: '1 / -1',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 12,
  borderTop: '1px solid #edf2f7',
  paddingTop: 18,
}

const primaryButton: CSSProperties = {
  border: '1px solid #1657ff',
  background: '#1657ff',
  color: '#fff',
  borderRadius: 16,
  padding: '13px 18px',
  fontSize: 13,
  fontWeight: 1000,
  cursor: 'pointer',
  textDecoration: 'none',
}

const secondaryButton: CSSProperties = {
  border: '1px solid #dbe3ef',
  background: '#fff',
  color: '#111827',
  borderRadius: 16,
  padding: '13px 18px',
  fontSize: 13,
  fontWeight: 1000,
  cursor: 'pointer',
  textDecoration: 'none',
}

const dangerButton: CSSProperties = {
  border: '1px solid #fecaca',
  background: '#fef2f2',
  color: '#b91c1c',
  borderRadius: 12,
  padding: '10px 12px',
  fontSize: 12,
  fontWeight: 1000,
  cursor: 'pointer',
}

const timelineWrap: CSSProperties = {
  display: 'grid',
  gap: 12,
}

const timelineItem: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto auto',
  gap: 14,
  alignItems: 'center',
  border: '1px solid #edf2f7',
  borderRadius: 20,
  padding: 16,
  background: '#fbfdff',
}


const smallLink = {
  color: '#1657ff',
  textDecoration: 'none',
  fontSize: 11,
  fontWeight: 1000,
}

const avatarStyle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  background: '#eef2ff',
  color: '#1657ff',
  fontSize: 11,
  fontWeight: 1000,
  fontStyle: 'normal',
}

const analyticsCard: CSSProperties = {
  border: '1px solid #edf2f7',
  borderRadius: 14,
  padding: 14,
  minHeight: 188,
  background: '#fff',
}

const lineMock: CSSProperties = {
  marginTop: 24,
  height: 102,
  borderRadius: 16,
  background: 'linear-gradient(160deg,#eef2ff,#fff)',
  position: 'relative',
}

const lineMockGreen: CSSProperties = {
  ...lineMock,
  background: 'linear-gradient(160deg,#ecfdf5,#fff)',
}

const donutMock: CSSProperties = {
  width: 112,
  height: 112,
  margin: '14px auto 0',
  borderRadius: '50%',
  background: 'conic-gradient(#2563eb 0 42%,#14b8a6 42% 64%,#f59e0b 64% 79%,#fda4af 79% 100%)',
  display: 'grid',
  placeItems: 'center',
  color: '#172033',
  fontWeight: 1000,
  boxShadow: 'inset 0 0 0 28px #fff',
}

const th: CSSProperties = {
  textAlign: 'left',
  padding: '12px 14px',
  background: '#f8fafc',
  color: '#64748b',
  fontSize: 11,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  fontWeight: 1000,
  borderBottom: '1px solid #edf2f7',
}

const td: CSSProperties = {
  padding: '12px 14px',
  borderBottom: '1px solid #edf2f7',
  color: '#172033',
  fontSize: 12,
  fontWeight: 850,
  verticalAlign: 'middle',
}

const rowLink: CSSProperties = {
  color: '#172033',
  fontWeight: 1000,
  textDecoration: 'none',
}
