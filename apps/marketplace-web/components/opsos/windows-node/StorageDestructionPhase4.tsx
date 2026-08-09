"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertOctagon,
  AlertTriangle,
  BadgeCheck,
  Ban,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Download,
  FileCheck2,
  FileClock,
  FileLock2,
  Gauge,
  History,
  Loader2,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import type {
  WindowsStorageCleanupProfile,
  WindowsStorageDestructionCertificate,
  WindowsStorageDestructionEvent,
  WindowsStorageDestructionImpact,
  WindowsStorageDestructionRegistry,
  WindowsStorageDestructionRequest,
  WindowsStorageDestructionScope,
  WindowsStorageQuarantineCase,
  WindowsStorageRetentionDryRun,
  WindowsStorageRetentionPolicy,
  WindowsStorageLegalHold,
} from "@/lib/opsos/windows-node-types"

type Tab = "executive" | "eligible" | "requests" | "approvals" | "jobs" | "retention" | "cleanup" | "holds" | "certificates" | "audit"
type ApiResult<T> = { ok: boolean; data?: T; error?: string; errorMessage?: string }
type Tone = "blue" | "emerald" | "amber" | "rose" | "violet" | "slate"

const TABS: Array<{ id: Tab; label: string; icon: typeof Trash2 }> = [
  { id: "executive", label: "Vue exécutive", icon: Gauge },
  { id: "eligible", label: "Éligibles", icon: FileCheck2 },
  { id: "requests", label: "Demandes", icon: FileClock },
  { id: "approvals", label: "Approbations", icon: BadgeCheck },
  { id: "jobs", label: "Travaux", icon: CalendarClock },
  { id: "retention", label: "Rétention", icon: Clock3 },
  { id: "cleanup", label: "Nettoyage technique", icon: Sparkles },
  { id: "holds", label: "Blocages légaux", icon: LockKeyhole },
  { id: "certificates", label: "Certificats", icon: ShieldCheck },
  { id: "audit", label: "Audit", icon: History },
]

const TONES: Record<Tone, { bg: string; border: string; text: string; solid: string }> = {
  blue: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", solid: "#2563eb" },
  emerald: { bg: "#ecfdf5", border: "#a7f3d0", text: "#047857", solid: "#10b981" },
  amber: { bg: "#fffbeb", border: "#fde68a", text: "#b45309", solid: "#f59e0b" },
  rose: { bg: "#fff1f2", border: "#fecdd3", text: "#be123c", solid: "#f43f5e" },
  violet: { bg: "#f5f3ff", border: "#ddd6fe", text: "#6d28d9", solid: "#7c3aed" },
  slate: { bg: "#f8fafc", border: "#e2e8f0", text: "#475569", solid: "#64748b" },
}

function bytes(value?: number | null) { let amount = Number(value || 0); if (!Number.isFinite(amount) || amount <= 0) return "0 o"; const units = ["o", "Ko", "Mo", "Go", "To"]; let unit = 0; while (amount >= 1024 && unit < units.length - 1) { amount /= 1024; unit += 1 } return `${amount.toLocaleString("fr-FR", { maximumFractionDigits: unit >= 3 ? 1 : 0 })} ${units[unit]}` }
function dateTime(value?: string | null) { if (!value) return "Non planifié"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(date) }
function clean(value: unknown) { return String(value ?? "").trim() }
function statusTone(status: string): Tone { const value = clean(status); if (["destroyed"].includes(value)) return "emerald"; if (["awaiting_approval", "destruction_scheduled", "destroying", "verifying", "approved_for_destruction"].includes(value)) return "amber"; if (["failed", "partially_destroyed", "blocked"].includes(value)) return "rose"; if (["cancelled"].includes(value)) return "slate"; return "blue" }
function statusLabel(status: string) { const labels: Record<string,string> = { awaiting_approval: "Approbation requise", approved_for_destruction: "Approuvé", destruction_scheduled: "Planifié", destroying: "Destruction en cours", verifying: "Vérification", destroyed: "Détruit et vérifié", partially_destroyed: "Partiellement vérifié", failed: "Échec", cancelled: "Annulé", blocked: "Bloqué" }; return labels[status] || status.replaceAll("_", " ") }
function scopeLabel(scope: string) { const labels: Record<string,string> = { physical_file: "Fichier physique", application_message: "Copie applicative", complete_local_message: "Message local complet", technical_cleanup: "Nettoyage technique", backup_copy: "Copie de sauvegarde" }; return labels[scope] || scope }
async function api<T>(path: string, options?: RequestInit): Promise<ApiResult<T>> { const response = await fetch(path, { ...options, cache: "no-store", headers: { "Content-Type": "application/json", ...(options?.headers || {}) } }); const json = await response.json().catch(() => ({})); return { ok: Boolean(response.ok && json?.ok !== false), data: json?.data, error: json?.error, errorMessage: json?.errorMessage } }

