'use client'

import { useMemo, useState } from 'react'
import { CareLinkMobileShell } from './CareLinkMobileShell'
import { carelinkAgents, carelinkMissions } from '@/lib/carelink/seed'
import { computeReadiness } from '@/lib/carelink/readiness'
import { nextBestAgentAction } from '@/lib/carelink/lifecycle'
import { LifecycleTimeline, ReadinessBadge, RiskBadge, StatusPill } from '@/components/carelink/shared/CareLinkPrimitives'

export function CareLinkMissionDetail({ missionId }: { missionId: string }) {
  const mission = useMemo(() => carelinkMissions.find((item) => item.id === missionId || item.code === missionId) || carelinkMissions[0], [missionId])
  const agent = carelinkAgents.find((item) => item.id === mission.agentId) || carelinkAgents[0]
  const readiness = computeReadiness(agent, mission)
  const [localStatus, setLocalStatus] = useState(mission.status)
  const labels: Record<string, string> = {
    assigned: 'Assignée',
    agent_notified: 'À confirmer',
    agent_accepted: 'Acceptée',
    confirmed_by_dispatch: 'Confirmée',
    en_route: 'En route',
    arrival_confirmed: 'Arrivée confirmée',
    mission_started: 'Mission démarrée',
    in_progress: 'En cours',
    completion_requested: 'Clôture demandée',
    final_report_submitted: 'Rapport soumis',
    incident_review: 'Revue d’incident',
    cancelled: 'Annulée',
  }
  return <CareLinkMobileShell><section className="space-y-5 px-5 py-6"><header className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex items-start justify-between"><div><p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600">{mission.code}</p><h1 className="mt-2 text-2xl font-black text-slate-950">{mission.serviceType}</h1><p className="mt-2 text-sm font-semibold text-slate-500">{mission.clientLabel} · {mission.zone}, {mission.city}</p></div><RiskBadge risk={mission.riskLevel} /></div><div className="mt-5 rounded-3xl bg-blue-50 p-4"><p className="text-xs font-black uppercase text-blue-600">Prochaine action</p><p className="mt-1 text-lg font-black text-blue-950">{nextBestAgentAction(localStatus)}</p></div><div className="mt-4 flex flex-wrap gap-2"><ReadinessBadge status={readiness.status} score={readiness.score} /><StatusPill tone="slate">{labels[localStatus] || localStatus}</StatusPill></div></header><section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-black text-slate-950">Instructions client et sécurité</h2><div className="mt-4 space-y-3">{mission.instructions.map((instruction)=><div key={instruction} className="rounded-3xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">{instruction}</div>)}</div></section><section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-black text-slate-950">Checklist intelligente</h2><div className="mt-4 space-y-3">{mission.checklist.map((item)=><label key={item.id} className="flex items-center gap-3 rounded-3xl bg-slate-50 p-4"><input type="checkbox" defaultChecked={item.completed} className="h-5 w-5 accent-blue-600" /><span className="text-sm font-bold text-slate-700">{item.title}</span>{item.required && <span className="ml-auto text-[10px] font-black uppercase text-rose-500">Requis</span>}</label>)}</div></section><LifecycleTimeline mission={{...mission,status:localStatus}} /><section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"><h2 className="text-lg font-black text-slate-950">Actions terrain</h2><div className="mt-4 grid grid-cols-2 gap-3">{[
['en_route','En route'],['arrival_confirmed','Arrivée confirmée'],['mission_started','Démarrer'],['completion_requested','Terminer'],['incident_review','Incident'],['final_report_submitted','Rapport']
].map(([status,label])=><button key={status} onClick={()=>setLocalStatus(status as typeof localStatus)} className="rounded-3xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-200">{label}</button>)}</div></section></section></CareLinkMobileShell>
}
