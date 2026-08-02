'use client'

import { useMemo, useState } from 'react'
import {
  AlertOctagon,
  BookOpenCheck,
  FileUp,
  Filter,
  GitCompareArrows,
  LockKeyhole,
  Scale,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import type { ServiceDesignSnapshot } from '@/types/homeservice-design'
import { Badge, EmptyState, MetricCard, Panel, WorkspaceTitle, cx } from '../DesignSystem'
import { CreateDoctrineRuleAction } from '../MutationPanels'

export function DoctrineStandardsWorkspace({ snapshot }: { snapshot: ServiceDesignSnapshot }) {
  const [kind, setKind] = useState('all')
  const [severity, setSeverity] = useState('all')
  const [categoryId, setCategoryId] = useState('all')
  const filtered = useMemo(() => snapshot.doctrineRules.filter((rule) => {
    if (kind !== 'all' && rule.kind !== kind) return false
    if (severity !== 'all' && rule.severity !== severity) return false
    if (categoryId !== 'all' && rule.categoryId !== categoryId) return false
    return true
  }), [snapshot.doctrineRules, kind, severity, categoryId])
  const conflicts = snapshot.doctrineRules.filter((rule) => rule.kind === 'prohibited' && snapshot.doctrineRules.some((other) => other.categoryId === rule.categoryId && other.code === rule.code && other.kind === 'mandatory'))

  return <div className="space-y-6">
    <WorkspaceTitle eyebrow="ANGELCARE · Doctrine Intelligence Studio" title="Construisez l’autorité locale qui nourrit chaque mission, programme et package." description="Sélectionnez une catégorie, importez exactement la ressource nécessaire et maîtrisez obligations, interdictions, preuves et escalades sans transformer la création quotidienne en parcours de gouvernance." actions={<><a href="/carelink-ops/service-design/factory/import" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-black text-white"><FileUp size={14}/>Import ciblé</a><CreateDoctrineRuleAction categories={snapshot.categories}/></>} />

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><MetricCard label="Règles enregistrées" value={snapshot.doctrineRules.length} detail="Référentiel local disponible pour la composition." icon={<BookOpenCheck size={18}/>}/><MetricCard label="Obligatoires" value={snapshot.doctrineRules.filter((item)=>item.mandatory).length} detail="Appliquées par défaut aux catégories concernées." tone="blue" icon={<LockKeyhole size={18}/>}/><MetricCard label="Bloquantes" value={snapshot.doctrineRules.filter((item)=>item.blocking).length} detail="Réservées aux risques réellement critiques." tone="rose" icon={<ShieldAlert size={18}/>}/><MetricCard label="Conflits" value={conflicts.length} detail="Codes incompatibles à arbitrer." tone={conflicts.length?'amber':'emerald'} icon={<GitCompareArrows size={18}/>}/></section>

    <Panel title="Category Knowledge Coverage" subtitle="La doctrine ne vit pas seule: elle nourrit activités, capacité, compétences, risques, checklists et pricing.">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{[
        {label:'Catégories',value:snapshot.categories.length,detail:'Dossiers locaux',tone:'bg-blue-50 text-blue-900'},
        {label:'Activités',value:snapshot.activities.length,detail:'Blocs mission',tone:'bg-violet-50 text-violet-900'},
        {label:'Capacités',value:snapshot.capacityRules.length,detail:'Règles de faisabilité',tone:'bg-emerald-50 text-emerald-900'},
        {label:'Risques',value:snapshot.risks.length,detail:'Contrôles préventifs',tone:'bg-amber-50 text-amber-900'},
      ].map(item=><article key={item.label} className={cx('rounded-[22px] p-4',item.tone)}><p className="text-[9px] font-black uppercase tracking-[.16em] opacity-70">{item.label}</p><p className="mt-2 text-3xl font-black tracking-[-.05em]">{item.value}</p><p className="mt-1 text-[10px] font-semibold opacity-70">{item.detail}</p></article>)}</div>
    </Panel>

    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.42fr)_minmax(320px,.58fr)]">
      <Panel title="Policy Chamber" subtitle="Règles structurées par catégorie, nature, sévérité et conséquence." action={<div className="flex items-center gap-2 text-xs font-black text-slate-400"><Filter size={14}/>{filtered.length}</div>}>
        <div className="mb-5 grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4 md:grid-cols-3"><select value={categoryId} onChange={(event)=>setCategoryId(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-black"><option value="all">Toutes catégories</option>{snapshot.categories.map((item)=><option key={item.id} value={item.id}>{item.commercialNameFr}</option>)}</select><select value={kind} onChange={(event)=>setKind(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-black"><option value="all">Toutes natures</option><option value="mandatory">Obligatoire</option><option value="recommended">Recommandée</option><option value="conditional">Conditionnelle</option><option value="prohibited">Interdite</option><option value="blocking">Bloquante</option><option value="escalation">Escalade</option></select><select value={severity} onChange={(event)=>setSeverity(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs font-black"><option value="all">Toutes sévérités</option><option value="information">Information</option><option value="attention">Attention</option><option value="important">Importante</option><option value="critical">Critique</option><option value="blocking">Bloquante</option></select></div>
        <div className="space-y-3">{filtered.map((rule)=><article key={rule.id} className={cx('group relative overflow-hidden rounded-[24px] border p-5 transition hover:-translate-y-0.5',rule.blocking?'border-rose-200 bg-rose-50/80':rule.kind==='prohibited'?'border-amber-200 bg-amber-50/80':'border-slate-200 bg-white hover:border-blue-200')}><div className={cx('absolute inset-y-0 left-0 w-1',rule.blocking?'bg-rose-500':rule.kind==='prohibited'?'bg-amber-500':'bg-blue-500')}/><div className="flex flex-wrap items-start justify-between gap-4 pl-2"><div><p className="text-[9px] font-black uppercase tracking-[.19em] text-slate-400">{rule.categoryName||rule.categoryCode} · {rule.code} · V{rule.versionNumber}</p><h3 className="mt-2 text-base font-black text-slate-950">{rule.titleFr}</h3></div><div className="flex gap-2"><Badge tone={rule.blocking?'rose':rule.kind==='prohibited'?'amber':'blue'}>{rule.kind}</Badge><Badge tone="slate">{rule.severity}</Badge></div></div><p className="mt-4 pl-2 text-xs font-semibold leading-5 text-slate-600">{rule.descriptionFr}</p><div className="mt-4 grid gap-3 pl-2 sm:grid-cols-3"><div className="rounded-xl bg-white/80 p-3 ring-1 ring-slate-100"><p className="text-[9px] font-black uppercase text-slate-400">Preuves</p><p className="mt-1 text-xs font-bold">{rule.requiredEvidence.length||0}</p></div><div className="rounded-xl bg-white/80 p-3 ring-1 ring-slate-100"><p className="text-[9px] font-black uppercase text-slate-400">Obligatoire</p><p className="mt-1 text-xs font-bold">{rule.mandatory?'Oui':'Non'}</p></div><div className="rounded-xl bg-white/80 p-3 ring-1 ring-slate-100"><p className="text-[9px] font-black uppercase text-slate-400">Escalade</p><p className="mt-1 truncate text-xs font-bold">{rule.escalationRoute||'Aucune'}</p></div></div></article>)}{!filtered.length?<EmptyState title="Aucune règle dans cette vue" detail="Modifiez les filtres ou créez une règle structurée. Aucune règle n’est inventée par le système."/>:null}</div>
      </Panel>

      <div className="space-y-6">
        <Panel title="Doctrine Posture" subtitle="Lecture immédiate de ce qui est permis, conditionnel ou interdit."><div className="space-y-3">{[
          {key:'mandatory',label:'Obligatoire',tone:'border-blue-200 bg-blue-50 text-blue-950',icon:<LockKeyhole size={17}/>},
          {key:'conditional',label:'Conditionnel',tone:'border-amber-200 bg-amber-50 text-amber-950',icon:<Scale size={17}/>},
          {key:'prohibited',label:'Interdit',tone:'border-rose-200 bg-rose-50 text-rose-950',icon:<AlertOctagon size={17}/>},
        ].map(item=><div key={item.key} className={cx('rounded-[22px] border p-4',item.tone)}><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-black">{item.icon}{item.label}</div><span className="text-2xl font-black">{snapshot.doctrineRules.filter((rule)=>rule.kind===item.key).length}</span></div></div>)}</div></Panel>
        <Panel title="Version Authority" subtitle="Chaque évolution garde son lignage et son effet."><div className="space-y-3 text-xs font-semibold leading-5 text-slate-600"><div className="rounded-[22px] bg-slate-950 p-4 text-white"><Sparkles size={16} className="text-cyan-300"/><p className="mt-3 font-black">Modification matérielle</p><p className="mt-1 text-slate-300">Nouvelle version → revue → approbation → usage futur.</p></div><p className="rounded-[22px] border border-slate-200 bg-white p-4">Les missions CARELINK déjà créées conservent leur snapshot.</p><p className="rounded-[22px] border border-blue-200 bg-blue-50 p-4 text-blue-800">La Factory peut composer depuis les brouillons locaux autorisés sans masquer les warnings.</p></div></Panel>
      </div>
    </section>
  </div>
}
