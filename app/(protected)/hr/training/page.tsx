import Link from 'next/link'
import type { ReactNode } from 'react'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Download,
  Edit3,
  Eye,
  FileBadge2,
  FileText,
  Filter,
  Gauge,
  GraduationCap,
  Home,
  Library,
  LineChart,
  Link2,
  Network,
  PlayCircle,
  Plus,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Upload,
  UserCheck,
  Users,
  Workflow,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getHRDashboardData } from '@/lib/hr-production/repository'
import AssignTrainingEnterpriseModal from '@/components/hr-training/AssignTrainingEnterpriseModal'
import HRModuleCommandBridge from '@/components/hr-production/HRModuleCommandBridge'
type Row = Record<string, any>
type Tone = 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'cyan' | 'indigo' | 'slate'

const fallbackPositionSeed = [
  'Caregiver',
  'Field Staff',
  'CSA-Officer',
  'SCA-Officer',
  'Market-Officer',
  'Academy Trainer',
  'Recruiter',
  'HR Manager',
  'Operations Coordinator',
  'Finance Agent',
  'Admin',
  'Manager',
]

const sidebarGroups = [
  { label: 'Overview', items: [
    { label: 'Dashboard', href: '/hr', icon: Home },
  ]},
  { label: 'People', items: [
    { label: 'Employees', href: '/hr/employees', icon: Users },
    { label: 'Teams & Departments', href: '/hr/departments', icon: Building2 },
    { label: 'Recruitment', href: '/hr/recruitment', icon: UserCheck },
    { label: 'Onboarding', href: '/hr/onboarding', icon: ClipboardCheck },
    { label: 'Performance', href: '/hr/performance-matrix', icon: Gauge },
    { label: 'Learning & Development', href: '/hr/training', icon: GraduationCap, active: true },
  ]},
  { label: 'Operations', items: [
    { label: 'Attendance', href: '/hr/attendance', icon: CalendarCheck },
    { label: 'Leave Management', href: '/hr/leave', icon: Clock3 },
    { label: 'Work Schedules', href: '/hr/work-schedules', icon: Workflow },
    { label: 'Time Tracking', href: '/hr/time-tracking', icon: LineChart },
  ]},
  { label: 'Compliance & Documents', items: [
    { label: 'Documents', href: '/hr/documents', icon: FileBadge2 },
    { label: 'Templates', href: '/hr/templates', icon: FileText },
    { label: 'Policies', href: '/hr/policies', icon: ShieldCheck },
    { label: 'Compliance Dashboard', href: '/hr/compliance', icon: AlertTriangle },
  ]},
  { label: 'System', items: [
    { label: 'Integrations', href: '/hr/integrations', icon: Sparkles },
    { label: 'Settings', href: '/hr/settings', icon: Settings },
  ]},
]

function s(v: unknown) { return String(v ?? '').trim() }
function n(v: unknown) { return s(v).toLowerCase() }
function slug(input: unknown) { return s(input).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'item' }

function trainingSuggestionKeys(position: string, title: string, resourceType = "suggested") {
  const positionKey = slug(position)
  const titleKey = slug(title)
  const typeKey = slug(resourceType || "suggested")

  return [
    `${positionKey}::${titleKey}::${typeKey}`,
    `${positionKey}::${titleKey}`,
    titleKey,
  ]
}

function trainingSuggestionDismissed(
  dismissedKeys: Set<string>,
  position: string,
  title: string,
  resourceType = "suggested",
) {
  return trainingSuggestionKeys(position, title, resourceType).some((key) => dismissedKeys.has(key))
}

function pct(v: number) { return `${Math.max(0, Math.min(100, Math.round(v)))}%` }
function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p, pIndex) => p[0]?.toUpperCase()).join('') || 'HR' }
function money(v: number) { return new Intl.NumberFormat('fr-MA').format(v) }

function first(row: Row | undefined, keys: string[], fallback = '') {
  if (!row) return fallback
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && s(value)) return s(value)
  }
  return fallback
}

async function safeRead(table: string, columns = '*', limit = 1000) {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from(table).select(columns).limit(limit)
    return (data || []) as Row[]
  } catch {
    return [] as Row[]
  }
}

