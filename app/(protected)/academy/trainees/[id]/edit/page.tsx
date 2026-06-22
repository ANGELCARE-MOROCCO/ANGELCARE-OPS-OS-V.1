import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { CSSProperties, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth/requireAccess'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ id: string }>; searchParams?: Promise<{ section?: string; saved?: string }> }
type AnyRow = Record<string, any>
type Trainee = AnyRow & { id: string; full_name?: string | null; name?: string | null; email?: string | null; phone?: string | null; city?: string | null; status?: string | null; eligibility_status?: string | null; lifecycle_status?: string | null; readiness_score?: number | null; compliance_score?: number | null; source?: string | null; notes?: string | null; metadata?: AnyRow | null; created_at?: string | null; updated_at?: string | null }

const sections = [
  ['personal-info', 'Personal Info', 'Identity, contacts and compliance profile', '👤'],
  ['background', 'Professional Educational and Pro Background', 'Education, experience, documents and skill intelligence', '📚'],
  ['enrollment-details', 'Enrollment Details', 'Eligibility, admission, group and enrollment control', '🧾'],
  ['courses', 'Courses', 'Program path, modules, skills and trainer assignment', '🎓'],
  ['attendance', 'Attendance', 'Presence, absences, discipline and completion control', '☑️'],
  ['payment', 'Payment', 'Ledger, balance, receipts and payment risk', '💳'],
  ['graduation', 'Graduation', 'Evaluation, certification and graduation readiness', '🏅'],
  ['job-placement', 'Job Placement', 'Partner matching, opportunities and post-training insertion', '💼'],
] as const

type SectionKey = typeof sections[number][0]

const sidebarItems = [
  { label: 'Command Center', href: '/academy', icon: '⌂', group: 'academy' },
  { label: 'Trainees', href: '/academy/trainees', icon: '👥', group: 'academy' },
  { label: 'Enrollments', href: '/academy/enrollments', icon: '▣', group: 'academy' },
  { label: 'Attendance', href: '/academy/attendance', icon: '☑', group: 'academy' },
  { label: 'Payments', href: '/academy/payments', icon: '▤', group: 'academy' },
  { label: 'Certificates', href: '/academy/certificates', icon: '◎', group: 'academy' },
  { label: 'Trainers', href: '/academy/trainers', icon: '♙', group: 'academy' },
  { label: 'Programs', href: '/academy/courses', icon: '▦', group: 'academy' },
  { label: 'Job Placement', href: '/academy/job-placement', icon: '▱', group: 'academy' },
  { label: 'Partners & Employers', href: '/academy/partners', icon: '♧', group: 'academy' },
  { label: 'Announcements', href: '/academy/alerts-sales', icon: '◁', group: 'academy' },
  { label: 'Reports & Analytics', href: '/academy/reports', icon: '⌁', group: 'academy' },
  { label: 'Integrations', href: '/academy/integrations', icon: '⚙', group: 'system' },
  { label: 'Automation', href: '/academy/automation', icon: '◇', group: 'system' },
  { label: 'Settings', href: '/academy/settings', icon: '⚙', group: 'system' },
]

function text(v: unknown) { return String(v || '').trim() }
function clean(v: FormDataEntryValue | null) { const s = String(v || '').trim(); return s || null }
function number(v: unknown) { const n = Number(v || 0); return Number.isFinite(n) ? n : 0 }
function score(v: FormDataEntryValue | null) { const n = Number(v || 0); return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0 }
function date(v?: string | null) { if (!v) return '—'; try { return new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v)) } catch { return v } }
function money(v: unknown) { const n = number(v); if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M MAD`; if (n >= 1000) return `${Math.round(n / 1000)}K MAD`; return `${Math.round(n)} MAD` }
function label(t: Trainee) { return t.full_name || t.name || t.email || t.phone || `Trainee ${String(t.id).slice(0, 8)}` }
function initials(t: Trainee) { return label(t).split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase() || 'T' }
function meta(t: Trainee) { return (t.metadata && typeof t.metadata === 'object') ? t.metadata : {} }
function activeSection(raw?: string): SectionKey { return sections.some(s => s[0] === raw) ? raw as SectionKey : 'personal-info' }

async function tableList<T = AnyRow>(supabase: any, table: string, traineeId: string, limit = 50): Promise<T[]> {
  const { data, error } = await supabase.from(table).select('*').eq('trainee_id', traineeId).order('created_at', { ascending: false }).limit(limit)
  if (error) return []
  return data || []
}

async function tryInsert(supabase: any, table: string, payload: AnyRow) {
  try { await supabase.from(table).insert(payload) } catch {}
}

async function placementCaseActionsList(supabase: any, caseIds: string[]): Promise<AnyRow[]> {
  if (!caseIds.length) return []
  const { data, error } = await supabase
    .from('academy_placement_case_actions')
    .select('*')
    .in('case_id', caseIds)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) return []
  return data || []
}

function placementStatusLabel(value: unknown) {
  return text(value).replaceAll('_', ' ') || 'ready for placement'
}

function placementStatusTone(value: unknown): 'blue' | 'green' | 'orange' | 'rose' | 'purple' | 'slate' {
  const status = text(value).toLowerCase()
  if (status.includes('placed') || status.includes('completed')) return 'green'
  if (status.includes('interview')) return 'orange'
  if (status.includes('offer')) return 'purple'
  if (status.includes('risk') || status.includes('rejected') || status.includes('blocked')) return 'rose'
  if (status.includes('outreach') || status.includes('matched') || status.includes('profile')) return 'blue'
  return 'slate'
}

async function updateTraineeAdvanced(formData: FormData) {
  'use server'
  await requireAccess('academy.manage')
  const supabase = await createClient()
  const id = text(formData.get('id'))
  const section = activeSection(text(formData.get('section')))
  if (!id) redirect('/academy/trainees')
  const { data: current } = await supabase.from('academy_trainees').select('*').eq('id', id).maybeSingle()
  const currentMeta = meta((current || {}) as Trainee)
  const patch: AnyRow = { updated_at: new Date().toISOString(), metadata: { ...currentMeta, last_edit_section: section, last_manager_review_at: new Date().toISOString(), edit_source: 'academy_trainee_advanced_edit' } }

  if (section === 'personal-info') {
    Object.assign(patch, {
      full_name: clean(formData.get('full_name')),
      email: clean(formData.get('email')),
      phone: clean(formData.get('phone')),
      city: clean(formData.get('city')),
      source: clean(formData.get('source')),
      status: clean(formData.get('status')),
      eligibility_status: clean(formData.get('eligibility_status')),
      lifecycle_status: clean(formData.get('lifecycle_status')),
      readiness_score: score(formData.get('readiness_score')),
      compliance_score: score(formData.get('compliance_score')),
      notes: clean(formData.get('notes')),
    })
    Object.assign(patch.metadata, {
      national_id: clean(formData.get('national_id')),
      birth_date: clean(formData.get('birth_date')),
      emergency_contact: clean(formData.get('emergency_contact')),
      emergency_phone: clean(formData.get('emergency_phone')),
      address: clean(formData.get('address')),
      preferred_language: clean(formData.get('preferred_language')),
      consent_status: clean(formData.get('consent_status')),
      guardian_contact: clean(formData.get('guardian_contact')),
    })
  }

  if (section === 'background') {
    Object.assign(patch.metadata, {
      education_level: clean(formData.get('education_level')),
      last_school: clean(formData.get('last_school')),
      diploma: clean(formData.get('diploma')),
      professional_background: clean(formData.get('professional_background')),
      childcare_experience: clean(formData.get('childcare_experience')),
      languages: clean(formData.get('languages')),
      strengths: clean(formData.get('strengths')),
      improvement_needs: clean(formData.get('improvement_needs')),
      documents_status: clean(formData.get('documents_status')),
      background_notes: clean(formData.get('background_notes')),
    })
  }

  if (section === 'enrollment-details') {
    Object.assign(patch, { eligibility_status: clean(formData.get('eligibility_status')), lifecycle_status: clean(formData.get('lifecycle_status')), status: clean(formData.get('status')) })
    Object.assign(patch.metadata, { desired_program: clean(formData.get('desired_program')), preferred_schedule: clean(formData.get('preferred_schedule')), enrollment_channel: clean(formData.get('enrollment_channel')), admission_owner: clean(formData.get('admission_owner')), missing_requirements: clean(formData.get('missing_requirements')), enrollment_notes: clean(formData.get('enrollment_notes')) })
    if (clean(formData.get('create_enrollment')) === 'yes') await tryInsert(supabase, 'academy_enrollments', { trainee_id: id, status: clean(formData.get('new_enrollment_status')) || 'pending', notes: clean(formData.get('enrollment_notes')), created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
  }

  if (section === 'courses') {
    Object.assign(patch.metadata, { course_path: clean(formData.get('course_path')), course_level: clean(formData.get('course_level')), trainer_preference: clean(formData.get('trainer_preference')), skill_targets: clean(formData.get('skill_targets')), course_notes: clean(formData.get('course_notes')) })
  }

  if (section === 'attendance') {
    Object.assign(patch.metadata, { attendance_policy: clean(formData.get('attendance_policy')), attendance_risk: clean(formData.get('attendance_risk')), attendance_notes: clean(formData.get('attendance_notes')) })
    if (clean(formData.get('create_attendance_note')) === 'yes') await tryInsert(supabase, 'academy_attendance', { trainee_id: id, status: clean(formData.get('attendance_status')) || 'present', notes: clean(formData.get('attendance_notes')), created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
  }

  if (section === 'payment') {
    Object.assign(patch.metadata, { payment_plan: clean(formData.get('payment_plan')), payer_name: clean(formData.get('payer_name')), payment_risk: clean(formData.get('payment_risk')), payment_notes: clean(formData.get('payment_notes')) })
    if (clean(formData.get('create_payment')) === 'yes') await tryInsert(supabase, 'academy_payments', { trainee_id: id, amount: number(formData.get('payment_amount')), status: clean(formData.get('payment_status')) || 'pending', notes: clean(formData.get('payment_notes')), created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
  }

  if (section === 'graduation') {
    Object.assign(patch.metadata, { evaluation_status: clean(formData.get('evaluation_status')), graduation_status: clean(formData.get('graduation_status')), final_score: score(formData.get('final_score')), certificate_decision: clean(formData.get('certificate_decision')), graduation_notes: clean(formData.get('graduation_notes')) })
    if (clean(formData.get('issue_certificate_signal')) === 'yes') await tryInsert(supabase, 'academy_certificates', { trainee_id: id, status: clean(formData.get('certificate_decision')) || 'pending', notes: clean(formData.get('graduation_notes')), created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
  }

  if (section === 'job-placement') {
    Object.assign(patch.metadata, { placement_status: clean(formData.get('placement_status')), preferred_employer_type: clean(formData.get('preferred_employer_type')), target_city: clean(formData.get('target_city')), availability: clean(formData.get('availability')), placement_notes: clean(formData.get('placement_notes')) })
    await tryInsert(supabase, 'academy_graduation_followups', { trainee_id: id, status: clean(formData.get('placement_status')) || 'follow_up', notes: clean(formData.get('placement_notes')), created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
  }

  await supabase.from('academy_trainees').update(patch).eq('id', id)
  await tryInsert(supabase, 'academy_audit_logs', { entity_type: 'trainee', entity_id: id, action: `advanced_edit_${section}`, notes: `Advanced dossier section updated: ${section}`, created_at: new Date().toISOString() })
  revalidatePath('/academy/trainees')
  revalidatePath(`/academy/trainees/${id}/edit`)
  redirect(`/academy/trainees/${id}/edit?section=${section}&saved=1`)
}

function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) { return <section style={{ background: '#fff', border: '1px solid #e6edf7', borderRadius: 26, boxShadow: '0 18px 50px rgba(15,23,42,.05)', ...style }}>{children}</section> }
function MiniIcon({ children, color = '#355df6' }: { children: ReactNode; color?: string }) { return <span style={{ width: 44, height: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16, background: `${color}15`, color, fontSize: 18, boxShadow: `inset 0 0 0 1px ${color}22` }}>{children}</span> }
function Pill({ children, tone = 'slate' }: { children: ReactNode; tone?: 'blue' | 'green' | 'orange' | 'rose' | 'purple' | 'slate' }) { const p = { blue: ['#dbeafe', '#2563eb', '#bfdbfe'], green: ['#dcfce7', '#16a34a', '#bbf7d0'], orange: ['#ffedd5', '#ea580c', '#fed7aa'], rose: ['#ffe4e6', '#e11d48', '#fecdd3'], purple: ['#ede9fe', '#7c3aed', '#ddd6fe'], slate: ['#f1f5f9', '#64748b', '#e2e8f0'] }[tone]; return <span style={{ border: `1px solid ${p[2]}`, background: p[0], color: p[1], borderRadius: 999, padding: '7px 11px', fontSize: 10, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap' }}>{children}</span> }
function Field({ label, name, defaultValue, type = 'text', placeholder }: { label: string; name: string; defaultValue?: string | number | null; type?: string; placeholder?: string }) { return <label style={{ display: 'grid', gap: 8 }}><span style={{ color: '#64748b', fontSize: 11, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</span><input name={name} type={type} defaultValue={defaultValue ?? ''} placeholder={placeholder} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 17, padding: '15px 16px', background: '#fbfdff', color: '#0f172a', fontWeight: 850, outline: 'none' }} /></label> }
function TextArea({ label, name, defaultValue, placeholder, rows = 5 }: { label: string; name: string; defaultValue?: string | null; placeholder?: string; rows?: number }) { return <label style={{ display: 'grid', gap: 8 }}><span style={{ color: '#64748b', fontSize: 11, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</span><textarea name={name} rows={rows} defaultValue={defaultValue ?? ''} placeholder={placeholder} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 17, padding: '15px 16px', background: '#fbfdff', color: '#0f172a', fontWeight: 850, outline: 'none', resize: 'vertical' }} /></label> }
function SelectField({ label, name, defaultValue, options }: { label: string; name: string; defaultValue?: string | null; options: string[] }) { return <label style={{ display: 'grid', gap: 8 }}><span style={{ color: '#64748b', fontSize: 11, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</span><select name={name} defaultValue={defaultValue || ''} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 17, padding: '15px 16px', background: '#fbfdff', color: '#0f172a', fontWeight: 850, outline: 'none' }}>{options.map(o => <option key={o} value={o}>{o || '—'}</option>)}</select></label> }
function SaveBar({ section }: { section: SectionKey }) { return <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 18, paddingTop: 16, borderTop: '1px solid #eef2f7' }}><p style={{ margin: 0, color: '#64748b', fontSize: 12, fontWeight: 800 }}>Saves live to academy_trainees and creates best-effort audit/sync signals for the selected section.</p><button type="submit" style={{ border: 0, borderRadius: 16, background: '#355df6', color: '#fff', padding: '15px 24px', fontWeight: 950, cursor: 'pointer', boxShadow: '0 16px 30px rgba(53,93,246,.25)' }}>Save {sections.find(s => s[0] === section)?.[1]}</button></div> }
function Insight({ icon, label, value, sub, color = '#355df6' }: { icon: ReactNode; label: string; value: string; sub: string; color?: string }) { return <Card style={{ padding: 18 }}><div style={{ display: 'flex', gap: 14, alignItems: 'center' }}><MiniIcon color={color}>{icon}</MiniIcon><div><p style={{ margin: 0, color: '#64748b', fontSize: 11, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</p><strong style={{ display: 'block', marginTop: 4, fontSize: 24, letterSpacing: '-.04em' }}>{value}</strong><span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 850 }}>{sub}</span></div></div></Card> }

function Sidebar() {
  return <aside style={{ width: 260, minHeight: '100vh', position: 'sticky', top: 0, borderRight: '1px solid #e7ecf4', background: 'rgba(255,255,255,.94)', backdropFilter: 'blur(18px)', padding: 22 }}>
    <Link href="/academy" style={{ display: 'flex', gap: 12, alignItems: 'center', textDecoration: 'none', color: '#0f172a', marginBottom: 34 }}><span style={{ fontSize: 34 }}>🎓</span><div><strong style={{ display: 'block', fontSize: 20, letterSpacing: '-.04em' }}>Academy OS</strong><span style={{ color: '#475569', fontWeight: 800, fontSize: 13 }}>Edit Dossier</span></div></Link>
    <p style={{ margin: '0 0 12px 2px', color: '#64748b', fontSize: 11, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.08em' }}>Academy</p>
    <nav style={{ display: 'grid', gap: 6 }}>{sidebarItems.filter(i => i.group === 'academy').map(item => <Link key={item.href} href={item.href} style={{ display: 'flex', gap: 13, alignItems: 'center', padding: '13px 14px', borderRadius: 15, textDecoration: 'none', color: item.href === '/academy/trainees' ? '#1d4ed8' : '#0f172a', background: item.href === '/academy/trainees' ? '#eef2ff' : 'transparent', fontSize: 14, fontWeight: 900 }}><span>{item.icon}</span>{item.label}</Link>)}</nav>
    <p style={{ margin: '28px 0 12px 2px', color: '#64748b', fontSize: 11, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.08em' }}>System</p>
    <nav style={{ display: 'grid', gap: 6 }}>{sidebarItems.filter(i => i.group === 'system').map(item => <Link key={item.href} href={item.href} style={{ display: 'flex', gap: 13, alignItems: 'center', padding: '13px 14px', borderRadius: 15, textDecoration: 'none', color: '#0f172a', fontSize: 14, fontWeight: 900 }}><span>{item.icon}</span>{item.label}</Link>)}</nav>
    <div style={{ marginTop: 34, padding: 16, border: '1px solid #e7ecf4', borderRadius: 20, background: '#fbfdff' }}><strong style={{ display: 'block', fontSize: 13 }}>Live Sync</strong><p style={{ margin: '6px 0 0', color: '#16a34a', fontSize: 12, fontWeight: 900 }}>● Academy dossier online</p><p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 11, fontWeight: 750 }}>Unified navigation and live records across trainee registry, enrollments, payments, attendance, certificates and placement.</p></div>
  </aside>
}

function SectionNav({ id, active }: { id: string; active: SectionKey }) {
  return <Card style={{ padding: 10, marginBottom: 18, overflow: 'auto' }}><div style={{ display: 'flex', gap: 10, minWidth: 1180 }}>{sections.map(s => {
    const isActive = s[0] === active
    return <Link key={s[0]} href={`/academy/trainees/${id}/edit?section=${s[0]}`} style={{ flex: '0 0 auto', minWidth: s[0] === 'background' ? 310 : 160, textDecoration: 'none', border: `1px solid ${isActive ? '#355df6' : '#e2e8f0'}`, background: isActive ? '#355df6' : '#fff', color: isActive ? '#fff' : '#334155', borderRadius: 18, padding: '13px 15px', boxShadow: isActive ? '0 16px 30px rgba(53,93,246,.22)' : 'none' }}><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span>{s[3]}</span><div><strong style={{ display: 'block', fontSize: 12, lineHeight: 1.1 }}>{s[1]}</strong><span style={{ display: 'block', marginTop: 4, opacity: .72, fontSize: 10, fontWeight: 750 }}>{s[2]}</span></div></div></Link>
  })}</div></Card>
}

function FormShell({ trainee, active, children }: { trainee: Trainee; active: SectionKey; children: ReactNode }) {
  return <form action={updateTraineeAdvanced}><input type="hidden" name="id" value={trainee.id} /><input type="hidden" name="section" value={active} />{children}<SaveBar section={active} /></form>
}

function RelatedList({ title, rows, empty, fields }: { title: string; rows: AnyRow[]; empty: string; fields: string[] }) { return <Card style={{ padding: 22 }}><h3 style={{ margin: '0 0 14px', fontSize: 18 }}>{title}</h3><div style={{ display: 'grid', gap: 10 }}>{rows.length ? rows.slice(0, 6).map((r, i) => <div key={r.id || i} style={{ border: '1px solid #eef2f7', borderRadius: 16, padding: 14, background: '#fbfdff' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong style={{ fontSize: 13 }}>{text(r.title || r.name || r.status || r.type || `Record ${i + 1}`)}</strong><span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 850 }}>{date(r.created_at)}</span></div><div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: `repeat(${Math.min(fields.length, 3)}, minmax(0,1fr))`, gap: 8 }}>{fields.slice(0, 3).map(f => <div key={f} style={{ borderRadius: 12, background: '#fff', border: '1px solid #eef2f7', padding: 10 }}><span style={{ display: 'block', color: '#94a3b8', fontSize: 9, fontWeight: 950, textTransform: 'uppercase' }}>{f}</span><strong style={{ display: 'block', marginTop: 3, fontSize: 12, wordBreak: 'break-word' }}>{text(r[f]) || '—'}</strong></div>)}</div></div>) : <div style={{ border: '1px dashed #cbd5e1', borderRadius: 18, padding: 24, color: '#64748b', fontWeight: 850, background: '#f8fafc' }}>{empty}</div>}</div></Card> }

function PersonalInfo({ trainee, active }: { trainee: Trainee; active: SectionKey }) { const m = meta(trainee); return <FormShell trainee={trainee} active={active}><div style={{ display: 'grid', gridTemplateColumns: '1.35fr .9fr', gap: 18 }}><Card style={{ padding: 24 }}><h2 style={{ margin: '0 0 18px', fontSize: 22 }}>Personal Information & Identity Control</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }}><Field label="Full name" name="full_name" defaultValue={trainee.full_name || trainee.name} /><Field label="Phone" name="phone" defaultValue={trainee.phone} /><Field label="Email" name="email" defaultValue={trainee.email} /><Field label="City" name="city" defaultValue={trainee.city} /><Field label="National ID / CIN" name="national_id" defaultValue={m.national_id} /><Field label="Birth date" name="birth_date" type="date" defaultValue={m.birth_date} /><Field label="Source" name="source" defaultValue={trainee.source} /><SelectField label="Preferred language" name="preferred_language" defaultValue={m.preferred_language} options={['', 'French', 'Arabic', 'Darija', 'English']} /><SelectField label="Consent status" name="consent_status" defaultValue={m.consent_status} options={['', 'consent_collected', 'pending_consent', 'missing_document', 'rejected']} /><Field label="Emergency contact" name="emergency_contact" defaultValue={m.emergency_contact} /><Field label="Emergency phone" name="emergency_phone" defaultValue={m.emergency_phone} /><Field label="Guardian contact" name="guardian_contact" defaultValue={m.guardian_contact} /><div style={{ gridColumn: '1/-1' }}><Field label="Address" name="address" defaultValue={m.address} /></div></div></Card><Card style={{ padding: 24 }}><h2 style={{ margin: '0 0 18px', fontSize: 22 }}>Live Status Intelligence</h2><div style={{ display: 'grid', gap: 14 }}><SelectField label="File status" name="status" defaultValue={trainee.status} options={['prospect', 'candidate', 'eligible', 'enrolled', 'in_training', 'graduated', 'placed', 'inactive', 'risk']} /><SelectField label="Eligibility" name="eligibility_status" defaultValue={trainee.eligibility_status} options={['pending', 'approuvé', 'approved', 'missing_info', 'rejected', 'eligible']} /><SelectField label="Lifecycle" name="lifecycle_status" defaultValue={trainee.lifecycle_status} options={['new', 'screening', 'eligible', 'enrollment', 'training', 'evaluation', 'certified', 'placement', 'closed']} /><Field label="Readiness score" name="readiness_score" type="number" defaultValue={trainee.readiness_score || 0} /><Field label="Compliance score" name="compliance_score" type="number" defaultValue={trainee.compliance_score || 0} /><TextArea label="Manager notes" name="notes" defaultValue={trainee.notes} rows={5} /></div></Card></div></FormShell> }
function Background({ trainee, active }: { trainee: Trainee; active: SectionKey }) { const m = meta(trainee); return <FormShell trainee={trainee} active={active}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}><Card style={{ padding: 24 }}><h2 style={{ margin: '0 0 18px', fontSize: 22 }}>Educational Profile</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}><SelectField label="Education level" name="education_level" defaultValue={m.education_level} options={['', 'Primary', 'College', 'High school', 'Bac', 'Bac+2', 'Bachelor', 'Master', 'Vocational training']} /><Field label="Last school / institute" name="last_school" defaultValue={m.last_school} /><Field label="Diploma / certificate" name="diploma" defaultValue={m.diploma} /><Field label="Languages" name="languages" defaultValue={m.languages} /><div style={{ gridColumn: '1/-1' }}><TextArea label="Educational notes" name="background_notes" defaultValue={m.background_notes} rows={4} /></div></div></Card><Card style={{ padding: 24 }}><h2 style={{ margin: '0 0 18px', fontSize: 22 }}>Professional & Childcare Background</h2><div style={{ display: 'grid', gap: 14 }}><TextArea label="Professional background" name="professional_background" defaultValue={m.professional_background} rows={4} /><SelectField label="Childcare experience" name="childcare_experience" defaultValue={m.childcare_experience} options={['', 'none', 'family_experience', 'home_nanny', 'preschool_assistant', 'event_kids_leader', 'nursery_experience', 'advanced']} /><Field label="Core strengths" name="strengths" defaultValue={m.strengths} /><Field label="Improvement needs" name="improvement_needs" defaultValue={m.improvement_needs} /><SelectField label="Document status" name="documents_status" defaultValue={m.documents_status} options={['', 'complete', 'missing_cin', 'missing_photo', 'missing_diploma', 'missing_authorization', 'needs_verification']} /></div></Card></div></FormShell> }

function enrollmentStatusTone(value: unknown): 'blue' | 'green' | 'orange' | 'rose' | 'purple' | 'slate' {
  const status = text(value).toLowerCase()
  if (status.includes('active') || status.includes('confirmed') || status.includes('enrolled') || status.includes('completed')) return 'green'
  if (status.includes('pending') || status.includes('waiting') || status.includes('draft')) return 'orange'
  if (status.includes('cancel') || status.includes('rejected') || status.includes('blocked')) return 'rose'
  if (status.includes('paused') || status.includes('hold')) return 'purple'
  if (status.includes('new') || status.includes('created')) return 'blue'
  return 'slate'
}

function enrollmentStatusLabel(row: AnyRow) {
  return text(row.status || row.enrollment_status || row.lifecycle_status || '').trim() || 'N/A'
}

function enrollmentCourseLabel(row: AnyRow, courses: AnyRow[]) {
  const courseId = text(row.course_id || row.program_id)
  const course = courses.find((item) => text(item.id) === courseId)
  return text(
    course?.title ||
    course?.name ||
    row.course_name ||
    row.program_name ||
    row.course_title ||
    row.program_title ||
    ''
  ).trim() || 'N/A'
}

function enrollmentGroupLabel(row: AnyRow) {
  return text(
    row.group_name ||
    row.cohort_name ||
    row.group_title ||
    row.cohort_title ||
    row.academy_group_name ||
    row.academy_cohort_name ||
    ''
  ).trim() || 'N/A'
}

function enrollmentDateLabel(row: AnyRow) {
  const value = text(row.enrolled_at || row.start_date || row.created_at || '')
  return value ? date(value) : 'N/A'
}

function enrollmentOpenHref(row: AnyRow) {
  const id = text(row.id)
  return id ? `/academy/enrollments?enrollment=${encodeURIComponent(id)}` : '/academy/enrollments'
}

function EnrollmentRecordsPanel({
  trainee,
  enrollments,
  courses,
}: {
  trainee: Trainee
  enrollments: AnyRow[]
  courses: AnyRow[]
}) {
  const activeCount = enrollments.filter((item) => {
    const status = enrollmentStatusLabel(item).toLowerCase()
    return status.includes('active') || status.includes('confirmed') || status.includes('enrolled')
  }).length

  const pendingCount = enrollments.filter((item) => enrollmentStatusLabel(item).toLowerCase().includes('pending')).length
  const blockedCount = enrollments.filter((item) => {
    const status = enrollmentStatusLabel(item).toLowerCase()
    return status.includes('cancel') || status.includes('rejected') || status.includes('blocked')
  }).length

  return (
    <Card
      style={{
        padding: 0,
        minHeight: 380,
        overflow: 'hidden',
        background: 'linear-gradient(180deg,#ffffff 0%,#f8fbff 58%,#f7faff 100%)',
        border: '1px solid #dfe9f7',
        boxShadow: '0 24px 60px rgba(15,23,42,.08)',
      }}
    >
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: 26,
          borderBottom: '1px solid #e8eef8',
          background: 'linear-gradient(135deg,#ffffff 0%,#f5f3ff 46%,#eef4ff 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -44,
            top: -54,
            width: 190,
            height: 190,
            borderRadius: '50%',
            background: 'radial-gradient(circle at center, rgba(124,58,237,.16), rgba(124,58,237,0))',
          }}
        />

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: 20, letterSpacing: '-.04em' }}>Active Enrollment Records</h3>
              <Pill tone="purple">live synced</Pill>
              <Pill tone="blue">{enrollments.length} record{enrollments.length > 1 ? 's' : ''}</Pill>
            </div>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 13, fontWeight: 850 }}>
              Synced from academy_enrollments with real course, group, status and enrollment dates.
            </p>
          </div>

          <Link
            href={`/academy/enrollments?modal=create&trainee_id=${encodeURIComponent(trainee.id)}`}
            style={{
              textDecoration: 'none',
              border: '1px solid #7c3aed',
              background: 'linear-gradient(135deg,#7c3aed,#355df6)',
              color: '#fff',
              borderRadius: 18,
              padding: '14px 16px',
              fontSize: 13,
              fontWeight: 950,
              boxShadow: '0 18px 32px rgba(124,58,237,.25)',
              whiteSpace: 'nowrap',
            }}
          >
            + New enrollment
          </Link>
        </div>

        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12, marginTop: 18 }}>
          <div style={enrollmentSummaryCell}>
            <span style={enrollmentSummaryLabel}>Active</span>
            <strong style={{ ...enrollmentSummaryValue, color: '#16a34a' }}>{activeCount}</strong>
          </div>
          <div style={enrollmentSummaryCell}>
            <span style={enrollmentSummaryLabel}>Pending</span>
            <strong style={{ ...enrollmentSummaryValue, color: '#ea580c' }}>{pendingCount}</strong>
          </div>
          <div style={enrollmentSummaryCell}>
            <span style={enrollmentSummaryLabel}>Blocked</span>
            <strong style={{ ...enrollmentSummaryValue, color: '#e11d48' }}>{blockedCount}</strong>
          </div>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {enrollments.length ? (
          <div style={{ display: 'grid', gap: 14 }}>
            {enrollments.map((item) => {
              const status = enrollmentStatusLabel(item)
              const tone = enrollmentStatusTone(status)
              const courseLabel = enrollmentCourseLabel(item, courses)
              const groupLabel = enrollmentGroupLabel(item)

              const palette = {
                blue: { line: '#2563eb', glow: 'rgba(37,99,235,.16)', soft: '#eff6ff', pill: 'blue' as const, accent: '#1d4ed8' },
                green: { line: '#16a34a', glow: 'rgba(22,163,74,.15)', soft: '#ecfdf5', pill: 'green' as const, accent: '#15803d' },
                orange: { line: '#ea580c', glow: 'rgba(234,88,12,.16)', soft: '#fff7ed', pill: 'orange' as const, accent: '#c2410c' },
                rose: { line: '#e11d48', glow: 'rgba(225,29,72,.16)', soft: '#fff1f2', pill: 'rose' as const, accent: '#be123c' },
                purple: { line: '#7c3aed', glow: 'rgba(124,58,237,.16)', soft: '#f5f3ff', pill: 'purple' as const, accent: '#6d28d9' },
                slate: { line: '#64748b', glow: 'rgba(100,116,139,.14)', soft: '#f8fafc', pill: 'slate' as const, accent: '#475569' },
              }[tone]

              return (
                <Link
                  key={item.id || `${status}-${item.created_at}`}
                  href={enrollmentOpenHref(item)}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'block',
                    textDecoration: 'none',
                    color: '#0f172a',
                    border: '1px solid #deebf7',
                    borderLeft: `6px solid ${palette.line}`,
                    borderRadius: 24,
                    background: `linear-gradient(135deg,#ffffff 0%,${palette.soft} 100%)`,
                    padding: 18,
                    boxShadow: `0 18px 40px ${palette.glow}`,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      right: -30,
                      top: -36,
                      width: 130,
                      height: 130,
                      borderRadius: '50%',
                      background: `radial-gradient(circle at center, ${palette.glow}, rgba(255,255,255,0))`,
                    }}
                  />

                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <strong style={{ display: 'block', fontSize: 15, letterSpacing: '.02em' }}>
                          {text(item.reference || item.ref_code || `ENR-${String(item.id || '').slice(0, 8)}`)}
                        </strong>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            borderRadius: 999,
                            padding: '6px 10px',
                            background: '#ffffffcc',
                            border: `1px solid ${palette.line}22`,
                            color: palette.accent,
                            fontSize: 10,
                            fontWeight: 950,
                            textTransform: 'uppercase',
                            letterSpacing: '.05em',
                          }}
                        >
                          ● open enrollment record
                        </span>
                      </div>

                      <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 13, fontWeight: 850 }}>
                        {courseLabel !== 'N/A' ? courseLabel : 'Course: N/A'} · {groupLabel !== 'N/A' ? groupLabel : 'Group: N/A'} · {enrollmentDateLabel(item) !== 'N/A' ? enrollmentDateLabel(item) : 'Date: N/A'}
                      </p>
                    </div>

                    <Pill tone={palette.pill}>{status}</Pill>
                  </div>

                  <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, marginTop: 16 }}>
                    <div style={enrollmentMiniCell}>
                      <span style={enrollmentMiniLabel}>Course</span>
                      <strong style={enrollmentMiniValue}>{courseLabel || 'N/A'}</strong>
                    </div>
                    <div style={enrollmentMiniCell}>
                      <span style={enrollmentMiniLabel}>Group / Cohort</span>
                      <strong style={enrollmentMiniValue}>{groupLabel || 'N/A'}</strong>
                    </div>
                    <div style={enrollmentMiniCell}>
                      <span style={enrollmentMiniLabel}>Status</span>
                      <strong style={enrollmentMiniValue}>{status || 'N/A'}</strong>
                    </div>
                  </div>

                  <div style={{ position: 'relative', marginTop: 14, display: 'grid', gap: 8 }}>
                    <p style={{ margin: 0, color: '#334155', fontSize: 12, fontWeight: 850, lineHeight: 1.55 }}>
                      {text(item.notes || item.description || item.enrollment_notes || '').trim() || 'N/A'}
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={enrollmentTag}><b>Created:</b> {text(item.created_at || '').trim() ? date(item.created_at) : 'N/A'}</span>
                      <span style={enrollmentTag}><b>Updated:</b> {text(item.updated_at || '').trim() ? date(item.updated_at) : 'N/A'}</span>
                      <span style={enrollmentTag}><b>Source:</b> academy_enrollments</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div
            style={{
              border: '1px dashed #cbd5e1',
              borderRadius: 24,
              padding: 26,
              background: 'linear-gradient(135deg,#f8fafc,#ffffff)',
              color: '#64748b',
              fontWeight: 850,
            }}
          >
            <strong style={{ display: 'block', color: '#0f172a', fontSize: 16, marginBottom: 8 }}>
              No synced enrollment record yet.
            </strong>
            <p style={{ margin: '0 0 16px', lineHeight: 1.7 }}>
              Create an enrollment from the Academy enrollment command page or use the bridge fields on this dossier.
            </p>
            <Link
              href={`/academy/enrollments?modal=create&trainee_id=${encodeURIComponent(trainee.id)}`}
              style={{
                display: 'inline-flex',
                textDecoration: 'none',
                border: '1px solid #7c3aed',
                background: 'linear-gradient(135deg,#7c3aed,#355df6)',
                color: '#fff',
                borderRadius: 16,
                padding: '12px 15px',
                fontSize: 12,
                fontWeight: 950,
                boxShadow: '0 16px 28px rgba(124,58,237,.22)',
              }}
            >
              Create enrollment
            </Link>
          </div>
        )}
      </div>
    </Card>
  )
}

