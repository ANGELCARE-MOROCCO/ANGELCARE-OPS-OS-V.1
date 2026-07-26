"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  Activity,
  AlertTriangle,
  Apple,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Command,
  Cpu,
  FileWarning,
  Gauge,
  Laptop2,
  LoaderCircle,
  LockKeyhole,
  MonitorCog,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  ServerCog,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  TimerReset,
  Wifi,
  WifiOff,
  X,
  XCircle,
} from "lucide-react"
import { commandStatusLabel, summarizeMetadata } from "@/lib/whatsapp-desktop/control-plane"
import type { WhatsAppControlPlaneOverview, WhatsAppControlPlaneDevice, WhatsAppGovernanceAlert } from "@/lib/whatsapp-desktop/types"

type Row = Record<string, any>
type InternalView = "fleet" | "interventions" | "commands"

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", ...(init?.headers || {}) } })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || `HTTP_${response.status}`)
  return payload.data as T
}

function relative(value: string | null | undefined) {
  if (!value) return "Jamais"
  const time = new Date(value).getTime()
  if (!Number.isFinite(time)) return "Date inconnue"
  const delta = Math.max(0, Date.now() - time)
  if (delta < 60_000) return "À l’instant"
  if (delta < 3_600_000) return `Il y a ${Math.floor(delta / 60_000)} min`
  if (delta < 86_400_000) return `Il y a ${Math.floor(delta / 3_600_000)} h`
  return new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })
}

function userName(row: Row | null | undefined) {
  return row?.display_name || row?.full_name || row?.name || row?.email || "Utilisateur non affecté"
}

