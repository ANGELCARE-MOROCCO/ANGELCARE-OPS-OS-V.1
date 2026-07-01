'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ac360CustomerModules,
  ac360ExperiencePrinciples,
  ac360GrowthOffers,
  ac360RoleExperiences,
  type Ac360CustomerModule,
  type Ac360CustomerModuleStatus,
} from '@/lib/ac360/customer-ui-model'
import { getAc360DedicatedModuleRouteByModuleKey } from '@/lib/ac360/customer-module-routes'
import { Ac360CustomerModuleWorkspace } from './Ac360CustomerModuleWorkspace'
import {
  ac360CustomerLiveEndpoints,
  getAc360ModuleLiveSignal,
  loadAc360CustomerLiveCockpit,
  type Ac360CustomerLiveCockpit,
} from '@/lib/ac360/customer-live-data'

const statusStyles: Record<Ac360CustomerModuleStatus, string> = {
  included: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  addon: 'border-blue-200 bg-blue-50 text-blue-800',
  metered: 'border-amber-200 bg-amber-50 text-amber-800',
  governed: 'border-slate-200 bg-slate-50 text-slate-800',
  enterprise: 'border-violet-200 bg-violet-50 text-violet-800',
  watch: 'border-rose-200 bg-rose-50 text-rose-800',
  service: 'border-cyan-200 bg-cyan-50 text-cyan-800',
}

const riskStyles: Record<Ac360CustomerModule['riskLevel'], string> = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
}

const statusLabels: Record<Ac360CustomerModuleStatus, string> = {
  included: 'inclus',
  addon: 'add-on',
  metered: 'à l’usage',
  governed: 'gouverné',
  enterprise: 'entreprise',
  watch: 'surveillance',
  service: 'service',
}

const riskLabels: Record<Ac360CustomerModule['riskLevel'], string> = {
  low: 'faible',
  medium: 'moyen',
  high: 'élevé',
  critical: 'critique',
}

const offerStatusLabels: Record<string, string> = {
  active: 'actif',
  recommended: 'recommandé',
  available: 'disponible',
  locked: 'verrouillé',
  metered: 'à l’usage',
}

function groupedModules() {
  return ac360CustomerModules.reduce<Record<string, Ac360CustomerModule[]>>((acc, module) => {
    acc[module.group] = acc[module.group] || []
    acc[module.group].push(module)
    return acc
  }, {})
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function formatTime(iso?: string) {
  if (!iso) return 'non synchronisé'
  try {
    return new Intl.DateTimeFormat('fr-MA', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
  } catch {
    return 'non synchronisé'
  }
}

function SmallBadge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em]', className)}>
      {children}
    </span>
  )
}

function Meter({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>
        <span className="text-sm font-black text-slate-950">{value}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-700" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-500">{detail}</p>
    </div>
  )
}

function CommandButton({ children, variant = 'primary', onClick }: { children: React.ReactNode; variant?: 'primary' | 'secondary' | 'ghost'; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-[0.14em] shadow-sm transition hover:-translate-y-0.5',
        variant === 'primary' && 'bg-blue-700 text-white hover:bg-blue-800',
        variant === 'secondary' && 'border border-slate-200 bg-white text-slate-900 hover:border-blue-200 hover:bg-blue-50',
        variant === 'ghost' && 'border border-transparent bg-slate-50 text-slate-700 hover:border-slate-200 hover:bg-white',
      )}
    >
      {children}
    </button>
  )
}

function LiveStateBadge({ live, compact = false }: { live: Ac360CustomerLiveCockpit | null; compact?: boolean }) {
  const status = live?.status || 'idle'
  const label = status === 'connected' ? 'runtime connecté' : status === 'partial' ? 'runtime partiel' : status === 'loading' ? 'chargement' : status === 'offline' ? 'fallback sécurisé' : 'initialisation'
  const style = status === 'connected'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : status === 'partial'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-slate-200 bg-white text-slate-600'
  return <SmallBadge className={style}>{compact ? label : `${label} · ${formatTime(live?.loadedAt)}`}</SmallBadge>
}

function moduleLiveHealth(module: Ac360CustomerModule, live: Ac360CustomerLiveCockpit | null) {
  const signal = getAc360ModuleLiveSignal(live, module.key)
  return Math.max(0, Math.min(100, module.healthScore + (signal?.healthDelta || 0)))
}

