'use client'

import { Braces, CheckCircle2, FlaskConical, Play, ShieldCheck, TriangleAlert } from 'lucide-react'
import { CommandPanel, CommandRouteMasthead, CommandStat, SafetyLockBanner } from '../CommandExperiencePrimitives'
import type { CommandSimulationContext } from '../command-experience-types'

export default function CommandSimulationExperience({ data, loading, warnings, result, busy, runSimulation }: CommandSimulationContext) {
  const output = result && typeof result === 'object' ? result as Record<string, unknown> : null
  return <div className="space-y-6" data-command-experience="governed-command-simulation-chamber">
    <CommandRouteMasthead eyebrow="Prévisualisation gouvernée" title="Simulation" subtitle="Examiner une propagation déterministe sans effet externe, avec hypothèses, blocages, autorité et résultat clairement séparés de l’exécution réelle." concept="Governed Command Simulation Chamber" icon={FlaskConical} mode={busy ? 'initializing' : data?.dataMode} warnings={warnings} freshness={data?.generatedAt} authority="Simulation uniquement" primary={{ label: busy ? 'Simulation en cours…' : 'Lancer la simulation', onClick: () => void runSimulation(), disabled: busy || !data, reason: !data ? 'Le noyau doit être disponible.' : busy ? 'Simulation déjà en cours.' : undefined }} secondary={{ label: 'Voir les exécutions', href: '/revenue-command-os/command-kernel/runs' }}>
      <div className="grid grid-cols-3 gap-2"><CommandStat label="Mode" value="Simulation" tone="violet" /><CommandStat label="Effet externe" value="0" tone="emerald" /><CommandStat label="Posture" value={data?.executionPosture || 'shadow'} tone="cyan" /></div>
    </CommandRouteMasthead>

    <SafetyLockBanner detail="Cette chambre ne déclenche aucune communication, transaction, modification contractuelle ou autre effet externe. Le résultat est une prévisualisation gouvernée." />

    <div className="grid gap-6 xl:grid-cols-[.75fr_1.25fr]">
      <CommandPanel title="Protocole de simulation" eyebrow="Étapes contrôlées" icon={Braces} tone="violet">
        <div className="space-y-3">{[
          ['01', 'Résoudre la situation', 'Charger uniquement les contextes disponibles et autorisés.'],
          ['02', 'Tester l’éligibilité', 'Appliquer les règles dures, les blocages et la fraîcheur.'],
          ['03', 'Tracer la propagation', 'Construire le plan sans lancer d’effet réel.'],
          ['04', 'Exposer les autorités', 'Montrer les approbations nécessaires et interdictions.'],
          ['05', 'Restituer la preuve', 'Retourner hash, étapes, raisons et limites.'],
        ].map(([number, title, detail]) => <div key={number} className="grid grid-cols-[42px_1fr] gap-3 rounded-[22px] border border-slate-200 p-4"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-[10px] font-black text-white">{number}</span><div><p className="text-xs font-black text-slate-950">{title}</p><p className="mt-1 text-[10px] font-semibold leading-5 text-slate-600">{detail}</p></div></div>)}</div>
      </CommandPanel>

      <CommandPanel title="Résultat gouverné" eyebrow={output ? 'Dernière simulation' : 'En attente'} icon={output ? CheckCircle2 : TriangleAlert} tone={output ? 'emerald' : 'amber'}>
        {output ? <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><CommandStat label="Plan" value={String(output.id || output.planId || 'Disponible')} tone="violet" /><CommandStat label="Mode" value={String(output.mode || 'simulation')} tone="cyan" /><CommandStat label="Hash" value={String(output.deterministicHash || '—').slice(0, 12)} tone="blue" /></div><pre className="max-h-[520px] overflow-auto rounded-[24px] bg-slate-950 p-5 text-[10px] font-semibold leading-5 text-emerald-200">{JSON.stringify(output, null, 2)}</pre></div> : <div className="rounded-[26px] border border-dashed border-amber-300 bg-amber-50 p-8 text-center"><Play size={28} className="mx-auto text-amber-700" /><h3 className="mt-4 text-base font-black text-amber-950">Aucun résultat simulé</h3><p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-amber-900">Lancez la simulation pour obtenir le plan gouverné actuel. Aucun résultat de démonstration n’est préchargé.</p></div>}
      </CommandPanel>
    </div>

    <CommandPanel title="Limites institutionnelles" eyebrow="Interprétation" icon={ShieldCheck} tone="emerald"><div className="grid gap-3 md:grid-cols-3">{['Le résultat dépend des contextes réellement disponibles.', 'Une étape “ready” ne contourne jamais l’approbation.', 'Une simulation réussie ne constitue pas une preuve d’exécution réelle.'].map((item) => <div key={item} className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-4 text-[11px] font-semibold leading-5 text-emerald-950">{item}</div>)}</div></CommandPanel>
  </div>
}
