'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import {
  Activity,
  AlertTriangle,
  Bell,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  DoorOpen,
  Download,
  FileText,
  Filter,
  Gauge,
  GraduationCap,
  HeartPulse,
  Home,
  LayoutDashboard,
  MapPin,
  Plus,
  RadioTower,
  RefreshCcw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Truck,
  UserPlus,
  Users,
  WalletCards,
  X,
  type LucideIcon,
} from 'lucide-react'

type Tone = 'blue' | 'emerald' | 'amber' | 'rose' | 'orange' | 'slate' | 'violet' | 'cyan'
type OperationsSectionKey =
  | 'vue-reseau'
  | 'aujourdhui'
  | 'sites'
  | 'classes-capacite'
  | 'presence'
  | 'routines-ecole'
  | 'equipe-terrain'
  | 'incidents'
  | 'transport'
  | 'taches-operationnelles'
  | 'qualite-terrain'
  | 'cloture-journee'
  | 'rapports'
  | 'parametres'

type OperationsModalType =
  | 'field_action'
  | 'incident'
  | 'control'
  | 'reinforcement'
  | 'parent_notice'
  | 'closure'
  | 'report'
  | 'site'
  | 'capacity'
  | 'routine'
  | 'transport'
  | 'quality'

type OperationsAction = {
  id: string
  label: string
  detail: string
  icon: LucideIcon
  tone: Tone
  modalType: OperationsModalType
  operation: string
  submitLabel: string
}

type DashboardPayload = {
  ok?: boolean
  operationalDate?: string
  loadedAt?: string
  databaseReady?: boolean
  setupRequired?: boolean
  error?: string
  errors?: Array<{ message?: string; code?: string }>
  summary?: Record<string, unknown>
  readiness?: Record<string, unknown>
  records?: {
    sites?: any[]
    days?: any[]
    classes?: any[]
    capacitySnapshots?: any[]
    routineEvents?: any[]
    incidents?: any[]
    tasks?: any[]
    staffCoverage?: any[]
    transportEvents?: any[]
    qualityChecks?: any[]
    dayClosures?: any[]
    auditEvents?: any[]
  }
  context?: any
}

type ExecutionState = {
  status: 'idle' | 'running' | 'success' | 'blocked' | 'error'
  message?: string
  proofReference?: string | null
}

type Props = {
  initialSection?: string
  legacyAlias?: boolean
}

const operationsSections: Array<{ key: OperationsSectionKey; label: string; href: string; icon: LucideIcon; promise: string }> = [
  { key: 'vue-reseau', label: 'Vue réseau', href: '/angelcare-360/customer/operations/vue-reseau', icon: RadioTower, promise: 'Lecture multi-sites, pression capacité, incidents et exécution réseau.' },
  { key: 'aujourdhui', label: "Aujourd’hui", href: '/angelcare-360/customer/operations/aujourdhui', icon: CalendarDays, promise: 'Pilotage temps réel de la journée : ouverture, routines, présence, transport, clôture.' },
  { key: 'sites', label: 'Sites', href: '/angelcare-360/customer/operations/sites', icon: Building2, promise: 'Dossiers opérationnels par site, responsable, statut, capacité et qualité terrain.' },
  { key: 'classes-capacite', label: 'Classes & capacité', href: '/angelcare-360/customer/operations/classes-capacite', icon: GraduationCap, promise: 'Occupation, ratios, classes sous tension et snapshots de capacité.' },
  { key: 'presence', label: 'Présence', href: '/angelcare-360/customer/operations/presence', icon: Users, promise: 'Présence enfants, présence staff, absences, anomalies et preuves de journée.' },
  { key: 'routines-ecole', label: 'Routines école', href: '/angelcare-360/customer/operations/routines-ecole', icon: ClipboardCheck, promise: 'Accueil, repas, sieste, hygiène, sorties et validations de routines.' },
  { key: 'equipe-terrain', label: 'Équipe terrain', href: '/angelcare-360/customer/operations/equipe-terrain', icon: UserPlus, promise: 'Couverture staff, renforts, remplacements, responsabilités et escalades.' },
  { key: 'incidents', label: 'Incidents', href: '/angelcare-360/customer/operations/incidents', icon: AlertTriangle, promise: 'Déclaration, sévérité, notification parent, preuve et résolution.' },
  { key: 'transport', label: 'Transport', href: '/angelcare-360/customer/operations/transport', icon: Truck, promise: 'Circuits, retards, véhicules, enfants transportés et sécurité.' },
  { key: 'taches-operationnelles', label: 'Tâches opérationnelles', href: '/angelcare-360/customer/operations/taches-operationnelles', icon: ClipboardList, promise: 'Tâches terrain, priorités, ownership, délais et accountability.' },
  { key: 'qualite-terrain', label: 'Qualité terrain', href: '/angelcare-360/customer/operations/qualite-terrain', icon: ShieldCheck, promise: 'Contrôles terrain, hygiène, score, non-conformités et plan d’action.' },
  { key: 'cloture-journee', label: 'Clôture journée', href: '/angelcare-360/customer/operations/cloture-journee', icon: DoorOpen, promise: 'Checklist de fin de journée, validations, rapport et preuve de clôture.' },
  { key: 'rapports', label: 'Rapports', href: '/angelcare-360/customer/operations/rapports', icon: FileText, promise: 'Rapports A4, exports, audit, historique et synthèse direction.' },
  { key: 'parametres', label: 'Paramètres', href: '/angelcare-360/customer/operations/parametres', icon: Settings, promise: 'Règles opérationnelles, routines, SLA, sites, rôles et seuils.' },
]

const globalSidebar = [
  { label: 'Cockpit de Direction', href: '/angelcare-360/customer/cockpit-direction', icon: LayoutDashboard },
  { label: 'Opérations', href: '/angelcare-360/customer/operations/aujourdhui', icon: Activity, active: true, children: operationsSections },
  { label: 'Finance', href: '/angelcare-360/customer/finance-creances', icon: WalletCards },
  { label: 'Admissions', href: '/angelcare-360/customer/admissions-crm', icon: Home },
  { label: 'RH', href: '/angelcare-360/customer/rh-planning', icon: Users },
  { label: 'Qualité & sécurité', href: '/angelcare-360/customer/sante-securite', icon: ShieldCheck },
  { label: 'ParentTrust', href: '/angelcare-360/customer/parenttrust', icon: HeartPulse },
  { label: 'Transport', href: '/angelcare-360/customer/transport-circuits', icon: Truck },
  { label: 'Rapports', href: '/angelcare-360/customer/documents-rapports', icon: FileText },
  { label: 'Paramètres', href: '/angelcare-360/customer/facturation-growth-menu', icon: Settings },
]

