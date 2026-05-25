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
function EnrollmentDetails({ trainee, active, enrollments }: { trainee: Trainee; active: SectionKey; enrollments: AnyRow[] }) { const m = meta(trainee); return <FormShell trainee={trainee} active={active}><div style={{ display: 'grid', gridTemplateColumns: '1.15fr .85fr', gap: 18 }}><Card style={{ padding: 24 }}><h2 style={{ margin: '0 0 18px', fontSize: 22 }}>Enrollment Command Layer</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}><Field label="Desired program" name="desired_program" defaultValue={m.desired_program} /><SelectField label="Preferred schedule" name="preferred_schedule" defaultValue={m.preferred_schedule} options={['', 'weekday_morning', 'weekday_afternoon', 'evening', 'weekend', 'intensive']} /><Field label="Enrollment channel" name="enrollment_channel" defaultValue={m.enrollment_channel} /><Field label="Admission owner" name="admission_owner" defaultValue={m.admission_owner} /><SelectField label="Eligibility" name="eligibility_status" defaultValue={trainee.eligibility_status} options={['pending', 'approved', 'approuvé', 'missing_info', 'rejected', 'eligible']} /><SelectField label="Lifecycle" name="lifecycle_status" defaultValue={trainee.lifecycle_status} options={['screening', 'eligible', 'enrollment', 'training', 'evaluation', 'certified', 'placement']} /><SelectField label="Status" name="status" defaultValue={trainee.status} options={['prospect', 'candidate', 'eligible', 'enrolled', 'in_training', 'graduated', 'placed', 'risk']} /><Field label="Missing requirements" name="missing_requirements" defaultValue={m.missing_requirements} /><div style={{ gridColumn: '1/-1' }}><TextArea label="Enrollment notes" name="enrollment_notes" defaultValue={m.enrollment_notes} rows={5} /></div></div><div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}><SelectField label="Create enrollment bridge" name="create_enrollment" defaultValue="no" options={['no', 'yes']} /><SelectField label="New enrollment status" name="new_enrollment_status" defaultValue="pending" options={['pending', 'confirmed', 'active', 'cancelled']} /></div></Card><RelatedList title="Linked Enrollments" rows={enrollments} empty="No enrollment record yet. Use the bridge fields to create a synced enrollment signal." fields={['status', 'course_id', 'group_id']} /></div></FormShell> }
function Courses({ trainee, active, courses, enrollments }: { trainee: Trainee; active: SectionKey; courses: AnyRow[]; enrollments: AnyRow[] }) { const m = meta(trainee); return <FormShell trainee={trainee} active={active}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}><Card style={{ padding: 24 }}><h2 style={{ margin: '0 0 18px', fontSize: 22 }}>Course Path & Skill Architecture</h2><div style={{ display: 'grid', gap: 14 }}><Field label="Course path" name="course_path" defaultValue={m.course_path || m.desired_program} /><SelectField label="Course level" name="course_level" defaultValue={m.course_level} options={['', 'starter', 'foundation', 'operational', 'advanced', 'professional']} /><Field label="Trainer preference / owner" name="trainer_preference" defaultValue={m.trainer_preference} /><TextArea label="Skill targets" name="skill_targets" defaultValue={m.skill_targets} rows={5} /><TextArea label="Course manager notes" name="course_notes" defaultValue={m.course_notes} rows={5} /></div></Card><div style={{ display: 'grid', gap: 18 }}><RelatedList title="Available Academy Courses" rows={courses} empty="No academy_courses records found yet." fields={['title', 'level', 'status']} /><RelatedList title="Course Enrollment Links" rows={enrollments} empty="No linked enrollment yet." fields={['course_id', 'group_id', 'status']} /></div></div></FormShell> }
function Attendance({ trainee, active, attendance }: { trainee: Trainee; active: SectionKey; attendance: AnyRow[] }) { const m = meta(trainee); const present = attendance.filter(a => text(a.status).includes('present')).length; const absent = attendance.filter(a => text(a.status).includes('absent')).length; return <FormShell trainee={trainee} active={active}><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 16, marginBottom: 18 }}><Insight icon="✅" label="Present" value={String(present)} sub="presence records" color="#16a34a" /><Insight icon="⚠️" label="Absent / risk" value={String(absent)} sub="risk records" color="#e11d48" /><Insight icon="📊" label="Total logs" value={String(attendance.length)} sub="academy_attendance" color="#355df6" /></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}><Card style={{ padding: 24 }}><h2 style={{ margin: '0 0 18px', fontSize: 22 }}>Attendance Discipline Control</h2><div style={{ display: 'grid', gap: 14 }}><SelectField label="Attendance policy" name="attendance_policy" defaultValue={m.attendance_policy} options={['', 'normal', 'watchlist', 'needs_call', 'manager_review', 'disciplinary_followup']} /><SelectField label="Attendance risk" name="attendance_risk" defaultValue={m.attendance_risk} options={['', 'low', 'medium', 'high', 'critical']} /><SelectField label="Create attendance note" name="create_attendance_note" defaultValue="no" options={['no', 'yes']} /><SelectField label="Attendance status" name="attendance_status" defaultValue="present" options={['present', 'late', 'absent', 'excused', 'makeup_required']} /><TextArea label="Attendance notes" name="attendance_notes" defaultValue={m.attendance_notes} rows={6} /></div></Card><RelatedList title="Latest Attendance Logs" rows={attendance} empty="No attendance record yet." fields={['status', 'session_id', 'notes']} /></div></FormShell> }
function Payment({ trainee, active, payments }: { trainee: Trainee; active: SectionKey; payments: AnyRow[] }) { const m = meta(trainee); const paid = payments.reduce((s: any, p: any) => s + number(p.amount || p.amount_mad || p.paid_amount), 0); return <FormShell trainee={trainee} active={active}><div style={{ display: 'grid', gridTemplateColumns: '.75fr 1.25fr', gap: 18 }}><div style={{ display: 'grid', gap: 16 }}><Insight icon="💳" label="Paid total" value={money(paid)} sub="linked payment records" color="#16a34a" /><RelatedList title="Payment Ledger" rows={payments} empty="No payment record yet." fields={['amount', 'status', 'method']} /></div><Card style={{ padding: 24 }}><h2 style={{ margin: '0 0 18px', fontSize: 22 }}>Payment Plan & Ledger Control</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}><SelectField label="Payment plan" name="payment_plan" defaultValue={m.payment_plan} options={['', 'full_payment', 'installments_2x', 'installments_3x', 'scholarship', 'partner_paid', 'pending_agreement']} /><Field label="Payer name" name="payer_name" defaultValue={m.payer_name} /><SelectField label="Payment risk" name="payment_risk" defaultValue={m.payment_risk} options={['', 'low', 'medium', 'high', 'overdue', 'blocked']} /><SelectField label="Create payment" name="create_payment" defaultValue="no" options={['no', 'yes']} /><Field label="Payment amount MAD" name="payment_amount" type="number" defaultValue="0" /><SelectField label="Payment status" name="payment_status" defaultValue="pending" options={['pending', 'paid', 'partial', 'overdue', 'cancelled']} /><div style={{ gridColumn: '1/-1' }}><TextArea label="Payment notes" name="payment_notes" defaultValue={m.payment_notes} rows={6} /></div></div></Card></div></FormShell> }
function Graduation({ trainee, active, certificates }: { trainee: Trainee; active: SectionKey; certificates: AnyRow[] }) { const m = meta(trainee); return <FormShell trainee={trainee} active={active}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}><Card style={{ padding: 24 }}><h2 style={{ margin: '0 0 18px', fontSize: 22 }}>Graduation & Certification Readiness</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}><SelectField label="Evaluation status" name="evaluation_status" defaultValue={m.evaluation_status} options={['', 'not_started', 'in_progress', 'passed', 'failed', 'needs_makeup', 'manager_review']} /><SelectField label="Graduation status" name="graduation_status" defaultValue={m.graduation_status} options={['', 'not_ready', 'ready', 'graduated', 'blocked', 'pending_payment', 'pending_attendance']} /><Field label="Final score" name="final_score" type="number" defaultValue={m.final_score || 0} /><SelectField label="Certificate decision" name="certificate_decision" defaultValue={m.certificate_decision} options={['', 'pending', 'approved', 'issued', 'blocked', 'needs_review']} /><SelectField label="Issue certificate signal" name="issue_certificate_signal" defaultValue="no" options={['no', 'yes']} /><div /><div style={{ gridColumn: '1/-1' }}><TextArea label="Graduation notes" name="graduation_notes" defaultValue={m.graduation_notes} rows={6} /></div></div></Card><RelatedList title="Certificate Registry" rows={certificates} empty="No certificate record yet." fields={['status', 'certificate_number', 'issued_at']} /></div></FormShell> }
function JobPlacement({ trainee, active, followups }: { trainee: Trainee; active: SectionKey; followups: AnyRow[] }) { const m = meta(trainee); return <FormShell trainee={trainee} active={active}><div style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 18 }}><Card style={{ padding: 24 }}><h2 style={{ margin: '0 0 18px', fontSize: 22 }}>Job Placement & Partner Matching</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}><SelectField label="Placement status" name="placement_status" defaultValue={m.placement_status} options={['', 'not_started', 'profile_ready', 'matched', 'interviewing', 'placed', 'rejected', 'follow_up', 'watchlist']} /><SelectField label="Employer type" name="preferred_employer_type" defaultValue={m.preferred_employer_type} options={['', 'kindergarten', 'preschool', 'home_nanny', 'events_kids_leader', 'excursion_support', 'nursery', 'private_family']} /><Field label="Target city" name="target_city" defaultValue={m.target_city || trainee.city} /><SelectField label="Availability" name="availability" defaultValue={m.availability} options={['', 'immediate', 'within_7_days', 'within_30_days', 'weekends_only', 'part_time', 'full_time']} /><div style={{ gridColumn: '1/-1' }}><TextArea label="Placement notes" name="placement_notes" defaultValue={m.placement_notes} rows={7} /></div></div></Card><RelatedList title="Placement Follow-ups" rows={followups} empty="No placement follow-up yet. Saving this section creates a best-effort follow-up record." fields={['status', 'partner_id', 'notes']} /></div></FormShell> }

