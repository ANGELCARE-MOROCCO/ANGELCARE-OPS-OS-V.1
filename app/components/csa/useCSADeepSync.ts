'use client'

import { useEffect, useState } from 'react'

export function useCSADeepSync() {
  const [data, setData] = useState<any>(null)
  const [status, setStatus] = useState<'loading' | 'live' | 'safe'>('loading')

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const res = await fetch('/api/csa/deep-sync', { cache: 'no-store' })
        const json = await res.json()
        if (!active) return

        if (json?.ok) {
          setData(json)
          setStatus(json.mode === 'deep-live' ? 'live' : 'safe')
        } else {
          setStatus('safe')
        }
      } catch {
        if (active) setStatus('safe')
      }
    }

    load()
    const timer = setInterval(load, 30000)

    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  return { data, status }
}
