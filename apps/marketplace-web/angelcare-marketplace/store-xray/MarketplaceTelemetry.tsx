'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

type EventPayload = {
  id: string
  kind: string
  at: string
  pathname: string
  locale: string
  metadata: Record<string, unknown>
}

const SESSION_KEY = 'ac_marketplace_xray_session'
const VISITOR_KEY = 'ac_marketplace_xray_visitor'
const LANDING_KEY = 'ac_marketplace_xray_landing'
const START_KEY = 'ac_marketplace_xray_started_at'
const FIRST_TOUCH_KEY = 'ac_marketplace_xray_first_touch'
const LAST_TOUCH_KEY = 'ac_marketplace_xray_last_touch'
const STARTED_KEY = 'ac_marketplace_xray_started'
const SAFE_QUERY = new Set(['q', 'query', 'search', 'keyword', 'term', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'msclkid', 'ttclid'])

function randomKey(prefix: string) {
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-${id}`
}

function getSessionKey() {
  let value = sessionStorage.getItem(SESSION_KEY)
  if (!value) {
    value = randomKey('s')
    sessionStorage.setItem(SESSION_KEY, value)
  }
  return value
}

function getVisitorKey() {
  let value = localStorage.getItem(VISITOR_KEY)
  if (!value) {
    value = randomKey('v')
    localStorage.setItem(VISITOR_KEY, value)
  }
  return value
}

function locale() {
  const value = document.documentElement.lang || navigator.language || 'fr'
  return value.toLowerCase().startsWith('ar') ? 'ar' : value.toLowerCase().startsWith('en') ? 'en' : 'fr'
}

function deviceClass() {
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1100) return 'tablet'
  return 'desktop'
}

function connectionType() {
  const nav = navigator as Navigator & { connection?: { effectiveType?: string } }
  return nav.connection?.effectiveType || 'unknown'
}

function userAgentData() {
  const nav = navigator as Navigator & {
    userAgentData?: { platform?: string; mobile?: boolean; brands?: Array<{ brand: string; version: string }>; model?: string }
    deviceMemory?: number
  }
  return nav.userAgentData ? {
    platform: nav.userAgentData.platform || '',
    mobile: Boolean(nav.userAgentData.mobile),
    brands: nav.userAgentData.brands || [],
    model: nav.userAgentData.model || '',
  } : {}
}

function sanitizeUrl(value: string) {
  if (!value) return ''
  try {
    const url = new URL(value, window.location.origin)
    const params = new URLSearchParams()
    for (const [key, val] of url.searchParams.entries()) {
      if (SAFE_QUERY.has(key.toLowerCase())) params.set(key, val.slice(0, 300))
    }
    const query = params.toString()
    const origin = url.origin === window.location.origin ? '' : url.origin
    return `${origin}${url.pathname}${query ? `?${query}` : ''}`.slice(0, 900)
  } catch {
    return value.split('?')[0]?.slice(0, 900) || ''
  }
}

function trafficContext() {
  const url = new URL(window.location.href)
  const referrer = sanitizeUrl(document.referrer || '')
  let referrerDomain = ''
  try { referrerDomain = referrer ? new URL(referrer, window.location.origin).hostname : '' } catch { referrerDomain = '' }
  const clickIds: Record<string, string> = {}
  for (const key of ['gclid', 'fbclid', 'msclkid', 'ttclid']) {
    const value = url.searchParams.get(key)
    if (value) clickIds[key] = value.slice(0, 220)
  }
  const source = url.searchParams.get('utm_source') || (referrerDomain ? referrerDomain.replace(/^www\./, '') : 'Direct')
  return {
    source: source.slice(0, 180),
    medium: (url.searchParams.get('utm_medium') || '').slice(0, 180),
    campaign: (url.searchParams.get('utm_campaign') || '').slice(0, 220),
    content: (url.searchParams.get('utm_content') || '').slice(0, 220),
    term: (url.searchParams.get('utm_term') || '').slice(0, 220),
    referrer,
    referrerDomain,
    landingPage: sessionStorage.getItem(LANDING_KEY) || sanitizeUrl(window.location.href),
    clickIds,
  }
}

function touchContext(key: string) {
  const value = localStorage.getItem(key)
  if (!value) return null
  try { return JSON.parse(value) as Record<string, unknown> } catch { return null }
}

function ensureTouchContext() {
  const current = trafficContext()
  if (!localStorage.getItem(FIRST_TOUCH_KEY)) localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(current))
  localStorage.setItem(LAST_TOUCH_KEY, JSON.stringify(current))
}

function baseDevice() {
  const nav = navigator as Navigator & { deviceMemory?: number }
  return {
    deviceClass: deviceClass(),
    platform: navigator.platform || '',
    language: navigator.language || '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    screen: { width: window.screen.width, height: window.screen.height },
    viewport: { width: window.innerWidth, height: window.innerHeight },
    dpr: window.devicePixelRatio || 1,
    touch: navigator.maxTouchPoints > 0,
    connection: connectionType(),
    memoryGb: nav.deviceMemory ?? null,
    cores: navigator.hardwareConcurrency || null,
    uaData: userAgentData(),
  }
}

function inferIntent(pathname: string, label = '', href = '') {
  const value = `${pathname} ${label} ${href}`.toLowerCase()
  if (/order|commande|purchase|paid/.test(value)) return 'order'
  if (/checkout|paiement/.test(value)) return 'checkout'
  if (/panier|cart|basket/.test(value)) return 'cart'
  if (/booking|réserv|reserve|rendez|slot|calendar/.test(value)) return 'booking'
  if (/sanila.*demo|demonstration|démo|demo/.test(value)) return 'demo'
  if (/quote|devis/.test(value)) return 'quote'
  if (/contact/.test(value)) return 'contact'
  if (/search|recherch/.test(value)) return 'search'
  if (/academy|course|formation/.test(value)) return 'course'
  if (/service/.test(value)) return 'service'
  if (/product|produit|catalog/.test(value)) return 'product'
  return 'browse'
}

function getSearchQuery() {
  const params = new URLSearchParams(window.location.search)
  for (const key of ['q', 'query', 'search', 'keyword', 'term']) {
    const value = params.get(key)
    if (value) return value.slice(0, 300)
  }
  return ''
}

function analyticsIdentity(element: HTMLElement) {
  const closest = element.closest('[data-analytics-key],[data-component-id],[data-section-id],[data-entity-id]') as HTMLElement | null
  return {
    analyticsKey: closest?.dataset.analyticsKey || element.dataset.analyticsKey || '',
    componentId: closest?.dataset.componentId || element.dataset.componentId || '',
    sectionId: closest?.dataset.sectionId || element.dataset.sectionId || '',
    entityId: closest?.dataset.entityId || element.dataset.entityId || '',
  }
}

function meaningfulTarget(target: EventTarget | null, event?: MouseEvent) {
  const element = target instanceof Element ? target.closest('a,button,[role="button"],[data-action],input[type="submit"]') : null
  if (!(element instanceof HTMLElement)) return null
  const anchor = element instanceof HTMLAnchorElement ? element : element.closest('a')
  const label = (element.getAttribute('aria-label') || element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 180)
  const rect = element.getBoundingClientRect()
  return {
    tag: element.tagName.toLowerCase(),
    label,
    href: anchor instanceof HTMLAnchorElement ? sanitizeUrl(anchor.href) : '',
    id: element.id || '',
    role: element.getAttribute('role') || '',
    action: element.getAttribute('data-action') || '',
    ...analyticsIdentity(element),
    xPct: event ? Math.max(0, Math.min(100, Math.round((event.clientX / Math.max(1, window.innerWidth)) * 1000) / 10)) : null,
    yPct: event ? Math.max(0, Math.min(100, Math.round((event.clientY / Math.max(1, window.innerHeight)) * 1000) / 10)) : null,
    targetXPct: event ? Math.max(0, Math.min(100, Math.round(((event.clientX - rect.left) / Math.max(1, rect.width)) * 1000) / 10)) : null,
    targetYPct: event ? Math.max(0, Math.min(100, Math.round(((event.clientY - rect.top) / Math.max(1, rect.height)) * 1000) / 10)) : null,
  }
}

function formIdentity(form: HTMLFormElement | null) {
  if (!form) return { label: 'Formulaire', formId: '', method: '', action: '' }
  return {
    label: (form.getAttribute('aria-label') || form.id || form.name || 'Formulaire').slice(0, 180),
    formId: (form.id || '').slice(0, 160),
    method: (form.method || '').slice(0, 20),
    action: sanitizeUrl(form.action || ''),
  }
}

function detectFormStep(form: HTMLFormElement | null) {
  if (!form) return ''
  const direct = form.querySelector('[aria-current="step"],[data-current-step],[data-step][data-active="true"],[data-step][aria-current="true"]') as HTMLElement | null
  if (direct) return (direct.dataset.currentStep || direct.dataset.step || direct.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120)
  const progress = form.querySelector('[role="progressbar"]') as HTMLElement | null
  if (progress) return (progress.getAttribute('aria-valuenow') || progress.getAttribute('aria-valuetext') || '').slice(0, 120)
  return ''
}

function safeResult(input: unknown) {
  const allowed = new Set(['id', 'orderId', 'order_id', 'bookingId', 'booking_id', 'quoteId', 'quote_id', 'status', 'amount', 'total', 'totalAmount', 'grandTotal', 'orderTotal', 'price', 'currency', 'count', 'resultCount'])
  const out: Record<string, string | number | boolean> = {}
  const visit = (value: unknown, depth: number) => {
    if (!value || depth > 2 || Object.keys(out).length >= 18) return
    if (Array.isArray(value)) {
      if (!('count' in out)) out.count = value.length
      if (value[0]) visit(value[0], depth + 1)
      return
    }
    if (typeof value !== 'object') return
    for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
      if (allowed.has(key) && ['string', 'number', 'boolean'].includes(typeof raw)) out[key] = typeof raw === 'string' ? raw.slice(0, 160) : raw as number | boolean
      else if (depth < 2 && raw && typeof raw === 'object') visit(raw, depth + 1)
      if (Object.keys(out).length >= 18) break
    }
  }
  visit(input, 0)
  return out
}

function classifyApi(apiPath: string, method: string, status: number, currentPath: string) {
  const path = apiPath.toLowerCase()
  const ok = status >= 200 && status < 400
  let authority = 'marketplace.api'
  let businessEvent = ''
  if (/\/conversion\/basket/.test(path)) {
    authority = 'conversion.basket'
    if (/\/items/.test(path)) businessEvent = ok ? (method === 'DELETE' ? 'cart.item_removed' : 'cart.item_added') : 'cart.failed'
    else businessEvent = ok ? 'cart.opened' : 'cart.failed'
  } else if (/\/conversion\/sessions/.test(path)) {
    authority = 'conversion.session'
    const booking = /booking|service|réserv/i.test(currentPath)
    if (/\/confirm/.test(path)) businessEvent = ok ? (booking ? 'booking.confirmed' : 'checkout.completed') : (booking ? 'booking.failed' : 'checkout.failed')
    else if (/availability/.test(path)) businessEvent = ok ? 'booking.availability_viewed' : 'booking.availability_failed'
    else if (/price/.test(path)) businessEvent = ok ? 'checkout.price_resolved' : 'checkout.price_failed'
    else if (method === 'POST') businessEvent = ok ? (booking ? 'booking.started' : 'checkout.started') : (booking ? 'booking.failed' : 'checkout.failed')
  } else if (/\/orders/.test(path)) {
    authority = 'orders'
    businessEvent = ok ? (method === 'POST' ? 'order.created' : 'order.observed') : 'order.failed'
  } else if (/\/booking|\/bookings/.test(path)) {
    authority = 'booking'
    businessEvent = ok ? (/confirm|complete/.test(path) ? 'booking.confirmed' : method === 'POST' ? 'booking.started' : 'booking.observed') : 'booking.failed'
  } else if (/\/quotes|\/quote/.test(path)) {
    authority = 'quote'
    businessEvent = ok ? (method === 'POST' ? 'quote.submitted' : 'quote.observed') : 'quote.failed'
  } else if (/\/public\/inquiries/.test(path)) {
    authority = 'public.inquiry'
    if (/sanila/i.test(currentPath)) businessEvent = ok ? 'demo.submitted' : 'demo.failed'
    else businessEvent = ok ? 'contact.submitted' : 'contact.failed'
  } else if (/search|recherche/.test(path)) {
    authority = 'search'
    businessEvent = ok ? 'search.results' : 'search.failed'
  } else if (/academy/.test(path) && /enroll|registration|checkout/.test(path)) {
    authority = 'academy'
    businessEvent = ok ? 'course.enrollment' : 'course.enrollment_failed'
  }
  return { authority, businessEvent }
}

export function MarketplaceTelemetry() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname || pathname.includes('/admin')) return
    if (!pathname.startsWith('/angelcare-marketplace')) return
    if (navigator.doNotTrack === '1') return

    const sessionKey = getSessionKey()
    const visitorKey = getVisitorKey()
    if (!sessionStorage.getItem(LANDING_KEY)) sessionStorage.setItem(LANDING_KEY, sanitizeUrl(window.location.href))
    if (!sessionStorage.getItem(START_KEY)) sessionStorage.setItem(START_KEY, String(Date.now()))
    ensureTouchContext()

    const nativeFetch = window.fetch.bind(window)
    let queue: EventPayload[] = []
    let flushTimer: number | null = null
    let maxScroll = 0
    let lastActivity = Date.now()
    let lcp = 0
    let cls = 0
    let inp = 0
    let longTaskMs = 0
    const scrollMilestones = new Set<number>()
    const startedForms = new WeakSet<HTMLFormElement>()
    const formSteps = new WeakMap<HTMLFormElement, string>()
    const recentClicks = new Map<string, number[]>()

    const send = (payload: unknown, beacon = false) => {
      const body = JSON.stringify(payload)
      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon('/api/angelcare-marketplace/analytics/xray/collect', new Blob([body], { type: 'application/json' }))
        return
      }
      void nativeFetch('/api/angelcare-marketplace/analytics/xray/collect', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body,
        keepalive: true, cache: 'no-store', credentials: 'same-origin',
      }).catch(() => undefined)
    }

    const flush = (beacon = false) => {
      if (!queue.length) return
      const events = queue.splice(0, 25)
      send({ sessionKey, visitorKey, events }, beacon)
      if (queue.length) window.setTimeout(() => flush(beacon), 20)
    }

    const scheduleFlush = () => {
      if (flushTimer != null) return
      flushTimer = window.setTimeout(() => {
        flushTimer = null
        flush()
      }, 2500)
    }

    const enqueue = (kind: string, metadata: Record<string, unknown> = {}, immediate = false) => {
      const current = sanitizeUrl(window.location.href) || window.location.pathname
      const label = typeof metadata.label === 'string' ? metadata.label : ''
      const href = typeof metadata.href === 'string' ? metadata.href : ''
      queue.push({
        id: randomKey('e'), kind, at: new Date().toISOString(), pathname: current,
        locale: locale(), metadata: {
          ...metadata,
          title: document.title.slice(0, 300),
          intent: metadata.intent || inferIntent(current, label, href),
          traffic: trafficContext(),
          firstTouch: touchContext(FIRST_TOUCH_KEY),
          lastTouch: touchContext(LAST_TOUCH_KEY),
          device: baseDevice(),
          online: navigator.onLine,
          colorScheme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
          idleMs: Date.now() - lastActivity,
        },
      })
      if (queue.length >= 10 || immediate) flush()
      else scheduleFlush()
    }

    const emitFormStep = (form: HTMLFormElement | null) => {
      if (!form) return
      const step = detectFormStep(form)
      if (!step || formSteps.get(form) === step) return
      formSteps.set(form, step)
      enqueue('form_step', { ...formIdentity(form), step })
    }

    const onActivity = () => { lastActivity = Date.now() }
    const onClick = (event: MouseEvent) => {
      onActivity()
      const target = meaningfulTarget(event.target, event)
      if (!target) return
      const clickIntent = inferIntent(window.location.pathname, target.label, target.href)
      enqueue('click', { ...target, intent: clickIntent })
      const signature = `${target.analyticsKey || target.id || target.label || target.tag}:${Math.round(Number(target.xPct) / 5)}`.slice(0, 220)
      const now = Date.now()
      const recent = (recentClicks.get(signature) || []).filter((value) => now - value <= 1200)
      recent.push(now)
      recentClicks.set(signature, recent)
      if (recent.length >= 3) {
        enqueue('rage_click', { ...target, repeats: recent.length, windowMs: 1200, intent: clickIntent }, true)
        recentClicks.set(signature, [])
      }
      const element = event.target instanceof Element ? event.target.closest('a,button,[role="button"]') : null
      const href = element instanceof HTMLAnchorElement ? element.getAttribute('href') || '' : ''
      const action = element instanceof HTMLElement ? element.dataset.action || element.dataset.analyticsKey || '' : ''
      const suspiciousDead = element instanceof HTMLElement && !href && !action && element.getAttribute('aria-disabled') === 'true'
      if (suspiciousDead) enqueue('dead_click', { ...target, confidence: 'high', reason: 'aria-disabled-target' })
      const form = element?.closest('form') as HTMLFormElement | null
      if (form) window.setTimeout(() => emitFormStep(form), 0)
    }
    const onFocus = (event: FocusEvent) => {
      onActivity()
      const element = event.target instanceof Element ? event.target : null
      const form = element?.closest('form') as HTMLFormElement | null
      if (!(form instanceof HTMLFormElement)) return
      if (!startedForms.has(form)) {
        startedForms.add(form)
        enqueue('form_start', formIdentity(form))
      }
      emitFormStep(form)
    }
    const onInvalid = (event: Event) => {
      const element = event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement ? event.target : null
      if (!element) return
      const form = element.form
      enqueue('form_invalid', { ...formIdentity(form), fieldName: element.name.slice(0, 120), fieldType: element instanceof HTMLInputElement ? element.type.slice(0, 40) : element.tagName.toLowerCase() })
    }
    const onSubmit = (event: SubmitEvent) => {
      onActivity()
      const form = event.target instanceof HTMLFormElement ? event.target : null
      enqueue('form_submit', formIdentity(form), true)
    }
    const onScroll = () => {
      onActivity()
      const doc = document.documentElement
      const total = Math.max(1, doc.scrollHeight - window.innerHeight)
      const depth = Math.min(100, Math.round((window.scrollY / total) * 100))
      maxScroll = Math.max(maxScroll, depth)
      for (const milestone of [25, 50, 75, 100]) {
        if (depth >= milestone && !scrollMilestones.has(milestone)) {
          scrollMilestones.add(milestone)
          enqueue('scroll', { depth: milestone })
        }
      }
    }
    const onError = (event: ErrorEvent) => enqueue('error', { label: event.message.slice(0, 300), source: sanitizeUrl(event.filename || ''), line: event.lineno, column: event.colno })
    const onResourceError = (event: Event) => {
      const target = event.target
      if (!(target instanceof HTMLImageElement || target instanceof HTMLScriptElement || target instanceof HTMLLinkElement)) return
      const resource = target instanceof HTMLImageElement ? target.currentSrc || target.src : target instanceof HTMLScriptElement ? target.src : target.href
      enqueue('resource_error', { label: `${target.tagName.toLowerCase()} resource failed`, resource: sanitizeUrl(resource || ''), tag: target.tagName.toLowerCase() })
    }
    const onReject = (event: PromiseRejectionEvent) => enqueue('error', { label: String(event.reason instanceof Error ? event.reason.message : event.reason).slice(0, 300), source: 'unhandledrejection' })
    const onOnline = () => enqueue('online', { label: 'Connexion rétablie' }, true)
    const onOffline = () => enqueue('offline', { label: 'Connexion perdue' }, true)
    const onPageHide = () => {
      const started = Number(sessionStorage.getItem(START_KEY) || Date.now())
      enqueue('web_vital', { metric: 'FINAL', lcpMs: Math.round(lcp), cls: Math.round(cls * 1000) / 1000, inpMs: Math.round(inp), longTaskMs: Math.round(longTaskMs) }, true)
      enqueue('exit', { durationMs: Date.now() - started, maxScroll }, true)
      flush(true)
    }

    window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const started = performance.now()
      const request = input instanceof Request ? input : null
      const method = (init?.method || request?.method || 'GET').toUpperCase()
      const rawUrl = input instanceof Request ? input.url : String(input)
      let parsed: URL | null = null
      try { parsed = new URL(rawUrl, window.location.origin) } catch { parsed = null }
      try {
        const response = await nativeFetch(input, init)
        if (!parsed || parsed.origin !== window.location.origin || !parsed.pathname.startsWith('/api/angelcare-marketplace/') || parsed.pathname.startsWith('/api/angelcare-marketplace/analytics/xray/')) return response
        const durationMs = Math.max(0, Math.round(performance.now() - started))
        const apiPath = sanitizeUrl(parsed.href)
        const requestId = response.headers.get('x-request-id') || response.headers.get('cf-ray') || ''
        const { authority, businessEvent } = classifyApi(parsed.pathname, method, response.status, window.location.pathname)
        void (async () => {
          let result: Record<string, unknown> = {}
          try {
            const contentType = response.headers.get('content-type') || ''
            if (/application\/json/i.test(contentType)) result = safeResult(await response.clone().json())
          } catch { result = {} }
          enqueue('api_call', { label: `${method} ${parsed?.pathname || apiPath}`, apiPath, method, status: response.status, ok: response.ok, durationMs, requestId, authority, safeResult: result, intent: inferIntent(window.location.pathname, authority, apiPath) })
          if (businessEvent) enqueue('business_event', { label: businessEvent, businessEvent, authority, apiPath, method, status: response.status, ok: response.ok, durationMs, requestId, safeResult: result, intent: inferIntent(window.location.pathname, businessEvent, apiPath) }, true)
          if (authority === 'search') {
            const query = parsed?.searchParams.get('q') || parsed?.searchParams.get('query') || parsed?.searchParams.get('search') || getSearchQuery()
            enqueue('search_result', { label: `Résultats recherche “${(query || '').slice(0, 180)}”`, query: (query || '').slice(0, 300), resultCount: typeof result.count === 'number' ? result.count : typeof result.resultCount === 'number' ? result.resultCount : null, status: response.status, intent: 'search' })
          }
        })()
        return response
      } catch (error) {
        if (parsed && parsed.origin === window.location.origin && parsed.pathname.startsWith('/api/angelcare-marketplace/') && !parsed.pathname.startsWith('/api/angelcare-marketplace/analytics/xray/')) {
          const durationMs = Math.max(0, Math.round(performance.now() - started))
          const apiPath = sanitizeUrl(parsed.href)
          const { authority, businessEvent } = classifyApi(parsed.pathname, method, 0, window.location.pathname)
          enqueue('api_call', { label: `${method} ${parsed.pathname} · network failure`, apiPath, method, status: 0, ok: false, durationMs, authority, errorClass: error instanceof Error ? error.name : 'NetworkError', intent: inferIntent(window.location.pathname, authority, apiPath) }, true)
          if (businessEvent) enqueue('business_event', { label: businessEvent, businessEvent, authority, apiPath, method, status: 0, ok: false, durationMs, intent: inferIntent(window.location.pathname, businessEvent, apiPath) }, true)
        }
        throw error
      }
    }) as typeof window.fetch

    enqueue(sessionStorage.getItem(STARTED_KEY) ? 'page_view' : 'session_start', { landing: trafficContext().landingPage }, true)
    sessionStorage.setItem(STARTED_KEY, '1')
    const query = getSearchQuery()
    if (query) enqueue('search', { query, label: `Recherche “${query}”`, intent: 'search' })

    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (nav) {
      enqueue('performance', {
        navigation: {
          type: nav.type,
          dnsMs: Math.max(0, nav.domainLookupEnd - nav.domainLookupStart),
          connectMs: Math.max(0, nav.connectEnd - nav.connectStart),
          ttfbMs: Math.max(0, nav.responseStart - nav.requestStart),
          domInteractiveMs: Math.max(0, nav.domInteractive - nav.startTime),
          domContentLoadedMs: Math.max(0, nav.domContentLoadedEventEnd - nav.startTime),
          loadMs: Math.max(0, nav.loadEventEnd - nav.startTime),
          transferSize: nav.transferSize,
          encodedBodySize: nav.encodedBodySize,
        },
      })
    }

    const observers: PerformanceObserver[] = []
    try {
      const po = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) lcp = Math.max(lcp, entry.startTime)
      })
      po.observe({ type: 'largest-contentful-paint', buffered: true })
      observers.push(po)
    } catch { /* unsupported */ }
    try {
      const po = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<PerformanceEntry & { value?: number; hadRecentInput?: boolean }>) if (!entry.hadRecentInput) cls += entry.value || 0
      })
      po.observe({ type: 'layout-shift', buffered: true })
      observers.push(po)
    } catch { /* unsupported */ }
    try {
      const po = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<PerformanceEntry & { duration?: number; interactionId?: number }>) if ((entry.interactionId || 0) > 0) inp = Math.max(inp, entry.duration || 0)
      })
      po.observe({ type: 'event', buffered: true, durationThreshold: 40 } as PerformanceObserverInit)
      observers.push(po)
    } catch { /* unsupported */ }
    try {
      const po = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) longTaskMs += entry.duration || 0
      })
      po.observe({ type: 'longtask', buffered: true } as PerformanceObserverInit)
      observers.push(po)
    } catch { /* unsupported */ }

    window.addEventListener('click', onClick, { capture: true })
    window.addEventListener('focusin', onFocus)
    window.addEventListener('invalid', onInvalid, { capture: true })
    window.addEventListener('submit', onSubmit, { capture: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('keydown', onActivity, { passive: true })
    window.addEventListener('pointerdown', onActivity, { passive: true })
    window.addEventListener('error', onError)
    window.addEventListener('error', onResourceError, true)
    window.addEventListener('unhandledrejection', onReject)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener('pagehide', onPageHide)

    const heartbeat = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      enqueue('heartbeat', { maxScroll, idleMs: Date.now() - lastActivity, lcpMs: Math.round(lcp), cls: Math.round(cls * 1000) / 1000, inpMs: Math.round(inp), longTaskMs: Math.round(longTaskMs) }, true)
    }, 20_000)

    return () => {
      window.clearInterval(heartbeat)
      if (flushTimer != null) window.clearTimeout(flushTimer)
      window.fetch = nativeFetch
      window.removeEventListener('click', onClick, { capture: true } as EventListenerOptions)
      window.removeEventListener('focusin', onFocus)
      window.removeEventListener('invalid', onInvalid, { capture: true } as EventListenerOptions)
      window.removeEventListener('submit', onSubmit, { capture: true } as EventListenerOptions)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('keydown', onActivity)
      window.removeEventListener('pointerdown', onActivity)
      window.removeEventListener('error', onError)
      window.removeEventListener('error', onResourceError, true)
      window.removeEventListener('unhandledrejection', onReject)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('pagehide', onPageHide)
      observers.forEach((observer) => observer.disconnect())
      flush(true)
    }
  }, [pathname, searchParams])

  return null
}
