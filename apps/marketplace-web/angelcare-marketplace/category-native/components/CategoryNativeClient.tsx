'use client'

import { useCallback, useState } from 'react'

interface Envelope<T> { data?: T; error?: { message?: string } }

export async function categoryNativeRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)
  const payload = await response.json() as Envelope<T>
  if (!response.ok || payload.data === undefined) throw new Error(payload.error?.message || 'Action Category-Native impossible.')
  return payload.data
}

export function useCategoryNativeMutation(onChanged?: () => void) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const run = useCallback(async <T,>(action: () => Promise<T>, success: string): Promise<T | null> => {
    setBusy(true); setMessage(null); setError(null)
    try {
      const result = await action(); setMessage(success); onChanged?.(); return result
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Action impossible.'); return null
    } finally { setBusy(false) }
  }, [onChanged])
  return { busy, message, error, run, clear: () => { setMessage(null); setError(null) } }
}
