'use client'

import { ArrowRight, LockKeyhole, Route, ShieldCheck, Split } from 'lucide-react'
import { SChip } from '../../../../_components/visual-sovereignty/SovereignPrimitives'
import { CommandEmpty, CommandPanel, CommandRouteMasthead, CommandStat, SafetyLockBanner } from '../CommandExperiencePrimitives'
import type { CommandRouteContext } from '../command-experience-types'

export default function CommandRoutingExperience({ data, commands, loading, warnings, selectCommand }: CommandRouteContext) {
  const routed = commands.filter((command) => command.downstreamCompiler || command.fallbackCommandCodes.length || command.failurePolicy.fallbackCommandCodes.length)
  const blocked = commands.filter((command) => command.approvalClass === 'prohibited')
  const approvalGated = commands.filter((command) => !['none', 'recommendation', 'internal-generation'].includes(command.approvalClass))
  return <div className="space-y-6" data-command-experience="command-routing-control-plane">
    <CommandRouteMasthead eyebrow="Éligibilité & propagation" title="Routage" subtitle="Lire les destinations, fallbacks, classes d’autorité et limites d’exécution avant toute propagation opérationnelle." concept="Command Routing Control Plane" icon={Route} mode={loading ? 'initializing' : data?.dataMode} warnings={warnings} freshness={data?.generatedAt} authority="Routage déterministe · Shadow" secondary={{ label: 'Voir les dépendances', href: '/revenue-command-os/command-kernel/graphs' }}>
      <div className="grid grid-cols-3 gap-2"><CommandStat label="Routées" value={routed.length} tone="cyan" /><CommandStat label="Sous autorité" value={approvalGated.length} tone="amber" /><CommandStat label="Interdites" value={blocked.length} tone="rose" /></div>
    </CommandRouteMasthead>

    <SafetyLockBanner detail="Le plan de routage reste consultatif et Shadow. Aucun canal, paiement, engagement ou communication externe n’est activé par cette page." />

    <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
      <CommandPanel title="Couloirs de propagation" eyebrow="Origine → destination" icon={Split} tone="cyan">
        <div className="space-y-3">
          {routed.slice(0, 40).map((command) => {
            const destinations = [...new Set([command.downstreamCompiler, ...command.fallbackCommandCodes, ...command.failurePolicy.fallbackCommandCodes].filter(Boolean) as string[])]
            return <article key={command.id} className="grid gap-4 rounded-[24px] border border-slate-200 p-4 lg:grid-cols-[1fr_auto_1fr_auto] lg:items-center">
              <button type="button" onClick={() => selectCommand(command)} className="text-left"><p className="font-mono text-[10px] font-black text-violet-700">{command.commandCode}</p><p className="mt-1 text-xs font-black text-slate-950">{command.name}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{command.ownerRole}</p></button>
              <ArrowRight size={18} className="hidden text-cyan-600 lg:block" />
              <div className="flex flex-wrap gap-2">{destinations.length ? destinations.map((destination) => <SChip key={destination} tone="cyan">{destination}</SChip>) : <SChip tone="slate">Aucune destination déclarée</SChip>}</div>
              <SChip tone={command.approvalClass === 'prohibited' ? 'rose' : command.approvalClass === 'none' ? 'emerald' : 'amber'}>{command.approvalClass}</SChip>
            </article>
          })}
          {!routed.length ? <CommandEmpty title="Aucun routage déclaré" description="La source est saine mais aucune destination, fallback ou compilation aval n’est disponible." /> : null}
        </div>
      </CommandPanel>

      <div className="space-y-6">
        <CommandPanel title="Périmètre d’autorité" eyebrow="Classes de décision" icon={ShieldCheck} tone="amber">
          <div className="space-y-3">{[...new Set(commands.map((command) => command.approvalClass))].map((approvalClass) => { const count = commands.filter((command) => command.approvalClass === approvalClass).length; return <div key={approvalClass} className="flex items-center justify-between rounded-[20px] border border-slate-200 p-4"><span className="text-[11px] font-black text-slate-800">{approvalClass}</span><SChip tone={approvalClass === 'prohibited' ? 'rose' : approvalClass === 'none' ? 'emerald' : 'amber'}>{count}</SChip></div> })}</div>
        </CommandPanel>
        <CommandPanel title="Chemins bloqués" eyebrow="Interdictions" icon={LockKeyhole} tone="rose">
          <div className="space-y-3">{blocked.slice(0, 12).map((command) => <button key={command.id} type="button" onClick={() => selectCommand(command)} className="w-full rounded-[20px] border border-rose-200 bg-rose-50 p-4 text-left"><p className="font-mono text-[10px] font-black text-rose-700">{command.commandCode}</p><p className="mt-1 text-xs font-black text-rose-950">{command.name}</p></button>)}{!blocked.length ? <CommandEmpty title="Aucun chemin prohibé déclaré" description="Aucune commande n’est actuellement classée comme interdite par la source disponible." /> : null}</div>
        </CommandPanel>
      </div>
    </div>
  </div>
}
