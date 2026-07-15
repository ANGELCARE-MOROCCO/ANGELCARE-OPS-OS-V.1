import AngelCareLogo from "@/components/brand/AngelCareLogo";
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
import { cookies } from 'next/headers'
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


const HR_TRAINING_DELETED_COOKIE = 'angelcare_hr_training_deleted_resources_v1'

function hrTrainingDecodeDeletedCookie(value: string): string[] {
  try {
    const parsed = JSON.parse(decodeURIComponent(value || '[]'))
    return Array.isArray(parsed) ? parsed.map((key) => String(key || '')).filter(Boolean) : []
  } catch {
    return []
  }
}

async function readHrTrainingDeletedCookieKeys() {
  try {
    const store = await cookies()
    return new Set(
      hrTrainingDecodeDeletedCookie(store.get(HR_TRAINING_DELETED_COOKIE)?.value || '')
        .map((key) => n(key))
        .filter(Boolean)
    )
  } catch {
    return new Set<string>()
  }
}

async function rememberHrTrainingDeletedKeys(keys: unknown[]) {
  try {
    const store = await cookies()
    const current = hrTrainingDecodeDeletedCookie(store.get(HR_TRAINING_DELETED_COOKIE)?.value || '')
    const merged = Array.from(
      new Set(
        [...current, ...keys.map((key) => String(key || '')).filter(Boolean)]
          .map((key) => n(key))
          .filter(Boolean)
      )
    ).slice(-350)

    store.set(HR_TRAINING_DELETED_COOKIE, encodeURIComponent(JSON.stringify(merged)), {
      path: '/hr/training',
      maxAge: 60 * 60 * 24 * 365 * 5,
      sameSite: 'lax',
    })
  } catch {}
}

function hrTrainingMetadata(row: Row | undefined): Row {
  const raw = row?.metadata

  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Row

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Row : {}
    } catch {
      return {}
    }
  }

  return {}
}

function hrTrainingDeletedEventKeys(event: Row): string[] {
  const metadata = hrTrainingMetadata(event)
  const keys = Array.isArray(metadata.suggestion_keys) ? metadata.suggestion_keys : []
  const title = s(metadata.title || metadata.course_title)
  const positionTitle = s(metadata.position_title)
  const resourceType = s(metadata.resource_type || metadata.type || metadata.source || 'training')
  const titleKeys = title ? trainingSuggestionKeys(positionTitle, title, resourceType) : []

  const rawKeys = [
    metadata.suggestion_key,
    metadata.resource_id,
    metadata.training_id,
    metadata.id,
    first(event, ['entity_id'], ''),
    ...keys,
    ...titleKeys,
    title,
    title ? slug(title) : '',
  ]

  return rawKeys.map((key) => n(key)).filter(Boolean)
}

function trainingDeletedResourceMatched(
  dismissedKeys: Set<string>,
  position: string,
  item: { id?: unknown; title?: unknown; type?: unknown; source?: unknown },
) {
  const id = s(item.id)
  const title = s(item.title)
  const type = s(item.type || item.source || 'suggested')
  const source = s(item.source || type || 'suggested')

  if (id && (dismissedKeys.has(n(id)) || dismissedKeys.has(slug(id)))) return true
  if (!title) return false

  return (
    trainingSuggestionDismissed(dismissedKeys, position, title, type) ||
    trainingSuggestionDismissed(dismissedKeys, position, title, source) ||
    trainingSuggestionDismissed(dismissedKeys, position, title, 'training') ||
    trainingSuggestionDismissed(dismissedKeys, position, title, 'suggested') ||
    dismissedKeys.has(n(title)) ||
    dismissedKeys.has(slug(title))
  )
}


function acTrainingMemoLineV1(message: unknown, key: string) {
  const text = String(message || '')
  const prefix = `${key.toLowerCase()}:`
  const line = text.split('\n').find((entry) => entry.trim().toLowerCase().startsWith(prefix))
  return line ? line.split(':').slice(1).join(':').trim() : ''
}

function acTrainingMemoCourseV1(title: unknown, message: unknown) {
  const cleanTitle = String(title || '').replace('Formation assignée ·', '').trim()
  return cleanTitle || acTrainingMemoLineV1(message, 'Formation') || 'Scheduled training'
}

function acTrainingMemoDueV1(message: unknown, createdAt: unknown) {
  const due = acTrainingMemoLineV1(message, 'Échéance') || acTrainingMemoLineV1(message, 'Due')
  return due || String(createdAt || '').slice(0, 10)
}

function acTrainingMemoMonthV1(message: unknown, createdAt: unknown) {
  const due = acTrainingMemoDueV1(message, createdAt)
  return String(due || createdAt || '').slice(0, 7)
}


function acScheduledTrainingMsV2(value: unknown) {
  const text = String(value || '').trim()
  if (!text) return 0
  const ms = Date.parse(text)
  return Number.isFinite(ms) ? ms : 0
}

function acScheduledTrainingStateV2(due: unknown, status: unknown, progress: unknown) {
  const cleanStatus = n(status)
  const numericProgress = Number(progress || 0)
  const dueMs = acScheduledTrainingMsV2(due)
  const now = Date.now()

  if (
    numericProgress >= 100 ||
    ['passed', 'approved', 'completed', 'complete', 'done', 'validé', 'valide'].some((word) => cleanStatus.includes(word))
  ) {
    return 'passed'
  }

  if (dueMs && now > dueMs) return 'overdue'
  if (dueMs && dueMs - now <= 60 * 60 * 1000) return 'warning'
  return 'scheduled'
}

