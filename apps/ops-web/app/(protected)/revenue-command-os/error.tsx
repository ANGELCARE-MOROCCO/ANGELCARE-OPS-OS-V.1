'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function RevenueCommandOsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-[calc(100vh-86px)] place-items-center bg-[#f4f7fb] p-6">
      <div className="w-full max-w-xl rounded-[30px] border border-rose-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-700"><AlertTriangle size={25} /></span>
        <h2 className="mt-5 text-2xl font-black text-slate-950">Revenue Command OS indisponible</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">{error.message || 'Une erreur de fondation empêche le chargement du cockpit.'}</p>
        <button onClick={reset} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"><RefreshCw size={17} /> Relancer le cockpit</button>
      </div>
    </div>
  )
}
