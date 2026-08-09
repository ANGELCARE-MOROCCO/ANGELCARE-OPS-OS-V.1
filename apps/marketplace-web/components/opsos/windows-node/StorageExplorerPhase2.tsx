"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Database,
  Download,
  Eye,
  File,
  FileArchive,
  FileImage,
  FileQuestion,
  FileSearch,
  FileText,
  Files,
  Folder,
  FolderOpen,
  HardDrive,
  Inbox,
  Info,
  Link2,
  Loader2,
  Mail,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react"
import type {
  WindowsStorageBrowseResult,
  WindowsStorageDuplicateGroup,
  WindowsStorageDuplicateInvestigation,
  WindowsStorageEmailInvestigationResult,
  WindowsStorageEmailReference,
  WindowsStorageExplorerEntry,
  WindowsStorageFileDossier,
  WindowsStorageInventory,
  WindowsStorageMessageRecord,
  WindowsStorageOrphanInvestigation,
  WindowsStoragePreviewResult,
} from "@/lib/opsos/windows-node-types"

type Phase2Tab = "explorer" | "attachments" | "messages" | "largest" | "duplicates" | "orphans" | "sync"
type Tone = "blue" | "emerald" | "amber" | "rose" | "violet" | "slate"

type ApiResult<T> = { ok: boolean; data?: T; error?: string; errorMessage?: string }

type Props = {
  inventory: WindowsStorageInventory
  onRefreshInventory?: () => void
  onQuarantineCandidate?: (entry: WindowsStorageExplorerEntry) => void
}

const TABS: Array<{ id: Phase2Tab; label: string; icon: typeof FolderOpen }> = [
  { id: "explorer", label: "Explorateur", icon: FolderOpen },
  { id: "attachments", label: "Pièces jointes Email OS", icon: FileArchive },
  { id: "messages", label: "Messages", icon: MessageSquareText },
  { id: "largest", label: "Fichiers volumineux", icon: HardDrive },
  { id: "duplicates", label: "Doublons", icon: Files },
  { id: "orphans", label: "Orphelins", icon: FileQuestion },
  { id: "sync", label: "Sources & synchronisation", icon: Database },
]

const TONES: Record<Tone, { bg: string; border: string; text: string; solid: string }> = {
  blue: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", solid: "#2563eb" },
  emerald: { bg: "#ecfdf5", border: "#a7f3d0", text: "#047857", solid: "#10b981" },
  amber: { bg: "#fffbeb", border: "#fde68a", text: "#b45309", solid: "#f59e0b" },
  rose: { bg: "#fff1f2", border: "#fecdd3", text: "#be123c", solid: "#f43f5e" },
  violet: { bg: "#f5f3ff", border: "#ddd6fe", text: "#6d28d9", solid: "#7c3aed" },
  slate: { bg: "#f8fafc", border: "#e2e8f0", text: "#475569", solid: "#64748b" },
}

function bytes(value?: number | null) {
  let amount = Number(value || 0)
  if (!Number.isFinite(amount) || amount <= 0) return "0 o"
  const units = ["o", "Ko", "Mo", "Go", "To"]
  let unit = 0
  while (amount >= 1024 && unit < units.length - 1) {
    amount /= 1024
    unit += 1
  }
  return `${amount.toLocaleString("fr-FR", { maximumFractionDigits: unit >= 3 ? 1 : 0 })} ${units[unit]}`
}

function dateTime(value?: string | null) {
  if (!value) return "Non disponible"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(parsed)
}

function relative(value?: string | null) {
  if (!value) return "Jamais"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "Indisponible"
  const minutes = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 60000))
  if (minutes < 1) return "À l’instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours} h`
  return `Il y a ${Math.floor(hours / 24)} j`
}

function toneForStatus(status?: string | null): Tone {
  const value = String(status || "").toLowerCase()
  if (["ready", "synced", "complete", "referenced", "safe_preview", "active"].some((token) => value.includes(token))) return "emerald"
  if (["partial", "warning", "probable", "review", "missing", "unresolved", "temp"].some((token) => value.includes(token))) return "amber"
  if (["blocked", "unavailable", "critical", "confirmed"].some((token) => value.includes(token))) return "rose"
  if (value.includes("email") || value.includes("inbound") || value.includes("outbound")) return "blue"
  return "slate"
}

function explorerPathFromInventoryFile(file: WindowsStorageInventory["largestFiles"][number]) {
  if (file.sourceId !== "email_attachments") return file.relativePath
  const direction = file.direction || file.rootAlias.split("/").filter(Boolean).at(-1) || ""
  if (!direction || file.relativePath.startsWith(`${direction}/`)) return file.relativePath
  return `${direction}/${file.relativePath}`
}

function fileIcon(entry: WindowsStorageExplorerEntry) {
  if (entry.entryType === "directory") return Folder
  if (entry.previewKind === "image") return FileImage
  if (entry.previewKind === "pdf" || entry.previewKind === "text" || entry.previewKind === "json" || entry.previewKind === "csv") return FileText
  return File
}

async function api<T>(path: string): Promise<ApiResult<T>> {
  const response = await fetch(path, { cache: "no-store" })
  const json = await response.json().catch(() => ({}))
  return {
    ok: Boolean(response.ok && json?.ok !== false),
    data: json?.data,
    error: json?.error,
    errorMessage: json?.errorMessage,
  }
}

