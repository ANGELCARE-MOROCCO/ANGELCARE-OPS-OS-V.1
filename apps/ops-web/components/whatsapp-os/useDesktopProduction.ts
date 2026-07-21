"use client"

import { useCallback, useEffect, useState } from "react"
import { getDesktopDiagnosticsApi, getDesktopReleaseApi, getDesktopRuntime } from "@/lib/desktop-runtime"

export function useDesktopProduction() {
  const [release, setRelease] = useState<AngelCareDesktopReleaseStatus | null>(null)
  const [diagnostics, setDiagnostics] = useState<AngelCareDesktopDiagnosticsStatus | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const runtime = getDesktopRuntime()

  useEffect(() => {
    const releaseApi = getDesktopReleaseApi()
    const diagnosticsApi = getDesktopDiagnosticsApi()
    if (!releaseApi || !diagnosticsApi) return
    let mounted = true
    void Promise.all([releaseApi.getStatus(), diagnosticsApi.getStatus()]).then(([releaseState, diagnosticState]) => {
      if (!mounted) return
      setRelease(releaseState)
      setDiagnostics(diagnosticState)
    }).catch((reason: unknown) => mounted && setError(reason instanceof Error ? reason.message : "Contrôle production indisponible."))
    const unsubscribe = releaseApi.onStatus((status) => mounted && setRelease(status))
    return () => { mounted = false; unsubscribe() }
  }, [])

  const execute = useCallback(async <T,>(label: string, operation: () => Promise<T>) => {
    setBusy(label); setError(null)
    try { return await operation() }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Action production impossible."); throw reason }
    finally { setBusy(null) }
  }, [])

  return { runtime, release, diagnostics, busy, error, execute, releaseApi: getDesktopReleaseApi(), diagnosticsApi: getDesktopDiagnosticsApi() }
}
