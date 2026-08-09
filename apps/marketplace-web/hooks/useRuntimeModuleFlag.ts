'use client'

import { useEffect, useState } from 'react'

export type RuntimeModuleFlagState = {
  loading: boolean
  enabled: boolean
  status: string
  reason: string
  error: string | null
}

export function useRuntimeModuleFlag(moduleKey: string, fallbackEnabled = true): RuntimeModuleFlagState {
  const [state, setState] = useState<RuntimeModuleFlagState>({
    loading: true,
    enabled: fallbackEnabled,
    status: fallbackEnabled ? 'active' : 'disabled',
    reason: '',
    error: null,
  })

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        const response = await fetch(`/api/system-control/module-flags/${moduleKey}`, { cache: 'no-store' })
        const payload = await response.json().catch(() => null)

        if (!alive) return

        if (!response.ok || !payload?.ok) {
          setState({
            loading: false,
            enabled: fallbackEnabled,
            status: fallbackEnabled ? 'active' : 'disabled',
            reason: '',
            error: payload?.error || 'Unable to load module flag.',
          })
          return
        }

        setState({
          loading: false,
          enabled: payload.data?.enabled !== false,
          status: payload.data?.status || 'active',
          reason: payload.data?.reason || '',
          error: null,
        })
      } catch (error) {
        if (!alive) return
        setState({
          loading: false,
          enabled: fallbackEnabled,
          status: fallbackEnabled ? 'active' : 'disabled',
          reason: '',
          error: error instanceof Error ? error.message : 'Unable to load module flag.',
        })
      }
    }

    void load()

    const interval = window.setInterval(() => void load(), 30000)

    return () => {
      alive = false
      window.clearInterval(interval)
    }
  }, [fallbackEnabled, moduleKey])

  return state
}
