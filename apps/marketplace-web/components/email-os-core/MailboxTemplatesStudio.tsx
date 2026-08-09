"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Archive,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Code2,
  Copy,
  Download,
  Eye,
  FileDown,
  FileSpreadsheet,
  FileText,
  Globe2,
  History,
  Import,
  Languages,
  ListFilter,
  Mail,
  Monitor,
  PencilLine,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  UserCheck,
  Variable,
  X
} from "lucide-react"
import {
  DrawerCallout,
  DrawerEmptyState,
  DrawerEvidenceBadge,
  DrawerField,
  DrawerFooter,
  DrawerMetric,
  DrawerSection,
  DrawerTimelineItem,
  EnterpriseDrawer
} from "@/components/email-os-core/EnterpriseDrawerSystem"

type TemplateRow = any

type Props = {
  open: boolean
  mailboxId: string
  mailboxName: string
  mailboxEmail?: string
  currentUser?: any
  onClose: () => void
  onInsert: (template: TemplateRow) => void
  onTemplatesChanged?: (templates: TemplateRow[]) => void
}

type StudioTab = "library" | "editor" | "import" | "governance"
type PreviewMode = "desktop" | "mobile" | "plain" | "variables"

type TemplateForm = {
  id: string
  templateCode: string
  name: string
  description: string
  category: string
  language: string
  status: string
  tags: string
  subject: string
  bodyText: string
  bodyHtml: string
  defaultPriority: string
  defaultCc: string
  defaultBcc: string
  trackingEnabled: boolean
  signatureMode: string
  changeSummary: string
}

const EMPTY_FORM: TemplateForm = {
  id: "",
  templateCode: "",
  name: "",
  description: "",
  category: "other",
  language: "fr",
  status: "draft",
  tags: "",
  subject: "",
  bodyText: "",
  bodyHtml: "",
  defaultPriority: "normal",
  defaultCc: "",
  defaultBcc: "",
  trackingEnabled: true,
  signatureMode: "mailbox",
  changeSummary: ""
}

const FIELD_DEFINITIONS = [
  { key: "template_code", label: "Template code", required: true },
  { key: "template_name", label: "Template name", required: true },
  { key: "description", label: "Description", required: false },
  { key: "category", label: "Category", required: false },
  { key: "language", label: "Language", required: false },
  { key: "subject", label: "Subject", required: false },
  { key: "body_text", label: "Plain-text body", required: true },
  { key: "body_html", label: "HTML body", required: false },
  { key: "tags", label: "Tags", required: false },
  { key: "status", label: "Status", required: false },
  { key: "default_priority", label: "Default priority", required: false },
  { key: "default_cc", label: "Default CC", required: false },
  { key: "default_bcc", label: "Default BCC", required: false },
  { key: "tracking_enabled", label: "Tracking enabled", required: false },
  { key: "signature_mode", label: "Signature mode", required: false }
] as const

const HEADER_ALIASES: Record<string, string[]> = {
  template_code: ["template_code", "code", "template id", "template_id"],
  template_name: ["template_name", "name", "title", "template title"],
  description: ["description", "summary", "purpose"],
  category: ["category", "business_category", "type"],
  language: ["language", "lang", "locale"],
  subject: ["subject", "subject_template", "email_subject"],
  body_text: ["body_text", "body", "message", "text", "content"],
  body_html: ["body_html", "html", "html_body"],
  tags: ["tags", "labels", "keywords"],
  status: ["status", "state"],
  default_priority: ["default_priority", "priority"],
  default_cc: ["default_cc", "cc"],
  default_bcc: ["default_bcc", "bcc"],
  tracking_enabled: ["tracking_enabled", "tracking", "track_opens"],
  signature_mode: ["signature_mode", "signature"]
}

const drawerInputClass = "h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
const drawerTextareaClass = "w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"

async function api(path: string, options?: RequestInit) {
  try {
    const response = await fetch(path, {
      ...options,
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...(options?.headers || {}) }
    })
    const json = await response.json().catch(() => ({}))
    return { ok: response.ok && json?.ok !== false, data: json?.data ?? json, error: json?.error || (!response.ok ? `HTTP ${response.status}` : null) }
  } catch (error) {
    return { ok: false, data: null, error: error instanceof Error ? error.message : "Request failed" }
  }
}

function clean(value: unknown) {
  return String(value ?? "").trim()
}

function lower(value: unknown) {
  return clean(value).toLowerCase()
}

function formatDate(value: unknown) {
  const date = value ? new Date(String(value)) : null
  if (!date || Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

function relativeDate(value: unknown) {
  const date = value ? new Date(String(value)) : null
  if (!date || Number.isNaN(date.getTime())) return "Never"
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000))
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function extractVariables(...values: unknown[]) {
  const variables = new Set<string>()
  const regex = /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g
  for (const value of values) {
    let match: RegExpExecArray | null
    const text = clean(value)
    while ((match = regex.exec(text))) variables.add(match[1])
  }
  return Array.from(variables).sort()
}

function templateToForm(template: TemplateRow): TemplateForm {
  return {
    id: clean(template?.id),
    templateCode: clean(template?.templateCode || template?.template_code),
    name: clean(template?.name),
    description: clean(template?.description),
    category: clean(template?.category || "other"),
    language: clean(template?.language || "fr"),
    status: clean(template?.status || "draft"),
    tags: Array.isArray(template?.tags) ? template.tags.join(" | ") : clean(template?.tags),
    subject: clean(template?.subject || template?.subject_template),
    bodyText: clean(template?.bodyText || template?.body_text || template?.body),
    bodyHtml: clean(template?.bodyHtml || template?.body_html),
    defaultPriority: clean(template?.defaultPriority || template?.default_priority || "normal"),
    defaultCc: clean(template?.defaultCc || template?.default_cc),
    defaultBcc: clean(template?.defaultBcc || template?.default_bcc),
    trackingEnabled: template?.trackingEnabled !== false && template?.tracking_enabled !== false,
    signatureMode: clean(template?.signatureMode || template?.signature_mode || "mailbox"),
    changeSummary: ""
  }
}

function parseCsv(text: string) {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]
    if (char === '"' && quoted && next === '"') {
      field += '"'; index += 1; continue
    }
    if (char === '"') {
      quoted = !quoted; continue
    }
    if (char === "," && !quoted) {
      row.push(field); field = ""; continue
    }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1
      row.push(field); field = ""
      if (row.some((value) => value.trim())) rows.push(row)
      row = []
      continue
    }
    field += char
  }
  row.push(field)
  if (row.some((value) => value.trim())) rows.push(row)
  const headers = (rows.shift() || []).map((header) => header.trim())
  return {
    headers,
    rows: rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])))
  }
}

function autoMap(headers: string[]) {
  const map: Record<string, string> = {}
  for (const field of FIELD_DEFINITIONS) {
    const aliases = HEADER_ALIASES[field.key] || [field.key]
    const found = headers.find((header) => aliases.includes(lower(header)))
    map[field.key] = found || ""
  }
  return map
}

