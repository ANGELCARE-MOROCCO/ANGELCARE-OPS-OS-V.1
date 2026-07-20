"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  Archive,
  BarChart3,
  Boxes,
  CheckCircle2,
  Clock3,
  Database,
  FileArchive,
  FileQuestion,
  FileLock2,
  Files,
  FileText,
  FolderTree,
  Gauge,
  HardDrive,
  Inbox,
  Info,
  Loader2,
  Mail,
  RefreshCw,
  ScanSearch,
  Search,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Workflow,
} from "lucide-react"
import StorageExplorerPhase2 from "@/components/opsos/windows-node/StorageExplorerPhase2"
import StorageQuarantinePhase3 from "@/components/opsos/windows-node/StorageQuarantinePhase3"
import StorageDestructionPhase4 from "@/components/opsos/windows-node/StorageDestructionPhase4"
import StorageLifecyclePhase5 from "@/components/opsos/windows-node/StorageLifecyclePhase5"
import type {
  WindowsStorageDuplicateGroup,
  WindowsStorageInventory,
  WindowsStorageInventoryAggregate,
  WindowsStorageInventoryCategory,
  WindowsStorageInventoryFile,
  WindowsStorageInventoryFreshness,
  WindowsStorageInventorySource,
  WindowsStorageOrphanCandidate,
  WindowsStorageExplorerEntry,
} from "@/lib/opsos/windows-node-types"

type WorkspaceTab = "phase5" | "phase4" | "phase3" | "phase2" | "overview" | "categories" | "email" | "largest" | "duplicates" | "orphans" | "sources"
type Tone = "blue" | "emerald" | "amber" | "rose" | "violet" | "slate"

type ApiResult<T> = {
  ok: boolean
  data?: T
  error?: string
  errorMessage?: string
  recommendedAction?: string
}

const TABS: Array<{ id: WorkspaceTab; label: string; icon: typeof HardDrive }> = [
  { id: "phase5", label: "Pilotage automatisé", icon: Workflow },
  { id: "phase4", label: "Destruction contrôlée", icon: FileLock2 },
  { id: "phase3", label: "Quarantaine & restauration", icon: Archive },
  { id: "phase2", label: "Exploration sécurisée", icon: ScanSearch },
  { id: "overview", label: "Vue globale", icon: Gauge },
  { id: "categories", label: "Catégories", icon: Boxes },
  { id: "email", label: "Email OS", icon: Mail },
  { id: "largest", label: "Fichiers volumineux", icon: FileArchive },
  { id: "duplicates", label: "Doublons", icon: Files },
  { id: "orphans", label: "Orphelins potentiels", icon: FileQuestion },
  { id: "sources", label: "Sources & synchronisation", icon: Database },
]

const TONES: Record<Tone, { bg: string; border: string; text: string; solid: string; soft: string }> = {
  blue: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", solid: "#2563eb", soft: "rgba(37,99,235,.11)" },
  emerald: { bg: "#ecfdf5", border: "#a7f3d0", text: "#047857", solid: "#10b981", soft: "rgba(16,185,129,.11)" },
  amber: { bg: "#fffbeb", border: "#fde68a", text: "#b45309", solid: "#f59e0b", soft: "rgba(245,158,11,.11)" },
  rose: { bg: "#fff1f2", border: "#fecdd3", text: "#be123c", solid: "#f43f5e", soft: "rgba(244,63,94,.11)" },
  violet: { bg: "#f5f3ff", border: "#ddd6fe", text: "#6d28d9", solid: "#7c3aed", soft: "rgba(124,58,237,.11)" },
  slate: { bg: "#f8fafc", border: "#e2e8f0", text: "#475569", solid: "#64748b", soft: "rgba(100,116,139,.09)" },
}

function bytes(value?: number | null) {
  const current = Number(value || 0)
  if (!Number.isFinite(current) || current <= 0) return "0 o"
  const units = ["o", "Ko", "Mo", "Go", "To"]
  let amount = current
  let unit = 0
  while (amount >= 1024 && unit < units.length - 1) {
    amount /= 1024
    unit += 1
  }
  return `${amount.toLocaleString("fr-FR", { maximumFractionDigits: unit >= 3 ? 1 : 0 })} ${units[unit]}`
}

function number(value?: number | null) {
  return Number(value || 0).toLocaleString("fr-FR")
}

function dateTime(value?: string | null) {
  if (!value) return "Non disponible"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "medium" }).format(parsed)
}

function relative(value?: string | null) {
  if (!value) return "Jamais"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "Date indisponible"
  const minutes = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 60000))
  if (minutes < 1) return "À l’instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours} h`
  return `Il y a ${Math.floor(hours / 24)} j`
}

