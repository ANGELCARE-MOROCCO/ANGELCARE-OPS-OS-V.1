"use client"

import { useCallback, useEffect, useState } from "react"
import { getDesktopRuntime, getWhatsAppDesktopApi } from "@/lib/desktop-runtime"

function isWhatsAppStatus(value: unknown): value is AngelCareWhatsAppStatus {
  if (!value || typeof value !== "object") return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.available === "boolean" &&
    typeof candidate.created === "boolean" &&
    typeof candidate.visible === "boolean" &&
    typeof candidate.requestedVisible === "boolean" &&
    typeof candidate.phase === "string" &&
    typeof candidate.message === "string" &&
    (candidate.detail === null || typeof candidate.detail === "string") &&
    (candidate.currentUrl === null || typeof candidate.currentUrl === "string") &&
    (candidate.title === null || typeof candidate.title === "string") &&
    (candidate.online === null || typeof candidate.online === "boolean") &&
    typeof candidate.rendererStatus === "string" &&
    typeof candidate.canGoBack === "boolean" &&
    typeof candidate.canGoForward === "boolean" &&
    typeof candidate.partition === "string" &&
    Array.isArray(candidate.downloads) &&
    Array.isArray(candidate.permissions) &&
    typeof candidate.timestamp === "string"
}

export function useWhatsAppDesktop() {
  const [runtime, setRuntime] = useState<ReturnType<typeof getDesktopRuntime>>(null)
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
