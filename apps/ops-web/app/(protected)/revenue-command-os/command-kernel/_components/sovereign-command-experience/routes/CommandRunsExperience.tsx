'use client'

import { Activity, Clock3, FileClock, History, ShieldCheck } from 'lucide-react'
import { SChip, STraceLink } from '../../../../_components/visual-sovereignty/SovereignPrimitives'
import { CommandEmpty, CommandPanel, CommandRouteMasthead, CommandStat, formatDate, commandName } from '../CommandExperiencePrimitives'
import type { CommandRouteContext } from '../command-experience-types'

export default function CommandRunsExperience({ data, commands, loading, warnings, selectCommand }: CommandRouteContext) {
  const runs = data?.runs || []
  const completed = runs.filter((run) => run.status === 'completed')
  const failed = runs.filter((run) => run.status === 'failed')
  const blocked = runs.filter((run) => ['blocked', 'awaiting-approval', 'rejected'].includes(run.status))
  return <div className="space-y-6" data-command-experience="command-execution-ledger">
    <CommandRouteMasthead eyebrow="Trace opérationnelle" title="Historique des exécutions" subtitle="Consulter chaque tentative, résultat, blocage, échec et preuve sans présenter une exécution empêchée comme un succès." concept="Command Execution Ledger" icon={History} mode={loading ? 'initializing' : data?.dataMode} warnings={warnings} freshness={data?.generatedAt} authority="Trace immuable" secondary={{ label: 'Voir les versions', href: '/revenue-command-os/command-kernel/versions' }}>
      <div className="grid grid-cols-3 gap-2"><CommandStat label="Terminées" value={completed.length} tone="emerald" /><CommandStat label="Bloquées" value={blocked.length} tone="amber" /><CommandStat label="Échecs" value={failed.length} tone={failed.length ? 'rose' : 'emerald'} /></div>
    </CommandRouteMasthead>

    <CommandPanel title="Registre chronologique" eyebrow="Exécutions réelles déclarées" icon={FileClock} tone="slate">
      <div className="space-y-3">
        {runs.map((run) => {
          const command = commands.find((item) => item.commandCode === run.commandCode)
          const tone = run.status === 'completed' ? 'emerald' : run.status === 'failed' ? 'rose' : ['blocked', 'awaiting-approval', 'rejected'].includes(run.status) ? 'amber' : 'blue'
          return <article key={run.id} className="grid gap-4 rounded-[24px] border border-slate-200 p-4 xl:grid-cols-[1.1fr_.65fr_.65fr_1fr_auto] xl:items-center">
            <button type="button" onClick={() => command && selectCommand(command)} disabled={!command} className="text-left"><p className="font-mono text-[10px] font-black text-violet-700">{run.commandCode} · {run.commandVersion}</p><p className="mt-1 text-xs font-black text-slate-950">{commandName(run.commandCode, commands)}</p><p className="mt-1 text-[9px] font-bold text-slate-500">Plan {run.planId}</p></button>
            <div><p className="text-[9px] font-black uppercase tracking-[.1em] text-slate-500">Statut</p><div className="mt-2"><SChip tone={tone}>{run.status}</SChip></div></div>
            <div><p className="text-[9px] font-black uppercase tracking-[.1em] text-slate-500">Tentative</p><p className="mt-2 text-sm font-black text-slate-950">{run.attempt}</p></div>
            <div className="space-y-2 text-[10px] font-semibold text-slate-600"><p><Clock3 size={13} className="mr-1 inline" /> Début · {formatDate(run.startedAt)}</p><p><Activity size={13} className="mr-1 inline" /> Fin · {formatDate(run.completedAt)}</p>{run.failureMessage ? <p className="font-bold text-rose-700">{run.failureMessage}</p> : null}</div>
            <STraceLink traceId={run.traceReference} compact label="Trace" />
          </article>
        })}
        {!runs.length ? <CommandEmpty title="Aucune exécution enregistrée" description="La source est disponible mais ne contient aucun historique. Aucun faux événement n’est généré pour remplir le registre." /> : null}
      </div>
    </CommandPanel>

    <div className="grid gap-4 lg:grid-cols-4"><CommandStat label="Total" value={runs.length} tone="slate" /><CommandStat label="Simulées" value={runs.filter((run) => run.status === 'simulated').length} tone="violet" /><CommandStat label="Avec rollback" value={runs.filter((run) => Boolean(run.rollbackReference)).length} tone="blue" /><CommandStat label="Erreurs de validation" value={runs.reduce((sum, run) => sum + run.validationErrors.length, 0)} tone="amber" /></div>
    <CommandPanel title="Lecture de confiance" eyebrow="Forensic" icon={ShieldCheck} tone="emerald"><p className="text-sm font-semibold leading-7 text-slate-700">Le ledger distingue explicitement succès, échec, simulation, blocage et attente d’approbation. Le statut et la trace proviennent uniquement du registre réel.</p></CommandPanel>
  </div>
}