async function saveTrainingResourceAction(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const position = s(formData.get('position_title'))
  const title = s(formData.get('title'))
  if (!position || !title) return

  const programPayload = {
    title,
    position_title: position,
    department: s(formData.get('department')) || 'All departments',
    category: s(formData.get('category')) || position,
    training_type: s(formData.get('training_type')) || 'position_resource',
    requirement_level: s(formData.get('requirement_level')) || 'recommended',
    priority: s(formData.get('priority')) || 'normal',
    status: s(formData.get('status')) || 'active',
    duration_minutes: Number(formData.get('duration_minutes') || 60),
    description: s(formData.get('description')),
    resource_url: s(formData.get('resource_url')),
    video_url: s(formData.get('video_url')),
    pdf_url: s(formData.get('pdf_url')),
    updated_at: new Date().toISOString(),
  }

  let trainingId = s(formData.get('id')) || null
  try {
    if (trainingId) {
      await supabase.from('hr_training_programs').update(programPayload).eq('id', trainingId)
    } else {
      const { data } = await supabase.from('hr_training_programs').insert({ ...programPayload, created_at: new Date().toISOString() }).select('id').maybeSingle()
      trainingId = data?.id || null
    }
  } catch {}

  try {
    await supabase.from('hr_position_training_requirements').upsert({
      position_title: position,
      training_id: trainingId,
      training_title: title,
      requirement_level: programPayload.requirement_level,
      due_days: Number(formData.get('due_days') || 14),
      status: programPayload.status,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'position_title,training_title' })
  } catch {}

  try {
    await supabase.from('hr_training_resources').insert({
      training_id: trainingId,
      position_title: position,
      title,
      resource_type: s(formData.get('resource_type')) || 'training',
      resource_url: programPayload.resource_url || programPayload.pdf_url || programPayload.video_url,
      notes: programPayload.description,
      status: programPayload.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  } catch {}

  try {
    await supabase.from('hr_training_audit_logs').insert({
      action: trainingId ? 'training_resource_saved' : 'training_resource_created',
      entity_type: 'position_training_resource',
      entity_id: trainingId,
      title: `Training resource saved for ${position}`,
      notes: title,
      created_at: new Date().toISOString(),
    })
  } catch {}

  revalidatePath('/hr/training')
  redirect(`/hr/training#modal-position-bank-${slug(position)}`)
}


async function dismissSuggestedTrainingResourceAction(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const position = s(formData.get('position_title'))
  const title = s(formData.get('title'))
  const resourceType = s(formData.get('resource_type'))
  const suggestionKeys = trainingSuggestionKeys(position, title, resourceType)
  const suggestionKey = suggestionKeys[0]

  if (!position || !title) {
    redirect('/hr/training?dismissed=missing_context')
  }

  try {
    await supabase.from('hr_activity_events').insert({
      action: 'training_suggestion_dismissed',
      entity_type: 'position_training_suggestion',
      entity_id: suggestionKey,
      title: 'Training suggestion dismissed permanently',
      description: `${position} · ${title}`,
      created_at: new Date().toISOString(),
      metadata: {
        position_title: position,
        title,
        resource_type: resourceType,
        suggestion_key: suggestionKey,
        suggestion_keys: suggestionKeys,
      },
    })
  } catch {}

  revalidatePath('/hr/training')
  redirect(`/hr/training?dismissed=${encodeURIComponent(title)}#modal-position-bank-${slug(position)}`)
}


async function deleteTrainingResourceAction(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const id = s(formData.get('id'))
  const position = s(formData.get('position_title'))

  if (!id) {
    redirect('/hr/training?deleted=missing_id')
  }

  const now = new Date().toISOString()

  // Hard delete across the live resource/program/requirement surfaces.
  // We delete by both id and training_id because the resource cards may come
  // from hr_training_programs, hr_training_requirements or hr_training_resources.
  const operations = [
    supabase.from('hr_training_resources').delete().eq('id', id),
    supabase.from('hr_training_resources').delete().eq('training_id', id),
    supabase.from('hr_training_requirements').delete().eq('id', id),
    supabase.from('hr_training_requirements').delete().eq('training_id', id),
    supabase.from('hr_training_programs').delete().eq('id', id),
  ]

  const results = await Promise.allSettled(operations)

  const deletedSomewhere = results.some((result) => result.status === 'fulfilled' && !result.value.error)
  const firstError = results.find((result) => result.status === 'fulfilled' && result.value.error)

  try {
    await supabase.from('hr_activity_events').insert({
      action: deletedSomewhere ? 'training_resource_deleted_permanently' : 'training_resource_delete_attempted',
      entity_type: 'position_training_resource',
      entity_id: id,
      title: deletedSomewhere ? 'Training resource permanently deleted' : 'Training resource delete attempted',
      description: `${position || 'Unknown position'} · ${deletedSomewhere ? 'hard delete completed' : 'no matching record deleted'}`,
      created_at: now,
      metadata: {
        id,
        position_title: position,
        deletedSomewhere,
        firstError: firstError && firstError.status === 'fulfilled' ? firstError.value.error?.message : null,
      },
    })
  } catch {}

  revalidatePath('/hr/training')

  redirect(
    position
      ? `/hr/training?deleted=${encodeURIComponent(id)}#modal-position-bank-${slug(position)}`
      : `/hr/training?deleted=${encodeURIComponent(id)}`
  )
}

async function assignTrainingAction(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const staffId = s(formData.get('staff_id'))
  const staffName = s(formData.get('staff_name'))
  const positionTitle = s(formData.get('position_title'))
  const trainingId = s(formData.get('training_id'))
  const trainingTitle = s(formData.get('training_title')) || 'Assigned training'
  if (!positionTitle || !trainingTitle) return
  try {
    await supabase.from('hr_training_assignments').insert({
      staff_id: staffId || null,
      staff_name: staffName || 'Position audience',
      position_title: positionTitle,
      training_id: trainingId || null,
      training_title: trainingTitle,
      status: 'assigned',
      progress_percent: 0,
      assigned_at: new Date().toISOString(),
      due_at: s(formData.get('due_at')) || null,
      priority: s(formData.get('priority')) || 'normal',
      notes: s(formData.get('notes')),
      updated_at: new Date().toISOString(),
    })
  } catch {}
  try {
    await supabase.from('hr_training_audit_logs').insert({
      action: 'training_assigned',
      entity_type: 'training_assignment',
      title: `Training assigned: ${trainingTitle}`,
      notes: `${staffName || positionTitle} • ${positionTitle}`,
      created_at: new Date().toISOString(),
    })
  } catch {}
  revalidatePath('/hr/training')
  redirect('/hr/training#modal-live-control')
}

async function updateTrainingAssignmentAction(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const id = s(formData.get('id'))
  const status = s(formData.get('status')) || 'in_progress'
  const progress = Math.max(0, Math.min(100, Number(formData.get('progress_percent') || 0)))
  if (!id) return
  try {
    await supabase.from('hr_training_assignments').update({
      status,
      progress_percent: progress,
      approved_at: status === 'passed' || status === 'approved' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
      notes: s(formData.get('notes')),
    }).eq('id', id)
  } catch {}
  try {
    await supabase.from('hr_training_audit_logs').insert({
      action: `assignment_${status}`,
      entity_type: 'training_assignment',
      entity_id: id,
      title: `Training assignment updated to ${status}`,
      notes: `Progress ${progress}%`,
      created_at: new Date().toISOString(),
    })
  } catch {}
  revalidatePath('/hr/training')
  redirect('/hr/training#modal-live-control')
}

function positionRecommendations(position: string) {
  const p = n(position)
  if (/caregiver|nanny|kids|child|preschool|kindergarten/.test(p)) return [
    ['Child Safety & Protection', 'Mandatory', 'PDF + video', 'Safeguarding, supervision, child safety, hygiene and parent communication standards.'],
    ['Emergency Response Training', 'Critical', 'Video', 'First response, incident escalation, emergency contact chain and medical alert protocol.'],
    ['Parent Communication & Trust', 'Recommended', 'PDF', 'Daily reporting, professional tone, boundaries, trust building and service quality.'],
    ['Hygiene & Safeguarding', 'Compliance', 'Checklist', 'Hygiene protocol, child privacy, safe environments and risk prevention.'],
  ]
  if (/field|mission|sca|csa|officer|agent/.test(p)) return [
    ['Field Staff Protocol & Conduct', 'Mandatory', 'PDF + video', 'Mission behavior, punctuality, site protocol, uniform conduct and reporting.'],
    ['Attendance & Mission Check-in', 'Mandatory', 'Checklist', 'Punch in/out, mobile readiness, location discipline and late escalation.'],
    ['Incident Reporting Workshop', 'Compliance', 'Video', 'How to document incidents, upload evidence and trigger manager review.'],
    ['Client Site Communication', 'Recommended', 'PDF', 'Professional communication for families, preschools, clinics and partner sites.'],
  ]
  if (/academy|trainer|teacher|coach/.test(p)) return [
    ['Training Facilitation Standards', 'Mandatory', 'PDF', 'Class facilitation, learner engagement, assessment and attestation process.'],
    ['Learner Assessment & Attestation', 'Mandatory', 'Checklist', 'Evaluation rules, grading, certificate evidence and quality control.'],
    ['Classroom Safety', 'Compliance', 'Video', 'Safe learning space setup, attendance and incident prevention.'],
    ['Job Market Insertion Process', 'Recommended', 'PDF', 'Graduate sourcing, partner matching and post-training placement support.'],
  ]
  if (/hr|recruit/.test(p)) return [
    ['Recruitment Compliance', 'Mandatory', 'PDF', 'Candidate data, interview fairness, hiring file completeness and audit discipline.'],
    ['Candidate Interview Protocol', 'Mandatory', 'Checklist', 'Interview scheduling, scorecards, comments, decisions and pipeline sync.'],
    ['Onboarding & Staff File Control', 'Compliance', 'PDF', 'Convert candidate to staff, documents, contracts and training path.'],
    ['HR Data Privacy', 'Critical', 'Video', 'Sensitive data handling, access control and HR record protection.'],
  ]
  if (/manager|lead|head|director/.test(p)) return [
    ['Manager Approval Workflow', 'Mandatory', 'PDF', 'Approvals, escalations, leave, attendance review and operational accountability.'],
    ['Performance Coaching', 'Recommended', 'Video', 'Feedback, coaching plans, performance review and follow-up.'],
    ['Risk Escalation Protocol', 'Critical', 'Checklist', 'How to escalate compliance, incident, attendance and payroll risks.'],
    ['Department Readiness Dashboard', 'Recommended', 'PDF', 'Reading readiness metrics, gaps, sync coverage and staff quality.'],
  ]
  return [
    ['AngelCare Operating Standards', 'Mandatory', 'PDF', 'Core AngelCare rules, service culture, communication and staff discipline.'],
    ['Communication & Reporting', 'Recommended', 'PDF', 'Team communication, escalation notes, activity logs and internal reporting.'],
    ['Compliance Basics', 'Compliance', 'Checklist', 'Documents, policies, privacy, attendance and training proof requirements.'],
    ['Role-Specific SOP', 'Recommended', 'Video', 'Operational SOP for the selected position and department context.'],
  ]
}

function SideBar() {
  return <aside className="sticky top-0 flex h-screen min-h-0 w-[290px] shrink-0 flex-col border-r border-slate-200/80 bg-white/95 px-3 py-4 shadow-[24px_0_80px_rgba(15,23,42,0.06)] backdrop-blur-xl">
    <div className="mb-5 flex items-center gap-3 px-2"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-indigo-600 text-white shadow-xl shadow-violet-200"><Sparkles className="h-5 w-5" /></div><div><div className="text-sm font-black text-slate-950">AngelCare HR</div><div className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-400">Command OS</div></div></div>
    <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
      {sidebarGroups.map((group) => <div key={group.label}><div className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{group.label}</div><div className="space-y-1">{group.items.map((item, index) => { const Icon = item.icon; return <Link key={`${group.label}-${item.label}-${item.href}`} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-extrabold transition ${item.active ? 'bg-gradient-to-r from-violet-50 to-fuchsia-50 text-violet-700 shadow-sm ring-1 ring-violet-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}><Icon className="h-4 w-4" />{item.label}</Link> })}</div></div>)}
export const dynamic = "force-dynamic";
export const revalidate = 0;

    </nav>
    <Link href="/ai-command-center/hr-copilot" className="mt-4 flex items-center justify-between rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-black text-violet-700 shadow-sm"><span>Ask Angel AI</span><Sparkles className="h-4 w-4" /></Link>
  </aside>
}

function Panel({ title, subtitle, children, className = '', action }: { title: string; subtitle?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return <section className={`rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] ${className}`}>
    <div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-base font-black text-slate-950">{title}</h2>{subtitle ? <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{subtitle}</p> : null}</div>{action}</div>
    {children}
  </section>
}

function Modal({ id, title, subtitle, children, ultra = false }: { id: string; title: string; subtitle: string; children: ReactNode; ultra?: boolean }) {
  return <div id={id} className="fixed inset-0 z-[99999] hidden bg-slate-950/55 p-4 backdrop-blur-sm target:block">
    <div className={`mx-auto flex max-h-[94vh] w-full flex-col overflow-hidden rounded-[34px] border border-white/70 bg-white shadow-[0_40px_140px_rgba(15,23,42,0.35)] ${ultra ? 'max-w-[1640px]' : 'max-w-6xl'}`}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-white via-violet-50 to-blue-50 p-7">
        <div><p className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-violet-700">Live synced workspace</p><h3 className="mt-3 text-3xl font-black text-slate-950">{title}</h3><p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-500">{subtitle}</p></div>
        <a href="#" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm"><X className="h-5 w-5" /></a>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-7">{children}</div>
    </div>
  </div>
}

function Field({ label, name, value = '', type = 'text', required = false }: { label: string; name: string; value?: string; type?: string; required?: boolean }) {
  return <label className="block"><span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{label}{required ? ' *' : ''}</span><input name={name} type={type} required={required} defaultValue={value} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none focus:border-violet-300" /></label>
}

function SelectField({ label, name, value, options }: { label: string; name: string; value?: string; options: string[] }) {
  return <label className="block"><span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</span><select name={name} defaultValue={value || options[0]} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none focus:border-violet-300">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
}

function ResourceIcon({ type }: { type: string }) {
  const t = n(type)
  if (t.includes('video')) return <PlayCircle className="h-5 w-5" />
  if (t.includes('pdf')) return <FileText className="h-5 w-5" />
  if (t.includes('link')) return <Link2 className="h-5 w-5" />
  return <BookOpenCheck className="h-5 w-5" />
}

function toneClasses(tone: Tone) {
  const map: Record<Tone, string> = {
    blue: 'from-blue-500 to-cyan-500', emerald: 'from-emerald-500 to-teal-500', amber: 'from-amber-500 to-orange-500', rose: 'from-rose-500 to-pink-500', violet: 'from-violet-600 to-fuchsia-500', cyan: 'from-cyan-500 to-blue-500', indigo: 'from-indigo-500 to-violet-500', slate: 'from-slate-700 to-slate-950'
  }
  return map[tone]
}

function resourceTone(priority: string): Tone {
  const p = n(priority)
  if (p.includes('critical') || p.includes('urgent')) return 'rose'
  if (p.includes('mandatory')) return 'violet'
  if (p.includes('compliance')) return 'amber'
  if (p.includes('recommended')) return 'blue'
  return 'emerald'
}

export default async function Page({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined> }) {
  const resolvedSearchParams = await Promise.resolve(searchParams || {})
  const sp = (key: string) => {
    const value = resolvedSearchParams[key]
    return Array.isArray(value) ? String(value[0] || '') : String(value || '')
  }
  const filterQuery = sp('q').trim().toLowerCase()
  const filterDepartment = sp('department') || 'all'
  const filterCoverage = sp('coverage') || 'all'
  const filterResourceType = sp('resource_type') || 'all'
  const filterOnlyMapped = sp('mapped') === 'yes'

  const [hr, appUsers, trainingPrograms, requirements, resources, assignments, dismissedSuggestionEvents] = await Promise.all([
    getHRDashboardData(),
    safeRead('app_users', 'id, full_name, name, email, role, department, position, status', 1500),
    safeRead('hr_training_programs', '*', 1500),
    safeRead('hr_position_training_requirements', '*', 1500),
    safeRead('hr_training_resources', '*', 1500),
    safeRead('hr_training_assignments', '*', 2000),
    safeRead('hr_activity_events', 'id, action, entity_id, metadata, created_at', 300),
  ])

  const dismissedSuggestionKeys = new Set(
    (dismissedSuggestionEvents || [])
      .filter((event) => first(event, ['action'], '') === 'training_suggestion_dismissed')
      .flatMap((event) => {
        const metadata = (event as any).metadata || {}
        const keys = Array.isArray(metadata.suggestion_keys) ? metadata.suggestion_keys : []
        return [
          metadata.suggestion_key,
          first(event, ['entity_id'], ''),
          ...keys,
        ]
      })
      .map((key) => String(key || ''))
      .filter(Boolean)
  )


  const staff = ([...(hr.staff || []), ...appUsers] as Row[])
  const rawPositions = ([...(hr.positions || []), ...appUsers.map((u) => ({ title: first(u, ['position', 'role'], ''), department: first(u, ['department'], ''), source: 'users' }))] as Row[])
  const positionNames = Array.from(new Set([...rawPositions.map((p, pIndex) => first(p, ['title','name','position_title','role'], '')), ...fallbackPositionSeed].filter(Boolean).map((p, pIndex) => s(p)))).sort((a, b) => a.localeCompare(b))
  const departments = Array.from(new Set(staff.map((x, xIndex) => first(x, ['department'], '')).filter(Boolean))).sort()

  const positions = positionNames.map((name) => {
    const users = staff.filter((u) => n(first(u, ['position','role','job_title'], '')) === n(name))
    const programs = trainingPrograms.filter((p) => n(first(p, ['position_title','category'], '')) === n(name) || n(first(p, ['title'], '')).includes(n(name)))
    const reqs = requirements.filter((r) => n(first(r, ['position_title'], '')) === n(name))
    const res = resources.filter((r) => n(first(r, ['position_title'], '')) === n(name))
    const rec = positionRecommendations(name).filter(([title, priority, type]) => {
      return !trainingSuggestionDismissed(
        dismissedSuggestionKeys,
        name,
        String(title),
        String(type || 'suggested'),
      )
    })
    const items = [
      ...programs.map((p, pIndex) => ({ id: first(p, ['id'], ''), title: first(p, ['title','training_title'], 'Untitled training'), description: first(p, ['description'], 'Live training program.'), priority: first(p, ['priority','requirement_level','training_type'], 'active'), type: first(p, ['training_type','resource_type'], 'training'), duration: String(p.duration_minutes || 60), pdf: first(p, ['pdf_url','resource_url'], ''), video: first(p, ['video_url'], ''), source: 'program', live: true })),
      ...reqs.map((r, rIndex) => ({ id: first(r, ['training_id','id'], ''), title: first(r, ['training_title','title'], 'Position requirement'), description: first(r, ['description'], 'Position training requirement.'), priority: first(r, ['requirement_level'], 'mandatory'), type: 'requirement', duration: String(r.duration_minutes || 60), pdf: '', video: '', source: 'requirement', live: true })),
      ...res.map((r, rIndex) => ({ id: first(r, ['training_id','id'], ''), title: first(r, ['title','training_title'], 'Training resource'), description: first(r, ['notes','description'], 'Training resource.'), priority: first(r, ['status'], 'resource'), type: first(r, ['resource_type'], 'resource'), duration: '45', pdf: first(r, ['resource_url'], ''), video: '', source: 'resource', live: true })),
      ...rec.map(([title, priority, type, description]) => ({ id: '', title, description, priority, type, duration: '60', pdf: '', video: '', source: 'suggested', live: false })),
    ]
    const uniqueItems = Array.from(new Map(items.map((i) => [`${n(i.title)}-${n(i.source)}-${i.id || 'suggested'}`, i])).values())
    const completion = Math.min(98, Math.max(35, Math.round((programs.length + reqs.length + res.length) * 12 + users.length * 4)))
    return { name, id: slug(name), users, programs, requirements: reqs, resources: res, items: uniqueItems, completion, department: first(users[0], ['department'], first(rawPositions.find((p) => n(first(p, ['title','position_title','role','name'], '')) === n(name)), ['department'], 'All departments')) }
  })

  const filteredPositions = positions.filter((position) => {
    const text = [position.name, position.department, ...position.items.map((item, index) => `${item.title} ${item.description} ${item.type} ${item.priority}`)].join(' ').toLowerCase()
    const matchesQuery = !filterQuery || text.includes(filterQuery)
    const matchesDepartment = filterDepartment === 'all' || n(position.department) === n(filterDepartment) || position.users.some((user) => n(first(user, ['department'], '')) === n(filterDepartment))
    const matchesCoverage = filterCoverage === 'all' || (filterCoverage === 'ready' && position.completion >= 75) || (filterCoverage === 'risk' && position.completion < 75) || (filterCoverage === 'empty' && position.users.length === 0)
    const matchesType = filterResourceType === 'all' || position.items.some((item) => n(item.type).includes(n(filterResourceType)) || n(item.priority).includes(n(filterResourceType)))
    const matchesMapped = !filterOnlyMapped || position.users.length > 0
    return matchesQuery && matchesDepartment && matchesCoverage && matchesType && matchesMapped
  })

  const totalStaff = staff.length
  const totalPrograms = trainingPrograms.length
  const totalResources = resources.length
  const positionCoverage = positions.length ? Math.round(positions.reduce((a, p) => a + p.completion, 0) / positions.length) : 0
  const filteredCoverage = filteredPositions.length ? Math.round(filteredPositions.reduce((a, p) => a + p.completion, 0) / filteredPositions.length) : 0
  const resourceTypeOptions = ['all', 'pdf', 'video', 'link', 'checklist', 'workshop', 'sop', 'mandatory', 'recommended', 'compliance', 'critical']
  const liveAssignments = assignments.map((a, index) => ({
    id: first(a, ['id'], String(index)),
    staff: first(a, ['staff_name','employee_name','user_name'], 'Assigned staff'),
    position: first(a, ['position_title','position','role'], 'Position'),
    training: first(a, ['training_title','title'], 'Training'),
    status: first(a, ['status'], 'assigned'),
    progress: Number(a.progress_percent ?? a.progress ?? 0),
    priority: first(a, ['priority'], 'normal'),
    due: first(a, ['due_at','due_date'], ''),
    updated: first(a, ['updated_at','created_at'], ''),
  }))
  const activeAssignments = liveAssignments.filter((a) => !['passed','approved','completed','cancelled'].includes(n(a.status)))
  const completedAssignments = liveAssignments.filter((a) => ['passed','approved','completed'].includes(n(a.status)))
  const overdueAssignments = activeAssignments.filter((a) => a.due && new Date(a.due).getTime() < Date.now())

  return <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
    <div className="flex">
      <SideBar />
      <main className="min-w-0 flex-1 p-6">
        <header className="mb-6 rounded-[34px] border border-slate-200 bg-white p-6 shadow-[0_18px_80px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div><p className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Live synced training data</p><h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">HR Training & Resource Command Center</h1><p className="mt-2 max-w-4xl text-sm font-bold leading-6 text-slate-600">Position-based training bank synced with Users management, HR employees, departments, roles, resources and compliance readiness. Click any position to open its full training resource workspace.</p></div>
            <div className="flex flex-wrap gap-3"><a href="#modal-live-control" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200"><Gauge className="h-4 w-4" />Live Control</a><a href="#modal-assign-training" className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200"><Plus className="h-4 w-4" />Assign Training</a><Link href="/hr/training#modal-position-library" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700"><BookOpen className="h-4 w-4" />Learning Hub</Link></div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[['Synced staff', money(totalStaff), 'Users + HR employees', Users, 'blue'], ['Positions', money(positions.length), 'From users management', BriefcaseBusiness, 'violet'], ['Training records', money(totalPrograms), 'Live programs', GraduationCap, 'emerald'], ['Resource bank', money(totalResources), 'PDF/video/link records', Library, 'amber']].map(([label, val, sub, Icon, tone]) => { const I = Icon as any; return <a key={String(label)} href="#modal-position-library" className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{String(label)}</p><p className="mt-2 text-3xl font-black text-slate-950">{String(val)}</p><p className="mt-1 text-xs font-bold text-slate-500">{String(sub)}</p></div><div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${toneClasses(tone as Tone)} text-white`}><I className="h-5 w-5" /></div></div></a> })}
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <Panel title="Position-based training bank" subtitle="Browse positions through a controlled filter panel instead of loading every position as one huge open section." action={<span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">{pct(filteredCoverage)} filtered coverage</span>}>
            {(sp('dismissed') || sp('deleted') || sp('saved') || sp('dismissed_error')) ? (
            <div id="training-live-action-feedback-banner" className="mb-5 rounded-[26px] border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">
                    Live sync update
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-950">
                    {sp('dismissed_error')
                      ? `Delete failed: ${sp('dismissed_error')}`
                      : sp('dismissed')
                        ? `Suggestion removed from this position bank: ${sp('dismissed')}`
                        : sp('deleted')
                          ? `Training resource deleted permanently: ${sp('deleted')}`
                          : `Training resource saved live: ${sp('saved')}`}
                  </p>
                </div>
                <Link href="/hr/training" className="rounded-2xl bg-white px-4 py-3 text-xs font-black text-emerald-700 shadow-sm">
                  Clear notice
                </Link>
              </div>
            </div>
          ) : null}

          <form className="mb-5 rounded-[26px] border border-slate-200 bg-gradient-to-br from-white via-violet-50/60 to-blue-50/60 p-4 shadow-sm" action="/hr/training" method="get">
              <div className="grid gap-3 lg:grid-cols-[1.2fr_0.9fr_0.8fr_0.8fr_auto]">
                <label className="block"><span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Search positions / trainings</span><div className="mt-2 flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4"><Search className="h-4 w-4 text-slate-400" /><input name="q" defaultValue={sp('q')} placeholder="Caregiver, field staff, PDF, compliance..." className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none" /></div></label>
                <label className="block"><span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Department</span><select name="department" defaultValue={filterDepartment} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800"><option value="all">All departments</option>{departments.map((department, index) => <option key={`filter-dept-${index}-${department}`} value={department}>{department}</option>)}</select></label>
                <label className="block"><span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Coverage</span><select name="coverage" defaultValue={filterCoverage} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800"><option value="all">All coverage</option><option value="ready">Ready 75%+</option><option value="risk">Needs work</option><option value="empty">No users mapped</option></select></label>
                <label className="block"><span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Resource type</span><select name="resource_type" defaultValue={filterResourceType} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800">{resourceTypeOptions.map((type, index) => <option key={`filter-type-${index}-${type}`} value={type}>{type === 'all' ? 'All types' : type}</option>)}</select></label>
                <div className="flex items-end gap-2"><button className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white"><Filter className="h-4 w-4" />Apply</button><Link href="/hr/training" className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600">Reset</Link></div>
              </div>
              <label className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm"><input type="checkbox" name="mapped" value="yes" defaultChecked={filterOnlyMapped} className="h-4 w-4 rounded border-slate-300" />Show only positions with mapped users</label>
            </form>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-950 px-4 py-3 text-white"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-white/45">Filtered position bank</p><p className="text-sm font-black">Showing {filteredPositions.length} of {positions.length} synced positions</p></div><div className="flex gap-2 text-xs font-black"><span className="rounded-full bg-white/10 px-3 py-1">{money(filteredPositions.reduce((a, p) => a + p.users.length, 0))} users</span><span className="rounded-full bg-white/10 px-3 py-1">{money(filteredPositions.reduce((a, p) => a + p.items.length, 0))} resources</span></div></div>

            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {filteredPositions.map((position, positionIndex) => <a key={`position-card-${positionIndex}-${position.id || position.name}`} href={`#modal-position-bank-${position.id}`} className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-2xl">
                <div className={`h-2 bg-gradient-to-r ${toneClasses(resourceTone(position.items[0]?.priority || 'normal'))}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Position file</p><h3 className="mt-2 text-xl font-black text-slate-950">{position.name}</h3><p className="mt-1 text-xs font-bold text-slate-500">{position.department}</p></div><div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white"><BriefcaseBusiness className="h-5 w-5" /></div></div>
                  <div className="mt-5 grid grid-cols-3 gap-3"><div className="rounded-2xl bg-slate-50 p-3"><p className="text-lg font-black">{position.users.length}</p><p className="text-[10px] font-black uppercase text-slate-400">Users</p></div><div className="rounded-2xl bg-slate-50 p-3"><p className="text-lg font-black">{position.items.length}</p><p className="text-[10px] font-black uppercase text-slate-400">Resources</p></div><div className="rounded-2xl bg-slate-50 p-3"><p className="text-lg font-black">{pct(position.completion)}</p><p className="text-[10px] font-black uppercase text-slate-400">Ready</p></div></div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-400" style={{ width: pct(position.completion) }} /></div>
                  <p className="mt-4 text-xs font-black text-violet-700">Open position training bank →</p>
                </div>
              </a>)}
              {!filteredPositions.length ? <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center md:col-span-2 2xl:col-span-3"><Filter className="mx-auto h-8 w-8 text-slate-300" /><h3 className="mt-3 text-lg font-black text-slate-900">No positions match these filters</h3><p className="mt-2 text-sm font-bold text-slate-500">Reset filters or adjust search, department, coverage, or resource type.</p><Link href="/hr/training" className="mt-4 inline-flex rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white">Reset filters</Link></div> : null}
            </div>
          </Panel>

          <aside className="space-y-6">
            <Panel title="Training bank radar" subtitle="Coverage by live position sync.">
              <div className="space-y-4">{filteredPositions.slice(0, 8).map((p, pIndex) => <a key={`radar-${pIndex}-${p.id}`} href={`#modal-position-bank-${p.id}`} className="block rounded-2xl border border-slate-100 p-3 hover:bg-violet-50/40"><div className="flex items-center justify-between text-xs font-black"><span>{p.name}</span><span>{pct(p.completion)}</span></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-400" style={{ width: pct(p.completion) }} /></div></a>)}</div>
            </Panel>
            <Panel title="Quick actions" subtitle="Large in-page workspaces.">
              <div className="grid gap-3"><a href="#modal-add-global-training" className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white"><Plus className="h-4 w-4" />Add global training</a><a href="#modal-upload-resource" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"><Upload className="h-4 w-4" />Upload resource link</a><a href="#modal-compliance-overview" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"><ShieldCheck className="h-4 w-4" />Compliance overview</a></div>
            </Panel>
          </aside>
        </section>
      </main>
    </div>

    {positions.map((position, positionIndex) => <Modal key={`modal-position-${positionIndex}-${position.id}`} id={`modal-position-bank-${position.id}`} title={`${position.name} — Training Resource Bank`} subtitle="Browse, preview, add, edit, remove and sync every training resource attached to this position. This workspace is connected to Users management positions, HR staff, training programs, requirements and resource links." ultra>
      <div className="grid gap-7 xl:grid-cols-[1.5fr_0.75fr]">
        <section className="space-y-6">
          <div className="rounded-[30px] bg-slate-950 p-6 text-white shadow-2xl"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Synced position file</p><h4 className="mt-2 text-3xl font-black">{position.name}</h4><p className="mt-2 text-sm font-bold text-white/60">{position.department} • {position.users.length} mapped user(s) • {position.items.length} training resource(s)</p></div><div className="grid h-16 w-16 place-items-center rounded-3xl bg-white/10"><Library className="h-7 w-7" /></div></div><div className="mt-6 grid gap-3 md:grid-cols-4">{[['Users', position.users.length], ['Live programs', position.programs.length], ['Requirements', position.requirements.length], ['Resources', position.items.length]].map(([label, val]) => <div key={`position-stat-${positionIndex}-${position.id}-${label}`} className="rounded-2xl bg-white/10 p-4"><p className="text-2xl font-black">{val}</p><p className="text-[10px] font-black uppercase text-white/50">{label}</p></div>)}</div></div>

          <Panel title="Modern training resource cards" subtitle="Click any resource to open technical details, preview links, edit metadata or remove it from this position.">
            <div className="grid gap-4 lg:grid-cols-2">
              {position.items.map((item, index) => {
                const id = `${position.id}-${positionIndex}-${index}-${slug(item.title)}`
                const tone = resourceTone(item.priority)
                return <div key={`resource-card-${id}`} className="group overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <div className={`h-1.5 bg-gradient-to-r ${toneClasses(tone)}`} />

                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${toneClasses(tone)} text-white`}>
                        <ResourceIcon type={item.type} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-600">{item.priority}</span>
                          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-black uppercase text-violet-600">{item.type}</span>
                          {item.live ? (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-600">Live saved</span>
                          ) : (
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase text-amber-600">Suggested only</span>
                          )}
                        </div>

                        <h5 className="mt-3 line-clamp-2 text-lg font-black text-slate-950">{item.title}</h5>
                        <p className="mt-2 line-clamp-2 text-xs font-bold leading-5 text-slate-500">{item.description}</p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs font-black text-slate-500">Duration: {item.duration} min</span>

                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`#modal-training-resource-${id}`}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white"
                        >
                          Edit details <Eye className="h-3.5 w-3.5" />
                        </a>

                        {item.id ? (
                          <form action={deleteTrainingResourceAction}>
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="position_title" value={position.name} />
                            <button className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-rose-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-rose-100">
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete permanently
                            </button>
                          </form>
                        ) : (
                          <>
                            <form action={saveTrainingResourceAction}>
                              <input type="hidden" name="position_title" value={position.name} />
                              <input type="hidden" name="title" value={item.title} />
                              <input type="hidden" name="department" value={position.department} />
                              <input type="hidden" name="resource_type" value={item.type} />
                              <input type="hidden" name="training_type" value="position_resource" />
                              <input type="hidden" name="requirement_level" value={item.priority} />
                              <input type="hidden" name="duration_minutes" value={item.duration} />
                              <input type="hidden" name="due_days" value="14" />
                              <input type="hidden" name="priority" value={item.priority} />
                              <input type="hidden" name="pdf_url" value={item.pdf} />
                              <input type="hidden" name="video_url" value={item.video} />
                              <input type="hidden" name="resource_url" value={item.pdf || item.video || ""} />
                              <input type="hidden" name="description" value={item.description} />
                              <button className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
                                <Save className="h-3.5 w-3.5" />
                                Save as live
                              </button>
                            </form>

                            <form action={dismissSuggestedTrainingResourceAction}>
                              <input type="hidden" name="position_title" value={position.name} />
                              <input type="hidden" name="title" value={item.title} />
                              <input type="hidden" name="resource_type" value={item.type} />
                              <button className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-rose-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-rose-100 hover:bg-rose-700">
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete permanently
                              </button>
                            </form>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              })}
            </div>
          </Panel>

          <Panel title="Users mapped to this position" subtitle="Pulled directly from app users and HR employee records.">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{position.users.length ? position.users.slice(0, 12).map((user, index) => <div key={`position-user-${positionIndex}-${index}-${position.id}-${first(user, ['id','email','full_name','name'], String(index))}`} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-xs font-black text-white">{initials(first(user, ['full_name','name','email'], 'U'))}</div><div className="min-w-0"><p className="truncate text-sm font-black text-slate-900">{first(user, ['full_name','name','email'], 'Staff')}</p><p className="truncate text-xs font-bold text-slate-500">{first(user, ['email','department'], 'Synced user')}</p></div></div>) : <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">No user currently mapped to this position yet. Add/update positions in Users management to sync coverage.</p>}</div>
          </Panel>
        </section>

        <aside className="space-y-6">
          <Panel title="Add training resource" subtitle="Creates or links a live training program to this position.">
            <form action={saveTrainingResourceAction} className="space-y-4"><input type="hidden" name="position_title" value={position.name} /><Field label="Training title" name="title" required value={position.items[0]?.title || ''} /><Field label="Department" name="department" value={position.department} /><SelectField label="Resource type" name="resource_type" options={['pdf','video','link','checklist','workshop','sop']} /><SelectField label="Training type" name="training_type" options={['position_resource','position_requirement','mandatory','compliance','certification','workshop']} /><SelectField label="Requirement level" name="requirement_level" options={['mandatory','recommended','compliance','critical','optional']} /><Field label="Duration minutes" name="duration_minutes" type="number" value="60" /><Field label="Due days" name="due_days" type="number" value="14" /><SelectField label="Priority" name="priority" options={['normal','recommended','mandatory','high','urgent','critical']} /><Field label="PDF URL" name="pdf_url" /><Field label="Video URL" name="video_url" /><Field label="Resource URL" name="resource_url" /><textarea name="description" defaultValue={`Training resource for ${position.name}.`} className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold outline-none focus:border-violet-300" /><button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200"><Save className="h-4 w-4" />Save & sync training</button></form>
          </Panel>
          <Panel title="Position actions"><div className="grid gap-3"><a href="#modal-position-library" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"><Eye className="mr-2 inline h-4 w-4" />Preview all positions</a><a href="#modal-compliance-overview" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"><Target className="mr-2 inline h-4 w-4" />Review compliance</a><a href="#modal-training-search" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"><Search className="mr-2 inline h-4 w-4" />Search resources</a></div></Panel>
        </aside>
      </div>
    </Modal>)}

    {positions.flatMap((position, positionIndex) => position.items.map((item, index) => {
      const id = `${position.id}-${positionIndex}-${index}-${slug(item.title)}`
      return <Modal key={`modal-resource-${id}`} id={`modal-training-resource-${id}`} title={item.title} subtitle={`Technical training resource details for ${position.name}. Preview, edit, save or remove the live resource.`}>
        <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="space-y-5"><div className="rounded-[30px] bg-slate-950 p-6 text-white"><p className="text-xs font-black uppercase tracking-[0.18em] text-white/40">Resource technical preview</p><h4 className="mt-2 text-2xl font-black">{item.title}</h4><p className="mt-3 text-sm font-semibold leading-6 text-white/65">{item.description}</p><div className="mt-5 grid grid-cols-2 gap-3">{[['Type', item.type], ['Priority', item.priority], ['Duration', `${item.duration} min`], ['Status', item.live ? 'Live synced' : 'Suggested']].map(([label, val]) => <div key={`detail-stat-${id}-${label}`} className="rounded-2xl bg-white/10 p-3"><p className="text-[10px] font-black uppercase text-white/40">{label}</p><p className="mt-1 text-sm font-black">{val}</p></div>)}</div></div><div className="rounded-[24px] border border-slate-200 bg-white p-5"><h5 className="font-black text-slate-950">Resource links</h5><div className="mt-4 grid gap-3"><a href={item.pdf || '#'} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700"><FileText className="h-4 w-4" />Open PDF / resource link</a><a href={item.video || item.pdf || '#'} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700"><PlayCircle className="h-4 w-4" />Open training video link</a></div></div></section>
          <section><Panel title="Edit and save resource" subtitle="Every save writes to live training tables and reopens the selected position bank."><form action={saveTrainingResourceAction} className="grid gap-4 md:grid-cols-2"><input type="hidden" name="id" value={item.id} /><input type="hidden" name="position_title" value={position.name} /><Field label="Training title" name="title" value={item.title} required /><Field label="Duration minutes" name="duration_minutes" type="number" value={item.duration} /><SelectField label="Resource type" name="resource_type" value={item.type} options={['pdf','video','link','checklist','workshop','sop']} /><SelectField label="Priority" name="priority" value={item.priority} options={['normal','recommended','mandatory','high','urgent','critical']} /><Field label="PDF URL" name="pdf_url" value={item.pdf} /><Field label="Video URL" name="video_url" value={item.video} /><SelectField label="Status" name="status" options={['active','draft','paused','archived']} /><SelectField label="Requirement level" name="requirement_level" value={item.priority} options={['mandatory','recommended','compliance','critical','optional']} /><textarea name="description" defaultValue={item.description} className="min-h-[150px] rounded-2xl border border-slate-200 p-4 text-sm font-semibold md:col-span-2" /><div className="flex flex-wrap gap-3 md:col-span-2"><button className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white"><Save className="h-4 w-4" />Save changes</button><a href={`#modal-position-bank-${position.id}`} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700"><Eye className="h-4 w-4" />Back to position</a></div></form>{item.id ? <form action={deleteTrainingResourceAction} className="mt-4"><input type="hidden" name="id" value={item.id} /><input type="hidden" name="position_title" value={position.name} /><button className="inline-flex items-center gap-2 rounded-2xl border border-rose-300 bg-rose-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-rose-200"><Trash2 className="h-4 w-4" />Delete permanently</button></form> : null}</Panel></section>
        </div>
      </Modal>
    }))}


    <Modal id="modal-live-control" title="Training Live Control Center" subtitle="Monitor assigned training, progression, approvals, overdue risk and HR readiness in one live enterprise workspace." ultra>
      <div className="grid gap-7 xl:grid-cols-[1.5fr_0.8fr]">
        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[["Active", activeAssignments.length, "In progress", Gauge], ["Passed", completedAssignments.length, "Approved completions", CheckCircle2], ["Overdue", overdueAssignments.length, "Need attention", AlertTriangle], ["Coverage", pct(positionCoverage), "Position readiness", Target]].map(([label, value, sub, Icon], i) => { const I = Icon as any; return <div key={`live-control-kpi-${String(label)}-${i}`} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{String(label)}</p><p className="mt-2 text-3xl font-black text-slate-950">{String(value)}</p><p className="mt-1 text-xs font-bold text-slate-500">{String(sub)}</p></div><div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white"><I className="h-5 w-5" /></div></div></div> })}
          </div>
          <Panel title="Ongoing assigned training monitor" subtitle="Approve passing, update progress and track HR staff training state from live assignment records.">
            <div className="space-y-3">
              {liveAssignments.length ? liveAssignments.slice(0, 40).map((assignment, index) => <div key={`assignment-row-${index}-${assignment.id}`} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0"><p className="text-sm font-black text-slate-950">{assignment.training}</p><p className="mt-1 text-xs font-bold text-slate-500">{assignment.staff} • {assignment.position} • {assignment.status}</p></div>
                  <div className="flex min-w-[220px] items-center gap-3"><div className="h-2 flex-1 rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-400" style={{ width: pct(assignment.progress) }} /></div><span className="w-10 text-right text-xs font-black text-slate-700">{pct(assignment.progress)}</span></div>
                </div>
                <form action={updateTrainingAssignmentAction} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto]"><input type="hidden" name="id" value={assignment.id} /><SelectField label="Status" name="status" value={assignment.status} options={["assigned","in_progress","under_review","passed","approved","retake_required","paused"]} /><Field label="Progress %" name="progress_percent" type="number" value={String(assignment.progress)} /><Field label="Manager note" name="notes" value="Progress updated from Live Control Center" /><button className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 text-sm font-black text-white"><Save className="h-4 w-4" />Save / approve</button></form>
              </div>) : <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-8 text-center"><GraduationCap className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-lg font-black text-slate-900">No assigned trainings yet</p><p className="mt-2 text-sm font-bold text-slate-500">Use Assign Training to create the first synced training assignment.</p></div>}
            </div>
          </Panel>
        </section>
        <aside className="space-y-6">
          <Panel title="Control navigation" subtitle="Operational shortcuts."><div className="grid gap-3"><a href="#modal-assign-training" className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white">Assign new training</a><a href="#modal-compliance-overview" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">Compliance overview</a><Link href="/hr/training" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">Back to training bank</Link></div></Panel>
          <Panel title="Department pulse" subtitle="Coverage by filtered positions."><div className="space-y-3">{departments.slice(0, 8).map((department, index) => { const related = positions.filter((p) => n(p.department) === n(department)); const val = related.length ? Math.round(related.reduce((a,p)=>a+p.completion,0)/related.length) : positionCoverage; return <div key={`department-pulse-${index}-${department}`} className="rounded-2xl border border-slate-100 p-3"><div className="flex items-center justify-between text-xs font-black"><span>{department}</span><span>{pct(val)}</span></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-400" style={{ width: pct(val) }} /></div></div>})}</div></Panel>
        </aside>
      </div>
    </Modal>

    <AssignTrainingEnterpriseModal
      staff={staff}
      departments={departments}
      positions={positions.map((p, pIndex) => ({ id: p.id, name: p.name, department: p.department, completion: p.completion, usersCount: p.users.length, items: p.items }))}
      trainings={Array.from(new Map(positions.flatMap((p, positionIndex) => p.items.map((item, index) => {
        const uiTrainingId = `${p.id}-${positionIndex}-${index}-${item.id || slug(item.title)}`
        return [`${uiTrainingId}-${n(item.title)}-${n(item.source)}`, { ...item, id: uiTrainingId, sourceTrainingId: item.id, position: p.name, positionId: p.id, department: p.department }]
      }))).values())}
    />
    {['training-search','position-library','add-global-training','upload-resource','compliance-overview'].map((id) => <Modal key={`generic-modal-${id}`} id={`modal-${id}`} title={id.split('-').map((p, pIndex) => p[0].toUpperCase() + p.slice(1)).join(' ')} subtitle="Large in-page management workspace connected to HR training context, positions, users and resources.">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"><Panel title="Management workspace" subtitle="Use this area to browse, filter, assign, upload, review or export training resources."><div className="grid gap-4 md:grid-cols-2"><Field label="Search / title" name="q" /><SelectField label="Position" name="position" options={positionNames} /><SelectField label="Department" name="department" options={departments.length ? departments : ['All departments']} /><SelectField label="Resource type" name="resource_type" options={['all','pdf','video','link','checklist','workshop']} /></div><div className="mt-5 flex flex-wrap gap-3"><a href="#" className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white">Save action</a><a href="#" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">Close</a></div></Panel><Panel title="Live context"><div className="grid grid-cols-2 gap-3 text-sm font-black text-slate-600"><span>Staff: {totalStaff}</span><span>Positions: {positions.length}</span><span>Programs: {totalPrograms}</span><span>Resources: {totalResources}</span></div></Panel></div>
    </Modal>)}
  </div>
}