function percent(value: number, total: number) {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((value / total) * 1000) / 10))
}

function deltaLabel(value?: number | null) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "Référence en cours de création"
  if (value === 0) return "Stable depuis le précédent scan"
  return `${value > 0 ? "+" : "−"}${bytes(Math.abs(value))} depuis le précédent scan`
}

function sourceTone(status: string): Tone {
  const normalized = String(status || "").toLowerCase()
  if (["synced", "ready", "complete"].includes(normalized)) return "emerald"
  if (["partial", "completed_with_warnings", "provider_limited"].includes(normalized)) return "amber"
  if (["unavailable"].includes(normalized)) return "rose"
  return "slate"
}

function sourceStatusLabel(status: string) {
  const normalized = String(status || "").toLowerCase()
  if (normalized === "synced" || normalized === "ready" || normalized === "complete") return "Synchronisé"
  if (normalized === "partial") return "Partiel"
  if (normalized === "completed_with_warnings") return "Terminé avec alertes"
  if (normalized === "not_configured") return "Non configuré"
  if (normalized === "not_in_phase_1") return "Hors phase 1"
  if (normalized === "provider_limited") return "Limité par le fournisseur"
  if (normalized === "unscanned") return "Hors périmètre de scan"
  if (normalized === "unavailable") return "Indisponible"
  return status || "Inconnu"
}

async function requestInventory(mode: "summary" | "deep", force: boolean): Promise<ApiResult<WindowsStorageInventory>> {
  const response = await fetch(`/api/opsos/windows-node/storage/inventory?mode=${mode}${force ? "&force=1" : ""}`, {
    cache: "no-store",
  })
  const json = await response.json().catch(() => ({}))
  return {
    ok: Boolean(response.ok && json?.ok !== false),
    data: json?.data,
    error: json?.error,
    errorMessage: json?.errorMessage,
    recommendedAction: json?.recommendedAction,
  }
}

