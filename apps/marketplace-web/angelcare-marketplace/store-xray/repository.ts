import { createHash } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import type { MarketplaceRequestContext } from '../domain/types'
import { MarketplaceError } from '../server/errors'
import { getCustomerContext } from '../customer-commerce/customer-auth'
import type {
  XrayAlert,
  XrayDeviceContext,
  XrayFeedItem,
  XrayFunnelStage,
  XrayIntent,
  XrayNetworkContext,
  XrayRouteInsight,
  XraySession,
  XraySummary,
  XrayTimelineEvent,
  XrayTrafficContext,
  XrayTransition,
  XrayVisitorProfile,
} from './types'

type Row = Record<string, unknown>
type DbError = { code?: string; message?: string } | null

const text = (value: unknown) => (typeof value === 'string' ? value : '')
const num = (value: unknown) => (Number.isFinite(Number(value)) ? Number(value) : 0)
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
const array = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])
const missing = (error: DbError) => error?.code === '42P01' || error?.code === 'PGRST205'

const countryNames: Record<string, string> = {
  MA: 'Maroc', FR: 'France', ES: 'Espagne', BE: 'Belgique', PT: 'Portugal',
  IT: 'Italie', DE: 'Allemagne', GB: 'Royaume-Uni', NL: 'Pays-Bas', CH: 'Suisse',
  US: 'États-Unis', CA: 'Canada', QA: 'Qatar', AE: 'Émirats arabes unis', SA: 'Arabie saoudite',
  DZ: 'Algérie', TN: 'Tunisie', EG: 'Égypte', SN: 'Sénégal', CI: 'Côte d’Ivoire',
}

function fail(operation: string, error: DbError): never {
  throw new MarketplaceError(
    missing(error) ? 'CONFIGURATION_ERROR' : 'INTERNAL_ERROR',
    missing(error)
      ? 'Live Experience telemetry authority is unavailable.'
      : `Impossible de ${operation}.`,
    { cause: error || undefined, retryable: true },
  )
}

function header(request: Request, names: string[]) {
  for (const name of names) {
    const value = request.headers.get(name)
    if (value) return value.trim()
  }
  return ''
}

function requestIp(request: Request) {
  const direct = header(request, ['cf-connecting-ip', 'true-client-ip', 'x-real-ip'])
  if (direct) return direct.split(',')[0]?.trim() || ''
  const forwarded = request.headers.get('x-forwarded-for') || ''
  return forwarded.split(',')[0]?.trim() || ''
}

