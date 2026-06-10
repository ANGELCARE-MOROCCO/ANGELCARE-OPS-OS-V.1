'use client'

import { useEffect, useState } from 'react'

export function MobileOnlyGate({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  const allowPreview = process.env.NEXT_PUBLIC_CARELINK_DESKTOP_PREVIEW === 'true'

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 820)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (isMobile === null) return <main className="min-h-dvh bg-white" />
  if (!isMobile && !allowPreview) {
    return <main className="flex min-h-screen items-center justify-center bg-white p-8 text-slate-950"><div className="max-w-xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)]"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 text-xl font-black text-white">AC</div><p className="mt-6 text-xs font-black uppercase tracking-[0.4em] text-blue-600">AngelCare CareLink</p><h1 className="mt-4 text-3xl font-black text-slate-950">Portail mobile uniquement</h1><p className="mt-4 text-sm leading-7 text-slate-600">CareLink est réservé aux agents terrain sur téléphone. Pour prévisualiser depuis desktop en développement, ajoute NEXT_PUBLIC_CARELINK_DESKTOP_PREVIEW=true dans .env.local.</p></div></main>
  }
  return <>{children}</>
}