export default function StorageExplorerPhase2({ inventory, onRefreshInventory, onQuarantineCandidate }: Props) {
  const [activeTab, setActiveTab] = useState<Phase2Tab>("explorer")
  const [sourceId, setSourceId] = useState("email_attachments")
  const [currentPath, setCurrentPath] = useState(".")
  const [query, setQuery] = useState("")
  const [browse, setBrowse] = useState<WindowsStorageBrowseResult | null>(null)
  const [browseLoading, setBrowseLoading] = useState(false)
  const [browseError, setBrowseError] = useState<string | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<WindowsStorageExplorerEntry | null>(null)
  const [dossier, setDossier] = useState<WindowsStorageFileDossier | null>(null)
  const [preview, setPreview] = useState<WindowsStoragePreviewResult | null>(null)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [emailData, setEmailData] = useState<WindowsStorageEmailInvestigationResult | null>(null)
  const [relationData, setRelationData] = useState<WindowsStorageEmailInvestigationResult | null>(null)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [duplicates, setDuplicates] = useState<WindowsStorageDuplicateInvestigation | null>(null)
  const [orphans, setOrphans] = useState<WindowsStorageOrphanInvestigation | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [selectedDuplicate, setSelectedDuplicate] = useState<WindowsStorageDuplicateGroup | null>(null)

  async function loadBrowse(nextSource = sourceId, nextPath = currentPath, nextQuery = query) {
    setBrowseLoading(true)
    setBrowseError(null)
    const params = new URLSearchParams({ sourceId: nextSource, path: nextPath, limit: "180" })
    if (nextQuery.trim()) {
      params.set("query", nextQuery.trim())
      params.set("recursive", "1")
    }
    const result = await api<WindowsStorageBrowseResult>(`/api/opsos/windows-node/storage/browse?${params.toString()}`)
    setBrowseLoading(false)
    if (!result.ok || !result.data) {
      setBrowseError(result.errorMessage || result.error || "Explorateur de stockage indisponible.")
      return
    }
    setBrowse(result.data)
    setSourceId(nextSource)
    setCurrentPath(nextPath)
  }

  async function openEntry(entry: WindowsStorageExplorerEntry) {
    if (entry.entryType === "directory") {
      setQuery("")
      await loadBrowse(entry.sourceId, entry.relativePath, "")
      return
    }
    setSelectedEntry(entry)
    setDossier(null)
    setPreview(null)
    setRelationData(null)
    setDrawerLoading(true)
    const params = new URLSearchParams({ sourceId: entry.sourceId, path: entry.relativePath })
    const result = await api<WindowsStorageFileDossier>(`/api/opsos/windows-node/storage/file?${params.toString()}`)
    if (result.ok && result.data) setDossier(result.data)
    if (entry.previewable) {
      const previewResult = await api<WindowsStoragePreviewResult>(`/api/opsos/windows-node/storage/preview?${params.toString()}`)
      if (previewResult.ok && previewResult.data) setPreview(previewResult.data)
    }
    setDrawerLoading(false)
  }

  async function loadEmail(mode: "attachments" | "messages", search = query) {
    setEmailLoading(true)
    setEmailError(null)
    const params = new URLSearchParams({ mode, limit: "180" })
    if (search.trim()) params.set("query", search.trim())
    const result = await api<WindowsStorageEmailInvestigationResult>(`/api/opsos/windows-node/storage/email?${params.toString()}`)
    setEmailLoading(false)
    if (!result.ok || !result.data) {
      setEmailError(result.errorMessage || result.error || "Relations Email OS indisponibles.")
      return
    }
    setEmailData(result.data)
  }

  async function loadDuplicates() {
    setAnalysisLoading(true)
    const result = await api<WindowsStorageDuplicateInvestigation>("/api/opsos/windows-node/storage/duplicates")
    if (result.ok && result.data) setDuplicates(result.data)
    setAnalysisLoading(false)
  }

  async function loadOrphans() {
    setAnalysisLoading(true)
    const result = await api<WindowsStorageOrphanInvestigation>("/api/opsos/windows-node/storage/orphans")
    if (result.ok && result.data) setOrphans(result.data)
    setAnalysisLoading(false)
  }

  useEffect(() => {
    void loadBrowse("email_attachments", ".", "")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (activeTab === "attachments") void loadEmail("attachments", query)
    if (activeTab === "messages") void loadEmail("messages", query)
    if (activeTab === "duplicates" && !duplicates) void loadDuplicates()
    if (activeTab === "orphans" && !orphans) void loadOrphans()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const sources = browse?.sources || inventory.sources.map((source) => ({ ...source, readOnly: true as const, detail: `${source.fileCount} fichier(s)` }))
  const selectedFileRelation = useMemo(() => {
    if (!dossier?.fileId && !dossier?.entityId) return null
    return `/api/opsos/windows-node/storage/email?mode=relationship&fileId=${encodeURIComponent(dossier.fileId || "")}&entityId=${encodeURIComponent(dossier.entityId || "")}&limit=30`
  }, [dossier])

  useEffect(() => {
    if (!selectedFileRelation) return
    void api<WindowsStorageEmailInvestigationResult>(selectedFileRelation).then((result) => {
      if (result.ok && result.data) setRelationData(result.data)
    })
  }, [selectedFileRelation])

  return (
    <section className="space-y-5">
      <header className="overflow-hidden rounded-[30px] border border-white bg-[linear-gradient(135deg,#ffffff,#f5faff_55%,#eef4ff)] p-5 shadow-[0_22px_70px_rgba(15,23,42,.08)] ring-1 ring-slate-200/70 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="blue" label="Phase 2 · Exploration sécurisée" />
              <Pill tone="emerald" label="Lecture seule" />
              <Pill tone="slate" label="Aucune suppression autorisée" />
            </div>
            <div className="mt-4 flex items-start gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white shadow-xl shadow-slate-950/15"><FileSearch className="h-6 w-6" /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">OPSOS · Storage Investigation</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950">Explorateur, traçabilité et aperçu sécurisé</h2>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-slate-600">Parcourez uniquement les sources AngelCare approuvées, reliez les fichiers aux boîtes et messages Email OS, inspectez les doublons et les références incomplètes, puis prévisualisez les formats sûrs sans ouvrir de chemin Windows arbitraire.</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/api/opsos/windows-node/storage/export?format=csv" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 shadow-sm"><Download className="h-4 w-4" />Exporter CSV</a>
            <a href="/api/opsos/windows-node/storage/export?format=json" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 shadow-sm"><Download className="h-4 w-4" />Exporter JSON</a>
            <button type="button" onClick={() => { onRefreshInventory?.(); void loadBrowse(sourceId, currentPath, query) }} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white"><RefreshCw className="h-4 w-4" />Resynchroniser</button>
          </div>
        </div>
      </header>

      <nav className="flex gap-2 overflow-x-auto rounded-[22px] border border-slate-200 bg-white p-2 shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-black transition ${activeTab === tab.id ? "bg-slate-950 text-white shadow-lg" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}><Icon className="h-3.5 w-3.5" />{tab.label}</button>
        })}
      </nav>

      {activeTab === "explorer" ? (
        <ExplorerWorkspace
          sources={sources}
          sourceId={sourceId}
          browse={browse}
          loading={browseLoading}
          error={browseError}
          query={query}
          onQuery={setQuery}
          onSearch={() => void loadBrowse(sourceId, currentPath, query)}
          onSource={(id) => { setQuery(""); void loadBrowse(id, ".", "") }}
          onPath={(path) => { setQuery(""); void loadBrowse(sourceId, path, "") }}
          onEntry={(entry) => void openEntry(entry)}
        />
      ) : null}

      {activeTab === "attachments" ? <AttachmentsPanel data={emailData} loading={emailLoading} error={emailError} query={query} onQuery={setQuery} onSearch={() => void loadEmail("attachments", query)} /> : null}
      {activeTab === "messages" ? <MessagesPanel data={emailData} loading={emailLoading} error={emailError} query={query} onQuery={setQuery} onSearch={() => void loadEmail("messages", query)} /> : null}
      {activeTab === "largest" ? <LargestPanel inventory={inventory} onOpen={(file) => void openEntry({ ...file, relativePath: explorerPathFromInventoryFile(file), parentRelativePath: ".", name: file.filename, entryType: "file", lastAccessedAt: null, referenceCount: file.entityId ? 1 : 0, previewKind: file.fileType === "pdf" ? "pdf" : file.fileType === "images" ? "image" : ["text_logs", "json", "csv"].includes(file.fileType) ? "text" : "unsupported", previewable: ["pdf", "images", "text_logs", "json", "csv"].includes(file.fileType), blockedReason: null, safetyStatus: "metadata_only", contentType: file.contentType || null } as WindowsStorageExplorerEntry)} /> : null}
      {activeTab === "duplicates" ? <DuplicatesPanel data={duplicates} loading={analysisLoading} selected={selectedDuplicate} onSelect={setSelectedDuplicate} onRefresh={() => void loadDuplicates()} /> : null}
      {activeTab === "orphans" ? <OrphansPanel data={orphans} loading={analysisLoading} onRefresh={() => void loadOrphans()} /> : null}
      {activeTab === "sync" ? <SyncPanel inventory={inventory} browse={browse} /> : null}

      {selectedEntry ? <FileDossierDrawer entry={selectedEntry} dossier={dossier} preview={preview} loading={drawerLoading} relation={relationData} onQuarantine={onQuarantineCandidate ? () => { onQuarantineCandidate(selectedEntry); setSelectedEntry(null); setDossier(null); setPreview(null) } : undefined} onClose={() => { setSelectedEntry(null); setDossier(null); setPreview(null) }} /> : null}
    </section>
  )
}

