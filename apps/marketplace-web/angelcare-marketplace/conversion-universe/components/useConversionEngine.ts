'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CatalogLocale, DiscoveryItem } from '../../catalog-discovery/types'
import type {
  ConversionAvailabilityDecision,
  ConversionJourney,
  ConversionOutcome,
  ConversionPriceSnapshot,
  ConversionSession,
  ConversionStatus,
} from '../types'

type ApiEnvelope<T> = { data: T; requestId: string }
type ApiError = { error?: { message?: string }; requestId?: string }

function visitorReference() {
  const name = 'ac_marketplace_visitor'
  const current = document.cookie.split('; ').find(entry => entry.startsWith(`${name}=`))?.split('=')[1]
  if (current) return decodeURIComponent(current)
  const value = crypto.randomUUID()
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`
  return value
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
  })
  const payload = await response.json() as ApiEnvelope<T> | ApiError
  if (!response.ok || !('data' in payload)) {
    throw new Error('error' in payload ? payload.error?.message || 'La demande a échoué.' : 'La demande a échoué.')
  }
  return payload.data
}

export function useConversionEngine(input: {
  item: DiscoveryItem
  locale: CatalogLocale
  journey: ConversionJourney
  territoryCode?: string | null
}) {
  const [session, setSession] = useState<ConversionSession | null>(null)
  const [price, setPrice] = useState<ConversionPriceSnapshot | null>(null)
  const [availability, setAvailability] = useState<ConversionAvailabilityDecision | null>(null)
  const [outcome, setOutcome] = useState<ConversionOutcome | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const visitorRef = useRef<string>('')
  const createKey = useRef<string>(crypto.randomUUID())

  useEffect(() => {
    visitorRef.current = visitorReference()
    let cancelled = false
    async function create() {
      try {
        const data = await requestJson<ConversionSession>('/api/angelcare-marketplace/conversion/sessions', {
          method: 'POST',
          body: JSON.stringify({
            itemSlug: input.item.slug,
            locale: input.locale,
            journey: input.journey,
            visitorReference: visitorRef.current,
            sourceRoute: window.location.pathname,
            territoryCode: input.territoryCode || null,
            idempotencyKey: `session:${createKey.current}`,
          }),
        })
        if (!cancelled) {
          setSession(data)
          setPrice(data.priceSnapshot || null)
          setOutcome(data.outcome || null)
        }
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Impossible d’ouvrir le parcours.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void create()
    return () => { cancelled = true }
  }, [input.item.slug, input.journey, input.locale, input.territoryCode])

  const withSession = useCallback(async <T,>(operation: (session: ConversionSession) => Promise<T>) => {
    if (!session) throw new Error('La session n’est pas encore prête.')
    setBusy(true)
    setError(null)
    try {
      return await operation(session)
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'L’opération a échoué.'
      setError(message)
      throw reason
    } finally {
      setBusy(false)
    }
  }, [session])

  const update = useCallback((payload: {
    identity?: Record<string, unknown>
    configuration?: Record<string, unknown>
    status?: ConversionStatus
    territoryCode?: string | null
  }) => withSession(async current => {
    const data = await requestJson<ConversionSession>(`/api/angelcare-marketplace/conversion/sessions/${current.session_key}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...payload, visitorReference: visitorRef.current }),
    })
    setSession(data)
    return data
  }), [withSession])

  const revalidatePrice = useCallback((quantity = 1) => withSession(async current => {
    const data = await requestJson<ConversionPriceSnapshot>(`/api/angelcare-marketplace/conversion/sessions/${current.session_key}/price`, {
      method: 'POST',
      body: JSON.stringify({ visitorReference: visitorRef.current, quantity }),
    })
    setPrice(data)
    return data
  }), [withSession])

  const revalidateAvailability = useCallback((configuration: Record<string, unknown>, quantity = 1) => withSession(async current => {
    const data = await requestJson<ConversionAvailabilityDecision>(`/api/angelcare-marketplace/conversion/sessions/${current.session_key}/availability`, {
      method: 'POST',
      body: JSON.stringify({ visitorReference: visitorRef.current, configuration, quantity }),
    })
    setAvailability(data)
    return data
  }), [withSession])

  const consent = useCallback((consentKey: string, accepted: boolean, evidence?: Record<string, unknown>) => withSession(async current => {
    await requestJson(`/api/angelcare-marketplace/conversion/sessions/${current.session_key}/consent`, {
      method: 'POST',
      body: JSON.stringify({
        visitorReference: visitorRef.current,
        consentKey,
        consentVersion: '2026.1',
        locale: input.locale,
        accepted,
        evidence: evidence || {},
      }),
    })
  }), [input.locale, withSession])

  const confirm = useCallback(() => withSession(async current => {
    const data = await requestJson<ConversionOutcome>(`/api/angelcare-marketplace/conversion/sessions/${current.session_key}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ visitorReference: visitorRef.current, idempotencyKey: `confirm:${current.id}` }),
    })
    setOutcome(data)
    return data
  }), [withSession])

  return useMemo(() => ({
    session,
    price,
    availability,
    outcome,
    loading,
    busy,
    error,
    update,
    revalidatePrice,
    revalidateAvailability,
    consent,
    confirm,
  }), [session, price, availability, outcome, loading, busy, error, update, revalidatePrice, revalidateAvailability, consent, confirm])
}
