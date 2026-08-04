'use client'

import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  Archive,
  BadgeCheck,
  Banknote,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Download,
  FileBadge2,
  FileText,
  Fingerprint,
  Gauge,
  GraduationCap,
  History,
  IdCard,
  LayoutDashboard,
  LifeBuoy,
  Loader2,
  Mail,
  MapPin,
  MessageSquareText,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  UserCog,
  UserRound,
  WalletCards,
  Workflow,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react'
import type {
  Employee360Aggregate,
  Employee360DomainKey,
  Employee360MutationRequest,
  Employee360Profile,
  Employee360Record,
  EmployeeLifecycleState,
  JsonObject,
} from '@/lib/hr-employee-360/types'
import styles from './Employee360Sovereign.module.css'

type EmployeeSeed = Record<string, unknown>
type SurfaceMode = 'modal' | 'page'
type ActiveTab =
  | 'overview'
  | 'identity'
  | 'employment'
  | Employee360DomainKey
  | 'lifecycle'
  | 'audit'

type FieldDefinition = {
  key: string
  label: string
  type?: 'text' | 'number' | 'date' | 'datetime-local' | 'time' | 'textarea' | 'select' | 'url'
  options?: string[]
  placeholder?: string
  wide?: boolean
  required?: boolean
}

type DomainConfig = {
  label: string
  singular: string
  icon: typeof Activity
  accent: string
  fields: FieldDefinition[]
  createLabel: string
  readOnly?: boolean
}

type DialogState =
  | { kind: 'profile' }
  | { kind: 'domain'; domain: Employee360DomainKey; record?: Employee360Record }
  | { kind: 'documentUpload' }
  | { kind: 'lifecycle' }
  | { kind: 'domainAction'; domain: Employee360DomainKey; record: Employee360Record; action: 'archive' | 'restore' | 'validate' }
  | { kind: 'archive' }
  | { kind: 'note' }
  | null

