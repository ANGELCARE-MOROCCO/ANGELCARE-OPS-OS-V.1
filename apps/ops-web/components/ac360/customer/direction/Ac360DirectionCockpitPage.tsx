
'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  admissionsMetrics,
  directionSidebar,
  directionViews,
  executiveMetrics,
  financeMetrics,
  hrMetrics,
  operationMetrics,
  parentMetrics,
  qualityMetrics,
  reportMetrics,
  resolveDirectionView,
  sitePerformanceRows,
  type DirectionMetric,
  type DirectionTableRow,
  type DirectionTone,
  type DirectionViewKey,
} from '@/lib/ac360/customer-direction-cockpit-model'
import {
  buildDirectionExecutionPayload,
  resolveDirectionActionDefinition,
  type DirectionActionDefinition,
  type DirectionActionField,
  type DirectionActionModalType,
} from '@/lib/ac360/customer-direction-action-map'
import { Ac360DirectionDistinctEnterpriseModal } from './Ac360DirectionDistinctEnterpriseModal'

type Props = {
  initialView?: string
}

type ActionDraft = {
  title: string
  module: string
  impact: string
  payload: Record<string, unknown>
  buttonId?: string
  modalType?: DirectionActionModalType
  operation?: string
  submitLabel?: string
} | null

type LiveDirectionDashboard = {
  ok?: boolean
  databaseReady?: boolean
  loadedAt?: string
  sellableReadiness?: {
    score?: number
    runtimeMode?: string
    commercialStatus?: string
    pendingDecisions?: number
    openActions?: number
    criticalRisks?: number
    reportsInPipeline?: number
    activeRestrictions?: number
    walletBalance?: number | null
    planLabel?: string
  }
  records?: {
    actions?: any[]
    decisions?: any[]
    risks?: any[]
    reports?: any[]
    exports?: any[]
    auditEvents?: any[]
  }
  errors?: Array<{ message?: string; code?: string }>
}

type ExecutionState = {
  status: 'idle' | 'running' | 'success' | 'blocked' | 'error'
  message?: string
  proofReference?: string
  result?: any
}

type DirectionCockpitLocalContext = {
  periodPreset: string
  compareWith: string
  customStart?: string
  customEnd?: string
  scopeMode: string
  city: string
  compareSites: boolean
  saveView: boolean
}

const defaultDirectionLocalContext: DirectionCockpitLocalContext = {
  periodPreset: 'Ce mois',
  compareWith: 'Mois précédent',
  scopeMode: 'Tous les sites',
  city: 'Tous',
  compareSites: true,
  saveView: false,
}

function isContextResolutionProblem(result: any) {
  const message = String(result?.error || result?.message || '')
  return result?.clientReason === 'account_setup_required' || result?.status === 401 || result?.status === 409 || /contexte|introuvable|context|organisation|compte/i.test(message)
}

function friendlyExecutionError(result: any, fallback: string) {
  if (isContextResolutionProblem(result)) {
    return 'Compte à finaliser : la liaison de votre établissement doit être terminée avant d’enregistrer cette action. La consultation du cockpit reste disponible, et les filtres de pilotage restent applicables.'
  }
  const raw = String(result?.error || fallback || 'Action non finalisée.')
  if (/sql|supabase|runtime|migration|fallback|ac360/i.test(raw)) {
    return 'Action non finalisée : certaines données du compte doivent être vérifiées avant enregistrement. La consultation du cockpit reste disponible.'
  }
  return raw
}

const toneStyles: Record<DirectionTone, { icon: string; text: string; soft: string; border: string; fill: string; line: string; chip: string }> = {
  blue: { icon: 'bg-blue-100 text-blue-700', text: 'text-blue-700', soft: 'bg-blue-50', border: 'border-blue-200', fill: 'bg-blue-600', line: '#2563eb', chip: 'border-blue-200 bg-blue-50 text-blue-800' },
  emerald: { icon: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-700', soft: 'bg-emerald-50', border: 'border-emerald-200', fill: 'bg-emerald-600', line: '#059669', chip: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  amber: { icon: 'bg-amber-100 text-amber-700', text: 'text-amber-700', soft: 'bg-amber-50', border: 'border-amber-200', fill: 'bg-amber-500', line: '#d97706', chip: 'border-amber-200 bg-amber-50 text-amber-800' },
  rose: { icon: 'bg-rose-100 text-rose-700', text: 'text-rose-700', soft: 'bg-rose-50', border: 'border-rose-200', fill: 'bg-rose-600', line: '#e11d48', chip: 'border-rose-200 bg-rose-50 text-rose-800' },
  violet: { icon: 'bg-violet-100 text-violet-700', text: 'text-violet-700', soft: 'bg-violet-50', border: 'border-violet-200', fill: 'bg-violet-600', line: '#7c3aed', chip: 'border-violet-200 bg-violet-50 text-violet-800' },
  cyan: { icon: 'bg-cyan-100 text-cyan-700', text: 'text-cyan-700', soft: 'bg-cyan-50', border: 'border-cyan-200', fill: 'bg-cyan-600', line: '#0891b2', chip: 'border-cyan-200 bg-cyan-50 text-cyan-800' },
  slate: { icon: 'bg-slate-100 text-slate-700', text: 'text-slate-700', soft: 'bg-slate-50', border: 'border-slate-200', fill: 'bg-slate-500', line: '#64748b', chip: 'border-slate-200 bg-slate-50 text-slate-700' },
  orange: { icon: 'bg-orange-100 text-orange-700', text: 'text-orange-700', soft: 'bg-orange-50', border: 'border-orange-200', fill: 'bg-orange-500', line: '#ea580c', chip: 'border-orange-200 bg-orange-50 text-orange-800' },
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}


type DirectionPremiumButtonVariant = 'primary' | 'secondary' | 'control' | 'micro' | 'modalPrimary' | 'modalSecondary' | 'mobile'

const premiumButtonBase = 'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-[1.05rem] text-center font-black transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55'

const premiumButtonVariants: Record<DirectionPremiumButtonVariant, string> = {
  primary: 'border border-blue-500/50 bg-[linear-gradient(135deg,#0b4dd8_0%,#1767f2_52%,#1d4ed8_100%)] px-5 py-3 text-[12px] text-white shadow-[0_16px_30px_rgba(37,99,235,0.28),inset_0_1px_0_rgba(255,255,255,0.35)] ring-1 ring-white/20 hover:-translate-y-0.5 hover:shadow-[0_22px_42px_rgba(37,99,235,0.38),inset_0_1px_0_rgba(255,255,255,0.42)]',
  secondary: 'border border-slate-200/90 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-3 text-[12px] text-slate-800 shadow-[0_12px_26px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-white/80 hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-800 hover:shadow-[0_18px_34px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,1)]',
  control: 'border border-slate-200/90 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-3 text-[12px] text-slate-800 shadow-[0_10px_24px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-white/80 hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-800 hover:shadow-[0_16px_30px_rgba(15,23,42,0.12)]',
  micro: 'rounded-full border border-blue-200/80 bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_100%)] px-3.5 py-2 text-[11px] text-blue-800 shadow-[0_8px_18px_rgba(37,99,235,0.10),inset_0_1px_0_rgba(255,255,255,0.9)] hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-900 hover:shadow-[0_12px_24px_rgba(37,99,235,0.16)]',
  modalPrimary: 'border border-blue-500/50 bg-[linear-gradient(135deg,#0b4dd8_0%,#1767f2_55%,#1d4ed8_100%)] px-5 py-3 text-[12px] text-white shadow-[0_18px_34px_rgba(37,99,235,0.30),inset_0_1px_0_rgba(255,255,255,0.35)] ring-1 ring-white/20 hover:-translate-y-0.5 hover:shadow-[0_24px_46px_rgba(37,99,235,0.40)]',
  modalSecondary: 'border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-3 text-[12px] text-slate-800 shadow-[0_12px_26px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950 hover:shadow-[0_18px_34px_rgba(15,23,42,0.13)]',
  mobile: 'rounded-2xl border border-blue-500/50 bg-[linear-gradient(135deg,#0b4dd8_0%,#1767f2_55%,#1d4ed8_100%)] px-4 py-3 text-[11px] text-white shadow-[0_14px_28px_rgba(37,99,235,0.28),inset_0_1px_0_rgba(255,255,255,0.35)] hover:-translate-y-0.5 hover:shadow-[0_20px_34px_rgba(37,99,235,0.38)]',
}

function premiumButtonClass(variant: DirectionPremiumButtonVariant = 'secondary', extra?: string) {
  return cx(premiumButtonBase, premiumButtonVariants[variant], extra)
}

function premiumToneButtonClass(tone: DirectionTone, extra?: string) {
  const toneClasses: Record<DirectionTone, string> = {
    blue: 'border-blue-300/80 bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_100%)] text-blue-800 shadow-[0_12px_26px_rgba(37,99,235,0.13),inset_0_1px_0_rgba(255,255,255,0.95)] hover:border-blue-400 hover:text-blue-900 hover:shadow-[0_18px_34px_rgba(37,99,235,0.20)]',
    emerald: 'border-emerald-300/80 bg-[linear-gradient(180deg,#ecfdf5_0%,#ffffff_100%)] text-emerald-800 shadow-[0_12px_26px_rgba(16,185,129,0.13),inset_0_1px_0_rgba(255,255,255,0.95)] hover:border-emerald-400 hover:text-emerald-900 hover:shadow-[0_18px_34px_rgba(16,185,129,0.20)]',
    amber: 'border-amber-300/80 bg-[linear-gradient(180deg,#fffbeb_0%,#ffffff_100%)] text-amber-800 shadow-[0_12px_26px_rgba(245,158,11,0.15),inset_0_1px_0_rgba(255,255,255,0.95)] hover:border-amber-400 hover:text-amber-900 hover:shadow-[0_18px_34px_rgba(245,158,11,0.22)]',
    rose: 'border-rose-300/80 bg-[linear-gradient(180deg,#fff1f2_0%,#ffffff_100%)] text-rose-800 shadow-[0_12px_26px_rgba(225,29,72,0.13),inset_0_1px_0_rgba(255,255,255,0.95)] hover:border-rose-400 hover:text-rose-900 hover:shadow-[0_18px_34px_rgba(225,29,72,0.20)]',
    violet: 'border-violet-300/80 bg-[linear-gradient(180deg,#f5f3ff_0%,#ffffff_100%)] text-violet-800 shadow-[0_12px_26px_rgba(124,58,237,0.13),inset_0_1px_0_rgba(255,255,255,0.95)] hover:border-violet-400 hover:text-violet-900 hover:shadow-[0_18px_34px_rgba(124,58,237,0.20)]',
    cyan: 'border-cyan-300/80 bg-[linear-gradient(180deg,#ecfeff_0%,#ffffff_100%)] text-cyan-800 shadow-[0_12px_26px_rgba(8,145,178,0.13),inset_0_1px_0_rgba(255,255,255,0.95)] hover:border-cyan-400 hover:text-cyan-900 hover:shadow-[0_18px_34px_rgba(8,145,178,0.20)]',
    slate: 'border-slate-300/90 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] text-slate-800 shadow-[0_12px_26px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.95)] hover:border-slate-400 hover:text-slate-950 hover:shadow-[0_18px_34px_rgba(15,23,42,0.14)]',
    orange: 'border-orange-300/80 bg-[linear-gradient(180deg,#fff7ed_0%,#ffffff_100%)] text-orange-800 shadow-[0_12px_26px_rgba(234,88,12,0.14),inset_0_1px_0_rgba(255,255,255,0.95)] hover:border-orange-400 hover:text-orange-900 hover:shadow-[0_18px_34px_rgba(234,88,12,0.21)]',
  }
  return cx('inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-[1.05rem] border px-4 py-3 text-[11px] font-black transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100', toneClasses[tone], extra)
}

function createDirectionDraft(input: {
  title: string
  module?: string
  impact?: string
  operation?: string
  source?: string
  priority?: string
  buttonId?: string
  modalType?: DirectionActionModalType
  payload?: Record<string, unknown>
}): NonNullable<ActionDraft> {
  const definition = resolveDirectionActionDefinition({
    buttonId: input.buttonId,
    modalType: input.modalType,
    operation: input.operation,
    title: input.title,
    module: input.module,
    payload: input.payload,
  })
  const operation = input.operation || definition.operation
  return {
    title: input.title || definition.label,
    module: input.module || definition.module || 'Cockpit de Direction',
    impact: input.impact || definition.purpose,
    operation,
    modalType: input.modalType || definition.modalType,
    buttonId: input.buttonId || definition.id,
    submitLabel: definition.submitLabel,
    payload: {
      operation,
      action: operation,
      source: input.source || 'cockpit_direction',
      priority: input.priority || definition.priority || 'normal',
      modalType: input.modalType || definition.modalType,
      buttonId: input.buttonId || definition.id,
      enterpriseActionMap: true,
      customerFacing: true,
      ...(input.payload || {}),
    },
  }
}

function openDirectionCommand(input: NonNullable<ActionDraft> | Parameters<typeof createDirectionDraft>[0]) {
  if (typeof window === 'undefined') return
  const draft = 'payload' in input && 'impact' in input ? input as NonNullable<ActionDraft> : createDirectionDraft(input as Parameters<typeof createDirectionDraft>[0])
  window.dispatchEvent(new CustomEvent('ac360:direction-command', { detail: draft }))
}

function Sparkline({ values, tone = 'blue' }: { values: number[]; tone?: DirectionTone }) {
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = Math.max(1, max - min)
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * 120
      const y = 36 - ((value - min) / range) * 30
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg viewBox="0 0 120 40" className="h-10 w-full overflow-visible" aria-hidden="true">
      <polyline points={points} fill="none" stroke={toneStyles[tone].line} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={cx('rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.04)]', className)}>{children}</section>
}

function CardHeader({ title, action, subtitle, command }: { title: string; action?: string; subtitle?: string; command?: Partial<NonNullable<ActionDraft>> & { operation?: string; priority?: string } }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-[14px] font-black tracking-[-0.01em] text-slate-950">{title}</h3>
        {subtitle ? <p className="mt-1 text-[11px] font-semibold text-slate-500">{subtitle}</p> : null}
      </div>
      {action ? (
        <button
          type="button"
          onClick={() => openDirectionCommand({
            title: command?.title || `${action} — ${title}`,
            module: command?.module || title,
            impact: command?.impact || 'Ouverture sécurisée avec preuve, suivi et prochaine action recommandée.',
            operation: command?.operation || 'direction_action.create',
            priority: command?.priority || 'normal',
            payload: { cardTitle: title, actionLabel: action, ...(command?.payload || {}) },
          })}
          className={premiumButtonClass('micro')}
        >
          {action}
        </button>
      ) : null}
    </div>
  )
}

