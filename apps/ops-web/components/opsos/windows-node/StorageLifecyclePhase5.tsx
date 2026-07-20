"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  Bot,
  Boxes,
  CheckCircle2,
  ChevronRight,
  CirclePause,
  CirclePlay,
  CloudCog,
  Database,
  FileStack,
  Gauge,
  HardDrive,
  History,
  Layers3,
  Loader2,
  LockKeyhole,
  MailCheck,
  Network,
  Pause,
  Play,
  RefreshCw,
  RotateCw,
  ScanSearch,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TimerReset,
  X,
  Zap,
} from "lucide-react"
import type {
  WindowsStorageDedupGroup,
  WindowsStorageDedupPlan,
  WindowsStorageDedupScan,
  WindowsStorageLifecycleAction,
  WindowsStorageLifecycleAlert,
  WindowsStorageLifecyclePolicy,
  WindowsStorageLifecycleRegistry,
  WindowsStorageLifecycleRun,
  WindowsStorageProviderCapabilities,
  WindowsStorageProviderReconciliation,
} from "@/lib/opsos/windows-node-types"

type Tab = "command" | "automation" | "forecast" | "dedup" | "provider" | "runs" | "alerts"
type Tone = "blue" | "emerald" | "amber" | "rose" | "violet" | "cyan" | "slate"
type MailboxOption = { mailboxId: string; key: string; email: string; name: string; provider: string }
type ApiResult<T> = { ok: boolean; data?: T; error?: string; errorMessage?: string }

const TABS: Array<{ id: Tab; label: string; icon: typeof Gauge }> = [
  { id: "command", label: "Pilotage automatique", icon: Bot },
  { id: "automation", label: "Politiques", icon: SlidersHorizontal },
  { id: "forecast", label: "Prévisions", icon: Gauge },
  { id: "dedup", label: "Déduplication", icon: Layers3 },
  { id: "provider", label: "Synchronisation fournisseur", icon: Network },
  { id: "runs", label: "Exécutions", icon: History },
  { id: "alerts", label: "Alertes", icon: Bell },
]

const ACTION_LABELS: Record<WindowsStorageLifecycleAction, string> = {
  inventory: "Inventaire Windows",
  forecast: "Prévision de capacité",
  provider_sync: "Synchronisation POP3",
  provider_reconcile: "Réconciliation fournisseur",
  dedup_scan: "Analyse des doublons",
  retention_dry_run: "Simulation de rétention",
  cleanup_dry_run: "Simulation de nettoyage",
  quarantine_request: "Demande de quarantaine",
  destruction_review: "Revue Phase 4",
}

const TONES: Record<Tone, { bg: string; border: string; text: string; solid: string }> = {
  blue: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", solid: "#2563eb" },
  emerald: { bg: "#ecfdf5", border: "#a7f3d0", text: "#047857", solid: "#10b981" },
  amber: { bg: "#fffbeb", border: "#fde68a", text: "#b45309", solid: "#f59e0b" },
  rose: { bg: "#fff1f2", border: "#fecdd3", text: "#be123c", solid: "#f43f5e" },
  violet: { bg: "#f5f3ff", border: "#ddd6fe", text: "#6d28d9", solid: "#7c3aed" },
  cyan: { bg: "#ecfeff", border: "#a5f3fc", text: "#0e7490", solid: "#06b6d4" },
  slate: { bg: "#f8fafc", border: "#e2e8f0", text: "#475569", solid: "#64748b" },
}

function bytes(value?: number | null) {
  const current = Number(value || 0)
  if (!Number.isFinite(current) || current <= 0) return "0 o"
  const units = ["o", "Ko", "Mo", "Go", "To"]
  let amount = current
  let unit = 0
  while (amount >= 1024 && unit < units.length - 1) { amount /= 1024; unit += 1 }
  return `${amount.toLocaleString("fr-FR", { maximumFractionDigits: unit >= 3 ? 1 : 0 })} ${units[unit]}`
}
function number(value?: number | null) { return Number(value || 0).toLocaleString("fr-FR") }
function dateTime(value?: string | null) { if (!value) return "Non disponible"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(date) }
function relative(value?: string | null) { if (!value) return "Jamais"; const date = new Date(value); if (Number.isNaN(date.getTime())) return "Indisponible"; const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000)); if (minutes < 1) return "À l’instant"; if (minutes < 60) return `Il y a ${minutes} min`; const hours = Math.floor(minutes / 60); if (hours < 24) return `Il y a ${hours} h`; return `Il y a ${Math.floor(hours / 24)} j` }
function days(value?: number | null) { if (value === null || value === undefined || !Number.isFinite(value)) return "Non calculé"; if (value < 1) return "Moins d’un jour"; return `${Math.ceil(value)} jour(s)` }
function runTone(status: string): Tone { if (["completed"].includes(status)) return "emerald"; if (["completed_with_warnings", "paused", "queued"].includes(status)) return "amber"; if (["failed", "cancelled"].includes(status)) return "rose"; if (["running"].includes(status)) return "blue"; return "slate" }
function alertTone(severity: string): Tone { if (severity === "critical" || severity === "high") return "rose"; if (severity === "medium") return "amber"; if (severity === "low") return "blue"; return "slate" }

async function api<T>(url: string, options?: RequestInit): Promise<ApiResult<T>> {
  const response = await fetch(url, { ...options, cache: "no-store", headers: { "content-type": "application/json", ...(options?.headers || {}) } })
  const json = await response.json().catch(() => ({}))
  return { ok: Boolean(response.ok && json?.ok !== false), data: json?.data, error: json?.error, errorMessage: json?.errorMessage }
}