const enrollmentMiniCell: CSSProperties = {
  border: '1px solid #e6edf7',
  borderRadius: 18,
  background: 'rgba(255,255,255,.86)',
  backdropFilter: 'blur(8px)',
  padding: '12px 14px',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.75)',
}

const enrollmentMiniLabel: CSSProperties = {
  display: 'block',
  color: '#94a3b8',
  fontSize: 10,
  fontWeight: 950,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
}

const enrollmentMiniValue: CSSProperties = {
  display: 'block',
  marginTop: 6,
  fontSize: 15,
  fontWeight: 950,
  letterSpacing: '-.03em',
  color: '#0f172a',
  wordBreak: 'break-word',
}

const enrollmentTag: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  borderRadius: 999,
  padding: '8px 11px',
  background: '#ffffffd9',
  border: '1px solid #e5edf7',
  color: '#334155',
  fontSize: 11,
  fontWeight: 850,
}

const enrollmentSummaryCell: CSSProperties = {
  border: '1px solid #dfe8f5',
  borderRadius: 18,
  background: 'rgba(255,255,255,.82)',
  backdropFilter: 'blur(10px)',
  padding: '12px 14px',
  boxShadow: '0 10px 24px rgba(15,23,42,.04)',
}

const enrollmentSummaryLabel: CSSProperties = {
  display: 'block',
  color: '#64748b',
  fontSize: 10,
  fontWeight: 950,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
}

