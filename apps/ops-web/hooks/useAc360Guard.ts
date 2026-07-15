'use client'

import { useCallback, useState } from 'react'

type GuardPayload = {
  orgId?: string
  actionKey: string
  quantity?: number
  idempotencyKey?: string
  metadata?: Record<string, unknown>
  currentCapacity?: number | null
}

type GuardState = {
  loading: boolean
  result: any
  error: string | null
}

async function postJson(url: string, payload: GuardPayload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.error || data?.reason || `AC360 request failed with ${response.status}`)
  return data
}

export function useAc360Guard() {
  const [state, setState] = useState<GuardState>({ loading: false, result: null, error: null })

  const check = useCallback(async (payload: GuardPayload) => {
    setState({ loading: true, result: null, error: null })
    try {
      const result = await postJson('/api/ac360/guard/check', payload)
      setState({ loading: false, result, error: null })
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AC360 guard check failed.'
      setState({ loading: false, result: null, error: message })
      return { ok: false, allowed: false, error: message }
    }
  }, [])

  const execute = useCallback(async (payload: GuardPayload) => {
    setState({ loading: true, result: null, error: null })
    try {
      const result = await postJson('/api/ac360/guard/execute', payload)
      setState({ loading: false, result, error: null })
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AC360 guarded execution failed.'
      setState({ loading: false, result: null, error: message })
      return { ok: false, allowed: false, error: message }
    }
  }, [])

  return { ...state, check, execute }
}
