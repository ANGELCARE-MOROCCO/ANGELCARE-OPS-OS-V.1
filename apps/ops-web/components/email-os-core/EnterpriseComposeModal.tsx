"use client"

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ClipboardEvent, type FormEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from "react"
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  AtSign,
  Bold,
  Bot,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock3,
  Copy,
  ExternalLink,
  Eye,
  FileArchive,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Globe2,
  Highlighter,
  Inbox,
  Italic,
  Link2,
  List,
  ListOrdered,
  LockKeyhole,
  Mail,
  MailCheck,
  Maximize2,
  MessageSquareText,
  Minimize2,
  MoreHorizontal,
  Paperclip,
  PanelLeft,
  PanelRight,
  Quote,
  Redo2,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Underline,
  Undo2,
  UserRound,
  Variable,
  WandSparkles,
  X
} from "lucide-react"

type Props = {
  open: boolean
  mode: "compose" | "reply" | "forward" | "schedule"
  mailboxes?: any[]
  selectedEmail?: any
  mailboxScopeLocked?: boolean
  initialMailboxId?: string
  initialRecipients?: Array<{ name?: string; email: string }>
  initialSubject?: string
  initialBody?: string
  initialCc?: string
  initialBcc?: string
  initialPriority?: string
  initialTracking?: boolean
  initialTemplateId?: string
  initialTemplateVersion?: number
  onClose: () => void
  onDone?: (event?: { type: "sent" | "draft" | "scheduled" }) => void
}

type ComposeTemplate = {
  id: string
  name: string
  subject: string
  body: string
  category?: string
  priority?: string
  language?: string
  description?: string
  tags?: string[]
  raw?: any
}

type ComposeMailbox = {
  id: string
  name: string
  email: string
  status?: string
  department?: string
  provider?: string
  raw?: any
}

type Recipient = {
  name?: string
  email: string
}

type ComposeAttachment = {
  id: string
  name: string
  size: string
  sizeBytes?: number
  source: "storage" | "legacy" | "drive"
  mimeType?: string
  contentBase64?: string
  fileId?: string
  storageBucket?: string
  storageKey?: string
  storageStatus?: string
  downloadUrl?: string
  url?: string
}

type CompletionState = {
  type: "sent" | "draft" | "scheduled" | "error"
  title: string
  message: string
  reference?: string
  detail?: string
}

type RightRailTab = "templates" | "variables" | "delivery"

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) }
  })
  const json = await res.json().catch(() => null)
  return {
    ok: res.ok && json?.ok !== false,
    data: json?.data ?? json,
    error: json?.error || (!res.ok ? `HTTP ${res.status}` : null)
  }
}

function clean(value: unknown) {
  return String(value ?? "").trim()
}

function senderOf(email: any) {
  return email?.from_email || email?.fromEmail || email?.sender || email?.email || ""
}

function subjectOf(email: any) {
  return email?.subject || ""
}

function niceName(email: string) {
  const base = String(email || "").split("@")[0] || "Contact"
  return base
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() || ""}${part.slice(1)}`)
    .join(" ")
}

function titleCaseWords(value: string) {
  return value
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function inferFirstName(value: string) {
  const cleaned = value.replace(/<[^>]+>/g, " ").replace(/["']/g, " ").trim()
  const local = cleaned.includes("@") ? cleaned.split("@")[0] : cleaned
  const first = local.split(/[.\s_-]+/).filter(Boolean)[0] || ""
  return titleCaseWords(first) || "Madame, Monsieur"
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(value))
}

function isExternalEmail(value: string) {
  const domain = clean(value).toLowerCase().split("@")[1] || ""
  return Boolean(domain && !domain.endsWith("angelcare.ma") && !domain.endsWith("angelcarehub.com"))
}

function normalizeTemplateText(value: unknown) {
  return String(value || "").replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\r\n/g, "\n")
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function toEditorHtml(value: unknown) {
  const raw = normalizeTemplateText(value)
  if (!raw.trim()) return ""
  if (/<[a-z][\s\S]*>/i.test(raw)) return sanitizeComposeHtml(raw)

  return raw
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("")
}

function sanitizeComposeHtml(value: unknown) {
  const raw = String(value || "")
  if (typeof window === "undefined") {
    return raw
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/\son\w+\s*=\s*(["']).*?\1/gi, "")
      .replace(/javascript:/gi, "")
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(raw, "text/html")
  doc.querySelectorAll("script, iframe, object, embed, form, input, button, style").forEach((node) => node.remove())
  doc.querySelectorAll("*").forEach((node) => {
    for (const attribute of Array.from(node.attributes)) {
      if (/^on/i.test(attribute.name)) node.removeAttribute(attribute.name)
      if ((attribute.name === "href" || attribute.name === "src") && /^javascript:/i.test(attribute.value)) {
        node.removeAttribute(attribute.name)
      }
    }
  })
  return doc.body.innerHTML
}

function stripHtml(value: unknown) {
  return String(value || "")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
}

function safeComposeStatus(value: unknown) {
  const text = String(value || "Prêt").trim()
  if (!text) return "Prêt"
  if (/attachments?\s+is\s+not\s+defined/i.test(text)) {
    return "Le gestionnaire de pièces jointes est opérationnel."
  }
  if (/referenceerror|typeerror|syntaxerror/i.test(text)) {
    return "État de composition indisponible. Actualisez puis réessayez."
  }
  return text
}

function quoteOriginal(selectedEmail: any) {
  const originalBody = selectedEmail?.body || selectedEmail?.bodyText || selectedEmail?.preview || ""
  const sender = senderOf(selectedEmail) || "Expéditeur inconnu"
  const subject = subjectOf(selectedEmail) || "Sans objet"
  const date = selectedEmail?.received_at || selectedEmail?.receivedAt || selectedEmail?.created_at || ""

  return `<div style="margin-top:28px;padding-top:20px;border-top:1px solid #dbe5f0;color:#64748b;font-size:13px;line-height:1.7">
    <div style="font-weight:700;color:#334155;margin-bottom:8px">Message d’origine</div>
    <div><strong>De :</strong> ${escapeHtml(sender)}</div>
    <div><strong>Objet :</strong> ${escapeHtml(subject)}</div>
    ${date ? `<div><strong>Date :</strong> ${escapeHtml(String(date))}</div>` : ""}
    <div style="margin-top:14px">${toEditorHtml(originalBody)}</div>
  </div>`
}

function extractTemplateVariables(...values: unknown[]) {
  const variables = new Set<string>()
  const matcher = /\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g
  for (const value of values) {
    const text = String(value || "")
    let match: RegExpExecArray | null
    while ((match = matcher.exec(text))) variables.add(match[1])
  }
  return Array.from(variables).sort()
}

function replaceTemplateVariables(value: unknown, variables: Record<string, string>) {
  return String(value || "").replace(/\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g, (token, key) => {
    const replacement = clean(variables[key])
    return replacement || token
  })
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB"
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function modeCopy(mode: Props["mode"]) {
  if (mode === "reply") return { title: "Répondre", subtitle: "Réponse sécurisée dans la conversation active" }
  if (mode === "forward") return { title: "Transférer", subtitle: "Transmission contrôlée du message et de son contexte" }
  if (mode === "schedule") return { title: "Programmer un message", subtitle: "Préparer une communication pour envoi différé" }
  return { title: "Nouveau message", subtitle: "Studio de communication externe Email OS" }
}

function mailboxSignature(mailbox?: ComposeMailbox | null) {
  const identity = `${mailbox?.id || ""} ${mailbox?.email || ""} ${mailbox?.name || ""}`.toLowerCase()

  if (identity.includes("academy")) {
    return { unit: "ACADEMY", line1: "Développer les compétences.", line2: "Transformer durablement les pratiques." }
  }
  if (identity.includes("partenaires") || identity.includes("partner")) {
    return { unit: "PARTENARIATS", line1: "Construire des relations de confiance.", line2: "Déployer des collaborations durables." }
  }
  if (identity.includes("commercial")) {
    return { unit: "COMMERCIAL", line1: "Développement commercial.", line2: "Relations clients et croissance." }
  }
  if (identity.includes("support")) {
    return { unit: "SUPPORT", line1: "Relation client.", line2: "Réponse structurée et continuité de service." }
  }
  if (identity.includes("ops") || identity.includes("operations")) {
    return { unit: "OPÉRATIONS", line1: "Coordination opérationnelle.", line2: "Exécution terrain et continuité de service." }
  }
  if (identity.includes("rh") || identity.includes("hr")) {
    return { unit: "RESSOURCES HUMAINES", line1: "Accompagner les équipes.", line2: "Structurer les opérations humaines." }
  }
  if (identity.includes("homeservice") || identity.includes("home")) {
    return { unit: "HOME SERVICE", line1: "Services premium à domicile.", line2: "Accompagnement des familles et excellence terrain." }
  }
  if (identity.includes("b2b")) {
    return { unit: "B2B", line1: "Solutions professionnelles.", line2: "Partenariats institutionnels et performance." }
  }
  if (identity.includes("montessori")) {
    return { unit: "MONTESSORI", line1: "Apprentissage structuré.", line2: "Développement intentionnel par la pratique." }
  }
  if (identity.includes("events") || identity.includes("excursions")) {
    return { unit: "ÉVÉNEMENTS", line1: "Coordination d’expériences.", line2: "Activités sûres, mémorables et maîtrisées." }
  }
  if (identity.includes("it.support")) {
    return { unit: "IT SUPPORT", line1: "Opérations numériques.", line2: "Infrastructure et continuité des systèmes." }
  }

  return { unit: "ANGELCARE", line1: "Communication professionnelle.", line2: "Excellence opérationnelle." }
}

function signatureHtml(mailbox: ComposeMailbox | null, signature: ReturnType<typeof mailboxSignature>) {
  const email = clean(mailbox?.email)
  return `<div data-email-os-signature="true" style="margin-top:32px;padding-top:22px;border-top:1px solid #dbe5f0;font-family:Arial,sans-serif;color:#334155;line-height:1.55">
    <div style="font-size:13px;color:#64748b;margin-bottom:10px">Cordialement,</div>
    <div style="font-size:15px;font-weight:800;color:#0f172a">Équipe ${escapeHtml(signature.unit || "ANGELCARE")}</div>
    <div style="font-size:13px;font-weight:700;color:#1e3a8a;letter-spacing:.04em">ANGELCARE</div>
    <div style="font-size:12px;color:#64748b;margin-top:5px">${escapeHtml(signature.line1)} ${escapeHtml(signature.line2)}</div>
    ${email ? `<div style="font-size:12px;color:#475569;margin-top:8px">${escapeHtml(email)}</div>` : ""}
    <div style="font-size:12px;color:#475569">www.angelcarehub.com</div>
  </div>`
}

function sharedLinksHtml(attachments: ComposeAttachment[]) {
  const links = attachments.filter((item) => item.source === "drive" && item.url)
  if (!links.length) return ""
  return `<div data-email-os-shared-links="true" style="margin-top:28px;padding:18px 20px;border:1px solid #dbeafe;border-radius:14px;background:#f8fbff;font-family:Arial,sans-serif">
    <div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:10px">Documents partagés</div>
    ${links.map((item) => `<div style="margin:7px 0"><a href="${escapeHtml(item.url || "")}" target="_blank" rel="noopener noreferrer" style="color:#1d4ed8;text-decoration:none;font-size:13px;font-weight:700">${escapeHtml(item.name)}</a></div>`).join("")}
  </div>`
}

function attachmentIcon(name: string) {
  const lower = name.toLowerCase()
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return FileSpreadsheet
  if (lower.endsWith(".docx") || lower.endsWith(".doc") || lower.endsWith(".pdf")) return FileText
  return FileArchive
}

function contextLabel(selectedEmail: any) {
  return clean(
    selectedEmail?.organization_name ||
    selectedEmail?.organizationName ||
    selectedEmail?.company_name ||
    selectedEmail?.companyName ||
    selectedEmail?.contact_name ||
    selectedEmail?.contactName ||
    senderOf(selectedEmail)
  ) || "Communication indépendante"
}

function contextStatus(selectedEmail: any) {
  return clean(selectedEmail?.status || selectedEmail?.workflow_status || selectedEmail?.stage) || "Contexte actif"
}

function initialVariableValues(args: {
  recipient: string
  mailbox: ComposeMailbox | null
  selectedEmail: any
  signatureUnit: string
}) {
  const organization = clean(
    args.selectedEmail?.organization_name ||
    args.selectedEmail?.organizationName ||
    args.selectedEmail?.company_name ||
    args.selectedEmail?.companyName
  )
  const contactName = clean(args.selectedEmail?.contact_name || args.selectedEmail?.contactName) || inferFirstName(args.recipient)
  const today = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date())
  const values: Record<string, string> = {
    first_name: contactName,
    contact_name: contactName,
    recipient_name: contactName,
    company: organization || "AngelCare",
    organization_name: organization,
    organisation_name: organization,
    mailbox: clean(args.mailbox?.name || args.mailbox?.email) || "AngelCare",
    operator: clean(args.mailbox?.name) || "AngelCare",
    sender_name: clean(args.mailbox?.name) || "AngelCare",
    sender_email: clean(args.mailbox?.email),
    date: today,
    current_date: today,
    service: clean(args.selectedEmail?.service || args.selectedEmail?.category || subjectOf(args.selectedEmail)) || args.signatureUnit || "votre demande",
    city: clean(args.selectedEmail?.city || args.selectedEmail?.location) || "Maroc"
  }
  return values
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error(`Impossible de lire la pièce jointe : ${file.name}`))
    reader.onload = () => {
      const raw = String(reader.result || "")
      resolve(raw.includes(",") ? raw.split(",").pop() || "" : raw)
    }
    reader.readAsDataURL(file)
  })
}

async function uploadAttachmentToGateway(file: File, mailboxId: string, entityType: string) {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("moduleKey", "email_os")
  formData.append("mailboxId", mailboxId)
  formData.append("entityType", entityType)
  formData.append("direction", "outbound")
  formData.append("createdBy", "enterprise-compose-studio")
  formData.append("metadata", JSON.stringify({ source: "enterprise-compose-studio" }))

  const res = await fetch("/api/storage/upload", { method: "POST", body: formData })
  const json = await res.json().catch(() => null)
  return {
    ok: res.ok && json?.ok !== false,
    data: json?.data ?? json,
    error: json?.error || (!res.ok ? `HTTP ${res.status}` : null)
  }
}

const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024
const MAX_TOTAL_ATTACHMENT_BYTES = 15 * 1024 * 1024
const MAX_ATTACHMENT_COUNT = 10

function ToolbarButton({
  label,
  children,
  onClick,
  active = false,
  disabled = false
}: {
  label: string
  children: ReactNode
  onClick: () => void
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onMouseDown={(event: MouseEvent<HTMLButtonElement>) => event.preventDefault()}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border text-slate-600 transition ${
        active
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-transparent bg-transparent hover:border-slate-200 hover:bg-white hover:text-slate-950"
      } disabled:cursor-not-allowed disabled:opacity-35`}
    >
      {children}
    </button>
  )
}

function RichEmailEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const lastInputRef = useRef(value)

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    if (value !== lastInputRef.current) {
      editor.innerHTML = value
      lastInputRef.current = value
    }
  }, [value])

  function command(name: string, commandValue?: string) {
    editorRef.current?.focus()
    document.execCommand(name, false, commandValue)
    const html = sanitizeComposeHtml(editorRef.current?.innerHTML || "")
    lastInputRef.current = html
    onChange(html)
  }

  function insertLink() {
    const url = window.prompt("URL du lien sécurisé")
    if (!url) return
    if (!/^https?:\/\//i.test(url)) {
      window.alert("Utilisez une adresse commençant par http:// ou https://")
      return
    }
    command("createLink", url)
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,.06)]">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/80 px-3 py-2">
        <select
          aria-label="Style du paragraphe"
          defaultValue="p"
          onChange={(event: ChangeEvent<HTMLSelectElement>) => command("formatBlock", event.target.value)}
          className="mr-2 h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none"
        >
          <option value="p">Texte normal</option>
          <option value="h2">Titre</option>
          <option value="h3">Sous-titre</option>
          <option value="blockquote">Citation</option>
        </select>
        <ToolbarButton label="Gras" onClick={() => command("bold")}><Bold className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton label="Italique" onClick={() => command("italic")}><Italic className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton label="Souligné" onClick={() => command("underline")}><Underline className="h-4 w-4" /></ToolbarButton>
        <div className="mx-1 h-6 w-px bg-slate-200" />
        <ToolbarButton label="Liste à puces" onClick={() => command("insertUnorderedList")}><List className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton label="Liste numérotée" onClick={() => command("insertOrderedList")}><ListOrdered className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton label="Citation" onClick={() => command("formatBlock", "blockquote")}><Quote className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton label="Insérer un lien" onClick={insertLink}><Link2 className="h-4 w-4" /></ToolbarButton>
        <div className="mx-1 h-6 w-px bg-slate-200" />
        <ToolbarButton label="Annuler" onClick={() => command("undo")}><Undo2 className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton label="Rétablir" onClick={() => command("redo")}><Redo2 className="h-4 w-4" /></ToolbarButton>
        <ToolbarButton label="Effacer la mise en forme" onClick={() => command("removeFormat")}><Highlighter className="h-4 w-4" /></ToolbarButton>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder="Rédigez votre message…"
        onInput={(event: FormEvent<HTMLDivElement>) => {
          const html = sanitizeComposeHtml(event.currentTarget.innerHTML)
          lastInputRef.current = html
          onChange(html)
        }}
        onPaste={(event: ClipboardEvent<HTMLDivElement>) => {
          event.preventDefault()
          const text = event.clipboardData.getData("text/plain")
          document.execCommand("insertText", false, text)
        }}
        className="email-os-compose-editor min-h-[360px] px-8 py-7 text-[15px] font-medium leading-7 text-slate-800 outline-none empty:before:pointer-events-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]"
      />
    </div>
  )
}

function CompactSwitch({ checked, onChange, disabled = false }: { checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-blue-600" : "bg-slate-300"} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
  )
}