const enrollmentSummaryValue: CSSProperties = {
  display: 'block',
  marginTop: 7,
  fontSize: 24,
  fontWeight: 950,
  letterSpacing: '-.05em',
}

function EnrollmentDetails({
  trainee,
  active,
  enrollments,
  courses,
}: {
  trainee: Trainee
  active: SectionKey
  enrollments: AnyRow[]
  courses: AnyRow[]
}) {
  const m = meta(trainee)

  return (
    <FormShell trainee={trainee} active={active}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 18 }}>
        <Card style={{ padding: 24 }}>
          <h2 style={{ margin: '0 0 18px', fontSize: 22 }}>Enrollment Command Layer</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
            <Field label="Desired program" name="desired_program" defaultValue={m.desired_program} />
            <SelectField label="Preferred schedule" name="preferred_schedule" defaultValue={m.preferred_schedule} options={['', 'weekday_morning', 'weekday_afternoon', 'evening', 'weekend', 'intensive']} />
            <Field label="Enrollment channel" name="enrollment_channel" defaultValue={m.enrollment_channel} />
            <Field label="Admission owner" name="admission_owner" defaultValue={m.admission_owner} />
            <SelectField label="Eligibility" name="eligibility_status" defaultValue={trainee.eligibility_status} options={['pending', 'approved', 'approuvé', 'missing_info', 'rejected', 'eligible']} />
            <SelectField label="Lifecycle" name="lifecycle_status" defaultValue={trainee.lifecycle_status} options={['screening', 'eligible', 'enrollment', 'training', 'evaluation', 'certified', 'placement']} />
            <SelectField label="Status" name="status" defaultValue={trainee.status} options={['prospect', 'candidate', 'eligible', 'enrolled', 'in_training', 'graduated', 'placed', 'risk']} />
            <Field label="Missing requirements" name="missing_requirements" defaultValue={m.missing_requirements} />
            <div style={{ gridColumn: '1/-1' }}>
              <TextArea label="Enrollment notes" name="enrollment_notes" defaultValue={m.enrollment_notes} rows={5} />
            </div>
          </div>

          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <SelectField label="Create enrollment bridge" name="create_enrollment" defaultValue="no" options={['no', 'yes']} />
            <SelectField label="New enrollment status" name="new_enrollment_status" defaultValue="pending" options={['pending', 'confirmed', 'active', 'cancelled']} />
          </div>
        </Card>

        <EnrollmentRecordsPanel trainee={trainee} enrollments={enrollments} courses={courses} />
      </div>
    </FormShell>
  )
}


function courseStatusTone(value: unknown): 'blue' | 'green' | 'orange' | 'rose' | 'purple' | 'slate' {
  const status = text(value).toLowerCase()
  if (status.includes('active') || status.includes('in_training') || status.includes('enrolled') || status.includes('confirmed')) return 'green'
  if (status.includes('pending') || status.includes('waiting') || status.includes('draft')) return 'orange'
  if (status.includes('completed') || status.includes('graduated') || status.includes('certified')) return 'purple'
  if (status.includes('cancel') || status.includes('rejected') || status.includes('blocked') || status.includes('failed')) return 'rose'
  if (status.includes('new') || status.includes('created')) return 'blue'
  return 'slate'
}

function courseEnrollmentStatus(row: AnyRow) {
  return text(row.status || row.enrollment_status || row.lifecycle_status || 'pending')
}

function courseResolved(row: AnyRow, courses: AnyRow[]) {
  const courseId = text(row.course_id || row.program_id)
  const course = courses.find((item) => text(item.id) === courseId)

  return {
    id: courseId,
    title: text(course?.title || course?.name || row.course_name || row.program_name || row.program_title || row.course_title || '') || 'No course assigned',
    level: text(course?.level || course?.course_level || row.level || row.course_level || '') || 'Level not set',
    status: text(course?.status || row.course_status || '') || 'Status not set',
  }
}