function parseCoordinate(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function requestNetwork(request: Request): XrayNetworkContext {
  const ip = requestIp(request)
  const countryCode = header(request, ['cf-ipcountry', 'x-vercel-ip-country', 'x-country-code', 'x-geo-country']).toUpperCase() || null
  const cityRaw = header(request, ['x-vercel-ip-city', 'x-city', 'x-geo-city', 'cf-ipcity'])
  const regionRaw = header(request, ['x-vercel-ip-country-region', 'x-region', 'x-geo-region', 'cf-region'])
  const latitude = parseCoordinate(header(request, ['x-vercel-ip-latitude', 'x-geo-latitude', 'cf-iplatitude']))
  const longitude = parseCoordinate(header(request, ['x-vercel-ip-longitude', 'x-geo-longitude', 'cf-iplongitude']))
  const timezone = header(request, ['x-vercel-ip-timezone', 'x-geo-timezone', 'cf-timezone']) || null
  const asn = header(request, ['x-asn', 'x-geo-asn', 'cf-asn']) || null
  const networkOrganization = header(request, ['x-network-organization', 'x-geo-organization', 'cf-organization']) || null
  const edge = header(request, ['cf-ray', 'x-request-id']) || null
  const hash = ip ? createHash('sha256').update(`angelcare:xray:${ip}`).digest('hex') : null
  const decode = (value: string) => {
    try { return decodeURIComponent(value.replace(/\+/g, ' ')) } catch { return value }
  }
  return {
    ip: ip || null,
    ipHash: hash,
    countryCode,
    country: countryCode ? countryNames[countryCode] || countryCode : null,
    region: regionRaw ? decode(regionRaw) : null,
    city: cityRaw ? decode(cityRaw) : null,
    latitude,
    longitude,
    timezone,
    asn,
    networkOrganization,
    edge,
    forwarded: Boolean(request.headers.get('x-forwarded-for')),
  }
}

function clientDevice(input: Record<string, unknown>, userAgent: string): XrayDeviceContext {
  const viewport = object(input.viewport)
  const screen = object(input.screen)
  const uaData = object(input.uaData)
  const brands = array(uaData.brands)
    .map((x) => object(x))
    .filter((x) => text(x.brand) && !/not.?a.?brand/i.test(text(x.brand)))
  const primaryBrand = brands[0] || {}
  const browserFromUa = /edg\//i.test(userAgent) ? 'Edge'
    : /opr\//i.test(userAgent) ? 'Opera'
      : /firefox\//i.test(userAgent) ? 'Firefox'
        : /chrome\//i.test(userAgent) ? 'Chrome'
          : /safari\//i.test(userAgent) ? 'Safari' : 'Unknown'
  const versionMatch = userAgent.match(/(?:Edg|OPR|Firefox|Chrome|Version)\/([0-9.]+)/i)
  const os = /iphone|ipad|ios/i.test(userAgent) ? 'iOS'
    : /android/i.test(userAgent) ? 'Android'
      : /windows/i.test(userAgent) ? 'Windows'
        : /mac os|macintosh/i.test(userAgent) ? 'macOS'
          : /linux/i.test(userAgent) ? 'Linux' : text(input.platform) || 'Unknown'
  return {
    class: text(input.deviceClass) || 'unknown',
    platform: text(uaData.platform) || text(input.platform) || 'Unknown',
    browser: text(primaryBrand.brand) || browserFromUa,
    browserVersion: text(primaryBrand.version) || versionMatch?.[1] || '',
    os,
    model: text(uaData.model) || '',
    language: text(input.language) || '',
    timezone: text(input.timezone) || '',
    screen: `${num(screen.width)}×${num(screen.height)}`,
    viewport: `${num(viewport.width)}×${num(viewport.height)}`,
    dpr: num(input.dpr) || 1,
    touch: Boolean(input.touch),
    connection: text(input.connection) || 'unknown',
    memoryGb: input.memoryGb == null ? null : num(input.memoryGb),
    cores: input.cores == null ? null : num(input.cores),
  }
}

function safeMetadata(value: unknown) {
  const metadata = object(value)
  const serialized = JSON.stringify(metadata)
  if (serialized.length > 20000) throw new MarketplaceError('VALIDATION_ERROR', 'Telemetry metadata too large.')
  return metadata
}

export async function recordXrayBatch(input: Record<string, unknown>, request: Request) {
  const sessionKey = text(input.sessionKey).slice(0, 160)
  const visitorKey = text(input.visitorKey).slice(0, 160)
  const events = array(input.events).slice(0, 25).map((item) => object(item))
  if (!sessionKey || !visitorKey || !events.length) throw new MarketplaceError('VALIDATION_ERROR', 'Telemetry batch is incomplete.')
  const db = await createServiceClient()
  const since = new Date(Date.now() - 60_000).toISOString()
  const { count, error: countError } = await db
    .from('angelcare_marketplace_live_experience_interactions')
    .select('id', { count: 'exact', head: true })
    .eq('session_key', sessionKey)
    .like('event_type', 'xray_%')
    .gte('created_at', since)
  if (countError && !missing(countError)) fail('contrôler le débit X-Ray', countError)
  if ((count || 0) >= 240) throw new MarketplaceError('RATE_LIMITED', 'Telemetry rate limit reached.')

  const network = requestNetwork(request)
  const userAgent = text(request.headers.get('user-agent')).slice(0, 500)
  const customer = await getCustomerContext().catch(() => null)
  const now = new Date().toISOString()
  const rows = events.flatMap((event) => {
    const pathname = text(event.pathname).slice(0, 500) || '/'
    if (!pathname.startsWith('/angelcare-marketplace') || pathname.includes('/admin')) return []
    const kind = text(event.kind).replace(/[^a-z0-9_]/gi, '_').toLowerCase().slice(0, 48) || 'event'
    const payload = safeMetadata(event.metadata)
    const device = clientDevice(object(payload.device), userAgent)
    return [{
      campaign_id: null,
      event_type: `xray_${kind}`,
      session_key: sessionKey,
      customer_account_id: customer?.account.id || null,
      pathname,
      locale: ['fr', 'en', 'ar'].includes(text(event.locale)) ? text(event.locale) : 'fr',
      device_class: device.class.slice(0, 30),
      metadata: {
        ...payload,
        xray: true,
        visitorKey,
        eventId: text(event.id).slice(0, 160),
        clientAt: text(event.at).slice(0, 80),
        network,
        device,
      },
      ip_hash: network.ipHash,
      user_agent: userAgent,
      created_at: now,
    }]
  })
  if (!rows.length) return { recorded: 0 }
  const { error } = await db.from('angelcare_marketplace_live_experience_interactions').insert(rows)
  if (error) fail('enregistrer la télémétrie X-Ray', error)
  return { recorded: rows.length }
}

function eventIntent(pathname: string, metadata: Record<string, unknown>): XrayIntent {
  const explicit = text(metadata.intent)
  if (explicit) return explicit as XrayIntent
  const businessEvent = text(metadata.businessEvent).toLowerCase()
  if (/order|paid|purchase/.test(businessEvent)) return 'order'
  if (/checkout/.test(businessEvent)) return 'checkout'
  if (/cart|basket/.test(businessEvent)) return 'cart'
  if (/booking|slot|availability/.test(businessEvent)) return 'booking'
  if (/demo/.test(businessEvent)) return 'demo'
  if (/quote/.test(businessEvent)) return 'quote'
  if (/contact|inquiry/.test(businessEvent)) return 'contact'
  const value = `${pathname} ${text(metadata.href)} ${text(metadata.label)} ${text(metadata.apiPath)}`.toLowerCase()
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

function eventLabel(kind: string, pathname: string, metadata: Record<string, unknown>) {
  const explicit = text(metadata.label)
  if (explicit) return explicit.slice(0, 180)
  const businessEvent = text(metadata.businessEvent)
  const map: Record<string, string> = {
    page_view: `Ouverture ${pathname}`,
    session_start: `Entrée ${pathname}`,
    heartbeat: `Actif sur ${pathname}`,
    click: `Interaction sur ${pathname}`,
    rage_click: `Rage click détecté`,
    dead_click: `Clic sans navigation détecté`,
    form_start: `Formulaire commencé`,
    form_step: `Étape formulaire ${text(metadata.step) || 'progressée'}`,
    form_invalid: `Validation formulaire bloquée`,
    form_submit: `Formulaire envoyé`,
    scroll: `Lecture ${num(metadata.depth)}%`,
    search: `Recherche ${text(metadata.query)}`,
    search_result: `Résultats recherche ${text(metadata.query)}`,
    api_call: `API ${text(metadata.method)} ${text(metadata.apiPath)}`,
    business_event: businessEvent ? `Business · ${businessEvent}` : 'Événement business',
    resource_error: `Ressource frontend en échec`,
    performance: `Performance mesurée`,
    web_vital: `Web Vital ${text(metadata.metric)}`,
    error: `Erreur navigateur`,
    online: 'Connexion rétablie',
    offline: 'Connexion perdue',
    exit: `Sortie ${pathname}`,
  }
  return map[kind] || kind
}

function defaultDevice(): XrayDeviceContext {
  return { class: 'unknown', platform: 'Unknown', browser: 'Unknown', browserVersion: '', os: 'Unknown', model: '', language: '', timezone: '', screen: '0×0', viewport: '0×0', dpr: 1, touch: false, connection: 'unknown', memoryGb: null, cores: null }
}
function defaultNetwork(): XrayNetworkContext {
  return { ip: null, ipHash: null, countryCode: null, country: null, region: null, city: null, latitude: null, longitude: null, timezone: null, asn: null, networkOrganization: null, edge: null, forwarded: false }
}
function defaultTraffic(): XrayTrafficContext {
  return { source: 'Direct', medium: '', campaign: '', content: '', term: '', referrer: '', referrerDomain: '', landingPage: '', clickIds: {} }
}

function trafficFrom(value: unknown): XrayTrafficContext {
  const raw = object(value)
  return {
    ...defaultTraffic(),
    source: text(raw.source) || 'Direct',
    medium: text(raw.medium),
    campaign: text(raw.campaign),
    content: text(raw.content),
    term: text(raw.term),
    referrer: text(raw.referrer),
    referrerDomain: text(raw.referrerDomain),
    landingPage: text(raw.landingPage),
    clickIds: Object.fromEntries(Object.entries(object(raw.clickIds)).map(([key, val]) => [key, text(val)]).filter(([, val]) => Boolean(val))),
  }
}

function tally(values: string[]) {
  const map = new Map<string, number>()
  for (const value of values.filter(Boolean)) map.set(value, (map.get(value) || 0) + 1)
  return [...map.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count)
}

function safeNumberFromResult(metadata: Record<string, unknown>) {
  const result = object(metadata.safeResult)
  for (const key of ['amount', 'total', 'totalAmount', 'grandTotal', 'orderTotal', 'price']) {
    const value = num(result[key])
    if (value > 0 && value < 10_000_000) return value
  }
  return 0
}

function safeCurrencyFromResult(metadata: Record<string, unknown>) {
  const result = object(metadata.safeResult)
  const value = text(result.currency).toUpperCase()
  return /^[A-Z]{3}$/.test(value) ? value : ''
}

function scoreSession(input: {
  intent: string
  pageViews: number
  clicks: number
  maxScroll: number
  durationSeconds: number
  formsStarted: number
  formsSubmitted: number
  searches: number
  errors: number
  apiFailures: number
  resourceErrors: number
  rageClicks: number
  deadClicks: number
  formInvalid: number
  businessEvents: string[]
  maxInpMs: number
  lcpMs: number
}) {
  const intentBase: Record<string, number> = { browse: 10, search: 22, product: 32, service: 38, course: 38, contact: 52, cart: 60, booking: 70, quote: 72, demo: 75, checkout: 82, order: 100 }
  const intentReasons: string[] = []
  let intent = intentBase[input.intent] || 10
  if (input.businessEvents.some((x) => /order\.paid|checkout\.completed|booking\.confirmed/.test(x))) { intent = 100; intentReasons.push('conversion confirmée') }
  if (input.businessEvents.some((x) => /checkout\.started/.test(x))) { intent = Math.max(intent, 85); intentReasons.push('checkout démarré') }
  if (input.businessEvents.some((x) => /booking\.started|slot\.selected/.test(x))) { intent = Math.max(intent, 78); intentReasons.push('réservation engagée') }
  if (input.pageViews >= 5) { intent += 4; intentReasons.push('navigation profonde') }
  if (input.durationSeconds >= 180) { intent += 4; intentReasons.push('session engagée') }

  const engagementReasons: string[] = []
  let engagement = Math.min(25, input.pageViews * 5) + Math.min(20, input.clicks * 2) + Math.min(20, input.maxScroll / 5) + Math.min(20, input.durationSeconds / 30) + Math.min(15, input.searches * 5 + input.formsStarted * 5)
  if (input.maxScroll >= 75) engagementReasons.push('lecture profonde')
  if (input.clicks >= 5) engagementReasons.push('interactions multiples')
  if (input.searches > 0) engagementReasons.push('recherche active')

  const technicalReasons: string[] = []
  let technical = 100 - input.errors * 20 - input.apiFailures * 16 - input.resourceErrors * 12
  if (input.maxInpMs > 500) { technical -= 12; technicalReasons.push('INP dégradé') }
  if (input.lcpMs > 4000) { technical -= 15; technicalReasons.push('LCP lent') }
  if (!technicalReasons.length && technical >= 90) technicalReasons.push('expérience technique saine')

  const frictionReasons: string[] = []
  let friction = input.errors * 18 + input.apiFailures * 15 + input.resourceErrors * 10 + input.rageClicks * 12 + input.deadClicks * 8 + input.formInvalid * 5
  if (input.rageClicks) frictionReasons.push('rage clicks')
  if (input.deadClicks) frictionReasons.push('clics sans effet')
  if (input.apiFailures) frictionReasons.push('échecs API')
  if (input.formInvalid) frictionReasons.push('validation formulaire')

  return {
    intent: { value: Math.max(0, Math.min(100, Math.round(intent))), reasons: intentReasons.slice(0, 5) },
    engagement: { value: Math.max(0, Math.min(100, Math.round(engagement))), reasons: engagementReasons.slice(0, 5) },
    technical: { value: Math.max(0, Math.min(100, Math.round(technical))), reasons: technicalReasons.slice(0, 5) },
    friction: { value: Math.max(0, Math.min(100, Math.round(friction))), reasons: frictionReasons.slice(0, 5) },
  }
}

function rowsToSessions(rows: Row[], now = Date.now()): XraySession[] {
  const groups = new Map<string, Row[]>()
  for (const row of rows) {
    const key = text(row.session_key)
    if (!key) continue
    const existing = groups.get(key) || []
    existing.push(row)
    groups.set(key, existing)
  }
  const sessions: XraySession[] = []
  for (const [sessionKey, values] of groups.entries()) {
    const ordered = [...values].sort((a, b) => new Date(text(a.created_at)).getTime() - new Date(text(b.created_at)).getTime())
    const first = ordered[0]
    const latest = ordered[ordered.length - 1]
    if (!first || !latest) continue
    const latestMeta = object(latest.metadata)
    const firstMeta = object(first.metadata)
    const network = { ...defaultNetwork(), ...object(latestMeta.network) } as XrayNetworkContext
    const device = { ...defaultDevice(), ...object(latestMeta.device) } as XrayDeviceContext
    const traffic = trafficFrom(firstMeta.traffic)
    const firstTouch = Object.keys(object(firstMeta.firstTouch)).length ? trafficFrom(firstMeta.firstTouch) : null
    const lastTouch = Object.keys(object(latestMeta.lastTouch)).length ? trafficFrom(latestMeta.lastTouch) : null
    const pageRows = ordered.filter((row) => ['xray_page_view', 'xray_session_start'].includes(text(row.event_type)))
    const pages = pageRows.map((row) => text(row.pathname)).filter(Boolean)
    const created = new Date(text(first.created_at)).getTime()
    const last = new Date(text(latest.created_at)).getTime()
    const kinds = ordered.map((row) => text(row.event_type).replace(/^xray_/, ''))
    const maxScroll = Math.max(0, ...ordered.map((row) => num(object(row.metadata).depth)))
    const businessEvents = ordered.map((row) => text(object(row.metadata).businessEvent)).filter(Boolean)
    const apiRows = ordered.filter((row) => text(row.event_type) === 'xray_api_call')
    const apiDurations = apiRows.map((row) => num(object(row.metadata).durationMs)).filter((x) => x >= 0)
    const webVitalRows = ordered.filter((row) => text(row.event_type) === 'xray_web_vital')
    const maxInpMs = Math.max(0, ...ordered.map((row) => num(object(row.metadata).inpMs)), ...webVitalRows.filter((row) => text(object(row.metadata).metric).toUpperCase() === 'INP').map((row) => num(object(row.metadata).value)))
    const longTaskMs = Math.max(0, ...ordered.map((row) => num(object(row.metadata).longTaskMs)), webVitalRows.filter((row) => text(object(row.metadata).metric).toUpperCase() === 'LONGTASK').reduce((sum, row) => sum + num(object(row.metadata).value), 0))
    const perfRows = ordered.filter((row) => text(row.event_type) === 'xray_performance')
    const lcpMs = Math.max(0, ...perfRows.map((row) => num(object(row.metadata).lcpMs)), ...ordered.map((row) => num(object(row.metadata).lcpMs)))
    const revenueEvents = ordered.filter((row) => /order\.paid|checkout\.completed/.test(text(object(row.metadata).businessEvent)))
    const revenue = revenueEvents.reduce((sum, row) => sum + safeNumberFromResult(object(row.metadata)), 0)
    const currency = revenueEvents.map((row) => safeCurrencyFromResult(object(row.metadata))).find(Boolean) || null
    const pathway: XrayTimelineEvent[] = ordered.slice(-120).reverse().map((row) => {
      const metadata = object(row.metadata)
      const kind = text(row.event_type).replace(/^xray_/, '')
      const pathname = text(row.pathname)
      return {
        id: text(row.id), kind, at: text(row.created_at), pathname,
        title: text(metadata.title), label: eventLabel(kind, pathname, metadata),
        intent: eventIntent(pathname, metadata), metadata,
      }
    })
    const intent = eventIntent(text(latest.pathname), latestMeta)
    const stats = {
      intent,
      pageViews: pageRows.length,
      clicks: kinds.filter((x) => x === 'click').length,
      maxScroll,
      durationSeconds: Math.max(0, Math.round((last - created) / 1000)),
      formsStarted: kinds.filter((x) => x === 'form_start').length,
      formsSubmitted: kinds.filter((x) => x === 'form_submit').length,
      searches: kinds.filter((x) => x === 'search' || x === 'search_result').length,
      errors: kinds.filter((x) => x === 'error').length,
      apiFailures: apiRows.filter((row) => num(object(row.metadata).status) >= 400 || object(row.metadata).ok === false).length,
      resourceErrors: kinds.filter((x) => x === 'resource_error').length,
      rageClicks: kinds.filter((x) => x === 'rage_click').length,
      deadClicks: kinds.filter((x) => x === 'dead_click').length,
      formInvalid: kinds.filter((x) => x === 'form_invalid').length,
      businessEvents,
      maxInpMs,
      lcpMs,
    }
    sessions.push({
      sessionKey,
      visitorKey: text(latestMeta.visitorKey),
      customerAccountId: text(latest.customer_account_id) || null,
      known: Boolean(latest.customer_account_id),
      firstSeen: text(first.created_at), lastSeen: text(latest.created_at),
      active: now - last <= 90_000,
      durationSeconds: stats.durationSeconds,
      currentPage: text(latest.pathname),
      previousPage: pages.length > 1 ? pages[pages.length - 2] || null : null,
      landingPage: traffic.landingPage || pages[0] || text(first.pathname),
      pageViews: pageRows.length,
      uniquePages: new Set(pages).size,
      events: ordered.length,
      maxScroll,
      errors: stats.errors,
      apiFailures: stats.apiFailures,
      resourceErrors: stats.resourceErrors,
      rageClicks: stats.rageClicks,
      deadClicks: stats.deadClicks,
      formsStarted: stats.formsStarted,
      formSteps: kinds.filter((x) => x === 'form_step').length,
      formInvalid: stats.formInvalid,
      formsSubmitted: stats.formsSubmitted,
      clicks: stats.clicks,
      searches: stats.searches,
      businessEvents: businessEvents.length,
      orders: businessEvents.filter((x) => /order\.created|order\.paid/.test(x)).length,
      bookingsConfirmed: businessEvents.filter((x) => /booking\.confirmed/.test(x)).length,
      checkoutsCompleted: businessEvents.filter((x) => /checkout\.completed/.test(x)).length,
      demoSubmissions: businessEvents.filter((x) => /demo\.submitted/.test(x)).length,
      revenue,
      currency,
      avgApiMs: apiDurations.length ? Math.round(apiDurations.reduce((a, b) => a + b, 0) / apiDurations.length) : 0,
      maxInpMs: Math.round(maxInpMs),
      longTaskMs: Math.round(longTaskMs),
      intent,
      scores: scoreSession(stats),
      network,
      device,
      traffic,
      firstTouch,
      lastTouch,
      pathway,
    })
  }
  return sessions.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
}

function buildVisitorProfiles(sessions: XraySession[]) {
  const groups = new Map<string, XraySession[]>()
  for (const session of sessions) {
    if (!session.visitorKey) continue
    const current = groups.get(session.visitorKey) || []
    current.push(session)
    groups.set(session.visitorKey, current)
  }
  return [...groups.entries()].map(([visitorKey, values]): XrayVisitorProfile => {
    const ordered = [...values].sort((a, b) => new Date(a.firstSeen).getTime() - new Date(b.firstSeen).getTime())
    const last = ordered[ordered.length - 1]
    return {
      visitorKey,
      customerAccountId: values.map((x) => x.customerAccountId).find(Boolean) || null,
      known: values.some((x) => x.known),
      firstSeen: ordered[0]?.firstSeen || '',
      lastSeen: last?.lastSeen || '',
      sessions: values.length,
      activeNow: values.some((x) => x.active),
      pageViews: values.reduce((sum, x) => sum + x.pageViews, 0),
      clicks: values.reduce((sum, x) => sum + x.clicks, 0),
      searches: values.reduce((sum, x) => sum + x.searches, 0),
      businessEvents: values.reduce((sum, x) => sum + x.businessEvents, 0),
      conversions: values.reduce((sum, x) => sum + x.orders + x.bookingsConfirmed + x.demoSubmissions, 0),
      revenue: values.reduce((sum, x) => sum + x.revenue, 0),
      currency: values.map((x) => x.currency).find(Boolean) || null,
      countries: tally(values.map((x) => x.network.countryCode || '??')),
      devices: tally(values.map((x) => x.device.class)),
      sources: tally(values.map((x) => x.traffic.source)),
      intents: tally(values.map((x) => x.intent)),
      recentSessions: [...values].sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()).slice(0, 20),
    }
  }).sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
}

function buildRouteInsights(sessions: XraySession[]): XrayRouteInsight[] {
  const map = new Map<string, XraySession[]>()
  for (const session of sessions) {
    const routes = new Set([...session.pathway].filter((event) => ['page_view', 'session_start'].includes(event.kind)).map((event) => event.pathname))
    for (const route of routes) {
      if (!route) continue
      const values = map.get(route) || []
      values.push(session)
      map.set(route, values)
    }
  }
  return [...map.entries()].map(([route, values]) => {
    const events = values.flatMap((x) => x.pathway.filter((event) => event.pathname === route))
    const lcp = events.map((event) => num(event.metadata.lcpMs || object(event.metadata.navigation).lcpMs)).filter((x) => x > 0)
    return {
      route,
      sessions: values.length,
      active: values.filter((x) => x.active && x.currentPage === route).length,
      pageViews: events.filter((x) => ['page_view', 'session_start'].includes(x.kind)).length,
      clicks: events.filter((x) => x.kind === 'click').length,
      avgDurationSeconds: values.length ? Math.round(values.reduce((sum, x) => sum + x.durationSeconds, 0) / values.length) : 0,
      avgScroll: values.length ? Math.round(values.reduce((sum, x) => sum + x.maxScroll, 0) / values.length) : 0,
      errors: events.filter((x) => ['error', 'resource_error'].includes(x.kind)).length,
      apiFailures: events.filter((x) => x.kind === 'api_call' && (num(x.metadata.status) >= 400 || x.metadata.ok === false)).length,
      avgLcpMs: lcp.length ? Math.round(lcp.reduce((a, b) => a + b, 0) / lcp.length) : 0,
      exits: values.filter((x) => x.currentPage === route && !x.active).length,
      conversions: values.filter((x) => x.orders + x.bookingsConfirmed + x.demoSubmissions > 0).length,
    }
  }).sort((a, b) => b.sessions - a.sessions).slice(0, 120)
}

function buildTransitions(sessions: XraySession[]): XrayTransition[] {
  const map = new Map<string, number>()
  for (const session of sessions) {
    const routes = [...session.pathway].reverse().filter((event) => ['page_view', 'session_start'].includes(event.kind)).map((event) => event.pathname)
    for (let index = 0; index < routes.length - 1; index += 1) {
      const from = routes[index] || ''
      const to = routes[index + 1] || ''
      if (!from || !to || from === to) continue
      const key = `${from}\u0000${to}`
      map.set(key, (map.get(key) || 0) + 1)
    }
  }
  return [...map.entries()].map(([key, count]) => {
    const [from = '', to = ''] = key.split('\u0000')
    return { from, to, count }
  }).sort((a, b) => b.count - a.count).slice(0, 80)
}

function funnel(labelStages: Array<[string, string, (session: XraySession) => boolean]>, sessions: XraySession[]): XrayFunnelStage[] {
  const base = Math.max(1, sessions.length)
  return labelStages.map(([key, label, predicate]) => {
    const count = sessions.filter(predicate).length
    return { key, label, sessions: count, rate: Math.round((count / base) * 1000) / 10 }
  })
}

function hasBusiness(session: XraySession, pattern: RegExp) {
  return session.pathway.some((event) => pattern.test(text(event.metadata.businessEvent)))
}

function buildAlerts(sessions: XraySession[], routeInsights: XrayRouteInsight[]): XrayAlert[] {
  const alerts: XrayAlert[] = []
  const apiFailures = sessions.reduce((sum, s) => sum + s.apiFailures, 0)
  const errors = sessions.reduce((sum, s) => sum + s.errors + s.resourceErrors, 0)
  const rage = sessions.reduce((sum, s) => sum + s.rageClicks, 0)
  const checkouts = sessions.filter((s) => s.intent === 'checkout' || hasBusiness(s, /checkout\./)).length
  const checkoutCompleted = sessions.filter((s) => s.checkoutsCompleted > 0 || hasBusiness(s, /checkout\.completed/)).length
  if (apiFailures >= 3) alerts.push({ id: 'api-failures', level: apiFailures >= 10 ? 'critical' : 'warning', title: 'Échecs API observés', detail: `${apiFailures} appels API ont échoué dans la fenêtre.`, metric: 'apiFailures', value: apiFailures, workspaceHref: '/angelcare-marketplace/admin/operations/incidents' })
  if (errors >= 3) alerts.push({ id: 'client-errors', level: errors >= 10 ? 'critical' : 'warning', title: 'Friction technique frontend', detail: `${errors} erreurs navigateur ou ressources en échec.`, metric: 'errors', value: errors })
  if (rage >= 3) alerts.push({ id: 'rage-clicks', level: 'warning', title: 'Rage clicks', detail: `${rage} séquences de clics répétés détectées.`, metric: 'rageClicks', value: rage })
  if (checkouts >= 3 && checkoutCompleted === 0) alerts.push({ id: 'checkout-abandon', level: 'critical', title: 'Checkout sans conversion observée', detail: `${checkouts} sessions ont atteint le checkout sans confirmation détectée.`, metric: 'checkout', value: checkouts, workspaceHref: '/angelcare-marketplace/admin/orders' })
  const slow = routeInsights.filter((x) => x.avgLcpMs > 4000).slice(0, 3)
  for (const item of slow) alerts.push({ id: `slow-${item.route}`, level: 'warning', title: 'Route lente', detail: `${item.route} · LCP moyen ${item.avgLcpMs} ms.`, metric: 'lcp', value: item.avgLcpMs })
  if (!alerts.length) alerts.push({ id: 'healthy', level: 'success', title: 'Store X-Ray sain', detail: 'Aucun signal critique détecté dans la fenêtre.', metric: 'health', value: 1 })
  return alerts.slice(0, 12)
}

export async function getStoreXraySnapshot(_context: MarketplaceRequestContext, requestedMinutes = 30): Promise<XraySummary> {
  const minutes = Math.max(5, Math.min(1440, Math.round(requestedMinutes || 30)))
  const db = await createServiceClient()
  const since = new Date(Date.now() - minutes * 60_000).toISOString()
  const limit = minutes > 180 ? 10000 : 6000
  const { data, error } = await db
    .from('angelcare_marketplace_live_experience_interactions')
    .select('id,event_type,session_key,customer_account_id,pathname,locale,device_class,metadata,ip_hash,user_agent,created_at')
    .like('event_type', 'xray_%')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    if (missing(error)) {
      return { generatedAt: new Date().toISOString(), windowMinutes: minutes, truncated: false, activeNow: 0, sessions: 0, known: 0, anonymous: 0, countries: [], devices: [], sources: [], campaigns: [], intents: [], carts: 0, checkouts: 0, bookings: 0, demos: 0, orders: 0, searches: 0, errors: 0, apiFailures: 0, resourceErrors: 0, rageClicks: 0, deadClicks: 0, revenue: 0, currency: null, avgDurationSeconds: 0, avgPageViews: 0, avgLcpMs: 0, avgInpMs: 0, avgApiMs: 0, visitorProfiles: [], routeInsights: [], transitions: [], alerts: [], commerceFunnel: [], bookingFunnel: [], sanilaFunnel: [], sessionsLive: [], feed: [] }
    }
    fail('charger Live Store X-Ray', error)
  }
  const rows = (data || []) as Row[]
  const sessions = rowsToSessions(rows)
  const active = sessions.filter((s) => s.active)
  const visitorProfiles = buildVisitorProfiles(sessions)
  const routeInsights = buildRouteInsights(sessions)
  const transitions = buildTransitions(sessions)
  const feed: XrayFeedItem[] = rows.slice(0, 180).map((row) => {
    const metadata = object(row.metadata)
    const network = object(metadata.network)
    const kind = text(row.event_type).replace(/^xray_/, '')
    const pathname = text(row.pathname)
    return {
      id: text(row.id), at: text(row.created_at), sessionKey: text(row.session_key),
      countryCode: text(network.countryCode) || null, city: text(network.city) || null,
      deviceClass: text(row.device_class) || 'unknown', kind, pathname,
      label: eventLabel(kind, pathname, metadata), intent: eventIntent(pathname, metadata),
    }
  })
  const hasIntent = (session: XraySession, target: string) => session.intent === target || session.pathway.some((event) => event.intent === target)
  const lcpValues = sessions.flatMap((s) => s.pathway.map((event) => num(event.metadata.lcpMs || object(event.metadata.navigation).lcpMs))).filter((x) => x > 0)
  const inpValues = sessions.map((s) => s.maxInpMs).filter((x) => x > 0)
  const apiValues = sessions.map((s) => s.avgApiMs).filter((x) => x > 0)
  const businessCurrencies = sessions.map((s) => s.currency).filter((x): x is string => Boolean(x))
  const commerceFunnel = funnel([
    ['view', 'Produit / service consulté', (s) => ['product', 'service', 'course'].some((target) => hasIntent(s, target))],
    ['cart', 'Panier / intention', (s) => hasIntent(s, 'cart') || hasBusiness(s, /cart\.|basket\./)],
    ['checkout', 'Checkout démarré', (s) => hasIntent(s, 'checkout') || hasBusiness(s, /checkout\.started/)],
    ['converted', 'Conversion confirmée', (s) => s.orders > 0 || s.checkoutsCompleted > 0],
  ], sessions)
  const bookingFunnel = funnel([
    ['service', 'Service consulté', (s) => hasIntent(s, 'service')],
    ['booking', 'Réservation engagée', (s) => hasIntent(s, 'booking') || hasBusiness(s, /booking\.started|availability|slot/)],
    ['slot', 'Créneau / disponibilité', (s) => hasBusiness(s, /slot\.selected|availability\.selected|booking\.slot/)],
    ['confirmed', 'Réservation confirmée', (s) => s.bookingsConfirmed > 0 || hasBusiness(s, /booking\.confirmed/)],
  ], sessions)
  const sanilaFunnel = funnel([
    ['demo', 'Page démonstration', (s) => s.pathway.some((event) => /sanila.*demonstration|sanila.*demo/i.test(event.pathname))],
    ['form', 'Formulaire démarré', (s) => s.pathway.some((event) => event.kind === 'form_start' && /sanila/i.test(event.pathname))],
    ['steps', 'Progression formulaire', (s) => s.pathway.some((event) => event.kind === 'form_step' && /sanila/i.test(event.pathname))],
    ['submitted', 'Demande envoyée', (s) => s.demoSubmissions > 0 || hasBusiness(s, /demo\.submitted/)],
  ], sessions)
  const alerts = buildAlerts(sessions, routeInsights)
  return {
    generatedAt: new Date().toISOString(), windowMinutes: minutes, truncated: rows.length >= limit,
    activeNow: active.length, sessions: sessions.length,
    known: sessions.filter((s) => s.known).length,
    anonymous: sessions.filter((s) => !s.known).length,
    countries: tally(active.map((s) => s.network.countryCode || '??')).map(({ key, count }) => ({ code: key, count })),
    devices: tally(active.map((s) => s.device.class)),
    sources: tally(sessions.map((s) => s.traffic.source)),
    campaigns: tally(sessions.map((s) => s.traffic.campaign).filter(Boolean)),
    intents: tally(sessions.map((s) => s.intent)),
    carts: sessions.filter((s) => hasIntent(s, 'cart')).length,
    checkouts: sessions.filter((s) => hasIntent(s, 'checkout')).length,
    bookings: sessions.filter((s) => hasIntent(s, 'booking')).length,
    demos: sessions.filter((s) => hasIntent(s, 'demo')).length,
    orders: sessions.reduce((sum, s) => sum + s.orders, 0),
    searches: sessions.reduce((sum, s) => sum + s.searches, 0),
    errors: sessions.reduce((sum, s) => sum + s.errors, 0),
    apiFailures: sessions.reduce((sum, s) => sum + s.apiFailures, 0),
    resourceErrors: sessions.reduce((sum, s) => sum + s.resourceErrors, 0),
    rageClicks: sessions.reduce((sum, s) => sum + s.rageClicks, 0),
    deadClicks: sessions.reduce((sum, s) => sum + s.deadClicks, 0),
    revenue: Math.round(sessions.reduce((sum, s) => sum + s.revenue, 0) * 100) / 100,
    currency: businessCurrencies[0] || null,
    avgDurationSeconds: sessions.length ? Math.round(sessions.reduce((sum, s) => sum + s.durationSeconds, 0) / sessions.length) : 0,
    avgPageViews: sessions.length ? Math.round((sessions.reduce((sum, s) => sum + s.pageViews, 0) / sessions.length) * 10) / 10 : 0,
    avgLcpMs: lcpValues.length ? Math.round(lcpValues.reduce((a, b) => a + b, 0) / lcpValues.length) : 0,
    avgInpMs: inpValues.length ? Math.round(inpValues.reduce((a, b) => a + b, 0) / inpValues.length) : 0,
    avgApiMs: apiValues.length ? Math.round(apiValues.reduce((a, b) => a + b, 0) / apiValues.length) : 0,
    visitorProfiles: visitorProfiles.slice(0, 250), routeInsights, transitions, alerts,
    commerceFunnel, bookingFunnel, sanilaFunnel,
    sessionsLive: sessions.slice(0, 300), feed,
  }
}

export async function getVisitorXrayProfile(_context: MarketplaceRequestContext, visitorKey: string): Promise<XrayVisitorProfile | null> {
  const key = visitorKey.slice(0, 160)
  if (!key) return null
  const db = await createServiceClient()
  const since = new Date(Date.now() - 90 * 24 * 60 * 60_000).toISOString()
  const { data, error } = await db
    .from('angelcare_marketplace_live_experience_interactions')
    .select('id,event_type,session_key,customer_account_id,pathname,locale,device_class,metadata,ip_hash,user_agent,created_at')
    .like('event_type', 'xray_%')
    .contains('metadata', { visitorKey: key })
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5000)
  if (error) {
    if (missing(error)) return null
    fail('charger Visitor 360', error)
  }
  const sessions = rowsToSessions((data || []) as Row[])
  return buildVisitorProfiles(sessions)[0] || null
}