function ExplorerWorkspace({ sources, sourceId, browse, loading, error, query, onQuery, onSearch, onSource, onPath, onEntry }: {
  sources: Array<{ id: string; label: string; kind: string; rootAlias: string; status: string; detail?: string }>
  sourceId: string
  browse: WindowsStorageBrowseResult | null
  loading: boolean
  error: string | null
  query: string
  onQuery: (value: string) => void
  onSearch: () => void
  onSource: (id: string) => void
  onPath: (path: string) => void
  onEntry: (entry: WindowsStorageExplorerEntry) => void
}) {
  return (
    <div className="grid min-h-[640px] gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
        <p className="px-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Sources autorisées</p>
        <div className="mt-3 space-y-2">
          {sources.map((source) => {
            const active = source.id === sourceId
            return <button key={source.id} type="button" onClick={() => onSource(source.id)} className={`w-full rounded-2xl border p-3 text-left transition ${active ? "border-blue-200 bg-blue-50 shadow-sm" : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"}`}><div className="flex items-start gap-3"><div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}><FolderTreeIcon kind={source.kind} /></div><div className="min-w-0"><p className={`truncate text-xs font-black ${active ? "text-blue-950" : "text-slate-800"}`}>{source.label}</p><p className="mt-1 truncate text-[10px] font-semibold text-slate-500">{source.detail || source.rootAlias}</p><div className="mt-2"><Pill tone={toneForStatus(source.status)} label={source.status} small /></div></div></div></button>
          })}
        </div>
        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-[11px] font-semibold leading-5 text-blue-800"><ShieldCheck className="mb-2 h-4 w-4" />Le navigateur ne peut sortir d’aucune racine autorisée. Les chemins absolus restent masqués.</div>
      </aside>

      <section className="min-w-0 rounded-[26px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative min-w-0 flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => onQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") onSearch() }} placeholder="Rechercher fichier, extension, boîte ou chemin autorisé…" className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-950 outline-none focus:border-blue-300 focus:bg-white" /></label>
            <button type="button" onClick={onSearch} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-xs font-black text-white"><Search className="h-4 w-4" />Rechercher</button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {(browse?.breadcrumbs || []).map((crumb, index) => <div key={`${crumb.relativePath}-${index}`} className="flex items-center gap-1.5"><button type="button" onClick={() => onPath(crumb.relativePath)} className="rounded-lg px-2 py-1 text-[11px] font-black text-slate-600 hover:bg-slate-100 hover:text-slate-950">{crumb.label}</button>{index < (browse?.breadcrumbs.length || 0) - 1 ? <ChevronRight className="h-3 w-3 text-slate-300" /> : null}</div>)}
          </div>
        </div>

        {error ? <div className="m-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</div> : null}
        {loading ? <div className="grid min-h-[420px] place-items-center"><div className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" /><p className="mt-3 text-sm font-black text-slate-600">Exploration sécurisée en cours…</p></div></div> : null}
        {!loading && browse ? (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 text-[11px] font-bold text-slate-500"><span>{browse.returned} résultat(s) affiché(s) · {browse.totalMatched} trouvé(s)</span><span>Scan {browse.scanDurationMs} ms · {browse.recursive ? "Recherche récursive" : "Dossier courant"}</span></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead className="bg-slate-50 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500"><tr><th className="px-5 py-3">Élément</th><th className="px-4 py-3">Catégorie</th><th className="px-4 py-3">Taille</th><th className="px-4 py-3">Boîte / référence</th><th className="px-4 py-3">Modifié</th><th className="px-4 py-3">Sécurité</th><th className="px-5 py-3 text-right">Inspection</th></tr></thead>
                <tbody>
                  {browse.entries.map((entry) => {
                    const Icon = fileIcon(entry)
                    return <tr key={`${entry.sourceId}:${entry.relativePath}`} className="border-t border-slate-100 text-sm hover:bg-slate-50/70"><td className="px-5 py-3.5"><div className="flex min-w-0 items-center gap-3"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${entry.entryType === "directory" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}><Icon className="h-4.5 w-4.5" /></div><div className="min-w-0"><p className="max-w-[320px] truncate font-black text-slate-950">{entry.name}</p><p className="mt-1 max-w-[360px] truncate text-[10px] font-semibold text-slate-400">{entry.relativePath}</p></div></div></td><td className="px-4 py-3.5"><Pill tone={toneForStatus(entry.classification)} label={entry.fileType} small /></td><td className="px-4 py-3.5 text-xs font-black text-slate-700">{entry.entryType === "directory" ? "Dossier" : bytes(entry.sizeBytes)}</td><td className="px-4 py-3.5"><p className="max-w-[180px] truncate text-xs font-black text-slate-700">{entry.mailboxId || entry.entityType || "Système de fichiers"}</p><p className="mt-1 max-w-[180px] truncate text-[10px] font-semibold text-slate-400">{entry.entityId || entry.referenceState || "—"}</p></td><td className="px-4 py-3.5 text-xs font-semibold text-slate-500">{dateTime(entry.modifiedAt)}</td><td className="px-4 py-3.5"><Pill tone={toneForStatus(entry.safetyStatus)} label={entry.safetyStatus.replaceAll("_", " ")} small /></td><td className="px-5 py-3.5 text-right"><button type="button" onClick={() => onEntry(entry)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:border-blue-200 hover:text-blue-700">{entry.entryType === "directory" ? <FolderOpen className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}{entry.entryType === "directory" ? "Ouvrir" : "Inspecter"}</button></td></tr>
                  })}
                </tbody>
              </table>
            </div>
            {!browse.entries.length ? <div className="grid min-h-[300px] place-items-center text-center"><div><FileSearch className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 text-sm font-black text-slate-700">Aucun élément trouvé</p><p className="mt-1 text-xs font-semibold text-slate-500">Modifiez la recherche ou choisissez une autre source.</p></div></div> : null}
          </div>
        ) : null}
      </section>
    </div>
  )
}

function AttachmentsPanel({ data, loading, error, query, onQuery, onSearch }: { data: WindowsStorageEmailInvestigationResult | null; loading: boolean; error: string | null; query: string; onQuery: (value: string) => void; onSearch: () => void }) {
  const rows = data?.attachments || []
  return <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><WorkspaceHeader eyebrow="Email OS · Relations de stockage" title="Pièces jointes et contexte métier" description="Chaque objet de stockage est rapproché de sa boîte, de son message, de son statut et de sa référence physique." icon={FileArchive} count={`${rows.length} relation(s)`} /><SearchRow query={query} onQuery={onQuery} onSearch={onSearch} placeholder="Rechercher nom de fichier, boîte, sujet ou expéditeur…" />{error ? <ErrorBox text={error} /> : null}{loading ? <LoadingBlock label="Rapprochement des pièces jointes…" /> : <AttachmentTable rows={rows} warnings={data?.warnings || []} />}</section>
}

function MessagesPanel({ data, loading, error, query, onQuery, onSearch }: { data: WindowsStorageEmailInvestigationResult | null; loading: boolean; error: string | null; query: string; onQuery: (value: string) => void; onSearch: () => void }) {
  const rows = data?.messages || []
  return <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><WorkspaceHeader eyebrow="Email OS · Message storage" title="Messages, corps et volumes associés" description="Distinguez la taille du corps du message, les pièces jointes physiques, les flux reçus, envoyés et les brouillons." icon={MessageSquareText} count={`${rows.length} message(s)`} /><SearchRow query={query} onQuery={onQuery} onSearch={onSearch} placeholder="Rechercher sujet, expéditeur, destinataire ou boîte…" />{error ? <ErrorBox text={error} /> : null}{loading ? <LoadingBlock label="Analyse des messages…" /> : <MessageTable rows={rows} warnings={data?.warnings || []} />}</section>
}

function LargestPanel({ inventory, onOpen }: { inventory: WindowsStorageInventory; onOpen: (file: WindowsStorageInventory["largestFiles"][number]) => void }) {
  return <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><WorkspaceHeader eyebrow="Priorisation" title="Registre des fichiers les plus volumineux" description="Top des objets physiques présents dans les sources approuvées, sans action destructive." icon={HardDrive} count={`${inventory.largestFiles.length} fichier(s)`} /><div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200"><table className="w-full min-w-[900px] border-collapse text-left"><thead className="bg-slate-50 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500"><tr><th className="px-4 py-3">Fichier</th><th className="px-4 py-3">Taille</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Boîte</th><th className="px-4 py-3">Référence</th><th className="px-4 py-3 text-right">Dossier</th></tr></thead><tbody>{inventory.largestFiles.map((file) => <tr key={`${file.sourceId}:${file.relativePath}`} className="border-t border-slate-100 text-sm hover:bg-slate-50"><td className="px-4 py-3.5"><p className="max-w-[300px] truncate font-black text-slate-950">{file.filename}</p><p className="mt-1 max-w-[340px] truncate text-[10px] font-semibold text-slate-400">{file.relativePath}</p></td><td className="px-4 py-3.5 text-xs font-black text-slate-700">{bytes(file.sizeBytes)}</td><td className="px-4 py-3.5 text-xs font-semibold text-slate-600">{file.sourceLabel}</td><td className="px-4 py-3.5 text-xs font-semibold text-slate-600">{file.mailboxId || "—"}</td><td className="px-4 py-3.5"><Pill tone={toneForStatus(file.referenceState)} label={(file.referenceState || "filesystem").replaceAll("_", " ")} small /></td><td className="px-4 py-3.5 text-right"><button type="button" onClick={() => onOpen(file)} className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700">Inspecter</button></td></tr>)}</tbody></table></div></section>
}

