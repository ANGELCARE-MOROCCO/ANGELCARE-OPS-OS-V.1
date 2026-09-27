'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Activity, AlertTriangle, ArrowRight, ArrowUpRight, BarChart3, BellRing, BookOpenCheck,
  CheckCircle2, ChevronRight, CircleDot, Clock3, Code2, Cpu, Eye, Filter, Fingerprint,
  Gauge, Globe2, Layers3, Laptop2, MapPin, MousePointer2, Network, Pause, Play, RefreshCw,
  Route, Search, ShieldCheck, ShoppingBag, Smartphone, Sparkles, Target, Tablet, TimerReset,
  TrendingUp, UserRound, UsersRound, X, Zap,
} from 'lucide-react'
import type { XraySession, XraySummary, XrayVisitorProfile } from './types'
import styles from './store-xray.module.css'

type ApiEnvelope<T> = { data?: T; error?: { message?: string } }
type Tab = 'live' | 'visitors' | 'journeys' | 'commerce' | 'discovery' | 'experience' | 'performance' | 'errors' | 'alerts' | 'capabilities'
type Segment = 'all' | 'active' | 'returning' | 'known' | 'high-intent' | 'friction' | 'errors' | 'sanila' | 'checkout' | 'booking'

const COUNTRY_POSITIONS: Record<string, [number, number]> = {
  MA: [45, 47], FR: [49, 37], ES: [46, 41], PT: [43, 41], BE: [50, 34], GB: [46, 30],
  DE: [53, 34], IT: [54, 43], NL: [51, 31], CH: [51, 39], US: [22, 38], CA: [20, 24],
  QA: [65, 51], AE: [68, 52], SA: [63, 54], DZ: [48, 51], TN: [53, 48], EG: [58, 52],
  SN: [38, 57], CI: [40, 64],
}

function flag(code: string | null | undefined) {
  if (!code || code.length !== 2 || code === '??') return '🌐'
  return String.fromCodePoint(...code.toUpperCase().split('').map((char) => 127397 + char.charCodeAt(0)))
}

function formatAgo(value: string) {
  const delta = Math.max(0, Date.now() - new Date(value).getTime())
  if (delta < 60_000) return `${Math.max(1, Math.round(delta / 1000))}s`
  if (delta < 3_600_000) return `${Math.round(delta / 60_000)}m`
  if (delta < 86_400_000) return `${Math.round(delta / 3_600_000)}h`
  return `${Math.round(delta / 86_400_000)}j`
}

function duration(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  if (minutes < 60) return `${minutes}m ${rest}s`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

function deviceIcon(value: string) {
  if (value === 'mobile') return Smartphone
  if (value === 'tablet') return Tablet
  return Laptop2
}

function prettySource(source: string) { return source === 'Direct' ? 'Direct' : source.replace(/^www\./, '') }
function routeFamily(pathname: string) {
  if (/sanila/i.test(pathname)) return 'SANILA'
  if (/academy|formation|course/i.test(pathname)) return 'Academy'
  if (/service|booking/i.test(pathname)) return 'Services'
  if (/product|catalog|produit/i.test(pathname)) return 'Produits'
  if (/cart|basket|checkout|panier/i.test(pathname)) return 'Commerce'
  return 'Marketplace'
}
function intentLabel(intent: string) {
  const labels: Record<string, string> = { browse: 'Exploration', product: 'Produit', service: 'Service', course: 'Formation', booking: 'Réservation', cart: 'Panier', checkout: 'Checkout', order: 'Commande', quote: 'Devis', contact: 'Contact', demo: 'Démo', search: 'Recherche', support: 'Support' }
  return labels[intent] || intent
}
function money(value: number, currency = 'MAD') { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value) }
function maskedIp(value: string | null) {
  if (!value) return 'IP non exposée'
  if (value.includes(':')) return `${value.split(':').slice(0, 2).join(':')}:••••`
  const parts = value.split('.')
  return parts.length === 4 ? `${parts[0]}.${parts[1]}.•••.${parts[3]}` : value
}
function boolMeta(value: unknown) { return value === true || value === 'true' }
function numMeta(value: unknown) { const n = Number(value); return Number.isFinite(n) ? n : 0 }
function textMeta(value: unknown) { return typeof value === 'string' ? value : '' }

const capabilities = [
  ['Live presence', ['Active now', 'Session age', 'Last activity', 'Current route', 'Previous route', 'Entry route', 'Exit signal', 'Known / anonymous', 'Returning visitor key', 'Cross-session visitor 360', 'Follow live session', 'Route family']],
  ['Network & geography', ['Raw IP privileged view', 'Masked IP default', 'Hashed IP', 'Country code', 'Country flag', 'Country', 'Region', 'City', 'Trusted latitude', 'Trusted longitude', 'Timezone', 'ASN header', 'Network organization header', 'Forwarded network', 'Edge request id']],
  ['Device', ['Desktop / mobile / tablet', 'Platform', 'Operating system', 'Browser', 'Browser version', 'Screen size', 'Viewport size', 'Device pixel ratio', 'Touch capability', 'Connection class', 'Device memory', 'CPU cores', 'Preferred language', 'Color scheme']],
  ['Acquisition', ['Traffic source', 'Referrer', 'Referrer domain', 'UTM source', 'UTM medium', 'UTM campaign', 'UTM content', 'UTM term', 'Click-id presence', 'Landing page', 'First-touch attribution', 'Last-touch attribution', 'Campaign X-Ray']],
  ['Journey', ['Ordered pathway', 'Page views', 'Unique pages', 'Page dwell proxy', 'Backtracking', 'Repeated routes', 'CTA clicks', 'Link destinations', 'Component analytics key', 'Section id', 'Entity id', 'Form start', 'Form step', 'Form validation failure', 'Form submit', 'Scroll 25%', 'Scroll 50%', 'Scroll 75%', 'Scroll 100%', 'Search phrase', 'Search result count', 'Session duration', 'Idle time', 'Cross-session history']],
  ['Commerce & intent', ['Product intent', 'Service intent', 'Course intent', 'Booking intent', 'Cart intent', 'Checkout intent', 'Order event', 'Quote intent', 'Contact intent', 'SANILA demo intent', 'Canonical API bridge', 'Business-event bridge', 'Conversion confirmation', 'Revenue attachment when returned', 'Booking funnel', 'Commerce funnel', 'SANILA funnel']],
  ['Friction', ['Rage-click detection', 'Dead-click high-confidence signal', 'Form invalid count', 'API failure correlation', 'Resource-load failure', 'Client error', 'Unhandled promise', 'Friction score', 'Technical score', 'Engagement score', 'Intent score']],
  ['Performance', ['DNS duration', 'Connect duration', 'TTFB', 'DOM interactive', 'DOMContentLoaded', 'Page load', 'Transfer size', 'Encoded body size', 'LCP', 'CLS', 'INP', 'Long tasks', 'API latency', 'Route performance X-Ray']],
  ['Analysis', ['Top transitions', 'Route X-Ray', 'Session comparison', 'Saved quick segments', 'Click-density heatmap', 'Scroll-depth curve', 'Exit analysis', 'Alert center', '24h time machine', 'Source breakdown', 'Device breakdown', 'Country breakdown']],
  ['Governance', ['Admin routes excluded', 'No input values captured', 'Sensitive query stripping', 'DNT respected', 'Buffered batching', 'sendBeacon exit flush', 'Rate limit', 'Hidden-tab live pause', 'Bounded admin snapshot', 'Marketplace analytics permission', 'No SQL migration', 'Existing telemetry table reused']],
] as const

