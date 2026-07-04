'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Ac360CustomerLiveCockpit } from '@/lib/ac360/customer-live-data'
import {
  ac360CustomerOnboardingTourSteps,
  buildAc360AdoptionSignals,
  getAc360GuidedEmptyState,
  getAc360PersonalizationProfile,
  type Ac360CustomerAdoptionSignalTone,
} from '@/lib/ac360/customer-adoption-model'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function toneClass(tone: Ac360CustomerAdoptionSignalTone) {
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

function useStoredTourState() {
  const [completed, setCompleted] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('ac360.phase3l.completedTourSteps')
      setCompleted(raw ? JSON.parse(raw) : [])
    } catch {
      setCompleted([])
    }
  }, [])

  const toggle = (key: string) => {
    setCompleted((current) => {
      const next = current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
      try {
        window.localStorage.setItem('ac360.phase3l.completedTourSteps', JSON.stringify(next))
      } catch {
        // Local personalization is optional; never block the cockpit.
      }
      return next
    })
  }

  return { completed, toggle }
}

export function Ac360CustomerPersonalizationAdoptionLayer({
  selectedRole,
  activeModuleKey,
  live,
  compact = false,
}: {
  selectedRole: string
  activeModuleKey: string
  live: Ac360CustomerLiveCockpit | null
  compact?: boolean
}) {
  const profile = useMemo(() => getAc360PersonalizationProfile(selectedRole), [selectedRole])
  const emptyState = useMemo(() => getAc360GuidedEmptyState(activeModuleKey), [activeModuleKey])
  const signals = useMemo(() => buildAc360AdoptionSignals(live, activeModuleKey), [live, activeModuleKey])
  const { completed, toggle } = useStoredTourState()
  const progress = Math.round((completed.length / ac360CustomerOnboardingTourSteps.length) * 100)

  if (compact) {
    return (
      <section id="adoption-intelligence" className="rounded-[2rem] border border-blue-100 bg-white p-5 shadow-sm" data-ac360-phase3l="compact-adoption-intelligence">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <SmallBadge className="border-blue-200 bg-blue-50 text-blue-800">Adoption guidée Phase 3L</SmallBadge>
            <h3 className="mt-3 text-2xl font-black tracking-[-0.03em] text-slate-950">Parcours personnalisé : {profile.label}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{profile.homePromise}</p>
          </div>
          <SmallBadge className="border-emerald-200 bg-emerald-50 text-emerald-800">{progress}% tour complété</SmallBadge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {signals.map((signal) => (
            <div key={signal.key} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <SmallBadge className={toneClass(signal.tone)}>{signal.label}</SmallBadge>
              <p className="mt-3 text-2xl font-black text-slate-950">{signal.value}</p>
              <p className="mt-2 text-xs font-bold leading-5 text-slate-600">{signal.nextAction}</p>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section id="adoption-intelligence" className="mt-6 rounded-[2rem] border border-blue-100 bg-white p-5 shadow-sm md:p-7" data-ac360-phase3l="personalization-onboarding-adoption">
      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="flex flex-wrap gap-2">
            <SmallBadge className="border-blue-200 bg-blue-50 text-blue-800">Phase 3L · Personnalisation client</SmallBadge>
            <SmallBadge className="border-emerald-200 bg-emerald-50 text-emerald-800">FR Maroc natif</SmallBadge>
            <SmallBadge className="border-slate-200 bg-slate-50 text-slate-700">Thème blanc premium</SmallBadge>
          </div>
          <h2 className="mt-5 text-4xl font-black tracking-[-0.04em] text-slate-950">Une expérience qui s’adapte au rôle, à l’adoption et aux modules réellement utilisés.</h2>
          <p className="mt-4 max-w-5xl text-lg font-semibold leading-8 text-slate-600">
            AngelCare 360 ne doit pas seulement afficher des modules. Le cockpit doit guider chaque établissement vers une routine opérationnelle claire : quoi faire maintenant, quoi débloquer, quoi automatiser, quoi former, quoi facturer et quoi prouver.
          </p>
        </div>
        <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-5">
          <SmallBadge className="border-blue-200 bg-white text-blue-800">Profil actif</SmallBadge>
          <h3 className="mt-3 text-2xl font-black text-slate-950">{profile.label}</h3>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{profile.mission}</p>
          <div className="mt-4 grid gap-2">
            <SmallBadge className="border-emerald-200 bg-white text-emerald-700">Densité : {profile.preferredDensity}</SmallBadge>
            <SmallBadge className="border-slate-200 bg-white text-slate-700">Modules prioritaires : {profile.primaryModules.length}</SmallBadge>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        {signals.map((signal) => (
          <div key={signal.key} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <SmallBadge className={toneClass(signal.tone)}>{signal.label}</SmallBadge>
            <p className="mt-3 text-3xl font-black text-slate-950">{signal.value}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{signal.detail}</p>
            <p className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 text-xs font-black leading-5 text-slate-700">{signal.nextAction}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SmallBadge className="border-violet-200 bg-violet-50 text-violet-800">Tour guidé intelligent</SmallBadge>
              <h3 className="mt-3 text-2xl font-black text-slate-950">{progress}% du parcours cockpit complété</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Le tour reste local et non bloquant. Il sert à transformer l’interface en routine d’adoption client.</p>
            </div>
            <div className="h-16 w-16 rounded-full border-8 border-blue-100 bg-white text-center text-sm font-black leading-[48px] text-blue-800">{progress}%</div>
          </div>
          <div className="mt-5 space-y-3">
            {ac360CustomerOnboardingTourSteps.map((step, index) => {
              const isDone = completed.includes(step.key)
              return (
                <button key={step.key} type="button" onClick={() => toggle(step.key)} className={cx('w-full rounded-3xl border p-4 text-left transition hover:border-blue-200 hover:bg-blue-50', isDone ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white')}>
                  <div className="flex gap-3">
                    <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black', isDone ? 'bg-emerald-600 text-white' : 'bg-blue-700 text-white')}>{isDone ? '✓' : index + 1}</span>
                    <span>
                      <span className="block text-sm font-black text-slate-950">{step.title}</span>
                      <span className="mt-1 block text-xs font-semibold leading-5 text-slate-600">{step.description}</span>
                      <span className="mt-2 inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{step.ownerRole} · {step.anchor}</span>
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <SmallBadge className="border-amber-200 bg-white text-amber-800">État vide guidé / module actif</SmallBadge>
          <h3 className="mt-3 text-2xl font-black text-slate-950">{emptyState.title}</h3>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{emptyState.description}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-3xl border border-amber-100 bg-white p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-700">Première action</p>
              <p className="mt-2 text-base font-black text-slate-950">{emptyState.firstAction}</p>
            </div>
            <div className="rounded-3xl border border-amber-100 bg-white p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-700">Action suivante</p>
              <p className="mt-2 text-base font-black text-slate-950">{emptyState.secondAction}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            <p className="rounded-2xl border border-emerald-200 bg-white p-3 text-sm font-bold leading-6 text-emerald-800">Preuve : {emptyState.proofSignal}</p>
            <p className="rounded-2xl border border-blue-200 bg-white p-3 text-sm font-bold leading-6 text-blue-800">Facturation : {emptyState.monetizationSignal}</p>
            <p className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold leading-6 text-slate-700">Récupération : {emptyState.recoveryPath}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
