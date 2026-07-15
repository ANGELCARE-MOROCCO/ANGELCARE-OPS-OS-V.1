'use client'

import { ReactNode, useEffect, useMemo, useRef } from 'react'
import { usePathname } from 'next/navigation'
import type { OpsosTelemetryEvent } from '@/lib/opsos-control-plane/telemetry-types'

declare global {
  interface Window {
    __opsosTelemetrySessionId?: string
    __opsosFetchPatched?: boolean
    __opsosTelemetryPush?: (event: Partial<OpsosTelemetryEvent>) => void
  }
}

type Props = {
  children: ReactNode
}

const TELEMETRY_ENDPOINT = '/api/opsos-control-plane/telemetry'
const MAX_BATCH_SIZE = 25
const FLUSH_INTERVAL_MS = 6000

function getSessionId() {
  if (typeof window === 'undefined') return 'server'
  if (window.__opsosTelemetrySessionId) return window.__opsosTelemetrySessionId

  const key = 'opsos.telemetry.session_id'
  const existing = window.sessionStorage?.getItem(key)
  if (existing) {
    window.__opsosTelemetrySessionId = existing
    return existing
  }

  const next = `opsos-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  try {
    window.sessionStorage?.setItem(key, next)
  } catch {}
  window.__opsosTelemetrySessionId = next
  return next
}

function getMemoryMb() {
  if (typeof performance === 'undefined' || !('memory' in performance)) return null
  const memory = (performance as unknown as { memory?: { usedJSHeapSize?: number } }).memory
  if (!memory?.usedJSHeapSize) return null
  return Math.round(memory.usedJSHeapSize / 1024 / 1024)
}

function toRoutePath(url: string) {
  try {
    const parsed = new URL(url, window.location.origin)
    return parsed.pathname
  } catch {
    return url.split('?')[0] || '/unknown'
  }
}

function sendTelemetryNow(events: Partial<OpsosTelemetryEvent>[]) {
  if (!events.length || typeof window === 'undefined') return

  const payload = JSON.stringify({ source: 'client', events })

  try {
    if ('sendBeacon' in navigator) {
      const blob = new Blob([payload], { type: 'application/json' })
      const ok = navigator.sendBeacon(TELEMETRY_ENDPOINT, blob)
      if (ok) return
    }
  } catch {}

  fetch(TELEMETRY_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => undefined)
}

function detectModalName(element: Element) {
  const labelledBy = element.getAttribute('aria-labelledby')
  if (labelledBy) {
    const label = document.getElementById(labelledBy)?.textContent?.trim()
    if (label) return label.slice(0, 160)
  }

  const ariaLabel = element.getAttribute('aria-label')
  if (ariaLabel) return ariaLabel.slice(0, 160)

  const dataName = element.getAttribute('data-modal-name') || element.getAttribute('data-opsos-modal')
  if (dataName) return dataName.slice(0, 160)

  const heading = element.querySelector('h1,h2,h3,[data-modal-title]')?.textContent?.trim()
  if (heading) return heading.slice(0, 160)

  return 'Unnamed Runtime Modal'
}

export default function OpsosTelemetryProvider({ children }: Props) {
  const pathname = usePathname()
  const isAngelcareRoute = pathname.startsWith('/angelcare-360') || pathname.startsWith('/angelcare-360-operator')
  const queueRef = useRef<Partial<OpsosTelemetryEvent>[]>([])
  const routeStartRef = useRef<number>(typeof performance !== 'undefined' ? performance.now() : Date.now())
  const openModalsRef = useRef<Map<Element, { name: string; openedAt: number; memoryMb: number | null }>>(new Map())

  const sessionId = useMemo(() => getSessionId(), [])

  useEffect(() => {
    if (isAngelcareRoute) {
      window.__opsosTelemetryPush = undefined
      return () => {
        window.__opsosTelemetryPush = undefined
      }
    }

    const push = (event: Partial<OpsosTelemetryEvent>) => {
      queueRef.current.push({
        ...event,
        route: event.route || pathname || window.location.pathname,
        sessionId,
        userAgent: navigator.userAgent,
        memoryMb: event.memoryMb ?? getMemoryMb(),
        createdAt: new Date().toISOString(),
      })

      if (queueRef.current.length >= MAX_BATCH_SIZE) {
        const batch = queueRef.current.splice(0, MAX_BATCH_SIZE)
        sendTelemetryNow(batch)
      }
    }

    window.__opsosTelemetryPush = push

    const flush = () => {
      if (!queueRef.current.length) return
      const batch = queueRef.current.splice(0, queueRef.current.length)
      sendTelemetryNow(batch)
    }

    const interval = window.setInterval(flush, FLUSH_INTERVAL_MS)
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)

    return () => {
      window.__opsosTelemetryPush = undefined
      window.clearInterval(interval)
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('beforeunload', flush)
      flush()
    }
  }, [pathname, sessionId, isAngelcareRoute])

  useEffect(() => {
    if (isAngelcareRoute) return

    const now = performance.now()
    const duration = Math.round(now - routeStartRef.current)
    routeStartRef.current = now

    window.__opsosTelemetryPush?.({
      eventType: 'route_mount',
      route: pathname,
      durationMs: duration,
      metadata: {
        referrer: document.referrer || null,
        title: document.title || null,
      },
    })

    return () => {
      window.__opsosTelemetryPush?.({
        eventType: 'route_unmount',
        route: pathname,
        durationMs: Math.round(performance.now() - now),
      })
    }
  }, [pathname, isAngelcareRoute])

  useEffect(() => {
    if (isAngelcareRoute) return

    if (typeof PerformanceObserver === 'undefined') return

    let longTaskObserver: PerformanceObserver | null = null
    try {
      longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__opsosTelemetryPush?.({
            eventType: 'long_task',
            route: window.location.pathname,
            durationMs: Math.round(entry.duration),
            metadata: {
              name: entry.name,
              startTime: Math.round(entry.startTime),
            },
          })
        }
      })
      longTaskObserver.observe({ entryTypes: ['longtask'] })
    } catch {}

    return () => longTaskObserver?.disconnect()
  }, [isAngelcareRoute])

  useEffect(() => {
    if (isAngelcareRoute) return

    const errorHandler = (event: ErrorEvent) => {
      window.__opsosTelemetryPush?.({
        eventType: 'client_error',
        route: window.location.pathname,
        severity: 'critical',
        metadata: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack?.slice(0, 1800),
        },
      })
    }

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      window.__opsosTelemetryPush?.({
        eventType: 'unhandled_rejection',
        route: window.location.pathname,
        severity: 'critical',
        metadata: {
          reason: String(event.reason || 'Unknown promise rejection').slice(0, 1800),
        },
      })
    }

    window.addEventListener('error', errorHandler)
    window.addEventListener('unhandledrejection', rejectionHandler)

    return () => {
      window.removeEventListener('error', errorHandler)
      window.removeEventListener('unhandledrejection', rejectionHandler)
    }
  }, [isAngelcareRoute])

  useEffect(() => {
    if (isAngelcareRoute) return

    if (window.__opsosFetchPatched) return
    window.__opsosFetchPatched = true

    const originalFetch = window.fetch.bind(window)
    window.fetch = async (...args) => {
      const startedAt = performance.now()
      const input = args[0]
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      const apiPath = toRoutePath(url)
      const shouldIgnore = apiPath.includes('/api/opsos-control-plane/telemetry')

      try {
        const response = await originalFetch(...args)
        if (!shouldIgnore && apiPath.startsWith('/api/')) {
          window.__opsosTelemetryPush?.({
            eventType: response.ok ? 'api_call' : 'api_error',
            apiPath,
            durationMs: Math.round(performance.now() - startedAt),
            severity: response.ok ? 'info' : 'critical',
            metadata: {
              status: response.status,
              method: typeof args[1]?.method === 'string' ? args[1].method : 'GET',
            },
          })
        }
        return response
      } catch (error) {
        if (!shouldIgnore && apiPath.startsWith('/api/')) {
          window.__opsosTelemetryPush?.({
            eventType: 'api_error',
            apiPath,
            durationMs: Math.round(performance.now() - startedAt),
            severity: 'critical',
            metadata: { error: String(error).slice(0, 1200) },
          })
        }
        throw error
      }
    }
  }, [isAngelcareRoute])

  useEffect(() => {
    if (isAngelcareRoute) return

    const inspectNode = (node: Node) => {
      if (!(node instanceof Element)) return

      const candidates: Element[] = []
      if (node.matches('[role="dialog"],[aria-modal="true"],[data-modal-root],[data-opsos-modal]')) candidates.push(node)
      candidates.push(...Array.from(node.querySelectorAll('[role="dialog"],[aria-modal="true"],[data-modal-root],[data-opsos-modal]')))

      for (const modal of candidates) {
        if (openModalsRef.current.has(modal)) continue
        const name = detectModalName(modal)
        openModalsRef.current.set(modal, { name, openedAt: performance.now(), memoryMb: getMemoryMb() })
        window.__opsosTelemetryPush?.({ eventType: 'modal_open', modal: name, durationMs: 0, memoryMb: getMemoryMb() })
      }
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(inspectNode)
        mutation.removedNodes.forEach((node) => {
          if (!(node instanceof Element)) return
          const tracked = openModalsRef.current.get(node)
          if (!tracked) return
          openModalsRef.current.delete(node)
          window.__opsosTelemetryPush?.({
            eventType: 'modal_close',
            modal: tracked.name,
            durationMs: Math.round(performance.now() - tracked.openedAt),
            memoryMb: getMemoryMb(),
            metadata: { openingMemoryMb: tracked.memoryMb },
          })
        })
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [isAngelcareRoute])

  useEffect(() => {
    if (isAngelcareRoute) return

    const interval = window.setInterval(() => {
      window.__opsosTelemetryPush?.({ eventType: 'memory_sample', route: window.location.pathname, memoryMb: getMemoryMb() })
    }, 30000)

    const visibility = () => {
      if (document.visibilityState === 'hidden') {
        window.__opsosTelemetryPush?.({ eventType: 'route_visibility_hidden', route: window.location.pathname, memoryMb: getMemoryMb() })
      }
    }

    document.addEventListener('visibilitychange', visibility)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [isAngelcareRoute])

  return <>{children}</>
}
