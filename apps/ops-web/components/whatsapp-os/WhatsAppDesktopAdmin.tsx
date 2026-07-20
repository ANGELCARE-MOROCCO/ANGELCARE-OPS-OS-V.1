"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Command,
  Cpu,
  FileClock,
  History,
  KeyRound,
  Laptop2,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  MessageCircleMore,
  Plus,
  RefreshCw,
  Save,
  Send,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react"
import type { WhatsAppGovernanceAdminOverview } from "@/lib/whatsapp-desktop/types"
import type { LucideIcon } from "lucide-react"

type Row = Record<string, any>
type Tab = "overview" | "workspaces" | "assignments" | "devices" | "requests" | "policies" | "commands" | "security" | "audit"
type StatCard = { icon: LucideIcon; label: string; value: string | number; color: "blue" | "violet" | "slate" | "green" | "amber" | "red" }
type WorkspaceMetric = { icon: LucideIcon; label: string; value: string | number }

const tabs: Array<{ id: Tab; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Vue exécutive", icon: LayoutDashboard },
  { id: "workspaces", label: "Espaces WhatsApp", icon: MessageCircleMore },
  { id: "assignments", label: "Utilisateurs assignés", icon: Users },
  { id: "devices", label: "Appareils", icon: Laptop2 },
  { id: "requests", label: "Demandes d’accès", icon: UserPlus },
  { id: "policies", label: "Politiques", icon: Settings2 },
  { id: "commands", label: "Commandes distantes", icon: Command },
  { id: "security", label: "Sécurité", icon: ShieldAlert },
  { id: "audit", label: "Audit", icon: History },
]

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", ...(init?.headers || {}) } })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || `HTTP_${response.status}`)
  return payload.data as T
}

function relative(value: string | null | undefined) {
  if (!value) return "Jamais"
  const delta = Date.now() - new Date(value).getTime()
  if (delta < 60_000) return "À l’instant"
  if (delta < 3_600_000) return `Il y a ${Math.floor(delta / 60_000)} min`
  if (delta < 86_400_000) return `Il y a ${Math.floor(delta / 3_600_000)} h`
  return new Date(value).toLocaleDateString("fr-FR")
}

function userName(row: Row | null | undefined) {
  if (!row) return "Utilisateur inconnu"
  return row.display_name || row.full_name || row.name || [row.first_name, row.last_name].filter(Boolean).join(" ") || row.email || row.id
}

