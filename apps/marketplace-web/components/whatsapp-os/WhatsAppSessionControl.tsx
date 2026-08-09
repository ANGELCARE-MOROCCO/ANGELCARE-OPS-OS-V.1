"use client"

import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  BellRing,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileWarning,
  FolderOpen,
  HardDrive,
  KeyRound,
  Laptop2,
  LoaderCircle,
  MessageCircleMore,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Wifi,
  Wrench,
} from "lucide-react"
import { useWhatsAppDesktop } from "./useWhatsAppDesktop"

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 o"
  const units = ["o", "Ko", "Mo", "Go"]
  const index = Math.min(units.length - 1, Math.floor(Math.log(value) / Math.log(1024)))
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Non disponible"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Non disponible"
  return date.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })
}

export default function WhatsAppSessionControl() {
  const { isDesktop, runtime, status, error, busy, execute } = useWhatsAppDesktop()

  const call = async (label: string, fn: (api: AngelCareWhatsAppDesktopApi) => Promise<unknown>) => {
    try { await execute(label, fn) } catch { /* surfaced by hook */ }
  }

  if (!isDesktop) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 lg:p-10">
        <section className="mx-auto max-w-4xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl">
          <Laptop2 className="h-12 w-12 text-emerald-600" />
          <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] text-slate-950">Contrôle de session WhatsApp Desktop</h1>
          <p className="mt-4 text-base font-semibold leading-8 text-slate-600">Les diagnostics locaux ne sont disponibles que dans ANGELCARE Desktop. Le navigateur web ordinaire ne possède ni le profil WhatsApp persistant ni l’accès au moteur Electron.</p>
          <Link href="/whatsapp-os/web-session" className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white"><ArrowLeft className="h-4 w-4" />Retour au workspace</Link>
        </section>
      </main>
    )
  }

  const unhealthy = status && ["error", "crashed", "unresponsive"].includes(status.phase)

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff,#f1f5f9)] p-4 lg:p-7">
      <section className="mx-auto max-w-[1500px]">
        <header className="overflow-hidden rounded-[30px] border border-white bg-white shadow-[0_22px_70px_rgba(15,23,42,.09)] ring-1 ring-slate-200/80">
          <div className="grid gap-5 bg-[linear-gradient(135deg,#ffffff,#ecfdf5_55%,#eff6ff)] p-6 lg:grid-cols-[1fr_360px] lg:p-8">
            <div>
              <Link href="/whatsapp-os/web-session" className="inline-flex items-center gap-2 text-xs font-black text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" />Retour au WhatsApp Workspace</Link>
              <div className="mt-5 flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"><Wrench className="h-6 w-6" /></div><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">ANGELCARE Desktop · Runtime cumulatif Mega ZIP 1–5</p><h1 className="text-3xl font-black tracking-[-0.05em] text-slate-950">Contrôle de session WhatsApp</h1></div></div>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-600">Inspectez le moteur local, le profil persistant, les autorisations et les téléchargements. Aucune conversation, aucun cookie et aucun secret WhatsApp ne sont envoyés vers Supabase.</p>
            </div>
            <div className={`rounded-[24px] border p-5 ${unhealthy ? "border-red-200 bg-red-50" : "border-emerald-200 bg-white/85"}`}>
              <div className="flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">État actuel</p>{unhealthy ? <AlertTriangle className="h-5 w-5 text-red-600" /> : <CheckCircle2 className="h-5 w-5 text-emerald-600" />}</div>
              <p className="mt-3 text-lg font-black text-slate-950">{status?.message || "Initialisation du contrôle local…"}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{status?.detail || `Runtime ${runtime?.version || "—"} · ${runtime?.platform || "—"}`}</p>
            </div>
          </div>
        </header>

        {error ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div> : null}

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(350px,.75fr)]">
          <section className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Moteur", status?.rendererStatus || "Non créé", MessageCircleMore],
                ["Profil local", status?.authProfile === "local-profile-present" ? "Présent" : status?.authProfile === "qr-likely-required" ? "QR requis" : "Inconnu", KeyRound],
                ["Connectivité", status?.online === true ? "En ligne" : status?.online === false ? "Hors ligne" : "En vérification", Wifi],
                ["Vue", status?.visible ? "Visible" : "Masquée", Laptop2],
              ].map(([label, value, Icon]) => (
                <div key={String(label)} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm"><Icon className="h-5 w-5 text-emerald-600" /><p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{String(label)}</p><p className="mt-1 text-sm font-black text-slate-950">{String(value)}</p></div>
              ))}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">Commandes gouvernées</p><h2 className="mt-1 text-xl font-black text-slate-950">Interventions sur le moteur local</h2></div><ShieldCheck className="h-6 w-6 text-emerald-600" /></div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <ActionButton icon={RefreshCcw} label="Actualiser WhatsApp" disabled={busy !== null} busy={busy === "reload"} onClick={() => void call("reload", (api) => api.reload())} />
                <ActionButton icon={RotateCcw} label="Redémarrer le moteur" disabled={busy !== null} busy={busy === "restart"} onClick={() => void call("restart", (api) => api.restart())} />
                <ActionButton icon={HardDrive} label="Effacer uniquement le cache" disabled={busy !== null} busy={busy === "cache"} onClick={() => void call("cache", (api) => api.clearCache())} />
                <ActionButton icon={ExternalLink} label="Ouvrir séparément" disabled={busy !== null} onClick={() => void call("external", (api) => api.openExternal())} />
                <ActionButton icon={FolderOpen} label="Ouvrir téléchargements" disabled={busy !== null} onClick={() => void call("downloads", (api) => api.openDownloads())} />
                <ActionButton icon={Trash2} label="Effacer la session liée" destructive disabled={busy !== null} busy={busy === "clear-session"} onClick={() => void call("clear-session", (api) => api.clearSession())} />
              </div>
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-start gap-3"><FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><p className="text-sm font-black text-amber-950">Effacer la session liée force un nouveau QR.</p><p className="mt-1 text-xs font-semibold leading-5 text-amber-800">L’action supprime cookies, IndexedDB, stockage local, service workers et cache du profil `persist:angelcare-whatsapp-main`. Une confirmation native est obligatoire.</p></div></div></div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
              <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-700">Téléchargements gouvernés</p><h2 className="mt-1 text-xl font-black text-slate-950">Activité récente</h2></div><Download className="h-6 w-6 text-violet-600" /></div>
              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                {(status?.downloads.length || 0) === 0 ? <EmptyState text="Aucun téléchargement WhatsApp enregistré dans cette session." /> : status?.downloads.map((item) => (
                  <div key={item.id} className="grid gap-2 border-b border-slate-100 p-4 last:border-b-0 sm:grid-cols-[1fr_auto]">
                    <div className="min-w-0"><p className="truncate text-sm font-black text-slate-900">{item.filename}</p><p className="mt-1 text-xs font-semibold text-slate-500">{formatBytes(item.receivedBytes)} / {formatBytes(item.totalBytes)} · {formatDate(item.completedAt || item.at)}</p></div>
                    <span className={`self-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${item.state === "completed" ? "bg-emerald-50 text-emerald-700" : item.state === "blocked" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>{item.state}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_20px_55px_rgba(15,23,42,.22)]">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">Dossier technique local</p>
              <dl className="mt-5 space-y-4 text-xs">
                <InfoRow label="Partition" value={status?.partition || "persist:angelcare-whatsapp-main"} mono />
                <InfoRow label="URL actuelle" value={status?.currentUrl || "Non chargée"} mono />
                <InfoRow label="Dernier chargement" value={formatDate(status?.lastLoadedAt)} />
                <InfoRow label="Dernière erreur" value={formatDate(status?.lastErrorAt)} />
                <InfoRow label="Dernier crash" value={formatDate(status?.lastCrashAt)} />
                <InfoRow label="Dernière réponse" value={formatDate(status?.lastResponsiveAt)} />
              </dl>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">Autorisations</p><h2 className="mt-1 text-lg font-black text-slate-950">Décisions récentes</h2></div><BellRing className="h-5 w-5 text-amber-600" /></div>
              <div className="mt-4 space-y-2">
                {(status?.permissions.length || 0) === 0 ? <EmptyState text="Aucune demande d’autorisation enregistrée." compact /> : status?.permissions.slice(0, 12).map((item, index) => (
                  <div key={`${item.at}-${item.permission}-${index}`} className="rounded-xl border border-slate-200 p-3"><div className="flex items-center justify-between gap-3"><p className="text-xs font-black text-slate-900">{item.permission}</p><span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${item.allowed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{item.allowed ? "Autorisée" : "Refusée"}</span></div><p className="mt-1 truncate text-[10px] font-semibold text-slate-500">{item.origin || "Origine inconnue"}</p></div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-blue-100 bg-blue-50/80 p-5">
              <Clock3 className="h-5 w-5 text-blue-700" />
              <p className="mt-3 text-sm font-black text-blue-950">Aucune donnée WhatsApp centralisée</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-blue-800">Ces diagnostics décrivent uniquement le runtime Electron local. Ils n’exportent ni messages, ni contacts, ni cookies, ni contenu d’authentification.</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

function ActionButton({ icon: Icon, label, onClick, disabled, busy, destructive = false }: { icon: typeof Wrench; label: string; onClick: () => void; disabled?: boolean; busy?: boolean; destructive?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} className={`flex min-h-16 items-center gap-3 rounded-2xl border p-3 text-left text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-45 ${destructive ? "border-red-200 bg-red-50 text-red-800 hover:bg-red-100" : "border-slate-200 bg-slate-50 text-slate-800 hover:border-blue-200 hover:bg-blue-50"}`}>{busy ? <LoaderCircle className="h-5 w-5 shrink-0 animate-spin" /> : <Icon className="h-5 w-5 shrink-0" />}<span>{label}</span></button>
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div><dt className="font-black uppercase tracking-[0.12em] text-slate-400">{label}</dt><dd className={`mt-1 break-all font-bold text-white ${mono ? "font-mono text-[10px]" : "text-xs"}`}>{value}</dd></div>
}

function EmptyState({ text, compact = false }: { text: string; compact?: boolean }) {
  return <div className={`text-center font-semibold text-slate-500 ${compact ? "py-4 text-xs" : "p-8 text-sm"}`}>{text}</div>
}
