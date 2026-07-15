import AngelCareLogo from "@/components/brand/AngelCareLogo";
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth/requireAccess'
import CertificateCreateWizardClient, { type OptionRow } from './_components/CertificateCreateWizardClient'
export const dynamic = 'force-dynamic'

type AnyRow = Record<string, any>
type Tone = 'green' | 'blue' | 'orange' | 'red' | 'purple' | 'slate'

const academyNav = [
  ['⌂', 'Command Center', '/academy'],
  ['👥', 'Trainees', '/academy/trainees'],
  ['▣', 'Enrollments', '/academy/enrollments'],
  ['☑', 'Attendance', '/academy/attendance'],
  ['▤', 'Payments', '/academy/payments'],
  ['◎', 'Certificates', '/academy/certificates'],
  ['♙', 'Trainers', '/academy/trainers'],
  ['▦', 'Programs', '/academy/courses'],
  ['▱', 'Job Placement', '/academy/job-placement'],
  ['♧', 'Partners & Employers', '/academy/partners'],
  ['◁', 'Announcements', '/academy/alerts-sales'],
  ['⌁', 'Reports & Analytics', '/academy/reports'],
] as const
const systemNav = [['⚙', 'Integrations', '/academy/integrations'], ['◇', 'Automation', '/academy/automation'], ['⚙', 'Settings', '/academy/settings']] as const

