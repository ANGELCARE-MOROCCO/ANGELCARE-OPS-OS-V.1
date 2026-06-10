import Link from 'next/link'
import type { CareLinkMission, ReadinessStatus, RiskLevel } from '@/lib/carelink/types'
import { CARELINK_AGENT_VISIBLE_STATUSES } from '@/lib/carelink/constants'

export function StatusPill({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'mint' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    red: 'bg-rose-50 text-rose-700 ring-rose-100',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    mint: 'bg-teal-50 text-teal-700 ring-teal-100',
  }
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ring-1 ${tones[tone]}`}>{children}</span>
}

export function ReadinessBadge({ status, score }: { status: ReadinessStatus; score: number }) {
  const tone = status === 'ready' ? 'green' : status === 'warning' ? 'amber' : 'red'
  return <StatusPill tone={tone}>{score}% readiness</StatusPill>
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const tone = risk === 'critical' || risk === 'high' ? 'red' : risk === 'medium' ? 'amber' : 'green'
  return <StatusPill tone={tone}>Risque {risk}</StatusPill>
}

export function MissionCard({ mission, href }: { mission: CareLinkMission; href?: string }) {
  const content = (
    <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-600">{mission.code}</p>
          <h3 className="mt-2 text-lg font-black text-slate-950">{mission.serviceType}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">{mission.clientLabel} · {mission.zone}, {mission.city}</p>
        </div>
        <ReadinessBadge status={mission.readinessStatus} score={mission.readinessScore} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs font-bold uppercase text-slate-400">Début</p><p className="font-black text-slate-900">{new Date(mission.scheduledStart).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</p></div>
        <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs font-bold uppercase text-slate-400">Durée</p><p className="font-black text-slate-900">{mission.durationHours}H</p></div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2"><StatusPill tone="blue">{CARELINK_AGENT_VISIBLE_STATUSES[mission.status] || mission.status}</StatusPill><RiskBadge risk={mission.riskLevel} /></div>
    </article>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

export function LifecycleTimeline({ mission }: { mission: CareLinkMission }) {
  return <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-base font-black text-slate-950">Cycle de vie mission</h3><div className="mt-5 space-y-4">{mission.lifecycle.map((event, index) => <div key={event.id} className="flex gap-3"><div className="flex flex-col items-center"><div className="h-3 w-3 rounded-full bg-blue-600" />{index < mission.lifecycle.length - 1 && <div className="h-10 w-px bg-slate-200" />}</div><div><p className="text-sm font-black text-slate-900">{event.label}</p><p className="text-xs font-semibold text-slate-500">{event.actor} · {new Date(event.timestamp).toLocaleString('fr-FR')}</p>{event.note && <p className="mt-1 text-xs text-slate-500">{event.note}</p>}</div></div>)}</div></div>
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center"><h3 className="text-lg font-black text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{body}</p></div>
}
