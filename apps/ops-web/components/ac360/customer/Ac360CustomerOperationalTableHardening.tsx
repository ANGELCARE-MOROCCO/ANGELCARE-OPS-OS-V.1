'use client'

import { useMemo, useState } from 'react'
import type { Ac360DedicatedModuleRoute } from '@/lib/ac360/customer-module-routes'
import { getAc360CustomerCommandsForModule, getAc360PrimaryCustomerCommand, type Ac360CustomerCommand } from '@/lib/ac360/customer-command-model'
import { getAc360CustomerWorkspace, type Ac360WorkspaceRecord } from '@/lib/ac360/customer-workspace-model'
import { buildAc360CustomerOutcome, getAc360CustomerTableHardening, type Ac360CustomerOutcome } from '@/lib/ac360/customer-table-hardening-model'
import { Ac360CustomerOutcomeDrawer } from './Ac360CustomerOutcomeDrawer'

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

function priorityClass(priority: Ac360WorkspaceRecord['priority']) {
  if (priority === 'critique') return 'border-rose-200 bg-rose-50 text-rose-800'
  if (priority === 'haute') return 'border-orange-200 bg-orange-50 text-orange-800'
  if (priority === 'moyenne') return 'border-amber-200 bg-amber-50 text-amber-800'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function selectionLabel(count: number) {
  if (count === 0) return 'Aucune ligne sélectionnée'
  if (count === 1) return '1 ligne sélectionnée'
  return `${count} lignes sélectionnées`
}

export function Ac360CustomerOperationalTableHardening({
  route,
  onOpenCommand,
}: {
  route: Ac360DedicatedModuleRoute
  onOpenCommand: (command: Ac360CustomerCommand) => void
}) {
  const workspace = useMemo(() => getAc360CustomerWorkspace(route.moduleKey), [route.moduleKey])
  const hardening = useMemo(() => getAc360CustomerTableHardening(route.moduleKey, workspace), [route.moduleKey, workspace])
  const commands = useMemo(() => getAc360CustomerCommandsForModule(route.moduleKey), [route.moduleKey])
  const primaryCommand = commands[0] || getAc360PrimaryCustomerCommand(route.moduleKey)

  const [activeView, setActiveView] = useState(hardening.savedViews[0]?.key || 'default')
  const [activeDensity, setActiveDensity] = useState(hardening.densityModes[0] || 'Dense')
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [outcome, setOutcome] = useState<Ac360CustomerOutcome | null>(null)

  const selectedRecords = workspace.records.filter((record) => selectedIds.includes(record.id))
  const filteredRecords = workspace.records.filter((record) => {
    const haystack = `${record.id} ${record.title} ${record.owner} ${record.status} ${record.priority} ${record.signal} ${record.amount || ''}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  })
  const allVisibleSelected = filteredRecords.length > 0 && filteredRecords.every((record) => selectedIds.includes(record.id))

  function toggleRecord(recordId: string) {
    setSelectedIds((current) => current.includes(recordId) ? current.filter((id) => id !== recordId) : [...current, recordId])
  }

  function toggleVisible() {
    if (allVisibleSelected) {
      const visibleIds = new Set(filteredRecords.map((record) => record.id))
      setSelectedIds((current) => current.filter((id) => !visibleIds.has(id)))
    } else {
      setSelectedIds((current) => Array.from(new Set([...current, ...filteredRecords.map((record) => record.id)])))
    }
  }

  function openRowOutcome(record: Ac360WorkspaceRecord) {
    setOutcome(buildAc360CustomerOutcome(hardening, [record], 'row', `Tiroir résultat · ${record.id}`))
  }

  function openBulkOutcome(actionLabel: string) {
    const records = selectedRecords.length ? selectedRecords : filteredRecords.slice(0, 1)
    setOutcome(buildAc360CustomerOutcome(hardening, records, 'bulk', actionLabel))
  }

  return (
    <section id="file-operationnelle" className="grid gap-5 xl:grid-cols-[0.86fr_1.45fr]" data-ac360-phase3f="table-hardening">
      <div className="space-y-5">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <SmallBadge className="border-blue-200 bg-blue-50 text-blue-800">Vues sauvegardées</SmallBadge>
          <h3 className="mt-3 text-2xl font-black text-slate-950">Pilotage par vues métier</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Chaque vue garde ses filtres, son contexte business, son niveau de preuve et sa lecture billing/gouvernance.</p>
          <div className="mt-5 space-y-2">
            {hardening.savedViews.map((view) => (
              <button
                key={view.key}
                type="button"
                onClick={() => setActiveView(view.key)}
                className={cx(
                  'w-full rounded-3xl border p-4 text-left transition hover:border-blue-200 hover:bg-blue-50',
                  activeView === view.key ? 'border-blue-300 bg-blue-50 ring-4 ring-blue-50' : 'border-slate-200 bg-white',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-950">{view.label}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{view.description}</p>
                  </div>
                  <SmallBadge className="border-slate-200 bg-white text-slate-700">{view.countLabel}</SmallBadge>
                </div>
                <p className="mt-3 text-[11px] font-black uppercase tracking-[0.14em] text-blue-700">{view.guard}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <SmallBadge className="border-violet-200 bg-violet-50 text-violet-800">Filtres intelligents</SmallBadge>
          <div className="mt-4 flex flex-wrap gap-2">
            {hardening.quickFilters.map((filter) => (
              <button key={filter} type="button" onClick={() => setQuery(filter.split(' ')[0] || '')} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800">{filter}</button>
            ))}
          </div>
          <div className="mt-5 grid gap-2">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Densité d’affichage</p>
            <div className="flex flex-wrap gap-2">
              {hardening.densityModes.map((mode) => (
                <button key={mode} type="button" onClick={() => setActiveDensity(mode)} className={cx('rounded-full border px-3 py-2 text-xs font-black', activeDensity === mode ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-600')}>{mode}</button>
              ))}
            </div>
          </div>
        </div>

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
                <div className="mt-3 h-2 rounded-full bg-white"><div className="h-2 rounded-full bg-blue-700" style={{ width: `${Math.max(8, Math.min(100, lane.count * 6))}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <SmallBadge className="border-slate-200 bg-slate-50 text-slate-700">Table dense durcie</SmallBadge>
            <h3 className="mt-3 text-2xl font-black text-slate-950">Sélection, actions groupées, preuves et responsabilités</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{selectionLabel(selectedIds.length)} · Vue active : {hardening.savedViews.find((view) => view.key === activeView)?.label || 'Vue standard'} · Densité : {activeDensity}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onOpenCommand(primaryCommand)} className="rounded-2xl bg-blue-700 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-blue-800">Commande gardée</button>
            <button type="button" onClick={() => openBulkOutcome('Pré-vol de la vue active')} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800">Tiroir résultat</button>
          </div>
        </div>

        <div className="mt-5 rounded-[1.7rem] border border-blue-100 bg-blue-50 p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <SmallBadge className="border-blue-200 bg-white text-blue-800">Actions groupées</SmallBadge>
              {hardening.bulkActions.map((action) => (
                <button key={action.key} type="button" onClick={() => openBulkOutcome(action.label)} className={cx('rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] hover:bg-white', toneClass(action.tone))}>{action.label}</button>
              ))}
            </div>
            <p className="text-xs font-bold leading-5 text-slate-600">Bulk actions désactivables par droits, plan, crédits ou restrictions AC360.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher réf., parent, élève, facture, owner, statut, signal…"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none ring-blue-100 placeholder:text-slate-400 focus:border-blue-300 focus:ring-4"
          />
          <button type="button" onClick={() => setQuery('')} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-600 hover:border-blue-200 hover:bg-blue-50">Réinitialiser</button>
        </div>

        <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
          <div className="grid grid-cols-[42px_0.7fr_1.6fr_0.85fr_0.72fr_0.78fr_0.85fr] gap-3 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            <button type="button" onClick={toggleVisible} className="h-5 w-5 rounded-md border border-slate-300 bg-white">{allVisibleSelected ? '✓' : ''}</button>
            <span>Réf.</span><span>Dossier</span><span>Responsable</span><span>Priorité</span><span>Échéance</span><span>Preuve</span>
          </div>
          {filteredRecords.map((record) => {
            const selected = selectedIds.includes(record.id)
            return (
              <div key={record.id} className={cx('grid grid-cols-[42px_0.7fr_1.6fr_0.85fr_0.72fr_0.78fr_0.85fr] gap-3 border-t border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition', selected ? 'bg-blue-50' : 'bg-white hover:bg-slate-50')}>
                <button type="button" onClick={() => toggleRecord(record.id)} className={cx('h-5 w-5 rounded-md border text-[11px] font-black', selected ? 'border-blue-500 bg-blue-700 text-white' : 'border-slate-300 bg-white text-white')}>{selected ? '✓' : ''}</button>
                <button type="button" onClick={() => openRowOutcome(record)} className="text-left font-black text-slate-950 hover:text-blue-700">{record.id}</button>
                <button type="button" onClick={() => openRowOutcome(record)} className="text-left">
                  <span className="block font-black text-slate-950">{record.title}</span>
                  <span className="mt-1 block text-xs font-semibold text-slate-500">{record.signal}{record.amount ? ` · ${record.amount}` : ''}</span>
                </button>
                <span>{record.owner}</span>
                <span><SmallBadge className={priorityClass(record.priority)}>{record.priority}</SmallBadge></span>
                <span>{record.due || '—'}</span>
                <button type="button" onClick={() => openRowOutcome(record)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800">Ouvrir</button>
              </div>
            )
          })}
          {filteredRecords.length === 0 ? (
            <div className="border-t border-slate-200 bg-white p-8 text-center">
              <SmallBadge className="border-amber-200 bg-amber-50 text-amber-800">Aucun résultat</SmallBadge>
              <p className="mt-3 text-lg font-black text-slate-950">Aucune ligne ne correspond à la recherche.</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">Réinitialisez les filtres ou utilisez une vue sauvegardée.</p>
            </div>
          ) : null}
        </div>
      </div>

      <Ac360CustomerOutcomeDrawer
        open={Boolean(outcome)}
        outcome={outcome}
        onClose={() => setOutcome(null)}
        onRunPreflight={() => onOpenCommand(primaryCommand)}
      />
    </section>
  )
}