const DOMAIN_CONFIG: Record<Employee360DomainKey, DomainConfig> = {
  attendance: {
    label: 'Présence',
    singular: 'correction de présence',
    icon: Clock3,
    accent: 'from-cyan-600 to-blue-700',
    createLabel: 'Demander une correction',
    fields: [
      { key: 'title', label: 'Titre', required: true },
      { key: 'correctionType', label: 'Type', type: 'select', options: ['manual_correction', 'missing_checkin', 'missing_checkout', 'late_arrival', 'absence_regularization'] },
      { key: 'status', label: 'Statut', type: 'select', options: ['pending', 'requested', 'approved', 'rejected'] },
      { key: 'reason', label: 'Justification', type: 'textarea', wide: true, required: true },
      { key: 'notes', label: 'Notes internes', type: 'textarea', wide: true },
    ],
  },
  leave: {
    label: 'Congés & absences',
    singular: 'demande de congé',
    icon: CalendarClock,
    accent: 'from-amber-500 to-orange-600',
    createLabel: 'Créer une demande',
    fields: [
      { key: 'title', label: 'Intitulé', required: true },
      { key: 'leaveType', label: 'Type de congé', type: 'select', options: ['annual', 'sick', 'authorized_absence', 'maternity', 'paternity', 'unpaid', 'other'] },
      { key: 'startDate', label: 'Début', type: 'date', required: true },
      { key: 'endDate', label: 'Fin', type: 'date', required: true },
      { key: 'status', label: 'Statut', type: 'select', options: ['pending', 'approved', 'rejected', 'cancelled'] },
      { key: 'priority', label: 'Priorité', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { key: 'reason', label: 'Motif', type: 'textarea', wide: true },
      { key: 'notes', label: 'Notes', type: 'textarea', wide: true },
    ],
  },
  payroll: {
    label: 'Paie & rémunération',
    singular: 'élément de paie',
    icon: Banknote,
    accent: 'from-emerald-600 to-teal-700',
    createLabel: 'Ajouter un élément de paie',
    fields: [
      { key: 'title', label: 'Intitulé', required: true },
      { key: 'inputType', label: 'Type', type: 'select', options: ['adjustment', 'bonus', 'deduction', 'advance', 'reimbursement', 'overtime'] },
      { key: 'periodStart', label: 'Début période', type: 'date' },
      { key: 'periodEnd', label: 'Fin période', type: 'date' },
      { key: 'amount', label: 'Montant (Dh)', type: 'number' },
      { key: 'currency', label: 'Devise', type: 'select', options: ['MAD', 'EUR', 'USD'] },
      { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'pending', 'approved', 'paid', 'cancelled'] },
      { key: 'reason', label: 'Justification', type: 'textarea', wide: true },
      { key: 'notes', label: 'Notes', type: 'textarea', wide: true },
    ],
  },
  planning: {
    label: 'Planning',
    singular: 'affectation planning',
    icon: Workflow,
    accent: 'from-violet-600 to-indigo-700',
    createLabel: 'Ajouter une affectation',
    fields: [
      { key: 'title', label: 'Intitulé', required: true },
      { key: 'workDate', label: 'Date', type: 'date', required: true },
      { key: 'startTime', label: 'Début', type: 'time' },
      { key: 'endTime', label: 'Fin', type: 'time' },
      { key: 'location', label: 'Lieu' },
      { key: 'shiftType', label: 'Type de shift', type: 'select', options: ['standard', 'morning', 'afternoon', 'night', 'field', 'remote'] },
      { key: 'status', label: 'Statut', type: 'select', options: ['planned', 'confirmed', 'completed', 'cancelled'] },
      { key: 'priority', label: 'Priorité', type: 'select', options: ['low', 'medium', 'high'] },
      { key: 'notes', label: 'Notes', type: 'textarea', wide: true },
    ],
  },
  documents: {
    label: 'Documents',
    singular: 'document',
    icon: FileBadge2,
    accent: 'from-blue-600 to-cyan-700',
    createLabel: 'Enregistrer un document',
    fields: [
      { key: 'title', label: 'Titre', required: true },
      { key: 'documentType', label: 'Type', type: 'select', options: ['identity', 'contract', 'certificate', 'medical', 'administrative', 'policy', 'other'] },
      { key: 'status', label: 'Statut', type: 'select', options: ['pending', 'uploaded', 'validated', 'rejected', 'expired', 'waived'] },
      { key: 'fileUrl', label: 'Lien fichier', type: 'url', wide: true },
      { key: 'fileName', label: 'Nom du fichier' },
      { key: 'expiryDate', label: 'Expiration', type: 'date' },
      { key: 'owner', label: 'Responsable' },
      { key: 'complianceStatus', label: 'Conformité', type: 'select', options: ['pending', 'compliant', 'non_compliant', 'waived'] },
      { key: 'notes', label: 'Notes', type: 'textarea', wide: true },
    ],
  },
  contracts: {
    label: 'Contrats',
    singular: 'contrat',
    icon: BriefcaseBusiness,
    accent: 'from-slate-700 to-slate-950',
    createLabel: 'Créer un contrat',
    fields: [
      { key: 'title', label: 'Titre', required: true },
      { key: 'contractType', label: 'Type', type: 'select', options: ['CDI', 'CDD', 'ANAPEC', 'Stage', 'Freelance', 'Consulting', 'Other'] },
      { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'pending_signature', 'signed', 'active', 'expired', 'terminated', 'cancelled'] },
      { key: 'startDate', label: 'Début', type: 'date' },
      { key: 'endDate', label: 'Fin', type: 'date' },
      { key: 'probationEndDate', label: 'Fin période d’essai', type: 'date' },
      { key: 'salary', label: 'Salaire brut (Dh)', type: 'number' },
      { key: 'currency', label: 'Devise', type: 'select', options: ['MAD', 'EUR', 'USD'] },
      { key: 'notes', label: 'Clauses / notes', type: 'textarea', wide: true },
    ],
  },
  onboarding: {
    label: 'Onboarding',
    singular: 'parcours onboarding',
    icon: ClipboardCheck,
    accent: 'from-fuchsia-600 to-violet-700',
    createLabel: 'Créer un parcours',
    fields: [
      { key: 'title', label: 'Titre', required: true },
      { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'preboarding', 'documents', 'orientation', 'training_setup', 'integration', 'probation', 'completed', 'paused', 'cancelled', 'archived'] },
      { key: 'startDate', label: 'Date de début', type: 'date' },
      { key: 'progress', label: 'Progression', type: 'number' },
      { key: 'owner', label: 'Responsable' },
      { key: 'notes', label: 'Notes', type: 'textarea', wide: true },
    ],
  },
  training: {
    label: 'Formation',
    singular: 'formation',
    icon: GraduationCap,
    accent: 'from-sky-600 to-blue-700',
    createLabel: 'Assigner une formation',
    fields: [
      { key: 'title', label: 'Formation', required: true },
      { key: 'category', label: 'Catégorie' },
      { key: 'status', label: 'Statut', type: 'select', options: ['assigned', 'in_progress', 'completed', 'overdue', 'cancelled'] },
      { key: 'progressPercent', label: 'Progression %', type: 'number' },
      { key: 'dueAt', label: 'Échéance', type: 'datetime-local' },
      { key: 'priority', label: 'Priorité', type: 'select', options: ['low', 'medium', 'high', 'mandatory'] },
      { key: 'notes', label: 'Notes', type: 'textarea', wide: true },
    ],
  },
  performance: {
    label: 'Performance',
    singular: 'revue de performance',
    icon: Gauge,
    accent: 'from-rose-600 to-pink-700',
    createLabel: 'Créer une revue',
    fields: [
      { key: 'title', label: 'Titre', required: true },
      { key: 'reviewCycle', label: 'Cycle' },
      { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'open', 'in_review', 'completed', 'validated', 'cancelled'] },
      { key: 'score', label: 'Score', type: 'number' },
      { key: 'dueDate', label: 'Échéance', type: 'date' },
      { key: 'strengths', label: 'Forces', type: 'textarea', wide: true },
      { key: 'improvements', label: 'Axes d’amélioration', type: 'textarea', wide: true },
      { key: 'actionPlan', label: 'Plan d’action', type: 'textarea', wide: true },
      { key: 'notes', label: 'Notes', type: 'textarea', wide: true },
    ],
  },
  communications: {
    label: 'Communications',
    singular: 'communication',
    icon: Mail,
    accent: 'from-teal-600 to-cyan-700',
    createLabel: 'Ouvrir le centre de communication',
    fields: [],
    readOnly: true,
  },
  tasks: {
    label: 'Tâches',
    singular: 'tâche',
    icon: CheckCircle2,
    accent: 'from-emerald-600 to-green-700',
    createLabel: 'Créer une tâche',
    fields: [
      { key: 'title', label: 'Titre', required: true },
      { key: 'taskType', label: 'Type' },
      { key: 'status', label: 'Statut', type: 'select', options: ['open', 'in_progress', 'blocked', 'completed', 'cancelled'] },
      { key: 'priority', label: 'Priorité', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { key: 'dueDate', label: 'Échéance', type: 'date' },
      { key: 'owner', label: 'Responsable' },
      { key: 'description', label: 'Description', type: 'textarea', wide: true },
      { key: 'outcome', label: 'Résultat', type: 'textarea', wide: true },
    ],
  },
  approvals: {
    label: 'Approbations',
    singular: 'approbation',
    icon: BadgeCheck,
    accent: 'from-indigo-600 to-violet-700',
    createLabel: 'Créer une approbation',
    fields: [
      { key: 'title', label: 'Titre', required: true },
      { key: 'requestType', label: 'Type de demande' },
      { key: 'status', label: 'Statut', type: 'select', options: ['pending', 'approved', 'rejected', 'cancelled'] },
      { key: 'priority', label: 'Priorité', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { key: 'approverName', label: 'Approbateur' },
      { key: 'decisionNotes', label: 'Décision / notes', type: 'textarea', wide: true },
    ],
  },
  incidents: {
    label: 'Incidents & conformité',
    singular: 'incident',
    icon: ShieldAlert,
    accent: 'from-rose-700 to-red-800',
    createLabel: 'Déclarer un incident',
    fields: [
      { key: 'title', label: 'Titre', required: true },
      { key: 'incidentType', label: 'Type' },
      { key: 'severity', label: 'Sévérité', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { key: 'status', label: 'Statut', type: 'select', options: ['open', 'investigating', 'mitigated', 'resolved', 'closed'] },
      { key: 'occurredAt', label: 'Date / heure', type: 'datetime-local' },
      { key: 'owner', label: 'Responsable' },
      { key: 'description', label: 'Description', type: 'textarea', wide: true },
      { key: 'resolution', label: 'Résolution', type: 'textarea', wide: true },
    ],
  },
}

const TAB_ORDER: Array<{ key: ActiveTab; label: string; icon: typeof Activity }> = [
  { key: 'overview', label: 'Vue 360', icon: LayoutDashboard },
  { key: 'identity', label: 'Identité', icon: IdCard },
  { key: 'employment', label: 'Emploi', icon: UserCog },
  { key: 'contracts', label: 'Contrats', icon: BriefcaseBusiness },
  { key: 'attendance', label: 'Présence', icon: Clock3 },
  { key: 'leave', label: 'Congés', icon: CalendarClock },
  { key: 'payroll', label: 'Paie', icon: WalletCards },
  { key: 'planning', label: 'Planning', icon: Workflow },
  { key: 'documents', label: 'Documents', icon: FileBadge2 },
  { key: 'onboarding', label: 'Onboarding', icon: ClipboardCheck },
  { key: 'training', label: 'Formation', icon: GraduationCap },
  { key: 'performance', label: 'Performance', icon: Gauge },
  { key: 'communications', label: 'Communications', icon: Mail },
  { key: 'tasks', label: 'Tâches', icon: CheckCircle2 },
  { key: 'approvals', label: 'Approbations', icon: BadgeCheck },
  { key: 'incidents', label: 'Incidents', icon: ShieldAlert },
  { key: 'lifecycle', label: 'Cycle de vie', icon: RefreshCw },
  { key: 'audit', label: 'Audit', icon: History },
]

const LIFECYCLE_STATES: Array<{ value: EmployeeLifecycleState; label: string }> = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'preboarding', label: 'Pré-intégration' },
  { value: 'probation', label: 'Période d’essai' },
  { value: 'active', label: 'Actif' },
  { value: 'on_leave', label: 'En congé' },
  { value: 'suspended', label: 'Suspendu' },
  { value: 'transferred', label: 'Transféré' },
  { value: 'promoted', label: 'Promu' },
  { value: 'notice_period', label: 'Préavis' },
  { value: 'terminated', label: 'Terminé' },
  { value: 'archived', label: 'Archivé' },
  { value: 'rehired', label: 'Réembauché' },
]

function seedId(employee: EmployeeSeed | null | undefined): string | null {
  if (!employee) return null
  const value = employee.id ?? employee.staff_id ?? employee.employee_id ?? employee.profile_id
  return value ? String(value) : null
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AC'
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium' }).format(date)
}

function formatDateTime(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return value
  return new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function money(value: number | null, currency = 'MAD'): string {
  if (value === null) return '—'
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency }).format(value)
}

function statusTone(status: string): string {
  const value = status.toLowerCase()
  if (['approved', 'active', 'completed', 'validated', 'sent', 'signed', 'resolved', 'paid'].some((item) => value.includes(item))) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }
  if (['rejected', 'failed', 'critical', 'terminated', 'cancelled', 'expired'].some((item) => value.includes(item))) {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }
  if (['pending', 'draft', 'requested', 'review', 'blocked', 'overdue'].some((item) => value.includes(item))) {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }
  return 'border-slate-200 bg-slate-50 text-slate-600'
}

function recordPayload(record: Employee360Record): JsonObject {
  const source = record.metadata.sourceRow
  if (source && typeof source === 'object' && !Array.isArray(source)) return source as JsonObject
  return {
    title: record.title,
    status: record.status,
    priority: record.priority,
    notes: record.subtitle,
  }
}

function defaultDomainForm(config: DomainConfig, record?: Employee360Record): Record<string, string> {
  const source = record ? recordPayload(record) : {}
  const values: Record<string, string> = {}
  config.fields.forEach((field) => {
    const raw = source[field.key] ?? source[field.key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)]
    values[field.key] = raw === null || raw === undefined ? '' : String(raw)
  })
  if (record) {
    values.title ||= record.title
    values.status ||= record.status
    values.priority ||= record.priority || ''
    values.notes ||= record.subtitle || ''
  }
  return values
}