export default function StorageDataControlCenter() {
  const [inventory, setInventory] = useState<WindowsStorageInventory | null>(null)
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("phase5")
  const [quarantineCandidate, setQuarantineCandidate] = useState<WindowsStorageExplorerEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [query, setQuery] = useState("")

  async function load(mode: "summary" | "deep" = "summary", force = false) {
    if (mode === "deep") setScanning(true)
    else if (!inventory) setLoading(true)
    setError(null)
    const result = await requestInventory(mode, force)
    if (result.ok && result.data) {
      setInventory(result.data)
    } else {
      setError(result.errorMessage || result.error || "Impossible de synchroniser l’inventaire de stockage.")
    }
    setLoading(false)
    setScanning(false)
  }

  useEffect(() => {
    void load("summary", false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const timer = window.setInterval(() => void load("summary", false), 45_000)
    return () => window.clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh])

  const largestFiltered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!inventory) return []
    if (!needle) return inventory.largestFiles
    return inventory.largestFiles.filter((file) => `${file.filename} ${file.relativePath} ${file.mailboxId || ""} ${file.sourceLabel} ${file.fileType}`.toLowerCase().includes(needle))
  }, [inventory, query])

  if (loading && !inventory) return <StorageSkeleton />

  return (
    <section className="space-y-5">
      <header className="overflow-hidden rounded-[30px] border border-white bg-[linear-gradient(135deg,#ffffff_0%,#f4faff_55%,#eef4ff_100%)] p-5 shadow-[0_22px_70px_rgba(15,23,42,.08)] ring-1 ring-slate-200/70 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="violet" label="Phase 5 · Cycle de vie automatisé" />
              <StatusPill tone={inventory?.limits.truncated ? "amber" : "emerald"} label={inventory?.limits.truncated ? "Scan plafonné" : "Automatisation gouvernée"} />
              <StatusPill tone="slate" label={inventory?.scanMode === "deep" ? "Analyse approfondie" : "Analyse rapide"} />
            </div>
            <div className="mt-4 flex items-start gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white shadow-xl shadow-slate-950/15">
                <HardDrive className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">OPSOS · Storage Intelligence</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950">Stockage & données</h2>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-slate-600">
                  Pilotage du cycle de vie complet : télémétrie historique, prévisions de saturation, synchronisation fournisseur, déduplication exacte, dry-runs de rétention et orchestration sûre sans contourner les approbations Phase 3–4.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 shadow-sm">
              <input type="checkbox" checked={autoRefresh} onChange={(event) => setAutoRefresh(event.target.checked)} className="accent-blue-600" />
              Auto · 45 s
            </label>
            <button type="button" onClick={() => void load("summary", true)} disabled={scanning} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 shadow-sm transition hover:border-slate-300 disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${scanning ? "animate-spin" : ""}`} /> Actualiser
            </button>
            <button type="button" onClick={() => void load("deep", true)} disabled={scanning} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white shadow-lg shadow-slate-950/15 transition hover:bg-blue-700 disabled:opacity-50">
              {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
              {scanning ? "Analyse en cours…" : "Analyse approfondie"}
            </button>
          </div>
        </div>

        {inventory ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <HeaderMetric label="Dernière synchronisation" value={relative(inventory.scanCompletedAt)} detail={dateTime(inventory.scanCompletedAt)} icon={Clock3} tone="blue" />
            <HeaderMetric label="Durée du scan" value={`${(inventory.scanDurationMs / 1000).toFixed(1)} s`} detail={`${number(inventory.limits.filesVisited)} fichiers inspectés`} icon={TimerReset} tone="violet" />
            <HeaderMetric label="Périmètre classifié" value={bytes(inventory.summary.classifiedBytes)} detail={`${number(inventory.limits.directoriesVisited)} dossiers inspectés`} icon={FolderTree} tone="emerald" />
            <HeaderMetric label="Espace disque libre" value={bytes(inventory.disk.freeBytes)} detail={`${inventory.disk.usedPercent}% utilisé`} icon={HardDrive} tone={inventory.disk.critical ? "rose" : inventory.disk.warning ? "amber" : "emerald"} />
            <HeaderMetric label="État du scanner" value={sourceStatusLabel(inventory.scanStatus)} detail={inventory.cached ? "Résultat mis en cache" : "Mesure directe du nœud"} icon={ShieldCheck} tone={inventory.limits.truncated ? "amber" : "blue"} />
          </div>
        ) : null}
      </header>

      {error ? (
        <div className="flex items-start gap-3 rounded-[22px] border border-rose-200 bg-rose-50 p-4 text-rose-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="min-w-0 flex-1"><p className="text-sm font-black">Inventaire indisponible</p><p className="mt-1 text-xs font-semibold leading-5">{error}</p></div>
          <button type="button" onClick={() => void load("summary", true)} className="rounded-xl bg-white px-3 py-2 text-xs font-black shadow-sm">Réessayer</button>
        </div>
      ) : null}

      {inventory ? (
        <>
          <nav className="flex gap-1 overflow-x-auto rounded-[22px] border border-slate-200 bg-white p-1.5 shadow-sm" aria-label="Navigation stockage et données">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-black transition ${activeTab === tab.id ? "bg-slate-950 text-white shadow-lg shadow-slate-950/15" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}>
                  <Icon className="h-3.5 w-3.5" /> {tab.label}
                </button>
              )
            })}
          </nav>

          {activeTab === "phase5" ? <StorageLifecyclePhase5 onRefreshInventory={() => void load("deep", true)} /> : null}
          {activeTab === "phase4" ? <StorageDestructionPhase4 onRefreshInventory={() => void load("deep", true)} /> : null}
          {activeTab === "phase3" ? <StorageQuarantinePhase3 inventory={inventory} candidate={quarantineCandidate} onClearCandidate={() => setQuarantineCandidate(null)} onRefreshInventory={() => void load("deep", true)} /> : null}
          {activeTab === "phase2" ? <StorageExplorerPhase2 inventory={inventory} onRefreshInventory={() => void load("deep", true)} onQuarantineCandidate={(entry) => { setQuarantineCandidate(entry); setActiveTab("phase3") }} /> : null}
          {activeTab === "overview" ? <OverviewPanel inventory={inventory} onNavigate={setActiveTab} /> : null}
          {activeTab === "categories" ? <CategoriesPanel inventory={inventory} /> : null}
          {activeTab === "email" ? <EmailStoragePanel inventory={inventory} /> : null}
          {activeTab === "largest" ? <LargestFilesPanel files={largestFiltered} query={query} onQuery={setQuery} /> : null}
          {activeTab === "duplicates" ? <DuplicatesPanel groups={inventory.emailStorage.duplicateGroups} /> : null}
          {activeTab === "orphans" ? <OrphansPanel candidates={inventory.emailStorage.orphanCandidates} /> : null}
          {activeTab === "sources" ? <SourcesPanel inventory={inventory} /> : null}
        </>
      ) : null}
    </section>
  )
}

function OverviewPanel({ inventory, onNavigate }: { inventory: WindowsStorageInventory; onNavigate: (tab: WorkspaceTab) => void }) {
  const usedPercent = inventory.disk.usedPercent
  const classifiedPercent = percent(inventory.summary.classifiedBytes, inventory.disk.usedBytes)
  const tone: Tone = inventory.disk.critical ? "rose" : inventory.disk.warning ? "amber" : "emerald"
  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={HardDrive} label="Capacité totale" value={bytes(inventory.disk.totalBytes)} detail={`${usedPercent}% du volume utilisé`} tone="blue" />
        <SummaryCard icon={Database} label="Données classifiées" value={bytes(inventory.summary.classifiedBytes)} detail={`${classifiedPercent}% de l’espace utilisé expliqué`} tone="violet" />
        <SummaryCard icon={Mail} label="Emails & pièces jointes" value={bytes(inventory.summary.attachmentBytes)} detail={`${number(inventory.summary.attachmentFileCount)} fichier(s) Email OS`} tone="emerald" />
        <SummaryCard icon={Sparkles} label="Doublons potentiels" value={bytes(inventory.summary.duplicateRecoverableBytes)} detail={`${number(inventory.summary.duplicateGroupCount)} groupe(s) détecté(s) · aucune suppression`} tone={inventory.summary.duplicateGroupCount ? "amber" : "slate"} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.18fr_.82fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Répartition du volume</p><h3 className="mt-2 text-xl font-black tracking-[-0.035em] text-slate-950">Ce qui consomme réellement l’espace</h3></div>
            <StatusPill tone={tone} label={inventory.disk.critical ? "Capacité critique" : inventory.disk.warning ? "Capacité sous surveillance" : "Capacité maîtrisée"} />
          </div>
          <div className="mt-5 rounded-[22px] border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-black text-slate-700">Volume Windows principal</p><p className="mt-1 text-3xl font-black tracking-[-0.05em] text-slate-950">{bytes(inventory.disk.usedBytes)}</p></div><p className="text-sm font-black text-slate-500">sur {bytes(inventory.disk.totalBytes)}</p></div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white ring-1 ring-slate-200"><div className="h-full rounded-full transition-all" style={{ width: `${usedPercent}%`, background: TONES[tone].solid }} /></div>
            <div className="mt-3 flex flex-wrap justify-between gap-2 text-[11px] font-bold text-slate-500"><span>{bytes(inventory.disk.freeBytes)} disponible</span><span>{deltaLabel(inventory.growth.diskUsedDeltaBytes)}</span></div>
          </div>
          <div className="mt-5 space-y-3">
            {inventory.categories.slice(0, 7).map((category, index) => <CategoryBar key={category.id} category={category} total={inventory.disk.usedBytes} index={index} />)}
          </div>
          <button type="button" onClick={() => onNavigate("categories")} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 hover:border-slate-300">Voir toutes les catégories <BarChart3 className="h-4 w-4" /></button>
        </div>

        <div className="space-y-5">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Intelligence Email OS</p><h3 className="mt-2 text-lg font-black text-slate-950">Qualité du stockage</h3></div><Inbox className="h-5 w-5 text-blue-600" /></div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniMetric label="Métadonnées" value={number(inventory.emailStorage.metadataCount)} detail={bytes(inventory.emailStorage.metadataBytes)} />
              <MiniMetric label="Temporaire" value={bytes(inventory.summary.temporaryBytes)} detail="Téléversements non finalisés" tone={inventory.summary.temporaryBytes ? "amber" : "slate"} />
              <MiniMetric label="Orphelins potentiels" value={number(inventory.summary.orphanCandidateCount)} detail="À confirmer avant action" tone={inventory.summary.orphanCandidateCount ? "amber" : "emerald"} />
              <MiniMetric label="Plus gros fichier" value={bytes(inventory.summary.largestFileBytes)} detail="Tous périmètres autorisés" />
            </div>
            <button type="button" onClick={() => onNavigate("email")} className="mt-4 h-10 w-full rounded-xl bg-slate-950 text-xs font-black text-white">Ouvrir l’intelligence Email OS</button>
          </div>

          <div className="rounded-[28px] border border-blue-200 bg-[linear-gradient(145deg,#eff6ff,#ffffff)] p-5 shadow-sm">
            <div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white"><Info className="h-5 w-5" /></div><div><p className="text-sm font-black text-blue-950">Périmètre de sécurité Phase 1</p><p className="mt-1 text-xs font-semibold leading-5 text-blue-800">Le scanner mesure et classifie uniquement. Aucun bouton de suppression, déplacement, quarantaine ou téléchargement n’est activé dans cette phase.</p></div></div>
          </div>
        </div>
      </section>
    </div>
  )
}

function CategoriesPanel({ inventory }: { inventory: WindowsStorageInventory }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">Classification complète</p><h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">Catégories de consommation</h3><p className="mt-1 text-sm font-semibold text-slate-500">Répertoires autorisés et espace système non exploré, sans exposition de chemin sensible.</p></div><StatusPill tone="slate" label={`${inventory.categories.length} catégories`} /></div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {inventory.categories.map((category, index) => <CategoryCard key={category.id} category={category} total={inventory.disk.usedBytes} index={index} />)}
      </div>
    </section>
  )
}

function EmailStoragePanel({ inventory }: { inventory: WindowsStorageInventory }) {
  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={Mail} label="Stockage Email OS" value={bytes(inventory.emailStorage.totalBytes)} detail={`${number(inventory.emailStorage.fileCount)} pièce(s) jointe(s)`} tone="blue" />
        <SummaryCard icon={Inbox} label="Boîtes identifiées" value={number(inventory.emailStorage.mailboxes.length)} detail="Classement par mailbox_id" tone="violet" />
        <SummaryCard icon={Files} label="Doublons potentiels" value={number(inventory.emailStorage.duplicateGroups.length)} detail={bytes(inventory.summary.duplicateRecoverableBytes)} tone={inventory.emailStorage.duplicateGroups.length ? "amber" : "emerald"} />
        <SummaryCard icon={FileQuestion} label="Références à vérifier" value={number(inventory.emailStorage.orphanCandidates.length)} detail="Candidats seulement · non supprimables" tone={inventory.emailStorage.orphanCandidates.length ? "amber" : "emerald"} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <AggregatePanel title="Stockage par boîte" subtitle="Pièces jointes physiques associées aux identités Email OS" rows={inventory.emailStorage.mailboxes} total={inventory.emailStorage.totalBytes} empty="Aucune boîte identifiée dans les métadonnées." />
        <AggregatePanel title="Flux de stockage" subtitle="Répartition reçue, envoyée, temporaire et archive" rows={inventory.emailStorage.directions} total={inventory.emailStorage.totalBytes} empty="Aucun flux de pièce jointe détecté." />
        <AggregatePanel title="Types de fichiers" subtitle="Classification par format et type MIME" rows={inventory.emailStorage.fileTypes} total={inventory.emailStorage.totalBytes} empty="Aucun type de fichier détecté." />
        <AggregatePanel title="Ancienneté" subtitle="Distribution selon la date de dernière modification" rows={inventory.emailStorage.ageBuckets} total={inventory.emailStorage.totalBytes} empty="Aucune date de fichier disponible." />
      </section>
    </div>
  )
}

function LargestFilesPanel({ files, query, onQuery }: { files: WindowsStorageInventoryFile[]; query: string; onQuery: (value: string) => void }) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">Lecture seule</p><h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">Fichiers volumineux</h3><p className="mt-1 text-sm font-semibold text-slate-500">Top des fichiers détectés dans les sources AngelCare autorisées.</p></div>
        <label className="relative block w-full max-w-md"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Rechercher fichier, boîte ou type…" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none focus:border-blue-300 focus:bg-white" /></label>
      </div>
      <FileTable files={files} />
    </section>
  )
}

function DuplicatesPanel({ groups }: { groups: WindowsStorageDuplicateGroup[] }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">Empreintes SHA-256</p><h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">Doublons potentiels</h3><p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-500">Les groupes partagent la même empreinte de contenu. La Phase 1 les signale sans fusionner ni supprimer aucun objet.</p></div><StatusPill tone={groups.length ? "amber" : "emerald"} label={`${groups.length} groupe(s)`} /></div>
      <div className="mt-5 space-y-3">
        {groups.length ? groups.map((group, index) => <DuplicateCard key={`${group.sha256Hash}-${index}`} group={group} />) : <EmptyState icon={CheckCircle2} title="Aucun doublon confirmé" text="Aucun groupe partageant la même empreinte n’a été détecté dans le périmètre inspecté." />}
      </div>
    </section>
  )
}

function OrphansPanel({ candidates }: { candidates: WindowsStorageOrphanCandidate[] }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">Analyse de références</p><h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">Orphelins potentiels</h3><p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-500">Candidats dont les métadonnées, l’entité ou la boîte semblent incomplètes. Une confirmation avec la base Email OS sera requise avant toute future action.</p></div><StatusPill tone={candidates.length ? "amber" : "emerald"} label={`${candidates.length} candidat(s)`} /></div>
      <div className="mt-5 overflow-hidden rounded-[22px] border border-slate-200">
        {candidates.length ? <OrphanTable candidates={candidates} /> : <EmptyState icon={CheckCircle2} title="Aucune référence suspecte" text="Le scan n’a relevé aucun fichier manifestement privé de métadonnées ou de référence." />}
      </div>
    </section>
  )
}

function SourcesPanel({ inventory }: { inventory: WindowsStorageInventory }) {
  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Synchronisation multi-source</p><h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">État des sources</h3><p className="mt-1 text-sm font-semibold text-slate-500">Ce que le scanner mesure réellement et ce qui reste limité ou hors phase 1.</p></div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{inventory.sourceFreshness.map((source) => <FreshnessCard key={source.id} source={source} />)}</div>
      </section>
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Répertoires allowlistés</p><h3 className="mt-2 text-xl font-black text-slate-950">Inventaire par source Windows</h3></div><StatusPill tone="blue" label="Chemins absolus masqués" /></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{inventory.sources.map((source) => <SourceCard key={source.id} source={source} />)}</div>
      </section>
      {inventory.warnings.length ? <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-5"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><p className="text-sm font-black text-amber-950">Avertissements du scan</p><div className="mt-3 space-y-2">{inventory.warnings.map((warning, index) => <p key={`${warning}-${index}`} className="rounded-xl bg-white/70 px-3 py-2 text-xs font-semibold text-amber-800">{warning}</p>)}</div></div></div></section> : null}
    </div>
  )
}

function HeaderMetric({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: typeof HardDrive; tone: Tone }) {
  const palette = TONES[tone]
  return <div className="rounded-[20px] border bg-white/85 p-3.5" style={{ borderColor: palette.border }}><div className="flex items-start gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ color: palette.text, background: palette.bg }}><Icon className="h-4 w-4" /></div><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">{label}</p><p className="mt-1 truncate text-sm font-black text-slate-950">{value}</p><p className="mt-1 truncate text-[10px] font-semibold text-slate-500">{detail}</p></div></div></div>
}

function SummaryCard({ icon: Icon, label, value, detail, tone }: { icon: typeof HardDrive; label: string; value: string; detail: string; tone: Tone }) {
  const palette = TONES[tone]
  return <article className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"><div className="absolute inset-x-0 top-0 h-1" style={{ background: palette.solid }} /><div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.17em] text-slate-400">{label}</p><p className="mt-3 text-2xl font-black tracking-[-0.045em] text-slate-950">{value}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{detail}</p></div><div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl" style={{ color: palette.text, background: palette.bg }}><Icon className="h-4.5 w-4.5" /></div></div></article>
}

function MiniMetric({ label, value, detail, tone = "slate" }: { label: string; value: string; detail: string; tone?: Tone }) {
  const palette = TONES[tone]
  return <div className="rounded-[18px] border border-slate-100 bg-slate-50 p-3"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p><p className="mt-2 text-lg font-black" style={{ color: tone === "slate" ? "#0f172a" : palette.text }}>{value}</p><p className="mt-1 text-[10px] font-semibold leading-4 text-slate-500">{detail}</p></div>
}

function StatusPill({ tone, label }: { tone: Tone; label: string }) {
  const palette = TONES[tone]
  return <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em]" style={{ color: palette.text, borderColor: palette.border, background: palette.bg }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: palette.solid }} />{label}</span>
}

function CategoryBar({ category, total, index }: { category: WindowsStorageInventoryCategory; total: number; index: number }) {
  const tones: Tone[] = ["blue", "violet", "emerald", "amber", "rose", "slate"]
  const tone = tones[index % tones.length]
  const valuePercent = percent(category.sizeBytes, total)
  return <div><div className="flex items-center justify-between gap-3 text-xs"><div className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: TONES[tone].solid }} /><span className="truncate font-black text-slate-700">{category.label}</span></div><div className="shrink-0 font-black text-slate-950">{bytes(category.sizeBytes)} <span className="ml-1 text-[10px] text-slate-400">{valuePercent}%</span></div></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${Math.max(valuePercent, category.sizeBytes ? 1 : 0)}%`, background: TONES[tone].solid }} /></div></div>
}

