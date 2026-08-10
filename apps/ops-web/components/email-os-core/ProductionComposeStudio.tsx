"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Inbox,
  Loader2,
  Mail,
  Paperclip,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  X,
  Zap
} from "lucide-react"

type ApiResult = { ok?: boolean; data?: any; error?: string }
type SendLifecycle = "idle" | "validating" | "queueing" | "queued" | "failed"

async function api(path: string, options?: RequestInit): Promise<ApiResult> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    }
  })

  return res.json().catch(() => ({
    ok: false,
    error: "Invalid JSON response"
  }))
}

function templateTitle(template: any) {
  return template.name || template.title || template.subject || "Modèle sans titre"
}

function normalizeTemplateText(value: unknown) {
  return String(value || "").replace(/\\n/g, "\n").replace(/\r\n/g, "\n")
}

function templateBody(template: any) {
  return normalizeTemplateText(template.body || template.content || "")
}

function templateSubject(template: any) {
  return template.subject || template.name || template.title || ""
}

async function uploadAttachmentToGateway(file: File, mailboxId: string) {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("moduleKey", "email_os")
  formData.append("mailboxId", mailboxId)
  formData.append("entityType", "compose_attachment")
  formData.append("direction", "outbound")
  formData.append("createdBy", "production-compose-studio")
  formData.append("metadata", JSON.stringify({ source: "production-compose-studio" }))

  const res = await fetch("/api/storage/upload", {
    method: "POST",
    body: formData
  })

  const json = await res.json().catch(() => null)
  return {
    ok: res.ok && json?.ok !== false,
    data: json?.data ?? json,
    error: json?.error || (!res.ok ? `HTTP ${res.status}` : null)
  }
}

function lifecycleLabel(lifecycle: SendLifecycle) {
  if (lifecycle === "validating") return "Validation opérationnelle"
  if (lifecycle === "queueing") return "Mise en file d’envoi"
  if (lifecycle === "queued") return "Email ajouté à l’outbox"
  if (lifecycle === "failed") return "Échec opérationnel"
  return "Prêt pour exécution"
}

function lifecycleColor(lifecycle: SendLifecycle) {
  if (lifecycle === "queued") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (lifecycle === "failed") return "border-red-200 bg-red-50 text-red-700"
  if (lifecycle === "queueing" || lifecycle === "validating") return "border-blue-200 bg-blue-50 text-blue-700"
  return "border-slate-200 bg-slate-50 text-slate-700"
}

