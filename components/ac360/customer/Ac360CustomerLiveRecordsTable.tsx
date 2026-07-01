'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Ac360DedicatedModuleRoute } from '@/lib/ac360/customer-module-routes'
import { getAc360CustomerCommandsForModule, getAc360PrimaryCustomerCommand, type Ac360CustomerCommand } from '@/lib/ac360/customer-command-model'
import {
  buildAc360CustomerFormPreview,
  getAc360CustomerLiveRecordSpec,
  normalizeAc360CustomerLiveRecords,
  type Ac360CustomerLiveRecord,
  type Ac360CustomerLiveRecordsResult,
  type Ac360CustomerModuleActionForm,
} from '@/lib/ac360/customer-live-records-model'

type FetchState = 'chargement' | 'connecté' | 'fallback' | 'erreur'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function SmallBadge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={cx('inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em]', className)}>{children}</span>
}

function toneClass(tone: Ac360CustomerLiveRecord['statusTone']) {
  if (tone === 'emerald') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (tone === 'amber') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (tone === 'rose') return 'border-rose-200 bg-rose-50 text-rose-800'
  if (tone === 'violet') return 'border-violet-200 bg-violet-50 text-violet-800'
  if (tone === 'slate') return 'border-slate-200 bg-slate-50 text-slate-700'
  return 'border-blue-200 bg-blue-50 text-blue-800'
}

function stateBadgeClass(state: FetchState) {
  if (state === 'connecté') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (state === 'chargement') return 'border-blue-200 bg-blue-50 text-blue-800'
  if (state === 'erreur') return 'border-rose-200 bg-rose-50 text-rose-800'
  return 'border-amber-200 bg-amber-50 text-amber-800'
}