function renderSection(active: SectionKey, trainee: Trainee, data: { enrollments: AnyRow[]; payments: AnyRow[]; attendance: AnyRow[]; certificates: AnyRow[]; followups: AnyRow[]; courses: AnyRow[] }) {
  if (active === 'background') return <Background trainee={trainee} active={active} />
  if (active === 'enrollment-details') return <EnrollmentDetails trainee={trainee} active={active} enrollments={data.enrollments} />
  if (active === 'courses') return <Courses trainee={trainee} active={active} courses={data.courses} enrollments={data.enrollments} />
  if (active === 'attendance') return <Attendance trainee={trainee} active={active} attendance={data.attendance} />
  if (active === 'payment') return <Payment trainee={trainee} active={active} payments={data.payments} />
  if (active === 'graduation') return <Graduation trainee={trainee} active={active} certificates={data.certificates} />
  if (active === 'job-placement') return <JobPlacement trainee={trainee} active={active} followups={data.followups} />
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

  const [enrollments, payments, attendance, certificates, followups, courses] = await Promise.all([
    tableList(supabase, 'academy_enrollments', id),
    tableList(supabase, 'academy_payments', id),
    tableList(supabase, 'academy_attendance', id),
    tableList(supabase, 'academy_certificates', id),
    tableList(supabase, 'academy_graduation_followups', id),
    (async () => { const { data } = await supabase.from('academy_courses').select('*').order('created_at', { ascending: false }).limit(8); return data || [] })(),
  ])
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

        {renderSection(active, t, { enrollments, payments, attendance, certificates, followups, courses })}
      </section>
    </div>
  </main>
}