function courseGroupLabel(row: AnyRow) {
  return text(
    row.group_name ||
    row.cohort_name ||
    row.group_title ||
    row.cohort_title ||
    row.academy_group_name ||
    row.academy_cohort_name ||
    ''
  ) || (text(row.group_id || row.cohort_id) ? `Group linked · ${text(row.group_id || row.cohort_id).slice(0, 8)}` : 'No group assigned')
}

function courseDateLabel(row: AnyRow) {
  const value = text(row.start_date || row.enrolled_at || row.enrollment_start_date || row.course_start_date)
  return value ? date(value) : 'Start not set'
}

function courseEndDateLabel(row: AnyRow) {
  const value = text(row.end_date || row.completed_at || row.completion_date || row.course_end_date)
  return value ? date(value) : 'End not set'
}

function courseOpenHref(row: AnyRow) {
  const enrollmentId = text(row.id)
  return enrollmentId ? `/academy/enrollments?enrollment=${encodeURIComponent(enrollmentId)}` : '/academy/courses'
}

function CoursePathRecordsPanel({
  trainee,
  enrollments,
  courses,
}: {
  trainee: Trainee
  enrollments: AnyRow[]
  courses: AnyRow[]
}) {
  const activeCount = enrollments.filter((item) => {
    const status = courseEnrollmentStatus(item).toLowerCase()
    return status.includes('active') || status.includes('confirmed') || status.includes('enrolled') || status.includes('training')
  }).length

  const pendingCount = enrollments.filter((item) => courseEnrollmentStatus(item).toLowerCase().includes('pending')).length

  const completedCount = enrollments.filter((item) => {
    const status = courseEnrollmentStatus(item).toLowerCase()
    return status.includes('completed') || status.includes('graduated') || status.includes('certified')
  }).length

  return (
    <Card
      style={{
        padding: 0,
        minHeight: 420,
        overflow: 'hidden',
        background: 'linear-gradient(180deg,#ffffff 0%,#f8fbff 58%,#f7faff 100%)',
        border: '1px solid #dfe9f7',
        boxShadow: '0 24px 60px rgba(15,23,42,.08)',
      }}
    >
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: 26,
          borderBottom: '1px solid #e8eef8',
          background: 'linear-gradient(135deg,#ffffff 0%,#eff6ff 46%,#f5f3ff 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -44,
            top: -54,
            width: 190,
            height: 190,
            borderRadius: '50%',
            background: 'radial-gradient(circle at center, rgba(53,93,246,.16), rgba(53,93,246,0))',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -44,
            bottom: -64,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: 'radial-gradient(circle at center, rgba(124,58,237,.11), rgba(124,58,237,0))',
          }}
        />

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: 20, letterSpacing: '-.04em' }}>Active Course Path Records</h3>
              <Pill tone="blue">live synced</Pill>
              <Pill tone="purple">{enrollments.length} enrollment{enrollments.length > 1 ? 's' : ''}</Pill>
            </div>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 13, fontWeight: 850 }}>
              Synced from academy_enrollments and resolved against academy_courses for this trainee.
            </p>
          </div>

          <Link
            href={`/academy/enrollments?modal=create&trainee_id=${encodeURIComponent(trainee.id)}`}
            style={{
              textDecoration: 'none',
              border: '1px solid #355df6',
              background: 'linear-gradient(135deg,#355df6,#7c3aed)',
              color: '#fff',
              borderRadius: 18,
              padding: '14px 16px',
              fontSize: 13,
              fontWeight: 950,
              boxShadow: '0 18px 32px rgba(53,93,246,.25)',
              whiteSpace: 'nowrap',
            }}
          >
            + Assign course
          </Link>
        </div>

        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12, marginTop: 18 }}>
          <div style={courseSummaryCell}>
            <span style={courseSummaryLabel}>Active</span>
            <strong style={{ ...courseSummaryValue, color: '#16a34a' }}>{activeCount}</strong>
          </div>
          <div style={courseSummaryCell}>
            <span style={courseSummaryLabel}>Pending</span>
            <strong style={{ ...courseSummaryValue, color: '#ea580c' }}>{pendingCount}</strong>
          </div>
          <div style={courseSummaryCell}>
            <span style={courseSummaryLabel}>Completed</span>
            <strong style={{ ...courseSummaryValue, color: '#7c3aed' }}>{completedCount}</strong>
          </div>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {enrollments.length ? (
          <div style={{ display: 'grid', gap: 14 }}>
            {enrollments.map((item) => {
              const status = courseEnrollmentStatus(item)
              const tone = courseStatusTone(status)
              const resolved = courseResolved(item, courses)
              const group = courseGroupLabel(item)

              const palette = {
                blue: { line: '#2563eb', glow: 'rgba(37,99,235,.16)', soft: '#eff6ff', pill: 'blue' as const, accent: '#1d4ed8' },
                green: { line: '#16a34a', glow: 'rgba(22,163,74,.15)', soft: '#ecfdf5', pill: 'green' as const, accent: '#15803d' },
                orange: { line: '#ea580c', glow: 'rgba(234,88,12,.16)', soft: '#fff7ed', pill: 'orange' as const, accent: '#c2410c' },
                rose: { line: '#e11d48', glow: 'rgba(225,29,72,.16)', soft: '#fff1f2', pill: 'rose' as const, accent: '#be123c' },
                purple: { line: '#7c3aed', glow: 'rgba(124,58,237,.16)', soft: '#f5f3ff', pill: 'purple' as const, accent: '#6d28d9' },
                slate: { line: '#64748b', glow: 'rgba(100,116,139,.14)', soft: '#f8fafc', pill: 'slate' as const, accent: '#475569' },
              }[tone]

              return (
                <Link
                  key={item.id || `${status}-${item.created_at}`}
                  href={courseOpenHref(item)}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'block',
                    textDecoration: 'none',
                    color: '#0f172a',
                    border: '1px solid #deebf7',
                    borderLeft: `6px solid ${palette.line}`,
                    borderRadius: 24,
                    background: `linear-gradient(135deg,#ffffff 0%,${palette.soft} 100%)`,
                    padding: 18,
                    boxShadow: `0 18px 40px ${palette.glow}`,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      right: -30,
                      top: -36,
                      width: 130,
                      height: 130,
                      borderRadius: '50%',
                      background: `radial-gradient(circle at center, ${palette.glow}, rgba(255,255,255,0))`,
                    }}
                  />

                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <strong style={{ display: 'block', fontSize: 15, letterSpacing: '.02em' }}>
                          {resolved.title}
                        </strong>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            borderRadius: 999,
                            padding: '6px 10px',
                            background: '#ffffffcc',
                            border: `1px solid ${palette.line}22`,
                            color: palette.accent,
                            fontSize: 10,
                            fontWeight: 950,
                            textTransform: 'uppercase',
                            letterSpacing: '.05em',
                          }}
                        >
                          ● open course enrollment
                        </span>
                      </div>

                      <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 13, fontWeight: 850 }}>
                        {group} · {courseDateLabel(item)} · {courseEndDateLabel(item)}
                      </p>
                    </div>

                    <Pill tone={palette.pill}>{status}</Pill>
                  </div>

                  <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, marginTop: 16 }}>
                    <div style={courseMiniCell}>
                      <span style={courseMiniLabel}>Course Level</span>
                      <strong style={courseMiniValue}>{resolved.level}</strong>
                    </div>
                    <div style={courseMiniCell}>
                      <span style={courseMiniLabel}>Group / Cohort</span>
                      <strong style={courseMiniValue}>{group}</strong>
                    </div>
                    <div style={courseMiniCell}>
                      <span style={courseMiniLabel}>Course Status</span>
                      <strong style={courseMiniValue}>{resolved.status}</strong>
                    </div>
                  </div>

                  <div style={{ position: 'relative', marginTop: 14, display: 'grid', gap: 8 }}>
                    <p style={{ margin: 0, color: '#334155', fontSize: 12, fontWeight: 850, lineHeight: 1.55 }}>
                      {text(item.notes || item.description || item.enrollment_notes || 'No course enrollment notes recorded.')}
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={courseTag}><b>Enrollment:</b> {text(item.id).slice(0, 8) || '—'}</span>
                      {text(item.course_id || item.program_id) ? <span style={courseTag}><b>Course ID:</b> {text(item.course_id || item.program_id).slice(0, 8)}</span> : null}
                      {text(item.group_id || item.cohort_id) ? <span style={courseTag}><b>Group ID:</b> {text(item.group_id || item.cohort_id).slice(0, 8)}</span> : null}
                      <span style={courseTag}><b>Created:</b> {date(item.created_at)}</span>
                      <span style={courseTag}><b>Updated:</b> {date(item.updated_at || item.created_at)}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div
            style={{
              border: '1px dashed #cbd5e1',
              borderRadius: 24,
              padding: 26,
              background: 'linear-gradient(135deg,#f8fafc,#ffffff)',
              color: '#64748b',
              fontWeight: 850,
            }}
          >
            <strong style={{ display: 'block', color: '#0f172a', fontSize: 16, marginBottom: 8 }}>
              No active course enrollment yet.
            </strong>
            <p style={{ margin: '0 0 16px', lineHeight: 1.7 }}>
              Assign this trainee to a course through the enrollment command page, then the course path will sync here automatically.
            </p>
            <Link
              href={`/academy/enrollments?modal=create&trainee_id=${encodeURIComponent(trainee.id)}`}
              style={{
                display: 'inline-flex',
                textDecoration: 'none',
                border: '1px solid #355df6',
                background: 'linear-gradient(135deg,#355df6,#7c3aed)',
                color: '#fff',
                borderRadius: 16,
                padding: '12px 15px',
                fontSize: 12,
                fontWeight: 950,
                boxShadow: '0 16px 28px rgba(53,93,246,.22)',
              }}
            >
              Assign course
            </Link>
          </div>
        )}
      </div>
    </Card>
  )
}

const courseMiniCell: CSSProperties = {
  border: '1px solid #e6edf7',
  borderRadius: 18,
  background: 'rgba(255,255,255,.86)',
  backdropFilter: 'blur(8px)',
  padding: '12px 14px',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.75)',
}

const courseMiniLabel: CSSProperties = {
  display: 'block',
  color: '#94a3b8',
  fontSize: 10,
  fontWeight: 950,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
}

const courseMiniValue: CSSProperties = {
  display: 'block',
  marginTop: 6,
  fontSize: 15,
  fontWeight: 950,
  letterSpacing: '-.03em',
  color: '#0f172a',
  wordBreak: 'break-word',
}

const courseTag: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  borderRadius: 999,
  padding: '8px 11px',
  background: '#ffffffd9',
  border: '1px solid #e5edf7',
  color: '#334155',
  fontSize: 11,
  fontWeight: 850,
}

const courseSummaryCell: CSSProperties = {
  border: '1px solid #dfe8f5',
  borderRadius: 18,
  background: 'rgba(255,255,255,.82)',
  backdropFilter: 'blur(10px)',
  padding: '12px 14px',
  boxShadow: '0 10px 24px rgba(15,23,42,.04)',
}

const courseSummaryLabel: CSSProperties = {
  display: 'block',
  color: '#64748b',
  fontSize: 10,
  fontWeight: 950,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
}

const courseSummaryValue: CSSProperties = {
  display: 'block',
  marginTop: 7,
  fontSize: 24,
  fontWeight: 950,
  letterSpacing: '-.05em',
}

function Courses({
  trainee,
  active,
  courses,
  enrollments,
}: {
  trainee: Trainee
  active: SectionKey
  courses: AnyRow[]
  enrollments: AnyRow[]
}) {
  const m = meta(trainee)

  return (
    <FormShell trainee={trainee} active={active}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 18 }}>
        <Card style={{ padding: 24 }}>
          <h2 style={{ margin: '0 0 18px', fontSize: 22 }}>Course Path & Skill Architecture</h2>
          <div style={{ display: 'grid', gap: 14 }}>
            <Field label="Course path" name="course_path" defaultValue={m.course_path || m.desired_program} />
            <SelectField label="Course level" name="course_level" defaultValue={m.course_level} options={['', 'starter', 'foundation', 'operational', 'advanced', 'professional']} />
            <Field label="Trainer preference / owner" name="trainer_preference" defaultValue={m.trainer_preference} />
            <TextArea label="Skill targets" name="skill_targets" defaultValue={m.skill_targets} rows={5} />
            <TextArea label="Course manager notes" name="course_notes" defaultValue={m.course_notes} rows={5} />
          </div>
        </Card>

        <CoursePathRecordsPanel trainee={trainee} enrollments={enrollments} courses={courses} />
      </div>
    </FormShell>
  )
}


function attendanceStatusTone(value: unknown): 'blue' | 'green' | 'orange' | 'rose' | 'purple' | 'slate' {
  const status = text(value).toLowerCase()
  if (status.includes('present') || status.includes('completed') || status.includes('validated')) return 'green'
  if (status.includes('late') || status.includes('makeup')) return 'orange'
  if (status.includes('absent') || status.includes('risk') || status.includes('disciplinary')) return 'rose'
  if (status.includes('excused')) return 'purple'
  if (status.includes('scheduled') || status.includes('session')) return 'blue'
  return 'slate'
}

function attendanceStatusLabel(row: AnyRow) {
  return text(row.status || row.attendance_status || row.presence_status || '').trim() || 'N/A'
}

function attendanceSessionLabel(row: AnyRow) {
  return text(row.session_label || row.session_id || row.session || row.course_session || row.reference || '').trim() || 'N/A'
}

function attendanceNotes(row: AnyRow) {
  return text(row.notes || row.comment || row.reason || row.description || '').trim() || 'N/A'
}

function attendanceDate(row: AnyRow) {
  const value = text(row.attended_at || row.session_date || row.date || row.created_at || '')
  return value ? date(value) : 'N/A'
}

