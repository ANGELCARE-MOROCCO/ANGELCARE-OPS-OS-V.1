"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Focus,
  Globe2,
  HardDriveDownload,
  Laptop2,
  LoaderCircle,
  Maximize2,
  MessageCircleMore,
  Minimize2,
  PanelLeftClose,
  PanelRight,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Smartphone,
  WifiOff,
  Wrench,
} from "lucide-react"
import { useWhatsAppDesktop } from "./useWhatsAppDesktop"

type LayoutMode = AngelCareWhatsAppLayout

const layouts: Array<{ id: LayoutMode; label: string; icon: typeof PanelRight }> = [
  { id: "split", label: "Partagé", icon: PanelRight },
  { id: "focus", label: "Focus", icon: Focus },
  { id: "full", label: "Plein espace", icon: Maximize2 },
  { id: "hidden", label: "Masqué", icon: PanelLeftClose },
]

function phaseTone(status: AngelCareWhatsAppStatus | null) {
  if (!status) return "border-slate-200 bg-slate-50 text-slate-600"
  if (["error", "crashed", "unresponsive"].includes(status.phase)) return "border-red-200 bg-red-50 text-red-700"
  if (["loading", "restarting", "created"].includes(status.phase)) return "border-blue-200 bg-blue-50 text-blue-700"
  if (status.authProfile === "qr-likely-required") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-emerald-200 bg-emerald-50 text-emerald-700"
}

function StatusIcon({ status }: { status: AngelCareWhatsAppStatus | null }) {
  if (!status) return <LoaderCircle className="h-4 w-4 animate-spin" />
  if (status.online === false) return <WifiOff className="h-4 w-4" />
  if (["loading", "restarting", "created"].includes(status.phase)) return <LoaderCircle className="h-4 w-4 animate-spin" />
  if (["error", "crashed", "unresponsive"].includes(status.phase)) return <AlertTriangle className="h-4 w-4" />
  return <CheckCircle2 className="h-4 w-4" />
}

