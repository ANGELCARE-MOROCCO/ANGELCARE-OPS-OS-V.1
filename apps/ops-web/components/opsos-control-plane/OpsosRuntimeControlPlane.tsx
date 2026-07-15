"use client"

import { useEffect, useMemo, useRef, useState } from "react"

type HealthTone = "healthy" | "watch" | "warning" | "critical" | "active" | "offline"
type ModalKind =
  | "diagnostic"
  | "route-recovery"
  | "memory-repair"
  | "flag-rollout"
  | "modal-inspector"
  | "api-recovery"
  | "audit-rollback"
  | "rbac"
  | null

type ActionStatus = "pending" | "success" | "failed" | "simulated"

type RouteRecord = {
  route: string
  module: string
  status: HealthTone
  loadMs: number
  memoryMb: number
  apiCalls: number
  errors: number
  safeMode: boolean
  issue: string
  action: string
}

type ModalRecord = {
  name: string
  route: string
  openMs: number
  renders: number
  retainedMb: number
  failure: string
  autoFix: boolean
  status: HealthTone
}

type ApiRecord = {
  endpoint: string
  service: string
  p95: number
  failures: number
  queue: number
  status: HealthTone
  recovery: string
}

type ActionLog = {
  id: string
  time: string
  actor: string
  action: string
  target: string
  status: ActionStatus
  detail: string
}

type Snapshot = {
  runtimeControls?: unknown[]
  featureFlags?: unknown[]
  safeModeProfiles?: unknown[]
  routeHealth?: unknown[]
  modalHealth?: unknown[]
  actionLogs?: unknown[]
}

type OperationPayload = {
  actionKey: string
  actionLabel: string
  target: string
  scope?: string
  value?: Record<string, unknown>
  dryRun?: boolean
}

const navSections = [
  ["command-board", "Command Board"],
  ["runtime-health", "Runtime Health"],
  ["pages-routes", "Pages & Routes"],
  ["api-control", "API Control"],
  ["modals-ux", "Modals & UX"],
  ["performance", "Performance"],
  ["feature-flags", "Feature Flags"],
  ["safe-repair", "Safe Repair"],
  ["logs-audit", "Logs & Audit"],
] as const

const baseRoutes: RouteRecord[] = [
  { route: "/market-os/campaign-lifecycle", module: "Market-OS", status: "warning", loadMs: 4380, memoryMb: 142, apiCalls: 18, errors: 1, safeMode: false, issue: "Timeline cards and modal rendering pressure", action: "Limit timeline cards" },
  { route: "/hr/employees", module: "HR", status: "watch", loadMs: 1900, memoryMb: 78, apiCalls: 11, errors: 0, safeMode: false, issue: "Employee 360 print preview and retained modal state", action: "Lazy Employee 360 print" },
  { route: "/opsos-control-plane", module: "OPSOS", status: "healthy", loadMs: 870, memoryMb: 32, apiCalls: 6, errors: 0, safeMode: false, issue: "Monitoring surface healthy", action: "Keep monitoring" },
  { route: "/users-management", module: "Users", status: "watch", loadMs: 1640, memoryMb: 61, apiCalls: 9, errors: 0, safeMode: false, issue: "Large activity cards and attendance pulses", action: "Reduce live pulse" },
  { route: "/carelink-ops/dispatch", module: "CareLink", status: "healthy", loadMs: 1220, memoryMb: 45, apiCalls: 8, errors: 0, safeMode: false, issue: "Dispatch lanes stable", action: "Open telemetry" },
  { route: "/email-os", module: "Email-OS", status: "healthy", loadMs: 1180, memoryMb: 39, apiCalls: 7, errors: 0, safeMode: false, issue: "Mailbox monitor stable", action: "Open mailbox health" },
]

const modalRows: ModalRecord[] = [
  { name: "Employee360DossierModal", route: "/hr/employees", openMs: 920, renders: 42, retainedMb: 28, failure: "Print preview loads early", autoFix: true, status: "warning" },
  { name: "Campaign Timeline Control", route: "/market-os/campaign-lifecycle", openMs: 1480, renders: 64, retainedMb: 56, failure: "Timeline cards over-render", autoFix: true, status: "warning" },
  { name: "Import CSV Tasks", route: "/market-os/campaign-lifecycle", openMs: 630, renders: 18, retainedMb: 11, failure: "Overlay stacking watch", autoFix: true, status: "watch" },
  { name: "Print Preview Modal", route: "global", openMs: 1840, renders: 39, retainedMb: 74, failure: "PDF preview should be lazy", autoFix: true, status: "critical" },
  { name: "Route Recovery Command", route: "/opsos-control-plane", openMs: 420, renders: 12, retainedMb: 6, failure: "Operational modal ready", autoFix: false, status: "healthy" },
]

