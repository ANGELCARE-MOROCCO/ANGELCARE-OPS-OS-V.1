'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Activity, ArrowRight, BadgeDollarSign, Boxes, CalendarDays, CheckCircle2, CircleAlert,
  Copy, FileText, GitBranch, Layers3, Network, Plus, Save, Sparkles, Target, UsersRound, X,
} from 'lucide-react'
import LiveEntityActions from '../live-operations/LiveEntityActions'
import {
  AuditFeed, BusyOverlay, DossierBackdrop, NoteComposer, NoteFeed, ProgressBar, RelationManager,
  StudioField, StudioMetric, StudioSelect, StudioTextArea, TonePill,
} from './SovereignDossierPrimitives'
import { useSovereignDossier } from './useSovereignDossier'
import {
  arrayOf, clamp, dateLabel, deadlineOf, daysRemaining, money, numberOf, ownerOf,
  statusOf, textOf, titleOf,
} from './sovereign-workspace-utils'

type View = 'architecture' | 'evidence' | 'execution' | 'results' | 'audit'

export default function MandateArchitectureDossier({
  entityId,
  title,
  compact = false,
  onChanged,
}: {
  entityId: string
  title?: string
  compact?: boolean
  onChanged?: () => void | Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('architecture')
  const { data, busy, message, mutate } = useSovereignDossier({
    entityType: 'objective',
    entityId,
    open,
    workspace: 'revenue-objectives',
    onChanged,
  })
  const entity = data?.entity
  const [edit, setEdit] = useState({
    title: '',
    mandate: '',
    ownerLabel: '',
    status: 'active',
    targetMarket: '',
    businessUnit: '',
    horizon: '',
    priority: 'high',
    deadline: '',
    revenueTargetDh: '',
    marginTargetPercent: '',
    budgetDh: '',
    territories: '',
    accounts: '',
    kpis: '',
    nextAction: '',
  })
  const [childTitle, setChildTitle] = useState('')
  const [outcome, setOutcome] = useState({ revenueValueDh: '', marginValueDh: '', confidence: '1', summary: '' })

  useEffect(() => {
    if (!entity) return
    setEdit({
      title: titleOf(entity),
      mandate: textOf(entity, 'mandate', textOf(entity, 'description')),
      ownerLabel: ownerOf(entity),
      status: statusOf(entity),
      targetMarket: textOf(entity, 'targetMarket', textOf(entity, 'target_market')),
      businessUnit: textOf(entity, 'businessUnit', textOf(entity, 'business_unit', 'ANGELCARE')),
      horizon: textOf(entity, 'horizon'),
      priority: textOf(entity, 'priority', 'high'),
      deadline: String(deadlineOf(entity) || ''),
      revenueTargetDh: String(numberOf(entity, 'revenueTargetDh') || ''),
      marginTargetPercent: String(numberOf(entity, 'marginTargetPercent') || ''),
      budgetDh: String(numberOf(entity, 'budgetDh') || numberOf(entity, 'budgetLimit') || ''),
      territories: arrayOf(entity, 'territories').join(' | '),
      accounts: arrayOf(entity, 'accounts').join(' | '),
      kpis: arrayOf(entity, 'kpis').join(' | '),
      nextAction: textOf(entity, 'nextAction'),
    })
  }, [entity])

  const notes = data?.notes || []
  const relations = data?.relations || []
  const strategies = data?.children || []
  const evidence = notes.filter((item) => item.note_kind === 'evidence')
  const decisions = notes.filter((item) => item.note_kind === 'decision')
  const milestones = notes.filter((item) => item.note_kind === 'milestone')
  const accounts = notes.filter((item) => item.note_kind === 'account')
  const kpis = notes.filter((item) => item.note_kind === 'kpi')
  const results = notes.filter((item) => item.note_kind === 'result')
  const target = numberOf(entity, 'revenueTargetDh')
  const actual = Number(results.reduce((sum, item) => sum + Number(item.value_numeric || 0), 0))
  const remainingDays = daysRemaining(deadlineOf(entity))
  const completeness = useMemo(() => {
    if (!entity) return 0
    const checks = [
      titleOf(entity), textOf(entity, 'mandate'), ownerOf(entity), textOf(entity, 'targetMarket', textOf(entity, 'target_market')),
      deadlineOf(entity), target > 0, arrayOf(entity, 'territories').length || textOf(entity, 'targetMarket'),
      arrayOf(entity, 'accounts').length || accounts.length, strategies.length, evidence.length, milestones.length, kpis.length,
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }, [accounts.length, entity, evidence.length, kpis.length, milestones.length, strategies.length, target])
  const gaps = useMemo(() => {
    if (!entity) return []
    return [
      !ownerOf(entity) || ownerOf(entity) === 'Non assigné' ? 'Responsable non attribué' : '',
      !deadlineOf(entity) ? 'Échéance absente' : '',
      target <= 0 ? 'Cible de revenus non renseignée' : '',
      !textOf(entity, 'targetMarket', textOf(entity, 'target_market')) ? 'Marché cible absent' : '',
      !arrayOf(entity, 'accounts').length && !accounts.length ? 'Univers de comptes non documenté' : '',
      !strategies.length ? 'Aucune stratégie générée' : '',
      !evidence.length ? 'Aucune preuve attachée' : '',
      !milestones.length ? 'Aucun jalon défini' : '',
    ].filter(Boolean)
  }, [accounts.length, entity, evidence.length, milestones.length, strategies.length, target])

  async function save() {
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

  async function addOutcome() {
    await mutate('record_outcome', {
      outcomeType: 'commercial_result',
      revenueValueDh: Number(outcome.revenueValueDh || 0),
      marginValueDh: Number(outcome.marginValueDh || 0),
      confidence: Number(outcome.confidence || 1),
      summary: outcome.summary,
    })
    setOutcome({ revenueValueDh: '', marginValueDh: '', confidence: '1', summary: '' })
  }

  const tabs: Array<{ key: View; label: string }> = [
    { key: 'architecture', label: 'Architecture du mandat' },
    { key: 'evidence', label: `Preuves & décisions · ${notes.length}` },
    { key: 'execution', label: `Exécution · ${strategies.length}` },
    { key: 'results', label: 'Résultats' },
    { key: 'audit', label: 'Audit' },
  ]

  return <>
    <button type="button" onClick={() => setOpen(true)} className={`${compact ? 'px-3 py-2 text-[10px]' : 'px-4 py-2.5 text-xs'} inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white font-black text-blue-800 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400`}><Network size={14} />Architecture du mandat</button>
    {open ? <DossierBackdrop onClose={() => setOpen(false)} maxWidth="max-w-[1580px]">
      <header className="border-b border-blue-100 bg-white px-5 py-4 sm:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-blue-700 text-white shadow-lg"><Target size={22} /></span>
            <div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[.18em] text-blue-700">Strategic Mandate Architecture Room</p><h2 className="mt-1 truncate text-2xl font-black tracking-[-.04em] text-slate-950 sm:text-3xl">{data?.title || title || 'Mandat Revenue OS'}</h2><div className="mt-2 flex flex-wrap items-center gap-2"><TonePill value={statusOf(entity)} /><span className="text-[10px] font-bold text-slate-500">{ownerOf(entity)}</span><span className="text-[10px] font-bold text-slate-400">Échéance {dateLabel(deadlineOf(entity))}</span></div></div>
          </div>
          <div className="flex flex-wrap items-center gap-2"><LiveEntityActions entityType="objective" entityId={entityId} compact /><button type="button" disabled={busy || !data} onClick={() => void save()} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"><Save size={14} />Enregistrer</button><button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600"><X size={17} /></button></div>
        </div>
        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">{tabs.map((tab) => <button key={tab.key} type="button" onClick={() => setView(tab.key)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-[.08em] ${view === tab.key ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{tab.label}</button>)}</nav>
      </header>

      <div className="relative min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        {busy ? <BusyOverlay label="Synchronisation du mandat…" /> : null}
        {message ? <p className={`mb-4 rounded-xl border p-3 text-xs font-bold ${message.includes('impossible') || message.includes('Échec') ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{message}</p> : null}

        {data && view === 'architecture' ? <div className="grid gap-5 2xl:grid-cols-[360px_minmax(0,1fr)_350px]">
          <aside className="space-y-4">
            <section className="rounded-[28px] border border-blue-200 bg-blue-950 p-5 text-white shadow-[0_24px_70px_rgba(30,64,175,.22)]">
              <p className="text-[9px] font-black uppercase tracking-[.16em] text-blue-200">Intégrité structurelle</p><div className="mt-3 flex items-end justify-between"><p className="text-5xl font-black tracking-[-.06em]">{completeness}%</p><CheckCircle2 size={24} className={completeness >= 80 ? 'text-emerald-300' : 'text-amber-300'} /></div><div className="mt-4"><ProgressBar value={completeness} tone={completeness >= 80 ? 'emerald' : 'amber'} /></div><p className="mt-4 text-xs leading-5 text-blue-100">{gaps.length ? `${gaps.length} écart(s) empêchent le mandat d’être entièrement architecturé.` : 'Le mandat possède une architecture exploitable complète.'}</p>
            </section>
            <section className="rounded-[28px] border border-slate-200 bg-white p-5">
              <p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">Écarts à traiter</p><div className="mt-4 space-y-2">{gaps.map((gap) => <div key={gap} className="flex items-start gap-3 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-900"><CircleAlert size={15} className="mt-0.5 shrink-0" />{gap}</div>)}{!gaps.length ? <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800"><CheckCircle2 size={15} />Aucun écart structurel détecté.</div> : null}</div>
            </section>
            <section className="rounded-[28px] border border-slate-200 bg-white p-5">
              <p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">Rythme du mandat</p><div className="mt-4 grid grid-cols-2 gap-3"><StudioMetric icon={CalendarDays} label="Jours restants" value={remainingDays == null ? '—' : remainingDays} detail={dateLabel(deadlineOf(entity))} tone="blue" /><StudioMetric icon={BadgeDollarSign} label="Cible/jour" value={remainingDays && remainingDays > 0 ? money(target / remainingDays) : '—'} detail="Rythme financier théorique" tone="blue" /></div>
            </section>
          </aside>

          <section className="space-y-5">
            <section className="rounded-[30px] border border-blue-200 bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-blue-700">Mandate Success Architecture</p><h3 className="mt-1 text-xl font-black text-slate-950">Chaîne de réussite active</h3></div><Network size={22} className="text-blue-700" /></div>
              <div className="mt-6 grid gap-3 md:grid-cols-4">
                <ArchitectureNode icon={Target} label="Cible" value={target ? money(target) : 'Non renseignée'} ready={target > 0} />
                <ArchitectureNode icon={UsersRound} label="Comptes" value={`${arrayOf(entity, 'accounts').length + accounts.length} documenté(s)`} ready={arrayOf(entity, 'accounts').length + accounts.length > 0} />
                <ArchitectureNode icon={Sparkles} label="Stratégies" value={`${strategies.length} générée(s)`} ready={strategies.length > 0} />
                <ArchitectureNode icon={Layers3} label="Programmes" value={`${relations.filter((item) => item.to_type === 'program' || item.from_type === 'program').length} relié(s)`} ready={relations.some((item) => item.to_type === 'program' || item.from_type === 'program')} />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <ArchitectureNode icon={Boxes} label="Territoires" value={arrayOf(entity, 'territories').join(', ') || textOf(entity, 'targetMarket', textOf(entity, 'target_market', 'Non renseigné'))} ready={Boolean(arrayOf(entity, 'territories').length || textOf(entity, 'targetMarket', textOf(entity, 'target_market')))} />
                <ArchitectureNode icon={FileText} label="Preuves" value={`${evidence.length} pièce(s)`} ready={evidence.length > 0} />
                <ArchitectureNode icon={GitBranch} label="Jalons" value={`${milestones.length} jalon(s)`} ready={milestones.length > 0} />
                <ArchitectureNode icon={Activity} label="Résultats" value={money(actual)} ready={actual > 0} />
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-blue-700">Mandat exécutable</p><h3 className="mt-1 text-xl font-black text-slate-950">Définition, économie et responsabilité</h3></div><button type="button" onClick={() => void mutate('duplicate')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-black text-slate-700"><Copy size={13} />Dupliquer</button></div>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3"><StudioField label="Titre" value={edit.title} onChange={(value) => setEdit((current) => ({ ...current, title: value }))} /><StudioField label="Responsable" value={edit.ownerLabel} onChange={(value) => setEdit((current) => ({ ...current, ownerLabel: value }))} /><StudioSelect label="Statut" value={edit.status} onChange={(value) => setEdit((current) => ({ ...current, status: value }))} options={['active','running','scheduled','paused','completed','archived'].map((value) => ({ value, label: value }))} /><StudioField label="Unité" value={edit.businessUnit} onChange={(value) => setEdit((current) => ({ ...current, businessUnit: value }))} /><StudioField label="Marché cible" value={edit.targetMarket} onChange={(value) => setEdit((current) => ({ ...current, targetMarket: value }))} /><StudioField label="Horizon" value={edit.horizon} onChange={(value) => setEdit((current) => ({ ...current, horizon: value }))} /><StudioField label="Échéance" value={edit.deadline} onChange={(value) => setEdit((current) => ({ ...current, deadline: value }))} type="date" /><StudioField label="Cible revenus (Dh)" value={edit.revenueTargetDh} onChange={(value) => setEdit((current) => ({ ...current, revenueTargetDh: value }))} type="number" /><StudioField label="Marge cible (%)" value={edit.marginTargetPercent} onChange={(value) => setEdit((current) => ({ ...current, marginTargetPercent: value }))} type="number" /><StudioField label="Budget (Dh)" value={edit.budgetDh} onChange={(value) => setEdit((current) => ({ ...current, budgetDh: value }))} type="number" /><StudioField label="Priorité" value={edit.priority} onChange={(value) => setEdit((current) => ({ ...current, priority: value }))} /><StudioField label="Prochaine action" value={edit.nextAction} onChange={(value) => setEdit((current) => ({ ...current, nextAction: value }))} /></div>
              <div className="mt-4"><StudioTextArea label="Mandat exécutif" value={edit.mandate} onChange={(value) => setEdit((current) => ({ ...current, mandate: value }))} rows={5} /></div>
              <div className="mt-4 grid gap-4 md:grid-cols-3"><StudioTextArea label="Territoires · séparateur |" value={edit.territories} onChange={(value) => setEdit((current) => ({ ...current, territories: value }))} rows={3} /><StudioTextArea label="Comptes · séparateur |" value={edit.accounts} onChange={(value) => setEdit((current) => ({ ...current, accounts: value }))} rows={3} /><StudioTextArea label="KPIs · séparateur |" value={edit.kpis} onChange={(value) => setEdit((current) => ({ ...current, kpis: value }))} rows={3} /></div>
            </section>
          </section>

          <aside className="space-y-4">
            <section className="rounded-[28px] border border-blue-200 bg-blue-50 p-5">
              <p className="text-[9px] font-black uppercase tracking-[.15em] text-blue-700">Décisions exécutives</p><div className="mt-4 space-y-3">{decisions.slice(0, 5).map((item) => <article key={item.id} className="rounded-2xl border border-blue-100 bg-white p-4"><p className="text-sm font-black text-slate-950">{item.title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{item.body || 'Décision documentée.'}</p></article>)}{!decisions.length ? <p className="rounded-2xl border border-dashed border-blue-200 bg-white p-4 text-xs font-semibold text-slate-500">Aucune décision formalisée.</p> : null}</div>
            </section>
            <NoteComposer tone="blue" defaultKind="decision" title="Formaliser une décision" busy={busy} onAdd={(payload) => mutate('add_note', payload)} />
            <section className="rounded-[28px] border border-slate-200 bg-white p-5">
              <p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">Prochaine action</p><p className="mt-3 text-sm font-black leading-6 text-slate-950">{edit.nextAction || 'Aucune prochaine action documentée.'}</p><button type="button" onClick={() => setView('execution')} className="mt-4 inline-flex items-center gap-2 text-xs font-black text-blue-700">Ouvrir l’exécution<ArrowRight size={13} /></button>
            </section>
          </aside>
        </div> : null}

        {data && view === 'evidence' ? <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
          <section className="space-y-5"><div className="grid gap-5 lg:grid-cols-2"><Panel title="Preuves" count={evidence.length}><NoteFeed notes={evidence} empty="Aucune preuve attachée au mandat." onDelete={(noteId) => mutate('delete_note', { noteId })} /></Panel><Panel title="Jalons" count={milestones.length}><NoteFeed notes={milestones} empty="Aucun jalon défini." onDelete={(noteId) => mutate('delete_note', { noteId })} /></Panel><Panel title="KPIs" count={kpis.length}><NoteFeed notes={kpis} empty="Aucun KPI documenté." onDelete={(noteId) => mutate('delete_note', { noteId })} /></Panel><Panel title="Comptes" count={accounts.length}><NoteFeed notes={accounts} empty="Aucun compte ajouté au dossier." onDelete={(noteId) => mutate('delete_note', { noteId })} /></Panel></div></section>
          <aside className="space-y-4"><NoteComposer tone="blue" defaultKind="evidence" title="Ajouter une preuve" busy={busy} onAdd={(payload) => mutate('add_note', payload)} /><NoteComposer tone="blue" defaultKind="milestone" title="Ajouter un jalon" busy={busy} onAdd={(payload) => mutate('add_note', payload)} /><NoteComposer tone="blue" defaultKind="kpi" title="Ajouter un KPI" busy={busy} onAdd={(payload) => mutate('add_note', payload)} /></aside>
        </div> : null}

        {data && view === 'execution' ? <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <section className="space-y-5">
            <section className="rounded-[30px] border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-blue-700">Décomposition stratégique</p><h3 className="mt-1 text-xl font-black text-slate-950">Stratégies issues du mandat</h3></div><span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-800">{strategies.length}</span></div><div className="mt-5 grid gap-4 lg:grid-cols-2">{strategies.map((strategy) => <article key={strategy.id} className="rounded-[24px] border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[9px] font-black text-blue-700">{textOf(strategy, 'code')}</p><h4 className="mt-1 text-base font-black text-slate-950">{titleOf(strategy, 'Stratégie')}</h4></div><TonePill value={statusOf(strategy)} /></div><p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-600">{textOf(strategy, 'thesis', textOf(strategy, 'description', 'Stratégie liée au mandat.'))}</p></article>)}{!strategies.length ? <p className="col-span-full rounded-[24px] border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500">Aucune stratégie persistée. Lancez le mandat ou créez une stratégie enfant.</p> : null}</div></section>
            <RelationManager relations={relations} tone="blue" title="Objets reliés au mandat" onLink={(payload) => mutate('link_entity', payload)} onUnlink={(relationId) => mutate('unlink_entity', { relationId })} />
          </section>
          <aside className="space-y-4"><section className="rounded-[28px] border border-blue-200 bg-blue-50 p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-blue-700">Créer depuis le mandat</p><StudioField label="Titre de la stratégie" value={childTitle} onChange={setChildTitle} placeholder="Ex. Activation premium Rabat" /><button type="button" disabled={!childTitle.trim() || busy} onClick={async () => { await mutate('create_child', { title: childTitle, status: 'active', ownerLabel: edit.ownerLabel }); setChildTitle('') }} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"><Plus size={14} />Créer une stratégie</button></section><section className="rounded-[28px] border border-slate-200 bg-white p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">Commandes directes</p><div className="mt-4"><LiveEntityActions entityType="objective" entityId={entityId} /></div></section></aside>
        </div> : null}

        {data && view === 'results' ? <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
          <section className="space-y-5"><div className="grid gap-4 md:grid-cols-3"><StudioMetric icon={BadgeDollarSign} label="Cible" value={money(target)} detail="Cible du mandat" tone="blue" /><StudioMetric icon={CheckCircle2} label="Résultats documentés" value={money(actual)} detail={`${results.length} enregistrement(s)`} tone="emerald" /><StudioMetric icon={Activity} label="Réalisation" value={`${target ? Math.round(clamp(actual / target * 100)) : 0}%`} detail="Selon les résultats saisis" tone="blue" /></div><Panel title="Chronologie des résultats" count={results.length}><NoteFeed notes={results} empty="Aucun résultat documenté." onDelete={(noteId) => mutate('delete_note', { noteId })} /></Panel></section>
          <aside className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-emerald-700">Attribution commerciale</p><h3 className="mt-1 text-xl font-black text-slate-950">Enregistrer un résultat</h3><div className="mt-4 space-y-3"><StudioField label="Revenus (Dh)" value={outcome.revenueValueDh} onChange={(value) => setOutcome((current) => ({ ...current, revenueValueDh: value }))} type="number" /><StudioField label="Marge (Dh)" value={outcome.marginValueDh} onChange={(value) => setOutcome((current) => ({ ...current, marginValueDh: value }))} type="number" /><StudioField label="Confiance 0–1" value={outcome.confidence} onChange={(value) => setOutcome((current) => ({ ...current, confidence: value }))} type="number" /><StudioTextArea label="Résumé" value={outcome.summary} onChange={(value) => setOutcome((current) => ({ ...current, summary: value }))} rows={4} /></div><button type="button" disabled={busy} onClick={() => void addOutcome()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white"><BadgeDollarSign size={14} />Enregistrer</button></aside>
        </div> : null}

        {data && view === 'audit' ? <section className="rounded-[30px] border border-slate-200 bg-white p-5"><AuditFeed items={data.audit} /></section> : null}
      </div>
    </DossierBackdrop> : null}
  </>
}

function ArchitectureNode({ icon: Icon, label, value, ready }: { icon: typeof Target; label: string; value: string; ready: boolean }) {
  return <article className={`relative rounded-[22px] border p-4 ${ready ? 'border-blue-200 bg-blue-50' : 'border-amber-200 bg-amber-50'}`}><span className={`grid h-9 w-9 place-items-center rounded-xl ${ready ? 'bg-blue-700 text-white' : 'bg-amber-500 text-white'}`}><Icon size={16} /></span><p className="mt-3 text-[9px] font-black uppercase tracking-[.12em] text-slate-500">{label}</p><p className="mt-1 line-clamp-2 text-xs font-black leading-5 text-slate-900">{value}</p></article>
}

function Panel({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return <section className="rounded-[28px] border border-slate-200 bg-[#f8fafc] p-5"><div className="mb-4 flex items-center justify-between"><h3 className="text-base font-black text-slate-950">{title}</h3><span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-600">{count}</span></div>{children}</section>
}
