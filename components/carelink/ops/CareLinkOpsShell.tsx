'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CARELINK_OPS_NAV } from '@/lib/carelink/constants'
import { DesktopOnlyGate } from './DesktopOnlyGate'

export function CareLinkOpsShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const pathname = usePathname()
  return <DesktopOnlyGate><main className="min-h-screen bg-slate-50"><aside className="fixed inset-y-0 left-0 w-72 border-r border-slate-200 bg-white p-5"><div className="rounded-[2rem] bg-blue-600 p-5 text-white"><p className="text-xs font-black uppercase tracking-[0.3em] text-blue-100">AngelCare</p><h1 className="mt-2 text-2xl font-black">CareLink Ops</h1><p className="mt-2 text-xs font-semibold text-blue-100">Desktop field operations control.</p></div><nav className="mt-6 space-y-1">{CARELINK_OPS_NAV.map((item)=>{const active=pathname===item.href; return <Link key={item.href} href={item.href} className={`block rounded-2xl px-4 py-3 text-sm font-black ${active?'bg-blue-50 text-blue-700':'text-slate-600 hover:bg-slate-100'}`}>{item.label}</Link>})}</nav></aside><section className="pl-72"><header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-8 py-5 backdrop-blur"><p className="text-xs font-black uppercase tracking-[0.35em] text-blue-600">CareLink Field Mission OS</p><h1 className="mt-2 text-3xl font-black text-slate-950">{title}</h1><p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p></header><div className="p-8">{children}</div></section></main></DesktopOnlyGate>
}
