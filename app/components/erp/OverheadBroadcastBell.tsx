'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

type NotificationItem = {
  id: string
  title: string
  body: string
  situation: string
  priority: string
  createdAt: string
  memoId: string
  targetId: string | null
}

function priorityTone(priority: string) {
  const value = priority.toLowerCase()
  if (value.includes('urgent') || value.includes('critical') || value.includes('high')) {
    return {
      bg: 'rgba(239,68,68,.14)',
      border: 'rgba(248,113,113,.34)',
      text: '#fecaca',
      dot: '#fb7185',
      label: 'Urgent',
    }
  }

  if (value.includes('warning') || value.includes('medium') || value.includes('delayed')) {
    return {
      bg: 'rgba(245,158,11,.14)',
      border: 'rgba(251,191,36,.34)',
      text: '#fde68a',
      dot: '#f59e0b',
      label: 'Important',
    }
  }

  return {
    bg: 'rgba(34,197,94,.13)',
    border: 'rgba(74,222,128,.30)',
    text: '#bbf7d0',
    dot: '#22c55e',
    label: 'Active',
  }
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Now'

  return new Intl.DateTimeFormat('fr-MA', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function OverheadBroadcastBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  async function loadNotifications() {
    setLoading(true)
    try {
      const response = await fetch('/api/dashboard/broadcast-notifications', { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      setItems(Array.isArray(payload?.data) ? payload.data : [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadNotifications()
    const timer = window.setInterval(() => void loadNotifications(), 60000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(event.target as Node)) setOpen(false)
    }

    window.addEventListener('mousedown', onPointerDown)
    return () => window.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const unreadCount = items.length
  const previewText = useMemo(() => {
    if (loading) return 'Syncing memos'
    if (unreadCount === 0) return 'No new memos'
    if (unreadCount === 1) return '1 active memo'
    return `${unreadCount} active memos`
  }, [loading, unreadCount])

  async function markRead(item: NotificationItem) {
    setItems((current) => current.filter((row) => row.id !== item.id))

    fetch('/api/dashboard/broadcast-notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memoId: item.memoId, targetId: item.targetId }),
    }).catch(() => undefined)
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Broadcast notifications"
        title={previewText}
        style={{
          position: 'relative',
          width: 44,
          height: 44,
          borderRadius: 16,
          border: open ? '1px solid rgba(251,191,36,.62)' : '1px solid rgba(148,163,184,.24)',
          background: open
            ? 'linear-gradient(135deg, rgba(251,191,36,.28), rgba(15,23,42,.92))'
            : 'rgba(15,23,42,.72)',
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: open ? '0 14px 34px rgba(245,158,11,.22)' : 'inset 0 1px 0 rgba(255,255,255,.08)',
          fontSize: 17,
        }}
      >
        🔔
        {unreadCount > 0 ? (
          <span
            style={{
              position: 'absolute',
              top: -7,
              right: -7,
              minWidth: 20,
              height: 20,
              padding: '0 6px',
              borderRadius: 999,
              background: '#ef4444',
              color: '#fff',
              fontSize: 10,
              fontWeight: 950,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 18px rgba(239,68,68,.35)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          style={{
            position: 'absolute',
            top: 54,
            right: 0,
            width: 390,
            maxWidth: 'calc(100vw - 24px)',
            borderRadius: 24,
            background: 'rgba(255,255,255,.98)',
            color: '#0f172a',
            border: '1px solid rgba(226,232,240,.95)',
            boxShadow: '0 30px 80px rgba(15,23,42,.28)',
            padding: 14,
            zIndex: 5000,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 950, letterSpacing: 2.2, textTransform: 'uppercase', color: '#64748b' }}>
                Broadcast notifications
              </div>
              <div style={{ marginTop: 3, fontSize: 18, fontWeight: 950, color: '#020617' }}>{previewText}</div>
            </div>

            <button
              type="button"
              onClick={() => void loadNotifications()}
              style={{
                border: '1px solid rgba(226,232,240,.95)',
                background: '#f8fafc',
                color: '#0f172a',
                borderRadius: 14,
                height: 36,
                padding: '0 12px',
                fontSize: 12,
                fontWeight: 850,
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
          </div>

          <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
            {items.length === 0 ? (
              <div
                style={{
                  borderRadius: 18,
                  border: '1px dashed rgba(148,163,184,.45)',
                  background: '#f8fafc',
                  padding: 16,
                  color: '#64748b',
                  fontSize: 13,
                  fontWeight: 750,
                }}
              >
                No active new broadcast memo for your account.
              </div>
            ) : (
              items.map((item) => {
                const tone = priorityTone(item.priority)
                const brief = item.body.length > 96 ? `${item.body.slice(0, 96)}...` : item.body

                return (
                  <Link
                    key={item.id}
                    href="/dashboard#broadcast-board"
                    onClick={() => void markRead(item)}
                    style={{
                      display: 'grid',
                      gap: 8,
                      padding: 13,
                      borderRadius: 18,
                      border: `1px solid ${tone.border}`,
                      background: `linear-gradient(135deg, ${tone.bg}, rgba(255,255,255,.98))`,
                      textDecoration: 'none',
                      color: '#0f172a',
                      boxShadow: '0 14px 32px rgba(15,23,42,.08)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 7,
                          borderRadius: 999,
                          background: tone.bg,
                          border: `1px solid ${tone.border}`,
                          color: tone.text,
                          padding: '5px 9px',
                          fontSize: 10,
                          fontWeight: 950,
                          letterSpacing: 1.4,
                          textTransform: 'uppercase',
                        }}
                      >
                        <span style={{ width: 7, height: 7, borderRadius: 999, background: tone.dot }} />
                        {tone.label}
                      </span>

                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 850 }}>{formatDate(item.createdAt)}</span>
                    </div>

                    <div style={{ fontSize: 14, fontWeight: 950, color: '#020617', lineHeight: 1.25 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.45 }}>{brief || item.situation}</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 950, color: '#2563eb', letterSpacing: 1.4, textTransform: 'uppercase' }}>
                        Open in My Space
                      </span>
                      <span style={{ fontSize: 16 }}>→</span>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
