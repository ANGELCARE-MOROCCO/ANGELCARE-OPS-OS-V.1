"use client"
import { NativeResizeHandle, useNativeTheatreLayout } from "./NativeTheatreLayout"
import { canonicalTimelineMessageType, isRenderableTimelineMessage, mergeConversationSnapshot, normalizeConversationSnapshot, stableMessageKey, timelineMessagePreview } from "@/lib/ac-whatsapp/stability"
import { ACWhatsAppContrastGuard } from "./ACWhatsAppContrastGuard"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  Archive, ArrowRightLeft, Bell, BellOff, Bot, CheckCheck, ChevronDown, CircleUserRound,
  Clock3, Copy, FileText, Filter, Inbox, Languages, MessageCircleMore, MoreHorizontal,
  Paperclip, PhoneOff, Pin, PinOff, Plus, RotateCcw, Search, Send, ShieldAlert,
  Sparkles, Tag, Trash2, UserRoundCheck, UsersRound, AlarmClock, BadgeCheck,
  BookOpenCheck, Bookmark, BriefcaseBusiness, CalendarClock, ChevronRight, CircleGauge,
  ClipboardCheck, ClipboardList, Columns3, Command, Eye, FileCheck2, FileSearch, Gauge,
  Handshake, History, LayoutDashboard, ListChecks, MessageSquareQuote, Milestone, PanelLeftClose,
  PanelRightClose, Radio, ScanText, SearchCheck, ShieldCheck, SlidersHorizontal, SmilePlus,
  SplitSquareVertical, Target, TimerReset, TriangleAlert, UserCheck, UserRoundCog, WandSparkles,
  Workflow, X,
} from "lucide-react"
import type { AcWhatsAppConversation, AcWhatsAppMessage } from "@/lib/ac-whatsapp/types"
import {
  cx, EmptyState, LoadingPanel, ModalFrame, NoticeBanner, SectionTitle, StatusPill,
  Surface, SurfaceHeader,
} from "./ACWhatsAppUI"
import { acApi, formatDateTime, formatRelative, friendlyAcError, initials, useAcWhatsApp } from "./useAcWhatsApp"
import { VoiceMessagePlayer, VoiceMessageStudio } from "./VoiceMessageStudio"
import { AttachmentMessageStudio, MessageAttachmentPreview } from "./AttachmentMessageStudio"

type ConversationDetail = {
  conversation: AcWhatsAppConversation
  messages: AcWhatsAppMessage[]
  events: Array<Record<string, any>>
  contextLinks: Array<Record<string, any>>
  followups: Array<Record<string, any>>
}
type Notice = ReturnType<typeof friendlyAcError> & { tone?: "success" | "danger" | "warning" | "info" }
type TheatreArtifact = {
  id: string
  artifact_type: string
  title: string
  description?: string | null
  status: string
  priority: string
  source_message_id?: string | null
  assigned_user_id?: string | null
  due_at?: string | null
  payload?: Record<string, any> | null
  created_at: string
  created_by?: string | null
}
type TheatrePresence = { user_id: string; display_name_snapshot?: string | null; role_snapshot?: string | null; last_seen_at: string; activity?: string | null }
type TheatreData = { artifacts: TheatreArtifact[]; presence: TheatrePresence[]; draft?: { body?: string | null; updated_at?: string | null } | null }
type DockTab = "profile" | "intelligence" | "actions" | "history"
type FeatureDefinition = {
  id: string
  label: string
  description: string
  category: string
  icon: typeof Sparkles
  kind: "ai" | "artifact" | "local"
  action: string
}

const smartViews = [
  { id: "all", label: "Toutes", icon: Inbox },
  { id: "unassigned", label: "Non attribuées", icon: UsersRound },
  { id: "unread", label: "Non lues", icon: MessageCircleMore },
  { id: "waiting", label: "Attente client", icon: Clock3 },
  { id: "escalated", label: "Escalades", icon: ShieldAlert },
  { id: "resolved", label: "Résolues", icon: Archive },
 ]

const advancedFeatures: FeatureDefinition[] = [
  { id: "brief", label: "Brief conversation live", description: "Synthèse prouvée du besoin, des engagements, du risque et de la prochaine action.", category: "Intelligence", icon: ScanText, kind: "ai", action: "summary" },
  { id: "reply-matrix", label: "Matrice de réponses", description: "Compare des réponses concise, chaleureuse, commerciale, exécutive et objection.", category: "Intelligence", icon: WandSparkles, kind: "ai", action: "reply_matrix" },
  { id: "questions", label: "Questions sans réponse", description: "Repère les questions ouvertes et les répartit par responsabilité.", category: "Intelligence", icon: SearchCheck, kind: "ai", action: "unanswered_questions" },
  { id: "commitments", label: "Registre des engagements", description: "Extrait les promesses, responsables et échéances depuis le dialogue.", category: "Intelligence", icon: ClipboardCheck, kind: "ai", action: "commitments" },
  { id: "objections", label: "Intelligence objections", description: "Classe l’objection réelle et recommande preuve, réponse ou changement de scope.", category: "Intelligence", icon: ShieldCheck, kind: "ai", action: "objections" },
  { id: "tone", label: "Garde-fou tonalité", description: "Contrôle clarté, chaleur, promesses risquées et cohérence relationnelle.", category: "Intelligence", icon: SmilePlus, kind: "ai", action: "tone_guard" },
  { id: "chapters", label: "Chapitres de conversation", description: "Structure les échanges en qualification, proposition, objection et résolution.", category: "Mémoire", icon: BookOpenCheck, kind: "ai", action: "chapters" },
  { id: "executive-replay", label: "Replay exécutif", description: "Reconstruit la chronologie utile sans relire chaque message brut.", category: "Mémoire", icon: History, kind: "ai", action: "executive_replay" },
  { id: "sentiment", label: "Trajectoire sentiment & risque", description: "Explique les changements de sentiment et leurs messages déclencheurs.", category: "Intelligence", icon: CircleGauge, kind: "ai", action: "sentiment_risk" },
  { id: "quality", label: "Contrôle qualité réponse", description: "Vérifie nom, questions, engagement, longueur, ton et sensibilité avant envoi.", category: "Qualité", icon: BadgeCheck, kind: "ai", action: "quality_control" },
  { id: "score", label: "Scorecard relationnelle", description: "Évalue identité, intention, autorité, réactivité, risques et prochaine action.", category: "Intelligence", icon: Gauge, kind: "ai", action: "relationship_score" },
  { id: "next", label: "Prochaine meilleure action", description: "Recommande une seule action précise, expliquée et immédiatement exécutable.", category: "Action", icon: Target, kind: "ai", action: "next_action" },
  { id: "milestone", label: "Épingler un jalon", description: "Conserve une exigence, décision, objection ou engagement comme repère durable.", category: "Mémoire", icon: Milestone, kind: "artifact", action: "milestone" },
  { id: "followup", label: "Créer une relance", description: "Transforme l’échange en engagement daté et attribué.", category: "Action", icon: AlarmClock, kind: "local", action: "followup" },
  { id: "approval", label: "Demander validation", description: "Soumet un brouillon ou une décision sensible à un superviseur.", category: "Gouvernance", icon: UserCheck, kind: "artifact", action: "approval" },
  { id: "handoff", label: "Paquet de transfert", description: "Prépare résumé, risques, engagements et raison avant transfert.", category: "Collaboration", icon: SplitSquareVertical, kind: "artifact", action: "handoff" },
  { id: "escalation", label: "War room d’escalade", description: "Ouvre une intervention critique avec propriétaire, compte à rebours et résolution.", category: "Gouvernance", icon: TriangleAlert, kind: "artifact", action: "escalation" },
  { id: "opportunity", label: "Créer une opportunité", description: "Prépare un dossier commercial relié aux messages comme preuves.", category: "Conversion", icon: BriefcaseBusiness, kind: "artifact", action: "opportunity" },
  { id: "case", label: "Créer un dossier métier", description: "Convertit le dialogue en réclamation, incident, admission ou demande de service.", category: "Conversion", icon: FileCheck2, kind: "artifact", action: "case" },
  { id: "evidence", label: "Marquer comme preuve", description: "Classe un message ou média comme preuve commerciale ou opérationnelle.", category: "Gouvernance", icon: Eye, kind: "artifact", action: "evidence" },
  { id: "quality-issue", label: "Signaler un défaut qualité", description: "Crée une anomalie traçable reliée au message ou à la réponse.", category: "Qualité", icon: TriangleAlert, kind: "artifact", action: "quality_issue" },
  { id: "task", label: "Créer une mission", description: "Génère une tâche avec responsable, priorité, source et résultat attendu.", category: "Action", icon: ListChecks, kind: "artifact", action: "task" },
  { id: "meeting", label: "Préparer une réunion", description: "Crée objectif, participants, questions et résultat attendu.", category: "Action", icon: CalendarClock, kind: "artifact", action: "meeting" },
  { id: "callback", label: "Planifier un rappel", description: "Enregistre un rappel téléphonique comme engagement contrôlé.", category: "Action", icon: TimerReset, kind: "artifact", action: "callback" },
  { id: "assign", label: "Attribuer ou transférer", description: "Change la responsabilité sans perdre le contexte ni l’audit.", category: "Collaboration", icon: UserRoundCog, kind: "local", action: "assign" },
  { id: "internal-note", label: "Note interne", description: "Collabore avec l’équipe sans exposer le contenu au contact.", category: "Collaboration", icon: MessageSquareQuote, kind: "local", action: "internal_note" },
  { id: "focus", label: "Focus Conversation", description: "Masque les surfaces secondaires et agrandit le dialogue.", category: "Navigation", icon: Columns3, kind: "local", action: "focus" },
  { id: "search", label: "Recherche conversation", description: "Recherche immédiatement dans le fil et navigue vers le premier message correspondant.", category: "Navigation", icon: FileSearch, kind: "local", action: "search" },
  { id: "presence", label: "Présence & collision", description: "Montre les opérateurs actifs et protège contre les réponses simultanées.", category: "Collaboration", icon: Radio, kind: "local", action: "presence" },
  { id: "timeline", label: "Chronologie relationnelle", description: "Affiche messages, événements, relances, jalons et décisions dans un récit unique.", category: "Mémoire", icon: Workflow, kind: "local", action: "timeline" },
]

