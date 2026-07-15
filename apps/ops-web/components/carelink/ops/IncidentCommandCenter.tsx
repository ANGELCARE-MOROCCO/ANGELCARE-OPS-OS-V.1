import { carelinkMissions } from '@/lib/carelink/seed'
import { CareLinkOpsShell } from './CareLinkOpsShell'
import { OpsPanel } from './OpsPrimitives'
import { StatusPill } from '@/components/carelink/shared/CareLinkPrimitives'

export function IncidentCommandCenter(){const incidents=carelinkMissions.filter(m=>m.riskLevel==='high'||m.priority==='urgent'); return <CareLinkOpsShell title="Incident command center" subtitle="Tri, intervention, résolution et audit des incidents terrain."><OpsPanel title="Incidents et missions à vigilance"><div className="grid grid-cols-3 gap-4">{incidents.map(m=><article key={m.id} className="rounded-3xl bg-rose-50 p-5 ring-1 ring-rose-100"><StatusPill tone="red">{m.riskLevel}</StatusPill><h2 className="mt-4 text-lg font-black text-rose-950">{m.code}</h2><p className="mt-2 text-sm font-semibold text-rose-700">{m.serviceType} · {m.zone}</p><div className="mt-5 flex gap-2"><button className="rounded-full bg-rose-600 px-4 py-2 text-xs font-black text-white">Escalader</button><button className="rounded-full bg-white px-4 py-2 text-xs font-black text-rose-700">Résoudre</button></div></article>)}</div></OpsPanel></CareLinkOpsShell>}
