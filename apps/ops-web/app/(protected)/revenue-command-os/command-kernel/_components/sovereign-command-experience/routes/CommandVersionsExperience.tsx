'use client'

import { GitBranch, History, RotateCcw, ShieldCheck } from 'lucide-react'
import { SChip } from '../../../../_components/visual-sovereignty/SovereignPrimitives'
import { CommandEmpty, CommandPanel, CommandRouteMasthead, CommandStat, formatDate, commandName } from '../CommandExperiencePrimitives'
import type { CommandRouteContext } from '../command-experience-types'

export default function CommandVersionsExperience({ data, commands, loading, warnings, selectCommand }: CommandRouteContext) {
  const versions = data?.versions || []
  const approved = versions.filter((version) => version.status === 'approved')
  const superseded = versions.filter((version) => version.status === 'superseded' || version.status === 'retired')
  const commandGroups = new Map<string, typeof versions>()
  versions.forEach((version) => commandGroups.set(version.commandCode, [...(commandGroups.get(version.commandCode) || []), version]))
  return <div className="space-y-6" data-command-experience="command-version-governance">
    <CommandRouteMasthead eyebrow="Lignée & compatibilité" title="Versions" subtitle="Gouverner les versions actives, antérieures et retirées avec provenance, compatibilité et historique protégé." concept="Command Version Governance" icon={GitBranch} mode={loading ? 'initializing' : data?.dataMode} warnings={warnings} freshness={data?.generatedAt} authority="Historique protégé" secondary={{ label: 'Voir la certification', href: '/revenue-command-os/command-kernel/validation' }}>
      <div className="grid grid-cols-3 gap-2"><CommandStat label="Versions" value={versions.length} tone="blue" /><CommandStat label="Approuvées" value={approved.length} tone="emerald" /><CommandStat label="Supersédées" value={superseded.length} tone="slate" /></div>
    </CommandRouteMasthead>

    <div className="space-y-5">
      {[...commandGroups.entries()].map(([code, items]) => {
        const command = commands.find((item) => item.commandCode === code)
        const sorted = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        return <CommandPanel key={code} title={commandName(code, commands)} eyebrow={code} icon={History} tone="blue" action={command ? <button type="button" onClick={() => selectCommand(command)} className="rounded-xl bg-slate-950 px-3 py-2 text-[9px] font-black text-white">Ouvrir la commande</button> : null}>
          <div className="relative space-y-3 before:absolute before:bottom-4 before:left-[19px] before:top-4 before:w-px before:bg-slate-200">
            {sorted.map((version, index) => <article key={version.id} className="relative grid gap-4 rounded-[22px] border border-slate-200 bg-white p-4 pl-14 lg:grid-cols-[130px_1fr_180px] lg:items-center"><span className={`absolute left-3 top-5 grid h-8 w-8 place-items-center rounded-full border-4 border-white text-[9px] font-black ${index === 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>{index + 1}</span><div><p className="font-mono text-sm font-black text-slate-950">v{version.version}</p><div className="mt-2"><SChip tone={version.status === 'approved' ? 'emerald' : version.status === 'superseded' ? 'slate' : 'amber'}>{version.status}</SChip></div></div><div><p className="text-xs font-black text-slate-950">{version.changeSummary}</p><p className="mt-2 font-mono text-[9px] font-bold text-slate-500">Hash · {version.schemaHash}</p></div><div className="text-[10px] font-semibold leading-5 text-slate-600"><p>Créée · {formatDate(version.createdAt)}</p><p>Effective · {formatDate(version.effectiveAt)}</p><p>Approuvée · {formatDate(version.approvedAt)}</p></div></article>)}
          </div>
        </CommandPanel>
      })}
      {!versions.length ? <CommandEmpty title="Aucun historique de version" description="La source n’a retourné aucune lignée exploitable. Aucune version de démonstration n’est créée." /> : null}
    </div>

    <CommandPanel title="Politique de restauration" eyebrow="Rollback" icon={RotateCcw} tone="amber"><div className="grid gap-3 md:grid-cols-3">{['Une restauration doit cibler une version existante et signée.', 'La compatibilité et les dépendances doivent être réévaluées.', 'Aucun rollback de commande n’est déclenché automatiquement depuis cette vue.'].map((item) => <div key={item} className="rounded-[20px] border border-amber-200 bg-amber-50 p-4 text-[11px] font-semibold leading-5 text-amber-950">{item}</div>)}</div></CommandPanel>
    <CommandPanel title="Traçabilité" eyebrow="Institution" icon={ShieldCheck} tone="emerald"><p className="text-sm font-semibold leading-7 text-slate-700">La lignée conserve la version, le hash de schéma, le résumé de changement et l’autorité réellement disponibles dans le registre.</p></CommandPanel>
  </div>
}