async function safeTable(supabase: any, name: string, limit = 1000): Promise<AnyRow[]> {
  const { data } = await supabase.from(name).select('*').order('created_at', { ascending: false }).limit(limit)
  return (data || []) as AnyRow[]
}
function value(row: AnyRow | undefined, keys: string[], fallback = '—') {
  for (const key of keys) {
    const raw = row?.[key]
    const output = String(raw ?? '').trim()
    if (output) return output
  }
  return fallback
}
function dateLabel(raw: unknown) {
  try {
    return raw ? new Date(String(raw)).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
  } catch {
    return '—'
  }
}
function pct(part: number, total: number) { return total ? Math.round((part / total) * 1000) / 10 : 0 }
function certNumber() { return `CERT-AC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}` }
function token() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}` }
function option(rows: AnyRow[], labels: string[], subKeys: string[] = []): OptionRow[] {
  return rows.map((row: AnyRow) => ({ id: String(row.id), label: value(row, labels, String(row.id)), sub: value(row, subKeys, ''), meta: Object.fromEntries(Object.entries(row).map(([key, val]) => [key, String(val ?? '')])) }))
}

async function createCertificateAction(formData: FormData) {
  'use server'
  await requireAccess('academy.manage')
  const supabase = await createClient()
  const certificateNumber = String(formData.get('certificate_number') || certNumber()).trim()
  const verificationToken = token()
  const verificationUrl = `/verify/${verificationToken}`
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const qrCodeDataUrl = await QRCode.toDataURL(`${siteUrl}${verificationUrl}`, { margin: 1, width: 240 })
  const previewPayloadRaw = String(formData.get('preview_payload') || '{}')
  let previewPayload: AnyRow = {}
  try { previewPayload = JSON.parse(previewPayloadRaw) as AnyRow } catch { previewPayload = {} }
  const intent = String(formData.get('intent') || '')
  const status = intent === 'draft' ? 'draft' : String(formData.get('status') || 'issued')
  const now = new Date().toISOString()

  const payload = {
    trainee_id: String(formData.get('trainee_id') || '') || null,
    course_id: String(formData.get('course_id') || '') || null,
    group_id: String(formData.get('group_id') || '') || null,
    trainer_id: String(formData.get('trainer_id') || '') || null,
    status,
    certificate_number: certificateNumber,
    serial_number: certificateNumber,
    title: String(formData.get('certificate_name') || 'Attestation de réussite'),
    certificate_type: String(formData.get('certificate_type') || 'attestation_reussite'),
    language: 'fr_ar_en',
    issued_at: status === 'issued' ? now : null,
    verification_token: verificationToken,
    verification_url: verificationUrl,
    qr_code_data_url: qrCodeDataUrl,
    template_key: 'angelcare_standard_modern_landscape',
    design_config: { officialTemplate: true, protectedZones: true, motif: 'angelcare_standard_modern' },
    content_fields: {
      cin: String(formData.get('cin') || ''),
      completionDate: String(formData.get('completion_date') || ''),
      specializationFr: String(formData.get('specialization_fr') || ''),
      specializationEn: String(formData.get('specialization_en') || ''),
      specializationAr: String(formData.get('specialization_ar') || ''),
      trainingTypeFr: String(formData.get('training_type_fr') || ''),
      trainingTypeAr: String(formData.get('training_type_ar') || ''),
      totalHours: String(formData.get('total_hours') || ''),
      founderName: String(formData.get('founder_name') || ''),
      directorName: String(formData.get('director_name') || ''),
      certificateRefLabel: String(formData.get('certificate_ref_label') || certificateNumber),
      previewPayload,
    },
    recipient_fields: {
      recipientName: String(previewPayload.recipientName || formData.get('manual_recipient_name') || ''),
      courseName: String(previewPayload.courseName || ''),
      groupName: String(previewPayload.groupName || ''),
      trainerName: String(previewPayload.trainerName || ''),
    },
    metadata: { notes: String(formData.get('notes') || ''), created_from: 'academy_certificates_enterprise_renderer', sync: 'academy_live' },
    updated_at: now,
  }

  const { data, error } = await supabase.from('academy_certificates').insert(payload).select('id').single()
  if (error) throw new Error(error.message)
  await supabase.from('academy_audit_logs').insert({ action: `certificate_${status}`, entity: 'academy_certificates', entity_id: data?.id || null, notes: certificateNumber })
  revalidatePath('/academy/certificates')
  redirect('/academy/certificates')
}

function Sidebar() {
  return <aside className="sidebar"><div className="brand"><div className="officialLogo"><AngelCareLogo size="sm" /></div><section><strong>Academy OS</strong><span>Certificates Command</span></section></div><p>ACADEMY</p><nav>{academyNav.map(([icon, label, href]) => <Link key={href} href={href} className={href === '/academy/certificates' ? 'active' : ''}><span>{icon}</span>{label}</Link>)}</nav><p>SYSTEM</p><nav>{systemNav.map(([icon, label, href]) => <Link key={href} href={href}><span>{icon}</span>{label}</Link>)}</nav><div className="system"><b>Academy OS</b><small>Live certificate sync</small><em>● Online</em></div></aside>
}
function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: Tone }) { return <section className="kpi"><i className={tone}>◎</i><div><span>{label}</span><strong>{value}</strong><small>{sub}</small></div></section> }
function Badge({ text, tone }: { text: string; tone: Tone }) { return <span className={`badge ${tone}`}>{text}</span> }

export default async function CertificatesPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAccess('academy.view')
  const params = (await searchParams) || {}
  const supabase = await createClient()
  const [certificates, trainees, courses, groups, trainers] = await Promise.all([
    safeTable(supabase, 'academy_certificates', 1500),
    safeTable(supabase, 'academy_trainees', 1500),
    safeTable(supabase, 'academy_courses', 800),
    safeTable(supabase, 'academy_groups', 800),
    safeTable(supabase, 'academy_trainers', 800),
  ])
  const issued = certificates.filter((certificate: AnyRow) => ['issued', 'validated', 'active'].includes(String(certificate.status || '').toLowerCase()))
  const pending = certificates.filter((certificate: AnyRow) => ['pending', 'draft'].includes(String(certificate.status || '').toLowerCase()))
  const expired = certificates.filter((certificate: AnyRow) => String(certificate.status || '').toLowerCase().includes('expired'))
  const revoked = certificates.filter((certificate: AnyRow) => String(certificate.status || '').toLowerCase().includes('revoked'))
  const total = certificates.length
  const createOpen = String(params.modal || '') === 'create'

  return <main className="page"><Sidebar/><section className="content"><header className="top"><div><h1>Certificates Management</h1><p>Create, manage, issue and verify certificates across all programs</p></div><div className="actions"><input placeholder="Search certificates, recipients, programs..."/><Link href="/academy/certificates?modal=create">＋ Create Certificate</Link></div></header>
    <div className="kpis"><Kpi label="Total Certificates" value={String(total)} sub="live academy records" tone="green"/><Kpi label="Issued Certificates" value={String(issued.length)} sub="published certificates" tone="blue"/><Kpi label="Pending Certificates" value={String(pending.length)} sub="draft or pending" tone="orange"/><Kpi label="Expired Certificates" value={String(expired.length)} sub="needs renewal" tone="red"/><Kpi label="Verification Requests" value={String(certificates.filter((certificate: AnyRow) => certificate.verification_token).length)} sub="QR-ready certificates" tone="purple"/><Kpi label="Completion Rate" value={`${pct(issued.length,total)}%`} sub="issued vs total" tone="green"/></div>
    <section className="workspace"><div className="mainPanel"><div className="filters"><input placeholder="Search certificates or recipients..."/><select><option>All Programs</option>{courses.map((course: AnyRow) => <option key={course.id}>{value(course,['title','name'])}</option>)}</select><select><option>All Certificate Types</option><option>Attestation de réussite</option><option>Certificate of Completion</option><option>Diploma</option></select><select><option>All Status</option><option>Issued</option><option>Pending</option><option>Draft</option></select><button>More Filters</button><button>Export</button></div><div className="tabs"><span className="active">All Certificates <b>{total}</b></span><span>Issued <b>{issued.length}</b></span><span>Pending <b>{pending.length}</b></span><span>Expired <b>{expired.length}</b></span><span>Revoked <b>{revoked.length}</b></span></div><table><thead><tr><th>Certificate</th><th>Recipient</th><th>Program</th><th>Type</th><th>Issue Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>{certificates.slice(0,10).map((certificate: AnyRow) => { const trainee = trainees.find((item: AnyRow) => String(item.id) === String(certificate.trainee_id)); const course = courses.find((item: AnyRow) => String(item.id) === String(certificate.course_id)); return <tr key={certificate.id}><td><div className="thumb">CERT</div><b>{value(certificate,['title','certificate_number'],'Certificate')}</b><small>ID: {value(certificate,['certificate_number','serial_number'],String(certificate.id).slice(0,8))}</small></td><td><b>{value(trainee,['full_name','name'],'Manual recipient')}</b><small>{value(trainee,['email','phone'],'')}</small></td><td>{value(course,['title','name'],'Course Enrollment')}</td><td>{value(certificate,['certificate_type'],'Certificate')}</td><td>{dateLabel(certificate.issued_at || certificate.created_at)}</td><td><Badge text={value(certificate,['status'],'issued')} tone={String(certificate.status).includes('pending') ? 'orange' : 'green'}/></td><td><Link href={`/academy/certificates/print/${certificate.id}`}>Open</Link></td></tr> })}{certificates.length === 0 ? <tr><td colSpan={7}>No certificate records yet. Click Create Certificate to issue the first live Academy certificate.</td></tr> : null}</tbody></table></div><aside className="right"><section><h3>Certificate Analytics</h3><div className="donut"><b>{total}</b><small>Total</small></div><p>Issued <b>{issued.length}</b></p><p>Pending <b>{pending.length}</b></p><p>Expired <b>{expired.length}</b></p></section><section><h3>Top Programs</h3>{courses.slice(0,5).map((course: AnyRow) => <p key={course.id}>{value(course,['title','name'])}<b>{certificates.filter((certificate: AnyRow) => String(certificate.course_id) === String(course.id)).length}</b></p>)}</section><section><h3>Recent Verification Requests</h3>{certificates.filter((certificate: AnyRow) => certificate.verification_token).slice(0,4).map((certificate: AnyRow) => <p key={certificate.id}>{value(certificate,['certificate_number'],'Certificate')}<b>Verified</b></p>)}</section></aside></section>
    <div className="bottomActions"><Link href="/academy/certificates?modal=create">Create New</Link><Link href="/academy/certificates?modal=create">Certificate Templates</Link><Link href="/academy/certificates?modal=create">Bulk Manager</Link><Link href="/academy/settings">Verification Settings</Link></div>
    {createOpen ? <CertificateCreateWizardClient trainees={option(trainees,['full_name','name'],['email','phone'])} courses={option(courses,['title','name'])} groups={option(groups,['name','title'])} trainers={option(trainers,['full_name','name'])} defaultCertificateNumber={certNumber()} saveAction={createCertificateAction}/> : null}
    <style>{css}</style></section></main>
}

const css = `
.page{min-height:100vh;background:#f7f9fc;color:#172033;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex}.sidebar{width:270px;flex:0 0 270px;background:#fff;border-right:1px solid #e8edf5;padding:22px 18px;position:sticky;top:0;height:100vh;overflow:auto}.brand{display:flex;gap:14px;align-items:center;margin-bottom:28px}.brand div{width:52px;height:52px;border-radius:18px;background:linear-gradient(135deg,#7c3aed,#2563eb);display:grid;place-items:center;font-size:24px}.brand strong{display:block;font-size:20px}.brand span,.system small{display:block;color:#64748b;font-weight:800}.sidebar p{font-size:12px;font-weight:1000;letter-spacing:.2em;color:#64748b;margin:22px 0 8px}.sidebar nav{display:grid;gap:4px}.sidebar a{display:flex;align-items:center;gap:13px;padding:10px 13px;border-radius:14px;text-decoration:none;color:#334155;font-weight:900}.sidebar a.active{background:#eef2ff;color:#365cf6}.sidebar a span{width:22px;text-align:center}.system{margin-top:24px;border:1px solid #e8edf5;border-radius:22px;padding:16px}.system em{display:block;color:#16a34a;font-style:normal;font-weight:950;margin-top:12px}.content{flex:1;min-width:0;padding:24px 28px 60px}.top{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:24px}.top h1{margin:0;font-size:30px;letter-spacing:-.04em}.top p{margin:6px 0 0;color:#64748b;font-weight:800}.actions{display:flex;gap:14px;align-items:center}.actions input{width:420px;height:48px;border:1px solid #e2e8f0;border-radius:12px;padding:0 18px;font-weight:850}.actions a{height:48px;display:flex;align-items:center;border-radius:12px;background:#6d4df6;color:#fff;text-decoration:none;padding:0 22px;font-weight:950}.kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:16px;margin-bottom:22px}.kpi{background:#fff;border:1px solid #e7ecf4;border-radius:14px;padding:20px;display:flex;gap:16px;align-items:center}.kpi i{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;font-style:normal}.kpi i.green{background:#ecfdf5;color:#16a34a}.kpi i.blue{background:#eff6ff;color:#2563eb}.kpi i.orange{background:#fff7ed;color:#f59e0b}.kpi i.red{background:#fff1f2;color:#ef4444}.kpi i.purple{background:#f4f1ff;color:#6d4df6}.kpi span{color:#64748b;font-size:12px;font-weight:950}.kpi strong{display:block;font-size:28px;margin-top:4px}.kpi small{display:block;color:#64748b;font-weight:800}.workspace{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:20px}.mainPanel,.right section{background:#fff;border:1px solid #e7ecf4;border-radius:18px;padding:20px}.filters{display:grid;grid-template-columns:1.6fr repeat(5,1fr);gap:12px;margin-bottom:18px}.filters input,.filters select,.filters button{height:44px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;padding:0 12px;font-weight:900;color:#334155}.tabs{display:flex;gap:8px;border-bottom:1px solid #eef2f7;margin-bottom:12px}.tabs span{padding:14px 18px;font-weight:950;color:#64748b}.tabs .active{color:#6d4df6;border-bottom:3px solid #6d4df6;background:#fbfaff}.tabs b{margin-left:8px}table{width:100%;border-collapse:collapse;font-size:13px}th{text-align:left;background:#f8fafc;color:#64748b;padding:14px;text-transform:uppercase;letter-spacing:.08em;font-size:11px}td{padding:16px 14px;border-bottom:1px solid #eef2f7;font-weight:800;vertical-align:middle}td small{display:block;color:#64748b;margin-top:4px}.thumb{width:58px;height:38px;border:1px solid #dbe3ef;border-radius:6px;background:#f8fafc;display:grid;place-items:center;font-size:10px;color:#64748b;margin-bottom:6px}.badge{border-radius:999px;padding:7px 12px;font-size:11px;font-weight:950;text-transform:uppercase}.badge.green{background:#dcfce7;color:#16a34a}.badge.orange{background:#fff7ed;color:#ea580c}.right{display:grid;gap:18px;align-self:start}.right h3{margin:0 0 14px}.right p{display:flex;justify-content:space-between;color:#334155;font-weight:850}.donut{width:180px;height:180px;border-radius:50%;background:conic-gradient(#22c55e 0 76%,#f59e0b 76% 88%,#ef4444 88% 100%);margin:auto;display:grid;place-items:center;position:relative}.donut:after{content:'';position:absolute;width:116px;height:116px;background:#fff;border-radius:50%}.donut b,.donut small{z-index:1}.bottomActions{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:22px}.bottomActions a{background:#fff;border:1px solid #e7ecf4;border-radius:16px;padding:24px;text-decoration:none;color:#6d4df6;font-weight:950}@media(max-width:1400px){.kpis{grid-template-columns:repeat(3,1fr)}.workspace{grid-template-columns:1fr}.filters{grid-template-columns:1fr 1fr}.actions input{width:260px}}`
