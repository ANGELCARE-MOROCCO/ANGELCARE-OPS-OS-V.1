'use client'

import { DesktopOnlyGate } from './DesktopOnlyGate'

export function CareLinkOpsShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <DesktopOnlyGate>
      <section className="min-h-screen bg-[#f7f9fc] text-slate-950">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-8 py-5 backdrop-blur">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-600">CareLink Ops Enterprise</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">{title}</h1>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{subtitle}</p>
        </header>

        <div className="p-8">{children}</div>
      </section>
    </DesktopOnlyGate>
  )
}