function DuplicatesPanel({ data, loading, selected, onSelect, onRefresh }: { data: WindowsStorageDuplicateInvestigation | null; loading: boolean; selected: WindowsStorageDuplicateGroup | null; onSelect: (group: WindowsStorageDuplicateGroup | null) => void; onRefresh: () => void }) {
  if (loading && !data) return <LoadingBlock label="Calcul des groupes de doublons…" />
  const groups = data?.groups || []
  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]"><section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><WorkspaceHeader eyebrow="SHA-256" title="Groupes de contenus identiques" description="Des noms différents peuvent pointer vers un contenu strictement identique. Phase 2 prouve les occurrences sans dédupliquer." icon={Files} count={`${groups.length} groupe(s)`} action={<button type="button" onClick={onRefresh} className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700">Recalculer</button>} /><div className="mt-5 space-y-3">{groups.map((group) => <button key={group.sha256Hash} type="button" onClick={() => onSelect(group)} className={`w-full rounded-2xl border p-4 text-left transition ${selected?.sha256Hash === group.sha256Hash ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-black text-slate-950">{group.fileCount} copies · {bytes(group.sizeBytes)} chacune</p><p className="mt-1 max-w-[560px] truncate font-mono text-[10px] text-slate-400">{group.sha256Hash}</p></div><Pill tone="amber" label={`${bytes(group.recoverableBytes)} potentiel`} /></div></button>)}</div>{!groups.length ? <EmptyState icon={CheckCircle2} title="Aucun doublon confirmé" text="Le scan approfondi n’a détecté aucun groupe SHA-256 identique." /> : null}</section><section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">{selected ? <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">Dossier du groupe</p><h3 className="mt-2 text-xl font-black text-slate-950">{selected.fileCount} occurrences physiques</h3><div className="mt-4 grid grid-cols-2 gap-3"><Metric label="Volume total" value={bytes(selected.totalBytes)} /><Metric label="Récupérable futur" value={bytes(selected.recoverableBytes)} tone="amber" /></div><div className="mt-4 space-y-2">{selected.files.map((file) => <div key={`${file.sourceId}:${file.relativePath}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="truncate text-xs font-black text-slate-800">{file.filename}</p><p className="mt-1 truncate text-[10px] font-semibold text-slate-400">{file.mailboxId || file.sourceLabel} · {file.relativePath}</p></div>)}</div><div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-xs font-semibold leading-5 text-blue-800">Aucune consolidation n’est exécutée en Phase 2. Les références métier doivent être confirmées avant la future phase de déduplication.</div></div> : <EmptyState icon={Files} title="Sélectionnez un groupe" text="Le dossier détaillera chaque copie physique, sa boîte et sa référence." />}</section></div>
}