function CategoryCard({ category, total, index }: { category: WindowsStorageInventoryCategory; total: number; index: number }) {
  const icons = [Mail, Archive, FileText, Database, FolderTree, Boxes]
  const Icon = icons[index % icons.length]
  const tones: Tone[] = ["blue", "violet", "emerald", "amber", "rose", "slate"]
  const tone = tones[index % tones.length]
  const palette = TONES[tone]
  return <article className="rounded-[24px] border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex items-start justify-between gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl" style={{ color: palette.text, background: palette.bg }}><Icon className="h-5 w-5" /></div><StatusPill tone={sourceTone(category.status)} label={sourceStatusLabel(category.status)} /></div><h4 className="mt-4 text-base font-black text-slate-950">{category.label}</h4><p className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">{bytes(category.sizeBytes)}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${Math.max(percent(category.sizeBytes, total), category.sizeBytes ? 1 : 0)}%`, background: palette.solid }} /></div><div className="mt-3 flex items-center justify-between gap-3 text-[10px] font-bold text-slate-500"><span>{number(category.fileCount)} fichiers</span><span>{percent(category.sizeBytes, total)}%</span></div><p className="mt-3 min-h-[36px] text-[11px] font-semibold leading-5 text-slate-500">{category.detail}</p></article>
}

