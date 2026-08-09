'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, MessageCircle, Phone, ShieldAlert, Video, X } from 'lucide-react'

type CareLinkUnifiedConnectNotificationBellProps = {
  records?: any[]
  notifications?: any[]
  messages?: any[]
  alerts?: any[]
  queuePending?: number
}

type UnifiedItem = {
  id: string
  source: 'carelink' | 'connect'
  kind: 'message' | 'call' | 'alert' | 'notification'
  title: string
  body: string
  href: string
  createdAt: string
  unread: boolean
  priority: 'normal' | 'high' | 'critical'
}

function asArray(value: unknown): any[] {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return []

  const row = value as Record<string, unknown>
  for (const key of ['data', 'items', 'messages', 'notifications', 'alerts', 'calls', 'rooms', 'rows', 'results']) {
    const nested = row[key]
    if (Array.isArray(nested)) return nested
    if (nested && typeof nested === 'object') {
      const deeper = asArray(nested)
      if (deeper.length) return deeper
    }
  }

  return []
}

function text(value: unknown, fallback = '') {
  const next = String(value ?? '').trim()
  return next || fallback
}

function itemDate(value: unknown) {
  const raw = text(value)
  const date = raw ? new Date(raw) : new Date()
  if (Number.isNaN(date.getTime())) return new Date().toISOString()
  return date.toISOString()
}

function labelDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function normalizePriority(value: unknown): UnifiedItem['priority'] {
  const raw = text(value).toLowerCase()
  if (['critical', 'urgent', 'sos', 'danger', 'high_critical'].includes(raw)) return 'critical'
  if (['high', 'important', 'warning', 'call'].includes(raw)) return 'high'
  return 'normal'
}

function normalizeCareLinkMessage(row: any, index: number): UnifiedItem {
  const missionId = row?.missionId || row?.mission_id || row?.mission?.id || null

  return {
    id: `carelink-message-${text(row?.id, String(index))}`,
    source: 'carelink',
    kind: 'message',
    title: text(row?.title || row?.subject, 'Message CareLink'),
    body: text(row?.body || row?.message || row?.content || row?.preview, 'Nouveau message opérationnel.'),
    href: missionId ? `/carelink/missions/${missionId}` : '/carelink/messages',
    createdAt: itemDate(row?.createdAt || row?.created_at || row?.inserted_at),
    unread: Boolean(row?.unread ?? row?.is_unread ?? (row?.read_at == null)),
    priority: normalizePriority(row?.priority || row?.severity),
  }
}

function normalizeCareLinkNotification(row: any, index: number): UnifiedItem {
  const missionId = row?.missionId || row?.mission_id || row?.mission?.id || null
  const kind = String(row?.kind || row?.type || '').toLowerCase().includes('alert') ? 'alert' : 'notification'

  return {
    id: `carelink-notification-${text(row?.id, String(index))}`,
    source: 'carelink',
    kind,
    title: text(row?.title || row?.label, kind === 'alert' ? 'Alerte CareLink' : 'Notification CareLink'),
    body: text(row?.body || row?.message || row?.description, 'Mise à jour CareLink.'),
    href: missionId ? `/carelink/missions/${missionId}` : '/carelink/messages',
    createdAt: itemDate(row?.createdAt || row?.created_at || row?.inserted_at),
    unread: Boolean(row?.unread ?? row?.is_unread ?? (row?.read_at == null)),
    priority: normalizePriority(row?.priority || row?.severity || row?.risk_level),
  }
}


function normalizeCareLinkAlert(row: any, index: number): UnifiedItem {
  const missionId = row?.missionId || row?.mission_id || row?.mission?.id || row?.payload?.missionId || null

  return {
    id: `carelink-alert-${text(row?.id, String(index))}`,
    source: 'carelink',
    kind: 'alert',
    title: text(row?.title || row?.label || row?.type, 'Alerte CareLink'),
    body: text(row?.body || row?.message || row?.description || row?.note, 'Alerte opérationnelle CareLink.'),
    href: missionId ? `/carelink/missions/${missionId}` : '/carelink/alerts',
    createdAt: itemDate(row?.createdAt || row?.created_at || row?.inserted_at || row?.updated_at),
    unread: Boolean(row?.unread ?? row?.is_unread ?? (row?.read_at == null)),
    priority: normalizePriority(row?.priority || row?.severity || row?.risk_level || 'critical'),
  }
}