function acScheduledTrainingRemainingV2(due: unknown) {
  const dueMs = acScheduledTrainingMsV2(due)
  if (!dueMs) return 'No due date'

  const diff = dueMs - Date.now()
  const abs = Math.abs(diff)
  const days = Math.floor(abs / 86_400_000)
  const hours = Math.floor((abs % 86_400_000) / 3_600_000)
  const minutes = Math.max(1, Math.floor((abs % 3_600_000) / 60_000))

  if (diff < 0) {
    if (days > 0) return `Overdue ${days}d ${hours}h`
    if (hours > 0) return `Overdue ${hours}h ${minutes}m`
    return `Overdue ${minutes}m`
  }

  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h ${minutes}m left`
  return `${minutes}m left`
}

function acScheduledTrainingProgressV2(start: unknown, due: unknown, status: unknown, progress: unknown) {
  const numericProgress = Number(progress || 0)
  const state = acScheduledTrainingStateV2(due, status, progress)

  if (state === 'passed') return 100
  if (numericProgress > 0) return Math.max(0, Math.min(100, numericProgress))

  const startMs = acScheduledTrainingMsV2(start)
  const dueMs = acScheduledTrainingMsV2(due)

  if (!startMs || !dueMs || dueMs <= startMs) {
    return state === 'overdue' ? 100 : 0
  }

  return Math.max(0, Math.min(100, Math.round(((Date.now() - startMs) / (dueMs - startMs)) * 100)))
}

function acScheduledTrainingBadgeV2(state: string) {
  if (state === 'passed') return 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 animate-pulse'
  if (state === 'overdue') return 'bg-rose-600 text-white shadow-lg shadow-rose-200 animate-pulse'
  if (state === 'warning') return 'bg-yellow-400 text-slate-950 shadow-lg shadow-yellow-200 animate-pulse'
  return 'bg-violet-50 text-violet-700'
}

function acScheduledTrainingCardV2(state: string) {
  if (state === 'passed') return 'border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-white shadow-[0_22px_55px_rgba(16,185,129,0.22)] animate-pulse'
  if (state === 'overdue') return 'border-rose-300 bg-gradient-to-br from-rose-50 via-white to-white shadow-[0_22px_55px_rgba(244,63,94,0.22)] animate-pulse'
  if (state === 'warning') return 'border-yellow-300 bg-gradient-to-br from-yellow-50 via-white to-white shadow-[0_22px_55px_rgba(234,179,8,0.24)] animate-pulse'
  return 'border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white shadow-sm hover:border-violet-300 hover:shadow-[0_22px_60px_rgba(124,58,237,0.14)]'
}

function acScheduledTrainingBarV2(state: string) {
  if (state === 'passed') return 'bg-emerald-500'
  if (state === 'overdue') return 'bg-rose-600'
  if (state === 'warning') return 'bg-yellow-400'
  return 'bg-violet-600'
}

function acScheduledTrainingLabelV2(state: string) {
  if (state === 'passed') return 'PASSED'
  if (state === 'overdue') return 'OVERDUE'
  if (state === 'warning') return 'DUE < 60 MIN'
  return 'SCHEDULED'
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

    if (table === 'hr_activity_events') {
      const { data } = await supabase
        .from(table)
        .select(columns)
        .order('created_at', { ascending: false })
        .limit(limit)

      return (data || []) as Row[]
    }

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

  // ANGELCARE COURSE COMMAND WORKSPACE — HTML course, schedule, scores
  const acCourseCommandMode = String(formData.get('course_command_mode') || '')
  const acResourceIdRaw = String(formData.get('id') || '').trim()
  const acPositionTitle = String(formData.get('position_title') || '').trim()
  const acCourseTitle = String(formData.get('title') || '').trim()
  const acFallbackResourceId = `${acPositionTitle}-${acCourseTitle}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const acResourceId = acResourceIdRaw || acFallbackResourceId

  const acHtmlCourseCode = String(formData.get('html_course_code') || '').trim()
  const acCourseBuilderPrompt = String(formData.get('course_builder_prompt') || '').trim()
  const acCommandNotes = String(formData.get('course_command_notes') || '').trim()
  const acPassScoreRaw = Number(formData.get('course_pass_score') || 75)
  const acPassScore = Number.isFinite(acPassScoreRaw) ? Math.max(0, Math.min(100, acPassScoreRaw)) : 75

  if (acCourseCommandMode === 'course_command_workspace' && acResourceId && acCourseTitle) {
    await supabase
      .from('hr_training_course_command_extensions')
      .upsert({
        resource_id: acResourceId,
        position_title: acPositionTitle,
        course_title: acCourseTitle,
        html_course_code: acHtmlCourseCode || null,
        course_builder_prompt: acCourseBuilderPrompt || null,
        live_assessment_enabled: String(formData.get('live_assessment_enabled') || '') === 'on',
        pass_score: acPassScore,
        assessment_capture_mode: 'named_fields',
        status: String(formData.get('course_command_status') || 'active'),
        notes: acCommandNotes || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'resource_id,position_title' })
  }

  const acEmployeeId = String(formData.get('schedule_employee_id') || '').trim()
  const acEmployeeName = String(formData.get('schedule_employee_name') || '').trim()
  const acScheduledAt = String(formData.get('scheduled_at') || '').trim()
  const acDueAt = String(formData.get('due_at') || '').trim()
  const acTrainerName = String(formData.get('trainer_name') || '').trim()
  const acTrainingStatus = String(formData.get('training_status') || '').trim()
  const acScoreRawText = String(formData.get('score_percent') || '').trim()
  const acScoreRaw = acScoreRawText ? Number(acScoreRawText) : null
  const acScore = Number.isFinite(acScoreRaw as number) ? Math.max(0, Math.min(100, acScoreRaw as number)) : null

  const acSelectedEmployeeTokens = formData.getAll('schedule_employee_ids').map((value) => String(value || '').trim()).filter(Boolean)
  const acSelectedEmployees = acSelectedEmployeeTokens.map((token) => {
    try {
      const parsed = JSON.parse(token) as Record<string, unknown>
      return {
        id: String(parsed.id || '').trim(),
        name: String(parsed.name || parsed.email || parsed.id || '').trim(),
        email: String(parsed.email || '').trim(),
      }
    } catch {
      return {
        id: token,
        name: token,
        email: '',
      }
    }
  }).filter((employee) => employee.id || employee.name)

  if (
    acSelectedEmployees.length === 0
    &&
    acCourseCommandMode === 'course_command_workspace'
    && acResourceId
    && acCourseTitle
    && acSelectedEmployees.length > 0
  ) {
    await supabase
      .from('hr_training_course_assignments')
      .insert(acSelectedEmployees.map((employee) => ({
        resource_id: acResourceId,
        position_title: acPositionTitle,
        course_title: acCourseTitle,
        employee_id: employee.id || null,
        employee_name: employee.name || null,
        scheduled_at: acScheduledAt || null,
        due_at: acDueAt || null,
        trainer_name: acTrainerName || null,
        session_mode: String(formData.get('session_mode') || 'online'),
        status: acTrainingStatus || 'scheduled',
        score_percent: acScore,
        pass_score: acPassScore,
        attempt_count: Number(formData.get('attempt_count') || 0) || 0,
        completed_at: String(formData.get('completed_at') || '').trim() || null,
        delayed_reason: String(formData.get('delayed_reason') || '').trim() || null,
        evidence_url: String(formData.get('evidence_url') || '').trim() || null,
        notes: String(formData.get('training_assignment_notes') || '').trim() || null,
        updated_at: new Date().toISOString(),
      })))
  }


  if (
    acCourseCommandMode === 'course_command_workspace'
    && acResourceId
    && acCourseTitle
    && (acEmployeeId || acEmployeeName || acScheduledAt || acDueAt || acTrainingStatus || acScoreRawText)
  ) {
    await supabase
      .from('hr_training_course_assignments')
      .insert({
        resource_id: acResourceId,
        position_title: acPositionTitle,
        course_title: acCourseTitle,
        employee_id: acEmployeeId || null,
        employee_name: acEmployeeName || null,
        scheduled_at: acScheduledAt || null,
        due_at: acDueAt || null,
        trainer_name: acTrainerName || null,
        session_mode: String(formData.get('session_mode') || 'online'),
        status: acTrainingStatus || 'scheduled',
        score_percent: acScore,
        pass_score: acPassScore,
        attempt_count: Number(formData.get('attempt_count') || 0) || 0,
        completed_at: String(formData.get('completed_at') || '').trim() || null,
        delayed_reason: String(formData.get('delayed_reason') || '').trim() || null,
        evidence_url: String(formData.get('evidence_url') || '').trim() || null,
        notes: String(formData.get('training_assignment_notes') || '').trim() || null,
        updated_at: new Date().toISOString(),
      })
  }

  revalidatePath('/hr/training')
  redirect(`/hr/training#modal-position-bank-${slug(position)}`)
}


async function dismissSuggestedTrainingResourceAction(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const position = s(formData.get('position_title'))
  const title = s(formData.get('title'))
  const resourceType = s(formData.get('resource_type')) || 'suggested'
  const suggestionKeys = trainingSuggestionKeys(position, title, resourceType)
  const suggestionKey = suggestionKeys[0]

  if (!position || !title) {
    redirect('/hr/training?dismissed=missing_context')
  }

  await rememberHrTrainingDeletedKeys([suggestionKey, ...suggestionKeys, title, slug(title)])

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
      course_title: title,
      resource_type: resourceType,
      suggestion_key: suggestionKey,
      suggestion_keys: suggestionKeys,
      delete_mode: 'permanent_cookie_and_db_tombstone',
    },
  })

  revalidatePath('/hr/training')
  redirect(`/hr/training?dismissed=${encodeURIComponent(title)}#modal-position-bank-${slug(position)}`)
}


