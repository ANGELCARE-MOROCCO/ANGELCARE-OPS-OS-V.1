'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Activity, Archive, ArrowRight, BadgeDollarSign, CheckCircle2, ClipboardCheck,
  Copy, FileText, GitBranch, Link2, ListChecks, Loader2, MessageSquareText,
  Plus, RefreshCw, Save, Sparkles, Target, Trash2, Unlink, UserRound, X,
} from 'lucide-react'
import { emitRevenueAction, managedRevenueHeaders, revenueActionId } from '../action-center/action-events'

type EntityType = 'objective' | 'strategy' | 'program' | 'mission' | 'task' | 'exception'
type Tab = 'dossier' | 'children' | 'notes' | 'relations' | 'audit'
type DepthData = {
  entityType: EntityType
  entity: Record<string, any>
  title: string
  relations: Array<Record<string, any>>
  notes: Array<Record<string, any>>
  audit: Array<Record<string, any>>
  childType: EntityType | null
  children: Array<Record<string, any>>
  generatedAt: string
}

const tabLabels: Record<Tab, string> = {
  dossier: 'Dossier', children: 'Sous-objets', notes: 'Preuves & travail', relations: 'Relations', audit: 'Chronologie',
}

function valueOf(entity: Record<string, any>, key: string) {
  const payload = entity?.payload && typeof entity.payload === 'object' ? entity.payload : {}
  const metadata = entity?.metadata && typeof entity.metadata === 'object' ? entity.metadata : {}
  return entity?.[key] ?? payload?.[key] ?? metadata?.[key] ?? ''
}

function titleOf(row: Record<string, any>) {
  const payload = row?.payload && typeof row.payload === 'object' ? row.payload : {}
  const metadata = row?.metadata && typeof row.metadata === 'object' ? row.metadata : {}
  return String(row?.title || payload?.title || metadata?.title || row?.code || 'Dossier Revenue OS')
}