export default function StorageDestructionPhase4({ onRefreshInventory }: { onRefreshInventory?: () => void }) {
  const [registry, setRegistry] = useState<WindowsStorageDestructionRegistry | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>("executive")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [impact, setImpact] = useState<WindowsStorageDestructionImpact | null>(null)
  const [selectedCase, setSelectedCase] = useState<WindowsStorageQuarantineCase | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<WindowsStorageDestructionRequest | null>(null)
  const [requestEvents, setRequestEvents] = useState<WindowsStorageDestructionEvent[]>([])
  const [certificate, setCertificate] = useState<WindowsStorageDestructionCertificate | null>(null)
  const [reason, setReason] = useState("")
  const [scope, setScope] = useState<WindowsStorageDestructionScope>("physical_file")
  const [confirmation, setConfirmation] = useState("")
  const [busy, setBusy] = useState<string | null>(null)
  const [dryRun, setDryRun] = useState<WindowsStorageRetentionDryRun | null>(null)
  const [cleanupResult, setCleanupResult] = useState<any>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    const result = await api<WindowsStorageDestructionRegistry>("/api/opsos/windows-node/storage/destruction")
    setLoading(false)
    if (!result.ok || !result.data) { setError(result.errorMessage || result.error || "Registre Phase 4 indisponible. Appliquez la migration Phase 4."); return }
    setRegistry(result.data)
  }, [])
  useEffect(() => { void load() }, [load])

  const filteredRequests = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const rows = registry?.requests || []
    if (!needle) return rows
    return rows.filter((item) => `${item.requestNumber} ${item.quarantineCaseNumber} ${item.originalName} ${item.mailboxId || ""} ${item.status} ${item.scope}`.toLowerCase().includes(needle))
  }, [query, registry])

  async function analyze(record: WindowsStorageQuarantineCase) {
    setBusy(`impact:${record.id}`); setError(null); setNotice(null)
    const result = await api<WindowsStorageDestructionImpact>("/api/opsos/windows-node/storage/destruction/impact", { method: "POST", body: JSON.stringify({ quarantineCaseId: record.id }) })
    setBusy(null)
    if (!result.ok || !result.data) { setError(result.errorMessage || result.error || "Analyse finale impossible."); return }
    setSelectedCase(record); setImpact(result.data); setScope(result.data.recommendedScope || "physical_file"); setReason("")
  }

  async function createRequest() {
    if (!impact || reason.trim().length < 12) { setError("Saisissez un motif détaillé d’au moins 12 caractères."); return }
    setBusy("create"); setError(null)
    const result = await api<WindowsStorageDestructionRequest>("/api/opsos/windows-node/storage/destruction", { method: "POST", body: JSON.stringify({ quarantineCaseId: impact.quarantineCaseId, scope, reason }) })
    setBusy(null)
    if (!result.ok || !result.data) { setError(result.errorMessage || result.error || "Création impossible."); return }
    setNotice(`${result.data.requestNumber} créée et soumise à approbation.`); setImpact(null); setSelectedCase(null); await load(); setActiveTab("requests")
  }

  async function action(record: WindowsStorageDestructionRequest, actionName: "approve" | "schedule" | "cancel" | "execute") {
    setBusy(`${actionName}:${record.id}`); setError(null); setNotice(null)
    const body = actionName === "schedule" ? { confirmation } : { reason: actionName === "approve" ? "Approbation indépendante après revue de la preuve et de la rétention" : actionName === "cancel" ? "Demande annulée avant exécution" : undefined }
    const result = await api<any>(`/api/opsos/windows-node/storage/destruction/${record.id}/${actionName}`, { method: "POST", body: JSON.stringify(body) })
    setBusy(null)
    if (!result.ok) { setError(result.errorMessage || result.error || `Action ${actionName} impossible.`); return }
    setNotice(actionName === "execute" ? "Destruction terminée, absence physique vérifiée et certificat généré." : actionName === "schedule" ? "Période de refroidissement démarrée." : actionName === "approve" ? "Approbation enregistrée." : "Demande annulée.")
    setConfirmation(""); await load(); onRefreshInventory?.()
    if (selectedRequest?.id === record.id) await openRequest(record.id)
  }

  async function openRequest(id: string) {
    const result = await api<{ request: WindowsStorageDestructionRequest; events: WindowsStorageDestructionEvent[]; certificate: WindowsStorageDestructionCertificate | null }>(`/api/opsos/windows-node/storage/destruction/${id}`)
    if (result.ok && result.data) { setSelectedRequest(result.data.request); setRequestEvents(result.data.events); setCertificate(result.data.certificate) }
  }

  async function simulate(policy: WindowsStorageRetentionPolicy) {
    setBusy(`retention:${policy.id}`); setError(null)
    const result = await api<WindowsStorageRetentionDryRun>("/api/opsos/windows-node/storage/retention/dry-run", { method: "POST", body: JSON.stringify({ policyId: policy.id }) })
    setBusy(null)
    if (!result.ok || !result.data) { setError(result.errorMessage || result.error || "Simulation impossible."); return }
    setDryRun(result.data)
  }

  async function cleanup(profile: WindowsStorageCleanupProfile, execute = false) {
    setBusy(`cleanup:${profile.id}:${execute}`); setError(null)
    const path = execute ? "/api/opsos/windows-node/storage/cleanup/execute" : "/api/opsos/windows-node/storage/cleanup/dry-run"
    const body = execute ? { profileId: profile.id, confirmation: `EXECUTER ${profile.id}` } : { profileId: profile.id }
    const result = await api<any>(path, { method: "POST", body: JSON.stringify(body) })
    setBusy(null)
    if (!result.ok) { setError(result.errorMessage || result.error || "Nettoyage impossible."); return }
    setCleanupResult(result.data); if (execute) { setNotice("Lot technique exécuté avec vérification par élément."); await load(); onRefreshInventory?.() }
  }

  if (loading && !registry) return <div className="h-[560px] animate-pulse rounded-[30px] bg-slate-100" />

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[30px] border border-rose-200 bg-[linear-gradient(135deg,#fff7f8,#ffffff_55%,#fff1f2)] p-5 shadow-[0_22px_70px_rgba(190,18,60,.08)] sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2"><Pill tone="rose" label="Phase 4 · Destruction contrôlée" /><Pill tone="amber" label="Irréversible après exécution" /><Pill tone="slate" label="Quarantaine Phase 3 obligatoire" /></div>
            <div className="mt-4 flex items-start gap-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-rose-700 text-white shadow-xl shadow-rose-700/20"><Trash2 className="h-6 w-6" /></div><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-700">OPSOS · Destruction Governance</p><h3 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950">Destruction, rétention & récupération vérifiée</h3><p className="mt-2 text-sm font-semibold leading-7 text-slate-600">Aucune suppression directe depuis l’explorateur. Chaque destruction part d’un dossier de quarantaine arrivé à échéance, passe par une analyse finale, des approbations indépendantes, un délai de refroidissement et une vérification physique.</p></div></div>
          </div>
          <button type="button" onClick={() => void load()} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 shadow-sm"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Actualiser Phase 4</button>
        </div>
        {registry ? <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Dossiers éligibles" value={String(registry.eligibleQuarantineCases.length)} tone="violet" /><Metric label="Approbations" value={String(registry.awaitingApprovalCount)} tone={registry.awaitingApprovalCount ? "amber" : "slate"} /><Metric label="Planifiés" value={String(registry.scheduledCount)} tone={registry.scheduledCount ? "amber" : "slate"} /><Metric label="Détruits" value={String(registry.destroyedCount)} tone="emerald" /><Metric label="Capacité récupérée" value={bytes(registry.totalRecoveredBytes)} tone="blue" /></div> : null}
      </section>

      {error ? <Notice tone="rose" text={error} onClose={() => setError(null)} /> : null}
      {notice ? <Notice tone="emerald" text={notice} onClose={() => setNotice(null)} /> : null}

      <nav className="flex gap-1 overflow-x-auto rounded-[22px] border border-slate-200 bg-white p-1.5 shadow-sm">
        {TABS.map((tab) => { const Icon = tab.icon; return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-black ${activeTab === tab.id ? "bg-rose-700 text-white" : "text-slate-600 hover:bg-slate-50"}`}><Icon className="h-3.5 w-3.5" />{tab.label}</button> })}
      </nav>

      {registry && activeTab === "executive" ? <Executive registry={registry} onNavigate={setActiveTab} /> : null}
      {registry && activeTab === "eligible" ? <Eligible rows={registry.eligibleQuarantineCases} busy={busy} onAnalyze={(row) => void analyze(row)} /> : null}
      {registry && ["requests","approvals","jobs","certificates","audit"].includes(activeTab) ? <Requests rows={filteredRequests.filter((item) => activeTab === "approvals" ? item.status === "awaiting_approval" : activeTab === "jobs" ? ["approved_for_destruction","destruction_scheduled","destroying","verifying"].includes(item.status) : activeTab === "certificates" ? item.status === "destroyed" : true)} query={query} onQuery={setQuery} busy={busy} onAction={(row, name) => void action(row, name)} onOpen={(id) => void openRequest(id)} /> : null}
      {registry && activeTab === "retention" ? <Retention rows={registry.retentionPolicies} busy={busy} dryRun={dryRun} onSimulate={(row) => void simulate(row)} /> : null}
      {registry && activeTab === "cleanup" ? <Cleanup rows={registry.cleanupProfiles} busy={busy} result={cleanupResult} onDryRun={(row) => void cleanup(row, false)} onExecute={(row) => void cleanup(row, true)} /> : null}
      {registry && activeTab === "holds" ? <LegalHolds rows={registry.legalHolds} busy={busy} onRefresh={() => void load()} onBusy={setBusy} onError={setError} onNotice={setNotice} /> : null}

      {impact && selectedCase ? <ImpactDrawer impact={impact} record={selectedCase} scope={scope} reason={reason} busy={busy === "create"} onScope={setScope} onReason={setReason} onCreate={() => void createRequest()} onClose={() => { setImpact(null); setSelectedCase(null) }} /> : null}
      {selectedRequest ? <RequestDrawer request={selectedRequest} events={requestEvents} certificate={certificate} confirmation={confirmation} onConfirmation={setConfirmation} busy={busy} onAction={(name) => void action(selectedRequest, name)} onClose={() => { setSelectedRequest(null); setRequestEvents([]); setCertificate(null) }} /> : null}
    </div>
  )
}

function Executive({ registry, onNavigate }: { registry: WindowsStorageDestructionRegistry; onNavigate: (tab: Tab) => void }) {
  return <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]"><section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-700">État de gouvernance</p><h4 className="mt-2 text-2xl font-black text-slate-950">La suppression n’est jamais une action instantanée.</h4><div className="mt-5 grid gap-3 sm:grid-cols-2"><Rule icon={FileLock2} title="Origine Phase 3" text="Uniquement depuis une quarantaine vérifiée et arrivée à échéance." /><Rule icon={BadgeCheck} title="Approbation indépendante" text="Le demandeur ne peut pas approuver sa propre destruction." /><Rule icon={CalendarClock} title="Délai de refroidissement" text="5 min, 24 h ou 72 h selon le risque." /><Rule icon={ShieldCheck} title="Certificat final" text="Absence physique, hash et capacité récupérée sont enregistrés." /></div></section><section className="rounded-[28px] border border-slate-900 bg-slate-950 p-5 text-white"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-300">Commandes gouvernées</p><div className="mt-4 space-y-2"><DarkAction label="Revoir les objets éligibles" onClick={() => onNavigate("eligible")} /><DarkAction label="Traiter les approbations" onClick={() => onNavigate("approvals")} /><DarkAction label="Simuler les politiques de rétention" onClick={() => onNavigate("retention")} /><DarkAction label="Nettoyage technique contrôlé" onClick={() => onNavigate("cleanup")} /></div></section></div>
}
function Eligible({ rows, busy, onAnalyze }: { rows: WindowsStorageQuarantineCase[]; busy: string | null; onAnalyze: (row: WindowsStorageQuarantineCase) => void }) { return <section className="rounded-[28px] border border-slate-200 bg-white p-5"><div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-700">Quarantaine arrivée à échéance</p><h4 className="mt-2 text-2xl font-black text-slate-950">Éligibles à une revue finale</h4></div><Pill tone="violet" label={`${rows.length} dossier(s)`} /></div><div className="mt-5 space-y-3">{rows.length ? rows.map((row) => <article key={row.id} className="flex flex-col gap-4 rounded-[22px] border border-slate-200 p-4 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Pill tone="slate" label={row.caseNumber} /><Pill tone={row.riskLevel === "high" ? "rose" : row.riskLevel === "controlled" ? "amber" : "emerald"} label={row.riskLevel} /></div><p className="mt-2 truncate text-lg font-black text-slate-950">{row.originalName}</p><p className="mt-1 text-xs font-semibold text-slate-500">{bytes(row.originalSizeBytes)} · Rétention terminée {dateTime(row.retentionUntil)}</p></div><button type="button" onClick={() => onAnalyze(row)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 text-xs font-black text-white">{busy === `impact:${row.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertOctagon className="h-4 w-4" />}Analyser pour destruction</button></article>) : <Empty text="Aucun dossier Phase 3 n’a encore terminé sa période de rétention." />}</div></section> }
function Requests({ rows, query, onQuery, busy, onAction, onOpen }: { rows: WindowsStorageDestructionRequest[]; query: string; onQuery: (v:string)=>void; busy: string | null; onAction: (row: WindowsStorageDestructionRequest, action: "approve"|"schedule"|"cancel"|"execute")=>void; onOpen:(id:string)=>void }) { return <section className="rounded-[28px] border border-slate-200 bg-white p-5"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-700">Registre permanent</p><h4 className="mt-2 text-2xl font-black text-slate-950">Demandes et travaux de destruction</h4></div><label className="relative block w-full max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e)=>onQuery(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm font-semibold outline-none" placeholder="Rechercher demande, fichier, boîte…" /></label></div><div className="mt-5 overflow-x-auto rounded-[22px] border border-slate-200"><table className="w-full min-w-[1050px] text-left"><thead className="bg-slate-50 text-[9px] font-black uppercase tracking-[0.15em] text-slate-500"><tr><th className="px-4 py-3">Demande</th><th className="px-4 py-3">Objet</th><th className="px-4 py-3">Périmètre</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Planification</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody>{rows.map((row)=><tr key={row.id} className="border-t border-slate-100 text-xs"><td className="px-4 py-4"><button onClick={()=>onOpen(row.id)} className="font-black text-blue-700">{row.requestNumber}</button><p className="mt-1 text-slate-500">{row.quarantineCaseNumber}</p></td><td className="px-4 py-4"><p className="max-w-[260px] truncate font-black text-slate-950">{row.originalName}</p><p className="mt-1 text-slate-500">{bytes(row.originalSizeBytes)}</p></td><td className="px-4 py-4 font-bold text-slate-700">{scopeLabel(row.scope)}</td><td className="px-4 py-4"><Pill tone={statusTone(row.status)} label={statusLabel(row.status)} /></td><td className="px-4 py-4 text-slate-600">{dateTime(row.scheduledFor)}</td><td className="px-4 py-4"><div className="flex justify-end gap-2">{row.status === "awaiting_approval" ? <Action label="Approuver" busy={busy===`approve:${row.id}`} onClick={()=>onAction(row,"approve")} /> : null}{row.status === "approved_for_destruction" ? <Action label="Planifier" busy={busy===`schedule:${row.id}`} onClick={()=>onOpen(row.id)} /> : null}{row.status === "destruction_scheduled" && row.scheduledFor && new Date(row.scheduledFor).getTime() <= Date.now() ? <Action danger label="Exécuter" busy={busy===`execute:${row.id}`} onClick={()=>onAction(row,"execute")} /> : null}{["awaiting_approval","approved_for_destruction","destruction_scheduled"].includes(row.status) ? <Action label="Annuler" busy={busy===`cancel:${row.id}`} onClick={()=>onAction(row,"cancel")} /> : null}<Action label="Dossier" onClick={()=>onOpen(row.id)} /></div></td></tr>)}</tbody></table></div>{!rows.length ? <Empty text="Aucune demande dans cette vue." /> : null}</section> }
function Retention({ rows, busy, dryRun, onSimulate }: { rows: WindowsStorageRetentionPolicy[]; busy:string|null; dryRun:WindowsStorageRetentionDryRun|null; onSimulate:(row:WindowsStorageRetentionPolicy)=>void }) { return <div className="grid gap-5 xl:grid-cols-[1fr_.8fr]"><section className="rounded-[28px] border border-slate-200 bg-white p-5"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">Retention Policy Studio</p><h4 className="mt-2 text-2xl font-black text-slate-950">Politiques avec simulation obligatoire</h4><div className="mt-5 space-y-3">{rows.map((row)=><article key={row.id} className="rounded-[20px] border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-slate-950">{row.name}</p><p className="mt-1 text-xs font-semibold text-slate-500">{row.minimumAgeDays} j avant revue · {row.quarantineDays} j de quarantaine</p></div><Pill tone={row.enabled?"emerald":"slate"} label={row.enabled?"Active":"Suspendue"} /></div><button onClick={()=>onSimulate(row)} className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-black text-blue-700">{busy===`retention:${row.id}`?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<Gauge className="h-3.5 w-3.5"/>}Simuler sans modifier</button></article>)}</div></section><section className="rounded-[28px] border border-blue-200 bg-blue-50 p-5"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">Résultat du dry-run</p>{dryRun?<div className="mt-4"><h4 className="text-xl font-black text-blue-950">{dryRun.policyName}</h4><div className="mt-4 grid grid-cols-2 gap-3"><Mini label="Objets correspondants" value={String(dryRun.matchedCount)} /><Mini label="Volume potentiel" value={bytes(dryRun.matchedBytes)} /><Mini label="Immédiatement éligibles" value={String(dryRun.immediatelyEligibleCount)} /><Mini label="À revoir" value={String(dryRun.reviewRequiredCount)} /></div><p className="mt-4 text-xs font-semibold leading-5 text-blue-800">Simulation seulement. Aucun fichier, message ou dossier n’a été modifié.</p></div>:<Empty text="Sélectionnez une politique pour simuler son impact." />}</section></div> }
function Cleanup({ rows, busy, result, onDryRun, onExecute }: { rows:WindowsStorageCleanupProfile[]; busy:string|null; result:any; onDryRun:(row:WindowsStorageCleanupProfile)=>void; onExecute:(row:WindowsStorageCleanupProfile)=>void }) { return <div className="grid gap-5 xl:grid-cols-[1fr_.8fr]"><section className="rounded-[28px] border border-slate-200 bg-white p-5"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Profils allowlistés</p><h4 className="mt-2 text-2xl font-black text-slate-950">Nettoyage technique contrôlé</h4><div className="mt-5 space-y-3">{rows.map((row)=><article key={row.id} className="rounded-[20px] border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-slate-950">{row.name}</p><p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{row.description}</p></div><Pill tone={row.riskLevel==="controlled"?"amber":"emerald"} label={row.riskLevel} /></div><div className="mt-3 flex gap-2"><Action label="Dry-run" busy={busy===`cleanup:${row.id}:false`} onClick={()=>onDryRun(row)} /><Action danger label="Exécuter le lot" busy={busy===`cleanup:${row.id}:true`} onClick={()=>onExecute(row)} /></div></article>)}</div></section><section className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Dernier résultat</p>{result?<pre className="mt-4 max-h-[460px] overflow-auto rounded-[18px] bg-slate-950 p-4 text-[11px] leading-5 text-emerald-200">{JSON.stringify(result,null,2)}</pre>:<Empty text="Exécutez d’abord un dry-run pour examiner les candidats." />}</section></div> }
function ImpactDrawer({ impact, record, scope, reason, busy, onScope, onReason, onCreate, onClose }: { impact:WindowsStorageDestructionImpact; record:WindowsStorageQuarantineCase; scope:WindowsStorageDestructionScope; reason:string; busy:boolean; onScope:(v:WindowsStorageDestructionScope)=>void; onReason:(v:string)=>void; onCreate:()=>void; onClose:()=>void }) { return <Drawer title="Analyse finale de destruction" subtitle={record.caseNumber} onClose={onClose}><div className="rounded-[22px] border border-rose-200 bg-rose-50 p-4"><div className="flex items-start gap-3"><AlertOctagon className="mt-0.5 h-5 w-5 text-rose-700"/><div><p className="font-black text-rose-950">Opération irréversible après exécution</p><p className="mt-1 text-xs font-semibold leading-5 text-rose-800">La restauration Phase 3 ne sera plus possible. Les sauvegardes et la copie Menara restent hors périmètre.</p></div></div></div><div className="mt-4 grid grid-cols-2 gap-3"><Mini label="Objet" value={impact.originalName}/><Mini label="Volume" value={bytes(impact.originalSizeBytes)}/><Mini label="Risque" value={impact.riskLevel}/><Mini label="Approbations" value={String(impact.approvalsRequired)}/></div>{impact.blockedReasons.length?<div className="mt-4 rounded-[20px] border border-rose-200 bg-white p-4"><p className="text-sm font-black text-rose-900">Destruction bloquée</p>{impact.blockedReasons.map((item)=><p key={item} className="mt-2 text-xs font-semibold text-rose-700">• {item}</p>)}</div>:<><label className="mt-5 grid gap-2"><span className="text-xs font-black text-slate-700">Périmètre exact</span><select value={scope} onChange={(e)=>onScope(e.target.value as WindowsStorageDestructionScope)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black">{impact.allowedScopes.map((item)=><option key={item} value={item}>{scopeLabel(item)}</option>)}</select></label><label className="mt-4 grid gap-2"><span className="text-xs font-black text-slate-700">Motif obligatoire</span><textarea value={reason} onChange={(e)=>onReason(e.target.value)} className="min-h-28 rounded-xl border border-slate-200 p-3 text-sm font-semibold" placeholder="Justification complète, politique et impact…"/></label><button disabled={busy} onClick={onCreate} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-700 text-sm font-black text-white disabled:opacity-50">{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<FileLock2 className="h-4 w-4"/>}Créer la demande gouvernée</button></>}</Drawer> }
function RequestDrawer({ request, events, certificate, confirmation, onConfirmation, busy, onAction, onClose }: { request:WindowsStorageDestructionRequest; events:WindowsStorageDestructionEvent[]; certificate:WindowsStorageDestructionCertificate|null; confirmation:string; onConfirmation:(v:string)=>void; busy:string|null; onAction:(name:"approve"|"schedule"|"cancel"|"execute")=>void; onClose:()=>void }) { const expected=`SUPPRIMER DÉFINITIVEMENT ${request.requestNumber}`; return <Drawer title={request.requestNumber} subtitle="Dossier permanent de gouvernance" onClose={onClose}><div className="grid grid-cols-2 gap-3"><Mini label="Statut" value={statusLabel(request.status)}/><Mini label="Risque" value={request.riskLevel}/><Mini label="Approbations" value={`${request.approvalCount}/${request.approvalsRequired}`}/><Mini label="Planifié" value={dateTime(request.scheduledFor)}/></div><div className="mt-4 rounded-[20px] border border-slate-200 bg-white p-4"><p className="text-sm font-black text-slate-950">{request.originalName}</p><p className="mt-1 text-xs font-semibold text-slate-500">{bytes(request.originalSizeBytes)} · {scopeLabel(request.scope)}</p><p className="mt-3 text-xs font-semibold leading-5 text-slate-600">{request.reason}</p></div>{request.status==="awaiting_approval"?<button onClick={()=>onAction("approve")} className="mt-4 h-11 w-full rounded-xl bg-blue-700 text-xs font-black text-white">Enregistrer mon approbation indépendante</button>:null}{request.status==="approved_for_destruction"?<div className="mt-4"><label className="grid gap-2"><span className="text-xs font-black text-slate-700">Confirmation de planification</span><input value={confirmation} onChange={(e)=>onConfirmation(e.target.value)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold" placeholder={request.riskLevel==="high"?expected:"Confirmation facultative pour ce niveau"}/></label><button onClick={()=>onAction("schedule")} className="mt-3 h-11 w-full rounded-xl bg-rose-700 text-xs font-black text-white">Démarrer le délai de refroidissement</button></div>:null}{request.status==="destruction_scheduled"?<div className="mt-4 rounded-[20px] border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-black text-amber-900">Destruction planifiée</p><p className="mt-1 text-xs font-semibold text-amber-800">Exécution autorisée à partir du {dateTime(request.scheduledFor)}.</p>{request.scheduledFor&&new Date(request.scheduledFor).getTime()<=Date.now()?<button onClick={()=>onAction("execute")} className="mt-3 h-11 w-full rounded-xl bg-rose-700 text-xs font-black text-white">Exécuter et vérifier définitivement</button>:null}</div>:null}{certificate?<div className="mt-4 rounded-[20px] border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-black text-emerald-900">{certificate.certificateNumber}</p><p className="mt-1 text-xs font-semibold text-emerald-800">{certificate.verificationResult} · {bytes(certificate.actualRecoveredBytes)}</p><div className="mt-3 flex gap-2"><a href={`/api/opsos/windows-node/storage/destruction/${request.id}/certificate?format=pdf`} className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-700 px-3 text-xs font-black text-white"><Download className="h-3.5 w-3.5"/>PDF A4</a><a href={`/api/opsos/windows-node/storage/destruction/${request.id}/certificate?format=csv`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-300 bg-white px-3 text-xs font-black text-emerald-700">CSV</a></div></div>:null}<div className="mt-5"><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Chronologie immuable</p><div className="mt-3 space-y-2">{events.map((item)=><div key={item.id} className="rounded-[16px] border border-slate-200 bg-white p-3"><div className="flex justify-between gap-3"><p className="text-xs font-black text-slate-900">{item.eventType.replaceAll("_"," ")}</p><span className="text-[10px] font-bold text-slate-400">{dateTime(item.createdAt)}</span></div><p className="mt-1 text-[11px] font-semibold text-slate-500">{item.actor} · {item.reason||item.status}</p></div>)}</div></div></Drawer> }
function Drawer({ title, subtitle, onClose, children }: { title:string; subtitle:string; onClose:()=>void; children:React.ReactNode }) { return <div className="fixed inset-0 z-[1300] flex justify-end bg-slate-950/55 backdrop-blur-sm"><button className="absolute inset-0" onClick={onClose} aria-label="Fermer"/><aside className="relative h-full w-full max-w-[620px] overflow-y-auto bg-slate-50 shadow-[-30px_0_100px_rgba(15,23,42,.3)]"><header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white/95 p-5 backdrop-blur"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-rose-700">OPSOS · Phase 4</p><h3 className="mt-2 text-2xl font-black text-slate-950">{title}</h3><p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p></div><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white"><X className="h-4 w-4"/></button></header><div className="p-5">{children}</div></aside></div> }

function LegalHolds({ rows, busy, onRefresh, onBusy, onError, onNotice }: { rows: WindowsStorageLegalHold[]; busy: string | null; onRefresh: () => void; onBusy: (value: string | null) => void; onError: (value: string | null) => void; onNotice: (value: string | null) => void }) {
  const [sourceId, setSourceId] = useState("email_attachments")
  const [objectReference, setObjectReference] = useState("")
  const [reason, setReason] = useState("")
  async function create() {
    onBusy("hold:create"); onError(null)
    const result = await api<WindowsStorageLegalHold>("/api/opsos/windows-node/storage/legal-holds", { method: "POST", body: JSON.stringify({ sourceId, objectReference, reason }) })
    onBusy(null)
    if (!result.ok) { onError(result.errorMessage || result.error || "Création du blocage impossible."); return }
    setObjectReference(""); setReason(""); onNotice("Blocage légal activé. Toute destruction correspondante est désormais interdite."); onRefresh()
  }
  async function release(row: WindowsStorageLegalHold) {
    onBusy(`hold:release:${row.id}`); onError(null)
    const result = await api<WindowsStorageLegalHold>(`/api/opsos/windows-node/storage/legal-holds/${row.id}/release`, { method: "POST", body: JSON.stringify({ reason: "Mainlevée approuvée après revue juridique et métier" }) })
    onBusy(null)
    if (!result.ok) { onError(result.errorMessage || result.error || "Mainlevée impossible."); return }
    onNotice("Blocage légal levé et audité."); onRefresh()
  }
  return <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><section className="rounded-[28px] border border-rose-200 bg-rose-50 p-5"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-700">Legal Hold Control</p><h4 className="mt-2 text-2xl font-black text-rose-950">Bloquer toute destruction</h4><p className="mt-2 text-xs font-semibold leading-5 text-rose-800">Un blocage actif neutralise les politiques de rétention, les approbations et les exécutions Phase 4.</p><label className="mt-4 grid gap-2"><span className="text-xs font-black text-rose-900">Source</span><input value={sourceId} onChange={(e)=>setSourceId(e.target.value)} className="h-11 rounded-xl border border-rose-200 bg-white px-3 text-sm font-semibold" /></label><label className="mt-3 grid gap-2"><span className="text-xs font-black text-rose-900">Référence objet</span><input value={objectReference} onChange={(e)=>setObjectReference(e.target.value)} className="h-11 rounded-xl border border-rose-200 bg-white px-3 text-sm font-semibold" placeholder="source:path ou référence métier" /></label><label className="mt-3 grid gap-2"><span className="text-xs font-black text-rose-900">Motif</span><textarea value={reason} onChange={(e)=>setReason(e.target.value)} className="min-h-24 rounded-xl border border-rose-200 bg-white p-3 text-sm font-semibold" placeholder="Obligation légale, contractuelle ou probatoire…" /></label><button onClick={()=>void create()} disabled={busy==="hold:create" || objectReference.trim().length < 3 || reason.trim().length < 8} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-800 text-xs font-black text-white disabled:opacity-50">{busy==="hold:create"?<Loader2 className="h-4 w-4 animate-spin"/>:<LockKeyhole className="h-4 w-4"/>}Activer le blocage légal</button></section><section className="rounded-[28px] border border-slate-200 bg-white p-5"><div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Registre des holds</p><h4 className="mt-2 text-2xl font-black text-slate-950">Protections actives et libérées</h4></div><Pill tone="rose" label={`${rows.filter((row)=>row.status==="active").length} actif(s)`}/></div><div className="mt-5 space-y-3">{rows.map((row)=><article key={row.id} className="rounded-[20px] border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Pill tone={row.status==="active"?"rose":"slate"} label={row.status}/><Pill tone="blue" label={row.sourceId}/></div><p className="mt-2 break-all text-sm font-black text-slate-950">{row.objectReference}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{row.reason}</p><p className="mt-2 text-[10px] font-bold text-slate-400">Placée par {row.placedBy} · {dateTime(row.placedAt)}</p></div>{row.status==="active"?<button onClick={()=>void release(row)} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black text-slate-700">{busy===`hold:release:${row.id}`?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:null}Lever</button>:null}</div></article>)}{!rows.length?<Empty text="Aucun blocage légal enregistré."/>:null}</div></section></div>
}

function Rule({ icon:Icon, title, text }: { icon:typeof ShieldCheck; title:string; text:string }) { return <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4"><Icon className="h-5 w-5 text-blue-700"/><p className="mt-3 text-sm font-black text-slate-950">{title}</p><p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{text}</p></div> }
function DarkAction({ label, onClick }: { label:string; onClick:()=>void }) { return <button onClick={onClick} className="flex h-11 w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 text-left text-xs font-black text-white hover:bg-white/10"><span>{label}</span><span>→</span></button> }
function Metric({ label, value, tone }: { label:string; value:string; tone:Tone }) { const p=TONES[tone]; return <div className="rounded-[20px] border p-4" style={{borderColor:p.border,background:p.bg}}><p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">{label}</p><p className="mt-2 text-xl font-black" style={{color:p.text}}>{value}</p></div> }
function Mini({ label, value }: { label:string; value:string }) { return <div className="rounded-[16px] border border-slate-200 bg-white p-3"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p><p className="mt-1.5 break-words text-xs font-black text-slate-800">{value}</p></div> }
function Pill({ label, tone }: { label:string; tone:Tone }) { const p=TONES[tone]; return <span className="inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em]" style={{borderColor:p.border,background:p.bg,color:p.text}}>{label}</span> }
function Action({ label, onClick, busy=false, danger=false }: { label:string; onClick:()=>void; busy?:boolean; danger?:boolean }) { return <button onClick={onClick} disabled={busy} className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[10px] font-black ${danger?"bg-rose-700 text-white":"border border-slate-200 bg-white text-slate-700"}`}>{busy?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:null}{label}</button> }
function Notice({ tone, text, onClose }: { tone:Tone; text:string; onClose:()=>void }) { const p=TONES[tone]; return <div className="flex items-center gap-3 rounded-[20px] border p-4" style={{borderColor:p.border,background:p.bg,color:p.text}}><AlertTriangle className="h-5 w-5"/><p className="flex-1 text-sm font-black">{text}</p><button onClick={onClose}><X className="h-4 w-4"/></button></div> }
function Empty({ text }: { text:string }) { return <div className="mt-5 rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><Ban className="mx-auto h-6 w-6 text-slate-300"/><p className="mt-3 text-sm font-black text-slate-600">{text}</p></div> }