export default function WhatsAppDesktopWorkspace() {
  const { isDesktop, runtime, status, error, busy, execute, api } = useWhatsAppDesktop()
  const [layout, setLayout] = useState<LayoutMode>("split")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const frameRef = useRef<number | null>(null)

  const syncBounds = useCallback(() => {
    if (!api || !viewportRef.current || layout === "hidden") return
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null
      const rect = viewportRef.current?.getBoundingClientRect()
      if (!rect || rect.width < 1 || rect.height < 1) return
      void api.setBounds({ x: rect.left, y: rect.top, width: rect.width, height: rect.height }).catch(() => undefined)
    })
  }, [api, layout])

  useEffect(() => {
    if (!api) return
    void api.setLayout(layout).then(() => {
      if (layout !== "hidden") void api.show()
      syncBounds()
    }).catch(() => undefined)
  }, [api, layout, syncBounds])

  useEffect(() => {
    if (!api || !viewportRef.current) return
    const element = viewportRef.current
    const observer = new ResizeObserver(syncBounds)
    observer.observe(element)
    const onViewportChange = () => syncBounds()
    window.addEventListener("resize", onViewportChange)
    window.addEventListener("scroll", onViewportChange, true)
    const timer = window.setInterval(syncBounds, 1500)
    syncBounds()

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", onViewportChange)
      window.removeEventListener("scroll", onViewportChange, true)
      window.clearInterval(timer)
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      void api.hide().catch(() => undefined)
    }
  }, [api, syncBounds])

  const gridClass = useMemo(() => {
    if (layout === "full") return "grid-cols-1"
    if (layout === "focus") return "xl:grid-cols-[270px_minmax(0,1fr)]"
    return "xl:grid-cols-[390px_minmax(0,1fr)]"
  }, [layout])

  if (!isDesktop) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ecfdf5_0,#f8fafc_38%,#eef6ff_100%)] p-5 lg:p-8">
        <section className="mx-auto max-w-5xl overflow-hidden rounded-[34px] border border-white bg-white shadow-[0_30px_90px_rgba(15,23,42,.12)] ring-1 ring-slate-200/70">
          <div className="grid gap-8 p-7 lg:grid-cols-[1fr_320px] lg:p-10">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"><MessageCircleMore className="h-6 w-6" /></div>
                <div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">ANGELCARE WhatsApp OS</p><p className="text-sm font-bold text-slate-500">Workspace assisté · Mega ZIP 2</p></div>
              </div>
              <h1 className="mt-7 text-4xl font-black tracking-[-0.055em] text-slate-950 lg:text-5xl">Le WhatsApp Web réel fonctionne dans ANGELCARE Desktop.</h1>
              <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-slate-600">Cette page est ouverte dans un navigateur ordinaire. Installez puis ouvrez ANGELCARE Desktop pour activer la surface WhatsApp persistante, le QR local, les médias, les téléchargements et le contrôle de session.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/whatsapp-os/session-control" className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 shadow-sm"><Wrench className="h-4 w-4" />Contrôle de session</Link>
              </div>
            </div>
            <div className="rounded-[28px] border border-emerald-100 bg-[linear-gradient(145deg,#ecfdf5,#ffffff)] p-6">
              <Laptop2 className="h-10 w-10 text-emerald-600" />
              <p className="mt-5 text-lg font-black text-slate-950">Runtime desktop requis</p>
              <div className="mt-5 space-y-3 text-sm font-bold text-slate-600">
                <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" />Session WhatsApp isolée localement</p>
                <p className="flex items-center gap-2"><Smartphone className="h-4 w-4 text-emerald-600" />Connexion QR liée à cette station</p>
                <p className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-emerald-600" />Aucun iframe ni scraping</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    )
  }

  const call = async (label: string, fn: (desktopApi: AngelCareWhatsAppDesktopApi) => Promise<unknown>) => {
    try { await execute(label, fn) } catch { /* surfaced by hook */ }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f4f8fb_100%)] p-3 lg:p-5">
      <section className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full flex-col overflow-hidden rounded-[30px] border border-white bg-white shadow-[0_24px_80px_rgba(15,23,42,.10)] ring-1 ring-slate-200/80">
        <header className="border-b border-slate-200 bg-white px-5 py-4 lg:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"><MessageCircleMore className="h-5 w-5" /></div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-black tracking-[-0.04em] text-slate-950">ANGELCARE WhatsApp Workspace</h1><span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-blue-700">Desktop sécurisé</span></div>
                <p className="mt-1 truncate text-xs font-bold text-slate-500">{runtime?.productName} {runtime?.version} · Profil local persistant · Aucune extraction de conversations</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-black ${phaseTone(status)}`}><StatusIcon status={status} />{status?.message || "Initialisation…"}</span>
              <Link href="/whatsapp-os/session-control" className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50"><Wrench className="h-4 w-4" />Session</Link>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {layouts.map((item) => {
                const Icon = item.icon
                return <button key={item.id} type="button" onClick={() => setLayout(item.id)} className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-black transition ${layout === item.id ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800"}`}><Icon className="h-3.5 w-3.5" />{item.label}</button>
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <button disabled={!status?.canGoBack || busy !== null} onClick={() => void call("back", (desktopApi) => desktopApi.goBack())} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 disabled:opacity-35"><ArrowLeft className="h-4 w-4" /></button>
              <button disabled={!status?.canGoForward || busy !== null} onClick={() => void call("forward", (desktopApi) => desktopApi.goForward())} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 disabled:opacity-35"><ArrowRight className="h-4 w-4" /></button>
              <button disabled={busy !== null} onClick={() => void call("reload", (desktopApi) => desktopApi.reload())} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-700"><RefreshCw className={`h-4 w-4 ${busy === "reload" ? "animate-spin" : ""}`} />Actualiser</button>
              <button disabled={busy !== null} onClick={() => void call("external", (desktopApi) => desktopApi.openExternal())} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-700"><ExternalLink className="h-4 w-4" />Externe</button>
            </div>
          </div>
          {error ? <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</div> : null}
        </header>

        <div className={`grid min-h-0 flex-1 ${gridClass}`}>
          {layout !== "full" ? (
            <aside className="overflow-y-auto border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-4 xl:border-b-0 xl:border-r lg:p-5">
              <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Ouvrir une conversation</p>
                <label className="mt-4 block text-xs font-black text-slate-700">Numéro international</label>
                <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+212 6…" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-400 focus:bg-white" />
                <label className="mt-4 block text-xs font-black text-slate-700">Message préparé</label>
                <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Bonjour, nous vous contactons au nom d’ANGELCARE…" className="mt-2 min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-900 outline-none focus:border-emerald-400 focus:bg-white" />
                <button disabled={busy !== null || phone.replace(/\D/g, "").length < 7} onClick={() => void call("navigate", (desktopApi) => desktopApi.navigate({ phone, text: message }))} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white shadow-lg shadow-emerald-600/15 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-45"><Send className="h-4 w-4" />Ouvrir dans WhatsApp</button>
                <p className="mt-3 text-[11px] font-semibold leading-5 text-slate-500">Le message est prérempli. L’opérateur vérifie et appuie manuellement sur Envoyer.</p>
              </div>

              <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3"><p className="text-sm font-black text-slate-950">État du profil local</p><ShieldCheck className="h-5 w-5 text-emerald-600" /></div>
                <dl className="mt-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between gap-4"><dt className="font-bold text-slate-500">Profil</dt><dd className="text-right font-black text-slate-900">{status?.authProfile === "local-profile-present" ? "Présent" : status?.authProfile === "qr-likely-required" ? "QR probablement requis" : "En vérification"}</dd></div>
                  <div className="flex items-center justify-between gap-4"><dt className="font-bold text-slate-500">Moteur</dt><dd className="font-black text-slate-900">{status?.rendererStatus || "—"}</dd></div>
                  <div className="flex items-center justify-between gap-4"><dt className="font-bold text-slate-500">Partition</dt><dd className="truncate font-mono text-[10px] font-bold text-slate-700">{status?.partition || "persist:angelcare-whatsapp-main"}</dd></div>
                  <div className="flex items-center justify-between gap-4"><dt className="font-bold text-slate-500">Dernier chargement</dt><dd className="font-black text-slate-900">{status?.lastLoadedAt ? new Date(status.lastLoadedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—"}</dd></div>
                </dl>
                <button disabled={busy !== null} onClick={() => void call("downloads", (desktopApi) => desktopApi.openDownloads())} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-black text-slate-700"><HardDriveDownload className="h-4 w-4" />Téléchargements ANGELCARE</button>
              </div>

              {layout === "split" ? (
                <div className="mt-4 rounded-[24px] border border-blue-100 bg-blue-50/70 p-4">
                  <p className="text-xs font-black text-blue-900">Frontière de sécurité Mega ZIP 2</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-blue-800">ANGELCARE contrôle la fenêtre, la navigation et la session locale. Il ne lit pas le DOM, les messages, les cookies ou l’historique WhatsApp.</p>
                </div>
              ) : null}
            </aside>
          ) : null}

          <section className="relative min-h-[620px] overflow-hidden bg-[#efeae2]">
            {layout === "hidden" ? (
              <div className="grid h-full min-h-[620px] place-items-center p-8 text-center">
                <div><Minimize2 className="mx-auto h-12 w-12 text-slate-400" /><h2 className="mt-5 text-2xl font-black text-slate-900">WhatsApp Web reste masqué</h2><p className="mt-2 text-sm font-semibold text-slate-600">Le profil local est conservé. Sélectionnez Partagé, Focus ou Plein espace pour réafficher le navigateur.</p><button onClick={() => setLayout("split")} className="mt-6 h-11 rounded-xl bg-slate-950 px-5 text-sm font-black text-white">Réafficher</button></div>
              </div>
            ) : (
              <div ref={viewportRef} className="absolute inset-0 overflow-hidden bg-[#f0f2f5]">
                <div className="grid h-full place-items-center p-8 text-center">
                  <div className="max-w-md"><LoaderCircle className="mx-auto h-10 w-10 animate-spin text-emerald-600" /><p className="mt-4 text-sm font-black text-slate-800">Réservation de la surface WhatsApp sécurisée…</p><p className="mt-2 text-xs font-semibold text-slate-500">Le `WebContentsView` natif recouvre cette zone dans ANGELCARE Desktop.</p></div>
                </div>
              </div>
            )}
            <div className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-full border border-white/60 bg-slate-950/85 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-white shadow-lg backdrop-blur">Session locale · Human-operated</div>
          </section>
        </div>
      </section>
    </main>
  )
}
