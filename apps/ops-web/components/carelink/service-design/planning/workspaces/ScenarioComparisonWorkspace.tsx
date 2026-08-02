'use client'
import { GitCompareArrows, Layers3, WandSparkles } from 'lucide-react'
import { Action, Empty, StageHeader, Surface } from '../PlanningUI'
import { StudioChip } from '../../studio2030'

export function ScenarioComparisonWorkspace({ requestId }: { requestId?: string }) {
  return <div className="space-y-6"><StageHeader eyebrow="AI Scenario Theatre" title="Comparez les alternatives sans perdre la vérité locale." description="Jusqu’à dix propositions sont évaluées par expérience, activités, timeline, ressources, sécurité, prix et préparation CARELINK. Aucun scénario synthétique n’est affiché avant une génération réelle." actions={<><Action href="/carelink-ops/service-design/planning/requests" tone="slate">Demandes</Action><Action href="/carelink-ops/service-design/factory"><WandSparkles size={14} />Générer</Action></>} />
    <Surface title="Comparison Theatre" subtitle={requestId ? `Demande ${requestId}` : 'Sélectionnez une demande ou générez de nouvelles propositions.'}><div className="grid min-h-[460px] place-items-center rounded-[28px] border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50/50 p-8"><Empty title="Aucune comparaison chargée" detail="Les cartes apparaîtront avec leurs différences, compromis, activités locales, prix déterministes, avertissements et décision de publication." action={<Action href="/carelink-ops/service-design/factory"><GitCompareArrows size={14} />Créer les alternatives</Action>} /></div></Surface>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{['Fit expérience', 'Couverture timeline', 'Économie', 'CARELINK readiness'].map((label, index) => <div key={label} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><Layers3 size={17} className="text-blue-600" /><StudioChip tone={index === 2 ? 'emerald' : 'blue'}>Comparateur</StudioChip></div><p className="mt-4 text-sm font-black text-slate-900">{label}</p><p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Visible uniquement à partir des résultats réels.</p></div>)}</section>
  </div>
}