function AttendanceRecordsPanel({
  trainee,
  attendance,
}: {
  trainee: Trainee
  attendance: AnyRow[]
}) {
  const presentCount = attendance.filter((item) => {
    const status = attendanceStatusLabel(item).toLowerCase()
    return status.includes('present') || status.includes('completed') || status.includes('validated')
  }).length

  const riskCount = attendance.filter((item) => {
    const status = attendanceStatusLabel(item).toLowerCase()
    return status.includes('absent') || status.includes('risk') || status.includes('late') || status.includes('disciplinary')
  }).length

  const excusedCount = attendance.filter((item) => attendanceStatusLabel(item).toLowerCase().includes('excused')).length

  return (
    <Card
      style={{
        padding: 0,
        minHeight: 380,
        overflow: 'hidden',
        background: 'linear-gradient(180deg,#ffffff 0%,#f8fbff 58%,#f7faff 100%)',
        border: '1px solid #dfe9f7',
        boxShadow: '0 24px 60px rgba(15,23,42,.08)',
      }}
    >
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: 26,
          borderBottom: '1px solid #e8eef8',
          background: 'linear-gradient(135deg,#ffffff 0%,#f0fdfa 46%,#eef4ff 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -44,
            top: -54,
            width: 190,
            height: 190,
            borderRadius: '50%',
            background: 'radial-gradient(circle at center, rgba(8,145,178,.16), rgba(8,145,178,0))',
          }}
        />

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: 20, letterSpacing: '-.04em' }}>Active Attendance Records</h3>
              <Pill tone="blue">live synced</Pill>
              <Pill tone="purple">{attendance.length} log{attendance.length > 1 ? 's' : ''}</Pill>
            </div>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 13, fontWeight: 850 }}>
              Synced from academy_attendance for this trainee dossier.
            </p>
          </div>

          <Link
            href={`/academy/attendance?trainee_id=${encodeURIComponent(trainee.id)}`}
            style={{
              textDecoration: 'none',
              border: '1px solid #0891b2',
              background: 'linear-gradient(135deg,#0891b2,#06b6d4)',
              color: '#fff',
              borderRadius: 18,
              padding: '14px 16px',
              fontSize: 13,
              fontWeight: 950,
              boxShadow: '0 18px 32px rgba(8,145,178,.24)',
              whiteSpace: 'nowrap',
            }}
          >
            Attendance center
          </Link>
        </div>

        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12, marginTop: 18 }}>
          <div style={attendanceSummaryCell}>
            <span style={attendanceSummaryLabel}>Present</span>
            <strong style={{ ...attendanceSummaryValue, color: '#16a34a' }}>{presentCount}</strong>
          </div>
          <div style={attendanceSummaryCell}>
            <span style={attendanceSummaryLabel}>Absent / Risk</span>
            <strong style={{ ...attendanceSummaryValue, color: '#e11d48' }}>{riskCount}</strong>
          </div>
          <div style={attendanceSummaryCell}>
            <span style={attendanceSummaryLabel}>Excused</span>
            <strong style={{ ...attendanceSummaryValue, color: '#7c3aed' }}>{excusedCount}</strong>
          </div>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {attendance.length ? (
          <div style={{ display: 'grid', gap: 14 }}>
            {attendance.map((item) => {
              const status = attendanceStatusLabel(item)
              const tone = attendanceStatusTone(status)

              const palette = {
                blue: { line: '#2563eb', glow: 'rgba(37,99,235,.16)', soft: '#eff6ff', pill: 'blue' as const, accent: '#1d4ed8' },
                green: { line: '#16a34a', glow: 'rgba(22,163,74,.15)', soft: '#ecfdf5', pill: 'green' as const, accent: '#15803d' },
                orange: { line: '#ea580c', glow: 'rgba(234,88,12,.16)', soft: '#fff7ed', pill: 'orange' as const, accent: '#c2410c' },
                rose: { line: '#e11d48', glow: 'rgba(225,29,72,.16)', soft: '#fff1f2', pill: 'rose' as const, accent: '#be123c' },
                purple: { line: '#7c3aed', glow: 'rgba(124,58,237,.16)', soft: '#f5f3ff', pill: 'purple' as const, accent: '#6d28d9' },
                slate: { line: '#64748b', glow: 'rgba(100,116,139,.14)', soft: '#f8fafc', pill: 'slate' as const, accent: '#475569' },
              }[tone]

              return (
                <Link
                  key={item.id || `${status}-${item.created_at}`}
                  href={`/academy/attendance?trainee_id=${encodeURIComponent(trainee.id)}&attendance=${encodeURIComponent(text(item.id))}`}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'block',
                    textDecoration: 'none',
                    color: '#0f172a',
                    border: '1px solid #deebf7',
                    borderLeft: `6px solid ${palette.line}`,
                    borderRadius: 24,
                    background: `linear-gradient(135deg,#ffffff 0%,${palette.soft} 100%)`,
                    padding: 18,
                    boxShadow: `0 18px 40px ${palette.glow}`,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      right: -30,
                      top: -36,
                      width: 130,
                      height: 130,
                      borderRadius: '50%',
                      background: `radial-gradient(circle at center, ${palette.glow}, rgba(255,255,255,0))`,
                    }}
                  />

                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <strong style={{ display: 'block', fontSize: 15, letterSpacing: '.02em' }}>
                          {attendanceSessionLabel(item)}
                        </strong>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            borderRadius: 999,
                            padding: '6px 10px',
                            background: '#ffffffcc',
                            border: `1px solid ${palette.line}22`,
                            color: palette.accent,
                            fontSize: 10,
                            fontWeight: 950,
                            textTransform: 'uppercase',
                            letterSpacing: '.05em',
                          }}
                        >
                          ● open attendance record
                        </span>
                      </div>

                      <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 13, fontWeight: 850 }}>
                        {attendanceDate(item)} · {text(item.course_id || item.group_id || item.location || '').trim() || 'N/A'}
                      </p>
                    </div>

                    <Pill tone={palette.pill}>{status}</Pill>
                  </div>

                  <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, marginTop: 16 }}>
                    <div style={attendanceMiniCell}>
                      <span style={attendanceMiniLabel}>Status</span>
                      <strong style={attendanceMiniValue}>{status}</strong>
                    </div>
                    <div style={attendanceMiniCell}>
                      <span style={attendanceMiniLabel}>Session</span>
                      <strong style={attendanceMiniValue}>{text(item.session_id || item.group_id || '').trim() || 'N/A'}</strong>
                    </div>
                    <div style={attendanceMiniCell}>
                      <span style={attendanceMiniLabel}>Source</span>
                      <strong style={attendanceMiniValue}>academy_attendance</strong>
                    </div>
                  </div>

                  <div style={{ position: 'relative', marginTop: 14, display: 'grid', gap: 8 }}>
                    <p style={{ margin: 0, color: '#334155', fontSize: 12, fontWeight: 850, lineHeight: 1.55 }}>
                      {attendanceNotes(item)}
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={attendanceTag}><b>Created:</b> {text(item.created_at || '').trim() ? date(item.created_at) : 'N/A'}</span>
                      <span style={attendanceTag}><b>Updated:</b> {text(item.updated_at || '').trim() ? date(item.updated_at) : 'N/A'}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div
            style={{
              border: '1px dashed #cbd5e1',
              borderRadius: 24,
              padding: 26,
              background: 'linear-gradient(135deg,#f8fafc,#ffffff)',
              color: '#64748b',
              fontWeight: 850,
            }}
          >
            <strong style={{ display: 'block', color: '#0f172a', fontSize: 16, marginBottom: 8 }}>
              No synced attendance record yet.
            </strong>
            <p style={{ margin: '0 0 16px', lineHeight: 1.7 }}>
              Save an attendance note from the control form or create presence records from the Academy attendance center.
            </p>
            <Link
              href={`/academy/attendance?trainee_id=${encodeURIComponent(trainee.id)}`}
              style={{
                display: 'inline-flex',
                textDecoration: 'none',
                border: '1px solid #0891b2',
                background: 'linear-gradient(135deg,#0891b2,#06b6d4)',
                color: '#fff',
                borderRadius: 16,
                padding: '12px 15px',
                fontSize: 12,
                fontWeight: 950,
                boxShadow: '0 16px 28px rgba(8,145,178,.22)',
              }}
            >
              Open attendance center
            </Link>
          </div>
        )}
      </div>
    </Card>
  )
}

const attendanceMiniCell: CSSProperties = {
  border: '1px solid #e6edf7',
  borderRadius: 18,
  background: 'rgba(255,255,255,.86)',
  backdropFilter: 'blur(8px)',
  padding: '12px 14px',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.75)',
}

const attendanceMiniLabel: CSSProperties = {
  display: 'block',
  color: '#94a3b8',
  fontSize: 10,
  fontWeight: 950,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
}

const attendanceMiniValue: CSSProperties = {
  display: 'block',
  marginTop: 6,
  fontSize: 16,
  fontWeight: 950,
  letterSpacing: '-.03em',
  color: '#0f172a',
  wordBreak: 'break-word',
}

const attendanceTag: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  borderRadius: 999,
  padding: '8px 11px',
  background: '#ffffffd9',
  border: '1px solid #e5edf7',
  color: '#334155',
  fontSize: 11,
  fontWeight: 850,
}

const attendanceSummaryCell: CSSProperties = {
  border: '1px solid #dfe8f5',
  borderRadius: 18,
  background: 'rgba(255,255,255,.82)',
  backdropFilter: 'blur(10px)',
  padding: '12px 14px',
  boxShadow: '0 10px 24px rgba(15,23,42,.04)',
}

const attendanceSummaryLabel: CSSProperties = {
  display: 'block',
  color: '#64748b',
  fontSize: 10,
  fontWeight: 950,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
}

const attendanceSummaryValue: CSSProperties = {
  display: 'block',
  marginTop: 7,
  fontSize: 24,
  fontWeight: 950,
  letterSpacing: '-.05em',
}


function Attendance({ trainee, active, attendance }: { trainee: Trainee; active: SectionKey; attendance: AnyRow[] }) {
  const m = meta(trainee)
  const present = attendance.filter(a => attendanceStatusLabel(a).toLowerCase().includes('present')).length
  const absent = attendance.filter(a => {
    const status = attendanceStatusLabel(a).toLowerCase()
    return status.includes('absent') || status.includes('risk') || status.includes('late')
  }).length

  return (
    <FormShell trainee={trainee} active={active}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 16, marginBottom: 18 }}>
        <Insight icon="✅" label="Present" value={String(present)} sub="presence records" color="#16a34a" />
        <Insight icon="⚠️" label="Absent / risk" value={String(absent)} sub="risk records" color="#e11d48" />
        <Insight icon="📊" label="Total logs" value={String(attendance.length)} sub="academy_attendance" color="#355df6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '.92fr 1.08fr', gap: 18 }}>
        <Card style={{ padding: 24 }}>
          <h2 style={{ margin: '0 0 18px', fontSize: 22 }}>Attendance Discipline Control</h2>
          <div style={{ display: 'grid', gap: 14 }}>
            <SelectField label="Attendance policy" name="attendance_policy" defaultValue={m.attendance_policy} options={['', 'normal', 'watchlist', 'needs_call', 'manager_review', 'disciplinary_followup']} />
            <SelectField label="Attendance risk" name="attendance_risk" defaultValue={m.attendance_risk} options={['', 'low', 'medium', 'high', 'critical']} />
            <SelectField label="Create attendance note" name="create_attendance_note" defaultValue="no" options={['no', 'yes']} />
            <SelectField label="Attendance status" name="attendance_status" defaultValue="present" options={['present', 'late', 'absent', 'excused', 'makeup_required']} />
            <TextArea label="Attendance notes" name="attendance_notes" defaultValue={m.attendance_notes} rows={6} />
          </div>
        </Card>

        <AttendanceRecordsPanel trainee={trainee} attendance={attendance} />
      </div>
    </FormShell>
  )
}

function paymentStatusTone(value: unknown): 'blue' | 'green' | 'orange' | 'rose' | 'purple' | 'slate' {
  const status = text(value).toLowerCase()
  if (status.includes('paid') || status.includes('completed') || status.includes('validated')) return 'green'
  if (status.includes('pending') || status.includes('partial')) return 'orange'
  if (status.includes('refund')) return 'purple'
  if (status.includes('overdue') || status.includes('failed') || status.includes('cancelled')) return 'rose'
  if (status.includes('draft') || status.includes('created')) return 'blue'
  return 'slate'
}

function paymentAmount(row: AnyRow) {
  return number(row.amount || row.amount_mad || row.paid_amount || row.total_amount || row.value)
}

function paymentReference(row: AnyRow) {
  return text(row.reference || row.transaction_id || row.payment_reference || row.ref_code || `PAY-${String(row.id || '').slice(0, 8)}`)
}

function paymentMethod(row: AnyRow) {
  return text(row.method || row.payment_method || row.channel || '—')
}

function paymentStatusLabel(row: AnyRow) {
  return text(row.status || row.payment_status || 'pending')
}

function paymentOpenHref(row: AnyRow) {
  const id = text(row.id)
  return id ? `/academy/payments?payment=${encodeURIComponent(id)}` : '/academy/payments'
}

