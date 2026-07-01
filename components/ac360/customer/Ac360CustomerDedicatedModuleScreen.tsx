 'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ac360CustomerModules, type Ac360CustomerModule } from '@/lib/ac360/customer-ui-model'
import { getAc360CustomerWorkspace } from '@/lib/ac360/customer-workspace-model'
import { getAc360CustomerCommandsForModule, getAc360PrimaryCustomerCommand, type Ac360CustomerCommand } from '@/lib/ac360/customer-command-model'
import { Ac360CustomerCommandModal } from '@/components/ac360/customer/Ac360CustomerCommandModal'
import { Ac360CustomerOperationalTableHardening } from '@/components/ac360/customer/Ac360CustomerOperationalTableHardening'
import { Ac360CustomerLiveRecordsTable } from '@/components/ac360/customer/Ac360CustomerLiveRecordsTable'
import {
  ac360DedicatedModuleRoutes,
  getAc360DedicatedModuleForRoute,
  type Ac360DedicatedModuleRoute,
} from '@/lib/ac360/customer-module-routes'
import {
  getAc360ModuleLiveSignal,
  loadAc360CustomerLiveCockpit,
  type Ac360CustomerLiveCockpit,
} from '@/lib/ac360/customer-live-data'

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

function safePct(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`
}

function formatTime(iso?: string) {
  if (!iso) return 'non synchronisé'
  try {
    return new Intl.DateTimeFormat('fr-MA', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
  } catch {
    return 'non synchronisé'
  }
}

function routeForModule(module: Ac360CustomerModule) {
  return ac360DedicatedModuleRoutes.find((route) => route.moduleKey === module.key)
}

function RuntimeBadge({ live, module }: { live: Ac360CustomerLiveCockpit | null; module: Ac360CustomerModule }) {
  const signal = getAc360ModuleLiveSignal(live, module.key)
  const connected = Boolean(signal?.connected)
  return (
    <SmallBadge className={connected ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}>
      {connected ? 'runtime connecté' : 'fallback sécurisé'} · {signal?.endpointLabel || 'module'}
    </SmallBadge>
  )
}

function TopModuleBar({ route, module, live, refreshing, onRefresh }: { route: Ac360DedicatedModuleRoute; module: Ac360CustomerModule; live: Ac360CustomerLiveCockpit | null; refreshing: boolean; onRefresh: () => void }) {
  return (
    <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1900px] flex-wrap items-center justify-between gap-3 px-5 py-3">
        <div className="flex items-center gap-3">
          <Link href="/angelcare-360/customer" className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-100 bg-blue-700 text-sm font-black text-white shadow-lg shadow-blue-100">AC</Link>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">AngelCare 360 · Espace dédié</p>
            <h1 className="text-base font-black text-slate-950">{route.label}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RuntimeBadge live={live} module={module} />
          <SmallBadge className="border-blue-200 bg-blue-50 text-blue-800">Plan {live?.context.planName || 'Command'}</SmallBadge>
          <SmallBadge className="border-amber-200 bg-amber-50 text-amber-800">Crédits {live?.billing.creditPercent ?? 82}%</SmallBadge>
          <button onClick={onRefresh} type="button" className="rounded-2xl bg-blue-700 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-blue-800">
            {refreshing ? 'Synchronisation…' : 'Rafraîchir'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DedicatedLeftNav({ activeSlug }: { activeSlug: string }) {
  return (
    <aside className="sticky top-[70px] hidden h-[calc(100vh-70px)] w-[290px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white/95 p-4 xl:block">
      <p className="px-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Espaces client dédiés</p>
      <div className="mt-4 space-y-2">
        {ac360DedicatedModuleRoutes.map((route) => (
          <Link
            key={route.slug}
            href={`/angelcare-360/customer/${route.slug}`}
            className={cx(
              'block rounded-3xl border p-3 transition hover:border-blue-200 hover:bg-blue-50',
              activeSlug === route.slug ? 'border-blue-300 bg-blue-50 ring-4 ring-blue-50' : 'border-slate-200 bg-white',
            )}
          >
            <span className="block text-sm font-black text-slate-950">{route.label}</span>
            <span className="mt-1 block text-[11px] font-bold leading-4 text-slate-500">{route.primaryCommand} · {route.endpoint.replace('/api/ac360/', '')}</span>
          </Link>
        ))}
      </div>
    </aside>
  )
}

function InPageNav({ route }: { route: Ac360DedicatedModuleRoute }) {
  return (
    <div className="sticky top-[69px] z-30 -mx-2 overflow-x-auto border-y border-slate-200 bg-white/95 px-2 py-3 backdrop-blur xl:top-[70px]">
      <div className="flex min-w-max gap-2">
        {route.inPageNav.map((item, index) => (
          <a
            key={item}
            href={`#${item.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
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

function KpiCard({ kpi }: { kpi: Ac360DedicatedModuleRoute['kpis'][number] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <SmallBadge className={toneClass(kpi.tone)}>{kpi.label}</SmallBadge>
      <p className="mt-3 text-3xl font-black tracking-[-0.03em] text-slate-950">{kpi.value}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{kpi.detail}</p>
    </div>
  )
}

function CommandButton({ children, variant = 'primary', onClick }: { children: React.ReactNode; variant?: 'primary' | 'secondary' | 'ghost'; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cx(
      'rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-[0.14em] shadow-sm transition hover:-translate-y-0.5',
      variant === 'primary' && 'bg-blue-700 text-white hover:bg-blue-800',
      variant === 'secondary' && 'border border-slate-200 bg-white text-slate-900 hover:border-blue-200 hover:bg-blue-50',
      variant === 'ghost' && 'border border-transparent bg-slate-50 text-slate-700 hover:border-slate-200 hover:bg-white',
    )}>{children}</button>
  )
}

