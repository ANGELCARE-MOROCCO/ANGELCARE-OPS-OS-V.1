"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangle, LoaderCircle, LockOpen, RefreshCw, ShieldCheck, X } from "lucide-react"

type Row = Record<string, any>
type Overview = {
  minimum_safe_locked_version: string
  counts: { total: number; unsafe: number; locked: number; active_lockouts: number }
  devices: Row[]
  rescue_runs: Row[]
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", ...(init?.headers || {}) } })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || `HTTP_${response.status}`)
  return payload.data as T
}

function relative(value?: string | null) {
  if (!value) return "Jamais"
  const ms = Date.now() - new Date(value).getTime()
  if (ms < 60_000) return "À l’instant"
  if (ms < 3_600_000) return `Il y a ${Math.floor(ms / 60_000)} min`
  if (ms < 86_400_000) return `Il y a ${Math.floor(ms / 3_600_000)} h`
  return new Date(value).toLocaleString("fr-FR")
}

export default function StationLockSafetyPanel({ selectedDeviceId, onChanged }: { selectedDeviceId: string; onChanged: () => Promise<unknown> | unknown }) {
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [modal, setModal] = useState<"device" | "fleet" | null>(null)
  const [reason, setReason] = useState("Incident de verrouillage — libération administrative préventive MZ16")
  const [confirmation, setConfirmation] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try { setData(await api<Overview>("/api/desktop-stations/admin/lock-safety")); setError(null) }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])
  const selected = useMemo(() => data?.devices.find((row) => String(row.id) === selectedDeviceId) || null, [data, selectedDeviceId])
  const expectedConfirmation = modal === "fleet" ? "LIBERER LA FLOTTE" : String(selected?.device_name || selected?.hostname || selected?.id || "")
  const canConfirm = Boolean(reason.trim()) && confirmation.trim() === expectedConfirmation

  const execute = async () => {
    if (!modal || !canConfirm) return
    setBusy(true); setError(null); setNotice(null)
    try {
      if (modal === "fleet") {
        const result = await api<Row>("/api/desktop-stations/admin/fleet-safe-mode", { method: "POST", body: JSON.stringify({ reason }) })
        setNotice(`${result.queued || 0} poste(s) placé(s) en mode sûr; ${result.failed || 0} échec(s).`)
      } else if (selected) {
        await api(`/api/desktop-stations/devices/${selected.id}/lock-rescue`, { method: "POST", body: JSON.stringify({ reason }) })
        setNotice("Libération du poste mise en file avec politique Standard de secours et preuves de commande.")
      }
      setModal(null); setConfirmation("")
      await Promise.all([load(), Promise.resolve(onChanged())])
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)) }
    finally { setBusy(false) }
  }

  return <section className="rounded-[26px] border border-red-200 bg-[linear-gradient(135deg,#fff7ed,#ffffff_50%,#eff6ff)] p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-100 text-red-700"><ShieldCheck className="h-5 w-5" /></div><div><p className="text-[10px] font-black uppercase tracking-[.15em] text-red-700">Protection anti-verrouillage MZ16</p><h3 className="mt-1 text-lg font-black text-slate-950">Sécurité Corporate Locked et libération de flotte</h3><p className="mt-1 max-w-4xl text-xs font-semibold leading-5 text-slate-600">Corporate Locked est bloqué sur les clients non certifiés. La libération administrée applique une politique Standard de secours, remet les compteurs de lockout à zéro et envoie des commandes corrélées avec preuve d’exécution.</p></div></div>
      <button onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Actualiser</button>
    </div>
    {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-black text-red-700">{error}</div> : null}
    {notice ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-black text-emerald-700">{notice}</div> : null}
    {data ? <>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
        ["Niveau sûr Locked", `Desktop ${data.minimum_safe_locked_version}+`],
        ["Clients non certifiés", data.counts.unsafe],
        ["Postes Locked", data.counts.locked],
        ["Lockouts actifs", data.counts.active_lockouts],
      ].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-white bg-white/90 p-4 shadow-sm"><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-400">{label}</p><p className="mt-2 text-lg font-black text-slate-950">{value}</p></div>)}</div>
      {selected ? <div className={`mt-4 rounded-2xl border p-4 ${selected.lock_risk?.unsafe ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black text-slate-950">{selected.device_name || selected.hostname || selected.id}</p><p className="mt-1 text-[10px] font-semibold text-slate-600">Desktop {selected.desktop_version || "inconnu"} · {selected.lock_risk?.label} · Dernier signal {relative(selected.last_heartbeat_at)}</p></div><button onClick={() => { setModal("device"); setConfirmation("") }} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-700 px-4 text-xs font-black text-white disabled:opacity-50"><LockOpen className="h-4 w-4" />Libérer ce poste</button></div></div> : null}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" /><p className="max-w-4xl text-xs font-bold leading-5 text-amber-900">Mesure flotte: tous les postes Locked, en lockout ou sous Desktop inférieur à {data.minimum_safe_locked_version} sont basculés vers la politique Standard de secours. Les postes hors ligne l’appliqueront au prochain polling.</p></div><button onClick={() => { setModal("fleet"); setConfirmation("") }} disabled={busy || data.counts.total === 0} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white disabled:opacity-40"><LockOpen className="h-4 w-4" />Activer le mode sûr flotte</button></div>
    </> : <div className="mt-5 flex items-center gap-2 text-xs font-black text-slate-600"><LoaderCircle className="h-4 w-4 animate-spin" />Chargement de la sécurité Locked…</div>}

    {modal ? <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"><div className="w-full max-w-xl rounded-[28px] border border-white bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.15em] text-red-700">Action de secours gouvernée</p><h4 className="mt-2 text-2xl font-black text-slate-950">{modal === "fleet" ? "Libérer la flotte à risque" : "Libérer le poste sélectionné"}</h4><p className="mt-2 text-xs font-semibold leading-5 text-slate-600">Cette action remplace l’affectation du poste par une politique Standard de secours, désactive le relock au redémarrage et remet les compteurs de lockout à zéro. Un historique immuable est conservé.</p></div><button onClick={() => setModal(null)} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600"><X className="h-4 w-4" /></button></div>
      <label className="mt-5 block text-xs font-black text-slate-600">Motif obligatoire<textarea value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold outline-none focus:border-red-400" /></label>
      <label className="mt-4 block text-xs font-black text-slate-600">Tapez exactement <span className="text-red-700">{expectedConfirmation}</span><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-black outline-none focus:border-red-400" /></label>
      <div className="mt-6 flex justify-end gap-2"><button onClick={() => setModal(null)} className="h-11 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-700">Annuler</button><button onClick={() => void execute()} disabled={!canConfirm || busy} className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-700 px-5 text-xs font-black text-white disabled:opacity-40">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LockOpen className="h-4 w-4" />}Confirmer la libération</button></div>
    </div></div> : null}
  </section>
}