function AggregatePanel({ title, subtitle, rows, total, empty }: { title: string; subtitle: string; rows: WindowsStorageInventoryAggregate[]; total: number; empty: string }) {
  return <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><div><h3 className="text-lg font-black text-slate-950">{title}</h3><p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p></div><div className="mt-5 space-y-3">{rows.length ? rows.slice(0, 12).map((row, index) => <AggregateRow key={`${row.key}-${index}`} row={row} total={total} index={index} />) : <p className="rounded-2xl bg-slate-50 p-4 text-xs font-semibold text-slate-500">{empty}</p>}</div></section>
}

function AggregateRow({ row, total, index }: { row: WindowsStorageInventoryAggregate; total: number; index: number }) {
  const tones: Tone[] = ["blue", "emerald", "violet", "amber", "rose", "slate"]
  const tone = tones[index % tones.length]
  const ratio = percent(row.sizeBytes, total)
  return <div><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-black text-slate-700">{row.label || row.mailboxId || row.key}</p><p className="mt-0.5 text-[10px] font-semibold text-slate-400">{number(row.fileCount)} fichier(s)</p></div><p className="shrink-0 text-xs font-black text-slate-950">{bytes(row.sizeBytes)}</p></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${Math.max(ratio, row.sizeBytes ? 1 : 0)}%`, background: TONES[tone].solid }} /></div></div>
}

