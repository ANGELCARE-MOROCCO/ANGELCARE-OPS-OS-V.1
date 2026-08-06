'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlarmClock, CalendarClock, CirclePause, CirclePlay, Clock3, Loader2, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import type { RevenueCommandDefinition } from '@/lib/revenue-command-os/command-kernel/types'
import { emitRevenueAction, managedRevenueHeaders, revenueActionId } from '../../_components/action-center/action-events'

type Schedule = {
  id: string
  code: string
  command_code: string
  label: string
  enabled: boolean
  timezone: string
  cadence: string
  business_hours_only: boolean
  next_run_at?: string | null
  last_run_at?: string | null
  missed_run_policy: 'skip' | 'run-once' | 'reschedule'
  owner_role: string
  execution_mode: string
  updated_at: string
}

type Draft = {
  scheduleId?: string
  code: string
  commandCode: string
  label: string
  cadence: string
  timezone: string
  ownerRole: string
  nextRunAt: string
  missedRunPolicy: 'skip' | 'run-once' | 'reschedule'
  businessHoursOnly: boolean
}

const emptyDraft: Draft = {
  code: '', commandCode: '', label: '', cadence: '0 8 * * 1-5', timezone: 'Africa/Casablanca', ownerRole: '', nextRunAt: '', missedRunPolicy: 'run-once', businessHoursOnly: true,
}

function formatDate(value?: string | null) {
  if (!value) return 'Non planifiée'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('fr-FR')
}

function commandLabel(commandCode: string, commands: RevenueCommandDefinition[]) {
  return commands.find((item) => item.commandCode === commandCode)?.name || commandCode
}

async function jsonRequest(path: string, init?: RequestInit) {
  const response = await fetch(path, init)
  const body = await response.json().catch(() => ({}))
  if (!response.ok || !body.ok) throw new Error(body?.error?.message || 'Opération impossible.')
  return body.data
}

