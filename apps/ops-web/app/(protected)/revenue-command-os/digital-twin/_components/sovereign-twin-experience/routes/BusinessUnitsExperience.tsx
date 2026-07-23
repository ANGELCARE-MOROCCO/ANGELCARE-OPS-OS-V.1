'use client'

import Link from 'next/link'
import { Building2, Compass, Edit3, Layers3, MapPin, Plus, Target } from 'lucide-react'
import { useDigitalTwin } from '../../DigitalTwinContext'
import { businessUnitRecord } from '../twin-entity-mappers'
import type { TwinRouteProps } from '../twin-experience-types'
import { TwinEmpty, TwinPanel, TwinProgress, TwinRouteMasthead, TwinSafetyBanner, TwinStat, TwinStatus, TwinTag, twinExperienceStyles } from '../TwinExperiencePrimitives'

export default function BusinessUnitsExperience({ openEditor }: TwinRouteProps) {
  const { twin } = useDigitalTwin()
  const active = twin.businessUnits.filter((item) => item.status === 'active')
  const needsValidation = twin.businessUnits.filter((item) => item.status === 'needs-validation')
  const top = [...twin.businessUnits].sort((a, b) => b.commercialPriority - a.commercialPriority)[0]
  const averagePriority = twin.businessUnits.length ? Math.round(twin.businessUnits.reduce((sum, item) => sum + item.commercialPriority, 0) / twin.businessUnits.length) : 0

  return <div className={`${twinExperienceStyles.routeShell} space-y-5`} data-twin-route-id="MZ25-TWIN-BUSINESS-UNITS">
    <TwinRouteMasthead eyebrow="Commercial architecture" title="Unités commerciales" subtitle="Gouverner chaque ligne de revenus par son mandat, son propriétaire, sa couverture territoriale et ses dépendances réelles." concept="Business Unit Command Map" icon={Building2} mode={twin.storageMode} freshness={twin.generatedAt} authority="Modèle commercial · mutation gouvernée" primary={{ label: 'Nouvelle unité', onClick: () => openEditor('business-unit') }} secondary={{ label: 'Voir les offres', href: '/revenue-command-os/digital-twin/offers-services' }}>
      <div className="grid grid-cols-3 gap-2"><TwinStat label="Actives" value={active.length} tone="emerald"/><TwinStat label="À valider" value={needsValidation.length} tone={needsValidation.length ? 'amber' : 'emerald'}/><TwinStat label="Priorité moy." value={averagePriority} tone="cyan"/></div>
    </TwinRouteMasthead>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <TwinStat label="Unités modélisées" value={twin.businessUnits.length} note="Architecture du portefeuille" tone="cyan"/>
      <TwinStat label="Offres rattachées" value={twin.offers.length} note="Propositions structurées" tone="blue"/>
      <TwinStat label="Territoires couverts" value={new Set(twin.businessUnits.flatMap((item) => item.territories)).size} note="Codes uniques déclarés" tone="violet"/>
      <TwinStat label="Dépendances déclarées" value={twin.businessUnits.reduce((sum, item) => sum + item.dependencies.length, 0)} note="Préconditions structurelles" tone="amber"/>
    </div>

    {twin.businessUnits.length ? <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
      <section className="grid gap-4 lg:grid-cols-2">
        {twin.businessUnits.map((unit) => {
          const relatedOffers = twin.offers.filter((offer) => offer.businessUnitCode === unit.code)
          return <article key={unit.code} className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,.055)]">
            <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white"><Building2 size={20}/></span><div><p className="text-[9px] font-black uppercase tracking-[.12em] text-cyan-700">{unit.code}</p><h2 className="mt-1 text-lg font-black text-slate-950">{unit.name}</h2></div></div><button onClick={() => openEditor('business-unit', businessUnitRecord(unit))} aria-label={`Modifier ${unit.name}`} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700 hover:border-cyan-300 hover:text-cyan-800"><Edit3 size={16}/></button></div>
            <p className="mt-4 text-sm font-bold text-slate-800">{unit.tagline}</p><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-700">{unit.purpose}</p>
            <div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-2xl bg-slate-50 p-3"><p className="text-[8px] font-black uppercase text-slate-600">Offres</p><p className="mt-1 text-lg font-black text-slate-950">{relatedOffers.length}</p></div><div className="rounded-2xl bg-cyan-50 p-3"><p className="text-[8px] font-black uppercase text-cyan-800">Segments</p><p className="mt-1 text-lg font-black text-slate-950">{unit.targetSegments}</p></div><div className="rounded-2xl bg-blue-50 p-3"><p className="text-[8px] font-black uppercase text-blue-800">Territoires</p><p className="mt-1 text-lg font-black text-slate-950">{unit.territories.length}</p></div></div>
            <div className="mt-4"><TwinProgress value={unit.commercialPriority} label="Priorité commerciale" tone={unit.commercialPriority >= 80 ? 'rose' : 'cyan'}/></div>
            <div className="mt-4 flex flex-wrap gap-2"><TwinStatus status={unit.status}/>{unit.territories.slice(0, 3).map((territory) => <TwinTag key={territory} tone="blue"><MapPin size={10} className="mr-1"/>{territory}</TwinTag>)}</div>
            <div className="mt-4 border-t border-slate-100 pt-4"><p className="text-[9px] font-black uppercase text-slate-600">Modèle de revenus</p><p className="mt-1 text-[11px] font-semibold leading-5 text-slate-800">{unit.revenueModel}</p></div>
          </article>
        })}
      </section>

      <div className="space-y-5">
        <TwinPanel eyebrow="Mandate priority" title="Unité la plus stratégique" icon={Target} tone="rose">
          {top ? <><div className="rounded-[24px] bg-slate-950 p-5 text-white"><p className="text-[9px] font-black uppercase tracking-[.14em] text-cyan-200">{top.code}</p><p className="mt-2 text-xl font-black">{top.name}</p><p className="mt-3 text-[11px] font-semibold leading-5 text-slate-200">{top.deliveryModel}</p><div className="mt-4 flex items-center justify-between"><span className="text-[10px] font-black text-white">Priorité</span><span className="text-2xl font-black text-white">{top.commercialPriority}</span></div></div><button onClick={() => openEditor('business-unit', businessUnitRecord(top))} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-4 py-3 text-xs font-black text-white"><Edit3 size={15}/> Ouvrir le dossier</button></> : null}
        </TwinPanel>
        <TwinPanel eyebrow="Coverage logic" title="Relations à consolider" icon={Layers3} tone="violet">
          <div className="space-y-3">{twin.businessUnits.slice(0, 5).map((unit) => <div key={unit.code} className="rounded-[20px] border border-slate-200 bg-slate-50 p-3"><div className="flex items-center justify-between"><p className="text-xs font-black text-slate-950">{unit.name}</p><TwinStatus status={unit.status}/></div><p className="mt-2 text-[10px] font-semibold text-slate-700">{unit.dependencies.length ? `${unit.dependencies.length} dépendance(s) déclarée(s)` : 'Aucune dépendance déclarée'}</p></div>)}</div>
        </TwinPanel>
        <Link href="/revenue-command-os/digital-twin/markets-territories" className="flex items-center justify-between rounded-[26px] border border-cyan-200 bg-cyan-50 p-5 text-cyan-950"><div><p className="text-[9px] font-black uppercase">Étape suivante</p><p className="mt-1 text-sm font-black">Vérifier la couverture territoriale</p></div><Compass size={22}/></Link>
      </div>
    </div> : <TwinEmpty title="Aucune unité commerciale modélisée" description="Le modèle est sain mais ne contient aucune unité. Utilisez “Nouvelle unité” pour structurer la première ligne de revenus."/>}
    <TwinSafetyBanner />
  </div>
}