function FileTable({ files }: { files: WindowsStorageInventoryFile[] }) {
  if (!files.length) return <EmptyState icon={FileArchive} title="Aucun fichier correspondant" text="Aucun élément volumineux ne correspond aux critères actuels." />
  return <div className="overflow-x-auto"><table className="w-full min-w-[980px] border-collapse text-left"><thead className="bg-slate-50"><tr className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500"><th className="px-5 py-3">Fichier</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Boîte / direction</th><th className="px-4 py-3">Taille</th><th className="px-4 py-3">Modifié</th><th className="px-4 py-3">Référence</th></tr></thead><tbody>{files.map((file, index) => <tr key={`${file.sourceId}-${file.relativePath}-${index}`} className="border-t border-slate-100 text-xs hover:bg-slate-50/70"><td className="px-5 py-3.5"><p className="max-w-[300px] truncate font-black text-slate-950" title={file.filename}>{file.filename}</p><p className="mt-1 max-w-[300px] truncate text-[10px] font-semibold text-slate-400" title={file.relativePath}>{file.rootAlias}/{file.relativePath}</p></td><td className="px-4 py-3.5"><p className="font-black text-slate-700">{file.sourceLabel}</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">{file.fileType}</p></td><td className="px-4 py-3.5"><p className="font-bold text-slate-700">{file.mailboxId || "—"}</p><p className="mt-1 text-[10px] font-semibold text-slate-400">{file.direction || file.classification}</p></td><td className="px-4 py-3.5 font-black text-slate-950">{bytes(file.sizeBytes)}</td><td className="px-4 py-3.5 text-[11px] font-semibold text-slate-500">{dateTime(file.modifiedAt)}</td><td className="px-4 py-3.5"><StatusPill tone={file.referenceState === "referenced" ? "emerald" : file.referenceState ? "amber" : "slate"} label={file.referenceState === "referenced" ? "Référencé" : file.referenceState ? "À vérifier" : "Non évalué"} /></td></tr>)}</tbody></table></div>
}

