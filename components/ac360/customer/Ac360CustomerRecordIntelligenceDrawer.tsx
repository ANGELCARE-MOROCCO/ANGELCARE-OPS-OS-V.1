'use client'

import type { Ac360DedicatedModuleRoute } from '@/lib/ac360/customer-module-routes'
import type { Ac360CustomerLiveRecord } from '@/lib/ac360/customer-live-records-model'
import { buildAc360CustomerRecordIntelligence, type Ac360RecordTimelineEvent, type Ac360RecordContextualAction } from '@/lib/ac360/customer-record-intelligence'
import { getAc360CustomerCommandsForModule, getAc360PrimaryCustomerCommand, type Ac360CustomerCommand } from '@/lib/ac360/customer-command-model'

type Tone = Ac360RecordTimelineEvent['tone']

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function SmallBadge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={cx('inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em]', className)}>{children}</span>
}

function toneClass(tone: Tone) {
  if (tone === 'emerald') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (tone === 'amber') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (tone === 'rose') return 'border-rose-200 bg-rose-50 text-rose-800'
  if (tone === 'violet') return 'border-violet-200 bg-violet-50 text-violet-800'
  if (tone === 'slate') return 'border-slate-200 bg-slate-50 text-slate-700'
  return 'border-blue-200 bg-blue-50 text-blue-800'
}

function priorityClass(priority: Ac360RecordContextualAction['priority']) {
  if (priority === 'immédiate') return 'border-rose-200 bg-rose-50 text-rose-800'
  if (priority === 'haute') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (priority === 'automatisable') return 'border-violet-200 bg-violet-50 text-violet-800'
  return 'border-blue-200 bg-blue-50 text-blue-800'
}

export function Ac360CustomerRecordIntelligenceDrawer({
  route,
  record,
  onClose,
  onOpenCommand,
}: {
  route: Ac360DedicatedModuleRoute
  record: Ac360CustomerLiveRecord
  onClose: () => void
  onOpenCommand: (command: Ac360CustomerCommand) => void
}) {
  const intelligence = buildAc360CustomerRecordIntelligence(route, record)
  const commands = getAc360CustomerCommandsForModule(route.moduleKey)
  const primaryCommand = commands[0] || getAc360PrimaryCustomerCommand(route.moduleKey)

  return (
    <section className="rounded-[2rem] border border-blue-200 bg-white p-5 shadow-sm md:p-6" data-ac360-phase3i="record-intelligence-drawer">
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="flex flex-wrap gap-2">
            <SmallBadge className="border-blue-200 bg-blue-50 text-blue-800">Phase 3I · Détail live intelligent</SmallBadge>
            <SmallBadge className={record.source === 'live' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}>{intelligence.healthLabel}</SmallBadge>
            <SmallBadge className="border-slate-200 bg-slate-50 text-slate-700">{intelligence.recordRef}</SmallBadge>
          </div>
          <h3 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950">{intelligence.title}</h3>
          <p className="mt-3 max-w-5xl text-sm font-semibold leading-7 text-slate-600">{intelligence.executiveSummary}</p>
          <div className="mt-4 rounded-3xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-800">Prochaine meilleure action</p>
            <p className="mt-2 text-base font-black leading-7 text-slate-950">{intelligence.nextBestAction}</p>
          </div>
        </div>
        <div className="rounded-[1.8rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Résumé gouvernance record</p>
          <div className="mt-3 grid gap-2">
            {intelligence.relatedRecords.map((item) => (
              <span key={item} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">{item}</span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <SmallBadge className="border-amber-200 bg-amber-50 text-amber-800">Risque : {intelligence.riskLevel}</SmallBadge>
            <SmallBadge className="border-emerald-200 bg-emerald-50 text-emerald-800">Preuve : {intelligence.proofReference}</SmallBadge>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[1.8rem] border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Chronologie métier & preuve</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">Lecture auditée du record, de sa source et de son prochain traitement.</p>
            </div>
            <SmallBadge className="border-blue-200 bg-blue-50 text-blue-800">timeline record</SmallBadge>
          </div>
          <div className="mt-4 space-y-3">
            {intelligence.timeline.map((event, index) => (
              <div key={`${event.label}-${index}`} className="grid grid-cols-[34px_1fr] gap-3">
                <div className="flex flex-col items-center">
                  <span className={cx('flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-black', toneClass(event.tone))}>{index + 1}</span>
                  {index < intelligence.timeline.length - 1 ? <span className="mt-1 h-full min-h-[20px] w-px bg-slate-200" /> : null}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-black text-slate-950">{event.label}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{event.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-blue-100 bg-blue-50 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-800">Actions contextuelles intelligentes</p>
          <div className="mt-4 space-y-3">
            {intelligence.actions.map((action) => (
              <button key={action.label} type="button" onClick={() => onOpenCommand(primaryCommand)} className="block w-full rounded-3xl border border-blue-100 bg-white p-4 text-left transition hover:border-blue-300 hover:shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-black text-slate-950">{action.label}</p>
                  <SmallBadge className={priorityClass(action.priority)}>{action.priority}</SmallBadge>
                </div>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{action.detail}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <SmallBadge className="border-slate-200 bg-slate-50 text-slate-700">{action.guardSignal}</SmallBadge>
                  <SmallBadge className="border-amber-200 bg-amber-50 text-amber-800">{action.billingSignal}</SmallBadge>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Facturation & usage</p>
          <div className="mt-3 space-y-2">{intelligence.billingImpact.map((item) => <p key={item} className="text-xs font-bold leading-5 text-slate-600">• {item}</p>)}</div>
        </div>
        <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Gouvernance</p>
          <div className="mt-3 space-y-2">{intelligence.governance.map((item) => <p key={item} className="text-xs font-bold leading-5 text-slate-600">• {item}</p>)}</div>
        </div>
        <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Signaux audit</p>
          <div className="mt-3 space-y-2">{intelligence.auditSignals.map((item) => <p key={item} className="text-xs font-bold leading-5 text-slate-600">• {item}</p>)}</div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={() => onOpenCommand(primaryCommand)} className="rounded-2xl bg-blue-700 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-blue-800">Ouvrir commande gardée</button>
        <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-700 hover:border-blue-200 hover:bg-blue-50">Fermer détail</button>
      </div>
    </section>
  )
}
