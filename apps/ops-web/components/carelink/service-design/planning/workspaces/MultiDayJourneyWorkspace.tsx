'use client'

import Link from 'next/link'
import { FileText, Milestone, Sparkles } from 'lucide-react'
import { MissionWorkbench } from '../../product-experience/MissionWorkbench'

export function MultiDayJourneyWorkspace({ scenarioId }: { scenarioId?: string }) {
  if (!scenarioId) return <div className="rounded-[30px] border border-dashed border-slate-300 bg-white p-12 text-center"><Milestone className="mx-auto text-violet-500" size={34} /><h1 className="mt-4 text-2xl font-black text-slate-950">Aucun programme sélectionné</h1><p className="mt-2 text-sm font-semibold text-slate-500">Générez un scénario multi-missions puis ouvrez-le ici pour éditer chaque journée.</p><Link href="/carelink-ops/service-design/factory?mode=multi_mission" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-xs font-black text-white"><Sparkles size={15}/>Composer un programme</Link></div>

  return <div className="space-y-6">
    <section className="relative overflow-hidden rounded-[32px] bg-[#07142b] p-6 text-white shadow-[0_26px_70px_rgba(15,23,42,.24)] sm:p-8"><div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-[42px] border-violet-400/10" /><div className="relative flex flex-wrap items-start justify-between gap-5"><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-violet-300">Multi-Day Journey Theatre</p><h1 className="mt-2 text-3xl font-black tracking-[-.045em]">Programme multi-missions éditable</h1><p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-300">Le scénario généré devient un vrai workbench: journées, blocs, durées, activités locales, duplication, suppression et autosave.</p></div><Link href={`/carelink-ops/service-design/documents?sourceType=plan&sourceId=${encodeURIComponent(scenarioId)}`} className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-black"><FileText size={15}/>A4 & PDF</Link></div></section>
    <MissionWorkbench scenarioId={scenarioId} />
  </div>
}