function OrphansPanel({ data, loading, onRefresh }: { data: WindowsStorageOrphanInvestigation | null; loading: boolean; onRefresh: () => void }) {
  if (loading && !data) return <LoadingBlock label="Vérification des références incomplètes…" />
  const rows = data?.candidates || []
  return <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><WorkspaceHeader eyebrow="Analyse prudente" title="Candidats orphelins et confiance" description="Un fichier n’est jamais déclaré supprimable. La confiance indique uniquement le niveau de vérification requis." icon={FileQuestion} count={`${rows.length} candidat(s)`} action={<button type="button" onClick={onRefresh} className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700">Actualiser</button>} /><div className="mt-5 grid gap-4 md:grid-cols-3"><Metric label="Confirmés techniques" value={String(data?.confirmedCount || 0)} tone="rose" /><Metric label="Probables" value={String(data?.probableCount || 0)} tone="amber" /><Metric label="Révision requise" value={String(data?.reviewRequiredCount || 0)} tone="blue" /></div><div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200"><table className="w-full min-w-[1000px] border-collapse text-left"><thead className="bg-slate-50 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500"><tr><th className="px-4 py-3">Fichier</th><th className="px-4 py-3">Type de candidat</th><th className="px-4 py-3">Confiance</th><th className="px-4 py-3">Références</th><th className="px-4 py-3">Impact métier</th><th className="px-4 py-3">Revue recommandée</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.rootAlias}:${row.relativePath}:${index}`} className="border-t border-slate-100 align-top text-sm"><td className="px-4 py-3.5"><p className="max-w-[260px] truncate font-black text-slate-950">{row.filename}</p><p className="mt-1 text-[10px] font-semibold text-slate-400">{bytes(row.sizeBytes)} · {row.mailboxId || "boîte inconnue"}</p></td><td className="px-4 py-3.5 text-xs font-semibold text-slate-600">{row.candidateType.replaceAll("_", " ")}</td><td className="px-4 py-3.5"><Pill tone={toneForStatus(row.confidence)} label={row.confidence.replaceAll("_", " ")} small /></td><td className="px-4 py-3.5 text-xs font-black text-slate-700">{row.referenceCount}</td><td className="px-4 py-3.5 max-w-[250px] text-xs font-semibold leading-5 text-slate-600">{row.businessImpact}</td><td className="px-4 py-3.5 max-w-[250px] text-xs font-semibold leading-5 text-slate-600">{row.recommendedReview}</td></tr>)}</tbody></table></div>{!rows.length ? <EmptyState icon={CheckCircle2} title="Aucun candidat détecté" text="Toutes les pièces jointes scannées possèdent une cohérence locale suffisante." /> : null}</section>
}

function SyncPanel({ inventory, browse }: { inventory: WindowsStorageInventory; browse: WindowsStorageBrowseResult | null }) {
  return <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><WorkspaceHeader eyebrow="Sources" title="État de synchronisation et couverture" description="La page expose clairement les sources disponibles, partielles, limitées ou non configurées." icon={Database} count={`${inventory.sourceFreshness.length} source(s)`} /><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{inventory.sourceFreshness.map((source) => <div key={source.id} className="rounded-[22px] border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-slate-950">{source.label}</p><p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{source.detail}</p></div><Pill tone={toneForStatus(source.status)} label={source.status.replaceAll("_", " ")} small /></div><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] font-bold text-slate-500"><span>Dernière donnée</span><span>{relative(source.lastSyncedAt)}</span></div></div>)}</div>{browse ? <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs font-semibold leading-6 text-blue-800"><Info className="mr-2 inline h-4 w-4" />Dernière exploration Phase 2 : {dateTime(browse.scannedAt)} · {browse.returned} résultat(s) · {browse.scanDurationMs} ms.</div> : null}</section>
}

function FileDossierDrawer({ entry, dossier, preview, loading, relation, onQuarantine, onClose }: { entry: WindowsStorageExplorerEntry; dossier: WindowsStorageFileDossier | null; preview: WindowsStoragePreviewResult | null; loading: boolean; relation: WindowsStorageEmailInvestigationResult | null; onQuarantine?: () => void; onClose: () => void }) {
  return <div className="fixed inset-0 z-[1300] flex justify-end bg-slate-950/55 backdrop-blur-sm" role="dialog" aria-modal="true"><button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Fermer" /><aside className="relative h-full w-full max-w-[720px] overflow-y-auto border-l border-white/20 bg-slate-50 shadow-[-30px_0_100px_rgba(15,23,42,.28)]"><header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 py-5 backdrop-blur-xl"><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">Phase 2 · Dossier de stockage</p><h2 className="mt-2 truncate text-xl font-black tracking-[-0.035em] text-slate-950">{entry.name}</h2><p className="mt-1 truncate text-xs font-semibold text-slate-500">{entry.sourceLabel} · {entry.relativePath}</p></div><button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm"><X className="h-4 w-4" /></button></header><div className="space-y-5 p-5">{loading ? <LoadingBlock label="Construction du dossier et aperçu sécurisé…" /> : null}{dossier ? <><section className="grid gap-3 sm:grid-cols-2"><Metric label="Taille physique" value={bytes(dossier.sizeBytes)} /><Metric label="Type" value={dossier.fileType} /><Metric label="Boîte" value={dossier.mailboxId || "Non attribuée"} /><Metric label="Référence" value={dossier.referenceState || "Filesystem"} tone={toneForStatus(dossier.referenceState)} /></section><section className="rounded-[22px] border border-slate-200 bg-white p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Intégrité</p><div className="mt-3 space-y-2 text-xs font-semibold text-slate-600"><DetailRow label="Fichier physique" value={dossier.integrity.physicalExists ? "Présent" : "Absent"} /><DetailRow label="Métadonnées" value={dossier.integrity.metadataExists ? "Présentes" : "Absentes"} /><DetailRow label="Cohérence taille" value={dossier.integrity.sizeMatchesMetadata === null ? "Non vérifiable" : dossier.integrity.sizeMatchesMetadata ? "Conforme" : "Écart détecté"} /><DetailRow label="SHA-256" value={dossier.integrity.sha256Hash || "Non disponible"} mono /></div></section><PreviewPanel preview={preview} dossier={dossier} /><section className="rounded-[22px] border border-slate-200 bg-white p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Références métier</p><div className="mt-3 space-y-2">{dossier.references.map((reference, index) => <div key={`${reference.type}:${reference.id}:${index}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="text-xs font-black text-slate-800">{reference.label}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{reference.detail}</p></div>)}{!dossier.references.length ? <p className="text-xs font-semibold text-slate-500">Aucune référence locale explicite.</p> : null}</div></section>{relation?.attachments?.length ? <section className="rounded-[22px] border border-blue-200 bg-blue-50 p-4"><p className="text-xs font-black text-blue-950">Relation Email OS retrouvée</p>{relation.attachments.slice(0, 5).map((item) => <div key={item.id} className="mt-3 rounded-xl bg-white p-3"><p className="text-xs font-black text-slate-950">{item.subject}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{item.sender} → {item.recipients}</p>{item.mailboxId ? <Link href={`/email-os/mailboxes/${encodeURIComponent(item.mailboxId)}`} className="mt-3 inline-flex items-center gap-2 text-xs font-black text-blue-700">Ouvrir la boîte Email OS <ArrowRight className="h-3.5 w-3.5" /></Link> : null}</div>)}</section> : null}<section className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold leading-6 text-emerald-800"><ShieldCheck className="mr-2 inline h-4 w-4" />Le dossier Phase 2 reste en lecture seule. Phase 3 peut seulement lancer une analyse d’impact et créer une intervention réversible gouvernée.</section>{onQuarantine ? <button type="button" onClick={onQuarantine} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white shadow-lg"><FileArchive className="h-4 w-4" />Analyser pour quarantaine Phase 3</button> : null}</> : null}</div></aside></div>
}