function normalizeConnectMessage(row: any, index: number): UnifiedItem {
  const roomId = row?.room_id || row?.roomId || row?.conversation_id || row?.conversationId || null

  return {
    id: `connect-message-${text(row?.id, String(index))}`,
    source: 'connect',
    kind: 'message',
    title: text(row?.room_name || row?.roomName || row?.sender_name || row?.senderName || row?.title, 'Nouveau message Connect'),
    body: text(row?.body || row?.message || row?.content || row?.preview, 'Message AngelCare Connect reçu.'),
    href: roomId ? `/carelink/messages?connectRoom=${encodeURIComponent(String(roomId))}` : '/carelink/messages',
    createdAt: itemDate(row?.created_at || row?.createdAt || row?.sent_at || row?.updated_at),
    unread: Boolean(row?.unread ?? row?.is_unread ?? (row?.read_at == null)),
    priority: normalizePriority(row?.priority || row?.severity),
  }
}

function normalizeConnectCall(row: any, index: number): UnifiedItem {
  const status = text(row?.status || row?.call_status, 'call')
  const callType = text(row?.call_type || row?.type || row?.media_type, 'call')
  const isVideo = callType.toLowerCase().includes('video')

  return {
    id: `connect-call-${text(row?.id, String(index))}`,
    source: 'connect',
    kind: 'call',
    title: isVideo ? 'Appel vidéo Connect' : 'Appel vocal Connect',
    body: `${status} · ${text(row?.caller_name || row?.from_name || row?.room_name, 'AngelCare Connect')}`,
    href: '/carelink/messages?connect=call',
    createdAt: itemDate(row?.created_at || row?.createdAt || row?.started_at || row?.updated_at),
    unread: ['ringing', 'missed', 'incoming', 'pending'].includes(status.toLowerCase()),
    priority: ['missed', 'ringing', 'incoming'].includes(status.toLowerCase()) ? 'high' : 'normal',
  }
}