function mapImportRow(row: Record<string, string>, mapping: Record<string, string>) {
  const get = (key: string) => clean(mapping[key] ? row[mapping[key]] : "")
  return {
    templateCode: get("template_code"),
    name: get("template_name"),
    description: get("description"),
    category: get("category") || "other",
    language: get("language") || "fr",
    subject: get("subject"),
    bodyText: get("body_text"),
    bodyHtml: get("body_html"),
    tags: get("tags"),
    status: get("status") || "draft",
    defaultPriority: get("default_priority") || "normal",
    defaultCc: get("default_cc"),
    defaultBcc: get("default_bcc"),
    trackingEnabled: get("tracking_enabled") || "true",
    signatureMode: get("signature_mode") || "mailbox"
  }
}

function validateImportRow(row: ReturnType<typeof mapImportRow>, existingCodes: Set<string>, existingNameSubjects: Set<string>) {
  const errors: string[] = []
  const warnings: string[] = []
  if (!row.templateCode) errors.push("Missing template code")
  if (!row.name) errors.push("Missing template name")
  if (!row.bodyText && !row.bodyHtml) errors.push("Missing message body")
  if (!row.subject) warnings.push("Subject is empty")
  if (row.bodyHtml && /<script[\s>]/i.test(row.bodyHtml)) errors.push("HTML script is not allowed")
  const duplicateCode = existingCodes.has(lower(row.templateCode))
  const duplicateContent = existingNameSubjects.has(`${lower(row.name)}|${lower(row.subject)}`)
  if (duplicateCode) warnings.push("Template code already exists")
  else if (duplicateContent) warnings.push("Name and subject match an existing template")
  return { errors, warnings, duplicateCode, duplicateContent }
}

const MAX_SAFE_HTML_PREVIEW_CHARS = 180_000
const MAX_TEMPLATE_CSV_BYTES = 5 * 1024 * 1024
const MAX_TEMPLATE_CSV_ROWS = 1_000

