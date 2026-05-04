"use client"

import { useMemo, useState } from "react"
import {
  experiments,
  stageLabel,
  type ExperimentRisk,
  type ExperimentStage,
} from "@/lib/market-os/growth-experiment-lab"

function badgeClass(value: string) {
  if (value === "critical" || value === "high" || value === "lost") return "border-red-200 bg-red-50 text-red-700"
  if (value === "medium" || value === "live" || value === "analysis" || value === "iteration") return "border-amber-200 bg-amber-50 text-amber-700"
  if (value === "low" || value === "won") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

function Bar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-slate-950" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}
import MarketActionButton from "@/components/market-os/market-action-button"

export default function GrowthExperimentLab() {
  const [query, setQuery] = useState("")
  const [stage, setStage] = useState<ExperimentStage | "all">("all")
  const [risk, setRisk] = useState<ExperimentRisk | "all">("all")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()

    return experiments.filter((exp) => {
      const queryMatch =
        !q ||
        exp.title.toLowerCase().includes(q) ||
        exp.linkedCampaign.toLowerCase().includes(q) ||
        exp.owner.toLowerCase().includes(q) ||
        exp.primaryKpi.toLowerCase().includes(q)

      return queryMatch && (stage === "all" || exp.stage === stage) && (risk === "all" || exp.risk === risk)
    })
  }, [query, stage, risk])

  const liveCount = experiments.filter((e) => e.stage === "live").length
  const avgConfidence = Math.round(experiments.reduce((sum, e) => sum + e.confidence, 0) / experiments.length)
  const winning = experiments.filter((e) => e.currentLift >= e.targetLift && e.confidence >= 80).length
  const highRisk = experiments.filter((e) => e.risk === "high" || e.risk === "critical").length

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
            Market-OS · Pack 19
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Growth Experiment & A/B Testing Engine
          </h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This layer makes marketing scientific: hypotheses, variants, KPI targets,
            confidence, lift, decision rules and scale/stop/iterate actions.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Live Tests</p>
              <p className="mt-2 text-3xl font-black">{liveCount}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Avg Confidence</p>
              <p className="mt-2 text-3xl font-black">{avgConfidence}%</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">Winning Tests</p>
              <p className="mt-2 text-3xl font-black">{winning}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="text-xs uppercase text-slate-300">High Risk</p>
              <p className="mt-2 text-3xl font-black">{highRisk}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search experiment, campaign, owner, KPI..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <select value={stage} onChange={(e) => setStage(e.target.value as ExperimentStage | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All stages</option>
              <option value="hypothesis">Hypothesis</option>
              <option value="designed">Designed</option>
              <option value="live">Live</option>
              <option value="analysis">Analysis</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="iteration">Iteration</option>
            </select>

            <select value={risk} onChange={(e) => setRisk(e.target.value as ExperimentRisk | "all")} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
              <option value="all">All risks</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5">
          {filtered.map((exp) => (
            <article key={exp.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(exp.stage)}`}>
                      Stage: {stageLabel(exp.stage)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(exp.risk)}`}>
                      Risk: {exp.risk}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                      Sample: {exp.sampleSize}
                    </span>
                  </div>

                  <h2 className="text-xl font-black">{exp.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Campaign: {exp.linkedCampaign} · Owner: {exp.owner}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-right">
                  <p className="text-xs font-bold uppercase text-slate-500">Current Lift</p>
                  <p className="mt-1 font-black">{exp.currentLift}%</p>
                  <p className="text-xs text-slate-500">Target: {exp.targetLift}%</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold">Confidence</span>
                    <span>{exp.confidence}%</span>
                  </div>
                  <Bar value={exp.confidence} />
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Primary KPI</p>
                  <p className="mt-2 text-sm text-slate-700">{exp.primaryKpi}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Decision</p>
                  <p className="mt-2 text-sm text-slate-700">{exp.decision}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Hypothesis</p>
                  <p className="mt-2 text-sm text-slate-700">{exp.hypothesis}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Variant A</p>
                  <p className="mt-2 text-sm text-slate-700">{exp.variantA}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Variant B</p>
                  <p className="mt-2 text-sm text-slate-700">{exp.variantB}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Next Action</p>
                <p className="mt-2 text-sm text-slate-700">{exp.nextAction}</p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <MarketActionButton moduleKey="experiments" engine="data" actionKey="create_experiment_task" actionLabel="Create Experiment Task" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Create Experiment Task</MarketActionButton>
                <MarketActionButton moduleKey="experiments" engine="data" actionKey="mark_live" actionLabel="Mark Live" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Mark Live</MarketActionButton>
                <MarketActionButton moduleKey="experiments" engine="data" actionKey="log_result" actionLabel="Log Result" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Log Result</MarketActionButton>
                <MarketActionButton moduleKey="experiments" engine="data" actionKey="convert_to_playbook" actionLabel="Convert to Playbook" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold">Convert to Playbook</MarketActionButton>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