function labelIds(conversation?: AcWhatsAppConversation | null) {
  return new Set((conversation?.labels || []).map((row: any) => String(row.label_id || row.label?.id || "")).filter(Boolean))
}

export default function LiveCommandWorkspace() {
  const mz7Layout = useNativeTheatreLayout()

  const searchParams = useSearchParams()
  const { data, loading, error, refresh, setData } = useAcWhatsApp(12000)
  const [view, setView] = useState("all")
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("conversation"))
  const [detail, setDetail] = useState<ConversationDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [composer, setComposer] = useState("")
  const [sending, setSending] = useState(false)
  const [noteMode, setNoteMode] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiResult, setAiResult] = useState("")
  const [aiBusy, setAiBusy] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteReason, setDeleteReason] = useState("")
  const [assignmentOpen, setAssignmentOpen] = useState(false)
  const [followupOpen, setFollowupOpen] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [queueCollapsed, setQueueCollapsed] = useState(false)
  const [dockCollapsed, setDockCollapsed] = useState(false)
  const [dockTab, setDockTab] = useState<DockTab>("intelligence")
  const [toolsOpen, setToolsOpen] = useState(false)
  const [messageSearch, setMessageSearch] = useState("")
  const [theatre, setTheatre] = useState<TheatreData>({ artifacts: [], presence: [], draft: null })
  const [draftStatus, setDraftStatus] = useState<"saved" | "saving" | "idle">("idle")
  const timelineRef = useRef<HTMLDivElement | null>(null)
  const messageSearchRef = useRef<HTMLInputElement | null>(null)
  const conversationsRef = useRef<AcWhatsAppConversation[]>([])

  const conversations = data?.conversations || []
  useEffect(() => { conversationsRef.current = conversations }, [conversations])
  const selected = detail?.conversation || conversations.find((row) => row.id === selectedId) || null
  const selectedMetadata = (selected?.metadata || {}) as Record<string, any>
  const selectedLabels = labelIds(selected)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return conversations
      .filter((row) => {
        const viewMatch = view === "all"
          || (view === "unread" && row.unread_count > 0)
          || (view === "waiting" && row.status === "waiting_customer")
          || row.status === view
        if (!viewMatch) return false
        if (!needle) return true
        return [row.contact?.display_name, row.contact?.organization_name, row.contact?.phone_number_e164, row.last_message_preview, row.subject]
          .some((value) => String(value || "").toLowerCase().includes(needle))
      })
      .sort((a, b) => Number(Boolean((b.metadata as any)?.pinned)) - Number(Boolean((a.metadata as any)?.pinned)))
  }, [conversations, query, view])

  useEffect(() => {
    if (!selectedId && filtered[0]) setSelectedId(filtered[0].id)
  }, [filtered, selectedId])

  useEffect(() => {
    if (!selectedId) { setDetail(null); return }
    let active = true
    const row = conversationsRef.current.find((item) => item.id === selectedId)
    setDetailLoading(true)
    ;(async () => {
      try {
        if (row && row.unread_count > 0) {
          const readAt = new Date().toISOString()
          setData((current) => current ? {
            ...current,
            conversations: current.conversations.map((item) => item.id === selectedId ? { ...item, unread_count: 0, last_read_at: readAt, last_read_by_user_id: current.actor.id } : item),
            counts: { ...current.counts, unread: Math.max(0, (current.counts.unread || 0) - row.unread_count) },
          } : current)
          await acApi(`/api/ac-whatsapp/conversations/${selectedId}`, { method: "PATCH", body: JSON.stringify({ action: "mark_read", reason: "Conversation ouverte dans Live Command" }) })
        }
        const next = normalizeConversationSnapshot(await acApi<ConversationDetail>(`/api/ac-whatsapp/conversations/${selectedId}`))
        if (active) setDetail(next)
      } catch (cause) {
        if (active) {
          setNotice({ ...friendlyAcError(cause), tone: "danger" })
          refresh().catch(() => undefined)
        }
      } finally {
        if (active) setDetailLoading(false)
      }
    })()
    return () => { active = false }
  }, [selectedId, refresh, setData])

  useEffect(() => {
    if (!selectedId) return
    let active = true
    const sync = async () => {
      if (document.visibilityState !== "visible") return
      try {
        const next = normalizeConversationSnapshot(await acApi<ConversationDetail>(`/api/ac-whatsapp/conversations/${selectedId}`))
        if (active) setDetail((current) => mergeConversationSnapshot(current, next))
      } catch {
        // Silent refresh never blanks a conversation that is already visible.
      }
    }
    const timer = window.setInterval(() => { void sync() }, 7000)
    return () => { active = false; window.clearInterval(timer) }
  }, [selectedId])

  async function reloadSelected() {
    if (!selectedId) return
    const [next] = await Promise.all([
      acApi<ConversationDetail>(`/api/ac-whatsapp/conversations/${selectedId}`),
      refresh(),
    ])
    const normalized = normalizeConversationSnapshot(next)
    setDetail((current) => mergeConversationSnapshot(current, normalized))
  }


  const reloadTheatre = useCallback(async () => {
    if (!selectedId) { setTheatre({ artifacts: [], presence: [], draft: null }); return }
    try {
      const next = await acApi<TheatreData>(`/api/ac-whatsapp/conversations/${selectedId}/theatre`)
      setTheatre(next)
      if (next.draft?.body) setComposer((current) => current || String(next.draft?.body || ""))
    } catch {
      // The core conversation remains usable if the advanced theatre layer is temporarily unavailable.
    }
  }, [selectedId])

  useEffect(() => {
    setComposer("")
    setNoteMode(false)
    setMessageSearch("")
    if (!selectedId) return
    void reloadTheatre()
    const ping = () => acApi(`/api/ac-whatsapp/conversations/${selectedId}/theatre`, {
      method: "POST",
      body: JSON.stringify({ action: "presence.ping", activity: "viewing" }),
    }).then((result: any) => setTheatre((current) => ({ ...current, presence: result.presence || current.presence }))).catch(() => undefined)
    void ping()
    const timer = window.setInterval(ping, 20000)
    return () => window.clearInterval(timer)
  }, [selectedId, reloadTheatre])

  useEffect(() => {
    if (!selectedId) return
    const timer = window.setTimeout(() => {
      setDraftStatus("saving")
      acApi(`/api/ac-whatsapp/conversations/${selectedId}/theatre`, {
        method: "POST",
        body: JSON.stringify({ action: "draft.save", body: composer, mode: noteMode ? "internal" : "customer" }),
      }).then(() => setDraftStatus("saved")).catch(() => setDraftStatus("idle"))
    }, 850)
    return () => window.clearTimeout(timer)
  }, [selectedId, composer, noteMode])

  async function createArtifact(artifactType: string, title?: string, sourceMessageId?: string, payload: Record<string, unknown> = {}) {
    if (!selectedId) return
    try {
      await acApi(`/api/ac-whatsapp/conversations/${selectedId}/theatre`, {
        method: "POST",
        body: JSON.stringify({ action: "artifact.create", artifact_type: artifactType, title: title || featureTitle(artifactType), source_message_id: sourceMessageId || null, payload }),
      })
      await reloadTheatre()
      setNotice({ tone: "success", title: title || featureTitle(artifactType), description: "L’élément a été relié à la conversation, attribué à votre identité et ajouté à la traçabilité." })
    } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) }
  }

  function jumpToMessage(kind: "last-inbound" | "last-outbound" | "first" | "search") {
    const root = timelineRef.current
    if (!root) return
    let target: HTMLElement | null = null
    if (kind === "first") target = root.querySelector<HTMLElement>("[data-message-id]")
    if (kind === "last-inbound") target = [...root.querySelectorAll<HTMLElement>('[data-message-direction="inbound"]')].at(-1) || null
    if (kind === "last-outbound") target = [...root.querySelectorAll<HTMLElement>('[data-message-direction="outbound"]')].at(-1) || null
    if (kind === "search") {
      const needle = messageSearch.trim().toLowerCase()
      target = [...root.querySelectorAll<HTMLElement>("[data-message-search]")].find((node) => String(node.dataset.messageSearch || "").includes(needle)) || null
    }
    target?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  async function executeFeature(feature: FeatureDefinition) {
    if (feature.kind === "ai") { setToolsOpen(false); await runAi(feature.action); return }
    if (feature.kind === "artifact") { setToolsOpen(false); await createArtifact(feature.action, feature.label); return }
    setToolsOpen(false)
    if (feature.action === "followup") setFollowupOpen(true)
    if (feature.action === "assign") setAssignmentOpen(true)
    if (feature.action === "internal_note") setNoteMode(true)
    if (feature.action === "focus") setFocusMode((value) => !value)
    if (feature.action === "search") window.setTimeout(() => messageSearchRef.current?.focus(), 40)
    if (feature.action === "presence") setDockTab("history")
    if (feature.action === "timeline") setDockTab("history")
  }

  async function conversationAction(action: string, payload: Record<string, unknown> = {}, success?: string) {
    if (!selectedId) return
    try {
      const updated = await acApi<AcWhatsAppConversation>(`/api/ac-whatsapp/conversations/${selectedId}`, {
        method: "PATCH",
        body: JSON.stringify({ action, ...payload, reason: success || action }),
      })
      setDetail((current) => current ? { ...current, conversation: { ...current.conversation, ...updated } } : current)
      setMenuOpen(false)
      await reloadSelected()
      setNotice({ tone: "success", title: success || "Conversation mise à jour", description: "L’action a été enregistrée, synchronisée et ajoutée à la traçabilité AngelCare." })
    } catch (cause) {
      setNotice({ ...friendlyAcError(cause), tone: "danger" })
    }
  }

  async function updateConversation(patch: Record<string, unknown>, success: string) {
    if (!selectedId) return
    try {
      await acApi(`/api/ac-whatsapp/conversations/${selectedId}`, { method: "PATCH", body: JSON.stringify({ ...patch, reason: success }) })
      await reloadSelected()
      setNotice({ tone: "success", title: success, description: "La conversation a été mise à jour et tracée dans l’audit AngelCare." })
    } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) }
  }

  async function sendMessage() {
    const text = composer.trim()
    if (!selectedId || !text || sending) return
    setSending(true)
    try {
      const result = await acApi<any>("/api/ac-whatsapp/messages/send", { method: "POST", body: JSON.stringify({ conversationId: selectedId, text, messageType: noteMode ? "internal" : "text", internalNote: noteMode }) })
      setComposer("")
      await reloadSelected()
      if (noteMode) setNotice({ tone: "success", title: "Note interne conservée", description: "La note est visible uniquement par les utilisateurs AngelCare autorisés et porte votre identité réelle." })
      else if (String(result?.status || "").toLowerCase() === "queued") setNotice({ tone: "warning", title: "Message en file d’envoi", description: result?.error_message ? `WhatsApp n’a pas encore confirmé l’envoi : ${result.error_message}` : "Le message est conservé dans la file durable et attend une nouvelle tentative de transport." })
      else setNotice({ tone: "success", title: "Message accepté par WhatsApp", description: "OpenWA a accepté le message et son identifiant de transport a été enregistré." })
    } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) }
    finally { setSending(false) }
  }

  async function runAi(mode: string, sourceText = composer) {
    if (!selectedId || aiBusy) return
    setAiBusy(true); setAiOpen(true); setAiResult("")
    try {
      const result = await acApi<any>("/api/ac-whatsapp/ai/assist", { method: "POST", body: JSON.stringify({ conversationId: selectedId, action: mode, sourceText }) })
      const text = String(result?.text || result?.content || result?.reply || result?.result || JSON.stringify(result, null, 2))
      setAiResult(text)
      if (["reply", "reply_matrix", "translate"].includes(mode)) setComposer(text)
    } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) }
    finally { setAiBusy(false) }
  }

  async function toggleLabel(id: string) {
    const next = new Set(selectedLabels)
    if (next.has(id)) next.delete(id); else next.add(id)
    await conversationAction("set_labels", { label_ids: [...next] }, "Étiquettes mises à jour")
  }

  async function permanentDelete() {
    if (!selectedId || !deleteReason.trim()) return
    try {
      await acApi(`/api/ac-whatsapp/conversations/${selectedId}`, { method: "DELETE", body: JSON.stringify({ confirm: "PERMANENT_DELETE", reason: deleteReason.trim() }) })
      setDeleteOpen(false); setDeleteReason(""); setSelectedId(null); setDetail(null)
      await refresh()
      setNotice({ tone: "success", title: "Conversation supprimée", description: "La suppression administrative a été exécutée et auditée." })
    } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) }
  }

  if (loading && !data) return <LoadingPanel label="Ouverture du Live Command" />

  const openCount = conversations.filter((row) => !["resolved", "closed", "archived"].includes(row.status)).length
  const waitingCount = conversations.filter((row) => row.status === "waiting_customer").length
  const escalationCount = conversations.filter((row) => row.status === "escalated").length
  const unassignedCount = conversations.filter((row) => row.status === "unassigned" || !row.assigned_user_id).length
  const canDelete = Boolean(data?.actor.permissions.includes("ac-whatsapp.message.delete") || data?.actor.permissions.includes("ac-whatsapp.*") || data?.actor.permissions.includes("*"))

  const activeArtifacts = theatre.artifacts.filter((artifact) => !["completed", "cancelled", "closed"].includes(artifact.status))
  const latestInbound = [...(detail?.messages || [])].reverse().find((message) => message.direction === "inbound" && isRenderableTimelineMessage(message))
  const relationshipScore = Math.min(100, 28
    + (selected?.contact?.display_name ? 12 : 0)
    + (selected?.contact?.organization_name ? 10 : 0)
    + (selected?.assigned_user_id ? 10 : 0)
    + Math.min(20, (detail?.messages.length || 0) * 2)
    + Math.min(20, activeArtifacts.length * 4))

  return <div className="space-y-3">
    <ACWhatsAppContrastGuard />
    {error ? <NoticeBanner tone="danger" {...friendlyAcError(error)} /> : null}
    {notice ? <NoticeBanner tone={notice.tone || "info"} title={notice.title} description={notice.description} reference={notice.reference} onClose={() => setNotice(null)} /> : null}

    {selected ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_32px_rgba(15,23,42,.05)]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-rose-600 text-white"><Command className="h-4 w-4" /></div>
        <div className="min-w-0"><p className="text-[8px] font-black uppercase tracking-[.18em] text-slate-500">Relationship Command Theatre · Live</p><p className="truncate text-sm font-black text-slate-950">Une conversation, une vérité relationnelle, une prochaine action gouvernée.</p></div>
      </div>
      <div className="flex flex-wrap items-center gap-2 acw-command-modal acw-floating-surface !text-slate-950">
        <MetricChip label="Ouvertes" value={openCount} />
        <MetricChip label="Non attribuées" value={unassignedCount} tone="amber" />
        <MetricChip label="Attente client" value={waitingCount} tone="blue" />
        <button type="button" onClick={() => setToolsOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-[9px] font-black text-white shadow-lg shadow-slate-950/15"><Command className="h-4 w-4" />30 commandes pro</button>
        <button type="button" onClick={() => setNewOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-[9px] font-black text-white"><Plus className="h-4 w-4" />Nouvelle</button>
      </div>
    </div> : <><SectionTitle eyebrow="Master Workspace 01 · Live Command" title="Le centre nerveux de chaque conversation AngelCare." description="Comprendre, répondre, attribuer, décider et convertir depuis une seule surface live." action={<button type="button" onClick={() => setNewOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-[10px] font-black text-white"><Plus className="h-4 w-4" />Nouvelle conversation</button>} /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><PulseCard label="À traiter maintenant" value={openCount} detail="Conversations ouvertes" icon={MessageCircleMore} tone="slate" /><PulseCard label="Sans propriétaire" value={unassignedCount} detail="Attribution nécessaire" icon={UsersRound} tone="amber" /><PulseCard label="Attente client" value={waitingCount} detail="Réponses envoyées" icon={Clock3} tone="blue" /><PulseCard label="Escalations" value={escalationCount} detail="Intervention requise" icon={ShieldAlert} tone="rose" /></div></>}

    <section className={cx("grid overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,.08)] xl:h-[calc(100dvh-132px)] xl:min-h-[690px] xl:max-h-[980px]", focusMode ? "xl:grid-cols-1" : queueCollapsed && dockCollapsed ? "xl:grid-cols-[76px_minmax(0,1fr)_76px]" : queueCollapsed ? "xl:grid-cols-[76px_minmax(0,1fr)_360px]" : dockCollapsed ? "xl:grid-cols-[336px_minmax(0,1fr)_76px]" : "xl:grid-cols-[336px_minmax(640px,1fr)_360px]")} data-mz7-theatre="true" style={mz7Layout.gridStyle}> 
      {!focusMode ? <aside className="flex min-h-0 flex-col overflow-hidden border-b border-slate-200 bg-[#f7f9fc] xl:border-b-0 xl:border-r">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-3 py-3">
          {!queueCollapsed ? <div><p className="text-[8px] font-black uppercase tracking-[.17em] text-slate-500">Smart Relationship Queue</p><p className="mt-1 text-[12px] font-black text-slate-950">Conversations prioritaires</p></div> : null}
          <button type="button" onClick={() => setQueueCollapsed((value) => !value)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-100" title={queueCollapsed ? "Déployer la file" : "Réduire la file"}><PanelLeftClose className={cx("h-4 w-4 transition-transform", queueCollapsed && "rotate-180")} /></button>
        </div>
        {!queueCollapsed ? <>
          <div className="shrink-0 border-b border-slate-200 p-3">
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, organisation, numéro…" className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-[11px] font-bold text-slate-950 outline-none placeholder:text-slate-500 focus:border-slate-700" /></div>
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">{smartViews.map((item) => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => setView(item.id)} className={cx("flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-[9px] font-black", view === item.id ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-slate-800 hover:border-slate-500")}><Icon className="h-3.5 w-3.5" />{item.label}</button> })}</div>
          </div>
          <div className="flex shrink-0 items-center justify-between px-4 py-3"><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-600">File intelligente</p><span className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[9px] font-black text-slate-900">{filtered.length}</span></div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3 [scrollbar-gutter:stable]">{filtered.length ? filtered.map((row) => <TheatreConversationRow key={row.id} row={row} active={row.id === selectedId} onClick={() => setSelectedId(row.id)} />) : <EmptyState compact title="Aucune conversation" description="Aucun résultat pour ce filtre." icon={Filter} />}</div>
        </> : <div className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto py-3">{filtered.slice(0, 12).map((row) => <button key={row.id} type="button" title={row.contact?.display_name || row.contact?.phone_number_e164 || "Conversation"} onClick={() => setSelectedId(row.id)} className={cx("relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-[10px] font-black", row.id === selectedId ? "bg-slate-950 text-white" : "border border-slate-300 bg-white text-slate-800")}>{initials(row.contact?.display_name)}{row.unread_count ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[7px] text-white">{row.unread_count}</span> : null}</button>)}</div>}
      </aside> : null}

      