async function readJson(endpoint: string) {
  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })

    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export default function CareLinkUnifiedConnectNotificationBell({
  records = [],
  notifications = [],
  messages = [],
  alerts = [],
  queuePending = 0,
}: CareLinkUnifiedConnectNotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<UnifiedItem[]>([])
  const panelRef = useRef<HTMLDivElement | null>(null)


  function buildLocalOperationItems() {
    const missionFallbackItems = records
      .filter((mission) => {
        const status = String(mission?.status || '').toLowerCase()
        return ['incident', 'risk', 'at_risk', 'delayed', 'late', 'blocked'].some((token) => status.includes(token))
      })
      .slice(0, 8)
      .map((mission, index) => ({
        id: `carelink-mission-signal-${text(mission?.id, String(index))}`,
        source: 'carelink' as const,
        kind: 'alert' as const,
        title: text(mission?.familyName || mission?.code || mission?.title, 'Signal mission'),
        body: text(mission?.status || mission?.dateLabel, 'Signal opérationnel mission.'),
        href: mission?.id ? `/carelink/missions/${mission.id}` : '/carelink/missions',
        createdAt: itemDate(mission?.updatedAt || mission?.updated_at || mission?.createdAt || mission?.created_at),
        unread: true,
        priority: normalizePriority('high'),
      }))

    const queueItem = queuePending > 0 ? [{
      id: 'carelink-offline-queue-pending',
      source: 'carelink' as const,
      kind: 'notification' as const,
      title: 'Synchronisation en attente',
      body: `${queuePending} action(s) mobile en attente de synchronisation.`,
      href: '/carelink/offline',
      createdAt: new Date().toISOString(),
      unread: true,
      priority: normalizePriority('high'),
    }] : []

    return [
      ...messages.map(normalizeCareLinkMessage),
      ...notifications.map(normalizeCareLinkNotification),
      ...alerts.map(normalizeCareLinkAlert),
      ...missionFallbackItems,
      ...queueItem,
    ]
  }

  async function refresh() {
    setLoading(true)

    try {
      const [
        carelinkMessages,
        carelinkNotifications,
        connectMessages,
        connectRooms,
        connectCalls,
      ] = await Promise.all([
        readJson('/api/carelink/messages'),
        readJson('/api/carelink/notifications'),
        readJson('/api/connect/messages'),
        readJson('/api/connect/rooms'),
        readJson('/api/connect/call-log'),
      ])

      const next: UnifiedItem[] = [
        ...buildLocalOperationItems(),
        ...asArray(carelinkMessages).map(normalizeCareLinkMessage),
        ...asArray(carelinkNotifications).map(normalizeCareLinkNotification),
        ...asArray(connectMessages).map(normalizeConnectMessage),
        ...asArray(connectRooms)
          .filter((row) => Number(row?.unread_count || row?.unreadCount || 0) > 0)
          .map((row, index) => normalizeConnectMessage({
            ...row,
            body: `${Number(row?.unread_count || row?.unreadCount || 0)} message(s) non lu(s)`,
            unread: true,
          }, index)),
        ...asArray(connectCalls).map(normalizeConnectCall),
      ]

      const unique = new Map<string, UnifiedItem>()
      for (const item of next) {
        unique.set(item.id, item)
      }

      setItems(
        [...unique.values()]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 30),
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    const interval = window.setInterval(() => void refresh(), 30000)
    return () => window.clearInterval(interval)
  }, [records, notifications, messages, alerts, queuePending])

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      if (!panelRef.current) return
      if (!panelRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const unreadCount = useMemo(() => items.filter((item) => item.unread).length, [items])
  const criticalCount = useMemo(() => items.filter((item) => item.priority === 'critical').length, [items])
  const callCount = useMemo(() => items.filter((item) => item.kind === 'call' && item.unread).length, [items])

  function iconFor(item: UnifiedItem) {
    if (item.kind === 'call') return item.title.toLowerCase().includes('vidéo') ? <Video size={16} /> : <Phone size={16} />
    if (item.kind === 'alert') return <ShieldAlert size={16} />
    return <MessageCircle size={16} />
  }

  function itemTone(item: UnifiedItem) {
    if (item.priority === 'critical') return 'bg-rose-50 text-rose-700 ring-rose-100'
    if (item.priority === 'high') return 'bg-amber-50 text-amber-800 ring-amber-100'
    if (item.source === 'connect') return 'bg-violet-50 text-violet-700 ring-violet-100'
    return 'bg-blue-50 text-blue-700 ring-blue-100'
  }

  return (
    <div ref={panelRef} className="relative z-[80]">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value)
          void refresh()
        }}
        className="relative grid h-16 w-16 place-items-center rounded-full border border-slate-200 bg-white text-slate-950 shadow-[0_18px_45px_rgba(15,23,42,0.12)]"
        aria-label="Ouvrir le centre de notifications"
      >
        <Bell size={25} />

        {unreadCount ? (
          <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-emerald-500 px-1 text-[10px] font-black text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : (
          <span className="absolute right-2 top-2 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
        )}
      </button>

      {open ? (
        <div className="absolute right-0 top-20 w-[min(92vw,390px)] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.22)]">
          <div data-carelink-unified-bell-hero="true" className="bg-gradient-to-br from-slate-950 via-blue-800 to-cyan-500 p-4 text-white" style={{ color: '#ffffff' }}>
            <style>{`
              [data-carelink-unified-bell-hero="true"],
              [data-carelink-unified-bell-hero="true"] *,
              [data-carelink-unified-bell-hero="true"] p,
              [data-carelink-unified-bell-hero="true"] h3,
              [data-carelink-unified-bell-hero="true"] span,
              [data-carelink-unified-bell-hero="true"] div {
                color: #ffffff !important;
                -webkit-text-fill-color: #ffffff !important;
                opacity: 1 !important;
              }

              [data-carelink-unified-bell-hero="true"] svg {
                color: #ffffff !important;
                stroke: #ffffff !important;
              }
            `}</style>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-100">Centre notification</p>
                <h3 className="mt-1 text-xl font-black text-white">CareLink + Connect</h3>
                <p className="mt-1 text-xs font-semibold text-blue-50">
                  Messages, appels, alertes et synchronisation OPS.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                <p className="text-lg font-black text-white">{unreadCount}</p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-blue-100">Non lus</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                <p className="text-lg font-black text-white">{callCount}</p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-blue-100">Appels</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                <p className="text-lg font-black text-white">{criticalCount}</p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-blue-100">Critiques</p>
              </div>
            </div>
          </div>

          <div className="max-h-[56vh] overflow-y-auto p-3">
            {loading && !items.length ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
                Synchronisation des notifications...
              </div>
            ) : null}

            {items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setOpen(false)}
                className="mb-2 flex gap-3 rounded-[1.35rem] border border-slate-100 bg-white p-3 shadow-sm transition hover:bg-slate-50"
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ring-1 ${itemTone(item)}`}>
                  {iconFor(item)}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-black text-slate-950">{item.title}</span>
                    <span className="shrink-0 text-[10px] font-bold text-slate-400">{labelDate(item.createdAt)}</span>
                  </span>

                  <span className="mt-1 line-clamp-2 block text-xs font-semibold leading-5 text-slate-500">
                    {item.body}
                  </span>

                  <span className="mt-2 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] ring-1 ${itemTone(item)}`}>
                      {item.source === 'connect' ? 'Connect' : 'CareLink'}
                    </span>
                    {item.unread ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-700 ring-1 ring-emerald-100">
                        Nouveau
                      </span>
                    ) : null}
                  </span>
                </span>
              </Link>
            ))}

            {!items.length && !loading ? (
              <div className="rounded-[1.6rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                <Bell className="mx-auto text-slate-400" size={28} />
                <h4 className="mt-3 text-sm font-black text-slate-950">Aucune notification</h4>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                  Les nouveaux messages, appels Connect et alertes CareLink apparaîtront ici.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