export default function ProductionComposeStudio() {
  const [mailboxes, setMailboxes] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [templateQuery, setTemplateQuery] = useState("")
  const [templateCategory, setTemplateCategory] = useState("all")
  const [mailboxId, setMailboxId] = useState("")
  const [toEmail, setToEmail] = useState("")
  const [ccEmail, setCcEmail] = useState("")
  const [bccEmail, setBccEmail] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showTemplates, setShowTemplates] = useState(true)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [priority, setPriority] = useState("normal")
  const [templateKey, setTemplateKey] = useState("")
  const [attachments, setAttachments] = useState<any[]>([])
  const safeAttachments = Array.isArray(attachments) ? attachments : []
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [status, setStatus] = useState("Prêt")
  const [busy, setBusy] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)
  const [lifecycle, setLifecycle] = useState<SendLifecycle>("idle")
  const [successOpen, setSuccessOpen] = useState(false)
  const [lastQueued, setLastQueued] = useState<any>(null)

  const selectedMailbox = useMemo(
    () => mailboxes.find((mailbox) => mailbox.id === mailboxId),
    [mailboxes, mailboxId]
  )

  const templateCategories = useMemo(
    () => Array.from(new Set(templates.map((template) => template.category).filter(Boolean))),
    [templates]
  )

  const filteredTemplates = useMemo(() => {
    const q = templateQuery.toLowerCase().trim()

    return templates.filter((template) => {
      const matchesCategory = templateCategory === "all" || template.category === templateCategory
      const haystack = [
        template.name,
        template.title,
        template.subject,
        template.category,
        template.department,
        template.body
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return matchesCategory && (!q || haystack.includes(q))
    })
  }, [templates, templateCategory, templateQuery])

  const canSend = Boolean(mailboxId && toEmail && subject && body && !busy)

  async function loadMailboxes() {
    const result = await api("/api/email-os/mailboxes")
    if (result.ok) {
      const rows = result.data || []
      setMailboxes(rows)
      if (!mailboxId && rows.length > 0) {
        const defaultMailbox = rows.find((row: any) => row.is_default) || rows[0]
        setMailboxId(defaultMailbox.id)
      }
    }
  }

  async function loadTemplates() {
    const suffix = mailboxId ? `?mailboxId=${encodeURIComponent(mailboxId)}` : ""
    const result = await api(`/api/email-os/templates${suffix}`)
    if (result.ok) {
      const rows = Array.isArray(result.data?.templates) ? result.data.templates : Array.isArray(result.data) ? result.data : []
      setTemplates(rows)
      setStatus(`Modèles chargés : ${rows.length}`)
    } else {
      setStatus(result.error || "Échec chargement modèles")
    }
  }

  async function loadDiagnostics() {
    const result = await api("/api/email-os/compose/diagnostics")
    if (result.ok) setDiagnostics(result.data)
  }

  useEffect(() => {
    loadMailboxes()
    loadTemplates()
    loadDiagnostics()
  }, [])

  function applyTemplate(template: any) {
    setTemplateKey(template.id || template.key || "")
    setSubject(templateSubject(template))
    setBody(templateBody(template))
    setStatus(`Modèle appliqué : ${templateTitle(template)}`)
  }

  async function registerLocalAttachments(files: FileList | null) {
    if (!files) return

    const next = await Promise.all(Array.from(files).map(async (file) => {
      const mimeType = file.type || "application/octet-stream"
      if (mailboxId) {
        try {
          const uploaded = await uploadAttachmentToGateway(file, mailboxId)
          if (uploaded.ok && uploaded.data?.id) {
            return {
              id: uploaded.data.id,
              filename: uploaded.data.original_filename || file.name,
              size: file.size,
              mimeType,
              fileId: uploaded.data.id,
              storageBucket: uploaded.data.storage_bucket,
              storageKey: uploaded.data.storage_key,
              storageStatus: uploaded.data.status || "active",
              downloadUrl: `/api/storage/download/${uploaded.data.id}?mailboxId=${encodeURIComponent(mailboxId)}`
            }
          }
        } catch {
          // Legacy fallback below.
        }
      }

      return {
        id: `${file.name}-${file.size}-${Date.now()}`,
        filename: file.name,
        size: file.size,
        mimeType,
        contentBase64: await fileToDataUrl(file)
      }
    }))

    setAttachments((prev) => [...prev, ...next])
    setStatus(`${next.length} pièce(s) jointe(s) ajoutée(s)`)
  }

  function fileToDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(new Error(`Unable to read attachment: ${file.name}`))
      reader.onload = () => {
        const raw = String(reader.result || "")
        resolve(raw.includes(",") ? raw.split(",").pop() || "" : raw)
      }
      reader.readAsDataURL(file)
    })
  }

  function resetCompose() {
    setToEmail("")
    setCcEmail("")
    setBccEmail("")
    setSubject("")
    setBody("")
    setPriority("normal")
    setTemplateKey("")
    setAttachments([])
    setLifecycle("idle")
    setStatus("Nouveau message prêt")
  }

  async function runAi(action: "improve" | "summary" | "subject") {
    setBusy(true)
    setStatus("Assistant IA en cours...")

    const result = await api("/api/email-os/compose/ai-assist", {
      method: "POST",
      body: JSON.stringify({ action, subject, body })
    })

    setBusy(false)

    if (!result.ok) {
      setStatus(result.error || "Échec assistant IA")
      return
    }

    if (action === "improve") {
      setBody(result.data.body || body)
      setStatus("Message amélioré")
    }

    if (action === "summary") {
      setLastResult({ type: "summary", value: result.data.summary })
      setStatus("Résumé généré")
    }

    if (action === "subject") {
      setSubject(result.data.subject || subject)
      setStatus("Objet proposé")
    }
  }

  async function saveDraft() {
    setBusy(true)
    setStatus("Enregistrement du brouillon...")

    const result = await api("/api/email-os/compose/draft", {
      method: "POST",
      body: JSON.stringify({
        mailboxId,
        fromEmail: selectedMailbox?.email_address || selectedMailbox?.address || null,
        toEmail,
        ccEmail,
        bccEmail,
        subject,
        body,
        priority,
        templateKey,
        diagnostics: { attachmentCount: safeAttachments.length }
      })
    })

    if (result.ok && safeAttachments.length > 0) {
      await api("/api/email-os/compose/attachments", {
        method: "POST",
        body: JSON.stringify({
          mailboxId,
          draftId: result.data?.id,
          attachments: safeAttachments.filter((item) => item.fileId || item.contentBase64).map((item) => ({
            filename: item.filename,
            mimeType: item.mimeType,
            fileId: item.fileId,
            contentBase64: item.contentBase64,
            size: item.size,
            storageBucket: item.storageBucket,
            storageKey: item.storageKey
          }))
        })
      })
    }

    setBusy(false)
    setLastResult(result)
    setStatus(result.ok ? "Brouillon enregistré" : result.error || "Échec brouillon")
  }

  async function sendQueue() {
    setLifecycle("validating")

    if (!mailboxId) {
      setLifecycle("failed")
      setStatus("Veuillez sélectionner une boîte mail")
      return
    }

    if (!toEmail || !subject || !body) {
      setLifecycle("failed")
      setStatus("Destinataire, objet et message sont obligatoires")
      return
    }

    setBusy(true)
    setLifecycle("queueing")
    setStatus("Création de l’ordre d’envoi...")

    const result = await api("/api/email-os/send-direct", {
      method: "POST",
      body: JSON.stringify({
        mailboxId,
        fromEmail: selectedMailbox?.email_address || selectedMailbox?.address || null,
        toEmail,
        ccEmail,
        bccEmail,
        subject,
        body,
        priority,
        templateKey,
        diagnostics: { attachmentCount: safeAttachments.length }
      })
    })

    if (result.ok && safeAttachments.length > 0) {
      await api("/api/email-os/compose/attachments", {
        method: "POST",
        body: JSON.stringify({
          mailboxId,
          outboxId: result.data?.outboxId || result.data?.id,
          attachments: safeAttachments.filter((item) => item.fileId || item.contentBase64).map((item) => ({
            filename: item.filename,
            mimeType: item.mimeType,
            fileId: item.fileId,
            contentBase64: item.contentBase64,
            size: item.size,
            storageBucket: item.storageBucket,
            storageKey: item.storageKey
          }))
        })
      })
    }

    setBusy(false)
    setLastResult(result)

    if (!result.ok) {
      setLifecycle("failed")
      setStatus(result.error || "Échec envoi")
      return
    }

    const queuedPayload = {
      ...result.data,
      toEmail,
      subject,
      mailbox: selectedMailbox?.email_address || selectedMailbox?.address || mailboxId
    }

    setLastQueued(queuedPayload)
    setLifecycle("queued")
    setStatus("Email ajouté à l’outbox. Prêt pour exécution SMTP.")
    setSuccessOpen(true)

    window.setTimeout(() => resetCompose(), 900)
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(`Objet : ${subject}\n\n${body}`)
    setStatus("Message copié")
  }

  return (
    <section className="min-h-full bg-slate-50">
      {successOpen ? (
        <div className="fixed left-0 right-0 bottom-0 top-[86px] z-[80] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-xl rounded-[32px] border border-emerald-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="rounded-3xl bg-emerald-50 p-4 text-emerald-700">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-black text-slate-950">Email ajouté à l’outbox</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Le message est enregistré, traçable, et prêt pour l’exécution SMTP.
                </p>

                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm">
                  <div className="font-black text-slate-950">{lastQueued?.subject}</div>
                  <div className="mt-1 text-slate-500">Vers : {lastQueued?.toEmail}</div>
                  <div className="mt-1 text-slate-500">Boîte : {lastQueued?.mailbox}</div>
                  <div className="mt-1 text-slate-500">Outbox ID : {lastQueued?.outboxId || "N/A"}</div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <a href="/email-os/outbox-real" className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white">
                    <Inbox className="h-4 w-4" />
                    Ouvrir Outbox
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setSuccessOpen(false)
                      resetCompose()
                    }}
                    className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-5 text-sm font-black hover:bg-slate-50"
                  >
                    Composer un autre
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="rounded-3xl bg-slate-950 p-4 text-white">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-950">Compose Command Center</h1>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{status}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    loadMailboxes()
                    loadTemplates()
                    loadDiagnostics()
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-black hover:bg-slate-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Actualiser
                </button>

                <button
                  type="button"
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-black hover:bg-slate-50"
                >
                  <FileText className="h-4 w-4" />
                  {showTemplates ? "Masquer modèles" : "Afficher modèles"}
                </button>

                <a href="/email-os/outbox-real" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-black hover:bg-slate-50">
                  <Inbox className="h-4 w-4" />
                  Outbox
                </a>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-4">
              <div className={`rounded-2xl border p-4 ${lifecycleColor(lifecycle)}`}>
                <div className="text-xs font-black uppercase opacity-70">Lifecycle</div>
                <div className="mt-2 flex items-center gap-2 font-black">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  {lifecycleLabel(lifecycle)}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-black uppercase text-slate-400">Boîtes</div>
                <div className="mt-2 font-black text-slate-950">{mailboxes.length}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-black uppercase text-slate-400">Modèles</div>
                <div className="mt-2 font-black text-slate-950">{templates.length}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-black uppercase text-slate-400">SMTP</div>
                <div className={`mt-2 font-black ${diagnostics?.smtpConfigured ? "text-emerald-700" : "text-amber-700"}`}>
                  {diagnostics?.smtpConfigured ? "Configuré" : "À vérifier"}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-950">Ordre d’envoi</h2>
                <p className="text-sm font-semibold text-slate-500">Validation, queue, outbox et traçabilité opérationnelle.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <div className="mb-2 text-sm font-black text-slate-900">Boîte d’envoi</div>
                <select value={mailboxId} onChange={(event) => setMailboxId(event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none">
                  <option value="">Sélectionner une boîte mail</option>
                  {mailboxes.map((mailbox) => (
                    <option key={mailbox.id} value={mailbox.id}>
                      {mailbox.name || mailbox.email_address || mailbox.address} — {mailbox.email_address || mailbox.address}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <div className="mb-2 text-sm font-black text-slate-900">Priorité</div>
                <select value={priority} onChange={(event) => setPriority(event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none">
                  <option value="low">Priorité basse</option>
                  <option value="normal">Priorité normale</option>
                  <option value="high">Priorité haute</option>
                  <option value="critical">Critique</option>
                </select>
              </label>
            </div>

            <div className="mt-4 grid gap-4">
              <input value={toEmail} onChange={(event) => setToEmail(event.target.value)} placeholder="Destinataire" className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none" />

              {showAdvanced ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <input value={ccEmail} onChange={(event) => setCcEmail(event.target.value)} placeholder="CC" className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none" />
                  <input value={bccEmail} onChange={(event) => setBccEmail(event.target.value)} placeholder="BCC" className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none" />
                </div>
              ) : null}

              <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="w-fit rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">
                {showAdvanced ? "Masquer CC/BCC" : "Afficher CC/BCC"}
              </button>

              <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Objet" className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none" />

              <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Message" className="min-h-[340px] rounded-2xl border border-slate-200 p-4 text-sm font-semibold leading-6 outline-none" />

              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-black hover:bg-slate-50">
                  <Paperclip className="h-4 w-4" />
                  Pièces jointes
                  <input type="file" multiple className="hidden" onChange={(event) => registerLocalAttachments(event.target.files)} />
                </label>

                <button type="button" onClick={copyMessage} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-black hover:bg-slate-50">
                  <Copy className="h-4 w-4" />
                  Copier
                </button>
              </div>

              {safeAttachments.length > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-black text-slate-900">Pièces jointes enregistrées</div>
                  <div className="mt-3 space-y-2">
                    {safeAttachments.map((file) => (
                      <div key={file.id} className="flex items-center justify-between rounded-xl bg-white p-3 text-sm">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-700">{file.filename}</div>
                          <div className="text-xs font-semibold text-slate-500">{file.mimeType || "application/octet-stream"} · {file.fileId ? `Storage ${file.storageStatus || "active"}` : "Legacy inline"}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {file.downloadUrl ? (
                            <a href={file.downloadUrl} className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-black text-slate-700 hover:bg-slate-50">
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          ) : null}
                          <button type="button" onClick={() => setAttachments((prev) => prev.filter((item) => item.id !== file.id))} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                <button type="button" disabled={!canSend} onClick={sendQueue} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {busy ? "Exécution..." : "Envoyer vers Outbox"}
                </button>

                <button type="button" disabled={busy} onClick={saveDraft} className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-200 px-6 text-sm font-black hover:bg-slate-50 disabled:opacity-50">
                  <Save className="h-4 w-4" />
                  Enregistrer brouillon
                </button>

                <button type="button" disabled={busy} onClick={resetCompose} className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-200 px-6 text-sm font-black hover:bg-slate-50 disabled:opacity-50">
                  Nouveau message
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          {showTemplates ? (
            <div className="rounded-[32px] border border-slate-200 bg-white/95 p-5 shadow-[0_24px_80px_rgba(15,23,42,.08)]">
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-slate-500" />
                <h2 className="text-lg font-black text-slate-950">Modèles opérationnels</h2>
              </div>

              <div className="mt-4 grid gap-3">
                <input value={templateQuery} onChange={(event) => setTemplateQuery(event.target.value)} placeholder="Rechercher un modèle..." className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none" />

                <select value={templateCategory} onChange={(event) => setTemplateCategory(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none">
                  <option value="all">Toutes catégories</option>
                  {templateCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="mt-4 max-h-[430px] space-y-2 overflow-y-auto">
                {filteredTemplates.map((template) => (
                  <button type="button" key={template.id} onClick={() => applyTemplate(template)} className={`w-full rounded-2xl border p-3 text-left transition hover:bg-slate-50 ${templateKey === template.id ? "border-slate-950 bg-slate-50" : "border-slate-200"}`}>
                    <div className="font-black text-slate-950">{templateTitle(template)}</div>
                    <div className="mt-1 text-xs font-bold text-slate-500">{template.category}</div>
                    <div className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{templateSubject(template)}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-[32px] border border-slate-200 bg-white/95 p-5 shadow-[0_24px_80px_rgba(15,23,42,.08)]">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-slate-500" />
              <h2 className="text-lg font-black text-slate-950">Assistant IA</h2>
            </div>

            <div className="mt-4 grid gap-2">
              <button type="button" onClick={() => runAi("improve")} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-black hover:bg-slate-50">
                <Bot className="h-4 w-4" />
                Améliorer le message
              </button>

              <button type="button" onClick={() => runAi("subject")} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-black hover:bg-slate-50">
                <FileText className="h-4 w-4" />
                Proposer objet
              </button>

              <button type="button" onClick={() => runAi("summary")} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-black hover:bg-slate-50">
                <CheckCircle2 className="h-4 w-4" />
                Résumer
              </button>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white/95 p-5 shadow-[0_24px_80px_rgba(15,23,42,.08)]">
            <h2 className="text-lg font-black text-slate-950">Execution Control</h2>

            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3">État : <strong>{lifecycleLabel(lifecycle)}</strong></div>
              <div className="rounded-xl bg-slate-50 p-3">Boîte : <strong>{selectedMailbox?.email_address || selectedMailbox?.address || "Non sélectionnée"}</strong></div>
              <div className="rounded-xl bg-slate-50 p-3">SMTP : <strong>{diagnostics?.smtpConfigured ? "Configuré" : "Non configuré"}</strong></div>
              <div className="rounded-xl bg-slate-50 p-3">Dernier outbox : <strong>{lastQueued?.outboxId || "Aucun"}</strong></div>
            </div>
          </div>

          {lastResult ? (
            <div className="rounded-[32px] border border-slate-200 bg-white/95 p-5 shadow-[0_24px_80px_rgba(15,23,42,.08)]">
              <h2 className="text-lg font-black text-slate-950">Dernier résultat</h2>
              <pre className="mt-4 max-h-[260px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-white">{JSON.stringify(lastResult, null, 2)}</pre>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  )
}
