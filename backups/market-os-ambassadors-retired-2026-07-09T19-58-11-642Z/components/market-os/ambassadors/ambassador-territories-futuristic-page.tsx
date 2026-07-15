"use client"

import Link from "next/link"
import { ArrowLeft, BarChart3, Building2, MapPin, Plus, Route, ShieldCheck, Sparkles, Target, Users } from "lucide-react"

const territories = [
  { city: "Casablanca", ambassadors: 42, leads: 318, conversion: "18%", priority: "Core growth" },
  { city: "Rabat", ambassadors: 28, leads: 224, conversion: "21%", priority: "Institutional" },
  { city: "Marrakech", ambassadors: 19, leads: 146, conversion: "15%", priority: "Expansion" },
  { city: "Tangier", ambassadors: 14, leads: 103, conversion: "13%", priority: "Pipeline" },
  { city: "Agadir", ambassadors: 11, leads: 87, conversion: "12%", priority: "Activation" },
]

function MetricCard({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm shadow-slate-200/70">
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
          <p className="mt-1 text-xs font-semibold text-emerald-600">{hint}</p>
        </div>
      </div>
    </div>
  )
}

export default function AmbassadorTerritoriesFuturisticPage() {
  return (
    <main data-market-os-root className="min-h-screen bg-[#f7f8fc] p-6 text-slate-900">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[34px] border border-slate-200 bg-white/95 p-6 shadow-sm">
          <div>
            <Link href="/market-os/ambassadors" className="inline-flex items-center gap-2 text-sm font-bold text-violet-600">
              <ArrowLeft className="h-4 w-4" /> Back to Ambassadors
            </Link>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Ambassador Territories</h1>
            <p className="mt-1 max-w-3xl text-sm font-medium text-slate-9500">
              Territory command center for Morocco ambassador coverage, city activation, lead density, and growth execution.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-violet-200">
            <Plus className="h-4 w-4" /> Create Territory
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={MapPin} label="Active Cities" value="12" hint="Morocco coverage" />
          <MetricCard icon={Users} label="Ambassadors" value="114" hint="Live network" />
          <MetricCard icon={Target} label="Monthly Leads" value="878" hint="Territory pipeline" />
          <MetricCard icon={ShieldCheck} label="Coverage Health" value="86%" hint="Operationally stable" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
          <div className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-950">Morocco Territory Map</h2>
                <p className="text-sm font-medium text-slate-9500">Coverage intensity by strategic city cluster.</p>
              </div>
              <Sparkles className="h-5 w-5 text-violet-500" />
            </div>
            <div className="mt-6 grid min-h-[430px] place-items-center rounded-[30px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-8">
              <div className="relative h-[360px] w-[520px] max-w-full">
                <div className="absolute left-[42%] top-[8%] h-[290px] w-[190px] rotate-[14deg] rounded-[42%_58%_48%_52%] border-2 border-violet-200 bg-violet-100/40 shadow-inner" />
                {territories.map((t, i) => (
                  <div
                    key={t.city}
                    className="absolute rounded-2xl border border-violet-200 bg-white/90 px-3 py-2 text-xs font-black text-violet-700 shadow-lg shadow-violet-100"
                    style={{ left: `${18 + i * 12}%`, top: `${18 + (i % 3) * 20}%` }}
                  >
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-slate-950">{t.ambassadors}</span>
                    {t.city}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-950">Execution Priorities</h2>
              <div className="mt-5 space-y-3">
                {["Increase Casablanca school partnerships", "Open Rabat institutional referral track", "Activate Marrakech event ambassadors", "Build Tangier parent community loops"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm font-bold text-slate-700">
                    <Route className="h-4 w-4 text-violet-600" /> {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-950">Territory Performance</h2>
              <div className="mt-5 space-y-4">
                {territories.slice(0, 4).map((t) => (
                  <div key={t.city}>
                    <div className="mb-2 flex justify-between text-sm font-bold text-slate-700"><span>{t.city}</span><span>{t.conversion}</span></div>
                    <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-violet-600" style={{ width: t.conversion }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">Territory Directory</h2>
              <p className="text-sm font-medium text-slate-9500">Operational coverage and growth signals.</p>
            </div>
            <BarChart3 className="h-5 w-5 text-violet-500" />
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                <tr><th className="p-4">City</th><th className="p-4">Ambassadors</th><th className="p-4">Leads</th><th className="p-4">Conversion</th><th className="p-4">Priority</th></tr>
              </thead>
              <tbody>
                {territories.map((t) => (
                  <tr key={t.city} className="border-t border-slate-100">
                    <td className="p-4 font-black text-slate-900"><Building2 className="mr-2 inline h-4 w-4 text-violet-500" />{t.city}</td>
                    <td className="p-4 font-bold text-slate-700">{t.ambassadors}</td>
                    <td className="p-4 font-bold text-slate-700">{t.leads}</td>
                    <td className="p-4 font-bold text-emerald-600">{t.conversion}</td>
                    <td className="p-4"><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">{t.priority}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}