export function StoreXrayCommand({ initial }: { initial: XraySummary }) {
  const [snapshot, setSnapshot] = useState(initial)
  const [tab, setTab] = useState<Tab>('live')
  const [selected, setSelected] = useState<XraySession | null>(null)
  const [follow, setFollow] = useState(false)
  const [query, setQuery] = useState('')
  const [device, setDevice] = useState('all')
  const [country, setCountry] = useState('all')
  const [intent, setIntent] = useState('all')
  const [segment, setSegment] = useState<Segment>('all')
  const [refreshMs, setRefreshMs] = useState(5000)
  const [paused, setPaused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lastError, setLastError] = useState('')
  const [windowMinutes, setWindowMinutes] = useState(initial.windowMinutes || 30)
  const [compare, setCompare] = useState<string[]>([])

  async function refresh() {
    if (document.visibilityState !== 'visible') return
    setLoading(true)
    try {
      const response = await fetch(`/api/angelcare-marketplace/analytics/xray/snapshot?window=${windowMinutes}`, { cache: 'no-store', credentials: 'same-origin' })
      const body = await response.json() as ApiEnvelope<XraySummary>
      if (!response.ok || !body.data) throw new Error(body.error?.message || 'Snapshot unavailable')
      setSnapshot(body.data)
      setLastError('')
      if (selected && follow) {
        const next = body.data.sessionsLive.find((session) => session.sessionKey === selected.sessionKey)
        if (next) setSelected(next)
      }
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Snapshot unavailable')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => { void refresh() }, refreshMs)
    return () => window.clearInterval(id)
  }, [paused, refreshMs, windowMinutes, selected?.sessionKey, follow])

  useEffect(() => {
    const onVisibility = () => { if (document.visibilityState === 'visible' && !paused) void refresh() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [paused, windowMinutes])

  const returningVisitors = useMemo(() => new Set(snapshot.visitorProfiles.filter((profile) => profile.sessions > 1).map((profile) => profile.visitorKey)), [snapshot.visitorProfiles])
  const filtered = useMemo(() => snapshot.sessionsLive.filter((session) => {
    const haystack = `${session.network.ip || ''} ${session.network.country || ''} ${session.network.city || ''} ${session.currentPage} ${session.traffic.source} ${session.traffic.campaign} ${session.device.browser} ${session.device.os} ${session.intent} ${session.sessionKey} ${session.visitorKey}`.toLowerCase()
    if (query && !haystack.includes(query.toLowerCase())) return false
    if (device !== 'all' && session.device.class !== device) return false
    if (country !== 'all' && (session.network.countryCode || '??') !== country) return false
    if (intent !== 'all' && session.intent !== intent) return false
    if (segment === 'active' && !session.active) return false
    if (segment === 'returning' && !returningVisitors.has(session.visitorKey)) return false
    if (segment === 'known' && !session.known) return false
    if (segment === 'high-intent' && session.scores.intent.value < 70) return false
    if (segment === 'friction' && session.scores.friction.value < 30) return false
    if (segment === 'errors' && session.errors + session.apiFailures + session.resourceErrors === 0) return false
    if (segment === 'sanila' && !session.pathway.some((event) => /sanila/i.test(event.pathname))) return false
    if (segment === 'checkout' && session.intent !== 'checkout' && !session.pathway.some((event) => /checkout/.test(textMeta(event.metadata.businessEvent)))) return false
    if (segment === 'booking' && session.intent !== 'booking' && !session.pathway.some((event) => /booking/.test(textMeta(event.metadata.businessEvent)))) return false
    return true
  }), [snapshot.sessionsLive, query, device, country, intent, segment, returningVisitors])

  const activeSessions = filtered.filter((session) => session.active)
  const mapPoints = snapshot.countries.slice(0, 24).map((item, index) => {
    const [x, y] = COUNTRY_POSITIONS[item.code] || [76 + (index % 5) * 3, 70 + Math.floor(index / 5) * 3]
    return { ...item, x, y }
  })
  const compareSessions = compare.map((key) => snapshot.sessionsLive.find((session) => session.sessionKey === key)).filter((value): value is XraySession => Boolean(value))

  const tabs: Array<[Tab, string]> = [
    ['live', 'Live Store'], ['visitors', 'Visiteurs'], ['journeys', 'Journeys'], ['commerce', 'Commerce'], ['discovery', 'Discovery'],
    ['experience', 'Experience'], ['performance', 'Performance'], ['errors', 'Erreurs'], ['alerts', `Alertes ${snapshot.alerts.filter((x) => x.level !== 'success').length || ''}`.trim()], ['capabilities', 'X-Ray MAX'],
  ]

  return <div className={styles.shell}>
    <section className={styles.hero}>
      <div className={styles.heroIdentity}>
        <div className={styles.eyebrow}><span className={styles.liveDot}/> MARKETPLACE INTELLIGENCE · LIVE STORE X-RAY MAX</div>
        <h1>Chaque visiteur. Chaque chemin. Chaque signal business et technique.</h1>
        <p>Présence live, Visitor 360, acquisition, parcours, conversion canonique, friction, performance et alertes — sans replay vidéo ni collecte de valeurs saisies.</p>
      </div>
      <div className={styles.heroControls}>
        <label className={styles.selectControl}><Clock3 size={14}/><select value={windowMinutes} onChange={(event) => setWindowMinutes(Number(event.target.value))}><option value={15}>15 min</option><option value={30}>30 min</option><option value={60}>1 h</option><option value={180}>3 h</option><option value={1440}>24 h</option></select></label>
        <div className={styles.speedControl}>{[5000, 15000, 30000].map((value) => <button key={value} className={refreshMs === value && !paused ? styles.speedActive : ''} onClick={() => { setRefreshMs(value); setPaused(false) }}>{value / 1000}s</button>)}<button className={paused ? styles.speedActive : ''} onClick={() => setPaused((value) => !value)} aria-label={paused ? 'Reprendre' : 'Pause'}>{paused ? <Play size={14}/> : <Pause size={14}/>}</button></div>
        <button className={styles.refreshButton} disabled={loading} onClick={() => void refresh()}><RefreshCw size={14} className={loading ? styles.spin : ''}/> Snapshot</button>
      </div>
    </section>

    <nav className={styles.tabs}>{tabs.map(([key, label]) => <button key={key} className={tab === key ? styles.tabActive : ''} onClick={() => setTab(key)}>{label}</button>)}<Link className={styles.tabLink} href="/angelcare-marketplace/admin/analytics/data-quality">Data Quality <ArrowUpRight size={12}/></Link></nav>
    {lastError ? <div className={styles.errorBanner}><AlertTriangle size={14}/>{lastError}</div> : null}
    {snapshot.truncated ? <div className={styles.warningBanner}><AlertTriangle size={14}/>Fenêtre volumineuse plafonnée au registre de sécurité. Réduisez la période pour une lecture exhaustive session par session.</div> : null}

    {tab === 'live' ? <>
      <section className={styles.kpiGridMax}>
        <Kpi icon={UsersRound} label="Live maintenant" value={snapshot.activeNow} note={`${snapshot.known} connus · ${snapshot.anonymous} anonymes`} emphasis/>
        <Kpi icon={Target} label="High intent" value={snapshot.sessionsLive.filter((s) => s.scores.intent.value >= 70).length} note="score d'intention ≥ 70"/>
        <Kpi icon={ShoppingBag} label="Commerce actif" value={snapshot.carts + snapshot.checkouts + snapshot.bookings} note={`${snapshot.checkouts} checkout · ${snapshot.bookings} booking`}/>
        <Kpi icon={CheckCircle2} label="Conversions observées" value={snapshot.orders + snapshot.sessionsLive.reduce((s, x) => s + x.bookingsConfirmed + x.demoSubmissions, 0)} note={snapshot.revenue > 0 ? money(snapshot.revenue, snapshot.currency || 'MAD') : 'résultats canoniques détectés'}/>
        <Kpi icon={Search} label="Recherches" value={snapshot.searches} note={`${snapshot.sources.length} sources observées`}/>
        <Kpi icon={Zap} label="Friction" value={snapshot.rageClicks + snapshot.deadClicks + snapshot.apiFailures} note={`${snapshot.apiFailures} API · ${snapshot.rageClicks} rage`} risk={snapshot.apiFailures > 0}/>
        <Kpi icon={Gauge} label="Web UX" value={`${snapshot.avgLcpMs || 0} ms`} note={`LCP · INP ${snapshot.avgInpMs || 0} ms`}/>
        <Kpi icon={Network} label="API latency" value={`${snapshot.avgApiMs || 0} ms`} note={`${snapshot.resourceErrors} ressources en échec`}/>
      </section>

      <AlertStrip alerts={snapshot.alerts} onOpen={() => setTab('alerts')}/>

      <section className={styles.liveGrid}>
        <article className={styles.mapCard}>
          <div className={styles.cardHead}><div><small>LIVE GEOGRAPHY</small><h2>Présence mondiale</h2></div><span className={styles.livePill}><span className={styles.liveDot}/>{snapshot.activeNow} actifs</span></div>
          <div className={styles.worldMap}><div className={styles.mapGrid}/><div className={`${styles.continent} ${styles.c1}`}/><div className={`${styles.continent} ${styles.c2}`}/><div className={`${styles.continent} ${styles.c3}`}/><div className={`${styles.continent} ${styles.c4}`}/><div className={`${styles.continent} ${styles.c5}`}/>{mapPoints.map((point) => <button key={point.code} className={styles.mapPoint} style={{ left: `${point.x}%`, top: `${point.y}%` }} title={`${point.code} · ${point.count}`} onClick={() => { setCountry(point.code); setTab('visitors') }}>{point.count}</button>)}<span className={styles.mapCaption}>Trusted edge geo quand latitude/longitude sont disponibles · fallback pays pour la visualisation</span></div>
          <div className={styles.countryStrip}>{snapshot.countries.slice(0, 10).map((item) => <button key={item.code} onClick={() => { setCountry(item.code); setTab('visitors') }}><span>{flag(item.code)}</span><strong>{item.code}</strong><em>{item.count}</em></button>)}</div>
        </article>
        <article className={styles.feedCard}><div className={styles.cardHead}><div><small>LIVE PATH STREAM</small><h2>Ce qui se passe maintenant</h2></div><Activity size={18}/></div><div className={styles.feed}>{snapshot.feed.slice(0, 24).map((item) => <button key={item.id} onClick={() => setSelected(snapshot.sessionsLive.find((s) => s.sessionKey === item.sessionKey) || null)}><span className={styles.feedTime}>{new Date(item.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span><span className={styles.feedFlag}>{flag(item.countryCode)}</span><span className={styles.feedCopy}><strong>{item.label}</strong><small>{item.pathname}</small></span><span className={styles.intent} data-intent={item.intent}>{intentLabel(item.intent)}</span></button>)}</div></article>
      </section>

      <section className={styles.panel}><div className={styles.cardHead}><div><small>ACTIVE VISITORS</small><h2>Visiteurs dans le magasin</h2></div><button className={styles.linkButton} onClick={() => setTab('visitors')}>Tout voir <ChevronRight size={14}/></button></div><VisitorTable sessions={activeSessions.slice(0, 14)} onOpen={setSelected} compare={compare} onCompare={setCompare}/></section>
      <section className={styles.breakdownGrid}><Breakdown title="Sources" icon={Route} items={snapshot.sources}/><Breakdown title="Appareils" icon={Smartphone} items={snapshot.devices}/><Breakdown title="Intentions" icon={MousePointer2} items={snapshot.intents.map((item) => ({ ...item, key: intentLabel(item.key) }))}/></section>
    </> : null}

    {tab === 'visitors' ? <section className={styles.panel}>
      <VisitorToolbar filtered={filtered.length} snapshot={snapshot} query={query} setQuery={setQuery} country={country} setCountry={setCountry} device={device} setDevice={setDevice} intent={intent} setIntent={setIntent} segment={segment} setSegment={setSegment} reset={() => { setQuery(''); setCountry('all'); setDevice('all'); setIntent('all'); setSegment('all') }}/>
      <SegmentBar segment={segment} setSegment={setSegment}/>
      {compareSessions.length >= 2 ? <CompareSessions sessions={compareSessions} clear={() => setCompare([])}/> : null}
      <VisitorTable sessions={filtered} onOpen={setSelected} compare={compare} onCompare={setCompare}/>
    </section> : null}

    {tab === 'journeys' ? <JourneysPanel snapshot={snapshot} sessions={filtered} onOpen={setSelected}/> : null}
    {tab === 'commerce' ? <CommercePanel snapshot={snapshot} sessions={filtered} onOpen={setSelected}/> : null}
    {tab === 'discovery' ? <DiscoveryPanel snapshot={snapshot} sessions={filtered} onOpen={setSelected}/> : null}
    {tab === 'experience' ? <ExperiencePanel sessions={filtered} onOpen={setSelected}/> : null}
    {tab === 'performance' ? <PerformancePanel snapshot={snapshot} sessions={filtered} onOpen={setSelected}/> : null}
    {tab === 'errors' ? <ErrorsPanel sessions={filtered.filter((s) => s.errors + s.apiFailures + s.resourceErrors > 0)} onOpen={setSelected}/> : null}
    {tab === 'alerts' ? <AlertsPanel snapshot={snapshot}/> : null}
    {tab === 'capabilities' ? <CapabilitiesPanel/> : null}

    {selected ? <SessionDrawer session={selected} follow={follow} setFollow={setFollow} onClose={() => { setSelected(null); setFollow(false) }}/> : null}
  </div>
}

function Kpi({ icon: Icon, label, value, note, emphasis = false, risk = false }: { icon: typeof Eye; label: string; value: string | number; note: string; emphasis?: boolean; risk?: boolean }) {
  return <article className={styles.kpi} data-emphasis={emphasis} data-risk={risk}><div className={styles.kpiIcon}><Icon size={17}/></div><div><small>{label}</small><strong>{value}</strong><span>{note}</span></div></article>
}

function AlertStrip({ alerts, onOpen }: { alerts: XraySummary['alerts']; onOpen: () => void }) {
  const critical = alerts.find((item) => item.level === 'critical') || alerts.find((item) => item.level === 'warning') || alerts[0]
  if (!critical) return null
  return <button className={styles.alertStrip} data-level={critical.level} onClick={onOpen}><div><BellRing size={16}/><strong>{critical.title}</strong><span>{critical.detail}</span></div><ChevronRight size={16}/></button>
}

function SegmentBar({ segment, setSegment }: { segment: Segment; setSegment: (value: Segment) => void }) {
  const values: Array<[Segment, string]> = [['all', 'Tous'], ['active', 'Live'], ['returning', 'Returning'], ['known', 'Clients'], ['high-intent', 'High intent'], ['friction', 'Friction'], ['errors', 'Errors'], ['sanila', 'SANILA'], ['checkout', 'Checkout'], ['booking', 'Booking']]
  return <div className={styles.segmentBar}>{values.map(([key, label]) => <button key={key} className={segment === key ? styles.segmentActive : ''} onClick={() => setSegment(key)}>{label}</button>)}</div>
}

function VisitorToolbar(props: { filtered: number; snapshot: XraySummary; query: string; setQuery: (v: string) => void; country: string; setCountry: (v: string) => void; device: string; setDevice: (v: string) => void; intent: string; setIntent: (v: string) => void; segment: Segment; setSegment: (v: Segment) => void; reset: () => void }) {
  return <div className={styles.visitorToolbar}><div><small>SESSION EXPLORER · CROSS-SESSION AWARE</small><h2>{props.filtered} sessions visibles</h2></div><div className={styles.filters}><label><Search size={14}/><input value={props.query} onChange={(event) => props.setQuery(event.target.value)} placeholder="IP, ville, route, campagne, visitor…"/></label><select value={props.country} onChange={(event) => props.setCountry(event.target.value)}><option value="all">Tous pays</option>{props.snapshot.countries.map((item) => <option value={item.code} key={item.code}>{flag(item.code)} {item.code} · {item.count}</option>)}</select><select value={props.device} onChange={(event) => props.setDevice(event.target.value)}><option value="all">Tous appareils</option><option value="desktop">Desktop</option><option value="mobile">Mobile</option><option value="tablet">Tablet</option></select><select value={props.intent} onChange={(event) => props.setIntent(event.target.value)}><option value="all">Toutes intentions</option>{props.snapshot.intents.map((item) => <option value={item.key} key={item.key}>{intentLabel(item.key)} · {item.count}</option>)}</select><button onClick={props.reset}><Filter size={14}/> Reset</button></div></div>
}

function VisitorTable({ sessions, onOpen, compare, onCompare }: { sessions: XraySession[]; onOpen: (session: XraySession) => void; compare: string[]; onCompare: (value: string[]) => void }) {
  const toggle = (key: string) => onCompare(compare.includes(key) ? compare.filter((x) => x !== key) : [...compare.slice(-9), key])
  return <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Cmp</th><th>Live</th><th>Visiteur</th><th>Réseau</th><th>Appareil</th><th>Source</th><th>Page actuelle</th><th>Scores</th><th>Intent</th><th/></tr></thead><tbody>{sessions.length ? sessions.map((session) => {
    const Device = deviceIcon(session.device.class)
    return <tr key={session.sessionKey} onDoubleClick={() => onOpen(session)}><td><input type="checkbox" aria-label="Comparer" checked={compare.includes(session.sessionKey)} onChange={() => toggle(session.sessionKey)}/></td><td><span className={session.active ? styles.activePulse : styles.inactivePulse}/>{formatAgo(session.lastSeen)}</td><td><div className={styles.identityCell}><span>{flag(session.network.countryCode)}</span><div><strong>{session.known ? 'Client connu' : 'Visiteur anonyme'}</strong><small>{session.network.city || session.network.country || 'Localisation indisponible'} · {session.visitorKey.slice(0, 12)}</small></div></div></td><td><strong className={styles.mono}>{maskedIp(session.network.ip)}</strong><small>{session.network.asn || session.network.region || session.network.countryCode || '—'}</small></td><td><div className={styles.deviceCell}><Device size={15}/><div><strong>{session.device.class}</strong><small>{session.device.browser} · {session.device.os}</small></div></div></td><td><strong>{prettySource(session.traffic.source)}</strong><small>{session.traffic.campaign || session.traffic.medium || '—'}</small></td><td><strong>{routeFamily(session.currentPage)}</strong><small className={styles.routeText}>{session.currentPage}</small></td><td><ScorePills session={session}/></td><td><span className={styles.intent} data-intent={session.intent}>{intentLabel(session.intent)}</span></td><td><button className={styles.rowAction} onClick={() => onOpen(session)} aria-label="Ouvrir X-Ray"><Eye size={15}/></button></td></tr>
  }) : <tr><td colSpan={10}><div className={styles.empty}><Eye size={20}/><strong>Aucune session pour ces filtres.</strong><span>Les nouveaux événements apparaîtront ici automatiquement.</span></div></td></tr>}</tbody></table></div>
}

function ScorePills({ session }: { session: XraySession }) {
  return <div className={styles.scorePills}><span data-score={session.scores.intent.value >= 70 ? 'high' : 'normal'}>I {session.scores.intent.value}</span><span>E {session.scores.engagement.value}</span><span data-score={session.scores.friction.value >= 30 ? 'risk' : 'normal'}>F {session.scores.friction.value}</span></div>
}

function Breakdown({ title, icon: Icon, items }: { title: string; icon: typeof Route; items: Array<{ key: string; count: number }> }) {
  const max = Math.max(1, ...items.map((item) => item.count))
  return <article className={styles.breakdown}><div className={styles.cardHead}><div><small>BREAKDOWN</small><h3>{title}</h3></div><Icon size={17}/></div><div className={styles.barList}>{items.slice(0, 9).map((item) => <div key={item.key}><div><span>{item.key}</span><strong>{item.count}</strong></div><i><b style={{ width: `${Math.max(5, item.count / max * 100)}%` }}/></i></div>)}</div></article>
}

function CompareSessions({ sessions, clear }: { sessions: XraySession[]; clear: () => void }) {
  return <section className={styles.comparePanel}><div className={styles.cardHead}><div><small>SESSION COMPARE</small><h3>{sessions.length} sessions comparées</h3></div><button className={styles.linkButton} onClick={clear}><X size={13}/> Effacer</button></div><div className={styles.compareGrid}>{sessions.map((session) => <article key={session.sessionKey}><div><span>{flag(session.network.countryCode)}</span><strong>{session.network.city || session.network.countryCode || '—'}</strong><em>{session.device.class}</em></div><dl><div><dt>Source</dt><dd>{prettySource(session.traffic.source)}</dd></div><div><dt>Pages</dt><dd>{session.pageViews}</dd></div><div><dt>Durée</dt><dd>{duration(session.durationSeconds)}</dd></div><div><dt>Intent</dt><dd>{session.scores.intent.value}/100</dd></div><div><dt>Friction</dt><dd>{session.scores.friction.value}/100</dd></div><div><dt>API fail</dt><dd>{session.apiFailures}</dd></div></dl></article>)}</div></section>
}

function Funnel({ title, stages }: { title: string; stages: XraySummary['commerceFunnel'] }) {
  const max = Math.max(1, ...stages.map((stage) => stage.sessions))
  return <article className={styles.funnel}><div className={styles.cardHead}><div><small>FUNNEL</small><h3>{title}</h3></div><TrendingUp size={16}/></div>{stages.map((stage, index) => <div key={stage.key} className={styles.funnelStage}><div><span>{index + 1}</span><strong>{stage.label}</strong><em>{stage.sessions} · {stage.rate}%</em></div><i><b style={{ width: `${Math.max(4, stage.sessions / max * 100)}%` }}/></i></div>)}</article>
}

function JourneysPanel({ snapshot, sessions, onOpen }: { snapshot: XraySummary; sessions: XraySession[]; onOpen: (s: XraySession) => void }) {
  return <div className={styles.stack}><section className={styles.funnelGrid}><Funnel title="Commerce" stages={snapshot.commerceFunnel}/><Funnel title="Booking" stages={snapshot.bookingFunnel}/><Funnel title="SANILA Demo" stages={snapshot.sanilaFunnel}/></section><section className={styles.journeyGrid}><article className={styles.panel}><div className={styles.cardHead}><div><small>TOP TRANSITIONS</small><h2>Chemins agrégés</h2></div><Route size={18}/></div><div className={styles.transitionList}>{snapshot.transitions.slice(0, 20).map((item) => <div key={`${item.from}-${item.to}`}><span>{item.from.replace('/angelcare-marketplace', '') || '/'}</span><ArrowRight size={12}/><strong>{item.to.replace('/angelcare-marketplace', '') || '/'}</strong><em>{item.count}</em></div>)}</div></article><article className={styles.panel}><div className={styles.cardHead}><div><small>ROUTE XRAY</small><h2>Pages observées</h2></div><Layers3 size={18}/></div><RouteInsightTable snapshot={snapshot}/></article></section><section className={styles.panel}><div className={styles.cardHead}><div><small>SESSION PATHWAYS</small><h2>Parcours individuels</h2></div><Fingerprint size={18}/></div><div className={styles.pathwayGrid}>{sessions.slice(0, 36).map((session) => <button key={session.sessionKey} className={styles.pathCard} onClick={() => onOpen(session)}><div className={styles.pathTop}><span>{flag(session.network.countryCode)} {session.network.city || session.network.country || 'Inconnu'}</span><span>{formatAgo(session.lastSeen)}</span></div><strong>{session.landingPage}</strong><div className={styles.pathLine}>{[...session.pathway].reverse().filter((event) => event.kind === 'page_view' || event.kind === 'session_start').slice(0, 8).map((event, index) => <span key={event.id}>{index ? <ChevronRight size={11}/> : null}<em>{event.pathname.replace('/angelcare-marketplace', '') || '/'}</em></span>)}</div><div className={styles.pathStats}><span>{session.pageViews} pages</span><span>{duration(session.durationSeconds)}</span><span>{session.clicks} clics</span><span>I {session.scores.intent.value}</span><span>F {session.scores.friction.value}</span></div></button>)}</div></section></div>
}

function RouteInsightTable({ snapshot }: { snapshot: XraySummary }) {
  return <div className={styles.routeInsightTable}>{snapshot.routeInsights.slice(0, 20).map((item) => <a key={item.route} href={item.route} target="_blank" rel="noreferrer"><div><strong>{item.route.replace('/angelcare-marketplace', '') || '/'}</strong><small>{item.sessions} sessions · {item.active} live</small></div><span>{item.avgScroll}% scroll</span><span>{item.avgLcpMs ? `${item.avgLcpMs}ms LCP` : 'LCP —'}</span><span data-risk={item.errors + item.apiFailures > 0}>{item.errors + item.apiFailures} err</span><ArrowUpRight size={13}/></a>)}</div>
}

function CommercePanel({ snapshot, sessions, onOpen }: { snapshot: XraySummary; sessions: XraySession[]; onOpen: (s: XraySession) => void }) {
  const commerce = sessions.filter((s) => s.businessEvents > 0 || ['product','service','course','cart','checkout','booking','order','quote','demo'].includes(s.intent))
  return <div className={styles.stack}><section className={styles.kpiGridMax}><Kpi icon={ShoppingBag} label="Panier" value={snapshot.carts} note="sessions avec intention panier"/><Kpi icon={Target} label="Checkout" value={snapshot.checkouts} note="checkout observé"/><Kpi icon={BookOpenCheck} label="Booking" value={snapshot.bookings} note="réservation observée"/><Kpi icon={CheckCircle2} label="Orders" value={snapshot.orders} note="événements order canoniques"/><Kpi icon={TrendingUp} label="Revenue attaché" value={snapshot.revenue ? money(snapshot.revenue, snapshot.currency || 'MAD') : '—'} note="uniquement si retourné par l'autorité"/><Kpi icon={Sparkles} label="SANILA demos" value={snapshot.demos} note="intentions / submissions"/></section><section className={styles.funnelGrid}><Funnel title="Commerce" stages={snapshot.commerceFunnel}/><Funnel title="Booking" stages={snapshot.bookingFunnel}/><Funnel title="SANILA" stages={snapshot.sanilaFunnel}/></section><section className={styles.panel}><div className={styles.cardHead}><div><small>CANONICAL BUSINESS BRIDGE</small><h2>Sessions business observées</h2></div><ShoppingBag size={18}/></div><BusinessSessionList sessions={commerce} onOpen={onOpen}/></section></div>
}

function BusinessSessionList({ sessions, onOpen }: { sessions: XraySession[]; onOpen: (s: XraySession) => void }) {
  return <div className={styles.businessList}>{sessions.slice(0, 60).map((session) => <button key={session.sessionKey} onClick={() => onOpen(session)}><span>{flag(session.network.countryCode)}</span><div><strong>{intentLabel(session.intent)} · {session.currentPage}</strong><small>{session.businessEvents} business events · {session.apiFailures} API fail · {session.revenue ? money(session.revenue, session.currency || 'MAD') : 'revenu non attaché'}</small></div><ScorePills session={session}/><ChevronRight size={15}/></button>)}</div>
}

function DiscoveryPanel({ snapshot, sessions, onOpen }: { snapshot: XraySummary; sessions: XraySession[]; onOpen: (s: XraySession) => void }) {
  const searchSessions = sessions.filter((s) => s.searches > 0 || s.intent === 'search')
  const zeroResults = searchSessions.filter((s) => s.pathway.some((event) => event.kind === 'search_result' && numMeta(event.metadata.resultCount) === 0))
  return <div className={styles.stack}><section className={styles.breakdownGrid}><Breakdown title="Sources" icon={Globe2} items={snapshot.sources}/><Breakdown title="Campagnes" icon={Target} items={snapshot.campaigns.length ? snapshot.campaigns : [{ key: 'Aucune campagne UTM', count: 0 }]}/><Breakdown title="Pays live" icon={MapPin} items={snapshot.countries.map((x) => ({ key: `${flag(x.code)} ${x.code}`, count: x.count }))}/></section><section className={styles.kpiGridMax}><Kpi icon={Search} label="Search events" value={snapshot.searches} note={`${searchSessions.length} sessions`}/><Kpi icon={AlertTriangle} label="Zero results" value={zeroResults.length} note="résultat count=0 détecté" risk={zeroResults.length > 0}/><Kpi icon={Route} label="Sources" value={snapshot.sources.length} note="canaux observés"/><Kpi icon={Target} label="Campaigns" value={snapshot.campaigns.length} note="utm_campaign distinctes"/></section><section className={styles.panel}><div className={styles.cardHead}><div><small>SEARCH & DISCOVERY</small><h2>Sessions de découverte</h2></div><Search size={18}/></div><BusinessSessionList sessions={searchSessions} onOpen={onOpen}/></section></div>
}

function ExperiencePanel({ sessions, onOpen }: { sessions: XraySession[]; onOpen: (s: XraySession) => void }) {
  const clicks = sessions.flatMap((session) => session.pathway.filter((event) => event.kind === 'click').map((event) => ({ session, x: numMeta(event.metadata.xPct), y: numMeta(event.metadata.yPct), label: event.label })).filter((x) => x.x >= 0 && x.y >= 0))
  const scrolls = [25, 50, 75, 100].map((depth) => ({ depth, count: sessions.filter((session) => session.maxScroll >= depth).length }))
  const friction = [...sessions].sort((a, b) => b.scores.friction.value - a.scores.friction.value).filter((s) => s.scores.friction.value > 0).slice(0, 30)
  return <div className={styles.stack}><section className={styles.experienceGrid}><article className={styles.panel}><div className={styles.cardHead}><div><small>PRIVACY-SAFE CLICK DENSITY</small><h2>Heatmap agrégée viewport</h2></div><MousePointer2 size={18}/></div><div className={styles.heatmap}>{clicks.slice(0, 700).map((item, index) => <i key={`${item.session.sessionKey}-${index}`} title={item.label} style={{ left: `${item.x}%`, top: `${item.y}%`, opacity: .18 + Math.min(.65, index / Math.max(1, clicks.length)) }}/>) }<span>Aucune valeur de champ · aucune vidéo · points normalisés</span></div></article><article className={styles.panel}><div className={styles.cardHead}><div><small>SCROLL DEPTH</small><h2>Lecture des pages</h2></div><Eye size={18}/></div><div className={styles.scrollCurve}>{scrolls.map((item) => <div key={item.depth}><span>{item.depth}%</span><i><b style={{ width: `${sessions.length ? item.count / sessions.length * 100 : 0}%` }}/></i><strong>{item.count}</strong></div>)}</div></article></section><section className={styles.panel}><div className={styles.cardHead}><div><small>FRICTION XRAY</small><h2>Sessions à inspecter</h2></div><Zap size={18}/></div><div className={styles.frictionList}>{friction.length ? friction.map((session) => <button key={session.sessionKey} onClick={() => onOpen(session)}><span>{flag(session.network.countryCode)}</span><div><strong>Friction {session.scores.friction.value}/100 · {session.currentPage}</strong><small>{session.rageClicks} rage · {session.deadClicks} dead · {session.apiFailures} API · {session.formInvalid} invalid</small></div><ChevronRight size={15}/></button>) : <div className={styles.empty}><ShieldCheck size={20}/><strong>Aucune friction détectée.</strong></div>}</div></section></div>
}

function PerformancePanel({ snapshot, sessions, onOpen }: { snapshot: XraySummary; sessions: XraySession[]; onOpen: (s: XraySession) => void }) {
  const degraded = [...sessions].sort((a, b) => a.scores.technical.value - b.scores.technical.value).filter((s) => s.scores.technical.value < 90).slice(0, 30)
  return <div className={styles.stack}><section className={styles.kpiGridMax}><Kpi icon={Gauge} label="LCP moyen" value={`${snapshot.avgLcpMs} ms`} note="Largest Contentful Paint" risk={snapshot.avgLcpMs > 4000}/><Kpi icon={MousePointer2} label="INP moyen" value={`${snapshot.avgInpMs} ms`} note="Interaction to Next Paint" risk={snapshot.avgInpMs > 500}/><Kpi icon={Network} label="API moyen" value={`${snapshot.avgApiMs} ms`} note="latence same-origin observée"/><Kpi icon={AlertTriangle} label="API failures" value={snapshot.apiFailures} note="status ≥ 400" risk={snapshot.apiFailures > 0}/><Kpi icon={Code2} label="Resource errors" value={snapshot.resourceErrors} note="img/script/css" risk={snapshot.resourceErrors > 0}/><Kpi icon={Cpu} label="Routes lentes" value={snapshot.routeInsights.filter((x) => x.avgLcpMs > 4000).length} note="LCP moyen > 4s"/></section><section className={styles.journeyGrid}><article className={styles.panel}><div className={styles.cardHead}><div><small>ROUTE PERFORMANCE</small><h2>Routes à surveiller</h2></div><Gauge size={18}/></div><RouteInsightTable snapshot={snapshot}/></article><article className={styles.panel}><div className={styles.cardHead}><div><small>TECHNICAL SESSION QUALITY</small><h2>Sessions dégradées</h2></div><Cpu size={18}/></div><div className={styles.frictionList}>{degraded.map((session) => <button key={session.sessionKey} onClick={() => onOpen(session)}><span>{session.scores.technical.value}</span><div><strong>{session.currentPage}</strong><small>{session.apiFailures} API · {session.errors} JS · INP {session.maxInpMs}ms</small></div><ChevronRight size={15}/></button>)}</div></article></section></div>
}

function ErrorsPanel({ sessions, onOpen }: { sessions: XraySession[]; onOpen: (session: XraySession) => void }) {
  return <section className={styles.panel}><div className={styles.cardHead}><div><small>FAILURE CORRELATION XRAY</small><h2>Erreurs, API et ressources corrélées au parcours</h2></div><AlertTriangle size={18}/></div>{sessions.length ? <div className={styles.errorList}>{sessions.map((session) => <button key={session.sessionKey} onClick={() => onOpen(session)}><span>{flag(session.network.countryCode)}</span><div><strong>{session.errors} JS · {session.apiFailures} API · {session.resourceErrors} resource · {session.currentPage}</strong><small>{session.device.browser} · {session.device.os} · {prettySource(session.traffic.source)} · Technical {session.scores.technical.value}/100</small></div><ChevronRight size={16}/></button>)}</div> : <div className={styles.empty}><ShieldCheck size={22}/><strong>Aucune erreur technique dans la fenêtre sélectionnée.</strong></div>}</section>
}

function AlertsPanel({ snapshot }: { snapshot: XraySummary }) {
  return <section className={styles.panel}><div className={styles.cardHead}><div><small>DETERMINISTIC ALERT CENTER</small><h2>Signaux qui demandent l'œil opérateur</h2></div><BellRing size={18}/></div><div className={styles.alertList}>{snapshot.alerts.map((alert) => <article key={alert.id} data-level={alert.level}><div><span/><strong>{alert.title}</strong><small>{alert.detail}</small></div><em>{alert.value}</em>{alert.workspaceHref ? <a href={alert.workspaceHref} target="_blank" rel="noreferrer">Workspace <ArrowUpRight size={12}/></a> : null}</article>)}</div></section>
}

function CapabilitiesPanel() {
  const total = capabilities.reduce((sum, [, items]) => sum + items.length, 0)
  return <section className={styles.panel}><div className={styles.cardHead}><div><small>XRAY MAX CAPABILITY REGISTER</small><h2>{total} capacités exposées / certifiables</h2></div><Sparkles size={18}/></div><div className={styles.capabilityGrid}>{capabilities.map(([group, items]) => <article key={group}><div><CircleDot size={14}/><strong>{group}</strong><span>{items.length}</span></div><ul>{items.map((item) => <li key={item}><ShieldCheck size={12}/>{item}</li>)}</ul></article>)}</div></section>
}

function SessionDrawer({ session, follow, setFollow, onClose }: { session: XraySession; follow: boolean; setFollow: (v: boolean) => void; onClose: () => void }) {
  const Device = deviceIcon(session.device.class)
  const [copied, setCopied] = useState(false)
  const [revealIp, setRevealIp] = useState(false)
  const [drawerTab, setDrawerTab] = useState<'session'|'journey'|'commerce'|'technical'|'visitor'>('session')
  const [visitor, setVisitor] = useState<XrayVisitorProfile | null>(null)
  const [visitorLoading, setVisitorLoading] = useState(false)
  const copy = async () => { await navigator.clipboard.writeText(session.sessionKey); setCopied(true); window.setTimeout(() => setCopied(false), 1200) }
  useEffect(() => {
    setVisitor(null)
    if (!session.visitorKey) return
    setVisitorLoading(true)
    void fetch(`/api/angelcare-marketplace/analytics/xray/visitor/${encodeURIComponent(session.visitorKey)}`, { cache: 'no-store', credentials: 'same-origin' })
      .then((res) => res.json() as Promise<ApiEnvelope<XrayVisitorProfile | null>>)
      .then((body) => setVisitor(body.data || null)).catch(() => setVisitor(null)).finally(() => setVisitorLoading(false))
  }, [session.visitorKey])
  const business = session.pathway.filter((event) => event.kind === 'business_event')
  const api = session.pathway.filter((event) => event.kind === 'api_call')
  const technical = session.pathway.filter((event) => ['error','resource_error','api_call','performance','web_vital','rage_click','dead_click','form_invalid'].includes(event.kind))
  return <div className={styles.drawerBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><aside className={styles.drawer} aria-label="Visitor X-Ray MAX">
    <div className={styles.drawerHead}><div><small>VISITOR SESSION XRAY MAX</small><h2>{flag(session.network.countryCode)} {session.network.city || session.network.country || 'Visiteur'}</h2><p>{session.known ? 'Client connu' : 'Visiteur anonyme'} · actif il y a {formatAgo(session.lastSeen)} · Intent {session.scores.intent.value}/100</p></div><button onClick={onClose}><X size={18}/></button></div>
    <div className={styles.drawerActions}><button className={follow ? styles.actionActive : ''} onClick={() => setFollow(!follow)}>{follow ? <Pause size={12}/> : <Play size={12}/>} {follow ? 'Suivi live actif' : 'Follow live'}</button><button onClick={() => void copy()}>{copied ? 'Copié' : 'Copier Session ID'}</button><a href={session.currentPage} target="_blank" rel="noreferrer">Ouvrir route <ArrowUpRight size={13}/></a>{session.customerAccountId ? <a href={`/angelcare-marketplace/admin/customers/${session.customerAccountId}`} target="_blank" rel="noreferrer">Ouvrir client <ArrowUpRight size={13}/></a> : null}</div>
    <div className={styles.drawerTabs}>{(['session','journey','commerce','technical','visitor'] as const).map((key) => <button key={key} className={drawerTab === key ? styles.drawerTabActive : ''} onClick={() => setDrawerTab(key)}>{key === 'visitor' ? 'Visitor 360' : key}</button>)}</div>
    <div className={styles.drawerBody}>
      <section className={styles.drawerHero}><div><span className={session.active ? styles.activePulse : styles.inactivePulse}/><small>Session</small><strong>{duration(session.durationSeconds)}</strong></div><div><Target size={16}/><small>Intent</small><strong>{session.scores.intent.value}</strong></div><div><MousePointer2 size={16}/><small>Engagement</small><strong>{session.scores.engagement.value}</strong></div><div><Zap size={16}/><small>Friction</small><strong>{session.scores.friction.value}</strong></div></section>

      {drawerTab === 'session' ? <>
        <DetailSection title="Réseau & localisation" icon={Globe2} rows={[[revealIp ? 'IP complète' : 'IP masquée', revealIp ? session.network.ip || 'Non exposée' : maskedIp(session.network.ip)], ['IP hash', session.network.ipHash || '—'], ['Pays', `${flag(session.network.countryCode)} ${session.network.country || session.network.countryCode || 'Inconnu'}`], ['Région', session.network.region || '—'], ['Ville', session.network.city || '—'], ['Lat/Lon', session.network.latitude != null && session.network.longitude != null ? `${session.network.latitude}, ${session.network.longitude}` : '—'], ['ASN', session.network.asn || '—'], ['Réseau', session.network.networkOrganization || '—'], ['Edge', session.network.edge || '—'], ['Forwarded', session.network.forwarded ? 'Oui' : 'Non']]}/>
        <button className={styles.revealButton} onClick={() => setRevealIp((v) => !v)}><Eye size={12}/>{revealIp ? 'Masquer IP' : 'Révéler IP'}</button>
        <DetailSection title="Appareil" icon={Device} rows={[[ 'Classe', session.device.class], ['OS', session.device.os], ['Navigateur', `${session.device.browser} ${session.device.browserVersion}`], ['Plateforme', session.device.platform], ['Modèle', session.device.model || '—'], ['Écran', session.device.screen], ['Viewport', session.device.viewport], ['DPR', String(session.device.dpr)], ['Touch', session.device.touch ? 'Oui' : 'Non'], ['Connexion', session.device.connection], ['Mémoire', session.device.memoryGb ? `${session.device.memoryGb} GB` : '—'], ['CPU', session.device.cores ? `${session.device.cores} cores` : '—'], ['Langue', session.device.language], ['Timezone', session.device.timezone]]}/>
        <DetailSection title="Acquisition" icon={Route} rows={[[ 'Source', prettySource(session.traffic.source)], ['Medium', session.traffic.medium || '—'], ['Campagne', session.traffic.campaign || '—'], ['Content', session.traffic.content || '—'], ['Term', session.traffic.term || '—'], ['Referrer', session.traffic.referrer || 'Direct'], ['Domaine', session.traffic.referrerDomain || '—'], ['Landing', session.landingPage], ['First touch', session.firstTouch ? prettySource(session.firstTouch.source) : '—'], ['Last touch', session.lastTouch ? prettySource(session.lastTouch.source) : '—']]}/>
      </> : null}

      {drawerTab === 'journey' ? <Timeline title="Pathway complet" events={session.pathway}/> : null}
      {drawerTab === 'commerce' ? <><DetailSection title="Business truth" icon={ShoppingBag} rows={[[ 'Business events', String(session.businessEvents)], ['Orders', String(session.orders)], ['Booking confirmés', String(session.bookingsConfirmed)], ['Checkout complétés', String(session.checkoutsCompleted)], ['Demo submissions', String(session.demoSubmissions)], ['Revenue attaché', session.revenue ? money(session.revenue, session.currency || 'MAD') : '—']]}/><Timeline title="Business events" events={business}/><Timeline title="API calls" events={api}/></> : null}
      {drawerTab === 'technical' ? <><DetailSection title="Qualité technique" icon={Gauge} rows={[[ 'Technical score', `${session.scores.technical.value}/100`], ['API avg', `${session.avgApiMs} ms`], ['API failures', String(session.apiFailures)], ['JS errors', String(session.errors)], ['Resource errors', String(session.resourceErrors)], ['INP max', `${session.maxInpMs} ms`], ['Long tasks', `${session.longTaskMs} ms`], ['Rage clicks', String(session.rageClicks)], ['Dead clicks', String(session.deadClicks)], ['Invalid form', String(session.formInvalid)]]}/><Timeline title="Technical timeline" events={technical}/></> : null}
      {drawerTab === 'visitor' ? <Visitor360 profile={visitor} loading={visitorLoading}/> : null}
    </div>
  </aside></div>
}

function Visitor360({ profile, loading }: { profile: XrayVisitorProfile | null; loading: boolean }) {
  if (loading) return <div className={styles.empty}><RefreshCw className={styles.spin} size={20}/><strong>Construction Visitor 360…</strong></div>
  if (!profile) return <div className={styles.empty}><Fingerprint size={20}/><strong>Historique Visitor 360 indisponible.</strong></div>
  return <div className={styles.stack}><section className={styles.visitor360Hero}><div><small>First seen</small><strong>{new Date(profile.firstSeen).toLocaleDateString('fr-FR')}</strong></div><div><small>Sessions 90j</small><strong>{profile.sessions}</strong></div><div><small>Pages</small><strong>{profile.pageViews}</strong></div><div><small>Conversions</small><strong>{profile.conversions}</strong></div><div><small>Revenue</small><strong>{profile.revenue ? money(profile.revenue, profile.currency || 'MAD') : '—'}</strong></div></section><section className={styles.breakdownGrid}><Breakdown title="Pays" icon={Globe2} items={profile.countries}/><Breakdown title="Devices" icon={Smartphone} items={profile.devices}/><Breakdown title="Sources" icon={Route} items={profile.sources}/></section><section className={styles.detailSection}><div className={styles.sectionTitle}><Fingerprint size={15}/><strong>Sessions récentes</strong><span>{profile.recentSessions.length}</span></div><div className={styles.miniSessions}>{profile.recentSessions.map((session) => <div key={session.sessionKey}><span>{flag(session.network.countryCode)}</span><div><strong>{session.currentPage}</strong><small>{new Date(session.lastSeen).toLocaleString('fr-FR')} · {duration(session.durationSeconds)} · I {session.scores.intent.value}</small></div></div>)}</div></section></div>
}

function Timeline({ title, events }: { title: string; events: XraySession['pathway'] }) {
  return <section className={styles.timelineSection}><div className={styles.sectionTitle}><Activity size={15}/><strong>{title}</strong><span>{events.length}</span></div>{events.length ? <div className={styles.timeline}>{events.map((event) => <div key={event.id}><span className={styles.timelineDot}/><time>{new Date(event.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time><div><strong>{event.label}</strong><small>{event.pathname}</small></div><em>{intentLabel(event.intent)}</em></div>)}</div> : <div className={styles.empty}><Activity size={18}/><strong>Aucun événement dans cette vue.</strong></div>}</section>
}

function DetailSection({ title, icon: Icon, rows }: { title: string; icon: typeof Globe2; rows: Array<[string, string]> }) {
  return <section className={styles.detailSection}><div className={styles.sectionTitle}><Icon size={15}/><strong>{title}</strong></div><dl>{rows.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl></section>
}
