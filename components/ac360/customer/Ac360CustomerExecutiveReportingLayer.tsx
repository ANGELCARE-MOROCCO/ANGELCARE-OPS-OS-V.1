'use client'

import { useMemo, useState } from 'react'
import type { Ac360CustomerLiveCockpit } from '@/lib/ac360/customer-live-data'
import { getAc360CustomerReportingProfile, type Ac360CustomerBoardPack } from '@/lib/ac360/customer-reporting-model'

type Tone = 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function toneClass(tone: Tone) {
  if (tone === 'emerald') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (tone === 'amber') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (tone === 'rose') return 'border-rose-200 bg-rose-50 text-rose-800'
  if (tone === 'violet') return 'border-violet-200 bg-violet-50 text-violet-800'
  if (tone === 'slate') return 'border-slate-200 bg-slate-50 text-slate-700'
  return 'border-blue-200 bg-blue-50 text-blue-800'
}

function SmallBadge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={cx('inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em]', className)}>{children}</span>
}

function statusLabel(status: Ac360CustomerBoardPack['status']) {
  if (status === 'pret') return 'prêt'
  if (status === 'a_completer') return 'à compléter'
  if (status === 'verrouille') return 'verrouillé'
  return 'recommandé'
}

function statusClass(status: Ac360CustomerBoardPack['status']) {
  if (status === 'pret') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (status === 'a_completer') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (status === 'verrouille') return 'border-rose-200 bg-rose-50 text-rose-800'
  return 'border-blue-200 bg-blue-50 text-blue-800'
}

function ReportingScore({ score }: { score: number }) {
  return (
    <div className="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-white p-5 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Score reporting</p>
      <div className="mt-4 flex items-end gap-2">
        <span className="text-5xl font-black tracking-[-0.06em] text-slate-950">{score}</span>
        <span className="pb-2 text-lg font-black text-slate-400">/100</span>
      </div>
      <div className="mt-4 h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-blue-700" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
      </div>
      <p className="mt-3 text-sm font-bold leading-6 text-slate-600">Mesure combinée : endpoints, crédits, restrictions, plan, preuves et capacité export.</p>
    </div>
  )
}

