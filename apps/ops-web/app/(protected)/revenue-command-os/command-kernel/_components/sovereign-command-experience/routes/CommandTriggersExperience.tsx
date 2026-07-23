'use client'

import { Activity, Power, Radar, Radio, ShieldAlert } from 'lucide-react'
import { SChip } from '../../../../_components/visual-sovereignty/SovereignPrimitives'
import { CommandEmpty, CommandPanel, CommandRouteMasthead, CommandStat, commandName } from '../CommandExperiencePrimitives'
import type { CommandRouteContext } from '../command-experience-types'

export default function CommandTriggersExperience({ data, commands, loading, warnings, selectCommand }: CommandRouteContext) {
  const triggers = data?.triggers || []
  const active = triggers.filter((trigger) => trigger.active)
  const inactive = triggers.filter((trigger) => !trigger.active)
  const types = [...new Set(triggers.map((trigger) => trigger.type))]
  return <div className="space-y-6" data-command-experience="activation-trigger-registry">
    <CommandRouteMasthead eyebrow="Conditions d’activation" title="Déclencheurs" subtitle="Superviser les événements, conditions et priorités capables de proposer une commande sans jamais contourner l’éligibilité ou l’autorité." concept="Activation Trigger Registry" icon={Radar} mode={loading ? 'initializing' : data?.dataMode} warnings={warnings} freshness={data?.generatedAt} authority="Activation gouvernée" secondary={{ label: 'Voir les planifications', href: '/revenue-command-os/command-kernel/schedules' }}>
      <div className="grid grid-cols-3 gap-2"><CommandStat label="Actifs" value={active.length} tone="emerald" /><CommandStat label="Inactifs" value={inactive.length} tone="slate" /><CommandStat label="Types" value={types.length} tone="violet" /></div>
    </CommandRouteMasthead>

    <div className="grid gap-6 xl:grid-cols-[1fr_330px]">
      <CommandPanel title="Registre d’activation" eyebrow="Événements & conditions" icon={Radio} tone="amber">
        <div className="grid gap-4 md:grid-cols-2">
          {triggers.map((trigger) => {
            const command = commands.find((item) => item.commandCode === trigger.commandCode)
            return <article key={trigger.id} className={`rounded-[26px] border p-5 ${trigger.active ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] font-black text-violet-700">{trigger.code}</p><h3 className="mt-2 text-sm font-black text-slate-950">{commandName(trigger.commandCode, commands)}</h3></div><SChip tone={trigger.active ? 'emerald' : 'slate'}>{trigger.active ? 'actif' : 'inactif'}</SChip></div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-[10px]"><div className="rounded-2xl bg-slate-50 p-3"><p className="font-black uppercase tracking-[.1em] text-slate-500">Type</p><p className="mt-1 font-black text-slate-950">{trigger.type}</p></div><div className="rounded-2xl bg-slate-50 p-3"><p className="font-black uppercase tracking-[.1em] text-slate-500">Priorité</p><p className="mt-1 font-black text-slate-950">{trigger.priority}</p></div></div>
              <p className="mt-4 text-[10px] font-semibold leading-5 text-slate-600">Source : {trigger.source}{trigger.eventType ? ` · Événement : ${trigger.eventType}` : ''}</p>
              {trigger.conditionExpression ? <code className="mt-3 block rounded-2xl bg-slate-950 p-3 text-[10px] font-bold leading-5 text-cyan-200">{trigger.conditionExpression}</code> : null}
              <div className="mt-4 flex items-center justify-between"><span className="text-[9px] font-black uppercase tracking-[.1em] text-slate-500">Replay {trigger.replayWindowMinutes} min</span>{command ? <button type="button" onClick={() => selectCommand(command)} className="rounded-xl border border-slate-200 px-3 py-2 text-[9px] font-black text-slate-700">Ouvrir la commande</button> : null}</div>
            </article>
          })}
          {!triggers.length ? <CommandEmpty title="Aucun déclencheur disponible" description="La source n’a retourné aucun déclencheur. Aucune activation n’est supposée ou fabriquée." /> : null}
        </div>
      </CommandPanel>
      <div className="space-y-6">
        <CommandPanel title="Distribution" eyebrow="Types de déclenchement" icon={Activity} tone="violet"><div className="space-y-3">{types.map((type) => <div key={type} className="flex items-center justify-between rounded-[20px] border border-slate-200 p-4"><span className="text-[11px] font-black text-slate-800">{type}</span><SChip tone="violet">{triggers.filter((trigger) => trigger.type === type).length}</SChip></div>)}</div></CommandPanel>
        <CommandPanel title="Règle d’autorité" eyebrow="Sécurité" icon={ShieldAlert} tone="amber"><div className="space-y-3 text-[11px] font-semibold leading-5 text-slate-700"><p className="rounded-2xl bg-amber-50 p-4">Un déclencheur actif ne signifie jamais qu’une commande est automatiquement éligible.</p><p className="rounded-2xl bg-slate-50 p-4">Les contextes, permissions, validations et approbations restent obligatoires.</p><p className="rounded-2xl bg-cyan-50 p-4">Les effets externes demeurent verrouillés en mode Shadow.</p></div></CommandPanel>
      </div>
    </div>
  </div>
}