function DuplicateCard({ group }: { group: WindowsStorageDuplicateGroup }) {
  return <article className="rounded-[22px] border border-slate-200 bg-slate-50/60 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-black text-slate-950">{group.fileCount} copies du même contenu</p><p className="mt-1 text-[10px] font-semibold text-slate-400">Empreinte {group.sha256Hash.slice(0, 18)}…</p></div><div className="text-right"><p className="text-sm font-black text-amber-700">{bytes(group.recoverableBytes)} potentiel</p><p className="mt-1 text-[10px] font-semibold text-slate-400">sur {bytes(group.totalBytes)}</p></div></div><div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{group.files.slice(0, 6).map((file, index) => <div key={`${file.relativePath}-${index}`} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5"><p className="truncate text-xs font-black text-slate-800">{file.filename}</p><p className="mt-1 truncate text-[10px] font-semibold text-slate-400">{file.mailboxId || file.sourceLabel} · {bytes(file.sizeBytes)}</p></div>)}</div></article>
}

function OrphanTable({ candidates }: { candidates: WindowsStorageOrphanCandidate[] }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[900px] border-collapse text-left"><thead className="bg-slate-50"><tr className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500"><th className="px-4 py-3">Fichier</th><th className="px-4 py-3">Cause détectée</th><th className="px-4 py-3">Boîte</th><th className="px-4 py-3">Flux</th><th className="px-4 py-3">Taille</th><th className="px-4 py-3">État</th></tr></thead><tbody>{candidates.map((candidate, index) => <tr key={`${candidate.relativePath}-${index}`} className="border-t border-slate-100 text-xs"><td className="px-4 py-3.5"><p className="max-w-[260px] truncate font-black text-slate-950">{candidate.filename}</p><p className="mt-1 max-w-[260px] truncate text-[10px] font-semibold text-slate-400">{candidate.rootAlias}/{candidate.relativePath}</p></td><td className="px-4 py-3.5 max-w-[300px] font-semibold text-slate-600">{candidate.reason}</td><td className="px-4 py-3.5 font-bold text-slate-700">{candidate.mailboxId || "Non attribuée"}</td><td className="px-4 py-3.5 font-bold text-slate-500">{candidate.direction}</td><td className="px-4 py-3.5 font-black text-slate-950">{bytes(candidate.sizeBytes)}</td><td className="px-4 py-3.5"><StatusPill tone="amber" label="À confirmer" /></td></tr>)}</tbody></table></div>
}

function FreshnessCard({ source }: { source: WindowsStorageInventoryFreshness }) {
  const tone = sourceTone(source.status)
  const palette = TONES[tone]
  return <article className="rounded-[22px] border p-4" style={{ borderColor: palette.border, background: tone === "slate" ? "#fff" : palette.bg }}><div className="flex items-start justify-between gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-sm" style={{ color: palette.text }}><Database className="h-4 w-4" /></div><StatusPill tone={tone} label={sourceStatusLabel(source.status)} /></div><h4 className="mt-4 text-sm font-black text-slate-950">{source.label}</h4><p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{source.detail}</p><p className="mt-3 text-[10px] font-bold text-slate-400">{source.lastSyncedAt ? `Synchronisé ${relative(source.lastSyncedAt)}` : "Aucune mesure disponible"}</p></article>
}

function SourceCard({ source }: { source: WindowsStorageInventorySource }) {
  const tone = sourceTone(source.status)
  return <article className="rounded-[22px] border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-600"><FolderTree className="h-4 w-4" /></div><StatusPill tone={tone} label={sourceStatusLabel(source.status)} /></div><h4 className="mt-4 text-sm font-black text-slate-950">{source.label}</h4><p className="mt-1 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">{source.rootAlias}</p><p className="mt-3 text-xl font-black tracking-[-0.04em] text-slate-950">{bytes(source.sizeBytes)}</p><div className="mt-3 grid grid-cols-2 gap-2"><MiniMetric label="Fichiers" value={number(source.fileCount)} detail="inspectés" /><MiniMetric label="Dossiers" value={number(source.directoryCount)} detail="traversés" /></div>{source.topFolders.length ? <div className="mt-3"><p className="text-[9px] font-black uppercase tracking-[0.13em] text-slate-400">Principaux dossiers</p><div className="mt-2 space-y-1.5">{source.topFolders.slice(0, 3).map((folder) => <div key={folder.key} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-2 text-[10px]"><span className="truncate font-bold text-slate-600">{folder.label || folder.key}</span><span className="shrink-0 font-black text-slate-900">{bytes(folder.sizeBytes)}</span></div>)}</div></div> : null}</article>
}

function EmptyState({ icon: Icon, title, text }: { icon: typeof FileArchive; title: string; text: string }) {
  return <div className="grid min-h-[240px] place-items-center p-8 text-center"><div className="max-w-md"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Icon className="h-6 w-6" /></div><h4 className="mt-4 text-base font-black text-slate-800">{title}</h4><p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{text}</p></div></div>
}

function StorageSkeleton() {
  return <div className="space-y-5 animate-pulse"><div className="h-64 rounded-[30px] border border-slate-200 bg-white" /><div className="h-14 rounded-[22px] border border-slate-200 bg-white" /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-40 rounded-[24px] bg-white" />)}</div><div className="grid gap-5 xl:grid-cols-2"><div className="h-[420px] rounded-[28px] bg-white" /><div className="h-[420px] rounded-[28px] bg-white" /></div></div>
}