const actionCatalog: OperationsAction[] = [
  { id: 'create-field-action', label: 'Créer action terrain', detail: 'Tâche opérationnelle avec owner, priorité et preuve.', icon: Plus, tone: 'emerald', modalType: 'field_action', operation: 'task.create', submitLabel: 'Créer action terrain' },
  { id: 'declare-incident', label: 'Déclarer un incident', detail: 'Incident structuré avec sévérité et notification parent.', icon: AlertTriangle, tone: 'rose', modalType: 'incident', operation: 'incident.create', submitLabel: 'Déclarer incident' },
  { id: 'launch-control', label: 'Lancer contrôle terrain', detail: 'Contrôle qualité, score, non-conformités et plan d’action.', icon: ShieldCheck, tone: 'blue', modalType: 'control', operation: 'quality.check.create', submitLabel: 'Lancer contrôle' },
  { id: 'assign-staff', label: 'Affecter renfort staff', detail: 'Couverture staff attendue / présente et besoin de remplacement.', icon: UserPlus, tone: 'cyan', modalType: 'reinforcement', operation: 'staff.coverage.record', submitLabel: 'Affecter renfort' },
  { id: 'notify-parents', label: 'Notifier les parents', detail: 'Prépare une action gouvernée de communication et preuve.', icon: Send, tone: 'orange', modalType: 'parent_notice', operation: 'task.create', submitLabel: 'Préparer notification' },
  { id: 'close-day', label: 'Clôturer la journée', detail: 'Validation présence, routines, incidents, transport et tasks critiques.', icon: DoorOpen, tone: 'blue', modalType: 'closure', operation: 'day.close', submitLabel: 'Préparer la clôture' },
  { id: 'export-report', label: 'Exporter rapport opérations', detail: 'Queue rapport A4 opérations avec audit et preuve.', icon: Download, tone: 'violet', modalType: 'report', operation: 'report.queue', submitLabel: 'Créer rapport A4' },
]

const fallbackSites = [
  { site_name: 'Casablanca Oasis', city: 'Casablanca', occupancy_rate: 92, classes_open: 12, classes_total: 13, incidents: 2, late_tasks: 5, tone: 'emerald' as Tone },
  { site_name: 'Rabat Académie', city: 'Rabat', occupancy_rate: 89, classes_open: 10, classes_total: 11, incidents: 2, late_tasks: 7, tone: 'blue' as Tone },
  { site_name: 'Kénitra Centre', city: 'Kénitra', occupancy_rate: 93, classes_open: 8, classes_total: 8, incidents: 1, late_tasks: 3, tone: 'emerald' as Tone },
  { site_name: 'Marrakech Palmeraie', city: 'Marrakech', occupancy_rate: 88, classes_open: 7, classes_total: 8, incidents: 3, late_tasks: 6, tone: 'rose' as Tone },
  { site_name: 'Fès Atlas', city: 'Fès', occupancy_rate: 90, classes_open: 9, classes_total: 10, incidents: 2, late_tasks: 4, tone: 'blue' as Tone },
]

const fallbackRoutines = [
  ['Accueil & présence', 95, '82 / 86 classes'],
  ['Activités pédagogiques', 93, '80 / 86 classes'],
  ['Repas & nutrition', 91, '78 / 86 classes'],
  ['Sieste & repos', 96, '83 / 86 classes'],
  ['Hygiène & soins', 92, '79 / 86 classes'],
  ['Sortie & départ', 94, '81 / 86 classes'],
] as const

const fallbackTasks = [
  { title: 'Vérifier présence classe MS-A', site: 'Casablanca Oasis', priority: 'Haute', due: '10:00', tone: 'rose' as Tone },
  { title: 'Suivi incident enfant', site: 'Rabat Académie', priority: 'Critique', due: '10:15', tone: 'rose' as Tone },
  { title: 'Renfort éducatrice PS-B', site: 'Kénitra Centre', priority: 'Haute', due: '10:30', tone: 'orange' as Tone },
  { title: 'Contrôle hygiène cuisine', site: 'Marrakech Palmeraie', priority: 'Moyenne', due: '11:00', tone: 'amber' as Tone },
  { title: 'Clôture circuit transport 2', site: 'Fès Atlas', priority: 'Haute', due: '11:15', tone: 'rose' as Tone },
]

const fallbackActivities = [
  { icon: AlertTriangle, title: 'Incident déclaré — Enfant fièvre 39°', detail: 'Rabat Académie · PS-A', time: 'Il y a 12 min', tone: 'rose' as Tone },
  { icon: ClipboardCheck, title: 'Routine repas complétée', detail: 'Kénitra Centre · MS-B', time: 'Il y a 18 min', tone: 'emerald' as Tone },
  { icon: UserPlus, title: 'Tâche assignée — Renfort éducatrice', detail: 'Marrakech Palmeraie · GS-A', time: 'Il y a 22 min', tone: 'orange' as Tone },
  { icon: Truck, title: 'Circuit transport 1 — Retard 15 min', detail: 'Casablanca Oasis', time: 'Il y a 28 min', tone: 'rose' as Tone },
  { icon: ShieldCheck, title: 'Contrôle hygiène validé', detail: 'Fès Atlas · Cuisine', time: 'Il y a 35 min', tone: 'emerald' as Tone },
]

const fallbackIncidentCategories = [
  ['Santé & sécurité', 9, 32, 'blue'],
  ['Hygiène', 6, 21, 'rose'],
  ['Comportement', 5, 18, 'cyan'],
  ['Transport', 4, 14, 'slate'],
  ['Repas & nutrition', 2, 7, 'orange'],
  ['Autres', 2, 7, 'slate'],
] as const

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function normalizeSection(value?: string): OperationsSectionKey {
  const normalized = (value || 'aujourdhui').trim().toLowerCase()
  return operationsSections.some((section) => section.key === normalized) ? normalized as OperationsSectionKey : 'aujourdhui'
}

