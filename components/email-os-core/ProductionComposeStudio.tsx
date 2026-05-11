"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Bot,
  CheckCircle2,
  Copy,
  FileText,
  Inbox,
  Loader2,
  Mail,
  Paperclip,
  RefreshCw,
  Save,
  Search,
  Send,
  Sparkles,
  X
} from "lucide-react"

type ApiResult = {
  ok?: boolean
  data?: any
  error?: string
}

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

function templateBody(template: any) {
  return template.body || template.content || ""
}

function templateSubject(template: any) {
  return template.subject || template.name || template.title || ""
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
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [status, setStatus] = useState("Prêt")
  const [busy, setBusy] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)

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
      const matchesCategory =
        templateCategory === "all" || template.category === templateCategory

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
    const result = await api("/api/email-os/templates")

    if (result.ok) {
      setTemplates(result.data || [])
      setStatus(`Modèles chargés : ${(result.data || []).length}`)
    } else {
      setStatus(result.error || "Échec chargement modèles")
    }
  }

  async function loadDiagnostics() {
    const result = await api("/api/email-os/compose/diagnostics")

    if (result.ok) {
      setDiagnostics(result.data)
    }
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

  function registerLocalAttachments(files: FileList | null) {
    if (!files) return

    const next = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}`,
      filename: file.name,
      size: file.size,
      mimeType: file.type
    }))

    setAttachments((prev) => [...prev, ...next])
    setStatus(`${next.length} pièce(s) jointe(s) ajoutée(s)`)
  }

  async function runAi(action: "improve" | "summary" | "subject") {
    setBusy(true)
    setStatus("Assistant IA en cours...")

    const result = await api("/api/email-os/compose/ai-assist", {
      method: "POST",
      body: JSON.stringify({
        action,
        subject,
        body
      })
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
      setLastResult({
        type: "summary",
        value: result.data.summary
      })
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
        diagnostics: {
          attachmentCount: attachments.length
        }
      })
    })

    if (result.ok && attachments.length > 0) {
      await api("/api/email-os/compose/attachments", {
        method: "POST",
        body: JSON.stringify({
          draftId: result.data?.id,
          attachments
        })
      })
    }

    setBusy(false)
    setLastResult(result)
    setStatus(result.ok ? "Brouillon enregistré" : result.error || "Échec brouillon")
  }

  async function sendQueue() {
    if (!mailboxId) {
      setStatus("Veuillez sélectionner une boîte mail")
      return
    }

    if (!toEmail || !subject || !body) {
      setStatus("Destinataire, objet et message sont obligatoires")
      return
    }

    setBusy(true)
    setStatus("Envoi / mise en file...")

    const result = await api("/api/email-os/send", {
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
        diagnostics: {
          attachmentCount: attachments.length
        }
      })
    })

    if (result.ok && attachments.length > 0) {
      await api("/api/email-os/compose/attachments", {
        method: "POST",
        body: JSON.stringify({
          outboxId: result.data?.outboxId || result.data?.id,
          attachments
        })
      })
    }

    setBusy(false)
    setLastResult(result)
    setStatus(result.ok ? "Email ajouté à l’outbox / file d’envoi" : result.error || "Échec envoi")
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(`Objet : ${subject}\n\n${body}`)
    setStatus("Message copié")
  }

  return (
    <section className="min-h-full bg-slate-50">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-950 p-3 text-white">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-950">Compose Production</h1>
                  <p className="text-sm font-semibold text-slate-500">{status}</p>
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

                <a
                  href="/email-os/outbox-real"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-black hover:bg-slate-50"
                >
                  <Inbox className="h-4 w-4" />
                  Outbox
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <div className="mb-2 text-sm font-black text-slate-900">Boîte d’envoi</div>
                <select
                  value={mailboxId}
                  onChange={(event) => setMailboxId(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none"
                >
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
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none"
                >
                  <option value="low">Priorité basse</option>
                  <option value="normal">Priorité normale</option>
                  <option value="high">Priorité haute</option>
                  <option value="critical">Critique</option>
                </select>
              </label>
            </div>

            <div className="mt-4 grid gap-4">
              <input
                value={toEmail}
                onChange={(event) => setToEmail(event.target.value)}
                placeholder="Destinataire"
                className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none"
              />

              {showAdvanced ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    value={ccEmail}
                    onChange={(event) => setCcEmail(event.target.value)}
                    placeholder="CC"
                    className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none"
                  />
                  <input
                    value={bccEmail}
                    onChange={(event) => setBccEmail(event.target.value)}
                    placeholder="BCC"
                    className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none"
                  />
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-fit rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
              >
                {showAdvanced ? "Masquer CC/BCC" : "Afficher CC/BCC"}
              </button>

              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Objet"
                className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none"
              />

              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Message"
                className="min-h-[340px] rounded-2xl border border-slate-200 p-4 text-sm font-semibold leading-6 outline-none"
              />

              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-black hover:bg-slate-50">
                  <Paperclip className="h-4 w-4" />
                  Pièces jointes
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(event) => registerLocalAttachments(event.target.files)}
                  />
                </label>

                <button
                  type="button"
                  onClick={copyMessage}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-black hover:bg-slate-50"
                >
                  <Copy className="h-4 w-4" />
                  Copier
                </button>
              </div>

              {attachments.length > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-black text-slate-900">Pièces jointes enregistrées</div>
                  <div className="mt-3 space-y-2">
                    {attachments.map((file) => (
                      <div key={file.id} className="flex items-center justify-between rounded-xl bg-white p-3 text-sm">
                        <span className="font-bold text-slate-700">{file.filename}</span>
                        <button
                          type="button"
                          onClick={() => setAttachments((prev) => prev.filter((item) => item.id !== file.id))}
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={sendQueue}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Envoyer / File
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={saveDraft}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-5 text-sm font-black hover:bg-slate-50 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  Enregistrer brouillon
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          {showTemplates ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-slate-500" />
                <h2 className="text-lg font-black text-slate-950">Modèles</h2>
              </div>

              <div className="mt-4 grid gap-3">
                <input
                  value={templateQuery}
                  onChange={(event) => setTemplateQuery(event.target.value)}
                  placeholder="Rechercher un modèle..."
                  className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none"
                />

                <select
                  value={templateCategory}
                  onChange={(event) => setTemplateCategory(event.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none"
                >
                  <option value="all">Toutes catégories</option>
                  {templateCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="mt-4 max-h-[430px] space-y-2 overflow-y-auto">
                {filteredTemplates.map((template) => (
                  <button
                    type="button"
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    className={`w-full rounded-2xl border p-3 text-left transition hover:bg-slate-50 ${
                      templateKey === template.id ? "border-slate-950 bg-slate-50" : "border-slate-200"
                    }`}
                  >
                    <div className="font-black text-slate-950">{templateTitle(template)}</div>
                    <div className="mt-1 text-xs font-bold text-slate-500">{template.category}</div>
                    <div className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{templateSubject(template)}</div>
                  </button>
                ))}

                {filteredTemplates.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm font-bold text-slate-500">
                    Aucun modèle trouvé.
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
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

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Diagnostics</h2>

            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3">
                Boîtes mail : <strong>{diagnostics?.mailboxCount ?? mailboxes.length}</strong>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                Modèles : <strong>{templates.length}</strong>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                SMTP : <strong>{diagnostics?.smtpConfigured ? "Configuré" : "Non configuré"}</strong>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                IMAP : <strong>{diagnostics?.imapConfigured ? "Configuré" : "Non configuré"}</strong>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                Expéditeur : <strong>{selectedMailbox?.email_address || selectedMailbox?.address || diagnostics?.defaultFrom || "Non sélectionné"}</strong>
              </div>
            </div>
          </div>

          {lastResult ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-slate-950">Dernier résultat</h2>
              <pre className="mt-4 max-h-[260px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-white">
                {JSON.stringify(lastResult, null, 2)}
              </pre>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  )
}