function PreviewPanel({ preview, dossier }: { preview: WindowsStoragePreviewResult | null; dossier: WindowsStorageFileDossier }) {
  return <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Aperçu sécurisé</p><p className="mt-1 text-xs font-black text-slate-700">{dossier.preview.kind.replaceAll("_", " ")}</p></div><Pill tone={dossier.preview.supported ? "emerald" : dossier.preview.kind === "blocked" ? "rose" : "slate"} label={dossier.preview.supported ? "Autorisé" : "Métadonnées uniquement"} small /></div><div className="min-h-[180px] bg-slate-50 p-4">{!preview ? <div className="grid min-h-[160px] place-items-center text-center"><div><Eye className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-2 text-xs font-semibold text-slate-500">{dossier.preview.reason || "Aperçu indisponible pour ce format ou cette taille."}</p></div></div> : preview.kind === "image" && preview.content ? <img src={`data:${preview.contentType};base64,${preview.content}`} alt={preview.filename} className="mx-auto max-h-[520px] max-w-full rounded-xl object-contain shadow-sm" /> : preview.kind === "pdf" && preview.content ? <iframe title={preview.filename} src={`data:application/pdf;base64,${preview.content}`} className="h-[520px] w-full rounded-xl bg-white" /> : ["text", "json", "csv"].includes(preview.kind) && preview.content !== null ? <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-950 p-4 text-[11px] leading-5 text-slate-100">{preview.content}</pre> : <div className="grid min-h-[160px] place-items-center text-center"><div><FileText className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-2 text-xs font-semibold text-slate-500">{preview.reason || "Aperçu non pris en charge."}</p></div></div>}</div></section>
}

function AttachmentTable({ rows, warnings }: { rows: WindowsStorageEmailReference[]; warnings: string[] }) {
  return <div className="mt-5"><Warnings rows={warnings} /><div className="overflow-x-auto rounded-2xl border border-slate-200"><table className="w-full min-w-[1100px] border-collapse text-left"><thead className="bg-slate-50 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500"><tr><th className="px-4 py-3">Pièce jointe</th><th className="px-4 py-3">Boîte / flux</th><th className="px-4 py-3">Message</th><th className="px-4 py-3">Expéditeur → destinataire</th><th className="px-4 py-3">Taille</th><th className="px-4 py-3">Référence</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.id}:${row.storageKey}`} className="border-t border-slate-100 align-top text-sm"><td className="px-4 py-3.5"><p className="max-w-[240px] truncate font-black text-slate-950">{row.filename}</p><p className="mt-1 text-[10px] font-semibold text-slate-400">{row.contentType || "type inconnu"}</p></td><td className="px-4 py-3.5"><p className="text-xs font-black text-slate-700">{row.mailboxId || "Non attribuée"}</p><div className="mt-2"><Pill tone={toneForStatus(row.direction)} label={row.direction} small /></div></td><td className="px-4 py-3.5"><p className="max-w-[260px] truncate text-xs font-black text-slate-800">{row.subject}</p><p className="mt-1 text-[10px] font-semibold text-slate-400">{row.messageType} · {row.messageStatus}</p></td><td className="px-4 py-3.5 max-w-[260px] text-xs font-semibold leading-5 text-slate-600">{row.sender}<br />→ {row.recipients}</td><td className="px-4 py-3.5 text-xs font-black text-slate-700">{bytes(row.sizeBytes)}</td><td className="px-4 py-3.5"><Pill tone={toneForStatus(row.referenceState)} label={row.referenceState.replaceAll("_", " ")} small /></td></tr>)}</tbody></table></div>{!rows.length ? <EmptyState icon={Inbox} title="Aucune relation affichée" text="Lancez une recherche ou vérifiez la synchronisation de la table angelcare_storage_files." /> : null}</div>
}

function MessageTable({ rows, warnings }: { rows: WindowsStorageMessageRecord[]; warnings: string[] }) {
  return <div className="mt-5"><Warnings rows={warnings} /><div className="overflow-x-auto rounded-2xl border border-slate-200"><table className="w-full min-w-[1050px] border-collapse text-left"><thead className="bg-slate-50 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500"><tr><th className="px-4 py-3">Message</th><th className="px-4 py-3">Boîte / flux</th><th className="px-4 py-3">Participants</th><th className="px-4 py-3">Corps</th><th className="px-4 py-3">Pièces jointes</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Action</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.messageType}:${row.id}`} className="border-t border-slate-100 align-top text-sm"><td className="px-4 py-3.5"><p className="max-w-[280px] truncate font-black text-slate-950">{row.subject}</p><p className="mt-1 text-[10px] font-semibold text-slate-400">{row.status} · {row.providerReference || row.id}</p></td><td className="px-4 py-3.5"><p className="text-xs font-black text-slate-700">{row.mailboxId || "Non attribuée"}</p><div className="mt-2"><Pill tone={toneForStatus(row.direction)} label={row.direction} small /></div></td><td className="px-4 py-3.5 max-w-[260px] text-xs font-semibold leading-5 text-slate-600">{row.sender}<br />→ {row.recipients}</td><td className="px-4 py-3.5 text-xs font-black text-slate-700">{bytes(row.bodySizeBytes)}</td><td className="px-4 py-3.5"><p className="text-xs font-black text-slate-700">{row.attachmentCount} fichier(s)</p><p className="mt-1 text-[10px] font-semibold text-slate-400">{bytes(row.attachmentBytes)}</p></td><td className="px-4 py-3.5 text-xs font-semibold text-slate-500">{dateTime(row.sentAt || row.createdAt)}</td><td className="px-4 py-3.5">{row.mailboxId ? <Link href={`/email-os/mailboxes/${encodeURIComponent(row.mailboxId)}`} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-blue-700">Ouvrir Email OS <ArrowRight className="h-3.5 w-3.5" /></Link> : <span className="text-xs text-slate-400">—</span>}</td></tr>)}</tbody></table></div>{!rows.length ? <EmptyState icon={MessageSquareText} title="Aucun message affiché" text="La source Email OS est vide, indisponible ou aucun résultat ne correspond au filtre." /> : null}</div>
}