function numberFrom(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.,-]/g, '').replace(',', '.'))
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function textFrom(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function toneClasses(tone: Tone, variant: 'badge' | 'soft' | 'solid' | 'border' | 'dot' = 'badge') {
  const map: Record<Tone, Record<'badge' | 'soft' | 'solid' | 'border' | 'dot', string>> = {
    blue: { badge: 'border-blue-200 bg-blue-50 text-blue-800', soft: 'bg-blue-50 text-blue-800', solid: 'bg-blue-600 text-white', border: 'border-blue-200', dot: 'bg-blue-500' },
    emerald: { badge: 'border-emerald-200 bg-emerald-50 text-emerald-800', soft: 'bg-emerald-50 text-emerald-800', solid: 'bg-emerald-600 text-white', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    amber: { badge: 'border-amber-200 bg-amber-50 text-amber-800', soft: 'bg-amber-50 text-amber-800', solid: 'bg-amber-500 text-white', border: 'border-amber-200', dot: 'bg-amber-500' },
    rose: { badge: 'border-rose-200 bg-rose-50 text-rose-800', soft: 'bg-rose-50 text-rose-800', solid: 'bg-rose-600 text-white', border: 'border-rose-200', dot: 'bg-rose-500' },
    orange: { badge: 'border-orange-200 bg-orange-50 text-orange-800', soft: 'bg-orange-50 text-orange-800', solid: 'bg-orange-500 text-white', border: 'border-orange-200', dot: 'bg-orange-500' },
    slate: { badge: 'border-slate-200 bg-slate-50 text-slate-700', soft: 'bg-slate-50 text-slate-700', solid: 'bg-slate-800 text-white', border: 'border-slate-200', dot: 'bg-slate-400' },
    violet: { badge: 'border-violet-200 bg-violet-50 text-violet-800', soft: 'bg-violet-50 text-violet-800', solid: 'bg-violet-600 text-white', border: 'border-violet-200', dot: 'bg-violet-500' },
    cyan: { badge: 'border-cyan-200 bg-cyan-50 text-cyan-800', soft: 'bg-cyan-50 text-cyan-800', solid: 'bg-cyan-600 text-white', border: 'border-cyan-200', dot: 'bg-cyan-500' },
  }
  return map[tone][variant]
}

function prettyTime(value?: string) {
  if (!value) return 'live'
  try {
    return new Intl.DateTimeFormat('fr-MA', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  } catch {
    return 'live'
  }
}

function prettyDate(value: string) {
  try {
    return new Intl.DateTimeFormat('fr-MA', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(`${value}T10:00:00`))
  } catch {
    return value
  }
}

function Badge({ children, tone = 'slate', className = '' }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return <span className={cx('inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.13em]', toneClasses(tone), className)}>{children}</span>
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={cx('rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]', className)}>{children}</div>
}

function SectionTitle({ title, action }: { title: string; action?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-base font-black text-slate-950">{title}</h3>
      {action ? <button type="button" className="text-[12px] font-black text-blue-700 hover:text-blue-900">{action} →</button> : null}
    </div>
  )
}

function Sparkline({ values = [18, 20, 19, 22, 24, 21, 26, 29, 31] }: { values?: number[] }) {
  const points = values.map((v, index) => `${(index / Math.max(values.length - 1, 1)) * 100},${36 - Math.max(3, Math.min(33, v))}`).join(' ')
  return (
    <svg viewBox="0 0 100 40" className="h-10 w-full overflow-visible" aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500" />
    </svg>
  )
}

function CircleProgress({ value, tone = 'emerald', label = 'occupation' }: { value: number; tone?: Tone; label?: string }) {
  const safe = Math.max(0, Math.min(100, value))
  const dash = `${safe} ${100 - safe}`
  return (
    <div className="relative mx-auto h-24 w-24">
      <svg viewBox="0 0 42 42" className="h-24 w-24 rotate-[-90deg]">
        <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="currentColor" strokeWidth="3.2" className="text-slate-100" />
        <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="currentColor" strokeWidth="3.2" strokeDasharray={dash} strokeLinecap="round" className={cx(tone === 'rose' ? 'text-rose-500' : tone === 'amber' || tone === 'orange' ? 'text-orange-500' : tone === 'blue' ? 'text-blue-500' : 'text-emerald-500')} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-black tracking-[-0.04em] text-slate-950">{safe}%</span>
        <span className="text-[9px] font-black uppercase tracking-[0.08em] text-emerald-700">{label}</span>
      </div>
    </div>
  )
}

function ShellSidebar({ activeSection }: { activeSection: OperationsSectionKey }) {
  return (
    <aside className="sticky top-[86px] hidden h-[calc(100vh-86px)] w-[292px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white/96 px-5 py-6 shadow-[12px_0_48px_rgba(15,23,42,0.04)] xl:block">
      <Link href="/angelcare-360/customer/cockpit-direction" className="flex items-center gap-3">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-[1.2rem] border border-blue-100 bg-white shadow-sm">
          <span className="absolute h-9 w-9 rounded-full border-2 border-blue-400" />
          <span className="absolute h-9 w-1.5 rotate-45 rounded-full bg-orange-400" />
          <span className="absolute h-9 w-1.5 -rotate-45 rounded-full bg-cyan-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xl font-black tracking-[-0.04em] text-slate-950">AngelCare</p>
            <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-black text-orange-700">360</span>
          </div>
          <p className="text-[10px] font-bold text-slate-500">Grandir ensemble, chaque jour</p>
        </div>
      </Link>

      <div className="mt-8 space-y-1">
        {globalSidebar.map((item) => {
          const Icon = item.icon
          const active = item.active
          return (
            <div key={item.label}>
              <Link
                href={item.href}
                className={cx(
                  'group flex items-center justify-between gap-3 rounded-2xl px-3 py-3 text-sm font-black transition',
                  active ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-slate-50 hover:text-blue-800',
                )}
              >
                <span className="flex items-center gap-3">
                  <span className={cx('flex h-8 w-8 items-center justify-center rounded-xl border', active ? 'border-blue-200 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-500 group-hover:border-blue-200 group-hover:text-blue-700')}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {item.label}
                </span>
                {item.children ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 opacity-40" />}
              </Link>
              {item.children ? (
                <div className="ml-12 mt-2 space-y-1 border-l border-slate-200 pl-3">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon
                    const childActive = child.key === activeSection
                    return (
                      <Link
                        key={child.key}
                        href={child.href}
                        className={cx(
                          'flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-black transition',
                          childActive ? 'bg-blue-50 text-blue-800 ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700',
                        )}
                      >
                        <ChildIcon className="h-3.5 w-3.5" />
                        {child.label}
                      </Link>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">AngelCare</p>
        <p className="mt-2 text-sm font-black text-slate-950">Réseau National</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">Exercice 2025/2026</p>
      </div>
    </aside>
  )
}

function Topbar({ operationalDate, setOperationalDate, refreshing, onRefresh, onOpenDay }: { operationalDate: string; setOperationalDate: (date: string) => void; refreshing: boolean; onRefresh: () => void; onOpenDay: () => void }) {
  return (
    <div className="sticky top-[86px] z-30 border-b border-slate-200 bg-white/92 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 xl:px-7">
        <div className="min-w-[260px]">
          <h1 className="text-3xl font-black tracking-[-0.06em] text-slate-950 md:text-4xl">Opérations & exécution quotidienne</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">Pilotez les sites, les classes, les routines, la présence, les incidents et les actions terrain en temps réel.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm">
            <CalendarDays className="h-4 w-4 text-slate-500" />
            <input type="date" value={operationalDate} onChange={(event) => setOperationalDate(event.target.value)} className="bg-transparent text-xs font-black outline-none" />
          </label>
          <button type="button" className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50">
            <Building2 className="h-4 w-4" /> Tous les sites (14)
          </button>
          <button type="button" onClick={onRefresh} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50">
            <RefreshCcw className={cx('h-4 w-4', refreshing && 'animate-spin')} /> {refreshing ? 'Sync…' : 'Rafraîchir'}
          </button>
          <button type="button" onClick={onOpenDay} className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-blue-100 hover:bg-blue-700">
            <DoorOpen className="h-4 w-4" /> Ouvrir la journée
          </button>
          <button type="button" className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
            <Bell className="h-5 w-5 text-slate-700" />
            <span className="absolute right-0 top-0 rounded-full bg-rose-600 px-1.5 text-[10px] font-black text-white">18</span>
          </button>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-slate-800 to-slate-500" />
            <div>
              <p className="text-xs font-black text-slate-950">A. Ilyass</p>
              <p className="text-[11px] font-bold text-slate-500">Directeur Général</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiStrip({ dashboard }: { dashboard: DashboardPayload | null }) {
  const readiness = dashboard?.readiness || {}
  const summary = dashboard?.summary || {}
  const records = dashboard?.records || {}
  const sitesActive = numberFrom(readiness.activeSites ?? summary.sitesActive, fallbackSites.length)
  const classesActive = numberFrom(readiness.classesActive ?? summary.classesActive, 86)
  const classesTotal = Math.max(classesActive, numberFrom(summary.classesTotal, 92))
  const incidents = numberFrom(readiness.incidentsOpen ?? summary.incidentsOpen, Math.max(records.incidents?.length || 0, 28))
  const tasks = numberFrom(readiness.tasksOpen ?? summary.tasksOpen, Math.max(records.tasks?.length || 0, 37))
  const routinesRate = numberFrom(readiness.routineCompletionRate ?? summary.routineCompletionRate, 94.1)
  const kpis = [
    { label: 'Sites actifs', value: `${sitesActive} / 14`, detail: '100%', tone: 'blue' as Tone, spark: [20, 18, 21, 19, 24, 27, 31] },
    { label: 'Classes ouvertes', value: `${classesActive} / ${classesTotal}`, detail: '93,5%', tone: 'blue' as Tone, spark: [16, 17, 18, 22, 24, 27, 30] },
    { label: "Taux d’occupation", value: '91,2%', detail: '1 842 / 2 020', tone: 'orange' as Tone, spark: [23, 24, 26, 25, 28, 29, 31] },
    { label: 'Enfants présents', value: '1.842', detail: '+24 vs hier', tone: 'emerald' as Tone, spark: [12, 15, 22, 28, 30, 32, 34] },
    { label: 'Personnel présent', value: '186 / 204', detail: '91,2%', tone: 'emerald' as Tone, spark: [22, 23, 25, 28, 29, 30, 32] },
    { label: 'Routines complétées', value: `${routinesRate.toFixed(1)}%`, detail: '+3,6% vs hier', tone: 'emerald' as Tone, spark: [18, 22, 21, 25, 28, 31, 33] },
    { label: 'Incidents ouverts', value: String(incidents), detail: '7 critiques', tone: 'rose' as Tone, spark: [28, 25, 30, 34, 36, 33, 38] },
    { label: 'Transport en retard', value: '4', detail: '2 circuits', tone: 'orange' as Tone, spark: [12, 16, 14, 18, 17, 22, 20] },
    { label: 'Tâches en retard', value: String(tasks), detail: '18 critiques', tone: 'rose' as Tone, spark: [18, 21, 23, 24, 27, 31, 33] },
    { label: 'SLA opérationnel', value: '96,7%', detail: 'Très bien', tone: 'emerald' as Tone, spark: [22, 24, 25, 28, 30, 33, 36] },
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 2xl:grid-cols-10">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <p className="text-[11px] font-black text-slate-500">{kpi.label}</p>
          <p className={cx('mt-2 text-3xl font-black tracking-[-0.05em]', kpi.tone === 'rose' ? 'text-rose-700' : kpi.tone === 'orange' ? 'text-orange-600' : 'text-slate-950')}>{kpi.value}</p>
          <div className="mt-2 flex items-end gap-2">
            <p className="text-xs font-black text-slate-700">{kpi.detail}</p>
            <div className="min-w-0 flex-1"><Sparkline values={kpi.spark} /></div>
          </div>
        </div>
      ))}
      <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <p className="text-[11px] font-black text-slate-500">Clôture journée</p>
        <p className="mt-4 text-base font-black text-rose-700">Non finalisée</p>
        <button type="button" className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-blue-700">Voir détails</button>
      </div>
    </div>
  )
}

function Timeline() {
  const steps = [
    ['07:00', 'Ouverture', true],
    ['08:00', 'Accueil', true],
    ['09:00', 'Présence', true],
    ['10:00', 'Activités', true],
    ['12:00', 'Repas', false],
    ['14:00', 'Sieste', false],
    ['16:00', 'Goûter', false],
    ['17:00', 'Sortie', false],
    ['18:00', 'Clôture', false],
  ] as const
  return (
    <Card className="xl:col-span-2">
      <SectionTitle title="Timeline de la journée" />
      <div className="mt-7 overflow-x-auto pb-2">
        <div className="relative flex min-w-[760px] items-center justify-between gap-4">
          <div className="absolute left-8 right-8 top-[34px] h-1 rounded-full bg-slate-200" />
          <div className="absolute left-8 top-[34px] h-1 w-[36%] rounded-full bg-emerald-400" />
          {steps.map(([time, label, done]) => (
            <div key={time} className="relative z-10 flex min-w-[70px] flex-col items-center text-center">
              <div className={cx('flex h-14 w-14 items-center justify-center rounded-full border-4 bg-white shadow-sm', done ? 'border-emerald-200 text-emerald-600' : 'border-slate-200 text-slate-500')}>
                {done ? <CheckCircle2 className="h-6 w-6" /> : <Clock3 className="h-6 w-6" />}
              </div>
              <p className="mt-3 text-sm font-black text-slate-950">{time}</p>
              <p className="mt-1 text-xs font-semibold text-slate-600">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function PriorityAlerts({ dashboard, onOpenAction }: { dashboard: DashboardPayload | null; onOpenAction: (action: OperationsAction) => void }) {
  const records = dashboard?.records || {}
  const alerts = [
    { text: '7 classes sous tension capacité', tag: 'Action requise', tone: 'orange' as Tone, icon: AlertTriangle },
    { text: '4 circuits transport en retard', tag: 'Suivi en cours', tone: 'orange' as Tone, icon: Truck },
    { text: `${Math.max(3, records.incidents?.length || 3)} incidents critiques à traiter`, tag: 'Action immédiate', tone: 'rose' as Tone, icon: AlertTriangle },
    { text: `${Math.max(18, records.tasks?.length || 18)} tâches en retard`, tag: 'À réaffecter', tone: 'blue' as Tone, icon: ClipboardList },
  ]
  return (
    <Card>
      <SectionTitle title="Alertes prioritaires (18)" action="Voir tout" />
      <div className="mt-4 space-y-3">
        {alerts.map((alert, index) => {
          const Icon = alert.icon
          return (
            <button key={alert.text} type="button" onClick={() => onOpenAction(index === 2 ? actionCatalog[1] : actionCatalog[0])} className={cx('flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md', toneClasses(alert.tone, 'border'), toneClasses(alert.tone, 'soft'))}>
              <span className="flex items-center gap-2 text-sm font-black"><Icon className="h-4 w-4" /> {alert.text}</span>
              <span className="text-[11px] font-black">{alert.tag}</span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

function QuickActions({ onOpenAction }: { onOpenAction: (action: OperationsAction) => void }) {
  return (
    <Card>
      <SectionTitle title="Actions rapides" />
      <div className="mt-5 grid grid-cols-2 gap-3">
        {actionCatalog.slice(0, 6).map((action) => {
          const Icon = action.icon
          return (
            <button key={action.id} type="button" onClick={() => onOpenAction(action)} className="group rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50 hover:shadow-lg">
              <span className={cx('mx-auto flex h-11 w-11 items-center justify-center rounded-2xl', toneClasses(action.tone, 'soft'))}><Icon className="h-5 w-5" /></span>
              <span className="mt-3 block text-xs font-black text-slate-950">{action.label}</span>
            </button>
          )
        })}
      </div>
      <button type="button" onClick={() => onOpenAction(actionCatalog[6])} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 hover:bg-blue-700">
        <Download className="h-4 w-4" /> Exporter rapport opérations
      </button>
    </Card>
  )
}

function SiteCards({ dashboard }: { dashboard: DashboardPayload | null }) {
  const dbSites = dashboard?.records?.sites || []
  const sites = dbSites.length
    ? dbSites.slice(0, 6).map((site: any, index: number) => ({
      site_name: textFrom(site.site_name, `Site ${index + 1}`),
      city: textFrom(site.city, 'Maroc'),
      occupancy_rate: numberFrom(site.occupancy_rate ?? site.metadata_json?.occupancy_rate, [92, 89, 93, 88, 90][index] || 91),
      classes_open: numberFrom(site.classes_open ?? site.metadata_json?.classes_open, [12, 10, 8, 7, 9][index] || 8),
      classes_total: numberFrom(site.classes_total ?? site.metadata_json?.classes_total, [13, 11, 8, 8, 10][index] || 10),
      incidents: numberFrom(site.incidents ?? site.metadata_json?.incidents, [2, 2, 1, 3, 2][index] || 1),
      late_tasks: numberFrom(site.late_tasks ?? site.metadata_json?.late_tasks, [5, 7, 3, 6, 4][index] || 3),
      tone: (index === 3 ? 'rose' : index === 1 || index === 4 ? 'blue' : 'emerald') as Tone,
    }))
    : fallbackSites
  return (
    <Card className="xl:col-span-3">
      <SectionTitle title="État par site" action="Voir tous les sites" />
      <div className="mt-5 grid gap-4 sm:grid-cols-2 2xl:grid-cols-5">
        {sites.map((site) => (
          <div key={site.site_name} className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-black text-slate-950">{site.site_name}</p>
                <p className="text-xs font-semibold text-slate-500">{site.city}</p>
              </div>
              <span className={cx('flex h-9 w-9 items-center justify-center rounded-2xl', toneClasses(site.tone, 'soft'))}><MapPin className="h-4 w-4" /></span>
            </div>
            <div className="mt-3"><CircleProgress value={site.occupancy_rate} tone={site.tone} /></div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div><p className="text-xl font-black text-slate-950">{site.classes_open}<span className="text-xs text-slate-500">/{site.classes_total}</span></p><p className="text-[9px] font-black uppercase text-emerald-600">Classes ouvertes</p></div>
              <div><p className="text-xl font-black text-slate-950">{site.incidents}</p><p className="text-[9px] font-black uppercase text-rose-600">Incidents</p></div>
              <div><p className="text-xl font-black text-slate-950">{site.late_tasks}</p><p className="text-[9px] font-black uppercase text-orange-600">Tâches en retard</p></div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function RoutinesPanel() {
  return (
    <Card>
      <SectionTitle title="Routines clés – Taux de réalisation" action="Voir toutes les routines" />
      <div className="mt-5 space-y-4">
        {fallbackRoutines.map(([label, pct, detail]) => (
          <div key={label} className="grid grid-cols-[1fr_1.6fr_auto_auto] items-center gap-3">
            <p className="text-sm font-black text-slate-700">{label}</p>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={cx('h-full rounded-full', pct >= 94 ? 'bg-emerald-500' : pct >= 92 ? 'bg-emerald-400' : 'bg-orange-400')} style={{ width: `${pct}%` }} /></div>
            <p className={cx('text-sm font-black', pct < 93 ? 'text-orange-600' : 'text-slate-900')}>{pct}%</p>
            <p className="text-xs font-semibold text-slate-500">{detail}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

function PresencePanel() {
  return (
    <Card>
      <SectionTitle title="Présence du jour" action="Voir tout" />
      <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1fr]">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-emerald-50 p-3"><p className="text-xs font-black text-emerald-800">Présents</p><p className="mt-1 text-2xl font-black text-emerald-700">1.842</p></div>
          <div className="rounded-2xl bg-rose-50 p-3"><p className="text-xs font-black text-rose-800">Absents</p><p className="mt-1 text-2xl font-black text-rose-700">178</p></div>
          <div className="rounded-2xl bg-blue-50 p-3"><p className="text-xs font-black text-blue-800">Taux</p><p className="mt-1 text-2xl font-black text-blue-800">91,2%</p></div>
        </div>
        <div className="rounded-2xl bg-gradient-to-b from-blue-50 to-white p-4">
          <svg viewBox="0 0 400 110" className="h-28 w-full">
            <path d="M0 95 C45 82 50 62 92 50 S160 42 200 36 S300 28 400 18" fill="none" stroke="currentColor" strokeWidth="4" className="text-blue-500" />
            <path d="M0 110 L0 95 C45 82 50 62 92 50 S160 42 200 36 S300 28 400 18 L400 110 Z" fill="currentColor" className="text-blue-100" />
          </svg>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
        <div><p className="text-xs font-black text-slate-500">Personnel présent</p><p className="text-xl font-black text-emerald-700">186</p></div>
        <div><p className="text-xs font-black text-slate-500">Absents</p><p className="text-xl font-black text-rose-700">18</p></div>
        <div><p className="text-xs font-black text-slate-500">Taux présence</p><p className="text-xl font-black text-slate-950">91,2%</p></div>
      </div>
    </Card>
  )
}

function IncidentsPanel({ dashboard }: { dashboard: DashboardPayload | null }) {
  const total = Math.max(28, dashboard?.records?.incidents?.length || 0)
  return (
    <Card>
      <SectionTitle title="Incidents ouverts par catégorie" action="Voir tout" />
      <div className="mt-5 grid items-center gap-5 md:grid-cols-[0.9fr_1fr]">
        <div className="relative mx-auto flex h-44 w-44 items-center justify-center rounded-full bg-[conic-gradient(#60a5fa_0_32%,#f87171_32%_53%,#bae6fd_53%_71%,#cbd5e1_71%_85%,#fb923c_85%_92%,#e2e8f0_92%_100%)]">
          <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-center shadow-inner"><span className="text-4xl font-black text-slate-950">{total}</span><span className="text-xs font-black text-slate-500">Total</span></div>
        </div>
        <div className="space-y-3">
          {fallbackIncidentCategories.map(([label, count, pct, tone]) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-bold text-slate-700"><span className={cx('h-2.5 w-2.5 rounded-full', toneClasses(tone as Tone, 'dot'))} /> {label}</span>
              <span className="text-sm font-black text-slate-950">{count} ({pct}%)</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function TasksPanel() {
  return (
    <Card>
      <SectionTitle title="Tâches en cours" action="Voir tout" />
      <div className="mt-5 space-y-3">
        {fallbackTasks.map((task) => (
          <label key={task.title} className="flex items-center gap-3 rounded-2xl border border-transparent p-2 transition hover:border-blue-100 hover:bg-blue-50/50">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-black text-slate-950">{task.title}</span><span className="block truncate text-xs font-semibold text-slate-500">{task.site}</span></span>
            <Badge tone={task.tone}>{task.priority}</Badge>
            <span className="text-xs font-black text-slate-500">{task.due}</span>
          </label>
        ))}
      </div>
    </Card>
  )
}

function ActivityFeed() {
  return (
    <Card className="xl:col-span-3">
      <SectionTitle title="Dernières activités" />
      <div className="mt-4 grid gap-3 lg:grid-cols-5">
        {fallbackActivities.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex gap-3">
                <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', toneClasses(item.tone, 'soft'))}><Icon className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-slate-950">{item.title}</p>
                  <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">{item.detail}</p>
                  <p className="mt-1 text-[10px] font-black text-slate-400">{item.time}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function ClosurePanel({ onOpenAction }: { onOpenAction: (action: OperationsAction) => void }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionTitle title="Clôture de journée" />
          <p className="mt-3 text-sm font-semibold text-slate-500">La journée n’est pas encore clôturée.</p>
          <p className="mt-2 text-sm font-black text-slate-700">Routines validées : <span className="text-emerald-700">94,1%</span></p>
        </div>
        <ClipboardCheck className="h-12 w-12 text-emerald-500" />
      </div>
      <button type="button" onClick={() => onOpenAction(actionCatalog[5])} className="mt-5 w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 hover:bg-blue-700">Préparer la clôture</button>
    </Card>
  )
}

function StandardSectionWorkspace({ activeSection, dashboard, onOpenAction }: { activeSection: OperationsSectionKey; dashboard: DashboardPayload | null; onOpenAction: (action: OperationsAction) => void }) {
  const meta = operationsSections.find((section) => section.key === activeSection) || operationsSections[1]
  const sectionActions = {
    'vue-reseau': [actionCatalog[6], actionCatalog[2], actionCatalog[0]],
    aujourdhui: [actionCatalog[0], actionCatalog[1], actionCatalog[5]],
    sites: [actionCatalog[0], { ...actionCatalog[0], id: 'site-upsert', label: 'Créer / mettre à jour site', modalType: 'site' as OperationsModalType, operation: 'site.upsert', submitLabel: 'Enregistrer site', icon: Building2, tone: 'blue' as Tone, detail: 'Dossier site avec capacité, responsable et règles.' }, actionCatalog[6]],
    'classes-capacite': [{ ...actionCatalog[0], id: 'capacity-snapshot', label: 'Snapshot capacité', modalType: 'capacity' as OperationsModalType, operation: 'capacity.snapshot', submitLabel: 'Enregistrer capacité', icon: Gauge, tone: 'orange' as Tone, detail: 'Présence, attendu, staff et pression.' }, actionCatalog[3], actionCatalog[6]],
    presence: [actionCatalog[0], actionCatalog[3], actionCatalog[6]],
    'routines-ecole': [{ ...actionCatalog[0], id: 'routine-event', label: 'Planifier routine', modalType: 'routine' as OperationsModalType, operation: 'routine.event.create', submitLabel: 'Créer routine', icon: ClipboardCheck, tone: 'emerald' as Tone, detail: 'Routine école planifiée avec owner et preuve.' }, actionCatalog[0], actionCatalog[6]],
    'equipe-terrain': [actionCatalog[3], actionCatalog[0], actionCatalog[6]],
    incidents: [actionCatalog[1], actionCatalog[4], actionCatalog[6]],
    transport: [{ ...actionCatalog[0], id: 'transport-event', label: 'Créer événement transport', modalType: 'transport' as OperationsModalType, operation: 'transport.event.create', submitLabel: 'Enregistrer transport', icon: Truck, tone: 'orange' as Tone, detail: 'Circuit, retard, enfants et notification.' }, actionCatalog[4], actionCatalog[6]],
    'taches-operationnelles': [actionCatalog[0], actionCatalog[3], actionCatalog[6]],
    'qualite-terrain': [{ ...actionCatalog[2], id: 'quality-check', label: 'Contrôle qualité terrain', modalType: 'quality' as OperationsModalType, operation: 'quality.check.create', submitLabel: 'Enregistrer contrôle' }, actionCatalog[0], actionCatalog[6]],
    'cloture-journee': [actionCatalog[5], actionCatalog[6], actionCatalog[0]],
    rapports: [actionCatalog[6], actionCatalog[0], actionCatalog[2]],
    parametres: [actionCatalog[0], actionCatalog[2], actionCatalog[6]],
  } as Record<OperationsSectionKey, OperationsAction[]>

  return (
    <>
      <Card className="border-blue-100 bg-gradient-to-br from-white via-blue-50/50 to-white">
        <div className="grid gap-5 xl:grid-cols-[1fr_0.36fr]">
          <div>
            <Badge tone="blue">Operations workspace · {meta.label}</Badge>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-950 md:text-5xl">{meta.label}</h2>
            <p className="mt-3 max-w-4xl text-base font-semibold leading-7 text-slate-600">{meta.promise}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {sectionActions[activeSection].map((action) => {
                const Icon = action.icon
                return <button key={action.id} type="button" onClick={() => onOpenAction(action)} className={cx('flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-[0.13em] shadow-sm transition hover:-translate-y-0.5', action.tone === 'blue' ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-800 hover:border-blue-200 hover:bg-blue-50')}><Icon className="h-4 w-4" />{action.label}</button>
              })}
            </div>
          </div>
          <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Source-of-truth</p>
            <p className="mt-2 text-4xl font-black text-slate-950">{dashboard?.databaseReady ? 'Live' : 'Fallback'}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{dashboard?.databaseReady ? 'Tables AC360 Operations connectées.' : 'UI premium prête, migration/API à finaliser si setup requis.'}</p>
            <Badge tone={dashboard?.databaseReady ? 'emerald' : 'amber'} className="mt-3">{dashboard?.databaseReady ? 'DB prête' : 'Setup à vérifier'}</Badge>
          </div>
        </div>
      </Card>
      <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr_0.9fr]">
        <RoutinesPanel />
        <PresencePanel />
        <IncidentsPanel dashboard={dashboard} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <SectionTitle title={`Table opérationnelle · ${meta.label}`} action="Filtres avancés" />
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="flex min-w-[280px] flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2"><Search className="h-4 w-4 text-slate-400" /><input className="w-full bg-transparent text-sm font-semibold outline-none" placeholder="Rechercher site, classe, enfant, owner, preuve…" /></div>
            <button className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700"><Filter className="h-4 w-4" /> Filtrer</button>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            {fallbackTasks.map((task, index) => (
              <div key={task.title} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 border-b border-slate-100 bg-white p-4 last:border-b-0">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-xs font-black text-slate-500">{index + 1}</span>
                <div><p className="text-sm font-black text-slate-950">{task.title}</p><p className="text-xs font-semibold text-slate-500">{task.site} · preuve attendue · owner terrain</p></div>
                <Badge tone={task.tone}>{task.priority}</Badge>
                <button type="button" onClick={() => onOpenAction(actionCatalog[0])} className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-800">Agir</button>
              </div>
            ))}
          </div>
        </Card>
        <TasksPanel />
      </div>
    </>
  )
}

function MainTodayWorkspace({ dashboard, onOpenAction }: { dashboard: DashboardPayload | null; onOpenAction: (action: OperationsAction) => void }) {
  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[2fr_0.92fr_1.1fr]">
        <Timeline />
        <PriorityAlerts dashboard={dashboard} onOpenAction={onOpenAction} />
        <QuickActions onOpenAction={onOpenAction} />
      </div>
      <SiteCards dashboard={dashboard} />
      <div className="grid gap-5 xl:grid-cols-[1fr_1.05fr_1fr]">
        <RoutinesPanel />
        <PresencePanel />
        <IncidentsPanel dashboard={dashboard} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.85fr_0.95fr]">
        <ActivityFeed />
        <ClosurePanel onOpenAction={onOpenAction} />
      </div>
    </>
  )
}

function OperationsModal({ action, onClose, operationalDate, onSuccess }: { action: OperationsAction | null; onClose: () => void; operationalDate: string; onSuccess: (payload?: any) => void }) {
  const [form, setForm] = useState<Record<string, string>>({})
  const [execution, setExecution] = useState<ExecutionState>({ status: 'idle' })

  useEffect(() => {
    if (!action) return
    setExecution({ status: 'idle' })
    const defaults: Record<OperationsModalType, Record<string, string>> = {
      field_action: { title: 'Vérifier présence classe MS-A', priority: 'high', ownerLabel: 'Responsable opérations', dueAt: `${operationalDate}T16:00`, notes: 'Action terrain à exécuter avec preuve.' },
      incident: { title: 'Incident opérationnel', category: 'safety', severity: 'medium', childLabel: '', ownerLabel: 'Direction site', notes: 'Décrire les faits, l’action immédiate et le besoin de notification.' },
      control: { title: 'Contrôle terrain hygiène', category: 'field_quality', score: '92', nonConformities: '0', ownerLabel: 'Qualité terrain', notes: 'Contrôle programmé depuis Operations.' },
      reinforcement: { roleLabel: 'Éducatrices', staffExpected: '12', staffPresent: '10', replacementsNeeded: '2', ownerLabel: 'Responsable site', notes: 'Renfort nécessaire pour maintenir ratio.' },
      parent_notice: { title: 'Notification parents à préparer', priority: 'high', ownerLabel: 'Communication école', notes: 'Préparer notification parent validée par direction.' },
      closure: { title: 'Clôture opérationnelle journée', summary: 'Présence, routines, incidents et transport revus.', criticalTasksClosed: 'false', notes: 'Clôture préparée par Operations.' },
      report: { title: 'Rapport opérations quotidien A4', priority: 'normal', ownerLabel: 'Direction opérations', notes: 'Rapport A4 opérations demandé depuis le cockpit.' },
      site: { siteName: 'Nouveau site opérationnel', city: 'Rabat', responsibleLabel: 'Responsable site', capacityChildren: '120', status: 'active', notes: 'Site créé depuis Operations.' },
      capacity: { title: 'Snapshot capacité classe', childrenExpected: '24', childrenPresent: '22', staffExpected: '3', staffPresent: '3', status: 'normal', notes: 'Snapshot capacité live.' },
      routine: { title: 'Routine école', category: 'routine', ownerLabel: 'Équipe terrain', scheduledAt: `${operationalDate}T10:00`, notes: 'Routine planifiée depuis Operations.' },
      transport: { title: 'Circuit transport', eventType: 'delay', delayMinutes: '15', childrenCount: '12', driverLabel: 'Chauffeur', status: 'open', notes: 'Événement transport créé depuis Operations.' },
      quality: { title: 'Contrôle qualité terrain', category: 'field_quality', score: '90', nonConformities: '1', ownerLabel: 'Qualité terrain', notes: 'Contrôle avec plan d’action si nécessaire.' },
    }
    setForm(defaults[action.modalType])
  }, [action, operationalDate])

  if (!action) return null
  const Icon = action.icon
  const setValue = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }))

  const field = (key: string, label: string, options?: { type?: string; textarea?: boolean; placeholder?: string }) => (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      {options?.textarea ? (
        <textarea value={form[key] || ''} onChange={(event) => setValue(key, event.target.value)} rows={4} placeholder={options.placeholder} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
      ) : (
        <input type={options?.type || 'text'} value={form[key] || ''} onChange={(event) => setValue(key, event.target.value)} placeholder={options?.placeholder} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
      )}
    </label>
  )

  async function execute() {
    const currentAction = action
    if (!currentAction) return
    setExecution({ status: 'running', message: 'Pré-vol droits, plan, usage et source-of-truth…' })
    const payloadByType: Record<OperationsModalType, any> = {
      field_action: { title: form.title, operation: currentAction.operation, category: 'operational', priority: form.priority || 'normal', ownerLabel: form.ownerLabel, dueAt: form.dueAt || null, operationalDate, notes: form.notes, payload: { proofRequired: true, sourceWorkspace: 'operations' } },
      incident: { title: form.title, operation: currentAction.operation, category: form.category || 'safety', severity: form.severity || 'medium', status: 'open', ownerLabel: form.ownerLabel, operationalDate, notes: form.notes, payload: { childLabel: form.childLabel, immediateAction: form.immediateAction, parentNotificationRequired: true, escalatedToDirection: form.severity === 'critical' } },
      control: { title: form.title, operation: currentAction.operation, category: form.category || 'field_quality', status: 'planned', ownerLabel: form.ownerLabel, operationalDate, notes: form.notes, payload: { score: Number(form.score || 0), nonConformities: Number(form.nonConformities || 0), actionPlanRequired: Number(form.nonConformities || 0) > 0 } },
      reinforcement: { title: 'Couverture staff', operation: currentAction.operation, status: Number(form.staffPresent || 0) < Number(form.staffExpected || 0) ? 'under_covered' : 'normal', ownerLabel: form.ownerLabel, operationalDate, notes: form.notes, payload: { roleLabel: form.roleLabel, staffExpected: Number(form.staffExpected || 0), staffPresent: Number(form.staffPresent || 0), replacementsNeeded: Number(form.replacementsNeeded || 0) } },
      parent_notice: { title: form.title, operation: currentAction.operation, category: 'communication', priority: form.priority || 'high', ownerLabel: form.ownerLabel, operationalDate, notes: form.notes, payload: { sourceEntityType: 'parent_notice', proofRequired: true } },
      closure: { title: form.title, operation: currentAction.operation, status: 'closed', operationalDate, notes: form.notes || form.summary, payload: { summary: form.summary, presenceValidated: true, incidentsReviewed: true, routinesCompleted: true, transportClosed: true, criticalTasksClosed: form.criticalTasksClosed === 'true' } },
      report: { title: form.title, operation: currentAction.operation, category: 'reporting', priority: form.priority || 'normal', ownerLabel: form.ownerLabel, operationalDate, notes: form.notes, payload: { reportType: 'daily_operations_a4', sourceWorkspace: 'operations' } },
      site: { title: form.siteName, operation: currentAction.operation, status: form.status || 'active', responsibleLabel: form.responsibleLabel, operationalDate, notes: form.notes, payload: { siteName: form.siteName, city: form.city, responsibleLabel: form.responsibleLabel, capacityChildren: Number(form.capacityChildren || 0) } },
      capacity: { title: form.title, operation: currentAction.operation, status: form.status || 'normal', operationalDate, notes: form.notes, payload: { childrenExpected: Number(form.childrenExpected || 0), childrenPresent: Number(form.childrenPresent || 0), staffExpected: Number(form.staffExpected || 0), staffPresent: Number(form.staffPresent || 0) } },
      routine: { title: form.title, operation: currentAction.operation, category: form.category || 'routine', ownerLabel: form.ownerLabel, operationalDate, notes: form.notes, payload: { scheduledAt: form.scheduledAt } },
      transport: { title: form.title, operation: currentAction.operation, category: form.eventType || 'delay', status: form.status || 'open', operationalDate, notes: form.notes, payload: { routeLabel: form.title, eventType: form.eventType, delayMinutes: Number(form.delayMinutes || 0), childrenCount: Number(form.childrenCount || 0), driverLabel: form.driverLabel, parentNotificationRequired: true } },
      quality: { title: form.title, operation: currentAction.operation, category: form.category || 'field_quality', status: 'planned', ownerLabel: form.ownerLabel, operationalDate, notes: form.notes, payload: { score: Number(form.score || 0), nonConformities: Number(form.nonConformities || 0), actionPlanRequired: Number(form.nonConformities || 0) > 0 } },
    }
    try {
      const response = await fetch('/api/ac360/customer/operations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadByType[currentAction.modalType]) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || data?.ok === false) {
        setExecution({ status: data?.setupRequired ? 'blocked' : 'error', message: data?.error || 'Action non exécutée.', proofReference: data?.proofReference })
        return
      }
      setExecution({ status: 'success', message: 'Action enregistrée avec preuve opérationnelle.', proofReference: data?.proofReference || data?.result?.proof_reference })
      onSuccess(data)
    } catch (error: any) {
      setExecution({ status: 'error', message: error?.message || 'Erreur réseau pendant l’action.' })
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_40px_120px_rgba(15,23,42,0.28)]">
        <div className={cx('border-b p-5', toneClasses(action.tone, 'border'), toneClasses(action.tone, 'soft'))}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4">
              <span className={cx('flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm', toneClasses(action.tone, 'solid'))}><Icon className="h-6 w-6" /></span>
              <div>
                <Badge tone={action.tone}>Modal métier distinct · {action.operation}</Badge>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">{action.label}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-600">{action.detail}</p>
              </div>
            </div>
            <button onClick={onClose} type="button" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><X className="h-5 w-5" /></button>
          </div>
        </div>
        <div className="grid max-h-[calc(92vh-96px)] overflow-y-auto lg:grid-cols-[1fr_0.42fr]">
          <div className="p-6">
            {action.modalType === 'incident' ? (
              <div className="grid gap-4 md:grid-cols-2">
                {field('title', 'Titre incident')}{field('childLabel', 'Enfant / classe concerné')}{field('severity', 'Sévérité')}{field('ownerLabel', 'Responsable')}{field('immediateAction', 'Action immédiate')}{field('notes', 'Description', { textarea: true })}
              </div>
            ) : action.modalType === 'reinforcement' ? (
              <div className="grid gap-4 md:grid-cols-2">
                {field('roleLabel', 'Rôle terrain')}{field('ownerLabel', 'Responsable')}{field('staffExpected', 'Staff attendu', { type: 'number' })}{field('staffPresent', 'Staff présent', { type: 'number' })}{field('replacementsNeeded', 'Renforts nécessaires', { type: 'number' })}{field('notes', 'Consignes renfort', { textarea: true })}
              </div>
            ) : action.modalType === 'closure' ? (
              <div className="space-y-5">
                {field('summary', 'Synthèse direction', { textarea: true })}
                <div className="grid gap-3 md:grid-cols-2">
                  {['Présence validée', 'Incidents revus', 'Routines complétées', 'Transport clôturé'].map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-800"><Check className="h-5 w-5" /> {item}</div>)}
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-black text-slate-700"><input type="checkbox" checked={form.criticalTasksClosed === 'true'} onChange={(event) => setValue('criticalTasksClosed', event.target.checked ? 'true' : 'false')} /> Tâches critiques clôturées</label>
                </div>
              </div>
            ) : action.modalType === 'site' ? (
              <div className="grid gap-4 md:grid-cols-2">{field('siteName', 'Nom site')}{field('city', 'Ville')}{field('responsibleLabel', 'Responsable')}{field('capacityChildren', 'Capacité enfants', { type: 'number' })}{field('status', 'Statut')}{field('notes', 'Règles / notes', { textarea: true })}</div>
            ) : action.modalType === 'capacity' ? (
              <div className="grid gap-4 md:grid-cols-2">{field('title', 'Libellé snapshot')}{field('status', 'Statut pression')}{field('childrenExpected', 'Enfants attendus', { type: 'number' })}{field('childrenPresent', 'Enfants présents', { type: 'number' })}{field('staffExpected', 'Staff attendu', { type: 'number' })}{field('staffPresent', 'Staff présent', { type: 'number' })}{field('notes', 'Notes capacité', { textarea: true })}</div>
            ) : action.modalType === 'transport' ? (
              <div className="grid gap-4 md:grid-cols-2">{field('title', 'Circuit')}{field('eventType', 'Type événement')}{field('delayMinutes', 'Retard minutes', { type: 'number' })}{field('childrenCount', 'Enfants concernés', { type: 'number' })}{field('driverLabel', 'Chauffeur')}{field('notes', 'Notes transport', { textarea: true })}</div>
            ) : action.modalType === 'routine' ? (
              <div className="grid gap-4 md:grid-cols-2">{field('title', 'Routine')}{field('category', 'Catégorie')}{field('ownerLabel', 'Responsable')}{field('scheduledAt', 'Horaire prévu', { type: 'datetime-local' })}{field('notes', 'Instructions routine', { textarea: true })}</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {field('title', 'Titre')}{field('ownerLabel', 'Responsable')}{field('priority', 'Priorité')}{field('dueAt', 'Échéance', { type: 'datetime-local' })}{field('score', 'Score / mesure', { type: 'number' })}{field('nonConformities', 'Non-conformités', { type: 'number' })}{field('notes', 'Notes opérationnelles', { textarea: true })}
              </div>
            )}
            {execution.status !== 'idle' ? (
              <div className={cx('mt-5 rounded-2xl border p-4 text-sm font-black', execution.status === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : execution.status === 'blocked' ? 'border-amber-200 bg-amber-50 text-amber-800' : execution.status === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-blue-200 bg-blue-50 text-blue-800')}>
                {execution.message}{execution.proofReference ? <span className="block mt-1">Preuve : {execution.proofReference}</span> : null}
              </div>
            ) : null}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-700 hover:bg-slate-50">Annuler</button>
              <button type="button" onClick={execute} disabled={execution.status === 'running'} className="rounded-2xl bg-blue-600 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-60">{execution.status === 'running' ? 'Exécution…' : action.submitLabel}</button>
            </div>
          </div>
          <aside className="border-l border-slate-200 bg-slate-50 p-6">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Gouvernance AC360</p>
            <div className="mt-4 space-y-3">
              {['Plan, rôle et restrictions vérifiés avant action', 'Usage et crédits enregistrés après succès', 'Journal audit source-of-truth Operations', 'Données préservées même si add-on annulé'].map((item) => <div key={item} className="rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold leading-5 text-slate-600">{item}</div>)}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export function Ac360OperationsWorkspace({ initialSection = 'aujourdhui', legacyAlias = false }: Props) {
  const [activeSection, setActiveSection] = useState<OperationsSectionKey>(() => normalizeSection(initialSection))
  const [operationalDate, setOperationalDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [activeAction, setActiveAction] = useState<OperationsAction | null>(null)
  const [lastSyncMessage, setLastSyncMessage] = useState('Initialisation Operations workspace')

  useEffect(() => setActiveSection(normalizeSection(initialSection)), [initialSection])

  async function loadDashboard() {
    setRefreshing(true)
    setLastSyncMessage('Synchronisation source-of-truth Operations…')
    try {
      const response = await fetch(`/api/ac360/customer/operations?view=${activeSection}&date=${operationalDate}`, { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))
      setDashboard(data)
      setLastSyncMessage(response.ok && data?.ok !== false ? `Source Operations chargée · ${prettyTime(data?.loadedAt)}` : data?.error || 'Fallback sécurisé actif')
    } catch (error: any) {
      setDashboard({ ok: false, databaseReady: false, setupRequired: true, error: error?.message || 'API Operations indisponible' })
      setLastSyncMessage('Fallback sécurisé actif · API non disponible')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, operationalDate])

  const activeMeta = useMemo(() => operationsSections.find((section) => section.key === activeSection) || operationsSections[1], [activeSection])

  return (
    <main data-ac360-operations-workspace className="min-h-screen bg-[#f8fbff] text-slate-950">
      <div className="flex min-h-screen">
        <ShellSidebar activeSection={activeSection} />
        <section className="min-w-0 flex-1">
          <Topbar operationalDate={operationalDate} setOperationalDate={setOperationalDate} refreshing={refreshing} onRefresh={loadDashboard} onOpenDay={() => setActiveAction({ ...actionCatalog[0], id: 'open-day', label: 'Ouvrir la journée', modalType: 'field_action', operation: 'day.open', submitLabel: 'Ouvrir la journée', icon: DoorOpen, tone: 'blue', detail: 'Ouverture opérationnelle avec preuve et audit.' })} />
          <div className="px-5 py-5 xl:px-7">
            {legacyAlias ? (
              <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-800">
                `/presence-operations` est maintenant raccordée au nouveau workspace Operations premium. Route cible recommandée : `/angelcare-360/customer/operations/aujourdhui`.
              </div>
            ) : null}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">{activeMeta.label} · {prettyDate(operationalDate)}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">{activeMeta.promise}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone={dashboard?.databaseReady ? 'emerald' : 'amber'}>{dashboard?.databaseReady ? 'Source-of-truth live' : 'Fallback sécurisé'}</Badge>
                <Badge tone="blue">{lastSyncMessage}</Badge>
              </div>
            </div>
            <KpiStrip dashboard={dashboard} />
            <div className="mt-5 space-y-5">
              {activeSection === 'aujourdhui' ? <MainTodayWorkspace dashboard={dashboard} onOpenAction={setActiveAction} /> : <StandardSectionWorkspace activeSection={activeSection} dashboard={dashboard} onOpenAction={setActiveAction} />}
            </div>
          </div>
        </section>
      </div>
      <OperationsModal action={activeAction} operationalDate={operationalDate} onClose={() => setActiveAction(null)} onSuccess={() => loadDashboard()} />
    </main>
  )
}
