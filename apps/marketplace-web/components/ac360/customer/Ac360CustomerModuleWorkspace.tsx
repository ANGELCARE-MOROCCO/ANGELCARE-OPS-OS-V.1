'use client'

import { getAc360CustomerWorkspace, type Ac360WorkspaceStage } from '@/lib/ac360/customer-workspace-model'
import { getAc360ModuleLiveSignal, type Ac360CustomerLiveCockpit } from '@/lib/ac360/customer-live-data'
import type { Ac360CustomerModule } from '@/lib/ac360/customer-ui-model'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function badgeTone(tone: Ac360WorkspaceStage['tone']) {
  if (tone === 'emerald') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (tone === 'amber') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (tone === 'rose') return 'border-rose-200 bg-rose-50 text-rose-800'
  if (tone === 'violet') return 'border-violet-200 bg-violet-50 text-violet-800'
  if (tone === 'blue') return 'border-blue-200 bg-blue-50 text-blue-800'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function SmallBadge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em]', className)}>
      {children}
    </span>
  )
}

function priorityClass(priority: string) {
  if (priority === 'critique') return 'border-rose-200 bg-rose-50 text-rose-800'
  if (priority === 'haute') return 'border-orange-200 bg-orange-50 text-orange-800'
  if (priority === 'moyenne') return 'border-amber-200 bg-amber-50 text-amber-800'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function safePercent(value: number) {
  return `${Math.max(0, Math.min(100, value))}%`
}

export function Ac360CustomerModuleWorkspace({ module, live }: { module: Ac360CustomerModule; live: Ac360CustomerLiveCockpit | null }) {
  const workspace = getAc360CustomerWorkspace(module.key)
  const signal = getAc360ModuleLiveSignal(live, module.key)
  const connected = Boolean(signal?.connected)
  const health = Math.max(0, Math.min(100, module.healthScore + (signal?.healthDelta || 0)))

  return (
    <div className="mt-6 space-y-5" data-ac360-phase3c="workspace-deep-navigation">
      <section className="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-white p-5 shadow-sm md:p-6">
        <div className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
          <div>
            <div className="flex flex-wrap gap-2">
              <SmallBadge className="border-blue-200 bg-white text-blue-800">Phase 3C · Workspace module</SmallBadge>
              <SmallBadge className={connected ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}>
                {connected ? 'données live connectées' : 'fallback sécurisé'}
              </SmallBadge>
              <SmallBadge className="border-slate-200 bg-white text-slate-600">FR Maroc natif</SmallBadge>
            </div>
            <h3 className="mt-4 text-3xl font-black tracking-[-0.03em] text-slate-950 md:text-4xl">{workspace.headline}</h3>
            <p className="mt-3 max-w-5xl text-base font-semibold leading-7 text-slate-600">{workspace.operationalQuestion}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Écran principal</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{workspace.primaryScreen}</p>
            <div className="mt-4 h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-blue-700" style={{ width: safePercent(health) }} />
            </div>
            <p className="mt-2 text-xs font-bold text-slate-500">Santé opérationnelle live : {health}% · {signal?.endpointLabel || 'runtime module'}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <SmallBadge className="border-slate-200 bg-slate-50 text-slate-700">Navigation profonde en page</SmallBadge>
            <h3 className="mt-3 text-2xl font-black text-slate-950">Vues enregistrées, filtres intelligents et modes opérationnels.</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {workspace.filters.slice(0, 5).map((filter) => (
              <SmallBadge key={filter} className="border-blue-100 bg-blue-50 text-blue-700">{filter}</SmallBadge>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {workspace.savedViews.map((view) => (
            <button key={view} type="button" className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50">
              <p className="text-sm font-black text-slate-950">{view}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">Vue prête pour filtres, sélection multi-lignes, actions contextuelles et export gouverné.</p>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.25fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <SmallBadge className="border-blue-200 bg-blue-50 text-blue-800">Pipeline / statuts</SmallBadge>
              <h3 className="mt-3 text-2xl font-black text-slate-950">États métier du module</h3>
            </div>
            <SmallBadge className="border-slate-200 bg-slate-50 text-slate-700">{workspace.stages.reduce((total, stage) => total + stage.count, 0)} éléments</SmallBadge>
          </div>
          <div className="mt-5 space-y-3">
            {workspace.stages.map((stage) => (
              <div key={stage.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-black text-slate-950">{stage.label}</span>
                  <SmallBadge className={badgeTone(stage.tone)}>{stage.count}</SmallBadge>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white">
                  <div className="h-2 rounded-full bg-blue-700" style={{ width: safePercent(Math.min(100, stage.count * 5)) }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <SmallBadge className="border-slate-200 bg-slate-50 text-slate-700">Table opérationnelle dense</SmallBadge>
              <h3 className="mt-3 text-2xl font-black text-slate-950">Actions, dossiers et preuves à traiter</h3>
            </div>
            <div className="flex gap-2">
              <button type="button" className="rounded-2xl bg-blue-700 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-blue-800">Action groupée</button>
              <button type="button" className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-700 hover:bg-slate-50">Exporter</button>
            </div>
          </div>
          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
            <div className="grid grid-cols-[0.65fr_1.7fr_0.9fr_0.75fr_0.8fr] gap-3 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              <span>Réf.</span>
              <span>Dossier</span>
              <span>Responsable</span>
              <span>Priorité</span>
              <span>Échéance</span>
            </div>
            {workspace.records.map((record) => (
              <div key={record.id} className="grid grid-cols-[0.65fr_1.7fr_0.9fr_0.75fr_0.8fr] gap-3 border-t border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">
                <span className="font-black text-slate-950">{record.id}</span>
                <span>
                  <span className="block font-black text-slate-950">{record.title}</span>
                  <span className="mt-1 block text-xs font-semibold text-slate-500">{record.signal}{record.amount ? ` · ${record.amount}` : ''}</span>
                </span>
                <span>{record.owner}</span>
                <span><SmallBadge className={priorityClass(record.priority)}>{record.priority}</SmallBadge></span>
                <span>{record.due || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <SmallBadge className="border-emerald-200 bg-emerald-50 text-emerald-800">Chronologie preuve</SmallBadge>
          <div className="mt-5 space-y-4">
            {workspace.timeline.map((item, index) => (
              <div key={item} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-[11px] font-black text-white">{index + 1}</span>
                  {index < workspace.timeline.length - 1 ? <span className="h-8 w-px bg-slate-200" /> : null}
                </div>
                <p className="pt-1 text-sm font-bold leading-5 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-blue-200 bg-blue-50 p-5 shadow-sm md:p-6">
          <SmallBadge className="border-blue-200 bg-white text-blue-800">Droits, usage et facturation</SmallBadge>
          <div className="mt-4 space-y-3">
            {workspace.governance.map((item) => (
              <div key={item} className="rounded-2xl border border-blue-100 bg-white p-3 text-sm font-bold leading-5 text-slate-700">{item}</div>
            ))}
          </div>
          <p className="mt-4 rounded-2xl border border-amber-200 bg-white p-3 text-sm font-bold leading-6 text-amber-800">{workspace.escalation}</p>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <SmallBadge className="border-slate-200 bg-slate-50 text-slate-700">État vide premium</SmallBadge>
          <h3 className="mt-3 text-2xl font-black text-slate-950">Aucune donnée ne doit sembler cassée.</h3>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{workspace.emptyState}</p>
          <div className="mt-5 grid gap-2">
            {['Créer premier dossier', 'Importer données', 'Activer automatisation', 'Voir audit'].map((action) => (
              <button key={action} type="button" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-black text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800">{action}</button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
