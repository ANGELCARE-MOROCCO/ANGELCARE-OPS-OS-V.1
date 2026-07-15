"use client"

import { useCallback, useRef, useState } from "react"

type ActionResult = { ok: boolean; data?: any; patch?: any; source?: string; error?: string; debug?: any }
type EmailRow = {
  id: string
  status?: string
  read_at?: string | null
  readAt?: string | null
  starred?: boolean
  starred_at?: string | null
  starredAt?: string | null
  tag?: string | null
  label?: string | null
  folder?: string | null
  updated_at?: string
  updatedAt?: string
  __emailOsSource?: "inbox" | "outbox" | "drafts"
}

async function api(path: string, options?: RequestInit): Promise<ActionResult> {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) }
  })
  const json = await res.json().catch(() => null)
  return {
    ok: res.ok && json?.ok !== false,
    data: json?.data ?? json,
    patch: json?.patch,
    source: json?.source,
    debug: json?.debug,
    error: json?.error || (!res.ok ? `HTTP ${res.status}` : undefined)
  }
}

function restoreStatus(row: EmailRow) {
  if (row.__emailOsSource === "outbox") return "sent"
  if (row.__emailOsSource === "drafts") return "draft"
  return "received"
}

export function optimisticPatch<T extends EmailRow>(row: T, action: string, payload: any = {}, serverData?: any, serverPatch?: any): T {
  const now = new Date().toISOString()
  const patch: Record<string, any> = { updated_at: now, updatedAt: now }

  if (action === "delete") { patch.status = "trash"; patch.deleted_at = now; patch.deletedAt = now; patch.archived_at = null; patch.archivedAt = null }
  if (action === "archive") { patch.status = "archived"; patch.archived_at = now; patch.archivedAt = now; patch.deleted_at = null; patch.deletedAt = null }
  if (action === "restore") { patch.status = restoreStatus(row); patch.deleted_at = null; patch.deletedAt = null; patch.archived_at = null; patch.archivedAt = null }
  if (action === "spam") patch.status = "spam"
  if (action === "mark_read") { patch.read_at = now; patch.readAt = now }
  if (action === "mark_unread") { patch.read_at = null; patch.readAt = null }
  if (action === "star") { patch.starred = true; patch.starred_at = now; patch.starredAt = now }
  if (action === "unstar") { patch.starred = false; patch.starred_at = null; patch.starredAt = null }
  if (action === "tag" || action === "label") {
    patch.tag = payload?.tag || payload?.label || "follow-up"
    patch.label = payload?.label || payload?.tag || "follow-up"
  }
  if (action === "move_folder") {
    patch.folder = payload?.folder || "follow-up-folder"
    patch.tag = payload?.folder || payload?.tag || "foldered"
    patch.label = payload?.label || payload?.folder || payload?.tag || "foldered"
  }

  return { ...row, ...(serverData || {}), ...patch, ...(serverPatch || {}), __emailOsSource: row.__emailOsSource } as T
}

export function useEmailOSActionEngine<T extends EmailRow>(rows: T[], setRows: (rows: T[] | ((current: T[]) => T[])) => void) {
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const previousRef = useRef<T[] | null>(null)

  const mutateMessage = useCallback(async (messageId: string, action: string, payload: any = {}) => {
    if (action === "back" || action === "schedule") return { ok: true }

    setBusyAction(`${action}:${messageId}`)
    previousRef.current = rows

    let source = payload.source || payload.targetType || "inbox"
    setRows((current) => current.map((row) => {
      if (row.id !== messageId) return row
      source = row.__emailOsSource || source
      return optimisticPatch(row, action, payload)
    }))

    const result = await api("/api/email-os/message-action", {
      method: "POST",
      body: JSON.stringify({ messageId, targetId: messageId, action, source, targetType: source, payload: { ...payload, source } })
    })

    if (!result.ok) {
      if (previousRef.current) setRows(previousRef.current)
    } else {
      setRows((current) => current.map((row) => row.id === messageId ? optimisticPatch(row, action, payload, result.data, result.patch) : row))
    }

    setBusyAction(null)
    return result
  }, [rows, setRows])

  return { busyAction, mutateMessage }
}
