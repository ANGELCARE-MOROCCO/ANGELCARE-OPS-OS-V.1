"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  ArchiveX,
  CheckCircle2,
  ChevronRight,
  CircleOff,
  Clock3,
  Copy,
  Download,
  Filter,
  History,
  KeyRound,
  Laptop2,
  LayoutGrid,
  List,
  LoaderCircle,
  LogOut,
  MonitorCog,
  MoreHorizontal,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserRoundCog,
  Wifi,
  WifiOff,
  X,
} from "lucide-react"
import type { WhatsAppDeviceLifecycleDossier, WhatsAppGovernanceAdminOverview } from "@/lib/whatsapp-desktop/types"

type Row = Record<string, any>
type ViewMode = "cards" | "table"
type ActionId =
  | "approve"
  | "reject"
  | "suspend"
  | "restore"
  | "reinstate"
  | "disconnect_whatsapp"
  | "logout_desktop"
  | "reassign"
  | "revoke"
  | "compromise"
  | "delete"
  | "force_purge"

type ActionConfig = {
  id: ActionId
  label: string
  description: string
  tone: "emerald" | "blue" | "amber" | "red" | "slate" | "violet"
  endpoint: (id: string) => string
  method?: "POST" | "DELETE"
  destructive?: boolean
  requiresName?: boolean
}

const ACTIONS: Record<ActionId, ActionConfig> = {
  approve: { id: "approve", label: "Approuver", description: "Autoriser l’appareil et lui attribuer un espace WhatsApp.", tone: "emerald", endpoint: (id) => `/api/whatsapp-desktop/devices/${id}/approve` },
  reject: { id: "reject", label: "Rejeter", description: "Refuser cette demande d’enrôlement tout en conservant sa preuve d’audit.", tone: "red", endpoint: (id) => `/api/whatsapp-desktop/devices/${id}/reject`, destructive: true },
  suspend: { id: "suspend", label: "Suspendre", description: "Bloquer temporairement l’appareil sans détruire son historique.", tone: "amber", endpoint: (id) => `/api/whatsapp-desktop/devices/${id}/suspend`, destructive: true },
  restore: { id: "restore", label: "Restaurer", description: "Réactiver un appareil suspendu et restaurer ses accès approuvés.", tone: "emerald", endpoint: (id) => `/api/whatsapp-desktop/devices/${id}/restore` },
  reinstate: { id: "reinstate", label: "Réhabiliter", description: "Remettre l’installation en attente d’une nouvelle approbation complète.", tone: "blue", endpoint: (id) => `/api/whatsapp-desktop/devices/${id}/reinstate` },
  disconnect_whatsapp: { id: "disconnect_whatsapp", label: "Déconnecter WhatsApp", description: "Fermer WhatsApp, révoquer le bail actif et effacer la session isolée.", tone: "violet", endpoint: (id) => `/api/whatsapp-desktop/devices/${id}/disconnect-whatsapp`, destructive: true },
  logout_desktop: { id: "logout_desktop", label: "Déconnecter Desktop", description: "Fermer la session ANGELCARE de ce poste tout en conservant son enregistrement.", tone: "slate", endpoint: (id) => `/api/whatsapp-desktop/devices/${id}/logout-desktop`, destructive: true },
  reassign: { id: "reassign", label: "Réaffecter", description: "Changer l’utilisateur et les espaces autorisés, puis forcer une reconnexion propre.", tone: "blue", endpoint: (id) => `/api/whatsapp-desktop/devices/${id}/reassign` },
  revoke: { id: "revoke", label: "Révoquer", description: "Retirer tous les accès de l’installation et invalider ses baux.", tone: "red", endpoint: (id) => `/api/whatsapp-desktop/devices/${id}/revoke`, destructive: true },
  compromise: { id: "compromise", label: "Urgence sécurité", description: "Mettre l’appareil en état compromis, effacer WhatsApp et déconnecter Desktop.", tone: "red", endpoint: (id) => `/api/whatsapp-desktop/devices/${id}/revoke`, destructive: true },
  delete: { id: "delete", label: "Supprimer définitivement", description: "Supprimer l’identité active, conserver un registre d’audit et permettre un réenrôlement propre.", tone: "red", endpoint: (id) => `/api/whatsapp-desktop/devices/${id}`, method: "DELETE", destructive: true, requiresName: true },
  force_purge: { id: "force_purge", label: "Purge forcée", description: "Supprimer immédiatement un appareil compromis ou inaccessible avec autorité renforcée.", tone: "red", endpoint: (id) => `/api/whatsapp-desktop/devices/${id}/force-purge`, destructive: true, requiresName: true },
}