export default function OperationalEntityDrawer({
  entityType,
  entityId,
  title,
  triggerLabel = 'Ouvrir le dossier',
  compact = false,
  onChanged,
}: {
  entityType: EntityType
  entityId: string
  title?: string
  triggerLabel?: string
  compact?: boolean
  onChanged?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('dossier')
  const [data, setData] = useState<DepthData | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [edit, setEdit] = useState<Record<string, string>>({})
  const [note, setNote] = useState({ kind: 'comment', title: '', body: '', dueAt: '', valueNumeric: '' })
  const [child, setChild] = useState({ title: '', code: '', ownerLabel: '', deadline: '' })
  const [relation, setRelation] = useState({ toType: 'objective', toId: '', relationKind: 'related' })
  const [outcome, setOutcome] = useState({ outcomeType: 'commercial_result', revenueValueDh: '', marginValueDh: '', confidence: '1', summary: '' })

  const entity = data?.entity || {}
  const status = String(valueOf(entity, 'status') || 'active')

  async function load() {
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(`/api/revenue-command-os/operational-depth?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`, { cache: 'no-store' })
      const body = await response.json()
      if (!response.ok || !body.ok) throw new Error(body?.error?.message || 'Lecture du dossier impossible.')
      const next = body.data as DepthData
      setData(next)
      const row = next.entity || {}
      setEdit({
        title: String(valueOf(row, 'title') || next.title || ''),
        mandate: String(valueOf(row, 'mandate') || valueOf(row, 'description') || ''),
        ownerLabel: String(valueOf(row, 'ownerLabel') || valueOf(row, 'owner_label') || ''),
        status: String(valueOf(row, 'status') || 'active'),
        startDate: String(valueOf(row, 'startDate') || ''),
        deadline: String(valueOf(row, 'deadline') || valueOf(row, 'dueAt') || ''),
        revenueTargetDh: String(valueOf(row, 'revenueTargetDh') || valueOf(row, 'revenueTarget') || ''),
        marginTargetPercent: String(valueOf(row, 'marginTargetPercent') || valueOf(row, 'marginTarget') || ''),
        budgetDh: String(valueOf(row, 'budgetDh') || valueOf(row, 'budgetLimit') || ''),
        territories: Array.isArray(valueOf(row, 'territories')) ? valueOf(row, 'territories').join(' | ') : String(valueOf(row, 'territories') || ''),
        accounts: Array.isArray(valueOf(row, 'accounts')) ? valueOf(row, 'accounts').join(' | ') : String(valueOf(row, 'accounts') || ''),
        kpis: Array.isArray(valueOf(row, 'kpis')) ? valueOf(row, 'kpis').join(' | ') : String(valueOf(row, 'kpis') || ''),
        nextAction: String(valueOf(row, 'nextAction') || ''),
      })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Lecture impossible.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => { if (open) void load() }, [open, entityId])

  async function mutate(action: string, payload: Record<string, unknown> = {}) {
    const actionId = revenueActionId(`depth-${entityType}`)
    const startedAt = new Date().toISOString()
    emitRevenueAction({ id: actionId, title: `${action} · ${title || data?.title || entityType}`, workspace: entityType, state: 'running', step: 'Mutation du dossier', indeterminate: true, startedAt })
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/revenue-command-os/operational-depth', {
        method: 'POST',
        headers: managedRevenueHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ action, entityType, entityId, payload }),
      })
      const body = await response.json()
      if (!response.ok || !body.ok) throw new Error(body?.error?.message || 'Action impossible.')
      emitRevenueAction({ id: actionId, title: `${action} · ${title || data?.title || entityType}`, workspace: entityType, state: 'success', step: 'Dossier synchronisé', progress: 100, startedAt, completedAt: new Date().toISOString(), resultHref: window.location.pathname, auditHref: '/revenue-command-os/audit', dismissible: true })
      setMessage('Action exécutée et synchronisée.')
      await load()
      onChanged?.()
      window.dispatchEvent(new CustomEvent('revenue-os:operation-completed', { detail: body.data }))
      return body.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Action impossible.'
      emitRevenueAction({ id: actionId, title: `${action} · ${title || data?.title || entityType}`, workspace: entityType, state: 'failure', step: 'Échec', startedAt, completedAt: new Date().toISOString(), error: errorMessage, dismissible: true })
      setMessage(errorMessage)
      throw error
    } finally {
      setBusy(false)
    }
  }

  async function saveDossier() {
    await mutate('update_fields', {
      ...edit,
      revenueTargetDh: edit.revenueTargetDh ? Number(edit.revenueTargetDh) : undefined,
      marginTargetPercent: edit.marginTargetPercent ? Number(edit.marginTargetPercent) : undefined,
      budgetDh: edit.budgetDh ? Number(edit.budgetDh) : undefined,
      territories: edit.territories.split('|').map((item) => item.trim()).filter(Boolean),
      accounts: edit.accounts.split('|').map((item) => item.trim()).filter(Boolean),
      kpis: edit.kpis.split('|').map((item) => item.trim()).filter(Boolean),
    })
  }

  const noteGroups = useMemo(() => {
    const groups = new Map<string, Array<Record<string, any>>>()
    for (const item of data?.notes || []) {
      const kind = String(item.note_kind || 'comment')
      groups.set(kind, [...(groups.get(kind) || []), item])
    }
    return groups
  }, [data?.notes])

  return <>
    <button type="button" onClick={() => setOpen(true)} className={`${compact ? 'px-3 py-2 text-[10px]' : 'px-4 py-2.5 text-xs'} inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white font-black text-slate-800 shadow-sm transition hover:border-blue-300 hover:text-blue-700`}><FileText size={14} />{triggerLabel}</button>
    {open ? <div className="fixed inset-0 z-[140] flex justify-end bg-slate-950/45 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) setOpen(false) }}>
      <aside className="flex h-full w-full max-w-[920px] flex-col overflow-hidden border-l border-slate-200 bg-[#f8fafc] shadow-[-30px_0_100px_rgba(15,23,42,.24)]">
        <header className="border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white"><Target size={20} /></span>
            <div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[.16em] text-blue-700">Dossier opérationnel synchronisé</p><h2 className="mt-1 truncate text-2xl font-black tracking-[-.04em] text-slate-950">{data?.title || title || entityType}</h2><div className="mt-2 flex flex-wrap items-center gap-2"><span className="rounded-full bg-emerald-100 px-3 py-1 text-[9px] font-black uppercase text-emerald-800">{status}</span><span className="rounded-full bg-blue-100 px-3 py-1 text-[9px] font-black uppercase text-blue-800">{entityType}</span><span className="break-all font-mono text-[9px] text-slate-400">{entityId}</span></div></div>
            <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><X size={18} /></button>
          </div>
          <nav className="mt-5 flex gap-2 overflow-x-auto pb-1">{(Object.keys(tabLabels) as Tab[]).map((item) => <button type="button" key={item} onClick={() => setTab(item)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-[.08em] ${tab === item ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{tabLabels[item]}{item === 'children' && data?.children?.length ? ` · ${data.children.length}` : item === 'notes' && data?.notes?.length ? ` · ${data.notes.length}` : ''}</button>)}</nav>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
          {busy && !data ? <div className="grid min-h-80 place-items-center"><Loader2 className="animate-spin text-blue-700" size={32} /></div> : null}
          {message ? <div className={`mb-5 rounded-2xl border px-4 py-3 text-xs font-bold ${/impossible|échec|error|introuvable/i.test(message) ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{message}</div> : null}

          {data && tab === 'dossier' ? <div className="space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-blue-700">Données de pilotage</p><h3 className="mt-1 text-xl font-black text-slate-950">Éditer le dossier actif</h3></div><button type="button" onClick={() => void saveDossier()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50">{busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}Enregistrer</button></div>
              <div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Titre" value={edit.title} onChange={(value) => setEdit((current) => ({ ...current, title: value }))} /><Field label="Responsable" value={edit.ownerLabel} onChange={(value) => setEdit((current) => ({ ...current, ownerLabel: value }))} /><Field label="Statut" value={edit.status} onChange={(value) => setEdit((current) => ({ ...current, status: value }))} /><Field label="Prochaine action" value={edit.nextAction} onChange={(value) => setEdit((current) => ({ ...current, nextAction: value }))} /><Field label="Date de démarrage" value={edit.startDate} type="date" onChange={(value) => setEdit((current) => ({ ...current, startDate: value }))} /><Field label="Échéance" value={edit.deadline} type="date" onChange={(value) => setEdit((current) => ({ ...current, deadline: value }))} /><Field label="Cible revenus (Dh)" value={edit.revenueTargetDh} type="number" onChange={(value) => setEdit((current) => ({ ...current, revenueTargetDh: value }))} /><Field label="Marge cible (%)" value={edit.marginTargetPercent} type="number" onChange={(value) => setEdit((current) => ({ ...current, marginTargetPercent: value }))} /><Field label="Budget (Dh)" value={edit.budgetDh} type="number" onChange={(value) => setEdit((current) => ({ ...current, budgetDh: value }))} /><Field label="Territoires · séparateur |" value={edit.territories} onChange={(value) => setEdit((current) => ({ ...current, territories: value }))} /><Field label="Comptes · séparateur |" value={edit.accounts} onChange={(value) => setEdit((current) => ({ ...current, accounts: value }))} /><Field label="KPIs · séparateur |" value={edit.kpis} onChange={(value) => setEdit((current) => ({ ...current, kpis: value }))} /></div>
              <label className="mt-4 block text-[10px] font-black uppercase tracking-[.1em] text-slate-500">Mandat / description<textarea value={edit.mandate} onChange={(event) => setEdit((current) => ({ ...current, mandate: event.target.value }))} rows={4} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
            </section>

            <section className="grid gap-4 lg:grid-cols-3"><ActionCard icon={Copy} title="Dupliquer" detail="Crée un dossier indépendant lié à cette source." action="Créer la copie" onClick={() => void mutate('duplicate')} /><ActionCard icon={BadgeDollarSign} title="Résultat commercial" detail="Enregistre revenus, marge et confiance dans l’attribution." action="Enregistrer" onClick={() => setTab('notes')} /><ActionCard icon={Archive} title="Cycle de vie" detail="Les actions de pause, clôture, réouverture et archivage restent disponibles sur la carte source." action="Voir le workspace" onClick={() => setOpen(false)} /></section>

            <section className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white"><p className="text-[9px] font-black uppercase tracking-[.15em] text-blue-300">Données techniques contrôlées</p><pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-2xl bg-white/5 p-4 text-[10px] leading-5 text-slate-300">{JSON.stringify(entity, null, 2)}</pre></section>
          </div> : null}

          {data && tab === 'children' ? <div className="space-y-6">
            {data.childType ? <section className="rounded-[28px] border border-blue-200 bg-blue-50 p-5"><div className="flex items-start gap-4"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-700 text-white"><Plus size={18} /></span><div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-[.15em] text-blue-700">Création verticale</p><h3 className="mt-1 text-xl font-black text-slate-950">Créer un {data.childType}</h3><div className="mt-4 grid gap-3 md:grid-cols-2"><Field label="Titre" value={child.title} onChange={(value) => setChild((current) => ({ ...current, title: value }))} /><Field label="Code" value={child.code} onChange={(value) => setChild((current) => ({ ...current, code: value }))} /><Field label="Responsable" value={child.ownerLabel} onChange={(value) => setChild((current) => ({ ...current, ownerLabel: value }))} /><Field label="Échéance" value={child.deadline} type="date" onChange={(value) => setChild((current) => ({ ...current, deadline: value }))} /></div><button type="button" onClick={async () => { await mutate('create_child', child); setChild({ title: '', code: '', ownerLabel: '', deadline: '' }) }} disabled={!child.title || busy} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"><Plus size={15} />Créer et synchroniser</button></div></div></section> : null}
            <section className="rounded-[28px] border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">Objets enfants</p><h3 className="mt-1 text-xl font-black text-slate-950">Chaîne d’exécution liée</h3></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{data.children.length}</span></div><div className="mt-5 space-y-3">{data.children.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 p-4"><span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-white"><ListChecks size={15} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-950">{titleOf(item)}</p><p className="mt-1 font-mono text-[9px] text-slate-400">{item.code || item.id}</p></div><span className="rounded-full bg-emerald-100 px-3 py-1 text-[9px] font-black uppercase text-emerald-800">{item.status || item.payload?.status || 'active'}</span>{data.childType ? <OperationalEntityDrawer entityType={data.childType} entityId={String(item.id)} title={titleOf(item)} compact /> : null}</div>)}{!data.children.length ? <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Aucun sous-objet n’est encore lié à ce dossier.</p> : null}</div></section>
          </div> : null}

          {data && tab === 'notes' ? <div className="space-y-6">
            <section className="rounded-[28px] border border-violet-200 bg-violet-50 p-5"><div className="flex items-start gap-4"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-700 text-white"><MessageSquareText size={18} /></span><div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-[.15em] text-violet-700">Travail et preuves</p><h3 className="mt-1 text-xl font-black text-slate-950">Ajouter un élément exploitable</h3><div className="mt-4 grid gap-3 md:grid-cols-2"><label className="text-[10px] font-black uppercase tracking-[.1em] text-slate-500">Type<select value={note.kind} onChange={(event) => setNote((current) => ({ ...current, kind: event.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-violet-200 bg-white px-3 text-sm font-bold text-slate-900"><option value="comment">Commentaire</option><option value="evidence">Preuve</option><option value="milestone">Jalon</option><option value="kpi">KPI</option><option value="account">Compte cible</option><option value="result">Résultat</option><option value="checklist">Checklist</option><option value="recovery">Action de récupération</option><option value="decision">Décision</option></select></label><Field label="Titre" value={note.title} onChange={(value) => setNote((current) => ({ ...current, title: value }))} /><Field label="Échéance" value={note.dueAt} type="datetime-local" onChange={(value) => setNote((current) => ({ ...current, dueAt: value }))} /><Field label="Valeur numérique" value={note.valueNumeric} type="number" onChange={(value) => setNote((current) => ({ ...current, valueNumeric: value }))} /></div><label className="mt-3 block text-[10px] font-black uppercase tracking-[.1em] text-slate-500">Détail<textarea value={note.body} onChange={(event) => setNote((current) => ({ ...current, body: event.target.value }))} rows={3} className="mt-2 w-full rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm font-semibold" /></label><button type="button" onClick={async () => { await mutate('add_note', { ...note, valueNumeric: note.valueNumeric ? Number(note.valueNumeric) : undefined }); setNote({ kind: 'comment', title: '', body: '', dueAt: '', valueNumeric: '' }) }} disabled={!note.title || busy} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"><Plus size={15} />Ajouter au dossier</button></div></div></section>

            <section className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-emerald-700">Attribution commerciale</p><h3 className="mt-1 text-xl font-black text-slate-950">Enregistrer un résultat</h3><div className="mt-4 grid gap-3 md:grid-cols-2"><Field label="Type de résultat" value={outcome.outcomeType} onChange={(value) => setOutcome((current) => ({ ...current, outcomeType: value }))} /><Field label="Revenus (Dh)" value={outcome.revenueValueDh} type="number" onChange={(value) => setOutcome((current) => ({ ...current, revenueValueDh: value }))} /><Field label="Marge (Dh)" value={outcome.marginValueDh} type="number" onChange={(value) => setOutcome((current) => ({ ...current, marginValueDh: value }))} /><Field label="Confiance 0–1" value={outcome.confidence} type="number" onChange={(value) => setOutcome((current) => ({ ...current, confidence: value }))} /></div><Field label="Résumé" value={outcome.summary} onChange={(value) => setOutcome((current) => ({ ...current, summary: value }))} /><button type="button" onClick={async () => { await mutate('record_outcome', { ...outcome, revenueValueDh: Number(outcome.revenueValueDh || 0), marginValueDh: Number(outcome.marginValueDh || 0), confidence: Number(outcome.confidence || 1) }); setOutcome({ outcomeType: 'commercial_result', revenueValueDh: '', marginValueDh: '', confidence: '1', summary: '' }) }} disabled={busy} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white"><BadgeDollarSign size={15} />Enregistrer le résultat</button></section>

            {[...noteGroups.entries()].map(([kind, items]) => <section key={kind} className="rounded-[28px] border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><h3 className="text-sm font-black uppercase tracking-[.08em] text-slate-950">{kind}</h3><span className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black text-slate-600">{items.length}</span></div><div className="mt-4 space-y-3">{items.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-700">{kind === 'evidence' ? <FileText size={15} /> : kind === 'checklist' ? <ClipboardCheck size={15} /> : <MessageSquareText size={15} />}</span><div className="min-w-0 flex-1"><p className="text-sm font-black text-slate-950">{item.title}</p><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-600">{item.body}</p><div className="mt-2 flex flex-wrap gap-2 text-[9px] font-bold text-slate-400"><span>{item.status}</span>{item.due_at ? <span>Échéance {new Date(item.due_at).toLocaleString('fr-FR')}</span> : null}{item.value_numeric != null ? <span>Valeur {item.value_numeric}</span> : null}</div></div><button type="button" onClick={() => void mutate('delete_note', { noteId: item.id })} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={14} /></button></div></article>)}</div></section>)}
          </div> : null}

          {data && tab === 'relations' ? <div className="space-y-6"><section className="rounded-[28px] border border-cyan-200 bg-cyan-50 p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-cyan-700">Graphe commercial</p><h3 className="mt-1 text-xl font-black text-slate-950">Relier un dossier existant</h3><div className="mt-4 grid gap-3 md:grid-cols-3"><label className="text-[10px] font-black uppercase tracking-[.1em] text-slate-500">Type<select value={relation.toType} onChange={(event) => setRelation((current) => ({ ...current, toType: event.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-cyan-200 bg-white px-3 text-sm font-bold"><option value="objective">Objectif</option><option value="strategy">Stratégie</option><option value="program">Programme</option><option value="mission">Mission</option><option value="task">Tâche</option><option value="exception">Exception</option></select></label><Field label="ID du dossier" value={relation.toId} onChange={(value) => setRelation((current) => ({ ...current, toId: value }))} /><Field label="Nature du lien" value={relation.relationKind} onChange={(value) => setRelation((current) => ({ ...current, relationKind: value }))} /></div><button type="button" onClick={() => void mutate('link_entity', relation)} disabled={!relation.toId || busy} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"><Link2 size={15} />Créer le lien</button></section><section className="rounded-[28px] border border-slate-200 bg-white p-5"><h3 className="text-xl font-black text-slate-950">Relations persistées</h3><div className="mt-4 space-y-3">{data.relations.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4"><GitBranch size={16} className="text-cyan-700" /><div className="min-w-0 flex-1"><p className="text-xs font-black text-slate-950">{item.from_type}/{item.from_id} → {item.to_type}/{item.to_id}</p><p className="mt-1 text-[9px] uppercase tracking-[.1em] text-slate-400">{item.relation_kind}</p></div><button type="button" onClick={() => void mutate('unlink_entity', { relationId: item.id })} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-700"><Unlink size={14} /></button></div>)}{!data.relations.length ? <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Aucune relation explicite n’a encore été créée.</p> : null}</div></section></div> : null}

          {data && tab === 'audit' ? <section className="rounded-[28px] border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-blue-700">Chronologie causale</p><h3 className="mt-1 text-xl font-black text-slate-950">Activité du dossier</h3></div><button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700"><RefreshCw size={14} />Actualiser</button></div><div className="relative mt-5 space-y-4 before:absolute before:bottom-4 before:left-[17px] before:top-4 before:w-px before:bg-slate-200">{data.audit.map((item) => <article key={item.id} className="relative flex gap-4 pl-1"><span className="relative z-10 mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-700 text-white"><Activity size={13} /></span><div className="min-w-0 flex-1 rounded-2xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-black text-slate-950">{item.action}</p><span className="text-[9px] font-bold text-slate-400">{new Date(item.created_at).toLocaleString('fr-FR')}</span></div><p className="mt-1 text-xs text-slate-600">{item.summary || item.outcome}</p><p className="mt-2 text-[9px] font-bold text-slate-400">{item.actor_label || item.actor_id || 'Système'}</p></div></article>)}{!data.audit.length ? <p className="ml-12 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Aucun événement d’audit lié n’est disponible.</p> : null}</div></section> : null}
        </div>

        <footer className="border-t border-slate-200 bg-white px-5 py-4 sm:px-7"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-[10px] font-bold text-slate-500">Synchronisation: dossier · relations · preuves · audit</p><div className="flex gap-2"><button type="button" onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700"><RefreshCw size={14} />Actualiser</button><button type="button" onClick={() => setOpen(false)} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white">Fermer<ArrowRight size={14} /></button></div></div></footer>
      </aside>
    </div> : null}
  </>
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="block text-[10px] font-black uppercase tracking-[.1em] text-slate-500">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
}

function ActionCard({ icon: Icon, title, detail, action, onClick }: { icon: typeof Sparkles; title: string; detail: string; action: string; onClick: () => void }) {
  return <article className="rounded-[24px] border border-slate-200 bg-white p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-800"><Icon size={17} /></span><h3 className="mt-3 text-sm font-black text-slate-950">{title}</h3><p className="mt-1 min-h-10 text-[10px] leading-5 text-slate-500">{detail}</p><button type="button" onClick={onClick} className="mt-3 inline-flex items-center gap-1 text-[10px] font-black text-blue-700">{action}<ArrowRight size={12} /></button></article>
}
