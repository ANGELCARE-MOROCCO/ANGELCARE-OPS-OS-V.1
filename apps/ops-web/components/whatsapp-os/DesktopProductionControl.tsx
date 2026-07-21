"use client"

import { Archive, BadgeCheck, DownloadCloud, FileDown, RefreshCw, RotateCcw, ShieldCheck, ShieldEllipsis } from "lucide-react"
import { useDesktopProduction } from "./useDesktopProduction"

function bytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 Mo"
  return `${(value / 1024 / 1024).toFixed(1)} Mo`
}
function date(value: string | null | undefined) {
  if (!value) return "Jamais"
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? "Jamais" : parsed.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })
}

export default function DesktopProductionControl() {
  const { runtime, release, diagnostics, busy, error, execute, releaseApi, diagnosticsApi } = useDesktopProduction()
  if (!runtime?.capabilities?.controlledUpdates) return null
  const call = async (label: string, operation: () => Promise<unknown>) => { try { await execute(label, operation) } catch { /* hook surfaces error */ } }
  const downloaded = release?.phase === "downloaded"
  const available = release?.phase === "available"

  return (
    <section className="mx-auto mt-5 max-w-[1500px] overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,.08)]">
      <div className="grid gap-5 border-b border-slate-200 bg-[linear-gradient(135deg,#071b35,#0b3159_60%,#0f766e)] p-6 text-white lg:grid-cols-[1fr_360px]">
        <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">Mega ZIP 5 · Production & Release</p><h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Centre de contrôle production ANGELCARE Desktop</h2><p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-200">Vérification des mises à jour, téléchargement avec contrôle SHA-256, redémarrage validé par l’utilisateur et export de diagnostics nettoyés.</p></div>
        <div className="rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur"><div className="flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-[.16em] text-cyan-100">Release active</p><BadgeCheck className="h-5 w-5 text-emerald-300" /></div><p className="mt-3 text-2xl font-black">v{runtime.version}</p><p className="mt-1 text-xs font-bold text-slate-200">Canal {runtime.releaseChannel} · Contrat {runtime.contractVersion}</p></div>
      </div>
      {error ? <div className="m-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div> : null}
      <div className="grid gap-5 p-5 lg:grid-cols-[1.1fr_.9fr] lg:p-6">
        <div className="rounded-[24px] border border-slate-200 p-5">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-blue-700">Mises à jour contrôlées</p><h3 className="mt-1 text-lg font-black text-slate-950">{release?.message || "Initialisation du canal de release…"}</h3></div><DownloadCloud className="h-6 w-6 text-blue-600" /></div>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{release?.detail || `Dernière vérification : ${date(release?.lastCheckedAt)}`}</p>
          {release?.phase === "downloading" ? <div className="mt-4"><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${release.progress}%` }} /></div><p className="mt-2 text-[11px] font-bold text-slate-500">{bytes(release.downloadedBytes)} / {bytes(release.totalBytes)} · {release.progress}%</p></div> : null}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button icon={RefreshCw} label="Rechercher une mise à jour" busy={busy === "check"} disabled={busy !== null} onClick={() => void call("check", () => releaseApi!.check())} />
            <Button icon={FileDown} label="Télécharger et vérifier" busy={busy === "download"} disabled={busy !== null || !available} onClick={() => void call("download", () => releaseApi!.download())} />
            <Button icon={Archive} label="Afficher le fichier vérifié" disabled={busy !== null || !downloaded} onClick={() => void call("reveal", () => releaseApi!.revealDownload())} />
            <Button icon={RotateCcw} label="Installer et redémarrer" strong disabled={busy !== null || !downloaded} onClick={() => void call("install", () => releaseApi!.restartToUpdate())} />
          </div>
        </div>
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/60 p-5">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-800">Support sécurisé</p><h3 className="mt-1 text-lg font-black text-slate-950">Diagnostics nettoyés</h3></div><ShieldCheck className="h-6 w-6 text-emerald-700" /></div>
          <p className="mt-3 text-xs font-semibold leading-6 text-slate-700">L’archive contient l’état technique, les versions, les crashs et des journaux nettoyés. Elle exclut les messages, cookies, IndexedDB, secrets d’authentification et fichiers clients.</p>
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4"><p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Dernier export</p><p className="mt-1 text-sm font-black text-slate-900">{diagnostics?.lastExportName || "Aucun export"}</p><p className="mt-1 text-xs font-semibold text-slate-500">{date(diagnostics?.lastExportAt)}</p></div>
          <button type="button" disabled={busy !== null} onClick={() => void call("diagnostics", () => diagnosticsApi!.exportBundle())} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-xs font-black text-white disabled:opacity-50"><ShieldEllipsis className="h-4 w-4" />Exporter le paquet support</button>
        </div>
      </div>
    </section>
  )
}

function Button({ icon: Icon, label, onClick, disabled, busy, strong }: { icon: typeof RefreshCw; label: string; onClick: () => void; disabled?: boolean; busy?: boolean; strong?: boolean }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${strong ? "border-blue-700 bg-blue-700 text-white" : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-blue-50"}`}><Icon className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />{label}</button>
}