<NativeResizeHandle side="left" value={mz7Layout.queueWidth} onPointerDown={mz7Layout.startLeftResize} onReset={mz7Layout.resetQueue} onAdjust={(delta) => mz7Layout.adjust("left", delta)} />
<main className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-white">
        {selected ? <>
          <ConversationCommandBar selected={selected} actorName={data?.actor.name || "Opérateur AngelCare"} focusMode={focusMode} messageSearch={messageSearch} messageSearchRef={messageSearchRef} onMessageSearch={setMessageSearch} onJumpSearch={() => jumpToMessage("search")} onFocus={() => setFocusMode((value) => !value)} onResolve={() => void conversationAction(selected.status === "resolved" ? "reopen" : "resolve", {}, selected.status === "resolved" ? "Conversation rouverte" : "Conversation résolue")} onAssign={() => setAssignmentOpen(true)} onFollowup={() => setFollowupOpen(true)} onOpenTools={() => setToolsOpen(true)} menuOpen={menuOpen} onMenu={() => setMenuOpen((value) => !value)} menu={menuOpen ? <ConversationMenu conversation={selected} labels={data?.labelsCatalog || []} selectedLabels={selectedLabels} canDelete={canDelete} onAction={(action, payload, success) => void conversationAction(action, payload, success)} onToggleLabel={(id) => void toggleLabel(id)} onAssign={() => { setMenuOpen(false); setAssignmentOpen(true) }} onFollowup={() => { setMenuOpen(false); setFollowupOpen(true) }} onInternalNote={() => { setMenuOpen(false); setNoteMode(true) }} onSync={() => { setMenuOpen(false); void reloadSelected() }} onDelete={() => { setMenuOpen(false); setDeleteOpen(true) }} onCopy={() => { void navigator.clipboard.writeText(selected.contact?.phone_number_e164 || selected.remote_chat_id); setMenuOpen(false) }} /> : null} />

          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-[#fbfcfe] px-4 py-2.5">
            <div className="flex items-center gap-2 overflow-x-auto"><TimelineJump label="Premier" onClick={() => jumpToMessage("first")} /><TimelineJump label="Dernier entrant" onClick={() => jumpToMessage("last-inbound")} /><TimelineJump label="Dernier sortant" onClick={() => jumpToMessage("last-outbound")} />{activeArtifacts.slice(0, 4).map((artifact) => <span key={artifact.id} className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[8px] font-black text-violet-950">{artifact.title}</span>)}</div>
            <div className="hidden items-center gap-2 md:flex"><span className="text-[8px] font-bold text-slate-500">{theatre.presence.length || 1} actif(s)</span><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.12)]" /></div>
          </div>

          <div ref={timelineRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f3f5f8] px-4 py-6 [background-image:radial-gradient(circle_at_1px_1px,rgba(15,23,42,.035)_1px,transparent_0)] [background-size:24px_24px] [scrollbar-gutter:stable]">
            <div className="mx-auto max-w-[920px] space-y-4">{detailLoading ? <div className="grid min-h-64 place-items-center"><div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-[10px] font-black text-slate-600 shadow-sm">Chargement sécurisé de la chronologie…</div></div> : detail?.messages.some(isRenderableTimelineMessage) ? renderMessageTimeline(detail.messages, { onQuote: (message) => setComposer((current) => `${current ? `${current}\n\n` : ""}> ${String(message.body || message.caption || "Message").replaceAll("\n", "\n> ")}\n\n`), onArtifact: (type, message) => void createArtifact(type, featureTitle(type), message.id, { excerpt: String(message.body || message.caption || "").slice(0, 800) }), onTranslate: (message) => void runAi("translate", String(message.body || message.caption || "")) }) : <EmptyState compact title="Conversation prête" description="Aucun message n’est encore enregistré." icon={MessageCircleMore} />}</div>
          </div>

          {theatre.presence.length > 1 ? <div className="shrink-0 border-t border-amber-200 bg-amber-50 px-4 py-2"><div className="mx-auto flex max-w-[920px] items-center gap-2 text-[8px] font-black text-amber-950"><Radio className="h-3.5 w-3.5" />{theatre.presence.length} opérateurs consultent cette conversation. Vérifiez la présence avant d’envoyer pour éviter une réponse simultanée.</div></div> : null}

          <ResponseCommandDeck selected={selected} actorName={data?.actor.name || "Opérateur AngelCare"} composer={composer} setComposer={setComposer} noteMode={noteMode} setNoteMode={setNoteMode} sending={sending} draftStatus={draftStatus} onSend={() => void sendMessage()} onAi={(action) => void runAi(action)} onFollowup={() => setFollowupOpen(true)} onOpenTools={() => setToolsOpen(true)} onSent={reloadSelected} onNotice={(tone, title, description) => setNotice({ tone, title, description })} />
        </> : <ConversationOverview conversations={conversations} onSelect={setSelectedId} onNew={() => setNewOpen(true)} />}
      </main>

      {!focusMode ? <>
        <NativeResizeHandle side="right" value={mz7Layout.intelligenceWidth} onPointerDown={mz7Layout.startRightResize} onReset={mz7Layout.resetIntelligence} onAdjust={(delta) => mz7Layout.adjust("right", delta)} />
<aside className="flex min-h-0 flex-col overflow-hidden border-t border-slate-200 bg-[#f7f9fc] xl:border-l xl:border-t-0">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-3 py-3">
          {!dockCollapsed ? <div><p className="text-[8px] font-black uppercase tracking-[.17em] text-slate-500">Relationship Intelligence</p><p className="mt-1 text-[12px] font-black text-slate-950">Contexte & décision</p></div> : null}
          <button type="button" onClick={() => setDockCollapsed((value) => !value)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-100" title={dockCollapsed ? "Déployer l’intelligence" : "Réduire l’intelligence"}><PanelRightClose className={cx("h-4 w-4 transition-transform", dockCollapsed && "rotate-180")} /></button>
        </div>
        {!dockCollapsed && selected ? <>
          <div className="grid shrink-0 grid-cols-4 border-b border-slate-200 bg-white p-1.5">{([ ["profile","Profil",CircleUserRound], ["intelligence","Intelligence",Sparkles], ["actions","Actions",Target], ["history","Historique",History] ] as const).map(([id,label,Icon]) => <button key={id} type="button" onClick={() => setDockTab(id)} className={cx("flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[7px] font-black", dockTab === id ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100")}><Icon className="h-3.5 w-3.5" />{label}</button>)}</div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 [scrollbar-gutter:stable]">
            <IntelligenceDock tab={dockTab} selected={selected} detail={detail} theatre={theatre} latestInbound={latestInbound} relationshipScore={relationshipScore} onAi={(action) => void runAi(action)} onArtifact={(type, title) => void createArtifact(type, title)} onAssign={() => setAssignmentOpen(true)} onFollowup={() => setFollowupOpen(true)} onUpdate={(patch, success) => void updateConversation(patch, success)} />
          </div>
        </> : <div className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto py-3"><DockRailButton icon={CircleUserRound} active={dockTab === "profile"} onClick={() => { setDockCollapsed(false); setDockTab("profile") }} /><DockRailButton icon={Sparkles} active={dockTab === "intelligence"} onClick={() => { setDockCollapsed(false); setDockTab("intelligence") }} /><DockRailButton icon={Target} active={dockTab === "actions"} onClick={() => { setDockCollapsed(false); setDockTab("actions") }} /><DockRailButton icon={History} active={dockTab === "history"} onClick={() => { setDockCollapsed(false); setDockTab("history") }} /></div>}
      </aside> </> : null}
    </section>

    {toolsOpen ? <FeatureCommandCenter onClose={() => setToolsOpen(false)} onExecute={(feature) => void executeFeature(feature)} /> : null}
    {newOpen && data ? <NewConversationModal data={data} onClose={() => setNewOpen(false)} onCreated={async (id) => { setNewOpen(false); setSelectedId(id); await refresh(); setNotice({ tone: "success", title: "Conversation créée", description: "Le dossier est prêt dans Live Command." }) }} /> : null}
    {aiOpen ? <ModalFrame title="AC Intelligence · Command Result" eyebrow="Human-in-the-loop" description="La proposition reste sous contrôle humain, fondée sur le contexte disponible et ne part jamais automatiquement." onClose={() => setAiOpen(false)} footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => { if (aiResult) setComposer(aiResult); setAiOpen(false) }} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[9px] font-black text-slate-900">Utiliser dans le brouillon</button><button type="button" onClick={() => setAiOpen(false)} className="rounded-xl bg-slate-950 px-4 py-2.5 text-[9px] font-black text-white">Fermer</button></div>}><div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-violet-200 bg-violet-50 p-5"><p className="text-[8px] font-black uppercase tracking-[.16em] text-violet-900">Résultat gouverné</p><div className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-950">{aiBusy ? "Analyse de la conversation et du contexte…" : aiResult || "Aucune proposition disponible."}</div></div></ModalFrame> : null}
    {assignmentOpen && selected && data ? <AssignmentModal conversation={selected} users={data.users || []} queues={data.queues || []} onClose={() => setAssignmentOpen(false)} onSave={async (payload) => { await conversationAction("transfer", payload, "Responsabilité mise à jour"); setAssignmentOpen(false) }} /> : null}
    {followupOpen && selected ? <FollowupModal conversation={selected} actorId={data?.actor.id || ""} onClose={() => setFollowupOpen(false)} onSave={async (payload) => { await conversationAction("create_followup", payload, "Relance planifiée"); setFollowupOpen(false) }} /> : null}
    {deleteOpen ? <ModalFrame title="Suppression administrative" eyebrow="Action irréversible" description="L’archivage est recommandé. La suppression permanente efface la conversation et ses messages du périmètre AC WhatsApp." onClose={() => setDeleteOpen(false)} footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => setDeleteOpen(false)} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[9px] font-black text-slate-900">Annuler</button><button type="button" disabled={!deleteReason.trim()} onClick={() => void permanentDelete()} className="rounded-xl bg-rose-700 px-4 py-2.5 text-[9px] font-black text-white disabled:opacity-40">Supprimer définitivement</button></div>}><label className="block"><span className="mb-2 block text-[9px] font-black uppercase tracking-[.12em] text-slate-700">Motif obligatoire</span><textarea value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} rows={4} className="w-full rounded-2xl border border-slate-300 p-3 text-sm font-semibold text-slate-950 outline-none focus:border-rose-600" placeholder="Justification administrative…" /></label></ModalFrame> : null}
  </div>

}

function ConversationMenu({ conversation, labels, selectedLabels, canDelete, onAction, onToggleLabel, onAssign, onFollowup, onInternalNote, onSync, onDelete, onCopy }: { conversation: AcWhatsAppConversation; labels: Array<Record<string, any>>; selectedLabels: Set<string>; canDelete: boolean; onAction: (action: string, payload?: Record<string, unknown>, success?: string) => void; onToggleLabel: (id: string) => void; onAssign: () => void; onFollowup: () => void; onInternalNote: () => void; onSync: () => void; onDelete: () => void; onCopy: () => void }) {
  const metadata = (conversation.metadata || {}) as Record<string, any>
  const resolved = ["resolved", "closed"].includes(conversation.status)
  return <div className="absolute right-0 top-11 z-40 w-80 rounded-[22px] border border-slate-300 bg-white p-2 shadow-[0_24px_70px_rgba(15,23,42,.22)] acw-floating-surface">
    <p className="px-3 pb-2 pt-1 text-[8px] font-black uppercase tracking-[.16em] text-slate-600">Commandes de conversation</p>
    <MenuAction icon={conversation.unread_count ? CheckCheck : MessageCircleMore} label={conversation.unread_count ? "Marquer comme lue" : "Marquer comme non lue"} onClick={() => onAction(conversation.unread_count ? "mark_read" : "mark_unread", {}, conversation.unread_count ? "Conversation marquée lue" : "Conversation marquée non lue")} />
    <MenuAction icon={UserRoundCheck} label="Attribuer ou transférer" onClick={onAssign} />
    <MenuAction icon={resolved ? RotateCcw : CheckCheck} label={resolved ? "Rouvrir la conversation" : "Résoudre la conversation"} onClick={() => onAction(resolved ? "reopen" : "resolve", {}, resolved ? "Conversation rouverte" : "Conversation résolue")} />
    <MenuAction icon={Clock3} label="Créer une relance" onClick={onFollowup} />
    <MenuAction icon={FileText} label="Ajouter une note interne" onClick={onInternalNote} />
    <div className="my-2 border-t border-slate-200" />
    <p className="px-3 pb-2 text-[8px] font-black uppercase tracking-[.16em] text-slate-600">Priorité</p>
    <div className="grid grid-cols-3 gap-1 px-1 pb-2">{[["normal","Normale"],["high","Élevée"],["critical","Critique"]].map(([value,label]) => <button key={value} type="button" onClick={() => onAction("", { priority: value }, `Priorité ${String(label).toLowerCase()}`)} className={cx("rounded-lg border px-2 py-2 text-[8px] font-black", conversation.priority === value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100")}>{label}</button>)}</div>
    <MenuAction icon={metadata.pinned ? PinOff : Pin} label={metadata.pinned ? "Désépingler" : "Épingler"} onClick={() => onAction(metadata.pinned ? "unpin" : "pin", {}, metadata.pinned ? "Conversation désépinglée" : "Conversation épinglée")} />
    <MenuAction icon={metadata.muted ? Bell : BellOff} label={metadata.muted ? "Réactiver les notifications" : "Mettre en silencieux"} onClick={() => onAction(metadata.muted ? "unmute" : "mute", {}, metadata.muted ? "Notifications réactivées" : "Conversation mise en silencieux")} />
    <MenuAction icon={conversation.status === "archived" ? RotateCcw : Archive} label={conversation.status === "archived" ? "Restaurer" : "Archiver"} onClick={() => onAction(conversation.status === "archived" ? "restore" : "archive", {}, conversation.status === "archived" ? "Conversation restaurée" : "Conversation archivée")} />
    <MenuAction icon={RotateCcw} label="Synchroniser maintenant" onClick={onSync} />
    <MenuAction icon={Copy} label="Copier le numéro" onClick={onCopy} />
    <a href={`/ac-whatsapp/contacts?contact=${encodeURIComponent(conversation.contact_id)}`} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[10px] font-black text-slate-900 hover:bg-slate-100"><CircleUserRound className="h-4 w-4 text-slate-700" />Ouvrir le dossier contact</a>
    <div className="my-2 border-t border-slate-200" />
    <p className="px-3 pb-2 text-[8px] font-black uppercase tracking-[.16em] text-slate-600">Étiquettes</p>
    <div className="max-h-44 overflow-y-auto">{labels.length ? labels.map((label) => <button key={label.id} type="button" onClick={() => onToggleLabel(String(label.id))} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-slate-100"><span className="flex min-w-0 items-center gap-2 text-[9px] font-black text-slate-900"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: String(label.color || "#64748b") }} />{label.name}</span><span className={cx("grid h-5 w-5 place-items-center rounded-md border text-[8px] font-black", selectedLabels.has(String(label.id)) ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-transparent")}>✓</span></button>) : <p className="px-3 py-2 text-[9px] font-semibold text-slate-600">Aucune étiquette active.</p>}</div>
    {canDelete ? <><div className="my-2 border-t border-slate-200" /><MenuAction icon={Trash2} label="Supprimer définitivement" danger onClick={onDelete} /></> : null}
  </div>
}

function MenuAction({ icon: Icon, label, onClick, danger = false }: { icon: typeof Archive; label: string; onClick: () => void; danger?: boolean }) { return <button type="button" onClick={onClick} className={cx("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[10px] font-black hover:bg-slate-100", danger ? "text-rose-800" : "text-slate-900")}><Icon className="h-4 w-4" />{label}</button> }
function humanValue(value: unknown, fallback: string) { const raw = String(value || "").trim(); if (!raw || ["unknown", "undefined", "null", "n/a"].includes(raw.toLowerCase())) return fallback; const map: Record<string, string> = { normal: "Normale", high: "Élevée", urgent: "Urgente", vip: "VIP", prospect: "Prospect", customer: "Client", unqualified: "Contact non qualifié", new: "Nouveau" }; return map[raw.toLowerCase()] || raw.replaceAll("_", " ") }
function PulseCard({ label, value, detail, icon: Icon, tone }: { label: string; value: number; detail: string; icon: typeof MessageCircleMore; tone: "slate" | "amber" | "blue" | "rose" }) { const color = { slate: "bg-slate-950", amber: "bg-amber-500", blue: "bg-blue-600", rose: "bg-rose-600" }[tone]; return <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-[8px] font-black uppercase tracking-[.15em] text-slate-600">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p><p className="mt-1 text-[9px] font-semibold text-slate-600">{detail}</p></div><div className={cx("grid h-10 w-10 place-items-center rounded-2xl text-white", color)}><Icon className="h-4 w-4" /></div></div></div> }
function featureTitle(type: string) {
  const match = advancedFeatures.find((feature) => feature.action === type)
  return match?.label || type.replaceAll("_", " ")
}

function MetricChip({ label, value, tone = "slate" }: { label: string; value: number; tone?: "slate" | "amber" | "blue" }) {
  const styles = tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-950" : tone === "blue" ? "border-blue-200 bg-blue-50 text-blue-950" : "border-slate-200 bg-slate-50 text-slate-950"
  return <div className={cx("hidden h-10 items-center gap-2 rounded-xl border px-3 lg:flex", styles)}><span className="text-sm font-black">{value}</span><span className="text-[8px] font-black uppercase tracking-[.12em]">{label}</span></div>
}

function TheatreConversationRow({ row, active, onClick }: { row: AcWhatsAppConversation; active: boolean; onClick: () => void }) {
  const latestSender = row.last_message_sender_display_name_snapshot || (row.last_message_direction === "inbound" ? row.contact?.display_name : row.account?.name)
  const metadata = (row.metadata || {}) as Record<string, any>
  return <button type="button" onClick={onClick} className={cx("group relative mb-2 w-full overflow-hidden rounded-[18px] border p-3 text-left transition-all duration-200", active ? "border-slate-950 bg-[#071022] text-white shadow-[0_16px_38px_rgba(7,16,34,.22)]" : "border-slate-200 bg-white text-slate-950 hover:-translate-y-px hover:border-slate-400 hover:shadow-md")}>
    {active ? <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-rose-500" /> : null}
    <div className="flex gap-3"><div className={cx("grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-[10px] font-black", active ? "bg-white/10 text-white" : "bg-slate-100 text-slate-800")}>{initials(row.contact?.display_name)}</div><div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-2"><p className="truncate text-[11px] font-black">{row.contact?.display_name || row.contact?.phone_number_e164 || "Contact non identifié"}</p><span className={cx("shrink-0 text-[8px] font-bold", active ? "text-slate-300" : "text-slate-500")}>{formatRelative(row.last_message_at)}</span></div>
      <p className={cx("mt-1 truncate text-[9px] font-bold", active ? "text-sky-200" : "text-slate-600")}>{row.contact?.organization_name || row.queue?.name || row.account?.name || "Relation à qualifier"}</p>
      <p className={cx("mt-2 line-clamp-2 text-[10px] font-semibold leading-4", active ? "text-slate-100" : "text-slate-700")}>{row.last_message_preview || "Nouvelle conversation"}</p>
      <div className="mt-2 flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-1.5">{metadata.pinned ? <Bookmark className={cx("h-3 w-3 shrink-0", active ? "text-amber-300" : "text-amber-600")} /> : null}<span className={cx("truncate text-[7px] font-black uppercase tracking-[.08em]", active ? "text-slate-300" : "text-slate-500")}>{latestSender ? `Dernier · ${latestSender}` : "Auteur à confirmer"}</span></div>{row.unread_count > 0 && !active ? <span className="grid h-6 min-w-6 place-items-center rounded-full bg-rose-600 px-1.5 text-[9px] font-black text-white">{row.unread_count}</span> : <StatusPill status={row.status} compact />}</div>
    </div></div>
  </button>
}

function ConversationCommandBar({ selected, actorName, focusMode, messageSearch, messageSearchRef, onMessageSearch, onJumpSearch, onFocus, onResolve, onAssign, onFollowup, onOpenTools, menuOpen, onMenu, menu }: { selected: AcWhatsAppConversation; actorName: string; focusMode: boolean; messageSearch: string; messageSearchRef: React.RefObject<HTMLInputElement | null>; onMessageSearch: (value: string) => void; onJumpSearch: () => void; onFocus: () => void; onResolve: () => void; onAssign: () => void; onFollowup: () => void; onOpenTools: () => void; menuOpen: boolean; onMenu: () => void; menu: React.ReactNode }) {
  return <div className="relative z-20 shrink-0 border-b border-slate-200 bg-white px-4 py-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#071022] text-sm font-black text-white shadow-lg shadow-slate-950/15">{initials(selected.contact?.display_name)}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-[15px] font-black text-slate-950">{selected.contact?.display_name || selected.contact?.phone_number_e164 || "Contact non identifié"}</h2><StatusPill status={selected.status} compact /><StatusPill status={selected.priority || "normal"} compact /></div><p className="mt-1 truncate text-[9px] font-bold text-slate-600">{[selected.contact?.organization_name, selected.contact?.phone_number_e164, selected.account?.name].filter(Boolean).join(" · ")}</p><p className="mt-1 text-[8px] font-bold text-slate-500">Responsable : {String((selected.assigned_user as any)?.display_name || (selected.assigned_user as any)?.full_name || actorName)}</p></div></div>
      <div className="flex flex-wrap items-center gap-2"><div className="relative hidden xl:block"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" /><input ref={messageSearchRef} value={messageSearch} onChange={(event) => onMessageSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") onJumpSearch() }} placeholder="Rechercher dans le fil…" className="h-9 w-52 rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3 text-[9px] font-bold text-slate-950 outline-none focus:border-slate-700" /></div><button type="button" onClick={onAssign} className="hidden h-9 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-[8px] font-black text-slate-800 hover:bg-slate-100 lg:inline-flex"><UserRoundCog className="h-3.5 w-3.5" />Attribuer</button><button type="button" onClick={onFollowup} className="hidden h-9 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-[8px] font-black text-blue-950 hover:bg-blue-100 lg:inline-flex"><AlarmClock className="h-3.5 w-3.5" />Relance</button><button type="button" onClick={onOpenTools} className="grid h-9 w-9 place-items-center rounded-xl border border-violet-200 bg-violet-50 text-violet-950 hover:bg-violet-100" title="Commandes avancées"><Command className="h-4 w-4" /></button><button type="button" onClick={onFocus} className={cx("grid h-9 w-9 place-items-center rounded-xl border", focusMode ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100")} title="Focus Conversation"><LayoutDashboard className="h-4 w-4" /></button><button type="button" onClick={onResolve} className="inline-flex h-9 items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-100 px-3 text-[8px] font-black text-emerald-950"><CheckCheck className="h-4 w-4" />{selected.status === "resolved" ? "Rouvrir" : "Résoudre"}</button><div className="relative"><button type="button" aria-expanded={menuOpen} onClick={onMenu} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-300 bg-white text-slate-900 hover:bg-slate-100"><MoreHorizontal className="h-4 w-4" /></button>{menu}</div></div>
    </div>
  </div>
}

function TimelineJump({ label, onClick }: { label: string; onClick: () => void }) { return <button type="button" onClick={onClick} className="shrink-0 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[8px] font-black text-slate-700 hover:border-slate-500 hover:text-slate-950">{label}</button> }

function renderMessageTimeline(messages: AcWhatsAppMessage[], callbacks: { onQuote: (message: AcWhatsAppMessage) => void; onArtifact: (type: string, message: AcWhatsAppMessage) => void; onTranslate: (message: AcWhatsAppMessage) => void }) {
  let previousDate = ""
  return messages.filter(isRenderableTimelineMessage).map((message, index) => {
    const date = new Date(message.sent_at || message.received_at || message.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    const separator = date !== previousDate
    previousDate = date
    return <div key={stableMessageKey(message, index)}>{separator ? <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-slate-300" /><span className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[8px] font-black uppercase tracking-[.1em] text-slate-600">{date}</span><span className="h-px flex-1 bg-slate-300" /></div> : null}<TheatreMessageBubble message={message} {...callbacks} /></div>
  })
}

function TheatreMessageBubble({ message, onQuote, onArtifact, onTranslate }: { message: AcWhatsAppMessage; onQuote: (message: AcWhatsAppMessage) => void; onArtifact: (type: string, message: AcWhatsAppMessage) => void; onTranslate: (message: AcWhatsAppMessage) => void }) {
  const outbound = message.direction === "outbound"
  const internal = message.direction === "internal"
  const normalizedType = canonicalTimelineMessageType(message)
  const voice = ["voice", "audio"].includes(normalizedType)
  const visualMedia = ["image", "video", "document"].includes(normalizedType)
  const readableBody = timelineMessagePreview(message)
  const [open, setOpen] = useState(false)
  const identity = message.sender_identity || { display_name: message.sender_display_name_snapshot || (outbound ? "Opérateur AngelCare" : internal ? "Membre AngelCare" : "Contact non identifié"), role: message.sender_role_snapshot || (outbound ? "Membre AngelCare" : internal ? "Note interne" : "Contact") }
  const searchable = String(message.body || message.caption || "").toLowerCase()
  return <div data-message-id={message.id} data-message-direction={message.direction} data-message-search={searchable} className={cx("group flex", outbound ? "justify-end" : "justify-start")}>
    <div className={cx("relative max-w-[76%] rounded-[20px] border px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,.06)]", outbound ? "rounded-br-md border-[#071022] bg-[#071022] text-white" : internal ? "border-violet-300 bg-violet-50 text-slate-950" : "rounded-bl-md border-slate-200 bg-white text-slate-950")}>
      <button type="button" onClick={() => setOpen((value) => !value)} className={cx("absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg opacity-0 transition group-hover:opacity-100", outbound ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700")}><MoreHorizontal className="h-3.5 w-3.5" /></button>
      {open ? <div role="menu" className="absolute right-2 top-10 z-[140] w-64 rounded-2xl border border-slate-300 !bg-white p-1.5 !text-slate-950 shadow-[0_18px_55px_rgba(15,23,42,.22)] acw-floating-surface acw-message-menu" style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a", backgroundColor: "#ffffff" }}><MessageAction label="Répondre / citer" icon={MessageSquareQuote} onClick={() => { onQuote(message); setOpen(false) }} /><MessageAction label="Traduire" icon={Languages} onClick={() => { onTranslate(message); setOpen(false) }} /><MessageAction label="Épingler comme jalon" icon={Milestone} onClick={() => { onArtifact("milestone", message); setOpen(false) }} /><MessageAction label="Extraire un engagement" icon={ClipboardCheck} onClick={() => { onArtifact("commitment", message); setOpen(false) }} /><MessageAction label="Marquer comme preuve" icon={Eye} onClick={() => { onArtifact("evidence", message); setOpen(false) }} /><MessageAction label="Créer une mission" icon={ListChecks} onClick={() => { onArtifact("task", message); setOpen(false) }} /><MessageAction label="Copier" icon={Copy} onClick={() => { void navigator.clipboard.writeText(String(message.body || message.caption || "")); setOpen(false) }} /></div> : null}
      <div className={cx("mb-2 flex flex-wrap items-center gap-2 border-b pb-2 pr-8", outbound ? "border-white/15" : internal ? "border-violet-200" : "border-slate-200")}><span className={cx("text-[9px] font-black", outbound ? "text-sky-200" : "text-slate-950")}>{identity.display_name}</span><span className={cx("text-[8px] font-bold", outbound ? "text-slate-300" : "text-slate-600")}>{identity.role}</span>{internal ? <span className="rounded-md bg-violet-200 px-2 py-1 text-[7px] font-black text-violet-950">INTERNE · INVISIBLE AU CONTACT</span> : null}</div>
      {voice ? <VoiceMessagePlayer message={message} inverted={outbound} /> : visualMedia ? <MessageAttachmentPreview message={message} inverted={outbound} /> : readableBody ? <div className="whitespace-pre-wrap text-[13px] font-semibold leading-6">{readableBody}</div> : null}
      {(voice || visualMedia) && (message.caption || message.body) ? <p className={cx("mt-2 text-[10px] font-semibold", outbound ? "text-slate-300" : "text-slate-700")}>{message.caption || message.body}</p> : null}
      <div className={cx("mt-2 flex items-center justify-end gap-2 text-[8px] font-bold", outbound ? "text-slate-300" : "text-slate-500")}><span>{formatDateTime(message.sent_at || message.received_at || message.created_at)}</span>{outbound ? <><StatusPill status={message.status} compact />{["delivered", "read"].includes(message.status) ? <CheckCheck className="h-3.5 w-3.5" /> : null}</> : null}</div>
    </div>
  </div>
}

function MessageAction({ label, icon: Icon, onClick }: { label: string; icon: typeof Copy; onClick: () => void }) { return <button role="menuitem" type="button" onClick={onClick} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[9px] font-black !text-slate-950 hover:!bg-slate-100" style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a" }}><Icon className="h-3.5 w-3.5 !text-slate-700" style={{ color: "#334155" }} /><span style={{ color: "#0f172a", WebkitTextFillColor: "#0f172a" }}>{label}</span></button> }

function ResponseCommandDeck({ selected, actorName, composer, setComposer, noteMode, setNoteMode, sending, draftStatus, onSend, onAi, onFollowup, onOpenTools, onSent, onNotice }: { selected: AcWhatsAppConversation; actorName: string; composer: string; setComposer: (value: string) => void; noteMode: boolean; setNoteMode: (value: boolean) => void; sending: boolean; draftStatus: string; onSend: () => void; onAi: (action: string) => void; onFollowup: () => void; onOpenTools: () => void; onSent: () => Promise<void>; onNotice: (tone: "success" | "danger" | "warning" | "info", title: string, description: string) => void }) {
  return <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3"><div className="mx-auto max-w-[920px]"><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1"><button type="button" onClick={() => setNoteMode(false)} className={cx("rounded-lg px-3 py-1.5 text-[9px] font-black", !noteMode ? "bg-[#071022] text-white" : "text-slate-700")}>Message client</button><button type="button" onClick={() => setNoteMode(true)} className={cx("rounded-lg px-3 py-1.5 text-[9px] font-black", noteMode ? "bg-violet-600 text-white" : "text-slate-700")}>Note interne</button></div><div className="flex items-center gap-2 text-[8px] font-bold text-slate-500"><span>Auteur : {actorName}</span><span>·</span><span>{selected.account?.name || "Compte WhatsApp"}</span><span>·</span><span className={cx(draftStatus === "saved" ? "text-emerald-700" : draftStatus === "saving" ? "text-amber-700" : "text-slate-500")}>{draftStatus === "saved" ? "Brouillon sauvegardé" : draftStatus === "saving" ? "Sauvegarde…" : "Brouillon prêt"}</span></div></div>
    <div className={cx("overflow-hidden rounded-[20px] border shadow-[0_10px_34px_rgba(15,23,42,.07)]", noteMode ? "border-violet-300 bg-violet-50" : "border-slate-300 bg-white")}><textarea value={composer} onChange={(event) => setComposer(event.target.value)} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") onSend() }} rows={3} placeholder={noteMode ? "Note interne — invisible au contact" : "Rédiger une réponse précise, humaine et orientée prochaine action…"} className="max-h-52 min-h-[88px] w-full resize-y bg-transparent px-4 py-3 text-[13px] font-semibold leading-6 text-slate-950 outline-none placeholder:text-slate-500" /><div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white/80 px-2 py-2"><div className="flex flex-wrap items-center gap-1"><AttachmentMessageStudio conversationId={selected.id} disabled={noteMode || sending} onSent={onSent} onSuccess={(title, description) => onNotice("success", title, description)} onQueued={(title, description) => onNotice("warning", title, description)} onError={(title, description) => onNotice("danger", title, description)} /><ComposerButton icon={FileText} label="Modèle" /><VoiceMessageStudio conversationId={selected.id} disabled={noteMode || sending} onSent={onSent} onSuccess={(title, description) => onNotice("success", title, description)} onQueued={(title, description) => onNotice("warning", title, description)} onError={(title, description) => onNotice("danger", title, description)} /><button type="button" onClick={() => onAi("reply_matrix")} className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-2.5 py-2 text-[8px] font-black text-violet-950 hover:bg-violet-100"><WandSparkles className="h-3.5 w-3.5" />Réponse Studio</button><button type="button" onClick={onFollowup} className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[8px] font-black text-slate-700 hover:bg-slate-100"><AlarmClock className="h-3.5 w-3.5" />Relance</button><button type="button" onClick={onOpenTools} className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[8px] font-black text-slate-700 hover:bg-slate-100"><SlidersHorizontal className="h-3.5 w-3.5" />Plus</button></div><button type="button" onClick={onSend} disabled={!composer.trim() || sending} className={cx("inline-flex h-10 items-center gap-2 rounded-xl px-5 text-[9px] font-black shadow-lg disabled:cursor-not-allowed disabled:opacity-40", noteMode ? "bg-violet-600 text-white shadow-violet-600/20" : "bg-rose-600 text-white shadow-rose-600/20")}><Send className="h-4 w-4" />{sending ? "Traitement…" : noteMode ? "Conserver la note" : "Envoyer"}</button></div></div></div></div>
}

function IntelligenceDock({ tab, selected, detail, theatre, latestInbound, relationshipScore, onAi, onArtifact, onAssign, onFollowup, onUpdate }: { tab: DockTab; selected: AcWhatsAppConversation; detail: ConversationDetail | null; theatre: TheatreData; latestInbound?: AcWhatsAppMessage; relationshipScore: number; onAi: (action: string) => void; onArtifact: (type: string, title: string) => void; onAssign: () => void; onFollowup: () => void; onUpdate: (patch: Record<string, unknown>, success: string) => void }) {
  if (tab === "profile") return <div className="space-y-3"><DockCard eyebrow="Identity 360" title="Dossier relationnel" icon={CircleUserRound}><div className="space-y-3"><InfoLine label="Type" value={humanValue(selected.contact?.contact_type, "Contact non qualifié")} /><InfoLine label="Organisation" value={humanValue(selected.contact?.organization_name, "Non renseignée")} /><InfoLine label="Téléphone" value={selected.contact?.phone_number_e164 || "Non renseigné"} /><InfoLine label="Ville" value={humanValue(selected.contact?.city, "Non renseignée")} /><InfoLine label="Étape" value={humanValue(selected.contact?.lead_stage, "Nouveau")} /></div></DockCard><DockCard eyebrow="Relationship score" title={`${relationshipScore}/100 · Maîtrise actuelle`} icon={Gauge}><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${relationshipScore}%` }} /></div><p className="mt-3 text-[9px] font-semibold leading-5 text-slate-600">Score explicable basé sur identité, propriétaire, activité et engagements visibles.</p></DockCard></div>
  if (tab === "intelligence") return <div className="space-y-3"><DockCard eyebrow="Live briefing" title="Ce qui compte maintenant" icon={Sparkles}><p className="text-[10px] font-semibold leading-5 text-slate-700">{selected.summary || latestInbound?.body || latestInbound?.caption || "Aucun besoin textuel récent. Ouvrez le Brief conversation live pour produire une synthèse gouvernée."}</p><div className="mt-3 grid gap-2"><DockAction label="Générer le brief" icon={ScanText} onClick={() => onAi("summary")} /><DockAction label="Questions ouvertes" icon={SearchCheck} onClick={() => onAi("unanswered_questions")} /><DockAction label="Risques & sentiment" icon={CircleGauge} onClick={() => onAi("sentiment_risk")} /><DockAction label="Prochaine action" icon={Target} onClick={() => onAi("next_action")} /></div></DockCard><DockCard eyebrow="Signals" title="Intention & risque" icon={Radio}><div className="grid grid-cols-2 gap-2"><Signal label="Intention" value={humanValue(selected.intent, "À qualifier")} /><Signal label="Sentiment" value={humanValue(selected.sentiment, "Non analysé")} /><Signal label="Messages" value={String(detail?.messages.length || 0)} /><Signal label="Artefacts actifs" value={String(theatre.artifacts.filter((row) => row.status === "open").length)} /></div></DockCard></div>
  if (tab === "actions") return <div className="space-y-3"><DockCard eyebrow="Next command" title="Décider et convertir" icon={Target}><div className="grid grid-cols-2 gap-2"><MiniAction label="Attribuer" icon={UserRoundCheck} onClick={onAssign} /><MiniAction label="Relance" icon={AlarmClock} onClick={onFollowup} /><MiniAction label="Escalader" icon={ShieldAlert} onClick={() => onUpdate({ status: "escalated" }, "Conversation escaladée")} /><MiniAction label="Attente client" icon={Clock3} onClick={() => onUpdate({ status: "waiting_customer" }, "Conversation placée en attente client")} /></div></DockCard><DockCard eyebrow="Conversion" title="Transformer le dialogue" icon={BriefcaseBusiness}><div className="space-y-2"><DockAction label="Créer une opportunité" icon={BriefcaseBusiness} onClick={() => onArtifact("opportunity", "Opportunité issue de la conversation")} /><DockAction label="Créer un dossier métier" icon={FileCheck2} onClick={() => onArtifact("case", "Dossier métier issu de la conversation")} /><DockAction label="Demander validation" icon={UserCheck} onClick={() => onArtifact("approval", "Validation superviseur requise")} /><DockAction label="Créer un jalon" icon={Milestone} onClick={() => onArtifact("milestone", "Jalon relationnel")} /></div></DockCard></div>
  return <div className="space-y-3"><DockCard eyebrow="Présence" title="Équipe active" icon={Radio}>{theatre.presence.length ? <div className="space-y-2">{theatre.presence.map((presence) => <div key={presence.user_id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3"><div><p className="text-[9px] font-black text-slate-950">{presence.display_name_snapshot || "Utilisateur AngelCare"}</p><p className="mt-1 text-[8px] font-semibold text-slate-500">{presence.role_snapshot || presence.activity || "Actif"}</p></div><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /></div>)}</div> : <p className="text-[9px] font-semibold text-slate-600">Vous êtes le seul utilisateur actif sur cette conversation.</p>}</DockCard><DockCard eyebrow="Artifacts & audit" title="Chronologie structurée" icon={Workflow}><div className="space-y-2">{theatre.artifacts.slice(0, 10).map((artifact) => <div key={artifact.id} className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex items-start justify-between gap-2"><p className="text-[9px] font-black text-slate-950">{artifact.title}</p><StatusPill status={artifact.status || "open"} compact /></div><p className="mt-1 text-[8px] font-semibold text-slate-500">{artifact.artifact_type.replaceAll("_", " ")} · {formatRelative(artifact.created_at)}</p></div>)}{!theatre.artifacts.length ? <p className="text-[9px] font-semibold text-slate-600">Aucun jalon structuré. Utilisez les commandes avancées.</p> : null}</div></DockCard></div>
}

function DockCard({ eyebrow, title, icon: Icon, children }: { eyebrow: string; title: string; icon: typeof Sparkles; children: React.ReactNode }) { return <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_8px_26px_rgba(15,23,42,.04)]"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#071022] text-white"><Icon className="h-4 w-4" /></div><div><p className="text-[7px] font-black uppercase tracking-[.16em] text-slate-500">{eyebrow}</p><h3 className="mt-1 text-[12px] font-black text-slate-950">{title}</h3></div></div><div className="mt-4">{children}</div></div> }
function DockAction({ label, icon: Icon, onClick }: { label: string; icon: typeof Sparkles; onClick: () => void }) { return <button type="button" onClick={onClick} className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-[9px] font-black text-slate-800 hover:border-slate-400 hover:bg-white"><span className="flex items-center gap-2"><Icon className="h-3.5 w-3.5" />{label}</span><ChevronRight className="h-3.5 w-3.5" /></button> }
function Signal({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-[7px] font-black uppercase tracking-[.12em] text-slate-500">{label}</p><p className="mt-1 text-[10px] font-black text-slate-950">{value}</p></div> }
function DockRailButton({ icon: Icon, active, onClick }: { icon: typeof Sparkles; active: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className={cx("grid h-10 w-10 place-items-center rounded-xl border", active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-slate-700")}><Icon className="h-4 w-4" /></button> }

function FeatureCommandCenter({ onClose, onExecute }: { onClose: () => void; onExecute: (feature: FeatureDefinition) => void }) {
  const [category, setCategory] = useState("Toutes")
  const categories = ["Toutes", ...Array.from(new Set(advancedFeatures.map((feature) => feature.category)))]
  const visible = category === "Toutes" ? advancedFeatures : advancedFeatures.filter((feature) => feature.category === category)
  return <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"><div className="flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-[30px] border border-white/20 bg-[#f7f9fc] shadow-[0_40px_120px_rgba(15,23,42,.4)]"><div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-5 acw-command-modal acw-floating-surface"><div><p className="text-[8px] font-black uppercase tracking-[.2em] text-rose-600">AC Conversation Power Layer</p><h2 className="mt-2 text-2xl font-black text-slate-950 !text-slate-950 !text-slate-950">30 commandes professionnelles</h2><p className="mt-1 text-[10px] font-semibold text-slate-600">Intelligence, mémoire, collaboration, gouvernance, qualité et conversion — sous contrôle humain.</p></div><button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-300 bg-white text-slate-800"><X className="h-5 w-5" /></button></div><div className="flex shrink-0 gap-2 overflow-x-auto border-b border-slate-200 bg-white px-6 py-3">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={cx("shrink-0 rounded-full border px-3 py-2 text-[8px] font-black", category === item ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-slate-700")}>{item}</button>)}</div><div className="min-h-0 flex-1 overflow-y-auto p-5"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{visible.map((feature, index) => { const Icon = feature.icon; return <button key={feature.id} type="button" onClick={() => onExecute(feature)} className="group rounded-[20px] border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-1 hover:border-slate-400 hover:shadow-lg"><div className="flex items-start justify-between gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#071022] text-white"><Icon className="h-4 w-4" /></div><span className="text-[9px] font-black text-slate-400">{String(index + 1).padStart(2, "0")}</span></div><h3 className="mt-4 text-[12px] font-black text-slate-950">{feature.label}</h3><p className="mt-2 text-[9px] font-semibold leading-5 text-slate-600">{feature.description}</p><div className="mt-4 flex items-center justify-between"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[7px] font-black uppercase tracking-[.1em] text-slate-600">{feature.category}</span><ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-900" /></div></button> })}</div></div></div></div>
}

function ConversationOverview({ conversations, onSelect, onNew }: { conversations: AcWhatsAppConversation[]; onSelect: (id: string) => void; onNew: () => void }) { return <div className="grid min-h-0 flex-1 place-items-center bg-[#f4f6fa] p-8"><div className="w-full max-w-3xl rounded-[30px] border border-slate-200 bg-white p-8 text-center shadow-xl"><div className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-[#071022] text-white"><MessageCircleMore className="h-6 w-6" /></div><h2 className="mt-5 text-2xl font-black text-slate-950">Ouvrez une conversation prioritaire</h2><p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">La chronologie, le briefing, les engagements et les commandes professionnelles apparaîtront dans le Relationship Command Theatre.</p><div className="mt-6 grid gap-3 md:grid-cols-2">{conversations.slice(0, 4).map((row) => <button key={row.id} type="button" onClick={() => onSelect(row.id)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-slate-500"><p className="text-[11px] font-black text-slate-950">{row.contact?.display_name || row.contact?.phone_number_e164 || "Contact"}</p><p className="mt-1 truncate text-[9px] font-semibold text-slate-600">{row.last_message_preview || "Nouvelle conversation"}</p></button>)}</div><button type="button" onClick={onNew} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-[9px] font-black text-white"><Plus className="h-4 w-4" />Nouvelle conversation</button></div></div> }

function ComposerButton({ icon: Icon, label }: { icon: typeof Paperclip; label: string }) { return <button type="button" className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[8px] font-black text-slate-700 hover:bg-slate-100"><Icon className="h-3.5 w-3.5" />{label}</button> }
function InfoLine({ label, value }: { label: string; value?: string | null }) { return <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2.5 last:border-0"><span className="text-[8px] font-black uppercase tracking-[.12em] text-slate-600">{label}</span><span className="truncate text-[10px] font-black text-slate-950">{value || "—"}</span></div> }
function MiniAction({ label, icon: Icon, onClick }: { label: string; icon: typeof UserRoundCheck; onClick: () => void }) { return <button type="button" onClick={onClick} className="rounded-2xl border border-slate-300 bg-white p-3 text-left hover:border-slate-500 hover:bg-slate-50"><Icon className="h-4 w-4 text-slate-900" /><p className="mt-2 text-[9px] font-black text-slate-900">{label}</p></button> }
function AiAction({ label, icon: Icon, onClick }: { label: string; icon: typeof Sparkles; onClick: () => void }) { return <button type="button" onClick={onClick} className="flex w-full items-center justify-between rounded-xl border border-violet-300 bg-violet-100 px-3 py-2.5 text-left text-[9px] font-black text-violet-950"><span className="flex items-center gap-2"><Icon className="h-3.5 w-3.5" />{label}</span><ChevronDown className="h-3.5 w-3.5 -rotate-90" /></button> }

const controlClass = "w-full rounded-[14px] border border-slate-300 bg-white px-3 py-2.5 text-[11px] font-bold text-slate-950 outline-none focus:border-slate-600 focus:ring-4 focus:ring-slate-200/60"

function AssignmentModal({ conversation, users, queues, onClose, onSave }: { conversation: AcWhatsAppConversation; users: Array<Record<string, any>>; queues: Array<Record<string, any>>; onClose: () => void; onSave: (payload: Record<string, unknown>) => Promise<void> }) {
  const [form, setForm] = useState({ assigned_user_id: conversation.assigned_user_id || "", queue_id: conversation.queue_id || "" })
  const [busy, setBusy] = useState(false)
  return <ModalFrame title="Attribuer ou transférer" eyebrow="Responsabilité opérationnelle" description="Choisissez la file et le responsable en conservant tout le contexte de la conversation." onClose={onClose} footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[9px] font-black text-slate-900">Annuler</button><button type="button" disabled={busy} onClick={async () => { setBusy(true); try { await onSave(form) } finally { setBusy(false) } }} className="rounded-xl bg-slate-950 px-4 py-2.5 text-[9px] font-black text-white disabled:opacity-40">{busy ? "Enregistrement…" : "Confirmer"}</button></div>}><div className="grid gap-4 md:grid-cols-2"><Field label="File responsable"><select value={form.queue_id} onChange={(event) => setForm({ ...form, queue_id: event.target.value })} className={controlClass}><option value="">File générale</option>{queues.map((queue) => <option key={String(queue.id)} value={String(queue.id)}>{String(queue.name || queue.code)}</option>)}</select></Field><Field label="Opérateur"><select value={form.assigned_user_id} onChange={(event) => setForm({ ...form, assigned_user_id: event.target.value })} className={controlClass}><option value="">Non attribuée</option>{users.map((user) => <option key={String(user.id)} value={String(user.id)}>{String(user.display_name || user.full_name || user.name || user.email || "Opérateur")}</option>)}</select></Field></div></ModalFrame>
}

function FollowupModal({ conversation, actorId, onClose, onSave }: { conversation: AcWhatsAppConversation; actorId: string; onClose: () => void; onSave: (payload: Record<string, unknown>) => Promise<void> }) {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000); tomorrow.setSeconds(0, 0)
  const [form, setForm] = useState({ title: `Relancer ${conversation.contact?.display_name || "le contact"}`, notes: "", due_at: tomorrow.toISOString().slice(0, 16), priority: "normal", assigned_user_id: conversation.assigned_user_id || actorId })
  const [busy, setBusy] = useState(false)
  return <ModalFrame title="Créer une relance" eyebrow="Engagement contrôlé" description="La relance devient un engagement daté, attribué et visible dans le dossier relationnel." onClose={onClose} footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[9px] font-black text-slate-900">Annuler</button><button type="button" disabled={busy || !form.title.trim() || !form.due_at} onClick={async () => { setBusy(true); try { await onSave({ ...form, due_at: new Date(form.due_at).toISOString() }) } finally { setBusy(false) } }} className="rounded-xl bg-blue-700 px-4 py-2.5 text-[9px] font-black text-white disabled:opacity-40">{busy ? "Planification…" : "Planifier"}</button></div>}><div className="grid gap-4"><Field label="Objet"><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={controlClass} /></Field><div className="grid gap-4 md:grid-cols-2 acw-command-modal acw-floating-surface"><Field label="Échéance"><input type="datetime-local" value={form.due_at} onChange={(event) => setForm({ ...form, due_at: event.target.value })} className={controlClass} /></Field><Field label="Priorité"><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })} className={controlClass}><option value="normal">Normale</option><option value="high">Élevée</option><option value="critical">Critique</option></select></Field></div><Field label="Notes"><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={4} className={cx(controlClass, "min-h-28")} /></Field></div></ModalFrame>
}

function NewConversationModal({ data, onClose, onCreated }: { data: NonNullable<ReturnType<typeof useAcWhatsApp>["data"]>; onClose: () => void; onCreated: (id: string) => void }) {
  const [form, setForm] = useState({ account_id: data.accounts.find((account) => account.status === "connected")?.id || data.accounts[0]?.id || "", contact_id: "", phone_number_e164: "", display_name: "", organization_name: "", queue_id: data.queues[0]?.id || "", priority: "normal", assign_to_me: true })
  const [busy, setBusy] = useState(false); const [notice, setNotice] = useState<Notice | null>(null)
  async function submit() { setBusy(true); try { const created = await acApi<any>("/api/ac-whatsapp/conversations", { method: "POST", body: JSON.stringify(form) }); onCreated(created.id) } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) } finally { setBusy(false) } }
  return <ModalFrame title="Ouvrir une conversation" eyebrow="Provisionnement relationnel" description="Associez le bon compte, le bon contact et la file responsable avant le premier message." onClose={onClose} footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[9px] font-black text-slate-900">Annuler</button><button type="button" onClick={() => void submit()} disabled={busy || !form.account_id || (!form.contact_id && !form.phone_number_e164)} className="rounded-xl bg-rose-600 px-4 py-2.5 text-[9px] font-black text-white disabled:opacity-40">{busy ? "Création…" : "Créer le dossier"}</button></div>}>{notice ? <NoticeBanner tone="danger" title={notice.title} description={notice.description} /> : null}<div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Compte WhatsApp"><select value={form.account_id} onChange={(event) => setForm({ ...form, account_id: event.target.value })} className="input-premium">{data.accounts.map((row) => <option key={row.id} value={row.id}>{row.name} · {row.status}</option>)}</select></Field><Field label="File responsable"><select value={form.queue_id} onChange={(event) => setForm({ ...form, queue_id: event.target.value })} className="input-premium"><option value="">File générale</option>{data.queues.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field><Field label="Contact existant"><select value={form.contact_id} onChange={(event) => setForm({ ...form, contact_id: event.target.value })} className="input-premium"><option value="">Créer depuis le numéro</option>{data.contacts.map((row) => <option key={row.id} value={row.id}>{row.display_name || row.phone_number_e164}</option>)}</select></Field><Field label="Numéro E.164"><input value={form.phone_number_e164} onChange={(event) => setForm({ ...form, phone_number_e164: event.target.value })} placeholder="+212…" className="input-premium" /></Field><Field label="Nom du contact"><input value={form.display_name} onChange={(event) => setForm({ ...form, display_name: event.target.value })} className="input-premium" /></Field><Field label="Organisation"><input value={form.organization_name} onChange={(event) => setForm({ ...form, organization_name: event.target.value })} className="input-premium" /></Field></div><style jsx global>{`.input-premium{width:100%;border:1px solid #cbd5e1;border-radius:14px;background:#fff;padding:11px 12px;font-size:11px;font-weight:700;color:#0f172a;outline:none}.input-premium:focus{border-color:#475569;box-shadow:0 0 0 3px rgba(71,85,105,.13)}`}</style></ModalFrame>
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-[8px] font-black uppercase tracking-[.14em] text-slate-700">{label}</span>{children}</label> }
