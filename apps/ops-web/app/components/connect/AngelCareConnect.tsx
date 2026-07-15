"use client"
import { shouldStartAutoRefresh, safeRefreshInterval, safeUiInterval } from '@/lib/runtime/client-live-governor'

import { useEffect, useMemo, useRef, useState } from "react"
import type React from "react"
import {
  Archive,
  Eraser,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  ClipboardCheck,
  ClipboardList,
  Pencil,
  Save,
  Download,
  EyeOff,
  FileText,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  MessageCircle,
  Mic,
  Minimize2,
  MoreHorizontal,
  Pin,
  PinOff,
  Paperclip,
  Phone,
  Plus,
  Trash2,
  Search,
  Send,
  Settings2,
  Smile,
  Sparkles,
  UserRound,
  Users,
  UserPlus,
  Video,
  X,
} from "lucide-react"
import ConnectLiveRoom from "./ConnectLiveRoom"

type ConnectMode = "direct" | "rooms" | "broadcasts" | "actions"
type Priority = "normal" | "important" | "urgent"
type PanelSize = "narrow" | "expanded"

type StaffUser = {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  role?: string | null
  department?: string | null
  job_title?: string | null
  status?: "online" | "busy" | "away" | "offline"
}

type Conversation = {
  id: string
  title: string
  type: "direct" | "room" | "broadcast" | "context"
  privacy_level: "private" | "department" | "executive" | "module" | "public_readonly"
  department?: string | null
  module_key?: string | null
  members?: StaffUser[]
  member_count?: number
  last_message?: string | null
  last_message_at?: string | null
  unread_count?: number
  pinned?: boolean
  muted?: boolean
  my_role?: "owner" | "admin" | "member" | "viewer"
}

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  sender_name?: string
  sender_role?: string | null
  body: string
  message_type: "text" | "system" | "task" | "approval" | "call" | "file"
  priority: Priority
  confidential: boolean
  created_at: string
  metadata?: Record<string, unknown> | null
  read_count?: number
  read_by?: Array<{ user_id: string; name?: string | null; read_at: string }>
  my_read_at?: string | null
  delivered_count?: number
  delivery_state?: "sent" | "delivered" | "read"
}

type ConnectAction = {
  id: string
  title: string
  description?: string | null
  status: string
  priority: Priority
  owner_id?: string | null
  conversation_id?: string | null
  due_at?: string | null
  created_by?: string | null
  created_at: string
  assignee_ids?: string[]
  assignees?: Array<{ user_id: string; user?: StaffUser | null; completed_at?: string | null }>
}

type Notice = {
  id: string
  title: string
  body?: string | null
  priority: Priority
  read: boolean
  source_type?: string | null
  source_id?: string | null
  metadata?: Record<string, unknown> | null
  created_at: string
}

type CallSession = {
  id: string
  conversation_id?: string | null
  room_name: string
  call_type: "audio" | "video"
  status: "ringing" | "answered" | "connected" | "active" | "missed" | "ended" | "rejected" | "created"
  started_by?: string | null
  started_by_name?: string | null
  receiver_id?: string | null
  started_at?: string
  answered_at?: string | null
  connected_at?: string | null
  ended_at?: string | null
  participant_ids?: string[]
  metadata?: Record<string, unknown> | null
}

type AttachmentPreview = {
  id?: string | null
  messageId: string
  filename: string
  contentType: string
  size: number
  url?: string | null
  storagePath?: string | null
  uploadedBy?: string | null
  uploadedAt?: string | null
  mine: boolean
}

type WidgetPosition = {
  x: number
  y: number
}

type ToastAlert = {
  id: string
  title: string
  body?: string | null
  conversationId?: string | null
  callId?: string | null
  actionId?: string | null
  tone: "message" | "call" | "task" | "missed"
}

const CONNECT_OPEN_KEY = "angelcare.connect.open"
const CONNECT_SIZE_KEY = "angelcare.connect.panelSize"
const CONNECT_MODE_KEY = "angelcare.connect.mode"
const CONNECT_SELECTED_KEY = "angelcare.connect.selected"
const CONNECT_POSITION_KEY = "angelcare.connect.position"
const CONNECT_WIDGET_TOP_GUARD = 88
const CONNECT_WIDGET_MARGIN = 16
const CONNECT_WIDGET_Z_INDEX = 80
const CONNECT_WIDGET_MINIMIZED_WIDTH = 320
const CONNECT_WIDGET_MINIMIZED_HEIGHT = 88
const CONNECT_WIDGET_NARROW_WIDTH = 860
const CONNECT_WIDGET_NARROW_HEIGHT = 760
const CONNECT_WIDGET_EXPANDED_WIDTH = 1440
const CONNECT_WIDGET_EXPANDED_HEIGHT = 860

function cx(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ")
}

function widgetDimensions(panelSize: PanelSize, isOpen: boolean) {
  if (!isOpen) return { width: CONNECT_WIDGET_MINIMIZED_WIDTH, height: CONNECT_WIDGET_MINIMIZED_HEIGHT }
  if (panelSize === "narrow") return { width: CONNECT_WIDGET_NARROW_WIDTH, height: CONNECT_WIDGET_NARROW_HEIGHT }
  return { width: CONNECT_WIDGET_EXPANDED_WIDTH, height: CONNECT_WIDGET_EXPANDED_HEIGHT }
}

async function readJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string }
  if (!response.ok) throw new Error(payload.error || `Connect API failed with ${response.status}`)
  return payload
}

function initials(name?: string | null) {
  const clean = (name || "AC").trim()
  const parts = clean.split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "AC"
}

function formatTime(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  if (sameDay) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday"
  return date.toLocaleDateString([], { month: "short", day: "numeric" })
}

