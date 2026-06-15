'use client'

import { useEffect, useState } from 'react'

export function CareLinkMobileGate({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'loading' | 'mobile' | 'desktop-preview' | 'desktop-blocked'>('loading')

  useEffect(() => {
    const check = () => {
      const allowDesktopPreview = process.env.NEXT_PUBLIC_CARELINK_DESKTOP_PREVIEW === 'true'
      const smallViewport = window.innerWidth <= 920
      const touchReady = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      if (smallViewport || touchReady) setMode('mobile')
      else setMode(allowDesktopPreview ? 'desktop-preview' : 'desktop-blocked')
    }

    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (mode === 'loading') {
    return <main className="min-h-dvh bg-white" />
  }

  if (mode === 'desktop-blocked') {
    return (
      <main className="min-h-dvh bg-[#f6fbff] px-6 py-10 text-slate-950">
        <section className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
          <div className="rounded-[2.25rem] border border-slate-200 bg-white p-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-sky-500 to-emerald-400 text-2xl font-black text-white shadow-xl shadow-sky-200">
              AC
            </div>
            <p className="mt-8 text-xs font-black uppercase tracking-[0.45em] text-sky-600">AngelCare CareLink</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">PORTAIL RÉSERVÉ AU MOBILE</h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-600">
              Ce portail est réservé aux aidants, spécialistes enfance et agents terrain AngelCare. Il doit être utilisé depuis un téléphone ou une tablette pour sécuriser la présence, le statut mission, les checklists et les comptes rendus terrain.
            </p>
            <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left text-sm text-slate-700">
              <p className="font-bold text-slate-950">Lien mobile direct :</p>
              <p className="mt-2 break-all font-mono text-sky-700">http://localhost:3000/carelink</p>
            </div>
            <p className="mt-5 text-xs leading-5 text-slate-500">
              Pour prévisualiser sur desktop en développement, ajoutez `NEXT_PUBLIC_CARELINK_DESKTOP_PREVIEW=true` dans `.env.local`, puis redémarrez `npm run dev`.
            </p>
          </div>
        </section>
      </main>
    )
  }

  return <>{children}</>
}