function moduleLiveMetric(module: Ac360CustomerModule, live: Ac360CustomerLiveCockpit | null) {
  const signal = getAc360ModuleLiveSignal(live, module.key)
  return signal?.secondaryMetric || module.secondaryMetric
}

function ModuleHealthCard({ module, active, live, onSelect }: { module: Ac360CustomerModule; active: boolean; live: Ac360CustomerLiveCockpit | null; onSelect: () => void }) {
  const signal = getAc360ModuleLiveSignal(live, module.key)
  const health = moduleLiveHealth(module, live)
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cx(
        'w-full rounded-3xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl',
        active ? 'border-blue-300 ring-4 ring-blue-50' : 'border-slate-200 hover:border-blue-200',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-sm font-black text-blue-800">
            {module.icon}
          </div>
          <div>
            <p className="text-sm font-black text-slate-950">{module.label}</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">{module.group}</p>
          </div>
        </div>
        <SmallBadge className={statusStyles[module.status]}>{statusLabels[module.status]}</SmallBadge>
      </div>
      <p className="mt-4 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">{module.headline}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Santé live</p>
          <p className="mt-1 text-xl font-black text-slate-950">{health}%</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Signal</p>
          <p className="mt-1 text-sm font-black text-slate-950">{moduleLiveMetric(module, live)}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
        <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{signal?.endpointLabel || 'Runtime module'}</span>
        <span className={cx('h-2.5 w-2.5 rounded-full', signal?.connected ? 'bg-emerald-500' : 'bg-amber-400')} />
      </div>
      {getAc360DedicatedModuleRouteByModuleKey(module.key) ? (
        <span className="mt-3 inline-flex rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-blue-800">Espace dédié Phase 3D prêt</span>
      ) : null}
    </button>
  )
}

