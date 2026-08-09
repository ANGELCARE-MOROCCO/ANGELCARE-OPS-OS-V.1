"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ArchiveRestore,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  FileArchive,
  FileCheck2,
  FileLock2,
  Gauge,
  HardDrive,
  History,
  Loader2,
  LockKeyhole,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  TimerReset,
  Vault,
  X,
} from "lucide-react"
import type {
  WindowsStorageExplorerEntry,
  WindowsStorageInventory,
  WindowsStorageQuarantineCase,
  WindowsStorageQuarantineEvent,
  WindowsStorageQuarantineImpact,
  WindowsStorageQuarantineListResult,
  WindowsStorageQuarantineMode,
  WindowsStorageQuarantinePolicy,
} from "@/lib/opsos/windows-node-types"

type Tone = "blue" | "emerald" | "amber" | "rose" | "violet" | "slate"
type Tab = "command" | "cases" | "restore" | "policies" | "history"
type ApiResult<T> = { ok: boolean; data?: T; error?: string; errorMessage?: string; recommendedAction?: string }

type Props = {
  inventory: WindowsStorageInventory
  candidate?: WindowsStorageExplorerEntry | null
  onClearCandidate?: () => void
  onRefreshInventory?: () => void
}

const TONES: Record<Tone, { bg: string; border: string; text: string; solid: string }> = {
  blue: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", solid: "#2563eb" },
  emerald: { bg: "#ecfdf5", border: "#a7f3d0", text: "#047857", solid: "#10b981" },
  amber: { bg: "#fffbeb", border: "#fde68a", text: "#b45309", solid: "#f59e0b" },
  rose: { bg: "#fff1f2", border: "#fecdd3", text: "#be123c", solid: "#f43f5e" },
  violet: { bg: "#f5f3ff", border: "#ddd6fe", text: "#6d28d9", solid: "#7c3aed" },
  slate: { bg: "#f8fafc", border: "#e2e8f0", text: "#475569", solid: "#64748b" },
}

function clean(value: unknown) { return String(value ?? "").trim() }
function bytes(value?: number | null) {
  let amount = Number(value || 0)
  if (!Number.isFinite(amount) || amount <= 0) return "0 o"
  const units = ["o", "Ko", "Mo", "Go", "To"]
  let unit = 0
  while (amount >= 1024 && unit < units.length - 1) { amount /= 1024; unit += 1 }
  return `${amount.toLocaleString("fr-FR", { maximumFractionDigits: unit >= 3 ? 1 : 0 })} ${units[unit]}`
}
function dateTime(value?: string | null) {
  if (!value) return "Non disponible"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(parsed)
}
function remainingDays(value: string) {
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return "Échéance inconnue"
  const days = Math.ceil((timestamp - Date.now()) / 86_400_000)
  if (days <= 0) return "Éligible à une revue Phase 4"
  return `${days} jour${days > 1 ? "s" : ""} restant${days > 1 ? "s" : ""}`
}
function statusTone(status: string): Tone {
  const value = clean(status).toLowerCase()
  if (["quarantined", "restored", "approved"].includes(value)) return "emerald"
  if (["awaiting_approval", "restore_requested", "executing", "verifying", "restoring"].includes(value)) return "amber"
  if (["failed", "blocked", "cancelled"].includes(value)) return "rose"
  if (["high", "controlled"].includes(value)) return "violet"
  return "slate"
}
function statusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "Brouillon", impact_pending: "Analyse en cours", awaiting_approval: "Approbation requise", approved: "Approuvé",
    executing: "Mise en quarantaine", verifying: "Vérification", quarantined: "En quarantaine", restore_requested: "Restauration demandée",
    restoring: "Restauration en cours", restored: "Restauré", failed: "Échec", cancelled: "Annulé", expired: "Rétention expirée",
    eligible_for_future_purge: "Éligible à une revue Phase 4",
  }
  return labels[status] || status.replaceAll("_", " ")
}

async function api<T>(path: string, options?: RequestInit): Promise<ApiResult<T>> {
  const response = await fetch(path, { ...options, cache: "no-store", headers: { "Content-Type": "application/json", ...(options?.headers || {}) } })
  const json = await response.json().catch(() => ({}))
  return { ok: Boolean(response.ok && json?.ok !== false), data: json?.data, error: json?.error, errorMessage: json?.errorMessage, recommendedAction: json?.recommendedAction }
}