function profileToForm(profile: Employee360Profile): Record<string, string> {
  return {
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    preferredName: profile.preferredName || '',
    fullName: profile.fullName,
    email: profile.email || '',
    phone: profile.phone || '',
    nationalId: profile.nationalId || '',
    dateOfBirth: profile.dateOfBirth || '',
    placeOfBirth: profile.placeOfBirth || '',
    nationality: profile.nationality || '',
    gender: profile.gender || '',
    maritalStatus: profile.maritalStatus || '',
    childrenCount: String(profile.childrenCount || 0),
    address: profile.address || '',
    city: profile.city || '',
    postalCode: profile.postalCode || '',
    country: profile.country || '',
    branchOffice: profile.branchOffice || '',
    workCity: profile.workCity || '',
    remoteOption: profile.remoteOption || '',
    position: profile.position || '',
    department: profile.department || '',
    manager: profile.manager || '',
    employmentType: profile.employmentType || '',
    startDate: profile.startDate || '',
    hireDate: profile.hireDate || '',
    probationEndDate: profile.probationEndDate || '',
    contractType: profile.contractType || '',
    salary: profile.salary === null ? '' : String(profile.salary),
    currency: profile.currency || 'MAD',
    paymentMethod: profile.paymentMethod || '',
    cnssNumber: profile.cnssNumber || '',
    amoNumber: profile.amoNumber || '',
    emergencyContactName: profile.emergencyContactName || '',
    emergencyContactPhone: profile.emergencyContactPhone || '',
    emergencyContactRelation: profile.emergencyContactRelation || '',
    confidentialityLevel: profile.confidentialityLevel || 'internal',
  }
}