function DeepNavigation({ module }: { module: Ac360CustomerModule }) {
  return (
    <div className="sticky top-[156px] z-10 -mx-2 overflow-x-auto border-y border-slate-200 bg-white/95 px-2 py-3 backdrop-blur">
      <div className="flex min-w-max gap-2">
        {module.deepNavigation.map((item, index) => (
          <a
            key={`${module.key}-${item}`}
            href={`#${module.key}-${item.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
            className={cx(
              'rounded-full border px-3 py-2 text-xs font-black transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800',
              index === 0 ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-600',
            )}
          >
            {item}
          </a>
        ))}
      </div>
    </div>
  )
}

function TopIntelligenceBar({ selectedRole, live, refreshing, onRefresh }: { selectedRole: string; live: Ac360CustomerLiveCockpit | null; refreshing: boolean; onRefresh: () => void }) {
  const context = live?.context
  const billing = live?.billing
  return (
    <div className="sticky top-[86px] z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1800px] items-center gap-4 px-5 py-3">
        <div className="flex min-w-[270px] items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-100 bg-blue-700 text-lg font-black text-white shadow-lg shadow-blue-100">
            AC
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-950">AngelCare 360</p>
            <p className="text-xs font-bold text-slate-500">{context?.orgName || 'Cockpit Opérationnel Client'}</p>
          </div>
        </div>

        <div className="hidden flex-1 items-center gap-2 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2.5 lg:flex">
          <span className="text-sm text-slate-400">⌘</span>
          <input
            className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
            placeholder="Recherche commande : trouver un élève, envoyer une relance, créer une facture, afficher les prospects chauds, activer ParentTrust..."
          />
          <SmallBadge className="border-slate-200 bg-white text-slate-500">Action globale</SmallBadge>
        </div>

        <div className="hidden items-center gap-2 xl:flex">
          <LiveStateBadge live={live} compact />
          <SmallBadge className="border-blue-200 bg-blue-50 text-blue-800">{context?.planName || 'Plan Command'}</SmallBadge>
          <SmallBadge className="border-emerald-200 bg-emerald-50 text-emerald-800">{billing?.creditPercent ?? 82}% crédits</SmallBadge>
          <SmallBadge className="border-amber-200 bg-amber-50 text-amber-800">{billing?.alertCount ?? 7} alertes</SmallBadge>
          <SmallBadge className="border-slate-200 bg-white text-slate-600">{selectedRole}</SmallBadge>
          <button type="button" onClick={onRefresh} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-600 hover:bg-blue-50 hover:text-blue-800">
            {refreshing ? 'Sync...' : 'Rafraîchir'}
          </button>
        </div>
      </div>
    </div>
  )
}

function LeftStrategicNavigation({ selectedKey, setSelectedKey, live }: { selectedKey: string; setSelectedKey: (key: string) => void; live: Ac360CustomerLiveCockpit | null }) {
  const groups = useMemo(groupedModules, [])
  return (
    <aside className="hidden w-[310px] shrink-0 border-r border-slate-200 bg-white xl:block">
      <div className="sticky top-[156px] h-[calc(100vh-156px)] overflow-y-auto p-4">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">Contexte établissement</p>
          <h2 className="mt-2 text-lg font-black text-slate-950">{live?.context.orgName || 'École Al Amal'}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{live?.context.campusName || 'Rabat Centre'} · {live?.context.academicYear || '2026/2027'} · {live?.context.accountStatus || 'actif'}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <SmallBadge className="border-emerald-200 bg-emerald-50 text-emerald-700">{live?.status === 'connected' ? 'Connecté' : 'Actif'}</SmallBadge>
            <SmallBadge className="border-blue-200 bg-blue-50 text-blue-700">{live?.billing.restrictionCount ? `${live.billing.restrictionCount} restrictions` : 'Aucun blocage dur'}</SmallBadge>
          </div>
        </div>

        <div className="mt-4 space-y-5">
          {Object.entries(groups).map(([group, modules]) => (
            <div key={group}>
              <p className="mb-2 px-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{group}</p>
              <div className="space-y-1.5">
                {modules.map((module) => {
                  const signal = getAc360ModuleLiveSignal(live, module.key)
                  return (
                    <button
                      key={module.key}
                      type="button"
                      onClick={() => setSelectedKey(module.key)}
                      className={cx(
                        'flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left transition',
                        selectedKey === module.key
                          ? 'border-blue-200 bg-blue-50 text-blue-900 shadow-sm'
                          : 'border-transparent bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50',
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-700">{module.icon}</span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-black">{module.label}</span>
                          <span className="block truncate text-[11px] font-bold text-slate-500">{moduleLiveMetric(module, live)}</span>
                        </span>
                      </span>
                      <span className={cx('ml-2 h-2.5 w-2.5 shrink-0 rounded-full', signal?.connected ? 'bg-emerald-500' : module.riskLevel === 'high' ? 'bg-orange-500' : module.riskLevel === 'critical' ? 'bg-rose-500' : 'bg-amber-400')} />
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

function RightContextRail({ module, live }: { module: Ac360CustomerModule; live: Ac360CustomerLiveCockpit | null }) {
  const signal = getAc360ModuleLiveSignal(live, module.key)
  return (
    <aside className="hidden w-[360px] shrink-0 border-l border-slate-200 bg-white 2xl:block">
      <div className="sticky top-[156px] h-[calc(100vh-156px)] overflow-y-auto p-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">Rail contextuel live</p>
              <h3 className="mt-2 text-xl font-black text-slate-950">{module.label}</h3>
            </div>
            <SmallBadge className={riskStyles[module.riskLevel]}>{riskLabels[module.riskLevel]}</SmallBadge>
          </div>
          <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">{module.strategicPurpose}</p>
        </div>

        <div className="mt-4 grid gap-3">
          <Meter label="Santé module" value={moduleLiveHealth(module, live)} detail={module.primaryMetric} />
          <Meter label="Readiness automatisation" value={module.key === 'automation' ? 64 : Math.max(50, moduleLiveHealth(module, live) - 12)} detail="Couverture workflow et maturité des prochaines actions" />
        </div>

        <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-800">Synchronisation runtime</p>
          <p className="mt-3 text-sm font-black text-slate-950">{signal?.statusText || 'Fallback contrôlé en attente de données'}</p>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-600">Source : {signal?.endpoint || 'endpoint module non chargé'} · Dernière sync : {formatTime(signal?.lastSync)}</p>
          {signal?.error ? <p className="mt-3 rounded-2xl border border-amber-200 bg-white p-3 text-xs font-bold text-amber-800">{signal.error}</p> : null}
        </div>

        <div className="mt-4 rounded-3xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-800">Intelligence facturation</p>
          <p className="mt-3 text-sm font-black text-slate-950">{module.planSignal}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{module.billingSignal}</p>
          {module.lockedState ? (
            <div className="mt-4 rounded-2xl border border-blue-200 bg-white p-3 text-sm font-bold text-blue-800">{module.lockedState}</div>
          ) : null}
        </div>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Actions prioritaires</p>
          <div className="mt-3 space-y-2">
            {module.nextBestActions.map((action) => (
              <div key={action} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold leading-5 text-slate-700">
                {action}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Couche audit / preuve</p>
          <div className="mt-4 space-y-3">
            {['Pré-contrôle guard prêt', 'Événement d’usage enregistré après exécution', 'Journal d’audit visible pour actions sensibles'].map((item) => (
              <div key={item} className="flex gap-3 text-sm font-bold text-slate-600">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}

function HeroCommandCenter({ selectedModule, live, refreshing, onRefresh, setSelectedKey }: { selectedModule: Ac360CustomerModule; live: Ac360CustomerLiveCockpit | null; refreshing: boolean; onRefresh: () => void; setSelectedKey: (key: string) => void }) {
  const executive = live?.executive
  return (
    <section id="command-center" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div>
          <div className="flex flex-wrap gap-2">
            <SmallBadge className="border-blue-200 bg-blue-50 text-blue-800">Phase 3B · Cockpit live</SmallBadge>
            <SmallBadge className="border-emerald-200 bg-emerald-50 text-emerald-800">Connecté aux endpoints Phase 1–2U</SmallBadge>
            <LiveStateBadge live={live} />
          </div>
          <h1 className="mt-5 max-w-5xl text-4xl font-black tracking-[-0.04em] text-slate-950 md:text-6xl">
            Le cockpit direction devient vivant : données runtime, alertes, crédits, restrictions et actions recommandées.
          </h1>
          <p className="mt-5 max-w-4xl text-lg font-semibold leading-8 text-slate-600">
            Phase 3B transforme la fondation visuelle en cockpit exécutif connecté : chaque module conserve son design premium, mais reçoit désormais un signal runtime, un état de synchronisation, un fallback sécurisé, des compteurs live et une lecture facturation / droits d’accès prête production.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <CommandButton onClick={onRefresh}>{refreshing ? 'Synchronisation...' : 'Rafraîchir le cockpit'}</CommandButton>
            <CommandButton variant="secondary" onClick={() => setSelectedKey('billing')}>Ouvrir le Growth Menu</CommandButton>
            <CommandButton variant="ghost" onClick={() => setSelectedKey('finance')}>Traiter les créances</CommandButton>
          </div>
        </div>
        <div className="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">Brief exécutif live</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              [executive?.activeStudents || '184', 'Élèves actifs'],
              [executive?.presentToday || '142', 'Présents aujourd’hui'],
              [executive?.overdueMad || '31K', 'MAD en retard'],
              [executive?.hotLeads || '6', 'Prospects chauds'],
              [executive?.staffGaps || '3', 'Manques staff'],
              [executive?.safetyAlerts || '2', 'Alertes sécurité'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                <p className="text-2xl font-black text-slate-950">{value}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
            {executive?.recommendedAction || 'Recommandé : activer Finance Power ou lancer l’automatisation des relances impayés pour réduire le risque de recouvrement.'}
          </div>
        </div>
      </div>

      <div className="mt-7 grid gap-3 md:grid-cols-5">
        <Meter label="Opérations" value={moduleLiveHealth(ac360CustomerModules.find((m) => m.key === 'attendance') || selectedModule, live)} detail="Opérations du jour synchronisées" />
        <Meter label="Finance" value={moduleLiveHealth(ac360CustomerModules.find((m) => m.key === 'finance') || selectedModule, live)} detail="Créances et paiements connectés" />
        <Meter label="ParentTrust" value={moduleLiveHealth(ac360CustomerModules.find((m) => m.key === 'parenttrust') || selectedModule, live)} detail="Voix parent et réputation" />
        <Meter label="Admissions" value={moduleLiveHealth(ac360CustomerModules.find((m) => m.key === 'admissions') || selectedModule, live)} detail="Pipeline et conversion" />
        <Meter label="Sécurité" value={moduleLiveHealth(ac360CustomerModules.find((m) => m.key === 'health-safety') || selectedModule, live)} detail="Incidents et conformité" />
      </div>

      <div className="mt-7 grid gap-3 lg:grid-cols-3">
        {ac360CustomerModules.slice(0, 6).map((module) => (
          <ModuleHealthCard key={module.key} module={module} live={live} active={selectedModule.key === module.key} onSelect={() => setSelectedKey(module.key)} />
        ))}
      </div>
    </section>
  )
}

function RuntimeCoveragePanel({ live }: { live: Ac360CustomerLiveCockpit | null }) {
  const results = live?.endpointResults || []
  const connectedCount = results.filter((result) => result.ok).length
  return (
    <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <SmallBadge className="border-emerald-200 bg-emerald-50 text-emerald-800">Matrice live runtime</SmallBadge>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.03em] text-slate-950">Couverture API client branchée sur les modules Phase 1–2U.</h2>
          <p className="mt-3 max-w-5xl text-base font-semibold leading-7 text-slate-600">
            Cette couche vérifie les endpoints opérationnels, sécurise les fallbacks et rend visible la synchronisation du cockpit sans casser l’expérience client en cas de donnée vide.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-right">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Endpoints connectés</p>
          <p className="mt-1 text-3xl font-black text-slate-950">{connectedCount}/{ac360CustomerLiveEndpoints.length}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {ac360CustomerLiveEndpoints.map((endpoint) => {
          const result = results.find((item) => item.key === endpoint.key)
          const ok = result?.ok
          return (
            <div key={endpoint.key} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-slate-950">{endpoint.label}</p>
                  <p className="mt-1 text-[11px] font-bold text-slate-500">{endpoint.endpoint}</p>
                </div>
                <span className={cx('mt-1 h-2.5 w-2.5 rounded-full', ok ? 'bg-emerald-500' : result ? 'bg-amber-400' : 'bg-slate-300')} />
              </div>
              <p className="mt-3 text-xs font-bold text-slate-600">{ok ? 'Synchronisé' : result?.error || 'En attente de chargement'}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function ModuleDetailWorkspace({ module, live }: { module: Ac360CustomerModule; live: Ac360CustomerLiveCockpit | null }) {
  const signal = getAc360ModuleLiveSignal(live, module.key)
  return (
    <section id={module.key} className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-4xl">
          <div className="flex flex-wrap gap-2">
            <SmallBadge className="border-slate-200 bg-slate-50 text-slate-700">{module.group}</SmallBadge>
            <SmallBadge className={statusStyles[module.status]}>{statusLabels[module.status]}</SmallBadge>
            <SmallBadge className={riskStyles[module.riskLevel]}>risque {riskLabels[module.riskLevel]}</SmallBadge>
            <SmallBadge className={signal?.connected ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}>{signal?.statusText || 'fallback sécurisé'}</SmallBadge>
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.03em] text-slate-950 md:text-5xl">{module.label}</h2>
          <p className="mt-3 text-lg font-semibold leading-8 text-slate-600">{module.headline}</p>
        </div>
        <div className="grid min-w-[280px] grid-cols-2 gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Principal</p>
            <p className="mt-2 text-lg font-black text-slate-950">{module.primaryMetric}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Runtime</p>
            <p className="mt-2 text-lg font-black text-slate-950">{moduleLiveMetric(module, live)}</p>
          </div>
        </div>
      </div>

      {getAc360DedicatedModuleRouteByModuleKey(module.key) ? (
        <div className="mt-5 rounded-3xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-800">Phase 3D · écran dédié disponible</p>
              <p className="mt-1 text-sm font-bold text-slate-700">Ouvrir la route opérationnelle complète avec table dense, commandes, timeline, droits, usage et audit.</p>
            </div>
            <a href={`/angelcare-360/customer/${getAc360DedicatedModuleRouteByModuleKey(module.key)?.slug}`} className="rounded-2xl bg-blue-700 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white shadow-sm hover:bg-blue-800">Ouvrir espace dédié</a>
          </div>
        </div>
      ) : null}

      <DeepNavigation module={module} />
      <Ac360CustomerModuleWorkspace module={module} live={live} />

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Workspace opérationnel connecté</p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">{module.strategicPurpose}</h3>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {module.viewModes.map((mode) => (
              <div key={mode} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-black text-slate-950">{mode}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">Mode prêt pour données live, filtres, actions contextuelles et audit.</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Actions de commandement</p>
            <div className="mt-4 space-y-2">
              {module.commandActions.map((action, index) => (
                <button key={action} type="button" className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left text-sm font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800">
                  <span>{action}</span>
                  <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Guard {index + 1}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-800">Couche commerciale / droits d’accès</p>
            <h4 className="mt-2 text-xl font-black text-slate-950">{module.planSignal}</h4>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{module.billingSignal}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <SmallBadge className="border-blue-200 bg-white text-blue-800">Droits intégrés</SmallBadge>
              <SmallBadge className="border-emerald-200 bg-white text-emerald-700">Audit prêt</SmallBadge>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Fonctions d’intelligence</p>
            <div className="mt-4 space-y-3">
              {module.intelligence.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function GrowthMenuMarketplace({ live }: { live: Ac360CustomerLiveCockpit | null }) {
  return (
    <section id="growth-menu" className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <SmallBadge className="border-blue-200 bg-blue-50 text-blue-800">Marketplace Growth Menu</SmallBadge>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950">Expansion liée à la facturation sans cacher la valeur.</h2>
          <p className="mt-3 max-w-4xl text-lg font-semibold leading-8 text-slate-600">
            L’interface client expose les add-ons comme une marketplace SaaS premium : valeur, prix, fonctionnalités débloquées, impact d’usage, règle d’annulation, préservation des données, packs Sérénité, droits d’accès et recommandations d’upgrade.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SmallBadge className="border-emerald-200 bg-emerald-50 text-emerald-800">{live?.billing.activeAddonCount ?? 9} add-ons actifs</SmallBadge>
          <SmallBadge className="border-amber-200 bg-amber-50 text-amber-800">{live?.billing.creditPercent ?? 82}% crédits</SmallBadge>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ac360GrowthOffers.map((offer) => (
          <div key={offer.key} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{offer.family}</p>
                <h3 className="mt-2 text-xl font-black text-slate-950">{offer.label}</h3>
              </div>
              <SmallBadge className={offer.status === 'recommended' ? 'border-blue-200 bg-blue-50 text-blue-800' : offer.status === 'metered' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-600'}>
                {offerStatusLabels[offer.status] || offer.status}
              </SmallBadge>
            </div>
            <p className="mt-4 text-2xl font-black text-blue-800">{offer.price}</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{offer.value}</p>
            <div className="mt-5 flex gap-2">
              <CommandButton variant={offer.status === 'recommended' ? 'primary' : 'secondary'}>Inspecter</CommandButton>
              <CommandButton variant="ghost">Préserver données</CommandButton>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function RoleExperienceSwitcher({ selectedRole, setSelectedRole }: { selectedRole: string; setSelectedRole: (role: string) => void }) {
  return (
    <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <SmallBadge className="border-slate-200 bg-slate-50 text-slate-700">Expérience client par rôle</SmallBadge>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.03em] text-slate-950">Chaque rôle voit une vérité opérationnelle différente.</h2>
          <p className="mt-3 max-w-4xl text-base font-semibold leading-7 text-slate-600">
            AngelCare 360 ne doit pas déverser tous les modules sur chaque utilisateur. Le shell est préparé pour les expériences Direction, Finance, Admissions, Enseignant et AngelCare Success.
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-3 lg:grid-cols-5">
        {ac360RoleExperiences.map((role) => (
          <button
            key={role.key}
            type="button"
            onClick={() => setSelectedRole(role.label)}
            className={cx(
              'rounded-3xl border p-4 text-left transition hover:-translate-y-1 hover:shadow-lg',
              selectedRole === role.label ? 'border-blue-300 bg-blue-50 ring-4 ring-blue-50' : 'border-slate-200 bg-white hover:border-blue-200',
            )}
          >
            <p className="text-sm font-black text-slate-950">{role.label}</p>
            <p className="mt-2 min-h-[72px] text-xs font-semibold leading-5 text-slate-600">{role.description}</p>
            <SmallBadge className="mt-3 border-slate-200 bg-slate-50 text-slate-600">{role.homeView}</SmallBadge>
          </button>
        ))}
      </div>
    </section>
  )
}

function ComplianceStrip() {
  return (
    <section className="mt-6 rounded-[2rem] border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-slate-50 p-5 shadow-sm md:p-7">
      <SmallBadge className="border-blue-200 bg-white text-blue-800">Engagement verrouillé</SmallBadge>
      <h2 className="mt-4 text-3xl font-black tracking-[-0.03em] text-slate-950 md:text-4xl">Construit selon le contrat de conformité UI AC360.</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-5">
        {ac360ExperiencePrinciples.map((principle) => (
          <div key={principle} className="rounded-3xl border border-blue-100 bg-white p-4 text-sm font-bold leading-6 text-slate-700 shadow-sm">
            {principle}
          </div>
        ))}
      </div>
    </section>
  )
}

export default function Ac360CustomerExperienceShell() {
  const [selectedKey, setSelectedKey] = useState('command-center')
  const [selectedRole, setSelectedRole] = useState(ac360RoleExperiences[0]?.label || 'Propriétaire / Direction')
  const [live, setLive] = useState<Ac360CustomerLiveCockpit | null>(null)
  const [refreshing, setRefreshing] = useState(true)
  const selectedModule = ac360CustomerModules.find((module) => module.key === selectedKey) || ac360CustomerModules[0]

  const refreshLive = async () => {
    setRefreshing(true)
    try {
      const next = await loadAc360CustomerLiveCockpit()
      setLive(next)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    refreshLive()
  }, [])

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <TopIntelligenceBar selectedRole={selectedRole} live={live} refreshing={refreshing} onRefresh={refreshLive} />
      <div className="mx-auto flex max-w-[1900px]">
        <LeftStrategicNavigation selectedKey={selectedKey} setSelectedKey={setSelectedKey} live={live} />
        <main className="min-w-0 flex-1 px-4 py-5 md:px-6 lg:px-8">
          <HeroCommandCenter selectedModule={selectedModule} live={live} refreshing={refreshing} onRefresh={refreshLive} setSelectedKey={setSelectedKey} />
          <RuntimeCoveragePanel live={live} />
          <RoleExperienceSwitcher selectedRole={selectedRole} setSelectedRole={setSelectedRole} />
          <ModuleDetailWorkspace module={selectedModule} live={live} />

          <section id="module-universe" className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <SmallBadge className="border-blue-200 bg-blue-50 text-blue-800">Univers modules live</SmallBadge>
                <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950">Chaque module client comme surface opérationnelle gouvernée.</h2>
                <p className="mt-3 max-w-5xl text-lg font-semibold leading-8 text-slate-600">
                  Cette grille n’est pas un dépôt de menu. C’est une carte opérationnelle prête marketplace, où chaque surface porte un score santé, un risque, un statut, un signal facturation, une prochaine action et un état de connexion runtime.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <SmallBadge className="border-emerald-200 bg-emerald-50 text-emerald-800">inclus</SmallBadge>
                <SmallBadge className="border-blue-200 bg-blue-50 text-blue-800">add-on</SmallBadge>
                <SmallBadge className="border-amber-200 bg-amber-50 text-amber-800">à l’usage</SmallBadge>
                <SmallBadge className="border-violet-200 bg-violet-50 text-violet-800">entreprise</SmallBadge>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {ac360CustomerModules.map((module) => (
                <ModuleHealthCard key={module.key} module={module} live={live} active={selectedModule.key === module.key} onSelect={() => setSelectedKey(module.key)} />
              ))}
            </div>
          </section>

          <GrowthMenuMarketplace live={live} />
          <ComplianceStrip />
        </main>
        <RightContextRail module={selectedModule} live={live} />
      </div>
      <div className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 px-5 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          <span>AC360 UI Client · Phase 3B live · Thème blanc appliqué · Socle backend gardé</span>
          <span>Plan : {live?.context.planName || 'Command'} · Crédits : {live?.billing.creditPercent ?? 82}% · Restrictions : {live?.billing.restrictionCount || 'aucun blocage dur'} · Add-ons : {live?.billing.activeAddonCount ?? 9} actifs</span>
        </div>
      </div>
    </div>
  )
}
