import Link from 'next/link'
import { Activity, AlertOctagon, ArrowRight, Blocks, BriefcaseBusiness, FileCheck2, Gauge, Layers3, ShieldAlert, Workflow } from 'lucide-react'
import type { ServiceDesignSnapshot } from '@/types/homeservice-design'
import { readinessBand, statusLabel } from '@/lib/homeservice-design/constants'
import { Badge, EmptyState, MetricCard, Panel, ProgressBar, WarningBanner, WorkspaceTitle } from '../DesignSystem'

function urgency(category: ServiceDesignSnapshot['categories'][number]) {
  if (category.status === 'blocked' || category.blockers.length) return { label: 'Intervention', tone: 'rose' as const }
  if (category.overallReadiness < 65) return { label: 'Construction', tone: 'amber' as const }
  if (category.overallReadiness < 85) return { label: 'Revue', tone: 'blue' as const }
  return { label: 'Prêt', tone: 'emerald' as const }
}

export function ExecutiveCommandWorkspace({ snapshot }: { snapshot: ServiceDesignSnapshot }) {
  const priority = [...snapshot.categories].sort((a, b) => (b.blockers.length - a.blockers.length) || (a.overallReadiness - b.overallReadiness)).slice(0, 8)
  const families = snapshot.families.map((family) => ({ ...family, categories: snapshot.categories.filter((item) => item.familyId === family.id) }))
  const approvalPressure = snapshot.approvals.filter((item) => item.status === 'pending').slice(0, 6)
  const blockingRules = snapshot.doctrineRules.filter((item) => item.blocking).slice(0, 6)
  return <div className="space-y-6">
    <WorkspaceTitle eyebrow="Commandement exécutif HomeService" title="Service Product Factory Command" description="Pilote le portefeuille, la doctrine, la capacité, les risques et les décisions avant toute conception de plan ou transmission vers CARELINK. Les indicateurs affichés proviennent exclusivement de la configuration réellement enregistrée." tone="navy" actions={<><Badge tone={snapshot.databaseReady ? 'emerald' : 'rose'}>{snapshot.databaseReady ? 'Données disponibles' : 'Migration requise'}</Badge><Badge tone="blue">CARELINK préservé</Badge></>} />
    {!snapshot.databaseReady ? <WarningBanner blocking title="Fondation base non disponible" detail={snapshot.warnings.join(' ')} /> : null}
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Portefeuille" value={snapshot.metrics.categories} detail={`${snapshot.metrics.families} familles · ${snapshot.metrics.activeCategories} catégories actives`} tone="blue" icon={<Layers3 size={18} />} />
      <MetricCard label="Préparation moyenne" value={`${snapshot.metrics.averageReadiness}%`} detail={`${snapshot.metrics.categoriesReady} catégories prêtes · ${snapshot.metrics.categoriesBlocked} bloquées`} tone={snapshot.metrics.averageReadiness >= 75 ? 'emerald' : 'amber'} icon={<Gauge size={18} />} />
      <MetricCard label="Standards" value={snapshot.metrics.doctrineRules} detail={`${snapshot.metrics.blockingRules} règles bloquantes · ${snapshot.metrics.activityBlocks} blocs activité`} tone="violet" icon={<Blocks size={18} />} />
      <MetricCard label="Décisions" value={snapshot.metrics.pendingApprovals} detail={`${snapshot.metrics.importsRequiringDecision} import(s) exigeant une décision`} tone={snapshot.metrics.pendingApprovals ? 'amber' : 'emerald'} icon={<FileCheck2 size={18} />} />
    </section>

    <section className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
      <Panel title="Portfolio Pressure Map" subtitle="Une carte de pression qui hiérarchise les familles selon préparation, blocages et couverture CARELINK.">
        {families.length ? <div className="grid gap-3 lg:grid-cols-2">
          {families.map((family, index) => {
            const average = family.categories.length ? Math.round(family.categories.reduce((sum, item) => sum + item.overallReadiness, 0) / family.categories.length) : 0
            const blocked = family.categories.filter((item) => item.blockers.length || item.status === 'blocked').length
            const mapped = family.categories.filter((item) => item.carelinkServiceType).length
            const band = readinessBand(average)
            return <Link key={family.id} href="/carelink-ops/service-design/catalogue" className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-[#fbfcfe] p-5 transition hover:border-blue-200 hover:bg-white hover:shadow-lg">
              <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-[50px] bg-slate-100/70 transition group-hover:bg-blue-50" />
              <div className="relative flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">F{String(index + 1).padStart(2, '0')} · {family.code}</p><h3 className="mt-2 text-lg font-black tracking-[-0.03em] text-slate-950">{family.nameFr}</h3></div><Badge tone={band.tone}>{band.label}</Badge></div>
              <div className="relative mt-5"><ProgressBar value={average} tone={band.tone} label="Maturité moyenne" /></div>
              <div className="relative mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-white p-2 ring-1 ring-slate-100"><strong className="block text-sm font-black">{family.categories.length}</strong><span className="text-[9px] font-bold uppercase text-slate-400">Catégories</span></div><div className="rounded-xl bg-white p-2 ring-1 ring-slate-100"><strong className="block text-sm font-black text-rose-600">{blocked}</strong><span className="text-[9px] font-bold uppercase text-slate-400">Blocages</span></div><div className="rounded-xl bg-white p-2 ring-1 ring-slate-100"><strong className="block text-sm font-black text-blue-600">{mapped}</strong><span className="text-[9px] font-bold uppercase text-slate-400">CARELINK</span></div></div>
            </Link>
          })}
        </div> : <EmptyState title="Portefeuille non initialisé" detail="Appliquez la migration UMZ1 pour charger les familles et catégories initiales gouvernées." />}
      </Panel>

      <Panel title="Executive Intervention Queue" subtitle="Les éléments qui exposent la promesse, la sécurité ou la capacité." action={<Link href="/carelink-ops/service-design/command/approvals" className="text-xs font-black text-blue-700">Toutes les décisions →</Link>}>
        <div className="space-y-3">
          {priority.map((category) => { const state = urgency(category); return <Link key={category.id} href={`/carelink-ops/service-design/catalogue/categories/${category.id}`} className="block rounded-[22px] border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{category.code}</p><h3 className="mt-1 text-sm font-black text-slate-900">{category.commercialNameFr}</h3></div><Badge tone={state.tone}>{state.label}</Badge></div><div className="mt-4"><ProgressBar value={category.overallReadiness} tone={state.tone} /></div>{category.blockers.length ? <p className="mt-3 text-xs font-bold text-rose-700">{category.blockers[0]}</p> : <p className="mt-3 text-xs font-semibold text-slate-500">Prochaine action: compléter la section la moins mature.</p>}</Link> })}
          {!priority.length ? <EmptyState title="Aucune intervention" detail="La file se remplira à partir des blocages et des catégories incomplètes enregistrées." /> : null}
        </div>
      </Panel>
    </section>

    <section className="grid gap-6 xl:grid-cols-3">
      <Panel title="Validation Runway" subtitle="Décisions humaines, conséquences et propriétaires." className="xl:col-span-1">
        <div className="space-y-3">{approvalPressure.map((item) => <Link key={item.id} href="/carelink-ops/service-design/command/approvals" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700"><BriefcaseBusiness size={16} /></div><div><p className="text-xs font-black text-amber-950">{item.entityLabel}</p><p className="mt-1 text-[11px] font-semibold leading-4 text-amber-800">{item.approvalType} · {item.assignedRole}</p></div></Link>)}{!approvalPressure.length ? <EmptyState title="Aucune validation en attente" detail="Les demandes de validation apparaîtront ici sans être auto-approuvées." /> : null}</div>
      </Panel>
      <Panel title="Safety & Doctrine Pressure" subtitle="Règles bloquantes et risques à traiter avant activation." className="xl:col-span-1">
        <div className="space-y-3">{blockingRules.map((rule) => <Link key={rule.id} href="/carelink-ops/service-design/standards/doctrine" className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50/70 p-4"><ShieldAlert className="mt-0.5 shrink-0 text-rose-600" size={17} /><div><p className="text-xs font-black text-rose-950">{rule.titleFr}</p><p className="mt-1 text-[11px] font-semibold leading-4 text-rose-700">{rule.categoryName || rule.categoryCode} · {rule.severity}</p></div></Link>)}{!blockingRules.length ? <EmptyState title="Aucune règle bloquante" detail="Les règles de doctrine bloquantes seront visibles dès leur enregistrement." /> : null}</div>
      </Panel>
      <Panel title="Execution Continuity" subtitle="Prépare l’intégration sans prendre l’autorité de CARELINK.">
        <div className="space-y-4"><div className="rounded-[22px] bg-slate-950 p-5 text-white"><p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-300">Protection canonique</p><p className="mt-3 text-base font-black">Service Design prépare. CARELINK exécute.</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-300">Aucune affectation, mission ou sous-mission n’est créée dans UMZ1.</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border border-blue-100 bg-blue-50 p-4"><Workflow className="text-blue-700" size={18} /><p className="mt-3 text-2xl font-black text-blue-950">{snapshot.metrics.carelinkMappedCategories}</p><p className="text-[10px] font-black uppercase text-blue-700">Catégories mappées</p></div><div className="rounded-2xl border border-violet-100 bg-violet-50 p-4"><Activity className="text-violet-700" size={18} /><p className="mt-3 text-2xl font-black text-violet-950">UMZ4</p><p className="text-[10px] font-black uppercase text-violet-700">Handoff contrôlé</p></div></div><Link href="/carelink-ops" className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700">Ouvrir CARELINK Ops <ArrowRight size={15} /></Link></div>
      </Panel>
    </section>
  </div>
}
