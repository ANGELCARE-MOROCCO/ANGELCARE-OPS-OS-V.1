'use client'

import { useState } from 'react'
import { CareLinkMobileShell } from './CareLinkMobileShell'
import { carelinkMissions } from '@/lib/carelink/seed'
import { MissionCard } from '@/components/carelink/shared/CareLinkPrimitives'

const filters = ['Toutes', 'Aujourd’hui', 'À accepter', 'En cours', 'Rapport']

export function CareLinkMissions() {
  const [filter, setFilter] = useState(filters[0])
  return <CareLinkMobileShell><section className="px-5 py-6"><div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-600">Dispatch queue</p><h1 className="mt-2 text-3xl font-black text-slate-950">Missions terrain</h1><p className="mt-2 text-sm leading-6 text-slate-500">File opérationnelle des missions assignées, acceptées, en cours et à clôturer.</p></div><div className="mt-5 flex gap-2 overflow-x-auto pb-2">{filters.map((item)=><button key={item} onClick={()=>setFilter(item)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${filter===item?'bg-blue-600 text-white':'bg-white text-slate-600 ring-1 ring-slate-200'}`}>{item}</button>)}</div><div className="mt-5 space-y-4">{carelinkMissions.map((mission)=><MissionCard key={mission.id} mission={mission} href={`/carelink/missions/${mission.id}`} />)}</div></section></CareLinkMobileShell>
}
