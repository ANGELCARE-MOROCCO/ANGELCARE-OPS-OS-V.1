'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import Angelcare360PaymentGateOverlay from './Angelcare360PaymentGateOverlay'
import type { Angelcare360PaymentGateRecord } from '@/types/angelcare360/payment-gates'
import { getAngelcare360PaymentProviderStatus } from '@/lib/angelcare360/payments/provider'

type Props = {
  pathname: string
  children: ReactNode
}

export default function Angelcare360PaymentGateProvider({ pathname, children }: Props) {
  const [gate, setGate] = useState<Angelcare360PaymentGateRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const provider = useMemo(() => getAngelcare360PaymentProviderStatus(), [])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    async function loadGate() {
      setLoading(true)
      try {
        const response = await fetch('/api/angelcare360/payment-gate/active', {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        })
        const payload = await response.json().catch(() => null)
        if (!cancelled) {
          setGate(payload?.gate || null)
        }
      } catch {
        if (!cancelled) setGate(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadGate()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [pathname])

  return (
    <>
      {children}
      {gate ? (
        <Angelcare360PaymentGateOverlay
          gate={gate}
          providerConfigured={provider.configured}
          providerReason={provider.reason}
        />
      ) : null}
      {loading ? null : null}
    </>
  )
}

