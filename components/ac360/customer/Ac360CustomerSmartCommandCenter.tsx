'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ac360CustomerModules } from '@/lib/ac360/customer-ui-model'
import { getAc360CustomerCommandsForModule, type Ac360CustomerCommand } from '@/lib/ac360/customer-command-model'
import { type Ac360CustomerLiveCockpit } from '@/lib/ac360/customer-live-data'
import {
  ac360DefaultSavedViews,
  buildAc360CockpitIntelligenceSignals,
  buildAc360SmartCommandResults,
  getAc360CommandByKey,
  searchAc360SmartCommandResults,
  type Ac360SmartCommandKind,
  type Ac360SmartCommandResult,
  type Ac360SyncedSavedView,
} from '@/lib/ac360/customer-command-center-model'

type Props = {
  live: Ac360CustomerLiveCockpit | null
  activeModuleKey?: string
  compact?: boolean
  onSelectModule?: (moduleKey: string) => void
  onOpenCommand?: (command: Ac360CustomerCommand) => void
}

const kindLabels: Record<Ac360SmartCommandKind | 'tout', string> = {
  tout: 'tout',
  module: 'modules',
  commande: 'commandes',
  vue: 'vues',
  alerte: 'alertes',
  facturation: 'facturation',
  gouvernance: 'gouvernance',
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function toneClass(tone: string) {
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

function loadPinnedViews() {
  if (typeof window === 'undefined') return [] as string[]
  try {
    return JSON.parse(window.localStorage.getItem('ac360.customer.pinnedViews') || '[]') as string[]
  } catch {
    return []
  }
}

function savePinnedViews(ids: string[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem('ac360.customer.pinnedViews', JSON.stringify(ids))
  window.dispatchEvent(new CustomEvent('ac360:saved-views-sync', { detail: { ids } }))
}

function ResultAction({ result, onSelectModule, onOpenCommand }: { result: Ac360SmartCommandResult; onSelectModule?: (moduleKey: string) => void; onOpenCommand?: (command: Ac360CustomerCommand) => void }) {
  const command = getAc360CommandByKey(result.commandKey)
  const body = (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <SmallBadge className={toneClass(result.tone)}>{kindLabels[result.kind]}</SmallBadge>
            {result.moduleKey ? <SmallBadge className="border-slate-200 bg-slate-50 text-slate-600">{result.moduleKey}</SmallBadge> : null}
          </div>
          <p className="mt-3 text-base font-black text-slate-950">{result.label}</p>
          <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">{result.description}</p>
        </div>
        <span className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">{result.priority}</span>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-600">{result.proof || 'Preuve runtime prête'}</div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-xs font-bold leading-5 text-blue-900">{result.billingImpact || 'Impact facturation visible'}</div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-bold leading-5 text-emerald-900">{result.recommendedAction || 'Action recommandée disponible'}</div>
      </div>
    </div>
  )

  if (command && onOpenCommand) {
    return <button type="button" onClick={() => onOpenCommand(command)} className="block w-full">{body}</button>
  }

  if (result.moduleKey && onSelectModule && !result.routeHref?.includes('/angelcare-360/customer/')) {
    return <button type="button" onClick={() => onSelectModule(result.moduleKey || 'command-center')} className="block w-full">{body}</button>
  }

  return <Link href={result.routeHref || '/angelcare-360/customer'} className="block">{body}</Link>
}

function SavedViewsSync({ views, pinned, onTogglePin }: { views: Ac360SyncedSavedView[]; pinned: string[]; onTogglePin: (id: string) => void }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <SmallBadge className="border-violet-200 bg-violet-50 text-violet-800">Saved Views Sync</SmallBadge>
          <h3 className="mt-3 text-2xl font-black tracking-[-0.03em] text-slate-950">Vues intelligentes synchronisées</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Les vues critiques deviennent des raccourcis de pilotage cross-module : finance, admissions, présence, ParentTrust et gouvernance.</p>
        </div>
        <SmallBadge className="border-blue-200 bg-blue-50 text-blue-800">{pinned.length} épinglée(s)</SmallBadge>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {views.map((view) => (
          <div key={view.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-950">{view.label}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">{view.moduleLabel} · {view.ownerRole}</p>
              </div>
              <SmallBadge className={view.syncState === 'synchronisée' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : view.syncState === 'à valider' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-700'}>{view.syncState}</SmallBadge>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{view.filterSummary}</p>
            <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{view.usage}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={view.href} className="rounded-2xl bg-blue-700 px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-white hover:bg-blue-800">Ouvrir</Link>
              <button type="button" onClick={() => onTogglePin(view.id)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-700 hover:border-blue-200 hover:bg-blue-50">
                {pinned.includes(view.id) ? 'Désépingler' : 'Épingler'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Ac360CustomerSmartCommandCenter({ live, activeModuleKey, compact = false, onSelectModule, onOpenCommand }: Props) {
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<Ac360SmartCommandKind | 'tout'>('tout')
  const [pinned, setPinned] = useState<string[]>([])
  const allResults = useMemo(() => buildAc360SmartCommandResults(live), [live])
  const results = useMemo(() => searchAc360SmartCommandResults(allResults, query, kind), [allResults, query, kind])
  const intelligence = useMemo(() => buildAc360CockpitIntelligenceSignals(live), [live])
  const activeModule = ac360CustomerModules.find((module) => module.key === activeModuleKey)
  const quickCommands = useMemo(() => {
    const base = activeModuleKey ? getAc360CustomerCommandsForModule(activeModuleKey) : []
    return (base.length ? base : ac360CustomerModules.flatMap((module) => getAc360CustomerCommandsForModule(module.key))).slice(0, 6)
  }, [activeModuleKey])

  useEffect(() => {
    setPinned(loadPinnedViews())
    const handler = () => setPinned(loadPinnedViews())
    window.addEventListener('storage', handler)
    window.addEventListener('ac360:saved-views-sync', handler as EventListener)
    return () => {
      window.removeEventListener('storage', handler)
      window.removeEventListener('ac360:saved-views-sync', handler as EventListener)
    }
  }, [])

  const togglePin = (id: string) => {
    const next = pinned.includes(id) ? pinned.filter((item) => item !== id) : [...pinned, id]
    setPinned(next)
    savePinnedViews(next)
  }

  return (
    <section id="centre-commande-intelligent" className={cx('rounded-[2rem] border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-white shadow-sm', compact ? 'p-4' : 'p-5 md:p-7')} data-ac360-phase3j="smart-command-center-global-search-saved-views">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <SmallBadge className="border-blue-200 bg-white text-blue-800">Phase 3J · Centre de commande intelligent</SmallBadge>
            <SmallBadge className="border-emerald-200 bg-emerald-50 text-emerald-800">FR Maroc natif</SmallBadge>
            <SmallBadge className="border-amber-200 bg-amber-50 text-amber-800">Recherche globale gouvernée</SmallBadge>
          </div>
          <h2 className={cx('mt-4 font-black tracking-[-0.05em] text-slate-950', compact ? 'text-3xl' : 'text-4xl md:text-5xl')}>Chercher, décider et commander sans quitter le cockpit.</h2>
          <p className="mt-3 max-w-5xl text-base font-semibold leading-7 text-slate-600">Recherche globale AC360, vues synchronisées, intelligence cross-module et commandes gardées : l’utilisateur peut trouver un dossier, lancer une action, comprendre le coût et voir la preuve depuis une seule surface.</p>
        </div>
        <div className="grid min-w-[260px] gap-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <SmallBadge className="border-slate-200 bg-slate-50 text-slate-700">Contexte actif</SmallBadge>
          <p className="text-xl font-black text-slate-950">{activeModule?.label || 'Cockpit Direction'}</p>
          <p className="text-xs font-bold leading-5 text-slate-500">Plan {live?.context.planName || 'Command'} · crédits {live?.billing.creditPercent ?? 82}% · {live?.status === 'connected' ? 'runtime connecté' : 'fallback sécurisé'}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher : facture en retard, prospect chaud, absence, add-on, restriction, commande…"
              className="min-h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
            <div className="flex flex-wrap gap-2">
              {(['tout', 'module', 'commande', 'facturation', 'gouvernance'] as Array<Ac360SmartCommandKind | 'tout'>).map((item) => (
                <button key={item} type="button" onClick={() => setKind(item)} className={cx('rounded-2xl border px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em]', kind === item ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50')}>
                  {kindLabels[item]}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {results.slice(0, compact ? 6 : 10).map((result) => (
              <ResultAction key={result.id} result={result} onSelectModule={onSelectModule} onOpenCommand={onOpenCommand} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <SmallBadge className="border-blue-200 bg-blue-50 text-blue-800">Actions transversales</SmallBadge>
            <div className="mt-4 space-y-2">
              {quickCommands.map((command) => (
                <button key={command.key} type="button" onClick={() => onOpenCommand?.(command)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left hover:border-blue-200 hover:bg-blue-50">
                  <span className="block text-sm font-black text-slate-950">{command.shortLabel || command.label}</span>
                  <span className="mt-1 block text-xs font-bold leading-5 text-slate-500">{command.entitlementSignal} · {command.creditSignal}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <SmallBadge className="border-blue-200 bg-white text-blue-800">Intelligence cockpit</SmallBadge>
            <div className="mt-4 grid gap-3">
              {intelligence.map((signal) => (
                <div key={signal.id} className="rounded-3xl border border-blue-100 bg-white p-4">
                  <div className="flex items-start justify-between gap-3"><p className="text-sm font-black text-slate-950">{signal.label}</p><SmallBadge className={toneClass(signal.tone)}>{signal.value}</SmallBadge></div>
                  <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{signal.explanation}</p>
                  <p className="mt-3 text-[11px] font-black uppercase tracking-[0.14em] text-blue-800">{signal.actionLabel}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {!compact ? <div className="mt-5"><SavedViewsSync views={ac360DefaultSavedViews} pinned={pinned} onTogglePin={togglePin} /></div> : null}
    </section>
  )
}