function PaymentRecordsPanel({
  trainee,
  payments,
}: {
  trainee: Trainee
  payments: AnyRow[]
}) {
  const totalPaid = payments
    .filter((item) => {
      const status = paymentStatusLabel(item).toLowerCase()
      return status.includes('paid') || status.includes('completed') || status.includes('validated')
    })
    .reduce((sum, item) => sum + paymentAmount(item), 0)

  const pendingCount = payments.filter((item) => paymentStatusLabel(item).toLowerCase().includes('pending')).length
  const refundedCount = payments.filter((item) => paymentStatusLabel(item).toLowerCase().includes('refund')).length

  return (
    <Card
      style={{
        padding: 0,
        minHeight: 380,
        overflow: 'hidden',
        background: 'linear-gradient(180deg,#ffffff 0%,#f8fbff 58%,#f7faff 100%)',
        border: '1px solid #dfe9f7',
        boxShadow: '0 24px 60px rgba(15,23,42,.08)',
      }}
    >
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: 26,
          borderBottom: '1px solid #e8eef8',
          background: 'linear-gradient(135deg,#ffffff 0%,#ecfdf5 46%,#eef4ff 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -44,
            top: -54,
            width: 190,
            height: 190,
            borderRadius: '50%',
            background: 'radial-gradient(circle at center, rgba(22,163,74,.16), rgba(22,163,74,0))',
          }}
        />

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: 20, letterSpacing: '-.04em' }}>Active Payment Records</h3>
              <Pill tone="green">live synced</Pill>
              <Pill tone="blue">{payments.length} record{payments.length > 1 ? 's' : ''}</Pill>
            </div>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 13, fontWeight: 850 }}>
              Synced from academy_payments and connected to the Academy payments command page.
            </p>
          </div>

          <Link
            href={`/academy/payments?modal=create&trainee_id=${encodeURIComponent(trainee.id)}`}
            style={{
              textDecoration: 'none',
              border: '1px solid #16a34a',
              background: 'linear-gradient(135deg,#16a34a,#22c55e)',
              color: '#fff',
              borderRadius: 18,
              padding: '14px 16px',
              fontSize: 13,
              fontWeight: 950,
              boxShadow: '0 18px 32px rgba(22,163,74,.25)',
              whiteSpace: 'nowrap',
            }}
          >
            + New payment
          </Link>
        </div>

        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12, marginTop: 18 }}>
          <div style={paymentSummaryCell}>
            <span style={paymentSummaryLabel}>Paid total</span>
            <strong style={{ ...paymentSummaryValue, color: '#16a34a' }}>{money(totalPaid)}</strong>
          </div>
          <div style={paymentSummaryCell}>
            <span style={paymentSummaryLabel}>Pending</span>
            <strong style={{ ...paymentSummaryValue, color: '#ea580c' }}>{pendingCount}</strong>
          </div>
          <div style={paymentSummaryCell}>
            <span style={paymentSummaryLabel}>Refunded</span>
            <strong style={{ ...paymentSummaryValue, color: '#7c3aed' }}>{refundedCount}</strong>
          </div>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {payments.length ? (
          <div style={{ display: 'grid', gap: 14 }}>
            {payments.map((item) => {
              const tone = paymentStatusTone(paymentStatusLabel(item))
              const status = paymentStatusLabel(item)
              const amount = paymentAmount(item)

              const palette = {
                blue: { line: '#2563eb', glow: 'rgba(37,99,235,.16)', soft: '#eff6ff', pill: 'blue' as const, accent: '#1d4ed8' },
                green: { line: '#16a34a', glow: 'rgba(22,163,74,.15)', soft: '#ecfdf5', pill: 'green' as const, accent: '#15803d' },
                orange: { line: '#ea580c', glow: 'rgba(234,88,12,.16)', soft: '#fff7ed', pill: 'orange' as const, accent: '#c2410c' },
                rose: { line: '#e11d48', glow: 'rgba(225,29,72,.16)', soft: '#fff1f2', pill: 'rose' as const, accent: '#be123c' },
                purple: { line: '#7c3aed', glow: 'rgba(124,58,237,.16)', soft: '#f5f3ff', pill: 'purple' as const, accent: '#6d28d9' },
                slate: { line: '#64748b', glow: 'rgba(100,116,139,.14)', soft: '#f8fafc', pill: 'slate' as const, accent: '#475569' },
              }[tone]

              return (
                <Link
                  key={item.id}
                  href={paymentOpenHref(item)}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'block',
                    textDecoration: 'none',
                    color: '#0f172a',
                    border: '1px solid #deebf7',
                    borderLeft: `6px solid ${palette.line}`,
                    borderRadius: 24,
                    background: `linear-gradient(135deg,#ffffff 0%,${palette.soft} 100%)`,
                    padding: 18,
                    boxShadow: `0 18px 40px ${palette.glow}`,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      right: -30,
                      top: -36,
                      width: 130,
                      height: 130,
                      borderRadius: '50%',
                      background: `radial-gradient(circle at center, ${palette.glow}, rgba(255,255,255,0))`,
                    }}
                  />

                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <strong style={{ display: 'block', fontSize: 15, letterSpacing: '.02em' }}>
                          {paymentReference(item)}
                        </strong>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            borderRadius: 999,
                            padding: '6px 10px',
                            background: '#ffffffcc',
                            border: `1px solid ${palette.line}22`,
                            color: palette.accent,
                            fontSize: 10,
                            fontWeight: 950,
                            textTransform: 'uppercase',
                            letterSpacing: '.05em',
                          }}
                        >
                          ● open payment preview
                        </span>
                      </div>

                      <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 13, fontWeight: 850 }}>
                        {money(amount)} · {paymentMethod(item)} · {date(item.paid_at || item.created_at)}
                      </p>
                    </div>

                    <Pill tone={palette.pill}>{status}</Pill>
                  </div>

                  <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, marginTop: 16 }}>
                    <div style={paymentMiniCell}>
                      <span style={paymentMiniLabel}>Amount</span>
                      <strong style={paymentMiniValue}>{money(amount)}</strong>
                    </div>
                    <div style={paymentMiniCell}>
                      <span style={paymentMiniLabel}>Method</span>
                      <strong style={paymentMiniValue}>{paymentMethod(item)}</strong>
                    </div>
                    <div style={paymentMiniCell}>
                      <span style={paymentMiniLabel}>Status</span>
                      <strong style={paymentMiniValue}>{status}</strong>
                    </div>
                  </div>

                  <div style={{ position: 'relative', marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={paymentTag}><b>Currency:</b> {text(item.currency) || 'MAD'}</span>
                    <span style={paymentTag}><b>Ledger:</b> academy_payments</span>
                    <span style={paymentTag}><b>Updated:</b> {date(item.updated_at || item.created_at)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div
            style={{
              border: '1px dashed #cbd5e1',
              borderRadius: 24,
              padding: 26,
              background: 'linear-gradient(135deg,#f8fafc,#ffffff)',
              color: '#64748b',
              fontWeight: 850,
            }}
          >
            <strong style={{ display: 'block', color: '#0f172a', fontSize: 16, marginBottom: 8 }}>
              No synced payment record yet.
            </strong>
            <p style={{ margin: '0 0 16px', lineHeight: 1.7 }}>
              Create a payment from the Academy payments command page and it will appear here automatically for this trainee dossier.
            </p>
            <Link
              href={`/academy/payments?modal=create&trainee_id=${encodeURIComponent(trainee.id)}`}
              style={{
                display: 'inline-flex',
                textDecoration: 'none',
                border: '1px solid #16a34a',
                background: 'linear-gradient(135deg,#16a34a,#22c55e)',
                color: '#fff',
                borderRadius: 16,
                padding: '12px 15px',
                fontSize: 12,
                fontWeight: 950,
                boxShadow: '0 16px 28px rgba(22,163,74,.22)',
              }}
            >
              Create payment
            </Link>
          </div>
        )}
      </div>
    </Card>
  )
}

const paymentMiniCell: CSSProperties = {
  border: '1px solid #e6edf7',
  borderRadius: 18,
  background: 'rgba(255,255,255,.86)',
  backdropFilter: 'blur(8px)',
  padding: '12px 14px',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.75)',
}

const paymentMiniLabel: CSSProperties = {
  display: 'block',
  color: '#94a3b8',
  fontSize: 10,
  fontWeight: 950,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
}

const paymentMiniValue: CSSProperties = {
  display: 'block',
  marginTop: 6,
  fontSize: 16,
  fontWeight: 950,
  letterSpacing: '-.03em',
  color: '#0f172a',
}

const paymentTag: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  borderRadius: 999,
  padding: '8px 11px',
  background: '#ffffffd9',
  border: '1px solid #e5edf7',
  color: '#334155',
  fontSize: 11,
  fontWeight: 850,
}

const paymentSummaryCell: CSSProperties = {
  border: '1px solid #dfe8f5',
  borderRadius: 18,
  background: 'rgba(255,255,255,.82)',
  backdropFilter: 'blur(10px)',
  padding: '12px 14px',
  boxShadow: '0 10px 24px rgba(15,23,42,.04)',
}

const paymentSummaryLabel: CSSProperties = {
  display: 'block',
  color: '#64748b',
  fontSize: 10,
  fontWeight: 950,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
}

const paymentSummaryValue: CSSProperties = {
  display: 'block',
  marginTop: 7,
  fontSize: 24,
  fontWeight: 950,
  letterSpacing: '-.05em',
}


function Payment({ trainee, active, payments }: { trainee: Trainee; active: SectionKey; payments: AnyRow[] }) {
  const m = meta(trainee)

  return (
    <FormShell trainee={trainee} active={active}>
      <div style={{ display: 'grid', gridTemplateColumns: '.95fr 1.05fr', gap: 18 }}>
        <PaymentRecordsPanel trainee={trainee} payments={payments} />

        <Card style={{ padding: 24 }}>
          <h2 style={{ margin: '0 0 18px', fontSize: 22 }}>Payment Plan & Ledger Control</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
            <SelectField label="Payment plan" name="payment_plan" defaultValue={m.payment_plan} options={['', 'full_payment', 'installments_2x', 'installments_3x', 'scholarship', 'partner_paid', 'pending_agreement']} />
            <Field label="Payer name" name="payer_name" defaultValue={m.payer_name} />
            <SelectField label="Payment risk" name="payment_risk" defaultValue={m.payment_risk} options={['', 'low', 'medium', 'high', 'overdue', 'blocked']} />
            <SelectField label="Create payment" name="create_payment" defaultValue="no" options={['no', 'yes']} />
            <Field label="Payment amount MAD" name="payment_amount" type="number" defaultValue="0" />
            <SelectField label="Payment status" name="payment_status" defaultValue="pending" options={['pending', 'paid', 'partial', 'overdue', 'cancelled']} />
            <div style={{ gridColumn: '1/-1' }}>
              <TextArea label="Payment notes" name="payment_notes" defaultValue={m.payment_notes} rows={6} />
            </div>
          </div>
        </Card>
      </div>
    </FormShell>
  )
}

function certificateStatusTone(value: unknown): 'blue' | 'green' | 'orange' | 'rose' | 'purple' | 'slate' {
  const status = text(value).toLowerCase()
  if (status.includes('issued') || status.includes('completed') || status.includes('validated')) return 'green'
  if (status.includes('approved') || status.includes('ready')) return 'blue'
  if (status.includes('pending') || status.includes('draft') || status.includes('review')) return 'orange'
  if (status.includes('blocked') || status.includes('rejected') || status.includes('failed')) return 'rose'
  if (status.includes('graduated') || status.includes('certified')) return 'purple'
  return 'slate'
}

function certificateStatusLabel(row: AnyRow) {
  return text(row.status || row.certificate_status || row.decision || row.certificate_decision || '').trim() || 'N/A'
}

function certificateNumberLabel(row: AnyRow) {
  return text(row.certificate_number || row.number || row.reference || row.ref_code || '').trim() || `CERT-${String(row.id || '').slice(0, 8) || 'N/A'}`
}

function certificateIssueDate(row: AnyRow) {
  const value = text(row.issued_at || row.issue_date || row.validated_at || row.created_at || '')
  return value ? date(value) : 'N/A'
}

function certificateScoreLabel(row: AnyRow) {
  const value = text(row.final_score || row.score || row.grade || row.evaluation_score || '')
  return value || 'N/A'
}

function certificateNotes(row: AnyRow) {
  return text(row.notes || row.description || row.certificate_notes || row.evaluation_notes || '').trim() || 'N/A'
}

function certificateOpenHref(row: AnyRow) {
  const id = text(row.id)
  return id ? `/academy/certificates?certificate=${encodeURIComponent(id)}` : '/academy/certificates'
}