function Pill({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "green" | "blue" | "amber" | "red" | "violet" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
  }
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[.13em] ${tones[tone]}`}>{children}</span>
}

function syncTone(status: string) {
  if (status === "synchronized") return "green" as const
  if (status === "pending") return "blue" as const
  if (status === "drift") return "amber" as const
  if (status === "blocked" || status === "error") return "red" as const
  return "slate" as const
}

function syncLabel(status: string) {
  return ({ synchronized: "Synchronisé", pending: "Synchronisation en cours", drift: "Dérive détectée", offline: "Hors ligne", blocked: "Bloqué", unknown: "À évaluer", error: "Erreur" } as Record<string, string>)[status] || status
}

function commandTone(status: string) {
  if (status === "completed") return "green" as const
  if (["created", "delivered", "received", "executing"].includes(status)) return "blue" as const
  if (["failed", "expired", "cancelled"].includes(status)) return "red" as const
  return "slate" as const
}

function severityTone(severity: string) {
  if (severity === "critical" || severity === "high") return "red" as const
  if (severity === "attention") return "amber" as const
  return "blue" as const
}

function Kpi({ label, value, icon: Icon, tone, onClick }: { label: string; value: number; icon: typeof Activity; tone: string; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-[22px] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"><div className="flex items-center justify-between"><div className={`grid h-10 w-10 place-items-center rounded-2xl ${tone}`}><Icon className="h-4 w-4" /></div><span className="text-2xl font-black tracking-[-.05em] text-slate-950">{value}</span></div><p className="mt-3 text-[9px] font-black uppercase tracking-[.15em] text-slate-500">{label}</p></button>
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="grid min-h-52 place-items-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center text-sm font-bold text-slate-500">{children}</div>
}

function DeviceDrawer({ device, overview, onClose, reload }: { device: WhatsAppControlPlaneDevice; overview: WhatsAppControlPlaneOverview; onClose: () => void; reload: () => Promise<void> }) {
  const assessment = device.sync_assessment as Row || {}
  const desired = assessment.desired || {}
  const reported = assessment.reported || {}
  const [form, setForm] = useState({
    desired_mode: desired.station_mode || "standard",
    desired_whatsapp_enabled: desired.whatsapp_enabled !== false,
    desired_ac_plus_enabled: desired.ac_plus_enabled !== false,
    desired_split_enabled: desired.split_enabled !== false,
    desired_maximum_tabs: Number(desired.maximum_tabs || 8),
    desired_policy_id: desired.policy_id || device.effective_policy?.id || "",
    desired_policy_version: Number(desired.policy_version || device.effective_policy?.policy_version || 0),
    reason: "Mise à jour de gouvernance depuis le dossier du poste",
  })
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const commands = overview.commands.filter((row) => row.device_id === device.id).slice(0, 12)
  const alerts = overview.alerts.filter((row) => row.device_id === device.id && ["open", "acknowledged"].includes(row.status)).slice(0, 12)
  const run = async (key: string, task: () => Promise<unknown>, success: string) => {
    setBusy(key); setError(null); setNotice(null)
    try { await task(); setNotice(success); await reload() }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)) }
    finally { setBusy(null) }
  }
  const save = () => run("save", () => api(`/api/whatsapp-desktop/devices/${device.id}/desired-state`, { method: "PATCH", body: JSON.stringify(form) }), "État désiré enregistré. Utilisez Synchroniser pour l’appliquer.")
  const synchronize = (trigger = "manual") => run("sync", () => api(`/api/whatsapp-desktop/devices/${device.id}/synchronize`, { method: "POST", body: JSON.stringify({ reason: form.reason, trigger_type: trigger }) }), "Synchronisation mise en file avec corrélation et preuve d’exécution.")
  const diagnostics = () => run("diagnostics", () => api(`/api/whatsapp-desktop/devices/${device.id}/diagnostics`, { method: "POST", body: JSON.stringify({ reason: "Diagnostic complet demandé depuis le dossier MZ14", scope: "full" }) }), "Diagnostic demandé au poste.")
  return <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><aside className="absolute right-0 top-0 h-full w-full max-w-5xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl"><header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 p-6 backdrop-blur"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><Pill tone={syncTone(String(assessment.status))}>{syncLabel(String(assessment.status))}</Pill><Pill tone={assessment.online ? "green" : "slate"}>{assessment.online ? "En ligne" : "Hors ligne"}</Pill><Pill tone="blue">Score {Number(assessment.score || 0)}/100</Pill></div><h2 className="mt-3 text-3xl font-black tracking-[-.05em] text-slate-950">{device.device_name}</h2><p className="mt-2 text-sm font-semibold text-slate-500">{userName(device.user as Row)} · {device.platform}/{device.architecture || "—"} · Desktop {device.desktop_version || "—"}</p></div><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500"><X className="h-4 w-4" /></button></div><div className="mt-5 flex flex-wrap gap-2"><button disabled={busy !== null} onClick={() => void synchronize()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-black text-white disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${busy === "sync" ? "animate-spin" : ""}`} />Synchroniser maintenant</button><button disabled={busy !== null} onClick={() => void synchronize("authorization")} className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-black text-emerald-700"><ShieldCheck className="h-4 w-4" />Actualiser l’autorisation</button><button disabled={busy !== null} onClick={() => void diagnostics()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 text-xs font-black text-violet-700"><Gauge className="h-4 w-4" />Demander un diagnostic</button></div></header><div className="space-y-6 p-6">
    {(error || notice) ? <div className={`rounded-xl border p-3 text-xs font-black ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error || notice}</div> : null}
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
      ["Dernier heartbeat", relative(device.last_heartbeat_at)], ["Dernier pull config", relative(device.last_configuration_pull_at)], ["Dernier poll commandes", relative(device.last_command_poll_at)], ["Dérive horloge", device.clock_drift_seconds == null ? "Non signalée" : `${device.clock_drift_seconds}s`],
      ["Contrat gouvernance", device.governance_contract_version || "Non signalé"], ["Version politique", String(reported.policy_version ?? "—")], ["Onglets signalés", String(reported.tab_count ?? "—")], ["État navigateur", reported.browser_health || "unknown"],
    ].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">{label}</p><p className="mt-2 break-words text-xs font-black text-slate-900">{value}</p></div>)}</section>
    <section className="grid gap-6 lg:grid-cols-2"><div className="rounded-[24px] border border-blue-100 bg-blue-50/35 p-5"><div className="flex items-center gap-2"><SlidersHorizontal className="h-5 w-5 text-blue-700" /><h3 className="text-lg font-black text-slate-950">État désiré</h3></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-xs font-black text-slate-600">Mode<select value={form.desired_mode} onChange={(event) => setForm({ ...form, desired_mode: event.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm font-black"><option value="standard">Standard</option><option value="focus">Corporate Focus</option><option value="locked">Corporate Locked</option></select></label><label className="text-xs font-black text-slate-600">Maximum onglets<input type="number" min={2} max={50} value={form.desired_maximum_tabs} onChange={(event) => setForm({ ...form, desired_maximum_tabs: Number(event.target.value) })} className="mt-1.5 h-11 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm font-black" /></label></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{[
      ["desired_whatsapp_enabled", "WhatsApp autorisé"], ["desired_ac_plus_enabled", "AC+ autorisé"], ["desired_split_enabled", "Écrans autorisés"],
    ].map(([key, label]) => <label key={key} className="flex items-center justify-between rounded-xl border border-blue-100 bg-white p-3 text-xs font-black text-slate-700"><span>{label}</span><input type="checkbox" checked={Boolean((form as Row)[key])} onChange={(event) => setForm({ ...form, [key]: event.target.checked })} /></label>)}</div><label className="mt-4 block text-xs font-black text-slate-600">Politique<select value={form.desired_policy_id} onChange={(event) => { const selected = overview.policies.find((row) => row.id === event.target.value); setForm({ ...form, desired_policy_id: event.target.value, desired_policy_version: Number(selected?.policy_version || 0) }) }} className="mt-1.5 h-11 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm font-black"><option value="">Politique effective actuelle</option>{overview.policies.map((row) => <option key={row.id} value={row.id}>{row.name} · v{row.policy_version}</option>)}</select></label><label className="mt-4 block text-xs font-black text-slate-600">Motif<textarea value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} className="mt-1.5 min-h-20 w-full rounded-xl border border-blue-100 bg-white p-3 text-sm font-semibold" /></label><button disabled={busy !== null || !form.reason.trim()} onClick={() => void save()} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white disabled:opacity-50"><Save className="h-4 w-4" />Enregistrer la consigne</button></div>
      <div className="rounded-[24px] border border-slate-200 p-5"><div className="flex items-center gap-2"><MonitorCog className="h-5 w-5 text-emerald-600" /><h3 className="text-lg font-black text-slate-950">État signalé</h3></div><div className="mt-4 space-y-2">{[
        ["Mode", reported.station_mode, desired.station_mode], ["Version politique", reported.policy_version, desired.policy_version], ["WhatsApp", reported.whatsapp_visible ? "Visible" : "Dormant", desired.whatsapp_enabled ? "Autorisé" : "Bloqué"], ["Santé navigateur", reported.browser_health, "healthy"], ["Autorisation", reported.authorization_state, "authorized"],
      ].map(([label, actual, expected]) => <div key={String(label)} className="grid grid-cols-[1fr_auto] gap-3 rounded-xl bg-slate-50 p-3"><div><p className="text-[9px] font-black uppercase tracking-[.13em] text-slate-400">{label}</p><p className="mt-1 text-xs font-black text-slate-900">{String(actual ?? "—")}</p></div><div className="text-right"><p className="text-[9px] font-black uppercase tracking-[.13em] text-slate-400">Attendu</p><p className="mt-1 text-xs font-black text-blue-700">{String(expected ?? "—")}</p></div></div>)}</div></div></section>
    <section className="grid gap-6 lg:grid-cols-2"><div className="rounded-[24px] border border-slate-200 p-5"><h3 className="flex items-center gap-2 text-lg font-black text-slate-950"><AlertTriangle className="h-5 w-5 text-amber-600" />Écarts et couches bloquantes</h3><div className="mt-4 space-y-2">{[...(assessment.blockers || []).map((row: Row) => ({ ...row, kind: "blocker" })), ...(assessment.drift || []).map((row: Row) => ({ ...row, kind: "drift" }))].map((row: Row) => <div key={`${row.kind}:${row.code}`} className={`rounded-xl border p-3 ${row.severity === "critical" || row.severity === "high" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black text-slate-900">{row.label}</p><p className="mt-1 text-[10px] font-semibold text-slate-600">{row.layer ? `Couche: ${row.layer}` : `Attendu ${row.desired} · signalé ${row.reported}`}</p></div><Pill tone={severityTone(row.severity)}>{row.severity}</Pill></div></div>)}{!(assessment.blockers || []).length && !(assessment.drift || []).length ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-black text-emerald-700">Aucune dérive active. Le poste correspond à la consigne.</div> : null}</div></div><div className="rounded-[24px] border border-slate-200 p-5"><h3 className="flex items-center gap-2 text-lg font-black text-slate-950"><Command className="h-5 w-5 text-blue-600" />Dernières commandes</h3><div className="mt-4 space-y-2">{commands.length ? commands.map((row) => <div key={`${row.command_channel}:${row.id}`} className="rounded-xl bg-slate-50 p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black text-slate-900">{row.command_type}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{row.command_channel === "station" ? "Poste Corporate" : "WhatsApp"} · {relative(row.issued_at)}</p></div><Pill tone={commandTone(row.status)}>{commandStatusLabel(row.status)}</Pill></div></div>) : <p className="text-xs font-semibold text-slate-500">Aucune commande pour ce poste.</p>}</div></div></section>
    <section className="rounded-[24px] border border-slate-200 p-5"><h3 className="flex items-center gap-2 text-lg font-black text-slate-950"><ShieldAlert className="h-5 w-5 text-red-600" />Interventions ouvertes</h3><div className="mt-4 grid gap-3 md:grid-cols-2">{alerts.length ? alerts.map((row) => <div key={row.id} className="rounded-xl border border-slate-200 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black text-slate-900">{row.title}</p><p className="mt-1 text-[10px] font-semibold leading-5 text-slate-500">{row.description}</p></div><Pill tone={severityTone(row.severity)}>{row.severity}</Pill></div></div>) : <p className="text-xs font-semibold text-slate-500">Aucune intervention ouverte.</p>}</div></section>
  </div></aside></div>
}

export default function WhatsAppGovernanceControlPlane({ initialView = "fleet", embedded = false }: { initialView?: InternalView; embedded?: boolean } = {}) {
  const [data, setData] = useState<WhatsAppControlPlaneOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [view, setView] = useState<InternalView>(initialView)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [platform, setPlatform] = useState("all")
  const [selected, setSelected] = useState<string[]>([])
  const [drawer, setDrawer] = useState<WhatsAppControlPlaneDevice | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async (refreshAlerts = false) => {
    setLoading(true); setError(null)
    try { setData(await api<WhatsAppControlPlaneOverview>(`/api/whatsapp-desktop/control-plane/overview${refreshAlerts ? "?refreshAlerts=1" : ""}`)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load(true) }, [load])

  const devices = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (data?.devices || []).filter((device) => {
      const assessment = device.sync_assessment as Row || {}
      const text = [device.device_name, device.installation_id, device.desktop_version, device.platform, device.architecture, device.last_ip, userName(device.user as Row)].join(" ").toLowerCase()
      return (!needle || text.includes(needle)) && (status === "all" || assessment.status === status) && (platform === "all" || device.platform === platform)
    })
  }, [data, platform, search, status])

  const run = async (key: string, task: () => Promise<unknown>, success: string) => {
    setBusy(key); setError(null); setNotice(null)
    try { await task(); setNotice(success); await load(true) }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)) }
    finally { setBusy(null) }
  }

  const syncSelected = () => run("bulk-sync", async () => {
    for (const id of selected) await api(`/api/whatsapp-desktop/devices/${id}/synchronize`, { method: "POST", body: JSON.stringify({ reason: "Synchronisation groupée depuis la vue exécutive MZ14", trigger_type: "manual" }) })
  }, `${selected.length} poste(s) mis en synchronisation.`)

  const actAlert = (alert: WhatsAppGovernanceAlert, action: "acknowledge" | "resolve") => run(`${action}:${alert.id}`, () => api(`/api/whatsapp-desktop/alerts/${alert.id}/${action}`, { method: "POST", body: JSON.stringify(action === "resolve" ? { resolution_note: "Condition vérifiée et clôturée par l’administration MZ14." } : { reason: "Alerte prise en charge", assigned_to: null }) }), action === "resolve" ? "Alerte clôturée avec preuve." : "Alerte prise en charge.")

  const commandAction = (row: Row, action: "retry" | "cancel") => run(`${action}:${row.id}`, () => api(`/api/whatsapp-desktop/commands/${row.id}/${action}`, { method: "POST", body: JSON.stringify({ command_channel: row.command_channel, reason: action === "retry" ? "Nouvelle tentative gouvernée depuis MZ14" : "Annulation gouvernée depuis MZ14" }) }), action === "retry" ? "Nouvelle tentative créée." : "Commande annulée.")

  if (loading && !data) return <div className="grid min-h-[520px] place-items-center"><div className="text-center"><LoaderCircle className="mx-auto h-9 w-9 animate-spin text-blue-700" /><p className="mt-4 text-sm font-black text-slate-800">Chargement du Governance Control Plane…</p></div></div>

  return <div className="space-y-6">
    {!embedded ? <>
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#07172f,#102e67_58%,#0d6b55)] p-6 text-white shadow-xl"><div className="flex flex-wrap items-start justify-between gap-5"><div><div className="flex flex-wrap gap-2"><Pill tone="green">MZ14 Governance Control Plane</Pill><Pill tone="blue">Route unique /whatsapp-os/admin</Pill><Pill tone="slate">Desktop 1.7.3 compatible</Pill></div><h2 className="mt-5 text-3xl font-black tracking-[-.055em] lg:text-4xl">Piloter la flotte depuis un seul centre de vérité.</h2><p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-blue-100">Consigne désirée, état réellement signalé, dérive, commandes, accusés, alertes et preuve d’audit sont réunis avec exécution uniforme par les clients Windows et macOS 1.7.3.</p></div><button onClick={() => void load(true)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-black text-white backdrop-blur"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Recalculer et synchroniser les alertes</button></div></section>

    {!data?.capabilities?.mz14_schema ? <div className="rounded-[22px] border border-red-200 bg-red-50 p-5"><div className="flex gap-3"><FileWarning className="mt-0.5 h-5 w-5 text-red-600" /><div><p className="text-sm font-black text-red-900">Migration MZ14 requise</p><p className="mt-1 text-xs font-semibold leading-5 text-red-700">Appliquez la migration Supabase MZ14 avant d’utiliser les consignes, synchronisations, retries ou alertes. {String((data as Row)?.migration_error || "")}</p></div></div></div> : null}
    {(error || notice) ? <div className={`rounded-xl border p-3 text-xs font-black ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error || notice}</div> : null}

    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
      <Kpi label="Postes" value={Number(data?.counts?.devices || 0)} icon={Laptop2} tone="bg-slate-100 text-slate-700" onClick={() => setStatus("all")} />
      <Kpi label="En ligne" value={Number(data?.counts?.online || 0)} icon={Wifi} tone="bg-emerald-50 text-emerald-700" />
      <Kpi label="Synchronisés" value={Number(data?.counts?.synchronized || 0)} icon={CheckCircle2} tone="bg-blue-50 text-blue-700" onClick={() => setStatus("synchronized")} />
      <Kpi label="Dérive" value={Number(data?.counts?.drift || 0)} icon={Activity} tone="bg-amber-50 text-amber-700" onClick={() => setStatus("drift")} />
      <Kpi label="Bloqués" value={Number(data?.counts?.blocked || 0)} icon={LockKeyhole} tone="bg-red-50 text-red-700" onClick={() => setStatus("blocked")} />
      <Kpi label="Commandes en cours" value={Number(data?.counts?.pending_commands || 0)} icon={Command} tone="bg-violet-50 text-violet-700" onClick={() => setView("commands")} />
      <Kpi label="Alertes ouvertes" value={Number(data?.counts?.open_alerts || 0)} icon={ShieldAlert} tone="bg-red-50 text-red-700" onClick={() => setView("interventions")} />
      <Kpi label="Sessions actives" value={Number(data?.counts?.active_sessions || 0)} icon={ServerCog} tone="bg-emerald-50 text-emerald-700" />
    </section>

    <nav className="flex flex-wrap gap-2 rounded-[20px] border border-slate-200 bg-white p-2">{[
      ["fleet", "Matrice flotte & synchronisation", MonitorCog], ["interventions", "File d’intervention", ShieldAlert], ["commands", "Commandes & preuves", Command],
    ].map(([id, label, Icon]: any) => <button key={id} onClick={() => setView(id)} className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-black ${view === id ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-50"}`}><Icon className="h-4 w-4" />{label}</button>)}</nav>
    </> : null}

    {view === "fleet" ? <>
      <section className="flex flex-wrap gap-3 rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm"><label className="relative min-w-[260px] flex-1"><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher poste, utilisateur, IP, version, installation…" className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm font-semibold outline-none focus:border-blue-400" /></label><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-xs font-black"><option value="all">Tous les états</option><option value="synchronized">Synchronisés</option><option value="pending">En cours</option><option value="drift">Dérive</option><option value="blocked">Bloqués</option><option value="offline">Hors ligne</option></select><select value={platform} onChange={(event) => setPlatform(event.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-xs font-black"><option value="all">Toutes plateformes</option><option value="windows">Windows</option><option value="macos">macOS</option></select><button disabled={!selected.length || busy !== null || !data?.capabilities?.mz14_schema} onClick={() => void syncSelected()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-black text-white disabled:opacity-40"><RefreshCw className={`h-4 w-4 ${busy === "bulk-sync" ? "animate-spin" : ""}`} />Synchroniser ({selected.length})</button></section>
      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="min-w-[1250px] w-full text-left"><thead className="bg-slate-50 text-[9px] font-black uppercase tracking-[.14em] text-slate-400"><tr><th className="p-4"><input type="checkbox" checked={devices.length > 0 && devices.every((row) => selected.includes(row.id))} onChange={(event) => setSelected(event.target.checked ? devices.map((row) => row.id) : [])} /></th><th className="p-4">Poste</th><th className="p-4">Conformité</th><th className="p-4">Consigne</th><th className="p-4">Signalé</th><th className="p-4">Synchronisation</th><th className="p-4">Dernier contact</th><th className="p-4">Action</th></tr></thead><tbody>{devices.map((device) => { const assessment = device.sync_assessment as Row || {}; const desired = assessment.desired || {}; const reported = assessment.reported || {}; return <tr key={device.id} className="border-t border-slate-100 align-top hover:bg-slate-50/60"><td className="p-4"><input type="checkbox" checked={selected.includes(device.id)} onChange={(event) => setSelected(event.target.checked ? [...selected, device.id] : selected.filter((id) => id !== device.id))} /></td><td className="p-4"><div className="flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">{device.platform === "windows" ? <Laptop2 className="h-4 w-4" /> : device.platform === "macos" ? <Apple className="h-4 w-4" /> : <Cpu className="h-4 w-4" />}</div><div><p className="text-xs font-black text-slate-950">{device.device_name}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{userName(device.user as Row)}</p><p className="mt-1 text-[9px] font-bold text-slate-400">{device.platform}/{device.architecture || "—"} · v{device.desktop_version || "—"}</p></div></div></td><td className="p-4"><div className="space-y-1"><Pill tone={device.approval_status === "approved" ? "green" : "red"}>{device.approval_status}</Pill><p className="text-[10px] font-bold text-slate-500">Contrat {device.governance_contract_version || "non signalé"}</p><p className="text-[10px] font-bold text-slate-500">{device.open_alert_count || 0} alerte(s)</p></div></td><td className="p-4"><p className="text-xs font-black text-slate-900">Mode {desired.station_mode || "standard"}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">Politique v{desired.policy_version || 0} · max {desired.maximum_tabs || 8}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">AC+ {desired.ac_plus_enabled ? "autorisé" : "bloqué"} · Écrans {desired.split_enabled ? "autorisés" : "bloqués"}</p></td><td className="p-4"><p className="text-xs font-black text-slate-900">Mode {reported.station_mode || "unknown"}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">Politique v{reported.policy_version || 0} · {reported.tab_count || 0} onglet(s)</p><p className="mt-1 text-[10px] font-semibold text-slate-500">WhatsApp {reported.whatsapp_visible ? "visible" : "dormant"} · {reported.authorization_state || "unknown"}</p></td><td className="p-4"><Pill tone={syncTone(String(assessment.status))}>{syncLabel(String(assessment.status))}</Pill><div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(0, Math.min(100, Number(assessment.score || 0)))}%` }} /></div><p className="mt-1 text-[9px] font-bold text-slate-400">Score {assessment.score || 0}/100 · {device.pending_command_count || 0} commande(s)</p></td><td className="p-4"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${assessment.online ? "bg-emerald-500" : "bg-slate-300"}`} /><p className="text-xs font-black text-slate-800">{assessment.online ? "En ligne" : "Hors ligne"}</p></div><p className="mt-1 text-[10px] font-semibold text-slate-500">{relative(device.last_heartbeat_at)}</p><p className="mt-1 text-[9px] font-bold text-slate-400">IP {String((device as Row).last_ip || "non signalée")}</p></td><td className="p-4"><button onClick={() => setDrawer(device)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:border-blue-200 hover:text-blue-700">Ouvrir dossier<ChevronRight className="h-4 w-4" /></button></td></tr>})}</tbody></table></div>{!devices.length ? <div className="p-6"><Empty>Aucun poste ne correspond aux filtres.</Empty></div> : null}</section>
    </> : null}

    {view === "interventions" ? <section className="grid gap-4 lg:grid-cols-2">{(data?.alerts || []).filter((row) => ["open", "acknowledged"].includes(row.status)).map((alert) => <article key={alert.id} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap gap-2"><Pill tone={severityTone(alert.severity)}>{alert.severity}</Pill><Pill tone={alert.status === "acknowledged" ? "blue" : "amber"}>{alert.status === "acknowledged" ? "Prise en charge" : "Ouverte"}</Pill></div><h3 className="mt-3 text-lg font-black text-slate-950">{alert.title}</h3><p className="mt-2 text-xs font-semibold leading-6 text-slate-600">{alert.description}</p></div><ShieldAlert className={`h-6 w-6 ${alert.severity === "critical" || alert.severity === "high" ? "text-red-600" : "text-amber-600"}`} /></div><div className="mt-4 grid gap-2 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase text-slate-400">Poste</p><p className="mt-1 text-xs font-black text-slate-900">{(alert as Row).device?.device_name || "Flotte"}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-black uppercase text-slate-400">Détectée</p><p className="mt-1 text-xs font-black text-slate-900">{relative(alert.last_detected_at)}</p></div></div><p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[10px] font-semibold leading-5 text-slate-600">{summarizeMetadata(alert.evidence)}</p><div className="mt-4 flex flex-wrap gap-2">{alert.status === "open" ? <button disabled={busy !== null} onClick={() => void actAlert(alert, "acknowledge")} className="inline-flex h-9 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-black text-blue-700"><CircleDot className="h-4 w-4" />Prendre en charge</button> : null}<button disabled={busy !== null} onClick={() => void actAlert(alert, "resolve")} className="inline-flex h-9 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-black text-emerald-700"><CheckCircle2 className="h-4 w-4" />Clôturer avec preuve</button></div></article>)}{!(data?.alerts || []).some((row) => ["open", "acknowledged"].includes(row.status)) ? <div className="lg:col-span-2"><Empty>Aucune intervention ouverte. La flotte est conforme aux règles évaluées.</Empty></div> : null}</section> : null}

    {view === "commands" ? <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white"><div className="border-b border-slate-200 p-5"><h3 className="text-lg font-black text-slate-950">Chronologie des commandes et preuves d’exécution</h3><p className="mt-1 text-xs font-semibold text-slate-500">Canaux WhatsApp et Corporate Station réunis, avec corrélation, priorité, retries, échéance et résultat.</p></div><div className="overflow-x-auto"><table className="min-w-[1150px] w-full text-left"><thead className="bg-slate-50 text-[9px] font-black uppercase tracking-[.13em] text-slate-400"><tr><th className="p-4">Commande</th><th className="p-4">Poste</th><th className="p-4">Canal</th><th className="p-4">État</th><th className="p-4">Preuve & délais</th><th className="p-4">Action</th></tr></thead><tbody>{(data?.commands || []).slice(0, 500).map((row) => <tr key={`${row.command_channel}:${row.id}`} className="border-t border-slate-100 align-top"><td className="p-4"><p className="text-xs font-black text-slate-950">{row.command_type}</p><p className="mt-1 max-w-xs text-[10px] font-semibold leading-5 text-slate-500">{row.reason}</p><p className="mt-1 text-[9px] font-bold text-slate-400">Corrélation {row.correlation_id || "individuelle"}</p></td><td className="p-4"><p className="text-xs font-black text-slate-900">{row.device?.device_name || row.device_id}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{relative(row.issued_at)}</p></td><td className="p-4"><Pill tone={row.command_channel === "station" ? "violet" : "green"}>{row.command_channel === "station" ? "Corporate Station" : "WhatsApp"}</Pill><p className="mt-2 text-[10px] font-bold text-slate-500">Priorité {row.priority || "normal"}</p></td><td className="p-4"><Pill tone={commandTone(row.status)}>{commandStatusLabel(row.status)}</Pill><p className="mt-2 text-[10px] font-bold text-slate-500">Tentative {Number(row.retry_count || 0) + 1}/{Number(row.max_retries || 3) + 1}</p></td><td className="p-4"><p className="text-[10px] font-bold text-slate-600">Livrée: {relative(row.delivered_at)}</p><p className="mt-1 text-[10px] font-bold text-slate-600">Reçue: {relative(row.received_at)}</p><p className="mt-1 text-[10px] font-bold text-slate-600">Terminée: {relative(row.completed_at || row.failed_at)}</p>{row.failure_reason ? <p className="mt-2 max-w-sm text-[10px] font-black text-red-700">{row.failure_reason}</p> : null}</td><td className="p-4"><div className="flex flex-wrap gap-2">{["failed", "expired", "cancelled"].includes(row.status) ? <button disabled={busy !== null || Number(row.retry_count || 0) >= Number(row.max_retries || 3)} onClick={() => void commandAction(row, "retry")} className="inline-flex h-9 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-black text-blue-700 disabled:opacity-40"><RotateCcw className="h-4 w-4" />Réessayer</button> : null}{["created", "delivered", "received"].includes(row.status) ? <button disabled={busy !== null} onClick={() => void commandAction(row, "cancel")} className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700"><XCircle className="h-4 w-4" />Annuler</button> : null}</div></td></tr>)}</tbody></table></div>{!(data?.commands || []).length ? <div className="p-6"><Empty>Aucune commande enregistrée.</Empty></div> : null}</section> : null}

    {drawer && data ? <DeviceDrawer device={drawer} overview={data} onClose={() => setDrawer(null)} reload={async () => { await load(true); const fresh = (await api<WhatsAppControlPlaneOverview>("/api/whatsapp-desktop/control-plane/overview")).devices.find((row) => row.id === drawer.id); if (fresh) setDrawer(fresh) }} /> : null}
  </div>
}
