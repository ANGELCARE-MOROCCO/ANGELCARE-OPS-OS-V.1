'use client'

import { useEffect, useState } from 'react'

export function CareLinkMobileGate({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'loading' | 'mobile' | 'desktop'>('loading')

  useEffect(() => {
    const check = () => {
      const smallViewport = window.innerWidth <= 900
      const touchReady = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      setMode(smallViewport || touchReady ? 'mobile' : 'desktop')
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (mode === 'loading') {
    return <main className="min-h-screen bg-[#07111f]" />
  }

  if (mode === 'desktop') {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1d4ed8_0%,#07111f_42%,#020617_100%)] px-8 py-10 text-white">
        <section className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
          <div className="rounded-[2.5rem] border border-white/15 bg-white/10 p-10 text-center shadow-2xl backdrop-blur">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-300 text-2xl font-black text-slate-950">AC</div>
            <p className="mt-8 text-xs font-black uppercase tracking-[0.45em] text-cyan-200">AngelCare CareLink</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight">PORTAIL MOBILE UNIQUEMENT</h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-200">
              Ce portail est réservé aux caregivers, childcare specialists et agents terrain AngelCare. Il doit être utilisé depuis un téléphone ou une tablette pour sécuriser la présence, le statut mission, les checklists et les comptes rendus terrain.
            </p>
            <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-5 text-left text-sm text-slate-200">
              <p className="font-bold text-white">Lien mobile direct :</p>
              <p className="mt-2 font-mono text-cyan-200">http://localhost:3000/carelink</p>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return <>{children}</>
}