function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "green" | "blue" | "amber" | "red" | "violet" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
  }
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.13em] ${tones[tone]}`}>{children}</span>
}

function statusTone(value: string) {
  if (["active", "approved", "completed", "linked", "resolved"].includes(value)) return "green" as const
  if (["pending", "created", "delivered", "qr_required", "attention"].includes(value)) return "amber" as const
  if (["revoked", "rejected", "compromised", "failed", "critical", "suspended"].includes(value)) return "red" as const
  return "slate" as const
}

export default function WhatsAppDesktopAdmin() {
  const [tab, setTab] = useState<Tab>("overview")
  const [data, setData] = useState<WhatsAppGovernanceAdminOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [workspaceForm, setWorkspaceForm] = useState({ code: "", name: "", description: "", phone_number_e164: "", department: "", owner_user_id: "", security_level: "standard", maximum_devices: 4, status: "active" })
  const [assignmentForm, setAssignmentForm] = useState({ workspace_id: "", user_id: "", role: "operator", valid_until: "" })
  const [deviceWorkspace, setDeviceWorkspace] = useState<Record<string, string>>({})
  const [commandForm, setCommandForm] = useState({ device_id: "", workspace_id: "", command_type: "REFRESH_AUTHORIZATION", reason: "Contrôle administratif ANGELCARE" })
  const [policyWorkspaceId, setPolicyWorkspaceId] = useState("")
  const [policy, setPolicy] = useState<Row | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const overview = await api<WhatsAppGovernanceAdminOverview>("/api/whatsapp-desktop/admin/overview")
      setData(overview)
      if (!workspaceForm.owner_user_id && overview.users[0]?.id) setWorkspaceForm((current) => ({ ...current, owner_user_id: String(overview.users[0].id) }))
      if (!assignmentForm.workspace_id && overview.workspaces[0]?.id) setAssignmentForm((current) => ({ ...current, workspace_id: String(overview.workspaces[0].id) }))
      if (!assignmentForm.user_id && overview.users[0]?.id) setAssignmentForm((current) => ({ ...current, user_id: String(overview.users[0].id) }))
      if (!commandForm.device_id && overview.devices[0]?.id) setCommandForm((current) => ({ ...current, device_id: String(overview.devices[0].id) }))
      if (!policyWorkspaceId && overview.workspaces[0]?.id) setPolicyWorkspaceId(String(overview.workspaces[0].id))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setLoading(false)
    }
  }, [assignmentForm.user_id, assignmentForm.workspace_id, commandForm.device_id, policyWorkspaceId, workspaceForm.owner_user_id])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (!policyWorkspaceId) return
    void api<Row>(`/api/whatsapp-desktop/policies?workspaceId=${encodeURIComponent(policyWorkspaceId)}`).then(setPolicy).catch((cause) => setError(cause.message))
  }, [policyWorkspaceId])

  const run = useCallback(async (key: string, task: () => Promise<unknown>, success: string) => {
    setBusy(key); setError(null); setNotice(null)
    try { await task(); setNotice(success); await load() }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)) }
    finally { setBusy(null) }
  }, [load])

  const onlineCutoff = Date.now() - 180_000
  const workspaceById = useMemo(() => new Map((data?.workspaces || []).map((row) => [row.id, row])), [data?.workspaces])

  if (loading && !data) return <main className="grid min-h-screen place-items-center bg-slate-50"><div className="text-center"><LoaderCircle className="mx-auto h-10 w-10 animate-spin text-emerald-600" /><p className="mt-4 text-sm font-black text-slate-800">Chargement du contrôle central WhatsApp Desktop…</p></div></main>

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff,#f8fafc)] p-4 lg:p-7">
      <section className="mx-auto max-w-[1800px] overflow-hidden rounded-[34px] border border-white bg-white shadow-[0_30px_100px_rgba(15,23,42,.11)] ring-1 ring-slate-200/80">
        <header className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(135deg,#ffffff,#eff6ff_52%,#ecfdf5)] px-5 py-6 lg:px-8 lg:py-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-5">
            <div><div className="flex flex-wrap items-center gap-2"><Badge tone="green">Mega ZIP 3</Badge><Badge tone="blue">Governance Control Plane</Badge></div><h1 className="mt-4 text-3xl font-black tracking-[-0.055em] text-slate-950 lg:text-5xl">Administration WhatsApp Desktop</h1><p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-600">Espaces, utilisateurs, appareils, baux d’autorisation, politiques, révocations, commandes distantes et audit — sans centraliser les cookies ou messages WhatsApp.</p></div>
            <div className="flex gap-2"><Link href="/whatsapp-os/web-session" className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 shadow-sm"><MessageCircleMore className="h-4 w-4" />Workspace</Link><button onClick={() => void load()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Actualiser</button></div>
          </div>
          {data ? <div className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">{([
            { icon: MessageCircleMore, label: "Espaces actifs", value: data.counts.active_workspaces, color: "blue" },
            { icon: Users, label: "Affectations", value: data.counts.active_assignments, color: "violet" },
            { icon: Laptop2, label: "Appareils", value: data.counts.devices, color: "slate" },
            { icon: Wifi, label: "En ligne", value: data.counts.online_devices, color: "green" },
            { icon: Clock3, label: "En attente", value: data.counts.pending_devices + data.counts.pending_requests, color: "amber" },
            { icon: ShieldAlert, label: "Alertes ouvertes", value: data.counts.open_security_events, color: data.counts.open_security_events ? "red" : "green" },
          ] satisfies StatCard[]).map(({ icon: Icon, label, value, color }: StatCard) => <div key={String(label)} className="rounded-[20px] border border-white/90 bg-white/85 p-4 shadow-sm backdrop-blur"><Icon className={`h-4 w-4 ${color === "green" ? "text-emerald-600" : color === "red" ? "text-red-600" : color === "amber" ? "text-amber-600" : color === "violet" ? "text-violet-600" : color === "blue" ? "text-blue-600" : "text-slate-600"}`} /><p className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950">{String(value)}</p><p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">{String(label)}</p></div>)}</div> : null}
        </header>

        <nav className="sticky top-0 z-30 flex gap-1 overflow-x-auto border-b border-slate-200 bg-white/95 p-2 backdrop-blur lg:px-5">
          {tabs.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => setTab(item.id)} className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-black transition ${tab === item.id ? "bg-slate-950 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}><Icon className="h-4 w-4" />{item.label}</button> })}
        </nav>

        {(error || notice) ? <div className={`mx-5 mt-5 rounded-xl border px-4 py-3 text-xs font-black lg:mx-7 ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error || notice}</div> : null}

        <div className="p-5 lg:p-7">
          {tab === "overview" && data ? <Overview data={data} /> : null}

          {tab === "workspaces" && data ? (
            <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
              <form onSubmit={(event) => { event.preventDefault(); void run("create-workspace", () => api("/api/whatsapp-desktop/workspaces", { method: "POST", body: JSON.stringify({ ...workspaceForm, reason: "Création depuis le cockpit Mega ZIP 3" }) }), "Espace WhatsApp créé.") }} className="h-fit rounded-[26px] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-3"><Plus className="h-5 w-5 text-emerald-600" /><h2 className="text-lg font-black text-slate-950">Créer un espace</h2></div>
                <div className="mt-5 grid gap-3">{[
                  ["Code", "code", "COMMERCIAL"], ["Nom", "name", "ANGELCARE Commercial"], ["Numéro E.164", "phone_number_e164", "+212723211143"], ["Département", "department", "Développement commercial"],
                ].map(([label, key, placeholder]) => <label key={key} className="text-xs font-black text-slate-600">{label}<input value={(workspaceForm as any)[key]} onChange={(event) => setWorkspaceForm({ ...workspaceForm, [key]: event.target.value })} placeholder={placeholder} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-400" /></label>)}
                  <label className="text-xs font-black text-slate-600">Propriétaire<select value={workspaceForm.owner_user_id} onChange={(event) => setWorkspaceForm({ ...workspaceForm, owner_user_id: event.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold">{data.users.map((user: Row) => <option key={user.id} value={user.id}>{userName(user)}</option>)}</select></label>
                  <label className="text-xs font-black text-slate-600">Description<textarea value={workspaceForm.description} onChange={(event) => setWorkspaceForm({ ...workspaceForm, description: event.target.value })} className="mt-1.5 min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold" /></label>
                </div>
                <button disabled={busy !== null || !workspaceForm.name || !workspaceForm.code} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-black text-white disabled:opacity-50">{busy === "create-workspace" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Créer l’espace</button>
              </form>
              <div className="grid gap-4 md:grid-cols-2">{data.workspaces.map((workspace) => <div key={workspace.id} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-lg font-black text-slate-950">{workspace.name}</p><p className="mt-1 text-xs font-bold text-slate-500">{workspace.code} · {workspace.department || "Sans département"}</p></div><Badge tone={statusTone(workspace.status)}>{workspace.status}</Badge></div><p className="mt-4 text-sm font-semibold leading-6 text-slate-600">{workspace.description || "Aucune description."}</p><div className="mt-5 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-slate-50 p-3"><p className="font-bold text-slate-400">Numéro</p><p className="mt-1 font-black text-slate-900">{workspace.phone_number_e164 || "À lier"}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="font-bold text-slate-400">Appareils max.</p><p className="mt-1 font-black text-slate-900">{workspace.maximum_devices}</p></div></div></div>)}</div>
            </div>
          ) : null}

          {tab === "assignments" && data ? (
            <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
              <form onSubmit={(event) => { event.preventDefault(); void run("create-assignment", () => api("/api/whatsapp-desktop/assignments", { method: "POST", body: JSON.stringify({ ...assignmentForm, valid_until: assignmentForm.valid_until || null, reason: "Affectation depuis le cockpit Mega ZIP 3" }) }), "Utilisateur affecté.") }} className="h-fit rounded-[26px] border border-slate-200 bg-slate-50 p-5"><div className="flex items-center gap-3"><UserCheck className="h-5 w-5 text-violet-600" /><h2 className="text-lg font-black text-slate-950">Nouvelle affectation</h2></div><div className="mt-5 space-y-3"><label className="block text-xs font-black text-slate-600">Espace<select value={assignmentForm.workspace_id} onChange={(event) => setAssignmentForm({ ...assignmentForm, workspace_id: event.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold">{data.workspaces.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label><label className="block text-xs font-black text-slate-600">Utilisateur<select value={assignmentForm.user_id} onChange={(event) => setAssignmentForm({ ...assignmentForm, user_id: event.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold">{data.users.map((row: Row) => <option key={row.id} value={row.id}>{userName(row)}</option>)}</select></label><label className="block text-xs font-black text-slate-600">Rôle<select value={assignmentForm.role} onChange={(event) => setAssignmentForm({ ...assignmentForm, role: event.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold">{["owner","administrator","supervisor","operator","auditor"].map((role) => <option key={role}>{role}</option>)}</select></label><label className="block text-xs font-black text-slate-600">Fin de validité<input type="datetime-local" value={assignmentForm.valid_until} onChange={(event) => setAssignmentForm({ ...assignmentForm, valid_until: event.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" /></label></div><button disabled={busy !== null} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-black text-white"><UserPlus className="h-4 w-4" />Affecter</button></form>
              <div className="overflow-hidden rounded-[24px] border border-slate-200"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-[9px] font-black uppercase tracking-[0.13em] text-slate-400"><tr><th className="p-4">Utilisateur</th><th className="p-4">Espace</th><th className="p-4">Rôle</th><th className="p-4">État</th><th className="p-4 text-right">Action</th></tr></thead><tbody>{data.assignments.map((row: Row) => <tr key={row.id} className="border-t border-slate-100"><td className="p-4"><p className="font-black text-slate-900">{userName(row.user)}</p><p className="mt-1 text-[10px] font-semibold text-slate-400">{row.user?.email}</p></td><td className="p-4 font-bold text-slate-700">{row.workspace?.name}</td><td className="p-4"><Badge tone="violet">{row.role}</Badge></td><td className="p-4"><Badge tone={statusTone(row.status)}>{row.status}</Badge></td><td className="p-4 text-right">{row.status === "active" ? <button onClick={() => { const reason = window.prompt("Motif de révocation", "Fin d’autorisation WhatsApp Desktop"); if (reason) void run(`revoke:${row.id}`, () => api(`/api/whatsapp-desktop/assignments/${row.id}/revoke`, { method: "POST", body: JSON.stringify({ reason, clear_session: false }) }), "Affectation révoquée.") }} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 font-black text-red-700">Révoquer</button> : null}</td></tr>)}</tbody></table></div>
            </div>
          ) : null}

          {tab === "devices" && data ? <DeviceWorkspace data={data} busy={busy} deviceWorkspace={deviceWorkspace} setDeviceWorkspace={setDeviceWorkspace} run={run} /> : null}
          {tab === "requests" && data ? <RequestsWorkspace data={data} busy={busy} run={run} /> : null}
          {tab === "policies" && data ? <PolicyWorkspace data={data} workspaceId={policyWorkspaceId} setWorkspaceId={setPolicyWorkspaceId} policy={policy} setPolicy={setPolicy} busy={busy} run={run} /> : null}
          {tab === "commands" && data ? <CommandsWorkspace data={data} form={commandForm} setForm={setCommandForm} busy={busy} run={run} /> : null}
          {tab === "security" && data ? <EventsWorkspace rows={data.security_events} kind="security" /> : null}
          {tab === "audit" && data ? <EventsWorkspace rows={data.audit_events} kind="audit" /> : null}
        </div>
      </section>
    </main>
  )
}

function Overview({ data }: { data: WhatsAppGovernanceAdminOverview }) {
  const attentionDevices = data.devices.filter((row: Row) => ["pending", "suspended", "revoked", "compromised"].includes(row.approval_status)).slice(0, 8)
  const recentEvents = data.security_events.slice(0, 8)
  return <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]"><div><h2 className="text-lg font-black text-slate-950">Posture des espaces</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{data.workspaces.map((workspace) => <div key={workspace.id} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="text-base font-black text-slate-950">{workspace.name}</p><p className="mt-1 text-xs font-semibold text-slate-500">{workspace.department || workspace.code}</p></div><Badge tone={statusTone(workspace.status)}>{workspace.status}</Badge></div><div className="mt-5 grid grid-cols-3 gap-2">{[
    { icon: Users, label: "Utilisateurs", value: data.assignments.filter((row: Row) => row.workspace_id === workspace.id && row.status === "active").length },
    { icon: Laptop2, label: "Appareils", value: data.devices.filter((device: Row) => device.workspace_access?.some((access: Row) => access.workspace_id === workspace.id && access.status === "approved")).length },
    { icon: KeyRound, label: "Sécurité", value: workspace.security_level },
  ].map(({ icon: Icon, label, value }: WorkspaceMetric) => <div key={String(label)} className="rounded-xl bg-slate-50 p-3"><Icon className="h-3.5 w-3.5 text-slate-500" /><p className="mt-2 text-xs font-black text-slate-900">{String(value)}</p><p className="mt-1 text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">{String(label)}</p></div>)}</div></div>)}</div></div><div className="space-y-5"><div className="rounded-[24px] border border-slate-200 p-5"><h2 className="text-lg font-black text-slate-950">Appareils à traiter</h2><div className="mt-4 space-y-3">{attentionDevices.length ? attentionDevices.map((device: Row) => <div key={device.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div><p className="text-xs font-black text-slate-900">{device.device_name}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{userName(device.user)} · {device.platform}</p></div><Badge tone={statusTone(device.approval_status)}>{device.approval_status}</Badge></div>) : <p className="text-xs font-semibold text-slate-500">Aucun appareil en anomalie.</p>}</div></div><div className="rounded-[24px] border border-slate-200 p-5"><h2 className="text-lg font-black text-slate-950">Signaux sécurité récents</h2><div className="mt-4 space-y-3">{recentEvents.map((event: Row) => <div key={event.id} className="flex gap-3 rounded-xl bg-slate-50 p-3"><AlertTriangle className={`mt-0.5 h-4 w-4 ${event.severity === "critical" ? "text-red-600" : event.severity === "high" ? "text-orange-600" : "text-amber-600"}`} /><div><p className="text-xs font-black text-slate-900">{event.title}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{relative(event.created_at)} · {event.severity}</p></div></div>)}</div></div></div></div>
}

function DeviceWorkspace({ data, busy, deviceWorkspace, setDeviceWorkspace, run }: any) {
  return <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{data.devices.map((device: Row) => { const online = device.last_heartbeat_at && new Date(device.last_heartbeat_at).getTime() > Date.now() - 180_000; const selected = deviceWorkspace[device.id] || data.workspaces[0]?.id || ""; return <div key={device.id} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><div className={`grid h-11 w-11 place-items-center rounded-2xl ${online ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>{online ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}</div><div><p className="text-sm font-black text-slate-950">{device.device_name}</p><p className="mt-1 text-xs font-semibold text-slate-500">{userName(device.user)} · {device.platform}/{device.architecture}</p></div></div><Badge tone={statusTone(device.approval_status)}>{device.approval_status}</Badge></div><dl className="mt-5 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-slate-50 p-3"><dt className="font-bold text-slate-400">Dernier signal</dt><dd className="mt-1 font-black text-slate-900">{relative(device.last_heartbeat_at)}</dd></div><div className="rounded-xl bg-slate-50 p-3"><dt className="font-bold text-slate-400">WhatsApp</dt><dd className="mt-1 font-black text-slate-900">{device.whatsapp_link_state}</dd></div><div className="rounded-xl bg-slate-50 p-3"><dt className="font-bold text-slate-400">Version</dt><dd className="mt-1 font-black text-slate-900">{device.desktop_version || "—"}</dd></div><div className="rounded-xl bg-slate-50 p-3"><dt className="font-bold text-slate-400">Installation</dt><dd className="mt-1 truncate font-mono text-[9px] font-bold text-slate-700">{device.installation_id}</dd></div></dl>{device.approval_status === "pending" ? <div className="mt-4"><select value={selected} onChange={(event) => setDeviceWorkspace({ ...deviceWorkspace, [device.id]: event.target.value })} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-black">{data.workspaces.map((row: Row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select><button disabled={busy !== null} onClick={() => run(`approve:${device.id}`, () => api(`/api/whatsapp-desktop/devices/${device.id}/approve`, { method: "POST", body: JSON.stringify({ workspace_ids: [selected], reason: "Appareil vérifié et approuvé" }) }), "Appareil approuvé.")} className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-black text-white"><CheckCircle2 className="h-4 w-4" />Approuver</button></div> : <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => { const reason = window.prompt("Motif de suspension", "Suspension administrative temporaire"); if (reason) void run(`suspend:${device.id}`, () => api(`/api/whatsapp-desktop/devices/${device.id}/suspend`, { method: "POST", body: JSON.stringify({ reason }) }), "Appareil suspendu.") }} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">Suspendre</button><button onClick={() => { const reason = window.prompt("Motif de révocation", "Fin d’autorisation ou appareil perdu"); if (reason) void run(`revoke-device:${device.id}`, () => api(`/api/whatsapp-desktop/devices/${device.id}/revoke`, { method: "POST", body: JSON.stringify({ reason, emergency: false }) }), "Appareil révoqué.") }} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700">Révoquer</button><button onClick={() => { const reason = window.prompt("Incident de sécurité", "Appareil perdu ou compromis"); if (reason) void run(`compromise:${device.id}`, () => api(`/api/whatsapp-desktop/devices/${device.id}/revoke`, { method: "POST", body: JSON.stringify({ reason, emergency: true }) }), "Appareil déclaré compromis.") }} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Urgence</button></div>}</div> })}</div>
}

function RequestsWorkspace({ data, busy, run }: any) { return <div className="grid gap-4 lg:grid-cols-2">{data.requests.map((row: Row) => <div key={row.id} className="rounded-[24px] border border-slate-200 p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-slate-950">{userName(row.user)}</p><p className="mt-1 text-xs font-semibold text-slate-500">{row.workspace?.name} · {row.device?.device_name || "Appareil non précisé"}</p></div><Badge tone={statusTone(row.status)}>{row.status}</Badge></div><p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-700">{row.business_reason}</p>{row.status === "pending" ? <div className="mt-4 flex gap-2"><button disabled={busy !== null} onClick={() => run(`approve-request:${row.id}`, () => api(`/api/whatsapp-desktop/access-requests/${row.id}/decide`, { method: "POST", body: JSON.stringify({ decision: "approved", role: "operator", reason: "Besoin métier validé" }) }), "Demande approuvée.")} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-black text-white"><UserCheck className="h-4 w-4" />Approuver</button><button disabled={busy !== null} onClick={() => run(`reject-request:${row.id}`, () => api(`/api/whatsapp-desktop/access-requests/${row.id}/decide`, { method: "POST", body: JSON.stringify({ decision: "rejected", reason: "Accès non justifié" }) }), "Demande rejetée.")} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-xs font-black text-red-700"><XCircle className="h-4 w-4" />Rejeter</button></div> : null}</div>)}</div> }

function PolicyWorkspace({ data, workspaceId, setWorkspaceId, policy, setPolicy, busy, run }: any) {
  if (!policy) return <LoaderCircle className="h-8 w-8 animate-spin text-emerald-600" />
  const boolFields = [
    ["require_new_device_approval", "Approbation obligatoire"], ["clear_session_on_revocation", "Effacer session après révocation"],
    ["allow_downloads", "Téléchargements"], ["allow_uploads", "Téléversements"], ["allow_microphone", "Microphone"],
    ["allow_camera", "Caméra"], ["allow_notifications", "Notifications"], ["allow_external_open", "Ouverture externe"],
    ["allow_local_cache_clear", "Effacement cache local"], ["allow_local_session_clear", "Effacement session local"],
  ]
  const policyJson = policy.policy_json || {}
  const list = (value: unknown) => Array.isArray(value) ? value.join(", ") : ""
  const setPolicyJson = (patch: Record<string, unknown>) => setPolicy({ ...policy, policy_json: { ...policyJson, ...patch } })
  return <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
    <div className="rounded-[24px] border border-slate-200 p-4"><p className="text-sm font-black text-slate-950">Espace configuré</p><select value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)} className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-black">{data.workspaces.map((row: Row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select><p className="mt-4 text-xs font-semibold leading-5 text-slate-500">Les politiques desktop sont appliquées au prochain renouvellement de bail. Les règles Mega ZIP 4 limitent aussi les contextes business, les documents et la clôture opérateur.</p></div>
    <form onSubmit={(event) => { event.preventDefault(); void run("save-policy", () => api("/api/whatsapp-desktop/policies", { method: "PATCH", body: JSON.stringify({ ...policy, workspace_id: workspaceId, reason: "Mise à jour politique WhatsApp Desktop Mega ZIP 4" }) }), "Politique enregistrée.") }} className="rounded-[24px] border border-slate-200 p-5">
      <div className="grid gap-4 md:grid-cols-3">{[["lease_duration_minutes","Durée du bail (min)"],["offline_grace_minutes","Grâce hors ligne (min)"],["maximum_devices_per_user","Appareils par utilisateur"],["maximum_users","Utilisateurs maximum"],["heartbeat_active_seconds","Heartbeat actif (sec)"],["heartbeat_background_seconds","Heartbeat arrière-plan (sec)"]].map(([key,label]) => <label key={key} className="text-xs font-black text-slate-600">{label}<input type="number" value={policy[key] ?? 0} onChange={(event) => setPolicy({ ...policy, [key]: Number(event.target.value) })} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-black" /></label>)}</div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">{boolFields.map(([key,label]) => <label key={key} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-black text-slate-700"><span>{label}</span><input type="checkbox" checked={Boolean(policy[key])} onChange={(event) => setPolicy({ ...policy, [key]: event.target.checked })} className="h-4 w-4" /></label>)}</div>
      <div className="mt-6 rounded-[22px] border border-violet-100 bg-violet-50/50 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.14em] text-violet-700">Mega ZIP 4 · Contexte business</p><p className="mt-1 text-xs font-semibold text-violet-900">Laissez la liste des types vide pour autoriser tous les adaptateurs.</p></div><label className="flex items-center gap-2 text-xs font-black text-violet-900"><input type="checkbox" checked={policyJson.required_outcome_capture !== false} onChange={(event) => setPolicyJson({ required_outcome_capture: event.target.checked })} className="h-4 w-4" />Résultat obligatoire</label></div>
        <div className="mt-4 grid gap-4 md:grid-cols-2"><label className="text-xs font-black text-slate-600">Types de contexte autorisés<textarea value={list(policyJson.allowed_context_types)} onChange={(event) => setPolicyJson({ allowed_context_types: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} placeholder="b2b_prospect, support_case, quotation" className="mt-1.5 min-h-24 w-full rounded-xl border border-violet-100 bg-white p-3 text-sm font-semibold" /></label><label className="text-xs font-black text-slate-600">Résultats exigeant une prochaine action<textarea value={list(policyJson.required_next_action_outcomes)} onChange={(event) => setPolicyJson({ required_next_action_outcomes: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} placeholder="followup_required, call_back, payment_promised" className="mt-1.5 min-h-24 w-full rounded-xl border border-violet-100 bg-white p-3 text-sm font-semibold" /></label><label className="text-xs font-black text-slate-600">Catégories de documents autorisées<input value={list(policyJson.allowed_document_categories)} onChange={(event) => setPolicyJson({ allowed_document_categories: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} placeholder="quotation, invoice, brochure" className="mt-1.5 h-11 w-full rounded-xl border border-violet-100 bg-white px-3 text-sm font-semibold" /></label><label className="text-xs font-black text-slate-600">Langue de message par défaut<select value={policyJson.default_message_language || "fr"} onChange={(event) => setPolicyJson({ default_message_language: event.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-violet-100 bg-white px-3 text-sm font-black"><option value="fr">Français</option><option value="en">English</option><option value="ar">العربية</option></select></label></div>
      </div>
      <label className="mt-5 block text-xs font-black text-slate-600">Version minimale<input value={policy.minimum_desktop_version || "1.3.0"} onChange={(event) => setPolicy({ ...policy, minimum_desktop_version: event.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-black" /></label><button disabled={busy !== null} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white"><Save className="h-4 w-4" />Enregistrer la politique</button>
    </form>
  </div>
}

function CommandsWorkspace({ data, form, setForm, busy, run }: any) { return <div className="grid gap-6 xl:grid-cols-[420px_1fr]"><form onSubmit={(event) => { event.preventDefault(); void run("issue-command", () => api("/api/whatsapp-desktop/commands", { method: "POST", body: JSON.stringify(form) }), "Commande distante créée.") }} className="h-fit rounded-[24px] border border-slate-200 bg-slate-50 p-5"><div className="flex items-center gap-3"><Command className="h-5 w-5 text-blue-600" /><h2 className="text-lg font-black text-slate-950">Émettre une commande</h2></div><div className="mt-5 space-y-3"><label className="block text-xs font-black text-slate-600">Appareil<select value={form.device_id} onChange={(event) => setForm({ ...form, device_id: event.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold">{data.devices.map((row: Row) => <option key={row.id} value={row.id}>{row.device_name}</option>)}</select></label><label className="block text-xs font-black text-slate-600">Commande<select value={form.command_type} onChange={(event) => setForm({ ...form, command_type: event.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold">{["HIDE_WHATSAPP_VIEW","SHOW_ACCESS_REVOKED_NOTICE","RELOAD_WHATSAPP_VIEW","RESTART_WHATSAPP_RENDERER","CLEAR_WHATSAPP_CACHE","CLEAR_WHATSAPP_SESSION","REFRESH_AUTHORIZATION","LOG_OUT_ANGELCARE_DESKTOP"].map((row) => <option key={row}>{row}</option>)}</select></label><label className="block text-xs font-black text-slate-600">Motif<textarea value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} className="mt-1.5 min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold" /></label></div><button disabled={busy !== null} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 text-sm font-black text-white"><Send className="h-4 w-4" />Émettre</button></form><div className="space-y-3">{data.commands.map((row: Row) => <div key={row.id} className="rounded-[20px] border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black text-slate-950">{row.command_type}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{row.device?.device_name} · {relative(row.issued_at)}</p></div><Badge tone={statusTone(row.status)}>{row.status}</Badge></div><p className="mt-3 text-xs font-semibold text-slate-600">{row.reason}</p></div>)}</div></div> }

function EventsWorkspace({ rows, kind }: { rows: Row[]; kind: "security" | "audit" }) { return <div className="overflow-hidden rounded-[24px] border border-slate-200"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-[9px] font-black uppercase tracking-[0.13em] text-slate-400"><tr><th className="p-4">Date</th><th className="p-4">Type</th><th className="p-4">Détail</th><th className="p-4">État</th></tr></thead><tbody>{rows.map((row: Row) => <tr key={row.id} className="border-t border-slate-100 align-top"><td className="p-4 font-bold text-slate-500">{new Date(row.created_at).toLocaleString("fr-FR")}</td><td className="p-4"><p className="font-black text-slate-900">{kind === "security" ? row.title : row.action}</p><p className="mt-1 text-[10px] font-semibold text-slate-400">{row.event_type || row.command_id || "—"}</p></td><td className="max-w-xl p-4 text-xs font-semibold leading-5 text-slate-600">{row.description || row.reason || JSON.stringify(row.new_state || row.metadata || {}).slice(0, 300)}</td><td className="p-4"><Badge tone={statusTone(row.severity || row.status || "recorded")}>{row.severity || row.status || "recorded"}</Badge></td></tr>)}</tbody></table></div> }
