"use client"

import { useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Laptop2,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Send,
  ShieldCheck,
  WifiOff,
} from "lucide-react"
import { useWhatsAppGovernance } from "@/components/whatsapp-os/useWhatsAppGovernance"

function tone(status: AngelCareWhatsAppGovernanceStatus | null) {
  if (status?.authorized) return "border-emerald-200 bg-emerald-50 text-emerald-800"
  if (status?.phase === "offline-grace") return "border-amber-200 bg-amber-50 text-amber-800"
  if (["blocked", "revoked", "registration-error", "authorization-error"].includes(status?.phase || "")) return "border-red-200 bg-red-50 text-red-800"
  return "border-blue-200 bg-blue-50 text-blue-800"
}

function StateIcon({ status }: { status: AngelCareWhatsAppGovernanceStatus | null }) {
  if (status?.authorized) return <CheckCircle2 className="h-5 w-5" />
  if (status?.phase === "offline-grace") return <WifiOff className="h-5 w-5" />
  if (["blocked", "revoked"].includes(status?.phase || "")) return <LockKeyhole className="h-5 w-5" />
  return <Clock3 className="h-5 w-5" />
}

export default function WhatsAppGovernanceGate({ children }: { children: ReactNode }) {
  const governance = useWhatsAppGovernance()
  const [reason, setReason] = useState("Accès requis pour assurer les communications opérationnelles ANGELCARE.")
  const [requestSent, setRequestSent] = useState<string | null>(null)

  const availableRequests = useMemo(
    () => governance.catalog.filter((item) => !governance.workspaces.some((assigned) => assigned.id === item.id)),
    [governance.catalog, governance.workspaces],
  )

  if (governance.loading) {
    return <main className="grid min-h-[70vh] place-items-center bg-slate-50 p-6"><div className="text-center"><LoaderCircle className="mx-auto h-10 w-10 animate-spin text-emerald-600" /><p className="mt-4 text-sm font-black text-slate-800">Synchronisation de la gouvernance WhatsApp Desktop…</p></div></main>
  }

  if (!governance.desktop) {
    return (
      <main className="min-h-screen bg-slate-50 p-5 lg:p-8">
        <section className="mx-auto max-w-3xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,.10)]">
          <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#f8fbff,#ecfdf5)] p-7">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-white"><Laptop2 className="h-6 w-6" /></div>
            <h1 className="mt-5 text-3xl font-black tracking-[-0.05em] text-slate-950">ANGELCARE Desktop requis</h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">La vraie session WhatsApp Web et son contrôle d’appareil ne sont disponibles que dans l’application ANGELCARE Desktop sécurisée.</p>
          </div>
          <div className="p-7"><Link href="/whatsapp-os/admin" className="inline-flex h-11 items-center rounded-xl bg-slate-950 px-5 text-sm font-black text-white">Ouvrir l’administration WhatsApp</Link></div>
        </section>
      </main>
    )
  }

  if (!governance.status?.authorized) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff,#f8fafc)] p-4 lg:p-7">
        <section className="mx-auto max-w-6xl overflow-hidden rounded-[34px] border border-white bg-white shadow-[0_30px_100px_rgba(15,23,42,.11)] ring-1 ring-slate-200/80">
          <header className="grid gap-5 border-b border-slate-200 bg-[linear-gradient(135deg,#ffffff,#eff6ff_55%,#ecfdf5)] p-6 lg:grid-cols-[1fr_auto] lg:p-8">
            <div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">Mega ZIP 3 · Governance Gate</p><h1 className="mt-3 text-3xl font-black tracking-[-0.055em] text-slate-950 lg:text-4xl">Accès WhatsApp Desktop gouverné</h1><p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-600">L’utilisateur, l’appareil et l’espace doivent tous être autorisés avant que la surface WhatsApp puisse apparaître.</p></div>
            <button onClick={() => void governance.refresh()} disabled={governance.busy !== null} className="inline-flex h-11 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 shadow-sm"><RefreshCw className={`h-4 w-4 ${governance.busy === "refresh" ? "animate-spin" : ""}`} />Actualiser</button>
          </header>

          <div className="grid gap-5 p-5 lg:grid-cols-[360px_1fr] lg:p-7">
            <div className={`rounded-[26px] border p-5 ${tone(governance.status)}`}>
              <div className="flex items-center gap-3"><StateIcon status={governance.status} /><div><p className="text-sm font-black">{governance.status?.message || "Autorisation en attente"}</p><p className="mt-1 text-xs font-bold opacity-75">{governance.status?.authorizationReason || "NOT_CHECKED"}</p></div></div>
              <dl className="mt-5 space-y-3 rounded-2xl bg-white/70 p-4 text-xs">
                <div className="flex justify-between gap-4"><dt className="font-bold opacity-70">Appareil</dt><dd className="text-right font-black">{governance.status?.deviceName || "—"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="font-bold opacity-70">Approbation</dt><dd className="font-black">{governance.status?.approvalStatus || "—"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="font-bold opacity-70">Installation</dt><dd className="max-w-[190px] truncate font-mono text-[10px] font-bold">{governance.status?.installationId || "—"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="font-bold opacity-70">Version</dt><dd className="font-black">{governance.status?.desktopVersion || "—"}</dd></div>
              </dl>
              {governance.error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">{governance.error}</div> : null}
            </div>

            <div>
              <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-emerald-600" /><h2 className="text-lg font-black text-slate-950">Vos espaces WhatsApp assignés</h2></div>
              {governance.workspaces.length ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {governance.workspaces.map((workspace) => (
                    <button key={workspace.id} disabled={governance.busy !== null} onClick={() => void governance.selectWorkspace(workspace)} className="rounded-[22px] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg disabled:opacity-50">
                      <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-slate-950">{workspace.name}</p><p className="mt-1 text-xs font-semibold text-slate-500">{workspace.department || workspace.code}</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700">{workspace.assignment?.role || "operator"}</span></div>
                      <p className="mt-4 text-xs font-bold text-slate-600">{workspace.phone_number_e164 || "Numéro géré par liaison WhatsApp locale"}</p>
                      <span className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl bg-slate-950 px-3 text-xs font-black text-white">{governance.busy === `workspace:${workspace.id}` ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}Vérifier et ouvrir</span>
                    </button>
                  ))}
                </div>
              ) : <div className="mt-4 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><AlertTriangle className="mx-auto h-8 w-8 text-amber-500" /><p className="mt-3 text-sm font-black text-slate-800">Aucune affectation active</p><p className="mt-1 text-xs font-semibold text-slate-500">Soumettez une demande d’accès ci-dessous.</p></div>}

              {availableRequests.length ? (
                <div className="mt-6 rounded-[24px] border border-blue-100 bg-blue-50/60 p-5">
                  <h3 className="text-sm font-black text-blue-950">Demander un accès</h3>
                  <textarea value={reason} onChange={(event) => setReason(event.target.value)} className="mt-3 min-h-20 w-full rounded-xl border border-blue-200 bg-white p-3 text-sm font-semibold text-slate-900 outline-none" />
                  <div className="mt-3 flex flex-wrap gap-2">{availableRequests.map((workspace) => <button key={workspace.id} disabled={governance.busy !== null || requestSent === workspace.id} onClick={() => void governance.requestAccess(workspace.id, reason).then(() => setRequestSent(workspace.id))} className="inline-flex h-9 items-center gap-2 rounded-xl bg-blue-700 px-3 text-xs font-black text-white disabled:opacity-50"><Send className="h-3.5 w-3.5" />{requestSent === workspace.id ? "Demande envoyée" : workspace.name}</button>)}</div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <div>
      <div className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 bg-white/95 px-4 py-2.5 shadow-sm backdrop-blur lg:px-6">
        <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white"><ShieldCheck className="h-4 w-4" /></div><div><p className="text-xs font-black text-slate-950">{governance.status.selectedWorkspaceName || "Espace WhatsApp autorisé"}</p><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">Appareil approuvé · Bail actif jusqu’à {governance.status.leaseExpiresAt ? new Date(governance.status.leaseExpiresAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—"}</p></div></div>
        <div className="flex items-center gap-2"><span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">Accès opérationnel</span><button onClick={() => void governance.heartbeat()} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600"><RefreshCw className={`h-4 w-4 ${governance.busy === "heartbeat" ? "animate-spin" : ""}`} /></button></div>
      </div>
      {children}
    </div>
  )
}
