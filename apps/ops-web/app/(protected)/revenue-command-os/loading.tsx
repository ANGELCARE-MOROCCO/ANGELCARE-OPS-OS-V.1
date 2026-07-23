import { BrainCircuit, CircleDot, Command, GitBranch, Radar, Rocket, Target } from 'lucide-react'
import sovereigntyStyles from './_components/visual-sovereignty/Sovereignty.module.css'

const nodes = [
  [Target, 'Objectif'], [Radar, 'Signaux'], [BrainCircuit, 'Stratégie'], [Command, 'Commandes'],
  [GitBranch, 'Compilation'], [Rocket, 'Exécution'],
] as const

export default function RevenueCommandOsLoading() {
  return (
    <div className="min-h-[calc(100vh-86px)] bg-[#f4f7fb] p-4 sm:p-6">
      <section className="relative mx-auto min-h-[720px] max-w-[1720px] overflow-hidden rounded-[52px] border border-slate-200 bg-white shadow-[0_36px_110px_rgba(15,23,42,.10)]">
        <div className={`absolute inset-0 opacity-60 ${sovereigntyStyles.gridFine}`} />
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-100" />
        <div className="absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-100" />
        <div className="relative grid min-h-[720px] place-items-center p-8">
          <div className="relative h-[520px] w-full max-w-[920px]">
            <div className="absolute left-1/2 top-1/2 grid h-52 w-52 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-slate-950 via-blue-950 to-violet-950 text-center text-white shadow-[0_35px_110px_rgba(30,64,175,.30)]">
              <div><CircleDot className="mx-auto animate-pulse text-blue-300" size={28} /><p className="mt-4 text-xl font-black">Revenue Constellation</p><p className="mt-1 text-[9px] font-black uppercase tracking-[.18em] text-blue-200">Resolution des relations</p></div>
            </div>
            {nodes.map(([Icon, label], index) => {
              const angle = index / nodes.length * Math.PI * 2 - Math.PI / 2
              const x = 50 + Math.cos(angle) * 40
              const y = 50 + Math.sin(angle) * 40
              return <div key={label} className="absolute -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${index * 120}ms` }}><div className="grid h-24 w-24 place-items-center rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,.10)]"><div className="text-center"><Icon className="mx-auto text-blue-700" size={21} /><p className="mt-2 text-[9px] font-black uppercase tracking-[.12em] text-slate-500">{label}</p></div></div></div>
            })}
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-slate-200 bg-white/90 px-5 py-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-500 backdrop-blur">Initialisation des sources, permissions et preuves</div>
      </section>
    </div>
  )
}