function formatDuration(start?: string | null, now = Date.now()) {
  if (!start) return "00:00"
  const started = new Date(start).getTime()
  if (Number.isNaN(started)) return "00:00"
  const totalSeconds = Math.max(0, Math.floor((now - started) / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

function formatBytes(value?: number | null) {
  const bytes = Number(value || 0)
  if (!Number.isFinite(bytes) || bytes <= 0) return "Unknown size"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function statusTone(status?: StaffUser["status"]) {
  if (status === "online") return "bg-emerald-500"
  if (status === "busy") return "bg-amber-500"
  if (status === "away") return "bg-orange-400"
  return "bg-slate-300"
}

function priorityTone(priority?: Priority) {
  if (priority === "urgent") return "bg-rose-600 text-white"
  if (priority === "important") return "bg-amber-100 text-amber-700"
  return "bg-slate-100 text-slate-600"
}

function modeForConversation(conversation: Conversation): ConnectMode {
  if (conversation.type === "direct") return "direct"
  if (conversation.type === "broadcast") return "broadcasts"
  return "rooms"
}

function otherMember(conversation: Conversation | null, currentUserId?: string) {
  if (!conversation?.members?.length) return null
  return conversation.members.find((member) => member.id !== currentUserId) || conversation.members[0] || null
}

function fileMessages(messages: Message[]) {
  return messages.filter((message) => message.message_type === "file" || Boolean(message.metadata && (message.metadata.filename || message.metadata.fileName || message.metadata.url)))
}

function terminalCall(status?: CallSession["status"]) {
  return status === "ended" || status === "rejected" || status === "missed"
}

function liveCall(status?: CallSession["status"]) {
  return status === "answered" || status === "connected" || status === "active"
}

function attachmentFromMessage(message: Message, currentUserId?: string | null): AttachmentPreview {
  const metadata = message.metadata || {}
  return {
    id: String(metadata.attachment_id || "") || null,
    messageId: message.id,
    filename: String(metadata.filename || metadata.fileName || message.body || "Shared file"),
    contentType: String(metadata.content_type || metadata.contentType || "application/octet-stream"),
    size: Number(metadata.size || metadata.size_bytes || 0),
    url: String(metadata.signed_url || metadata.url || "") || null,
    storagePath: String(metadata.storage_path || "") || null,
    uploadedBy: String(metadata.uploaded_by || message.sender_id || "") || null,
    uploadedAt: String(metadata.uploaded_at || message.created_at || "") || null,
    mine: String(message.sender_id) === String(currentUserId || ""),
  }
}

function attachmentIsImage(attachment: AttachmentPreview) {
  return attachment.contentType.startsWith("image/")
}

function attachmentIsPdf(attachment: AttachmentPreview) {
  return attachment.contentType === "application/pdf" || attachment.filename.toLowerCase().endsWith(".pdf")
}


const CONNECT_PRIVATE_CONTACT_LABEL = "Coordonnées protégées"

function connectPublicStaffSubtitle(member?: StaffUser | null) {
  return [member?.job_title, member?.role, member?.department]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" · ") || "AngelCare staff"
}

function readLabel(message: Message, selected?: Conversation | null) {
  const readers = (message.read_by || []).filter((reader) => reader.name || reader.user_id)
  if (readers.length > 0) {
    const names = readers.slice(0, 2).map((reader) => reader.name || "User").join(", ")
    return readers.length > 2 ? `Read by ${names} +${readers.length - 2}` : `Read by ${names}`
  }
  if ((message.delivered_count || 0) > 0 || (selected?.member_count || 0) > 1) return "Delivered"
  return "Sent"
}

export default function AngelCareConnect({
  embedded = false,
  defaultOpen = false,
  forceFloating = false,
  mobileEmbedded = false,
  hideContactDetails = true,
  disableStaffDirectory = false,
}: {
  embedded?: boolean
  defaultOpen?: boolean
  forceFloating?: boolean
  mobileEmbedded?: boolean
  hideContactDetails?: boolean
  disableStaffDirectory?: boolean
} = {}) {
  const floating = !embedded || forceFloating
  const [open, setOpen] = useState(embedded || defaultOpen)
  const [panelSize, setPanelSize] = useState<PanelSize>("expanded")
  const [mode, setMode] = useState<ConnectMode>("direct")
  const [selectedId, setSelectedId] = useState("")
  const [mobilePane, setMobilePane] = useState<"list" | "thread">("list")
  const [query, setQuery] = useState("")
  const [draft, setDraft] = useState("")
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [staff, setStaff] = useState<StaffUser[]>([])
  const [actions, setActions] = useState<ConnectAction[]>([])
  const [notifications, setNotifications] = useState<Notice[]>([])
  const [calls, setCalls] = useState<CallSession[]>([])
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [threadLoading, setThreadLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [composerPriority, setComposerPriority] = useState<Priority>("normal")
  const [confidential, setConfidential] = useState(false)
  const [typingPulse, setTypingPulse] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [activeCall, setActiveCall] = useState<{ callId: string; roomName: string; type: "audio" | "video"; startedAt?: string | null } | null>(null)
  const [callView, setCallView] = useState<"inline" | "fullscreen" | "mini">("inline")
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [roomModalOpen, setRoomModalOpen] = useState(false)
  const [roomTitle, setRoomTitle] = useState("AngelCare private room")
  const [roomSearch, setRoomSearch] = useState("")
  const [selectedRoomMembers, setSelectedRoomMembers] = useState<string[]>([])
  const [taskManagerOpen, setTaskManagerOpen] = useState(false)
  const [taskEditorOpen, setTaskEditorOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<ConnectAction | null>(null)
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [taskPriority, setTaskPriority] = useState<Priority>("normal")
  const [taskStatus, setTaskStatus] = useState("open")
  const [taskDueAt, setTaskDueAt] = useState("")
  const [taskSearch, setTaskSearch] = useState("")
  const [selectedTaskAssignees, setSelectedTaskAssignees] = useState<string[]>([])
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const notificationSeenRef = useRef<Set<string>>(new Set())
  const browserNotificationBootedRef = useRef(false)
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false)
  const attachmentInputRef = useRef<HTMLInputElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const voiceChunksRef = useRef<Blob[]>([])
  const [attachmentAccept, setAttachmentAccept] = useState("")
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [emojiMenuOpen, setEmojiMenuOpen] = useState(false)
  const [threadSearchOpen, setThreadSearchOpen] = useState(false)
  const [threadQuery, setThreadQuery] = useState("")
  const [recordingVoice, setRecordingVoice] = useState(false)
  const [attachmentPreview, setAttachmentPreview] = useState<AttachmentPreview | null>(null)
  const [widgetPosition, setWidgetPosition] = useState<WidgetPosition | null>(null)
  const [toastAlerts, setToastAlerts] = useState<ToastAlert[]>([])
  const [nowMs, setNowMs] = useState(Date.now())
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const selectedIdRef = useRef("")
  const audioUnlockedRef = useRef(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number; width: number; height: number; moved: boolean; next?: WidgetPosition } | null>(null)
  const suppressMinimizedClickRef = useRef(false)

  useEffect(() => {
    try {
      const storedOpen = defaultOpen || window.localStorage.getItem(CONNECT_OPEN_KEY) === "true"
      if (floating) setOpen(storedOpen)
      const storedSize = window.localStorage.getItem(CONNECT_SIZE_KEY) as PanelSize | null
      const nextPanelSize = storedSize === "narrow" || storedSize === "expanded" ? storedSize : "expanded"
      if (storedSize === "narrow" || storedSize === "expanded") setPanelSize(storedSize)
      const storedMode = window.localStorage.getItem(CONNECT_MODE_KEY) as ConnectMode | null
      if (storedMode) setMode(storedMode)
      const storedSelected = window.localStorage.getItem(CONNECT_SELECTED_KEY)
      if (storedSelected) setSelectedId(storedSelected)
      const storedPosition = window.localStorage.getItem(CONNECT_POSITION_KEY)
      if (storedPosition) {
        const parsed = JSON.parse(storedPosition) as WidgetPosition
        if (Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) {
          const dimensions = widgetDimensions(nextPanelSize, storedOpen)
          const next = clampWidgetPosition(parsed, dimensions.width, dimensions.height)
          setWidgetPosition(next)
          if (next.x !== parsed.x || next.y !== parsed.y) {
            try { window.localStorage.setItem(CONNECT_POSITION_KEY, JSON.stringify(next)) } catch {}
          }
        }
      }
      setBrowserNotificationsEnabled(typeof Notification !== "undefined" && Notification.permission === "granted")
    } catch {}
  }, [floating, defaultOpen])

  useEffect(() => {
    void loadConnectShell()
    if (!shouldStartAutoRefresh()) return
    if (!shouldStartAutoRefresh()) return
    const interval = window.setInterval(() => {
      void loadConnectShell(false)
      const activeSelectedId = selectedIdRef.current
      if (activeSelectedId) void loadMessages(activeSelectedId, false)
    }, safeRefreshInterval(6000))
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    selectedIdRef.current = selectedId
  }, [selectedId])

  useEffect(() => {
    if (mobileEmbedded && selectedId) setMobilePane("thread")
  }, [mobileEmbedded, selectedId])

  useEffect(() => {
    if (!shouldStartAutoRefresh()) return
    const interval = window.setInterval(() => setNowMs(Date.now()), safeUiInterval(1000))
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    function unlockAudio() {
      audioUnlockedRef.current = true
      setAudioUnlocked(true)
    }
    window.addEventListener("pointerdown", unlockAudio, { once: true })
    window.addEventListener("keydown", unlockAudio, { once: true })
    return () => {
      window.removeEventListener("pointerdown", unlockAudio)
      window.removeEventListener("keydown", unlockAudio)
    }
  }, [])

  useEffect(() => {
    function refreshOnFocus() {
      void loadConnectShell(false)
      const activeSelectedId = selectedIdRef.current
      if (activeSelectedId) void loadMessages(activeSelectedId, false)
    }
    window.addEventListener("focus", refreshOnFocus)
    document.addEventListener("visibilitychange", refreshOnFocus)
    return () => {
      window.removeEventListener("focus", refreshOnFocus)
      document.removeEventListener("visibilitychange", refreshOnFocus)
    }
  }, [])

  useEffect(() => {
    function clampCurrentPosition() {
      setWidgetPosition((current) => {
        if (!current) return current
        const dimensions = widgetDimensions(panelSize, open)
        const next = clampWidgetPosition(current, dimensions.width, dimensions.height)
        try { window.localStorage.setItem(CONNECT_POSITION_KEY, JSON.stringify(next)) } catch {}
        return next
      })
    }
    clampCurrentPosition()
    window.addEventListener("resize", clampCurrentPosition)
    return () => window.removeEventListener("resize", clampCurrentPosition)
  }, [panelSize, open])

  useEffect(() => {
    if (!selectedId) return
    try { window.localStorage.setItem(CONNECT_SELECTED_KEY, selectedId) } catch {}
    void loadMessages(selectedId)
  }, [selectedId])

  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages.length, selectedId])

  useEffect(() => {
    if (!draft.trim()) {
      setTypingPulse(false)
      return
    }
    setTypingPulse(true)
    const timeout = window.setTimeout(() => setTypingPulse(false), 1800)
    return () => window.clearTimeout(timeout)
  }, [draft])

  async function enableBrowserNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setError("This browser does not support desktop notifications.")
      return
    }
    const permission = await Notification.requestPermission()
    setBrowserNotificationsEnabled(permission === "granted")
    if (permission !== "granted") {
      setError("Browser notifications are blocked. Enable them from the browser site settings to receive Connect alerts.")
    }
  }

  function playCue(kind: "message" | "call" | "task" | "missed") {
    if (!audioUnlockedRef.current || typeof window === "undefined" || !("AudioContext" in window)) return
    try {
      const context = audioContextRef.current || new AudioContext()
      audioContextRef.current = context
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = kind === "call" ? "sine" : "triangle"
      oscillator.frequency.value = kind === "call" ? 720 : kind === "task" ? 520 : kind === "missed" ? 360 : 620
      gain.gain.value = kind === "call" ? 0.08 : 0.045
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start()
      oscillator.stop(context.currentTime + (kind === "call" ? 0.34 : 0.16))
    } catch {}
  }

  function showInAppAlert(alert: ToastAlert) {
    setToastAlerts((current) => [alert, ...current.filter((item) => item.id !== alert.id)].slice(0, 4))
    window.setTimeout(() => {
      setToastAlerts((current) => current.filter((item) => item.id !== alert.id))
    }, 8500)
  }

  function pushBrowserNotification(key: string, title: string, body?: string): boolean {
    if (typeof window === "undefined" || !("Notification" in window)) return false
    if (Notification.permission !== "granted") return false
    try {
      const notice = new Notification(title, {
        body: body || "AngelCare Connect update",
        tag: key,
        silent: false,
      })
      notice.onclick = () => {
        window.focus()
        setPanelOpen(true)
      }
      return true
    } catch {
      return false
    }
  }

  function showBrowserConnectNotifications(nextConversations: Conversation[], nextNotifications: Notice[], nextCalls: CallSession[], me: StaffUser | null) {
    for (const conversation of nextConversations) {
      if (!conversation.unread_count || conversation.unread_count <= 0) continue
      const key = `connect-message-${conversation.id}-${conversation.last_message_at || conversation.unread_count}`
      const fresh = !notificationSeenRef.current.has(key)
      if (fresh) notificationSeenRef.current.add(key)
      if (fresh && browserNotificationBootedRef.current) {
        pushBrowserNotification(key, `New Connect message · ${conversation.title}`, conversation.last_message || "Open AngelCare Connect to read the latest update.")
        playCue("message")
        showInAppAlert({ id: key, tone: "message", title: `New message · ${conversation.title}`, body: conversation.last_message, conversationId: conversation.id })
      }
    }
    for (const notice of nextNotifications) {
      if (notice.read) continue
      const tone = notice.source_type === "action" ? "task" : notice.source_type === "call" && String(notice.metadata?.status || "").includes("missed") ? "missed" : notice.source_type === "call" ? "call" : "message"
      const key = `connect-notice-${notice.id}`
      const fresh = !notificationSeenRef.current.has(key)
      if (fresh) notificationSeenRef.current.add(key)
      if (fresh && browserNotificationBootedRef.current) {
        pushBrowserNotification(key, notice.title, notice.body || "New AngelCare Connect notification")
        playCue(tone)
        showInAppAlert({
          id: key,
          tone,
          title: notice.title,
          body: notice.body,
          conversationId: String(notice.metadata?.conversation_id || "") || null,
          callId: notice.source_type === "call" ? notice.source_id || null : null,
          actionId: notice.source_type === "action" ? notice.source_id || null : null,
        })
      }
    }
    for (const call of nextCalls) {
      const incoming = String(call.started_by || "") !== String(me?.id || "")
      const liveStatus = call.status === "ringing" || call.status === "created" || call.status === "active" || call.status === "connected"
      if (!incoming || !liveStatus) continue
      const key = `connect-call-${call.id}-${call.status}`
      const fresh = !notificationSeenRef.current.has(key)
      if (fresh) notificationSeenRef.current.add(key)
      if (fresh && browserNotificationBootedRef.current) {
        pushBrowserNotification(key, `Incoming ${call.call_type} call`, "Open AngelCare Connect to join the conversation call.")
        playCue("call")
        showInAppAlert({ id: key, tone: "call", title: `Incoming ${call.call_type} call`, body: call.started_by_name ? `${call.started_by_name} is calling.` : "Open AngelCare Connect to answer.", conversationId: call.conversation_id, callId: call.id })
      }
    }
    browserNotificationBootedRef.current = true
  }

  // CONNECT_MOBILE_RESILIENT_LOAD_PATCH
  // A failed optional feed (tasks/calls/notifications) must never block private rooms/messages from loading in CareLink Mobile.
  async function loadConnectShell(showLoading = true) {
    if (showLoading) setLoading(true)
    setError(null)

    async function soft<T>(label: string, fallback: T, loader: () => Promise<T>): Promise<T> {
      try {
        return await loader()
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err || 'Unknown error')
        setError((current) => current || `${label}: ${message}`)
        return fallback
      }
    }

    try {
      const route = typeof window !== "undefined" ? window.location.pathname : ""
      const [mePayload, conversationPayload, staffPayload, actionPayload, notificationPayload, callPayload] = await Promise.all([
        soft('Load Connect identity', { user: null as StaffUser | null }, () => readJson<{ user: StaffUser | null }>(`/api/connect/me?route=${encodeURIComponent(route)}`)),
        soft('Load Connect conversations', { conversations: [] as Conversation[] }, () => readJson<{ conversations: Conversation[] }>("/api/connect/conversations")),
        soft('Load Connect staff', { staff: [] as StaffUser[] }, () => readJson<{ staff: StaffUser[] }>("/api/connect/staff")),
        soft('Load assigned Connect tasks', { actions: [] as ConnectAction[] }, () => readJson<{ actions: ConnectAction[] }>("/api/connect/actions")),
        soft('Load Connect notifications', { notifications: [] as Notice[] }, () => readJson<{ notifications: Notice[] }>("/api/connect/notifications")),
        soft('Load Connect calls', { calls: [] as CallSession[] }, () => readJson<{ calls: CallSession[] }>("/api/connect/calls")),
      ])

      setCurrentUser(mePayload.user)
      const nextConversations = conversationPayload.conversations || []
      setConversations(nextConversations)
      setStaff(staffPayload.staff || [])
      setActions(actionPayload.actions || [])
      const nextNotifications = notificationPayload.notifications || []
      const nextCalls = callPayload.calls || []
      setNotifications(nextNotifications)
      setCalls(nextCalls)
      showBrowserConnectNotifications(nextConversations, nextNotifications, nextCalls, mePayload.user)
      setSelectedId((current) => current || nextConversations[0]?.id || "")
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  async function loadMessages(conversationId: string, showThreadLoading = true) {
    if (showThreadLoading) setThreadLoading(true)
    setError(null)
    try {
      const payload = await readJson<{ messages: Message[] }>(`/api/connect/messages?conversationId=${encodeURIComponent(conversationId)}`)
      setMessages(payload.messages || [])
      setConversations((current) => current.map((conversation) => conversation.id === conversationId ? { ...conversation, unread_count: 0 } : conversation))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connect messages failed to load")
    } finally {
      if (showThreadLoading) setThreadLoading(false)
    }
  }

  function setPanelOpen(next: boolean) {
    setOpen(next)
    try { window.localStorage.setItem(CONNECT_OPEN_KEY, String(next)) } catch {}
  }

  function changePanelSize(next: PanelSize) {
    setPanelSize(next)
    setRightPanelOpen(next === "expanded")
    try { window.localStorage.setItem(CONNECT_SIZE_KEY, next) } catch {}
  }

  function changeMode(next: ConnectMode) {
    setMode(next)
    try { window.localStorage.setItem(CONNECT_MODE_KEY, next) } catch {}
  }

  function clampWidgetPosition(position: WidgetPosition, width: number, height: number): WidgetPosition {
    const margin = CONNECT_WIDGET_MARGIN
    const topGuard = CONNECT_WIDGET_TOP_GUARD
    const availableWidth = Math.max(0, window.innerWidth - margin * 2)
    const availableHeight = Math.max(0, window.innerHeight - topGuard - margin)
    const maxX = Math.max(margin, window.innerWidth - Math.min(width, availableWidth) - margin)
    const maxY = Math.max(topGuard, window.innerHeight - Math.min(height, availableHeight) - margin)
    return {
      x: Math.min(Math.max(margin, position.x), maxX),
      y: Math.min(Math.max(topGuard, position.y), maxY),
    }
  }

  function saveWidgetPosition(position: WidgetPosition) {
    setWidgetPosition(position)
    try { window.localStorage.setItem(CONNECT_POSITION_KEY, JSON.stringify(position)) } catch {}
  }

  function handleWidgetPointerMove(event: PointerEvent) {
    const drag = dragRef.current
    if (!drag) return
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true
    const next = clampWidgetPosition({ x: drag.originX + dx, y: drag.originY + dy }, drag.width, drag.height)
    drag.next = next
    setWidgetPosition(next)
  }

  function handleWidgetPointerUp() {
    const drag = dragRef.current
    if (!drag) return
    window.removeEventListener("pointermove", handleWidgetPointerMove)
    window.removeEventListener("pointerup", handleWidgetPointerUp)
    const next = drag.next || clampWidgetPosition({ x: drag.originX, y: drag.originY }, drag.width, drag.height)
    saveWidgetPosition(next)
    if (drag.moved) {
      suppressMinimizedClickRef.current = true
      window.setTimeout(() => { suppressMinimizedClickRef.current = false }, 120)
    }
    dragRef.current = null
  }

  function beginWidgetDrag(event: React.PointerEvent<HTMLElement>, source: "panel" | "button") {
    if (!floating) return
    const target = event.target as HTMLElement
    if (source === "panel" && target.closest("button,a,input,textarea,select")) return
    const element = source === "button"
      ? event.currentTarget
      : event.currentTarget.closest("[data-connect-shell]") as HTMLElement | null
    if (!element) return
    const rect = element.getBoundingClientRect()
    const next = clampWidgetPosition({ x: rect.left, y: rect.top }, rect.width, rect.height)
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: next.x,
      originY: next.y,
      width: rect.width,
      height: rect.height,
      moved: false,
    }
    setWidgetPosition(next)
    window.addEventListener("pointermove", handleWidgetPointerMove)
    window.addEventListener("pointerup", handleWidgetPointerUp)
  }

  function openConnectContext(conversationId?: string | null, nextMode?: ConnectMode) {
    if (conversationId) {
      setSelectedId(conversationId)
      if (mobileEmbedded) setMobilePane("thread")
    }
    if (nextMode) changeMode(nextMode)
    setPanelOpen(true)
  }

  const selected = conversations.find((conversation) => conversation.id === selectedId) || conversations[0] || null
  const selectedMember = otherMember(selected, currentUser?.id)
  const isDirect = selected?.type === "direct"
  const headlineName = isDirect ? selectedMember?.name || selected?.title || "Direct message" : selected?.title || "AngelCare Connect"
  const headlineRole = isDirect
    ? selectedMember?.job_title || selectedMember?.role || selectedMember?.department || "AngelCare staff"
    : selected?.department || selected?.module_key || selected?.privacy_level || "Internal communication room"
  const activeFiles = fileMessages(messages)
  const unreadTotal = conversations.reduce((sum, conversation) => sum + (conversation.unread_count || 0), 0) + notifications.filter((notice) => !notice.read).length
  const normalizedCurrentRole = String(currentUser?.role || "").trim().toLowerCase()
  const isCEO = ["ceo", "chief executive officer", "chief-executive-officer", "dg", "direction générale", "direction generale", "founder", "owner", "super_admin", "super admin"].includes(normalizedCurrentRole)
  const visibleCall = calls.find((call) => activeCall?.callId === call.id) || null
  const incomingCall = calls.find((call) => !terminalCall(call.status) && (call.status === "ringing" || call.status === "created") && String(call.started_by || "") !== String(currentUser?.id || "")) || null
  const outgoingRingingCall = calls.find((call) => !terminalCall(call.status) && (call.status === "ringing" || call.status === "created") && String(call.started_by || "") === String(currentUser?.id || "")) || null
  const connectedCall = calls.find((call) => liveCall(call.status) && !terminalCall(call.status)) || null
  const missedCallCount = calls.filter((call) => call.status === "missed" && String(call.started_by || "") !== String(currentUser?.id || "")).length
  const assignedTaskCount = actions.filter((action) => action.status !== "done" && (action.assignee_ids || action.assignees?.map((item) => item.user_id) || []).some((id) => String(id) === String(currentUser?.id || ""))).length
  const taskNotificationCount = notifications.filter((notice) => !notice.read && notice.source_type === "action").length
  const callSignal = Boolean(incomingCall || outgoingRingingCall || connectedCall)
  const minimizedSignalCount = unreadTotal + missedCallCount + assignedTaskCount
  const activeCallStartedAt = visibleCall?.connected_at || visibleCall?.answered_at || activeCall?.startedAt || visibleCall?.started_at

  useEffect(() => {
    if (!currentUser?.id) return
    if (activeCall) {
      const current = calls.find((call) => call.id === activeCall.callId)
      if (current && terminalCall(current.status)) setActiveCall(null)
      return
    }
    const live = calls.find((call) => liveCall(call.status) && !terminalCall(call.status) && (
      String(call.started_by || "") === String(currentUser.id)
      || String(call.receiver_id || "") === String(currentUser.id)
      || (call.participant_ids || []).some((id) => String(id) === String(currentUser.id))
    ))
    if (live) {
      setActiveCall({ callId: live.id, roomName: live.room_name, type: live.call_type, startedAt: live.connected_at || live.answered_at || live.started_at || null })
      setCallView("inline")
      if (live.conversation_id) setSelectedId(live.conversation_id)
    }
  }, [activeCall, calls, currentUser?.id])

  const filteredConversations = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return conversations.filter((conversation) => {
      const targetMode = modeForConversation(conversation)
      if (mode !== "actions" && targetMode !== mode) return false
      if (!normalized) return true
      const memberNames = conversation.members?.map((member) => `${member.name} ${member.department || ""} ${member.role || ""}`).join(" ") || ""
      return [conversation.title, conversation.department, conversation.module_key, conversation.last_message, memberNames]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    })
  }, [conversations, mode, query])

  const staffResults = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const list = staff.filter((member) => member.id !== currentUser?.id)
    if (!normalized) return list.slice(0, 10)
    return list.filter((member) => [member.name, member.department, member.role, member.job_title]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalized))).slice(0, 12)
  }, [staff, currentUser?.id, query])

  const roomMemberResults = useMemo(() => {
    const normalized = roomSearch.trim().toLowerCase()
    const list = staff.filter((member) => member.id !== currentUser?.id)
    if (!normalized) return list.slice(0, 80)
    return list.filter((member) => [member.name, member.department, member.role, member.job_title]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalized))).slice(0, 80)
  }, [staff, currentUser?.id, roomSearch])

  const taskMemberResults = useMemo(() => {
    const normalized = taskSearch.trim().toLowerCase()
    const list = staff.filter((member) => member.id !== currentUser?.id)
    if (!normalized) return list.slice(0, 120)
    return list.filter((member) => [member.name, member.department, member.role, member.job_title]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalized))).slice(0, 120)
  }, [staff, currentUser?.id, taskSearch])

  const visibleTasks = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return actions
    return actions.filter((action) => [action.title, action.description, action.status, action.priority, ...(action.assignees || []).map((a) => a.user?.name || a.user_id)]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalized)))
  }, [actions, query])

  const filteredMessages = useMemo(() => {
    const normalized = threadQuery.trim().toLowerCase()
    if (!normalized) return messages
    return messages.filter((message) => [message.body, message.sender_name, message.sender_role, message.priority, String(message.metadata?.filename || message.metadata?.fileName || "")]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalized)))
  }, [messages, threadQuery])

  async function uploadConnectFile(file: File) {
    if (!selected) {
      setError("Select a Connect conversation before uploading a file.")
      return
    }
    setUploadingAttachment(true)
    setError(null)
    try {
      const form = new FormData()
      form.append("conversationId", selected.id)
      form.append("priority", composerPriority)
      form.append("confidential", String(confidential || selected.privacy_level === "private" || selected.privacy_level === "executive"))
      form.append("file", file)
      const response = await fetch("/api/connect/attachments", { method: "POST", body: form })
      const payload = (await response.json().catch(() => ({}))) as { message?: Message; error?: string }
      if (!response.ok || !payload.message) throw new Error(payload.error || "Connect attachment upload failed")
      setMessages((current) => [...current, payload.message as Message])
      setConversations((current) => current.map((conversation) => conversation.id === selected.id ? { ...conversation, last_message: payload.message?.body || "File shared", last_message_at: new Date().toISOString() } : conversation))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Attachment could not be uploaded")
    } finally {
      setUploadingAttachment(false)
      if (attachmentInputRef.current) attachmentInputRef.current.value = ""
    }
  }

  function openAttachmentPicker(accept = "") {
    if (!selected) {
      setError("Select a conversation before adding media.")
      return
    }
    setAttachmentAccept(accept)
    window.setTimeout(() => attachmentInputRef.current?.click(), 0)
  }

  async function toggleVoiceRecording() {
    if (!selected) {
      setError("Select a conversation before recording a voice note.")
      return
    }
    if (recordingVoice) {
      mediaRecorderRef.current?.stop()
      return
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Voice recording is not available in this browser.")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      voiceChunksRef.current = []
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = (event) => { if (event.data.size > 0) voiceChunksRef.current.push(event.data) }
      recorder.onstop = () => {
        setRecordingVoice(false)
        stream.getTracks().forEach((track) => track.stop())
        const blob = new Blob(voiceChunksRef.current, { type: "audio/webm" })
        if (blob.size > 0) void uploadConnectFile(new File([blob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" }))
      }
      recorder.start()
      setRecordingVoice(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Microphone permission is required to record voice notes.")
    }
  }

  async function deleteConnectMessage(message: Message) {
    const confirmed = window.confirm("Delete this Connect message from the live thread?")
    if (!confirmed) return
    setError(null)
    try {
      await readJson<{ ok: boolean }>(`/api/connect/messages?messageId=${encodeURIComponent(message.id)}`, { method: "DELETE" })
      setMessages((current) => current.filter((item) => item.id !== message.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Message could not be deleted")
    }
  }

  async function deleteConnectAttachment(attachment: AttachmentPreview) {
    const confirmed = window.confirm(`Delete "${attachment.filename}" from this Connect conversation?`)
    if (!confirmed) return
    setError(null)
    try {
      const params = attachment.id
        ? `attachmentId=${encodeURIComponent(attachment.id)}`
        : `messageId=${encodeURIComponent(attachment.messageId)}`
      await readJson<{ ok: boolean }>(`/api/connect/attachments?${params}`, { method: "DELETE" })
      setMessages((current) => current.filter((item) => item.id !== attachment.messageId))
      setAttachmentPreview(null)
      if (selected?.id) void loadMessages(selected.id, false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Attachment could not be deleted")
    }
  }

  function openAttachmentFromMessage(message: Message) {
    setAttachmentPreview(attachmentFromMessage(message, currentUser?.id))
  }

  async function markAllNotificationsRead() {
    setError(null)
    try {
      await readJson<{ ok: boolean }>("/api/connect/notifications", { method: "PATCH", body: JSON.stringify({}) })
      setNotifications((current) => current.map((notice) => ({ ...notice, read: true })))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Notifications could not be marked as read")
    }
  }

  async function sendCurrentMessage() {
    const body = draft.trim()
    if (!body || !selected || sending) return
    setSending(true)
    setError(null)
    try {
      const payload = await readJson<{ message: Message }>("/api/connect/messages", {
        method: "POST",
        body: JSON.stringify({
          conversationId: selected.id,
          body,
          priority: composerPriority,
          confidential: confidential || selected.privacy_level === "private" || selected.privacy_level === "executive",
        }),
      })
      setMessages((current) => [...current, payload.message])
      setDraft("")
      setComposerPriority("normal")
      setConfidential(false)
      setConversations((current) => current.map((conversation) => conversation.id === selected.id ? { ...conversation, last_message: body, last_message_at: new Date().toISOString() } : conversation))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Message could not be sent")
    } finally {
      setSending(false)
    }
  }

  async function createDirectConversation(target: StaffUser) {
    if (disableStaffDirectory) {
      setError("Le démarrage de conversations privées est désactivé sur CareLink Mobile.")
      return
    }

    setError(null)
    try {
      const payload = await readJson<{ conversation: Conversation }>("/api/connect/conversations", {
        method: "POST",
        body: JSON.stringify({
          type: "direct",
          privacy_level: "private",
          directUserId: target.id,
          memberIds: [target.id],
          title: target.name,
        }),
      })
      setConversations((current) => current.some((conversation) => conversation.id === payload.conversation.id) ? current : [payload.conversation, ...current])
      setSelectedId(payload.conversation.id)
      changeMode("direct")
      if (panelSize === "narrow") setRightPanelOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Direct conversation could not be created")
    }
  }

  function openRoomBuilder() {
    if (!isCEO) {
      setError(`Only the CEO can create AngelCare Connect rooms and select room access. Your loaded Connect role is: ${currentUser?.role || "empty"}.`)
      return
    }
    setSelectedRoomMembers([])
    setRoomSearch("")
    setRoomTitle("AngelCare private room")
    setRoomModalOpen(true)
  }

  function toggleRoomMember(memberId: string) {
    setSelectedRoomMembers((current) => current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId])
  }

  async function createSelectedRoom() {
    if (!isCEO) {
      setError(`Only the CEO can create AngelCare Connect rooms. Your loaded Connect role is: ${currentUser?.role || "empty"}.`)
      return
    }
    if (!roomTitle.trim()) {
      setError("Room title is required.")
      return
    }
    if (selectedRoomMembers.length === 0) {
      setError("Select at least one staff member for room access.")
      return
    }
    setError(null)
    try {
      const payload = await readJson<{ conversation: Conversation }>("/api/connect/conversations", {
        method: "POST",
        body: JSON.stringify({
          type: "room",
          privacy_level: "private",
          title: roomTitle.trim(),
          memberIds: selectedRoomMembers,
        }),
      })
      setConversations((current) => current.some((conversation) => conversation.id === payload.conversation.id) ? current : [payload.conversation, ...current])
      setSelectedId(payload.conversation.id)
      changeMode("rooms")
      setRoomModalOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Room could not be created")
    }
  }

  function openTaskManager() {
    setTaskManagerOpen(true)
    changeMode("actions")
  }

  function openTaskEditor(task?: ConnectAction | null) {
    const next = task || null
    setEditingTask(next)
    setTaskTitle(next?.title || (selected ? `Follow-up · ${selected.title}` : ""))
    setTaskDescription(next?.description || "")
    setTaskPriority((next?.priority as Priority) || "normal")
    setTaskStatus(next?.status || "open")
    setTaskDueAt(next?.due_at ? next.due_at.slice(0, 16) : "")
    const ids = next?.assignee_ids?.length ? next.assignee_ids : (next?.assignees || []).map((item) => item.user_id)
    setSelectedTaskAssignees(ids.length ? ids : [])
    setTaskSearch("")
    setTaskEditorOpen(true)
  }

  function toggleTaskAssignee(memberId: string) {
    setSelectedTaskAssignees((current) => current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId])
  }

  async function saveTask() {
    if (!taskTitle.trim()) {
      setError("Task title is required.")
      return
    }
    if (selectedTaskAssignees.length === 0) {
      setError("Select at least one staff member for this task.")
      return
    }
    setError(null)
    const body = {
      actionId: editingTask?.id,
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      priority: taskPriority,
      status: taskStatus,
      due_at: taskDueAt ? new Date(taskDueAt).toISOString() : null,
      conversation_id: selected?.id || editingTask?.conversation_id || null,
      assigneeIds: selectedTaskAssignees,
    }
    try {
      const payload = await readJson<{ action: ConnectAction }>("/api/connect/actions", {
        method: editingTask ? "PATCH" : "POST",
        body: JSON.stringify(body),
      })
      setActions((current) => editingTask
        ? current.map((action) => action.id === payload.action.id ? payload.action : action)
        : [payload.action, ...current])
      setTaskEditorOpen(false)
      setTaskManagerOpen(true)
      changeMode("actions")
      if (selected?.id) await loadMessages(selected.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connect task could not be saved")
    }
  }

  async function deleteTask(task: ConnectAction) {
    const confirmed = window.confirm("Delete this Connect task? Assigned users will lose access to it.")
    if (!confirmed) return
    setError(null)
    try {
      await readJson<{ ok: boolean }>(`/api/connect/actions?actionId=${encodeURIComponent(task.id)}`, { method: "DELETE" })
      setActions((current) => current.filter((action) => action.id !== task.id))
      if (editingTask?.id === task.id) setTaskEditorOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connect task could not be deleted")
    }
  }

  async function createActionFromThread() {
    if (!selected) return
    const defaultAssignees = selected.members?.filter((member) => member.id !== currentUser?.id).map((member) => member.id).slice(0, 6) || []
    setEditingTask(null)
    setTaskTitle(`Follow-up · ${selected.title}`)
    setTaskDescription(messages.slice(-5).map((message) => `${message.sender_name || "User"}: ${message.body}`).join("\n"))
    setTaskPriority(selected.unread_count && selected.unread_count > 2 ? "important" : "normal")
    setTaskStatus("open")
    setTaskDueAt("")
    setSelectedTaskAssignees(defaultAssignees)
    setTaskSearch("")
    setTaskManagerOpen(true)
    setTaskEditorOpen(true)
  }

  async function startCall(callType: "audio" | "video") {
    if (!selected) return
    setError(null)
    try {
      const callPayload = await readJson<{ call: CallSession }>("/api/connect/calls", {
        method: "POST",
        body: JSON.stringify({
          conversation_id: selected.id,
          call_type: callType,
          status: "ringing",
          receiver_id: selectedMember?.id,
        }),
      })
      setCalls((current) => [callPayload.call, ...current.filter((call) => call.id !== callPayload.call.id)])
      await loadMessages(selected.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Call could not be started")
    }
  }

  async function answerCall(call: CallSession) {
    setError(null)
    try {
      const payload = await readJson<{ call: CallSession }>("/api/connect/calls", {
        method: "PATCH",
        body: JSON.stringify({ callId: call.id, status: "connected" }),
      })
      const next = payload.call
      setCalls((current) => current.map((item) => item.id === next.id ? next : item))
      if (next.conversation_id) {
        setSelectedId(next.conversation_id)
        await loadMessages(next.conversation_id, false)
      }
      setActiveCall({ callId: next.id, roomName: next.room_name, type: next.call_type, startedAt: next.connected_at || next.answered_at || next.started_at || null })
      setCallView("inline")
      setPanelOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Call could not be answered")
    }
  }

  async function rejectCall(call: CallSession) {
    setError(null)
    try {
      const payload = await readJson<{ call: CallSession }>("/api/connect/calls", {
        method: "PATCH",
        body: JSON.stringify({ callId: call.id, status: "rejected" }),
      })
      setCalls((current) => current.map((item) => item.id === payload.call.id ? payload.call : item))
      if (payload.call.conversation_id) await loadMessages(payload.call.conversation_id, false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Call could not be rejected")
    }
  }

  async function endCall(callId?: string | null) {
    const id = callId || activeCall?.callId
    if (!id) return
    const call = calls.find((item) => item.id === id)
    if (call && terminalCall(call.status)) {
      setActiveCall(null)
      return
    }
    setError(null)
    try {
      const payload = await readJson<{ call: CallSession }>("/api/connect/calls", {
        method: "PATCH",
        body: JSON.stringify({ callId: id, status: "ended" }),
      })
      setCalls((current) => current.map((item) => item.id === payload.call.id ? payload.call : item))
      setActiveCall(null)
      if (payload.call.conversation_id) await loadMessages(payload.call.conversation_id, false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Call could not be ended")
    }
  }

  async function pinCurrentConversation() {
    if (!selected) return
    const nextPinned = !selected.pinned
    setError(null)
    setMoreMenuOpen(false)
    try {
      await readJson<{ ok: boolean; pinned: boolean }>("/api/connect/conversations", {
        method: "PATCH",
        body: JSON.stringify({ conversationId: selected.id, action: "pin", pinned: nextPinned }),
      })
      setConversations((current) => current.map((conversation) => conversation.id === selected.id ? { ...conversation, pinned: nextPinned } : conversation))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversation pin could not be updated")
    }
  }

  async function emptyCurrentConversation() {
    if (!selected) return
    const confirmed = window.confirm("Empty this chat for the room? This will remove visible messages from this Connect thread.")
    if (!confirmed) return
    setError(null)
    setMoreMenuOpen(false)
    try {
      await readJson<{ ok: boolean }>("/api/connect/conversations", {
        method: "PATCH",
        body: JSON.stringify({ conversationId: selected.id, action: "empty" }),
      })
      setMessages([])
      setConversations((current) => current.map((conversation) => conversation.id === selected.id ? { ...conversation, last_message: null, unread_count: 0 } : conversation))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversation could not be emptied")
    }
  }

  async function deleteCurrentConversation() {
    if (!selected) return
    const confirmed = window.confirm("Delete this conversation from Connect? Rooms owned by CEO are archived for selected members.")
    if (!confirmed) return
    setError(null)
    setMoreMenuOpen(false)
    try {
      await readJson<{ ok: boolean }>(`/api/connect/conversations?conversationId=${encodeURIComponent(selected.id)}`, { method: "DELETE" })
      setConversations((current) => {
        const remaining = current.filter((conversation) => conversation.id !== selected.id)
        setSelectedId(remaining[0]?.id || "")
        return remaining
      })
      setMessages([])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversation could not be deleted")
    }
  }

  if (!open && floating) {
    const unreadConversation = conversations.find((conversation) => (conversation.unread_count || 0) > 0)
    const minimizedTop = widgetPosition ? Math.max(widgetPosition.y, CONNECT_WIDGET_TOP_GUARD) : undefined
    const minimizedStyle = widgetPosition
      ? { left: widgetPosition.x, top: minimizedTop, right: "auto", bottom: "auto", zIndex: CONNECT_WIDGET_Z_INDEX }
      : { zIndex: CONNECT_WIDGET_Z_INDEX }
    return (
      <button
        type="button"
        onPointerDown={(event) => beginWidgetDrag(event, "button")}
        onClick={() => {
          if (suppressMinimizedClickRef.current) return
          if (incomingCall?.conversation_id) openConnectContext(incomingCall.conversation_id)
          else if (taskNotificationCount || assignedTaskCount) openConnectContext(null, "actions")
          else openConnectContext(unreadConversation?.id || selectedId)
        }}
        style={minimizedStyle}
        className={cx(
          "fixed bottom-6 right-6 z-[80] flex touch-none items-center gap-3 rounded-[26px] border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-2xl shadow-slate-900/20 transition hover:-translate-y-1 hover:shadow-slate-900/30",
          (incomingCall || callSignal) && "animate-pulse border-violet-300 ring-4 ring-violet-500/15",
          missedCallCount > 0 && "ring-4 ring-rose-500/15"
        )}
        aria-label="Open AngelCare Connect"
        title="Drag to move. Click to open AngelCare Connect."
      >
        <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-500/25">
          {incomingCall || connectedCall || outgoingRingingCall ? <Phone className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
          {minimizedSignalCount > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white">{minimizedSignalCount}</span>}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-xs font-black uppercase tracking-[0.22em] text-violet-600">Connect</span>
          <span className="block text-sm font-black">
            {incomingCall ? "Incoming call" : connectedCall ? "Live call active" : outgoingRingingCall ? "Calling..." : missedCallCount > 0 ? "Missed call" : taskNotificationCount || assignedTaskCount ? "Task assigned" : unreadTotal > 0 ? "Unread updates" : "Open internal messenger"}
          </span>
          <span className="mt-1 flex items-center gap-1 text-[10px] font-black text-slate-400">
            {unreadTotal > 0 && <span className="rounded-full bg-violet-50 px-1.5 py-0.5 text-violet-700">{unreadTotal} unread</span>}
            {incomingCall && <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-emerald-700">ringing</span>}
            {missedCallCount > 0 && <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-rose-700">{missedCallCount} missed</span>}
            {(taskNotificationCount > 0 || assignedTaskCount > 0) && <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-emerald-700">tasks</span>}
          </span>
        </span>
      </button>
    )
  }

  const shellClass = embedded && !forceFloating
    ? "relative flex h-[calc(100vh-120px)] min-h-[720px] w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/70"
    : panelSize === "narrow"
      ? "fixed bottom-4 right-4 z-[80] flex h-[min(760px,calc(100vh-40px))] w-[min(860px,calc(100vw-32px))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-950/25"
      : "fixed bottom-4 right-4 z-[80] flex h-[min(860px,calc(100vh-40px))] w-[min(1440px,calc(100vw-32px))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-950/25"
  const shellTop = widgetPosition ? Math.max(widgetPosition.y, CONNECT_WIDGET_TOP_GUARD) : undefined
  const shellMaxHeightTop = shellTop ?? CONNECT_WIDGET_TOP_GUARD
  const shellStyle = floating
    ? widgetPosition
      ? {
          left: widgetPosition.x,
          top: shellTop,
          right: "auto",
          bottom: "auto",
          maxHeight: `calc(100vh - ${shellMaxHeightTop}px - ${CONNECT_WIDGET_MARGIN}px)`,
          zIndex: CONNECT_WIDGET_Z_INDEX,
        }
      : {
          right: CONNECT_WIDGET_MARGIN,
          bottom: CONNECT_WIDGET_MARGIN,
          maxHeight: `calc(100vh - ${CONNECT_WIDGET_TOP_GUARD}px - ${CONNECT_WIDGET_MARGIN}px)`,
          zIndex: CONNECT_WIDGET_Z_INDEX,
        }
    : undefined

  const sidebarWidth = mobileEmbedded ? "w-full" : panelSize === "narrow" ? "w-[292px]" : "w-[310px]"
  const showRightPanel = !mobileEmbedded && rightPanelOpen && panelSize === "expanded"

  return (
    <section
      data-connect-shell
      data-connect-mobile-embedded={mobileEmbedded ? "true" : undefined}
      data-connect-mobile-pane={mobileEmbedded ? mobilePane : undefined}
      data-connect-staff-directory-disabled={disableStaffDirectory ? "true" : undefined}
      className={shellClass}
      style={shellStyle}
      aria-label="AngelCare Connect messenger"
    >
      {toastAlerts.length > 0 && (
        <div className="pointer-events-none fixed right-5 top-5 z-[98] flex w-[min(380px,calc(100vw-32px))] flex-col gap-2">
          {toastAlerts.map((alert) => (
            <button
              key={alert.id}
              type="button"
              onClick={() => {
                setToastAlerts((current) => current.filter((item) => item.id !== alert.id))
                if (alert.tone === "task") openConnectContext(null, "actions")
                else openConnectContext(alert.conversationId || selectedId)
              }}
              className={cx(
                "pointer-events-auto rounded-[22px] border bg-white p-4 text-left shadow-2xl shadow-slate-900/15",
                alert.tone === "call" && "border-emerald-200",
                alert.tone === "missed" && "border-rose-200",
                alert.tone === "task" && "border-emerald-200",
                alert.tone === "message" && "border-violet-200"
              )}
            >
              <p className="truncate text-sm font-black text-slate-950">{alert.title}</p>
              {alert.body && <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-500">{alert.body}</p>}
            </button>
          ))}
        </div>
      )}
      <aside className={cx("flex min-h-0 shrink-0 flex-col border-r border-slate-200 bg-white", sidebarWidth, mobileEmbedded && mobilePane === "thread" && "hidden")}>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
          <button className="flex min-w-0 items-center gap-2 text-left">
            <span className="truncate text-base font-black text-slate-950">
              {mode === "direct" ? "Direct Messages" : mode === "rooms" ? "Team Rooms" : mode === "broadcasts" ? "Broadcasts" : "Actions"}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={openTaskManager} className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" title="Open Connect task manager">
              <ClipboardList className="h-5 w-5" />
            </button>
            <button onClick={openRoomBuilder} className={cx("grid h-10 w-10 place-items-center rounded-2xl text-white shadow-lg", isCEO ? "bg-violet-600 shadow-violet-500/25" : "bg-slate-300 shadow-slate-300/20")} title={isCEO ? "Create selected-access room" : "Only CEO can create rooms"}>
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400" placeholder="Search conversations..." />
            </div>
            <button onClick={() => void markAllNotificationsRead()} className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200" title="Mark Connect notifications read">
              <Settings2 className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1 rounded-2xl bg-slate-50 p-1 text-xs font-black text-slate-500">
            {([
              ["direct", "All", conversations.filter((conversation) => conversation.type === "direct").length],
              ["rooms", "Rooms", conversations.filter((conversation) => conversation.type === "room" || conversation.type === "context").length],
              ["broadcasts", "Alerts", conversations.filter((conversation) => conversation.type === "broadcast").length],
              ["actions", "Tasks", actions.length],
            ] as const).map(([key, label, count]) => (
              <button key={key} onClick={() => changeMode(key)} className={cx("rounded-xl px-2 py-2 transition", mode === key ? "bg-white text-violet-700 shadow-sm" : "hover:bg-white")}> 
                <span>{label}</span>
                {count > 0 && <span className="ml-1 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] text-violet-700">{count}</span>}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="mx-4 mb-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold leading-5 text-rose-700">{error}</div>}

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          {loading && <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading live chats…</div>}

          {!loading && mode !== "actions" && filteredConversations.map((conversation) => {
            const active = selected?.id === conversation.id
            const member = otherMember(conversation, currentUser?.id)
            const title = conversation.type === "direct" ? member?.name || conversation.title : conversation.title
            const subtitle = conversation.last_message || (conversation.type === "direct" ? member?.job_title || member?.role || member?.department : conversation.department || conversation.privacy_level)
            return (
              <button key={conversation.id} onClick={() => setSelectedId(conversation.id)} className={cx("group mb-2 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition", active ? "bg-violet-50 shadow-sm ring-1 ring-violet-100" : "hover:bg-slate-50")}>
                <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-sm font-black text-slate-700">
                  {conversation.type === "direct" ? initials(title) : <Users className="h-5 w-5" />}
                  <span className={cx("absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white", statusTone(member?.status || "offline"))} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-black text-slate-900">{title}</span>
                    <span className="shrink-0 text-[11px] font-bold text-slate-400">{formatTime(conversation.last_message_at)}</span>
                  </span>
                  <span className="mt-1 flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-slate-500">{subtitle || "Live internal thread"}</span>
                    {(conversation.unread_count || 0) > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-violet-600 px-1.5 text-[10px] font-black text-white">{conversation.unread_count}</span>}
                  </span>
                </span>
              </button>
            )
          })}

          {!loading && mode === "actions" && (
            <div className="space-y-2">
              <button onClick={() => openTaskEditor()} className="mb-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700">
                <Plus className="h-4 w-4" /> New task
              </button>
              {visibleTasks.map((action) => (
                <div key={action.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-black text-slate-950">{action.title}</p>
                    <span className={cx("rounded-full px-2 py-1 text-[10px] font-black uppercase", priorityTone(action.priority))}>{action.priority}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{action.description || "No task description"}</p>
                  <p className="mt-2 text-xs font-bold text-slate-500">{action.status} · {formatTime(action.due_at || action.created_at)} · {(action.assignees || []).length || (action.assignee_ids || []).length} assigned</p>
                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={() => openTaskEditor(action)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"><Pencil className="mr-1 inline h-3 w-3" /> Edit</button>
                    <button onClick={() => void deleteTask(action)} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-black text-rose-600 hover:bg-rose-50"><Trash2 className="mr-1 inline h-3 w-3" /> Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && mode !== "actions" && filteredConversations.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
              <UserRound className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-3 text-sm font-black text-slate-800">No conversations found</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{disableStaffDirectory ? 'Les conversations autorisées apparaîtront ici.' : 'Search staff below or create a team room.'}</p>
            </div>
          )}

          {mode === "direct" && staffResults.length > 0 && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="mb-2 px-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Start private chat</p>
              {staffResults.map((member) => (
                <button data-connect-staff-directory-item="true" key={member.id} onClick={() => { if (mobileEmbedded) setMobilePane("thread"); void createDirectConversation(member) }} className="mb-1 flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left hover:bg-slate-50">
                  <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-600">
                    {initials(member.name)}
                    <span className={cx("absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white", statusTone(member.status))} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-slate-800">{member.name}</span>
                    <span className="block truncate text-[11px] font-bold text-slate-400">{member.department || "AngelCare"} · {member.job_title || member.role || "staff"}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      <main className={cx("flex min-h-0 min-w-0 flex-1 flex-col bg-white", mobileEmbedded && mobilePane === "list" && "hidden")}>
        {mobileEmbedded ? (
          <button
            type="button"
            onClick={() => setMobilePane("list")}
            className="mx-4 mt-4 inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white shadow-lg"
            style={{ color: "#ffffff" }}
          >
            ← Conversations
          </button>
        ) : null}
        <header onPointerDown={(event) => beginWidgetDrag(event, "panel")} className={cx("flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4", floating && "cursor-move")}>
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-violet-100 to-slate-100 text-sm font-black text-violet-700">
              {selected ? initials(headlineName) : <MessageCircle className="h-5 w-5" />}
              {selected && <span className={cx("absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white", statusTone(selectedMember?.status || "online"))} />}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-base font-black text-slate-950">{headlineName}</h2>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <p className="truncate text-xs font-semibold text-slate-500">{headlineRole}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <button onClick={() => setThreadSearchOpen((current) => !current)} className={cx("grid h-10 w-10 place-items-center rounded-2xl hover:bg-slate-100", threadSearchOpen && "bg-violet-50 text-violet-700")} title="Search thread"><Search className="h-5 w-5" /></button>
            <button onClick={() => void startCall("audio")} disabled={!selected} className="grid h-10 w-10 place-items-center rounded-2xl hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40" title="Voice call"><Phone className="h-5 w-5" /></button>
            <button onClick={() => void startCall("video")} disabled={!selected} className="grid h-10 w-10 place-items-center rounded-2xl hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40" title="Video call"><Video className="h-5 w-5" /></button>
            <div className="relative">
              <button onClick={() => setMoreMenuOpen((current) => !current)} disabled={!selected} className="grid h-10 w-10 place-items-center rounded-2xl hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40" title="Conversation options"><MoreHorizontal className="h-5 w-5" /></button>
              {moreMenuOpen && selected && (
                <div className="absolute right-0 top-12 z-[90] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-sm font-bold text-slate-700 shadow-2xl shadow-slate-900/15">
                  <button onClick={() => setRightPanelOpen((current) => !current)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-slate-50"><UserRound className="h-4 w-4 text-slate-400" /> Toggle profile details</button>
                  <button onClick={() => void enableBrowserNotifications()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-slate-50"><Bell className="h-4 w-4 text-violet-500" /> {browserNotificationsEnabled ? "Browser notifications enabled" : "Enable browser notifications"}</button>
                  <button onClick={() => void pinCurrentConversation()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-slate-50">{selected.pinned ? <PinOff className="h-4 w-4 text-violet-500" /> : <Pin className="h-4 w-4 text-violet-500" />} {selected.pinned ? "Unpin conversation" : "Pin conversation"}</button>
                  <button onClick={() => void createActionFromThread()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-slate-50"><ClipboardCheck className="h-4 w-4 text-emerald-500" /> Create task from thread</button>
                  <button onClick={() => void emptyCurrentConversation()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-amber-50 hover:text-amber-700"><Eraser className="h-4 w-4" /> Empty chat</button>
                  <button onClick={() => void deleteCurrentConversation()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /> Delete conversation</button>
                </div>
              )}
            </div>
            {floating && <button onClick={() => changePanelSize(panelSize === "expanded" ? "narrow" : "expanded")} className="grid h-10 w-10 place-items-center rounded-2xl hover:bg-slate-100" title={panelSize === "expanded" ? "Narrow widget" : "Expand widget"}>{panelSize === "expanded" ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}</button>}
            {floating && <button onClick={() => setPanelOpen(false)} className="grid h-10 w-10 place-items-center rounded-2xl hover:bg-slate-100" title="Minimize"><X className="h-5 w-5" /></button>}
          </div>
        </header>

        {threadSearchOpen && (
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
            <div className="mx-auto flex max-w-4xl items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={threadQuery} onChange={(event) => setThreadQuery(event.target.value)} className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400" placeholder="Search inside this thread, files, priorities, senders..." />
              {threadQuery && <button onClick={() => setThreadQuery("")} className="rounded-xl bg-slate-100 px-2 py-1 text-xs font-black text-slate-500">Clear</button>}
            </div>
          </div>
        )}

        {(incomingCall || outgoingRingingCall || connectedCall || missedCallCount > 0) && (
          <div className="border-b border-violet-100 bg-white px-5 py-3">
            {incomingCall ? (
              <div className="flex items-center justify-between gap-4 rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"><Phone className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">Incoming {incomingCall.call_type} call</p>
                    <p className="truncate text-xs font-bold text-slate-600">{incomingCall.started_by_name || "AngelCare teammate"} · Ringing for {formatDuration(incomingCall.started_at, nowMs)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button onClick={() => void rejectCall(incomingCall)} className="rounded-2xl border border-rose-200 bg-white px-4 py-3 text-xs font-black text-rose-600 hover:bg-rose-50">Reject</button>
                  <button onClick={() => void answerCall(incomingCall)} className="rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700">Answer</button>
                </div>
              </div>
            ) : outgoingRingingCall ? (
              <div className="flex items-center justify-between gap-4 rounded-[24px] border border-violet-200 bg-violet-50 px-4 py-3 shadow-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-500/20"><Phone className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">Calling in Connect</p>
                    <p className="truncate text-xs font-bold text-slate-600">Ringing · {formatDuration(outgoingRingingCall.started_at, nowMs)}</p>
                  </div>
                </div>
                <button onClick={() => void endCall(outgoingRingingCall.id)} className="rounded-2xl border border-rose-200 bg-white px-4 py-3 text-xs font-black text-rose-600 hover:bg-rose-50">Cancel call</button>
              </div>
            ) : connectedCall ? (
              <div className="flex items-center justify-between gap-4 rounded-[24px] border border-violet-200 bg-violet-50 px-4 py-3 shadow-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-500/20">{connectedCall.call_type === "video" ? <Video className="h-5 w-5" /> : <Phone className="h-5 w-5" />}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">Connected {connectedCall.call_type} call</p>
                    <p className="truncate text-xs font-bold text-slate-600">Live duration · {formatDuration(connectedCall.connected_at || connectedCall.answered_at || connectedCall.started_at, nowMs)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button onClick={() => { setActiveCall({ callId: connectedCall.id, roomName: connectedCall.room_name, type: connectedCall.call_type, startedAt: connectedCall.connected_at || connectedCall.answered_at || connectedCall.started_at || null }); setCallView("inline") }} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 hover:bg-slate-50">Open call</button>
                  <button onClick={() => void endCall(connectedCall.id)} className="rounded-2xl bg-rose-600 px-4 py-3 text-xs font-black text-white hover:bg-rose-700">End</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4 rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-600 text-white"><Phone className="h-4 w-4" /></span>
                  <p className="text-sm font-black text-rose-700">{missedCallCount} missed Connect call{missedCallCount === 1 ? "" : "s"}</p>
                </div>
                <button onClick={() => void markAllNotificationsRead()} className="rounded-2xl border border-rose-200 bg-white px-4 py-3 text-xs font-black text-rose-600 hover:bg-rose-50">Mark seen</button>
              </div>
            )}
          </div>
        )}

        {activeCall && callView !== "fullscreen" && (
          <div className={cx("border-b border-violet-100 bg-violet-50/70 px-5 py-3", callView === "mini" && "py-2")}>
            {callView === "inline" ? (
              <div className="overflow-hidden rounded-[24px] border border-violet-200 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-black text-slate-950">{activeCall.type === "video" ? "Video call" : "Audio call"} · {headlineName}</p>
                    <p className="text-xs font-bold text-slate-500">Connected · {formatDuration(activeCallStartedAt, nowMs)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCallView("mini")} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">Minimize to chat</button>
                    <button onClick={() => setCallView("fullscreen")} className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-black text-white hover:bg-violet-700">Full screen</button>
                  </div>
                </div>
                {currentUser && (
                  <div className="h-[260px] bg-slate-950">
                    <ConnectLiveRoom
                      roomName={activeCall.roomName}
                      participantName={currentUser.name || currentUser.email || "AngelCare User"}
                      participantId={currentUser.id}
                      type={activeCall.type}
                      onLeave={() => void endCall(activeCall.callId)}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-2xl border border-violet-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600 text-white">{activeCall.type === "video" ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}</span>
                  <div>
                    <p className="text-sm font-black text-slate-950">Live {activeCall.type} call in this conversation</p>
                    <p className="text-xs font-bold text-slate-500">{formatDuration(activeCallStartedAt, nowMs)} · Minimized while you keep chatting</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCallView("inline")} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">Open call</button>
                  <button onClick={() => setCallView("fullscreen")} className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-black text-white hover:bg-violet-700">Full screen</button>
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-white to-slate-50 px-5 py-5">
          {threadLoading && <div className="mb-4 flex items-center justify-center gap-2 text-sm font-bold text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading thread…</div>}

          {!selected && (
            <div className="grid h-full place-items-center text-center">
              <div className="max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
                <MessageCircle className="mx-auto h-10 w-10 text-violet-500" />
                <p className="mt-4 text-xl font-black text-slate-950">AngelCare Connect</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">Select a live conversation or start a private staff chat from the left panel.</p>
              </div>
            </div>
          )}

          {selected && filteredMessages.length === 0 && !threadLoading && (
            <div className="grid h-full place-items-center text-center">
              <div className="max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
                <Sparkles className="mx-auto h-10 w-10 text-violet-500" />
                <p className="mt-4 text-xl font-black text-slate-950">Live thread ready</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">No messages yet. Start a clear internal update, decision, request, or escalation.</p>
              </div>
            </div>
          )}

          {selected && filteredMessages.length > 0 && (
            <div className="mx-auto flex max-w-4xl flex-col gap-4">
              <div className="mx-auto rounded-full bg-white px-4 py-1 text-xs font-black text-slate-400 shadow-sm ring-1 ring-slate-200">Today</div>
              {filteredMessages.map((message) => {
                const mine = currentUser?.id === message.sender_id || String(currentUser?.id) === String(message.sender_id)
                const fileName = String(message.metadata?.filename || message.metadata?.fileName || "")
                const fileAttachment = message.message_type === "file" || fileName ? attachmentFromMessage(message, currentUser?.id) : null
                const unreadForMe = !mine && !message.my_read_at && message.message_type !== "system"
                const systemMessage = message.message_type === "system"
                if (systemMessage) {
                  return (
                    <div key={message.id} className="flex justify-center py-1">
                      <div className="max-w-[76%] rounded-full border border-slate-200 bg-white px-4 py-2 text-center text-[13px] font-extrabold leading-5 text-slate-700 shadow-sm">
                        {message.body}
                      </div>
                    </div>
                  )
                }
                return (
                  <div key={message.id} className={cx("flex items-end gap-2", mine ? "justify-end" : "justify-start")}> 
                    {!mine && <span className="mb-1 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-[11px] font-black text-slate-600 ring-1 ring-slate-200">{initials(message.sender_name)}</span>}
                    <div className={cx("max-w-[72%]", mine ? "text-right" : "text-left")}> 
                      <div className={cx("mb-1 flex items-center gap-2 text-[12px] font-extrabold text-slate-500", mine ? "justify-end" : "justify-start")}> 
                        {!mine && <span className="text-slate-700">{message.sender_name || "AngelCare User"}</span>}
                        <span>{formatTime(message.created_at)}</span>
                        {message.confidential && <EyeOff className="h-3 w-3 text-violet-500" />}
                        {unreadForMe && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black uppercase text-violet-700">New</span>}
                      </div>
                      <div className={cx("rounded-[26px] px-5 py-4 text-[15px] leading-7 shadow-sm ring-1", mine ? "rounded-br-md bg-violet-700 text-white shadow-violet-500/25 ring-violet-700/20" : unreadForMe ? "rounded-bl-md border border-violet-200 bg-violet-50 text-slate-900 ring-violet-200" : "rounded-bl-md border border-slate-200 bg-white text-slate-900 ring-slate-200/80")}> 
                        {fileAttachment ? (
                          <button type="button" onClick={() => openAttachmentFromMessage(message)} className="flex w-full items-center gap-3 text-left">
                            <span className={cx("grid h-10 w-10 place-items-center rounded-2xl", mine ? "bg-white/15 text-white" : "bg-rose-50 text-rose-600")}><FileText className="h-5 w-5" /></span>
                            <span className="min-w-0 text-left">
                              <span className={cx("block truncate text-sm font-black", mine ? "text-white" : "text-slate-950")}>{fileAttachment.filename}</span>
                              <span className={cx("block text-xs font-bold", mine ? "text-violet-100" : "text-slate-500")}>{formatBytes(fileAttachment.size)} · {fileAttachment.contentType}</span>
                            </span>
                          </button>
                        ) : (
                          <p className={cx("whitespace-pre-wrap break-words font-semibold tracking-[-0.01em]", mine ? "text-white" : "text-slate-900")}>{message.body}</p>
                        )}
                      </div>
                      <div className={cx("mt-1 flex items-center gap-2 text-[10px] font-black", mine ? "justify-end text-violet-600" : "justify-start text-slate-400")}>
                        {mine && <span className="flex items-center gap-1"><Check className="h-3 w-3" />{readLabel(message, selected)}</span>}
                        {fileAttachment?.url && <a href={fileAttachment.url} target="_blank" rel="noreferrer" className="rounded-full px-2 py-0.5 hover:bg-slate-100" title="Download attachment">Download</a>}
                        {fileAttachment && <button onClick={() => openAttachmentFromMessage(message)} className="rounded-full px-2 py-0.5 hover:bg-slate-100">Preview</button>}
                        {(mine || fileAttachment?.mine) && <button onClick={() => fileAttachment ? void deleteConnectAttachment(fileAttachment) : void deleteConnectMessage(message)} className="rounded-full px-2 py-0.5 text-rose-500 hover:bg-rose-50">Delete</button>}
                      </div>
                    </div>
                  </div>
                )
              })}
              {typingPulse && <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><span className="rounded-full bg-white px-3 py-2 shadow-sm">You are typing…</span></div>}
            </div>
          )}
        </div>

        <footer className="border-t border-slate-200 bg-white px-5 py-4">
          <input ref={attachmentInputRef} type="file" accept={attachmentAccept} className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadConnectFile(file) }} />
          <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  void sendCurrentMessage()
                }
              }}
              disabled={!selected || sending}
              className="min-h-[54px] w-full resize-none bg-transparent px-2 py-2 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
              placeholder={selected ? "Type a message..." : "Select a conversation first..."}
            />
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1 text-slate-400">
                <button type="button" onClick={() => openAttachmentPicker()} disabled={uploadingAttachment} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-100 disabled:opacity-40" title="Attach file">{uploadingAttachment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}</button>
                <div className="relative">
                  <button type="button" onClick={() => setEmojiMenuOpen((current) => !current)} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-100" title="Emoji"><Smile className="h-4 w-4" /></button>
                  {emojiMenuOpen && (
                    <div className="absolute bottom-11 left-0 z-[94] grid grid-cols-6 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                      {["✅", "🙏", "🚨", "📌", "📎", "👏", "💬", "📞", "🟢", "⏳", "⭐", "🔥"].map((emoji) => (
                        <button key={emoji} type="button" onClick={() => { setDraft((current) => `${current}${emoji}`); setEmojiMenuOpen(false) }} className="grid h-8 w-8 place-items-center rounded-xl text-lg hover:bg-slate-100">{emoji}</button>
                      ))}
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => openAttachmentPicker("image/*,video/*")} disabled={uploadingAttachment} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-100 disabled:opacity-40" title="Media"><ImageIcon className="h-4 w-4" /></button>
                <button type="button" onClick={() => void toggleVoiceRecording()} className={cx("grid h-9 w-9 place-items-center rounded-xl", recordingVoice ? "bg-rose-100 text-rose-700" : "hover:bg-slate-100")} title={recordingVoice ? "Stop voice note" : "Voice note"}><Mic className="h-4 w-4" /></button>
                <button type="button" onClick={() => setConfidential((current) => !current)} className={cx("grid h-9 w-9 place-items-center rounded-xl", confidential ? "bg-violet-100 text-violet-700" : "hover:bg-slate-100")} title="Confidential"><EyeOff className="h-4 w-4" /></button>
                <button type="button" onClick={() => setComposerPriority((current) => current === "urgent" ? "normal" : current === "important" ? "urgent" : "important")} className={cx("rounded-xl px-2.5 py-2 text-[11px] font-black uppercase", priorityTone(composerPriority))}>{composerPriority}</button>
              </div>
              <button onClick={() => void sendCurrentMessage()} disabled={!selected || sending || !draft.trim()} className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-500/25 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none" title="Send">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </footer>
      </main>

      {showRightPanel && (
        <aside className="flex min-h-0 w-[380px] shrink-0 flex-col border-l border-slate-200 bg-white">
          <div className="relative h-36 bg-gradient-to-br from-violet-100 via-sky-100 to-emerald-100">
            <button onClick={() => setRightPanelOpen(false)} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/70 text-slate-500 backdrop-blur hover:bg-white"><X className="h-4 w-4" /></button>
          </div>
          <div className="-mt-14 flex flex-col items-center border-b border-slate-100 px-5 pb-5 text-center">
            <span className="relative grid h-28 w-28 place-items-center rounded-full border-4 border-white bg-violet-100 text-3xl font-black text-violet-700 shadow-lg">
              {initials(headlineName)}
              <span className={cx("absolute bottom-4 right-3 h-4 w-4 rounded-full border-2 border-white", statusTone(selectedMember?.status || "online"))} />
            </span>
            <h3 className="mt-3 text-xl font-black text-slate-950">{headlineName}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{headlineRole}</p>
            <p className="text-xs font-semibold text-slate-400">{selected?.department || selectedMember?.department || "AngelCare"}</p>
            <div className="mt-5 grid w-full grid-cols-4 gap-2">
              {([
                [MessageCircle, "Message", () => { setThreadSearchOpen(false); setRightPanelOpen(false) }],
                [Phone, "Call", () => void startCall("audio")],
                [Video, "Video", () => void startCall("video")],
                [MoreHorizontal, "More", () => void createActionFromThread()],
              ] as Array<[React.ComponentType<{ className?: string }>, string, () => void]>).map(([Icon, label, action]) => (
                <button key={label} onClick={action} disabled={!selected} className="rounded-2xl bg-slate-50 px-2 py-3 text-xs font-black text-slate-600 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-40">
                  <Icon className="mx-auto mb-1 h-4 w-4" />{label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
            <section>
              <h4 className="text-sm font-black text-slate-950">About</h4>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex justify-between gap-4"><dt className="font-semibold text-slate-500">Email</dt><dd className="truncate font-bold text-slate-700">{hideContactDetails ? CONNECT_PRIVATE_CONTACT_LABEL : (selectedMember?.email || currentUser?.email || "—")}</dd></div>
                <div className="flex justify-between gap-4"><dt className="font-semibold text-slate-500">Phone</dt><dd className="font-bold text-slate-700">{hideContactDetails ? CONNECT_PRIVATE_CONTACT_LABEL : (selectedMember?.phone || currentUser?.phone || "—")}</dd></div>
                <div className="flex justify-between gap-4"><dt className="font-semibold text-slate-500">Department</dt><dd className="truncate font-bold text-slate-700">{selectedMember?.department || selected?.department || "—"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="font-semibold text-slate-500">Privacy</dt><dd className="truncate font-bold text-slate-700">{selected?.privacy_level || "—"}</dd></div>
              </dl>
            </section>

            <section>
              <h4 className="text-sm font-black text-slate-950">Recent Calls</h4>
              <div className="mt-3 space-y-2">
                {calls.filter((call) => !selected?.id || call.conversation_id === selected.id).slice(0, 4).map((call) => (
                  <div key={call.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={cx("grid h-9 w-9 place-items-center rounded-xl text-white", call.status === "missed" || call.status === "rejected" ? "bg-rose-500" : liveCall(call.status) ? "bg-emerald-600" : "bg-violet-600")}>{call.call_type === "video" ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black text-slate-800">{call.call_type} · {call.status}</span>
                        <span className="text-xs font-bold text-slate-400">{formatTime(call.started_at)}{liveCall(call.status) ? ` · ${formatDuration(call.connected_at || call.answered_at || call.started_at, nowMs)}` : ""}</span>
                      </span>
                    </div>
                    {call.status === "ringing" && String(call.started_by || "") !== String(currentUser?.id || "") && <button onClick={() => void answerCall(call)} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white">Answer</button>}
                  </div>
                ))}
                {calls.filter((call) => !selected?.id || call.conversation_id === selected.id).length === 0 && <p className="rounded-2xl bg-slate-50 p-4 text-xs font-bold text-slate-400">No call history for this thread yet.</p>}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between"><h4 className="text-sm font-black text-slate-950">Shared Media</h4><button onClick={() => { setThreadSearchOpen(true); setThreadQuery("file") }} className="text-xs font-black text-violet-600">View all</button></div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {activeFiles.slice(0, 3).map((message) => (
                  <button key={message.id} onClick={() => openAttachmentFromMessage(message)} className="grid aspect-square place-items-center rounded-2xl bg-slate-100 text-slate-400 hover:bg-violet-50 hover:text-violet-600" title="Preview attachment"><FileText className="h-5 w-5" /></button>
                ))}
                {activeFiles.length === 0 && <div className="col-span-4 rounded-2xl border border-dashed border-slate-200 p-4 text-center text-xs font-bold text-slate-400">No shared media yet</div>}
                {activeFiles.length > 3 && <div className="grid aspect-square place-items-center rounded-2xl bg-slate-100 text-sm font-black text-slate-600">+{activeFiles.length - 3}</div>}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between"><h4 className="text-sm font-black text-slate-950">Files</h4><button onClick={() => { setThreadSearchOpen(true); setThreadQuery("file") }} className="text-xs font-black text-violet-600">View all</button></div>
              <div className="mt-3 space-y-2">
                {activeFiles.slice(0, 5).map((message) => {
                  const attachment = attachmentFromMessage(message, currentUser?.id)
                  return (
                    <div key={message.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-600"><FileText className="h-5 w-5" /></span>
                      <button onClick={() => setAttachmentPreview(attachment)} className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-black text-slate-800">{attachment.filename}</span><span className="text-xs font-bold text-slate-400">{formatBytes(attachment.size)} · {formatTime(attachment.uploadedAt)}</span></button>
                      {attachment.url && <a href={attachment.url} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-white hover:text-violet-600" title="Download attachment"><Download className="h-4 w-4" /></a>}
                      {attachment.mine && <button onClick={() => void deleteConnectAttachment(attachment)} className="grid h-8 w-8 place-items-center rounded-xl text-rose-400 hover:bg-white hover:text-rose-600" title="Delete attachment"><Trash2 className="h-4 w-4" /></button>}
                    </div>
                  )
                })}
                {activeFiles.length === 0 && <p className="rounded-2xl bg-slate-50 p-4 text-xs font-bold text-slate-400">No files shared in this live thread yet.</p>}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between"><h4 className="text-sm font-black text-slate-950">Pinned Messages</h4><button onClick={createActionFromThread} className="text-xs font-black text-violet-600">Create task</button></div>
              <div className="mt-3 space-y-2">
                {messages.filter((message) => message.priority !== "normal" || message.confidential).slice(-3).reverse().map((message) => (
                  <div key={message.id} className="rounded-2xl bg-slate-50 p-3">
                    <p className="line-clamp-2 text-sm font-bold text-slate-700">{message.body}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">{message.priority} · {formatTime(message.created_at)}</p>
                  </div>
                ))}
                {messages.filter((message) => message.priority !== "normal" || message.confidential).length === 0 && <p className="rounded-2xl bg-slate-50 p-4 text-xs font-bold text-slate-400">No pinned or priority messages yet.</p>}
              </div>
            </section>
          </div>
        </aside>
      )}


      {taskManagerOpen && (
        <div className="fixed inset-0 z-[91] grid place-items-center bg-slate-950/35 p-6 backdrop-blur-sm">
          <div className="flex max-h-[88vh] w-[min(980px,calc(100vw-48px))] flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white text-slate-950 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xl font-black text-slate-950">Connect task manager</p>
                <p className="mt-1 text-sm font-bold text-slate-500">Create, preview, edit, delete, and assign live tasks to selected staff only.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openTaskEditor()} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white hover:bg-emerald-700"><Plus className="mr-2 inline h-4 w-4" />New task</button>
                <button onClick={() => setTaskManagerOpen(false)} className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {actions.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <ClipboardList className="mx-auto h-10 w-10 text-emerald-600" />
                  <p className="mt-3 text-lg font-black text-slate-950">No Connect tasks yet</p>
                  <p className="mt-2 text-sm font-semibold text-slate-500">Tasks appear only for selected assignees and automatically notify them.</p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {visibleTasks.map((task) => (
                    <article key={task.id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="truncate text-base font-black text-slate-950">{task.title}</h4>
                          <p className="mt-1 line-clamp-3 text-sm font-semibold leading-6 text-slate-600">{task.description || "No description added."}</p>
                        </div>
                        <span className={cx("rounded-full px-2.5 py-1 text-[10px] font-black uppercase", priorityTone(task.priority))}>{task.priority}</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(task.assignees || []).slice(0, 5).map((item) => (
                          <span key={item.user_id} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">{item.user?.name || item.user_id}</span>
                        ))}
                        {(task.assignees || []).length > 5 && <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-black text-violet-700">+{(task.assignees || []).length - 5}</span>}
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                        <p className="text-xs font-bold text-slate-500">{task.status} · {formatTime(task.due_at || task.created_at)}</p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => openTaskEditor(task)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"><Pencil className="mr-1 inline h-3.5 w-3.5" />Edit</button>
                          <button onClick={() => void deleteTask(task)} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-black text-rose-600 hover:bg-rose-50"><Trash2 className="mr-1 inline h-3.5 w-3.5" />Delete</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {taskEditorOpen && (
        <div className="fixed inset-0 z-[93] grid place-items-center bg-slate-950/45 p-6 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-[min(820px,calc(100vw-48px))] flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white text-slate-950 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xl font-black text-slate-950">{editingTask ? "Edit Connect task" : "Create Connect task"}</p>
                <p className="mt-1 text-sm font-bold text-slate-500">Assigned users are notified and only selected assignees can access the task.</p>
              </div>
              <button onClick={() => setTaskEditorOpen(false)} className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200"><X className="h-5 w-5" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Task title</label>
              <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100" placeholder="Example: Confirm partnership proposal with Direction" />
              <label className="mt-5 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Description / preview</label>
              <textarea value={taskDescription} onChange={(event) => setTaskDescription(event.target.value)} className="mt-2 min-h-[110px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-800 outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100" placeholder="Write the clear task context, expected output, deadline or decision needed..." />
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Priority</label>
                  <select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value as Priority)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none"><option value="normal">Normal</option><option value="important">Important</option><option value="urgent">Urgent</option></select>
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Status</label>
                  <select value={taskStatus} onChange={(event) => setTaskStatus(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none"><option value="open">Open</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="done">Done</option></select>
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Due date</label>
                  <input type="datetime-local" value={taskDueAt} onChange={(event) => setTaskDueAt(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none" />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">Assign to selected staff</p>
                  <p className="text-xs font-bold text-slate-500">{selectedTaskAssignees.length} selected · task is visible only to these users and creator.</p>
                </div>
                <div className="flex w-72 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input value={taskSearch} onChange={(event) => setTaskSearch(event.target.value)} className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400" placeholder="Search staff..." />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {taskMemberResults.map((member) => {
                  const checked = selectedTaskAssignees.includes(member.id)
                  return (
                    <button data-connect-staff-directory-item="true" key={member.id} onClick={() => toggleTaskAssignee(member.id)} className={cx("flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition", checked ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50")}>
                      <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-700">{initials(member.name)}<span className={cx("absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white", statusTone(member.status))} /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-black text-slate-950">{member.name}</span><span className="block truncate text-xs font-bold text-slate-500">{member.department || "AngelCare"} · {member.job_title || member.role || "staff"}</span></span>
                      <span className={cx("grid h-6 w-6 place-items-center rounded-full border text-xs font-black", checked ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 text-slate-300")}>{checked ? <Check className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-5">
              <p className="text-xs font-bold text-slate-500">Tasks are live, user-scoped, and notify every newly assigned staff member.</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setTaskEditorOpen(false)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">Cancel</button>
                <button onClick={() => void saveTask()} disabled={!taskTitle.trim() || selectedTaskAssignees.length === 0} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"><Save className="mr-2 inline h-4 w-4" />Save task</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {roomModalOpen && (
        <div className="fixed inset-0 z-[92] grid place-items-center bg-slate-950/40 p-6 backdrop-blur-sm">
          <div className="flex max-h-[86vh] w-[min(760px,calc(100vw-48px))] flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white text-slate-950 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xl font-black text-slate-950">Create selected-access room</p>
                <p className="mt-1 text-sm font-bold text-slate-500">CEO only · the room appears only for selected staff members.</p>
              </div>
              <button onClick={() => setRoomModalOpen(false)} className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200"><X className="h-5 w-5" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Room name</label>
              <input value={roomTitle} onChange={(event) => setRoomTitle(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-900 outline-none focus:border-violet-300 focus:bg-white" placeholder="Example: Direction x Operations private room" />

              <div className="mt-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">Select staff access</p>
                  <p className="text-xs font-bold text-slate-500">{selectedRoomMembers.length} selected · users not selected will not see this room.</p>
                </div>
                <div className="flex w-72 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input value={roomSearch} onChange={(event) => setRoomSearch(event.target.value)} className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400" placeholder="Search staff..." />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {roomMemberResults.map((member) => {
                  const checked = selectedRoomMembers.includes(member.id)
                  return (
                    <button data-connect-staff-directory-item="true" key={member.id} onClick={() => toggleRoomMember(member.id)} className={cx("flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition", checked ? "border-violet-300 bg-violet-50" : "border-slate-200 bg-white hover:bg-slate-50")}>
                      <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-700">
                        {initials(member.name)}
                        <span className={cx("absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white", statusTone(member.status))} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black text-slate-900">{member.name}</span>
                        <span className="block truncate text-xs font-bold text-slate-500">{member.department || "AngelCare"} · {member.job_title || member.role || "staff"}</span>
                      </span>
                      <span className={cx("grid h-6 w-6 place-items-center rounded-full border text-xs font-black", checked ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300 text-slate-300")}>{checked ? <Check className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-5">
              <p className="text-xs font-bold text-slate-500">CEO creates the room. Membership controls visibility in every user’s Connect widget.</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setRoomModalOpen(false)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={() => void createSelectedRoom()} disabled={!roomTitle.trim() || selectedRoomMembers.length === 0} className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/20 hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">Create room</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {attachmentPreview && (
        <div className="fixed inset-0 z-[94] grid place-items-center bg-slate-950/45 p-6 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-[min(920px,calc(100vw-48px))] flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white text-slate-950 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div className="min-w-0">
                <p className="truncate text-lg font-black text-slate-950">{attachmentPreview.filename}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">{formatBytes(attachmentPreview.size)} · {attachmentPreview.contentType} · Uploaded {formatTime(attachmentPreview.uploadedAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {attachmentPreview.url && <a href={attachmentPreview.url} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-700 hover:bg-slate-50"><Download className="mr-2 inline h-4 w-4" />Download</a>}
                {attachmentPreview.mine && <button onClick={() => void deleteConnectAttachment(attachmentPreview)} className="rounded-2xl border border-rose-200 px-4 py-3 text-xs font-black text-rose-600 hover:bg-rose-50"><Trash2 className="mr-2 inline h-4 w-4" />Delete</button>}
                <button onClick={() => setAttachmentPreview(null)} className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-slate-50 p-6">
              {!attachmentPreview.url ? (
                <div className="grid min-h-[360px] place-items-center rounded-[24px] border border-dashed border-slate-300 bg-white p-8 text-center">
                  <div>
                    <FileText className="mx-auto h-10 w-10 text-slate-400" />
                    <p className="mt-3 text-sm font-black text-slate-800">Preview link expired</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Refresh the conversation and try again. The file metadata is still safely stored.</p>
                  </div>
                </div>
              ) : attachmentIsImage(attachmentPreview) ? (
                <div className="grid place-items-center rounded-[24px] bg-white p-4 shadow-sm">
                  <img src={attachmentPreview.url} alt={attachmentPreview.filename} className="max-h-[62vh] max-w-full rounded-2xl object-contain" />
                </div>
              ) : attachmentIsPdf(attachmentPreview) ? (
                <iframe src={attachmentPreview.url} title={attachmentPreview.filename} className="h-[62vh] w-full rounded-[24px] border border-slate-200 bg-white" />
              ) : (
                <div className="grid min-h-[360px] place-items-center rounded-[24px] border border-slate-200 bg-white p-8 text-center shadow-sm">
                  <div>
                    <FileText className="mx-auto h-12 w-12 text-violet-500" />
                    <p className="mt-3 text-base font-black text-slate-950">Preview unavailable for this file type</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">Use Download to open it in the appropriate desktop or browser application.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeCall && currentUser && callView === "fullscreen" && (
        <div className="fixed inset-0 z-[95] bg-slate-950/85 p-6 backdrop-blur-sm">
          <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-white">
              <div>
                <p className="text-base font-black">{activeCall.type === "video" ? "Video call" : "Audio call"} · {headlineName}</p>
                <p className="text-xs font-bold text-white/50">Full screen Connect call · {formatDuration(activeCallStartedAt, nowMs)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setCallView("inline")} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black hover:bg-white/15">Back to conversation</button>
                <button onClick={() => setCallView("mini")} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black hover:bg-white/15">Minimize</button>
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <ConnectLiveRoom
                roomName={activeCall.roomName}
                participantName={currentUser.name || currentUser.email || "AngelCare User"}
                participantId={currentUser.id}
                type={activeCall.type}
                onLeave={() => void endCall(activeCall.callId)}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
