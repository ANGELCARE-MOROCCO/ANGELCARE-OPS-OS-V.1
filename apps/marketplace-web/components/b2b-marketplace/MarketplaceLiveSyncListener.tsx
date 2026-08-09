'use client'

import { useEffect } from 'react'

export default function MarketplaceLiveSyncListener() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const reloadSoon = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => window.location.reload(), 450)
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === 'angelcare:b2b-marketplace:admin-sync') reloadSoon()
    }

    window.addEventListener('storage', onStorage)
    let channel: BroadcastChannel | null = null
    try {
      channel = new BroadcastChannel('angelcare:b2b-marketplace')
      channel.onmessage = reloadSoon
    } catch {}

    return () => {
      window.removeEventListener('storage', onStorage)
      if (timer) clearTimeout(timer)
      try { channel?.close() } catch {}
    }
  }, [])

  return null
}
