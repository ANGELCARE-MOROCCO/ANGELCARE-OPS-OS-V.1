import { carelinkMissions } from '@/lib/carelink/seed'
import { CareLinkOpsShell } from './CareLinkOpsShell'
import { OpsPanel } from './OpsPrimitives'
import { StatusPill } from '@/components/carelink/shared/CareLinkPrimitives'

export function ReportsValidationCenter(){return <CareLinkOpsShell title="Reports validation center" subtitle="Validation rapports, corrections, heures terrain et finance handoff."><OpsPanel title="Rapports à traiter"><div className="space-y-3">{carelinkMissions.map(m=><div key={m.id} className="grid grid-cols-6 items-center gap-4 rounded-3xl bg-slate-50 p-4"><p className="font-black text-slate-950">{m.code}</p><p className="col-span-2 font-bold text-slate-600">{m.serviceType}</p><StatusPill tone="amber">Rapport attendu</StatusPill><StatusPill tone="blue">{m.durationHours}H</StatusPill><button className="rounded-full bg-blue-600 px-4 py-2 text-xs font-black text-white">Valider</button></div>)}</div></OpsPanel></CareLinkOpsShell>}