function buildSafePreviewDocument(html: string) {
  const truncated = html.length > MAX_SAFE_HTML_PREVIEW_CHARS
  const limited = html.slice(0, MAX_SAFE_HTML_PREVIEW_CHARS)
  const sanitized = limited
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<(iframe|object|embed|video|audio|canvas|svg|form)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/<(iframe|object|embed|video|audio|canvas|svg|link|base|meta|form)\b[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*(["']).*?\1/gi, "")
    .replace(/\ssrcset\s*=\s*(["']).*?\1/gi, "")
    .replace(/\s(href|src)\s*=\s*(["'])\s*(https?:|\/\/)[\s\S]*?\2/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/url\s*\(\s*(['"]?)(https?:|\/\/)[\s\S]*?\1\s*\)/gi, "none")
    .replace(
      /\sstyle\s*=\s*(["'])([\s\S]*?)\1/gi,
      (_match, quote, css) => {
        const safeCss = String(css)
          .replace(/(?:^|;)\s*(animation|transition|filter|backdrop-filter|will-change|transform)\s*:[^;]*/gi, "")
          .replace(/position\s*:\s*(fixed|sticky)/gi, "position: static")
          .replace(/z-index\s*:\s*-?\d+/gi, "z-index: 0")
        return ` style=${quote}${safeCss}${quote}`
      }
    )

  const truncationNotice = truncated
    ? '<div style="padding:10px 12px;margin:0 0 12px;border:1px solid #f59e0b;background:#fffbeb;color:#92400e;border-radius:10px;font:700 12px system-ui">Preview was truncated to protect workstation performance.</div>'
    : ""

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; font-src data:; media-src 'none'; frame-src 'none'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root { color-scheme: light; }
  html, body { margin:0; padding:0; background:#fff; color:#0f172a; overflow-wrap:anywhere; }
  body { padding:20px; font-family:Arial,Helvetica,sans-serif; line-height:1.55; }
  *, *::before, *::after {
    animation:none !important;
    transition:none !important;
    filter:none !important;
    backdrop-filter:none !important;
    scroll-behavior:auto !important;
    will-change:auto !important;
    max-width:100%;
  }
  img { max-width:100% !important; height:auto !important; }
  table { max-width:100% !important; border-collapse:collapse; }
</style>
</head>
<body>${truncationNotice}${sanitized}</body>
</html>`
}

export default function MailboxTemplatesStudio({
  open,
  mailboxId,
  mailboxName,
  mailboxEmail,
  currentUser,
  onClose,
  onInsert,
  onTemplatesChanged
}: Props) {
  const [tab, setTab] = useState<StudioTab>("library")
  const [previewMode, setPreviewMode] = useState<PreviewMode>("plain")
  const [htmlPreviewEnabled, setHtmlPreviewEnabled] = useState(false)
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [detail, setDetail] = useState<any>(null)
  const [stats, setStats] = useState<any>({ total: 0, published: 0, drafts: 0, archived: 0, usage: 0, imported: 0 })
  const [permissions, setPermissions] = useState<any>({})
  const [knownVariables, setKnownVariables] = useState<string[]>([])
  const [recentImports, setRecentImports] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [form, setForm] = useState<TemplateForm>(EMPTY_FORM)
  const [baseline, setBaseline] = useState(JSON.stringify(EMPTY_FORM))
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("active")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [languageFilter, setLanguageFilter] = useState("all")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [csvFileName, setCsvFileName] = useState("")
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvRows, setCsvRows] = useState<Array<Record<string, string>>>([])
  const [csvMapping, setCsvMapping] = useState<Record<string, string>>({})
  const [importStrategy, setImportStrategy] = useState("skip_duplicates")
  const [importReceipt, setImportReceipt] = useState<any>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const dirty = JSON.stringify(form) !== baseline
  const selected = templates.find((template) => clean(template.id) === selectedId) || detail?.template || null
  const categories = useMemo(() => Array.from(new Set(templates.map((row) => clean(row.category)).filter(Boolean))).sort(), [templates])
  const languages = useMemo(() => Array.from(new Set(templates.map((row) => clean(row.language)).filter(Boolean))).sort(), [templates])

  const filteredTemplates = useMemo(() => {
    const needle = lower(query)
    return templates.filter((template) => {
      const matchesQuery = !needle || [template.name, template.templateCode, template.subject, template.bodyText, template.category, ...(template.tags || [])].join(" ").toLowerCase().includes(needle)
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? template.status !== "archived" : template.status === statusFilter)
      const matchesCategory = categoryFilter === "all" || template.category === categoryFilter
      const matchesLanguage = languageFilter === "all" || template.language === languageFilter
      return matchesQuery && matchesStatus && matchesCategory && matchesLanguage
    })
  }, [templates, query, statusFilter, categoryFilter, languageFilter])

  const variables = useMemo(() => extractVariables(form.subject, form.bodyText, form.bodyHtml), [form.subject, form.bodyText, form.bodyHtml])
  const unknownVariables = variables.filter((variable) => !knownVariables.includes(variable))
  const safePreviewDocument = useMemo(
    () => htmlPreviewEnabled && form.bodyHtml ? buildSafePreviewDocument(form.bodyHtml) : "",
    [htmlPreviewEnabled, form.bodyHtml]
  )

  const mappedImportRows = useMemo(() => csvRows.map((row) => mapImportRow(row, csvMapping)), [csvRows, csvMapping])
  const importValidation = useMemo(() => {
    const codes = new Set<string>(templates.map((row: TemplateRow) => lower(row.templateCode)))
    const nameSubjects = new Set<string>(templates.map((row: TemplateRow) => `${lower(row.name)}|${lower(row.subject)}`))
    return mappedImportRows.map((row) => ({ row, ...validateImportRow(row, codes, nameSubjects) }))
  }, [mappedImportRows, templates])
  const importReadyCount = importValidation.filter((row) => !row.errors.length).length
  const importInvalidCount = importValidation.filter((row) => row.errors.length).length

  useEffect(() => {
    if (!open || !mailboxId) return
    void loadStudio()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mailboxId])

  async function loadStudio(templateId?: string) {
    setLoading(true); setError("")
    const queryString = new URLSearchParams({ mailboxId })
    if (templateId) queryString.set("templateId", templateId)
    const result = await api(`/api/email-os/templates?${queryString.toString()}`)
    setLoading(false)
    if (!result.ok) {
      setError(result.error || "Template library could not be loaded")
      return
    }
    const nextTemplates = Array.isArray(result.data?.templates) ? result.data.templates : []
    setTemplates(nextTemplates)
    setStats(result.data?.stats || {})
    setPermissions(result.data?.permissions || {})
    setKnownVariables(Array.isArray(result.data?.knownVariables) ? result.data.knownVariables : [])
    setRecentImports(Array.isArray(result.data?.recentImports) ? result.data.recentImports : [])
    onTemplatesChanged?.(nextTemplates)
    if (result.data?.detail) {
      setDetail(result.data.detail)
      const next = templateToForm(result.data.detail.template)
      setForm(next); setBaseline(JSON.stringify(next)); setSelectedId(next.id)
    } else if (!selectedId && nextTemplates.length) {
      await selectTemplate(nextTemplates[0].id, nextTemplates)
    }
  }

  async function selectTemplate(id: string, source = templates) {
    setHtmlPreviewEnabled(false)
    setPreviewMode("plain")
    setSelectedId(id)
    const quick = source.find((row) => clean(row.id) === id)
    if (quick) {
      const next = templateToForm(quick)
      setForm(next); setBaseline(JSON.stringify(next))
    }
    setLoading(true); setError("")
    const result = await api(`/api/email-os/templates?mailboxId=${encodeURIComponent(mailboxId)}&templateId=${encodeURIComponent(id)}`)
    setLoading(false)
    if (!result.ok) { setError(result.error || "Template detail could not be loaded"); return }
    setDetail(result.data?.detail || null)
    if (result.data?.detail?.template) {
      const next = templateToForm(result.data.detail.template)
      setForm(next); setBaseline(JSON.stringify(next))
    }
  }

  function newTemplate() {
    setHtmlPreviewEnabled(false); setPreviewMode("plain")
    setSelectedId(""); setDetail(null); setForm(EMPTY_FORM); setBaseline(JSON.stringify(EMPTY_FORM)); setTab("editor"); setMessage("New private mailbox template")
  }

  async function saveTemplate(statusOverride?: string) {
    if (!permissions.canEdit && form.id) return
    if (!permissions.canCreate && !form.id) return
    if (!form.name.trim() || (!form.bodyText.trim() && !form.bodyHtml.trim())) {
      setError("Template name and at least one body are required")
      return
    }
    setSaving(true); setError(""); setMessage("")
    const result = await api("/api/email-os/templates", {
      method: "POST",
      body: JSON.stringify({
        action: form.id ? "update" : "create",
        mailboxId,
        ...form,
        status: statusOverride || form.status,
        tags: form.tags.split(/[|;,]/).map((tag) => tag.trim()).filter(Boolean)
      })
    })
    setSaving(false)
    if (!result.ok) { setError(result.error || "Template save failed"); return }
    const saved = result.data?.template
    setMessage(form.id ? `Version ${saved?.currentVersion || ""} saved` : "Template created")
    await loadStudio(saved?.id)
    setTab("editor")
  }

  async function runAction(action: string, extra: Record<string, unknown> = {}) {
    if (!selectedId) return null
    setSaving(true); setError(""); setMessage("")
    const result = await api("/api/email-os/templates", {
      method: "POST",
      body: JSON.stringify({ action, mailboxId, id: selectedId, ...extra })
    })
    setSaving(false)
    if (!result.ok) { setError(result.error || `Template action failed: ${action}`); return null }
    return result.data
  }

  async function archiveTemplate() {
    const result = await runAction("archive")
    if (!result) return
    setMessage("Template archived and removed from active Compose use")
    await loadStudio(selectedId)
  }

  async function restoreTemplate() {
    const result = await runAction("restore", { status: "draft" })
    if (!result) return
    setMessage("Template restored as draft")
    await loadStudio(selectedId)
  }

  async function duplicateTemplate() {
    const result = await runAction("duplicate")
    if (!result?.template) return
    setMessage("A private draft copy was created")
    await loadStudio(result.template.id)
    setTab("editor")
  }

  async function restoreVersion(versionNumber: number) {
    const result = await runAction("restore_version", { versionNumber })
    if (!result) return
    setMessage(`Version ${versionNumber} restored as a new current version`)
    await loadStudio(selectedId)
  }

  async function permanentlyDelete() {
    const result = await runAction("delete_permanent", { confirmation: deleteConfirmation })
    if (!result) return
    setDeleteOpen(false); setDeleteConfirmation(""); setSelectedId(""); setDetail(null); setForm(EMPTY_FORM); setBaseline(JSON.stringify(EMPTY_FORM))
    setMessage(`${result.templateName} permanently deleted`)
    await loadStudio()
    setTab("library")
  }

  async function insertTemplate() {
    if (!selected) return
    await api("/api/email-os/templates", {
      method: "POST",
      body: JSON.stringify({ action: "record_usage", usageAction: "inserted", mailboxId, id: selected.id })
    })
    onInsert(selected)
  }

  async function onCsvFile(file: File | null) {
    if (!file) return
    setError("")
    if (file.size > MAX_TEMPLATE_CSV_BYTES) {
      setError("CSV rejected: maximum file size is 5 MB.")
      if (fileRef.current) fileRef.current.value = ""
      return
    }
    const text = await file.text()
    const parsed = parseCsv(text)
    if (parsed.rows.length > MAX_TEMPLATE_CSV_ROWS) {
      setError(`CSV rejected: ${parsed.rows.length} rows found; maximum is ${MAX_TEMPLATE_CSV_ROWS}.`)
      if (fileRef.current) fileRef.current.value = ""
      return
    }
    setCsvFileName(file.name)
    setCsvHeaders(parsed.headers)
    setCsvRows(parsed.rows)
    setCsvMapping(autoMap(parsed.headers))
    setImportReceipt(null)
    setMessage(`${parsed.rows.length} CSV row(s) loaded for validation`)
  }

  async function commitImport() {
    if (!permissions.canImport || !importReadyCount) return
    setSaving(true); setError(""); setImportReceipt(null)
    const rows = importValidation.filter((row) => !row.errors.length).map((row) => row.row)
    const result = await api("/api/email-os/templates", {
      method: "POST",
      body: JSON.stringify({ action: "import_csv", mailboxId, fileName: csvFileName, strategy: importStrategy, rows })
    })
    setSaving(false)
    if (!result.ok) { setError(result.error || "CSV import failed"); return }
    setImportReceipt(result.data?.receipt || null)
    setMessage("CSV import completed with an auditable receipt")
    await loadStudio()
  }

  function clearImport() {
    setCsvFileName(""); setCsvHeaders([]); setCsvRows([]); setCsvMapping({}); setImportReceipt(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  function downloadCsvTemplate() {
    const sample = [
      "template_code,template_name,description,category,language,subject,body_text,body_html,tags,status,default_priority,default_cc,default_bcc,tracking_enabled,signature_mode",
      'B2B_FOLLOWUP_01,Partnership follow-up,Commercial follow-up after first contact,b2b,fr,Suite à notre échange,"Bonjour {{contact_name}},\\n\\nNous revenons vers vous au sujet de {{service}}.","<p>Bonjour {{contact_name}},</p><p>Nous revenons vers vous au sujet de {{service}}.</p>","partnership|follow-up",published,high,,,true,mailbox'
    ].join("\n")
    const blob = new Blob([sample], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url; anchor.download = "angelcare-emailos-private-templates-import.csv"; anchor.click(); URL.revokeObjectURL(url)
  }

  if (!open) return null

  const footer = tab === "editor" ? (
    <DrawerFooter
      primaryLabel={form.id ? "Save new version" : "Create private template"}
      primaryIcon={Save}
      primaryTone="sky"
      onPrimary={() => void saveTemplate()}
      disabled={saving || !form.name.trim() || (!form.bodyText.trim() && !form.bodyHtml.trim())}
      busy={saving}
      secondaryLabel="Save as draft"
      onSecondary={() => void saveTemplate("draft")}
      tertiaryLabel={form.status === "published" ? "Keep published" : "Publish"}
      onTertiary={() => void saveTemplate("published")}
      helper="Every content save creates an immutable version attributed to the current operator."
    />
  ) : tab === "import" ? (
    <DrawerFooter
      primaryLabel="Import validated rows"
      primaryIcon={Import}
      primaryTone="emerald"
      onPrimary={() => void commitImport()}
      disabled={saving || !permissions.canImport || !importReadyCount}
      busy={saving}
      secondaryLabel="Clear import"
      onSecondary={clearImport}
      tertiaryLabel="Download CSV model"
      onTertiary={downloadCsvTemplate}
      helper={`${importReadyCount} ready · ${importInvalidCount} invalid · destination locked to ${mailboxName}`}
    />
  ) : (
    <DrawerFooter
      primaryLabel="Create private template"
      primaryIcon={Plus}
      primaryTone="sky"
      onPrimary={newTemplate}
      disabled={!permissions.canCreate}
      secondaryLabel="Import CSV"
      onSecondary={() => setTab("import")}
      tertiaryLabel="Refresh library"
      onTertiary={() => void loadStudio(selectedId || undefined)}
      helper="This library is isolated to the currently unlocked mailbox."
    />
  )

  return (
    <EnterpriseDrawer
      title="Private Mailbox Templates Studio"
      eyebrow="Mailbox-isolated communication assets"
      description="Create, import, version, publish, deploy, archive and permanently erase reusable email assets dedicated exclusively to this mailbox."
      icon={BookOpen}
      tone="sky"
      width="studio"
      performanceMode="gpu-safe"
      status={`Private · ${mailboxName}`}
      progress={tab === "import" ? 4 : tab === "governance" ? 3 : 2}
      dirty={dirty}
      onClose={onClose}
      footer={footer}
    >
      <div className="rounded-[24px] border border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 p-4 text-white shadow-[0_16px_45px_rgba(15,23,42,.18)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10"><ShieldCheck className="h-5 w-5" /></div>
            <div className="min-w-0"><div className="text-[9px] font-black uppercase tracking-[.2em] text-sky-300">Private library boundary</div><div className="mt-1 truncate text-base font-black">{mailboxName}</div><div className="mt-0.5 truncate text-[10px] font-semibold text-slate-300">{mailboxEmail || mailboxId} · Templates never cross into another mailbox automatically</div></div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:min-w-[560px]">
            <MiniStat label="Total" value={stats.total || 0} />
            <MiniStat label="Published" value={stats.published || 0} tone="emerald" />
            <MiniStat label="Drafts" value={stats.drafts || 0} tone="amber" />
            <MiniStat label="Archived" value={stats.archived || 0} />
            <MiniStat label="Uses" value={stats.usage || 0} tone="violet" />
            <MiniStat label="Imported" value={stats.imported || 0} tone="sky" />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 rounded-[20px] border border-slate-200 bg-white p-2 shadow-sm">
        <StudioTabButton active={tab === "library"} label="Private library" icon={BookOpen} onClick={() => setTab("library")} />
        <StudioTabButton active={tab === "editor"} label="Template editor" icon={PencilLine} onClick={() => setTab("editor")} />
        <StudioTabButton active={tab === "import"} label="CSV import studio" icon={FileSpreadsheet} onClick={() => setTab("import")} />
        <StudioTabButton active={tab === "governance"} label="Versions & governance" icon={History} onClick={() => setTab("governance")} disabled={!selectedId} />
      </div>

      {message ? <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-800"><CheckCircle2 className="mr-2 inline h-4 w-4" />{message}</div> : null}
      {error ? <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-black text-rose-800">{error}</div> : null}

      {tab === "library" ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <DrawerSection eyebrow="Discovery" title="Mailbox library" description="Search and filter only the assets owned by this mailbox." icon={Search} tone="sky">
            <div className="relative"><Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, code, subject, body or tag…" className={`${drawerInputClass} pl-11`} /></div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={drawerInputClass}><option value="active">Active</option><option value="all">All</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className={drawerInputClass}><option value="all">All categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
              <select value={languageFilter} onChange={(event) => setLanguageFilter(event.target.value)} className={drawerInputClass}><option value="all">All languages</option>{languages.map((language) => <option key={language} value={language}>{language}</option>)}</select>
            </div>
            <div className="mt-4 max-h-[62vh] space-y-2 overflow-y-auto pr-1">
              {loading ? <DrawerEmptyState title="Loading private library" description="Resolving mailbox-scoped templates and current versions…" /> : filteredTemplates.length ? filteredTemplates.map((template) => (
                <button key={template.id} type="button" onClick={() => void selectTemplate(template.id)} className={`w-full rounded-[18px] border p-3 text-left transition ${selectedId === template.id ? "border-sky-400 bg-sky-50 shadow-sm" : "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/50"}`}>
                  <div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="truncate text-sm font-black text-slate-950">{template.name}</div><div className="mt-1 truncate text-[9px] font-black uppercase tracking-[.12em] text-slate-400">{template.templateCode}</div></div><StatusBadge status={template.status} /></div>
                  <div className="mt-2 line-clamp-2 text-[10px] font-semibold leading-4 text-slate-500">{template.subject || "No subject"}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5"><DrawerEvidenceBadge label={template.category || "other"} tone="sky" icon={Tag} /><DrawerEvidenceBadge label={template.language || "fr"} tone="slate" icon={Languages} /><DrawerEvidenceBadge label={`v${template.currentVersion || 1}`} tone="violet" icon={History} /></div>
                  <div className="mt-2 flex items-center justify-between text-[9px] font-bold text-slate-400"><span>{template.usageCount || 0} uses</span><span>{relativeDate(template.updatedAt)}</span></div>
                </button>
              )) : <DrawerEmptyState title="No template matches this view" description="Create a private template or adjust the library filters." />}
            </div>
          </DrawerSection>

          {selected ? (
            <div className="space-y-4">
              <DrawerSection eyebrow="Selected asset" title={selected.name} description={selected.description || "Private reusable email asset"} icon={FileText} tone="indigo">
                <div className="flex flex-wrap gap-2"><StatusBadge status={selected.status} /><DrawerEvidenceBadge label={`Private · ${mailboxName}`} tone="indigo" icon={ShieldCheck} /><DrawerEvidenceBadge label={`${selected.usageCount || 0} uses`} tone="violet" icon={Send} /></div>
                <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50 p-4"><div className="text-[8px] font-black uppercase tracking-[.16em] text-slate-400">Subject</div><div className="mt-1 text-base font-black text-slate-950">{selected.subject || "(No subject)"}</div><div className="mt-4 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">{selected.bodyText || selected.bodyHtml?.replace(/<[^>]+>/g, " ") || "No body"}</div></div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <ActionButton label="Insert into Compose" icon={Send} tone="primary" onClick={() => void insertTemplate()} disabled={selected.status === "archived"} />
                  <ActionButton label="Edit & version" icon={PencilLine} onClick={() => setTab("editor")} disabled={!permissions.canEdit} />
                  <ActionButton label="Duplicate" icon={Copy} onClick={() => void duplicateTemplate()} disabled={!permissions.canCreate} />
                  {selected.status === "archived" ? <ActionButton label="Restore as draft" icon={RotateCcw} onClick={() => void restoreTemplate()} disabled={!permissions.canArchive} /> : <ActionButton label="Archive" icon={Archive} tone="warning" onClick={() => void archiveTemplate()} disabled={!permissions.canArchive} />}
                </div>
              </DrawerSection>
              <div className="grid gap-3 sm:grid-cols-3">
                <DrawerMetric label="Current version" value={`v${selected.currentVersion || 1}`} helper={selected.changeSummary || "Current approved content"} tone="violet" icon={History} />
                <DrawerMetric label="Last updated" value={relativeDate(selected.updatedAt)} helper={formatDate(selected.updatedAt)} tone="sky" icon={Clock3} />
                <DrawerMetric label="Default policy" value={selected.defaultPriority || "normal"} helper={`${selected.trackingEnabled ? "Tracking on" : "Tracking off"} · ${selected.signatureMode || "mailbox"} signature`} tone="emerald" icon={ShieldCheck} />
              </div>
            </div>
          ) : <DrawerEmptyState title="Select a private template" description="Choose an asset from the mailbox library to preview, deploy or govern it." />}
        </div>
      ) : null}

      {tab === "editor" ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,.92fr)]">
          <div className="space-y-4">
            <DrawerSection eyebrow="Identity & governance" title={form.id ? `Edit ${form.name}` : "Create private mailbox template"} description="The destination mailbox is fixed by the active Email-OS workspace and cannot be injected through form or CSV data." icon={PencilLine} tone="indigo">
              <div className="grid gap-3 md:grid-cols-2">
                <DrawerField label="Template code" required hint="Unique inside this mailbox; used for CSV updates and governance."><input value={form.templateCode} onChange={(event) => setForm((current) => ({ ...current, templateCode: event.target.value }))} placeholder="B2B_FOLLOWUP_01" className={drawerInputClass} /></DrawerField>
                <DrawerField label="Template name" required><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Partnership follow-up" className={drawerInputClass} /></DrawerField>
                <DrawerField label="Category"><select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className={drawerInputClass}><option value="parent_client">Parent / client</option><option value="b2b">B2B</option><option value="partnership">Partnership</option><option value="recruitment">Recruitment</option><option value="finance_payment">Finance / payment</option><option value="complaint">Complaint</option><option value="supplier">Supplier</option><option value="internal">Internal</option><option value="other">Other</option></select></DrawerField>
                <DrawerField label="Language"><select value={form.language} onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))} className={drawerInputClass}><option value="fr">French</option><option value="en">English</option><option value="ar">Arabic</option><option value="es">Spanish</option></select></DrawerField>
                <div className="md:col-span-2"><DrawerField label="Internal description"><input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="When and why operators should use this template" className={drawerInputClass} /></DrawerField></div>
                <div className="md:col-span-2"><DrawerField label="Tags" hint="Separate tags with |, comma or semicolon."><input value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} placeholder="partnership | follow-up | priority" className={drawerInputClass} /></DrawerField></div>
              </div>
            </DrawerSection>

            <DrawerSection eyebrow="Content studio" title="Subject, plain text and governed HTML" description="Every save creates a new immutable version; previous email history is never rewritten." icon={FileText} tone="sky">
              <DrawerField label="Subject template"><input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} placeholder="Suite à notre échange avec {{company_name}}" className={drawerInputClass} /></DrawerField>
              <div className="mt-3"><DrawerField label="Plain-text body" required><textarea value={form.bodyText} onChange={(event) => setForm((current) => ({ ...current, bodyText: event.target.value }))} placeholder="Bonjour {{contact_name}}, …" className={`${drawerTextareaClass} min-h-[260px]`} /></DrawerField></div>
              <div className="mt-3"><DrawerField label="HTML body" hint="Optional. Scripts and unsafe event handlers are rejected."><textarea value={form.bodyHtml} onChange={(event) => { setHtmlPreviewEnabled(false); setForm((current) => ({ ...current, bodyHtml: event.target.value })) }} placeholder="<p>Bonjour {{contact_name}},</p>" className={`${drawerTextareaClass} min-h-[190px] font-mono text-xs`} /></DrawerField></div>
              <div className="mt-3"><DrawerField label="Version change summary" hint="Explain what changed for future reviewers."><input value={form.changeSummary} onChange={(event) => setForm((current) => ({ ...current, changeSummary: event.target.value }))} placeholder="Updated partnership qualification wording" className={drawerInputClass} /></DrawerField></div>
            </DrawerSection>

            <DrawerSection eyebrow="Compose defaults" title="Sending behavior attached to this asset" description="Defaults are applied when the operator inserts the template into Compose." icon={SettingsIcon} tone="emerald">
              <div className="grid gap-3 md:grid-cols-2">
                <DrawerField label="Default priority"><select value={form.defaultPriority} onChange={(event) => setForm((current) => ({ ...current, defaultPriority: event.target.value }))} className={drawerInputClass}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option><option value="vip">VIP</option></select></DrawerField>
                <DrawerField label="Signature policy"><select value={form.signatureMode} onChange={(event) => setForm((current) => ({ ...current, signatureMode: event.target.value }))} className={drawerInputClass}><option value="mailbox">Mailbox signature</option><option value="operator">Operator signature</option><option value="department">Department signature</option><option value="none">No automatic signature</option></select></DrawerField>
                <DrawerField label="Default CC"><input value={form.defaultCc} onChange={(event) => setForm((current) => ({ ...current, defaultCc: event.target.value }))} placeholder="team@angelcare…" className={drawerInputClass} /></DrawerField>
                <DrawerField label="Default BCC"><input value={form.defaultBcc} onChange={(event) => setForm((current) => ({ ...current, defaultBcc: event.target.value }))} placeholder="audit@angelcare…" className={drawerInputClass} /></DrawerField>
              </div>
              <label className="mt-3 flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3"><div><div className="text-xs font-black text-slate-950">Open tracking by default</div><div className="mt-0.5 text-[10px] font-semibold text-slate-500">Compose can still override this setting before sending.</div></div><input type="checkbox" checked={form.trackingEnabled} onChange={(event) => setForm((current) => ({ ...current, trackingEnabled: event.target.checked }))} className="h-5 w-5 rounded border-slate-300 text-sky-600" /></label>
            </DrawerSection>
          </div>

          <div className="space-y-4 xl:sticky xl:top-0 xl:self-start">
            <DrawerSection eyebrow="Live preview" title="Recipient-facing rendering" description="Inspect desktop, mobile, plain-text and variable states before saving." icon={Eye} tone="violet">
              <div className="flex flex-wrap gap-2"><PreviewButton active={previewMode === "desktop"} label="Desktop" icon={Monitor} onClick={() => { setHtmlPreviewEnabled(false); setPreviewMode("desktop") }} /><PreviewButton active={previewMode === "mobile"} label="Mobile" icon={Smartphone} onClick={() => { setHtmlPreviewEnabled(false); setPreviewMode("mobile") }} /><PreviewButton active={previewMode === "plain"} label="Plain text" icon={FileText} onClick={() => { setHtmlPreviewEnabled(false); setPreviewMode("plain") }} /><PreviewButton active={previewMode === "variables"} label="Variables" icon={Variable} onClick={() => { setHtmlPreviewEnabled(false); setPreviewMode("variables") }} /></div>
              <div className={`mt-4 overflow-hidden rounded-[22px] border border-slate-200 bg-slate-100 p-3 [contain:layout_paint] ${previewMode === "mobile" ? "mx-auto max-w-[360px]" : ""}`}>
                {previewMode === "variables" ? (
                  <div className="space-y-2">
                    {variables.length ? variables.map((variable) => <div key={variable} className={`flex items-center justify-between rounded-xl border px-3 py-2 ${unknownVariables.includes(variable) ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}><code className="text-xs font-black text-slate-800">{`{{${variable}}}`}</code><span className={`text-[9px] font-black uppercase ${unknownVariables.includes(variable) ? "text-amber-700" : "text-emerald-700"}`}>{unknownVariables.includes(variable) ? "Unknown" : "Supported"}</span></div>) : <DrawerEmptyState title="No variables detected" description="Add controlled placeholders to personalize templates at insertion time." />}
                  </div>
                ) : previewMode === "plain" ? (
                  <div className="min-h-[320px] whitespace-pre-wrap rounded-2xl bg-white p-5 text-sm font-semibold leading-6 text-slate-700 shadow-sm"><div className="border-b border-slate-200 pb-3 font-black text-slate-950">{form.subject || "(No subject)"}</div><div className="pt-4">{form.bodyText || "No plain-text body yet."}</div></div>
                ) : (
                  <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-5 py-4"><div className="text-[9px] font-black uppercase tracking-[.15em] text-slate-400">Subject</div><div className="mt-1 text-base font-black text-slate-950">{form.subject || "(No subject)"}</div></div>
                    {form.bodyHtml ? htmlPreviewEnabled ? (
                      <div>
                        <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-4 py-2"><div className="text-[9px] font-black uppercase tracking-[.12em] text-amber-800">GPU-safe isolated preview</div><button type="button" onClick={() => setHtmlPreviewEnabled(false)} className="rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-[9px] font-black text-amber-800">Stop preview</button></div>
                        <iframe title="Template HTML preview" sandbox="" referrerPolicy="no-referrer" loading="lazy" srcDoc={safePreviewDocument} className="h-[360px] w-full bg-white" style={{ contain: "strict", colorScheme: "light" }} />
                      </div>
                    ) : (
                      <div className="flex min-h-[320px] flex-col items-center justify-center p-6 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><ShieldCheck className="h-5 w-5" /></div><div className="mt-3 text-sm font-black text-slate-950">HTML preview is paused for workstation safety</div><div className="mt-1 max-w-sm text-[10px] font-semibold leading-5 text-slate-500">External resources are blocked, animations and GPU filters are disabled, and oversized HTML is truncated.</div><button type="button" onClick={() => setHtmlPreviewEnabled(true)} className="mt-4 rounded-2xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white shadow-sm">Render safe HTML preview</button></div>
                    ) : (
                      <div className="min-h-[360px] whitespace-pre-wrap p-5 text-sm font-semibold leading-6 text-slate-700">{form.bodyText || "No message body yet."}</div>
                    )}
                  </div>
                )}
              </div>
            </DrawerSection>
            <DrawerCallout title={unknownVariables.length ? "Unknown variables require review" : "Variable governance passed"} description={unknownVariables.length ? `Review: ${unknownVariables.join(", ")}. Unknown required variables can remain unresolved in Compose.` : `${variables.length} variable(s) detected and supported by the current Email-OS context.`} tone={unknownVariables.length ? "amber" : "emerald"} icon={Sparkles} />
            <DrawerSection eyebrow="Ownership" title="Private mailbox attribution" description="The asset and every version remain attributed to authenticated operators." icon={UserCheck} tone="slate"><div className="grid grid-cols-2 gap-2"><InfoTile label="Mailbox" value={mailboxName} /><InfoTile label="Current operator" value={currentUser?.fullName || currentUser?.name || currentUser?.email || "Current operator"} /><InfoTile label="Status" value={form.status} /><InfoTile label="Version" value={form.id ? `v${selected?.currentVersion || 1}` : "New"} /></div></DrawerSection>
          </div>
        </div>
      ) : null}

      {tab === "import" ? (
        <div className="mt-4 space-y-4">
          <DrawerSection eyebrow="Step 1" title="Upload the private-library CSV" description="The destination mailbox is taken from the current unlocked workspace. A CSV cannot provide or override mailbox_id." icon={Upload} tone="sky">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <label className="flex cursor-pointer items-center gap-3 rounded-[20px] border-2 border-dashed border-sky-200 bg-sky-50/60 p-5 transition hover:border-sky-400 hover:bg-sky-50"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white"><FileSpreadsheet className="h-5 w-5" /></div><div className="min-w-0"><div className="text-sm font-black text-slate-950">{csvFileName || "Select CSV file"}</div><div className="mt-1 text-[10px] font-semibold text-slate-500">Quoted commas and multi-line content are supported · maximum 1,000 rows</div></div><input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void onCsvFile(event.target.files?.[0] || null)} /></label>
              <button type="button" onClick={downloadCsvTemplate} className="rounded-[20px] border border-slate-200 bg-white px-5 py-3 text-xs font-black text-slate-700 shadow-sm hover:border-sky-200 hover:bg-sky-50"><FileDown className="mr-2 inline h-4 w-4" />Download model</button>
            </div>
          </DrawerSection>

          {csvHeaders.length ? <DrawerSection eyebrow="Step 2" title="Map CSV columns" description="Confirm how the uploaded columns map into the governed template model." icon={ArrowMapIcon} tone="indigo"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{FIELD_DEFINITIONS.map((field) => <DrawerField key={field.key} label={field.label} required={field.required}><select value={csvMapping[field.key] || ""} onChange={(event) => setCsvMapping((current) => ({ ...current, [field.key]: event.target.value }))} className={drawerInputClass}><option value="">Not mapped</option>{csvHeaders.map((header) => <option key={header} value={header}>{header}</option>)}</select></DrawerField>)}</div></DrawerSection> : null}

          {csvRows.length ? <DrawerSection eyebrow="Step 3" title="Validate and resolve conflicts" description="No row is inserted until this preview is confirmed. Validation is repeated by the server during commit." icon={ShieldCheck} tone="emerald"><div className="grid gap-3 sm:grid-cols-4"><DrawerMetric label="CSV rows" value={csvRows.length} helper="Uploaded records" tone="sky" icon={FileSpreadsheet} /><DrawerMetric label="Ready" value={importReadyCount} helper="Can be committed" tone="emerald" icon={CheckCircle2} /><DrawerMetric label="Invalid" value={importInvalidCount} helper="Excluded from import" tone={importInvalidCount ? "rose" : "slate"} icon={X} /><DrawerMetric label="Warnings" value={importValidation.filter((row) => row.warnings.length).length} helper="Duplicates or weak fields" tone="amber" icon={ShieldCheck} /></div><div className="mt-4 grid gap-3 lg:grid-cols-[300px_1fr]"><DrawerField label="Conflict strategy"><select value={importStrategy} onChange={(event) => setImportStrategy(event.target.value)} className={drawerInputClass}><option value="create_new">Create new only</option><option value="skip_duplicates">Skip duplicates</option><option value="update_matching_codes">Update matching template codes</option><option value="create_duplicates">Create duplicates with new codes</option></select></DrawerField><DrawerCallout title="Mailbox injection protection" description={`Every accepted row will be written only to ${mailboxName}. Any mailbox column in the CSV is ignored.`} tone="sky" icon={ShieldCheck} /></div><div className="mt-4 max-h-[46vh] overflow-auto rounded-[20px] border border-slate-200"><table className="w-full min-w-[860px] text-left text-[10px]"><thead className="sticky top-0 bg-slate-100 text-slate-500"><tr><th className="p-3">Row</th><th className="p-3">Code</th><th className="p-3">Name</th><th className="p-3">Category</th><th className="p-3">Status</th><th className="p-3">Validation</th></tr></thead><tbody>{importValidation.slice(0, 200).map((entry, index) => <tr key={index} className="border-t border-slate-100 bg-white"><td className="p-3 font-black">{index + 2}</td><td className="p-3 font-mono font-bold">{entry.row.templateCode || "—"}</td><td className="p-3 font-black text-slate-900">{entry.row.name || "—"}</td><td className="p-3">{entry.row.category}</td><td className="p-3">{entry.row.status}</td><td className="p-3">{entry.errors.length ? <span className="font-black text-rose-700">Invalid · {entry.errors.join("; ")}</span> : entry.warnings.length ? <span className="font-black text-amber-700">Warning · {entry.warnings.join("; ")}</span> : <span className="font-black text-emerald-700">Ready</span>}</td></tr>)}</tbody></table></div></DrawerSection> : null}

          {importReceipt ? <DrawerSection eyebrow="Step 4" title="Import receipt" description="The completed job is retained for mailbox-level audit and reconciliation." icon={CheckCircle2} tone="emerald"><div className="grid gap-3 sm:grid-cols-5"><DrawerMetric label="Total" value={importReceipt.total || 0} tone="sky" /><DrawerMetric label="Created" value={importReceipt.created || 0} tone="emerald" /><DrawerMetric label="Updated" value={importReceipt.updated || 0} tone="violet" /><DrawerMetric label="Skipped" value={importReceipt.skipped || 0} tone="amber" /><DrawerMetric label="Invalid" value={importReceipt.invalid || 0} tone="rose" /></div></DrawerSection> : null}
        </div>
      ) : null}

      {tab === "governance" ? selected ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <DrawerSection eyebrow="Version history" title={`${selected.name} · v${selected.currentVersion || 1}`} description="Review, compare context and restore an older version as a new current version." icon={History} tone="violet"><div className="space-y-2">{detail?.versions?.length ? detail.versions.map((version: any) => <div key={version.id} className="rounded-[18px] border border-slate-200 bg-white p-3"><div className="flex items-start justify-between gap-3"><div><div className="text-sm font-black text-slate-950">Version {version.version_number}{Number(version.version_number) === Number(selected.currentVersion) ? " · Current" : ""}</div><div className="mt-1 text-[10px] font-semibold text-slate-500">{version.change_summary || "Saved template version"} · {formatDate(version.created_at)}</div></div>{Number(version.version_number) !== Number(selected.currentVersion) && permissions.canEdit ? <button type="button" onClick={() => void restoreVersion(Number(version.version_number))} className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-[10px] font-black text-violet-700">Restore</button> : <DrawerEvidenceBadge label="Current" tone="emerald" icon={CheckCircle2} />}</div><details className="mt-2 rounded-xl bg-slate-50 px-3 py-2"><summary className="cursor-pointer text-[10px] font-black text-slate-600">Inspect content</summary><div className="mt-2 border-t border-slate-200 pt-2"><div className="font-black text-slate-900">{version.subject_template || "(No subject)"}</div><div className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-[10px] font-semibold leading-4 text-slate-600">{version.body_text || version.body_html || "No content"}</div></div></details></div>) : <DrawerEmptyState title="No version history" description="Save the template to create its first immutable version." />}</div></DrawerSection>
            <DrawerSection eyebrow="Audit trail" title="Operator actions" description="Content-free governance events explain who created, edited, deployed, archived or restored the asset." icon={ShieldCheck} tone="slate"><div className="space-y-2">{detail?.audit?.length ? detail.audit.map((event: any) => <DrawerTimelineItem key={event.id} title={clean(event.event_type).replace(/_/g, " ")} description={event.actor_name_snapshot || "AngelCare operator"} meta={formatDate(event.created_at)} tone={event.event_type?.includes("delete") ? "rose" : event.event_type?.includes("publish") ? "emerald" : "violet"} />) : <DrawerEmptyState title="No audit events yet" description="Governance events will appear after the first template action." />}</div></DrawerSection>
          </div>
          <div className="space-y-4 xl:sticky xl:top-0 xl:self-start">
            <DrawerSection eyebrow="Usage intelligence" title="Deployment history" description="See when this private template was inserted, previewed, sent or restored." icon={Send} tone="sky"><div className="grid grid-cols-2 gap-2"><InfoTile label="Usage count" value={String(selected.usageCount || 0)} /><InfoTile label="Last used" value={relativeDate(selected.lastUsedAt)} /><InfoTile label="Current version" value={`v${selected.currentVersion || 1}`} /><InfoTile label="Status" value={selected.status} /></div><div className="mt-3 max-h-64 space-y-2 overflow-y-auto">{detail?.usage?.length ? detail.usage.map((event: any) => <div key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"><div className="text-[10px] font-black capitalize text-slate-800">{event.action}</div><div className="mt-0.5 text-[9px] font-semibold text-slate-400">Version {event.version_number || "—"} · {formatDate(event.created_at)}</div></div>) : <div className="text-[10px] font-semibold text-slate-400">No usage events yet.</div>}</div></DrawerSection>
            <DrawerSection eyebrow="Lifecycle controls" title="Archive or permanently erase" description="Archive is reversible. Permanent deletion removes all subject/body versions and cannot be restored." icon={Trash2} tone="rose"><div className="space-y-2">{selected.status === "archived" ? <ActionButton label="Restore as draft" icon={RotateCcw} onClick={() => void restoreTemplate()} disabled={!permissions.canArchive} /> : <ActionButton label="Archive template" icon={Archive} tone="warning" onClick={() => void archiveTemplate()} disabled={!permissions.canArchive} />}<ActionButton label="Delete permanently" icon={Trash2} tone="danger" onClick={() => setDeleteOpen(true)} disabled={!permissions.canDeletePermanent} /></div>{!permissions.canDeletePermanent ? <div className="mt-3 text-[10px] font-semibold text-slate-500">Permanent deletion requires both template-management and mailbox-delete permissions.</div> : null}</DrawerSection>
            <DrawerSection eyebrow="Recent imports" title="Mailbox import jobs" description="Review the latest CSV operations executed against this private library." icon={Import} tone="amber"><div className="space-y-2">{recentImports.length ? recentImports.slice(0, 6).map((job) => <div key={job.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="text-[10px] font-black text-slate-900">{job.file_name || "templates.csv"}</div><div className="mt-1 text-[9px] font-semibold text-slate-500">{job.created_rows || 0} created · {job.updated_rows || 0} updated · {job.invalid_rows || 0} invalid</div><div className="mt-1 text-[8px] font-bold text-slate-400">{formatDate(job.created_at)}</div></div>) : <div className="text-[10px] font-semibold text-slate-400">No CSV import jobs yet.</div>}</div></DrawerSection>
          </div>
        </div>
      ) : <DrawerEmptyState title="Select a template first" description="Version, usage, audit and deletion controls belong to a specific mailbox template." /> : null}

      {deleteOpen && selected ? <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-slate-950/78 p-5"><div className="w-full max-w-lg rounded-[30px] border border-rose-200 bg-white p-6 shadow-2xl"><div className="flex items-start gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700"><Trash2 className="h-5 w-5" /></div><div><div className="text-xl font-black text-slate-950">Permanently delete template?</div><div className="mt-1 text-sm font-semibold leading-6 text-slate-600">This removes the template, all {detail?.versions?.length || 0} subject/body versions and {detail?.usage?.length || 0} usage records from {mailboxName}. Only a content-free deletion audit receipt remains.</div></div></div><div className="mt-5 rounded-[20px] border border-rose-200 bg-rose-50 p-4"><div className="text-[9px] font-black uppercase tracking-[.15em] text-rose-600">Template</div><div className="mt-1 text-base font-black text-slate-950">{selected.name}</div><div className="mt-1 text-[10px] font-semibold text-slate-500">{selected.templateCode} · v{selected.currentVersion || 1} · {selected.usageCount || 0} uses</div></div><div className="mt-5"><DrawerField label="Type DELETE TEMPLATE to confirm" required><input autoFocus value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} className={drawerInputClass} /></DrawerField></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => { setDeleteOpen(false); setDeleteConfirmation("") }} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700">Cancel</button><button type="button" onClick={() => void permanentlyDelete()} disabled={deleteConfirmation !== "DELETE TEMPLATE" || saving} className="h-11 rounded-2xl bg-rose-600 px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">Delete permanently</button></div></div></div> : null}
    </EnterpriseDrawer>
  )
}

function MiniStat({ label, value, tone = "slate" }: { label: string; value: number | string; tone?: "slate" | "emerald" | "amber" | "violet" | "sky" }) {
  const colors = { slate: "text-white", emerald: "text-emerald-300", amber: "text-amber-300", violet: "text-violet-300", sky: "text-sky-300" }
  return <div className="rounded-xl border border-white/10 bg-white/[.08] px-2.5 py-2"><div className="text-[7px] font-black uppercase tracking-[.14em] text-white/60">{label}</div><div className={`mt-0.5 text-base font-black ${colors[tone]}`}>{value}</div></div>
}

function StudioTabButton({ active, label, icon: Icon, onClick, disabled }: { active: boolean; label: string; icon: any; onClick: () => void; disabled?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex h-10 items-center gap-2 rounded-[14px] border px-3 text-[10px] font-black transition disabled:opacity-40 ${active ? "border-sky-500 bg-sky-600 text-white shadow-sm" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"}`}><Icon className="h-3.5 w-3.5" />{label}</button>
}

function PreviewButton({ active, label, icon: Icon, onClick }: { active: boolean; label: string; icon: any; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[9px] font-black ${active ? "border-violet-500 bg-violet-600 text-white" : "border-slate-200 bg-white text-slate-600"}`}><Icon className="h-3.5 w-3.5" />{label}</button>
}

function StatusBadge({ status }: { status: string }) {
  const normalized = lower(status)
  const classes = normalized === "published" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : normalized === "archived" ? "border-slate-200 bg-slate-100 text-slate-600" : "border-amber-200 bg-amber-50 text-amber-700"
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[.12em] ${classes}`}>{normalized || "draft"}</span>
}

function ActionButton({ label, icon: Icon, onClick, tone = "neutral", disabled }: { label: string; icon: any; onClick: () => void; tone?: "neutral" | "primary" | "warning" | "danger"; disabled?: boolean }) {
  const classes = tone === "primary" ? "border-sky-600 bg-sky-600 text-white hover:bg-sky-700" : tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" : tone === "danger" ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100" : "border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50"
  return <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border px-3 text-[10px] font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${classes}`}><Icon className="h-4 w-4" />{label}</button>
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-3"><div className="text-[8px] font-black uppercase tracking-[.14em] text-slate-400">{label}</div><div className="mt-1 truncate text-xs font-black capitalize text-slate-900">{value || "—"}</div></div>
}

// Local aliases keep the template studio isolated from the main command-center icon vocabulary.
const SettingsIcon = ListFilter
const ArrowMapIcon = ChevronRight