async function deleteTrainingResourceAction(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const id = s(formData.get('id'))
  const position = s(formData.get('position_title'))
  const title = s(formData.get('title'))
  const resourceType = s(formData.get('resource_type')) || 'training'

  if (!id && !title) {
    redirect('/hr/training?deleted=missing_context')
  }

  const suggestionKeys = title ? trainingSuggestionKeys(position, title, resourceType) : []
  const suggestionKey = suggestionKeys[0] || id || `${slug(position)}::${slug(title)}::${slug(resourceType)}`
  const deletedAt = new Date().toISOString()

  await rememberHrTrainingDeletedKeys([id, suggestionKey, ...suggestionKeys, title, title ? slug(title) : ''])

  const operations: PromiseLike<any>[] = []

  if (id) {
    ;[
      ['hr_training_programs', 'id'],
      ['hr_training_programs', 'training_id'],
      ['hr_position_training_requirements', 'id'],
      ['hr_position_training_requirements', 'training_id'],
      ['hr_training_resources', 'id'],
      ['hr_training_resources', 'training_id'],
      ['hr_training_resources', 'resource_id'],
      ['hr_training_course_assignments', 'resource_id'],
      ['hr_training_course_command_extensions', 'resource_id'],
    ].forEach(([table, column]) => {
      operations.push(supabase.from(table).delete().eq(column, id))
    })
  }

  if (title) {
    ;[
      ['hr_training_programs', 'title'],
      ['hr_training_programs', 'training_title'],
      ['hr_position_training_requirements', 'training_title'],
      ['hr_position_training_requirements', 'title'],
      ['hr_training_resources', 'title'],
      ['hr_training_resources', 'training_title'],
      ['hr_training_course_assignments', 'course_title'],
      ['hr_training_course_command_extensions', 'course_title'],
    ].forEach(([table, column]) => {
      operations.push(supabase.from(table).delete().eq(column, title))
    })
  }

  await Promise.allSettled(operations)

  const metadata = {
    id,
    resource_id: id,
    training_id: id,
    position_title: position,
    title,
    course_title: title,
    resource_type: resourceType,
    suggestion_key: suggestionKey,
    suggestion_keys: suggestionKeys,
    delete_mode: 'permanent_cookie_and_db_tombstone',
    deleted_at: deletedAt,
  }

  await supabase.from('hr_activity_events').insert({
    action: 'training_suggestion_dismissed',
    entity_type: 'position_training_suggestion',
    entity_id: suggestionKey,
    title: 'Training resource hidden permanently from training bank',
    description: `${position || 'Unknown position'} · ${title || id}`,
    created_at: deletedAt,
    metadata,
  })

  await supabase.from('hr_activity_events').insert({
    action: 'training_resource_deleted_permanently',
    entity_type: 'position_training_resource',
    entity_id: id || suggestionKey,
    title: 'Training resource permanently deleted',
    description: `${position || 'Unknown position'} · ${title || id}`,
    created_at: deletedAt,
    metadata,
  })

  revalidatePath('/hr/training')
  redirect(`/hr/training?deleted=${encodeURIComponent(title || id)}#modal-position-bank-${slug(position)}`)
}



function isAngelCareUuid(value: unknown) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim())
}


function metadataRow(value: unknown): Row {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Row

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Row : {}
    } catch {
      return {}
    }
  }

  return {}
}

function decodeAngelCareToken(value: unknown): Row {
  try {
    const raw = String(value || '').trim()
    if (!raw) return {}
    return JSON.parse(decodeURIComponent(raw)) as Row
  } catch {
    try {
      return JSON.parse(String(value || '{}')) as Row
    } catch {
      return {}
    }
  }
}


async function deleteScheduledTrainingBroadcastAction(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const memoId = s(formData.get('memo_id'))
  const trainingTitle = s(formData.get('training_title'))

  if (!memoId) {
    redirect('/hr/training?scheduled_delete_error=missing_id#training-schedule-command')
  }

  try {
    await supabase.from('workspace_broadcast_memo_targets').delete().eq('memo_id', memoId)
  } catch {}

  try {
    await supabase.from('workspace_broadcast_memo_receipts').delete().eq('memo_id', memoId)
  } catch {}

  const { error } = await supabase
    .from('workspace_broadcast_memos')
    .delete()
    .eq('id', memoId)

  revalidatePath('/hr/training')

  if (error) {
    redirect(`/hr/training?scheduled_delete_error=${encodeURIComponent(error.message)}#training-schedule-command`)
  }

  redirect(`/hr/training?scheduled_deleted=${encodeURIComponent(trainingTitle || memoId)}#training-schedule-command`)
}

