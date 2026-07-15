import { StatusPill } from '@/components/carelink/shared/CareLinkPrimitives'
import type { OpsKpi } from '@/lib/carelink/types'

export function KpiGrid({ kpis }: { kpis: OpsKpi[] }) { return <div className="grid grid-cols-5 gap-4">{kpis.map((kpi)=><div key={kpi.label} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-wide text-slate-400">{kpi.label}</p><p className="mt-3 text-4xl font-black text-slate-950">{kpi.value}</p><div className="mt-3"><StatusPill tone={kpi.tone}>{kpi.delta}</StatusPill></div></div>)}</div> }

export function OpsPanel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) { return <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black text-slate-950">{title}</h2>{action}</div>{children}</section> }
