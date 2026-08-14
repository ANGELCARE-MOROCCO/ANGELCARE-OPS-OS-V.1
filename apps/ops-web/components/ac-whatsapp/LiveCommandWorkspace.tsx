"use client"
import { NativeResizeHandle, useNativeTheatreLayout } from "./NativeTheatreLayout"
import { canonicalTimelineMessageType, isRenderableTimelineMessage, mergeConversationSnapshot, normalizeConversationSnapshot, stableMessageKey, timelineMessagePreview } from "@/lib/ac-whatsapp/stability"

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
  PanelRightClose, Radio, RadioTower, ScanText, SearchCheck, ShieldCheck, SlidersHorizontal, SmilePlus,
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
import ResponseLibraryDrawer from "./ResponseLibraryDrawer"
import ConversationRevenueAutomationControl from "./ConversationRevenueAutomationControl"
import CommercialCognitionInspector from "./CommercialCognitionInspector"

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
  { id: "priority", label: "Prioritaires", icon: Gauge },
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
  const [responseLibraryOpen, setResponseLibraryOpen] = useState(false)
  const [messageSearch, setMessageSearch] = useState("")
  const [theatre, setTheatre] = useState<TheatreData>({ artifacts: [], presence: [], draft: null })
  const [draftStatus, setDraftStatus] = useState<"saved" | "saving" | "idle">("idle")
  const timelineRef = useRef<HTMLDivElement | null>(null)
  const messageSearchRef = useRef<HTMLInputElement | null>(null)
  const composerRef = useRef<HTMLTextAreaElement | null>(null)
  const conversationsRef = useRef<AcWhatsAppConversation[]>([])
  const deepLinkedMessageRef = useRef<string | null>(null)
  const requestedMessageId = searchParams.get("message")

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
          || (view === "priority" && ["high", "urgent", "vip", "critical"].includes(String(row.priority || "").toLowerCase()))
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
    const onOperatorKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = Boolean(target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return
      if (assignmentOpen || followupOpen || toolsOpen || responseLibraryOpen || newOpen || aiOpen || deleteOpen) return
      const key = event.key.toLowerCase()
      if ((key === "j" || key === "k") && filtered.length) {
        event.preventDefault()
        const current = Math.max(0, filtered.findIndex((row) => row.id === selectedId))
        const nextIndex = key === "j" ? Math.min(filtered.length - 1, current + 1) : Math.max(0, current - 1)
        setSelectedId(filtered[nextIndex]?.id || selectedId)
      } else if (key === "r" && selectedId) { event.preventDefault(); composerRef.current?.focus() }
      else if (key === "a" && selectedId) { event.preventDefault(); setAssignmentOpen(true) }
      else if (key === "f" && selectedId) { event.preventDefault(); setFollowupOpen(true) }
      else if (key === "e" && selectedId) { event.preventDefault(); setToolsOpen(true) }
    }
    window.addEventListener("keydown", onOperatorKey)
    return () => window.removeEventListener("keydown", onOperatorKey)
  }, [aiOpen, assignmentOpen, deleteOpen, filtered, followupOpen, newOpen, responseLibraryOpen, selectedId, toolsOpen])

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
    if (!requestedMessageId || !detail?.messages?.length || deepLinkedMessageRef.current === requestedMessageId) return
    const timer = window.setTimeout(() => {
      const target = timelineRef.current?.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(requestedMessageId)}"]`) || null
      if (!target) return
      deepLinkedMessageRef.current = requestedMessageId
      target.scrollIntoView({ behavior: "smooth", block: "center" })
      target.focus({ preventScroll: true })
    }, 80)
    return () => window.clearTimeout(timer)
  }, [detail?.messages, requestedMessageId])

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

  async function toggleConversationAutomation() {
    if (!selectedId || !selected) return
    const paused = !Boolean(selected.automation_paused)
    try {
      await acApi(`/api/ac-whatsapp/conversations/${selectedId}/automation`, { method: "PATCH", body: JSON.stringify({ paused, reason: paused ? "Prise en charge humaine depuis Live Command" : "Reprise automation autorisée" }) })
      await reloadSelected()
      setNotice({ tone: "success", title: paused ? "Automatisation suspendue" : "Automatisation reprise", description: paused ? "Les réponses automatiques sont bloquées sur cette conversation jusqu’à reprise explicite." : "Les règles actives peuvent de nouveau s’appliquer à cette conversation." })
    } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) }
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

  return <div className="acw-live-workspace flex min-h-0 flex-col gap-2">
    {error ? <NoticeBanner tone="danger" {...friendlyAcError(error)} /> : null}
    {notice ? <NoticeBanner tone={notice.tone || "info"} title={notice.title} description={notice.description} reference={notice.reference} onClose={() => setNotice(null)} /> : null}

    {selected ? <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-1 pb-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-950 text-white"><Command className="h-4 w-4" /></div>
        <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Live Command · Conversation active</p><p className="truncate text-[12px] font-black text-slate-950">Contexte, réponse, responsabilité et prochaine action — sans quitter le fil.</p></div>
      </div>
      <div className="flex flex-wrap items-center gap-2 acw-command-modal acw-floating-surface text-slate-950">
        <MetricChip label="Ouvertes" value={openCount} />
        <MetricChip label="Non attribuées" value={unassignedCount} tone="amber" />
        <MetricChip label="Attente client" value={waitingCount} tone="blue" />
        <button type="button" onClick={() => setToolsOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-[9px] font-black text-white shadow-lg shadow-slate-950/15"><Command className="h-4 w-4" />30 commandes pro</button>
        <button type="button" onClick={() => setNewOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-[9px] font-black text-white"><Plus className="h-4 w-4" />Nouvelle</button>
      </div>
    </div> : <><SectionTitle eyebrow="Master Workspace 01 · Live Command" title="Le centre nerveux de chaque conversation AngelCare." description="Comprendre, répondre, attribuer, décider et convertir depuis une seule surface live." action={<button type="button" onClick={() => setNewOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-[10px] font-black text-white"><Plus className="h-4 w-4" />Nouvelle conversation</button>} /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><PulseCard label="À traiter maintenant" value={openCount} detail="Conversations ouvertes" icon={MessageCircleMore} tone="slate" /><PulseCard label="Sans propriétaire" value={unassignedCount} detail="Attribution nécessaire" icon={UsersRound} tone="amber" /><PulseCard label="Attente client" value={waitingCount} detail="Réponses envoyées" icon={Clock3} tone="blue" /><PulseCard label="Escalations" value={escalationCount} detail="Intervention requise" icon={ShieldAlert} tone="rose" /></div></>}

    <section className={cx("acw-live-theatre grid min-h-0 flex-1 overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(7,20,38,.03),0_24px_80px_rgba(7,20,38,.10)]", focusMode ? "xl:grid-cols-1" : queueCollapsed && dockCollapsed ? "xl:grid-cols-[76px_minmax(0,1fr)_76px]" : queueCollapsed ? "xl:grid-cols-[76px_minmax(0,1fr)_350px]" : dockCollapsed ? "xl:grid-cols-[370px_minmax(0,1fr)_76px]" : "xl:grid-cols-[370px_minmax(620px,1fr)_350px]")} data-mz7-theatre="true" style={mz7Layout.gridStyle}>
      {!focusMode ? <aside className="acw-queue-panel flex min-h-0 flex-col overflow-hidden border-b border-slate-200 bg-[#f6f8fb] xl:border-b-0 xl:border-r">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200/90 bg-white/80 px-3.5 py-3.5 backdrop-blur-sm">
          {!queueCollapsed ? <div><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_0_4px_rgba(14,165,233,.10)]" /><p className="text-[10px] font-black uppercase tracking-[.17em] text-slate-500">Smart Relationship Queue</p></div><p className="mt-1.5 text-[13px] font-black tracking-[-.02em] text-slate-950">Conversations prioritaires</p></div> : null}
          <button type="button" onClick={() => setQueueCollapsed((value) => !value)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-100" title={queueCollapsed ? "Déployer la file" : "Réduire la file"}><PanelLeftClose className={cx("h-4 w-4 transition-transform", queueCollapsed && "rotate-180")} /></button>
        </div>
        {!queueCollapsed ? <>
          <div className="shrink-0 border-b border-slate-200/90 bg-white/55 p-3">
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, organisation, numéro…" className="w-full rounded-[14px] border border-slate-300 bg-white py-3 pl-10 pr-3 text-[11px] font-bold text-slate-950 shadow-[0_1px_2px_rgba(7,20,38,.03)] outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100" /></div>
            <div className="mt-2 flex gap-1 overflow-x-auto pb-1">{smartViews.map((item) => { const Icon = item.icon; const countForView = item.id === "all" ? conversations.length : item.id === "unassigned" ? unassignedCount : item.id === "unread" ? conversations.filter((row) => row.unread_count > 0).length : item.id === "waiting" ? waitingCount : item.id === "escalated" ? escalationCount : item.id === "priority" ? conversations.filter((row) => ["high","urgent","vip","critical"].includes(String(row.priority || "").toLowerCase())).length : conversations.filter((row) => row.status === "resolved").length; return <button key={item.id} type="button" onClick={() => setView(item.id)} className={cx("acw-queue-filter flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[9px] font-black", view === item.id ? "is-active border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-slate-800 hover:border-slate-500")}><Icon className="h-3.5 w-3.5" /><span>{item.label}</span><span className={cx("rounded-md px-1.5 py-0.5 text-[9px] tabular-nums", view === item.id ? "bg-white/14 text-white" : countForView ? "bg-slate-100 text-slate-700" : "bg-slate-50 text-slate-400")}>{countForView}</span></button> })}</div>
          </div>
          <div className="flex shrink-0 items-center justify-between px-3.5 py-2.5"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">File intelligente</p><p className="mt-0.5 text-[10px] font-bold text-slate-400">Priorité · propriétaire · signal</p></div><span className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[9px] font-black tabular-nums text-slate-900 shadow-sm">{filtered.length}</span></div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 pb-3 [scrollbar-gutter:stable]">{filtered.length ? filtered.map((row) => <TheatreConversationRow key={row.id} row={row} active={row.id === selectedId} onClick={() => setSelectedId(row.id)} />) : <EmptyState compact title="Aucune conversation" description="Aucun résultat pour ce filtre." icon={Filter} />}</div>
        </> : <div className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto py-3">{filtered.slice(0, 12).map((row) => <button key={row.id} type="button" title={row.contact?.display_name || row.contact?.phone_number_e164 || "Conversation"} onClick={() => setSelectedId(row.id)} className={cx("relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-[10px] font-black", row.id === selectedId ? "bg-slate-950 text-white" : "border border-slate-300 bg-white text-slate-800")}>{initials(row.contact?.display_name)}{row.unread_count ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] text-white">{row.unread_count}</span> : null}</button>)}</div>}
      </aside> : null}


<NativeResizeHandle side="left" value={mz7Layout.queueWidth} onPointerDown={mz7Layout.startLeftResize} onReset={mz7Layout.resetQueue} onAdjust={(delta) => mz7Layout.adjust("left", delta)} />
<main className="acw-conversation-stage flex min-h-0 min-w-0 flex-col overflow-hidden bg-white">
        {selected ? <>
          <ConversationCommandBar selected={selected} actorName={data?.actor.name || "Opérateur AngelCare"} focusMode={focusMode} messageSearch={messageSearch} messageSearchRef={messageSearchRef} onMessageSearch={setMessageSearch} onJumpSearch={() => jumpToMessage("search")} onFocus={() => setFocusMode((value) => !value)} onResolve={() => void conversationAction(selected.status === "resolved" ? "reopen" : "resolve", {}, selected.status === "resolved" ? "Conversation rouverte" : "Conversation résolue")} onAssign={() => setAssignmentOpen(true)} onFollowup={() => setFollowupOpen(true)} onOpenTools={() => setToolsOpen(true)} menuOpen={menuOpen} onMenu={() => setMenuOpen((value) => !value)} menu={menuOpen ? <ConversationMenu conversation={selected} labels={data?.labelsCatalog || []} selectedLabels={selectedLabels} canDelete={canDelete} onAction={(action, payload, success) => void conversationAction(action, payload, success)} onToggleLabel={(id) => void toggleLabel(id)} onAssign={() => { setMenuOpen(false); setAssignmentOpen(true) }} onFollowup={() => { setMenuOpen(false); setFollowupOpen(true) }} onInternalNote={() => { setMenuOpen(false); setNoteMode(true) }} onSync={() => { setMenuOpen(false); void reloadSelected() }} onDelete={() => { setMenuOpen(false); setDeleteOpen(true) }} onCopy={() => { void navigator.clipboard.writeText(selected.contact?.phone_number_e164 || selected.remote_chat_id); setMenuOpen(false) }} /> : null} />

          <div className="acw-timeline-jumpbar flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-2.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 overflow-x-auto"><TimelineJump label="Premier" onClick={() => jumpToMessage("first")} /><TimelineJump label="Dernier entrant" onClick={() => jumpToMessage("last-inbound")} /><TimelineJump label="Dernier sortant" onClick={() => jumpToMessage("last-outbound")} />{activeArtifacts.slice(0, 4).map((artifact) => <span key={artifact.id} className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[10px] font-black text-violet-950">{artifact.title}</span>)}</div>
            <div className="hidden items-center gap-2 md:flex"><span className="text-[10px] font-bold text-slate-500">{theatre.presence.length || 1} actif(s)</span><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.12)]" /></div>
          </div>

          <div ref={timelineRef} className="acw-conversation-canvas min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 [scrollbar-gutter:stable]">
            <div className="mx-auto max-w-[1120px] space-y-4">{detailLoading ? <div className="grid min-h-64 place-items-center"><div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-[10px] font-black text-slate-600 shadow-sm">Chargement sécurisé de la chronologie…</div></div> : detail?.messages.some(isRenderableTimelineMessage) ? renderMessageTimeline(detail.messages, { onQuote: (message) => setComposer((current) => `${current ? `${current}\n\n` : ""}> ${String(message.body || message.caption || "Message").replaceAll("\n", "\n> ")}\n\n`), onArtifact: (type, message) => void createArtifact(type, featureTitle(type), message.id, { excerpt: String(message.body || message.caption || "").slice(0, 800) }), onTranslate: (message) => void runAi("translate", String(message.body || message.caption || "")) }) : <EmptyState compact title="Conversation prête" description="Aucun message n’est encore enregistré." icon={MessageCircleMore} />}</div>
          </div>

          {theatre.presence.length > 1 ? <div className="shrink-0 border-t border-amber-200 bg-amber-50 px-4 py-2"><div className="mx-auto flex max-w-[1120px] items-center gap-2 text-[10px] font-black text-amber-950"><Radio className="h-3.5 w-3.5" />{theatre.presence.length} opérateurs consultent cette conversation. Vérifiez la présence avant d’envoyer pour éviter une réponse simultanée.</div></div> : null}

          <ResponseCommandDeck selected={selected} actorName={data?.actor.name || "Opérateur AngelCare"} composerRef={composerRef} composer={composer} setComposer={setComposer} noteMode={noteMode} setNoteMode={setNoteMode} sending={sending} draftStatus={draftStatus} onSend={() => void sendMessage()} onAi={(action) => void runAi(action)} onFollowup={() => setFollowupOpen(true)} onOpenResponses={() => setResponseLibraryOpen(true)} onToggleAutomation={() => void toggleConversationAutomation()} onOpenTools={() => setToolsOpen(true)} onSent={reloadSelected} onNotice={(tone, title, description) => setNotice({ tone, title, description })} />
        </> : <ConversationOverview conversations={conversations} onSelect={setSelectedId} onNew={() => setNewOpen(true)} />}
      </main>

      {!focusMode ? <>
        <NativeResizeHandle side="right" value={mz7Layout.intelligenceWidth} onPointerDown={mz7Layout.startRightResize} onReset={mz7Layout.resetIntelligence} onAdjust={(delta) => mz7Layout.adjust("right", delta)} />
<aside className="acw-intelligence-dock flex min-h-0 flex-col overflow-hidden border-t border-slate-200 bg-[#f5f8fc] xl:border-l xl:border-t-0">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white/85 px-3.5 py-3.5 backdrop-blur-sm">
          {!dockCollapsed ? <div><div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-lg bg-slate-950 text-white"><Sparkles className="h-3 w-3" /></span><p className="text-[10px] font-black uppercase tracking-[.17em] text-slate-500">Relationship Intelligence</p></div><p className="mt-1.5 text-[13px] font-black tracking-[-.02em] text-slate-950">Contexte & décision</p></div> : null}
          <button type="button" onClick={() => setDockCollapsed((value) => !value)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-100" title={dockCollapsed ? "Déployer l’intelligence" : "Réduire l’intelligence"}><PanelRightClose className={cx("h-4 w-4 transition-transform", dockCollapsed && "rotate-180")} /></button>
        </div>
        {!dockCollapsed && selected ? <>
          <div className="grid shrink-0 grid-cols-4 gap-1 border-b border-slate-200 bg-white p-2">{([ ["profile","Profil",CircleUserRound], ["intelligence","Intelligence",Sparkles], ["actions","Actions",Target], ["history","Historique",History] ] as const).map(([id,label,Icon]) => <button key={id} type="button" onClick={() => setDockTab(id)} className={cx("flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[10px] font-black transition", dockTab === id ? "border-slate-950 bg-slate-950 text-white shadow-[0_8px_18px_rgba(7,20,38,.12)]" : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950")}><Icon className="h-3.5 w-3.5" />{label}</button>)}</div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 [scrollbar-gutter:stable]">
            <IntelligenceDock tab={dockTab} selected={selected} detail={detail} theatre={theatre} latestInbound={latestInbound} relationshipScore={relationshipScore} onAi={(action) => void runAi(action)} onArtifact={(type, title) => void createArtifact(type, title)} onAssign={() => setAssignmentOpen(true)} onFollowup={() => setFollowupOpen(true)} onUpdate={(patch, success) => void updateConversation(patch, success)} />
          </div>
        </> : <div className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto py-3"><DockRailButton icon={CircleUserRound} active={dockTab === "profile"} onClick={() => { setDockCollapsed(false); setDockTab("profile") }} /><DockRailButton icon={Sparkles} active={dockTab === "intelligence"} onClick={() => { setDockCollapsed(false); setDockTab("intelligence") }} /><DockRailButton icon={Target} active={dockTab === "actions"} onClick={() => { setDockCollapsed(false); setDockTab("actions") }} /><DockRailButton icon={History} active={dockTab === "history"} onClick={() => { setDockCollapsed(false); setDockTab("history") }} /></div>}
      </aside> </> : null}
    </section>

    {toolsOpen ? <FeatureCommandCenter onClose={() => setToolsOpen(false)} onExecute={(feature) => void executeFeature(feature)} /> : null}
    {responseLibraryOpen && selected ? <ResponseLibraryDrawer conversationId={selected.id} contact={selected.contact as any} actorName={data?.actor.name || "Opérateur AngelCare"} initialQuery={composer.trim().startsWith("/") ? composer.trim() : ""} onClose={() => setResponseLibraryOpen(false)} onInsert={(text) => setComposer((current) => current ? `${current}\n\n${text}` : text)} /> : null}
    {newOpen && data ? <NewConversationModal data={data} onClose={() => setNewOpen(false)} onCreated={async (id) => { setNewOpen(false); setSelectedId(id); await refresh(); setNotice({ tone: "success", title: "Conversation créée", description: "Le dossier est prêt dans Live Command." }) }} /> : null}
    {aiOpen ? <ModalFrame title="AC Intelligence · Command Result" eyebrow="Human-in-the-loop" description="La proposition reste sous contrôle humain, fondée sur le contexte disponible et ne part jamais automatiquement." onClose={() => setAiOpen(false)} footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => { if (aiResult) setComposer(aiResult); setAiOpen(false) }} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[9px] font-black text-slate-900">Utiliser dans le brouillon</button><button type="button" onClick={() => setAiOpen(false)} className="rounded-xl bg-slate-950 px-4 py-2.5 text-[9px] font-black text-white">Fermer</button></div>}><div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-violet-200 bg-violet-50 p-5"><p className="text-[10px] font-black uppercase tracking-[.16em] text-violet-900">Résultat gouverné</p><div className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-950">{aiBusy ? "Analyse de la conversation et du contexte…" : aiResult || "Aucune proposition disponible."}</div></div></ModalFrame> : null}
    {assignmentOpen && selected && data ? <AssignmentModal conversation={selected} users={data.users || []} queues={data.queues || []} onClose={() => setAssignmentOpen(false)} onSave={async (payload) => { await conversationAction("transfer", payload, "Responsabilité mise à jour"); setAssignmentOpen(false) }} /> : null}
    {followupOpen && selected ? <FollowupModal conversation={selected} actorId={data?.actor.id || ""} onClose={() => setFollowupOpen(false)} onSave={async (payload) => { await conversationAction("create_followup", payload, "Relance planifiée"); setFollowupOpen(false) }} /> : null}
    {deleteOpen ? <ModalFrame title="Suppression administrative" eyebrow="Action irréversible" description="L’archivage est recommandé. La suppression permanente efface la conversation et ses messages du périmètre AC WhatsApp." onClose={() => setDeleteOpen(false)} footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => setDeleteOpen(false)} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[9px] font-black text-slate-900">Annuler</button><button type="button" disabled={!deleteReason.trim()} onClick={() => void permanentDelete()} className="rounded-xl bg-rose-700 px-4 py-2.5 text-[9px] font-black text-white disabled:opacity-40">Supprimer définitivement</button></div>}><label className="block"><span className="mb-2 block text-[9px] font-black uppercase tracking-[.12em] text-slate-700">Motif obligatoire</span><textarea value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} rows={4} className="w-full rounded-2xl border border-slate-300 p-3 text-sm font-semibold text-slate-950 outline-none focus:border-rose-600" placeholder="Justification administrative…" /></label></ModalFrame> : null}
  </div>

}

function ConversationMenu({ conversation, labels, selectedLabels, canDelete, onAction, onToggleLabel, onAssign, onFollowup, onInternalNote, onSync, onDelete, onCopy }: { conversation: AcWhatsAppConversation; labels: Array<Record<string, any>>; selectedLabels: Set<string>; canDelete: boolean; onAction: (action: string, payload?: Record<string, unknown>, success?: string) => void; onToggleLabel: (id: string) => void; onAssign: () => void; onFollowup: () => void; onInternalNote: () => void; onSync: () => void; onDelete: () => void; onCopy: () => void }) {
  const metadata = (conversation.metadata || {}) as Record<string, any>
  const resolved = ["resolved", "closed"].includes(conversation.status)
  return <div className="absolute right-0 top-11 z-40 w-80 rounded-[22px] border border-slate-300 bg-white p-2 shadow-[0_24px_70px_rgba(15,23,42,.22)] acw-floating-surface">
    <p className="px-3 pb-2 pt-1 text-[10px] font-black uppercase tracking-[.16em] text-slate-600">Commandes de conversation</p>
    <MenuAction icon={conversation.unread_count ? CheckCheck : MessageCircleMore} label={conversation.unread_count ? "Marquer comme lue" : "Marquer comme non lue"} onClick={() => onAction(conversation.unread_count ? "mark_read" : "mark_unread", {}, conversation.unread_count ? "Conversation marquée lue" : "Conversation marquée non lue")} />
    <MenuAction icon={UserRoundCheck} label="Attribuer ou transférer" onClick={onAssign} />
    <MenuAction icon={resolved ? RotateCcw : CheckCheck} label={resolved ? "Rouvrir la conversation" : "Résoudre la conversation"} onClick={() => onAction(resolved ? "reopen" : "resolve", {}, resolved ? "Conversation rouverte" : "Conversation résolue")} />
    <MenuAction icon={Clock3} label="Créer une relance" onClick={onFollowup} />
    <MenuAction icon={FileText} label="Ajouter une note interne" onClick={onInternalNote} />
    <div className="my-2 border-t border-slate-200" />
    <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-600">Priorité</p>
    <div className="grid grid-cols-3 gap-1 px-1 pb-2">{[["normal","Normale"],["high","Élevée"],["critical","Critique"]].map(([value,label]) => <button key={value} type="button" onClick={() => onAction("", { priority: value }, `Priorité ${String(label).toLowerCase()}`)} className={cx("rounded-lg border px-2 py-2 text-[10px] font-black", conversation.priority === value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100")}>{label}</button>)}</div>
    <MenuAction icon={metadata.pinned ? PinOff : Pin} label={metadata.pinned ? "Désépingler" : "Épingler"} onClick={() => onAction(metadata.pinned ? "unpin" : "pin", {}, metadata.pinned ? "Conversation désépinglée" : "Conversation épinglée")} />
    <MenuAction icon={metadata.muted ? Bell : BellOff} label={metadata.muted ? "Réactiver les notifications" : "Mettre en silencieux"} onClick={() => onAction(metadata.muted ? "unmute" : "mute", {}, metadata.muted ? "Notifications réactivées" : "Conversation mise en silencieux")} />
    <MenuAction icon={conversation.status === "archived" ? RotateCcw : Archive} label={conversation.status === "archived" ? "Restaurer" : "Archiver"} onClick={() => onAction(conversation.status === "archived" ? "restore" : "archive", {}, conversation.status === "archived" ? "Conversation restaurée" : "Conversation archivée")} />
    <MenuAction icon={RotateCcw} label="Synchroniser maintenant" onClick={onSync} />
    <MenuAction icon={Copy} label="Copier le numéro" onClick={onCopy} />
    <a href={`/ac-whatsapp/contacts?contact=${encodeURIComponent(conversation.contact_id)}`} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[10px] font-black text-slate-900 hover:bg-slate-100"><CircleUserRound className="h-4 w-4 text-slate-700" />Ouvrir le dossier contact</a>
    <div className="my-2 border-t border-slate-200" />
    <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-600">Étiquettes</p>
    <div className="max-h-44 overflow-y-auto">{labels.length ? labels.map((label) => <button key={label.id} type="button" onClick={() => onToggleLabel(String(label.id))} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-slate-100"><span className="flex min-w-0 items-center gap-2 text-[9px] font-black text-slate-900"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: String(label.color || "#64748b") }} />{label.name}</span><span className={cx("grid h-5 w-5 place-items-center rounded-md border text-[10px] font-black", selectedLabels.has(String(label.id)) ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-transparent")}>✓</span></button>) : <p className="px-3 py-2 text-[9px] font-semibold text-slate-600">Aucune étiquette active.</p>}</div>
    {canDelete ? <><div className="my-2 border-t border-slate-200" /><MenuAction icon={Trash2} label="Supprimer définitivement" danger onClick={onDelete} /></> : null}
  </div>
}

function MenuAction({ icon: Icon, label, onClick, danger = false }: { icon: typeof Archive; label: string; onClick: () => void; danger?: boolean }) { return <button type="button" onClick={onClick} className={cx("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[10px] font-black hover:bg-slate-100", danger ? "text-rose-800" : "text-slate-900")}><Icon className="h-4 w-4" />{label}</button> }
function humanValue(value: unknown, fallback: string) { const raw = String(value || "").trim(); if (!raw || ["unknown", "undefined", "null", "n/a"].includes(raw.toLowerCase())) return fallback; const map: Record<string, string> = { normal: "Normale", high: "Élevée", urgent: "Urgente", vip: "VIP", prospect: "Prospect", customer: "Client", unqualified: "Contact non qualifié", new: "Nouveau" }; return map[raw.toLowerCase()] || raw.replaceAll("_", " ") }
function PulseCard({ label, value, detail, icon: Icon, tone }: { label: string; value: number; detail: string; icon: typeof MessageCircleMore; tone: "slate" | "amber" | "blue" | "rose" }) { const color = { slate: "text-slate-700 bg-slate-100", amber: "text-amber-800 bg-amber-50", blue: "text-blue-800 bg-blue-50", rose: "text-rose-800 bg-rose-50" }[tone]; return <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"><div className={cx("grid h-8 w-8 shrink-0 place-items-center rounded-lg", color)}><Icon className="h-3.5 w-3.5" /></div><div className="min-w-0 flex-1"><div className="flex items-baseline justify-between gap-2"><p className="truncate text-[10px] font-black uppercase tracking-[.12em] text-slate-500">{label}</p><strong className="text-[16px] font-black tabular-nums text-slate-950">{value}</strong></div><p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">{detail}</p></div></div> }
function featureTitle(type: string) {
  const match = advancedFeatures.find((feature) => feature.action === type)
  return match?.label || type.replaceAll("_", " ")
}

function MetricChip({ label, value, tone = "slate" }: { label: string; value: number; tone?: "slate" | "amber" | "blue" }) {
  const styles = tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-950" : tone === "blue" ? "border-blue-200 bg-blue-50 text-blue-950" : "border-slate-200 bg-slate-50 text-slate-950"
  return <div className={cx("hidden h-10 items-center gap-2 rounded-xl border px-3 lg:flex", styles)}><span className="text-sm font-black">{value}</span><span className="text-[10px] font-black uppercase tracking-[.12em]">{label}</span></div>
}

function ownerName(row: AcWhatsAppConversation) {
  return String((row.assigned_user as any)?.display_name || (row.assigned_user as any)?.full_name || (row.assigned_user as any)?.name || (row.assigned_user as any)?.email || "").trim()
}
function conversationStatusLabel(row: AcWhatsAppConversation) {
  const labels: Record<string,string> = { new:"Nouvelle", unassigned:"À attribuer", assigned:"Attribuée", in_progress:"En traitement", waiting_customer:"Attente client", waiting_internal:"Attente interne", scheduled_followup:"Relance planifiée", escalated:"Escalade", resolved:"Résolue", closed:"Fermée", reopened:"Rouverte", archived:"Archivée" }
  return labels[row.status] || humanValue(row.status, "Conversation")
}
function slaState(row: AcWhatsAppConversation) {
  const raw = row.sla_first_response_due_at || row.sla_resolution_due_at
  if (!raw) return { label:"SLA —", tone:"neutral", urgent:false }
  const delta = new Date(raw).getTime() - Date.now()
  if (!Number.isFinite(delta)) return { label:"SLA —", tone:"neutral", urgent:false }
  const abs = Math.abs(delta)
  const minutes = Math.max(1, Math.round(abs / 60000))
  const compact = minutes < 60 ? `${minutes}m` : minutes < 1440 ? `${Math.round(minutes/60)}h` : `${Math.round(minutes/1440)}j`
  if (delta < 0) return { label:`SLA +${compact}`, tone:"danger", urgent:true }
  if (minutes <= 30) return { label:`SLA ${compact}`, tone:"danger", urgent:true }
  if (minutes <= 120) return { label:`SLA ${compact}`, tone:"warning", urgent:true }
  return { label:`SLA ${compact}`, tone:"healthy", urgent:false }
}
function previewSignal(row: AcWhatsAppConversation) {
  const value = String(row.last_message_preview || "").toLowerCase()
  if (/pdf|document|fichier|pièce jointe|piece jointe/.test(value)) return { label:"Document", icon:FileText }
  if (/vocal|voice|audio/.test(value)) return { label:"Vocal", icon:Radio }
  if (/image|photo/.test(value)) return { label:"Image", icon:Paperclip }
  if (/video|vidéo/.test(value)) return { label:"Vidéo", icon:Paperclip }
  return { label:"Message", icon:MessageCircleMore }
}
function semanticChipTone(value: string) {
  const v = value.toLowerCase()
  if (/critic|urgent|risque|negative|négatif|escal/.test(v)) return "danger"
  if (/high|hot|vip|attente|follow|relance/.test(v)) return "warning"
  if (/positive|positif|client|active|qualifi|ready/.test(v)) return "healthy"
  if (/automation|ai|ia|bot/.test(v)) return "violet"
  return "info"
}
function TheatreConversationRow({ row, active, onClick }: { row: AcWhatsAppConversation; active: boolean; onClick: () => void }) {
  const metadata = (row.metadata || {}) as Record<string, any>
  const owner = ownerName(row)
  const sla = slaState(row)
  const contentSignal = previewSignal(row)
  const ContentIcon = contentSignal.icon
  const direction = String(row.last_message_direction || "").toLowerCase()
  const relationship = humanValue(row.contact?.contact_type, "Relation")
  const leadStage = humanValue(row.contact?.lead_stage, "À qualifier")
  const intent = humanValue(row.intent || row.contact?.lead_stage, "À qualifier")
  const sentiment = humanValue(row.sentiment || row.contact?.sentiment, "Non analysé")
  const priority = humanValue(row.priority, "Normale")
  const labels = (row.labels || []).map((entry) => (entry?.label || {}) as Record<string, any>).filter((label) => label && (label.name || label.code)).slice(0, 3)
  const contactTags = Array.isArray(row.contact?.tags) ? row.contact!.tags.filter(Boolean).slice(0, 2) : []
  const accent = row.status === "escalated" || sla.tone === "danger" ? "danger" : !row.assigned_user_id || sla.tone === "warning" ? "warning" : row.unread_count > 0 ? "info" : "healthy"
  const microSignals = [relationship, leadStage, intent, sentiment].filter((value, index, all) => value && all.indexOf(value) === index).slice(0, 4)
  return <button type="button" onClick={onClick} aria-current={active ? "true" : undefined} data-acw-conversation-card data-state={accent} className={cx("acw-conversation-card group relative mb-2.5 w-full overflow-hidden rounded-[20px] border text-left", active && "is-active") }>
    <span className="acw-card-identity-spine" />
    <div className="acw-card-inner">
      <div className="acw-card-crown">
        <div className="acw-card-avatar">
          <span>{initials(row.contact?.display_name)}</span>
          <span className={cx("acw-card-presence", row.unread_count > 0 ? "is-unread" : accent === "danger" ? "is-danger" : "is-live")} />
          {metadata.pinned ? <Bookmark className="acw-card-pin h-3.5 w-3.5" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0"><p className="acw-card-primary truncate">{row.contact?.display_name || row.contact?.phone_number_e164 || "Contact à identifier"}</p><p className="acw-card-secondary mt-0.5 truncate">{row.contact?.organization_name || row.subject || row.queue?.name || "Relation à qualifier"}</p></div>
            <div className="shrink-0 text-right"><p className="acw-card-tertiary tabular-nums">{formatRelative(row.last_message_at)}</p>{row.unread_count > 0 ? <span className="acw-card-unread">{row.unread_count > 99 ? "99+" : row.unread_count}</span> : null}</div>
          </div>
          <div className="acw-card-owner-ribbon mt-2">
            <span className="acw-card-owner-avatar">{initials(owner || "NA")}</span>
            <span className="min-w-0 flex-1"><span className="acw-card-owner-label">Responsable</span><strong className="acw-card-owner-name truncate">{owner || "NON ATTRIBUÉE"}</strong></span>
            <span className="acw-card-queue truncate">{row.queue?.name || row.account?.name || "File générale"}</span>
            {row.automation_paused ? <span className="acw-card-takeover"><UserRoundCheck className="h-3 w-3" />HUMAIN</span> : <span className="acw-card-automation"><Bot className="h-3 w-3" />AUTO</span>}
          </div>
        </div>
      </div>

      <div className="acw-card-state-matrix mt-2.5">
        <span data-tone={semanticChipTone(row.status)}><small>ÉTAT</small><strong>{conversationStatusLabel(row)}</strong></span>
        <span data-tone={sla.tone}><small>SLA</small><strong>{sla.label.replace("SLA ","")}</strong></span>
        <span data-tone={semanticChipTone(priority)}><small>PRIORITÉ</small><strong>{priority}</strong></span>
        <span data-tone={direction === "inbound" ? "warning" : "info"}><small>FLUX</small><strong>{direction === "inbound" ? "ENTRANT" : direction === "outbound" ? "SORTANT" : "—"}</strong></span>
      </div>

      <div className="acw-card-intelligence-strip mt-2.5">
        {microSignals.map((signal, index) => <span key={`${signal}:${index}`} data-tone={semanticChipTone(signal)}>{index === 0 ? <BriefcaseBusiness className="h-3 w-3" /> : index === 1 ? <Target className="h-3 w-3" /> : index === 2 ? <Sparkles className="h-3 w-3" /> : <CircleGauge className="h-3 w-3" />}<b>{signal}</b></span>)}
      </div>

      <div className="acw-card-message-context mt-2.5">
        <div className="acw-card-message-type"><ContentIcon className="h-3.5 w-3.5" /><span>{contentSignal.label}</span><span className="acw-card-direction">{direction === "inbound" ? "↙ CLIENT" : direction === "outbound" ? "↗ ANGELCARE" : "• SYSTEM"}</span></div>
        <p className="acw-card-preview">{row.last_message_preview || "Nouvelle conversation — aucun message enregistré"}</p>
      </div>

      <div className="acw-card-tag-stack mt-2.5">
        {labels.map((label,index) => <span key={String(label.id || label.code || label.name || index)} className="acw-card-taxonomy"><i style={{backgroundColor:String(label.color || "#64748b")}} /><b>{String(label.name || label.code || "Tag")}</b></span>)}
        {contactTags.map((tag,index) => <span key={`${tag}:${index}`} className="acw-card-taxonomy is-contact"><Tag className="h-3 w-3" /><b>{String(tag)}</b></span>)}
        {labels.length + contactTags.length === 0 ? <span className="acw-card-taxonomy is-muted"><Tag className="h-3 w-3" /><b>Sans étiquette</b></span> : null}
      </div>

      <div className="acw-card-footer mt-2.5">
        <span><MessageCircleMore className="h-3 w-3" /><b>{row.message_count || 0}</b> messages</span>
        <span><Inbox className="h-3 w-3" /><b>{row.unread_count || 0}</b> non lu(s)</span>
        <span><Radio className="h-3 w-3" />{row.last_message_sender_display_name_snapshot || (direction === "inbound" ? "Contact" : "AngelCare")}</span>
        {sla.urgent ? <span className="is-critical"><ShieldAlert className="h-3 w-3" />Action temporelle</span> : null}
      </div>
    </div>
  </button>
}

function ConversationCommandBar({ selected, actorName, focusMode, messageSearch, messageSearchRef, onMessageSearch, onJumpSearch, onFocus, onResolve, onAssign, onFollowup, onOpenTools, menuOpen, onMenu, menu }: { selected: AcWhatsAppConversation; actorName: string; focusMode: boolean; messageSearch: string; messageSearchRef: React.RefObject<HTMLInputElement | null>; onMessageSearch: (value: string) => void; onJumpSearch: () => void; onFocus: () => void; onResolve: () => void; onAssign: () => void; onFollowup: () => void; onOpenTools: () => void; menuOpen: boolean; onMenu: () => void; menu: React.ReactNode }) {
  const owner = ownerName(selected) || actorName
  const sla = slaState(selected)
  const relationship = humanValue(selected.contact?.contact_type, "Relation")
  const leadStage = humanValue(selected.contact?.lead_stage, "À qualifier")
  const intent = humanValue(selected.intent, "À qualifier")
  const sentiment = humanValue(selected.sentiment, "Non analysé")
  return <div className="acw-relationship-command-strip relative z-20 shrink-0 border-b border-slate-200 px-3.5 py-3">
    <div className="flex min-w-0 flex-wrap items-center gap-3">
      <div className="acw-command-identity flex min-w-0 flex-1 items-center gap-3">
        <div className="acw-command-avatar">{initials(selected.contact?.display_name)}<span /></div>
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-[14px] font-black tracking-[-.025em] text-slate-950">{selected.contact?.display_name || selected.contact?.phone_number_e164 || "Contact à identifier"}</h2><span className="acw-command-chip is-status">{conversationStatusLabel(selected)}</span>{["high","urgent","vip","critical"].includes(String(selected.priority || "").toLowerCase()) ? <span className="acw-command-chip is-priority">{humanValue(selected.priority,"Prioritaire")}</span> : null}</div><p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">{[selected.contact?.organization_name, selected.contact?.phone_number_e164, selected.account?.name].filter(Boolean).join("  ·  ")}</p></div>
      </div>
      <div className="acw-command-telemetry hidden xl:grid">
        <span><small>RELATION</small><strong>{relationship}</strong></span>
        <span><small>ÉTAPE</small><strong>{leadStage}</strong></span>
        <span className={sla.urgent ? "is-danger" : ""}><small>SLA</small><strong>{sla.label}</strong></span>
        <span><small>INTENTION</small><strong>{intent}</strong></span>
        <span><small>SENTIMENT</small><strong>{sentiment}</strong></span>
      </div>
      <div className="acw-command-owner hidden min-w-[160px] 2xl:flex"><span className="acw-command-owner-avatar">{initials(owner)}</span><span className="min-w-0"><small>RESPONSABLE</small><strong className="truncate">{owner}</strong></span></div>
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        <div className="relative hidden 2xl:block"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input ref={messageSearchRef} value={messageSearch} onChange={(event) => onMessageSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") onJumpSearch() }} placeholder="Rechercher dans le fil" className="h-8 w-44 rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 text-[9px] font-bold text-slate-950 outline-none focus:border-sky-500" /></div>
        <button type="button" onClick={onAssign} className="acw-command-button hidden lg:inline-flex"><UserRoundCog className="h-3.5 w-3.5" />Attribuer</button>
        <button type="button" onClick={onFollowup} className="acw-command-button hidden lg:inline-flex"><AlarmClock className="h-3.5 w-3.5" />Relance</button>
        <button type="button" onClick={onOpenTools} className="acw-command-icon" title="Commandes professionnelles"><Command className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={onFocus} className={cx("acw-command-icon", focusMode && "is-active")} title="Focus conversation"><LayoutDashboard className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={onResolve} className="acw-command-resolve"><CheckCheck className="h-3.5 w-3.5" />{selected.status === "resolved" ? "Rouvrir" : "Résoudre"}</button>
        <div className="relative"><button type="button" aria-expanded={menuOpen} onClick={onMenu} className="acw-command-icon"><MoreHorizontal className="h-3.5 w-3.5" /></button>{menu}</div>
      </div>
    </div>
  </div>
}

function TimelineJump({ label, onClick }: { label: string; onClick: () => void }) { return <button type="button" onClick={onClick} className="shrink-0 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[10px] font-black text-slate-700 hover:border-slate-500 hover:text-slate-950">{label}</button> }

function renderMessageTimeline(messages: AcWhatsAppMessage[], callbacks: { onQuote: (message: AcWhatsAppMessage) => void; onArtifact: (type: string, message: AcWhatsAppMessage) => void; onTranslate: (message: AcWhatsAppMessage) => void }) {
  let previousDate = ""
  return messages.filter(isRenderableTimelineMessage).map((message, index) => {
    const date = new Date(message.sent_at || message.received_at || message.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    const separator = date !== previousDate
    previousDate = date
    return <div key={stableMessageKey(message, index)}>{separator ? <div className="my-4 flex items-center gap-3"><span className="h-px flex-1 bg-slate-300" /><span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[.1em] text-slate-500">{date}</span><span className="h-px flex-1 bg-slate-300" /></div> : null}<TheatreMessageBubble message={message} {...callbacks} /></div>
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
  const origin = String(message.message_origin || "").toLowerCase()
  const automated = origin.includes("auto") || Boolean(message.automation_name_snapshot)
  const aiAssisted = origin.includes("ai") || origin.includes("assistant")
  const provenance = internal ? "INTERNE" : automated ? "AUTOMATION" : aiAssisted ? "IA ASSISTÉE" : outbound ? "HUMAIN ANGELCARE" : "CLIENT"
  const provenanceTone = internal ? "violet" : automated ? "violet" : aiAssisted ? "blue" : outbound ? "navy" : "slate"
  return <div tabIndex={-1} data-message-id={message.id} data-message-direction={message.direction} data-message-search={searchable} className={cx("group flex scroll-mt-20 outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40", outbound ? "justify-end" : "justify-start")}>
    <div className={cx("acw-message-bubble relative max-w-[84%] rounded-[22px] border px-4 py-3.5", outbound ? "acw-message-outbound rounded-br-[7px]" : internal ? "acw-message-internal rounded-bl-[7px]" : "acw-message-inbound rounded-bl-[7px]")}>
      <span className="acw-message-provenance" data-tone={provenanceTone}>{provenance}</span>
      <button type="button" onClick={() => setOpen((value) => !value)} className="acw-message-more"><MoreHorizontal className="h-3.5 w-3.5" /></button>
      {open ? <div role="menu" className="acw-message-menu acw-floating-surface absolute right-2 top-11 z-[160] w-64 rounded-[16px] border border-slate-200 bg-white p-1.5 text-slate-950 shadow-[0_24px_70px_rgba(7,20,38,.22)]"><MessageAction label="Répondre / citer" icon={MessageSquareQuote} onClick={() => { onQuote(message); setOpen(false) }} /><MessageAction label="Traduire" icon={Languages} onClick={() => { onTranslate(message); setOpen(false) }} /><MessageAction label="Épingler comme jalon" icon={Milestone} onClick={() => { onArtifact("milestone", message); setOpen(false) }} /><MessageAction label="Extraire un engagement" icon={ClipboardCheck} onClick={() => { onArtifact("commitment", message); setOpen(false) }} /><MessageAction label="Marquer comme preuve" icon={Eye} onClick={() => { onArtifact("evidence", message); setOpen(false) }} /><MessageAction label="Créer une mission" icon={ListChecks} onClick={() => { onArtifact("task", message); setOpen(false) }} /><MessageAction label="Copier" icon={Copy} onClick={() => { void navigator.clipboard.writeText(String(message.body || message.caption || "")); setOpen(false) }} /></div> : null}
      <div className="acw-message-identity-row"><span className="acw-message-avatar">{initials(identity.display_name)}</span><span className="min-w-0"><strong>{identity.display_name}</strong><small>{identity.role}</small></span>{message.campaign_name_snapshot ? <span className="acw-message-origin-chip"><BriefcaseBusiness className="h-3 w-3" />{message.campaign_name_snapshot}</span> : null}{message.automation_name_snapshot ? <span className="acw-message-origin-chip"><Bot className="h-3 w-3" />{message.automation_name_snapshot}</span> : null}</div>
      {voice ? <VoiceMessagePlayer message={message} inverted={outbound} /> : visualMedia ? <MessageAttachmentPreview message={message} inverted={outbound} /> : readableBody ? <div className="acw-message-body whitespace-pre-wrap">{readableBody}</div> : null}
      {(voice || visualMedia) && (message.caption || message.body) ? <p className="acw-message-caption">{message.caption || message.body}</p> : null}
      <div className="acw-message-telemetry"><span>{formatDateTime(message.sent_at || message.received_at || message.created_at)}</span><span className="acw-message-type-chip">{humanValue(normalizedType,"Message")}</span>{outbound ? <span className="acw-delivery-chip" data-status={message.status}>{["delivered","read"].includes(message.status) ? <CheckCheck className="h-3.5 w-3.5" /> : message.status === "failed" ? <TriangleAlert className="h-3.5 w-3.5" /> : <Send className="h-3 w-3" />}{humanValue(message.status,"Envoi")}</span> : null}</div>
    </div>
  </div>
}

function MessageAction({ label, icon: Icon, onClick }: { label: string; icon: typeof Copy; onClick: () => void }) { return <button role="menuitem" type="button" onClick={onClick} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[10px] font-black text-slate-950 transition hover:bg-slate-100"><Icon className="h-3.5 w-3.5 text-slate-700" /><span>{label}</span></button> }

function ResponseCommandDeck({ selected, actorName, composerRef, composer, setComposer, noteMode, setNoteMode, sending, draftStatus, onSend, onAi, onFollowup, onOpenResponses, onToggleAutomation, onOpenTools, onSent, onNotice }: { selected: AcWhatsAppConversation; actorName: string; composerRef: React.RefObject<HTMLTextAreaElement | null>; composer: string; setComposer: (value: string) => void; noteMode: boolean; setNoteMode: (value: boolean) => void; sending: boolean; draftStatus: string; onSend: () => void; onAi: (action: string) => void; onFollowup: () => void; onOpenResponses: () => void; onToggleAutomation: () => void; onOpenTools: () => void; onSent: () => Promise<void>; onNotice: (tone: "success" | "danger" | "warning" | "info", title: string, description: string) => void }) {
  const draftLabel = draftStatus === "saved" ? "Brouillon sécurisé" : draftStatus === "saving" ? "Sauvegarde…" : "Brouillon local"
  return <div className={cx("acw-composer-dock shrink-0 border-t px-3.5 py-3", noteMode ? "border-violet-200 bg-violet-50/75" : "border-slate-200 bg-[linear-gradient(180deg,#f8fafc,#f3f6fa)]")}>
    <div className="mx-auto max-w-[1180px]">
      <div className="acw-composer-context-strip mb-2">
        <div className="acw-composer-mode"><button type="button" onClick={() => setNoteMode(false)} className={cx(!noteMode && "is-active")}>CLIENT</button><button type="button" onClick={() => setNoteMode(true)} className={cx(noteMode && "is-internal")}>INTERNE</button></div>
        <span className="acw-composer-context"><UserRoundCheck className="h-3.5 w-3.5" /><b>{actorName}</b></span>
        <span className="acw-composer-context"><RadioTower className="h-3.5 w-3.5" />{selected.account?.name || "Compte WhatsApp"}</span>
        <span className={cx("acw-composer-context", selected.automation_paused ? "is-warning" : "is-healthy")}><Bot className="h-3.5 w-3.5" />{selected.automation_paused ? "Contrôle humain" : "Automation disponible"}</span>
        <span className={cx("acw-composer-context ml-auto", draftStatus === "saved" ? "is-healthy" : draftStatus === "saving" ? "is-warning" : "")}>{draftLabel}</span>
      </div>
      <div className={cx("acw-composer-console overflow-hidden rounded-[20px] border bg-white", noteMode ? "is-internal border-violet-300" : "border-slate-300")}>
        <textarea ref={composerRef} value={composer} onChange={(event) => { const next = event.target.value; setComposer(next); if (!noteMode && next.trimStart().startsWith("/")) onOpenResponses() }} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") onSend() }} rows={3} placeholder={noteMode ? "Note interne — invisible au contact" : "Répondre au contact…  Tapez / pour ouvrir la bibliothèque de réponses"} className="acw-composer-textarea max-h-44 min-h-[78px] w-full resize-y bg-transparent px-4 py-3 text-[13px] font-semibold leading-6 text-slate-950 outline-none placeholder:text-slate-400" />
        <div className="acw-composer-tool-deck">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1"><AttachmentMessageStudio conversationId={selected.id} disabled={noteMode || sending} onSent={onSent} onSuccess={(title, description) => onNotice("success", title, description)} onQueued={(title, description) => onNotice("warning", title, description)} onError={(title, description) => onNotice("danger", title, description)} /><ComposerButton icon={FileText} label="Réponses" onClick={onOpenResponses} /><VoiceMessageStudio conversationId={selected.id} disabled={noteMode || sending} onSent={onSent} onSuccess={(title, description) => onNotice("success", title, description)} onQueued={(title, description) => onNotice("warning", title, description)} onError={(title, description) => onNotice("danger", title, description)} /><ComposerButton icon={WandSparkles} label="Studio IA" onClick={() => onAi("reply_matrix")} /><ComposerButton icon={AlarmClock} label="Relance" onClick={onFollowup} /><ConversationRevenueAutomationControl conversation={selected} onChanged={onSent} onNotice={onNotice} />
              <CommercialCognitionInspector conversationId={selected.id} /><ComposerButton icon={SlidersHorizontal} label="Plus" onClick={onOpenTools} /></div>
          <div className="acw-composer-send-zone"><span>⌘↵</span><button type="button" onClick={onSend} disabled={!composer.trim() || sending} className={cx("acw-send-command", noteMode && "is-internal")}><Send className="h-4 w-4" />{sending ? "Traitement…" : noteMode ? "Conserver" : "Envoyer"}</button></div>
        </div>
      </div>
    </div>
  </div>
}

function IntelligenceDock({ tab, selected, detail, theatre, latestInbound, relationshipScore, onAi, onArtifact, onAssign, onFollowup, onUpdate }: { tab: DockTab; selected: AcWhatsAppConversation; detail: ConversationDetail | null; theatre: TheatreData; latestInbound?: AcWhatsAppMessage; relationshipScore: number; onAi: (action: string) => void; onArtifact: (type: string, title: string) => void; onAssign: () => void; onFollowup: () => void; onUpdate: (patch: Record<string, unknown>, success: string) => void }) {
  const owner = ownerName(selected) || "Non attribuée"
  const sla = slaState(selected)
  const openArtifacts = theatre.artifacts.filter((row) => !["completed","cancelled","closed"].includes(row.status))
  const intent = humanValue(selected.intent, "À qualifier")
  const sentiment = humanValue(selected.sentiment || selected.contact?.sentiment, "Non analysé")
  const relationship = humanValue(selected.contact?.contact_type, "Relation")
  const stage = humanValue(selected.contact?.lead_stage, "Nouveau")
  const lastInboundText = String(latestInbound?.body || latestInbound?.caption || "").trim()
  const decision = selected.status === "escalated" ? { tone:"danger", title:"Intervention prioritaire", text:"La conversation est escaladée. Clarifiez le propriétaire, le risque et la prochaine décision avant toute promesse." } : !selected.assigned_user_id ? { tone:"warning", title:"Attribuer maintenant", text:"Aucun responsable explicite. La première action est de sécuriser la responsabilité du dossier." } : sla.urgent ? { tone:"danger", title:"Répondre avant rupture SLA", text:`${sla.label}. Le dossier nécessite une action temporelle immédiate sous la responsabilité de ${owner}.` } : selected.status === "waiting_customer" ? { tone:"healthy", title:"Maintenir le suivi", text:"AngelCare a répondu. Préparez la prochaine relance sans multiplier les sollicitations." } : { tone:"info", title:"Prochaine meilleure action", text:`Reprendre le dernier besoin, confirmer la responsabilité de ${owner}, puis décider la prochaine action vérifiable.` }
  const historyItems = [
    ...(detail?.events || []).map((item:any) => ({ id:`event:${item.id || item.created_at}`, title:humanValue(item.event_type || item.title,"Événement conversation"), detail:String(item.reason || item.description || "Événement tracé"), created_at:item.created_at, tone:"event" })),
    ...(detail?.followups || []).map((item:any) => ({ id:`follow:${item.id || item.created_at}`, title:String(item.title || "Relance"), detail:String(item.status || item.notes || "Suivi planifié"), created_at:item.created_at || item.due_at, tone:"followup" })),
    ...theatre.artifacts.map((item) => ({ id:`artifact:${item.id}`, title:item.title, detail:`${humanValue(item.artifact_type,"Artifact")} · ${humanValue(item.status,"open")}`, created_at:item.created_at, tone:"artifact" })),
  ].filter((item) => item.created_at).sort((a,b) => new Date(String(b.created_at)).getTime() - new Date(String(a.created_at)).getTime()).slice(0,16)

  if (tab === "profile") return <div className="space-y-3"><div className="acw-relationship-hero"><div className="acw-relationship-avatar">{initials(selected.contact?.display_name)}<span /></div><div className="min-w-0"><p className="truncate text-[14px] font-black text-slate-950">{selected.contact?.display_name || selected.contact?.phone_number_e164 || "Contact"}</p><p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">{selected.contact?.organization_name || "Organisation non renseignée"}</p><div className="mt-2 flex flex-wrap gap-1.5"><span>{relationship}</span><span>{stage}</span><span>{humanValue(selected.priority,"Normale")}</span></div></div></div><DockCard eyebrow="Identity 360" title="Dossier relationnel" icon={CircleUserRound}><div className="space-y-3"><InfoLine label="Organisation" value={humanValue(selected.contact?.organization_name, "Non renseignée")} /><InfoLine label="Téléphone" value={selected.contact?.phone_number_e164 || "Non renseigné"} /><InfoLine label="Ville" value={humanValue(selected.contact?.city, "Non renseignée")} /><InfoLine label="Responsable" value={owner} /><InfoLine label="File" value={selected.queue?.name || selected.account?.name || "Générale"} /></div></DockCard><RelationshipHealth score={relationshipScore} sentiment={sentiment} intent={intent} risk={decision.tone} /></div>

  if (tab === "intelligence") return <div className="space-y-3"><DecisionCard tone={decision.tone} title={decision.title} text={decision.text} onPrimary={selected.assigned_user_id ? onFollowup : onAssign} primaryLabel={selected.assigned_user_id ? "Créer la prochaine action" : "Attribuer"} /><DockCard eyebrow="Live briefing" title="Ce qui compte maintenant" icon={Sparkles}><p className="text-[10.5px] font-semibold leading-5 text-slate-700">{selected.summary || lastInboundText || "Aucun besoin textuel récent. Produisez un brief gouverné avant de prendre une décision."}</p><div className="mt-3 grid gap-2"><DockAction label="Générer le brief" icon={ScanText} onClick={() => onAi("summary")} /><DockAction label="Questions ouvertes" icon={SearchCheck} onClick={() => onAi("unanswered_questions")} /><DockAction label="Risques & sentiment" icon={CircleGauge} onClick={() => onAi("sentiment_risk")} /><DockAction label="Prochaine action" icon={Target} onClick={() => onAi("next_action")} /></div></DockCard><div className="grid grid-cols-2 gap-2"><IntelligenceInstrument label="INTENTION" value={intent} tone={semanticChipTone(intent)} icon={Target} /><IntelligenceInstrument label="SENTIMENT" value={sentiment} tone={semanticChipTone(sentiment)} icon={CircleGauge} /><IntelligenceInstrument label="URGENCE" value={humanValue(selected.priority,"Normale")} tone={semanticChipTone(String(selected.priority || "normal"))} icon={ShieldAlert} /><IntelligenceInstrument label="SLA" value={sla.label} tone={sla.tone} icon={TimerReset} /></div><DockCard eyebrow="Evidence" title="Pourquoi cette recommandation ?" icon={Eye}><div className="acw-evidence-grid"><EvidenceLine icon={MessageCircleMore} label="Messages visibles" value={String(detail?.messages.filter(isRenderableTimelineMessage).length || 0)} /><EvidenceLine icon={FileCheck2} label="Artefacts actifs" value={String(openArtifacts.length)} /><EvidenceLine icon={Radio} label="Présences" value={String(theatre.presence.length || 1)} /><EvidenceLine icon={Inbox} label="Non lus" value={String(selected.unread_count || 0)} /></div></DockCard>{openArtifacts.length ? <DockCard eyebrow="Artifact shelf" title="Preuves & objets actifs" icon={FileCheck2}><div className="acw-artifact-shelf">{openArtifacts.slice(0,4).map((artifact) => <div key={artifact.id} className="acw-artifact-tile"><span><FileText className="h-3.5 w-3.5" /></span><div className="min-w-0"><p className="truncate">{artifact.title}</p><small>{humanValue(artifact.artifact_type,"Artifact")} · {formatRelative(artifact.created_at)}</small></div></div>)}</div></DockCard> : null}</div>

  if (tab === "actions") return <div className="space-y-3"><DecisionCard tone={decision.tone} title={decision.title} text={decision.text} onPrimary={selected.assigned_user_id ? onFollowup : onAssign} primaryLabel={selected.assigned_user_id ? "Planifier" : "Attribuer"} /><DockCard eyebrow="Command action grid" title="Décider et convertir" icon={Target}><div className="grid grid-cols-2 gap-2"><MiniAction label="Attribuer" icon={UserRoundCheck} onClick={onAssign} /><MiniAction label="Relance" icon={AlarmClock} onClick={onFollowup} /><MiniAction label="Escalader" icon={ShieldAlert} onClick={() => onUpdate({ status: "escalated" }, "Conversation escaladée")} /><MiniAction label="Attente client" icon={Clock3} onClick={() => onUpdate({ status: "waiting_customer" }, "Conversation placée en attente client")} /></div></DockCard><DockCard eyebrow="Conversion" title="Transformer le dialogue" icon={BriefcaseBusiness}><div className="space-y-2"><DockAction label="Créer une opportunité" icon={BriefcaseBusiness} onClick={() => onArtifact("opportunity", "Opportunité issue de la conversation")} /><DockAction label="Créer un dossier métier" icon={FileCheck2} onClick={() => onArtifact("case", "Dossier métier issu de la conversation")} /><DockAction label="Demander validation" icon={UserCheck} onClick={() => onArtifact("approval", "Validation superviseur requise")} /><DockAction label="Créer un jalon" icon={Milestone} onClick={() => onArtifact("milestone", "Jalon relationnel")} /></div></DockCard></div>

  return <div className="space-y-3"><DockCard eyebrow="Présence" title="Équipe active" icon={Radio}>{theatre.presence.length ? <div className="space-y-2">{theatre.presence.map((presence) => <div key={presence.user_id} className="acw-presence-card"><span className="acw-presence-avatar">{initials(presence.display_name_snapshot)}</span><div className="min-w-0 flex-1"><p>{presence.display_name_snapshot || "Utilisateur AngelCare"}</p><small>{presence.role_snapshot || presence.activity || "Actif"}</small></div><span className="acw-presence-dot" /></div>)}</div> : <p className="text-[9.5px] font-semibold text-slate-600">Vous êtes le seul utilisateur actif sur cette conversation.</p>}</DockCard><DockCard eyebrow="Relationship chronology" title="Chronologie structurée" icon={Workflow}>{historyItems.length ? <div className="acw-relationship-timeline">{historyItems.map((item) => <div key={item.id} className="acw-timeline-event" data-tone={item.tone}><span className="acw-timeline-node" /><div className="min-w-0"><div className="flex items-start justify-between gap-2"><p>{item.title}</p><time>{formatRelative(String(item.created_at))}</time></div><small>{item.detail}</small></div></div>)}</div> : <p className="text-[9.5px] font-semibold text-slate-600">Aucun événement structuré. Les prochains jalons apparaîtront ici.</p>}</DockCard></div>
}

function DockCard({ eyebrow, title, icon: Icon, children }: { eyebrow: string; title: string; icon: typeof Sparkles; children: React.ReactNode }) { return <div className="acw-dock-card relative overflow-hidden rounded-[20px] border border-slate-200 bg-white p-4"><div className="acw-dock-corner" /><div className="relative flex items-center gap-3"><div className="acw-dock-icon"><Icon className="h-4 w-4" /></div><div><p className="text-[9px] font-black uppercase tracking-[.17em] text-slate-500">{eyebrow}</p><h3 className="mt-1 text-[12.5px] font-black tracking-[-.01em] text-slate-950">{title}</h3></div></div><div className="relative mt-4">{children}</div></div> }
function DecisionCard({ tone, title, text, onPrimary, primaryLabel }: { tone: string; title: string; text: string; onPrimary: () => void; primaryLabel: string }) { return <div className="acw-decision-card" data-tone={tone}><div className="flex items-start gap-3"><div className="acw-decision-icon"><Target className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="acw-decision-eyebrow">NEXT BEST ACTION</p><h3>{title}</h3><p>{text}</p></div></div><button type="button" onClick={onPrimary}>{primaryLabel}<ChevronRight className="h-3.5 w-3.5" /></button></div> }
function RelationshipHealth({ score, sentiment, intent, risk }: { score: number; sentiment: string; intent: string; risk: string }) { const segments = 10; const active = Math.round(score/10); return <DockCard eyebrow="Relationship health" title={`${score}/100 · Santé relationnelle`} icon={Gauge}><div className="acw-health-segments" aria-label={`Santé relationnelle ${score} sur 100`}>{Array.from({length:segments}).map((_,index) => <span key={index} className={cx(index < active && "is-active", risk === "danger" && index >= Math.max(0,active-2) && "is-risk")} />)}</div><div className="mt-3 grid grid-cols-2 gap-2"><Signal label="Sentiment" value={sentiment} /><Signal label="Intention" value={intent} /></div><p className="mt-3 text-[9px] font-semibold leading-5 text-slate-600">Instrument explicable basé sur identité, activité, responsabilité, sentiment et éléments de suivi visibles.</p></DockCard> }
function IntelligenceInstrument({ label, value, tone, icon: Icon }: { label: string; value: string; tone: string; icon: typeof Target }) { return <div className="acw-intelligence-instrument" data-tone={tone}><div className="flex items-center justify-between"><Icon className="h-3.5 w-3.5" /><span className="acw-instrument-light" /></div><small>{label}</small><strong>{value}</strong></div> }
function EvidenceLine({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: string }) { return <div className="acw-evidence-line"><span><Icon className="h-3.5 w-3.5" /></span><div><small>{label}</small><strong>{value}</strong></div></div> }
function DockAction({ label, icon: Icon, onClick }: { label: string; icon: typeof Sparkles; onClick: () => void }) { return <button type="button" onClick={onClick} className="acw-dock-action group"><span className="acw-dock-action-icon"><Icon className="h-3.5 w-3.5" /></span><span className="min-w-0 flex-1 truncate">{label}</span><ChevronRight className="h-3.5 w-3.5" /></button> }
function Signal({ label, value }: { label: string; value: string }) { return <div className="acw-signal-tile"><p>{label}</p><strong>{value}</strong></div> }
function DockRailButton({ icon: Icon, active, onClick }: { icon: typeof Sparkles; active: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className={cx("grid h-10 w-10 place-items-center rounded-xl border", active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-slate-700")}><Icon className="h-4 w-4" /></button> }

function FeatureCommandCenter({ onClose, onExecute }: { onClose: () => void; onExecute: (feature: FeatureDefinition) => void }) {
  const [category, setCategory] = useState("Toutes")
  const [query, setQuery] = useState("")
  const categories = ["Toutes", ...Array.from(new Set(advancedFeatures.map((feature) => feature.category)))]
  const needle = query.trim().toLowerCase()
  const visible = advancedFeatures.filter((feature) => (category === "Toutes" || feature.category === category) && (!needle || `${feature.label} ${feature.description} ${feature.category}`.toLowerCase().includes(needle)))
  return <div className="fixed inset-x-0 bottom-0 z-[90] flex justify-center bg-slate-950/42 p-4 backdrop-blur-[3px]" style={{ top: "var(--acw-shell-top, 52px)" }}><button type="button" className="absolute inset-0" onClick={onClose} aria-label="Fermer" /><div className="acw-apex-floating-surface relative flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-[20px] border bg-white">
    <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 py-4"><div><p className="text-[10px] font-black uppercase tracking-[.17em] text-rose-600">Commandes conversation</p><h2 className="mt-1 text-[19px] font-black tracking-[-.035em] text-slate-950">30 commandes professionnelles</h2><p className="mt-1 text-[9.5px] font-semibold text-slate-500">Actions avancées sous contrôle humain — sans quitter le contexte.</p></div><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"><X className="h-4 w-4" /></button></div>
    <div className="grid min-h-0 flex-1 md:grid-cols-[190px_minmax(0,1fr)]">
      <aside className="border-b border-slate-200 bg-slate-50 p-2.5 md:border-b-0 md:border-r"><div className="flex gap-1 overflow-x-auto md:block md:space-y-0.5">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={cx("flex shrink-0 items-center justify-between rounded-lg px-2.5 py-2 text-[9px] font-black md:w-full", category === item ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-white hover:text-slate-950")}><span>{item}</span><span className={cx("ml-2 text-[10px]", category === item ? "text-slate-400" : "text-slate-300")}>{item === "Toutes" ? advancedFeatures.length : advancedFeatures.filter((f) => f.category === item).length}</span></button>)}</div></aside>
      <div className="flex min-h-0 flex-col"><div className="shrink-0 border-b border-slate-200 p-3"><div className="relative"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} autoFocus placeholder="Rechercher une commande…" className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-[10px] font-bold text-slate-950 outline-none focus:border-slate-500 focus:bg-white" /></div></div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2.5">{visible.length ? <div className="grid gap-1 md:grid-cols-2">{visible.map((feature) => { const Icon = feature.icon; return <button key={feature.id} type="button" onClick={() => onExecute(feature)} className="acw-apex-row group flex items-start gap-3 rounded-xl border border-transparent p-3 text-left hover:border-slate-200 hover:bg-slate-50"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700"><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h3 className="text-[10px] font-black text-slate-950">{feature.label}</h3><span className="shrink-0 text-[10px] font-black uppercase tracking-[.08em] text-slate-400">{feature.category}</span></div><p className="mt-1 line-clamp-2 text-[10px] font-semibold leading-4 text-slate-500">{feature.description}</p></div><ChevronRight className="mt-2 h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-slate-700" /></button> })}</div> : <EmptyState compact title="Aucune commande" description="Aucune commande ne correspond à cette recherche." icon={Search} />}</div></div>
    </div>
  </div></div>
}

function ConversationOverview({ conversations, onSelect, onNew }: { conversations: AcWhatsAppConversation[]; onSelect: (id: string) => void; onNew: () => void }) {
  return <div className="min-h-0 flex-1 bg-[#f8fafc] p-5"><div className="mx-auto flex h-full max-w-3xl flex-col justify-center"><div className="border-b border-slate-200 pb-4"><p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-400">Live Command</p><div className="mt-1 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-[20px] font-black tracking-[-.035em] text-slate-950">Choisissez la conversation à traiter.</h2><p className="mt-1 max-w-xl text-[10px] font-semibold leading-5 text-slate-500">Le fil, l’identité, les engagements et les commandes restent réunis dans une seule surface opérateur.</p></div><button type="button" onClick={onNew} className="inline-flex h-9 items-center gap-2 rounded-lg bg-rose-600 px-3.5 text-[10px] font-black text-white"><Plus className="h-3.5 w-3.5" />Nouvelle conversation</button></div></div>
    <div className="mt-3 overflow-hidden rounded-[16px] border border-slate-200 bg-white">{conversations.slice(0, 6).map((row, index) => <button key={row.id} type="button" onClick={() => onSelect(row.id)} className={cx("acw-apex-row flex w-full items-center gap-3 px-3.5 py-3 text-left", index > 0 && "border-t border-slate-100")}><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-[9px] font-black text-slate-700">{initials(row.contact?.display_name)}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="truncate text-[10px] font-black text-slate-950">{row.contact?.display_name || row.contact?.phone_number_e164 || "Contact à identifier"}</p><span className="shrink-0 text-[10px] font-bold text-slate-400">{formatRelative(row.last_message_at)}</span></div><p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">{row.contact?.organization_name || row.last_message_preview || "Nouvelle conversation"}</p></div>{row.unread_count ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white">{row.unread_count}</span> : <ChevronRight className="h-4 w-4 text-slate-300" />}</button>)}{!conversations.length ? <div className="p-4"><EmptyState compact title="Aucune conversation ouverte" description="Créez une conversation pour commencer l’exploitation Live." icon={MessageCircleMore} action={<button type="button" onClick={onNew} className="rounded-lg bg-slate-950 px-3 py-2 text-[9px] font-black text-white">Créer une conversation</button>} /></div> : null}</div>
  </div></div>
}

function ComposerButton({ icon: Icon, label, onClick }: { icon: typeof Paperclip; label: string; onClick?: () => void }) { return <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] font-black text-slate-600 hover:bg-slate-50 hover:text-slate-950"><Icon className="h-3.5 w-3.5" />{label}</button> }
function InfoLine({ label, value }: { label: string; value?: string | null }) { return <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2.5 last:border-0"><span className="text-[10px] font-black uppercase tracking-[.12em] text-slate-600">{label}</span><span className="truncate text-[10px] font-black text-slate-950">{value || "—"}</span></div> }
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
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[.14em] text-slate-700">{label}</span>{children}</label> }