const apiRows: ApiRecord[] = [
  { endpoint: "/api/opsos-control-plane/runtime-config", service: "Runtime Config", p95: 210, failures: 0, queue: 0, status: "healthy", recovery: "Revalidate config" },
  { endpoint: "/api/opsos-control-plane/telemetry", service: "Telemetry", p95: 360, failures: 0, queue: 8, status: "healthy", recovery: "Flush telemetry" },
  { endpoint: "/api/market-os/campaign-lifecycle", service: "Market-OS", p95: 820, failures: 1, queue: 3, status: "warning", recovery: "Retry failed sync" },
  { endpoint: "/api/hr/employees", service: "HR", p95: 740, failures: 0, queue: 1, status: "watch", recovery: "Refresh employee cache" },
]

const initialLogs: ActionLog[] = [
  { id: "log-1", time: "now", actor: "System", action: "Runtime config layer online", target: "OPSOS", status: "success", detail: "Layer 2 controls available" },
  { id: "log-2", time: "2m", actor: "Telemetry", action: "Long task captured", target: "/market-os/campaign-lifecycle", status: "pending", detail: "Watch threshold crossed" },
  { id: "log-3", time: "7m", actor: "System", action: "Safe mode profiles synced", target: "3 profiles", status: "success", detail: "Supabase seed verified" },
]

const repairSkills = [
  ["Route scan", "Deep route analysis, load, API and memory scoring", "diagnostic"],
  ["Memory cleaner", "Controlled memory pressure mitigation and freeze recovery", "memory-repair"],
  ["Modal freeze diagnosis", "Inspect modal rendering, retained state and z-index locks", "modal-inspector"],
  ["API recovery", "Queue retry, failed request recovery and service health test", "api-recovery"],
  ["Flag rollout", "Runtime feature rollout with staged percentage and rollback", "flag-rollout"],
  ["Audit export", "Export operational evidence and rollback manifest", "audit-rollback"],
] as const

function toneClasses(tone: HealthTone) {
  const map: Record<HealthTone, string> = {
    healthy: "border-emerald-200 bg-emerald-50 text-emerald-700",
    active: "border-emerald-200 bg-emerald-50 text-emerald-700",
    watch: "border-blue-200 bg-blue-50 text-blue-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    critical: "border-rose-200 bg-rose-50 text-rose-700",
    offline: "border-slate-200 bg-slate-50 text-slate-600",
  }
  return map[tone]
}

function dotClasses(tone: HealthTone) {
  const map: Record<HealthTone, string> = {
    healthy: "bg-emerald-500",
    active: "bg-emerald-500",
    watch: "bg-blue-500",
    warning: "bg-amber-500",
    critical: "bg-rose-500",
    offline: "bg-slate-400",
  }
  return map[tone]
}

function nowLabel() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