function MetricCard({ metric }: { metric: DirectionMetric }) {
  const tone = toneStyles[metric.tone]
  return (
    <Card className="min-h-[124px] p-3.5">
      <div className="flex items-start gap-3">
        <div className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg font-black', tone.icon)}>▣</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-bold text-slate-500">{metric.label}</p>
          <p className="mt-1 text-[22px] font-black tracking-[-0.04em] text-slate-950">{metric.value}</p>
          <p className={cx('mt-1 text-[11px] font-black', tone.text)}>{metric.trend}</p>
        </div>
      </div>
      <div className="mt-2"><Sparkline values={metric.spark} tone={metric.tone} /></div>
    </Card>
  )
}

function MetricStrip({ metrics }: { metrics: DirectionMetric[] }) {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">{metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</div>
}

function StatusChip({ children, tone = 'blue' }: { children: React.ReactNode; tone?: DirectionTone }) {
  return <span className={cx('inline-flex rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.11em]', toneStyles[tone].chip)}>{children}</span>
}

function Progress({ value, tone = 'blue' }: { value: number; tone?: DirectionTone }) {
  return (
    <div className="h-2 rounded-full bg-slate-100">
      <div className={cx('h-full rounded-full', toneStyles[tone].fill)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

function Donut({ value, tone = 'blue', label }: { value: number; tone?: DirectionTone; label: string }) {
  const color = toneStyles[tone].line
  return (
    <div className="flex items-center gap-4">
      <div
        className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
        style={{ background: `conic-gradient(${color} 0 ${value}%, #e2e8f0 ${value}% 100%)` }}
      >
        <div className="flex h-[74px] w-[74px] flex-col items-center justify-center rounded-full bg-white shadow-inner">
          <span className="text-2xl font-black text-slate-950">{value}%</span>
          <span className="text-[10px] font-bold text-slate-500">{label}</span>
        </div>
      </div>
    </div>
  )
}

function LineChartPanel({ title, legends }: { title: string; legends: Array<{ label: string; tone: DirectionTone; values: number[] }> }) {
  const months = ['Déc.', 'Jan.', 'Fév.', 'Mars', 'Avr.', 'Mai']
  return (
    <Card className="min-h-[350px]">
      <CardHeader title={title} action="Voir le détail" />
      <div className="mb-3 flex flex-wrap gap-3">
        {legends.map((legend) => <span key={legend.label} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600"><span className={cx('h-2 w-2 rounded-full', toneStyles[legend.tone].fill)} />{legend.label}</span>)}
      </div>
      <div className="relative h-60 rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-4">
        {[0, 1, 2, 3, 4].map((line) => <div key={line} className="absolute left-4 right-4 border-t border-slate-100" style={{ top: `${18 + line * 20}%` }} />)}
        <svg viewBox="0 0 600 210" className="relative z-10 h-full w-full overflow-visible">
          {legends.map((legend) => {
            const max = Math.max(...legend.values, 1)
            const min = Math.min(...legend.values, 0)
            const range = Math.max(1, max - min)
            const points = legend.values.map((value, index) => `${(index / (legend.values.length - 1)) * 580 + 10},${190 - ((value - min) / range) * 160}`).join(' ')
            return <polyline key={legend.label} points={points} fill="none" stroke={toneStyles[legend.tone].line} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          })}
        </svg>
      </div>
      <div className="mt-3 grid grid-cols-6 text-center text-[11px] font-bold text-slate-400">{months.map((month) => <span key={month}>{month}</span>)}</div>
    </Card>
  )
}

function SimpleTable({ title, rows, columns, action = 'Voir tout' }: { title: string; rows: DirectionTableRow[]; columns: Array<{ key: string; label: string }>; action?: string }) {
  return (
    <Card>
      <CardHeader title={title} action={action} />
      <div className="overflow-hidden rounded-2xl border border-slate-100">
        <table className="w-full text-left text-[12px]">
          <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
            <tr>{columns.map((column) => <th key={column.key} className="px-3 py-3">{column.label}</th>)}<th className="px-3 py-3">Statut</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id} className="bg-white hover:bg-blue-50/40">
                {columns.map((column) => <td key={column.key} className="px-3 py-3 font-semibold text-slate-700">{row.cells[column.key]}</td>)}
                <td className="px-3 py-3"><StatusChip tone={row.tone || 'slate'}>{row.status || 'OK'}</StatusChip></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function Sidebar({ activeView }: { activeView: DirectionViewKey }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[262px] shrink-0 border-r border-slate-200 bg-white xl:block">
      <div className="flex h-full flex-col">
        <div className="px-6 pb-4 pt-6">
          <Link href="/angelcare-360/customer" aria-label="AngelCare360" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-700 text-lg font-black text-white shadow-lg shadow-blue-100">✦</div>
            <span className="text-2xl font-black tracking-[-0.04em] text-slate-950">AngelCare<span className="text-blue-700">360</span></span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-2">
          {directionSidebar.map((item) => {
            const isActiveGroup = item.active
            return (
              <div key={item.label} className="mb-1">
                <Link
                  href={item.route}
                  className={cx(
                    'flex items-center justify-between rounded-2xl px-3 py-3 text-[13px] font-black transition',
                    isActiveGroup ? 'bg-blue-700 text-white shadow-lg shadow-blue-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950',
                  )}
                >
                  <span className="flex items-center gap-3"><span className={cx('flex h-7 w-7 items-center justify-center rounded-xl border text-[13px]', isActiveGroup ? 'border-white/30 bg-white/10' : 'border-slate-200 bg-white')}>{item.icon}</span>{item.label}</span>
                  <span className="text-xs">⌄</span>
                </Link>
                {item.children ? (
                  <div className="ml-7 mt-2 space-y-1 border-l border-slate-100 pl-3">
                    {item.children.map((child) => {
                      const childActive = child.route.endsWith(activeView) || (activeView === 'synthese' && child.route.endsWith('cockpit-direction'))
                      return <Link key={child.label} href={child.route} className={cx('block rounded-xl px-3 py-2 text-[12px] font-bold', childActive ? 'bg-blue-50 text-blue-800' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')}>{child.label}</Link>
                    })}
                  </div>
                ) : null}
              </div>
            )
          })}
        </nav>
        <div className="space-y-3 border-t border-slate-100 p-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-black text-slate-950">Tous les sites</p>
            <p className="text-[11px] font-semibold text-slate-500">14 crèches · Maroc</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3 text-[11px] font-bold text-slate-500">Actualisé il y a 5 min</div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
            <p className="text-[11px] font-black text-slate-950">Besoin d’aide ?</p>
            <p className="text-[11px] font-bold text-blue-700">Centre d’assistance</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 2xl:px-7">
        <div className="flex min-w-[320px] max-w-xl flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <span className="text-slate-400">⌕</span>
          <input className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold outline-none placeholder:text-slate-400" placeholder="Rechercher (ex : taux d’occupation, impayés, incidents...)" />
          <kbd className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black text-slate-500">⌘K</kbd>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => openDirectionCommand({ title: "Changer période de pilotage", module: "Top intelligence bar", operation: "direction_action.create", payload: { field: "date_range", requested: "open_period_selector" } })} className={premiumButtonClass('control')}>▣ 01 – 31 mai 2025⌄</button>
          <button type="button" onClick={() => openDirectionCommand({ title: "Changer périmètre multi-sites", module: "Top intelligence bar", operation: "direction_action.create", payload: { field: "site_scope", requested: "open_site_selector" } })} className={premiumButtonClass('control')}>▤ Tous les sites <span className="text-slate-400">14 crèches</span>⌄</button>
          <button type="button" onClick={() => openDirectionCommand({ title: "Ouvrir alertes critiques", module: "Top intelligence bar", operation: "direction_action.create", priority: "high", payload: { drawer: "alerts", count: 8 } })} className={premiumButtonClass('control', 'relative')}>🔔<span className="absolute -right-1 -top-1 rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] text-white">8</span></button>
          <button type="button" onClick={() => openDirectionCommand({ title: "Action rapide direction", module: "Top intelligence bar", operation: "direction_action.create", priority: "high", payload: { sourceButton: "quick_action" } })} className={premiumButtonClass('primary')}>+ Action rapide</button>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-emerald-100"><span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" /></div>
            <div className="hidden sm:block"><p className="text-[12px] font-black text-slate-950">Youssef El Amrani</p><p className="text-[11px] font-semibold text-slate-500">Directeur Général</p></div>
          </div>
        </div>
      </div>
    </header>
  )
}

function PageHeader({ view, onAction }: { view: DirectionViewKey; onAction: (draft: ActionDraft) => void }) {
  const meta = pageMeta[view] || pageMeta.synthese
  return (
    <div className="mb-5 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-bold text-slate-500">{meta.breadcrumb}</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.055em] text-slate-950 md:text-4xl">{meta.title}</h1>
          <p className="mt-2 max-w-3xl text-[14px] font-semibold text-slate-500">{meta.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onAction({ title: 'Créer une action direction', module: meta.title, impact: 'Workflow gouverné, assignation, échéance et preuve.', payload: { action: 'create_direction_action', source: view, language: 'fr-MA' } })} className={premiumButtonClass('primary')}>+ Créer une action</button>
          <button type="button" onClick={() => onAction({ title: 'Ouvrir un rapport', module: 'Rapports Direction', impact: 'Prévisualisation A4, export et trace de gouvernance.', payload: { report: view, format: 'A4_PDF', governance: 'enabled' } })} className={premiumButtonClass('secondary')}>▤ Ouvrir un rapport</button>
          <button type="button" onClick={() => onAction({ title: 'Lancer un contrôle', module: meta.title, impact: 'Contrôle qualité avec droits, crédits, restrictions et preuve de traitement.', payload: { control: 'direction_check', source: view } })} className={premiumButtonClass('secondary')}>◇ Lancer un contrôle</button>
          <button type="button" onClick={() => onAction(createDirectionDraft({ title: "Planifier export directionnel", module: "Exports Direction", operation: "export.queue", source: view, payload: { exportType: view, format: "xlsx" } }))} className={premiumButtonClass('secondary')}>⇩ Exporter⌄</button>
        </div>
      </div>
      <nav className="mt-6 flex gap-7 overflow-x-auto border-b border-slate-200">
        {directionViews.slice(0, 8).map((item) => (
          <Link key={item.key} href={item.route} className={cx('min-w-max border-b-2 px-1 pb-3 text-[12px] font-black', item.key === view ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-950')}>{item.shortLabel}</Link>
        ))}
      </nav>
    </div>
  )
}


function RuntimeRealityStrip({ live, loading }: { live: LiveDirectionDashboard | null; loading: boolean }) {
  const readiness = live?.sellableReadiness || {}
  const databaseReady = Boolean(live?.databaseReady)
  const score = Number(readiness.score || (databaseReady ? 86 : 62))
  const cards = [
    { label: 'Niveau de préparation', value: `${score}%`, tone: databaseReady ? 'emerald' : 'amber', detail: readiness.commercialStatus || 'Synchronisation des services' },
    { label: 'Décisions réelles', value: String(readiness.pendingDecisions ?? live?.records?.decisions?.length ?? 0), tone: 'blue', detail: 'validations enregistrées' },
    { label: 'Actions ouvertes', value: String(readiness.openActions ?? live?.records?.actions?.length ?? 0), tone: 'violet', detail: 'actions de direction' },
    { label: 'Risques critiques', value: String(readiness.criticalRisks ?? 0), tone: (readiness.criticalRisks || 0) > 0 ? 'rose' : 'emerald', detail: 'risques suivis' },
    { label: 'Rapports pipeline', value: String(readiness.reportsInPipeline ?? live?.records?.reports?.length ?? 0), tone: 'cyan', detail: 'rapports & packs direction' },
    { label: 'Restrictions', value: String(readiness.activeRestrictions ?? 0), tone: (readiness.activeRestrictions || 0) > 0 ? 'amber' : 'emerald', detail: readiness.planLabel || 'plan actif' },
  ] as Array<{ label: string; value: string; tone: DirectionTone; detail: string }>

  return (
    <section className="mb-5 rounded-[1.7rem] border border-blue-100 bg-white p-4 shadow-[0_16px_40px_rgba(37,99,235,0.06)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">État opérationnel du cockpit</p>
          <h2 className="mt-1 text-lg font-black tracking-[-0.03em] text-slate-950">Pilotage direction : décisions, risques, rapports, preuves et gouvernance</h2>
        </div>
        <StatusChip tone={loading ? 'slate' : databaseReady ? 'emerald' : 'amber'}>{loading ? 'Synchronisation…' : databaseReady ? 'Compte prêt' : 'Configuration à finaliser'}</StatusChip>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{card.label}</p>
            <p className={cx('mt-1 text-2xl font-black tracking-[-0.04em]', toneStyles[card.tone].text)}>{card.value}</p>
            <p className="mt-1 line-clamp-2 text-[11px] font-semibold text-slate-500">{card.detail}</p>
          </div>
        ))}
      </div>
      {!databaseReady && !loading ? (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[12px] font-bold text-amber-900">
          Activation finale du compte à compléter pour débloquer toutes les actions avancées. La consultation reste sécurisée ; les actions sensibles seront guidées étape par étape.
        </div>
      ) : null}
    </section>
  )
}


function RealityHardeningBar({ activeView, live }: { activeView: DirectionViewKey; live: LiveDirectionDashboard | null }) {
  const databaseReady = Boolean(live?.databaseReady)
  const items = [
    { title: 'Contrôler les points à finaliser', operation: 'control.launch', tone: 'blue', payload: { control: 'zero_static_gap_scan', scope: activeView } },
    { title: 'Créer une action de suivi', operation: 'direction_action.create', tone: 'emerald', payload: { actionType: 'gap_correction', sourceView: activeView } },
    { title: 'Déclarer un risque opérationnel', operation: 'risk.create', tone: 'amber', payload: { riskType: 'ui_runtime_gap', severity: 'high', sourceView: activeView } },
    { title: 'Planifier un export de preuve', operation: 'export.queue', tone: 'violet', payload: { exportType: 'direction_proof_export', format: 'xlsx', sourceView: activeView } },
  ] as Array<{ title: string; operation: string; tone: DirectionTone; payload: Record<string, unknown> }>
  return (
    <section className="mb-5 rounded-[1.7rem] border border-emerald-100 bg-gradient-to-r from-white via-emerald-50/40 to-blue-50/40 p-4 shadow-[0_16px_40px_rgba(16,185,129,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">Exécution sécurisée</p>
          <h2 className="mt-1 text-lg font-black tracking-[-0.03em] text-slate-950">Chaque bouton ouvre une vérification claire, une action suivie ou une preuve de traitement.</h2>
          <p className="mt-1 text-[12px] font-semibold text-slate-500">État du compte : {databaseReady ? 'services actifs, actions enregistrables' : 'activation finale à compléter — actions sensibles guidées et contrôlées'}.</p>
        </div>
        <div className="grid w-full gap-2 sm:grid-cols-2 xl:w-auto xl:grid-cols-4">
          {items.map((item) => (
            <button
              type="button"
              key={item.title}
              onClick={() => openDirectionCommand({ title: item.title, module: 'Cockpit de Direction', operation: item.operation, priority: item.tone === 'amber' ? 'high' : 'normal', source: activeView, payload: item.payload })}
              className={premiumToneButtonClass(item.tone)}
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

const pageMeta: Record<DirectionViewKey, { title: string; subtitle: string; breadcrumb: string }> = {
  synthese: { title: 'Cockpit de direction', subtitle: 'Pilotage stratégique de la performance globale de AngelCare 360 au Maroc.', breadcrumb: 'Cockpit de direction' },
  operations: { title: 'Opérations & multi-sites', subtitle: 'Cockpit réseau, capacité, transport, incidents et exécution terrain.', breadcrumb: 'Cockpit de direction > Opérations & multi-sites' },
  finance: { title: 'Finance & rentabilité', subtitle: 'Pilotage financier, performance, encaissements et prévisions — AngelCare 360 au Maroc.', breadcrumb: 'Cockpit de direction > Finance' },
  admissions: { title: 'Admissions & croissance', subtitle: 'Pilotez votre pipeline d’admissions et accélérez la croissance de AngelCare 360 au Maroc.', breadcrumb: 'Cockpit de direction > Admissions' },
  equipe: { title: 'RH & capacité', subtitle: 'Pilotage des ressources humaines, de la capacité opérationnelle et des formations.', breadcrumb: 'Cockpit de direction > RH & capacité' },
  securite: { title: 'Qualité, risques & conformité', subtitle: 'Pilotage global de la qualité, des risques et de la conformité AngelCare 360.', breadcrumb: 'Cockpit de direction > Risques' },
  parents: { title: 'ParentTrust & expérience familles', subtitle: 'Pilotage de la satisfaction, des réclamations et de l’expérience familles sur l’ensemble du réseau.', breadcrumb: 'Cockpit de direction > ParentTrust' },
  rapports: { title: 'Décisions, rapports & exports', subtitle: 'Gouvernance, arbitrages, reporting exécutif et exports sécurisés.', breadcrumb: 'Cockpit de direction > Rapports' },
  aujourdhui: { title: 'Aujourd’hui', subtitle: 'Exécution opérationnelle de la journée.', breadcrumb: 'Cockpit de direction > Aujourd’hui' },
  risques: { title: 'Risques', subtitle: 'Lecture des risques critiques et plans de mitigation.', breadcrumb: 'Cockpit de direction > Risques' },
  decisions: { title: 'Décisions', subtitle: 'Validations, arbitrages et preuves directionnelles.', breadcrumb: 'Cockpit de direction > Décisions' },
  transport: { title: 'Transport', subtitle: 'Circuits, ponctualité, sécurité et actions terrain.', breadcrumb: 'Cockpit de direction > Transport' },
  automatisations: { title: 'Automatisations', subtitle: 'Règles, crédits, alertes intelligentes et exécution automatique.', breadcrumb: 'Cockpit de direction > Automatisations' },
  gouvernance: { title: 'Gouvernance compte', subtitle: 'Plan, crédits, restrictions, add-ons et sécurité du compte.', breadcrumb: 'Cockpit de direction > Gouvernance' },
}

function ExecutiveView() {
  return (
    <div className="space-y-5">
      <MetricStrip metrics={executiveMetrics} />
      <div className="grid gap-5 2xl:grid-cols-[1.2fr_0.9fr_0.75fr_0.75fr]">
        <LineChartPanel title="Évolution des indicateurs clés" legends={[{ label: "Chiffre d’affaires (MAD)", tone: 'blue', values: [8, 9, 10.8, 11.2, 10.7, 12.4] }, { label: 'Encaissements (MAD)', tone: 'emerald', values: [7.2, 8.4, 9.2, 10.1, 9.4, 11.2] }, { label: 'Impayés (MAD)', tone: 'rose', values: [2.4, 2.6, 2.3, 2.7, 2.1, 1.27] }, { label: "Taux d’occupation", tone: 'violet', values: [84, 86, 89, 91, 88, 91] }]} />
        <SimpleTable title="Performance par site" rows={sitePerformanceRows} columns={[{ key: 'site', label: 'Site' }, { key: 'occupation', label: 'Occ.' }, { key: 'ca', label: 'CA' }, { key: 'impayes', label: 'Impayés' }]} />
        <AlertsPanel />
        <FinanceSnapshot />
      </div>
      <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-[1fr_1fr_0.9fr_0.8fr_1.1fr]">
        <AdmissionsFunnel />
        <TeamCapacity />
        <ParentTrustMini />
        <Priorities />
        <DecisionCenter />
      </div>
    </div>
  )
}

function AlertsPanel() {
  const alerts = [
    ['3 incidents critiques ouverts', '2 à Casablanca Anfa, 1 à Tanger Malabata', 'rose', 'Il y a 15 min'],
    ["Taux d’occupation < 85%", 'Meknès Hamria (82%)', 'amber', 'Il y a 32 min'],
    ['Impayés en hausse', '+8,5% vs avril 2025', 'orange', 'Il y a 1 h'],
    ['3 contrôles qualité en retard', 'Fès, Agadir, Meknès', 'blue', 'Il y a 2 h'],
    ['Tous les bus conformes', 'Contrôles transport à jour', 'emerald', 'Il y a 3 h'],
  ] as const
  return (
    <Card>
      <CardHeader title="Alertes opérationnelles" action="Voir tout" />
      <div className="space-y-3">
        {alerts.map(([title, detail, tone, time]) => <div key={title} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3"><div><p className={cx('text-[12px] font-black', toneStyles[tone].text)}>{title}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{detail}</p></div><span className="text-[10px] font-bold text-slate-400">{time}</span></div>)}
      </div>
    </Card>
  )
}

function FinanceSnapshot() {
  return (
    <Card>
      <CardHeader title="Snapshot financier" action="Voir tout" />
      <div className="space-y-4 text-[12px]">
        {[['Produits d’exploitation', '56,24 M MAD', 'slate'], ['Charges d’exploitation', '-42,31 M MAD', 'rose'], ['EBITDA', '13,93 M MAD', 'emerald'], ['Marge', '24,8%', 'emerald'], ['Trésorerie disponible', '8,72 M MAD', 'blue'], ['DSO', '32 jours · ▼ 2 j', 'emerald'], ['DPO', '26 jours · ▲ 3 j', 'rose']].map(([a, b, tone]) => <div key={a} className="flex justify-between border-b border-slate-100 pb-2"><span className="font-bold text-slate-500">{a}</span><span className={cx('font-black', toneStyles[tone as DirectionTone].text)}>{b}</span></div>)}
      </div>
    </Card>
  )
}

function AdmissionsFunnel() {
  return (
    <Card>
      <CardHeader title="Admissions — Entonnoir" subtitle="Ce mois" />
      <div className="grid grid-cols-[0.9fr_1fr] gap-4">
        <div className="space-y-1">
          {['Demandes 312', 'Visites 198', 'Offres 142', 'Inscriptions 186'].map((stage, index) => <div key={stage} className="mx-auto rounded-lg text-center text-[11px] font-black text-white" style={{ width: `${100 - index * 14}%`, padding: '10px 0', background: ['#2563eb', '#60a5fa', '#a7f3d0', '#c4b5fd'][index] }}>{stage}</div>)}
        </div>
        <div className="space-y-4">
          <div><p className="text-[11px] font-bold text-slate-500">Taux conversion global</p><p className="text-3xl font-black text-slate-950">59,6%</p><p className="text-[11px] font-black text-emerald-700">▲ 6,2 pts vs avr. 2025</p></div>
          <div><p className="text-[11px] font-bold text-slate-500">Délai moyen d’admission</p><p className="text-2xl font-black text-slate-950">8,4 jours</p><p className="text-[11px] font-black text-emerald-700">▼ 1,3 j</p></div>
        </div>
      </div>
    </Card>
  )
}

function TeamCapacity() {
  return (
    <Card>
      <CardHeader title="Équipes & capacité" action="Voir détail" />
      <div className="flex items-center gap-5">
        <Donut value={95} tone="blue" label="Couverture" />
        <div className="flex-1 space-y-3">
          {['Éducateurs 162 (52%)', 'Auxiliaires 78 (25%)', 'Administration 42 (13%)', 'Support 30 (10%)'].map((item, i) => <div key={item}><div className="mb-1 flex justify-between text-[11px] font-bold text-slate-600"><span>{item}</span><span>{[52, 25, 13, 10][i]}%</span></div><Progress value={[52, 25, 13, 10][i]} tone={['blue', 'emerald', 'amber', 'violet'][i] as DirectionTone} /></div>)}
        </div>
      </div>
    </Card>
  )
}

function ParentTrustMini() {
  return (
    <Card>
      <CardHeader title="ParentTrust — Satisfaction" action="Voir détail" />
      <p className="text-4xl font-black text-slate-950">4,6 / 5 <span className="text-2xl text-amber-400">★★★★☆</span></p>
      <p className="mt-1 text-[11px] font-black text-emerald-700">▲ 0,2 vs avr. 2025</p>
      <div className="mt-4 space-y-2">{[['Accueil & communication', 94], ['Qualité pédagogique', 92], ['Sécurité & hygiène', 94], ['Repas & nutrition', 88], ['Transports', 86]].map(([label, value]) => <div key={label as string}><div className="mb-1 flex justify-between text-[11px] font-bold text-slate-500"><span>{label}</span><span>{Number(value) / 20}</span></div><Progress value={value as number} tone="emerald" /></div>)}</div>
    </Card>
  )
}

function Priorities() {
  const priorities = [
    ['Finaliser budget révisé 2025', 'Finance', 'rose'],
    ["Améliorer l’occupation à Meknès", 'Opérations', 'blue'],
    ["Lancer campagne d’inscriptions été", 'Admissions', 'violet'],
    ['Preuve qualité semestriel', 'Qualité', 'emerald'],
  ] as const
  return <Card><CardHeader title="Priorités du mois" /> <div className="space-y-3">{priorities.map(([title, tag, tone], i) => <div key={title} className="flex gap-3 rounded-2xl border border-slate-100 p-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[12px] font-black">{i + 1}</span><div className="flex-1"><p className="text-[12px] font-black text-slate-950">{title}</p><p className="text-[11px] font-semibold text-slate-500">Échéance et responsable suivis</p></div><StatusChip tone={tone}>{tag}</StatusChip></div>)}</div></Card>
}

function DecisionCenter() {
  const decisions = [
    ['Demande achat — Jeux éducatifs', '18 450 MAD', 'Aujourd’hui', 'emerald'],
    ['Recrutement — Éducateur(trice)', 'À valider', 'Aujourd’hui', 'blue'],
    ['Remise commerciale — Partenaire', '12%', 'Demain', 'amber'],
    ['Plan formation — Juin 2025', 'À approuver', '2 juin', 'violet'],
  ] as const
  return <Card><CardHeader title="Centre de décisions" action="Voir tout" /> <div className="mb-3 flex gap-2"><StatusChip tone="blue">À approuver (7)</StatusChip><StatusChip tone="slate">Mes tâches (12)</StatusChip></div><div className="space-y-3">{decisions.map(([title, value, date, tone]) => <div key={title} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-2xl border border-slate-100 p-3"><p className="text-[12px] font-black text-slate-950">{title}</p><span className="text-[11px] font-bold text-slate-500">{value}</span><StatusChip tone={tone}>{date}</StatusChip></div>)}</div></Card>
}

function OperationsView() {
  const rows = [
    ['Casablanca Anfa', '96,5%', '27 / 30', '97,2%', '95,1%', '3', 'Excellent'],
    ['Rabat Agdal', '93,2%', '23 / 25', '95,4%', '93,0%', '2', 'Bon'],
    ['Marrakech Guéliz', '88,6%', '20 / 24', '93,1%', '90,2%', '4', 'À surveiller'],
    ['Tanger Centre', '90,1%', '18 / 20', '94,0%', '92,6%', '1', 'Bon'],
    ['Fès Atlas', '86,4%', '16 / 19', '90,8%', '89,3%', '3', 'À surveiller'],
  ]
  return <div className="space-y-5"><MetricStrip metrics={operationMetrics} /><div className="grid gap-5 2xl:grid-cols-[1.1fr_1.05fr_0.85fr_0.85fr]"><MoroccoMap /><OperationalSiteTable /><ServiceExecution /><OperationalRightRail /></div><div className="grid gap-5 xl:grid-cols-4"><DonutPanel title="Ponctualité transport" value={93} tone="blue" labels={['Ponctuels 92,6%', 'Retard < 15 min 5,4%', 'Retard ≥ 15 min 2,0%']} /><DonutPanel title="Incidents par criticité" value={28} tone="rose" center="28" labels={['Critique 6', 'Important 9', 'Modéré 9', 'Mineur 4']} /><DelayTasks /><SlaPanel /></div><DetailTable title="Détail des sites" columns={['Site', 'Région', 'Capacité', 'Présents', 'Occupation', 'Personnel', 'Services', 'Transport', 'Incidents', 'SLA', 'Statut']} rows={rows} /></div>
}

function MoroccoMap() {
  const cities = [{ n: 'Tanger', x: 70, y: 12, t: 'blue', v: 2 }, { n: 'Rabat', x: 48, y: 25, t: 'blue', v: 2 }, { n: 'Casablanca', x: 38, y: 36, t: 'orange', v: 3 }, { n: 'Fès', x: 64, y: 31, t: 'blue', v: 2 }, { n: 'Marrakech', x: 39, y: 58, t: 'orange', v: 3 }, { n: 'Agadir', x: 28, y: 78, t: 'emerald', v: 2 }]
  return <Card className="min-h-[390px]"><CardHeader title="Vue réseau — Maroc" action="Taux d’occupation⌄" /><div className="relative h-[310px] rounded-2xl bg-gradient-to-br from-blue-50 via-slate-50 to-white"><div className="absolute inset-8 rounded-[45%] border border-blue-100 bg-white/50 shadow-inner" />{cities.map(city => <div key={city.n} className="absolute" style={{ left: `${city.x}%`, top: `${city.y}%` }}><span className="block -translate-x-1/2 text-[12px] font-black text-slate-700">{city.n}</span><span className={cx('mt-1 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white text-[13px] font-black shadow-lg', toneStyles[city.t as DirectionTone].soft, toneStyles[city.t as DirectionTone].text)}>{city.v}</span></div>)}<div className="absolute bottom-4 right-4 rounded-2xl border border-slate-200 bg-white p-3 text-[11px] font-bold text-slate-600 shadow-sm"><p className="mb-2 font-black text-slate-950">Taux occupation</p><p>● ≥ 95%</p><p>● 85% – 94%</p><p>● 70% – 84%</p><p>● &lt; 70%</p></div></div></Card>
}

function OperationalSiteTable() {
  const rows = ['Casablanca Anfa|96,5%|27 / 30|97,2%|95,1%|3', 'Rabat Agdal|93,2%|23 / 25|95,4%|93,0%|2', 'Marrakech Guéliz|88,6%|20 / 24|93,1%|90,2%|4', 'Tanger Centre|90,1%|18 / 20|94,0%|92,6%|1', 'Fès Atlas|86,4%|16 / 19|90,8%|89,3%|3', 'Agadir Founty|82,3%|15 / 19|89,3%|86,7%|3', 'Meknès|76,2%|6 / 8|86,1%|82,6%|4'].map((r, i) => ({ id: `site-${i}`, status: i < 2 ? 'OK' : i > 4 ? 'Priorité' : 'Surveiller', tone: i < 2 ? 'emerald' : i > 4 ? 'rose' : 'amber', cells: { site: r.split('|')[0], occupation: r.split('|')[1], staff: r.split('|')[2], services: r.split('|')[3], transport: r.split('|')[4], incidents: r.split('|')[5] } })) as DirectionTableRow[]
  return <SimpleTable title="Performance par site" rows={rows} columns={[{ key: 'site', label: 'Site' }, { key: 'occupation', label: 'Occ.' }, { key: 'staff', label: 'Staff' }, { key: 'incidents', label: 'Inc.' }]} action="Voir tous les sites" />
}

function ServiceExecution() {
  return <Card><CardHeader title="Exécution des services" subtitle="Aujourd’hui" action="Voir détail" /> <div className="space-y-4">{[['Repas & nutrition', 92], ['Hygiène & soins', 93], ['Activités pédagogiques', 90], ['Sieste & repos', 95], ['Transport', 92], ['Entretien & sécurité', 88]].map(([label, v]) => <div key={label as string}><div className="mb-1 flex justify-between text-[11px] font-bold text-slate-600"><span>{label}</span><span>{v}%</span></div><Progress value={v as number} tone={(v as number) > 91 ? 'emerald' : 'amber'} /></div>)}</div></Card>
}

function OperationalRightRail() {
  return <div className="space-y-5"><AlertsPanel /><Card><CardHeader title="Plans d’action & escalades" action="Voir tout" /> <div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-2xl bg-blue-50 p-3"><p className="text-xl font-black">14</p><p className="text-[10px] font-bold text-slate-500">En cours</p></div><div className="rounded-2xl bg-rose-50 p-3"><p className="text-xl font-black">5</p><p className="text-[10px] font-bold text-slate-500">Escalade</p></div><div className="rounded-2xl bg-amber-50 p-3"><p className="text-xl font-black">3</p><p className="text-[10px] font-bold text-slate-500">Validation</p></div></div><div className="mt-4 space-y-3">{['Réduction retards transport — Tanger', 'Amélioration hygiène — Marrakech', 'Renforcement staffing — Meknès'].map((a, i) => <div key={a} className="rounded-2xl border border-slate-100 p-3"><p className="text-[12px] font-black text-slate-950">{a}</p><p className="text-[11px] text-slate-500">Responsable assigné · Échéance suivie</p><Progress value={[60, 40, 20][i]} tone={i === 0 ? 'blue' : i === 1 ? 'amber' : 'rose'} /></div>)}</div></Card></div>
}

function DonutPanel({ title, value, tone, labels, center }: { title: string; value: number; tone: DirectionTone; labels: string[]; center?: string }) {
  return <Card><CardHeader title={title} action="Voir détail" /> <div className="flex items-center gap-4"><Donut value={value} tone={tone} label={center || `${value}%`} /><div className="space-y-2">{labels.map(label => <p key={label} className="text-[12px] font-bold text-slate-600">• {label}</p>)}</div></div></Card>
}

function DelayTasks() { return <Card><CardHeader title="Tâches en retard" action="Voir toutes" /> <p className="text-5xl font-black text-slate-950">37</p><p className="text-[11px] font-black text-emerald-700">▲ 12 vs avr. 2025</p><div className="mt-4 space-y-2 text-[12px] font-bold text-slate-600">{['Hygiène & entretien 14', 'Activités pédagogiques 9', 'Repas & nutrition 6', 'Administratif 8'].map(x => <p key={x} className="flex justify-between border-b border-slate-100 pb-2"><span>{x.split(' ').slice(0,-1).join(' ')}</span><span>{x.split(' ').at(-1)}</span></p>)}</div></Card> }
function SlaPanel() { return <Card><CardHeader title="SLA par catégorie" subtitle="30 derniers jours" /> <div className="space-y-3">{[['Services pédagogiques', 98], ['Hygiène & sécurité', 96], ['Transport', 94], ['Entretien', 95], ['Administratif', 93]].map(([l, v]) => <div key={l as string}><div className="mb-1 flex justify-between text-[11px] font-bold text-slate-600"><span>{l}</span><span>{v}%</span></div><Progress value={v as number} tone="emerald" /></div>)}</div></Card> }

function DetailTable({ title, columns, rows }: { title: string; columns: string[]; rows: string[][] }) {
  return <Card><CardHeader title={title} action="Afficher 1 – 5 sur 14" /> <div className="overflow-auto rounded-2xl border border-slate-100"><table className="w-full min-w-[940px] text-left text-[12px]"><thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500"><tr>{columns.map(col => <th key={col} className="px-3 py-3">{col}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row, idx) => <tr key={idx} className="hover:bg-blue-50/40">{row.map((cell, i) => <td key={i} className="px-3 py-3 font-semibold text-slate-700">{i === row.length - 1 ? <StatusChip tone={cell.includes('Excellent') || cell.includes('Bon') ? 'emerald' : 'amber'}>{cell}</StatusChip> : cell}</td>)}</tr>)}</tbody></table></div></Card>
}

function FinanceView() {
  const agingRows = ['À échéance|857 K|36,6%|▼ 5,2%', '1 – 30 jours|612 K|26,1%|▼ 3,1%', '31 – 60 jours|438 K|18,7%|▲ 4,6%', '61 – 90 jours|196 K|8,4%|▲ 2,1%', '> 90 jours|1,27 M|10,2%|▲ 8,5%'].map((r, i) => ({ id: `aging-${i}`, tone: i > 2 ? 'rose' : i === 2 ? 'amber' : 'emerald', status: i > 2 ? 'Risque' : 'OK', cells: { age: r.split('|')[0], amount: r.split('|')[1], pct: r.split('|')[2], trend: r.split('|')[3] } })) as DirectionTableRow[]
  return <div className="space-y-5"><MetricStrip metrics={financeMetrics} /><div className="grid gap-5 2xl:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]"><LineChartPanel title="Évolution du chiffre d’affaires" legends={[{ label: 'CA 2025', tone: 'blue', values: [4, 5.4, 6.2, 7.1, 8.7, 10.2, 11.1, 12.4] }, { label: 'CA 2024', tone: 'emerald', values: [3.2, 4.1, 4.8, 5.6, 6.1, 7.4, 8.2, 9.3] }]} /><DonutPanel title="Encaissements" value={92} tone="emerald" center="11,21 M" labels={['Virements 67%', 'Prélèvements 23%', 'Espèces & chèques 10%']} /><SimpleTable title="Impayés — Âge créances" rows={agingRows} columns={[{ key: 'age', label: 'Tranche' }, { key: 'amount', label: 'Montant' }, { key: 'pct', label: '%' }]} /><LineChartPanel title="EBITDA & Marges" legends={[{ label: 'EBITDA', tone: 'blue', values: [1.4, 1.8, 2.0, 2.1, 2.0, 2.34] }, { label: 'Marge EBITDA', tone: 'emerald', values: [14, 15, 17, 16, 18, 18.8] }]} /></div><div className="grid gap-5 xl:grid-cols-4"><FinanceSnapshot /><PlanActual /><BudgetApprovals /><FinanceWatchlist /></div></div>
}
function PlanActual() { return <Card><CardHeader title="Plan vs Réalisé" subtitle="Mai 2025" action="Voir détail" /> <div className="space-y-3">{[['Chiffre d’affaires', '12,48 M', '+3,1%'], ['Encaissements', '11,21 M', '+1,9%'], ['EBITDA', '2,34 M', '+11,4%'], ['Résultat net', '1,37 M', '+14,2%']].map(r => <div key={r[0]} className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2 text-[12px]"><span className="font-bold text-slate-600">{r[0]}</span><span className="font-black text-slate-950">{r[1]}</span><span className="font-black text-emerald-700">{r[2]}</span></div>)}</div></Card> }
function BudgetApprovals() { return <Card><CardHeader title="Budgets — Approbations" action="Voir tout" /> <div className="space-y-3">{['Budget Opex 2025', 'Budget Investissements 2025', 'Budget Marketing 2025', 'Budget RH 2025'].map((b, i) => <div key={b} className="flex justify-between rounded-2xl border border-slate-100 p-3"><span className="text-[12px] font-black text-slate-950">{b}</span><StatusChip tone={i < 2 ? 'amber' : 'emerald'}>{i < 2 ? 'En attente' : 'Approuvé'}</StatusChip></div>)}</div></Card> }
function FinanceWatchlist() { return <Card><CardHeader title="Finance Watchlist" action="Voir tout" /> <div className="space-y-3">{[['Impayés > 90 j / CA', '10,2%', 'Alerte', 'rose'], ['DSO (jours)', '26 j', 'À surveiller', 'amber'], ['Marge EBITDA', '18,8%', 'OK', 'emerald'], ['Taux encaissement', '92,3%', 'OK', 'emerald']].map(([a,b,c,t]) => <div key={a} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-slate-100 pb-2 text-[12px]"><span className="font-bold text-slate-600">{a}</span><span className="font-black text-slate-950">{b}</span><StatusChip tone={t as DirectionTone}>{c}</StatusChip></div>)}</div></Card> }

function AdmissionsView() {
  return <div className="space-y-5"><MetricStrip metrics={admissionsMetrics} /><AdmissionsPipeline /><div className="grid gap-5 2xl:grid-cols-[1fr_0.9fr_1fr_0.8fr]"><CampaignPerformance /><LeadsSource /><RegionalDemand /><AdmissionsRightRail /></div><div className="grid gap-5 xl:grid-cols-4"><ConversionBySite /><OfferAcceptance /><LostReasons /><TeamProductivity /></div></div>
}
function AdmissionsPipeline() { return <Card><CardHeader title="Pipeline des admissions" action="Voir le détail du pipeline" /> <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">{admissionsMetrics.map((m, i) => <div key={m.label} className={cx('rounded-[1.25rem] border p-4', toneStyles[m.tone].soft, toneStyles[m.tone].border)}><p className="text-[11px] font-black text-slate-500">{m.label}</p><p className="mt-2 text-3xl font-black text-slate-950">{m.value}</p><p className="text-[11px] font-bold text-slate-500">{[100,61,36,26,19,14][i]}%</p><Sparkline values={m.spark} tone={m.tone} /></div>)}</div></Card> }
function CampaignPerformance() { return <Card><CardHeader title="Performance des campagnes" action="Ce mois⌄" /> <div className="space-y-2">{[['Google Ads – Mai', '120', '18', '15,0%', '1 180 MAD'], ['Facebook – Mai', '98', '14', '14,3%', '1 310 MAD'], ['Instagram – Mai', '76', '11', '14,5%', '1 090 MAD'], ['Bouche à oreille', '92', '19', '20,7%', '740 MAD']].map(row => <div key={row[0]} className="grid grid-cols-5 gap-2 border-b border-slate-100 pb-2 text-[12px]"><span className="font-bold text-slate-700">{row[0]}</span>{row.slice(1).map(c => <span key={c} className="font-black text-slate-950">{c}</span>)}</div>)}</div></Card> }
function LeadsSource() { return <Card><CardHeader title="Répartition leads par source" action="Ce mois⌄" /> <div className="flex items-center gap-5"><Donut value={74} tone="blue" label="512" /><div className="space-y-2 text-[12px] font-bold text-slate-600">{['Google Ads 23%', 'Facebook 19%', 'Bouche à oreille 18%', 'Instagram 15%', 'Référencement 13%', 'Autres 12%'].map(x => <p key={x}>• {x}</p>)}</div></div></Card> }
function RegionalDemand() { return <Card><CardHeader title="Demande par région" action="Ce mois⌄" /> <div className="grid grid-cols-[0.9fr_1fr] gap-4"><div className="h-44 rounded-2xl bg-gradient-to-br from-blue-100 via-slate-50 to-white" /><div className="space-y-2">{['Casablanca 32% 164', 'Rabat 17% 87', 'Marrakech 14% 72', 'Tanger 11% 56', 'Fès 9% 46', 'Autres 17% 87'].map(x => <p key={x} className="flex justify-between border-b border-slate-100 pb-1 text-[12px] font-bold text-slate-600"><span>{x.split(' ').slice(0, -1).join(' ')}</span><span>{x.split(' ').at(-1)}</span></p>)}</div></div></Card> }
function AdmissionsRightRail() { return <div className="space-y-5"><Card><CardHeader title="Leads prioritaires" action="Voir tout" /> <div className="space-y-3">{['Aya Alaoui|92|Visite planifiée', 'Yassine Maaroufi|88|Offre envoyée', 'Imane Hachimi|85|Visite réalisée', 'Salma Kabbaj|80|Nouveau lead', 'Mehdi El Fassi|78|Visite planifiée'].map(x => <div key={x} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-slate-100 pb-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[11px] font-black text-blue-700">{x.split('|')[0].split(' ').map(n=>n[0]).join('')}</span><div><p className="text-[12px] font-black text-slate-950">{x.split('|')[0]}</p><p className="text-[11px] font-bold text-slate-500">{x.split('|')[2]}</p></div><StatusChip tone="emerald">{x.split('|')[1]}</StatusChip></div>)}</div></Card><Card><CardHeader title="Prochaines actions" />{['Relancer 28 leads en attente', 'Planifier 15 visites', 'Envoyer 16 offres', 'Suivre 8 inscriptions'].map(x => <p key={x} className="flex justify-between border-b border-slate-100 py-2 text-[12px] font-bold text-slate-700"><span>{x}</span><span>→</span></p>)}</Card></div> }
function ConversionBySite(){return <Card><CardHeader title="Conversion par site" action="Ce mois⌄" /> <div className="space-y-2">{['Casablanca Anfa 16,4% +2,1 pts','Rabat Souissi 15,6% +1,8 pts','Marrakech Majorelle 14,1% -0,3 pt','Tanger Malabata 14,5% +0,6 pt','Fès Atlas 12,5% -1,2 pt'].map(r=><p key={r} className="flex justify-between border-b border-slate-100 pb-2 text-[12px] font-bold text-slate-600"><span>{r.split(' ').slice(0,2).join(' ')}</span><span>{r.split(' ').slice(2).join(' ')}</span></p>)}</div></Card>}
function OfferAcceptance(){return <Card><CardHeader title="Acceptation des offres" action="Ce mois⌄" /> <Donut value={76} tone="violet" label="75,5%" /><p className="mt-3 text-[12px] font-black text-emerald-700">+3,2 pts vs avr. 2025</p></Card>}
function LostReasons(){return <Card><CardHeader title="Raisons de perte de leads" action="Ce mois⌄" /> <div className="space-y-3">{[['Choix autre crèche',38], ['Budget',26], ['Pas de place dispo.',18], ['Trop éloigné',10], ['Autre',8]].map(([l,v])=><div key={l as string}><div className="mb-1 flex justify-between text-[11px] font-bold text-slate-600"><span>{l}</span><span>{v}%</span></div><Progress value={v as number} tone="blue" /></div>)}</div></Card>}
function TeamProductivity(){return <Card><CardHeader title="Productivité de l’équipe" action="Voir équipe" /> <div className="space-y-2">{['Salma Bennani 86 leads 15 inscr.', 'Youssef Khattabi 74 leads 12 inscr.', 'Asmaa Lahlou 68 leads 9 inscr.', 'Mehdi Amine 64 leads 7 inscr.'].map(x => <p key={x} className="border-b border-slate-100 pb-2 text-[12px] font-bold text-slate-700">{x}</p>)}</div></Card>}

function HrView(){return <div className="space-y-5"><MetricStrip metrics={hrMetrics}/><div className="grid gap-5 2xl:grid-cols-[1.4fr_0.7fr_0.8fr]"><PlanningHeatmap/><RecruitmentFunnel/><HrAlerts/></div><div className="grid gap-5 xl:grid-cols-4"><EffectifsTable/><CapacityMatrix/><TrainingProgress/><RecommendedActions/></div></div>}
function PlanningHeatmap(){const sites=['Casablanca Anfa','Casablanca Maarif','Rabat Agdal','Marrakech Guéliz','Tanger Malabata','Total réseau']; const days=['Jeu.01','Ven.02','Sam.03','Dim.04','Lun.05','Mar.06','Mer.07','Jeu.08','Ven.09','Sam.10','Dim.11','Lun.12']; return <Card><CardHeader title="Charge de planification" subtitle="14 prochains jours" action="Voir planning complet"/><div className="overflow-auto"><table className="w-full min-w-[720px] text-center text-[11px]"><thead className="text-slate-400"><tr><th className="text-left">Site</th>{days.map(d=><th key={d}>{d}</th>)}</tr></thead><tbody>{sites.map((site,i)=><tr key={site}><td className="py-2 text-left font-black text-slate-700">{site}</td>{days.map((d,j)=>{const v=92-((i+j)%5)*6+(j%3)*2; const tone=v>90?'emerald':v>78?'amber':'rose'; return <td key={d} className={cx('rounded-lg px-2 py-2 font-black', toneStyles[tone].soft, toneStyles[tone].text)}>{v}%</td>})}</tr>)}</tbody></table></div></Card>}
function RecruitmentFunnel(){return <Card><CardHeader title="Entonnoir recrutement" action="Mai 2025⌄"/><AdmissionsFunnel/></Card>}
function HrAlerts(){return <Card><CardHeader title="Alertes RH" action="Voir tout" />{['Taux couverture critique','Absentéisme élevé','Postes critiques vacants','Heures supplémentaires en hausse','Formations en retard'].map((x,i)=><div key={x} className="mb-3 flex justify-between rounded-2xl border border-slate-100 p-3"><span className="text-[12px] font-black text-slate-950">{x}</span><StatusChip tone={i===0?'rose':i<4?'amber':'blue'}>{i===0?'Critique':i<4?'À surveiller':'Info'}</StatusChip></div>)}</Card>}
function EffectifsTable(){return <SimpleTable title="Effectifs par site et classe" rows={sitePerformanceRows.slice(0,5)} columns={[{key:'site',label:'Site'},{key:'occupation',label:'Couverture'},{key:'ca',label:'Éducatif'}]} />}
function CapacityMatrix(){return <Card><CardHeader title="Carte des écarts de capacité" action="Voir analyse"/><div className="grid grid-cols-5 gap-1 text-center text-[11px] font-black">{Array.from({length:25}).map((_,i)=>{const tones:['emerald','slate','amber','rose']=['emerald','slate','amber','rose']; const t=tones[i%4]; return <div key={i} className={cx('rounded-lg px-2 py-3', toneStyles[t].soft, toneStyles[t].text)}>{i%4===0?'+5%':i%4===1?'0%':i%4===2?'-5%':'-8%'}</div>})}</div></Card>}
function TrainingProgress(){return <Card><CardHeader title="Formations — Avancement" action="Catalogue"/><Donut value={78} tone="violet" label="Taux"/><div className="mt-4 space-y-2">{['Hygiène & sécurité 92','Développement enfant 85','Premiers secours 76','Qualité procédures 68','Leadership 61'].map(x=><div key={x}><div className="mb-1 flex justify-between text-[11px] font-bold text-slate-600"><span>{x.split(' ').slice(0,-1).join(' ')}</span><span>{x.split(' ').at(-1)}%</span></div><Progress value={Number(x.split(' ').at(-1))} tone="emerald"/></div>)}</div></Card>}
function RecommendedActions(){return <Card><CardHeader title="Actions recommandées" action="Voir toutes" />{['Renforcer équipes Marrakech','Planifier renforts été','Accélérer recrutement éducatif','Relancer formations retard'].map((x,i)=><div key={x} className="mb-3 flex justify-between rounded-2xl border border-slate-100 p-3"><span className="text-[12px] font-black text-slate-950">{x}</span><StatusChip tone={i%2?'amber':'rose'}>{i%2?'Moyenne':'Prioritaire'}</StatusChip></div>)}</Card>}

function QualityView(){return <div className="space-y-5"><MetricStrip metrics={qualityMetrics}/><div className="grid gap-5 2xl:grid-cols-[0.9fr_1.05fr_1fr_0.8fr]"><RiskMatrix/><IncidentAnalysis/><PreuveScores/><EscalationCenter/></div><div className="grid gap-5 xl:grid-cols-4"><CompliancePanel/><NonConformities/><ActionPlans/><HygienePanel/></div></div>}
function RiskMatrix(){return <Card><CardHeader title="Matrice des risques" action="Probabilité x Impact⌄"/><div className="grid grid-cols-4 gap-1 text-center text-[18px] font-black">{[2,4,6,2,3,5,4,1,5,3,2,0].map((n,i)=>{const t=i<4? (i>1?'rose':'amber') : i<8 ? 'amber':'emerald'; return <div key={i} className={cx('rounded-xl py-6',toneStyles[t].soft,toneStyles[t].text)}>{n}</div>})}</div><p className="mt-4 text-center text-[12px] font-black text-blue-700">Voir le registre des risques</p></Card>}
function IncidentAnalysis(){return <Card><CardHeader title="Analyse incidents" action="Voir tout"/><div className="grid grid-cols-[auto_1fr] gap-4"><Donut value={27} tone="rose" label="ce mois"/><LineChartPanel title="Évolution mensuelle" legends={[{label:'Critiques',tone:'rose',values:[3,2,4,3,2,3]},{label:'Tous incidents',tone:'blue',values:[18,24,30,25,22,27]}]}/></div></Card>}
function PreuveScores(){const rows=['Les Petits Explorateurs|92%|Conforme','Al Farah|85%|Conforme','L’Île aux Enfants|78%|À améliorer','Rainbow Kids|88%|Conforme'].map((r,i)=>({id:`audit-${i}`,tone:i===2?'amber':'emerald',status:r.split('|')[2],cells:{site:r.split('|')[0],score:r.split('|')[1]}})) as DirectionTableRow[]; return <SimpleTable title="Scores audits" rows={rows} columns={[{key:'site',label:'Site'},{key:'score',label:'Score'}]}/>}
function EscalationCenter(){return <Card><CardHeader title="Centre d’escalades" action="Voir tout" />{['Suspicion intoxication alimentaire','Non-conformité récurrente hygiène','Retards répétés transport scolaire'].map((x,i)=><div key={x} className="mb-3 rounded-2xl border border-slate-100 p-3"><StatusChip tone={i===0?'rose':'amber'}>{i===0?'Critique':'Élevée'}</StatusChip><p className="mt-2 text-[12px] font-black text-slate-950">{x}</p><p className="text-[11px] font-semibold text-slate-500">Responsable assigné · preuve attendue</p></div>)}</Card>}
function CompliancePanel(){return <Card><CardHeader title="Conformité réglementaire" action="Voir tout" />{['Statut global 92','Protection données 95','Sécurité alimentaire 88','Sécurité transport 89','Droits enfant 97'].map(x=><div key={x} className="mb-3"><div className="mb-1 flex justify-between text-[11px] font-bold text-slate-600"><span>{x.split(' ').slice(0,-1).join(' ')}</span><span>{x.split(' ').at(-1)}%</span></div><Progress value={Number(x.split(' ').at(-1))} tone="emerald"/></div>)}</Card>}
function NonConformities(){return <SimpleTable title="Non-conformités ouvertes" rows={sitePerformanceRows.slice(0,5)} columns={[{key:'site',label:'Site'},{key:'occupation',label:'Gravité'},{key:'impayes',label:'Échéance'}]}/>}
function ActionPlans(){return <Card><CardHeader title="Plans d’action — suivi" action="Voir tout"/><div className="grid grid-cols-4 gap-2 text-center"><div><p className="text-2xl font-black">38</p><p className="text-[10px] text-slate-500">Ouverts</p></div><div><p className="text-2xl font-black">21</p><p className="text-[10px] text-slate-500">En cours</p></div><div><p className="text-2xl font-black text-rose-700">9</p><p className="text-[10px] text-slate-500">En retard</p></div><div><p className="text-2xl font-black text-emerald-700">14</p><p className="text-[10px] text-slate-500">Clôturés</p></div></div></Card>}
function HygienePanel(){return <Card><CardHeader title="Hygiène & sécurité" action="Voir tout" />{[['Taux inspection',98],['Presque accidents',15],['Équipements conformes',96],['Formations sécurité',89]].map(([l,v])=><div key={l as string} className="mb-3"><p className="text-[12px] font-black text-slate-950">{l}: {v}{typeof v==='number'&&v>20?'%':''}</p><Progress value={Number(v)} tone="emerald"/></div>)}</Card>}

function ParentTrustView(){return <div className="space-y-5"><MetricStrip metrics={parentMetrics}/><div className="grid gap-5 2xl:grid-cols-[0.8fr_1fr_1fr_0.8fr]"><NpsCard/><LineChartPanel title="Tendance NPS" legends={[{label:'NPS',tone:'blue',values:[20,28,24,32,38,30,26,35,40]},{label:'Objectif',tone:'slate',values:[30,30,30,30,30,30,30,30,30]}]}/><LineChartPanel title="Tendance satisfaction" legends={[{label:'Satisfaction moyenne',tone:'emerald',values:[4.1,4.2,4.1,4.3,4.2,4.4,4.3,4.5]},{label:'Objectif',tone:'slate',values:[4.2,4.2,4.2,4.2,4.2,4.2,4.2,4.2]}]}/><AiRecommendations/></div><div className="grid gap-5 xl:grid-cols-4"><ComplaintFlow/><ResponseTime/><OnlineReputation/><FrequentTopics/></div><div className="grid gap-5 xl:grid-cols-[1.2fr_1fr_0.9fr]"><TicketsWatch/><CommunicationCalendar/><SentimentInsights/></div></div>}
function NpsCard(){return <Card><CardHeader title="NPS global" subtitle="Sur le mois"/><p className="text-5xl font-black">68</p><Progress value={68} tone="emerald"/><div className="mt-4 grid grid-cols-3 text-center text-[12px] font-bold text-slate-600"><span>Promoteurs 63%</span><span>Passifs 19%</span><span>Détracteurs 18%</span></div></Card>}
function AiRecommendations(){return <Card><CardHeader title="Recommandations IA" subtitle="Basées sur vos données" />{['NPS progresse à Casa Anfa','Hausse réclamations « Facturation »','Temps réponse en hausse à Tanger'].map((x,i)=><div key={x} className="mb-3 rounded-2xl border border-slate-100 p-3"><StatusChip tone={i===0?'violet':i===1?'amber':'rose'}>Voir détail</StatusChip><p className="mt-2 text-[12px] font-black text-slate-950">{x}</p></div>)}</Card>}
function ComplaintFlow(){return <Card><CardHeader title="Flux résolution réclamations"/><AdmissionsFunnel/></Card>}
function ResponseTime(){return <DonutPanel title="Temps de réponse" value={76} tone="blue" center="2,4h" labels={['≤ 1 h 38%', '1 à 4 h 44%', '4 à 24 h 13%', '> 24 h 5%']} />}
function OnlineReputation(){return <Card><CardHeader title="Réputation en ligne"/><p className="text-4xl font-black">4,3 / 5 <span className="text-2xl text-amber-400">★★★★☆</span></p><div className="mt-4 space-y-2">{[68,21,7,2,2].map((v,i)=><div key={i}><div className="mb-1 flex justify-between text-[11px] font-bold text-slate-600"><span>{5-i} ★</span><span>{v}%</span></div><Progress value={v} tone="emerald"/></div>)}</div></Card>}
function FrequentTopics(){return <Card><CardHeader title="Sujets fréquents" subtitle="Sur le mois" />{['Facturation 24%', 'Horaires & accueil 18%', 'Repas & nutrition 16%', 'Hygiène & santé 12%', 'Activités 9%', 'Communication 7%'].map((x,i)=><p key={x} className="mb-2"><StatusChip tone={i%2?'blue':'cyan'}>{x}</StatusChip></p>)}</Card>}
function TicketsWatch(){return <SimpleTable title="Tickets à surveiller" rows={sitePerformanceRows.slice(0,5)} columns={[{key:'site',label:'Site'},{key:'impayes',label:'Temps'},{key:'satisfaction',label:'Priorité'}]} />}
function CommunicationCalendar(){return <Card><CardHeader title="Calendrier communications" action="Voir tout" />{['30 mai Campagne « Été & Vacances »','02 juin Sondage satisfaction','05 juin Webinaire Parents','10 juin Focus nutrition','15 juin Rappel Paiement'].map(x=><p key={x} className="mb-3 flex justify-between rounded-2xl border border-slate-100 p-3 text-[12px] font-bold text-slate-700"><span>{x}</span><StatusChip tone="emerald">Planifié</StatusChip></p>)}</Card>}
function SentimentInsights(){return <DonutPanel title="Insights sentiment (IA)" value={68} tone="emerald" center="1 248" labels={['Positif 68%', 'Neutre 21%', 'Négatif 11%']} />}

function ReportsView(){return <div className="space-y-5"><MetricStrip metrics={reportMetrics}/><div className="grid gap-5 2xl:grid-cols-[1.1fr_1fr_0.8fr]"><DecisionsApproval/><ReportTemplates/><GovernanceNotes/></div><div className="grid gap-5 xl:grid-cols-4"><ScheduledExports/><ExportHistory/><BoardPacks/><PendingArbitrages/></div></div>}
function DecisionsApproval(){return <Card><CardHeader title="Décisions à approuver" action="Voir tout" />{['Ouverture crèche Les Oliviers|2,45 M MAD|Urgent', 'Révision budget marketing 2025|320 K MAD|Élevée', 'Recrutement Directeur Opérations|—|Normale', 'Convention partenariat Hopla|180 K MAD|Normale', 'Plan action sécurité alimentaire|—|Normale'].map(x=><div key={x} className="mb-3 grid grid-cols-[1fr_auto_auto] gap-3 rounded-2xl border border-slate-100 p-3 text-[12px]"><span className="font-black text-slate-950">{x.split('|')[0]}</span><span className="font-black text-slate-600">{x.split('|')[1]}</span><StatusChip tone={x.includes('Urgent')?'rose':x.includes('Élevée')?'amber':'emerald'}>{x.split('|')[2]}</StatusChip></div>)}</Card>}
function ReportTemplates(){return <Card><CardHeader title="Modèles de rapports" action="Voir tous" command={{ operation: 'report.queue', payload: { reportType: 'reports_catalog' } }}/><div className="grid gap-3 md:grid-cols-2">{['Tableau de bord exécutif','Rapport financier consolidé','Rapport qualité & sécurité','Rapport RH & social','Rapport opérations','Rapport admissions'].map((x,i)=><button type="button" onClick={() => openDirectionCommand({ title: `Préparer ${x}`, module: 'Rapports Direction', operation: 'report.queue', payload: { reportType: x, format: 'pdf' } })} key={x} className={cx(premiumButtonClass('secondary', 'h-auto flex-col items-start p-4 text-left'), 'rounded-2xl border-slate-100')}><p className="text-[12px] font-black text-slate-950">{x}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">Mensuel · Gouverné · A4</p><StatusChip tone={['blue','emerald','amber','violet','cyan','rose'][i] as DirectionTone}>Standard</StatusChip></button>)}</div><div className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]"><button type="button" onClick={() => openDirectionCommand({ title: 'Sélectionner modèle de rapport', module: 'Rapports Direction', operation: 'direction_action.create', payload: { field: 'report_model' } })} className={premiumButtonClass('secondary', 'px-3 text-[12px]')}>Sélectionner modèle⌄</button><button type="button" onClick={() => openDirectionCommand({ title: 'Choisir période de reporting', module: 'Rapports Direction', operation: 'direction_action.create', payload: { field: 'report_period' } })} className={premiumButtonClass('secondary', 'px-3 text-[12px]')}>Période⌄</button><button type="button" onClick={() => openDirectionCommand({ title: 'Choisir entités du rapport', module: 'Rapports Direction', operation: 'direction_action.create', payload: { field: 'report_entities' } })} className={premiumButtonClass('secondary', 'px-3 text-[12px]')}>Entités⌄</button><button type="button" onClick={() => openDirectionCommand({ title: 'Générer rapport directionnel', module: 'Rapports Direction', operation: 'report.queue', payload: { reportType: 'executive_board_pack', format: 'pdf' } })} className={premiumButtonClass('primary')}>Générer</button></div></Card>}
function GovernanceNotes(){return <Card><CardHeader title="Notes gouvernance" action="Voir tout" />{['Politique investissement 2025','Seuils d’engagement','Politique qualité & sécurité','Prochain comité direction'].map((x,i)=><div key={x} className="mb-4 rounded-2xl border border-slate-100 p-3"><StatusChip tone={i===1?'amber':'blue'}>{i===3?'07 juin':'Validé'}</StatusChip><p className="mt-2 text-[12px] font-black text-slate-950">{x}</p><p className="text-[11px] font-semibold text-slate-500">Preuve et historique disponibles</p></div>)}</Card>}
function ScheduledExports(){return <Card><CardHeader title="Exports planifiés" action="Voir tout" />{['Pack exécutif mensuel','Rapport financier consolidé','KPI Opérations hebdo','Rapport qualité mensuel','RH — Tableau social'].map(x=><p key={x} className="mb-2 flex justify-between border-b border-slate-100 pb-2 text-[12px] font-bold text-slate-700"><span>{x}</span><StatusChip tone="emerald">Actif</StatusChip></p>)}</Card>}
function ExportHistory(){return <Card><CardHeader title="Historique exports" action="Voir tout" />{['Pack exécutif — Mai 2025 PDF 24,8 Mo','Rapport financier — Avril 2025 PDF 18,6 Mo','Rapport opérations — S18 PDF 12,4 Mo','Rapport qualité — Avril PDF 9,7 Mo'].map(x=><p key={x} className="border-b border-slate-100 py-2 text-[12px] font-bold text-slate-700">{x} <button type="button" onClick={() => openDirectionCommand({ title: `Télécharger ${x}`, module: "Historique exports", operation: "export.queue", payload: { exportType: "historical_export", file: x } })} className={premiumButtonClass('micro', 'px-2 py-1 text-[10px]')}>⇩</button></p>)}</Card>}
function BoardPacks(){return <Card><CardHeader title="Packs conseil" action="Voir tout" />{['Pack Conseil — Mai 2025','Pack Conseil — Avril 2025','Pack Conseil — Mars 2025','Pack Conseil — T1 2025'].map(x=><p key={x} className="mb-3 flex justify-between rounded-2xl border border-slate-100 p-3 text-[12px] font-bold"><span>{x}</span><button type="button" onClick={() => openDirectionCommand({ title: `Télécharger ${x}`, module: "Packs conseil", operation: "export.queue", payload: { exportType: "board_pack", pack: x, format: "pdf" } })} className={premiumButtonClass('micro', 'px-3 py-1.5 text-[10px]')}>Télécharger</button></p>)}</Card>}
function PendingArbitrages(){return <Card><CardHeader title="Arbitrages en attente" action="Voir tout" />{['Affectation budget digital -2j','Choix prestataire transport 1j','Plan rénovation phase 2 4j','Revue grille salariale 6j','Harmonisation tarifs 2025 8j'].map((x,i)=><p key={x} className="mb-2 flex justify-between border-b border-slate-100 pb-2 text-[12px] font-bold text-slate-700"><span>{x.split(' ').slice(0,-1).join(' ')}</span><StatusChip tone={i===0?'rose':i===1?'amber':'slate'}>{x.split(' ').at(-1)}</StatusChip></p>)}</Card>}

function GovernanceView(){return <div className="space-y-5"><MetricStrip metrics={[{label:'Plan actif',value:'Command',trend:'Modules premium activés',tone:'blue',spark:[60,62,65,68,72,76]}, {label:'Crédits disponibles',value:'82%',trend:'Achat recommandé à 25%',tone:'emerald',spark:[90,88,86,84,82,80]}, {label:'Restrictions compte',value:'0',trend:'Compte opérationnel',tone:'emerald',spark:[5,4,3,2,1,0]}, {label:'Add-ons actifs',value:'7',trend:'ParentTrust, Finance, Reporting',tone:'violet',spark:[2,3,4,5,6,7]}]} /><div className="grid gap-5 xl:grid-cols-3"><Card><CardHeader title="Gouvernance & facturation"/><p className="text-[14px] font-semibold leading-7 text-slate-600">Ce cockpit conserve la visibilité permanente sur plan, crédits, restrictions, add-ons, actions consommant des crédits, exports premium et récupération de compte.</p></Card><FinanceSnapshot/><DecisionCenter/></div></div>}


function renderField(field: DirectionActionField, value: unknown, setValue: (key: string, value: unknown) => void) {
  const id = `direction-field-${field.key}`
  const baseClass = 'mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-[12px] font-semibold text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100'
  return (
    <label key={field.key} htmlFor={id} className={cx(field.type === 'textarea' ? 'md:col-span-2' : '', 'block rounded-2xl border border-slate-100 bg-white/70 p-3 shadow-[0_8px_20px_rgba(15,23,42,0.03)]')}>
      <span className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">{field.label}{field.required ? ' *' : ''}</span>
      {field.type === 'select' ? (
        <select id={id} value={String(value ?? field.defaultValue ?? '')} onChange={(event) => setValue(field.key, event.target.value)} className={baseClass}>
          {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea id={id} value={String(value ?? field.defaultValue ?? '')} onChange={(event) => setValue(field.key, event.target.value)} placeholder={field.placeholder} rows={4} className={baseClass} />
      ) : field.type === 'toggle' ? (
        <button type="button" onClick={() => setValue(field.key, !(value ?? field.defaultValue ?? false))} className={cx('mt-2 flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-[12px] font-black transition', (value ?? field.defaultValue) ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-600')}>
          <span>{(value ?? field.defaultValue) ? 'Activé' : 'Désactivé'}</span>
          <span className={cx('h-6 w-11 rounded-full p-1 transition', (value ?? field.defaultValue) ? 'bg-emerald-500' : 'bg-slate-300')}><span className={cx('block h-4 w-4 rounded-full bg-white transition', (value ?? field.defaultValue) ? 'translate-x-5' : 'translate-x-0')} /></span>
        </button>
      ) : (
        <input id={id} type={field.type === 'date' ? 'date' : 'text'} value={String(value ?? field.defaultValue ?? '')} onChange={(event) => setValue(field.key, event.target.value)} placeholder={field.placeholder} className={baseClass} />
      )}
      {field.help ? <span className="mt-2 block text-[10px] font-semibold text-slate-500">{field.help}</span> : null}
    </label>
  )
}

function EnterpriseModalBody({ definition, formState, setValue }: { definition: DirectionActionDefinition; formState: Record<string, unknown>; setValue: (key: string, value: unknown) => void }) {
  const modalLabels: Record<DirectionActionModalType, string> = {
    period_selector: 'Période, comparaison et lecture des indicateurs',
    site_selector: 'Périmètre réseau, villes, sites et groupes sauvegardés',
    alert_center: 'Alertes, assignations, escalades et traitement',
    command_palette: 'Commandes intelligentes et actions recommandées',
    create_action: 'Action directionnelle suivie, assignée et prouvée',
    launch_control: 'Contrôle gouverné avec grille, responsable et échéance',
    risk_register: 'Registre des risques, mitigation et suivi directionnel',
    report_center: 'Rapports, aperçu A4, destinataires et planification',
    export_center: 'Export, téléchargement, preuve et archivage',
    report_builder: 'Construction de rapport exécutif ou board pack',
    detail_drawer: 'Détail contextualisé avec filtres et actions liées',
    decision_approval: 'Validation, refus, preuve et suite opérationnelle',
    escalation_drawer: 'Escalade formelle, SLA et responsable',
    mobile_quick_action: 'Action mobile courte, prouvée et synchronisée',
    success_proof: 'Confirmation et preuve de traitement',
  }
  return (
    <div className="mt-5 space-y-5">
      <div className="rounded-[1.4rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">Workflow entreprise</p>
        <h3 className="mt-1 text-[15px] font-black text-slate-950">{modalLabels[definition.modalType]}</h3>
        <p className="mt-2 text-[12px] font-semibold leading-6 text-slate-600">{definition.purpose}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {definition.steps.map((step) => (
          <div key={step.title} className={cx('rounded-2xl border p-4', toneStyles[step.tone].border, toneStyles[step.tone].soft)}>
            <p className={cx('text-[11px] font-black', toneStyles[step.tone].text)}>{step.title}</p>
            <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-600">{step.description}</p>
            <ul className="mt-3 space-y-1">
              {step.items.map((item) => <li key={item} className="text-[10px] font-bold text-slate-600">✓ {item}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {definition.previewCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
            <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-400">{card.label}</p>
            <p className={cx('mt-1 text-[13px] font-black', toneStyles[card.tone].text)}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Configuration de l’action</p>
            <h3 className="mt-1 text-[14px] font-black text-slate-950">Champs opérationnels</h3>
          </div>
          <StatusChip tone="blue">{definition.entitlementLabel}</StatusChip>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {definition.fields.map((field) => renderField(field, formState[field.key], setValue))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
        <div className="rounded-[1.35rem] border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Résumé client</p>
          <p className="mt-2 text-[12px] font-semibold leading-6 text-slate-600">Cette opération est préparée avec contexte, périmètre, responsable, règles de gouvernance et preuve attendue. Après confirmation, elle sera transmise au cockpit pour enregistrement, suivi et rafraîchissement de la vue.</p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Type de traitement</p><p className="mt-1 text-[12px] font-black text-slate-800">{definition.label}</p></div>
            <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Priorité</p><p className="mt-1 text-[12px] font-black text-slate-800">{definition.priority}</p></div>
            <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Preuve</p><p className="mt-1 text-[12px] font-black text-slate-800">{definition.proofLabel}</p></div>
          </div>
        </div>
        <div className="rounded-[1.35rem] border border-blue-100 bg-blue-50/70 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-700">Suites recommandées</p>
          <div className="mt-3 space-y-2">
            {definition.recommendedNextActions.map((action) => (
              <button key={action} type="button" onClick={() => setValue('recommendedNextAction', action)} className={cx('w-full rounded-2xl border px-3 py-3 text-left text-[11px] font-black transition', formState.recommendedNextAction === action ? 'border-blue-300 bg-white text-blue-800 shadow-sm' : 'border-blue-100 bg-white/70 text-slate-700 hover:border-blue-200 hover:bg-white')}>{action}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ActionModal({
  draft,
  onClose,
  onExecute,
  execution,
}: {
  draft: ActionDraft
  onClose: () => void
  onExecute: (formState: Record<string, unknown>) => void
  execution: ExecutionState
}) {
  const definition = useMemo(() => resolveDirectionActionDefinition({
    buttonId: draft?.buttonId,
    modalType: draft?.modalType,
    operation: draft?.operation || String(draft?.payload?.operation || ''),
    title: draft?.title,
    module: draft?.module,
    payload: draft?.payload,
  }), [draft])

  const [formState, setFormState] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (!draft) return
    const initial: Record<string, unknown> = {}
    for (const field of definition.fields) initial[field.key] = draft.payload?.[field.key] ?? field.defaultValue ?? ''
    initial.contextTitle = draft.title
    initial.contextModule = draft.module
    setFormState(initial)
  }, [draft, definition])

  if (!draft) return null

  const setValue = (key: string, value: unknown) => setFormState((current) => ({ ...current, [key]: value }))
  const modalSize = ['alert_center', 'command_palette', 'report_builder', 'detail_drawer'].includes(definition.modalType) ? 'max-w-5xl' : 'max-w-4xl'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-500/20 p-4 backdrop-blur-sm">
      <div className={cx('max-h-[92vh] w-full overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_34px_90px_rgba(15,23,42,0.24)]', modalSize)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">Vérification avant exécution</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">{definition.label}</h2>
            <p className="mt-2 max-w-3xl text-[13px] font-semibold leading-6 text-slate-500">{draft.impact || definition.purpose}</p>
          </div>
          <button type="button" onClick={onClose} className={premiumButtonClass('modalSecondary', 'h-11 w-11 rounded-2xl px-0 py-0 text-sm')}>×</button>
        </div>

        <EnterpriseModalBody definition={definition} formState={formState} setValue={setValue} />

        {execution.status !== 'idle' ? (
          <div className={cx('mt-5 rounded-2xl border p-4 text-[12px] font-bold', execution.status === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : execution.status === 'blocked' ? 'border-amber-200 bg-amber-50 text-amber-900' : execution.status === 'error' ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-blue-200 bg-blue-50 text-blue-900')}>
            <p>{execution.message || (execution.status === 'running' ? 'Traitement en cours…' : 'Résultat reçu.')}</p>
            {execution.proofReference ? <p className="mt-1">{definition.proofLabel} : {execution.proofReference}</p> : null}
            {execution.status === 'success' ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={onClose} className={premiumButtonClass('micro')}>Revenir au cockpit</button>
                <button type="button" onClick={() => setValue('recommendedNextAction', definition.recommendedNextActions[0] || 'Voir historique')} className={premiumButtonClass('micro')}>Préparer l’étape suivante</button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
          <button type="button" onClick={onClose} className={premiumButtonClass('modalSecondary')}>Retour au cockpit</button>
          <button type="button" disabled={execution.status === 'running'} onClick={() => onExecute(formState)} className={premiumButtonClass('modalPrimary')}>
            {execution.status === 'running' ? 'Traitement…' : definition.submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Ac360DirectionCockpitPage({ initialView }: Props) {
  const activeView = useMemo(() => resolveDirectionView(initialView), [initialView])
  const [draft, setDraft] = useState<ActionDraft>(null)
  const [liveDashboard, setLiveDashboard] = useState<LiveDirectionDashboard | null>(null)
  const [liveLoading, setLiveLoading] = useState(true)
  const [execution, setExecution] = useState<ExecutionState>({ status: 'idle' })
  const [localContext, setLocalContext] = useState<DirectionCockpitLocalContext>(defaultDirectionLocalContext)

  useEffect(() => {
    let alive = true
    setLiveLoading(true)
    fetch(`/api/ac360/customer/cockpit-direction?view=${activeView}`, { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (alive) setLiveDashboard(data)
      })
      .catch((error) => {
        if (alive) setLiveDashboard({ ok: false, databaseReady: false, errors: [{ message: error instanceof Error ? error.message : 'Connexion momentanément limitée' }] })
      })
      .finally(() => {
        if (alive) setLiveLoading(false)
      })
    return () => { alive = false }
  }, [activeView])

  const executeDraft = async (formState: Record<string, unknown> = {}) => {
    if (!draft) return
    const definition = resolveDirectionActionDefinition({
      buttonId: draft.buttonId,
      modalType: draft.modalType,
      operation: draft.operation || String(draft.payload.operation || ''),
      title: draft.title,
      module: draft.module,
      payload: draft.payload,
    })

    if (definition.executionMode === 'local_context') {
      setExecution({ status: 'running', message: 'Application du contexte de pilotage…' })
      const nextContext: DirectionCockpitLocalContext = {
        ...localContext,
        periodPreset: String(formState.periodPreset || localContext.periodPreset),
        compareWith: String(formState.compareWith || localContext.compareWith),
        customStart: typeof formState.customStart === 'string' ? formState.customStart : localContext.customStart,
        customEnd: typeof formState.customEnd === 'string' ? formState.customEnd : localContext.customEnd,
        scopeMode: String(formState.scopeMode || localContext.scopeMode),
        city: String(formState.city || localContext.city),
        compareSites: typeof formState.compareSites === 'boolean' ? formState.compareSites : localContext.compareSites,
        saveView: typeof formState.saveView === 'boolean' ? formState.saveView : localContext.saveView,
      }
      setLocalContext(nextContext)
      setExecution({
        status: 'success',
        message: definition.operation === 'direction_context.period.update'
          ? `Période appliquée : ${nextContext.periodPreset}. Les indicateurs du cockpit sont recalculés dans la vue courante.`
          : `Périmètre appliqué : ${nextContext.scopeMode}${nextContext.city && nextContext.city !== 'Tous' ? ` · ${nextContext.city}` : ''}. Les vues et comparaisons utilisent ce contexte.`,
        proofReference: `CTX-${Date.now().toString(36).toUpperCase()}`,
        result: { ok: true, localContext: nextContext, operation: definition.operation, localOnly: true },
      })
      return
    }

    setExecution({ status: 'running', message: 'Vérification du compte, des droits, du périmètre, des règles de gouvernance et de la preuve…' })
    try {
      const requestPayload = buildDirectionExecutionPayload({
        definition,
        sourceView: activeView,
        title: draft.title || definition.label,
        moduleKey: draft.module || definition.module,
        basePayload: {
          ...draft.payload,
          cockpitContext: localContext,
        },
        formState,
      })
      const response = await fetch('/api/ac360/customer/cockpit-direction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(requestPayload),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || result?.ok === false) {
        const blocked = Boolean(result?.ac360?.blocked || isContextResolutionProblem(result))
        setExecution({
          status: blocked ? 'blocked' : 'error',
          message: friendlyExecutionError(result, 'Action bloquée ou non exécutée.'),
          result,
        })
        return
      }
      setExecution({ status: 'success', message: definition.successMessage, proofReference: result?.proofReference, result })
      const refreshed = await fetch(`/api/ac360/customer/cockpit-direction?view=${activeView}`, { cache: 'no-store' }).then((res) => res.json()).catch(() => null)
      if (refreshed) setLiveDashboard(refreshed)
    } catch (error) {
      setExecution({ status: 'error', message: error instanceof Error ? friendlyExecutionError({ error: error.message }, error.message) : 'Action non finalisée : veuillez réessayer ou contacter AngelCare Success.' })
    }
  }

  const openDraft = (next: ActionDraft) => {
    setExecution({ status: 'idle' })
    setDraft(next)
  }

  const closeDraft = () => {
    setDraft(null)
    setExecution({ status: 'idle' })
  }

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<NonNullable<ActionDraft>>).detail
      if (detail?.title) openDraft(detail)
    }
    window.addEventListener('ac360:direction-command', handler)
    return () => window.removeEventListener('ac360:direction-command', handler)
  }, [])

  const content = {
    synthese: <ExecutiveView />,
    operations: <OperationsView />,
    finance: <FinanceView />,
    admissions: <AdmissionsView />,
    equipe: <HrView />,
    securite: <QualityView />,
    parents: <ParentTrustView />,
    rapports: <ReportsView />,
    gouvernance: <GovernanceView />,
    aujourdhui: <OperationsView />,
    risques: <QualityView />,
    decisions: <ReportsView />,
    transport: <OperationsView />,
    automatisations: <GovernanceView />,
  }[activeView] || <ExecutiveView />

  return (
    <div data-ac360-direction-cockpit="true" className="min-h-screen bg-[#f8fafc] text-slate-950">
      <div className="flex min-h-screen">
        <Sidebar activeView={activeView} />
        <main className="min-w-0 flex-1">
          <TopBar />
          <div className="mx-auto max-w-[1840px] px-5 pb-8 2xl:px-7">
            <PageHeader view={activeView} onAction={openDraft} />
            <RuntimeRealityStrip live={liveDashboard} loading={liveLoading} />
            <RealityHardeningBar activeView={activeView} live={liveDashboard} />
            {content}
            <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-[11px] font-bold text-slate-500">
              <span>Données consolidées pour 14 crèches au Maroc</span>
              <span>Dernière clôture comptable : 30 avril 2025</span>
              <span>🔒 Toutes les données sont sécurisées et conformes à la loi 09-08</span>
            </footer>
          </div>
        </main>
      </div>
      <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 gap-2 rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur-xl xl:hidden">
        {['Valider', 'Relancer', 'Escalader', 'Rapport'].map((item) => <button type="button" key={item} onClick={() => openDirectionCommand({ title: `${item} depuis dock mobile`, module: 'Dock mobile direction', operation: item === 'Rapport' ? 'report.queue' : item === 'Escalader' ? 'escalation.open' : 'direction_action.create', priority: item === 'Escalader' ? 'high' : 'normal', payload: { mobileDock: true, actionLabel: item, sourceView: activeView } })} className={premiumButtonClass('mobile')}>{item}</button>)}
      </div>
      <Ac360DirectionDistinctEnterpriseModal draft={draft} onClose={closeDraft} onExecute={executeDraft} execution={execution} />
    </div>
  )
}