const stateActions: Record<string, ActionId[]> = {
  pending: ["approve", "reject", "delete", "force_purge"],
  approved: ["disconnect_whatsapp", "logout_desktop", "suspend", "reassign", "revoke", "compromise"],
  suspended: ["restore", "disconnect_whatsapp", "logout_desktop", "revoke", "delete", "force_purge"],
  rejected: ["reinstate", "delete", "force_purge"],
  revoked: ["reinstate", "delete", "force_purge"],
  compromised: ["disconnect_whatsapp", "logout_desktop", "force_purge"],
}

const toneClass = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  blue: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
  amber: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
  red: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  slate: "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100",
  violet: "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100",
}

function api<T>(url: string, init?: RequestInit): Promise<T> {
  return fetch(url, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", ...(init?.headers || {}) } })
    .then(async (response) => {
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || `HTTP_${response.status}`)
      return payload.data as T
    })
}

function userName(row: Row | null | undefined) {
  return row?.display_name || row?.full_name || row?.name || row?.email || "Utilisateur non affecté"
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

function stateLabel(value: string) {
  return ({ pending: "En attente", approved: "Approuvé", suspended: "Suspendu", revoked: "Révoqué", rejected: "Rejeté", compromised: "Compromis" } as Record<string, string>)[value] || value
}

function StatusPill({ value }: { value: string }) {
  const normalized = String(value || "unknown").toLowerCase()
  const className = ["approved", "active", "completed", "linked", "resolved"].includes(normalized)
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : ["pending", "created", "delivered", "received", "executing", "qr_required", "suspended"].includes(normalized)
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : ["revoked", "rejected", "compromised", "failed", "expired", "cancelled"].includes(normalized)
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-slate-200 bg-slate-50 text-slate-700"
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[.13em] ${className}`}>{stateLabel(normalized)}</span>
}

function Stat({ label, value, icon: Icon, tone = "slate" }: { label: string; value: number; icon: typeof Laptop2; tone?: keyof typeof toneClass }) {
  return <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><div className={`grid h-10 w-10 place-items-center rounded-2xl border ${toneClass[tone]}`}><Icon className="h-4 w-4" /></div><span className="text-2xl font-black tracking-[-.04em] text-slate-950">{value}</span></div><p className="mt-3 text-[9px] font-black uppercase tracking-[.16em] text-slate-500">{label}</p></div>
}

function DeviceHealth({ device }: { device: Row }) {
  const online = Boolean(device.online)
  const duplicate = Number(device.duplicate_name_count || 1) > 1
  return <div className="flex flex-wrap items-center gap-2">
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] ${online ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>{online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}{online ? "En ligne" : "Hors ligne"}</span>
    {duplicate ? <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] text-amber-700"><Copy className="h-3 w-3" />Doublon probable ×{device.duplicate_name_count}</span> : null}
  </div>
}

function ActionModal({ device, action, workspaces, users, onClose, onComplete }: { device: Row; action: ActionConfig; workspaces: Row[]; users: Row[]; onClose: () => void; onComplete: (message: string) => Promise<void> }) {
  const [reason, setReason] = useState(action.id === "restore" ? "Restauration administrative contrôlée" : action.id === "disconnect_whatsapp" ? "Déconnexion WhatsApp demandée par l’administration" : action.id === "logout_desktop" ? "Déconnexion Desktop demandée par l’administration" : "Action administrative gouvernée")
  const [confirmationName, setConfirmationName] = useState("")
  const [ack, setAck] = useState(false)
  const [workspaceId, setWorkspaceId] = useState(workspaces[0]?.id || "")
  const [userId, setUserId] = useState(device.current_user_id || users[0]?.id || "")
  const [workspaceIds, setWorkspaceIds] = useState<string[]>(device.workspace_access?.filter((row: Row) => row.status === "approved").map((row: Row) => row.workspace_id) || [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const destructiveReady = !action.requiresName || (confirmationName === device.device_name && ack)
  const submit = async () => {
    if (!reason.trim()) return setError("Un motif professionnel est obligatoire.")
    if (!destructiveReady) return setError("La confirmation de suppression est incomplète.")
    setBusy(true); setError(null)
    try {
      const body: Row = { reason }
      if (action.id === "approve") body.workspace_ids = [workspaceId]
      if (action.id === "reassign") { body.user_id = userId; body.workspace_ids = workspaceIds }
      if (action.id === "compromise") body.emergency = true
      if (action.requiresName) { body.confirmation_name = confirmationName; body.acknowledge_irreversible = ack }
      await api(action.endpoint(device.id), { method: action.method || "POST", body: JSON.stringify(body) })
      await onComplete(`${action.label} exécuté avec succès pour ${device.device_name}.`)
      onClose()
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)) }
    finally { setBusy(false) }
  }
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_35px_120px_rgba(15,23,42,.35)]">
      <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#fff,#f8fafc)] p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400">Action gouvernée</p><h3 className="mt-2 text-2xl font-black tracking-[-.04em] text-slate-950">{action.label}</h3><p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">{action.description}</p></div><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500"><X className="h-4 w-4" /></button></div></div>
      <div className="space-y-5 p-6">
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3"><div><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">Appareil</p><p className="mt-1 text-sm font-black text-slate-950">{device.device_name}</p></div><div><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">Utilisateur</p><p className="mt-1 text-sm font-black text-slate-950">{userName(device.user)}</p></div><div><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">État actuel</p><div className="mt-1"><StatusPill value={device.approval_status} /></div></div></div>
        {action.id === "approve" ? <label className="block text-xs font-black text-slate-700">Espace initial<select value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold">{workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}</select></label> : null}
        {action.id === "reassign" ? <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-black text-slate-700">Nouvel utilisateur<select value={userId} onChange={(event) => setUserId(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold">{users.map((user) => <option key={user.id} value={user.id}>{userName(user)}</option>)}</select></label><div><p className="text-xs font-black text-slate-700">Espaces autorisés</p><div className="mt-2 max-h-36 space-y-2 overflow-auto rounded-xl border border-slate-200 p-3">{workspaces.map((workspace) => <label key={workspace.id} className="flex items-center gap-2 text-xs font-bold text-slate-700"><input type="checkbox" checked={workspaceIds.includes(workspace.id)} onChange={(event) => setWorkspaceIds(event.target.checked ? [...workspaceIds, workspace.id] : workspaceIds.filter((id) => id !== workspace.id))} />{workspace.name}</label>)}</div></div></div> : null}
        <label className="block text-xs font-black text-slate-700">Motif obligatoire<textarea value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold leading-6" /></label>
        {action.requiresName ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4"><div className="flex gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 text-red-600" /><div><p className="text-sm font-black text-red-900">Suppression irréversible de l’identité active</p><p className="mt-1 text-xs font-semibold leading-5 text-red-700">Le registre d’audit sera conservé, mais l’installation sera libérée pour un nouvel enrôlement.</p></div></div><label className="mt-4 block text-xs font-black text-red-900">Saisissez exactement <span className="font-mono">{device.device_name}</span><input value={confirmationName} onChange={(event) => setConfirmationName(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-red-200 bg-white px-3 font-mono text-sm font-bold" /></label><label className="mt-3 flex items-start gap-2 text-xs font-bold text-red-900"><input type="checkbox" checked={ack} onChange={(event) => setAck(event.target.checked)} className="mt-0.5" />Je confirme la suppression irréversible et la libération de l’identifiant d’installation.</label></div> : null}
        {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-black text-red-700">{error}</div> : null}
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4"><button onClick={onClose} className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-xs font-black text-slate-700">Annuler</button><button disabled={busy || !reason.trim() || !destructiveReady} onClick={() => void submit()} className={`inline-flex h-11 items-center gap-2 rounded-xl border px-5 text-xs font-black disabled:cursor-not-allowed disabled:opacity-40 ${toneClass[action.tone]}`}>{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : action.destructive ? <ShieldAlert className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}{action.label}</button></div>
    </div>
  </div>
}

function Dossier({ device, onClose, onAction }: { device: Row; onClose: () => void; onAction: (action: ActionId) => void }) {
  const [data, setData] = useState<WhatsAppDeviceLifecycleDossier | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    setData(null)
    setError(null)
    void api<WhatsAppDeviceLifecycleDossier>(`/api/whatsapp-desktop/devices/${device.id}/lifecycle`)
      .then((next) => { if (active) setData(next) })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : String(cause)) })
    return () => { active = false }
  }, [device.id])
  const actions = stateActions[device.approval_status] || []
  return <div className="fixed inset-0 z-[90] bg-slate-950/35 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><aside className="absolute right-0 top-0 h-full w-full max-w-4xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl"><header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 p-6 backdrop-blur"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><StatusPill value={device.approval_status} /><DeviceHealth device={device} /></div><h2 className="mt-3 text-3xl font-black tracking-[-.05em] text-slate-950">{device.device_name}</h2><p className="mt-2 text-sm font-semibold text-slate-500">{userName(device.user)} · {device.platform}/{device.architecture || "—"} · Desktop {device.desktop_version || "—"}</p></div><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500"><X className="h-4 w-4" /></button></div><div className="mt-5 flex flex-wrap gap-2">{actions.map((id) => <button key={id} onClick={() => onAction(id)} className={`rounded-xl border px-3 py-2 text-xs font-black ${toneClass[ACTIONS[id].tone]}`}>{ACTIONS[id].label}</button>)}</div></header><div className="space-y-6 p-6">
    {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">{error}</div> : null}
    {!data ? <div className="grid min-h-60 place-items-center"><LoaderCircle className="h-8 w-8 animate-spin text-blue-600" /></div> : <>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
        ["Installation", data.device.installation_id], ["Dernier signal", relative(data.device.last_heartbeat_at)], ["Adresse IP", (data.device as Row).last_ip || "Non exposée"], ["État WhatsApp", data.device.whatsapp_link_state], ["Utilisateur courant", userName(device.user)], ["Version OS", data.device.operating_system_version || "—"], ["Première inscription", relative(data.device.first_registered_at)], ["Dernière restauration", relative(data.device.restored_at)],
      ].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">{label}</p><p className="mt-2 break-all text-xs font-black text-slate-900">{value}</p></div>)}</section>
      <section className="rounded-[24px] border border-slate-200 p-5"><h3 className="flex items-center gap-2 text-lg font-black text-slate-950"><KeyRound className="h-5 w-5 text-violet-600" />Accès aux espaces</h3><div className="mt-4 space-y-2">{data.workspace_access.length ? data.workspace_access.map((row: Row) => <div key={row.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><div><p className="text-xs font-black text-slate-900">{row.workspace?.name || row.workspace_id}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{row.reason || "Aucun motif enregistré"}</p></div><StatusPill value={row.status} /></div>) : <p className="text-xs font-semibold text-slate-500">Aucun espace affecté.</p>}</div></section>
      <section className="grid gap-6 lg:grid-cols-2"><div className="rounded-[24px] border border-slate-200 p-5"><h3 className="flex items-center gap-2 text-lg font-black text-slate-950"><Activity className="h-5 w-5 text-emerald-600" />Sessions et baux</h3><div className="mt-4 space-y-2">{data.sessions.slice(0, 12).map((row: Row) => <div key={row.id} className="rounded-xl bg-slate-50 p-3"><div className="flex items-center justify-between"><p className="text-xs font-black text-slate-900">{row.workspace?.name || "Espace"}</p><StatusPill value={row.status} /></div><p className="mt-1 text-[10px] font-semibold text-slate-500">Émis {relative(row.issued_at)} · expire {relative(row.expires_at)}</p></div>)}</div></div><div className="rounded-[24px] border border-slate-200 p-5"><h3 className="flex items-center gap-2 text-lg font-black text-slate-950"><MonitorCog className="h-5 w-5 text-blue-600" />Commandes distantes</h3><div className="mt-4 space-y-2">{data.commands.slice(0, 12).map((row: Row) => <div key={row.id} className="rounded-xl bg-slate-50 p-3"><div className="flex items-center justify-between"><p className="text-xs font-black text-slate-900">{row.command_type}</p><StatusPill value={row.status} /></div><p className="mt-1 text-[10px] font-semibold text-slate-500">{relative(row.issued_at)} · {row.receipts?.length || 0} accusé(s)</p></div>)}</div></div></section>
      <section className="rounded-[24px] border border-slate-200 p-5"><h3 className="flex items-center gap-2 text-lg font-black text-slate-950"><History className="h-5 w-5 text-slate-600" />Chronologie de gouvernance</h3><div className="mt-4 space-y-3">{[...data.audit_events.map((row: Row) => ({ ...row, kind: "audit" })), ...data.security_events.map((row: Row) => ({ ...row, kind: "security" }))].sort((a: Row, b: Row) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 30).map((row: Row) => <div key={`${row.kind}:${row.id}`} className="flex gap-3 rounded-xl bg-slate-50 p-3"><div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${row.kind === "security" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>{row.kind === "security" ? <ShieldAlert className="h-4 w-4" /> : <History className="h-4 w-4" />}</div><div><p className="text-xs font-black text-slate-900">{row.title || row.action || row.event_type}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{relative(row.created_at)} · {row.reason || row.description || "Événement enregistré"}</p></div></div>)}</div></section>
      <details className="rounded-[24px] border border-slate-200 bg-slate-50 p-5"><summary className="cursor-pointer text-sm font-black text-slate-900">Détails techniques et identifiants</summary><pre className="mt-4 overflow-auto rounded-xl bg-slate-950 p-4 text-[10px] leading-5 text-slate-200">{JSON.stringify({ device: data.device, runtime_health: data.device.runtime_health, metadata: data.device.metadata, latest_heartbeats: data.heartbeats.slice(0, 5) }, null, 2)}</pre></details>
    </>}
  </div></aside></div>
}


function BulkActionModal({ count, action, busy, onClose, onSubmit }: { count: number; action: "suspend" | "restore" | "disconnect_whatsapp" | "logout_desktop"; busy: boolean; onClose: () => void; onSubmit: (reason: string) => Promise<void> }) {
  const [reason, setReason] = useState("Traitement groupé gouverné de la flotte ANGELCARE")
  const labels = { suspend: "Suspendre la sélection", restore: "Restaurer la sélection", disconnect_whatsapp: "Déconnecter WhatsApp", logout_desktop: "Déconnecter Desktop" }
  return <div className="fixed inset-0 z-[105] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div className="w-full max-w-xl rounded-[26px] border border-white bg-white p-6 shadow-[0_35px_120px_rgba(15,23,42,.35)]">
      <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-slate-400">Action groupée</p><h3 className="mt-2 text-2xl font-black tracking-[-.04em] text-slate-950">{labels[action]}</h3><p className="mt-2 text-sm font-semibold text-slate-600">{count} appareil(s) seront traités individuellement avec un résultat détaillé par poste.</p></div><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500"><X className="h-4 w-4" /></button></div>
      <label className="mt-5 block text-xs font-black text-slate-700">Motif professionnel<textarea value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold" /></label>
      <div className="mt-5 flex justify-end gap-2"><button onClick={onClose} className="h-11 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-700">Annuler</button><button disabled={busy || !reason.trim()} onClick={() => void onSubmit(reason)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-xs font-black text-white disabled:opacity-40">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}{labels[action]}</button></div>
    </div>
  </div>
}

export default function WhatsAppDeviceFleet({ data, reload, setNotice, setError }: { data: WhatsAppGovernanceAdminOverview; reload: () => Promise<void>; setNotice: (value: string | null) => void; setError: (value: string | null) => void }) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [platform, setPlatform] = useState("all")
  const [workspace, setWorkspace] = useState("all")
  const [view, setView] = useState<ViewMode>("cards")
  const [selected, setSelected] = useState<string[]>([])
  const [dossier, setDossier] = useState<Row | null>(null)
  const [action, setAction] = useState<{ device: Row; config: ActionConfig } | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkAction, setBulkAction] = useState<"suspend" | "restore" | "disconnect_whatsapp" | "logout_desktop" | null>(null)

  const devices = useMemo(() => data.devices.filter((device: Row) => {
    const search = `${device.device_name} ${device.installation_id} ${device.desktop_version} ${device.platform} ${userName(device.user)} ${device.last_ip || ""}`.toLowerCase()
    const inWorkspace = workspace === "all" || device.workspace_access?.some((row: Row) => row.workspace_id === workspace)
    return (!query || search.includes(query.toLowerCase())) && (status === "all" || device.approval_status === status) && (platform === "all" || device.platform === platform) && inWorkspace
  }), [data.devices, platform, query, status, workspace])

  const runBulk = async (reason: string) => {
    if (!selected.length || !bulkAction) return
    setBulkBusy(true); setError(null)
    try {
      const result = await api<Row>("/api/whatsapp-desktop/devices/bulk", { method: "POST", body: JSON.stringify({ device_ids: selected, action: bulkAction, reason }) })
      setNotice(`${result.succeeded} appareil(s) traité(s), ${result.failed} échec(s).`)
      setSelected([])
      setBulkAction(null)
      await reload()
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)) }
    finally { setBulkBusy(false) }
  }

  const complete = async (message: string) => { setNotice(message); setError(null); await reload() }
  const openAction = (device: Row, actionId: ActionId) => setAction({ device, config: ACTIONS[actionId] })
  const allSelected = devices.length > 0 && devices.every((device: Row) => selected.includes(device.id))

  return <div className="space-y-5">
    {data.capabilities?.fleet_lifecycle_migration === false ? <div className="flex gap-3 rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-amber-900"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="text-sm font-black">Migration Fleet Lifecycle requise</p><p className="mt-1 text-xs font-semibold leading-5">Appliquez <span className="font-mono">20260725_whatsapp_desktop_fleet_lifecycle_mega_zip10.sql</span> dans Supabase avant d’utiliser restauration, réhabilitation ou suppression définitive.</p></div></div> : null}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7"><Stat label="Total" value={data.counts.devices || 0} icon={Laptop2} /><Stat label="En ligne" value={data.counts.online_devices || 0} icon={Wifi} tone="emerald" /><Stat label="Approuvés" value={data.counts.approved_devices || 0} icon={ShieldCheck} tone="blue" /><Stat label="Suspendus" value={data.counts.suspended_devices || 0} icon={CircleOff} tone="amber" /><Stat label="Révoqués" value={data.counts.revoked_devices || 0} icon={ArchiveX} tone="red" /><Stat label="Compromis" value={data.counts.compromised_devices || 0} icon={ShieldAlert} tone="red" /><Stat label="Doublons" value={data.counts.duplicate_devices || 0} icon={Copy} tone="violet" /></div>
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center gap-3"><label className="relative min-w-[260px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher appareil, utilisateur, IP, version…" className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm font-semibold" /></label><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black"><option value="all">Tous les états</option>{["pending","approved","suspended","revoked","rejected","compromised"].map((value) => <option key={value} value={value}>{stateLabel(value)}</option>)}</select><select value={platform} onChange={(event) => setPlatform(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black"><option value="all">Toutes plateformes</option><option value="windows">Windows</option><option value="macos">macOS</option><option value="linux">Linux</option></select><select value={workspace} onChange={(event) => setWorkspace(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black"><option value="all">Tous les espaces</option>{data.workspaces.map((row: Row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select><div className="flex rounded-xl border border-slate-200 p-1"><button onClick={() => setView("cards")} className={`grid h-9 w-9 place-items-center rounded-lg ${view === "cards" ? "bg-slate-950 text-white" : "text-slate-500"}`}><LayoutGrid className="h-4 w-4" /></button><button onClick={() => setView("table")} className={`grid h-9 w-9 place-items-center rounded-lg ${view === "table" ? "bg-slate-950 text-white" : "text-slate-500"}`}><List className="h-4 w-4" /></button></div><button onClick={() => { const rows = devices.map((d: Row) => [d.device_name,d.platform,d.desktop_version,d.approval_status,userName(d.user),d.last_heartbeat_at,d.installation_id].map((v) => `"${String(v ?? "").replaceAll('"','""')}"`).join(",")); const blob = new Blob([["device,platform,version,status,user,last_heartbeat,installation_id",...rows].join("\n")], { type: "text/csv;charset=utf-8" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `angelcare-device-fleet-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(a.href) }} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-700"><Download className="h-4 w-4" />Exporter</button></div>
      {selected.length ? <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 p-3"><p className="mr-auto text-xs font-black text-blue-900">{selected.length} appareil(s) sélectionné(s)</p><button disabled={bulkBusy} onClick={() => setBulkAction("suspend")} className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-black text-amber-800">Suspendre</button><button disabled={bulkBusy} onClick={() => setBulkAction("restore")} className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-700">Restaurer</button><button disabled={bulkBusy} onClick={() => setBulkAction("disconnect_whatsapp")} className="rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs font-black text-violet-700">Déconnecter WhatsApp</button><button disabled={bulkBusy} onClick={() => setBulkAction("logout_desktop")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700">Déconnecter Desktop</button></div> : null}
    </div>
    {view === "cards" ? <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{devices.map((device: Row) => <article key={device.id} className="group rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex items-start gap-3"><input type="checkbox" checked={selected.includes(device.id)} onChange={(event) => setSelected(event.target.checked ? [...selected, device.id] : selected.filter((id) => id !== device.id))} className="mt-1" /><div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${device.online ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>{device.online ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><h3 className="truncate text-base font-black text-slate-950">{device.device_name}</h3><p className="mt-1 truncate text-xs font-semibold text-slate-500">{userName(device.user)} · {device.platform}/{device.architecture || "—"}</p></div><StatusPill value={device.approval_status} /></div><div className="mt-3"><DeviceHealth device={device} /></div></div></div><div className="mt-5 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-slate-50 p-3"><p className="font-bold text-slate-400">Dernier signal</p><p className="mt-1 font-black text-slate-900">{relative(device.last_heartbeat_at)}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="font-bold text-slate-400">WhatsApp</p><p className="mt-1 font-black text-slate-900">{device.whatsapp_link_state}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="font-bold text-slate-400">Version</p><p className="mt-1 font-black text-slate-900">{device.desktop_version || "—"}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="font-bold text-slate-400">Espaces</p><p className="mt-1 font-black text-slate-900">{device.workspace_access?.filter((row: Row) => row.status === "approved").length || 0}</p></div></div><div className="mt-4 flex items-center gap-2"><button onClick={() => setDossier(device)} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-xs font-black text-white">Ouvrir le dossier<ChevronRight className="h-4 w-4" /></button>{(stateActions[device.approval_status] || []).slice(0, 2).map((id) => <button key={id} onClick={() => openAction(device, id)} title={ACTIONS[id].label} className={`grid h-10 w-10 place-items-center rounded-xl border ${toneClass[ACTIONS[id].tone]}`}>{id === "restore" || id === "reinstate" ? <RotateCcw className="h-4 w-4" /> : id === "approve" ? <CheckCircle2 className="h-4 w-4" /> : id === "disconnect_whatsapp" ? <CircleOff className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}</button>)}</div></article>)}</div> : <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-[9px] font-black uppercase tracking-[.14em] text-slate-500"><tr><th className="p-4"><input type="checkbox" checked={allSelected} onChange={(event) => setSelected(event.target.checked ? devices.map((row: Row) => row.id) : [])} /></th><th className="p-4">Appareil</th><th className="p-4">Utilisateur</th><th className="p-4">État</th><th className="p-4">Plateforme</th><th className="p-4">Dernier signal</th><th className="p-4">Version</th><th className="p-4 text-right">Dossier</th></tr></thead><tbody>{devices.map((device: Row) => <tr key={device.id} className="border-t border-slate-100 hover:bg-slate-50"><td className="p-4"><input type="checkbox" checked={selected.includes(device.id)} onChange={(event) => setSelected(event.target.checked ? [...selected, device.id] : selected.filter((id) => id !== device.id))} /></td><td className="p-4"><p className="font-black text-slate-950">{device.device_name}</p>{device.duplicate_name_count > 1 ? <p className="mt-1 text-[10px] font-black text-amber-600">Doublon probable ×{device.duplicate_name_count}</p> : null}</td><td className="p-4 font-bold text-slate-700">{userName(device.user)}</td><td className="p-4"><StatusPill value={device.approval_status} /></td><td className="p-4 font-bold text-slate-700">{device.platform}/{device.architecture || "—"}</td><td className="p-4"><DeviceHealth device={device} /><p className="mt-1 text-[10px] font-semibold text-slate-500">{relative(device.last_heartbeat_at)}</p></td><td className="p-4 font-black text-slate-900">{device.desktop_version || "—"}</td><td className="p-4 text-right"><button onClick={() => setDossier(device)} className="rounded-xl bg-slate-950 px-3 py-2 font-black text-white">Ouvrir</button></td></tr>)}</tbody></table></div>}
    {!devices.length ? <div className="grid min-h-72 place-items-center rounded-[24px] border border-dashed border-slate-300 bg-white"><div className="text-center"><Filter className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-black text-slate-700">Aucun appareil ne correspond aux filtres.</p></div></div> : null}
    {bulkAction ? <BulkActionModal count={selected.length} action={bulkAction} busy={bulkBusy} onClose={() => setBulkAction(null)} onSubmit={runBulk} /> : null}
    {dossier ? <Dossier device={dossier} onClose={() => setDossier(null)} onAction={(id) => { setAction({ device: dossier, config: ACTIONS[id] }) }} /> : null}
    {action ? <ActionModal device={action.device} action={action.config} workspaces={data.workspaces as Row[]} users={data.users as Row[]} onClose={() => setAction(null)} onComplete={async (message) => { if (["delete", "force_purge"].includes(action.config.id)) setDossier(null); await complete(message) }} /> : null}
  </div>
}