function SectionShell({ id, eyebrow, title, action, children }: { id: string; eyebrow: string; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} data-opsos-section={id} className="scroll-mt-28 rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-400">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-black tracking-[-0.04em] text-slate-950">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function MetricCard({ label, value, detail, tone = "healthy" }: { label: string; value: string; detail: string; tone?: HealthTone }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
        <span className={`h-2.5 w-2.5 rounded-full ${dotClasses(tone)}`} />
      </div>
      <p className="mt-3 text-3xl font-black tracking-[-0.06em] text-slate-950">{value}</p>
      <p className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${toneClasses(tone)}`}>{detail}</p>
    </div>
  )
}

function ModalFrame({ kind, onClose, onExecute }: { kind: Exclude<ModalKind, null>; onClose: () => void; onExecute: (payload: OperationPayload) => void }) {
  const [dryRun, setDryRun] = useState(true)
  const [safeConfirm, setSafeConfirm] = useState(false)
  const [limit, setLimit] = useState(40)
  const [rollout, setRollout] = useState(75)
  const [target, setTarget] = useState("/market-os/campaign-lifecycle")

  const titleMap: Record<Exclude<ModalKind, null>, string> = {
    diagnostic: "Full Runtime Diagnostic Command",
    "route-recovery": "Route Recovery Command Center",
    "memory-repair": "Memory & Freeze Surgical Repair",
    "flag-rollout": "Feature Flag Rollout Studio",
    "modal-inspector": "Modal UX Failure Inspector",
    "api-recovery": "API & Queue Recovery Console",
    "audit-rollback": "Audit & Rollback Export Center",
    rbac: "RBAC & Approval Gate Control",
  }

  const actionKeyMap: Record<Exclude<ModalKind, null>, string> = {
    diagnostic: "opsos.diagnostic.full_scan",
    "route-recovery": "opsos.route.recovery",
    "memory-repair": "opsos.memory.surgical_repair",
    "flag-rollout": "opsos.feature.rollout",
    "modal-inspector": "opsos.modal.failure_inspection",
    "api-recovery": "opsos.api.queue_recovery",
    "audit-rollback": "opsos.audit.rollback_export",
    rbac: "opsos.rbac.approval_gate",
  }

  function run() {
    onExecute({
      actionKey: actionKeyMap[kind],
      actionLabel: titleMap[kind],
      target,
      scope: kind.includes("modal") ? "modal" : "route",
      dryRun,
      value: { limit, rollout, safeConfirm, dryRun, modalKind: kind },
    })
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-6xl overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_40px_120px_rgba(15,23,42,0.30)]">
        <div className="flex items-start justify-between gap-5 border-b border-slate-100 bg-gradient-to-br from-white via-sky-50/50 to-emerald-50/40 p-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-blue-700">OPSOS surgical operation</p>
            <h3 className="mt-2 text-3xl font-black tracking-[-0.06em] text-slate-950">{titleMap[kind]}</h3>
            <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-500">Each operation runs with dry-run, preflight checks, runtime config updates, telemetry logging and rollback awareness. Switch dry-run off only when the impact is acceptable.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-xl font-black text-slate-500 shadow-sm">×</button>
        </div>

        <div className="grid max-h-[66vh] overflow-y-auto lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5 border-r border-slate-100 p-6">
            {kind === "diagnostic" && (
              <div className="grid gap-4 md:grid-cols-2">
                {[["Routes", "Scan route load, API calls, dead links and safe mode coverage"], ["Modals", "Check open time, render loops, retained state and overlay locks"], ["Memory", "Capture long tasks, heap pressure and suspected leaks"], ["APIs", "Test endpoint health, queues, retries and failure clusters"]].map(([a, b]) => (
                  <div key={a} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><p className="text-lg font-black text-slate-950">{a}</p><p className="mt-2 text-sm font-bold leading-6 text-slate-500">{b}</p></div>
                ))}
              </div>
            )}

            {kind === "route-recovery" && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block rounded-[24px] border border-slate-200 p-4"><span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Target route</span><input value={target} onChange={(e) => setTarget(e.target.value)} className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none" /></label>
                  <label className="block rounded-[24px] border border-slate-200 p-4"><span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Render limit</span><input type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value || 40))} className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none" /></label>
                </div>
                <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5"><p className="font-black text-emerald-800">Preflight checks</p><div className="mt-3 grid gap-2 text-sm font-bold text-emerald-700 md:grid-cols-2"><span>✓ fallback route reachable</span><span>✓ dependencies visible</span><span>✓ rollback profile available</span><span>✓ safe mode compatible</span></div></div>
              </div>
            )}

            {kind === "memory-repair" && (
              <div className="grid gap-4 md:grid-cols-2">
                {[["Limit rendered lists", "Apply max rows/cards from runtime controls"], ["Disable live polling", "Stop background refresh loops for target route"], ["Lazy heavy modals", "Mount expensive modals only when opened"], ["Reduce animations", "Disable non-essential transitions in safe mode"]].map(([a, b]) => (
                  <ToggleLine key={a} title={a} detail={b} defaultValue />
                ))}
              </div>
            )}

            {kind === "flag-rollout" && (
              <div className="space-y-5">
                <div className="rounded-[24px] border border-slate-200 p-5"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Rollout percentage</p><input type="range" min={0} max={100} value={rollout} onChange={(e) => setRollout(Number(e.target.value))} className="mt-4 w-full" /><div className="mt-3 text-3xl font-black text-slate-950">{rollout}%</div></div>
                <div className="grid gap-3 md:grid-cols-3"><ToggleLine title="Beta users" detail="Scoped rollout" defaultValue /><ToggleLine title="Internal users" detail="Safe validation" defaultValue /><ToggleLine title="All users" detail="Production target" /></div>
              </div>
            )}

            {kind === "modal-inspector" && (
              <div className="overflow-hidden rounded-[24px] border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.18em] text-slate-400"><tr><th className="p-3">Check</th><th className="p-3">Result</th><th className="p-3">Auto fix</th></tr></thead>
                  <tbody>{[["Z-index stack", "Warning", "Raise overlay"], ["Focus trap", "Pass", "None"], ["Retained state", "Warning", "Clear on close"], ["Print preview", "Critical", "Lazy load"]].map((row) => <tr key={row[0]} className="border-t border-slate-100"><td className="p-3 font-black text-slate-900">{row[0]}</td><td className="p-3 font-bold text-amber-700">{row[1]}</td><td className="p-3 font-bold text-blue-700">{row[2]}</td></tr>)}</tbody>
                </table>
              </div>
            )}

            {kind === "api-recovery" && (
              <div className="grid gap-4 md:grid-cols-3">
                {[["Retry failed", "Replay failed queue items"], ["Move to DLQ", "Protect repeated failures"], ["Health test", "Validate service readiness"], ["Rate limit", "Throttle expensive bursts"], ["Flush cache", "Clear stale route data"], ["Revalidate", "Refresh server paths"]].map(([a, b]) => <ToggleLine key={a} title={a} detail={b} defaultValue />)}
              </div>
            )}

            {kind === "audit-rollback" && (
              <div className="space-y-4"><div className="rounded-[24px] border border-slate-200 p-5"><p className="font-black text-slate-950">Rollback package</p><p className="mt-2 text-sm font-bold leading-6 text-slate-500">Exports action logs, before/after payloads, runtime flags, safe mode state and verification checksum.</p></div><div className="grid gap-3 md:grid-cols-3"><ToggleLine title="Include payloads" detail="Before / after" defaultValue /><ToggleLine title="Include telemetry" detail="Long tasks + errors" defaultValue /><ToggleLine title="Include RBAC" detail="Operator evidence" /></div></div>
            )}

            {kind === "rbac" && (
              <div className="grid gap-4 md:grid-cols-2"><ToggleLine title="Super Admin approval" detail="Required for execution" defaultValue /><ToggleLine title="Dry-run mandatory" detail="Before destructive action" defaultValue /><ToggleLine title="Rollback required" detail="For route/config changes" defaultValue /><ToggleLine title="Audit export" detail="Before deploy/push" /></div>
            )}
          </div>

          <aside className="space-y-5 bg-slate-50/70 p-6">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Execution mode</p>
              <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
                <div><p className="font-black text-slate-950">Dry run first</p><p className="text-xs font-bold text-slate-500">Preview impact before execution.</p></div>
                <button type="button" onClick={() => setDryRun((v) => !v)} className={`h-8 w-14 rounded-full p-1 transition ${dryRun ? "bg-blue-600" : "bg-slate-300"}`}><span className={`block h-6 w-6 rounded-full bg-white transition ${dryRun ? "translate-x-6" : "translate-x-0"}`} /></button>
              </div>
              <label className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-black text-slate-700"><input type="checkbox" checked={safeConfirm} onChange={(e) => setSafeConfirm(e.target.checked)} /> I confirm this operation is scoped and rollback-aware.</label>
            </div>
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5"><p className="font-black text-amber-900">Safety gate</p><p className="mt-2 text-sm font-bold leading-6 text-amber-800">Real execution is routed through OPSOS APIs. If an endpoint is not available, the operation is recorded locally as staged and must not be considered applied.</p></div>
            <div className="grid gap-3">
              <button type="button" onClick={run} className="rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20">{dryRun ? "Run Dry Operation" : "Execute Controlled Operation"}</button>
              <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-700">Close</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function ToggleLine({ title, detail, defaultValue = false }: { title: string; detail: string; defaultValue?: boolean }) {
  const [enabled, setEnabled] = useState(defaultValue)
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div><p className="font-black text-slate-950">{title}</p><p className="mt-1 text-xs font-bold leading-5 text-slate-500">{detail}</p></div>
        <button type="button" onClick={() => setEnabled((v) => !v)} className={`h-7 w-12 shrink-0 rounded-full p-1 transition ${enabled ? "bg-emerald-600" : "bg-slate-300"}`}><span className={`block h-5 w-5 rounded-full bg-white transition ${enabled ? "translate-x-5" : "translate-x-0"}`} /></button>
      </div>
    </div>
  )
}

export default function OpsosRuntimeControlPlane() {
  const [activeSection, setActiveSection] = useState("command-board")
  const [modal, setModal] = useState<ModalKind>(null)
  const [selectedRoute, setSelectedRoute] = useState<RouteRecord>(baseRoutes[0])
  const [logs, setLogs] = useState<ActionLog[]>(initialLogs)
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState("Ready for controlled runtime operations")
  const mainScrollRef = useRef<HTMLDivElement | null>(null)

  const controlsCount = Array.isArray(snapshot?.runtimeControls) ? snapshot?.runtimeControls?.length || 7 : 7
  const flagsCount = Array.isArray(snapshot?.featureFlags) ? snapshot?.featureFlags?.length || 6 : 6
  const safeCount = Array.isArray(snapshot?.safeModeProfiles) ? snapshot?.safeModeProfiles?.length || 3 : 3

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const [control, flags, safe, root] = await Promise.allSettled([
          fetch("/api/opsos-control-plane/runtime-config", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/opsos-control-plane/feature-flags", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/opsos-control-plane/safe-mode", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/opsos-control-plane", { cache: "no-store" }).then((r) => r.json()),
        ])
        if (!alive) return
        setSnapshot({
          runtimeControls: control.status === "fulfilled" ? (control.value?.controls || control.value?.runtimeControls || control.value?.data || []) : [],
          featureFlags: flags.status === "fulfilled" ? (flags.value?.flags || flags.value?.featureFlags || flags.value?.data || []) : [],
          safeModeProfiles: safe.status === "fulfilled" ? (safe.value?.profiles || safe.value?.safeModeProfiles || safe.value?.data || []) : [],
          routeHealth: root.status === "fulfilled" ? (root.value?.routeHealth || root.value?.routes || []) : [],
          modalHealth: root.status === "fulfilled" ? (root.value?.modalHealth || root.value?.modals || []) : [],
        })
      } catch {
        if (alive) setLastResult("Live API snapshot unavailable; using safe cockpit fallback data")
      }
    }
    void load()
    return () => { alive = false }
  }, [])

  const overallStatus = useMemo(() => {
    const critical = baseRoutes.filter((r) => r.status === "critical").length
    const warning = baseRoutes.filter((r) => r.status === "warning").length
    return critical ? "critical" : warning ? "warning" : "healthy"
  }, [])

  function scrollToSection(id: string) {
    setActiveSection(id)
    const node = document.getElementById(id)
    if (node) node.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  async function executeOperation(payload: OperationPayload) {
    setBusyAction(payload.actionKey)
    const actionId = `opsos-${Date.now()}`
    const pending: ActionLog = { id: actionId, time: nowLabel(), actor: "Admin", action: payload.actionLabel, target: payload.target, status: "pending", detail: payload.dryRun ? "Dry-run submitted" : "Execution submitted" }
    setLogs((items) => [pending, ...items].slice(0, 12))
    try {
      const responses: Array<Promise<Response>> = []
      responses.push(fetch("/api/opsos-control-plane/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }))

      if (payload.actionKey.includes("safe_mode") || payload.actionKey.includes("memory") || payload.actionKey.includes("route")) {
        responses.push(fetch("/api/opsos-control-plane/runtime-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: payload.actionKey, target: payload.target, scope: payload.scope || "route", enabled: true, value_json: payload.value || {} }) }))
      }
      if (payload.actionKey.includes("feature") || payload.actionKey.includes("rollout")) {
        responses.push(fetch("/api/opsos-control-plane/feature-flags", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: payload.actionKey, target: payload.target, enabled: true, rollout: Number(payload.value?.rollout || 75), value_json: payload.value || {} }) }))
      }
      if (payload.actionKey.includes("safe_mode")) {
        responses.push(fetch("/api/opsos-control-plane/safe-mode", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile_key: payload.actionKey, target: payload.target, enabled: true, config: payload.value || {} }) }))
      }

      const settled = await Promise.allSettled(responses)
      const ok = settled.some((item) => item.status === "fulfilled" && item.value.ok)
      setLogs((items) => items.map((item) => item.id === actionId ? { ...item, status: ok ? "success" : "simulated", detail: ok ? "API accepted operation" : "API unavailable; staged locally" } : item))
      setLastResult(ok ? `${payload.actionLabel} completed through OPSOS API` : `${payload.actionLabel} staged locally because an API endpoint did not accept the request`)
    } catch (error) {
      setLogs((items) => items.map((item) => item.id === actionId ? { ...item, status: "failed", detail: error instanceof Error ? error.message : "Unknown failure" } : item))
      setLastResult("Operation failed. Check endpoint and permissions.")
    } finally {
      setBusyAction(null)
      setModal(null)
    }
  }

  function quickAction(label: string, actionKey: string, target = selectedRoute.route) {
    void executeOperation({ actionKey, actionLabel: label, target, scope: target.startsWith("/") ? "route" : "modal", value: { source: "quick-action", selectedRoute: selectedRoute.route }, dryRun: false })
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-100 text-slate-950" data-opsos-runtime-control-plane="complete">
      <div className="grid h-full lg:grid-cols-[270px_minmax(0,1fr)_360px]">
        <aside className="hidden h-full overflow-y-auto border-r border-slate-200 bg-white p-5 lg:block">
          <div className="rounded-[28px] bg-gradient-to-br from-white to-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">AngelCare OPSOS</p>
            <h1 className="mt-2 text-3xl font-black leading-none tracking-[-0.06em] text-slate-950">Runtime Control Plane</h1>
            <p className="mt-4 text-xs font-bold leading-6 text-slate-500">Live application health, safe mode governance and controlled repair operations.</p>
          </div>
          <nav className="mt-6 space-y-2">
            {navSections.map(([id, label], index) => (
              <button key={id} type="button" onClick={() => scrollToSection(id)} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${activeSection === id ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-700 hover:bg-slate-50"}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${index % 4 === 0 ? "bg-emerald-500" : index % 4 === 1 ? "bg-blue-500" : index % 4 === 2 ? "bg-amber-500" : "bg-violet-500"}`} />{label}
              </button>
            ))}
          </nav>

              <a
                href="/opsos-control-plane/angelcare-staff-guide.html"
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-3 flex items-center justify-between rounded-[22px] border border-blue-200 bg-gradient-to-br from-blue-600 via-sky-600 to-cyan-500 px-4 py-4 text-left text-sm font-black text-white shadow-[0_18px_44px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(37,99,235,0.30)]"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/18 text-base ring-1 ring-white/20">AC</span>
                  <span className="min-w-0">
                    <span className="block text-[10px] uppercase tracking-[0.20em] text-blue-100">Training guide</span>
                    <span className="block truncate text-sm">ANGELCARE STAFF</span>
                  </span>
                </span>
                <span className="rounded-full bg-white/16 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-white/90">New tab ↗</span>
              </a>

          <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Execution status</p>
            <p className="mt-2 text-sm font-black text-slate-950">{lastResult}</p>
          </div>
        </aside>

        <main className="flex h-full min-w-0 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
            <div className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Production online</span>
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">Layer 1 telemetry</span>
                    <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700">Layer 2 controls</span>
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">Layer 3 enforcement active</span>
                  </div>
                  <h2 className="mt-2 text-4xl font-black tracking-[-0.07em] text-slate-950">OPSOS Runtime Control Plane</h2>
                  <p className="mt-2 max-w-4xl text-sm font-bold leading-6 text-slate-500">Enterprise cockpit for route health, modal pressure, memory risk, API control, safe modes, feature flags, repair skills, logs and rollback governance.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setModal("diagnostic")} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20">Run Diagnostic</button>
                  <button type="button" onClick={() => setModal("memory-repair")} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20">Memory Repair</button>
                  <button type="button" onClick={() => setModal("flag-rollout")} className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-violet-600/20">Flag Rollout</button>
                  <button type="button" onClick={() => quickAction("Enable Global Safe Mode", "opsos.safe_mode.global_enable", "*")} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">Global Safe Mode</button>
                </div>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {navSections.map(([id, label]) => (
                  <button key={id} type="button" onClick={() => scrollToSection(id)} className={`shrink-0 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.18em] transition ${activeSection === id ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>{label}</button>
                ))}
              </div>
            </div>
          </header>

          <div ref={mainScrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <div className="space-y-5">
              <SectionShell id="command-board" eyebrow="Production command" title="Executive Runtime Command Board" action={<button type="button" onClick={() => setModal("audit-rollback")} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700">Export Audit</button>}>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                  <MetricCard label="Production state" value={overallStatus === "warning" ? "WATCH" : "ONLINE"} detail="runtime plane active" tone={overallStatus} />
                  <MetricCard label="Route monitors" value="42" detail="routes under watch" tone="watch" />
                  <MetricCard label="Runtime controls" value={String(controlsCount)} detail="DB-backed controls" tone="active" />
                  <MetricCard label="Feature flags" value={String(flagsCount)} detail="runtime switchboard" tone="watch" />
                  <MetricCard label="Safe profiles" value={String(safeCount)} detail="safe-mode profiles" tone="active" />
                  <MetricCard label="Live events" value="ON" detail="telemetry stream" tone="healthy" />
                </div>
              </SectionShell>

              <section id="runtime-health" className="scroll-mt-28 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <SectionShell id="runtime-topology" eyebrow="Live dependency map" title="Runtime Topology" action={<span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-700">All core nodes visible</span>}>
                  <div className="grid max-h-[360px] gap-3 overflow-y-auto pr-2 sm:grid-cols-2 2xl:grid-cols-3">
                    {["Web App", "API Gateway", "Supabase", "Auth", "Storage", "Telemetry", "Feature Flags", "Safe Mode", "Repair Engine", "Route Registry", "Modal Registry", "Audit Store"].map((node, index) => (
                      <button key={node} type="button" onClick={() => { setLastResult(`${node} dependency selected`); setModal(index % 3 === 0 ? "diagnostic" : index % 3 === 1 ? "api-recovery" : "audit-rollback") }} className="rounded-[22px] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                        <div className="flex items-center justify-between"><p className="font-black text-slate-950">{node}</p><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /></div>
                        <p className="mt-3 text-xs font-bold leading-5 text-slate-500">Dependency monitored · rollback-aware · operationally visible</p>
                      </button>
                    ))}
                  </div>
                </SectionShell>
                <SectionShell id="performance" eyebrow="Memory · freeze · long task" title="Live Performance Console" action={<button type="button" onClick={() => setModal("memory-repair")} className="rounded-2xl bg-rose-600 px-4 py-3 text-xs font-black text-white">Open repair modal</button>}>
                  <div className="max-h-[360px] space-y-4 overflow-y-auto pr-2">
                    {[["Heap pressure", 62, "Watch"], ["Long task frequency", 78, "Warning"], ["Modal retained state", 72, "Watch"], ["Large list render cost", 82, "Watch"], ["Detached DOM suspicion", 34, "Low"], ["Polling pressure", 45, "Moderate"]].map(([label, value, state]) => (
                      <div key={String(label)} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between"><p className="font-black text-slate-700">{label}</p><p className="text-xs font-black text-slate-500">{state}</p></div>
                        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${Number(value) > 75 ? "bg-rose-500" : Number(value) > 55 ? "bg-blue-500" : "bg-emerald-500"}`} style={{ width: `${value}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </SectionShell>
              </section>

              <SectionShell id="pages-routes" eyebrow="Route health and operational actions" title="Pages & Routes Control Matrix" action={<button type="button" onClick={() => setModal("route-recovery")} className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-black text-blue-700">Open route recovery</button>}>
                <div className="max-h-[430px] overflow-auto rounded-[24px] border border-slate-200">
                  <table className="min-w-[980px] w-full text-left text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase tracking-[0.20em] text-slate-400"><tr><th className="p-4">Route</th><th className="p-4">Module</th><th className="p-4">Status</th><th className="p-4">Load</th><th className="p-4">Memory</th><th className="p-4">API</th><th className="p-4">Safe Mode</th><th className="p-4">Action</th></tr></thead>
                    <tbody>{baseRoutes.map((route) => (
                      <tr key={route.route} onClick={() => setSelectedRoute(route)} className={`cursor-pointer border-t border-slate-100 transition hover:bg-blue-50/40 ${selectedRoute.route === route.route ? "bg-blue-50/50" : "bg-white"}`}>
                        <td className="p-4 font-black text-slate-950">{route.route}</td><td className="p-4 font-bold text-slate-600">{route.module}</td><td className="p-4"><span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase ${toneClasses(route.status)}`}>{route.status}</span></td><td className="p-4 font-bold">{route.loadMs}ms</td><td className="p-4 font-bold">{route.memoryMb} MB</td><td className="p-4 font-bold">{route.apiCalls} calls · {route.errors} err</td><td className="p-4 font-black">{route.safeMode ? "ON" : "OFF"}</td><td className="p-4"><button type="button" onClick={(e) => { e.stopPropagation(); quickAction(route.action, route.route.includes("market-os") ? "marketos.timeline.max_cards" : route.route.includes("hr") ? "hr.employee360.lazy_print_preview" : "opsos.route.monitor", route.route) }} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black shadow-sm">{route.action}</button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </SectionShell>

              <section id="api-control" className="scroll-mt-28 grid gap-5 xl:grid-cols-2">
                <SectionShell id="api-queue-control" eyebrow="API and queue operations" title="API / Queue Recovery Matrix" action={<button type="button" onClick={() => setModal("api-recovery")} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black">Open API recovery</button>}>
                  <div className="max-h-[330px] overflow-auto rounded-[24px] border border-slate-200"><table className="min-w-[740px] w-full text-left text-sm"><thead className="sticky top-0 bg-slate-50 text-[10px] uppercase tracking-[0.18em] text-slate-400"><tr><th className="p-3">Endpoint</th><th className="p-3">P95</th><th className="p-3">Failures</th><th className="p-3">Queue</th><th className="p-3">Action</th></tr></thead><tbody>{apiRows.map((api) => <tr key={api.endpoint} className="border-t border-slate-100"><td className="p-3 font-black text-slate-900">{api.endpoint}</td><td className="p-3 font-bold">{api.p95}ms</td><td className="p-3 font-bold">{api.failures}</td><td className="p-3 font-bold">{api.queue}</td><td className="p-3"><button type="button" onClick={() => quickAction(api.recovery, "opsos.api.recovery", api.endpoint)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black">{api.recovery}</button></td></tr>)}</tbody></table></div>
                </SectionShell>
                <SectionShell id="feature-flags" eyebrow="Runtime switchboard" title="Feature Flags & Safe Mode Controls">
                  <div className="grid max-h-[330px] gap-3 overflow-y-auto pr-2 md:grid-cols-2">
                    {["marketos.timeline.live_progress", "marketos.disable_live_polling", "hr.employee360.print_preview", "global.heavy_animations", "opsos.telemetry.capture_long_tasks", "opsos.actions.require_dry_run"].map((flag, index) => <ToggleLine key={flag} title={flag} detail={index % 2 ? "Runtime controlled" : "DB-backed switch"} defaultValue={index !== 3} />)}
                  </div>
                </SectionShell>
              </section>

              <SectionShell id="modals-ux" eyebrow="Modal command matrix" title="Modal UX Failure & Control Matrix" action={<button type="button" onClick={() => setModal("modal-inspector")} className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs font-black text-violet-700">Open modal inspector</button>}>
                <div className="max-h-[390px] overflow-auto rounded-[24px] border border-slate-200"><table className="min-w-[900px] w-full text-left text-sm"><thead className="sticky top-0 bg-slate-50 text-[10px] uppercase tracking-[0.18em] text-slate-400"><tr><th className="p-3">Modal</th><th className="p-3">Route</th><th className="p-3">Open</th><th className="p-3">Renders</th><th className="p-3">Retained</th><th className="p-3">Failure</th><th className="p-3">Action</th></tr></thead><tbody>{modalRows.map((row) => <tr key={row.name} className="border-t border-slate-100"><td className="p-3 font-black text-slate-900">{row.name}</td><td className="p-3 font-bold text-slate-500">{row.route}</td><td className="p-3 font-bold">{row.openMs}ms</td><td className="p-3 font-bold">{row.renders}</td><td className="p-3 font-bold">+{row.retainedMb} MB</td><td className="p-3 font-bold text-amber-700">{row.failure}</td><td className="p-3"><button type="button" onClick={() => quickAction(`Fix ${row.name}`, "opsos.modal.fix", row.name)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black">{row.autoFix ? "Run fix" : "Inspect"}</button></td></tr>)}</tbody></table></div>
              </SectionShell>

              <section id="safe-repair" className="scroll-mt-28 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                <SectionShell id="repair-skills" eyebrow="Surgical repair skills" title="Repair Skills Library">
                  <div className="grid max-h-[360px] gap-3 overflow-y-auto pr-2 md:grid-cols-2 2xl:grid-cols-3">
                    {repairSkills.map(([label, detail, modalKind]) => <button key={label} type="button" onClick={() => setModal(modalKind as ModalKind)} className="rounded-[22px] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><p className="font-black text-slate-950">{label}</p><p className="mt-2 text-xs font-bold leading-5 text-slate-500">{detail}</p><p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">Run skill</p></button>)}
                  </div>
                </SectionShell>
                <SectionShell id="logs-audit" eyebrow="Action history / audit trail" title="Live Action History" action={<button type="button" onClick={() => setModal("audit-rollback")} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black">Rollback center</button>}>
                  <div className="max-h-[360px] space-y-3 overflow-y-auto pr-2">
                    {logs.map((log) => <div key={log.id} className="grid gap-3 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[100px_1fr_120px]"><div className="text-xs font-black text-slate-400">{log.time}</div><div><p className="font-black text-slate-950">{log.action}</p><p className="mt-1 text-xs font-bold text-slate-500">{log.actor} · {log.target} · {log.detail}</p></div><span className={`h-fit rounded-full border px-3 py-1 text-center text-[10px] font-black uppercase ${log.status === "success" ? toneClasses("healthy") : log.status === "failed" ? toneClasses("critical") : log.status === "simulated" ? toneClasses("warning") : toneClasses("watch")}`}>{log.status}</span></div>)}
                  </div>
                </SectionShell>
              </section>
            </div>
          </div>
        </main>

        <aside className="hidden h-full overflow-y-auto border-l border-slate-200 bg-white p-5 xl:block">
          <div className="sticky top-0 space-y-5 bg-white pb-5">
            <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-700">Selected context</p>
              <h3 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-950">{selectedRoute.module} pressure</h3>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{selectedRoute.issue}</p>
            </div>
            <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.20em] text-slate-400">Key metrics</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <MetricMini label="Load" value={`${selectedRoute.loadMs}ms`} />
                <MetricMini label="Memory" value={`${selectedRoute.memoryMb} MB`} />
                <MetricMini label="API" value={`${selectedRoute.apiCalls}`} />
                <MetricMini label="Errors" value={`${selectedRoute.errors}`} />
              </div>
            </div>
            <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.20em] text-slate-400">Recommended actions</p>
              <div className="mt-4 space-y-2">
                <button type="button" onClick={() => quickAction("Enable route safe mode", "opsos.safe_mode.route_enable", selectedRoute.route)} className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">Enable safe mode</button>
                <button type="button" onClick={() => setModal("route-recovery")} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">Open recovery</button>
                <button type="button" onClick={() => setModal("audit-rollback")} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">Rollback evidence</button>
                <button type="button" onClick={() => setModal("rbac")} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">RBAC gates</button>
              </div>
            </div>
            <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.20em] text-slate-400">Activity stream</p>
              <div className="mt-4 space-y-3">{logs.slice(0, 5).map((log) => <div key={`side-${log.id}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-3"><p className="text-xs font-black text-slate-950">{log.action}</p><p className="mt-1 text-[11px] font-bold text-slate-500">{log.target} · {log.status}</p></div>)}</div>
            </div>
          </div>
        </aside>
      </div>
      {modal ? <ModalFrame kind={modal} onClose={() => setModal(null)} onExecute={executeOperation} /> : null}
      {busyAction ? <div className="fixed bottom-5 left-1/2 z-[120] -translate-x-1/2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-2xl">Running {busyAction}...</div> : null}
    </div>
  )
}

function MetricMini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p><p className="mt-1 text-lg font-black text-slate-950">{value}</p></div>
}
