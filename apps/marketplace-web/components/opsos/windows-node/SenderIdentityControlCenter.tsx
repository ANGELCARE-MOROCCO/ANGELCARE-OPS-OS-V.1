"use client"

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react"
import {
  Activity,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Copy,
  Download,
  Eye,
  FileClock,
  History,
  Loader2,
  Mail,
  MailCheck,
  Pencil,
  PlayCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Ban,
  X,
} from "lucide-react"

type IdentityStatus = "draft" | "testing" | "active" | "suspended" | "retired"
type IdentityMode = "corporate" | "department" | "named_operator" | "executive"

type Mailbox = {
  id: string
  name?: string | null
  address?: string | null
  status?: string | null
  provider?: string | null
}

type Identity = {
  id: string
  mailbox_id: string
  internal_name: string
  external_display_name: string
  from_address: string
  reply_to_name: string | null
  reply_to_address: string | null
  identity_mode: IdentityMode
  brand_prefix: string | null
  default_language: string
  category: string | null
  status: IdentityStatus
  version: number
  is_default: boolean
  last_tested_at: string | null
  last_test_status: "success" | "failed" | null
  last_test_message_id: string | null
  last_test_recipient: string | null
  activated_at: string | null
  activated_by: string | null
  updated_at: string
  updated_by: string | null
}

type RegistryRow = {
  mailbox: Mailbox
  identity: Identity | null
  proposedDisplayName: string
  proposedReplyToName: string
  health: "verified" | "active_untested" | "suspended" | "attention" | "unconfigured"
}

type RegistryPayload = {
  rows: RegistryRow[]
  audit: AuditRow[]
  summary: {
    mailboxes: number
    configured: number
    active: number
    verified: number
    attention: number
    lastTestedAt: string | null
  }
}

type VersionRow = Identity & {
  sender_identity_id: string
  snapshot_reason?: string | null
  created_at: string
  created_by?: string | null
}

type AuditRow = {
  id: string
  sender_identity_id?: string | null
  mailbox_id?: string | null
  actor_name?: string | null
  action: string
  result: string
  reason?: string | null
  created_at: string
  metadata_json?: Record<string, unknown> | null
}

type Dossier = { identity: Identity; versions: VersionRow[]; audit: AuditRow[] }

type FormState = {
  id: string
  mailboxId: string
  internalName: string
  externalDisplayName: string
  replyToName: string
  replyToAddress: string
  identityMode: IdentityMode
  category: string
  defaultLanguage: string
  brandPrefix: string
  reason: string
}

const EMPTY_FORM: FormState = {
  id: "",
  mailboxId: "",
  internalName: "",
  externalDisplayName: "",
  replyToName: "",
  replyToAddress: "",
  identityMode: "corporate",
  category: "",
  defaultLanguage: "fr",
  brandPrefix: "ANGELCARE",
  reason: "",
}

function clean(value: unknown) {
  return String(value ?? "").trim()
}

function shortDate(value?: string | null) {
  if (!value) return "Jamais"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "Indisponible"
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(parsed)
}