export function Ac360CustomerExecutiveReportingLayer({ selectedRole, activeModuleKey, live, compact = false }: { selectedRole: string; activeModuleKey: string; live: Ac360CustomerLiveCockpit | null; compact?: boolean }) {
  const [selectedPackId, setSelectedPackId] = useState('direction-weekly-board-pack')
  const [printMode, setPrintMode] = useState(false)
  const profile = useMemo(() => getAc360CustomerReportingProfile({ roleLabel: selectedRole, moduleKey: activeModuleKey, live }), [selectedRole, activeModuleKey, live])
  const selectedPack = profile.boardPacks.find((pack) => pack.id === selectedPackId) || profile.boardPacks[0]

  if (compact) {
    return (
      <section className="rounded-[2rem] border border-blue-100 bg-white p-4 shadow-sm" data-ac360-phase3n="executive-reporting-compact">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <SmallBadge className="border-blue-200 bg-blue-50 text-blue-800">Phase 3N · Reporting & exports</SmallBadge>
            <h3 className="mt-2 text-xl font-black text-slate-950">Reporting module : {profile.exportScore}%</h3>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{profile.reportingStatus} · board packs et vues A4 gouvernées.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.boardPackSignals.slice(0, 2).map((item) => <SmallBadge key={item.label} className={toneClass(item.tone)}>{item.label} · {item.value}</SmallBadge>)}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-6 rounded-[2.2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-7" data-ac360-phase3n="executive-reporting-export-center-board-packs">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-5xl">
          <div className="flex flex-wrap gap-2">
            <SmallBadge className="border-blue-200 bg-blue-50 text-blue-800">Phase 3N · Reporting exécutif</SmallBadge>
            <SmallBadge className="border-emerald-200 bg-emerald-50 text-emerald-800">Exports gouvernés</SmallBadge>
            <SmallBadge className="border-violet-200 bg-violet-50 text-violet-800">Board packs</SmallBadge>
            <SmallBadge className="border-amber-200 bg-amber-50 text-amber-800">Print-ready A4</SmallBadge>
          </div>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950">{profile.executiveTitle}</h2>
          <p className="mt-3 text-base font-semibold leading-8 text-slate-600">{profile.executiveSummary}</p>
          <p className="mt-3 rounded-3xl border border-blue-100 bg-blue-50 p-4 text-sm font-black leading-7 text-blue-900">Statut : {profile.reportingStatus} · chaque export doit rester lié aux droits, crédits, audit et preuves AC360.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setPrintMode((value) => !value)} className="rounded-2xl bg-blue-700 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-blue-800">{printMode ? 'Masquer print' : 'Mode print-ready'}</button>
          <button type="button" className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-800 hover:border-blue-200 hover:bg-blue-50">Préparer pack</button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[0.75fr_1.35fr]">
        <ReportingScore score={profile.exportScore} />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {profile.boardPackSignals.map((item) => (
            <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <SmallBadge className={toneClass(item.tone)}>{item.label}</SmallBadge>
              <p className="mt-3 text-2xl font-black text-slate-950">{item.value}</p>
              <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <SmallBadge className="border-violet-200 bg-violet-50 text-violet-800">Board packs client</SmallBadge>
              <h3 className="mt-3 text-2xl font-black text-slate-950">Packs comité, direction et reporting commercial.</h3>
            </div>
            <SmallBadge className={statusClass(selectedPack.status)}>{statusLabel(selectedPack.status)} · {selectedPack.readiness}%</SmallBadge>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {profile.boardPacks.map((pack) => (
              <button key={pack.id} type="button" onClick={() => setSelectedPackId(pack.id)} className={cx('rounded-3xl border p-4 text-left transition hover:border-blue-200 hover:bg-blue-50', selectedPackId === pack.id ? 'border-blue-300 bg-blue-50 ring-4 ring-blue-50' : 'border-slate-200 bg-white')}>
                <SmallBadge className={statusClass(pack.status)}>{statusLabel(pack.status)}</SmallBadge>
                <h4 className="mt-3 text-lg font-black text-slate-950">{pack.title}</h4>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{pack.audience}</p>
                <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-slate-400">{pack.cadence} · {pack.format}</p>
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-[2rem] border border-blue-100 bg-blue-50 p-5">
            <SmallBadge className="border-blue-200 bg-white text-blue-800">Pack sélectionné</SmallBadge>
            <h4 className="mt-3 text-xl font-black text-slate-950">{selectedPack.title}</h4>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-700">Preuve : {selectedPack.proof}</p>
            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {selectedPack.sections.map((section) => <span key={section} className="rounded-2xl border border-blue-100 bg-white p-3 text-xs font-black uppercase tracking-[0.12em] text-blue-900">{section}</span>)}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
            <SmallBadge className="border-blue-200 bg-white text-blue-800">Centre exports</SmallBadge>
            <div className="mt-4 space-y-3">
              {profile.exportCenter.map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <SmallBadge className={toneClass(item.tone)}>{item.format}</SmallBadge>
                    <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{item.frequency}</span>
                  </div>
                  <h4 className="mt-3 text-base font-black text-slate-950">{item.label}</h4>
                  <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{item.module} · owner {item.owner}</p>
                  <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-600">{item.governance}</p>
                  <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-blue-700">{item.billable}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {printMode ? (
        <div className="mt-5 rounded-[2rem] border border-amber-200 bg-amber-50 p-5" data-ac360-print-ready="a4-board-pack-views">
          <SmallBadge className="border-amber-200 bg-white text-amber-800">Print-ready views · A4</SmallBadge>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {profile.printViews.map((view) => (
              <div key={view.id} className="rounded-3xl border border-amber-100 bg-white p-4 shadow-sm">
                <h4 className="text-lg font-black text-slate-950">{view.title}</h4>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{view.purpose}</p>
                <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-slate-400">{view.pageFormat}</p>
                <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-600">Watermark : {view.watermark}</p>
                <div className="mt-3 flex flex-wrap gap-2">{view.sections.map((section) => <SmallBadge key={section} className="border-slate-200 bg-slate-50 text-slate-700">{section}</SmallBadge>)}</div>
                <p className="mt-3 text-xs font-bold leading-5 text-amber-800">{view.printRisk}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5">
          <SmallBadge className="border-emerald-200 bg-white text-emerald-800">Preuves gouvernance</SmallBadge>
          <div className="mt-3 space-y-2">{profile.governanceProof.map((item) => <p key={item} className="rounded-2xl bg-white p-3 text-sm font-bold leading-6 text-slate-700">{item}</p>)}</div>
        </div>
        <div className="rounded-[2rem] border border-violet-200 bg-violet-50 p-5">
          <SmallBadge className="border-violet-200 bg-white text-violet-800">Signaux commerciaux</SmallBadge>
          <div className="mt-3 space-y-2">{profile.commercialSignals.map((item) => <p key={item} className="rounded-2xl bg-white p-3 text-sm font-bold leading-6 text-slate-700">{item}</p>)}</div>
        </div>
        <div className="rounded-[2rem] border border-blue-200 bg-blue-50 p-5">
          <SmallBadge className="border-blue-200 bg-white text-blue-800">Actions recommandées</SmallBadge>
          <div className="mt-3 space-y-2">{profile.recommendedActions.map((item) => <p key={item} className="rounded-2xl bg-white p-3 text-sm font-bold leading-6 text-slate-700">{item}</p>)}</div>
        </div>
      </div>
    </section>
  )
}
