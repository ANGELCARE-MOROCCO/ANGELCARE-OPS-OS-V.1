export type XrayEventKind =
  | 'session_start'
  | 'page_view'
  | 'heartbeat'
  | 'click'
  | 'rage_click'
  | 'dead_click'
  | 'form_start'
  | 'form_step'
  | 'form_invalid'
  | 'form_submit'
  | 'scroll'
  | 'search'
  | 'search_result'
  | 'api_call'
  | 'business_event'
  | 'resource_error'
  | 'performance'
  | 'web_vital'
  | 'error'
  | 'online'
  | 'offline'
  | 'exit'

export type XrayIntent =
  | 'browse'
  | 'product'
  | 'service'
  | 'course'
  | 'booking'
  | 'cart'
  | 'checkout'
  | 'order'
  | 'quote'
  | 'contact'
  | 'demo'
  | 'search'
  | 'support'

export interface XrayNetworkContext {
  ip: string | null
  ipHash: string | null
  countryCode: string | null
  country: string | null
  region: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  timezone: string | null
  asn: string | null
  networkOrganization: string | null
  edge: string | null
  forwarded: boolean
}

export interface XrayDeviceContext {
  class: string
  platform: string
  browser: string
  browserVersion: string
  os: string
  model: string
  language: string
  timezone: string
  screen: string
  viewport: string
  dpr: number
  touch: boolean
  connection: string
  memoryGb: number | null
  cores: number | null
}

export interface XrayTrafficContext {
  source: string
  medium: string
  campaign: string
  content: string
  term: string
  referrer: string
  referrerDomain: string
  landingPage: string
  clickIds: Record<string, string>
}

export interface XrayTimelineEvent {
  id: string
  kind: XrayEventKind | string
  at: string
  pathname: string
  title: string
  label: string
  intent: XrayIntent | string
  metadata: Record<string, unknown>
}

export interface XrayScore {
  value: number
  reasons: string[]
}

export interface XraySessionScores {
  intent: XrayScore
  engagement: XrayScore
  technical: XrayScore
  friction: XrayScore
}

export interface XraySession {
  sessionKey: string
  visitorKey: string
  customerAccountId: string | null
  known: boolean
  firstSeen: string
  lastSeen: string
  active: boolean
  durationSeconds: number
  currentPage: string
  previousPage: string | null
  landingPage: string
  pageViews: number
  uniquePages: number
  events: number
  maxScroll: number
  errors: number
  apiFailures: number
  resourceErrors: number
  rageClicks: number
  deadClicks: number
  formsStarted: number
  formSteps: number
  formInvalid: number
  formsSubmitted: number
  clicks: number
  searches: number
  businessEvents: number
  orders: number
  bookingsConfirmed: number
  checkoutsCompleted: number
  demoSubmissions: number
  revenue: number
  currency: string | null
  avgApiMs: number
  maxInpMs: number
  longTaskMs: number
  intent: XrayIntent | string
  scores: XraySessionScores
  network: XrayNetworkContext
  device: XrayDeviceContext
  traffic: XrayTrafficContext
  firstTouch: XrayTrafficContext | null
  lastTouch: XrayTrafficContext | null
  pathway: XrayTimelineEvent[]
}

export interface XrayFeedItem {
  id: string
  at: string
  sessionKey: string
  countryCode: string | null
  city: string | null
  deviceClass: string
  kind: string
  pathname: string
  label: string
  intent: string
}

export interface XrayVisitorProfile {
  visitorKey: string
  customerAccountId: string | null
  known: boolean
  firstSeen: string
  lastSeen: string
  sessions: number
  activeNow: boolean
  pageViews: number
  clicks: number
  searches: number
  businessEvents: number
  conversions: number
  revenue: number
  currency: string | null
  countries: Array<{ key: string; count: number }>
  devices: Array<{ key: string; count: number }>
  sources: Array<{ key: string; count: number }>
  intents: Array<{ key: string; count: number }>
  recentSessions: XraySession[]
}

export interface XrayRouteInsight {
  route: string
  sessions: number
  active: number
  pageViews: number
  clicks: number
  avgDurationSeconds: number
  avgScroll: number
  errors: number
  apiFailures: number
  avgLcpMs: number
  exits: number
  conversions: number
}

export interface XrayTransition {
  from: string
  to: string
  count: number
}

export interface XrayAlert {
  id: string
  level: 'info' | 'warning' | 'critical' | 'success'
  title: string
  detail: string
  metric: string
  value: number
  workspaceHref?: string
}

export interface XrayFunnelStage {
  key: string
  label: string
  sessions: number
  rate: number
}

export interface XraySummary {
  generatedAt: string
  windowMinutes: number
  truncated: boolean
  activeNow: number
  sessions: number
  known: number
  anonymous: number
  countries: Array<{ code: string; count: number }>
  devices: Array<{ key: string; count: number }>
  sources: Array<{ key: string; count: number }>
  campaigns: Array<{ key: string; count: number }>
  intents: Array<{ key: string; count: number }>
  carts: number
  checkouts: number
  bookings: number
  demos: number
  orders: number
  searches: number
  errors: number
  apiFailures: number
  resourceErrors: number
  rageClicks: number
  deadClicks: number
  revenue: number
  currency: string | null
  avgDurationSeconds: number
  avgPageViews: number
  avgLcpMs: number
  avgInpMs: number
  avgApiMs: number
  visitorProfiles: XrayVisitorProfile[]
  routeInsights: XrayRouteInsight[]
  transitions: XrayTransition[]
  alerts: XrayAlert[]
  commerceFunnel: XrayFunnelStage[]
  bookingFunnel: XrayFunnelStage[]
  sanilaFunnel: XrayFunnelStage[]
  sessionsLive: XraySession[]
  feed: XrayFeedItem[]
}
