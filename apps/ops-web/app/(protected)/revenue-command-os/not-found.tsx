import Link from 'next/link'
import { ArrowLeft, BrainCircuit, Command, GitBranch, Radar, Route, SearchX, Target } from 'lucide-react'

const destinations = [
  [Target, 'Objectifs', '/revenue-command-os/revenue-objectives'],
  [Radar, 'Signaux', '/revenue-command-os/signals'],
  [BrainCircuit, 'Strategy Brain', '/revenue-command-os/strategy-engine'],
  [Command, 'Commandes 3000', '/revenue-command-os/command-kernel'],
  [GitBranch, 'Mission Compiler', '/revenue-command-os/mission-compiler'],
  [Route, 'Execution Autopilot', '/revenue-command-os/execution-autopilot'],
] as const

export default function RevenueCommandOsNotFound() {
  return (
    <div className="min-h-[calc(100vh-86px)] bg-[#f4f7fb] p-4 sm:p-6">
      <section className="relative mx-auto min-h-[720px] max-w-[1560px] overflow-hidden rounded-[52px] border border-slate-200 bg-white p-8 shadow-[0_38px_120px_rgba(15,23,42,.11)] sm:p-12">
        <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_center,rgba(37,99,235,.10),transparent_62%)]" />
        <div className="relative grid gap-12 lg:grid-cols-[.78fr_1.22fr] lg:items-center">
          <div><span className="grid h-16 w-16 place-items-center rounded-[24px] bg-slate-950 text-white shadow-xl"><SearchX size={28} /></span><p className="mt-8 text-[10px] font-black uppercase tracking-[.22em] text-blue-700">Route constellation</p><h1 className="mt-3 text-5xl font-black tracking-[-.065em] text-slate-950">Cette destination n’existe pas dans le registre autorisé.</h1><p className="mt-5 text-sm font-semibold leading-7 text-slate-500">La route demandée est absente, invalide ou non publiée. Revenez au centre de commandement ou entrez par une destination opérationnelle connue.</p><Link href="/revenue-command-os" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-black text-white shadow-xl"><ArrowLeft size={17} />Revenue Command Center</Link></div>
          <div className="relative min-h-[520px]">
            <div className="absolute left-1/2 top-1/2 grid h-40 w-40 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-slate-950 to-blue-950 text-center text-white shadow-[0_32px_90px_rgba(30,64,175,.25)]"><div><Command className="mx-auto text-blue-200" /><p className="mt-3 text-xs font-black">Revenue OS</p></div></div>
            {destinations.map(([Icon, label, href], index) => { const angle = index / destinations.length * Math.PI * 2 - Math.PI / 2; const x = 50 + Math.cos(angle) * 39; const y = 50 + Math.sin(angle) * 39; return <Link key={href} href={href} className="absolute grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[30px] border border-slate-200 bg-white text-center shadow-[0_20px_60px_rgba(15,23,42,.10)] transition hover:-translate-x-1/2 hover:-translate-y-[54%] hover:border-blue-300" style={{ left: `${x}%`, top: `${y}%` }}><div><Icon className="mx-auto text-blue-700" size={20} /><p className="mt-2 px-2 text-[9px] font-black text-slate-700">{label}</p></div></Link> })}
          </div>
        </div>
      </section>
    </div>
  )
}