export default function StorageQuarantinePhase3({ inventory, candidate, onClearCandidate, onRefreshInventory }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("command")
  const [registry, setRegistry] = useState<WindowsStorageQuarantineListResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [impact, setImpact] = useState<WindowsStorageQuarantineImpact | null>(null)
  const [impactLoading, setImpactLoading] = useState(false)
  const [reason, setReason] = useState("")
  const [retentionDays, setRetentionDays] = useState(30)
  const [mode, setMode] = useState<WindowsStorageQuarantineMode>("logical")
  const [confirmedReferences, setConfirmedReferences] = useState(false)
  const [confirmedRecovery, setConfirmedRecovery] = useState(false)
  const [confirmedReversible, setConfirmedReversible] = useState(false)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [selectedCase, setSelectedCase] = useState<WindowsStorageQuarantineCase | null>(null)
  const [caseEvents, setCaseEvents] = useState<WindowsStorageQuarantineEvent[]>([])
  const [policyDraft, setPolicyDraft] = useState<WindowsStorageQuarantinePolicy | null>(null)

  const loadRegistry = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await api<WindowsStorageQuarantineListResult>("/api/opsos/windows-node/storage/quarantine")
    setLoading(false)
    if (!result.ok || !result.data) { setError(result.errorMessage || result.error || "Registre de quarantaine indisponible. Appliquez la migration Phase 3 puis réessayez."); return }
    setRegistry(result.data)
    setPolicyDraft(result.data.policies)
  }, [])

  useEffect(() => { void loadRegistry() }, [loadRegistry])
  useEffect(() => { if (candidate) void analyzeCandidate(candidate) /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [candidate])

  async function analyzeCandidate(entry: WindowsStorageExplorerEntry) {
    if (entry.entryType !== "file") return
    setImpactLoading(true); setError(null); setNotice(null)
    const result = await api<WindowsStorageQuarantineImpact>("/api/opsos/windows-node/storage/quarantine/impact", { method: "POST", body: JSON.stringify({ sourceId: entry.sourceId, relativePath: entry.relativePath }) })
    setImpactLoading(false)
    if (!result.ok || !result.data) { setError(result.errorMessage || result.error || "Analyse d’impact indisponible."); return }
    setImpact(result.data)
    setMode(result.data.recommendedMode || "logical")
    setRetentionDays(registry?.policies.defaultRetentionDays || 30)
    setReason("")
    setConfirmedReferences(false); setConfirmedRecovery(false); setConfirmedReversible(false)
    setActiveTab("command")
  }

  async function createCase() {
    if (!impact) return
    if (reason.trim().length < 8) { setError("Saisissez un motif opérationnel détaillé d’au moins 8 caractères."); return }
    if (!confirmedReferences || !confirmedRecovery || !confirmedReversible) { setError("Les trois confirmations de gouvernance sont obligatoires."); return }
    setBusyAction("create"); setError(null)
    const result = await api<WindowsStorageQuarantineCase>("/api/opsos/windows-node/storage/quarantine", { method: "POST", body: JSON.stringify({ sourceId: impact.sourceId, relativePath: impact.relativePath, mode, reason, retentionDays }) })
    setBusyAction(null)
    if (!result.ok || !result.data) { setError(result.errorMessage || result.error || "Création du dossier impossible."); return }
    setNotice(`${result.data.caseNumber} créé · ${statusLabel(result.data.status)}.`)
    setImpact(null); onClearCandidate?.(); await loadRegistry(); setActiveTab("cases"); setSelectedCase(result.data)
  }

  async function caseAction(record: WindowsStorageQuarantineCase, action: "approve" | "execute" | "restore" | "extend") {
    const actionReason = action === "restore" ? "Restauration contrôlée demandée depuis le centre Phase 3" : action === "approve" ? "Impact analysé et quarantaine approuvée" : action === "extend" ? "Prolongation de la période de quarantaine" : record.reason
    setBusyAction(`${action}:${record.id}`); setError(null); setNotice(null)
    const body = action === "extend" ? { days: 30, reason: actionReason } : { reason: actionReason }
    const result = await api<any>(`/api/opsos/windows-node/storage/quarantine/${record.id}/${action}`, { method: "POST", body: JSON.stringify(body) })
    setBusyAction(null)
    if (!result.ok) { setError(result.errorMessage || result.error || `Action ${action} impossible.`); return }
    setNotice(action === "restore" ? "Restauration terminée et intégrité vérifiée." : action === "execute" ? "Quarantaine activée et références mises à jour." : action === "approve" ? "Dossier approuvé." : "Rétention prolongée de 30 jours.")
    await loadRegistry(); onRefreshInventory?.()
    if (selectedCase?.id === record.id) await openCase(record.id)
  }

  async function openCase(caseId: string) {
    const result = await api<{ case: WindowsStorageQuarantineCase; events: WindowsStorageQuarantineEvent[] }>(`/api/opsos/windows-node/storage/quarantine/${caseId}`)
    if (result.ok && result.data) { setSelectedCase(result.data.case); setCaseEvents(result.data.events) }
  }

  async function savePolicy() {
    if (!policyDraft) return
    setBusyAction("policy"); setError(null)
    const result = await api<WindowsStorageQuarantinePolicy>("/api/opsos/windows-node/storage/quarantine/policies", { method: "PUT", body: JSON.stringify(policyDraft) })
    setBusyAction(null)
    if (!result.ok || !result.data) { setError(result.errorMessage || result.error || "Mise à jour de la politique impossible."); return }
    setPolicyDraft(result.data); setNotice("Politique Phase 3 mise à jour et auditée."); await loadRegistry()
  }

  const filteredCases = useMemo(() => {
    const rows = registry?.cases || []
    const needle = query.trim().toLowerCase()
    const scoped = activeTab === "restore" ? rows.filter((item) => ["quarantined", "restore_requested", "restoring", "restored"].includes(item.status)) : rows
    if (!needle) return scoped
    return scoped.filter((item) => `${item.caseNumber} ${item.originalName} ${item.mailboxId || ""} ${item.reason} ${item.status}`.toLowerCase().includes(needle))
  }, [activeTab, query, registry])

  return (
    <section className="space-y-5">
      <header className="overflow-hidden rounded-[30px] border border-white bg-[linear-gradient(135deg,#ffffff_0%,#f7fbff_52%,#eef5ff_100%)] p-5 shadow-[0_22px_70px_rgba(15,23,42,.08)] ring-1 ring-slate-200/70 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-2"><Pill tone="violet" label="Phase 3 · Intervention réversible" /><Pill tone="emerald" label="Restauration disponible" /><Pill tone="rose" label="Suppression définitive interdite" /></div>
            <div className="mt-4 flex items-start gap-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white shadow-xl shadow-slate-950/15"><Vault className="h-6 w-6" /></div><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600">OPSOS · Quarantine & Recovery Control Plane</p><h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950">Quarantaine & restauration</h2><p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-slate-600">Isolez un objet après analyse d’impact, conservez ses preuves et relations, puis restaurez-le avec vérification SHA-256. Aucun mécanisme de destruction n’existe dans cette phase.</p></div></div>
          </div>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void loadRegistry()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 shadow-sm"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Actualiser</button><button type="button" onClick={() => setActiveTab("policies")} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white"><SlidersHorizontal className="h-4 w-4" />Politiques</button></div>
        </div>
        {registry ? <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Dossiers" value={String(registry.totalCases)} icon={FileLock2} tone="blue" /><Metric label="En quarantaine" value={String(registry.quarantinedCount)} icon={Vault} tone="violet" /><Metric label="À approuver" value={String(registry.awaitingApprovalCount)} icon={ShieldAlert} tone={registry.awaitingApprovalCount ? "amber" : "slate"} /><Metric label="Espace primaire récupéré" value={bytes(registry.totalPrimaryBytesRecovered)} icon={HardDrive} tone="emerald" /><Metric label="Vault occupé" value={bytes(registry.totalVaultBytesOccupied)} icon={FileArchive} tone="slate" /></div> : null}
      </header>

      {error ? <Notice tone="rose" icon={AlertTriangle} text={error} onClose={() => setError(null)} /> : null}
      {notice ? <Notice tone="emerald" icon={CheckCircle2} text={notice} onClose={() => setNotice(null)} /> : null}

      <nav className="flex gap-1 overflow-x-auto rounded-[22px] border border-slate-200 bg-white p-1.5 shadow-sm">
        {([ ["command","Intervention",Gauge], ["cases","Dossiers",FileLock2], ["restore","Restauration",ArchiveRestore], ["policies","Politiques",SlidersHorizontal], ["history","Historique",History] ] as const).map(([id,label,Icon]) => <button key={id} type="button" onClick={() => setActiveTab(id)} className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-black transition ${activeTab === id ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-50"}`}><Icon className="h-3.5 w-3.5" />{label}</button>)}
      </nav>

      {activeTab === "command" ? <CommandWorkspace inventory={inventory} candidate={candidate} impact={impact} impactLoading={impactLoading} mode={mode} setMode={setMode} reason={reason} setReason={setReason} retentionDays={retentionDays} setRetentionDays={setRetentionDays} confirmedReferences={confirmedReferences} setConfirmedReferences={setConfirmedReferences} confirmedRecovery={confirmedRecovery} setConfirmedRecovery={setConfirmedRecovery} confirmedReversible={confirmedReversible} setConfirmedReversible={setConfirmedReversible} onCreate={() => void createCase()} creating={busyAction === "create"} onClear={() => { setImpact(null); onClearCandidate?.() }} /> : null}
      {(activeTab === "cases" || activeTab === "restore" || activeTab === "history") ? <CasesWorkspace rows={filteredCases} query={query} onQuery={setQuery} loading={loading} onOpen={(row) => void openCase(row.id)} onAction={(row, action) => void caseAction(row, action)} busyAction={busyAction} historyMode={activeTab === "history"} /> : null}
      {activeTab === "policies" && policyDraft ? <PolicyWorkspace policy={policyDraft} onChange={setPolicyDraft} onSave={() => void savePolicy()} saving={busyAction === "policy"} /> : null}
      {selectedCase ? <CaseDrawer record={selectedCase} events={caseEvents} onClose={() => { setSelectedCase(null); setCaseEvents([]) }} onAction={(action) => void caseAction(selectedCase, action)} busyAction={busyAction} /> : null}
    </section>
  )
}

function CommandWorkspace(props: {
  inventory: WindowsStorageInventory; candidate?: WindowsStorageExplorerEntry | null; impact: WindowsStorageQuarantineImpact | null; impactLoading: boolean;
  mode: WindowsStorageQuarantineMode; setMode: (value: WindowsStorageQuarantineMode) => void; reason: string; setReason: (value: string) => void;
  retentionDays: number; setRetentionDays: (value: number) => void; confirmedReferences: boolean; setConfirmedReferences: (value: boolean) => void;
  confirmedRecovery: boolean; setConfirmedRecovery: (value: boolean) => void; confirmedReversible: boolean; setConfirmedReversible: (value: boolean) => void;
  onCreate: () => void; creating: boolean; onClear: () => void;
}) {
  const { impact } = props
  if (props.impactLoading) return <LoadingBlock text="Calcul des références, risques, intégrité et capacité de restauration…" />
  if (!impact) return <div className="grid min-h-[420px] place-items-center rounded-[30px] border border-dashed border-slate-300 bg-white/80 p-8 text-center"><div className="max-w-xl"><div className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-violet-50 text-violet-700"><FileCheck2 className="h-7 w-7" /></div><h3 className="mt-5 text-2xl font-black tracking-[-0.04em] text-slate-950">Sélectionnez un fichier depuis l’explorateur Phase 2</h3><p className="mt-3 text-sm font-semibold leading-7 text-slate-600">Ouvrez son dossier puis choisissez « Analyser pour quarantaine ». Phase 3 recalculera les références et bloquera toute intervention risquée ou juridiquement protégée.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><MiniFact label="Fichiers classifiés" value={props.inventory.limits.filesVisited.toLocaleString("fr-FR")} /><MiniFact label="Orphelins candidats" value={String(props.inventory.summary.orphanCandidateCount)} /><MiniFact label="Doublons" value={String(props.inventory.summary.duplicateGroupCount)} /></div></div></div>
  const blocked = impact.riskLevel === "blocked" || !impact.allowedModes.length
  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
    <div className="space-y-5"><section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">Analyse d’impact</p><h3 className="mt-2 text-2xl font-black text-slate-950">{impact.filename}</h3><p className="mt-1 text-xs font-semibold text-slate-500">{impact.sourceId} · {impact.relativePath}</p></div><Pill tone={statusTone(impact.riskLevel)} label={`Risque ${impact.riskLevel}`} /></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><MiniFact label="Taille" value={bytes(impact.sizeBytes)} /><MiniFact label="Références" value={String(impact.referenceCount)} /><MiniFact label="Références actives" value={String(impact.activeReferenceCount)} /><MiniFact label="Restauration" value={impact.restoreReadiness} /></div></section>
      <section className="rounded-[28px] border border-slate-200 bg-white p-5"><h4 className="text-sm font-black text-slate-950">Références et conséquences</h4><div className="mt-4 space-y-2">{impact.references.map((reference) => <div key={`${reference.type}:${reference.id}`} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3"><div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${reference.active ? "bg-amber-500" : "bg-emerald-500"}`} /><div><p className="text-xs font-black text-slate-800">{reference.label}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{reference.detail}</p></div></div>)}{!impact.references.length ? <p className="text-xs font-semibold text-slate-500">Aucune référence explicite retrouvée.</p> : null}</div><div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs font-semibold leading-6 text-blue-800">{impact.userVisibleConsequence}</div></section>
      {(impact.riskReasons.length || impact.blockedReasons.length || impact.restoreWarnings.length) ? <section className="rounded-[28px] border border-slate-200 bg-white p-5"><h4 className="text-sm font-black text-slate-950">Décision de sécurité</h4><div className="mt-3 space-y-2">{[...impact.blockedReasons, ...impact.riskReasons, ...impact.restoreWarnings].map((item,index) => <div key={`${item}:${index}`} className={`flex gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold ${impact.blockedReasons.includes(item) ? "bg-rose-50 text-rose-800" : "bg-amber-50 text-amber-800"}`}><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{item}</div>)}</div></section> : null}
    </div>
    <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,.08)]"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-600">Intervention gouvernée</p><h3 className="mt-2 text-xl font-black text-slate-950">Créer le dossier Phase 3</h3></div><button type="button" onClick={props.onClear} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500"><X className="h-4 w-4" /></button></div>
      {blocked ? <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4"><p className="text-sm font-black text-rose-900">Quarantaine bloquée</p><p className="mt-2 text-xs font-semibold leading-6 text-rose-700">Cet objet ne peut recevoir aucune intervention Phase 3. Corrigez la cause indiquée dans l’analyse d’impact.</p></div> : <>
        <div className="mt-5"><label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Mode de quarantaine</label><div className="mt-2 grid gap-2">{impact.allowedModes.map((item) => <button key={item} type="button" onClick={() => props.setMode(item)} className={`rounded-2xl border p-4 text-left ${props.mode === item ? "border-violet-300 bg-violet-50 ring-2 ring-violet-100" : "border-slate-200 bg-white"}`}><div className="flex items-center justify-between"><p className="text-sm font-black text-slate-950">{item === "logical" ? "Isolation logique" : "Vault physique"}</p>{props.mode === item ? <CheckCircle2 className="h-4 w-4 text-violet-600" /> : null}</div><p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{item === "logical" ? "Accès opérationnel bloqué, fichier conservé à son emplacement. Espace récupéré : 0." : `Déplacement dans le vault sécurisé. Récupération primaire estimée : ${bytes(impact.primaryStorageRecoveryByMode.physical)}.`}</p></button>)}</div></div>
        <label className="mt-4 grid gap-2"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Motif obligatoire</span><textarea value={props.reason} onChange={(event) => props.setReason(event.target.value)} rows={4} placeholder="Expliquez le motif métier, opérationnel ou de stockage…" className="resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-950 outline-none focus:border-violet-300 focus:bg-white" /></label>
        <label className="mt-4 grid gap-2"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Rétention réversible</span><select value={props.retentionDays} onChange={(event) => props.setRetentionDays(Number(event.target.value))} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700">{[7,14,30,60,90,180].map((days) => <option key={days} value={days}>{days} jours</option>)}</select></label>
        <div className="mt-4 space-y-2"><Confirm checked={props.confirmedReferences} onChange={props.setConfirmedReferences} text="J’ai vérifié les références métier et Email OS." /><Confirm checked={props.confirmedRecovery} onChange={props.setConfirmedRecovery} text="Je comprends l’espace réellement récupéré et les copies non affectées." /><Confirm checked={props.confirmedReversible} onChange={props.setConfirmedReversible} text="Je confirme qu’il ne s’agit pas d’une suppression définitive." /></div>
        <button type="button" onClick={props.onCreate} disabled={props.creating} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white shadow-lg disabled:opacity-50">{props.creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}Créer le dossier de quarantaine</button>
      </>}
    </aside>
  </div>
}

function CasesWorkspace({ rows, query, onQuery, loading, onOpen, onAction, busyAction, historyMode }: { rows: WindowsStorageQuarantineCase[]; query: string; onQuery: (value: string) => void; loading: boolean; onOpen: (row: WindowsStorageQuarantineCase) => void; onAction: (row: WindowsStorageQuarantineCase, action: "approve"|"execute"|"restore"|"extend") => void; busyAction: string | null; historyMode: boolean }) {
  return <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Registre immuable</p><h3 className="mt-2 text-2xl font-black text-slate-950">{historyMode ? "Historique des interventions" : "Dossiers de quarantaine"}</h3><p className="mt-1 text-sm font-semibold text-slate-500">Chaque dossier conserve le motif, les références, l’autorité, l’intégrité et le statut de restauration.</p></div><label className="relative block w-full max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Cas, fichier, boîte, statut…" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs font-semibold outline-none focus:border-blue-300" /></label></div>
    {loading ? <LoadingBlock text="Synchronisation du registre Phase 3…" /> : <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200"><table className="w-full min-w-[1150px] border-collapse text-left"><thead className="bg-slate-50 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500"><tr><th className="px-4 py-3">Dossier</th><th className="px-4 py-3">Objet</th><th className="px-4 py-3">Mode / risque</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Rétention</th><th className="px-4 py-3">Récupération</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-slate-100 align-top"><td className="px-4 py-3.5"><button type="button" onClick={() => onOpen(row)} className="text-left"><p className="text-xs font-black text-blue-700">{row.caseNumber}</p><p className="mt-1 text-[10px] font-semibold text-slate-400">{dateTime(row.createdAt)}</p></button></td><td className="px-4 py-3.5"><p className="max-w-[260px] truncate text-xs font-black text-slate-950">{row.originalName}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{row.mailboxId || row.sourceId} · {bytes(row.originalSizeBytes)}</p></td><td className="px-4 py-3.5"><Pill tone={row.quarantineMode === "physical" ? "violet" : "blue"} label={row.quarantineMode} small /><div className="mt-2"><Pill tone={statusTone(row.riskLevel)} label={row.riskLevel} small /></div></td><td className="px-4 py-3.5"><Pill tone={statusTone(row.status)} label={statusLabel(row.status)} small />{row.status === "awaiting_approval" ? <p className="mt-2 text-[10px] font-black text-amber-700">Approbations : {row.approvalCount}/{row.approvalsRequired}</p> : null}{row.lastError ? <p className="mt-2 max-w-[220px] text-[10px] font-semibold text-rose-600">{row.lastError}</p> : null}</td><td className="px-4 py-3.5"><p className="text-xs font-black text-slate-700">{remainingDays(row.retentionUntil)}</p><p className="mt-1 text-[10px] text-slate-400">{dateTime(row.retentionUntil)}</p></td><td className="px-4 py-3.5"><p className="text-xs font-black text-emerald-700">{bytes(row.actualRecoveredBytes)}</p><p className="mt-1 text-[10px] text-slate-400">Vault : {row.quarantineMode === "physical" && row.status === "quarantined" ? bytes(row.originalSizeBytes) : "0 o"}</p></td><td className="px-4 py-3.5"><div className="flex justify-end gap-2"><button type="button" onClick={() => onOpen(row)} className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-600">Dossier</button>{row.status === "awaiting_approval" ? <ActionButton label="Approuver" busy={busyAction === `approve:${row.id}`} onClick={() => onAction(row,"approve")} /> : null}{row.status === "approved" ? <ActionButton label="Exécuter" busy={busyAction === `execute:${row.id}`} onClick={() => onAction(row,"execute")} /> : null}{row.status === "quarantined" ? <ActionButton label="Restaurer" busy={busyAction === `restore:${row.id}`} onClick={() => onAction(row,"restore")} /> : null}</div></td></tr>)}{!rows.length ? <tr><td colSpan={7} className="p-10 text-center text-sm font-semibold text-slate-500">Aucun dossier ne correspond à cette vue.</td></tr> : null}</tbody></table></div>}
  </section>
}

function PolicyWorkspace({ policy, onChange, onSave, saving }: { policy: WindowsStorageQuarantinePolicy; onChange: (value: WindowsStorageQuarantinePolicy) => void; onSave: () => void; saving: boolean }) {
  const update = <K extends keyof WindowsStorageQuarantinePolicy>(key: K, value: WindowsStorageQuarantinePolicy[K]) => onChange({ ...policy, [key]: value })
  return <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">Gouvernance Phase 3</p><h3 className="mt-2 text-2xl font-black text-slate-950">Politiques de quarantaine réversible</h3><p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-500">Ces paramètres encadrent l’isolation et la restauration. Ils n’autorisent jamais la suppression définitive.</p></div><button type="button" onClick={onSave} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}Enregistrer</button></div><div className="mt-6 grid gap-4 lg:grid-cols-2"><NumberField label="Rétention par défaut" value={policy.defaultRetentionDays} suffix="jours" onChange={(value) => update("defaultRetentionDays", value)} /><NumberField label="Rétention maximale" value={policy.maximumRetentionDays} suffix="jours" onChange={(value) => update("maximumRetentionDays", value)} /><NumberField label="Double approbation au-dessus de" value={Math.round(policy.requireSecondApprovalAboveBytes / 1024 / 1024)} suffix="Mo" onChange={(value) => update("requireSecondApprovalAboveBytes", value * 1024 * 1024)} /><PolicyToggle label="Approbation obligatoire pour les objets référencés" checked={policy.requireApprovalForReferenced} onChange={(value) => update("requireApprovalForReferenced", value)} /><PolicyToggle label="Autoriser le vault sur le même volume avec avertissement zéro récupération" checked={policy.allowSameVolumeQuarantine} onChange={(value) => update("allowSameVolumeQuarantine", value)} /><PolicyToggle label="Autoriser un vault externe" checked={policy.allowExternalVaultQuarantine} onChange={(value) => update("allowExternalVaultQuarantine", value)} /><PolicyToggle label="Autoriser la quarantaine locale de messages" checked={policy.allowMessageQuarantine} onChange={(value) => update("allowMessageQuarantine", value)} /><PolicyToggle label="Autoriser les pièces jointes d’envoi actif" checked={policy.allowActiveSendAttachmentQuarantine} onChange={(value) => update("allowActiveSendAttachmentQuarantine", value)} /><PolicyToggle label="Autoriser les objets sous legal hold" checked={policy.allowLegalHoldQuarantine} onChange={(value) => update("allowLegalHoldQuarantine", value)} /></div><div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold leading-6 text-rose-800"><ShieldAlert className="mr-2 inline h-4 w-4" />Phase 3 ne possède aucune action de purge, suppression définitive, destruction de sauvegarde ou suppression Menara.</div></section>
}

function CaseDrawer({ record, events, onClose, onAction, busyAction }: { record: WindowsStorageQuarantineCase; events: WindowsStorageQuarantineEvent[]; onClose: () => void; onAction: (action: "approve"|"execute"|"restore"|"extend") => void; busyAction: string | null }) {
  return <div className="fixed inset-0 z-[1500] flex justify-end bg-slate-950/55 backdrop-blur-sm" role="dialog" aria-modal="true"><button type="button" className="absolute inset-0" onClick={onClose} aria-label="Fermer" /><aside className="relative h-full w-full max-w-[760px] overflow-y-auto border-l border-white/20 bg-slate-50 shadow-[-30px_0_100px_rgba(15,23,42,.28)]"><header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 py-5 backdrop-blur-xl"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-600">Dossier de preuve Phase 3</p><h2 className="mt-2 text-2xl font-black text-slate-950">{record.caseNumber}</h2><p className="mt-1 text-xs font-semibold text-slate-500">{record.originalName} · {bytes(record.originalSizeBytes)}</p></div><button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white"><X className="h-4 w-4" /></button></header><div className="space-y-5 p-5"><section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><MiniFact label="Statut" value={statusLabel(record.status)} /><MiniFact label="Mode" value={record.quarantineMode} /><MiniFact label="Risque" value={record.riskLevel} /><MiniFact label="Récupéré" value={bytes(record.actualRecoveredBytes)} /></section><section className="rounded-[24px] border border-slate-200 bg-white p-5"><h3 className="text-sm font-black text-slate-950">Gouvernance</h3><div className="mt-3 space-y-2 text-xs font-semibold text-slate-600"><Detail label="Motif" value={record.reason} /><Detail label="Demandé par" value={record.requestedBy} /><Detail label="Première approbation" value={record.approvedBy || "En attente"} /><Detail label="Deuxième approbation" value={record.approvalsRequired > 1 ? (record.secondApprovedBy || "En attente") : "Non requise"} /><Detail label="Progression approbation" value={`${record.approvalCount}/${record.approvalsRequired}`} /><Detail label="Exécuté par" value={record.executedBy || "Non exécuté"} /><Detail label="Rétention" value={`${dateTime(record.retentionUntil)} · ${remainingDays(record.retentionUntil)}`} /><Detail label="SHA-256 original" value={record.originalSha256 || "Non disponible"} mono /></div></section><section className="rounded-[24px] border border-slate-200 bg-white p-5"><h3 className="text-sm font-black text-slate-950">Références préservées</h3><div className="mt-3 space-y-2">{record.referencesSnapshot.map((ref) => <div key={`${ref.type}:${ref.id}`} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-black text-slate-800">{ref.label}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{ref.detail}</p></div>)}{!record.referencesSnapshot.length ? <p className="text-xs text-slate-500">Aucune référence explicite.</p> : null}</div></section><section className="rounded-[24px] border border-slate-200 bg-white p-5"><h3 className="text-sm font-black text-slate-950">Chronologie immuable</h3><div className="mt-4 space-y-4">{events.map((event,index) => <div key={event.id} className="flex gap-3"><div className="flex flex-col items-center"><div className="grid h-8 w-8 place-items-center rounded-full bg-slate-950 text-[10px] font-black text-white">{index+1}</div>{index < events.length-1 ? <div className="h-full w-px bg-slate-200" /> : null}</div><div className="pb-4"><p className="text-xs font-black text-slate-950">{event.eventType.replaceAll("_"," ")}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{dateTime(event.createdAt)} · {event.actor}</p>{event.reason ? <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{event.reason}</p> : null}</div></div>)}</div></section><div className="flex flex-wrap gap-2">{record.status === "awaiting_approval" ? <ActionButton label="Approuver" busy={busyAction === `approve:${record.id}`} onClick={() => onAction("approve")} /> : null}{record.status === "approved" ? <ActionButton label="Exécuter la quarantaine" busy={busyAction === `execute:${record.id}`} onClick={() => onAction("execute")} /> : null}{record.status === "quarantined" ? <><ActionButton label="Restaurer" busy={busyAction === `restore:${record.id}`} onClick={() => onAction("restore")} /><button type="button" onClick={() => onAction("extend")} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700">Prolonger 30 jours</button></> : null}</div><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold leading-6 text-emerald-800"><ArchiveRestore className="mr-2 inline h-4 w-4" />Ce dossier reste réversible. Une échéance de rétention ne déclenche aucune suppression automatique.</div></div></aside></div>
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Vault; tone: Tone }) { const p=TONES[tone]; return <div className="rounded-[20px] border p-4" style={{borderColor:p.border,background:p.bg}}><div className="flex items-center gap-2"><Icon className="h-4 w-4" style={{color:p.text}} /><p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p></div><p className="mt-2 text-xl font-black" style={{color:p.text}}>{value}</p></div> }
function MiniFact({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3"><p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">{label}</p><p className="mt-1.5 truncate text-xs font-black text-slate-800">{value}</p></div> }
function Pill({ tone, label, small=false }: { tone: Tone; label: string; small?: boolean }) { const p=TONES[tone]; return <span className={`inline-flex items-center gap-1.5 rounded-full border font-black uppercase ${small?"px-2 py-1 text-[8px]":"px-3 py-1 text-[9px]"}`} style={{borderColor:p.border,background:p.bg,color:p.text}}><span className="h-1.5 w-1.5 rounded-full" style={{background:p.solid}} />{label}</span> }
function Notice({ tone, icon: Icon, text, onClose }: { tone: Tone; icon: typeof AlertTriangle; text: string; onClose: () => void }) { const p=TONES[tone]; return <div className="flex items-start gap-3 rounded-[22px] border p-4" style={{borderColor:p.border,background:p.bg,color:p.text}}><Icon className="mt-0.5 h-5 w-5 shrink-0" /><p className="flex-1 text-sm font-bold">{text}</p><button type="button" onClick={onClose}><X className="h-4 w-4" /></button></div> }
function Confirm({ checked, onChange, text }: { checked: boolean; onChange: (value: boolean) => void; text: string }) { return <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><input type="checkbox" checked={checked} onChange={(event)=>onChange(event.target.checked)} className="mt-0.5 accent-violet-600" /><span className="text-xs font-semibold leading-5 text-slate-700">{text}</span></label> }
function ActionButton({ label, busy, onClick }: { label: string; busy: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} disabled={busy} className="inline-flex h-9 items-center gap-2 rounded-xl bg-slate-950 px-3 text-xs font-black text-white disabled:opacity-50">{busy?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<ArrowRight className="h-3.5 w-3.5"/>}{label}</button> }
function LoadingBlock({ text }: { text: string }) { return <div className="grid min-h-[360px] place-items-center rounded-[28px] border border-slate-200 bg-white"><div className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-600" /><p className="mt-3 text-sm font-black text-slate-600">{text}</p></div></div> }
function NumberField({ label, value, suffix, onChange }: { label: string; value: number; suffix: string; onChange: (value: number) => void }) { return <label className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</span><div className="mt-2 flex items-center gap-2"><input type="number" min={1} value={value} onChange={(event)=>onChange(Number(event.target.value))} className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-950" /><span className="text-xs font-black text-slate-500">{suffix}</span></div></label> }
function PolicyToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4"><span className="text-sm font-bold text-slate-700">{label}</span><input type="checkbox" checked={checked} onChange={(event)=>onChange(event.target.checked)} className="h-5 w-5 accent-violet-600" /></label> }
function Detail({ label, value, mono=false }: { label: string; value: string; mono?: boolean }) { return <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 last:border-0"><span className="text-slate-500">{label}</span><span className={`max-w-[65%] break-all text-right font-black text-slate-800 ${mono?"font-mono text-[10px]":""}`}>{value}</span></div> }