function CertificateRecordsPanel({
  trainee,
  certificates,
}: {
  trainee: Trainee
  certificates: AnyRow[]
}) {
  const issuedCount = certificates.filter((item) => {
    const status = certificateStatusLabel(item).toLowerCase()
    return status.includes('issued') || status.includes('validated') || status.includes('completed')
  }).length

  const pendingCount = certificates.filter((item) => {
    const status = certificateStatusLabel(item).toLowerCase()
    return status.includes('pending') || status.includes('draft') || status.includes('review')
  }).length

  const blockedCount = certificates.filter((item) => {
    const status = certificateStatusLabel(item).toLowerCase()
    return status.includes('blocked') || status.includes('rejected') || status.includes('failed')
  }).length

  return (
    <Card
      style={{
        padding: 0,
        minHeight: 420,
        overflow: 'hidden',
        background: 'linear-gradient(180deg,#ffffff 0%,#f8fbff 58%,#f7faff 100%)',
        border: '1px solid #dfe9f7',
        boxShadow: '0 24px 60px rgba(15,23,42,.08)',
      }}
    >
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: 26,
          borderBottom: '1px solid #e8eef8',
          background: 'linear-gradient(135deg,#ffffff 0%,#fffbeb 44%,#f5f3ff 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -44,
            top: -54,
            width: 190,
            height: 190,
            borderRadius: '50%',
            background: 'radial-gradient(circle at center, rgba(245,158,11,.18), rgba(245,158,11,0))',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -44,
            bottom: -64,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: 'radial-gradient(circle at center, rgba(124,58,237,.11), rgba(124,58,237,0))',
          }}
        />

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: 20, letterSpacing: '-.04em' }}>Active Graduation & Certificate Records</h3>
              <Pill tone="orange">live synced</Pill>
              <Pill tone="purple">{certificates.length} record{certificates.length > 1 ? 's' : ''}</Pill>
            </div>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 13, fontWeight: 850 }}>
              Synced from academy_certificates for this trainee dossier.
            </p>
          </div>

          <Link
            href={`/academy/certificates?modal=create&trainee_id=${encodeURIComponent(trainee.id)}`}
            style={{
              textDecoration: 'none',
              border: '1px solid #f59e0b',
              background: 'linear-gradient(135deg,#f59e0b,#7c3aed)',
              color: '#fff',
              borderRadius: 18,
              padding: '14px 16px',
              fontSize: 13,
              fontWeight: 950,
              boxShadow: '0 18px 32px rgba(245,158,11,.24)',
              whiteSpace: 'nowrap',
            }}
          >
            + Issue certificate
          </Link>
        </div>

        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12, marginTop: 18 }}>
          <div style={certificateSummaryCell}>
            <span style={certificateSummaryLabel}>Issued</span>
            <strong style={{ ...certificateSummaryValue, color: '#16a34a' }}>{issuedCount}</strong>
          </div>
          <div style={certificateSummaryCell}>
            <span style={certificateSummaryLabel}>Pending</span>
            <strong style={{ ...certificateSummaryValue, color: '#ea580c' }}>{pendingCount}</strong>
          </div>
          <div style={certificateSummaryCell}>
            <span style={certificateSummaryLabel}>Blocked</span>
            <strong style={{ ...certificateSummaryValue, color: '#e11d48' }}>{blockedCount}</strong>
          </div>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {certificates.length ? (
          <div style={{ display: 'grid', gap: 14 }}>
            {certificates.map((item) => {
              const status = certificateStatusLabel(item)
              const tone = certificateStatusTone(status)

              const palette = {
                blue: { line: '#2563eb', glow: 'rgba(37,99,235,.16)', soft: '#eff6ff', pill: 'blue' as const, accent: '#1d4ed8' },
                green: { line: '#16a34a', glow: 'rgba(22,163,74,.15)', soft: '#ecfdf5', pill: 'green' as const, accent: '#15803d' },
                orange: { line: '#ea580c', glow: 'rgba(234,88,12,.16)', soft: '#fff7ed', pill: 'orange' as const, accent: '#c2410c' },
                rose: { line: '#e11d48', glow: 'rgba(225,29,72,.16)', soft: '#fff1f2', pill: 'rose' as const, accent: '#be123c' },
                purple: { line: '#7c3aed', glow: 'rgba(124,58,237,.16)', soft: '#f5f3ff', pill: 'purple' as const, accent: '#6d28d9' },
                slate: { line: '#64748b', glow: 'rgba(100,116,139,.14)', soft: '#f8fafc', pill: 'slate' as const, accent: '#475569' },
              }[tone]

              return (
                <Link
                  key={item.id || `${status}-${item.created_at}`}
                  href={certificateOpenHref(item)}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'block',
                    textDecoration: 'none',
                    color: '#0f172a',
                    border: '1px solid #deebf7',
                    borderLeft: `6px solid ${palette.line}`,
                    borderRadius: 24,
                    background: `linear-gradient(135deg,#ffffff 0%,${palette.soft} 100%)`,
                    padding: 18,
                    boxShadow: `0 18px 40px ${palette.glow}`,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      right: -30,
                      top: -36,
                      width: 130,
                      height: 130,
                      borderRadius: '50%',
                      background: `radial-gradient(circle at center, ${palette.glow}, rgba(255,255,255,0))`,
                    }}
                  />

                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <strong style={{ display: 'block', fontSize: 15, letterSpacing: '.02em' }}>
                          {certificateNumberLabel(item)}
                        </strong>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            borderRadius: 999,
                            padding: '6px 10px',
                            background: '#ffffffcc',
                            border: `1px solid ${palette.line}22`,
                            color: palette.accent,
                            fontSize: 10,
                            fontWeight: 950,
                            textTransform: 'uppercase',
                            letterSpacing: '.05em',
                          }}
                        >
                          ● open certificate record
                        </span>
                      </div>

                      <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 13, fontWeight: 850 }}>
                        Issued {certificateIssueDate(item)} · Score {certificateScoreLabel(item)}
                      </p>
                    </div>

                    <Pill tone={palette.pill}>{status}</Pill>
                  </div>

                  <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, marginTop: 16 }}>
                    <div style={certificateMiniCell}>
                      <span style={certificateMiniLabel}>Certificate</span>
                      <strong style={certificateMiniValue}>{certificateNumberLabel(item)}</strong>
                    </div>
                    <div style={certificateMiniCell}>
                      <span style={certificateMiniLabel}>Status</span>
                      <strong style={certificateMiniValue}>{status}</strong>
                    </div>
                    <div style={certificateMiniCell}>
                      <span style={certificateMiniLabel}>Score</span>
                      <strong style={certificateMiniValue}>{certificateScoreLabel(item)}</strong>
                    </div>
                  </div>

                  <div style={{ position: 'relative', marginTop: 14, display: 'grid', gap: 8 }}>
                    <p style={{ margin: 0, color: '#334155', fontSize: 12, fontWeight: 850, lineHeight: 1.55 }}>
                      {certificateNotes(item)}
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={certificateTag}><b>Created:</b> {text(item.created_at || '').trim() ? date(item.created_at) : 'N/A'}</span>
                      <span style={certificateTag}><b>Updated:</b> {text(item.updated_at || '').trim() ? date(item.updated_at) : 'N/A'}</span>
                      <span style={certificateTag}><b>Source:</b> academy_certificates</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div
            style={{
              border: '1px dashed #cbd5e1',
              borderRadius: 24,
              padding: 26,
              background: 'linear-gradient(135deg,#f8fafc,#ffffff)',
              color: '#64748b',
              fontWeight: 850,
            }}
          >
            <strong style={{ display: 'block', color: '#0f172a', fontSize: 16, marginBottom: 8 }}>
              No synced certificate record yet.
            </strong>
            <p style={{ margin: '0 0 16px', lineHeight: 1.7 }}>
              Issue or prepare a certificate from the Academy certificates command page, then it will appear here automatically.
            </p>
            <Link
              href={`/academy/certificates?modal=create&trainee_id=${encodeURIComponent(trainee.id)}`}
              style={{
                display: 'inline-flex',
                textDecoration: 'none',
                border: '1px solid #f59e0b',
                background: 'linear-gradient(135deg,#f59e0b,#7c3aed)',
                color: '#fff',
                borderRadius: 16,
                padding: '12px 15px',
                fontSize: 12,
                fontWeight: 950,
                boxShadow: '0 16px 28px rgba(245,158,11,.22)',
              }}
            >
              Issue certificate
            </Link>
          </div>
        )}
      </div>
    </Card>
  )
}

const certificateMiniCell: CSSProperties = {
  border: '1px solid #e6edf7',
  borderRadius: 18,
  background: 'rgba(255,255,255,.86)',
  backdropFilter: 'blur(8px)',
  padding: '12px 14px',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.75)',
}

const certificateMiniLabel: CSSProperties = {
  display: 'block',
  color: '#94a3b8',
  fontSize: 10,
  fontWeight: 950,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
}

const certificateMiniValue: CSSProperties = {
  display: 'block',
  marginTop: 6,
  fontSize: 15,
  fontWeight: 950,
  letterSpacing: '-.03em',
  color: '#0f172a',
  wordBreak: 'break-word',
}

const certificateTag: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  borderRadius: 999,
  padding: '8px 11px',
  background: '#ffffffd9',
  border: '1px solid #e5edf7',
  color: '#334155',
  fontSize: 11,
  fontWeight: 850,
}

const certificateSummaryCell: CSSProperties = {
  border: '1px solid #dfe8f5',
  borderRadius: 18,
  background: 'rgba(255,255,255,.82)',
  backdropFilter: 'blur(10px)',
  padding: '12px 14px',
  boxShadow: '0 10px 24px rgba(15,23,42,.04)',
}

const certificateSummaryLabel: CSSProperties = {
  display: 'block',
  color: '#64748b',
  fontSize: 10,
  fontWeight: 950,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
}

const certificateSummaryValue: CSSProperties = {
  display: 'block',
  marginTop: 7,
  fontSize: 24,
  fontWeight: 950,
  letterSpacing: '-.05em',
}

function Graduation({
  trainee,
  active,
  certificates,
}: {
  trainee: Trainee
  active: SectionKey
  certificates: AnyRow[]
}) {
  const m = meta(trainee)

  return (
    <FormShell trainee={trainee} active={active}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 18 }}>
        <Card style={{ padding: 24 }}>
          <h2 style={{ margin: '0 0 18px', fontSize: 22 }}>Graduation & Certification Readiness</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
            <SelectField label="Evaluation status" name="evaluation_status" defaultValue={m.evaluation_status} options={['', 'not_started', 'in_progress', 'passed', 'failed', 'needs_makeup', 'manager_review']} />
            <SelectField label="Graduation status" name="graduation_status" defaultValue={m.graduation_status} options={['', 'not_ready', 'ready', 'graduated', 'blocked', 'pending_payment', 'pending_attendance']} />
            <Field label="Final score" name="final_score" type="number" defaultValue={m.final_score || 0} />
            <SelectField label="Certificate decision" name="certificate_decision" defaultValue={m.certificate_decision} options={['', 'pending', 'approved', 'issued', 'blocked', 'needs_review']} />
            <SelectField label="Issue certificate signal" name="issue_certificate_signal" defaultValue="no" options={['no', 'yes']} />
            <div />
            <div style={{ gridColumn: '1/-1' }}>
              <TextArea label="Graduation notes" name="graduation_notes" defaultValue={m.graduation_notes} rows={6} />
            </div>
          </div>
        </Card>

        <CertificateRecordsPanel trainee={trainee} certificates={certificates} />
      </div>
    </FormShell>
  )
}





