'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import VoicePhoneWidget from './VoicePhoneWidget'

type RuntimeFlagPayload = {
  ok?: boolean
  enabled?: boolean
  data?: {
    enabled?: boolean
    status?: string
  }
}

export default function VoicePhoneWidgetGate() {
  const pathname = usePathname()
  const isAngelcareRoute = pathname.startsWith('/angelcare-360') || pathname.startsWith('/angelcare-360-operator')
  const [enabled, setEnabled] = useState(true)

  async function refreshFlag() {
    if (isAngelcareRoute) return

    try {
      const response = await fetch('/api/system-control/module-flags/voice_terminal', {
        cache: 'no-store',
      })

      const payload = (await response.json().catch(() => ({}))) as RuntimeFlagPayload

      const nextEnabled =
        typeof payload.enabled === 'boolean'
          ? payload.enabled
          : typeof payload.data?.enabled === 'boolean'
            ? payload.data.enabled
            : true

      setEnabled(nextEnabled)
    } catch {
      setEnabled(true)
    }
  }

  useEffect(() => {
    if (isAngelcareRoute) {
      setEnabled(false)
      return
    }

    void refreshFlag()

    const timer = window.setInterval(() => {
      void refreshFlag()
    }, 15000)

    return () => window.clearInterval(timer)
  }, [isAngelcareRoute])

  if (isAngelcareRoute) return null
  if (!enabled) return null

  return <VoicePhoneWidget />
}
