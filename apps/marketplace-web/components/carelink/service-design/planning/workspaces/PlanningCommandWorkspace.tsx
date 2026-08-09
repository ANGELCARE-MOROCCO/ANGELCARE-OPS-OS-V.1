'use client'

import { ArrowRight, CalendarDays, CheckCircle2, GitCompareArrows, Layers3, PackageCheck, Route, Sparkles, WandSparkles } from 'lucide-react'
import { Action, Empty, StageHeader, Surface } from '../PlanningUI'
import { StudioChip, StudioLinkRow, StudioStageRail } from '../../studio2030'

const creationCards = [
  { title: 'Mission unique', detail: 'Une date, une fenêtre et une timeline complète.', href: '/carelink-ops/service-design/factory?mode=single_mission', icon: CalendarDays, tone: 'from-blue-600 to-cyan-400' },
  { title: 'Programme multi-missions', detail: 'Progression sur plusieurs dates et objectifs.', href: '/carelink-ops/service-design/factory?mode=multi_mission', icon: Layers3, tone: 'from-violet-600 to-fuchsia-400' },
  { title: 'Package commercial', detail: 'Plans, options, prix et positionnement vendable.', href: '/carelink-ops/service-design/factory?mode=commercial_package', icon: PackageCheck, tone: 'from-emerald-600 to-teal-400' },
]

export function PlanningCommandWorkspace() {
  return <div className="space-y-6">
    <StageHeader eyebrow="ANGELCARE · Mission Plan Studio" title="Transformez une expérience sélectionnée en programme opérationnel." description="Le studio orchestre les demandes, les scénarios, les timelines, la progression multi-jours et la validation technique. Aucun chiffre illustratif, aucune mission fictive et aucune écriture CARELINK depuis ce cockpit." actions={<><Action href="/carelink-ops/service-design/factory" tone="slate">Choisir une catégorie</Action><Action href="/carelink-ops/service-design/factory?mode=single_mission"><WandSparkles size={14} />Créer maintenant</Action></>} />

    <StudioStageRail active={0} stages={[{ label: 'Demande', detail: 'Catégorie et scénario' }, { label: 'Scénarios', detail: 'Alternatives intelligentes' }, { label: 'Timeline', detail: 'Heures et activités' }, { label: 'Validation', detail: 'Contrôles techniques' }, { label: 'Publication', detail: 'Plan ou sellable' }]} />

    <section className="grid gap-5 lg:grid-cols-3">{creationCards.map((card) => { const Icon = card.icon; return <a key={card.title} href={card.href} className="group relative overflow-hidden rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_16px_44px_rgba(15,23,42,.06)] transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"><div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${card.tone}`} /><div className={`grid h-12 w-12 place-items-center rounded-[20px] bg-gradient-to-br ${card.tone} text-white shadow-lg`}><Icon size={20} /></div><h2 className="mt-5 text-xl font-black tracking-[-.035em] text-slate-950">{card.title}</h2><p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{card.detail}</p><div className="mt-5 flex items-center justify-between"><StudioChip tone="blue">Category-first</StudioChip><ArrowRight size={17} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" /></div></a> })}</section>

    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,.65fr)]">
      <Surface title="Planning Runway" subtitle="Accédez aux objets réels du pipeline. Les listes restent honnêtes tant qu’aucune donnée n’est disponible.">
        <div className="grid gap-3">
          <StudioLinkRow href="/carelink-ops/service-design/planning/requests" title="Demandes de planification" detail="Dossiers structurés, bénéficiaires, dates et objectifs." status="Entrée" tone="blue" />
          <StudioLinkRow href="/carelink-ops/service-design/planning/scenarios" title="Scenario Theatre" detail="Comparer les alternatives issues du catalogue local." status="Comparer" tone="violet" />
          <StudioLinkRow href="/carelink-ops/service-design/planning/templates" title="Bibliothèque de programmes" detail="Séquences réutilisables et versions approuvées." status="Réutiliser" tone="emerald" />
          <StudioLinkRow href="/carelink-ops/service-design/planning/validation" title="Validation technique" detail="Durées, activités, ressources, risques et preuves." status="Contrôler" tone="amber" />
        </div>
      </Surface>
      <div className="space-y-6">
        <Surface title="Mission Engineering Doctrine" subtitle="Les responsabilités sont visibles et séparées.">
          <div className="space-y-3">
            <div className="rounded-2xl bg-slate-950 p-4 text-white"><Sparkles size={17} className="text-cyan-300" /><p className="mt-3 text-sm font-black">OpenRouter Free compose</p><p className="mt-1 text-xs font-semibold leading-5 text-slate-300">Il propose depuis les IDs locaux; il ne crée ni prix, ni mission, ni autorité.</p></div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><CheckCircle2 size={17} className="text-emerald-700" /><p className="mt-3 text-sm font-black text-emerald-950">Le serveur valide</p><p className="mt-1 text-xs font-semibold leading-5 text-emerald-700">Dates, couverture horaire, activité locale, prix et contraintes.</p></div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4"><Route size={17} className="text-blue-700" /><p className="mt-3 text-sm font-black text-blue-950">CARELINK exécute</p><p className="mt-1 text-xs font-semibold leading-5 text-blue-700">Après publication et handoff explicite, jamais depuis ce studio.</p></div>
          </div>
        </Surface>
      </div>
    </section>
  </div>
}
