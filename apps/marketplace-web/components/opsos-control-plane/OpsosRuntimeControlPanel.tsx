"use client"

import { useState } from "react"
import { useOpsosRuntimeConfig } from "@/hooks/useOpsosRuntimeConfig"
import type { OpsosRuntimeMutation } from "@/lib/opsos-control-plane/runtime-types"

export default function OpsosRuntimeControlPanel({ route = "global" }: { route?: string }) {
  const runtime = useOpsosRuntimeConfig({ route, pollMs: 0 })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function run(mutation: OpsosRuntimeMutation) {
    setBusy(true)
    setMessage(null)
    try {
      await runtime.mutate(mutation)
      setMessage("Runtime control saved and refreshed.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Runtime mutation failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.20em] text-emerald-700">Runtime Config Layer</p>
          <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">Live controls for {route}</h3>
          <p className="mt-1 text-sm font-bold text-slate-500">Persisted switches and limits that target pages can obey without redeploying.</p>
        </div>
        <button
          type="button"
          onClick={() => runtime.reload()}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 shadow-sm"
        >
          Refresh
        </button>
      </div>

      {message ? <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-blue-800">{message}</div> : null}

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => run({ kind: "safe_mode", key: `${route}.safeMode`, label: `Safe Mode for ${route}`, scope: route === "global" ? "global" : "route", target: route, enabled: !runtime.safeModeEnabled, risk: "high", rules: { disableAnimations: true, disableLivePolling: true, lazyLoadModals: true, disablePrintPreview: true, limitRows: 40, limitCards: 24, compactMode: true }, reason: "Manual safe mode toggle from OPSOS Runtime Control Plane" })}
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-left text-sm font-black text-amber-800 shadow-sm disabled:opacity-60"
        >
          {runtime.safeModeEnabled ? "Disable Safe Mode" : "Enable Safe Mode"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => run({ kind: "control", key: `${route}.limitRows`, label: `Row limit for ${route}`, scope: route === "global" ? "global" : "route", target: route, enabled: true, value: 40, risk: "medium", reason: "Limit heavy row rendering" })}
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-left text-sm font-black text-emerald-800 shadow-sm disabled:opacity-60"
        >
          Limit Rows to 40
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => run({ kind: "feature_flag", key: `${route}.livePolling`, label: `Live polling for ${route}`, scope: route === "global" ? "global" : "route", target: route, enabled: false, rollout: 0, risk: "medium", reason: "Disable live polling from runtime control" })}
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-left text-sm font-black text-rose-800 shadow-sm disabled:opacity-60"
        >
          Disable Live Polling
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Safe mode</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{runtime.safeModeEnabled ? "Active" : "Off"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Controls</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{runtime.snapshot?.controls.length || 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Source</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{runtime.snapshot?.source || "loading"}</p>
        </div>
      </div>
    </section>
  )
}
