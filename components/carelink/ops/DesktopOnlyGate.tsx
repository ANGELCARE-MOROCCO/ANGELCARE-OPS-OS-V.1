'use client'

import { useEffect, useState } from 'react'

export function DesktopOnlyGate({ children }: { children: React.ReactNode }) {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null)
  useEffect(() => { const check = () => setIsDesktop(window.innerWidth >= 980); check(); window.addEventListener('resize', check); return () => window.removeEventListener('resize', check) }, [])
  if (isDesktop === null) return null
  if (!isDesktop) return <main className="flex min-h-dvh items-center justify-center bg-white p-6"><div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl"><h1 className="text-2xl font-black text-slate-950">CareLink Ops est desktop uniquement</h1><p className="mt-3 text-sm leading-6 text-slate-500">Utilisez un ordinateur pour gérer le dispatch, les agents, les incidents et les validations.</p></div></main>
  return <>{children}</>
}