function MetricCard({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: typeof Activity; tone: string }) {
  return (
    <div className="relative overflow-hidden rounded-[26px] border border-slate-200/70 bg-white p-5 shadow-sm">
      <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${tone} opacity-10 blur-2xl`} />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
        </div>
        <div className={`rounded-2xl bg-gradient-to-br ${tone} p-3 text-white shadow-lg`}><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  )
}

function DataLine({ label, value, confidential = false }: { label: string; value: string | null; confidential?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className={`mt-1 break-words text-sm font-black ${confidential ? 'text-violet-800' : 'text-slate-900'}`}>{value || '—'}</p>
    </div>
  )
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="grid h-full min-h-[520px] place-items-center p-8">
      <div className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-[24px] bg-slate-950 text-white shadow-xl"><Loader2 className="h-7 w-7 animate-spin" /></div>
        <p className="mt-5 text-lg font-black text-slate-950">{message}</p>
        <p className="mt-2 text-sm font-semibold text-slate-500">Chargement ciblé du dossier et des autorités RH natives.</p>
      </div>
    </div>
  )
}

function ErrorState({ error, retry, close }: { error: string; retry: () => void; close?: () => void }) {
  return (
    <div className="grid h-full min-h-[520px] place-items-center p-8">
      <div className="max-w-xl rounded-[30px] border border-rose-200 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-[24px] bg-rose-600 text-white"><AlertTriangle className="h-7 w-7" /></div>
        <h2 className="mt-5 text-2xl font-black text-slate-950">Dossier Employee 360 indisponible</h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{error}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" onClick={retry} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"><RefreshCw className="mr-2 inline h-4 w-4" />Réessayer</button>
          {close ? <button type="button" onClick={close} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700">Fermer</button> : null}
        </div>
      </div>
    </div>
  )
}

function DomainCard({
  record,
  onEdit,
  onArchive,
  onRestore,
  onValidate,
  canManage,
  canValidate,
  onDownload,
}: {
  record: Employee360Record
  onEdit: () => void
  onArchive: () => void
  onRestore: () => void
  onValidate: () => void
  canManage: boolean
  canValidate: boolean
  onDownload?: () => void
}) {
  const archived = Boolean(record.archivedAt)
  return (
    <article className={`rounded-[26px] border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${archived ? 'border-slate-200 opacity-70' : 'border-slate-200/80'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${statusTone(record.status)}`}>{record.status}</span>
            {record.priority ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-500">{record.priority}</span> : null}
            {archived ? <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-black uppercase text-white">Archivé</span> : null}
          </div>
          <h3 className="mt-3 truncate text-base font-black text-slate-950">{record.title}</h3>
          <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{record.subtitle || 'Aucune note complémentaire.'}</p>
        </div>
        <button type="button" onClick={onEdit} disabled={!canManage || archived} className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-slate-500 transition hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"><Pencil className="h-4 w-4" /></button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-slate-50 px-3 py-2"><span className="font-bold text-slate-400">Effectif</span><p className="mt-0.5 font-black text-slate-800">{formatDate(record.effectiveAt)}</p></div>
        <div className="rounded-xl bg-slate-50 px-3 py-2"><span className="font-bold text-slate-400">Échéance</span><p className="mt-0.5 font-black text-slate-800">{formatDate(record.dueAt)}</p></div>
      </div>
      {record.amount !== null ? <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-800">{money(record.amount, record.currency || 'MAD')}</div> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {onDownload && !archived ? <button type="button" onClick={onDownload} className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-700"><Download className="mr-1 inline h-3.5 w-3.5" />Télécharger</button> : null}
        {!archived && canValidate && !['approved', 'validated', 'completed'].includes(record.status.toLowerCase()) ? (
          <button type="button" onClick={onValidate} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white"><Check className="mr-1 inline h-3.5 w-3.5" />Valider</button>
        ) : null}
        {canManage ? archived ? (
          <button type="button" onClick={onRestore} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700"><RotateCcw className="mr-1 inline h-3.5 w-3.5" />Restaurer</button>
        ) : (
          <button type="button" onClick={onArchive} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700"><Archive className="mr-1 inline h-3.5 w-3.5" />Archiver</button>
        ) : null}
        <span className="ml-auto self-center text-[10px] font-bold uppercase tracking-wide text-slate-300">v{record.version} · {record.sourceTable}</span>
      </div>
    </article>
  )
}

function FieldControl({ definition, value, onChange }: { definition: FieldDefinition; value: string; onChange: (value: string) => void }) {
  const base = 'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100'
  return (
    <label className={definition.wide ? 'md:col-span-2' : ''}>
      <span className="text-xs font-black text-slate-600">{definition.label}{definition.required ? <b className="ml-1 text-rose-500">*</b> : null}</span>
      {definition.type === 'textarea' ? (
        <textarea value={value} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)} rows={4} placeholder={definition.placeholder} className={base} />
      ) : definition.type === 'select' ? (
        <select value={value} onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)} className={base}>
          <option value="">Sélectionner</option>
          {definition.options?.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : (
        <input value={value} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)} type={definition.type || 'text'} placeholder={definition.placeholder} className={base} />
      )}
    </label>
  )
}

function DialogFrame({ title, subtitle, children, close }: { title: string; subtitle: string; children: ReactNode; close: () => void }) {
  return (
    <div className={styles.dialogBackdrop} role="dialog" aria-modal="true" aria-label={title}>
      <section className={styles.dialog}>
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur">
          <div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-600">Employee 360 Command</p><h2 className="mt-1 text-2xl font-black text-slate-950">{title}</h2><p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p></div>
          <button type="button" onClick={close} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-500"><X className="h-5 w-5" /></button>
        </header>
        {children}
      </section>
    </div>
  )
}

export function Employee360CommandSurface({
  employeeId,
  initialEmployee,
  mode = 'modal',
  onClose,
  onSaved,
}: {
  employeeId: string
  initialEmployee?: EmployeeSeed | null
  mode?: SurfaceMode
  onClose?: () => void
  onSaved?: (employee: EmployeeSeed) => void
}) {
  const [aggregate, setAggregate] = useState<Employee360Aggregate | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [dialog, setDialog] = useState<DialogState>(null)
  const [loading, setLoading] = useState(true)
  const [mutating, setMutating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [reason, setReason] = useState('')
  const [targetState, setTargetState] = useState<EmployeeLifecycleState>('active')
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/hr/employees/${encodeURIComponent(employeeId)}/360`, { cache: 'no-store' })
      const data = await response.json() as { ok?: boolean; aggregate?: Employee360Aggregate; error?: string }
      if (!response.ok || !data.ok || !data.aggregate) throw new Error(data.error || 'Chargement Employee 360 impossible.')
      setAggregate(data.aggregate)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Chargement Employee 360 impossible.')
    } finally {
      setLoading(false)
    }
  }, [employeeId])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (!dialog || !aggregate) return
    setReason('')
    if (dialog.kind === 'profile') setFormValues(profileToForm(aggregate.profile))
    if (dialog.kind === 'domain') setFormValues(defaultDomainForm(DOMAIN_CONFIG[dialog.domain], dialog.record))
    if (dialog.kind === 'documentUpload') { setFormValues({ title: '', documentType: 'document', expiryDate: '', owner: '', notes: '' }); setUploadFile(null) }
    if (dialog.kind === 'lifecycle') setTargetState(aggregate.profile.lifecycleState === 'archived' ? 'rehired' : 'active')
    if (dialog.kind === 'note') setFormValues({ title: '', description: '', priority: 'medium', domain: 'employee' })
    if (dialog.kind === 'domainAction') setReason('')
  }, [dialog, aggregate])

  const mutate = useCallback(async (request: Omit<Employee360MutationRequest, 'expectedVersion'>) => {
    if (!aggregate) return false
    setMutating(true)
    setError('')
    setNotice('')
    setProgress(18)
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 80))
      setProgress(45)
      const response = await fetch(`/api/hr/employees/${encodeURIComponent(employeeId)}/360/actions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...request,
          expectedVersion: aggregate.profile.version,
          idempotencyKey: `${request.action}-${employeeId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        }),
      })
      setProgress(75)
      const data = await response.json() as { ok?: boolean; aggregate?: Employee360Aggregate; error?: string; code?: string }
      if (!response.ok || !data.ok || !data.aggregate) {
        if (data.code === 'VERSION_CONFLICT') await load()
        throw new Error(data.error || 'Opération Employee 360 impossible.')
      }
      setAggregate(data.aggregate)
      setProgress(100)
      setNotice('Opération enregistrée, synchronisée et auditée.')
      onSaved?.(Object.fromEntries(Object.entries(data.aggregate.profile)))
      setDialog(null)
      return true
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Opération Employee 360 impossible.')
      return false
    } finally {
      window.setTimeout(() => setProgress(0), 500)
      setMutating(false)
    }
  }, [aggregate, employeeId, load, onSaved])

  const activeDomain = activeTab in DOMAIN_CONFIG ? activeTab as Employee360DomainKey : null
  const domainRecords = useMemo(() => {
    if (!aggregate || !activeDomain) return []
    const query = search.trim().toLowerCase()
    return aggregate.domains[activeDomain]
      .filter((record) => showArchived || !record.archivedAt)
      .filter((record) => !query || `${record.title} ${record.subtitle || ''} ${record.status} ${record.owner || ''}`.toLowerCase().includes(query))
  }, [activeDomain, aggregate, search, showArchived])

  const shellClass = mode === 'modal' ? styles.modalShell : styles.fullPageShell

  function closeDialog() {
    if (!mutating) setDialog(null)
  }

  async function uploadDocument() {
    if (!aggregate || !uploadFile) return
    setMutating(true)
    setError('')
    setNotice('')
    setProgress(15)
    try {
      const body = new FormData()
      body.set('file', uploadFile)
      body.set('expectedVersion', String(aggregate.profile.version))
      body.set('title', formValues.title || uploadFile.name)
      body.set('documentType', formValues.documentType || 'document')
      body.set('expiryDate', formValues.expiryDate || '')
      body.set('owner', formValues.owner || '')
      body.set('notes', formValues.notes || '')
      body.set('reason', reason || 'Téléversement depuis Employee 360.')
      body.set('idempotencyKey', `document-upload-${employeeId}-${uploadFile.name}-${uploadFile.size}-${uploadFile.lastModified}`)
      setProgress(38)
      const response = await fetch(`/api/hr/employees/${encodeURIComponent(employeeId)}/360/documents/upload`, {
        method: 'POST',
        body,
      })
      setProgress(78)
      const data = await response.json() as { ok?: boolean; aggregate?: Employee360Aggregate; error?: string; code?: string }
      if (!response.ok || !data.ok || !data.aggregate) {
        if (data.code === 'VERSION_CONFLICT') await load()
        throw new Error(data.error || 'Téléversement impossible.')
      }
      setAggregate(data.aggregate)
      setProgress(100)
      setNotice('Document téléversé, lié au dossier et audité.')
      onSaved?.(Object.fromEntries(Object.entries(data.aggregate.profile)))
      setDialog(null)
      setUploadFile(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Téléversement impossible.')
    } finally {
      window.setTimeout(() => setProgress(0), 500)
      setMutating(false)
    }
  }

  async function downloadDocument(record: Employee360Record) {
    setError('')
    try {
      const response = await fetch(`/api/hr/employees/${encodeURIComponent(employeeId)}/360/documents/${encodeURIComponent(record.id)}/download`, { cache: 'no-store' })
      const data = await response.json() as { ok?: boolean; url?: string; error?: string }
      if (!response.ok || !data.ok || !data.url) throw new Error(data.error || 'Téléchargement impossible.')
      window.open(data.url, '_blank', 'noopener,noreferrer')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Téléchargement impossible.')
    }
  }

  async function submitDialog() {
    if (!dialog || !aggregate) return
    if (dialog.kind === 'profile') {
      await mutate({ action: 'profile.update', payload: formValues, reason: reason || 'Mise à jour du dossier Employee 360.' })
      return
    }
    if (dialog.kind === 'domain') {
      const action = dialog.record ? 'domain.update' : 'domain.create'
      await mutate({ action, domain: dialog.domain, recordId: dialog.record?.id, expectedRecordVersion: dialog.record?.version, payload: formValues, reason })
      return
    }
    if (dialog.kind === 'lifecycle') {
      await mutate({ action: 'lifecycle.transition', targetState, reason, payload: {} })
      return
    }
    if (dialog.kind === 'domainAction') {
      const action = dialog.action === 'archive' ? 'domain.archive' : dialog.action === 'restore' ? 'domain.restore' : 'domain.validate'
      await mutate({
        action,
        domain: dialog.domain,
        recordId: dialog.record.id,
        expectedRecordVersion: dialog.record.version,
        reason: reason || (dialog.action === 'restore' ? 'Restauration depuis Employee 360.' : dialog.action === 'validate' ? 'Validation depuis Employee 360.' : undefined),
        payload: dialog.action === 'validate' ? { status: 'validated' } : {},
      })
      return
    }
    if (dialog.kind === 'archive') {
      await mutate({ action: aggregate.profile.archivedAt ? 'employee.restore' : 'employee.archive', reason, payload: {} })
      return
    }
    if (dialog.kind === 'note') {
      await mutate({ action: 'note.create', payload: formValues, reason: formValues.description })
    }
  }

  function printDossier() {
    if (!aggregate) return
    const profile = aggregate.profile
    const safeRows = [
      ['Nom complet', profile.fullName],
      ['Email professionnel', profile.email || '—'],
      ['Téléphone', profile.phone || '—'],
      ['Département', profile.department || '—'],
      ['Poste', profile.position || '—'],
      ['Manager', profile.manager || '—'],
      ['Ville', profile.workCity || profile.city || '—'],
      ['Statut emploi', profile.employmentStatus],
      ['Cycle de vie', profile.lifecycleState],
      ['Date d’entrée', formatDate(profile.hireDate || profile.startDate)],
      ['Type de contrat', profile.contractType || '—'],
      ['CNSS', profile.cnssNumber || '—'],
      ['AMO', profile.amoNumber || '—'],
    ]
    const domainRows = Object.entries(aggregate.domains).map(([key, values]) => `<tr><td>${DOMAIN_CONFIG[key as Employee360DomainKey].label}</td><td>${values.length}</td></tr>`).join('')
    const popup = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=850')
    if (!popup) return
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Dossier Employee 360 — ${profile.fullName}</title><style>body{font-family:Arial,sans-serif;color:#0f172a;margin:36px}header{border-bottom:4px solid #0f172a;padding-bottom:18px}h1{margin:8px 0 0;font-size:30px}small{color:#64748b}table{width:100%;border-collapse:collapse;margin-top:22px}td,th{border:1px solid #cbd5e1;padding:10px;text-align:left}th{background:#07172d;color:#fff}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:22px}.card{border:1px solid #cbd5e1;padding:12px;border-radius:10px}.label{font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700}.value{font-weight:700;margin-top:4px}@media print{body{margin:16mm}}</style></head><body><header><small>ANGELCARE · DOSSIER RH CONFIDENTIEL</small><h1>${profile.fullName}</h1><p>Snapshot Employee 360 · ${formatDateTime(aggregate.loadedAt)}</p></header><div class="grid">${safeRows.map(([label, value]) => `<div class="card"><div class="label">${label}</div><div class="value">${value}</div></div>`).join('')}</div><h2>Couverture opérationnelle</h2><table><thead><tr><th>Domaine</th><th>Enregistrements liés</th></tr></thead><tbody>${domainRows}</tbody></table><h2>Indicateurs</h2><table><tbody><tr><td>Readiness</td><td>${aggregate.summary.readiness}%</td></tr><tr><td>Risque</td><td>${aggregate.summary.risk}%</td></tr><tr><td>Couverture evidence</td><td>${aggregate.summary.evidenceCoverage}%</td></tr><tr><td>Actions ouvertes</td><td>${aggregate.summary.openActions}</td></tr></tbody></table><script>window.onload=()=>window.print()</script></body></html>`)
    popup.document.close()
  }

  if (loading) return <div className={`${styles.surface} ${shellClass}`}><LoadingState message="Ouverture du dossier Employee 360" /></div>
  if (error && !aggregate) return <div className={`${styles.surface} ${shellClass}`}><ErrorState error={error} retry={load} close={onClose} /></div>
  if (!aggregate) return null

  const profile = aggregate.profile
  const currentConfig = activeDomain ? DOMAIN_CONFIG[activeDomain] : null
  const CurrentDomainIcon = currentConfig?.icon || Activity

  const surface = (
    <div className={`${styles.surface} ${shellClass}`}>
      <div className={styles.commandGrid}>
        <aside className={styles.sideRail}>
          <div className="p-5">
            <div className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/5 p-3">
              <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-white text-sm font-black text-slate-950">{initials(profile.fullName)}</div>
              <div className="min-w-0"><p className="truncate text-sm font-black">{profile.fullName}</p><p className="truncate text-[11px] font-semibold text-slate-300">{profile.position || 'Poste non défini'}</p></div>
            </div>
            <div className="mt-5 rounded-[26px] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">État dossier</span><span className={styles.healthPulse} /></div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-white/8 p-3"><p className="text-[10px] font-bold text-slate-400">Readiness</p><p className="mt-1 text-2xl font-black">{aggregate.summary.readiness}%</p></div>
                <div className="rounded-2xl bg-white/8 p-3"><p className="text-[10px] font-bold text-slate-400">Risque</p><p className="mt-1 text-2xl font-black">{aggregate.summary.risk}%</p></div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300" style={{ width: `${aggregate.summary.readiness}%` }} /></div>
            </div>
            <nav className="mt-5 space-y-1">
              {TAB_ORDER.map(({ key, label, icon: Icon }) => {
                const count = key in DOMAIN_CONFIG ? aggregate.domains[key as Employee360DomainKey].length : null
                const active = activeTab === key
                return (
                  <button key={key} type="button" onClick={() => setActiveTab(key)} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-xs font-black transition ${active ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-300 hover:bg-white/8 hover:text-white'}`}>
                    <Icon className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1 truncate">{label}</span>{count !== null ? <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? 'bg-slate-100 text-slate-600' : 'bg-white/10 text-slate-300'}`}>{count}</span> : null}
                  </button>
                )
              })}
            </nav>
            <div className="mt-6 rounded-[22px] border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
              <p className="font-black text-white">Autorité canonique</p>
              <p className="mt-2 leading-5">hr_staff_profiles · v{profile.version}</p>
              <p className="mt-1 leading-5">Scope: {profile.tenantId || 'non résolu'} / {profile.organizationId || 'non résolu'}</p>
            </div>
          </div>
        </aside>

        <section className={styles.contentGrid}>
          <header className={`${styles.headerMesh} border-b border-slate-200 px-5 py-4 lg:px-7`}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[22px] bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-500 text-lg font-black text-white shadow-xl">{initials(profile.fullName)}</div>
                <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-600">Employee 360 Sovereign Command</p><h1 className="truncate text-2xl font-black tracking-tight text-slate-950">{profile.fullName}</h1><div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500"><span>{profile.position || 'Poste non défini'}</span><span>•</span><span>{profile.department || 'Département non défini'}</span><span>•</span><span>{profile.lifecycleState}</span></div></div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {mode === 'modal' ? <Link href={`/hr/employees/${encodeURIComponent(employeeId)}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-800 shadow-sm">Plein écran</Link> : <Link href="/hr/employees" className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-800 shadow-sm">Retour collaborateurs</Link>}
                {aggregate.permissions.editProfile ? <button type="button" onClick={() => setDialog({ kind: 'profile' })} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-800 shadow-sm"><Pencil className="mr-1.5 inline h-4 w-4" />Modifier</button> : null}
                {aggregate.permissions.manageDomains ? <button type="button" onClick={() => setDialog({ kind: 'note' })} className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-xs font-black text-violet-700"><MessageSquareText className="mr-1.5 inline h-4 w-4" />Note RH</button> : null}
                {aggregate.permissions.manageLifecycle ? <button type="button" onClick={() => setDialog({ kind: 'lifecycle' })} className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-xs font-black text-cyan-700"><RefreshCw className="mr-1.5 inline h-4 w-4" />Cycle de vie</button> : null}
                {aggregate.permissions.print ? <button type="button" onClick={printDossier} className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600"><Printer className="h-4 w-4" /></button> : null}
                {aggregate.permissions.archive || aggregate.permissions.restore ? <button type="button" onClick={() => setDialog({ kind: 'archive' })} className={`rounded-2xl p-2.5 ${profile.archivedAt ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-white'}`}>{profile.archivedAt ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}</button> : null}
                {onClose ? <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-500"><X className="h-4 w-4" /></button> : null}
              </div>
            </div>
            {progress > 0 ? <div className={`mt-4 ${styles.progressBar}`}><span style={{ width: `${progress}%` }} /></div> : null}
            {notice ? <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700"><CheckCircle2 className="mr-1.5 inline h-4 w-4" />{notice}</div> : null}
            {error ? <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black text-rose-700"><span><AlertTriangle className="mr-1.5 inline h-4 w-4" />{error}</span><button type="button" onClick={() => setError('')}><X className="h-4 w-4" /></button></div> : null}
          </header>

          <div className="border-b border-slate-200 bg-white px-5 py-3 lg:px-7"><div className={styles.tabRow}>{TAB_ORDER.map(({ key, label, icon: Icon }) => <button key={key} type="button" onClick={() => setActiveTab(key)} className={`inline-flex shrink-0 items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-black transition ${activeTab === key ? 'bg-slate-950 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-violet-50 hover:text-violet-700'}`}><Icon className="h-3.5 w-3.5" />{label}</button>)}</div></div>

          <main className={`${styles.mainScroll} bg-slate-50 p-5 lg:p-7`}>
            {activeTab === 'overview' ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard label="Readiness" value={`${aggregate.summary.readiness}%`} detail="Identité + preuves natives" icon={Gauge} tone="from-violet-600 to-fuchsia-600" />
                  <MetricCard label="Risque" value={`${aggregate.summary.risk}%`} detail="Échéances, anomalies et couverture" icon={ShieldAlert} tone="from-rose-600 to-orange-600" />
                  <MetricCard label="Couverture preuves" value={`${aggregate.summary.evidenceCoverage}%`} detail={`${Object.values(aggregate.domains).filter((rows) => rows.length).length} domaines alimentés`} icon={Fingerprint} tone="from-cyan-600 to-blue-600" />
                  <MetricCard label="Actions ouvertes" value={String(aggregate.summary.openActions)} detail={`${aggregate.summary.overdueActions} en retard`} icon={Activity} tone="from-emerald-600 to-teal-600" />
                </div>

                <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
                  <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600">Couverture opérationnelle</p><h2 className="mt-1 text-xl font-black text-slate-950">Autorités natives du collaborateur</h2><p className="mt-1 text-sm font-semibold text-slate-500">Chaque compteur provient de sa table métier, jamais d’un tableau JSON dans le profil.</p></div><ShieldCheck className="h-6 w-6 text-emerald-600" /></div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(DOMAIN_CONFIG).map(([key, config]) => {
                        const domain = key as Employee360DomainKey
                        const Icon = config.icon
                        const count = aggregate.domains[domain].length
                        const health = aggregate.health.domainAuthority[domain]
                        return <button key={key} type="button" onClick={() => setActiveTab(domain)} className="group rounded-[22px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-violet-200 hover:bg-violet-50"><div className="flex items-center justify-between"><div className={`rounded-xl bg-gradient-to-br ${config.accent} p-2 text-white`}><Icon className="h-4 w-4" /></div><span className={`h-2.5 w-2.5 rounded-full ${health === 'healthy' ? 'bg-emerald-400' : health === 'degraded' ? 'bg-amber-400' : 'bg-rose-400'}`} /></div><p className="mt-3 text-sm font-black text-slate-900">{config.label}</p><p className="mt-1 text-xs font-bold text-slate-500">{count} enregistrement{count > 1 ? 's' : ''}</p></button>
                      })}
                    </div>
                  </section>

                  <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-700">Actions prioritaires</p><h2 className="mt-1 text-xl font-black text-slate-950">Points de contrôle</h2>
                    <div className="mt-5 space-y-3">
                      {[
                        ['Documents à risque', aggregate.summary.documentsAtRisk, 'documents'],
                        ['Anomalies présence', aggregate.summary.attendanceAnomalies, 'attendance'],
                        ['Congés en attente', aggregate.summary.leavePending, 'leave'],
                        ['Formations à traiter', aggregate.summary.trainingDue, 'training'],
                        ['Revues performance', aggregate.summary.performanceDue, 'performance'],
                      ].map(([label, count, tab]) => <button key={String(label)} type="button" onClick={() => setActiveTab(tab as ActiveTab)} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left"><span className="text-sm font-black text-slate-800">{label}</span><span className={`rounded-full px-2.5 py-1 text-xs font-black ${Number(count) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{String(count)}</span></button>)}
                    </div>
                    <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-white"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-cyan-300" /><p className="text-xs font-black uppercase tracking-wide">État de synchronisation</p></div><p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{aggregate.health.warnings.length ? `${aggregate.health.warnings.length} source(s) nécessitent une inspection.` : 'Toutes les sources Employee 360 sont accessibles.'}</p></div>
                  </section>
                </div>

                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Derniers événements</p><h2 className="mt-1 text-xl font-black text-slate-950">Timeline auditée</h2></div><button type="button" onClick={() => setActiveTab('audit')} className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700">Voir tout <ChevronRight className="ml-1 inline h-4 w-4" /></button></div>
                  <div className="mt-5 grid gap-3 lg:grid-cols-2">
                    {aggregate.timeline.slice(0, 6).map((event) => <div key={event.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase text-slate-500">{event.domain}</span><span className="text-[10px] font-bold text-slate-400">{formatDateTime(event.createdAt)}</span></div><p className="mt-3 text-sm font-black text-slate-900">{event.title}</p><p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{event.summary || 'Événement enregistré.'}</p></div>)}
                    {!aggregate.timeline.length ? <div className="lg:col-span-2 rounded-[22px] border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500">Aucun événement Employee 360 enregistré.</div> : null}
                  </div>
                </section>
              </div>
            ) : null}

            {activeTab === 'identity' ? (
              <div className="space-y-5">
                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600">Identité canonique</p><h2 className="mt-1 text-2xl font-black text-slate-950">Informations personnelles & contact</h2></div>{aggregate.permissions.editProfile ? <button type="button" onClick={() => setDialog({ kind: 'profile' })} className="rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white"><Pencil className="mr-1.5 inline h-4 w-4" />Modifier</button> : null}</div><div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><DataLine label="Nom complet" value={profile.fullName} /><DataLine label="Nom préféré" value={profile.preferredName} /><DataLine label="Email" value={profile.email} /><DataLine label="Téléphone" value={profile.phone} /><DataLine label="CIN / identité" value={profile.nationalId} confidential /><DataLine label="Date de naissance" value={formatDate(profile.dateOfBirth)} confidential /><DataLine label="Lieu de naissance" value={profile.placeOfBirth} /><DataLine label="Nationalité" value={profile.nationality} /><DataLine label="Genre" value={profile.gender} /><DataLine label="Situation familiale" value={profile.maritalStatus} /><DataLine label="Enfants" value={String(profile.childrenCount)} /><DataLine label="Niveau confidentialité" value={profile.confidentialityLevel} confidential /></div></section>
                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-black text-slate-950">Adresse & urgence</h2><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><DataLine label="Adresse" value={profile.address} /><DataLine label="Ville" value={profile.city} /><DataLine label="Code postal" value={profile.postalCode} /><DataLine label="Pays" value={profile.country} /><DataLine label="Contact urgence" value={profile.emergencyContactName} confidential /><DataLine label="Téléphone urgence" value={profile.emergencyContactPhone} confidential /><DataLine label="Relation" value={profile.emergencyContactRelation} /><DataLine label="App user" value={profile.appUserId} confidential /></div></section>
              </div>
            ) : null}

            {activeTab === 'employment' ? (
              <div className="space-y-5">
                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-700">Relation d’emploi</p><h2 className="mt-1 text-2xl font-black text-slate-950">Affectation & conditions</h2></div><span className={`rounded-full border px-3 py-1.5 text-xs font-black uppercase ${statusTone(profile.employmentStatus)}`}>{profile.employmentStatus}</span></div><div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><DataLine label="Poste" value={profile.position} /><DataLine label="Département" value={profile.department} /><DataLine label="Manager" value={profile.manager} /><DataLine label="Type emploi" value={profile.employmentType} /><DataLine label="Date d’entrée" value={formatDate(profile.hireDate || profile.startDate)} /><DataLine label="Fin période d’essai" value={formatDate(profile.probationEndDate)} /><DataLine label="Type contrat" value={profile.contractType} /><DataLine label="Option distance" value={profile.remoteOption} /><DataLine label="Site" value={profile.branchOffice} /><DataLine label="Ville de travail" value={profile.workCity} /><DataLine label="CNSS" value={profile.cnssNumber} confidential /><DataLine label="AMO" value={profile.amoNumber} confidential />{aggregate.permissions.viewCompensation ? <><DataLine label="Salaire" value={profile.salary === null ? null : money(profile.salary, profile.currency || 'MAD')} confidential /><DataLine label="Paiement" value={profile.paymentMethod} confidential /></> : null}</div></section>
                <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600">Cycle de vie</p><h2 className="mt-1 text-xl font-black text-slate-950">État actuel: {profile.lifecycleState}</h2></div>{aggregate.permissions.manageLifecycle ? <button type="button" onClick={() => setDialog({ kind: 'lifecycle' })} className="rounded-2xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white">Gérer le cycle</button> : null}</div><div className="mt-5 grid gap-3 md:grid-cols-3"><DataLine label="Archivé le" value={formatDateTime(profile.archivedAt)} /><DataLine label="Motif archivage" value={profile.archiveReason} /><DataLine label="Réembauche éligible" value={profile.rehireEligible ? 'Oui' : 'Non'} /></div></section>
              </div>
            ) : null}

            {activeDomain ? (
              <div className="space-y-5">
                <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-center gap-3"><div className={`rounded-2xl bg-gradient-to-br ${currentConfig?.accent} p-3 text-white`}><CurrentDomainIcon className="h-5 w-5" /></div><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Autorité native</p><h2 className="text-xl font-black text-slate-950">{currentConfig?.label}</h2><p className="text-xs font-semibold text-slate-500">{aggregate.health.domainAuthority[activeDomain]} · {aggregate.domains[activeDomain].length} enregistrement(s)</p></div></div>
                    <div className="flex flex-wrap items-center gap-2"><label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)} placeholder="Rechercher..." className="h-10 rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-bold outline-none focus:border-violet-300" /></label><button type="button" onClick={() => setShowArchived((value) => !value)} className={`rounded-2xl border px-3 py-2.5 text-xs font-black ${showArchived ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>Archives</button>{activeDomain === 'communications' ? <Link href="/hr/employees#communication" className="rounded-2xl bg-teal-600 px-4 py-2.5 text-xs font-black text-white">Centre communication RH</Link> : aggregate.permissions.manageDomains && !currentConfig?.readOnly ? <button type="button" onClick={() => setDialog(activeDomain === 'documents' ? { kind: 'documentUpload' } : { kind: 'domain', domain: activeDomain })} className="rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white">{activeDomain === 'documents' ? <Upload className="mr-1.5 inline h-4 w-4" /> : <Plus className="mr-1.5 inline h-4 w-4" />}{currentConfig?.createLabel}</button> : null}</div>
                  </div>
                </section>
                <div className={styles.recordGrid}>{domainRecords.map((record) => <DomainCard key={`${record.sourceTable}-${record.id}`} record={record} canManage={aggregate.permissions.manageDomains && record.sourceTable !== 'hr_attendance_records' && activeDomain !== 'communications'} canValidate={aggregate.permissions.validate} onEdit={() => setDialog({ kind: 'domain', domain: activeDomain, record })} onArchive={() => setDialog({ kind: 'domainAction', domain: activeDomain, record, action: 'archive' })} onRestore={() => setDialog({ kind: 'domainAction', domain: activeDomain, record, action: 'restore' })} onValidate={() => setDialog({ kind: 'domainAction', domain: activeDomain, record, action: 'validate' })} onDownload={activeDomain === 'documents' ? () => void downloadDocument(record) : undefined} />)}</div>
                {!domainRecords.length ? <div className="rounded-[30px] border border-dashed border-slate-300 bg-white p-12 text-center"><div className={`mx-auto grid h-16 w-16 place-items-center rounded-[24px] bg-gradient-to-br ${currentConfig?.accent} text-white`}><CurrentDomainIcon className="h-7 w-7" /></div><h3 className="mt-5 text-xl font-black text-slate-950">Aucun enregistrement {currentConfig?.label.toLowerCase()}</h3><p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-500">Le dossier est vide. Aucun faux cas, modèle ou donnée locale n’est affiché.</p></div> : null}
              </div>
            ) : null}

            {activeTab === 'lifecycle' ? (
              <div className="grid gap-5 xl:grid-cols-[.7fr_1.3fr]"><section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600">État actuel</p><h2 className="mt-2 text-3xl font-black text-slate-950">{profile.lifecycleState}</h2><p className="mt-2 text-sm font-semibold leading-6 text-slate-500">Toute transition exige une justification, une autorisation, une version courante et une preuve d’audit.</p>{aggregate.permissions.manageLifecycle ? <button type="button" onClick={() => setDialog({ kind: 'lifecycle' })} className="mt-6 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Nouvelle transition</button> : null}</section><section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-black text-slate-950">Historique du cycle de vie</h2><div className="mt-5 space-y-3">{aggregate.timeline.filter((event) => event.domain === 'lifecycle').map((event) => <div key={event.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between"><span className="text-sm font-black text-slate-900">{event.title}</span><span className="text-[10px] font-bold text-slate-400">{formatDateTime(event.createdAt)}</span></div><p className="mt-2 text-xs font-semibold text-slate-500">{event.summary || 'Transition enregistrée.'}</p><p className="mt-2 text-[10px] font-black uppercase text-violet-600">{event.actorName || 'Système'}</p></div>)}{!aggregate.timeline.some((event) => event.domain === 'lifecycle') ? <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500">Aucune transition enregistrée.</p> : null}</div></section></div>
            ) : null}

            {activeTab === 'audit' ? (
              <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Evidence immuable</p><h2 className="mt-1 text-2xl font-black text-slate-950">Timeline Employee 360</h2></div><button type="button" onClick={load} className="rounded-2xl border border-slate-200 p-3 text-slate-500"><RefreshCw className="h-4 w-4" /></button></div><div className="mt-6 space-y-3">{aggregate.timeline.map((event) => <article key={event.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase text-violet-700">{event.domain}</span><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase text-slate-500">{event.action}</span></div><span className="text-[10px] font-bold text-slate-400">{formatDateTime(event.createdAt)}</span></div><h3 className="mt-3 text-sm font-black text-slate-950">{event.title}</h3><p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{event.summary || 'Événement enregistré.'}</p><div className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase text-slate-400"><UserCheck className="h-3.5 w-3.5" />{event.actorName || 'Système'} · {event.riskLevel}</div></article>)}{!aggregate.timeline.length ? <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm font-semibold text-slate-500">Aucun événement audité.</p> : null}</div></section>
            ) : null}
          </main>
        </section>
      </div>

      {dialog?.kind === 'profile' ? <DialogFrame title="Modifier le dossier collaborateur" subtitle="Les champs sont persistés dans hr_staff_profiles avec contrôle de version." close={closeDialog}><div className="grid gap-4 p-6 md:grid-cols-2">{[
        ['firstName', 'Prénom'], ['lastName', 'Nom'], ['preferredName', 'Nom préféré'], ['fullName', 'Nom complet'], ['email', 'Email'], ['phone', 'Téléphone'], ['nationalId', 'CIN / Identité'], ['dateOfBirth', 'Date de naissance', 'date'], ['placeOfBirth', 'Lieu de naissance'], ['nationality', 'Nationalité'], ['gender', 'Genre'], ['maritalStatus', 'Situation familiale'], ['childrenCount', 'Enfants', 'number'], ['address', 'Adresse'], ['city', 'Ville'], ['postalCode', 'Code postal'], ['country', 'Pays'], ['branchOffice', 'Site'], ['workCity', 'Ville de travail'], ['remoteOption', 'Option distance'], ['position', 'Poste'], ['department', 'Département'], ['manager', 'Manager'], ['employmentType', 'Type emploi'], ['startDate', 'Date de début', 'date'], ['hireDate', 'Date d’embauche', 'date'], ['probationEndDate', 'Fin période d’essai', 'date'], ['contractType', 'Type contrat'], ['salary', 'Salaire', 'number'], ['currency', 'Devise'], ['paymentMethod', 'Mode paiement'], ['cnssNumber', 'CNSS'], ['amoNumber', 'AMO'], ['emergencyContactName', 'Contact urgence'], ['emergencyContactPhone', 'Téléphone urgence'], ['emergencyContactRelation', 'Relation'], ['confidentialityLevel', 'Confidentialité'],
      ].map(([key, label, type]) => <FieldControl key={key} definition={{ key, label, type: (type || 'text') as FieldDefinition['type'] }} value={formValues[key] || ''} onChange={(value) => setFormValues((current) => ({ ...current, [key]: value }))} />)}<label className="md:col-span-2"><span className="text-xs font-black text-slate-600">Justification de modification</span><textarea value={reason} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setReason(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold outline-none focus:border-violet-300" /></label></div><footer className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4"><button type="button" onClick={closeDialog} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600">Annuler</button><button type="button" onClick={() => void submitDialog()} disabled={mutating} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-50"><Save className="mr-1.5 inline h-4 w-4" />Enregistrer</button></footer></DialogFrame> : null}

      {dialog?.kind === 'documentUpload' ? <DialogFrame title="Téléverser un document RH" subtitle="Le fichier est stocké dans un bucket privé, lié au collaborateur et journalisé." close={closeDialog}><div className="grid gap-4 p-6 md:grid-cols-2"><label className="md:col-span-2"><span className="text-xs font-black text-slate-600">Fichier · PDF, image, WebP ou DOCX · 15 Mo max</span><input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.docx" onChange={(event: ChangeEvent<HTMLInputElement>) => setUploadFile(event.target.files?.[0] || null)} className="mt-2 w-full rounded-2xl border border-dashed border-violet-300 bg-violet-50 px-4 py-6 text-sm font-bold text-violet-800" /></label><FieldControl definition={{ key: 'title', label: 'Titre', required: true }} value={formValues.title || ''} onChange={(value) => setFormValues((current) => ({ ...current, title: value }))} /><FieldControl definition={{ key: 'documentType', label: 'Type', type: 'select', options: ['identity', 'contract', 'certificate', 'medical', 'administrative', 'policy', 'other'] }} value={formValues.documentType || ''} onChange={(value) => setFormValues((current) => ({ ...current, documentType: value }))} /><FieldControl definition={{ key: 'expiryDate', label: 'Expiration', type: 'date' }} value={formValues.expiryDate || ''} onChange={(value) => setFormValues((current) => ({ ...current, expiryDate: value }))} /><FieldControl definition={{ key: 'owner', label: 'Responsable' }} value={formValues.owner || ''} onChange={(value) => setFormValues((current) => ({ ...current, owner: value }))} /><FieldControl definition={{ key: 'notes', label: 'Notes', type: 'textarea', wide: true }} value={formValues.notes || ''} onChange={(value) => setFormValues((current) => ({ ...current, notes: value }))} /><label className="md:col-span-2"><span className="text-xs font-black text-slate-600">Motif d’ajout</span><textarea value={reason} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setReason(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold outline-none" /></label></div><footer className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4"><button type="button" onClick={closeDialog} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600">Annuler</button><button type="button" onClick={() => void uploadDocument()} disabled={mutating || !uploadFile} className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50"><Upload className="mr-1.5 inline h-4 w-4" />Téléverser et lier</button></footer></DialogFrame> : null}

      {dialog?.kind === 'domain' ? <DialogFrame title={`${dialog.record ? 'Modifier' : 'Créer'} — ${DOMAIN_CONFIG[dialog.domain].label}`} subtitle="L’opération écrit directement dans l’autorité métier native et produit une preuve d’audit." close={closeDialog}><div className="grid gap-4 p-6 md:grid-cols-2">{DOMAIN_CONFIG[dialog.domain].fields.map((field) => <FieldControl key={field.key} definition={field} value={formValues[field.key] || ''} onChange={(value) => setFormValues((current) => ({ ...current, [field.key]: value }))} />)}<label className="md:col-span-2"><span className="text-xs font-black text-slate-600">Motif / commentaire d’audit</span><textarea value={reason} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setReason(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold outline-none focus:border-violet-300" /></label></div><footer className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4"><button type="button" onClick={closeDialog} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600">Annuler</button><button type="button" onClick={() => void submitDialog()} disabled={mutating} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-50"><Save className="mr-1.5 inline h-4 w-4" />{dialog.record ? 'Mettre à jour' : 'Créer'}</button></footer></DialogFrame> : null}

      {dialog?.kind === 'lifecycle' ? <DialogFrame title="Transition du cycle de vie" subtitle={`État actuel: ${profile.lifecycleState}. Une transition incompatible sera bloquée par le serveur.`} close={closeDialog}><div className="space-y-5 p-6"><label><span className="text-xs font-black text-slate-600">État cible</span><select value={targetState} onChange={(event: ChangeEvent<HTMLSelectElement>) => setTargetState(event.target.value as EmployeeLifecycleState)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black outline-none">{LIFECYCLE_STATES.map((state) => <option key={state.value} value={state.value}>{state.label}</option>)}</select></label><label><span className="text-xs font-black text-slate-600">Justification obligatoire</span><textarea value={reason} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setReason(event.target.value)} rows={5} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none" /></label><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800"><ShieldAlert className="mr-2 inline h-4 w-4" />La transition synchronise le statut d’emploi, incrémente la version et écrit deux preuves: cycle de vie + audit.</div></div><footer className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4"><button type="button" onClick={closeDialog} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600">Annuler</button><button type="button" onClick={() => void submitDialog()} disabled={mutating || !reason.trim()} className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">Exécuter la transition</button></footer></DialogFrame> : null}

      {dialog?.kind === 'domainAction' ? <DialogFrame title={dialog.action === 'archive' ? 'Archiver cet enregistrement' : dialog.action === 'restore' ? 'Restaurer cet enregistrement' : 'Valider cet enregistrement'} subtitle={`${DOMAIN_CONFIG[dialog.domain].label} · ${dialog.record.title}`} close={closeDialog}><div className="space-y-5 p-6"><div className={`rounded-[24px] p-5 ${dialog.action === 'archive' ? 'bg-rose-50 text-rose-800' : dialog.action === 'restore' ? 'bg-cyan-50 text-cyan-800' : 'bg-emerald-50 text-emerald-800'}`}><p className="text-lg font-black">Action contrôlée et auditée</p><p className="mt-1 text-sm font-semibold leading-6">Aucune suppression physique. L’autorité métier native sera mise à jour puis vérifiée.</p></div><label><span className="text-xs font-black text-slate-600">Justification {dialog.action === 'archive' ? 'obligatoire' : 'recommandée'}</span><textarea value={reason} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setReason(event.target.value)} rows={5} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none" /></label></div><footer className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4"><button type="button" onClick={closeDialog} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600">Annuler</button><button type="button" onClick={() => void submitDialog()} disabled={mutating || (dialog.action === 'archive' && !reason.trim())} className={`rounded-2xl px-5 py-3 text-sm font-black text-white disabled:opacity-50 ${dialog.action === 'archive' ? 'bg-rose-700' : dialog.action === 'restore' ? 'bg-cyan-700' : 'bg-emerald-600'}`}>{dialog.action === 'archive' ? 'Archiver' : dialog.action === 'restore' ? 'Restaurer' : 'Valider'}</button></footer></DialogFrame> : null}

      {dialog?.kind === 'archive' ? <DialogFrame title={profile.archivedAt ? 'Restaurer le collaborateur' : 'Archiver le collaborateur'} subtitle="La suppression définitive n’est pas disponible dans cette interface. L’historique est préservé." close={closeDialog}><div className="space-y-5 p-6"><div className={`rounded-[24px] p-5 ${profile.archivedAt ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>{profile.archivedAt ? <RotateCcw className="h-7 w-7" /> : <Archive className="h-7 w-7" />}<p className="mt-3 text-lg font-black">{profile.archivedAt ? 'Restauration contrôlée' : 'Archivage contrôlé'}</p><p className="mt-1 text-sm font-semibold leading-6">Le profil, les contrats, documents, actions et preuves restent conservés.</p></div><label><span className="text-xs font-black text-slate-600">Justification {profile.archivedAt ? 'facultative' : 'obligatoire'}</span><textarea value={reason} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setReason(event.target.value)} rows={5} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none" /></label></div><footer className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4"><button type="button" onClick={closeDialog} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600">Annuler</button><button type="button" onClick={() => void submitDialog()} disabled={mutating || (!profile.archivedAt && !reason.trim())} className={`rounded-2xl px-5 py-3 text-sm font-black text-white disabled:opacity-50 ${profile.archivedAt ? 'bg-emerald-600' : 'bg-rose-700'}`}>{profile.archivedAt ? 'Restaurer' : 'Archiver'}</button></footer></DialogFrame> : null}

      {dialog?.kind === 'note' ? <DialogFrame title="Ajouter une note / un cas RH" subtitle="La note est persistée dans hr_employee_cases et intégrée à la timeline auditée." close={closeDialog}><div className="grid gap-4 p-6 md:grid-cols-2"><FieldControl definition={{ key: 'title', label: 'Titre', required: true }} value={formValues.title || ''} onChange={(value) => setFormValues((current) => ({ ...current, title: value }))} /><FieldControl definition={{ key: 'priority', label: 'Priorité', type: 'select', options: ['low', 'medium', 'high', 'critical'] }} value={formValues.priority || ''} onChange={(value) => setFormValues((current) => ({ ...current, priority: value }))} /><FieldControl definition={{ key: 'domain', label: 'Domaine' }} value={formValues.domain || ''} onChange={(value) => setFormValues((current) => ({ ...current, domain: value }))} /><FieldControl definition={{ key: 'description', label: 'Contenu', type: 'textarea', wide: true, required: true }} value={formValues.description || ''} onChange={(value) => setFormValues((current) => ({ ...current, description: value }))} /></div><footer className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4"><button type="button" onClick={closeDialog} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600">Annuler</button><button type="button" onClick={() => void submitDialog()} disabled={mutating || !formValues.title?.trim() || !formValues.description?.trim()} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-50">Enregistrer la note</button></footer></DialogFrame> : null}
    </div>
  )

  return mode === 'modal' ? <div className={styles.modalBackdrop}>{surface}</div> : surface
}

export default function Employee360DossierModal({
  open,
  employee,
  onClose,
  onSaved,
}: {
  open: boolean
  employee: EmployeeSeed | null
  onClose: () => void
  onSaved?: (employee?: EmployeeSeed) => void
}) {
  const employeeId = seedId(employee)
  if (!open || !employeeId) return null

  return (
    <Employee360CommandSurface
      employeeId={employeeId}
      initialEmployee={employee}
      mode="modal"
      onClose={onClose}
      onSaved={(updated) => onSaved?.(updated)}
    />
  )
}
