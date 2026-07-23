'use client'

import { Braces, Layers3, Network, SearchCheck } from 'lucide-react'
import { SChip } from '../../../../_components/visual-sovereignty/SovereignPrimitives'
import { CommandEmpty, CommandPanel, CommandRouteMasthead, CommandStat, ProgressBar } from '../CommandExperiencePrimitives'
import type { CommandRouteContext } from '../command-experience-types'

export default function CommandTaxonomyExperience({ data, commands, loading, warnings }: CommandRouteContext) {
  const families = data?.families || []
  const familyCounts = new Map<string, number>()
  commands.forEach((command) => familyCounts.set(command.family, (familyCounts.get(command.family) || 0) + 1))
  const unclassified = commands.filter((command) => !command.family)
  const activeFamilies = families.filter((family) => family.active)
  const totalTarget = families.reduce((sum, family) => sum + family.targetCount, 0)
  return <div className="space-y-6" data-command-experience="doctrine-classification-atlas">
    <CommandRouteMasthead eyebrow="Architecture doctrinale" title="Taxonomie" subtitle="Cartographier les familles, responsabilités et densités de la bibliothèque canonique sans confondre structure, volume et autorité." concept="Doctrine Classification Atlas" icon={Braces} mode={loading ? 'initializing' : data?.dataMode} warnings={warnings} freshness={data?.generatedAt} authority="Classification canonique" secondary={{ label: 'Ouvrir le catalogue', href: '/revenue-command-os/command-kernel/catalogue' }}>
      <div className="grid grid-cols-3 gap-2"><CommandStat label="Familles" value={families.length || '—'} tone="violet" /><CommandStat label="Actives" value={activeFamilies.length || '—'} tone="emerald" /><CommandStat label="Non classées" value={unclassified.length} tone={unclassified.length ? 'amber' : 'emerald'} /></div>
    </CommandRouteMasthead>

    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <CommandPanel title="Atlas des familles" eyebrow="Répartition canonique" icon={Layers3} tone="violet">
        <div className="grid gap-4 md:grid-cols-2">
          {families.map((family, index) => {
            const actual = familyCounts.get(family.code) || 0
            const completion = family.targetCount ? Math.round((actual / family.targetCount) * 100) : 0
            return <article key={family.id} className="rounded-[25px] border border-slate-200 bg-slate-50/60 p-5 transition hover:border-violet-300 hover:bg-white hover:shadow-[0_18px_44px_rgba(15,23,42,.07)]">
              <div className="flex items-start justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[.14em] text-violet-700">Famille {String(index + 1).padStart(2, '0')}</p><h3 className="mt-2 text-base font-black text-slate-950">{family.name}</h3></div><SChip tone={family.active ? 'emerald' : 'slate'}>{family.active ? 'active' : 'inactive'}</SChip></div>
              <p className="mt-3 text-[11px] font-semibold leading-5 text-slate-600">{family.description}</p>
              <div className="mt-5 grid grid-cols-2 gap-3"><CommandStat label="Réelles" value={actual} tone="blue" /><CommandStat label="Cible" value={family.targetCount} tone="slate" /></div>
              <div className="mt-4"><div className="mb-2 flex justify-between text-[9px] font-black uppercase tracking-[.1em] text-slate-500"><span>Couverture</span><span>{completion}%</span></div><ProgressBar value={completion} tone={completion >= 100 ? 'emerald' : completion >= 80 ? 'blue' : 'amber'} /></div>
              <p className="mt-4 text-[10px] font-black text-slate-700">Owner · {family.ownerRole}</p>
            </article>
          })}
          {!families.length ? <CommandEmpty title="Taxonomie indisponible" description="La source n’a retourné aucune famille. Aucun volume ne peut être déduit ou fabriqué." /> : null}
        </div>
      </CommandPanel>

      <div className="space-y-6">
        <CommandPanel title="Intégrité de classification" eyebrow="Contrôles" icon={SearchCheck} tone={unclassified.length ? 'amber' : 'emerald'}>
          <div className="space-y-3"><CommandStat label="Commandes classées" value={commands.length - unclassified.length} note="Famille canonique disponible" tone="emerald" /><CommandStat label="Objectif cumulé" value={totalTarget || '—'} note="Somme des cibles familiales" tone="violet" /><CommandStat label="Écart cible/réel" value={totalTarget ? commands.length - totalTarget : '—'} note="Écart descriptif, non réparé" tone={totalTarget === commands.length ? 'emerald' : 'amber'} /></div>
        </CommandPanel>
        <CommandPanel title="Principes de lecture" eyebrow="Gouvernance" icon={Network} tone="blue">
          <div className="space-y-3 text-[11px] font-semibold leading-5 text-slate-700">{['Une famille exprime une doctrine opérationnelle, pas un simple dossier visuel.', 'Les anchors protégés restent hors de la classification canonique.', 'Un écart de cible est signalé, jamais masqué par un volume inventé.', 'La taxonomie ne modifie aucune définition depuis cette interface.'].map((item) => <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">{item}</div>)}</div>
        </CommandPanel>
      </div>
    </div>
  </div>
}