async function scheduleTrainingFromMainCommandAction(formData: FormData) {
  'use server'

  const supabase = await createClient()

  async function insertBroadcastMemoSafe(payload: Row) {
    let current: Row = { ...payload }

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const { data, error } = await supabase
        .from('workspace_broadcast_memos')
        .insert(current)
        .select('id')
        .maybeSingle()

      if (!error) return { data: data as Row | null, error: null }

      const message = String(error.message || '')

      const missingColumn = message.match(/column "([^"]+)" .*does not exist/i)?.[1]
      if (missingColumn && missingColumn in current) {
        delete current[missingColumn]
        continue
      }

      const cacheColumn = message.match(/Could not find the '([^']+)' column/i)?.[1]
      if (cacheColumn && cacheColumn in current) {
        delete current[cacheColumn]
        continue
      }

      return { data: null, error }
    }

    return { data: null, error: { message: 'workspace_broadcast_memos insert failed after schema-safe retries' } as any }
  }

  async function updateBroadcastMemoMessageSafe(memoId: string, message: string) {
    try {
      await supabase
        .from('workspace_broadcast_memos')
        .update({ message, updated_at: new Date().toISOString() })
        .eq('id', memoId)
    } catch {
      try {
        await supabase
          .from('workspace_broadcast_memos')
          .update({ message })
          .eq('id', memoId)
      } catch {}
    }
  }

  const course = decodeAngelCareToken(formData.get('training_course_token'))
  const selectedEmployees = formData
    .getAll('employee_tokens')
    .map((token) => decodeAngelCareToken(token))
    .filter((employee) => s(employee.id) || s(employee.email) || s(employee.name))

  const scheduledAt = s(formData.get('scheduled_at'))
  const dueAt = s(formData.get('due_at'))
  const trainerName = s(formData.get('trainer_name')) || 'HR Training'
  const sessionMode = s(formData.get('session_mode')) || 'online'
  const priority = s(formData.get('priority')) || 'normal'
  const passScore = Math.max(0, Math.min(100, Number(formData.get('pass_score') || 75) || 75))
  const notes = s(formData.get('training_notes'))

  const positionTitle = s(course.position || course.position_title)
  const courseTitle = s(course.title || course.training_title)
  const resourceId = s(course.id || course.resource_id || `${slug(positionTitle)}-${slug(courseTitle)}`)
  const now = new Date().toISOString()

  if (!positionTitle || !courseTitle) {
    redirect('/hr/training?scheduled_error=missing_course#training-schedule-command')
  }

  if (!selectedEmployees.length) {
    redirect('/hr/training?scheduled_error=missing_employee#training-schedule-command')
  }

  let savedCount = 0
  let notifiedCount = 0
  const errors: string[] = []

  for (const employee of selectedEmployees) {
    const rawEmployeeId = s(employee.id || employee.user_id || employee.employee_id)
    const employeeEmail = s(employee.email || employee.work_email || employee.user_email).toLowerCase()
    const employeeName = s(employee.name || employee.full_name || employee.display_name || employeeEmail || rawEmployeeId || 'Employee')
    let employeeUuid = isAngelCareUuid(rawEmployeeId) ? rawEmployeeId : ''

    if (!employeeUuid && employeeEmail) {
      try {
        const { data: matchedUser } = await supabase
          .from('app_users')
          .select('id')
          .or(`email.eq.${employeeEmail},username.eq.${employeeEmail}`)
          .limit(1)
          .maybeSingle()

        employeeUuid = isAngelCareUuid((matchedUser as Row | null)?.id) ? String((matchedUser as Row).id) : ''
      } catch {}
    }

    const baseMessage = [
      `Bonjour ${employeeName}, une formation AngelCare vous a été assignée.`,
      `Formation: ${courseTitle}`,
      `Poste: ${positionTitle}`,
      `Mode: ${sessionMode}`,
      `Score cible: ${passScore}%`,
      scheduledAt ? `Démarrage: ${scheduledAt}` : '',
      dueAt ? `Échéance: ${dueAt}` : '',
      notes ? `Notes RH: ${notes}` : '',
      `RESOURCE_ID: ${resourceId}`,
      `EMPLOYEE: ${employeeName}`,
      employeeEmail ? `EMAIL: ${employeeEmail}` : '',
    ].filter(Boolean).join('\n')

    const payload: Row = {
      title: `Formation assignée · ${courseTitle}`,
      message: baseMessage,
      memo_type: 'hr_training_assignment',
      priority,
      status: 'active',
      target_roles: [],
      target_user_ids: employeeUuid ? [employeeUuid] : [],
      starts_at: now,
      created_at: now,
      updated_at: now,
    }

    const { data: memoRow, error: memoError } = await insertBroadcastMemoSafe(payload)

    if (memoError) {
      errors.push(`broadcast_memo:${memoError.message}`)
      continue
    }

    const memoId = s((memoRow as Row | null)?.id)
    if (!memoId) {
      errors.push('broadcast_memo:no_id_returned')
      continue
    }

    const courseUrl = `/hr/training/online/${memoId}`
    await updateBroadcastMemoMessageSafe(memoId, `${baseMessage}\nCOURSE_LINK: ${courseUrl}`)

    savedCount += 1
    notifiedCount += employeeUuid ? 1 : 0
  }

  revalidatePath('/hr/training')

  if (!savedCount) {
    redirect(`/hr/training?scheduled_error=${encodeURIComponent(errors[0] || 'broadcast_schedule_failed')}#training-schedule-command`)
  }

  redirect(`/hr/training?scheduled=${savedCount}&notified=${notifiedCount}#training-schedule-command`)
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
    <div className="mb-5 flex items-center gap-3 px-2"><div className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-white shadow-xl shadow-violet-100 ring-1 ring-slate-100"><AngelCareLogo size="sm" /></div><div><div className="text-sm font-black text-slate-950">AngelCare HR</div><div className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-400">Command OS</div></div></div>
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
    <div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-base font-black text-slate-950 !text-slate-950 select-none [text-shadow:none] [background-image:none]" style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a", backgroundImage: "none", textShadow: "none", userSelect: "none" }} data-hr-training-modal-title="true">{title}</h2>{subtitle ? <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{subtitle}</p> : null}</div>{action}</div>
    {children}
  </section>
}

function Modal({ id, title, subtitle, children, ultra = false }: { id: string; title: string; subtitle: string; children: ReactNode; ultra?: boolean }) {
  return <div id={id} className="fixed inset-0 z-[99999] hidden bg-slate-950/55 p-4 backdrop-blur-sm target:block">
    <div className={`mx-auto flex max-h-[94vh] w-full flex-col overflow-hidden rounded-[34px] border border-white/70 bg-white shadow-[0_40px_140px_rgba(15,23,42,0.35)] ${ultra ? 'max-w-[1640px]' : 'max-w-6xl'}`}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-white via-violet-50 to-blue-50 p-7">
        <div><p className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-violet-700">Live synced workspace</p><h3 className="mt-3 text-3xl font-black text-slate-950 !text-slate-950 select-none [text-shadow:none] [background-image:none]" style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a", backgroundImage: "none", textShadow: "none", userSelect: "none" }} data-hr-training-modal-title="true">{title}</h3><p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-500">{subtitle}</p></div>
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


type HrTrainingSyncedEmployeeOption = {
  id: string
  name: string
  email?: string
  department?: string
  role?: string
}

const HR_TRAINING_EMPLOYEE_LIST_KEYS = new Set([
  'users',
  'mappedUsers',
  'mapped_users',
  'positionUsers',
  'position_users',
  'employees',
  'hrEmployees',
  'hr_employees',
  'staff',
  'staffUsers',
  'syncedUsers',
  'synced_staff',
  'members',
])

function hrTrainingString(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''
}

function hrTrainingRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function getHrTrainingEmployeeOptionsFromSources(sources: unknown[]): HrTrainingSyncedEmployeeOption[] {
  const seen = new Set<string>()
  const employees: HrTrainingSyncedEmployeeOption[] = []

  function pushEmployee(value: unknown) {
    if (typeof value === 'string') {
      const name = value.trim()
      if (!name) return
      const key = name.toLowerCase()
      if (seen.has(key)) return
      seen.add(key)
      employees.push({ id: name, name })
      return
    }

    const row = hrTrainingRecord(value)
    if (!Object.keys(row).length) return

    const email = hrTrainingString(row.email || row.user_email || row.work_email)
    const firstName = hrTrainingString(row.first_name || row.firstName)
    const lastName = hrTrainingString(row.last_name || row.lastName)
    const fullName = hrTrainingString(row.full_name || row.fullName || row.name || row.display_name || row.displayName || `${firstName} ${lastName}`.trim())
    const id = hrTrainingString(row.id || row.user_id || row.userId || row.employee_id || row.employeeId || row.auth_user_id || row.profile_id || email || fullName)
    const department = hrTrainingString(row.department || row.department_name || row.team || row.unit)
    const role = hrTrainingString(row.role || row.role_title || row.position || row.position_title || row.job_title || row.title)

    const hasEmployeeSignal = Boolean(
      email ||
      row.employee_id ||
      row.employeeId ||
      row.user_id ||
      row.userId ||
      row.auth_user_id ||
      row.profile_id ||
      row.full_name ||
      row.fullName ||
      row.display_name ||
      row.displayName ||
      row.first_name ||
      row.last_name
    )

    if (!hasEmployeeSignal && !fullName) return

    const name = fullName || email || id
    if (!name) return

    const key = (id || email || name).toLowerCase()
    if (seen.has(key)) return
    seen.add(key)

    employees.push({
      id: id || name,
      name,
      email: email || undefined,
      department: department || undefined,
      role: role || undefined,
    })
  }

  function scan(value: unknown, fromEmployeeList = false, depth = 0) {
    if (depth > 6 || value == null) return

    if (Array.isArray(value)) {
      value.forEach((item) => scan(item, fromEmployeeList, depth + 1))
      return
    }

    if (typeof value === 'string') {
      if (fromEmployeeList) pushEmployee(value)
      return
    }

    const row = hrTrainingRecord(value)
    if (!Object.keys(row).length) return

    if (fromEmployeeList) {
      pushEmployee(row)
    }

    Object.entries(row).forEach(([key, child]) => {
      if (HR_TRAINING_EMPLOYEE_LIST_KEYS.has(key)) {
        scan(child, true, depth + 1)
      }
    })
  }

  const rootSources = sources.map((source) => Array.isArray(source) ? { employees: source } : source)
  rootSources.forEach((source) => scan(source, false, 0))

  return employees.sort((a, b) => a.name.localeCompare(b.name))
}



