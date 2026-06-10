import { carelinkAgents, carelinkMissions } from '@/lib/carelink/seed'
import { CareLinkOpsShell } from './CareLinkOpsShell'
import { OpsPanel } from './OpsPrimitives'
import { StatusPill } from '@/components/carelink/shared/CareLinkPrimitives'

const lanes=['Unassigned','Assigned','Accepted','En route','In progress','Report pending','Closed','At risk']
export function DispatchControlBoard(){return <CareLinkOpsShell title="Dispatch control board" subtitle="Assignation, réassignation, alertes, readiness et intervention temps réel."><div className="grid grid-cols-4 gap-4">{lanes.map((lane,index)=><OpsPanel key={lane} title={lane}><div className="space-y-3">{carelinkMissions.slice(0,index%3+1).map((m)=><div key={m.id+lane} className="rounded-3xl bg-slate-50 p-4"><p className="text-sm font-black text-slate-950">{m.code}</p><p className="mt-1 text-xs font-semibold text-slate-500">{m.serviceType}</p><div className="mt-3 flex gap-2"><StatusPill tone="blue">{m.zone}</StatusPill><StatusPill tone={m.readinessStatus==='ready'?'green':'amber'}>{m.readinessScore}%</StatusPill></div><select className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold"><option>Assigner agent</option>{carelinkAgents.map(a=><option key={a.id}>{a.fullName}</option>)}</select></div>)}</div></OpsPanel>)}</div></CareLinkOpsShell>}
