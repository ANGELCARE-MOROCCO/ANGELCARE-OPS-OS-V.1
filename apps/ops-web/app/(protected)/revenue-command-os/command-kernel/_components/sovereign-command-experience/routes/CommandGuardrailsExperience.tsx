'use client'

import { Ban, KeyRound, LockKeyhole, ShieldCheck, ShieldX } from 'lucide-react'
import { SChip } from '../../../../_components/visual-sovereignty/SovereignPrimitives'
import { CommandEmpty, CommandPanel, CommandRouteMasthead, CommandStat, SafetyLockBanner } from '../CommandExperiencePrimitives'
import type { CommandRouteContext } from '../command-experience-types'

export default function CommandGuardrailsExperience({ data, commands, loading, warnings, selectCommand }: CommandRouteContext) {
  const forbiddenTools = [...new Set(commands.flatMap((command) => command.toolPermissions.filter((tool) => !tool.allowed).map((tool) => tool.toolCode)))].sort()
  const permittedTools = [...new Set(commands.flatMap((command) => command.toolPermissions.filter((tool) => tool.allowed).map((tool) => tool.toolCode)))].sort()
  const approvalClasses = [...new Set(commands.map((command) => command.approvalClass))]
  const prohibitedCommands = commands.filter((command) => command.approvalClass === 'prohibited')
  return <div className="space-y-6" data-command-experience="operational-safety-constitution">
    <CommandRouteMasthead eyebrow="Constitution de sécurité" title="Garde-fous" subtitle="Exposer clairement les permissions, interdictions, classes d’autorité et cas prohibés qui entourent chaque commande." concept="Operational Safety Constitution" icon={ShieldCheck} mode={loading ? 'initializing' : data?.dataMode} warnings={warnings} freshness={data?.generatedAt} authority="Least privilege · Shadow" secondary={{ label: 'Ouvrir la validation', href: '/revenue-command-os/command-kernel/validation' }}>
      <div className="grid grid-cols-3 gap-2"><CommandStat label="Outils autorisés" value={permittedTools.length} tone="emerald" /><CommandStat label="Interdictions" value={forbiddenTools.length} tone="rose" /><CommandStat label="Classes" value={approvalClasses.length} tone="amber" /></div>
    </CommandRouteMasthead>

    <SafetyLockBanner />

    <div className="grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
      <CommandPanel title="Périmètre d’autorité" eyebrow="Classes d’approbation" icon={KeyRound} tone="amber">
        <div className="space-y-3">{approvalClasses.map((approvalClass) => { const count = commands.filter((command) => command.approvalClass === approvalClass).length; return <div key={approvalClass} className="flex items-center justify-between rounded-[22px] border border-slate-200 p-4"><div><p className="text-xs font-black text-slate-950">{approvalClass}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{count} commande(s)</p></div><SChip tone={approvalClass === 'prohibited' ? 'rose' : approvalClass === 'none' ? 'emerald' : approvalClass === 'executive' ? 'amber' : 'violet'}>{count}</SChip></div> })}</div>
      </CommandPanel>

      <CommandPanel title="Interdictions absolues" eyebrow="Outils & effets" icon={ShieldX} tone="rose">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{forbiddenTools.map((tool) => <div key={tool} className="flex items-center gap-3 rounded-[20px] border border-rose-200 bg-rose-50 p-4"><Ban size={16} className="shrink-0 text-rose-700" /><span className="break-all font-mono text-[10px] font-black text-rose-950">{tool}</span></div>)}{!forbiddenTools.length ? <CommandEmpty title="Aucune interdiction déclarée" description="La source ne fournit aucune interdiction d’outil. Cette absence n’est pas interprétée comme une autorisation globale." /> : null}</div>
      </CommandPanel>
    </div>

    <CommandPanel title="Commandes prohibées" eyebrow="Cas sensibles" icon={LockKeyhole} tone="rose">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{prohibitedCommands.slice(0, 30).map((command) => <button key={command.id} type="button" onClick={() => selectCommand(command)} className="rounded-[22px] border border-rose-200 bg-rose-50 p-4 text-left transition hover:border-rose-400"><p className="font-mono text-[10px] font-black text-rose-700">{command.commandCode}</p><p className="mt-2 text-xs font-black text-rose-950">{command.name}</p><p className="mt-2 text-[10px] font-semibold leading-5 text-rose-900">{command.prohibitedCases[0] || command.purpose}</p></button>)}{!prohibitedCommands.length ? <CommandEmpty title="Aucune commande prohibée" description="Aucune définition n’est actuellement classée prohibited par la source réelle." /> : null}</div>
    </CommandPanel>

    <CommandPanel title="Principes institutionnels" eyebrow="Contrôle permanent" icon={ShieldCheck} tone="emerald"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{['Tenant dérivé serveur', 'Autorité non contournable', 'Contexte minimisé', 'Trace immuable', 'Idempotence', 'Compensation avant autonomie', 'Aucun transfert de secret', 'Effets externes désactivés'].map((rule) => <div key={rule} className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-4 text-[11px] font-black text-emerald-950">{rule}</div>)}</div></CommandPanel>
  </div>
}
