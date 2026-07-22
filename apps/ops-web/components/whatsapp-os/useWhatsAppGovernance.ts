"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { getDesktopRuntime, getWhatsAppGovernanceApi } from "@/lib/desktop-runtime"
import type { WhatsAppDesktopWorkspace } from "@/lib/whatsapp-desktop/types"

type GovernanceStatus = AngelCareWhatsAppGovernanceStatus

type ApiResult<T> = { ok: boolean; data?: T; error?: string }

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  })
  const payload = (await response.json().catch(() => null)) as ApiResult<T> | null
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || `HTTP_${response.status}`)
  return payload.data as T
}

export function useWhatsAppGovernance() {
  const [desktop, setDesktop] = useState<ReturnType<typeof getDesktopRuntime>>(() => getDesktopRuntime())
  const [status, setStatus] = useState<GovernanceStatus | null>(null)
  const [workspaces, setWorkspaces] = useState<WhatsAppDesktopWorkspace[]>([])
  const [catalog, setCatalog] = useState<WhatsAppDesktopWorkspace[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refreshWorkspaces = useCallback(async () => {
    const [mine, available] = await Promise.all([
      api<WhatsAppDesktopWorkspace[]>("/api/whatsapp-desktop/workspaces?mine=1"),
      api<WhatsAppDesktopWorkspace[]>("/api/whatsapp-desktop/workspaces?catalog=1"),
    ])
    setWorkspaces(mine)
    setCatalog(available)
    return mine
  }, [])

  const refresh = useCallback(async () => {
    setBusy("refresh")
    setError(null)
    try {
      const runtime = getDesktopRuntime()
      setDesktop(runtime)
      const governance = getWhatsAppGovernanceApi()
      if (governance) {
        const current = await governance.getStatus()
        setStatus(current)

        if (!current.deviceId) {
          await governance.register().then(setStatus).catch(() => null)
        }
      }
      await refreshWorkspaces()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(null)
      setLoading(false)
    }
  }, [refreshWorkspaces])

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    const run = async () => {
      await refresh()
      const governance = getWhatsAppGovernanceApi()
      if (governance) unsubscribe = governance.onStatus((next) => setStatus(next))
    }
    void run()
    return () => unsubscribe?.()
  }, [refresh])

  const selectWorkspace = useCallback(async (workspace: WhatsAppDesktopWorkspace) => {
    const governance = getWhatsAppGovernanceApi()
    if (!governance) throw new Error("ANGELCARE_DESKTOP_REQUIRED")
    setBusy(`workspace:${workspace.id}`)
    setError(null)
    try {
      const next = await governance.selectWorkspace(workspace.id, workspace.name)
      setStatus(next)
      return next
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause)
      setError(message)
      throw cause
    } finally {
      setBusy(null)
    }
  }, [])

  const heartbeat = useCallback(async () => {
    const governance = getWhatsAppGovernanceApi()
    if (!governance) return null
    setBusy("heartbeat")
    try {
      const next = await governance.heartbeat()
      setStatus(next)
      return next
    } finally {
      setBusy(null)
    }
  }, [])

  const requestAccess = useCallback(async (workspaceId: string, businessReason: string, requestedUntil?: string) => {
    setBusy(`request:${workspaceId}`)
    setError(null)
    try {
      const result = await api("/api/whatsapp-desktop/access-requests", {
        method: "POST",
        body: JSON.stringify({
          workspace_id: workspaceId,
          installation_id: status?.installationId || null,
          business_reason: businessReason,
          requested_until: requestedUntil || null,
        }),
      })
      return result
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      throw cause
    } finally {
      setBusy(null)
    }
  }, [status?.installationId])

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === status?.selectedWorkspaceId) || null,
    [status?.selectedWorkspaceId, workspaces],
  )

  return {
    desktop,
    status,
    workspaces,
    catalog,
    selectedWorkspace,
    loading,
    busy,
    error,
    refresh,
    refreshWorkspaces,
    selectWorkspace,
    heartbeat,
    requestAccess,
  }
}
