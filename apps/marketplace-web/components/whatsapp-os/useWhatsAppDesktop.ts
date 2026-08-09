"use client"

import { useCallback, useEffect, useState } from "react"
import { getDesktopRuntime, getWhatsAppDesktopApi } from "@/lib/desktop-runtime"

function isWhatsAppStatus(value: unknown): value is AngelCareWhatsAppStatus {
  if (!value || typeof value !== "object") return false
  const status = value as Record<string, unknown>
  return typeof status.available === "boolean"
    && typeof status.created === "boolean"
    && typeof status.visible === "boolean"
    && typeof status.requestedVisible === "boolean"
    && typeof status.phase === "string"
    && typeof status.message === "string"
    && (status.detail === null || typeof status.detail === "string")
    && (status.currentUrl === null || typeof status.currentUrl === "string")
    && (status.title === null || typeof status.title === "string")
    && (status.online === null || typeof status.online === "boolean")
    && typeof status.rendererStatus === "string"
    && typeof status.authProfile === "string"
    && typeof status.canGoBack === "boolean"
    && typeof status.canGoForward === "boolean"
    && (status.layoutMode === "split" || status.layoutMode === "focus" || status.layoutMode === "full" || status.layoutMode === "hidden")
    && typeof status.partition === "string"
    && (status.lastLoadStartedAt === null || typeof status.lastLoadStartedAt === "string")
    && (status.lastLoadedAt === null || typeof status.lastLoadedAt === "string")
    && (status.lastErrorAt === null || typeof status.lastErrorAt === "string")
    && (status.lastCrashAt === null || typeof status.lastCrashAt === "string")
    && (status.lastResponsiveAt === null || typeof status.lastResponsiveAt === "string")
    && (status.storagePath === null || typeof status.storagePath === "string")
    && Array.isArray(status.downloads)
    && Array.isArray(status.permissions)
    && typeof status.timestamp === "string"
}

export function useWhatsAppDesktop() {
  const [runtime, setRuntime] = useState<ReturnType<typeof getDesktopRuntime>>(() => getDesktopRuntime())
  const [status, setStatus] = useState<AngelCareWhatsAppStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    const detected = getDesktopRuntime()
    setRuntime(detected)
    const api = getWhatsAppDesktopApi()
    if (!api) return

    let mounted = true
    void api.getStatus().then((next) => {
      if (mounted) setStatus(next)
    }).catch((reason: unknown) => {
      if (mounted) setError(reason instanceof Error ? reason.message : "Le runtime WhatsApp est indisponible.")
    })

    const unsubscribe = api.onStatus((next) => {
      if (mounted) {
        setStatus(next)
        setError(null)
      }
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const execute = useCallback(async <T,>(label: string, operation: (api: AngelCareWhatsAppDesktopApi) => Promise<T>) => {
    const api = getWhatsAppDesktopApi()
    if (!api) throw new Error("Cette action requiert ANGELCARE Desktop.")
    setBusy(label)
    setError(null)
    try {
      const result = await operation(api)
      if (isWhatsAppStatus(result)) setStatus(result)
      if (result && typeof result === "object" && "state" in result && isWhatsAppStatus(result.state)) setStatus(result.state)
      return result
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Action WhatsApp impossible."
      setError(message)
      throw reason
    } finally {
      setBusy(null)
    }
  }, [])

  return {
    runtime,
    status,
    error,
    busy,
    execute,
    api: getWhatsAppDesktopApi(),
    isDesktop: Boolean(runtime?.isDesktop && getWhatsAppDesktopApi()),
  }
}