export default function EnterpriseComposeModal({
  open,
  mode,
  mailboxes = [],
  selectedEmail,
  mailboxScopeLocked = false,
  initialMailboxId,
  initialRecipients,
  initialSubject,
  initialBody,
  initialCc,
  initialBcc,
  initialPriority,
  initialTracking,
  initialTemplateId,
  initialTemplateVersion,
  onClose,
  onDone
}: Props) {
  const replyTo = senderOf(selectedEmail)
  const composeIdentity = [
    mode,
    initialMailboxId || selectedEmail?.mailbox_id || selectedEmail?.mailboxId || "",
    selectedEmail?.id || selectedEmail?.messageId || selectedEmail?.provider_uid || "new",
    initialSubject || "",
    initialTemplateId || "",
    initialTemplateVersion || 0
  ].join(":")
  const draftStorageKey = `email-os-compose-draft:${composeIdentity}`
  const initializedIdentityRef = useRef<string | null>(null)

  function initialRecipientsValue(): Recipient[] {
    return initialRecipients?.length
      ? initialRecipients
      : mode === "reply" && replyTo
        ? [{ name: niceName(replyTo), email: replyTo }]
        : []
  }

  function initialSubjectValue() {
    return initialSubject ||
      (mode === "reply"
        ? `Re: ${subjectOf(selectedEmail)}`
        : mode === "forward"
          ? `Tr: ${subjectOf(selectedEmail)}`
          : "")
  }

  function initialBodyValue() {
    if (initialBody) return toEditorHtml(initialBody)
    if (mode === "reply") {
      return `<p>Bonjour ${escapeHtml(niceName(replyTo))},</p><p>Merci pour votre message.</p><p>Nous avons bien reçu votre demande et revenons vers vous avec les prochaines étapes.</p>${quoteOriginal(selectedEmail)}`
    }
    if (mode === "forward") {
      return `<p>Bonjour,</p><p>Veuillez trouver ci-dessous le message transféré et le contexte associé.</p>${quoteOriginal(selectedEmail)}`
    }
    return ""
  }

  function readStoredDraft() {
    if (typeof window === "undefined") return null
    try {
      const raw = window.sessionStorage.getItem(draftStorageKey)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  function clearStoredDraft() {
    if (typeof window === "undefined") return
    try {
      window.sessionStorage.removeItem(draftStorageKey)
    } catch {
      // Best-effort cleanup only.
    }
  }

  const storedDraft = readStoredDraft()
  const [liveMailboxes, setLiveMailboxes] = useState<ComposeMailbox[]>([])
  const [templates, setTemplates] = useState<ComposeTemplate[]>([])
  const [templateSearch, setTemplateSearch] = useState<string>("")
  const [templateCategory, setTemplateCategory] = useState<string>("all")
  const [previewTemplate, setPreviewTemplate] = useState<ComposeTemplate | null>(null)
  const [rightRailTab, setRightRailTab] = useState<RightRailTab>("templates")
  const [rightRailOpen, setRightRailOpen] = useState<boolean>(false)
  const [leftRailOpen, setLeftRailOpen] = useState<boolean>(false)
  const [mailboxMenuOpen, setMailboxMenuOpen] = useState<boolean>(false)
  const [sendMenuOpen, setSendMenuOpen] = useState<boolean>(false)
  const [scheduleOpen, setScheduleOpen] = useState<boolean>(mode === "schedule")
  const [previewOpen, setPreviewOpen] = useState<boolean>(false)
  const [minimized, setMinimized] = useState<boolean>(false)
  const [maximized, setMaximized] = useState<boolean>(false)
  const [busy, setBusy] = useState<boolean>(false)
  const [status, setStatus] = useState<string>("Prêt à composer")
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<Date | null>(null)
  const [completion, setCompletion] = useState<CompletionState | null>(null)
  const [priority, setPriority] = useState<string>(String(storedDraft?.priority || initialPriority || "normal"))
  const [tracking, setTracking] = useState<boolean>(Boolean(storedDraft?.tracking ?? initialTracking ?? true))
  const [scheduledDate, setScheduledDate] = useState<string>(String(storedDraft?.scheduledDate || ""))
  const [scheduledTime, setScheduledTime] = useState<string>(String(storedDraft?.scheduledTime || "09:00"))
  const [ccOpen, setCcOpen] = useState<boolean>(Boolean(storedDraft?.ccEmail || initialCc))
  const [bccOpen, setBccOpen] = useState<boolean>(Boolean(storedDraft?.bccEmail || initialBcc))
  const [ccEmail, setCcEmail] = useState<string>(String(storedDraft?.ccEmail || initialCc || ""))
  const [bccEmail, setBccEmail] = useState<string>(String(storedDraft?.bccEmail || initialBcc || ""))
  const [sourceTemplateId, setSourceTemplateId] = useState<string>(String(storedDraft?.sourceTemplateId || initialTemplateId || ""))
  const [sourceTemplateVersion, setSourceTemplateVersion] = useState<number>(Number(storedDraft?.sourceTemplateVersion || initialTemplateVersion || 0))
  const [templateBaseSubject, setTemplateBaseSubject] = useState<string>("")
  const [templateBaseBody, setTemplateBaseBody] = useState<string>("")
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [driveUrl, setDriveUrl] = useState<string>("")
  const [driveName, setDriveName] = useState<string>("Document partagé")
  const [showDriveBox, setShowDriveBox] = useState<boolean>(false)
  const [mailboxId, setMailboxId] = useState<string>(storedDraft?.mailboxId || initialMailboxId || selectedEmail?.mailbox_id || mailboxes[0]?.id || "")
  const [recipients, setRecipients] = useState<Recipient[]>(Array.isArray(storedDraft?.recipients) ? storedDraft.recipients : initialRecipientsValue())
  const [recipientInput, setRecipientInput] = useState<string>(String(storedDraft?.recipientInput || ""))
  const [subject, setSubject] = useState<string>(storedDraft?.subject ?? initialSubjectValue())
  const [body, setBody] = useState<string>(storedDraft?.body ?? initialBodyValue())
  const [attachments, setAttachments] = useState<ComposeAttachment[]>(Array.isArray(storedDraft?.attachments) ? storedDraft.attachments : [])
  const [followUpEnabled, setFollowUpEnabled] = useState<boolean>(Boolean(storedDraft?.followUpEnabled))
  const [followUpDays, setFollowUpDays] = useState<number>(Number(storedDraft?.followUpDays || 3))
  const [assistantBusy, setAssistantBusy] = useState<boolean>(false)
  const [assistantSummary, setAssistantSummary] = useState<string>("")

  useEffect(() => {
    if (!open) {
      initializedIdentityRef.current = null
      return
    }
    if (initializedIdentityRef.current === composeIdentity) return
    initializedIdentityRef.current = composeIdentity

    const stored = readStoredDraft()
    setMailboxId(stored?.mailboxId || initialMailboxId || selectedEmail?.mailbox_id || mailboxes[0]?.id || "")
    setRecipients(Array.isArray(stored?.recipients) ? stored.recipients : initialRecipientsValue())
    setRecipientInput(stored?.recipientInput || "")
    setSubject(stored?.subject ?? initialSubjectValue())
    setBody(stored?.body ?? initialBodyValue())
    setCcEmail(stored?.ccEmail ?? initialCc ?? "")
    setBccEmail(stored?.bccEmail ?? initialBcc ?? "")
    setCcOpen(Boolean(stored?.ccEmail || initialCc))
    setBccOpen(Boolean(stored?.bccEmail || initialBcc))
    setPriority(stored?.priority || initialPriority || "normal")
    setTracking(stored?.tracking ?? initialTracking ?? true)
    setSourceTemplateId(stored?.sourceTemplateId || initialTemplateId || "")
    setSourceTemplateVersion(Number(stored?.sourceTemplateVersion || initialTemplateVersion || 0))
    setAttachments(Array.isArray(stored?.attachments) ? stored.attachments : [])
    setFollowUpEnabled(Boolean(stored?.followUpEnabled))
    setFollowUpDays(Number(stored?.followUpDays || 3))
    setScheduledDate(stored?.scheduledDate || "")
    setScheduledTime(stored?.scheduledTime || "09:00")
    setCompletion(null)
  }, [open, composeIdentity])

  useEffect(() => {
    if (!open || typeof window === "undefined") return
    const timer = window.setTimeout(() => {
      try {
        const persistableAttachments = attachments.filter((item) => item.source !== "legacy" || !item.contentBase64)
        window.sessionStorage.setItem(draftStorageKey, JSON.stringify({
          mailboxId,
          recipients,
          recipientInput,
          subject,
          body,
          ccEmail,
          bccEmail,
          priority,
          tracking,
          sourceTemplateId,
          sourceTemplateVersion,
          attachments: persistableAttachments,
          followUpEnabled,
          followUpDays,
          scheduledDate,
          scheduledTime,
          updatedAt: new Date().toISOString()
        }))
        setLastAutoSavedAt(new Date())
      } catch {
        // Session autosave is non-blocking.
      }
    }, 500)
    return () => window.clearTimeout(timer)
  }, [open, draftStorageKey, mailboxId, recipients, recipientInput, subject, body, ccEmail, bccEmail, priority, tracking, sourceTemplateId, sourceTemplateVersion, attachments, followUpEnabled, followUpDays, scheduledDate, scheduledTime])

  const resourceMailboxes = useMemo<ComposeMailbox[]>(() => {
    const normalizedProps = mailboxes.map((row: any) => ({
      id: row.id || row.mailbox_id,
      name: row.name || row.label || row.display_name || row.email_address || row.address || row.email || row.id || row.mailbox_id,
      email: row.email_address || row.address || row.email || row.from_email || row.username || "",
      status: row.status || "active",
      department: row.department || row.owner || "operations",
      provider: row.provider || row.type || "smtp",
      raw: row
    }))

    if (mailboxScopeLocked) return normalizedProps.slice(0, 1)

    const byId = new Map<string, ComposeMailbox>()
    for (const row of [...normalizedProps, ...liveMailboxes]) {
      if (row?.id) byId.set(row.id, row)
    }
    return Array.from(byId.values())
  }, [mailboxes, liveMailboxes, mailboxScopeLocked])

  const activeMailbox = resourceMailboxes.find((item) => item.id === mailboxId) || resourceMailboxes[0] || null
  const activeSignature = mailboxSignature(activeMailbox)
  const pendingRecipients = recipientInput
    .split(/[;,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter(isValidEmail)
  const recipientEmails = [...recipients.map((recipient) => recipient.email), ...pendingRecipients].filter(Boolean)
  const toEmail = Array.from(new Set(recipientEmails.map((email) => email.toLowerCase()))).join(", ")
  const externalRecipients = recipientEmails.filter(isExternalEmail)
  const invalidRecipientInput = clean(recipientInput) && !recipientInput.split(/[;,\s]+/).filter(Boolean).every((item) => isValidEmail(item))
  const totalAttachmentBytes = attachments.reduce((sum, item) => sum + Number(item.sizeBytes || 0), 0)
  const bodyText = stripHtml(body)
  const wordCount = bodyText ? bodyText.split(/\s+/).filter(Boolean).length : 0
  const composeCopy = modeCopy(mode)
  const deliveryBody = sanitizeComposeHtml(`${body}${sharedLinksHtml(attachments)}${signatureHtml(activeMailbox, activeSignature)}`)
  const deliveryText = stripHtml(deliveryBody)
  const variableNames = extractTemplateVariables(subject, body, templateBaseSubject, templateBaseBody)
  const unresolvedVariables = extractTemplateVariables(subject, body)
  const readyToSend = Boolean(mailboxId && toEmail && clean(subject) && bodyText && !invalidRecipientInput && unresolvedVariables.length === 0 && !busy)

  const templateCategories = useMemo(() => {
    const values = new Set(templates.map((template) => clean(template.category).toLowerCase()).filter(Boolean))
    return ["all", ...Array.from(values).sort()]
  }, [templates])

  const filteredTemplates = useMemo(() => templates.filter((template) => {
    const query = templateSearch.toLowerCase().trim()
    const categoryMatch = templateCategory === "all" || clean(template.category).toLowerCase() === templateCategory
    if (!categoryMatch) return false
    if (!query) return true
    return [template.name, template.subject, template.category, template.language, template.description, ...(template.tags || [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query)
  }), [templates, templateSearch, templateCategory])

  useEffect(() => {
    if (!open) return
    let cancelled = false

    async function loadResources() {
      const result = await api("/api/email-os/compose-resources")
      if (cancelled) return
      if (!result.ok) {
        setStatus(result.error || "Impossible de charger les ressources de composition")
        return
      }

      const nextMailboxes = mailboxScopeLocked ? [] : (result.data?.mailboxes || [])
      setLiveMailboxes(nextMailboxes)
      setMailboxId((current) => {
        if (mailboxScopeLocked) return selectedEmail?.mailbox_id || mailboxes[0]?.id || current || ""
        return current || selectedEmail?.mailbox_id || nextMailboxes[0]?.id || mailboxes[0]?.id || ""
      })
      setStatus("Identités d’envoi synchronisées")
    }

    void loadResources()
    return () => { cancelled = true }
  }, [open, selectedEmail?.mailbox_id, mailboxScopeLocked, mailboxes])

  useEffect(() => {
    if (!open || !mailboxId) return
    let cancelled = false

    async function loadPrivateMailboxTemplates() {
      const result = await api(`/api/email-os/templates?mailboxId=${encodeURIComponent(mailboxId)}`)
      if (cancelled) return
      if (!result.ok) {
        setTemplates([])
        setStatus(result.error || "Bibliothèque de modèles indisponible")
        return
      }
      const rows = Array.isArray(result.data?.templates) ? result.data.templates : []
      const published = rows.filter((row: any) => row.status === "published" || row.status === "active")
      setTemplates(published.map((row: any) => ({
        id: row.id,
        name: row.name || row.template_name || "Modèle sans nom",
        subject: row.subject || row.subject_template || "",
        body: row.bodyHtml || row.body_html || row.bodyText || row.body_text || row.body || "",
        category: row.category || "général",
        priority: row.defaultPriority || row.default_priority || row.priority || "normal",
        language: row.language || "fr",
        description: row.description || row.instructions || "",
        tags: Array.isArray(row.tags) ? row.tags : String(row.tags || "").split("|").map((item) => item.trim()).filter(Boolean),
        raw: row
      })))
      setStatus(`${published.length} modèle${published.length > 1 ? "s" : ""} privé${published.length > 1 ? "s" : ""} disponible${published.length > 1 ? "s" : ""}`)
    }

    void loadPrivateMailboxTemplates()
    return () => { cancelled = true }
  }, [open, mailboxId])

  useEffect(() => {
    if (mode !== "schedule" || scheduledDate) return
    const next = new Date()
    next.setDate(next.getDate() + 1)
    setScheduledDate(next.toISOString().slice(0, 10))
    setScheduledTime("09:00")
  }, [mode, scheduledDate])

  if (!open) return null

  async function audit(action: string, payload: any = {}) {
    await api("/api/email-os/compose-action", {
      method: "POST",
      body: JSON.stringify({ action, payload: { ...payload, mailboxId, subject, toEmail } })
    })
  }

  function addRecipient(value: string) {
    const values = String(value || "")
      .split(/[;,\s]+/)
      .map((item) => item.trim())
      .filter(Boolean)

    const valid = values.filter(isValidEmail)
    if (!valid.length) return false

    setRecipients((current) => {
      const existing = new Set(current.map((item) => item.email.toLowerCase()))
      const next = [...current]
      for (const email of valid) {
        const key = email.toLowerCase()
        if (!existing.has(key)) {
          existing.add(key)
          next.push({ name: niceName(email), email })
        }
      }
      return next
    })
    setRecipientInput("")
    return true
  }

  function applyTemplate(template: ComposeTemplate) {
    const firstRecipient = recipients[0]?.email || recipients[0]?.name || toEmail || selectedEmail?.from_email || ""
    const defaults = initialVariableValues({
      recipient: firstRecipient,
      mailbox: activeMailbox,
      selectedEmail,
      signatureUnit: activeSignature.unit
    })
    const rawSubject = normalizeTemplateText(template.subject || template.name || "")
    const rawBody = toEditorHtml(template.body || "")
    const names = extractTemplateVariables(rawSubject, rawBody)
    const nextValues = { ...defaults }
    for (const name of names) {
      if (!(name in nextValues)) nextValues[name] = ""
    }

    setTemplateBaseSubject(rawSubject)
    setTemplateBaseBody(rawBody)
    setVariableValues(nextValues)
    setSubject(replaceTemplateVariables(rawSubject, nextValues))
    setBody(replaceTemplateVariables(rawBody, nextValues))
    if (template.priority) setPriority(template.priority)
    setSourceTemplateId(template.id || "")
    setSourceTemplateVersion(Number(template.raw?.currentVersion || template.raw?.current_version || 0))
    setRightRailTab(names.length ? "variables" : "templates")
    setPreviewTemplate(null)
    setStatus(`Modèle appliqué : ${template.name}`)
    void audit("apply_template", { templateId: template.id, templateName: template.name, variables: names })
  }

  function reapplyTemplateVariables() {
    if (!templateBaseSubject && !templateBaseBody) {
      setStatus("Aucun modèle actif à mettre à jour")
      return
    }
    setSubject(replaceTemplateVariables(templateBaseSubject, variableValues))
    setBody(replaceTemplateVariables(templateBaseBody, variableValues))
    setStatus("Variables appliquées au message")
    void audit("apply_template_variables", { variables: variableValues })
  }

  async function addLocalFiles(files: FileList | null) {
    if (!files) return
    const selected = Array.from(files)

    if (attachments.length + selected.length > MAX_ATTACHMENT_COUNT) {
      setStatus(`Maximum ${MAX_ATTACHMENT_COUNT} pièces jointes autorisées`)
      return
    }
    if (selected.some((file) => file.size > MAX_ATTACHMENT_BYTES)) {
      setStatus("Chaque pièce jointe doit être inférieure ou égale à 8 MB")
      return
    }
    if (totalAttachmentBytes + selected.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_ATTACHMENT_BYTES) {
      setStatus("Le total des pièces jointes ne peut pas dépasser 15 MB")
      return
    }

    setBusy(true)
    setStatus("Sécurisation des pièces jointes…")

    const next = await Promise.all(selected.map(async (file) => {
      const mimeType = file.type || "application/octet-stream"
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      if (mailboxId) {
        try {
          const uploaded = await uploadAttachmentToGateway(file, mailboxId, mode === "reply" || mode === "forward" ? "reply_attachment" : "compose_attachment")
          if (uploaded.ok && uploaded.data?.id) {
            return {
              id,
              name: uploaded.data.original_filename || file.name,
              size: formatFileSize(file.size),
              sizeBytes: file.size,
              source: "storage" as const,
              mimeType,
              fileId: uploaded.data.id,
              storageBucket: uploaded.data.storage_bucket,
              storageKey: uploaded.data.storage_key,
              storageStatus: uploaded.data.status || "active",
              downloadUrl: `/api/storage/download/${uploaded.data.id}?mailboxId=${encodeURIComponent(mailboxId)}`
            }
          }
        } catch {
          // Fallback below.
        }
      }

      return {
        id,
        name: file.name,
        size: formatFileSize(file.size),
        sizeBytes: file.size,
        source: "legacy" as const,
        mimeType,
        contentBase64: await fileToBase64(file)
      }
    }))

    setAttachments((current) => [...current, ...next])
    setBusy(false)
    setStatus(`${next.length} pièce${next.length > 1 ? "s" : ""} jointe${next.length > 1 ? "s" : ""} ajoutée${next.length > 1 ? "s" : ""}`)
    void audit("attach_files", { files: next.map(({ contentBase64, ...safe }) => safe) })
  }

  function addDriveLink() {
    const url = clean(driveUrl)
    if (!url) {
      setShowDriveBox(true)
      return
    }
    if (!/^https:\/\/(drive|docs)\.google\.com\//i.test(url)) {
      setStatus("Utilisez un lien Google Drive ou Google Docs sécurisé")
      return
    }

    const item: ComposeAttachment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: clean(driveName) || "Document partagé",
      size: "Lien sécurisé",
      source: "drive",
      url
    }
    setAttachments((current) => [...current, item])
    setDriveUrl("")
    setDriveName("Document partagé")
    setShowDriveBox(false)
    setStatus("Lien Google Drive ajouté au message")
    void audit("link_drive", { url, name: item.name })
  }

  async function runAssistant(action: "improve" | "subject" | "summary") {
    setAssistantBusy(true)
    setStatus("Assistant de rédaction en cours…")
    const result = await api("/api/email-os/compose/ai-assist", {
      method: "POST",
      body: JSON.stringify({ action, subject, body: stripHtml(body), language: "fr" })
    })
    setAssistantBusy(false)

    if (!result.ok) {
      setStatus(result.error || "Assistant de rédaction indisponible")
      return
    }
    if (action === "subject" && result.data?.subject) setSubject(result.data.subject)
    if (action === "improve" && result.data?.body) setBody(toEditorHtml(result.data.body))
    if (action === "summary") setAssistantSummary(result.data?.summary || "")
    setStatus(action === "subject" ? "Objet proposé" : action === "summary" ? "Résumé préparé" : "Rédaction améliorée")
    void audit("compose_assistant", { action })
  }

  function attachmentsPayload() {
    return attachments
      .filter((item) => item.fileId || item.contentBase64)
      .map(({ name, mimeType, contentBase64, fileId }) => ({ filename: name, contentType: mimeType, contentBase64, fileId }))
  }

  async function saveDraft(statusValue: "draft" | "scheduled" = "draft") {
    if (!mailboxId) {
      setStatus("Sélectionnez une identité d’envoi")
      return
    }
    if (statusValue === "scheduled" && (!scheduledDate || !scheduledTime)) {
      setScheduleOpen(true)
      setRightRailTab("delivery")
      setStatus("Sélectionnez la date et l’heure d’envoi")
      return
    }

    setBusy(true)
    setCompletion(null)
    setStatus(statusValue === "scheduled" ? "Programmation du message…" : "Enregistrement du brouillon…")

    const scheduledAt = statusValue === "scheduled" ? new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString() : null
    const result = await api("/api/email-os/compose/draft", {
      method: "POST",
      body: JSON.stringify({
        mailboxId,
        fromEmail: activeMailbox?.email,
        toEmail,
        ccEmail,
        bccEmail,
        subject,
        body: deliveryBody,
        bodyHtml: deliveryBody,
        bodyText: deliveryText,
        priority,
        status: statusValue,
        scheduledAt,
        attachments: attachmentsPayload(),
        tracking,
        templateId: sourceTemplateId || null,
        templateVersion: sourceTemplateVersion || null,
        diagnostics: {
          mode,
          tracking,
          templateId: sourceTemplateId || null,
          templateVersion: sourceTemplateVersion || null,
          sharedLinks: attachments.filter((item) => item.source === "drive").map((item) => ({ name: item.name, url: item.url })),
          followUp: followUpEnabled ? { days: followUpDays } : null,
          attachments: attachments.map(({ contentBase64, ...safe }) => safe)
        }
      })
    })

    await audit(statusValue === "scheduled" ? "schedule_email" : "save_draft", { result, scheduledAt })
    setBusy(false)

    if (!result.ok) {
      const message = result.error || "L’enregistrement a échoué"
      setStatus(message)
      setCompletion({ type: "error", title: "Enregistrement impossible", message })
      return
    }

    clearStoredDraft()
    onDone?.({ type: statusValue })
    setCompletion({
      type: statusValue,
      title: statusValue === "scheduled" ? "Message programmé" : "Brouillon enregistré",
      message: statusValue === "scheduled"
        ? `L’envoi est planifié le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(`${scheduledDate}T12:00:00`))} à ${scheduledTime}.`
        : "Le brouillon est conservé dans Email OS et peut être repris à tout moment.",
      reference: result.data?.id || result.data?.outboxId || result.data?.queueId || undefined
    })
    setStatus(statusValue === "scheduled" ? "Message programmé" : "Brouillon enregistré")
  }

  async function createFollowUpTask(outboxId: string) {
    if (!followUpEnabled || !outboxId) return null
    const dueAt = new Date()
    dueAt.setDate(dueAt.getDate() + Math.max(1, followUpDays))
    return api("/api/email-os/workflows", {
      method: "POST",
      body: JSON.stringify({
        mailboxId,
        messageId: outboxId,
        action: "create_followup_task",
        payload: {
          title: `Suivi sans réponse — ${subject || "Message envoyé"}`,
          description: `Vérifier la réponse et relancer si nécessaire après ${followUpDays} jour(s).`,
          dueAt: dueAt.toISOString(),
          priority
        }
      })
    })
  }

  async function sendNow() {
    if (!mailboxId) {
      setStatus("Sélectionnez une identité d’envoi")
      return
    }
    if (!toEmail) {
      setStatus("Ajoutez au moins un destinataire valide")
      return
    }
    if (!clean(subject)) {
      setStatus("Renseignez l’objet du message")
      return
    }
    if (!bodyText) {
      setStatus("Rédigez le contenu du message")
      return
    }
    if (unresolvedVariables.length) {
      setRightRailTab("variables")
      setRightRailOpen(true)
      setStatus(`Complétez ${unresolvedVariables.length} variable${unresolvedVariables.length > 1 ? "s" : ""} avant l’envoi`)
      return
    }

    setBusy(true)
    setCompletion(null)
    setStatus("Transmission sécurisée en cours…")

    const result = await api("/api/email-os/send-direct", {
      method: "POST",
      body: JSON.stringify({
        mailboxId,
        fromEmail: activeMailbox?.email,
        toEmail,
        ccEmail,
        bccEmail,
        subject,
        body: deliveryBody,
        bodyHtml: deliveryBody,
        bodyText: deliveryText,
        priority,
        attachments: attachmentsPayload(),
        tracking,
        templateId: sourceTemplateId || null,
        templateVersion: sourceTemplateVersion || null,
        diagnostics: {
          mode,
          tracking,
          signatureMode: "mailbox",
          templateId: sourceTemplateId || null,
          templateVersion: sourceTemplateVersion || null,
          sharedLinks: attachments.filter((item) => item.source === "drive").map((item) => ({ name: item.name, url: item.url })),
          attachments: attachments.map(({ contentBase64, ...safe }) => safe)
        }
      })
    })

    await audit("send_email", { result, attachments: attachments.map(({ contentBase64, ...safe }) => safe) })
    setBusy(false)

    if (!result.ok) {
      const message = result.error || "L’envoi a échoué"
      setStatus(message)
      setCompletion({
        type: "error",
        title: "Message non envoyé",
        message,
        detail: "Le contenu reste disponible dans le studio. Aucun doublon n’a été généré."
      })
      return
    }

    const outboxId = clean(result.data?.outboxId)
    const followUpResult = await createFollowUpTask(outboxId)
    clearStoredDraft()
    onDone?.({ type: "sent" })
    setCompletion({
      type: "sent",
      title: "Message envoyé avec succès",
      message: `Le transport a accepté le message destiné à ${toEmail}.`,
      reference: outboxId || result.data?.messageId || undefined,
      detail: followUpEnabled
        ? followUpResult?.ok
          ? `Un rappel de suivi a été créé dans ${followUpDays} jour(s).`
          : "Le message a été envoyé, mais le rappel de suivi n’a pas pu être créé."
        : "Le message est désormais disponible dans Envoyés / Outbox."
    })
    setStatus("Message envoyé")
  }

  function discardCompose() {
    const confirmed = window.confirm("Supprimer le contenu actuel de ce message ?")
    if (!confirmed) return
    setBody("")
    setSubject("")
    setRecipients([])
    setRecipientInput("")
    setCcEmail("")
    setBccEmail("")
    setAttachments([])
    setSourceTemplateId("")
    setSourceTemplateVersion(0)
    setTemplateBaseSubject("")
    setTemplateBaseBody("")
    setVariableValues({})
    setCompletion(null)
    clearStoredDraft()
    setStatus("Message réinitialisé")
    void audit("discard_compose")
  }

  function openFullStudio() {
    window.open("/email-os/compose", "_blank", "noopener,noreferrer")
    void audit("open_full_compose_studio")
  }

  const statusIsError = /impossible|échoué|erreur|invalide|bloqué|indisponible/i.test(status)
  const statusIsSuccess = /envoyé|enregistré|programmé|ajouté|appliqué|synchronisé|disponible/i.test(status)

  if (minimized) {
    return (
      <div className="fixed bottom-5 right-5 z-[2147483647] w-[min(520px,calc(100vw-32px))] rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_24px_90px_rgba(15,23,42,.28)]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Mail className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-black text-slate-950">{subject || composeCopy.title}</div>
            <div className="truncate text-xs font-bold text-slate-500">{toEmail || "Aucun destinataire"} · {safeComposeStatus(status)}</div>
          </div>
          <button type="button" onClick={() => setMinimized(false)} className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><Maximize2 className="h-4 w-4" /></button>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><X className="h-4 w-4" /></button>
        </div>
      </div>
    )
  }

  const leftRail = (
    <aside className="flex h-full min-h-0 flex-col overflow-y-auto border-r border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_54%,#f6f9fc_100%)] p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.22em] text-blue-600">Contexte</div>
          <h3 className="mt-1 text-base font-black text-slate-950">Dossier de communication</h3>
        </div>
        <button type="button" onClick={() => setLeftRailOpen(false)} className="rounded-xl p-2 text-slate-500 hover:bg-white xl:hidden"><X className="h-4 w-4" /></button>
      </div>

      <div className="rounded-[24px] border border-blue-100 bg-white p-4 shadow-[0_12px_36px_rgba(30,64,175,.07)]">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            {selectedEmail ? <Building2 className="h-5 w-5" /> : <MessageSquareText className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-slate-950">{contextLabel(selectedEmail)}</div>
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
              <CircleDot className="h-3 w-3" /> {contextStatus(selectedEmail)}
            </div>
          </div>
        </div>
        {selectedEmail ? (
          <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-xs">
            <div><div className="font-black uppercase tracking-wide text-slate-400">Conversation</div><div className="mt-1 line-clamp-2 font-bold text-slate-700">{subjectOf(selectedEmail) || "Sans objet"}</div></div>
            <div><div className="font-black uppercase tracking-wide text-slate-400">Interlocuteur</div><div className="mt-1 truncate font-bold text-slate-700">{senderOf(selectedEmail) || "Non renseigné"}</div></div>
            {selectedEmail?.priority ? <div><div className="font-black uppercase tracking-wide text-slate-400">Priorité dossier</div><div className="mt-1 font-bold text-slate-700">{String(selectedEmail.priority)}</div></div> : null}
          </div>
        ) : (
          <p className="mt-4 text-xs font-semibold leading-5 text-slate-500">Ce message n’est pas encore rattaché à une conversation. L’envoi sera néanmoins enregistré dans l’Outbox et l’audit Email OS.</p>
        )}
      </div>

      <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.15em] text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Gouvernance</div>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-slate-600">Identité autorisée</span><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">VALIDÉE</span></div>
          <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-slate-600">Session boîte</span><span className="text-[11px] font-black text-slate-800">{mailboxScopeLocked ? "PIN sécurisé" : "Accès contrôlé"}</span></div>
          <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-slate-600">Audit opérateur</span><span className="text-[11px] font-black text-slate-800">Actif</span></div>
          <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-slate-600">Pièces jointes</span><span className="text-[11px] font-black text-slate-800">{attachments.length}/{MAX_ATTACHMENT_COUNT}</span></div>
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-4">
        <div className="text-xs font-black uppercase tracking-[.15em] text-slate-500">Contrôle qualité</div>
        <div className="mt-4 space-y-3 text-xs">
          <div className="flex items-center gap-2"><span className={`flex h-5 w-5 items-center justify-center rounded-full ${mailboxId ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{mailboxId ? <Check className="h-3 w-3" /> : "1"}</span><span className="font-bold text-slate-700">Identité d’envoi</span></div>
          <div className="flex items-center gap-2"><span className={`flex h-5 w-5 items-center justify-center rounded-full ${toEmail ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{toEmail ? <Check className="h-3 w-3" /> : "2"}</span><span className="font-bold text-slate-700">Destinataire valide</span></div>
          <div className="flex items-center gap-2"><span className={`flex h-5 w-5 items-center justify-center rounded-full ${clean(subject) ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{clean(subject) ? <Check className="h-3 w-3" /> : "3"}</span><span className="font-bold text-slate-700">Objet renseigné</span></div>
          <div className="flex items-center gap-2"><span className={`flex h-5 w-5 items-center justify-center rounded-full ${bodyText ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{bodyText ? <Check className="h-3 w-3" /> : "4"}</span><span className="font-bold text-slate-700">Contenu rédigé</span></div>
          <div className="flex items-center gap-2"><span className={`flex h-5 w-5 items-center justify-center rounded-full ${unresolvedVariables.length === 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{unresolvedVariables.length === 0 ? <Check className="h-3 w-3" /> : unresolvedVariables.length}</span><span className="font-bold text-slate-700">Variables complètes</span></div>
        </div>
      </div>

      <div className="mt-auto pt-5">
        <button type="button" onClick={openFullStudio} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-xs font-black text-slate-700 hover:border-blue-200 hover:bg-blue-50">
          Ouvrir le studio pleine page <ExternalLink className="h-4 w-4" />
        </button>
      </div>
    </aside>
  )

  const rightRail = (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden border-l border-slate-200 bg-slate-50/75">
      <div className="flex items-center gap-1 border-b border-slate-200 bg-white p-3">
        {([
          ["templates", "Modèles", FileText],
          ["variables", "Variables", Variable],
          ["delivery", "Livraison", Settings2]
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setRightRailTab(key)}
            className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-xs font-black transition ${rightRailTab === key ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
          >
            <Icon className="h-4 w-4" /> {label}
            {key === "variables" && unresolvedVariables.length ? <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] text-rose-700">{unresolvedVariables.length}</span> : null}
          </button>
        ))}
        <button type="button" onClick={() => setRightRailOpen(false)} className="ml-1 rounded-xl p-2 text-slate-500 hover:bg-slate-100 2xl:hidden"><X className="h-4 w-4" /></button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {rightRailTab === "templates" ? (
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={templateSearch} onChange={(event: ChangeEvent<HTMLInputElement>) => setTemplateSearch(event.target.value)} placeholder="Rechercher un modèle…" className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none focus:border-blue-300" />
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {templateCategories.slice(0, 8).map((category) => (
                <button key={category} type="button" onClick={() => setTemplateCategory(category)} className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${templateCategory === category ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>
                  {category === "all" ? "Tous" : category}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {filteredTemplates.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-slate-300 bg-white p-5 text-center">
                  <FileText className="mx-auto h-7 w-7 text-slate-300" />
                  <div className="mt-3 text-sm font-black text-slate-700">Aucun modèle disponible</div>
                  <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">Publiez un modèle privé pour cette boîte ou modifiez les filtres.</div>
                </div>
              ) : null}
              {filteredTemplates.map((template) => {
                const variables = extractTemplateVariables(template.subject, template.body)
                return (
                  <div key={template.id} className={`rounded-[22px] border bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,.08)] ${sourceTemplateId === template.id ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-slate-950">{template.name}</div>
                        <div className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{template.description || template.subject || "Modèle professionnel Email OS"}</div>
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-slate-600">{template.language || "fr"}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {template.category ? <span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-blue-700">{template.category}</span> : null}
                      {variables.length ? <span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-amber-700">{variables.length} variable{variables.length > 1 ? "s" : ""}</span> : null}
                      {template.priority ? <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-slate-600">{template.priority}</span> : null}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button type="button" onClick={() => setPreviewTemplate(template)} className="h-9 flex-1 rounded-xl border border-slate-200 text-xs font-black text-slate-700 hover:bg-slate-50">Aperçu</button>
                      <button type="button" onClick={() => applyTemplate(template)} className="h-9 flex-1 rounded-xl bg-blue-600 text-xs font-black text-white shadow-sm shadow-blue-200 hover:bg-blue-700">Insérer</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        {rightRailTab === "variables" ? (
          <div>
            <div className="rounded-[22px] border border-blue-100 bg-blue-50/60 p-4">
              <div className="flex items-center gap-2 text-sm font-black text-blue-950"><Variable className="h-4 w-4 text-blue-700" /> Données dynamiques</div>
              <p className="mt-2 text-xs font-semibold leading-5 text-blue-800/70">Les champs connus sont préremplis depuis le destinataire, la boîte et le dossier actif. Complétez les champs manquants avant l’envoi.</p>
            </div>

            {variableNames.length === 0 ? (
              <div className="mt-4 rounded-[22px] border border-dashed border-slate-300 bg-white p-5 text-center text-sm font-bold text-slate-500">Ce message ne contient aucune variable dynamique.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {variableNames.map((name) => {
                  const unresolved = unresolvedVariables.includes(name)
                  return (
                    <label key={name} className="block rounded-[20px] border border-slate-200 bg-white p-3">
                      <span className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[.12em] text-slate-500">
                        {name.replaceAll("_", " ")}
                        <span className={`rounded-full px-2 py-1 text-[9px] ${unresolved ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{unresolved ? "REQUIS" : "RÉSOLU"}</span>
                      </span>
                      <input value={variableValues[name] || ""} onChange={(event: ChangeEvent<HTMLInputElement>) => setVariableValues((current) => ({ ...current, [name]: event.target.value }))} placeholder={`Valeur de {{${name}}}`} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-300 focus:bg-white" />
                    </label>
                  )
                })}
                <button type="button" onClick={reapplyTemplateVariables} className="h-11 w-full rounded-2xl bg-blue-600 text-sm font-black text-white shadow-sm shadow-blue-200 hover:bg-blue-700">Appliquer les variables</button>
              </div>
            )}
          </div>
        ) : null}

        {rightRailTab === "delivery" ? (
          <div className="space-y-4">
            <div className="rounded-[22px] border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-black text-slate-950"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Paramètres de livraison</div>
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500">Priorité</span>
                  <select value={priority} onChange={(event: ChangeEvent<HTMLSelectElement>) => setPriority(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-800 outline-none">
                    <option value="low">Faible</option>
                    <option value="normal">Normale</option>
                    <option value="high">Élevée</option>
                    <option value="critical">Critique</option>
                  </select>
                </label>
                <div className="flex items-center justify-between gap-4">
                  <div><div className="text-sm font-black text-slate-800">Suivi d’ouverture</div><div className="text-xs font-semibold text-slate-500">Pixel de suivi Email OS</div></div>
                  <CompactSwitch checked={tracking} onChange={setTracking} />
                </div>
                <div className="flex items-center justify-between gap-4 opacity-55">
                  <div><div className="text-sm font-black text-slate-800">Accusé de lecture</div><div className="text-xs font-semibold text-slate-500">Non pris en charge par le transport actuel</div></div>
                  <CompactSwitch checked={false} onChange={() => null} disabled />
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-black text-slate-950"><Calendar className="h-4 w-4 text-blue-600" /> Envoi différé</div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="block"><span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Date</span><input type="date" value={scheduledDate} onChange={(event: ChangeEvent<HTMLInputElement>) => setScheduledDate(event.target.value)} className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-2 text-xs font-bold outline-none" /></label>
                <label className="block"><span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Heure</span><input type="time" value={scheduledTime} onChange={(event: ChangeEvent<HTMLInputElement>) => setScheduledTime(event.target.value)} className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-2 text-xs font-bold outline-none" /></label>
              </div>
              <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-500">Fuseau : Africa/Casablanca</div>
              <button type="button" onClick={() => void saveDraft("scheduled")} disabled={busy} className="mt-4 h-11 w-full rounded-2xl border border-blue-200 bg-blue-50 text-sm font-black text-blue-700 hover:bg-blue-100 disabled:opacity-50">Programmer l’envoi</button>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <div><div className="text-sm font-black text-slate-950">Suivi sans réponse</div><div className="text-xs font-semibold text-slate-500">Créer une tâche après l’envoi</div></div>
                <CompactSwitch checked={followUpEnabled} onChange={setFollowUpEnabled} />
              </div>
              {followUpEnabled ? (
                <label className="mt-4 block"><span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Échéance après envoi</span><select value={followUpDays} onChange={(event: ChangeEvent<HTMLSelectElement>) => setFollowUpDays(Number(event.target.value))} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-800"><option value={1}>1 jour</option><option value={2}>2 jours</option><option value={3}>3 jours</option><option value={5}>5 jours</option><option value={7}>7 jours</option><option value={14}>14 jours</option></select></label>
              ) : null}
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-white p-4">
              <div className="text-[10px] font-black uppercase tracking-[.15em] text-slate-500">État du message</div>
              <div className={`mt-3 rounded-2xl px-3 py-3 text-xs font-bold leading-5 ${statusIsError ? "bg-rose-50 text-rose-800" : statusIsSuccess ? "bg-emerald-50 text-emerald-800" : "bg-slate-50 text-slate-600"}`}>{safeComposeStatus(status)}</div>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  )

  return (
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-slate-950/55 p-2 backdrop-blur-xl sm:p-4" role="dialog" aria-modal="true" aria-label={composeCopy.title}>
      <div className={`relative flex overflow-hidden border border-white/80 bg-white shadow-[0_40px_160px_rgba(15,23,42,.38)] ring-1 ring-sky-100 transition-all ${maximized ? "h-[100vh] w-[100vw] rounded-none" : "h-[calc(100vh-24px)] w-full max-w-[1920px] rounded-[30px] sm:h-[calc(100vh-42px)]"}`}>
        <div className="hidden w-[300px] shrink-0 xl:block">{leftRail}</div>

        <section className="flex min-w-0 flex-1 flex-col bg-white">
          <header className="flex min-h-[82px] items-center justify-between gap-4 border-b border-slate-200 bg-[linear-gradient(90deg,#ffffff_0%,#f8fbff_50%,#f4f7fb_100%)] px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={() => setLeftRailOpen(true)} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 xl:hidden"><PanelLeft className="h-4 w-4" /></button>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200"><Mail className="h-5 w-5" /></div>
              <div className="min-w-0">
                <div className="flex items-center gap-2"><h2
  className="truncate text-xl font-black tracking-[-.035em] !text-black sm:text-2xl"
  style={{
    color: "#000000",
    WebkitTextFillColor: "#000000",
    fontWeight: 900,
  }}
>
  {composeCopy.title}
</h2>{mode !== "compose" ? <span className="hidden rounded-full bg-blue-50 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-blue-700 sm:inline">{mode}</span> : null}</div>
                <p className="truncate text-xs font-bold text-slate-500 sm:text-sm">{composeCopy.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-500 lg:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> {lastAutoSavedAt ? `Sauvegarde auto ${lastAutoSavedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : "Sauvegarde auto active"}
              </div>
              <button type="button" onClick={() => setRightRailOpen(true)} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 2xl:hidden"><PanelRight className="h-4 w-4" /></button>
              <button type="button" onClick={() => setMinimized(true)} title="Réduire" className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50"><Minimize2 className="h-4 w-4" /></button>
              <button type="button" onClick={() => setMaximized((current) => !current)} title={maximized ? "Restaurer" : "Plein écran"} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50">{maximized ? <Copy className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</button>
              <button type="button" onClick={onClose} title="Fermer" className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"><X className="h-4 w-4" /></button>
            </div>
          </header>

          {completion ? (
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto bg-[radial-gradient(circle_at_top,#eff6ff_0%,#ffffff_55%)] p-6">
              <div className="w-full max-w-2xl rounded-[32px] border border-slate-200 bg-white p-7 text-center shadow-[0_28px_90px_rgba(15,23,42,.12)] sm:p-10">
                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] ${completion.type === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                  {completion.type === "error" ? <AlertCircle className="h-8 w-8" /> : <CheckCircle2 className="h-8 w-8" />}
                </div>
                <h3 className="mt-6 text-2xl font-black tracking-[-.035em] text-slate-950">{completion.title}</h3>
                <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-slate-600">{completion.message}</p>
                {completion.reference ? <div className="mx-auto mt-5 max-w-md rounded-2xl bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500"><span className="font-black text-slate-700">Référence Email OS :</span> {completion.reference}</div> : null}
                {completion.detail ? <p className="mt-4 text-xs font-bold leading-5 text-slate-500">{completion.detail}</p> : null}
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  {completion.type === "error" ? <button type="button" onClick={() => setCompletion(null)} className="h-11 rounded-2xl bg-blue-600 px-6 text-sm font-black text-white">Revenir au message</button> : <button type="button" onClick={onClose} className="h-11 rounded-2xl bg-blue-600 px-6 text-sm font-black text-white">Fermer le studio</button>}
                  {completion.type !== "error" ? <button type="button" onClick={() => { setCompletion(null); setSubject(""); setBody(""); setRecipients([]); setAttachments([]); setSourceTemplateId(""); setTemplateBaseBody(""); setTemplateBaseSubject("") }} className="h-11 rounded-2xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-700">Composer un autre message</button> : null}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_18%)] px-4 py-5 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-[1160px]">
                  <div className="relative rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_14px_45px_rgba(15,23,42,.06)]">
                    <button type="button" onClick={() => !mailboxScopeLocked && setMailboxMenuOpen((current) => !current)} className={`flex w-full items-center gap-4 text-left ${mailboxScopeLocked ? "cursor-default" : "cursor-pointer"}`}>
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><AtSign className="h-5 w-5" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-black uppercase tracking-[.16em] text-slate-400">Envoyer depuis</span>{mailboxScopeLocked ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-700"><LockKeyhole className="h-3 w-3" /> Verrouillé par session PIN</span> : null}</div>
                        <div className="mt-1 truncate text-sm font-black text-slate-950">{activeMailbox?.name || "Aucune boîte sélectionnée"}</div>
                        <div className="truncate text-xs font-semibold text-slate-500">{activeMailbox?.email || "Configurez une adresse dans Email OS"}</div>
                      </div>
                      <div className="hidden text-right sm:block"><div className="text-[10px] font-black uppercase tracking-wide text-emerald-600">Envoi autorisé</div><div className="mt-1 text-xs font-bold text-slate-500">Signature {activeSignature.unit}</div></div>
                      {!mailboxScopeLocked ? <ChevronDown className={`h-5 w-5 text-slate-400 transition ${mailboxMenuOpen ? "rotate-180" : ""}`} /> : <ShieldCheck className="h-5 w-5 text-emerald-600" />}
                    </button>
                    {mailboxMenuOpen && !mailboxScopeLocked ? (
                      <div className="absolute left-4 right-4 top-[calc(100%+8px)] z-30 max-h-80 overflow-y-auto rounded-[24px] border border-slate-200 bg-white p-2 shadow-[0_24px_80px_rgba(15,23,42,.18)]">
                        {resourceMailboxes.map((mailbox) => (
                          <button key={mailbox.id} type="button" onClick={() => { setMailboxId(mailbox.id); setMailboxMenuOpen(false); void audit("select_mailbox", { mailboxId: mailbox.id }) }} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-slate-50 ${mailbox.id === mailboxId ? "bg-blue-50" : ""}`}>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm"><Mail className="h-4 w-4" /></div>
                            <div className="min-w-0 flex-1"><div className="truncate text-sm font-black text-slate-900">{mailbox.name}</div><div className="truncate text-xs font-semibold text-slate-500">{mailbox.email}</div></div>
                            {mailbox.id === mailboxId ? <Check className="h-4 w-4 text-blue-600" /> : null}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 rounded-[26px] border border-slate-200 bg-white px-4 py-3 shadow-[0_14px_45px_rgba(15,23,42,.05)] sm:px-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"><UserRound className="h-4 w-4" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-h-10 flex-wrap items-center gap-2">
                          {recipients.map((recipient) => (
                            <span key={recipient.email} className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-2.5 py-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-200 text-[10px] font-black text-blue-800">{(recipient.name || recipient.email || "?")[0]?.toUpperCase()}</span>
                              <span className="min-w-0"><span className="block max-w-[190px] truncate text-xs font-black text-slate-800">{recipient.name || niceName(recipient.email)}</span><span className="block max-w-[190px] truncate text-[10px] font-semibold text-slate-500">{recipient.email}</span></span>
                              <button type="button" onClick={() => setRecipients((current) => current.filter((item) => item.email !== recipient.email))} className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-rose-600"><X className="h-3.5 w-3.5" /></button>
                            </span>
                          ))}
                          <input
                            value={recipientInput}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => setRecipientInput(event.target.value)}
                            onBlur={() => addRecipient(recipientInput)}
                            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                              if (event.key === "Enter" || event.key === "," || event.key === ";") {
                                event.preventDefault()
                                addRecipient(recipientInput)
                              }
                            }}
                            placeholder={recipients.length ? "Ajouter un destinataire…" : "Nom, contact ou adresse email…"}
                            className="h-10 min-w-[220px] flex-1 bg-transparent px-2 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                          />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-wide">
                          <button type="button" onClick={() => setCcOpen((current) => !current)} className={ccOpen ? "text-blue-700" : "text-slate-400 hover:text-slate-700"}>Cc</button>
                          <button type="button" onClick={() => setBccOpen((current) => !current)} className={bccOpen ? "text-blue-700" : "text-slate-400 hover:text-slate-700"}>Cci</button>
                          {externalRecipients.length ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-amber-700"><Globe2 className="h-3 w-3" /> {externalRecipients.length} externe{externalRecipients.length > 1 ? "s" : ""}</span> : null}
                          {invalidRecipientInput ? <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-rose-700"><AlertCircle className="h-3 w-3" /> Adresse invalide</span> : null}
                        </div>
                      </div>
                    </div>
                    {ccOpen ? <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3"><span className="w-8 text-xs font-black text-slate-400">Cc</span><input value={ccEmail} onChange={(event: ChangeEvent<HTMLInputElement>) => setCcEmail(event.target.value)} placeholder="adresses séparées par des virgules" className="h-9 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none" /></div> : null}
                    {bccOpen ? <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3"><span className="w-8 text-xs font-black text-slate-400">Cci</span><input value={bccEmail} onChange={(event: ChangeEvent<HTMLInputElement>) => setBccEmail(event.target.value)} placeholder="adresses masquées" className="h-9 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none" /></div> : null}
                  </div>

                  <div className="mt-4 rounded-[26px] border border-slate-200 bg-white px-5 py-4 shadow-[0_14px_45px_rgba(15,23,42,.05)]">
                    <label className="block"><span className="text-[10px] font-black uppercase tracking-[.16em] text-slate-400">Objet</span><input value={subject} onChange={(event: ChangeEvent<HTMLInputElement>) => setSubject(event.target.value)} placeholder="Objet clair, précis et orienté action" className="mt-2 h-11 w-full bg-transparent text-lg font-black tracking-[-.02em] text-slate-950 outline-none placeholder:text-slate-300" /></label>
                    <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-bold text-slate-400"><span>{subject.length} caractères</span><button type="button" onClick={() => void runAssistant("subject")} disabled={assistantBusy} className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 font-black text-violet-700 disabled:opacity-40"><WandSparkles className="h-3 w-3" /> Proposer un objet</button></div>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-[30px] border border-slate-200 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,.06)] sm:p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div><div className="text-[10px] font-black uppercase tracking-[.16em] text-slate-400">Corps du message</div><div className="mt-1 text-xs font-bold text-slate-500">{wordCount} mot{wordCount > 1 ? "s" : ""} · Signature officielle appliquée à l’envoi</div></div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => void runAssistant("improve")} disabled={assistantBusy} className="inline-flex h-9 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 text-xs font-black text-violet-700 disabled:opacity-40"><Sparkles className="h-4 w-4" /> Améliorer</button>
                        <button type="button" onClick={() => void runAssistant("summary")} disabled={assistantBusy} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 disabled:opacity-40"><Bot className="h-4 w-4" /> Résumer</button>
                      </div>
                    </div>
                    <RichEmailEditor value={body} onChange={setBody} />
                    {assistantSummary ? <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 p-4"><div className="flex items-center justify-between gap-3"><div className="text-xs font-black uppercase tracking-wide text-violet-700">Résumé de contrôle</div><button type="button" onClick={() => setAssistantSummary("")} className="rounded-lg p-1 text-violet-500 hover:bg-white"><X className="h-3.5 w-3.5" /></button></div><p className="mt-2 text-xs font-semibold leading-5 text-violet-950/75">{assistantSummary}</p></div> : null}

                    <div className="mt-5 rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] p-4">
                      <div className="flex items-start gap-3">
                        <img src="/logo.png" alt="AngelCare" className="h-10 w-auto object-contain" />
                        <div className="min-w-0"><div className="text-xs font-black uppercase tracking-[.16em] text-blue-700">Signature {activeSignature.unit}</div><div className="mt-1 text-sm font-black text-slate-950">Équipe {activeSignature.unit || "ANGELCARE"}</div><div className="mt-1 text-xs font-semibold leading-5 text-slate-500">{activeSignature.line1} {activeSignature.line2}</div><div className="mt-2 text-xs font-bold text-slate-600">{activeMailbox?.email || ""}</div></div>
                        <span className="ml-auto rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-700">Incluse à l’envoi</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_14px_45px_rgba(15,23,42,.05)]">
                    <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[.16em] text-slate-400">Documents</div><div className="mt-1 text-sm font-black text-slate-950">{attachments.length} élément{attachments.length > 1 ? "s" : ""} · {formatFileSize(totalAttachmentBytes)} / 15 MB</div></div><div className="flex flex-wrap gap-2"><label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-blue-50 px-4 text-xs font-black text-blue-700 hover:bg-blue-100"><Paperclip className="h-4 w-4" /> Ajouter des fichiers<input type="file" multiple className="hidden" onChange={(event: ChangeEvent<HTMLInputElement>) => void addLocalFiles(event.target.files)} /></label><button type="button" onClick={() => setShowDriveBox((current) => !current)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 hover:bg-slate-50"><Globe2 className="h-4 w-4" /> Lien Drive</button></div></div>
                    {showDriveBox ? <div className="mt-4 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-3 sm:grid-cols-[180px_minmax(0,1fr)_auto]"><input value={driveName} onChange={(event: ChangeEvent<HTMLInputElement>) => setDriveName(event.target.value)} placeholder="Nom du document" className="h-10 rounded-xl border border-blue-100 bg-white px-3 text-sm font-semibold outline-none" /><input value={driveUrl} onChange={(event: ChangeEvent<HTMLInputElement>) => setDriveUrl(event.target.value)} placeholder="https://drive.google.com/…" className="h-10 rounded-xl border border-blue-100 bg-white px-3 text-sm font-semibold outline-none" /><button type="button" onClick={addDriveLink} className="h-10 rounded-xl bg-blue-600 px-4 text-xs font-black text-white">Ajouter</button></div> : null}
                    {attachments.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{attachments.map((attachment) => { const Icon = attachmentIcon(attachment.name); return <div key={attachment.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm"><Icon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="truncate text-xs font-black text-slate-800">{attachment.name}</div><div className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400"><span>{attachment.size}</span><span>·</span><span>{attachment.source === "drive" ? "Lien sécurisé" : attachment.source === "storage" ? "Stockage AngelCare" : "Pièce locale"}</span></div></div>{attachment.downloadUrl ? <a href={attachment.downloadUrl} target="_blank" rel="noreferrer" className="rounded-xl p-2 text-blue-600 hover:bg-white"><ExternalLink className="h-4 w-4" /></a> : null}<button type="button" onClick={() => setAttachments((current) => current.filter((item) => item.id !== attachment.id))} className="rounded-xl p-2 text-slate-400 hover:bg-white hover:text-rose-600"><X className="h-4 w-4" /></button></div> })}</div> : <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-5 text-center text-xs font-bold text-slate-500">Aucun document joint. Les pièces seront sécurisées par le stockage AngelCare avant la transmission.</div>}
                  </div>
                </div>
              </div>

              <footer className="flex min-h-[80px] items-center justify-between gap-4 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
                <div className="min-w-0 flex-1"><div className={`truncate text-xs font-black ${statusIsError ? "text-rose-700" : statusIsSuccess ? "text-emerald-700" : "text-slate-600"}`}>{safeComposeStatus(status)}</div><div className="mt-1 hidden truncate text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:block">{toEmail ? `${recipientEmails.length} destinataire${recipientEmails.length > 1 ? "s" : ""}` : "Destinataire requis"} · {attachments.length} document{attachments.length > 1 ? "s" : ""} · Suivi {tracking ? "actif" : "désactivé"}</div></div>
                <div className="flex shrink-0 items-center gap-2">
                  <button type="button" onClick={discardCompose} className="hidden h-11 items-center gap-2 rounded-2xl px-4 text-xs font-black text-slate-500 hover:bg-rose-50 hover:text-rose-700 sm:inline-flex"><Trash2 className="h-4 w-4" /> Abandonner</button>
                  <button type="button" onClick={() => void saveDraft("draft")} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Save className="h-4 w-4" /><span className="hidden sm:inline">Brouillon</span></button>
                  <button type="button" onClick={() => setPreviewOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 hover:bg-slate-50"><Eye className="h-4 w-4" /><span className="hidden sm:inline">Aperçu</span></button>
                  <div className="relative flex">
                    <button type="button" onClick={() => void sendNow()} disabled={!readyToSend} className="inline-flex h-11 items-center gap-2 rounded-l-2xl bg-blue-600 px-5 text-xs font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"><Send className="h-4 w-4" />{unresolvedVariables.length ? `Compléter ${unresolvedVariables.length}` : busy ? "Envoi…" : "Envoyer"}</button>
                    <button type="button" onClick={() => setSendMenuOpen((current) => !current)} disabled={busy} className="h-11 rounded-r-2xl border-l border-blue-500 bg-blue-600 px-3 text-white hover:bg-blue-700 disabled:opacity-50"><ChevronDown className="h-4 w-4" /></button>
                    {sendMenuOpen ? <div className="absolute bottom-[calc(100%+8px)] right-0 z-30 w-64 rounded-[20px] border border-slate-200 bg-white p-2 shadow-[0_22px_70px_rgba(15,23,42,.2)]"><button type="button" onClick={() => { setSendMenuOpen(false); void sendNow() }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-black text-slate-700 hover:bg-slate-50"><Send className="h-4 w-4 text-blue-600" /> Envoyer maintenant</button><button type="button" onClick={() => { setSendMenuOpen(false); setScheduleOpen(true); setRightRailTab("delivery"); setRightRailOpen(true) }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-black text-slate-700 hover:bg-slate-50"><Calendar className="h-4 w-4 text-blue-600" /> Programmer l’envoi</button><button type="button" onClick={() => { setSendMenuOpen(false); void saveDraft("draft") }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-black text-slate-700 hover:bg-slate-50"><Save className="h-4 w-4 text-blue-600" /> Enregistrer comme brouillon</button></div> : null}
                  </div>
                </div>
              </footer>
            </>
          )}
        </section>

        <div className="hidden w-[380px] shrink-0 2xl:block">{rightRail}</div>

        {leftRailOpen ? <div className="absolute inset-0 z-40 bg-slate-950/35 backdrop-blur-sm xl:hidden" onClick={() => setLeftRailOpen(false)}><div className="h-full w-[min(330px,88vw)]" onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}>{leftRail}</div></div> : null}
        {rightRailOpen ? <div className="absolute inset-0 z-40 flex justify-end bg-slate-950/35 backdrop-blur-sm 2xl:hidden" onClick={() => setRightRailOpen(false)}><div className="h-full w-[min(410px,92vw)]" onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}>{rightRail}</div></div> : null}

        {previewOpen ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-md">
            <div className="flex max-h-[94%] w-full max-w-5xl flex-col overflow-hidden rounded-[30px] border border-white/70 bg-slate-100 shadow-[0_34px_120px_rgba(15,23,42,.4)]">
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4"><div><div className="text-[10px] font-black uppercase tracking-[.18em] text-blue-600">Contrôle avant envoi</div><h3 className="mt-1 text-lg font-black text-slate-950">Aperçu destinataire</h3></div><button type="button" onClick={() => setPreviewOpen(false)} className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><X className="h-4 w-4" /></button></div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-7">
                <div className="mx-auto max-w-3xl overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,.1)]">
                  <div className="border-b border-slate-200 bg-slate-50 px-5 py-4"><div className="text-xs font-black text-slate-950">{activeMailbox?.name || "AngelCare"} <span className="font-semibold text-slate-500">&lt;{activeMailbox?.email || ""}&gt;</span></div><div className="mt-1 text-xs font-semibold text-slate-500">À : {toEmail || "Destinataire non renseigné"}</div><div className="mt-3 text-base font-black text-slate-950">{subject || "Sans objet"}</div></div>
                  <div className="px-6 py-7 text-sm leading-7 text-slate-800" dangerouslySetInnerHTML={{ __html: deliveryBody }} />
                  {attachments.filter((item) => item.source !== "drive").length ? <div className="border-t border-slate-200 bg-slate-50 px-5 py-4"><div className="text-[10px] font-black uppercase tracking-wide text-slate-500">Pièces jointes</div><div className="mt-2 flex flex-wrap gap-2">{attachments.filter((item) => item.source !== "drive").map((item) => <span key={item.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">{item.name} · {item.size}</span>)}</div></div> : null}
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4"><button type="button" onClick={() => setPreviewOpen(false)} className="h-11 rounded-2xl border border-slate-200 px-5 text-sm font-black text-slate-700">Retour à l’édition</button><button type="button" onClick={() => { setPreviewOpen(false); void sendNow() }} disabled={!readyToSend} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-black text-white disabled:bg-slate-300"><Send className="h-4 w-4" /> Envoyer</button></div>
            </div>
          </div>
        ) : null}

        {previewTemplate ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-md">
            <div className="flex max-h-[88%] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_30px_100px_rgba(15,23,42,.35)]">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><div className="text-[10px] font-black uppercase tracking-[.16em] text-blue-600">Aperçu du modèle</div><h3 className="mt-1 text-lg font-black text-slate-950">{previewTemplate.name}</h3></div><button type="button" onClick={() => setPreviewTemplate(null)} className="rounded-xl border border-slate-200 p-2 text-slate-600"><X className="h-4 w-4" /></button></div>
              <div className="min-h-0 flex-1 overflow-y-auto p-5"><div className="rounded-2xl bg-slate-50 p-4"><div className="text-[10px] font-black uppercase tracking-wide text-slate-400">Objet</div><div className="mt-2 text-sm font-black text-slate-950">{previewTemplate.subject || "Sans objet"}</div></div><div className="mt-4 rounded-2xl border border-slate-200 p-5 text-sm leading-7 text-slate-700" dangerouslySetInnerHTML={{ __html: toEditorHtml(previewTemplate.body) }} /></div>
              <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4"><button type="button" onClick={() => setPreviewTemplate(null)} className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-700">Fermer</button><button type="button" onClick={() => applyTemplate(previewTemplate)} className="h-10 rounded-xl bg-blue-600 px-5 text-xs font-black text-white">Utiliser ce modèle</button></div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
