'use client'

import { useMemo, useState } from 'react'
import type { Ac360CustomerLiveCockpit } from '@/lib/ac360/customer-live-data'
import { getAc360CustomerReadinessProfile } from '@/lib/ac360/customer-success-readiness-model'

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

function ScoreRing({ score }: { score: number }) {
  return (
    <div className="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-white p-5 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Score readiness</p>
      <div className="mt-4 flex items-end gap-2">
        <span className="text-5xl font-black tracking-[-0.06em] text-slate-950">{score}</span>
        <span className="pb-2 text-lg font-black text-slate-400">/100</span>
      </div>
      <div className="mt-4 h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-blue-700" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
      </div>
      <p className="mt-3 text-sm font-bold leading-6 text-slate-600">Mesure combinée : usage, runtime, formation, restrictions, crédits et discipline de preuve.</p>
    </div>
  )
}

export function Ac360CustomerSuccessReadinessLayer({ selectedRole, activeModuleKey, live, compact = false }: { selectedRole: string; activeModuleKey: string; live: Ac360CustomerLiveCockpit | null; compact?: boolean }) {
  const [trainingMode, setTrainingMode] = useState(true)
  const [reportOpen, setReportOpen] = useState(!compact)
  const profile = useMemo(() => getAc360CustomerReadinessProfile({ roleLabel: selectedRole, moduleKey: activeModuleKey, live }), [selectedRole, activeModuleKey, live])

  if (compact) {
    return (
      <section className="rounded-[2rem] border border-blue-100 bg-white p-4 shadow-sm" data-ac360-phase3m="success-readiness-compact">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <SmallBadge className="border-blue-200 bg-blue-50 text-blue-800">Phase 3M · Adoption & training</SmallBadge>
            <h3 className="mt-2 text-xl font-black text-slate-950">Readiness module : {profile.score}%</h3>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{profile.readinessLabel} · {profile.successOwner}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.reportCards.slice(0, 2).map((item) => <SmallBadge key={item.label} className={toneClass(item.tone)}>{item.label} · {item.value}</SmallBadge>)}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-6 rounded-[2.2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-7" data-ac360-phase3m="success-readiness-adoption-reporting">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-5xl">
          <div className="flex flex-wrap gap-2">
            <SmallBadge className="border-blue-200 bg-blue-50 text-blue-800">Phase 3M · Customer Success Readiness</SmallBadge>
            <SmallBadge className="border-emerald-200 bg-emerald-50 text-emerald-800">Formation guidée</SmallBadge>
            <SmallBadge className="border-violet-200 bg-violet-50 text-violet-800">Rapport adoption</SmallBadge>
          </div>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950">Readiness, usage analytics et adoption réelle.</h2>
          <p className="mt-3 text-base font-semibold leading-8 text-slate-600">{profile.executiveSummary}</p>
          <p className="mt-3 rounded-3xl border border-blue-100 bg-blue-50 p-4 text-sm font-black leading-7 text-blue-900">Rituel recommandé : {profile.weeklyRitual}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setTrainingMode((value) => !value)} className="rounded-2xl bg-blue-700 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-blue-800">{trainingMode ? 'Masquer training' : 'Activer training'}</button>
          <button type="button" onClick={() => setReportOpen((value) => !value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-800 hover:border-blue-200 hover:bg-blue-50">{reportOpen ? 'Réduire rapport' : 'Ouvrir rapport'}</button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[0.75fr_1.35fr]">
        <ScoreRing score={profile.score} />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {profile.usageAnalytics.map((item) => (
            <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <SmallBadge className={toneClass(item.tone)}>{item.label}</SmallBadge>
              <p className="mt-3 text-2xl font-black text-slate-950">{item.value}</p>
              <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {trainingMode ? (
        <div className="mt-5 rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <SmallBadge className="border-blue-200 bg-white text-blue-800">Mode formation client</SmallBadge>
              <h3 className="mt-3 text-2xl font-black text-slate-950">Parcours guidé pour {profile.successOwner}</h3>
            </div>
            <SmallBadge className="border-slate-200 bg-white text-slate-700">Preuve requise avant adoption réelle</SmallBadge>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {profile.trainingMode.map((step, index) => (
              <div key={step.id} className="rounded-3xl border border-blue-100 bg-white p-4 shadow-sm">
                <SmallBadge className="border-blue-200 bg-blue-50 text-blue-800">Étape {index + 1} · {step.duration}</SmallBadge>
                <h4 className="mt-3 text-lg font-black text-slate-950">{step.title}</h4>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{step.detail}</p>
                <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-slate-400">Owner · {step.owner}</p>
                <p className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-600">Preuve : {step.proof}</p>
                <button type="button" className="mt-3 w-full rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-800 hover:bg-blue-100">{step.actionLabel}</button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {reportOpen ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <SmallBadge className="border-violet-200 bg-violet-50 text-violet-800">Rapport adoption & usage · Score adoption</SmallBadge>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {profile.reportCards.map((item) => (
                <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <SmallBadge className={toneClass(item.tone)}>{item.label}</SmallBadge>
                  <p className="mt-3 text-lg font-black text-slate-950">{item.value}</p>
                  <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{item.detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {profile.adoptionSignals.map((item) => (
                <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-4">
                  <SmallBadge className={toneClass(item.tone)}>{item.label}</SmallBadge>
                  <p className="mt-2 text-base font-black text-slate-950">{item.value}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5">
              <SmallBadge className="border-amber-200 bg-white text-amber-800">Friction & recovery</SmallBadge>
              <div className="mt-3 space-y-2">
                {profile.blockedFriction.map((item) => <p key={item} className="rounded-2xl bg-white p-3 text-sm font-bold leading-6 text-slate-700">{item}</p>)}
              </div>
            </div>
            <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5">
              <SmallBadge className="border-emerald-200 bg-white text-emerald-800">Preuves gouvernance</SmallBadge>
              <div className="mt-3 space-y-2">
                {profile.governanceProof.map((item) => <p key={item} className="rounded-2xl bg-white p-3 text-sm font-bold leading-6 text-slate-700">{item}</p>)}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
        <SmallBadge className="border-blue-200 bg-white text-blue-800">Actions recommandées Success</SmallBadge>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {profile.recommendedActions.map((action) => <div key={action} className="rounded-3xl border border-slate-200 bg-white p-4 text-sm font-black leading-6 text-slate-700 shadow-sm">{action}</div>)}
        </div>
      </div>
    </section>
  )
}
