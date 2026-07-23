'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowUpRight, Boxes, GitBranch, Globe2, Radar, Route, ShieldCheck, Target } from 'lucide-react'
import DigitalTwinHero from '../../../../_components/hero-sovereignty/heroes/DigitalTwinHero'
import { useDigitalTwin } from '../../DigitalTwinContext'
import type { TwinRouteProps } from '../twin-experience-types'
import { TwinPanel, TwinProgress, TwinSafetyBanner, TwinStat, TwinStatus, TwinTag, twinExperienceStyles } from '../TwinExperiencePrimitives'

export default function TwinOverviewExperience({ openEditor }: TwinRouteProps) {
  const { twin, runValidation, busy } = useDigitalTwin()
  const unresolved = twin.validationIssues.filter((item) => item.status === 'open' || item.status === 'acknowledged')
  const critical = unresolved.filter((item) => item.severity === 'critical' || item.severity === 'high')
  const missingPrice = twin.offers.filter((offer) => !twin.priceRules.some((rule) => rule.offerCode === offer.code)).length
  const constrained = twin.capacities.filter((item) => item.availability === 'unavailable' || item.availability === 'conditional').length
  const priorityMarkets = [...twin.markets].sort((a, b) => b.priority - a.priority).slice(0, 4)
  const completeness = Object.entries(twin.completeness).filter(([key]) => key !== 'overall')

  return <div className={`${twinExperienceStyles.routeShell} space-y-5`} data-twin-route-id="MZ25-TWIN-ROOT">
    <DigitalTwinHero
      state={twin.storageMode === 'supabase' ? 'LIVE' : 'PREVIEW'}
      posture="World model · Shadow"
      authority="Lecture commerciale · aucune exécution externe"
      summary={`Le modèle commercial est complet à ${twin.completeness.overall}%. ${critical.length ? `${critical.length} écart(s) critique(s) ou élevé(s) exigent une décision.` : 'Aucun écart critique n’est actuellement ouvert.'}`}
      freshness={new Date(twin.generatedAt).toLocaleString('fr-FR')}
      metrics={[
        { label: 'Complétude', value: `${twin.completeness.overall}%`, note: 'Structure globale', tone: 'blue' },
        { label: 'Blind spots', value: unresolved.length, note: 'Ouverts ou reconnus', tone: unresolved.length ? 'amber' : 'emerald' },
        { label: 'Territoires', value: twin.counters.activeMarkets, note: 'Marchés actifs', tone: 'cyan' },
        { label: 'Contraintes', value: constrained, note: 'Conditionnelles ou indisponibles', tone: constrained ? 'rose' : 'emerald' },
      ]}
      actions={[
        { label: busy ? 'Validation…' : 'Certifier le modèle', onClick: runValidation, disabled: busy, reason: busy ? 'La validation est déjà en cours.' : undefined, kind: 'primary', icon: ShieldCheck },
        { label: 'Structurer une offre', onClick: () => openEditor('offer'), kind: 'secondary', icon: Boxes },
      ]}
      warning={twin.storageMode === 'contract-seed' ? 'PREVIEW — les entités proviennent du contrat de référence et ne sont pas étiquetées LIVE.' : missingPrice || constrained ? `${missingPrice} offre(s) sans price book et ${constrained} capacité(s) sous pression limitent la préparation du jumeau.` : undefined}
    />

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <TwinStat label="Unités commerciales" value={twin.counters.businessUnits} note="Lignes de revenus modélisées" tone="cyan" />
      <TwinStat label="Offres actives" value={twin.counters.activeOffers} note={`${missingPrice} sans price book`} tone={missingPrice ? 'amber' : 'emerald'} />
      <TwinStat label="Parcours" value={twin.counters.salesJourneys} note="Du signal au renouvellement" tone="blue" />
      <TwinStat label="Dépendances" value={twin.dependencies.length} note="Gates de faisabilité" tone="violet" />
      <TwinStat label="Écarts critiques" value={critical.length} note="À résoudre avant certification" tone={critical.length ? 'rose' : 'emerald'} />
    </section>

    <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <TwinPanel eyebrow="World model coverage" title="Couverture du cerveau commercial" icon={Radar} tone="cyan">
        <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
          {completeness.map(([key, value]) => <TwinProgress key={key} value={value} label={{ businessUnits: 'Unités commerciales', offers: 'Offres', segments: 'Segments clients', decisionMakers: 'Décideurs', territories: 'Territoires', journeys: 'Canaux & parcours', pricing: 'Prix & marges', capacity: 'Capacités', dependencies: 'Dépendances', seasonality: 'Saisonnalité', expansion: 'Expansion' }[key] || key} tone={value >= 80 ? 'emerald' : value >= 60 ? 'blue' : 'amber'} />)}
        </div>
      </TwinPanel>

      <TwinPanel eyebrow="Executive priority" title="Angles qui exigent une décision" icon={AlertTriangle} tone={critical.length ? 'rose' : 'emerald'} action={<Link href="/revenue-command-os/digital-twin/model-validation" className="inline-flex items-center gap-1 text-[10px] font-black text-cyan-800">Certification <ArrowUpRight size={13}/></Link>}>
        <div className="space-y-3">
          {unresolved.slice(0, 5).map((issue) => <div key={issue.id} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><TwinStatus status={issue.severity}/><span className="text-[9px] font-black text-slate-600">{issue.entityCode}</span></div><p className="mt-3 text-sm font-black text-slate-950">{issue.title}</p><p className="mt-1 text-[11px] font-semibold leading-5 text-slate-700">{issue.recommendedAction}</p></div>)}
          {!unresolved.length ? <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-900">Aucun angle de validation ouvert dans la fenêtre actuelle.</div> : null}
        </div>
      </TwinPanel>
    </div>

    <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
      <TwinPanel eyebrow="Priority territories" title="Horizon de déploiement" icon={Globe2} tone="blue">
        <div className="space-y-3">{priorityMarkets.map((market, index) => <Link key={market.code} href="/revenue-command-os/digital-twin/markets-territories" className="grid grid-cols-[36px_1fr_auto] items-center gap-3 rounded-[20px] border border-slate-200 bg-white p-3 transition hover:border-cyan-300"><span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-[10px] font-black text-white">0{index + 1}</span><div><p className="text-xs font-black text-slate-950">{market.city} · {market.region}</p><p className="mt-1 text-[10px] font-semibold text-slate-600">{market.immediatelyDeliverableOfferCodes.length} offre(s) immédiatement livrable(s)</p></div><TwinTag tone={market.priority >= 80 ? 'rose' : 'cyan'}>{market.priority}</TwinTag></Link>)}</div>
      </TwinPanel>

      <TwinPanel eyebrow="Commercial architecture" title="Circulation de la valeur" icon={GitBranch} tone="violet">
        <div className="grid gap-3 md:grid-cols-3">
          <Link href="/revenue-command-os/digital-twin/offers-services" className="rounded-[22px] border border-cyan-200 bg-cyan-50 p-4"><Target className="text-cyan-700" size={20}/><p className="mt-4 text-sm font-black text-slate-950">Offres</p><p className="mt-1 text-[11px] font-semibold leading-5 text-slate-700">{twin.offers.length} propositions reliées aux besoins et capacités.</p></Link>
          <Link href="/revenue-command-os/digital-twin/channels-journeys" className="rounded-[22px] border border-blue-200 bg-blue-50 p-4"><Route className="text-blue-700" size={20}/><p className="mt-4 text-sm font-black text-slate-950">Parcours</p><p className="mt-1 text-[11px] font-semibold leading-5 text-slate-700">{twin.journeys.length} parcours structurent le passage du signal à la conversion.</p></Link>
          <Link href="/revenue-command-os/digital-twin/revenue-dependencies" className="rounded-[22px] border border-violet-200 bg-violet-50 p-4"><GitBranch className="text-violet-700" size={20}/><p className="mt-4 text-sm font-black text-slate-950">Gates</p><p className="mt-1 text-[11px] font-semibold leading-5 text-slate-700">{twin.dependencies.filter((item) => item.active).length} dépendances actives sécurisent la faisabilité.</p></Link>
        </div>
      </TwinPanel>
    </div>

    <TwinSafetyBanner />
  </div>
}
