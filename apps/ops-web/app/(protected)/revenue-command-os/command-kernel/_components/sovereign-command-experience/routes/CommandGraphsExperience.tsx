'use client'

import { GitBranch, Link2, Network, ShieldAlert, Waypoints } from 'lucide-react'
import { SChip } from '../../../../_components/visual-sovereignty/SovereignPrimitives'
import { CommandEmpty, CommandPanel, CommandRouteMasthead, CommandStat, commandName } from '../CommandExperiencePrimitives'
import type { CommandRouteContext } from '../command-experience-types'

export default function CommandGraphsExperience({ data, commands, loading, warnings, selectCommand }: CommandRouteContext) {
  const graphs = data?.graphs || []
  const nodes = graphs.flatMap((graph) => graph.nodes)
  const interruptNodes = nodes.filter((node) => node.approvalInterrupt)
  const requiredNodes = nodes.filter((node) => node.required)
  return <div className="space-y-6" data-command-experience="command-dependency-topology">
    <CommandRouteMasthead eyebrow="Relations critiques" title="Graphes de dépendance" subtitle="Tracer les chaînes amont, aval, succès, échec et interruption d’autorité sans transformer la topologie en animation décorative." concept="Command Dependency Topology" icon={Network} mode={loading ? 'initializing' : data?.dataMode} warnings={warnings} freshness={data?.generatedAt} authority="Topologie protégée" secondary={{ label: 'Voir le routage', href: '/revenue-command-os/command-kernel/routing' }}>
      <div className="grid grid-cols-3 gap-2"><CommandStat label="Graphes" value={graphs.length} tone="violet" /><CommandStat label="Nœuds" value={nodes.length} tone="blue" /><CommandStat label="Interruptions" value={interruptNodes.length} tone="amber" /></div>
    </CommandRouteMasthead>

    <div className="space-y-6">
      {graphs.map((graph) => <CommandPanel key={graph.id} title={graph.name} eyebrow={`${graph.code} · v${graph.version}`} icon={Waypoints} tone={graph.status === 'approved' ? 'emerald' : 'amber'} action={<SChip tone={graph.status === 'approved' ? 'emerald' : 'amber'}>{graph.status}</SChip>}>
        <p className="max-w-4xl text-[11px] font-semibold leading-6 text-slate-600">{graph.description}</p>
        <div className="mt-5 overflow-x-auto pb-2">
          <div className="flex min-w-max items-stretch gap-3">
            {[...graph.nodes].sort((a, b) => a.order - b.order).map((node, index) => {
              const command = commands.find((item) => item.commandCode === node.commandCode)
              return <div key={node.id} className="flex items-center gap-3"><button type="button" onClick={() => command && selectCommand(command)} disabled={!command} className={`w-[260px] rounded-[24px] border p-4 text-left transition ${node.approvalInterrupt ? 'border-amber-300 bg-amber-50' : node.required ? 'border-violet-200 bg-violet-50/55' : 'border-slate-200 bg-white'} disabled:cursor-default`}><div className="flex items-start justify-between gap-3"><span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-950 text-[10px] font-black text-white">{node.order}</span><div className="flex gap-1">{node.required ? <SChip tone="violet">requis</SChip> : null}{node.approvalInterrupt ? <SChip tone="amber">autorité</SChip> : null}</div></div><p className="mt-4 font-mono text-[10px] font-black text-violet-700">{node.commandCode}</p><p className="mt-1 text-xs font-black text-slate-950">{commandName(node.commandCode, commands)}</p><div className="mt-4 grid grid-cols-2 gap-2 text-[9px] font-black uppercase tracking-[.08em] text-slate-500"><span>Succès {node.onSuccess.length}</span><span>Échec {node.onFailure.length}</span></div></button>{index < graph.nodes.length - 1 ? <Link2 size={18} className="text-slate-400" /> : null}</div>
            })}
          </div>
        </div>
      </CommandPanel>)}
      {!graphs.length ? <CommandEmpty title="Aucun graphe disponible" description="La source n’a retourné aucune chaîne de dépendance. Aucun chemin critique n’est inventé." /> : null}
    </div>

    <div className="grid gap-4 lg:grid-cols-3"><CommandStat label="Nœuds requis" value={requiredNodes.length} tone="violet" /><CommandStat label="Interruption d’approbation" value={interruptNodes.length} tone="amber" /><CommandStat label="Entrées déclarées" value={graphs.reduce((sum, graph) => sum + graph.entryNodeIds.length, 0)} tone="blue" /></div>
    <CommandPanel title="Règle de lecture" eyebrow="Sécurité topologique" icon={ShieldAlert} tone="amber"><p className="text-sm font-semibold leading-7 text-slate-700">Une relation de graphe n’accorde aucune autorité. Chaque nœud reste soumis à ses contextes, permissions, validateurs et classes d’approbation propres.</p></CommandPanel>
  </div>
}