function RouteHero({ route, module, live, onOpenCommand }: { route: Ac360DedicatedModuleRoute; module: Ac360CustomerModule; live: Ac360CustomerLiveCockpit | null; onOpenCommand: (command: Ac360CustomerCommand) => void }) {
  const signal = getAc360ModuleLiveSignal(live, module.key)
  const health = Math.max(0, Math.min(100, module.healthScore + (signal?.healthDelta || 0)))
  const commands = getAc360CustomerCommandsForModule(module.key)
  return (
    <section id="vue-executive" className="rounded-[2.2rem] border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-white p-6 shadow-sm md:p-8">
      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
        <div>
          <div className="flex flex-wrap gap-2">
            <SmallBadge className="border-blue-200 bg-white text-blue-800">Phase 3H · Formulaires live & recovery</SmallBadge>
            <SmallBadge className="border-slate-200 bg-white text-slate-700">FR Maroc natif</SmallBadge>
            <SmallBadge className="border-emerald-200 bg-emerald-50 text-emerald-800">Thème blanc premium</SmallBadge>
          </div>
          <h2 className="mt-5 text-4xl font-black tracking-[-0.05em] text-slate-950 md:text-6xl">{route.title}</h2>
          <p className="mt-5 max-w-5xl text-lg font-semibold leading-8 text-slate-600">{route.promise}</p>
          <p className="mt-4 rounded-3xl border border-blue-100 bg-white p-4 text-base font-black leading-7 text-blue-900">Question business : {route.businessQuestion}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <CommandButton onClick={() => onOpenCommand(commands[0] || getAc360PrimaryCustomerCommand(module.key))}>{commands[0]?.shortLabel || route.primaryCommand}</CommandButton>
            <CommandButton variant="secondary" onClick={() => onOpenCommand(commands[1] || commands[0] || getAc360PrimaryCustomerCommand(module.key))}>{commands[1]?.shortLabel || route.secondaryCommand}</CommandButton>
            <CommandButton variant="ghost" onClick={() => onOpenCommand(commands[2] || commands[0] || getAc360PrimaryCustomerCommand(module.key))}>{commands[2]?.shortLabel || route.tertiaryCommand}</CommandButton>
          </div>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Signal exécutif live</p>
          <p className="mt-3 text-5xl font-black text-slate-950">{safePct(health)}</p>
          <div className="mt-4 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-700" style={{ width: safePct(health) }} /></div>
          <p className="mt-3 text-sm font-bold leading-6 text-slate-500">{signal?.endpointLabel || route.endpoint} · chargé à {formatTime(live?.loadedAt)}</p>
          <div className="mt-4 grid gap-2">
            <SmallBadge className="border-blue-200 bg-blue-50 text-blue-800">Endpoint : {route.endpoint.replace('/api/ac360/', '')}</SmallBadge>
            <SmallBadge className="border-amber-200 bg-amber-50 text-amber-800">Droits, plan et usage visibles</SmallBadge>
          </div>
        </div>
      </div>
    </section>
  )
}