function PlacementCasesPanel({
  trainee,
  cases,
  actions,
}: {
  trainee: Trainee
  cases: AnyRow[]
  actions: AnyRow[]
}) {
  const actionCountByCase = new Map<string, number>()
  const latestActionByCase = new Map<string, AnyRow>()

  actions.forEach((action) => {
    const caseId = text(action.case_id)
    if (!caseId) return
    actionCountByCase.set(caseId, (actionCountByCase.get(caseId) || 0) + 1)
    if (!latestActionByCase.has(caseId)) latestActionByCase.set(caseId, action)
  })

  const interviewingCount = cases.filter((item) => text(item.status).toLowerCase().includes('interview')).length
  const placedCount = cases.filter((item) => text(item.status).toLowerCase().includes('placed')).length
  const outreachCount = cases.filter((item) => text(item.status).toLowerCase().includes('outreach')).length

  return (
    <Card
      style={{
        padding: 0,
        minHeight: 380,
        overflow: 'hidden',
        background: 'linear-gradient(180deg,#ffffff 0%,#f8fbff 58%,#f7faff 100%)',
        border: '1px solid #dfe9f7',
        boxShadow: '0 24px 60px rgba(15,23,42,.08)',
      }}
    >
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: 26,
          borderBottom: '1px solid #e8eef8',
          background: 'linear-gradient(135deg,#ffffff 0%,#eef4ff 54%,#f7fbff 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -40,
            top: -50,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'radial-gradient(circle at center, rgba(53,93,246,.14), rgba(53,93,246,0))',
          }}
        />

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: 20, letterSpacing: '-.04em' }}>Active Job Placement Cases</h3>
              <Pill tone="blue">live synced</Pill>
              <Pill tone="purple">{cases.length} case{cases.length > 1 ? 's' : ''}</Pill>
            </div>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 13, fontWeight: 850 }}>
              Synced from academy_placement_cases for this trainee dossier.
            </p>
          </div>

          <Link
            href={`/academy/job-placement?modal=new-placement&trainee=${encodeURIComponent(trainee.id)}`}
            style={{
              textDecoration: 'none',
              border: '1px solid #355df6',
              background: 'linear-gradient(135deg,#355df6,#5b7cff)',
              color: '#fff',
              borderRadius: 18,
              padding: '14px 16px',
              fontSize: 13,
              fontWeight: 950,
              boxShadow: '0 18px 32px rgba(53,93,246,.28)',
              whiteSpace: 'nowrap',
            }}
          >
            + New case
          </Link>
        </div>

        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12, marginTop: 18 }}>
          <div style={placementSummaryCell}>
            <span style={placementSummaryLabel}>Interviewing</span>
            <strong style={{ ...placementSummaryValue, color: '#ea580c' }}>{interviewingCount}</strong>
          </div>
          <div style={placementSummaryCell}>
            <span style={placementSummaryLabel}>Placed</span>
            <strong style={{ ...placementSummaryValue, color: '#16a34a' }}>{placedCount}</strong>
          </div>
          <div style={placementSummaryCell}>
            <span style={placementSummaryLabel}>Outreach</span>
            <strong style={{ ...placementSummaryValue, color: '#2563eb' }}>{outreachCount}</strong>
          </div>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {cases.length ? (
          <div style={{ display: 'grid', gap: 14 }}>
            {cases.map((item) => {
              const tone = placementStatusTone(item.status)
              const latest = latestActionByCase.get(text(item.id))
              const actionCount = actionCountByCase.get(text(item.id)) || 0
              const status = placementStatusLabel(item.status)

              const palette = {
                blue: { line: '#2563eb', glow: 'rgba(37,99,235,.16)', soft: '#eff6ff', pill: 'blue' as const, accent: '#1d4ed8' },
                green: { line: '#16a34a', glow: 'rgba(22,163,74,.15)', soft: '#ecfdf5', pill: 'green' as const, accent: '#15803d' },
                orange: { line: '#ea580c', glow: 'rgba(234,88,12,.16)', soft: '#fff7ed', pill: 'orange' as const, accent: '#c2410c' },
                rose: { line: '#e11d48', glow: 'rgba(225,29,72,.16)', soft: '#fff1f2', pill: 'rose' as const, accent: '#be123c' },
                purple: { line: '#7c3aed', glow: 'rgba(124,58,237,.16)', soft: '#f5f3ff', pill: 'purple' as const, accent: '#6d28d9' },
                slate: { line: '#64748b', glow: 'rgba(100,116,139,.14)', soft: '#f8fafc', pill: 'slate' as const, accent: '#475569' },
              }[tone]

              return (
                <Link
                  key={item.id}
                  href={`/academy/job-placement?case=${encodeURIComponent(text(item.id))}&modal=case-management`}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'block',
                    textDecoration: 'none',
                    color: '#0f172a',
                    border: '1px solid #deebf7',
                    borderLeft: `6px solid ${palette.line}`,
                    borderRadius: 24,
                    background: `linear-gradient(135deg,#ffffff 0%,${palette.soft} 100%)`,
                    padding: 18,
                    boxShadow: `0 18px 40px ${palette.glow}`,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      right: -30,
                      top: -36,
                      width: 130,
                      height: 130,
                      borderRadius: '50%',
                      background: `radial-gradient(circle at center, ${palette.glow}, rgba(255,255,255,0))`,
                    }}
                  />

                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <strong style={{ display: 'block', fontSize: 15, letterSpacing: '.02em' }}>
                          {text(item.ref_code) || `CASE-${String(item.id).slice(0, 8)}`}
                        </strong>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            borderRadius: 999,
                            padding: '6px 10px',
                            background: '#ffffffcc',
                            border: `1px solid ${palette.line}22`,
                            color: palette.accent,
                            fontSize: 10,
                            fontWeight: 950,
                            textTransform: 'uppercase',
                            letterSpacing: '.05em',
                          }}
                        >
                          ● open preview
                        </span>
                      </div>

                      <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 13, fontWeight: 850 }}>
                        {text(item.preferred_role) || 'N/A'} · {text(item.target_city) || trainee.city || 'N/A'}
                      </p>
                    </div>

                    <Pill tone={palette.pill}>{status}</Pill>
                  </div>

                  <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, marginTop: 16 }}>
                    <div style={placementMiniCell}>
                      <span style={placementMiniLabel}>Score</span>
                      <strong style={placementMiniValue}>{number(item.match_score || 0)}%</strong>
                    </div>
                    <div style={placementMiniCell}>
                      <span style={placementMiniLabel}>Priority</span>
                      <strong style={placementMiniValue}>{text(item.priority) || 'N/A'}</strong>
                    </div>
                    <div style={placementMiniCell}>
                      <span style={placementMiniLabel}>Actions</span>
                      <strong style={placementMiniValue}>{actionCount}</strong>
                    </div>
                  </div>

                  <div style={{ position: 'relative', marginTop: 14, display: 'grid', gap: 7 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={placementTag}><b>Advisor:</b> {text(item.advisor_name) || 'N/A'}</span>
                      <span style={placementTag}><b>Availability:</b> {text(item.availability) || 'N/A'}</span>
                    </div>

                    <p style={{ margin: 0, color: '#64748b', fontSize: 12, fontWeight: 850, lineHeight: 1.5 }}>
                      Latest action: {latest ? text(latest.title || latest.action_type) : 'N/A'} · Updated {text(item.updated_at || item.created_at || '').trim() ? date(item.updated_at || item.created_at) : 'N/A'}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div
            style={{
              border: '1px dashed #cbd5e1',
              borderRadius: 24,
              padding: 26,
              background: 'linear-gradient(135deg,#f8fafc,#ffffff)',
              color: '#64748b',
              fontWeight: 850,
            }}
          >
            <strong style={{ display: 'block', color: '#0f172a', fontSize: 16, marginBottom: 8 }}>
              No active placement case yet.
            </strong>
            <p style={{ margin: '0 0 16px', lineHeight: 1.7 }}>
              Create a managed placement case to sync this trainee with the Job Placement command center, action logs, partner matching, and status pipeline.
            </p>
            <Link
              href={`/academy/job-placement?modal=new-placement&trainee=${encodeURIComponent(trainee.id)}`}
              style={{
                display: 'inline-flex',
                textDecoration: 'none',
                border: '1px solid #355df6',
                background: 'linear-gradient(135deg,#355df6,#5b7cff)',
                color: '#fff',
                borderRadius: 16,
                padding: '12px 15px',
                fontSize: 12,
                fontWeight: 950,
                boxShadow: '0 16px 28px rgba(53,93,246,.22)',
              }}
            >
              Create placement case
            </Link>
          </div>
        )}
      </div>
    </Card>
  )
}

const placementMiniCell: CSSProperties = {
  border: '1px solid #e6edf7',
  borderRadius: 18,
  background: 'rgba(255,255,255,.86)',
  backdropFilter: 'blur(8px)',
  padding: '12px 14px',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.75)',
}

const placementMiniLabel: CSSProperties = {
  display: 'block',
  color: '#94a3b8',
  fontSize: 10,
  fontWeight: 950,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
}

const placementMiniValue: CSSProperties = {
  display: 'block',
  marginTop: 6,
  fontSize: 16,
  fontWeight: 950,
  letterSpacing: '-.03em',
  color: '#0f172a',
}

const placementTag: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  borderRadius: 999,
  padding: '8px 11px',
  background: '#ffffffd9',
  border: '1px solid #e5edf7',
  color: '#334155',
  fontSize: 11,
  fontWeight: 850,
}

const placementSummaryCell: CSSProperties = {
  border: '1px solid #dfe8f5',
  borderRadius: 18,
  background: 'rgba(255,255,255,.82)',
  backdropFilter: 'blur(10px)',
  padding: '12px 14px',
  boxShadow: '0 10px 24px rgba(15,23,42,.04)',
}

const placementSummaryLabel: CSSProperties = {
  display: 'block',
  color: '#64748b',
  fontSize: 10,
  fontWeight: 950,
  textTransform: 'uppercase',
  letterSpacing: '.06em',
}

const placementSummaryValue: CSSProperties = {
  display: 'block',
  marginTop: 7,
  fontSize: 24,
  fontWeight: 950,
  letterSpacing: '-.05em',
}


function JobPlacement({
  trainee,
  active,
  followups,
  placementCases,
  placementActions,
}: {
  trainee: Trainee
  active: SectionKey
  followups: AnyRow[]
  placementCases: AnyRow[]
  placementActions: AnyRow[]
}) {
  const m = meta(trainee)

  return (
    <FormShell trainee={trainee} active={active}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 18 }}>
        <Card style={{ padding: 24 }}>
          <h2 style={{ margin: '0 0 18px', fontSize: 22 }}>Job Placement & Partner Matching</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
            <SelectField label="Placement status" name="placement_status" defaultValue={m.placement_status} options={['', 'not_started', 'profile_ready', 'matched', 'interviewing', 'placed', 'rejected', 'follow_up', 'watchlist']} />
            <SelectField label="Employer type" name="preferred_employer_type" defaultValue={m.preferred_employer_type} options={['', 'kindergarten', 'preschool', 'home_nanny', 'events_kids_leader', 'excursion_support', 'nursery', 'private_family']} />
            <Field label="Target city" name="target_city" defaultValue={m.target_city || trainee.city} />
            <SelectField label="Availability" name="availability" defaultValue={m.availability} options={['', 'immediate', 'within_7_days', 'within_30_days', 'weekends_only', 'part_time', 'full_time']} />
            <div style={{ gridColumn: '1/-1' }}>
              <TextArea label="Placement notes" name="placement_notes" defaultValue={m.placement_notes} rows={7} />
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <RelatedList
              title="Legacy Placement Follow-ups"
              rows={followups}
              empty="No legacy placement follow-up yet."
              fields={['status', 'partner_id', 'notes']}
            />
          </div>
        </Card>

        <PlacementCasesPanel trainee={trainee} cases={placementCases} actions={placementActions} />
      </div>
    </FormShell>
  )
}

function renderSection(active: SectionKey, trainee: Trainee, data: { enrollments: AnyRow[]; payments: AnyRow[]; attendance: AnyRow[]; certificates: AnyRow[]; followups: AnyRow[]; courses: AnyRow[]; placementCases: AnyRow[]; placementActions: AnyRow[] }) {
  if (active === 'background') return <Background trainee={trainee} active={active} />
  if (active === 'enrollment-details') return <EnrollmentDetails trainee={trainee} active={active} enrollments={data.enrollments} courses={data.courses} />
  if (active === 'courses') return <Courses trainee={trainee} active={active} courses={data.courses} enrollments={data.enrollments} />
  if (active === 'attendance') return <Attendance trainee={trainee} active={active} attendance={data.attendance} />
  if (active === 'payment') return <Payment trainee={trainee} active={active} payments={data.payments} />
  if (active === 'graduation') return <Graduation trainee={trainee} active={active} certificates={data.certificates} />
  if (active === 'job-placement') return <JobPlacement trainee={trainee} active={active} followups={data.followups} placementCases={data.placementCases} placementActions={data.placementActions} />
  return <PersonalInfo trainee={trainee} active={active} />
}

export default async function Page({ params, searchParams }: PageProps) {
  await requireAccess('academy.view')
  const { id } = await params
  const sp = searchParams ? await searchParams : {}
  const active = activeSection(sp?.section)
  const supabase = await createClient()
  const { data: trainee } = await supabase.from('academy_trainees').select('*').eq('id', id).maybeSingle()
  if (!trainee) redirect('/academy/trainees')

  const [enrollments, payments, attendance, certificates, followups, courses, placementCases] = await Promise.all([
    tableList(supabase, 'academy_enrollments', id),
    tableList(supabase, 'academy_payments', id),
    tableList(supabase, 'academy_attendance', id),
    tableList(supabase, 'academy_certificates', id),
    tableList(supabase, 'academy_graduation_followups', id),
    (async () => { const { data } = await supabase.from('academy_courses').select('*').order('created_at', { ascending: false }).limit(8); return data || [] })(),
    tableList(supabase, 'academy_placement_cases', id),
  ])
  const placementActions = await placementCaseActionsList(supabase, placementCases.map((item: AnyRow) => text(item.id)).filter(Boolean))
  const t = trainee as Trainee
  const m = meta(t)
  const paid = payments.reduce((s: any, p: any) => s + number(p.amount || p.amount_mad || p.paid_amount), 0)
  const current = sections.find(s => s[0] === active) || sections[0]

  return <main style={{ minHeight: '100vh', background: '#f6f8fb', color: '#0f172a', fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
    <div style={{ display: 'flex' }}><Sidebar />
      <section style={{ flex: 1, padding: 24, overflow: 'hidden' }}>
        <header style={{ minHeight: 82, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}><div style={{ width: 58, height: 58, borderRadius: 20, background: '#eef2ff', color: '#355df6', display: 'grid', placeItems: 'center', fontWeight: 950, fontSize: 20, border: '1px solid #dbeafe' }}>{initials(t)}</div><div><div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}><h1 style={{ margin: 0, fontSize: 32, letterSpacing: '-.06em' }}>{label(t)}</h1><Pill tone="blue">advanced live edit</Pill><Pill tone={sp?.saved ? 'green' : 'purple'}>{sp?.saved ? 'saved' : current[1]}</Pill></div><p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 13, fontWeight: 800 }}>Unified Academy trainee dossier • ID {String(t.id).slice(0, 8)} • Created {date(t.created_at)}</p></div></div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><Link href={`/academy/trainees?open=${t.id}`} style={{ textDecoration: 'none', border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', borderRadius: 15, padding: '14px 18px', fontWeight: 950 }}>Back to dossier</Link><Link href="/academy/trainees" style={{ textDecoration: 'none', border: '1px solid #e2e8f0', background: '#0f172a', color: '#fff', borderRadius: 15, padding: '14px 18px', fontWeight: 950 }}>Back to registry</Link></div>
        </header>

        <SectionNav id={id} active={active} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 14, marginBottom: 18 }}>
          <Insight icon="🛡️" label="Eligibility" value={text(t.eligibility_status) || 'pending'} sub="academy_trainees" color="#f97316" />
          <Insight icon="🧾" label="Enrollments" value={String(enrollments.length)} sub="academy_enrollments" color="#7c3aed" />
          <Insight icon="💳" label="Paid" value={money(paid)} sub="academy_payments" color="#16a34a" />
          <Insight icon="☑️" label="Attendance" value={String(attendance.length)} sub="presence records" color="#0891b2" />
          <Insight icon="🏅" label="Certificates" value={String(certificates.length)} sub="issued or pending" color="#f59e0b" />
        </div>

        <Card style={{ padding: 18, marginBottom: 18, background: 'linear-gradient(135deg,#fff,#f8fbff)' }}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}><div><span style={{ color: '#64748b', fontSize: 10, fontWeight: 950, textTransform: 'uppercase' }}>Current section</span><strong style={{ display: 'block', marginTop: 5 }}>{current[3]} {current[1]}</strong></div><div><span style={{ color: '#64748b', fontSize: 10, fontWeight: 950, textTransform: 'uppercase' }}>Readiness</span><strong style={{ display: 'block', marginTop: 5 }}>{number(t.readiness_score)}%</strong></div><div><span style={{ color: '#64748b', fontSize: 10, fontWeight: 950, textTransform: 'uppercase' }}>Compliance</span><strong style={{ display: 'block', marginTop: 5 }}>{number(t.compliance_score)}%</strong></div><div><span style={{ color: '#64748b', fontSize: 10, fontWeight: 950, textTransform: 'uppercase' }}>Placement</span><strong style={{ display: 'block', marginTop: 5 }}>{text(m.placement_status) || 'not_started'}</strong></div></div></Card>

        {renderSection(active, t, { enrollments, payments, attendance, certificates, followups, courses, placementCases, placementActions })}
      </section>
    </div>
  </main>
}
