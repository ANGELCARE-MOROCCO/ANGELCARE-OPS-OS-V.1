'use client'

import { AlarmClock, CalendarClock, Clock3, History, ShieldCheck } from 'lucide-react'
import { SChip } from '../../../../_components/visual-sovereignty/SovereignPrimitives'
import { CommandEmpty, CommandPanel, CommandRouteMasthead, CommandStat, formatDate, commandName } from '../CommandExperiencePrimitives'
import type { CommandRouteContext } from '../command-experience-types'

export default function CommandSchedulesExperience({ data, commands, loading, warnings, selectCommand }: CommandRouteContext) {
  const schedules = data?.schedules || []
  const enabled = schedules.filter((schedule) => schedule.enabled)
  const disabled = schedules.filter((schedule) => !schedule.enabled)
  const overdue = schedules.filter((schedule) => schedule.nextRunAt && new Date(schedule.nextRunAt).getTime() < Date.now())
  return <div className="space-y-6" data-command-experience="command-scheduling-bureau">
    <CommandRouteMasthead eyebrow="Cadence & temporalité" title="Planifications" subtitle="Superviser les cadences, fenêtres d’exécution et politiques de rattrapage sans confondre planification et autorisation d’effet." concept="Command Scheduling Bureau" icon={AlarmClock} mode={loading ? 'initializing' : data?.dataMode} warnings={warnings} freshness={data?.generatedAt} authority="Calendrier gouverné" secondary={{ label: 'Voir les exécutions', href: '/revenue-command-os/command-kernel/runs' }}>
      <div className="grid grid-cols-3 gap-2"><CommandStat label="Actives" value={enabled.length} tone="emerald" /><CommandStat label="Désactivées" value={disabled.length} tone="slate" /><CommandStat label="Échues" value={overdue.length} tone={overdue.length ? 'amber' : 'emerald'} /></div>
    </CommandRouteMasthead>

    <CommandPanel title="Bureau de planification" eyebrow="Cadences opérationnelles" icon={CalendarClock} tone="blue">
      <div className="grid gap-4 lg:grid-cols-2">
        {schedules.map((schedule) => {
          const command = commands.find((item) => item.commandCode === schedule.commandCode)
          return <article key={schedule.id} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,.04)]">
            <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] font-black text-blue-700">{schedule.code}</p><h3 className="mt-2 text-sm font-black text-slate-950">{schedule.label}</h3><p className="mt-1 text-[10px] font-semibold text-slate-500">{commandName(schedule.commandCode, commands)}</p></div><SChip tone={schedule.enabled ? 'emerald' : 'slate'}>{schedule.enabled ? 'active' : 'désactivée'}</SChip></div>
            <div className="mt-5 grid grid-cols-2 gap-3"><CommandStat label="Cadence" value={schedule.cadence} note={schedule.timezone} tone="blue" /><CommandStat label="Mode" value={schedule.executionMode} note={schedule.businessHoursOnly ? 'Heures ouvrées' : 'Toute fenêtre'} tone="cyan" /></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-slate-200 p-3"><div className="flex items-center gap-2 text-slate-500"><Clock3 size={14} /><span className="text-[9px] font-black uppercase tracking-[.1em]">Prochaine</span></div><p className="mt-2 text-[11px] font-black text-slate-950">{formatDate(schedule.nextRunAt)}</p></div><div className="rounded-2xl border border-slate-200 p-3"><div className="flex items-center gap-2 text-slate-500"><History size={14} /><span className="text-[9px] font-black uppercase tracking-[.1em]">Dernière</span></div><p className="mt-2 text-[11px] font-black text-slate-950">{formatDate(schedule.lastRunAt)}</p></div></div>
            <div className="mt-4 flex items-center justify-between gap-3"><span className="text-[9px] font-black uppercase tracking-[.1em] text-slate-500">Rattrapage · {schedule.missedRunPolicy}</span>{command ? <button type="button" onClick={() => selectCommand(command)} className="rounded-xl bg-slate-950 px-3 py-2 text-[9px] font-black text-white">Ouvrir la commande</button> : null}</div>
          </article>
        })}
        {!schedules.length ? <CommandEmpty title="Aucune planification disponible" description="La source ne contient aucune cadence. Aucun prochain passage n’est inféré." /> : null}
      </div>
    </CommandPanel>

    <div className="grid gap-4 lg:grid-cols-3"><CommandStat label="Heures ouvrées" value={schedules.filter((schedule) => schedule.businessHoursOnly).length} tone="blue" /><CommandStat label="Mode Shadow" value={schedules.filter((schedule) => schedule.executionMode === 'shadow').length} tone="cyan" /><CommandStat label="Aucun effet externe" value="Verrouillé" note="La planification n’active pas l’exécution externe" tone="emerald" /></div>
    <CommandPanel title="Constitution temporelle" eyebrow="Sécurité" icon={ShieldCheck} tone="emerald"><p className="text-sm font-semibold leading-7 text-slate-700">Une date planifiée décrit une intention temporelle. L’éligibilité, le contexte, l’autorité et les garde-fous sont toujours réévalués au moment réel de l’exécution.</p></CommandPanel>
  </div>
}