async function loadHrTrainingSyncedEmployeesForTraining(supabase: any): Promise<unknown[]> {
  const rows: unknown[] = []

  const sources = [
    { table: 'hr_employees', select: 'id,full_name,first_name,last_name,email,work_email,department,department_name,role,role_title,position,position_title,job_title,status' },
    { table: 'app_users', select: 'id,full_name,name,display_name,email,department,role,position_title,job_title,status' },
    { table: 'users', select: 'id,full_name,name,display_name,email,department,role,position_title,job_title,status' },
    { table: 'profiles', select: 'id,full_name,name,display_name,email,department,role,position_title,job_title,status' },
    { table: 'hr_user_profiles', select: 'id,user_id,full_name,name,email,department,role,position_title,job_title,status' },
  ]

  for (const source of sources) {
    try {
      const { data, error } = await supabase
        .from(source.table)
        .select(source.select)
        .limit(500)

      if (!error && Array.isArray(data)) {
        rows.push(...data)
      }
    } catch {
      // Some installations do not have every table. Ignore safely.
    }
  }

  return rows
}


export default async function Page({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined> }) {
  let hrTrainingSyncedEmployees: unknown[] = []

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
    safeRead('hr_activity_events', 'id, action, entity_id, metadata, created_at', 5000),
  ])

  const cookieDeletedSuggestionKeys = await readHrTrainingDeletedCookieKeys()
  const dismissedSuggestionKeys = new Set([
    ...Array.from(cookieDeletedSuggestionKeys),
    ...(dismissedSuggestionEvents || [])
      .filter((event) => ['training_suggestion_dismissed', 'training_resource_deleted_permanently'].includes(first(event, ['action'], '')))
      .flatMap((event) => hrTrainingDeletedEventKeys(event)),
  ].map((key) => n(key)).filter(Boolean))

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
      .filter((item) => !trainingDeletedResourceMatched(dismissedSuggestionKeys, name, item))
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
  const scheduledEventAssignments = dismissedSuggestionEvents
    .filter((event) => first(event, ['action'], '') === 'hr_training_scheduled_assignment')
    .map((event, index) => {
      const meta = metadataRow((event as Row).metadata)
      return {
        id: first(event, ['entity_id'], `scheduled-event-${index}`),
        staff: first(meta, ['employee_name','employee_email'], 'Assigned staff'),
        position: first(meta, ['position_title'], 'Position'),
        training: first(meta, ['course_title'], 'Training'),
        status: first(meta, ['status'], 'scheduled'),
        progress: 0,
        priority: first(meta, ['priority'], 'normal'),
        due: first(meta, ['due_at'], ''),
        updated: first(event, ['created_at'], ''),
      }
    })


  const broadcastScheduleAssignments = ((await safeRead('workspace_broadcast_memos', '*', 5000)) || [])
    .filter((memo) => {
      const type = first(memo, ['memo_type'], '')
      const message = first(memo, ['message'], '')
      return type === 'hr_training_assignment' || String(message || '').includes('COURSE_LINK: /hr/training/online/')
    })
    .map((memo, index) => {
      const message = first(memo, ['message'], '')
      const createdAt = first(memo, ['created_at'], '')
      const status = first(memo, ['status'], 'scheduled')
      const due = acTrainingMemoDueV1(message, createdAt)

      return {
        id: first(memo, ['id'], `broadcast-training-${index}`),
        staff: acTrainingMemoLineV1(message, 'EMPLOYEE') || acTrainingMemoLineV1(message, 'Bonjour') || 'Assigned employee',
        position: acTrainingMemoLineV1(message, 'Poste') || 'Position',
        training: acTrainingMemoCourseV1(first(memo, ['title'], ''), message),
        status: status === 'active' ? 'scheduled' : status,
        progress: String(message || '').includes('STATUS: completed') ? 100 : 0,
        priority: first(memo, ['priority'], 'normal'),
        due,
        updated: createdAt,
        courseUrl: acTrainingMemoLineV1(message, 'COURSE_LINK'),
      }
    })

  const visibleLiveAssignments = [...liveAssignments, ...scheduledEventAssignments, ...broadcastScheduleAssignments]
  const activeAssignments = visibleLiveAssignments.filter((a) => !['passed','approved','completed','cancelled'].includes(n(a.status)))
  const completedAssignments = visibleLiveAssignments.filter((a) => ['passed','approved','completed'].includes(n(a.status)))
  const overdueAssignments = activeAssignments.filter((a) => a.due && new Date(a.due).getTime() < Date.now())

  const trainingMonth = sp('training_month') || new Date().toISOString().slice(0, 7)
  const trainingCommandCourses = positions.flatMap((position) =>
    position.items.map((item, itemIndex) => ({
      key: `${position.id}-${itemIndex}-${slug(item.title)}`,
      position: position.name,
      positionId: position.id,
      title: String(item.title || 'Training resource'),
      id: String(item.id || `${position.id}-${slug(item.title)}`),
      type: String(item.type || item.source || 'training'),
      priority: String(item.priority || 'normal'),
      duration: String(item.duration || '60'),
      source: String(item.source || 'resource'),
    })),
  )
  const trainingCommandEmployees = staff
    .map((employee, employeeIndex) => ({
      id: first(employee, ['id','user_id','employee_id'], String(employeeIndex)),
      name: first(employee, ['full_name','name','display_name','username','email'], 'Employee'),
      email: first(employee, ['email','work_email','user_email'], ''),
      role: first(employee, ['position','role','job_title'], ''),
      department: first(employee, ['department'], ''),
    }))
    .filter((employee) => employee.id || employee.email || employee.name)
  const monthAssignments = visibleLiveAssignments.filter((assignment) => String(assignment.due || assignment.updated || '').startsWith(trainingMonth))
  const monthScheduledAssignments = monthAssignments.filter((assignment) => ['scheduled','assigned','planned','not_started','in_progress'].some((status) => n(assignment.status).includes(status)))
  const monthDelayedAssignments = monthAssignments.filter((assignment) => n(assignment.status).includes('delayed') || n(assignment.status).includes('overdue') || (assignment.due && new Date(assignment.due).getTime() < Date.now() && !['completed','passed','approved'].includes(n(assignment.status))))

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


        
        {sp('scheduled') ? (
          <div id="training-schedule-command" className="mb-4 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-800 shadow-sm">
            Training scheduled successfully for {sp('scheduled')} employee(s). Notifications created: {sp('notified') || '0'}.
          </div>
        ) : null}
        {sp('scheduled_error') ? (
          <div id="training-schedule-command" className="mb-4 rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-black text-rose-800 shadow-sm">
            Training schedule failed: {sp('scheduled_error')}. Check selected course, selected employee and database columns.
          </div>
        ) : null}

        <section id="training-schedule-command" className="mb-6 overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_24px_90px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-100 bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 p-6 text-white">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="inline-flex rounded-full border border-white/20 bg-white/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white">Live staff training scheduler</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight">Ongoing staff scheduled training cockpit</h2>
                <p className="mt-2 max-w-5xl text-sm font-black leading-7 text-white">Schedule courses for one or multiple live employees, push notifications to the overhead bell, follow delays, pass scores, monthly workload and online HTML course completion.</p>
              </div>

              <form action="/hr/training#training-schedule-command" method="get" className="rounded-[22px] border border-white/15 bg-white/12 p-3 backdrop-blur-md shadow-lg shadow-black/10">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Month filter</label>
                <div className="mt-2 flex items-center gap-2">
                  <input type="month" name="training_month" defaultValue={trainingMonth} className="h-11 rounded-2xl border border-white/20 bg-white px-3 text-sm font-black text-slate-950 shadow-sm" />
                  <button className="h-11 rounded-2xl bg-cyan-400 px-4 text-sm font-black text-slate-950 shadow-sm transition hover:bg-cyan-300">Filter</button>
                </div>
              </form>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-4">
              {[
                ['Month scheduled', monthScheduledAssignments.length, 'Active this month'],
                ['Delayed risk', monthDelayedAssignments.length, 'Needs follow-up'],
                ['Employees live', trainingCommandEmployees.length, 'Selectable staff'],
                ['Courses available', trainingCommandCourses.length, 'Position/course bank'],
              ].map(([label, value, detail]) => (
                <div key={String(label)} className="rounded-[22px] border border-white/15 bg-white/12 p-4 shadow-sm backdrop-blur-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{String(label)}</p>
                  <p className="mt-2 text-3xl font-black text-white">{String(value)}</p>
                  <p className="mt-1 text-xs font-bold text-white/90">{String(detail)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 p-5 xl:grid-cols-[1.05fr_0.95fr]">
            <Panel title="Monthly follow-up board" subtitle="Live synced assignments for the selected month, including delayed, scheduled, progress and online course status.">
              <div className="grid gap-3">
                {monthAssignments.length ? monthAssignments.slice(0, 12).map((assignment) => {
                  const state = acScheduledTrainingStateV2(assignment.due, assignment.status, assignment.progress)
                  const progressValue = acScheduledTrainingProgressV2((assignment as any).scheduled || assignment.updated, assignment.due, assignment.status, assignment.progress)
                  const remaining = acScheduledTrainingRemainingV2(assignment.due)
                  const modalId = `modal-scheduled-training-${slug(assignment.id)}`

                  return (
                    <div key={`schedule-row-${assignment.id}`} className="relative">
                      <a href={`#${modalId}`} className={`group block rounded-[30px] border p-4 transition duration-200 ${acScheduledTrainingCardV2(state)}`}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-black text-slate-950">{assignment.training}</h3>
                              <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${acScheduledTrainingBadgeV2(state)}`}>
                                {acScheduledTrainingLabelV2(state)}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-slate-500">
                              {assignment.staff} · {assignment.position}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-950 px-3 py-2 text-right text-white shadow-sm">
                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/70">Time left</p>
                            <p className="text-sm font-black text-white">{remaining}</p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2 md:grid-cols-3">
                          <div className="rounded-2xl bg-white/85 p-3 ring-1 ring-slate-100">
                            <p className="text-[10px] font-black uppercase text-slate-400">Due</p>
                            <p className="mt-1 text-xs font-black text-slate-800">{assignment.due || 'Not set'}</p>
                          </div>
                          <div className="rounded-2xl bg-white/85 p-3 ring-1 ring-slate-100">
                            <p className="text-[10px] font-black uppercase text-slate-400">Progress</p>
                            <p className="mt-1 text-xs font-black text-slate-800">{progressValue}%</p>
                          </div>
                          <div className="rounded-2xl bg-white/85 p-3 ring-1 ring-slate-100">
                            <p className="text-[10px] font-black uppercase text-slate-400">Priority</p>
                            <p className="mt-1 text-xs font-black text-slate-800">{assignment.priority}</p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                            <span>Time progression</span>
                            <span>{progressValue}%</span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                            <div className={`h-full rounded-full transition-all duration-700 ${acScheduledTrainingBarV2(state)}`} style={{ width: `${progressValue}%` }} />
                          </div>
                        </div>

                        <p className="mt-3 text-[11px] font-black text-violet-700 opacity-0 transition group-hover:opacity-100">
                          Click to open live synced situation details →
                        </p>
                      </a>

                      <div id={modalId} className="fixed inset-0 z-[90] hidden items-center justify-center bg-slate-950/70 p-6 backdrop-blur-md target:flex">
                        <a href="#training-schedule-command" className="absolute inset-0" aria-label="Close scheduled training details" />
                        <div className="relative w-full max-w-4xl overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.35)]">
                          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 p-6 text-white">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">
                                  Live synced training situation
                                </p>
                                <h3 className="mt-3 text-2xl font-black text-white">{assignment.training}</h3>
                                <p className="mt-1 text-sm font-bold text-white">{assignment.staff} · {assignment.position}</p>
                              </div>
                              <span className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide ${acScheduledTrainingBadgeV2(state)}`}>
                                {acScheduledTrainingLabelV2(state)}
                              </span>
                            </div>
                          </div>

                          <div className="grid gap-4 p-6 md:grid-cols-4">
                            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Remaining</p>
                              <p className="mt-2 text-lg font-black text-slate-950">{remaining}</p>
                            </div>
                            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Due</p>
                              <p className="mt-2 text-sm font-black text-slate-950">{assignment.due || 'Not set'}</p>
                            </div>
                            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Progress</p>
                              <p className="mt-2 text-lg font-black text-slate-950">{progressValue}%</p>
                            </div>
                            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Priority</p>
                              <p className="mt-2 text-sm font-black text-slate-950">{assignment.priority}</p>
                            </div>
                          </div>

                          <div className="px-6 pb-6">
                            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                              <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                                <span>Rule engine</span>
                                <span>{progressValue}%</span>
                              </div>
                              <div className="h-4 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                                <div className={`h-full rounded-full transition-all duration-700 ${acScheduledTrainingBarV2(state)}`} style={{ width: `${progressValue}%` }} />
                              </div>
                              <p className="mt-3 text-xs font-bold text-slate-500">
                                Under 60 minutes before due date = flashing yellow. Passed/completed = flashing green. Overdue = flashing red.
                              </p>
                            </div>

                            <div className="mt-5 flex flex-wrap gap-3">
                              {(assignment as any).courseUrl ? (
                                <a href={(assignment as any).courseUrl} className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200">
                                  Open online course
                                </a>
                              ) : null}

                              <form action={deleteScheduledTrainingBroadcastAction}>
                                <input type="hidden" name="memo_id" value={String(assignment.id || '')} />
                                <input type="hidden" name="training_title" value={String(assignment.training || '')} />
                                <button
                                  type="submit"
                                  className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-rose-200 transition hover:bg-rose-700"
                                >
                                  Delete permanently
                                </button>
                              </form>
                              <a href="#training-schedule-command" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
                                Close details
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }) : (
                  <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm font-bold text-slate-500">No scheduled training found for {trainingMonth}. Use the scheduler to assign a course and notify employees.</div>
                )}
              </div>
            </Panel>

            <Panel title="Schedule training & notify employees" subtitle="Assign one course to one or many employees. Notifications appear in the overhead bell and deep-link to the online course runner.">
              <form action={scheduleTrainingFromMainCommandAction} className="grid gap-4">
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Course / position</span>
                  <select name="training_course_token" required className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800">
                    <option value="">Select live/suggested course</option>
                    {trainingCommandCourses.map((course) => (
                      <option key={course.key} value={encodeURIComponent(JSON.stringify(course))}>{course.position} · {course.title} · {course.type}</option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block"><span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Scheduled at</span><input name="scheduled_at" type="datetime-local" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold" /></label>
                  <label className="block"><span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Due at</span><input name="due_at" type="datetime-local" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold" /></label>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <label className="block"><span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Trainer</span><input name="trainer_name" placeholder="HR / Manager" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold" /></label>
                  <label className="block"><span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Mode</span><select name="session_mode" defaultValue="online" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold"><option value="online">Online HTML</option><option value="in_person">In person</option><option value="blended">Blended</option><option value="self_paced">Self-paced</option></select></label>
                  <label className="block"><span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Pass score</span><input name="pass_score" type="number" defaultValue="75" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-bold" /></label>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-slate-950">Select employees</p>
                      <p className="text-[11px] font-bold text-slate-500">Tick one or multiple live synced users. Each receives a notification.</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-violet-700">{trainingCommandEmployees.length} live</span>
                  </div>

                  <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                    {trainingCommandEmployees.map((employee) => (
                      <label key={`schedule-employee-${employee.id}-${employee.email}`} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-violet-300 hover:bg-violet-50">
                        <input type="checkbox" name="employee_tokens" value={encodeURIComponent(JSON.stringify(employee))} className="mt-2 h-4 w-4 accent-violet-600" />
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-950 text-xs font-black text-white">{initials(employee.name)}</span>
                        <span className="min-w-0">
                          <span className="block text-sm font-black text-slate-950">{employee.name}</span>
                          <span className="mt-1 block text-[11px] font-bold text-slate-500">{employee.role || 'Role not set'} · {employee.department || 'No department'} {employee.email ? `· ${employee.email}` : ''}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <textarea name="training_notes" placeholder="Follow-up notes, objective, evidence rules, manager instructions." className="min-h-[90px] rounded-2xl border border-slate-200 p-4 text-sm font-bold" />

                <button className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 text-sm font-black text-white shadow-lg shadow-violet-200">
                  <Bell className="h-4 w-4" /> Schedule, sync & notify selected employees
                </button>
              </form>
            </Panel>
          </div>
        </section>

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

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-950 px-4 py-3 text-white"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-white/45">Filtered position bank</p><p className="text-sm font-black">Showing {filteredPositions.length} of {positions.length} synced positions</p></div><div className="flex gap-2 text-xs font-black"><span className="rounded-full bg-white/12 px-3 py-1">{money(filteredPositions.reduce((a, p) => a + p.users.length, 0))} users</span><span className="rounded-full bg-white/12 px-3 py-1">{money(filteredPositions.reduce((a, p) => a + p.items.length, 0))} resources</span></div></div>

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
              {!filteredPositions.length ? <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center md:col-span-2 2xl:col-span-3"><Filter className="mx-auto h-8 w-8 text-white" /><h3 className="mt-3 text-lg font-black text-slate-900">No positions match these filters</h3><p className="mt-2 text-sm font-bold text-slate-500">Reset filters or adjust search, department, coverage, or resource type.</p><Link href="/hr/training" className="mt-4 inline-flex rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white">Reset filters</Link></div> : null}
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
          <div className="rounded-[30px] bg-slate-950 p-6 text-white shadow-2xl"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Synced position file</p><h4 className="mt-2 text-3xl font-black">{position.name}</h4><p className="mt-2 text-sm font-bold text-white/60">{position.department} • {position.users.length} mapped user(s) • {position.items.length} training resource(s)</p></div><div className="grid h-16 w-16 place-items-center rounded-3xl bg-white/12"><Library className="h-7 w-7" /></div></div><div className="mt-6 grid gap-3 md:grid-cols-4">{[['Users', position.users.length], ['Live programs', position.programs.length], ['Requirements', position.requirements.length], ['Resources', position.items.length]].map(([label, val]) => <div key={`position-stat-${positionIndex}-${position.id}-${label}`} className="rounded-2xl bg-white/12 p-4"><p className="text-2xl font-black">{val}</p><p className="text-[10px] font-black uppercase text-white/50">{label}</p></div>)}</div></div>

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

                        <h5 className="mt-3 line-clamp-2 text-lg font-black text-slate-950 !text-slate-950 select-none [text-shadow:none] [background-image:none]" style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a", backgroundImage: "none", textShadow: "none", userSelect: "none" }} data-hr-training-course-title="true">{item.title}</h5>
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
                            <input type="hidden" name="title" value={item.title} />
                            <input type="hidden" name="resource_type" value={item.type} />
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
            const syncedEmployeesForCourse = getHrTrainingEmployeeOptionsFromSources([position, positions, { employees: hrTrainingSyncedEmployees }])
      return <Modal key={`modal-resource-${id}`} id={`modal-training-resource-${id}`} title={item.title} subtitle={`Course Command Workspace for ${position.name}. Manage HTML course content, trainees, schedules, assessment scores, status and live training evidence.`}>
        <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <section className="space-y-5">
            <div className="rounded-[28px] bg-slate-950 p-6 text-white shadow-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Course command overview</p>
              <h2 className="mt-2 text-2xl font-black text-white">{item.title}</h2>
              <p className="mt-3 text-sm font-bold text-white">{item.description}</p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/12 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white">Type</p>
                  <p className="mt-1 text-sm font-black text-white">{item.type}</p>
                </div>
                <div className="rounded-2xl bg-white/12 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white">Priority</p>
                  <p className="mt-1 text-sm font-black text-white">{item.priority}</p>
                </div>
                <div className="rounded-2xl bg-white/12 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white">Duration</p>
                  <p className="mt-1 text-sm font-black text-white">{item.duration} min</p>
                </div>
                <div className="rounded-2xl bg-white/12 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white">Live sync</p>
                  <p className="mt-1 text-sm font-black text-emerald-200">Course ready</p>
                </div>
              </div>
            </div>

            <Panel title="Resource links & evidence" subtitle="Open external course material when available.">
              <div className="grid gap-3">
                <a href={item.pdf || '#'} target="_blank" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-50">Open PDF / resource link</a>
                <a href={item.video || '#'} target="_blank" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-50">Open training video link</a>
              </div>
            </Panel>

            <Panel title="HTML course building prompt" subtitle="Copy this standardized prompt when creating future HTML courses for AngelCare live-sync training.">
              <textarea
                name="course_builder_prompt_preview"
                readOnly
                className="min-h-[280px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs font-bold text-slate-800"
                defaultValue={`Build a full production-ready AngelCare HTML training course for the position: ${position.name}. Course title: ${item.title}. Requirements: write in French unless requested otherwise; create modern responsive HTML/CSS only; no markdown fences; no external JavaScript dependencies; use AngelCare logo from /logo.png; include course overview, learning objectives, modules, practical scenarios, knowledge checks, final assessment, and printable A4 corporate summary; every input, textarea, radio, checkbox and select must have a unique name attribute; include hidden fields for course_title, position_title, pass_score, score_percent, assessment_status, completed_at; use clear data attributes for scoring when possible; design must be white, premium, enterprise, accessible, mobile responsive; include no unsafe external scripts; make it ready for live sync with AngelCare HR training records, employee assignments, scores, pass/fail, delayed status and evidence.`}
              />
            </Panel>
          </section>

          <section className="space-y-5">
            <Panel title="Course metadata & HTML course content" subtitle="Paste full HTML course code freely. Save keeps this resource connected to training, employee scheduling and score tracking.">
              <form action={saveTrainingResourceAction} className="grid gap-4 md:grid-cols-2">
                <input type="hidden" name="course_command_mode" value="course_command_workspace" />
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="position_title" value={position.name} />

                <Field label="Training title" name="title" value={item.title} required />
                <Field label="Duration minutes" name="duration_minutes" type="number" value={item.duration} />

                <SelectField label="Resource type" name="resource_type" value={item.type} options={['pdf','video','link','html_course','html_assessment','checklist','workshop','sop']} />
                <SelectField label="Priority" name="priority" value={item.priority} options={['normal','recommended','mandatory','high','urgent','critical']} />

                <Field label="PDF URL" name="pdf_url" value={item.pdf} />
                <Field label="Video URL" name="video_url" value={item.video} />

                <SelectField label="Status" name="status" options={['active','draft','paused','archived']} />
                <SelectField label="Requirement level" name="requirement_level" value={item.priority} options={['mandatory','recommended','compliance','critical','optional']} />

                <Field label="Course pass score" name="course_pass_score" type="number" value="75" />
                <SelectField label="Course command status" name="course_command_status" options={['active','draft','paused','archived']} />

                <label className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800 md:col-span-2">
                  <input type="checkbox" name="live_assessment_enabled" defaultChecked className="h-4 w-4 accent-emerald-600" />
                  Enable live synced HTML assessment capture for named fields
                </label>

                <textarea name="description" defaultValue={item.description} className="min-h-[110px] rounded-2xl border border-slate-200 p-4 text-sm font-semibold md:col-span-2" />

                <textarea
                  name="html_course_code"
                  placeholder="Paste full HTML/CSS course code here. The HTML must use named fields for live score/assessment capture."
                  className="min-h-[360px] rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs font-bold text-emerald-100 shadow-inner md:col-span-2"
                />

                <textarea
                  name="course_builder_prompt"
                  className="hidden"
                  defaultValue={`Build a full production-ready AngelCare HTML training course for ${position.name}, course: ${item.title}. Must include named fields, final assessment, score fields, pass/fail status, printable A4 summary, responsive premium UI, /logo.png, no markdown fences, no external JS dependency, and live-sync compatible form names.`}
                />

                <textarea
                  name="course_command_notes"
                  placeholder="Internal notes about this HTML course, version, assessment rules or trainer instructions."
                  className="min-h-[110px] rounded-2xl border border-slate-200 p-4 text-sm font-semibold md:col-span-2"
                />

                <div className="flex flex-wrap gap-3 md:col-span-2">
                  <button className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200">
                    <Save className="h-4 w-4" />Save course command
                  </button>
                  <a href={`#modal-position-bank-${position.id}`} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">
                    <Eye className="h-4 w-4" />Back to position
                  </a>
                </div>
              </form>

              {item.id ? <form action={deleteTrainingResourceAction} className="mt-4">
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="position_title" value={position.name} />
                <input type="hidden" name="title" value={item.title} />
                <input type="hidden" name="resource_type" value={item.type} />
                            <input type="hidden" name="title" value={item.title} />
                            <input type="hidden" name="resource_type" value={item.type} />
                <button className="inline-flex items-center gap-2 rounded-2xl border border-rose-300 bg-rose-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-rose-200">
                  <Trash2 className="h-4 w-4" />Delete permanently
                </button>
              </form> : null}
            </Panel>

            <Panel title="Trainees, schedule & live assessment scores" subtitle="Assign this course to an existing synced employee or record score/status evidence after completion.">
              <form action={saveTrainingResourceAction} className="grid gap-4 md:grid-cols-2">
                <input type="hidden" name="course_command_mode" value="course_command_workspace" />
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="position_title" value={position.name} />
                <input type="hidden" name="title" value={item.title} />
                <input type="hidden" name="duration_minutes" value={item.duration} />
                <input type="hidden" name="resource_type" value={item.type} />
                <input type="hidden" name="priority" value={item.priority} />

                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm md:col-span-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Live synced employees</p>
                      <h3 className="mt-1 text-base font-black text-slate-950">Select one or multiple employees to schedule this course</h3>
                      <p className="mt-1 text-xs font-bold text-slate-500">Pulled from mapped position users and synced HR/user records available on this page.</p>
                    </div>
                    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">{syncedEmployeesForCourse.length} synced</span>
                  </div>

                  {syncedEmployeesForCourse.length ? (
                    <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50/80 p-3">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-black text-slate-900">Choose trainees</p>
                          <p className="text-[11px] font-bold text-slate-500">Tick one or multiple synced employees. Each selected employee receives this course schedule.</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-700 shadow-sm">{syncedEmployeesForCourse.length} available</span>
                      </div>

                      <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                        {syncedEmployeesForCourse.map((employee, employeeIndex) => {
                          const initials = employee.name
                            .split(' ')
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((part) => part[0]?.toUpperCase())
                            .join('') || 'HR'

                          return (
                            <label
                              key={`${employee.id}-${employee.name}-${employeeIndex}`}
                              className="group flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-violet-300 hover:bg-violet-50/50 hover:shadow-md"
                            >
                              <input
                                type="checkbox"
                                name="schedule_employee_ids"
                                value={JSON.stringify(employee)}
                                className="mt-2 h-4 w-4 rounded border-slate-300 accent-violet-600"
                              />

                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-400 text-xs font-black text-white shadow-sm">
                                {initials}
                              </span>

                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-black text-slate-950">{employee.name}</span>
                                <span className="mt-1 flex flex-wrap gap-1.5">
                                  {employee.role ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-600">{employee.role}</span> : null}
                                  {employee.department ? <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-blue-700">{employee.department}</span> : null}
                                  {employee.email ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">{employee.email}</span> : null}
                                </span>
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
                      No synced employee is currently mapped or discoverable for this position. Use manual fallback below, or map users to this position in Users Management.
                    </div>
                  )}

                  <p className="mt-3 text-xs font-bold text-slate-500">Tip: hold Cmd/Ctrl to select multiple employees, then save schedule/status once.</p>
                </div>

                <Field label="Manual employee ID / fallback" name="schedule_employee_id" />
                <Field label="Manual employee full name / fallback" name="schedule_employee_name" />

                <Field label="Scheduled at" name="scheduled_at" type="datetime-local" />
                <Field label="Due at" name="due_at" type="datetime-local" />

                <Field label="Trainer name" name="trainer_name" />
                <SelectField label="Session mode" name="session_mode" options={['online','in_person','blended','self_paced']} />

                <SelectField label="Training status" name="training_status" options={['not_started','scheduled','in_progress','completed','failed','delayed','overdue','cancelled']} />
                <Field label="Score percent" name="score_percent" type="number" />

                <Field label="Pass score" name="course_pass_score" type="number" value="75" />
                <Field label="Attempt count" name="attempt_count" type="number" value="0" />

                <Field label="Completed at" name="completed_at" type="datetime-local" />
                <Field label="Evidence URL" name="evidence_url" />

                <textarea name="delayed_reason" placeholder="Delayed / overdue reason if applicable" className="min-h-[90px] rounded-2xl border border-slate-200 p-4 text-sm font-semibold md:col-span-2" />
                <textarea name="training_assignment_notes" placeholder="Trainer notes, assessment evidence, trainee feedback, next action." className="min-h-[110px] rounded-2xl border border-slate-200 p-4 text-sm font-semibold md:col-span-2" />

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Live sync rules</p>
                  <ul className="mt-3 space-y-2 text-sm font-bold text-slate-700">
                    <li>• Completed with score ≥ pass score = passed.</li>
                    <li>• Due date passed without completion = delayed / overdue.</li>
                    <li>• HTML assessment fields with name attributes are capturable by the system.</li>
                    <li>• Every save writes resource, schedule, status, score and evidence into training sync tables.</li>
                  </ul>
                </div>

                <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white md:col-span-2">
                  <Save className="h-4 w-4" />Save trainee schedule / score
                </button>
              </form>
            </Panel>
          </section>
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
              </div>) : <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-8 text-center"><GraduationCap className="mx-auto h-8 w-8 text-white" /><p className="mt-3 text-lg font-black text-slate-900">No assigned trainings yet</p><p className="mt-2 text-sm font-bold text-slate-500">Use Assign Training to create the first synced training assignment.</p></div>}
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