export default function CommandScheduleStudio({ commands }: { commands: RevenueCommandDefinition[] }) {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [query, setQuery] = useState('')
  const [composer, setComposer] = useState<Draft | null>(null)
  const [runSchedule, setRunSchedule] = useState<Schedule | null>(null)
  const [runContext, setRunContext] = useState({ businessUnit: 'ANGELCARE', segment: '', territory: '', commercialStage: '', opportunityValueDh: '', contextKey: 'account_scope', contextValue: '' })
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await jsonRequest(`/api/revenue-command-os/command-schedules?q=${encodeURIComponent(query)}&limit=300`, { cache: 'no-store' })
      setSchedules(Array.isArray(data?.schedules) ? data.schedules : [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => { const timer = setTimeout(() => { void load() }, 180); return () => clearTimeout(timer) }, [load])

  const metrics = useMemo(() => ({
    active: schedules.filter((item) => item.enabled).length,
    paused: schedules.filter((item) => !item.enabled).length,
    overdue: schedules.filter((item) => item.enabled && item.next_run_at && new Date(item.next_run_at).getTime() < Date.now()).length,
  }), [schedules])

  async function mutate(title: string, action: string, payload: Record<string, unknown>) {
    const actionId = revenueActionId('command-schedule')
    const startedAt = new Date().toISOString()
    setBusy(`${action}:${String(payload.scheduleId || payload.code || '')}`)
    setMessage('')
    emitRevenueAction({ id: actionId, title, workspace: 'command-kernel', state: 'running', step: 'Mutation de la planification', progress: 35, startedAt })
    try {
      const data = await jsonRequest('/api/revenue-command-os/command-schedules', {
        method: 'POST',
        headers: managedRevenueHeaders({ 'Content-Type': 'application/json', 'x-revenue-action-id': actionId }),
        body: JSON.stringify({ action, payload }),
      })
      emitRevenueAction({ id: actionId, title, workspace: 'command-kernel', state: 'success', step: 'Planification synchronisée', progress: 100, startedAt, completedAt: new Date().toISOString(), resultHref: '/revenue-command-os/command-kernel?section=planning', auditHref: '/revenue-command-os/audit', dismissible: true })
      window.dispatchEvent(new CustomEvent('revenue-os:operation-completed', { detail: data }))
      await load()
      return data
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      emitRevenueAction({ id: actionId, title, workspace: 'command-kernel', state: 'failure', step: 'Échec', progress: 100, startedAt, completedAt: new Date().toISOString(), error: detail, auditHref: '/revenue-command-os/audit', dismissible: true })
      setMessage(detail)
      throw error
    } finally {
      setBusy('')
    }
  }

  async function saveDraft() {
    if (!composer) return
    const action = composer.scheduleId ? 'update' : 'create'
    await mutate(composer.scheduleId ? 'Planification modifiée' : 'Planification créée', action, {
      ...composer,
      nextRunAt: composer.nextRunAt || null,
    })
    setComposer(null)
  }

  async function executeNow() {
    if (!runSchedule) return
    await mutate('Commande planifiée exécutée maintenant', 'run_now', {
      scheduleId: runSchedule.id,
      businessUnit: runContext.businessUnit,
      segment: runContext.segment,
      territory: runContext.territory,
      commercialStage: runContext.commercialStage,
      opportunityValueDh: Number(runContext.opportunityValueDh || 0),
      context: [{ key: runContext.contextKey || 'operator_context', value: runContext.contextValue || `${runContext.segment} ${runContext.territory}`.trim(), state: 'available', source: 'operator-schedule-studio' }],
    })
    setRunSchedule(null)
  }

  function editSchedule(schedule: Schedule) {
    setComposer({
      scheduleId: schedule.id,
      code: schedule.code,
      commandCode: schedule.command_code,
      label: schedule.label,
      cadence: schedule.cadence,
      timezone: schedule.timezone,
      ownerRole: schedule.owner_role,
      nextRunAt: schedule.next_run_at ? new Date(schedule.next_run_at).toISOString().slice(0, 16) : '',
      missedRunPolicy: schedule.missed_run_policy,
      businessHoursOnly: schedule.business_hours_only,
    })
  }

  return <div className="revenue-command-schedule-studio space-y-5">
    <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,.07)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-blue-700">Planification opérationnelle LIVE</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Studio des commandes planifiées</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">Créez, modifiez, suspendez, reprenez et exécutez immédiatement chaque cadence. Une planification persistée n’est plus une simple architecture de démonstration.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setComposer({ ...emptyDraft })} className="inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-4 py-3 text-xs font-black text-white shadow-lg shadow-blue-200"><Plus size={16}/>Nouvelle planification</button>
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 disabled:opacity-50">{loading ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16}/>}Actualiser</button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[['Actives', metrics.active, 'text-emerald-700'], ['En pause', metrics.paused, 'text-amber-700'], ['Échues', metrics.overdue, metrics.overdue ? 'text-rose-700' : 'text-slate-950']].map(([label, value, tone]) => <div key={String(label)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500">{label}</p><p className={`mt-2 text-2xl font-black ${tone}`}>{value}</p></div>)}
      </div>
    </section>

    <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><Search size={17} className="text-slate-400"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Commande, code, libellé ou propriétaire…" className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"/></label>
      {message ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">{message}</p> : null}
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {schedules.map((schedule) => {
          const key = `${schedule.id}`
          return <article key={key} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,.04)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="font-mono text-[10px] font-black text-blue-700">{schedule.code}</p><h3 className="mt-2 text-sm font-black text-slate-950">{schedule.label}</h3><p className="mt-1 truncate text-[11px] font-semibold text-slate-500">{commandLabel(schedule.command_code, commands)}</p></div>
              <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[.1em] ${schedule.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{schedule.enabled ? 'Active' : 'En pause'}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-3"><div className="flex items-center gap-2 text-slate-500"><Clock3 size={13}/><span className="text-[9px] font-black uppercase">Cadence</span></div><p className="mt-2 font-mono text-xs font-black text-slate-950">{schedule.cadence}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{schedule.timezone}</p></div>
              <div className="rounded-2xl bg-slate-50 p-3"><div className="flex items-center gap-2 text-slate-500"><CalendarClock size={13}/><span className="text-[9px] font-black uppercase">Prochaine</span></div><p className="mt-2 text-[11px] font-black text-slate-950">{formatDate(schedule.next_run_at)}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">Dernière · {formatDate(schedule.last_run_at)}</p></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => editSchedule(schedule)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-black text-slate-700"><Pencil size={13}/>Modifier</button>
              <button type="button" onClick={() => setRunSchedule(schedule)} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-3 py-2 text-[10px] font-black text-white"><CirclePlay size={13}/>Exécuter maintenant</button>
              <button type="button" disabled={Boolean(busy)} onClick={() => void mutate(schedule.enabled ? 'Planification suspendue' : 'Planification reprise', schedule.enabled ? 'pause' : 'resume', { scheduleId: schedule.id })} className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black text-white ${schedule.enabled ? 'bg-amber-600' : 'bg-emerald-700'}`}>{schedule.enabled ? <CirclePause size={13}/> : <CirclePlay size={13}/>} {schedule.enabled ? 'Pause' : 'Reprendre'}</button>
              <button type="button" disabled={Boolean(busy)} onClick={() => { if (window.confirm(`Supprimer ${schedule.label} ?`)) void mutate('Planification supprimée', 'delete', { scheduleId: schedule.id }) }} className="inline-flex items-center gap-1.5 rounded-xl bg-rose-700 px-3 py-2 text-[10px] font-black text-white"><Trash2 size={13}/>Supprimer</button>
            </div>
          </article>
        })}
        {!loading && !schedules.length ? <div className="col-span-full rounded-[24px] border border-dashed border-slate-300 p-10 text-center"><AlarmClock className="mx-auto text-slate-300" size={34}/><h3 className="mt-3 text-sm font-black text-slate-900">Aucune planification persistée</h3><p className="mt-1 text-xs font-semibold text-slate-500">Créez la première cadence avec une commande, une fréquence et un contexte d’exécution.</p></div> : null}
      </div>
    </section>

    {composer ? <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[30px] bg-white p-6 shadow-2xl">
      <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.15em] text-blue-700">Commande planifiée</p><h3 className="mt-1 text-xl font-black text-slate-950">{composer.scheduleId ? 'Modifier la planification' : 'Créer une planification'}</h3></div><button type="button" onClick={() => setComposer(null)} className="rounded-xl border border-slate-200 p-2 text-slate-500"><X size={18}/></button></div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Code"><input value={composer.code} onChange={(event) => setComposer({ ...composer, code: event.target.value })} disabled={Boolean(composer.scheduleId)} className="field" placeholder="SCH-RABAT-DAILY"/></Field>
        <Field label="Commande"><select value={composer.commandCode} onChange={(event) => setComposer({ ...composer, commandCode: event.target.value })} disabled={Boolean(composer.scheduleId)} className="field"><option value="">Sélectionner…</option>{commands.slice(0, 4000).map((command) => <option key={command.commandCode} value={command.commandCode}>{command.commandCode} · {command.name}</option>)}</select></Field>
        <Field label="Libellé"><input value={composer.label} onChange={(event) => setComposer({ ...composer, label: event.target.value })} className="field"/></Field>
        <Field label="Cadence cron"><input value={composer.cadence} onChange={(event) => setComposer({ ...composer, cadence: event.target.value })} className="field" placeholder="0 8 * * 1-5"/></Field>
        <Field label="Fuseau horaire"><input value={composer.timezone} onChange={(event) => setComposer({ ...composer, timezone: event.target.value })} className="field"/></Field>
        <Field label="Propriétaire"><input value={composer.ownerRole} onChange={(event) => setComposer({ ...composer, ownerRole: event.target.value })} className="field"/></Field>
        <Field label="Prochaine exécution"><input type="datetime-local" value={composer.nextRunAt} onChange={(event) => setComposer({ ...composer, nextRunAt: event.target.value })} className="field"/></Field>
        <Field label="Rattrapage"><select value={composer.missedRunPolicy} onChange={(event) => setComposer({ ...composer, missedRunPolicy: event.target.value as Draft['missedRunPolicy'] })} className="field"><option value="run-once">Exécuter une fois</option><option value="skip">Ignorer</option><option value="reschedule">Replanifier</option></select></Field>
      </div>
      <label className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-xs font-black text-slate-700"><input type="checkbox" checked={composer.businessHoursOnly} onChange={(event) => setComposer({ ...composer, businessHoursOnly: event.target.checked })}/>Limiter aux heures ouvrées</label>
      <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setComposer(null)} className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-700">Annuler</button><button type="button" onClick={() => void saveDraft()} disabled={Boolean(busy) || !composer.commandCode || !composer.label || !composer.cadence} className="rounded-xl bg-blue-700 px-5 py-3 text-xs font-black text-white disabled:opacity-40">{busy ? 'Enregistrement…' : 'Enregistrer'}</button></div>
    </div></div> : null}

    {runSchedule ? <div className="fixed inset-0 z-[145] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-[30px] bg-white p-6 shadow-2xl">
      <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.15em] text-emerald-700">Exécution immédiate LIVE</p><h3 className="mt-1 text-xl font-black text-slate-950">{runSchedule.label}</h3></div><button type="button" onClick={() => setRunSchedule(null)} className="rounded-xl border border-slate-200 p-2 text-slate-500"><X size={18}/></button></div>
      <p className="mt-3 rounded-2xl bg-blue-50 p-3 text-xs font-semibold text-blue-900">La commande exacte <strong>{runSchedule.command_code}</strong> sera exécutée avec le contexte réel fourni ci-dessous.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Business unit"><input value={runContext.businessUnit} onChange={(event) => setRunContext({ ...runContext, businessUnit: event.target.value })} className="field"/></Field>
        <Field label="Segment"><input value={runContext.segment} onChange={(event) => setRunContext({ ...runContext, segment: event.target.value })} className="field"/></Field>
        <Field label="Territoire"><input value={runContext.territory} onChange={(event) => setRunContext({ ...runContext, territory: event.target.value })} className="field"/></Field>
        <Field label="Étape commerciale"><input value={runContext.commercialStage} onChange={(event) => setRunContext({ ...runContext, commercialStage: event.target.value })} className="field"/></Field>
        <Field label="Valeur opportunité (Dh)"><input type="number" value={runContext.opportunityValueDh} onChange={(event) => setRunContext({ ...runContext, opportunityValueDh: event.target.value })} className="field"/></Field>
        <Field label="Clé de contexte"><input value={runContext.contextKey} onChange={(event) => setRunContext({ ...runContext, contextKey: event.target.value })} className="field"/></Field>
        <div className="md:col-span-2"><Field label="Valeur de contexte réelle"><textarea value={runContext.contextValue} onChange={(event) => setRunContext({ ...runContext, contextValue: event.target.value })} className="field min-h-24" placeholder="Ex. 30 crèches premium à Rabat, comptes qualifiés au 06/08/2026"/></Field></div>
      </div>
      <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setRunSchedule(null)} className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-700">Annuler</button><button type="button" onClick={() => void executeNow()} disabled={Boolean(busy) || !runContext.contextValue.trim()} className="rounded-xl bg-emerald-700 px-5 py-3 text-xs font-black text-white disabled:opacity-40">{busy ? 'Exécution…' : 'Exécuter maintenant'}</button></div>
    </div></div> : null}

    <style>{`.revenue-command-schedule-studio .field{width:100%;border:1px solid rgb(226 232 240);border-radius:14px;padding:11px 12px;font-size:12px;font-weight:700;color:rgb(15 23 42);outline:none;background:white}.revenue-command-schedule-studio .field:focus{border-color:rgb(37 99 235);box-shadow:0 0 0 3px rgba(37,99,235,.1)}.revenue-command-schedule-studio .field:disabled{background:rgb(248 250 252);color:rgb(100 116 139)}`}</style>
  </div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[.1em] text-slate-500">{label}</span>{children}</label>
}