function WorkspaceHeader({ eyebrow, title, description, icon: Icon, count, action }: { eyebrow: string; title: string; description: string; icon: typeof FileArchive; count: string; action?: React.ReactNode }) {
  return <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white"><Icon className="h-5 w-5" /></div><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">{eyebrow}</p><h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">{title}</h3><p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-500">{description}</p></div></div><div className="flex items-center gap-2"><Pill tone="slate" label={count} />{action}</div></div>
}

function SearchRow({ query, onQuery, onSearch, placeholder }: { query: string; onQuery: (value: string) => void; onSearch: () => void; placeholder: string }) {
  return <div className="mt-5 flex flex-col gap-3 lg:flex-row"><label className="relative block flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => onQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") onSearch() }} placeholder={placeholder} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-950 outline-none focus:border-blue-300 focus:bg-white" /></label><button type="button" onClick={onSearch} className="h-11 rounded-2xl bg-slate-950 px-5 text-xs font-black text-white">Rechercher</button></div>
}

function Metric({ label, value, tone = "slate" }: { label: string; value: string; tone?: Tone }) {
  const palette = TONES[tone]
  return <div className="rounded-[20px] border p-4" style={{ borderColor: palette.border, background: palette.bg }}><p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p><p className="mt-2 truncate text-lg font-black tracking-[-0.03em]" style={{ color: palette.text }}>{value}</p></div>
}

