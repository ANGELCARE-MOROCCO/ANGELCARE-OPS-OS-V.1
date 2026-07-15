"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

type BroadcastNotification = {
  id?: string
  memoId?: string
  targetId?: string | null
  title?: string
  body?: string
  message?: string
  description?: string
  situation?: string
  type?: string
  source_type?: string
  priority?: string
  createdAt?: string
  created_at?: string
  linkUrl?: string | null
  href?: string | null
  url?: string | null
  actionUrl?: string | null
  action_url?: string | null
  route?: string | null
  cta_href?: string | null
}

function itemId(item: BroadcastNotification, index: number) {
  return String(item.id || item.memoId || item.targetId || `broadcast-${index}`)
}

function itemBody(item: BroadcastNotification) {
  return String(item.body || item.message || item.description || "")
    .replace(/COURSE_LINK:\s*\/[^\s]+/gi, "")
    .replace(/OPEN_URL:\s*\/[^\s]+/gi, "")
    .replace(/ACTION_URL:\s*\/[^\s]+/gi, "")
    .trim()
}

function itemHref(item: BroadcastNotification) {
  return (
    item.linkUrl ||
    item.href ||
    item.url ||
    item.actionUrl ||
    item.action_url ||
    item.route ||
    item.cta_href ||
    "/dashboard#broadcast-board"
  )
}

export default function OverheadBroadcastBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<BroadcastNotification[]>([])
  const [loading, setLoading] = useState(false)

  async function loadNotifications() {
    try {
      setLoading(true)
      const response = await fetch("/api/dashboard/broadcast-notifications", { cache: "no-store" })
      const payload = await response.json().catch(() => ({}))

      const nextItems = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.notifications)
          ? payload.notifications
          : []

      setItems(nextItems.slice(0, 12))
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadNotifications()

    const timer = window.setInterval(() => void loadNotifications(), 15000)
    const onFocus = () => void loadNotifications()

    window.addEventListener("focus", onFocus)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener("focus", onFocus)
    }
  }, [])

  const unreadCount = useMemo(() => items.length, [items])

  async function markRead(item: BroadcastNotification) {
    try {
      await fetch("/api/dashboard/broadcast-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          memoId: item.memoId,
          targetId: item.targetId,
        }),
      })
    } catch {}

    setItems((current) => current.filter((entry, index) => itemId(entry, index) !== itemId(item, 0)))
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative grid h-12 w-12 place-items-center rounded-2xl border border-rose-300/50 bg-rose-950/70 text-xl text-yellow-300 shadow-lg shadow-rose-950/20 transition hover:bg-rose-900"
        aria-label="Broadcast notifications"
      >
        🔔
        {unreadCount ? (
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-14 z-[80] w-[360px] overflow-hidden rounded-[26px] border border-slate-700 bg-slate-950 text-white shadow-[0_24px_80px_rgba(15,23,42,0.45)]">
          <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
            <div>
              <p className="text-sm font-black">Broadcast notifications</p>
              <p className="text-xs font-bold text-slate-300">
                HR memos, personal commands and operational pushes
              </p>
            </div>
            <button
              type="button"
              onClick={() => setItems([])}
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white hover:bg-white/15"
            >
              Clear
            </button>
          </div>

          <div className="max-h-[520px] space-y-2 overflow-y-auto p-3">
            {loading && !items.length ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-bold text-slate-300">
                Loading notifications...
              </div>
            ) : null}

            {!loading && !items.length ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-white/5 p-4 text-sm font-bold text-slate-300">
                No broadcast notification is currently pending.
              </div>
            ) : null}

            {items.map((item, index) => (
              <Link
                key={itemId(item, index)}
                href={itemHref(item)}
                onClick={() => void markRead(item)}
                className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-cyan-400/15 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-cyan-200">
                    {item.type || item.source_type || item.situation || "Memo"}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {String(item.createdAt || item.created_at || "").slice(11, 16)}
                  </span>
                </div>

                <p className="mt-2 text-sm font-black text-white">{item.title || "Personal command alert"}</p>
                <p className="mt-1 line-clamp-3 text-xs font-bold leading-5 text-slate-300">{itemBody(item)}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