async function api<T>(path: string, options?: RequestInit) {
  const response = await fetch(path, {
    ...options,
    cache: "no-store",
    headers: { "content-type": "application/json", ...(options?.headers || {}) },
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok || json?.ok === false) throw new Error(clean(json?.error) || `HTTP ${response.status}`)
  return (json?.data ?? json) as T
}

function healthMeta(row: RegistryRow) {
  if (row.health === "verified") return { label: "Active · Vérifiée", className: "border-emerald-200 bg-emerald-50 text-emerald-700" }
  if (row.health === "active_untested") return { label: "Active · Test requis", className: "border-amber-200 bg-amber-50 text-amber-700" }
  if (row.health === "suspended") return { label: "Suspendue", className: "border-rose-200 bg-rose-50 text-rose-700" }
  if (row.health === "unconfigured") return { label: "Non configurée", className: "border-slate-200 bg-slate-50 text-slate-600" }
  return { label: "À vérifier", className: "border-amber-200 bg-amber-50 text-amber-700" }
}

function actionLabel(value: string) {
  const labels: Record<string, string> = {
    sender_identity_draft_created: "Brouillon créé",
    sender_identity_draft_updated: "Brouillon modifié",
    sender_identity_proof_test: "Test d’identité envoyé",
    sender_identity_activated: "Identité activée",
    sender_identity_suspended: "Identité suspendue",
    sender_identity_rolled_back: "Version restaurée",
    sender_identity_bulk_standardized: "Standard ANGELCARE appliqué",
    sender_identity_used_for_send: "Identité utilisée pour un envoi",
  }
  return labels[value] || value.replaceAll("_", " ")
}

export default function SenderIdentityControlCenter() {
  const [payload, setPayload] = useState<RegistryPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [editorOpen, setEditorOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [dossier, setDossier] = useState<Dossier | null>(null)
  const [proofRecipient, setProofRecipient] = useState("")
  const [proofResult, setProofResult] = useState<Record<string, unknown> | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkProposals, setBulkProposals] = useState<Array<Record<string, string>>>([])
  const [bulkReason, setBulkReason] = useState("")
  const [pickerMode, setPickerMode] = useState<"create" | "clone" | null>(null)
  const [bulkTestOpen, setBulkTestOpen] = useState(false)
  const [bulkTestRecipient, setBulkTestRecipient] = useState("")
  const [bulkTestReason, setBulkTestReason] = useState("")
  const [bulkTestProgress, setBulkTestProgress] = useState({ done: 0, total: 0, current: "" })
  const [bulkTestResults, setBulkTestResults] = useState<Array<{ identityId: string; name: string; ok: boolean; error?: string }>>([])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setPayload(await api<RegistryPayload>("/api/opsos/windows-node/sender-identities"))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Chargement impossible")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const rows = useMemo(() => {
    const source = payload?.rows || []
    const needle = query.toLowerCase().trim()
    return source.filter((row) => {
      const text = `${row.mailbox.name || ""} ${row.mailbox.address || ""} ${row.identity?.external_display_name || ""}`.toLowerCase()
      if (needle && !text.includes(needle)) return false
      if (filter === "active") return row.identity?.status === "active"
      if (filter === "attention") return row.health !== "verified"
      if (filter === "unconfigured") return !row.identity
      if (filter === "suspended") return row.identity?.status === "suspended"
      return true
    })
  }, [payload, query, filter])

  function openEditor(row: RegistryRow) {
    const identity = row.identity
    setForm({
      id: identity?.id || "",
      mailboxId: row.mailbox.id,
      internalName: identity?.internal_name || clean(row.mailbox.name),
      externalDisplayName: identity?.external_display_name || row.proposedDisplayName,
      replyToName: identity?.reply_to_name || row.proposedReplyToName,
      replyToAddress: identity?.reply_to_address || clean(row.mailbox.address),
      identityMode: identity?.identity_mode || "corporate",
      category: identity?.category || clean(row.mailbox.name),
      defaultLanguage: identity?.default_language || "fr",
      brandPrefix: identity?.brand_prefix || "ANGELCARE",
      reason: "",
    })
    setDossier(null)
    setProofResult(null)
    setProofRecipient(identity?.last_test_recipient || "")
    setEditorOpen(true)
    if (identity?.id) void loadDossier(identity.id)
  }

  function selectMailboxForIdentity(row: RegistryRow) {
    if (pickerMode === "clone") {
      const sourceLabel = form.externalDisplayName || "identité source"
      setForm({
        id: row.identity?.id || "",
        mailboxId: row.mailbox.id,
        internalName: clean(row.mailbox.name),
        externalDisplayName: row.proposedDisplayName,
        replyToName: row.proposedReplyToName,
        replyToAddress: clean(row.mailbox.address),
        identityMode: form.identityMode,
        category: clean(row.mailbox.name),
        defaultLanguage: form.defaultLanguage,
        brandPrefix: form.brandPrefix || "ANGELCARE",
        reason: `Clonage du standard de ${sourceLabel} vers ${row.mailbox.address || row.mailbox.name}`,
      })
      setDossier(null)
      setProofResult(null)
      setProofRecipient("")
      if (row.identity?.id) void loadDossier(row.identity.id)
      setEditorOpen(true)
    } else {
      openEditor(row)
    }
    setPickerMode(null)
  }

  async function loadDossier(identityId: string) {
    try {
      setDossier(await api<Dossier>(`/api/opsos/windows-node/sender-identities/${encodeURIComponent(identityId)}`))
    } catch (dossierError) {
      setError(dossierError instanceof Error ? dossierError.message : "Dossier indisponible")
    }
  }

  async function saveDraft() {
    if (!form.reason.trim()) {
      setError("Un motif de modification est obligatoire.")
      return null
    }
    setBusy(true)
    setError(null)
    try {
      const path = form.id ? `/api/opsos/windows-node/sender-identities/${encodeURIComponent(form.id)}` : "/api/opsos/windows-node/sender-identities"
      const identity = await api<Identity>(path, {
        method: form.id ? "PATCH" : "POST",
        body: JSON.stringify(form),
      })
      setForm((current) => ({ ...current, id: identity.id, reason: "" }))
      setNotice("Brouillon d’identité enregistré. Un nouveau test est requis avant activation.")
      await Promise.all([load(), loadDossier(identity.id)])
      return identity
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Enregistrement impossible")
      return null
    } finally {
      setBusy(false)
    }
  }

  async function sendProof() {
    const savedIdentity = dossier?.identity || null
    const draftChanged = !savedIdentity
      || clean(savedIdentity.internal_name) !== clean(form.internalName)
      || clean(savedIdentity.external_display_name) !== clean(form.externalDisplayName)
      || clean(savedIdentity.reply_to_name) !== clean(form.replyToName)
      || clean(savedIdentity.reply_to_address) !== clean(form.replyToAddress)
      || clean(savedIdentity.identity_mode) !== clean(form.identityMode)
      || clean(savedIdentity.category) !== clean(form.category)
      || clean(savedIdentity.default_language) !== clean(form.defaultLanguage)
      || clean(savedIdentity.brand_prefix) !== clean(form.brandPrefix)

    const proofReason = form.reason.trim() || "Validation du rendu commercial dans la boîte de réception"
    let identityId = form.id

    if (draftChanged) {
      if (!form.reason.trim()) {
        setError("Enregistrez vos modifications avec un motif avant d’envoyer le test Gmail.")
        return
      }
      const identity = await saveDraft()
      identityId = identity?.id || ""
    }

    if (!identityId || !proofRecipient.trim()) {
      setError("Enregistrez l’identité et indiquez une adresse de test.")
      return
    }

    setBusy(true)
    setError(null)
    try {
      const result = await api<Record<string, unknown>>(`/api/opsos/windows-node/sender-identities/${encodeURIComponent(identityId)}/test`, {
        method: "POST",
        body: JSON.stringify({ recipient: proofRecipient, reason: proofReason }),
      })
      setProofResult(result)
      setNotice("Email de preuve accepté. Vérifiez le nom visible dans Gmail avant activation.")
      await Promise.all([load(), loadDossier(identityId)])
    } catch (proofError) {
      setError(proofError instanceof Error ? proofError.message : "Test impossible")
    } finally {
      setBusy(false)
    }
  }

  async function activate() {
    if (!form.id || !form.reason.trim()) {
      setError("Un test réussi et un motif d’activation sont obligatoires.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      await api(`/api/opsos/windows-node/sender-identities/${encodeURIComponent(form.id)}/activate`, { method: "POST", body: JSON.stringify({ reason: form.reason }) })
      setNotice("Identité activée. Elle sera utilisée automatiquement par les prochains envois.")
      setForm((current) => ({ ...current, reason: "" }))
      await Promise.all([load(), loadDossier(form.id)])
    } catch (activateError) {
      setError(activateError instanceof Error ? activateError.message : "Activation impossible")
    } finally {
      setBusy(false)
    }
  }

  async function suspendIdentity() {
    if (!form.id || !form.reason.trim()) {
      setError("Un motif de suspension est obligatoire.")
      return
    }
    setBusy(true)
    try {
      await api(`/api/opsos/windows-node/sender-identities/${encodeURIComponent(form.id)}/suspend`, { method: "POST", body: JSON.stringify({ reason: form.reason }) })
      setNotice("Identité suspendue. Le résolveur utilisera le standard ANGELCARE de secours.")
      await Promise.all([load(), loadDossier(form.id)])
    } catch (suspendError) {
      setError(suspendError instanceof Error ? suspendError.message : "Suspension impossible")
    } finally {
      setBusy(false)
    }
  }

  async function rollback(version: number) {
    if (!form.id) return
    const reason = window.prompt(`Motif de restauration de la version ${version}`)?.trim()
    if (!reason) return
    setBusy(true)
    try {
      await api(`/api/opsos/windows-node/sender-identities/${encodeURIComponent(form.id)}/rollback`, { method: "POST", body: JSON.stringify({ version, reason }) })
      setNotice(`Version ${version} restaurée et enregistrée comme nouvelle version gouvernée.`)
      await Promise.all([load(), loadDossier(form.id)])
    } catch (rollbackError) {
      setError(rollbackError instanceof Error ? rollbackError.message : "Restauration impossible")
    } finally {
      setBusy(false)
    }
  }

  async function previewBulk() {
    setBusy(true)
    try {
      const result = await api<{ proposals: Array<Record<string, string>> }>("/api/opsos/windows-node/sender-identities/bulk-standardize", { method: "POST", body: JSON.stringify({ apply: false }) })
      setBulkProposals(result.proposals || [])
      setBulkOpen(true)
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : "Prévisualisation impossible")
    } finally {
      setBusy(false)
    }
  }

  async function applyBulk() {
    if (!bulkReason.trim()) {
      setError("Un motif global est obligatoire.")
      return
    }
    setBusy(true)
    try {
      await api("/api/opsos/windows-node/sender-identities/bulk-standardize", { method: "POST", body: JSON.stringify({ apply: true, reason: bulkReason }) })
      setBulkOpen(false)
      setBulkReason("")
      setNotice("Standards ANGELCARE créés en brouillon. Testez et activez chaque identité avant production.")
      await load()
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : "Standardisation impossible")
    } finally {
      setBusy(false)
    }
  }

  async function runBulkProofTests() {
    const identities = (payload?.rows || []).map((row) => row.identity).filter((identity): identity is Identity => Boolean(identity))
    if (!identities.length) {
      setError("Aucune identité configurée à tester.")
      return
    }
    if (!bulkTestRecipient.trim() || !bulkTestReason.trim()) {
      setError("L’adresse de validation et le motif global sont obligatoires.")
      return
    }

    setBusy(true)
    setError(null)
    setBulkTestResults([])
    setBulkTestProgress({ done: 0, total: identities.length, current: "Préparation" })

    const results: Array<{ identityId: string; name: string; ok: boolean; error?: string }> = []
    for (let index = 0; index < identities.length; index += 1) {
      const identity = identities[index]
      setBulkTestProgress({ done: index, total: identities.length, current: identity.external_display_name })
      try {
        await api(`/api/opsos/windows-node/sender-identities/${encodeURIComponent(identity.id)}/test`, {
          method: "POST",
          body: JSON.stringify({ recipient: bulkTestRecipient, reason: bulkTestReason }),
        })
        results.push({ identityId: identity.id, name: identity.external_display_name, ok: true })
      } catch (testError) {
        results.push({ identityId: identity.id, name: identity.external_display_name, ok: false, error: testError instanceof Error ? testError.message : "Échec du test" })
      }
      setBulkTestResults([...results])
      setBulkTestProgress({ done: index + 1, total: identities.length, current: identity.external_display_name })
    }

    setBusy(false)
    const failures = results.filter((result) => !result.ok).length
    setNotice(failures ? `${results.length - failures} test(s) accepté(s), ${failures} en échec. Consultez le détail avant activation.` : `${results.length} tests d’identité ont été acceptés. Vérifiez leur rendu dans Gmail.`)
    await load()
  }

  function exportConfiguration() {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `angelcare-email-os-sender-identities-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (loading && !payload) {
    return <div className="grid min-h-[480px] place-items-center rounded-[28px] border border-slate-200 bg-white"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,.08)]">
        <div className="grid gap-5 bg-[linear-gradient(135deg,#ffffff_0%,#f3f8ff_55%,#eefbf7_100%)] p-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700"><BadgeCheck className="h-3.5 w-3.5" /> Gouvernance de l’identité externe</div>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-slate-950">Identités d’expéditeur Email OS</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-600">Contrôlez le nom commercial visible dans Gmail et les autres boîtes de réception, testez le rendu réel, activez une version approuvée et conservez une traçabilité complète.</p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <button onClick={() => setPickerMode("create")} className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white"><Plus className="h-4 w-4" /> Créer une identité</button>
              <button onClick={() => { setBulkTestOpen(true); setBulkTestResults([]); setBulkTestProgress({ done: 0, total: 0, current: "" }) }} className="inline-flex h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-black text-emerald-700"><MailCheck className="h-4 w-4" /> Tester toutes les identités</button>
              <button onClick={() => void previewBulk()} className="inline-flex h-11 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-xs font-black text-blue-700"><Sparkles className="h-4 w-4" /> Appliquer le standard ANGELCARE</button>
              <button onClick={() => void load()} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Actualiser</button>
              <button onClick={exportConfiguration} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700"><Download className="h-4 w-4" /> Exporter</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Boîtes Email OS" value={payload?.summary.mailboxes || 0} />
            <Metric label="Identités actives" value={payload?.summary.active || 0} tone="green" />
            <Metric label="Rendu vérifié" value={payload?.summary.verified || 0} tone="blue" />
            <Metric label="À vérifier" value={payload?.summary.attention || 0} tone={(payload?.summary.attention || 0) ? "amber" : "slate"} />
          </div>
        </div>
      </section>

      {error ? <Notice tone="error" text={error} onClose={() => setError(null)} /> : null}
      {notice ? <Notice tone="success" text={notice} onClose={() => setNotice(null)} /> : null}

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une boîte, une adresse ou un nom commercial…" className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none focus:border-blue-400 focus:bg-white" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[['all','Toutes'],['active','Actives'],['attention','À vérifier'],['unconfigured','Non configurées'],['suspended','Suspendues']].map(([key,label]) => <button key={key} onClick={() => setFilter(key)} className={`h-10 rounded-xl px-3 text-xs font-black ${filter === key ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{label}</button>)}
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[22px] border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-left">
              <thead className="bg-slate-50 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                <tr><th className="px-4 py-3">Boîte</th><th className="px-4 py-3">Nom visible</th><th className="px-4 py-3">Reply-To</th><th className="px-4 py-3">Version</th><th className="px-4 py-3">Test</th><th className="px-4 py-3">État</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const meta = healthMeta(row)
                  return <tr key={row.mailbox.id} className="border-t border-slate-100 text-sm hover:bg-slate-50/60">
                    <td className="px-4 py-4"><p className="font-black text-slate-950">{row.mailbox.name || "Boîte Email OS"}</p><p className="mt-1 text-xs font-semibold text-slate-500">{row.mailbox.address}</p></td>
                    <td className="px-4 py-4"><p className="font-black text-slate-950">{row.identity?.external_display_name || row.proposedDisplayName}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-blue-600">{row.identity ? row.identity.identity_mode : "Proposition automatique"}</p></td>
                    <td className="px-4 py-4"><p className="text-xs font-black text-slate-700">{row.identity?.reply_to_name || row.proposedReplyToName}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{row.identity?.reply_to_address || row.mailbox.address}</p></td>
                    <td className="px-4 py-4 text-xs font-black text-slate-700">v{row.identity?.version || 0}</td>
                    <td className="px-4 py-4"><p className={`text-xs font-black ${row.identity?.last_test_status === "success" ? "text-emerald-700" : row.identity?.last_test_status === "failed" ? "text-rose-700" : "text-slate-500"}`}>{row.identity?.last_test_status === "success" ? "Réussi" : row.identity?.last_test_status === "failed" ? "Échec" : "Non testé"}</p><p className="mt-1 text-[10px] font-semibold text-slate-400">{shortDate(row.identity?.last_tested_at)}</p></td>
                    <td className="px-4 py-4"><span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${meta.className}`}>{meta.label}</span></td>
                    <td className="px-4 py-4"><div className="flex justify-end gap-2"><button onClick={() => openEditor(row)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700"><Pencil className="h-3.5 w-3.5" /> Gérer</button></div></td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>
          {!rows.length ? <div className="p-10 text-center text-sm font-bold text-slate-500">Aucune identité ne correspond aux filtres.</div> : null}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">Historique global</p><h3 className="mt-2 text-xl font-black text-slate-950">Dernières opérations d’identité</h3></div><History className="h-5 w-5 text-violet-600" /></div>
        <div className="mt-4 grid gap-2 xl:grid-cols-2">
          {(payload?.audit || []).slice(0, 10).map((event) => <div key={event.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"><div className="flex items-start gap-3"><div className={`mt-1.5 h-2 w-2 rounded-full ${event.result === "success" || event.result === "ok" ? "bg-emerald-500" : "bg-amber-500"}`} /><div className="min-w-0"><p className="text-xs font-black text-slate-900">{actionLabel(event.action)}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{event.actor_name || "Système"} · {shortDate(event.created_at)}</p>{event.reason ? <p className="mt-1 text-[11px] font-semibold text-slate-600">{event.reason}</p> : null}</div></div></div>)}
        </div>
      </section>

      {editorOpen ? <IdentityEditor form={form} setForm={setForm} dossier={dossier} proofRecipient={proofRecipient} setProofRecipient={setProofRecipient} proofResult={proofResult} busy={busy} onClose={() => setEditorOpen(false)} onSave={() => void saveDraft()} onProof={() => void sendProof()} onActivate={() => void activate()} onSuspend={() => void suspendIdentity()} onRollback={(version) => void rollback(version)} onClone={() => setPickerMode("clone")} /> : null}
      {bulkOpen ? <BulkModal proposals={bulkProposals} reason={bulkReason} setReason={setBulkReason} busy={busy} onApply={() => void applyBulk()} onClose={() => setBulkOpen(false)} /> : null}
      {pickerMode ? <MailboxPickerModal mode={pickerMode} rows={payload?.rows || []} sourceMailboxId={form.mailboxId} onSelect={selectMailboxForIdentity} onClose={() => setPickerMode(null)} /> : null}
      {bulkTestOpen ? <BulkTestModal recipient={bulkTestRecipient} setRecipient={setBulkTestRecipient} reason={bulkTestReason} setReason={setBulkTestReason} progress={bulkTestProgress} results={bulkTestResults} busy={busy} onRun={() => void runBulkProofTests()} onClose={() => setBulkTestOpen(false)} /> : null}
    </div>
  )
}

function Metric({ label, value, tone = "slate" }: { label: string; value: number; tone?: "slate" | "green" | "blue" | "amber" }) {
  const styles = tone === "green" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : tone === "blue" ? "border-blue-200 bg-blue-50 text-blue-700" : tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-700"
  return <div className={`rounded-2xl border p-4 ${styles}`}><p className="text-[9px] font-black uppercase tracking-[0.16em] opacity-70">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>
}

function Notice({ tone, text, onClose }: { tone: "success" | "error"; text: string; onClose: () => void }) {
  return <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>{tone === "success" ? <CheckCircle2 className="h-5 w-5" /> : <CircleAlert className="h-5 w-5" />}<p className="flex-1 text-sm font-bold">{text}</p><button onClick={onClose}><X className="h-4 w-4" /></button></div>
}

function IdentityEditor({
  form,
  setForm,
  dossier,
  proofRecipient,
  setProofRecipient,
  proofResult,
  busy,
  onClose,
  onSave,
  onProof,
  onActivate,
  onSuspend,
  onRollback,
  onClone,
}: {
  form: FormState
  setForm: Dispatch<SetStateAction<FormState>>
  dossier: Dossier | null
  proofRecipient: string
  setProofRecipient: (value: string) => void
  proofResult: Record<string, unknown> | null
  busy: boolean
  onClose: () => void
  onSave: () => void
  onProof: () => void
  onActivate: () => void
  onSuspend: () => void
  onRollback: (version: number) => void
  onClone: () => void
}) {
  const mailboxAddress = dossier?.identity.from_address || form.replyToAddress
  const [compareVersion, setCompareVersion] = useState<VersionRow | null>(null)

  return (
    <div className="fixed inset-0 z-[1600] flex justify-end bg-slate-950/55 backdrop-blur-sm" role="dialog" aria-modal="true">
      <button className="absolute inset-0" onClick={onClose} aria-label="Fermer" />
      <aside className="relative h-full w-full max-w-[780px] overflow-y-auto bg-slate-50 shadow-[-30px_0_100px_rgba(15,23,42,.3)]">
        <header className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Email OS · Identité d’expéditeur</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">{form.id ? "Gérer l’identité commerciale" : "Créer une identité commerciale"}</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">{mailboxAddress || "Adresse liée à la boîte sélectionnée"}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onClone} className="inline-flex h-10 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-[10px] font-black text-blue-700"><Copy className="h-3.5 w-3.5" /> Dupliquer vers…</button>
            <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white"><X className="h-4 w-4" /></button>
          </div>
        </header>

        <div className="space-y-5 p-6">
          <section className="rounded-[24px] border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div><h3 className="text-sm font-black text-slate-950">Définition de l’identité</h3><p className="mt-1 text-xs font-semibold text-slate-500">L’adresse SMTP reste verrouillée sur la boîte autorisée. Seuls le nom externe et le comportement de réponse sont gouvernés ici.</p></div>
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Nom interne" value={form.internalName} onChange={(value) => setForm((current) => ({ ...current, internalName: value }))} />
              <Field label="Nom commercial externe" value={form.externalDisplayName} onChange={(value) => setForm((current) => ({ ...current, externalDisplayName: value }))} />
              <Field label="Nom de réponse" value={form.replyToName} onChange={(value) => setForm((current) => ({ ...current, replyToName: value }))} />
              <Field label="Adresse de réponse" value={form.replyToAddress} onChange={(value) => setForm((current) => ({ ...current, replyToAddress: value }))} />
              <label className="grid gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Mode d’identité</span>
                <select value={form.identityMode} onChange={(event) => setForm((current) => ({ ...current, identityMode: event.target.value as IdentityMode }))} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold">
                  <option value="corporate">Corporate · ANGELCARE Support Client</option>
                  <option value="department">Département · Support Client · ANGELCARE</option>
                  <option value="named_operator">Opérateur nommé · Prénom Nom · ANGELCARE</option>
                  <option value="executive">Exécutif · Prénom Nom · ANGELCARE</option>
                </select>
              </label>
              <Field label="Préfixe de marque" value={form.brandPrefix} onChange={(value) => setForm((current) => ({ ...current, brandPrefix: value }))} />
              <Field label="Catégorie" value={form.category} onChange={(value) => setForm((current) => ({ ...current, category: value }))} />
              <label className="grid gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Langue par défaut</span>
                <select value={form.defaultLanguage} onChange={(event) => setForm((current) => ({ ...current, defaultLanguage: event.target.value }))} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold">
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </label>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2"><Eye className="h-4 w-4 text-blue-600" /><h3 className="text-sm font-black text-slate-950">Aperçu boîte de réception</h3></div>
              <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-slate-950 text-sm font-black text-white">A</div>
                  <div><p className="text-sm font-black text-slate-950">{form.externalDisplayName || "ANGELCARE"}</p><p className="mt-0.5 text-[11px] font-semibold text-slate-500">Suivi de votre demande AngelCare</p><p className="mt-2 text-xs font-semibold text-slate-600">Bonjour, votre demande a bien été prise en charge…</p></div>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-[11px] font-bold text-blue-800">From: “{form.externalDisplayName || "ANGELCARE"}” &lt;{mailboxAddress || "mailbox@angelcarehub.ma"}&gt;</div>
              <div className="mt-2 rounded-xl border border-violet-100 bg-violet-50 p-3 text-[11px] font-bold text-violet-800">Reply-To: “{form.replyToName || form.externalDisplayName || "ANGELCARE"}” &lt;{form.replyToAddress || mailboxAddress || "mailbox@angelcarehub.ma"}&gt;</div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">État gouverné</p>
              <p className="mt-2 text-lg font-black text-slate-950">{dossier?.identity.status || "Nouveau brouillon"}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">Version {dossier?.identity.version || 0}</p>
              <p className={`mt-4 rounded-xl px-3 py-2 text-xs font-black ${dossier?.identity.last_test_status === "success" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{dossier?.identity.last_test_status === "success" ? "Preuve SMTP réussie" : "Test requis avant activation"}</p>
              <p className="mt-3 text-[11px] font-semibold leading-5 text-slate-500">Les changements activés sont résolus automatiquement au moment de l’envoi, sans redéploiement.</p>
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2"><MailCheck className="h-4 w-4 text-emerald-600" /><h3 className="text-sm font-black text-slate-950">Test réel dans Gmail</h3></div>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">Le test passe par le même résolveur, le Windows Bridge et Menara SMTP que la production. Toute modification non enregistrée est sauvegardée avant le test.</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input value={proofRecipient} onChange={(event) => setProofRecipient(event.target.value)} placeholder="Adresse Gmail de validation" className="h-11 flex-1 rounded-xl border border-slate-200 px-3 text-sm font-semibold" />
              <button onClick={onProof} disabled={busy} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-black text-white disabled:opacity-50"><Send className="h-4 w-4" /> Envoyer le test</button>
            </div>
            {proofResult ? <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">Message de preuve accepté. Vérifiez maintenant le nom affiché chez le destinataire.</div> : null}
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5">
            <label className="grid gap-2"><span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Motif obligatoire</span><textarea value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} rows={3} placeholder="Ex. Correction du nom commercial affiché dans Gmail" className="rounded-xl border border-slate-200 p-3 text-sm font-semibold outline-none focus:border-blue-400" /></label>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={onSave} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-black text-white disabled:opacity-50"><ClipboardCheck className="h-4 w-4" /> Enregistrer le brouillon</button>
              <button onClick={onActivate} disabled={busy || !form.id} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-black text-white disabled:opacity-40"><PlayCircle className="h-4 w-4" /> Activer</button>
              <button onClick={onSuspend} disabled={busy || !form.id} className="inline-flex h-11 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-xs font-black text-rose-700 disabled:opacity-40"><Ban className="h-4 w-4" /> Suspendre</button>
            </div>
          </section>

          {compareVersion && dossier ? (
            <section className="rounded-[24px] border border-violet-200 bg-violet-50/60 p-5">
              <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-600">Comparaison des versions</p><h3 className="mt-2 text-sm font-black text-slate-950">Version actuelle v{dossier.identity.version} vs v{compareVersion.version}</h3></div><button onClick={() => setCompareVersion(null)} className="grid h-9 w-9 place-items-center rounded-xl bg-white text-slate-500"><X className="h-4 w-4" /></button></div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <VersionCompareCard title={`Actuelle · v${dossier.identity.version}`} name={dossier.identity.external_display_name} replyName={dossier.identity.reply_to_name} replyAddress={dossier.identity.reply_to_address} mode={dossier.identity.identity_mode} />
                <VersionCompareCard title={`Historique · v${compareVersion.version}`} name={compareVersion.external_display_name} replyName={compareVersion.reply_to_name} replyAddress={compareVersion.reply_to_address} mode={compareVersion.identity_mode} />
              </div>
            </section>
          ) : null}

          {dossier?.versions?.length ? (
            <section className="rounded-[24px] border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2"><FileClock className="h-4 w-4 text-violet-600" /><h3 className="text-sm font-black text-slate-950">Versions, comparaison et restauration</h3></div>
              <div className="mt-4 space-y-2">
                {dossier.versions.slice(0, 20).map((version) => (
                  <div key={version.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-xs font-black text-slate-700">v{version.version}</div>
                    <div className="min-w-0 flex-1"><p className="truncate text-xs font-black text-slate-950">{version.external_display_name}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{version.status} · {shortDate(version.created_at)} · {version.created_by || "Système"}</p></div>
                    <button onClick={() => setCompareVersion(version)} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black text-slate-600"><Eye className="h-3.5 w-3.5" /> Comparer</button>
                    {version.version !== dossier.identity.version ? <button onClick={() => onRollback(version.version)} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 text-[10px] font-black text-violet-700"><RotateCcw className="h-3.5 w-3.5" /> Restaurer</button> : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </aside>
    </div>
  )
}

function VersionCompareCard({ title, name, replyName, replyAddress, mode }: { title: string; name: string; replyName?: string | null; replyAddress?: string | null; mode: IdentityMode }) {
  return <div className="rounded-2xl border border-white bg-white p-4 shadow-sm"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-violet-600">{title}</p><p className="mt-3 text-sm font-black text-slate-950">{name}</p><p className="mt-2 text-[11px] font-semibold text-slate-500">Reply-To: {replyName || "—"} &lt;{replyAddress || "—"}&gt;</p><p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Mode : {mode}</p></div>
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2"><span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-400" /></label>
}

function MailboxPickerModal({ mode, rows, sourceMailboxId, onSelect, onClose }: { mode: "create" | "clone"; rows: RegistryRow[]; sourceMailboxId: string; onSelect: (row: RegistryRow) => void; onClose: () => void }) {
  const [search, setSearch] = useState("")
  const filtered = rows.filter((row) => {
    if (mode === "clone" && row.mailbox.id === sourceMailboxId) return false
    const haystack = `${row.mailbox.name || ""} ${row.mailbox.address || ""} ${row.identity?.external_display_name || ""}`.toLowerCase()
    return !search.trim() || haystack.includes(search.trim().toLowerCase())
  })

  return (
    <div className="fixed inset-0 z-[1800] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-[30px] bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Sélection de la boîte cible</p><h2 className="mt-2 text-2xl font-black text-slate-950">{mode === "clone" ? "Dupliquer le standard vers…" : "Créer une identité"}</h2><p className="mt-1 text-xs font-semibold text-slate-500">{mode === "clone" ? "Les paramètres de marque et de gouvernance seront repris. Le nom proposé reste adapté à la boîte cible." : "Choisissez la boîte Email OS à configurer."}</p></div>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200"><X className="h-4 w-4" /></button>
        </header>
        <div className="p-5">
          <div className="relative"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une boîte…" className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold" /></div>
          <div className="mt-4 max-h-[58vh] space-y-2 overflow-y-auto pr-1">
            {filtered.map((row) => {
              const meta = healthMeta(row)
              return <button key={row.mailbox.id} onClick={() => onSelect(row)} className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white"><Mail className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-950">{row.mailbox.name || "Boîte Email OS"}</p><p className="mt-1 truncate text-xs font-semibold text-slate-500">{row.mailbox.address}</p><p className="mt-2 truncate text-[11px] font-bold text-blue-700">{row.proposedDisplayName}</p></div><span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${meta.className}`}>{meta.label}</span><ChevronRight className="h-4 w-4 text-slate-400" /></button>
            })}
            {!filtered.length ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">Aucune boîte disponible.</div> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function BulkTestModal({ recipient, setRecipient, reason, setReason, progress, results, busy, onRun, onClose }: { recipient: string; setRecipient: (value: string) => void; reason: string; setReason: (value: string) => void; progress: { done: number; total: number; current: string }; results: Array<{ identityId: string; name: string; ok: boolean; error?: string }>; busy: boolean; onRun: () => void; onClose: () => void }) {
  const percent = progress.total ? Math.round((progress.done / progress.total) * 100) : 0
  return (
    <div className="fixed inset-0 z-[1800] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[30px] bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">Validation groupée</p><h2 className="mt-2 text-2xl font-black text-slate-950">Tester toutes les identités</h2><p className="mt-1 text-xs font-semibold text-slate-500">Un email de preuve est envoyé séquentiellement pour chaque identité configurée afin de respecter le contrôle de débit SMTP.</p></div><button onClick={onClose} disabled={busy} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 disabled:opacity-40"><X className="h-4 w-4" /></button></header>
        <div className="space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Adresse Gmail de validation" value={recipient} onChange={setRecipient} /><Field label="Motif global" value={reason} onChange={setReason} /></div>
          {progress.total ? <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4"><div className="flex items-center justify-between text-xs font-black text-blue-800"><span>{progress.current || "Tests en cours"}</span><span>{progress.done}/{progress.total}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${percent}%` }} /></div></div> : null}
          {results.length ? <div className="max-h-72 space-y-2 overflow-y-auto">{results.map((result) => <div key={result.identityId} className={`flex items-start gap-3 rounded-xl border px-3 py-3 ${result.ok ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>{result.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />}<div><p className={`text-xs font-black ${result.ok ? "text-emerald-800" : "text-rose-800"}`}>{result.name}</p>{result.error ? <p className="mt-1 text-[11px] font-semibold text-rose-700">{result.error}</p> : <p className="mt-1 text-[11px] font-semibold text-emerald-700">Preuve acceptée par le transport.</p>}</div></div>)}</div> : null}
          <div className="flex justify-end gap-2"><button onClick={onClose} disabled={busy} className="h-11 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-600 disabled:opacity-40">Fermer</button><button onClick={onRun} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-black text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />} Lancer les tests</button></div>
        </div>
      </div>
    </div>
  )
}

function BulkModal({ proposals, reason, setReason, busy, onApply, onClose }: { proposals: Array<Record<string, string>>; reason: string; setReason: (value: string) => void; busy: boolean; onApply: () => void; onClose: () => void }) {
  return <div className="fixed inset-0 z-[1700] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[30px] bg-white shadow-2xl"><header className="flex items-start justify-between border-b border-slate-200 p-5"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Standardisation assistée</p><h2 className="mt-2 text-2xl font-black text-slate-950">Appliquer le standard ANGELCARE</h2><p className="mt-1 text-xs font-semibold text-slate-500">Les propositions seront créées en brouillon et devront être testées avant activation.</p></div><button onClick={onClose}><X className="h-5 w-5" /></button></header><div className="p-5"><div className="overflow-hidden rounded-2xl border border-slate-200"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500"><tr><th className="px-3 py-3">Adresse</th><th className="px-3 py-3">Nom commercial proposé</th><th className="px-3 py-3">Reply-To</th></tr></thead><tbody>{proposals.map((proposal) => <tr key={proposal.mailboxId} className="border-t border-slate-100"><td className="px-3 py-3 font-semibold text-slate-600">{proposal.fromAddress}</td><td className="px-3 py-3 font-black text-slate-950">{proposal.externalDisplayName}</td><td className="px-3 py-3 font-semibold text-slate-600">{proposal.replyToName}</td></tr>)}</tbody></table></div><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="Motif global obligatoire" className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold" /><div className="mt-4 flex justify-end gap-2"><button onClick={onClose} className="h-11 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-600">Annuler</button><button onClick={onApply} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-black text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Créer les brouillons</button></div></div></div></div>
}