function OperationalQueue({ route, onOpenCommand }: { route: Ac360DedicatedModuleRoute; onOpenCommand: (command: Ac360CustomerCommand) => void }) {
  const workspace = getAc360CustomerWorkspace(route.moduleKey)
  const commands = getAc360CustomerCommandsForModule(route.moduleKey)
  return (
    <section id="file-operationnelle" className="grid gap-5 xl:grid-cols-[0.9fr_1.35fr]">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <SmallBadge className="border-blue-200 bg-blue-50 text-blue-800">Lanes opérationnelles</SmallBadge>
        <h3 className="mt-3 text-2xl font-black text-slate-950">Statuts métier du module</h3>
        <div className="mt-5 space-y-3">
          {route.operationalLanes.map((lane) => (
            <div key={lane.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">{lane.label}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{lane.detail}</p>
                </div>
                <SmallBadge className={toneClass(lane.tone)}>{lane.count}</SmallBadge>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white"><div className="h-2 rounded-full bg-blue-700" style={{ width: safePct(lane.count * 6) }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <SmallBadge className="border-slate-200 bg-slate-50 text-slate-700">Table dense gouvernée</SmallBadge>
            <h3 className="mt-3 text-2xl font-black text-slate-950">Dossiers, preuves et responsabilités</h3>
          </div>
          <div className="flex gap-2"><CommandButton variant="secondary" onClick={() => onOpenCommand(commands[0] || getAc360PrimaryCustomerCommand(route.moduleKey))}>Commande gardée</CommandButton><CommandButton variant="ghost" onClick={() => onOpenCommand(commands[1] || commands[0] || getAc360PrimaryCustomerCommand(route.moduleKey))}>Pré-vol action</CommandButton></div>
        </div>
        <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
          <div className="grid grid-cols-[0.7fr_1.65fr_0.9fr_0.75fr_0.8fr] gap-3 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            <span>Réf.</span><span>Dossier</span><span>Responsable</span><span>Priorité</span><span>Échéance</span>
          </div>
          {workspace.records.map((record) => (
            <div key={record.id} className="grid grid-cols-[0.7fr_1.65fr_0.9fr_0.75fr_0.8fr] gap-3 border-t border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">
              <span className="font-black text-slate-950">{record.id}</span>
              <span><span className="block font-black text-slate-950">{record.title}</span><span className="mt-1 block text-xs font-semibold text-slate-500">{record.signal}{record.amount ? ` · ${record.amount}` : ''}</span></span>
              <span>{record.owner}</span>
              <span><SmallBadge className={record.priority === 'critique' ? 'border-rose-200 bg-rose-50 text-rose-800' : record.priority === 'haute' ? 'border-orange-200 bg-orange-50 text-orange-800' : 'border-slate-200 bg-slate-50 text-slate-700'}>{record.priority}</SmallBadge></span>
              <span>{record.due || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CommandAndGovernance({ route, onOpenCommand }: { route: Ac360DedicatedModuleRoute; onOpenCommand: (command: Ac360CustomerCommand) => void }) {
  const workspace = getAc360CustomerWorkspace(route.moduleKey)
  const commands = getAc360CustomerCommandsForModule(route.moduleKey)
  return (
    <section id="actions" className="grid gap-5 xl:grid-cols-3">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <SmallBadge className="border-blue-200 bg-blue-50 text-blue-800">Commandes gardées</SmallBadge>
        <div className="mt-5 space-y-3">
          {route.commandStack.map((cmd) => (
            <div key={cmd.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-base font-black text-slate-950">{cmd.title}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{cmd.detail}</p>
              <div className="mt-3 flex flex-wrap gap-2"><SmallBadge className="border-slate-200 bg-white text-slate-600">{cmd.guard}</SmallBadge><SmallBadge className="border-emerald-200 bg-white text-emerald-700">{cmd.impact}</SmallBadge></div>
              <button type="button" onClick={() => onOpenCommand(commands[0] || getAc360PrimaryCustomerCommand(route.moduleKey))} className="mt-4 w-full rounded-2xl bg-blue-700 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-blue-800">Ouvrir modal de commande</button>
            </div>
          ))}
        </div>
      </div>
      <div id="chronologie" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <SmallBadge className="border-emerald-200 bg-emerald-50 text-emerald-800">Chronologie preuve</SmallBadge>
        <div className="mt-5 space-y-4">
          {workspace.timeline.map((item, index) => (
            <div key={item} className="flex gap-3">
              <div className="flex flex-col items-center"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-[11px] font-black text-white">{index + 1}</span>{index < workspace.timeline.length - 1 ? <span className="h-8 w-px bg-slate-200" /> : null}</div>
              <p className="pt-1 text-sm font-bold leading-5 text-slate-700">{item}</p>
            </div>
          ))}
        </div>
      </div>
      <div id="facturation-droits" className="rounded-[2rem] border border-blue-200 bg-blue-50 p-5 shadow-sm md:p-6">
        <SmallBadge className="border-blue-200 bg-white text-blue-800">Facturation, droits et usage</SmallBadge>
        <div className="mt-4 space-y-3">
          {[...route.governance, ...route.monetization].slice(0, 7).map((item) => <div key={item} className="rounded-2xl border border-blue-100 bg-white p-3 text-sm font-bold leading-5 text-slate-700">{item}</div>)}
        </div>
      </div>
    </section>
  )
}

function DeepSections({ route }: { route: Ac360DedicatedModuleRoute }) {
  return (
    <section id="audit" className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <SmallBadge className="border-slate-200 bg-slate-50 text-slate-700">Navigation profonde du module</SmallBadge>
          <h3 className="mt-3 text-2xl font-black text-slate-950">Chaque section explique la décision, l’action, la preuve et la gouvernance.</h3>
        </div>
        <SmallBadge className="border-blue-200 bg-blue-50 text-blue-800">{route.sections.length} sections</SmallBadge>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {route.sections.map((section) => (
          <div key={section.id} id={section.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{section.label}</p>
            <h4 className="mt-2 text-lg font-black text-slate-950">{section.title}</h4>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{section.description}</p>
            <ul className="mt-3 space-y-2">
              {section.bullets.map((bullet) => <li key={bullet} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">{bullet}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

function RightModuleRail({ route, module, live, onOpenCommand }: { route: Ac360DedicatedModuleRoute; module: Ac360CustomerModule; live: Ac360CustomerLiveCockpit | null; onOpenCommand: (command: Ac360CustomerCommand) => void }) {
  const signal = getAc360ModuleLiveSignal(live, module.key)
  const commands = getAc360CustomerCommandsForModule(module.key)
  return (
    <aside className="hidden w-[360px] shrink-0 border-l border-slate-200 bg-white/90 p-5 2xl:block">
      <div className="sticky top-[86px] space-y-4">
        <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-5">
          <SmallBadge className="border-blue-200 bg-white text-blue-800">Contexte live</SmallBadge>
          <h3 className="mt-3 text-2xl font-black text-slate-950">{module.label}</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{module.headline}</p>
          <div className="mt-4 grid gap-2">
            <SmallBadge className="border-emerald-200 bg-white text-emerald-700">{signal?.connected ? 'connecté' : 'fallback'}</SmallBadge>
            <SmallBadge className="border-slate-200 bg-white text-slate-700">{route.endpoint}</SmallBadge>
          </div>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Actions recommandées</p>
          <div className="mt-4 space-y-2">
            {module.nextBestActions.slice(0, 5).map((action, index) => <button key={action} type="button" onClick={() => onOpenCommand(commands[index % commands.length] || commands[0] || getAc360PrimaryCustomerCommand(module.key))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-black text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800">{action}</button>)}
          </div>
        </div>
        <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-800">État vide / fallback</p>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-700">{route.emptyState}</p>
        </div>
      </div>
    </aside>
  )
}

export function Ac360CustomerDedicatedModuleScreen({ route }: { route: Ac360DedicatedModuleRoute }) {
  const [live, setLive] = useState<Ac360CustomerLiveCockpit | null>(null)
  const [refreshing, setRefreshing] = useState(true)
  const [activeCommand, setActiveCommand] = useState<Ac360CustomerCommand | null>(null)
  const module = useMemo(() => getAc360DedicatedModuleForRoute(route), [route])

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
    <div className="min-h-screen bg-[#f7f9fc] text-slate-950" data-ac360-phase3h="live-forms-preflight-recovery" data-ac360-phase3g="live-records-real-tables" data-ac360-phase3f="outcomes-bulk-saved-views">
      <TopModuleBar route={route} module={module} live={live} refreshing={refreshing} onRefresh={refreshLive} />
      <div className="mx-auto flex max-w-[1900px]">
        <DedicatedLeftNav activeSlug={route.slug} />
        <main className="min-w-0 flex-1 px-4 py-5 md:px-6 lg:px-8">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            <Link href="/angelcare-360/customer" className="hover:text-blue-700">Cockpit client</Link>
            <span>›</span>
            <span>{route.label}</span>
            <span>›</span>
            <span>Route dédiée Phase 3H</span>
          </div>
          <RouteHero route={route} module={module} live={live} onOpenCommand={setActiveCommand} />
          <InPageNav route={route} />
          <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {route.kpis.map((kpi) => <KpiCard key={kpi.label} kpi={kpi} />)}
          </section>
          <div className="mt-5 space-y-5">
            <Ac360CustomerLiveRecordsTable route={route} onOpenCommand={setActiveCommand} />
            <Ac360CustomerOperationalTableHardening route={route} onOpenCommand={setActiveCommand} />
            <CommandAndGovernance route={route} onOpenCommand={setActiveCommand} />
            <DeepSections route={route} />
          </div>
        </main>
        <RightModuleRail route={route} module={module} live={live} onOpenCommand={setActiveCommand} />
      </div>
      <div className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 px-5 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          <span>AC360 Phase 3H · Pré-vol inline · Recovery client · Payloads réels · FR Maroc</span>
          <span>Plan : {live?.context.planName || 'Command'} · Crédits : {live?.billing.creditPercent ?? 82}% · Endpoint : {route.endpoint}</span>
        </div>
      </div>
      <Ac360CustomerCommandModal command={activeCommand} open={Boolean(activeCommand)} onClose={() => setActiveCommand(null)} onExecuted={refreshLive} />
    </div>
  )
}

export function Ac360CustomerDedicatedModuleNotFound({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen bg-[#f7f9fc] p-8 text-slate-950">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <SmallBadge className="border-rose-200 bg-rose-50 text-rose-800">Route module non trouvée</SmallBadge>
        <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950">Aucun espace dédié pour « {slug} ».</h1>
        <p className="mt-3 text-base font-semibold leading-7 text-slate-600">Revenir au cockpit client ou ouvrir l’un des espaces dédiés disponibles.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/angelcare-360/customer" className="rounded-2xl bg-blue-700 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">Retour cockpit</Link>
          {ac360CustomerModules.slice(0, 4).map((module) => {
            const route = routeForModule(module)
            return route ? <Link key={route.slug} href={`/angelcare-360/customer/${route.slug}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-700">{module.label}</Link> : null
          })}
        </div>
      </div>
    </div>
  )
}