function Pill({ tone, label, small = false }: { tone: Tone; label: string; small?: boolean }) {
  const palette = TONES[tone]
  return <span className={`inline-flex items-center gap-1.5 rounded-full border font-black uppercase ${small ? "px-2 py-1 text-[8px] tracking-[0.08em]" : "px-3 py-1 text-[9px] tracking-[0.1em]"}`} style={{ borderColor: palette.border, background: palette.bg, color: palette.text }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: palette.solid }} />{label}</span>
}

function FolderTreeIcon({ kind }: { kind: string }) {
  if (kind === "email") return <Mail className="h-4 w-4" />
  if (kind === "backups") return <Boxes className="h-4 w-4" />
  if (kind === "logs") return <FileText className="h-4 w-4" />
  return <Folder className="h-4 w-4" />
}

function LoadingBlock({ label }: { label: string }) {
  return <div className="grid min-h-[360px] place-items-center rounded-[28px] border border-slate-200 bg-white"><div className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" /><p className="mt-3 text-sm font-black text-slate-600">{label}</p></div></div>
}

function ErrorBox({ text }: { text: string }) {
  return <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700"><AlertTriangle className="mr-2 inline h-4 w-4" />{text}</div>
}

function EmptyState({ icon: Icon, title, text }: { icon: typeof Files; title: string; text: string }) {
  return <div className="grid min-h-[240px] place-items-center text-center"><div><Icon className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 text-sm font-black text-slate-700">{title}</p><p className="mt-1 max-w-md text-xs font-semibold leading-5 text-slate-500">{text}</p></div></div>
}

function Warnings({ rows }: { rows: string[] }) {
  if (!rows.length) return null
  return <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800"><AlertTriangle className="mr-2 inline h-4 w-4" />Analyse partielle : {rows.slice(0, 2).join(" · ")}</div>
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 last:border-0"><span className="text-slate-500">{label}</span><span className={`max-w-[65%] break-all text-right font-black text-slate-800 ${mono ? "font-mono text-[10px]" : ""}`}>{value}</span></div>
}