function FieldInput({ form, values, onChange }: { form: Ac360CustomerModuleActionForm; values: Record<string, string | number>; onChange: (key: string, value: string | number) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {form.fields.map((field) => {
        const value = values[field.key] ?? field.defaultValue ?? ''
        if (field.type === 'select') {
          return (
            <label key={field.key} className="grid gap-2">
              <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{field.label}{field.required ? ' *' : ''}</span>
              <select value={String(value)} onChange={(event) => onChange(field.key, event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
                {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          )
        }
        if (field.type === 'textarea') {
          return (
            <label key={field.key} className="grid gap-2 md:col-span-2">
              <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{field.label}{field.required ? ' *' : ''}</span>
              <textarea value={String(value)} placeholder={field.placeholder} onChange={(event) => onChange(field.key, event.target.value)} className="min-h-[88px] rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100" />
            </label>
          )
        }
        return (
          <label key={field.key} className="grid gap-2">
            <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{field.label}{field.required ? ' *' : ''}</span>
            <input type={field.type} value={value} placeholder={field.placeholder} onChange={(event) => onChange(field.key, field.type === 'number' ? Number(event.target.value) : event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100" />
          </label>
        )
      })}
    </div>
  )
}

function ModuleActionForm({ route, onOpenCommand }: { route: Ac360DedicatedModuleRoute; onOpenCommand: (command: Ac360CustomerCommand) => void }) {
  const spec = useMemo(() => getAc360CustomerLiveRecordSpec(route.moduleKey), [route.moduleKey])
  const form = spec.actionForms[0]
  const commands = useMemo(() => getAc360CustomerCommandsForModule(route.moduleKey), [route.moduleKey])
  const primaryCommand = commands.find((command) => command.shortLabel === form.commandHint || command.label.includes(form.commandHint)) || commands[0] || getAc360PrimaryCustomerCommand(route.moduleKey)
  const initialValues = useMemo(() => Object.fromEntries(form.fields.map((field) => [field.key, field.defaultValue ?? ''])) as Record<string, string | number>, [form])
  const [values, setValues] = useState<Record<string, string | number>>(initialValues)
  const preview = useMemo(() => buildAc360CustomerFormPreview(form, values), [form, values])

  return (
    <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-5 shadow-sm md:p-6" data-ac360-phase3g="module-action-form">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <SmallBadge className="border-blue-200 bg-white text-blue-800">Formulaire métier spécialisé</SmallBadge>
          <h3 className="mt-3 text-2xl font-black text-slate-950">{form.title}</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{form.description}</p>
        </div>
        <button type="button" onClick={() => onOpenCommand(primaryCommand)} className="rounded-2xl bg-blue-700 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-blue-800">Ouvrir pré-vol AC360</button>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.72fr]">
        <div className="rounded-[1.6rem] border border-blue-100 bg-white p-4">
          <FieldInput form={form} values={values} onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))} />
          <div className="mt-4 flex flex-wrap gap-2">
            <SmallBadge className="border-emerald-200 bg-emerald-50 text-emerald-800">{form.guardSignal}</SmallBadge>
            <SmallBadge className="border-amber-200 bg-amber-50 text-amber-800">{form.billingSignal}</SmallBadge>
          </div>
        </div>
        <div className="rounded-[1.6rem] border border-blue-100 bg-white p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Aperçu payload gardé</p>
          <pre className="mt-3 max-h-[240px] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 text-[11px] font-bold leading-5 text-slate-700">{JSON.stringify(preview, null, 2)}</pre>
          <div className="mt-4 grid gap-2">
            {form.payloadHints.map((hint) => <span key={hint} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">{hint}</span>)}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {form.nextSteps.map((step) => <SmallBadge key={step} className="border-slate-200 bg-white text-slate-700">{step}</SmallBadge>)}
      </div>
    </div>
  )
}

export function Ac360CustomerLiveRecordsTable({
  route,
  onOpenCommand,
}: {
  route: Ac360DedicatedModuleRoute
  onOpenCommand: (command: Ac360CustomerCommand) => void
}) {
  const spec = useMemo(() => getAc360CustomerLiveRecordSpec(route.moduleKey), [route.moduleKey])
  const [state, setState] = useState<FetchState>('chargement')
  const [result, setResult] = useState<Ac360CustomerLiveRecordsResult>(() => ({
    mode: 'fallback',
    title: 'Initialisation live records',
    message: 'Le tableau avancé prépare le runtime et le fallback sécurisé.',
    discoveredCollections: [],
    records: spec.fallbackRecords,
    rawCount: 0,
  }))
  const [query, setQuery] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<Ac360CustomerLiveRecord | null>(null)

  async function refresh() {
    setState('chargement')
    try {
      const response = await fetch(route.endpoint, { credentials: 'same-origin', cache: 'no-store' })
      const payload = await response.json().catch(() => ({ ok: false, error: `Réponse non JSON · HTTP ${response.status}` }))
      const normalized = normalizeAc360CustomerLiveRecords(route.moduleKey, payload)
      setResult(normalized)
      setState(normalized.mode === 'live' ? 'connecté' : normalized.mode === 'error' ? 'erreur' : 'fallback')
    } catch (error) {
      setResult({
        mode: 'error',
        title: 'Erreur de connexion contrôlée',
        message: error instanceof Error ? error.message : 'Endpoint indisponible.',
        discoveredCollections: [],
        records: spec.fallbackRecords,
        rawCount: 0,
      })
      setState('erreur')
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.endpoint, route.moduleKey])

  const filteredRecords = result.records.filter((record) => {
    const haystack = `${record.reference} ${record.primary} ${record.secondary} ${record.owner} ${record.status} ${record.amount} ${record.due} ${record.risk}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  })

  return (
    <section id="donnees-live" className="space-y-5" data-ac360-phase3g="live-records-real-tables">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <SmallBadge className="border-blue-200 bg-blue-50 text-blue-800">Phase 3G · Données live</SmallBadge>
              <SmallBadge className={stateBadgeClass(state)}>{state}</SmallBadge>
              <SmallBadge className="border-slate-200 bg-slate-50 text-slate-700">{spec.sourceLabel}</SmallBadge>
            </div>
            <h3 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950">{spec.title}</h3>
            <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">{spec.subtitle}</p>
          </div>
          <button type="button" onClick={refresh} className="rounded-2xl bg-blue-700 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-blue-800">Rafraîchir records</button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-4">
          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-800">Mode</p>
            <p className="mt-2 text-xl font-black text-slate-950">{result.mode}</p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-600">{result.title}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Records</p>
            <p className="mt-2 text-xl font-black text-slate-950">{filteredRecords.length}</p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-600">{result.rawCount || result.records.length} objet(s) runtime/fallback</p>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-800">Collections</p>
            <p className="mt-2 text-xl font-black text-slate-950">{result.discoveredCollections.length || spec.expectedCollections.length}</p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-600">attendues/détectées</p>
          </div>
          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-800">Sécurité</p>
            <p className="mt-2 text-xl font-black text-slate-950">fallback</p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-600">aucune rupture UX si endpoint vide</p>
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">{result.message}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(result.discoveredCollections.length ? result.discoveredCollections : spec.expectedCollections).slice(0, 8).map((collection) => (
              <SmallBadge key={collection} className="border-slate-200 bg-white text-slate-700">{collection}</SmallBadge>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher dans les données live : référence, parent, facture, statut, owner…" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100" />
          <button type="button" onClick={() => setQuery('')} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-700 hover:border-blue-200 hover:bg-blue-50">Réinitialiser</button>
        </div>

        <div className="mt-5 overflow-x-auto rounded-3xl border border-slate-200">
          <div className="grid min-w-[1080px] grid-cols-[130px_1.55fr_150px_150px_150px_140px_170px] gap-3 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            {spec.columns.map((column) => <span key={column.key} className={column.widthClass}>{column.label}</span>)}
          </div>
          {filteredRecords.map((record) => (
            <button key={`${record.reference}-${record.primary}`} type="button" onClick={() => setSelectedRecord(record)} className="grid min-w-[1080px] grid-cols-[130px_1.55fr_150px_150px_150px_140px_170px] gap-3 border-t border-slate-200 bg-white px-4 py-4 text-left text-sm font-bold text-slate-700 transition hover:bg-blue-50">
              <span className="font-black text-slate-950">{record.reference}</span>
              <span><span className="block font-black text-slate-950">{record.primary}</span><span className="mt-1 block text-xs font-semibold text-slate-500">{record.secondary}</span></span>
              <span>{record.owner}</span>
              <span><SmallBadge className={toneClass(record.statusTone)}>{record.status}</SmallBadge></span>
              <span>{record.amount}</span>
              <span>{record.due}</span>
              <span>{record.proof}</span>
            </button>
          ))}
          {!filteredRecords.length ? (
            <div className="border-t border-slate-200 bg-white p-8 text-center">
              <SmallBadge className="border-amber-200 bg-amber-50 text-amber-800">Aucun record filtré</SmallBadge>
              <p className="mt-3 text-lg font-black text-slate-950">Aucun objet live ne correspond à la recherche.</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">Le fallback structuré reste disponible pour les actions et démos client.</p>
            </div>
          ) : null}
        </div>
      </div>

      {selectedRecord ? (
        <div className="rounded-[2rem] border border-blue-200 bg-blue-50 p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <SmallBadge className="border-blue-200 bg-white text-blue-800">Détail record live</SmallBadge>
              <h3 className="mt-3 text-2xl font-black text-slate-950">{selectedRecord.primary}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{selectedRecord.secondary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => onOpenCommand(getAc360PrimaryCustomerCommand(route.moduleKey))} className="rounded-2xl bg-blue-700 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-blue-800">Commander</button>
              <button type="button" onClick={() => setSelectedRecord(null)} className="rounded-2xl border border-blue-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-800 hover:bg-blue-50">Fermer</button>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <SmallBadge className="border-slate-200 bg-white text-slate-700">Owner : {selectedRecord.owner}</SmallBadge>
            <SmallBadge className={toneClass(selectedRecord.statusTone)}>Statut : {selectedRecord.status}</SmallBadge>
            <SmallBadge className="border-amber-200 bg-white text-amber-800">Risque : {selectedRecord.risk}</SmallBadge>
            <SmallBadge className="border-emerald-200 bg-white text-emerald-800">Preuve : {selectedRecord.proof}</SmallBadge>
          </div>
        </div>
      ) : null}

      <ModuleActionForm route={route} onOpenCommand={onOpenCommand} />
    </section>
  )
}
