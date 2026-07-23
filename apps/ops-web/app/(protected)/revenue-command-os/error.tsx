'use client'

import { AlertTriangle, ArrowRight, Fingerprint, RefreshCw, ShieldAlert } from 'lucide-react'
import { publicRevenueOsClientMessage } from '@/lib/revenue-command-os/client-http'

export default function RevenueCommandOsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const trace = error.digest || 'trace indisponible'
  const publicMessage = publicRevenueOsClientMessage(error.message)
  return (
    <div className="min-h-[calc(100vh-86px)] bg-[#f4f7fb] p-4 sm:p-6">
      <section className="mx-auto grid min-h-[720px] max-w-[1560px] overflow-hidden rounded-[52px] border border-rose-200 bg-white shadow-[0_40px_130px_rgba(15,23,42,.13)] lg:grid-cols-[.78fr_1.22fr]">
        <div className="relative overflow-hidden bg-gradient-to-br from-rose-950 via-red-950 to-slate-950 p-8 text-white sm:p-12">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full border border-rose-300/20" />
          <div className="absolute bottom-20 right-0 h-48 w-48 rounded-full border border-white/10" />
          <div className="relative flex h-full flex-col justify-between">
            <div><span className="grid h-16 w-16 place-items-center rounded-[24px] border border-rose-300/30 bg-rose-500/20"><ShieldAlert size={30} /></span><p className="mt-8 text-[10px] font-black uppercase tracking-[.24em] text-rose-200">Interruption contrôlée</p><h1 className="mt-3 text-5xl font-black tracking-[-.065em]">La chaîne de vérité a été interrompue.</h1><p className="mt-5 max-w-lg text-sm font-semibold leading-7 text-rose-100/80">Revenue Command OS refuse de présenter une donnée incertaine comme une vérité opérationnelle.</p></div>
            <div className="mt-12 rounded-[28px] border border-white/10 bg-white/[.06] p-5 backdrop-blur"><div className="flex items-center gap-3"><Fingerprint size={18} className="text-rose-200" /><div><p className="text-[8px] font-black uppercase tracking-[.14em] text-rose-200">Référence de diagnostic</p><p className="mt-1 break-all text-[10px] font-bold text-white">{trace}</p></div></div></div>
          </div>
        </div>
        <div className="grid content-center p-8 sm:p-12 lg:p-16">
          <div className="max-w-2xl"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-700"><AlertTriangle size={22} /></span><p className="text-[10px] font-black uppercase tracking-[.18em] text-rose-700">Source non exploitable</p></div><h2 className="mt-7 text-4xl font-black tracking-[-.05em] text-slate-950">Impossible de certifier cette expérience.</h2><p className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-sm font-semibold leading-7 text-slate-600">{publicMessage}</p><div className="mt-7 grid gap-3 sm:grid-cols-2"><button onClick={reset} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white shadow-xl"><RefreshCw size={17} />Relancer la résolution</button><a href="/revenue-command-os/audit" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-700">Ouvrir l’audit <ArrowRight size={16} /></a></div><p className="mt-5 text-[10px] leading-5 text-slate-400">Aucune donnée de secours ne remplace silencieusement la source défaillante.</p></div>
        </div>
      </section>
    </div>
  )
}