export default function StorageLifecyclePhase5({ onRefreshInventory }: { onRefreshInventory: () => void }) {
  const [tab, setTab] = useState<Tab>("command")
  const [registry, setRegistry] = useState<WindowsStorageLifecycleRegistry | null>(null)
  const [mailboxes, setMailboxes] = useState<MailboxOption[]>([])
  const [selectedMailbox, setSelectedMailbox] = useState("")
  const [capabilities, setCapabilities] = useState<WindowsStorageProviderCapabilities | null>(null)
  const [dedupScan, setDedupScan] = useState<WindowsStorageDedupScan | null>(null)
  const [policyDraft, setPolicyDraft] = useState<WindowsStorageLifecyclePolicy | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [selectedRun, setSelectedRun] = useState<WindowsStorageLifecycleRun | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<WindowsStorageDedupPlan | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<WindowsStorageDedupGroup | null>(null)
  const [reason, setReason] = useState("")
  const [materializeFileId, setMaterializeFileId] = useState<string | null>(null)

  async function load() {
    setLoading(true); setError(null)
    const [registryResult, mailboxResult] = await Promise.all([
      api<WindowsStorageLifecycleRegistry>("/api/opsos/windows-node/storage/lifecycle"),
      api<MailboxOption[]>("/api/opsos/windows-node/storage/provider/mailboxes"),
    ])
    setLoading(false)
    if (!registryResult.ok || !registryResult.data) { setError(registryResult.errorMessage || registryResult.error || "Phase 5 indisponible."); return }
    setRegistry(registryResult.data); setPolicyDraft(registryResult.data.policy)
    if (mailboxResult.ok && mailboxResult.data) { setMailboxes(mailboxResult.data); if (!selectedMailbox && mailboxResult.data[0]) setSelectedMailbox(mailboxResult.data[0].mailboxId) }
  }

  useEffect(() => { void load() }, [])

  const filteredRuns = useMemo(() => { const needle = query.trim().toLowerCase(); const rows = registry?.runs || []; return needle ? rows.filter((run) => `${run.runNumber} ${run.status} ${run.actions.join(" ")} ${run.requestedBy}`.toLowerCase().includes(needle)) : rows }, [registry, query])
  const openAlerts = registry?.alerts.filter((item) => item.status === "open") || []

  async function runLifecycle(actions?: WindowsStorageLifecycleAction[]) {
    setBusy("run"); setError(null); setNotice(null)
    const result = await api<WindowsStorageLifecycleRun>("/api/opsos/windows-node/storage/lifecycle", { method: "POST", body: JSON.stringify({ actions, execute: true, reason: "Exécution manuelle Phase 5" }) })
    setBusy(null)
    if (!result.ok) { setError(result.errorMessage || result.error || "Exécution impossible."); return }
    setNotice(`Cycle ${result.data?.runNumber || "Phase 5"} terminé avec le statut ${result.data?.status}.`); await load(); onRefreshInventory()
  }

  async function savePolicy() {
    if (!policyDraft) return
    setBusy("policy"); setError(null)
    const result = await api<WindowsStorageLifecyclePolicy>("/api/opsos/windows-node/storage/lifecycle/policies", { method: "PUT", body: JSON.stringify({ policy: policyDraft }) })
    setBusy(null)
    if (!result.ok || !result.data) { setError(result.errorMessage || result.error || "Mise à jour impossible."); return }
    setPolicyDraft(result.data); setNotice("Politique Phase 5 mise à jour. Aucun contrôle Phase 3 ou Phase 4 n’a été contourné."); await load()
  }

  async function scanDuplicates() {
    setBusy("dedup:scan"); setError(null)
    const result = await api<WindowsStorageDedupScan>("/api/opsos/windows-node/storage/dedup/scan")
    setBusy(null)
    if (!result.ok || !result.data) { setError(result.errorMessage || result.error || "Analyse des doublons impossible."); return }
    setDedupScan(result.data); setNotice(`${result.data.groupCount} groupe(s) identique(s) analysé(s), sans modification physique.`)
  }

  async function createPlan(group: WindowsStorageDedupGroup) {
    if (reason.trim().length < 8) { setError("Saisissez un motif détaillé pour créer le plan."); return }
    setBusy(`dedup:create:${group.sha256}`); setError(null)
    const result = await api<WindowsStorageDedupPlan>("/api/opsos/windows-node/storage/dedup/plans", { method: "POST", body: JSON.stringify({ group, reason }) })
    setBusy(null)
    if (!result.ok) { setError(result.errorMessage || result.error || "Création du plan impossible."); return }
    setSelectedGroup(null); setReason(""); setNotice(`Plan ${result.data?.planNumber} créé et soumis à approbation indépendante.`); await load()
  }

  async function planAction(plan: WindowsStorageDedupPlan, action: "approve" | "execute") {
    if (action === "approve" && reason.trim().length < 8) { setError("Un motif d’approbation détaillé est obligatoire."); return }
    setBusy(`dedup:${action}:${plan.id}`); setError(null)
    const result = await api<WindowsStorageDedupPlan>(`/api/opsos/windows-node/storage/dedup/plans/${plan.id}/${action}`, { method: "POST", body: JSON.stringify({ reason }) })
    setBusy(null)
    if (!result.ok) { setError(result.errorMessage || result.error || `Action ${action} impossible.`); return }
    setReason(""); setSelectedPlan(result.data || null); setNotice(action === "approve" ? "Plan approuvé indépendamment." : `Consolidation terminée. Capacité réellement récupérée : ${bytes(result.data?.actualRecoveredBytes)}.`); await load(); onRefreshInventory()
  }

  async function materializeCopy(plan: WindowsStorageDedupPlan, fileId: string) {
    if (reason.trim().length < 8) { setError("Un motif détaillé est obligatoire pour recréer une copie physique indépendante."); return }
    setMaterializeFileId(fileId); setBusy(`dedup:materialize:${fileId}`); setError(null)
    const result = await api<WindowsStorageDedupPlan>(`/api/opsos/windows-node/storage/dedup/plans/${plan.id}/materialize`, { method: "POST", body: JSON.stringify({ fileId, reason }) })
    setBusy(null); setMaterializeFileId(null)
    if (!result.ok) { setError(result.errorMessage || result.error || "Matérialisation impossible."); return }
    setSelectedPlan(result.data || null); setReason(""); setNotice("Une copie physique indépendante a été recréée et vérifiée par SHA-256."); await load(); onRefreshInventory()
  }

  async function providerAction(action: "capabilities" | "sync" | "reconcile") {
    if (!selectedMailbox) { setError("Sélectionnez une boîte Email OS."); return }
    setBusy(`provider:${action}`); setError(null)
    const endpoint = action === "capabilities" ? "/api/opsos/windows-node/storage/provider/capabilities" : action === "sync" ? "/api/opsos/windows-node/storage/provider/sync" : "/api/opsos/windows-node/storage/provider/reconcile"
    const result = await api<any>(endpoint, { method: "POST", body: JSON.stringify({ mailboxId: selectedMailbox, limit: policyDraft?.providerSyncLimitPerMailbox || 25 }) })
    setBusy(null)
    if (!result.ok) { setError(result.errorMessage || result.error || "Opération fournisseur impossible."); return }
    if (action === "capabilities") setCapabilities(result.data as WindowsStorageProviderCapabilities)
    setNotice(action === "sync" ? "Synchronisation POP3 terminée et messages persistés dans Email OS." : action === "reconcile" ? "Réconciliation fournisseur/local enregistrée." : "Capacités POP3 vérifiées.")
    await load(); onRefreshInventory()
  }

  async function runAction(run: WindowsStorageLifecycleRun, action: "pause" | "resume" | "cancel" | "execute") {
    setBusy(`run:${action}:${run.id}`); setError(null)
    const result = await api<WindowsStorageLifecycleRun>(`/api/opsos/windows-node/storage/lifecycle/runs/${run.id}`, { method: "POST", body: JSON.stringify({ action }) })
    setBusy(null)
    if (!result.ok) { setError(result.errorMessage || result.error || "Action impossible."); return }
    setNotice(`Cycle ${run.runNumber} : ${action} confirmé.`); await load()
  }

  async function alertAction(alert: WindowsStorageLifecycleAlert, action: "acknowledge" | "resolve") {
    setBusy(`alert:${alert.id}`)
    const result = await api<WindowsStorageLifecycleAlert>("/api/opsos/windows-node/storage/lifecycle/alerts", { method: "PATCH", body: JSON.stringify({ alertId: alert.id, action }) })
    setBusy(null)
    if (!result.ok) { setError(result.errorMessage || result.error || "Mise à jour de l’alerte impossible."); return }
    await load()
  }

  if (loading && !registry) return <div className="grid min-h-[520px] place-items-center rounded-[30px] border border-slate-200 bg-white"><div className="text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600"/><p className="mt-3 text-sm font-black text-slate-700">Initialisation du moteur Phase 5…</p></div></div>

  return (
    <section className="space-y-5">
      <header className="overflow-hidden rounded-[30px] border border-white bg-[linear-gradient(135deg,#ffffff_0%,#f3f9ff_52%,#eef2ff_100%)] p-5 shadow-[0_22px_70px_rgba(15,23,42,.08)] ring-1 ring-slate-200/70 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2"><Pill tone="violet" label="Phase 5 · Optimisation continue"/><Pill tone="emerald" label="Automatisation gouvernée"/><Pill tone="slate" label="Aucun contournement Phase 3/4"/></div>
            <div className="mt-4 flex items-start gap-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white shadow-xl shadow-slate-950/15"><Bot className="h-6 w-6"/></div><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600">OPSOS · Lifecycle Intelligence</p><h3 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950">Automatisation, synchronisation & déduplication</h3><p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-slate-600">Le stockage devient piloté en continu : prévisions, alertes, réconciliation Menara, analyses de rétention et consolidation exacte SHA-256, sans jamais contourner la quarantaine, les approbations ou la destruction contrôlée.</p></div></div>
          </div>
          <div className="flex flex-wrap gap-2"><button onClick={()=>void load()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700"><RefreshCw className={`h-4 w-4 ${loading?"animate-spin":""}`}/>Actualiser</button><button onClick={()=>void runLifecycle()} disabled={busy==="run"} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white disabled:opacity-50">{busy==="run"?<Loader2 className="h-4 w-4 animate-spin"/>:<Zap className="h-4 w-4"/>}Lancer le cycle complet</button></div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Cycle actif" value={registry?.runningRunCount ? `${registry.runningRunCount} en cours` : "Disponible"} tone={registry?.runningRunCount?"blue":"emerald"}/><Metric label="Alertes ouvertes" value={number(registry?.openAlertCount)} tone={registry?.openAlertCount?"rose":"emerald"}/><Metric label="Plans dédup" value={number(registry?.pendingDedupPlanCount)} tone={registry?.pendingDedupPlanCount?"amber":"slate"}/><Metric label="Récupération potentielle" value={bytes(registry?.potentialDedupRecoveryBytes)} tone="violet"/><Metric label="Dernier instantané" value={relative(registry?.latestSnapshot?.capturedAt)} tone="slate"/></div>
      </header>

      {error?<Notice tone="rose" text={error} onClose={()=>setError(null)}/>:null}
      {notice?<Notice tone="emerald" text={notice} onClose={()=>setNotice(null)}/>:null}

      <div className="sticky top-3 z-20 overflow-x-auto rounded-[22px] border border-slate-200 bg-white/95 p-2 shadow-[0_14px_40px_rgba(15,23,42,.08)] backdrop-blur-xl"><div className="flex min-w-max gap-1">{TABS.map((item)=>{const Icon=item.icon;return <button key={item.id} onClick={()=>setTab(item.id)} className={`inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-xs font-black transition ${tab===item.id?"bg-slate-950 text-white shadow-lg":"text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}><Icon className="h-4 w-4"/>{item.label}</button>})}</div></div>

      {tab==="command"?<CommandPanel registry={registry} busy={busy} onRun={runLifecycle} onTab={setTab}/>:null}
      {tab==="automation"&&policyDraft?<PolicyPanel policy={policyDraft} onChange={setPolicyDraft} onSave={()=>void savePolicy()} busy={busy==="policy"}/>:null}
      {tab==="forecast"?<ForecastPanel registry={registry}/>:null}
      {tab==="dedup"?<DedupPanel scan={dedupScan} plans={registry?.dedupPlans||[]} busy={busy} reason={reason} onReason={setReason} onScan={()=>void scanDuplicates()} onSelectGroup={setSelectedGroup} onSelectPlan={setSelectedPlan}/>:null}
      {tab==="provider"?<ProviderPanel mailboxes={mailboxes} selectedMailbox={selectedMailbox} onMailbox={setSelectedMailbox} capabilities={capabilities} reconciliations={registry?.reconciliations||[]} providerRuns={registry?.providerRuns||[]} busy={busy} onAction={providerAction}/>:null}
      {tab==="runs"?<RunsPanel runs={filteredRuns} query={query} onQuery={setQuery} busy={busy} onSelect={setSelectedRun} onAction={runAction}/>:null}
      {tab==="alerts"?<AlertsPanel rows={registry?.alerts||[]} busy={busy} onAction={alertAction}/>:null}

      {selectedGroup?<Drawer title="Créer un plan de déduplication" subtitle={`${selectedGroup.physicalCopies} copies exactes · ${bytes(selectedGroup.potentialRecoverableBytes)} récupérables`} onClose={()=>{setSelectedGroup(null);setReason("")}}><GroupDossier group={selectedGroup}/><label className="mt-5 grid gap-2"><span className="text-xs font-black text-slate-700">Motif obligatoire</span><textarea value={reason} onChange={(e)=>setReason(e.target.value)} className="min-h-24 rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold" placeholder="Consolidation de copies physiques strictement identiques…"/></label><button onClick={()=>void createPlan(selectedGroup)} disabled={busy===`dedup:create:${selectedGroup.sha256}`||reason.trim().length<8} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-xs font-black text-white disabled:opacity-50">{busy===`dedup:create:${selectedGroup.sha256}`?<Loader2 className="h-4 w-4 animate-spin"/>:<Layers3 className="h-4 w-4"/>}Créer le plan gouverné</button></Drawer>:null}
      {selectedPlan?<Drawer title={selectedPlan.planNumber} subtitle={`Plan ${selectedPlan.status} · SHA-256 ${selectedPlan.sha256.slice(0,16)}…`} onClose={()=>{setSelectedPlan(null);setReason("");setMaterializeFileId(null)}}><PlanDossier plan={selectedPlan}/>{selectedPlan.status==="awaiting_approval"?<><label className="mt-5 grid gap-2"><span className="text-xs font-black text-slate-700">Motif d’approbation indépendante</span><textarea value={reason} onChange={(e)=>setReason(e.target.value)} className="min-h-24 rounded-xl border border-slate-200 p-3 text-sm font-semibold"/></label><button onClick={()=>void planAction(selectedPlan,"approve")} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 text-xs font-black text-white"><ShieldCheck className="h-4 w-4"/>Approuver indépendamment</button></>:null}{selectedPlan.status==="approved"?<button onClick={()=>void planAction(selectedPlan,"execute")} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 text-xs font-black text-white"><Zap className="h-4 w-4"/>Consolider sur le nœud Windows</button>:null}{["completed","completed_with_warnings"].includes(selectedPlan.status)?<MaterializationPanel plan={selectedPlan} reason={reason} onReason={setReason} busyFileId={materializeFileId} onMaterialize={(fileId)=>void materializeCopy(selectedPlan,fileId)}/>:null}</Drawer>:null}
      {selectedRun?<Drawer title={selectedRun.runNumber} subtitle={`${selectedRun.status} · ${dateTime(selectedRun.createdAt)}`} onClose={()=>setSelectedRun(null)}><RunDossier run={selectedRun}/></Drawer>:null}
    </section>
  )
}

function CommandPanel({registry,busy,onRun,onTab}:{registry:WindowsStorageLifecycleRegistry|null;busy:string|null;onRun:(actions?:WindowsStorageLifecycleAction[])=>void;onTab:(tab:Tab)=>void}){
  const forecast=registry?.forecast
  return <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">Moteur d’orchestration</p><h4 className="mt-2 text-2xl font-black text-slate-950">Cycle de vie gouverné</h4><p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Le moteur observe, prévoit, synchronise et prépare les décisions. Toute action destructive reste soumise aux contrôles des phases précédentes.</p></div><div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-700"><Bot className="h-5 w-5"/></div></div><div className="mt-5 grid gap-3 md:grid-cols-2">{Object.entries(ACTION_LABELS).slice(0,7).map(([key,label])=><button key={key} onClick={()=>onRun([key as WindowsStorageLifecycleAction])} disabled={busy==="run"} className="group flex items-center gap-3 rounded-[20px] border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50"><div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-blue-700 shadow-sm"><CirclePlay className="h-4 w-4"/></div><div className="min-w-0 flex-1"><p className="text-sm font-black text-slate-950">{label}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">Exécution traçable et bornée</p></div><ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600"/></button>)}</div></section><aside className="space-y-4"><section className="rounded-[28px] border border-slate-900 bg-slate-950 p-5 text-white shadow-[0_22px_60px_rgba(15,23,42,.2)]"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-200">Prévision actuelle</p><p className="mt-3 text-3xl font-black">{forecast?.trend==="growing"?"Croissance détectée":forecast?.trend==="shrinking"?"Réduction mesurée":"Capacité stable"}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-300">Seuil critique estimé : {days(forecast?.daysToCritical)}</p><div className="mt-4 grid grid-cols-2 gap-2"><DarkMetric label="Croissance/jour" value={bytes(Math.max(0,forecast?.averageGrowthBytesPerDay||0))}/><DarkMetric label="Confiance" value={forecast?.confidence||"insuffisante"}/></div><button onClick={()=>onTab("forecast")} className="mt-4 flex h-10 w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-black text-white"><span>Ouvrir les prévisions</span><ChevronRight className="h-4 w-4"/></button></section><section className="rounded-[28px] border border-slate-200 bg-white p-5"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Garde-fous absolus</p><div className="mt-4 space-y-3"><Guard icon={ShieldCheck} title="Approbations maintenues" text="Aucune quarantaine ou destruction sans le workflow Phase 3/4."/><Guard icon={LockKeyhole} title="Legal holds respectés" text="Les objets protégés sont exclus des plans et automatisations."/><Guard icon={ScanSearch} title="Dry run prioritaire" text="Les politiques simulent leur impact avant toute création de demande."/></div></section></aside></div>
}

function PolicyPanel({policy,onChange,onSave,busy}:{policy:WindowsStorageLifecyclePolicy;onChange:(p:WindowsStorageLifecyclePolicy)=>void;onSave:()=>void;busy:boolean}){
  const toggleAction=(action:WindowsStorageLifecycleAction)=>onChange({...policy,actions:policy.actions.includes(action)?policy.actions.filter((item)=>item!==action):[...policy.actions,action]})
  return <div className="grid gap-5 xl:grid-cols-[1fr_.7fr]"><section className="rounded-[28px] border border-slate-200 bg-white p-5"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Policy Studio</p><h4 className="mt-2 text-2xl font-black text-slate-950">Automatisation récurrente</h4><div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Nom"><input value={policy.name} onChange={(e)=>onChange({...policy,name:e.target.value})} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold"/></Field><Field label="Cadence (minutes)"><input type="number" min={15} value={policy.cadenceMinutes} onChange={(e)=>onChange({...policy,cadenceMinutes:Number(e.target.value)})} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold"/></Field><Field label="Messages POP3 par boîte"><input type="number" min={1} max={100} value={policy.providerSyncLimitPerMailbox} onChange={(e)=>onChange({...policy,providerSyncLimitPerMailbox:Number(e.target.value)})} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold"/></Field><Field label="Candidats maximum par cycle"><input type="number" min={10} max={5000} value={policy.maximumCandidatesPerRun} onChange={(e)=>onChange({...policy,maximumCandidatesPerRun:Number(e.target.value)})} className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold"/></Field></div><div className="mt-5"><p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">Actions du cycle</p><div className="mt-3 grid gap-2 md:grid-cols-2">{Object.entries(ACTION_LABELS).map(([action,label])=><button key={action} onClick={()=>toggleAction(action as WindowsStorageLifecycleAction)} className={`flex items-center justify-between rounded-xl border px-3 py-3 text-left text-xs font-black ${policy.actions.includes(action as WindowsStorageLifecycleAction)?"border-blue-200 bg-blue-50 text-blue-800":"border-slate-200 bg-white text-slate-600"}`}><span>{label}</span>{policy.actions.includes(action as WindowsStorageLifecycleAction)?<CheckCircle2 className="h-4 w-4"/>:null}</button>)}</div></div><button onClick={onSave} disabled={busy} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-xs font-black text-white disabled:opacity-50">{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<ShieldCheck className="h-4 w-4"/>}Enregistrer la politique</button></section><aside className="space-y-4"><Toggle label="Politique active" checked={policy.enabled} onChange={(checked)=>onChange({...policy,enabled:checked})}/><Toggle label="Synchronisation fournisseur" checked={policy.providerSyncEnabled} onChange={(checked)=>onChange({...policy,providerSyncEnabled:checked})}/><Toggle label="Analyse déduplication" checked={policy.dedupScanEnabled} onChange={(checked)=>onChange({...policy,dedupScanEnabled:checked})}/><Toggle label="Dry run obligatoire" checked={policy.requireDryRun} onChange={(checked)=>onChange({...policy,requireDryRun:checked})}/><section className="rounded-[24px] border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-black text-amber-900">Automatisation destructive désactivée</p><p className="mt-2 text-xs font-semibold leading-5 text-amber-800">Les options de demande automatique peuvent préparer un dossier, mais elles ne peuvent ni approuver ni exécuter la Phase 3 ou Phase 4.</p></section></aside></div>
}

function ForecastPanel({registry}:{registry:WindowsStorageLifecycleRegistry|null}){const f=registry?.forecast;const points=f?.points||[];const max=Math.max(...points.map((p)=>p.usedBytes),1);return <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><section className="rounded-[28px] border border-slate-200 bg-white p-5"><div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700">Predictive Capacity</p><h4 className="mt-2 text-2xl font-black text-slate-950">Projection de saturation</h4></div><Pill tone={f?.trend==="growing"?"amber":f?.trend==="shrinking"?"emerald":"slate"} label={f?.trend||"unknown"}/></div><div className="mt-6 flex h-64 items-end gap-1 rounded-[22px] border border-slate-100 bg-slate-50 p-4">{points.slice(-72).map((point,index)=><div key={`${point.timestamp}-${index}`} title={`${dateTime(point.timestamp)} · ${bytes(point.usedBytes)}`} className="min-w-[3px] flex-1 rounded-t bg-blue-500/70" style={{height:`${Math.max(4,(point.usedBytes/max)*100)}%`}}/>)}</div><div className="mt-4 flex flex-wrap gap-2"><Pill tone="blue" label={`${f?.sampleCount||0} mesures`}/><Pill tone="violet" label={`Confiance ${f?.confidence||"insuffisante"}`}/><Pill tone="slate" label={`Généré ${relative(f?.generatedAt)}`}/></div></section><aside className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1"><Metric label="Croissance quotidienne" value={f?.averageGrowthBytesPerDay&&f.averageGrowthBytesPerDay>0?bytes(f.averageGrowthBytesPerDay):"Stable / décroissante"} tone={f?.trend==="growing"?"amber":"emerald"}/><Metric label="Seuil d’alerte" value={days(f?.daysToWarning)} tone="blue"/><Metric label="Seuil critique" value={days(f?.daysToCritical)} tone="rose"/><Metric label="Saturation complète" value={days(f?.daysToFull)} tone="violet"/><section className="rounded-[22px] border border-slate-200 bg-white p-4"><p className="text-xs font-black text-slate-950">Lecture décisionnelle</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-600">Les prévisions utilisent les instantanés réellement enregistrés. Elles deviennent plus fiables après plusieurs jours de mesures régulières.</p></section></aside></div>}

function DedupPanel({scan,plans,busy,reason,onReason,onScan,onSelectGroup,onSelectPlan}:{scan:WindowsStorageDedupScan|null;plans:WindowsStorageDedupPlan[];busy:string|null;reason:string;onReason:(v:string)=>void;onScan:()=>void;onSelectGroup:(g:WindowsStorageDedupGroup)=>void;onSelectPlan:(p:WindowsStorageDedupPlan)=>void}){return <div className="space-y-5"><section className="rounded-[28px] border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">Exact SHA-256 Intelligence</p><h4 className="mt-2 text-2xl font-black text-slate-950">Déduplication physique sûre</h4><p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">Seules les copies strictement identiques sont consolidées. Les chemins, références Email OS et téléchargements restent fonctionnels grâce aux liens physiques NTFS vérifiés.</p></div><button onClick={onScan} disabled={busy==="dedup:scan"} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white">{busy==="dedup:scan"?<Loader2 className="h-4 w-4 animate-spin"/>:<ScanSearch className="h-4 w-4"/>}Scanner les doublons</button></div>{scan?<div className="mt-5 grid gap-3 sm:grid-cols-4"><Metric label="Groupes" value={number(scan.groupCount)} tone="blue"/><Metric label="Copies physiques" value={number(scan.physicalCopyCount)} tone="slate"/><Metric label="Récupérable" value={bytes(scan.potentialRecoverableBytes)} tone="violet"/><Metric label="Groupes bloqués" value={number(scan.blockedGroupCount)} tone={scan.blockedGroupCount?"rose":"emerald"}/></div>:null}</section>{scan?<section className="rounded-[28px] border border-slate-200 bg-white p-5"><h5 className="text-lg font-black text-slate-950">Groupes exacts détectés</h5><div className="mt-4 space-y-3">{scan.groups.slice(0,100).map((group)=><article key={group.sha256} className="rounded-[20px] border border-slate-200 p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap gap-2"><Pill tone={group.eligible?"emerald":"rose"} label={group.eligible?"Éligible":"Bloqué"}/><Pill tone="blue" label={`${group.physicalCopies} copies`}/><Pill tone="violet" label={bytes(group.potentialRecoverableBytes)}/></div><p className="mt-2 font-mono text-[11px] font-bold text-slate-500">{group.sha256}</p><p className="mt-2 text-xs font-semibold text-slate-600">{group.copies.map((copy)=>copy.filename).slice(0,3).join(" · ")}</p></div><button onClick={()=>onSelectGroup(group)} disabled={!group.eligible} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 disabled:opacity-40">Créer un plan<ArrowRight className="h-4 w-4"/></button></div>{group.blockedReasons.length?<p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">{group.blockedReasons.join(" · ")}</p>:null}</article>)}</div></section>:null}<section className="rounded-[28px] border border-slate-200 bg-white p-5"><h5 className="text-lg font-black text-slate-950">Plans gouvernés</h5><div className="mt-4 space-y-3">{plans.map((plan)=><button key={plan.id} onClick={()=>onSelectPlan(plan)} className="flex w-full items-center gap-3 rounded-[20px] border border-slate-200 p-4 text-left hover:bg-slate-50"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-50 text-violet-700"><Layers3 className="h-5 w-5"/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2"><Pill tone={runTone(plan.status)} label={plan.status}/><Pill tone="slate" label={plan.planNumber}/></div><p className="mt-2 truncate text-sm font-black text-slate-950">{plan.physicalCopies} copies · {bytes(plan.potentialRecoverableBytes)} potentiels</p></div><ChevronRight className="h-4 w-4 text-slate-300"/></button>)}{!plans.length?<Empty text="Aucun plan de consolidation enregistré."/>:null}</div></section></div>}

function ProviderPanel({mailboxes,selectedMailbox,onMailbox,capabilities,reconciliations,providerRuns,busy,onAction}:{mailboxes:MailboxOption[];selectedMailbox:string;onMailbox:(v:string)=>void;capabilities:WindowsStorageProviderCapabilities|null;reconciliations:WindowsStorageProviderReconciliation[];providerRuns:any[];busy:string|null;onAction:(a:"capabilities"|"sync"|"reconcile")=>void}){const selected=mailboxes.find((m)=>m.mailboxId===selectedMailbox);return <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><aside className="space-y-4"><section className="rounded-[28px] border border-slate-200 bg-white p-5"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700">Menara Provider Control</p><h4 className="mt-2 text-2xl font-black text-slate-950">Synchroniser une boîte</h4><label className="mt-5 grid gap-2"><span className="text-xs font-black text-slate-700">Identité Email OS</span><select value={selectedMailbox} onChange={(e)=>onMailbox(e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold">{mailboxes.map((mailbox)=><option key={mailbox.mailboxId} value={mailbox.mailboxId}>{mailbox.name} · {mailbox.email}</option>)}</select></label><div className="mt-4 grid gap-2"><ProviderAction icon={Network} label="Vérifier les capacités POP3" busy={busy==="provider:capabilities"} onClick={()=>onAction("capabilities")}/><ProviderAction icon={MailCheck} label="Synchroniser maintenant" busy={busy==="provider:sync"} onClick={()=>onAction("sync")}/><ProviderAction icon={RotateCw} label="Réconcilier fournisseur / Email OS" busy={busy==="provider:reconcile"} onClick={()=>onAction("reconcile")}/></div></section>{capabilities?<section className="rounded-[28px] border border-cyan-200 bg-cyan-50 p-5"><p className="text-xs font-black text-cyan-900">Capacités de {capabilities.email}</p><div className="mt-4 grid grid-cols-2 gap-2"><Mini label="Authentification" value={capabilities.authenticated?"Réussie":"Échec"}/><Mini label="Messages" value={number(capabilities.messageCount)}/><Mini label="Volume distant" value={bytes(capabilities.totalBytes)}/><Mini label="UIDL" value={capabilities.uidlSupported?"Disponible":"Non confirmé"}/></div><p className="mt-4 text-xs font-semibold leading-5 text-cyan-800">{capabilities.warning}</p></section>:null}</aside><section className="space-y-4"><div className="rounded-[28px] border border-slate-200 bg-white p-5"><div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Réconciliation</p><h4 className="mt-2 text-2xl font-black text-slate-950">Écarts fournisseur / local</h4></div><Pill tone="slate" label={selected?.provider||"POP3"}/></div><div className="mt-4 space-y-3">{reconciliations.filter((row)=>!selectedMailbox||row.mailboxId===selectedMailbox).slice(0,20).map((row)=><article key={row.id} className="rounded-[20px] border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-slate-950">{row.email}</p><p className="mt-1 text-xs font-semibold text-slate-500">Réconcilié {relative(row.reconciledAt)}</p></div><Pill tone={row.status==="matched"?"emerald":row.status==="drift"?"amber":"rose"} label={row.status}/></div><div className="mt-3 grid grid-cols-3 gap-2"><Mini label="Fournisseur" value={number(row.providerMessageCount)}/><Mini label="Email OS" value={number(row.localMessageCount)}/><Mini label="Écart" value={number(row.providerOnlyCount+row.localOnlyCount)}/></div><p className="mt-3 text-xs font-semibold text-slate-600">{row.detail}</p></article>)}{!reconciliations.length?<Empty text="Aucune réconciliation exécutée."/>:null}</div></div><div className="rounded-[28px] border border-slate-200 bg-white p-5"><h5 className="text-lg font-black text-slate-950">Dernières synchronisations</h5><div className="mt-4 space-y-2">{providerRuns.slice(0,10).map((run:any)=><div key={run.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3"><div><p className="text-xs font-black text-slate-900">{run.runNumber}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{run.fetchedCount} récupérés · {run.failedCount} échec(s)</p></div><Pill tone={runTone(run.status)} label={run.status}/></div>)}</div></div></section></div>}

function RunsPanel({runs,query,onQuery,busy,onSelect,onAction}:{runs:WindowsStorageLifecycleRun[];query:string;onQuery:(v:string)=>void;busy:string|null;onSelect:(r:WindowsStorageLifecycleRun)=>void;onAction:(r:WindowsStorageLifecycleRun,a:"pause"|"resume"|"cancel"|"execute")=>void}){return <section className="rounded-[28px] border border-slate-200 bg-white p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Lifecycle Runs</p><h4 className="mt-2 text-2xl font-black text-slate-950">Historique d’exécution</h4></div><label className="relative block w-full lg:max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={query} onChange={(e)=>onQuery(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm font-semibold" placeholder="Rechercher un cycle…"/></label></div><div className="mt-5 space-y-3">{runs.map((run)=><article key={run.id} className="rounded-[20px] border border-slate-200 p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><button onClick={()=>onSelect(run)} className="min-w-0 flex-1 text-left"><div className="flex flex-wrap gap-2"><Pill tone={runTone(run.status)} label={run.status}/><Pill tone="slate" label={run.runNumber}/><Pill tone="blue" label={run.trigger}/></div><p className="mt-2 text-sm font-black text-slate-950">{run.actions.map((a)=>ACTION_LABELS[a]).join(" · ")}</p><p className="mt-1 text-xs font-semibold text-slate-500">{dateTime(run.createdAt)} · {bytes(run.recommendedRecoveryBytes)} recommandés · {run.errorCount} erreur(s)</p></button><div className="flex flex-wrap gap-2">{run.status==="running"?<SmallAction icon={Pause} label="Pause" busy={busy===`run:pause:${run.id}`} onClick={()=>onAction(run,"pause")}/>:null}{run.status==="paused"?<SmallAction icon={Play} label="Reprendre" busy={busy===`run:resume:${run.id}`} onClick={()=>onAction(run,"resume")}/>:null}{["queued","paused","failed"].includes(run.status)?<SmallAction icon={CirclePlay} label="Exécuter" busy={busy===`run:execute:${run.id}`} onClick={()=>onAction(run,"execute")}/>:null}{["queued","running","paused"].includes(run.status)?<SmallAction icon={X} label="Annuler" busy={busy===`run:cancel:${run.id}`} onClick={()=>onAction(run,"cancel")}/>:null}</div></div></article>)}{!runs.length?<Empty text="Aucun cycle Phase 5 enregistré."/>:null}</div></section>}

function AlertsPanel({rows,busy,onAction}:{rows:WindowsStorageLifecycleAlert[];busy:string|null;onAction:(a:WindowsStorageLifecycleAlert,action:"acknowledge"|"resolve")=>void}){return <section className="rounded-[28px] border border-slate-200 bg-white p-5"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-600">Operational Intelligence</p><h4 className="mt-2 text-2xl font-black text-slate-950">Alertes et anomalies</h4></div><div className="mt-5 space-y-3">{rows.map((alert)=><article key={alert.id} className="rounded-[20px] border p-4" style={{borderColor:TONES[alertTone(alert.severity)].border,background:TONES[alertTone(alert.severity)].bg}}><div className="flex flex-col gap-3 lg:flex-row lg:items-start"><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2"><Pill tone={alertTone(alert.severity)} label={alert.severity}/><Pill tone="slate" label={alert.status}/></div><p className="mt-2 text-sm font-black text-slate-950">{alert.title}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{alert.message}</p><p className="mt-2 text-[10px] font-bold text-slate-400">{alert.source} · {dateTime(alert.createdAt)}</p></div><div className="flex gap-2">{alert.status==="open"?<SmallAction icon={CheckCircle2} label="Prendre en compte" busy={busy===`alert:${alert.id}`} onClick={()=>onAction(alert,"acknowledge")}/>:null}{alert.status!=="resolved"?<SmallAction icon={ShieldCheck} label="Résoudre" busy={busy===`alert:${alert.id}`} onClick={()=>onAction(alert,"resolve")}/>:null}</div></div></article>)}{!rows.length?<Empty text="Aucune alerte Phase 5."/>:null}</div></section>}

function GroupDossier({group}:{group:WindowsStorageDedupGroup}){return <div className="space-y-4"><div className="grid grid-cols-2 gap-3"><Mini label="Copies physiques" value={number(group.physicalCopies)}/><Mini label="Récupération estimée" value={bytes(group.potentialRecoverableBytes)}/><Mini label="Taille unitaire" value={bytes(group.sizeBytes)}/><Mini label="Références" value={number(group.referenceCount)}/></div><div><p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">Copies</p><div className="mt-3 space-y-2">{group.copies.map((copy,index)=><div key={`${copy.fileId}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-black text-slate-900">{copy.filename}</p><p className="mt-1 break-all text-[10px] font-semibold text-slate-500">{copy.relativePath}</p></div>{copy.canonical?<Pill tone="blue" label="Canonique"/>:null}</div></div>)}</div></div></div>}

function MaterializationPanel({plan,reason,onReason,busyFileId,onMaterialize}:{plan:WindowsStorageDedupPlan;reason:string;onReason:(v:string)=>void;busyFileId:string|null;onMaterialize:(fileId:string)=>void}){
  const copies=plan.copies.filter((copy)=>!copy.canonical&&copy.fileId&&copy.status!=="materialized")
  if(!copies.length)return <div className="mt-5 rounded-[20px] border border-emerald-200 bg-emerald-50 p-4 text-xs font-black text-emerald-800">Toutes les références disposent déjà d’une allocation indépendante ou aucune matérialisation n’est requise.</div>
  return <section className="mt-5 rounded-[22px] border border-blue-200 bg-blue-50/70 p-4"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-blue-700 shadow-sm"><FileStack className="h-4 w-4"/></div><div><p className="text-sm font-black text-blue-950">Réversibilité de la déduplication</p><p className="mt-1 text-xs font-semibold leading-5 text-blue-800">Recréez une allocation physique indépendante sans changer le fichier, son identifiant ou ses relations Email OS. Le SHA-256 est vérifié après l’opération.</p></div></div><label className="mt-4 grid gap-2"><span className="text-xs font-black text-blue-900">Motif obligatoire</span><textarea value={reason} onChange={(event)=>onReason(event.target.value)} className="min-h-20 rounded-xl border border-blue-200 bg-white p-3 text-sm font-semibold" placeholder="Besoin d’une copie physique indépendante…"/></label><div className="mt-3 space-y-2">{copies.map((copy)=><div key={copy.fileId} className="flex items-center gap-3 rounded-xl border border-blue-100 bg-white p-3"><div className="min-w-0 flex-1"><p className="truncate text-xs font-black text-slate-900">{copy.filename}</p><p className="mt-1 truncate text-[10px] font-semibold text-slate-500">{copy.mailboxId||copy.sourceId} · {bytes(copy.sizeBytes)}</p></div><button onClick={()=>copy.fileId&&onMaterialize(copy.fileId)} disabled={reason.trim().length<8||busyFileId===copy.fileId} className="inline-flex h-9 items-center gap-2 rounded-xl bg-blue-700 px-3 text-[10px] font-black text-white disabled:opacity-45">{busyFileId===copy.fileId?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<RotateCw className="h-3.5 w-3.5"/>}Rendre indépendante</button></div>)}</div></section>
}
function PlanDossier({plan}:{plan:WindowsStorageDedupPlan}){return <div className="space-y-4"><div className="grid grid-cols-2 gap-3"><Mini label="État" value={plan.status}/><Mini label="Risque" value={plan.riskLevel}/><Mini label="Potentiel" value={bytes(plan.potentialRecoverableBytes)}/><Mini label="Récupéré réel" value={bytes(plan.actualRecoveredBytes)}/></div><div className="rounded-[20px] border border-slate-200 bg-white p-4"><p className="text-xs font-black text-slate-950">Motif</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{plan.reason}</p></div><GroupDossier group={{sha256:plan.sha256,sizeBytes:plan.sizeBytes,physicalCopies:plan.physicalCopies,referenceCount:plan.referenceCount,potentialRecoverableBytes:plan.potentialRecoverableBytes,eligible:plan.riskLevel!=="blocked",blockedReasons:[],copies:plan.copies}}/></div>}
function RunDossier({run}:{run:WindowsStorageLifecycleRun}){return <div className="space-y-4"><div className="grid grid-cols-2 gap-3"><Mini label="Scannés" value={number(run.scannedCount)}/><Mini label="Candidats" value={number(run.candidateCount)}/><Mini label="Récupération recommandée" value={bytes(run.recommendedRecoveryBytes)}/><Mini label="Erreurs" value={number(run.errorCount)}/></div><div><p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">Étapes</p><div className="mt-3 space-y-2">{run.items?.map((item)=><div key={item.id} className="rounded-[18px] border border-slate-200 bg-white p-3"><div className="flex items-center justify-between gap-3"><p className="text-xs font-black text-slate-900">{ACTION_LABELS[item.action]}</p><Pill tone={runTone(item.status)} label={item.status}/></div>{item.recommendedAction?<p className="mt-2 text-[11px] font-semibold text-slate-600">{item.recommendedAction}</p>:null}</div>)}</div></div></div>}

function Drawer({title,subtitle,onClose,children}:{title:string;subtitle:string;onClose:()=>void;children:React.ReactNode}){return <div className="fixed inset-0 z-[1400] flex justify-end bg-slate-950/55 backdrop-blur-sm"><button className="absolute inset-0" onClick={onClose} aria-label="Fermer"/><aside className="relative h-full w-full max-w-[620px] overflow-y-auto bg-slate-50 shadow-[-30px_0_100px_rgba(15,23,42,.3)]"><header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white/95 p-5 backdrop-blur"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-600">OPSOS · Phase 5</p><h3 className="mt-2 text-2xl font-black text-slate-950">{title}</h3><p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p></div><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white"><X className="h-4 w-4"/></button></header><div className="p-5">{children}</div></aside></div>}
function Metric({label,value,tone}:{label:string;value:string;tone:Tone}){const p=TONES[tone];return <div className="rounded-[20px] border p-4" style={{borderColor:p.border,background:p.bg}}><p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">{label}</p><p className="mt-2 break-words text-lg font-black" style={{color:p.text}}>{value}</p></div>}
function DarkMetric({label,value}:{label:string;value:string}){return <div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p><p className="mt-1 text-xs font-black text-white">{value}</p></div>}
function Mini({label,value}:{label:string;value:string}){return <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p><p className="mt-1.5 break-words text-xs font-black text-slate-800">{value}</p></div>}
function Pill({label,tone}:{label:string;tone:Tone}){const p=TONES[tone];return <span className="inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em]" style={{borderColor:p.border,background:p.bg,color:p.text}}>{label}</span>}
function Notice({tone,text,onClose}:{tone:Tone;text:string;onClose:()=>void}){const p=TONES[tone];return <div className="flex items-center gap-3 rounded-[20px] border p-4" style={{borderColor:p.border,background:p.bg,color:p.text}}><AlertTriangle className="h-5 w-5"/><p className="flex-1 text-sm font-black">{text}</p><button onClick={onClose}><X className="h-4 w-4"/></button></div>}
function Empty({text}:{text:string}){return <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><Boxes className="mx-auto h-6 w-6 text-slate-300"/><p className="mt-3 text-sm font-black text-slate-600">{text}</p></div>}
function Guard({icon:Icon,title,text}:{icon:typeof ShieldCheck;title:string;text:string}){return <div className="flex items-start gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700"><Icon className="h-4 w-4"/></div><div><p className="text-xs font-black text-slate-950">{title}</p><p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">{text}</p></div></div>}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="grid gap-2"><span className="text-xs font-black text-slate-700">{label}</span>{children}</label>}
function Toggle({label,checked,onChange}:{label:string;checked:boolean;onChange:(v:boolean)=>void}){return <button onClick={()=>onChange(!checked)} className="flex w-full items-center justify-between rounded-[20px] border border-slate-200 bg-white p-4 text-left"><span className="text-sm font-black text-slate-900">{label}</span><span className={`relative h-6 w-11 rounded-full transition ${checked?"bg-emerald-500":"bg-slate-300"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${checked?"left-6":"left-1"}`}/></span></button>}
function ProviderAction({icon:Icon,label,busy,onClick}:{icon:typeof Network;label:string;busy:boolean;onClick:()=>void}){return <button onClick={onClick} disabled={busy} className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 text-left text-xs font-black text-slate-700 disabled:opacity-50">{busy?<Loader2 className="h-4 w-4 animate-spin text-blue-600"/>:<Icon className="h-4 w-4 text-blue-600"/>}<span className="flex-1">{label}</span><ChevronRight className="h-4 w-4 text-slate-300"/></button>}
function SmallAction({icon:Icon,label,busy,onClick}:{icon:typeof Pause;label:string;busy:boolean;onClick:()=>void}){return <button onClick={onClick} disabled={busy} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black text-slate-700 disabled:opacity-50">{busy?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<Icon className="h-3.5 w-3.5"/>}{label}</button>}
