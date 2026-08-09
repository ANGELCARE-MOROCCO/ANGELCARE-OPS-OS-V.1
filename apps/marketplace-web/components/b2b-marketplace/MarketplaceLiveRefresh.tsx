'use client'

import { useEffect } from 'react'

export default function MarketplaceLiveRefresh() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const shouldReload = () => window.location.pathname.startsWith('/b2b-marketplace')
    const reload = () => {
      if (shouldReload()) window.location.reload()
    }

    let channel: BroadcastChannel | null = null
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('b2b-marketplace-admin-sync')
      channel.addEventListener('message', reload)
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === 'b2b-marketplace-admin-sync') reload()
    }
    window.addEventListener('storage', onStorage)

    return () => {
      window.removeEventListener('storage', onStorage)
      channel?.close()
    }
  }, [])

  return null
}
