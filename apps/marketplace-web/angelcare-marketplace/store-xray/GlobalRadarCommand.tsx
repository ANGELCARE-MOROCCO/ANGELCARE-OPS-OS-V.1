'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  Activity, ArrowRight, ArrowUpRight, CircleAlert, Compass, Eye, Fingerprint,
  Globe2, Layers3, MapPinned, MousePointer2, RadioTower, Radar, ShieldCheck,
  ShoppingCart, Signal, Target, UsersRound, Zap,
} from 'lucide-react'
import type { XraySession, XraySummary } from './types'
import styles from './global-intelligence.module.css'

const GlobalRadarMap = dynamic(() => import('./GlobalRadarMap').then((module) => module.GlobalRadarMap), { ssr: false })
export type RadarLayer = 'all' | 'active' | 'intent' | 'commerce' | 'risk'
export type RadarDisplay = 'clusters' | 'points' | 'heat'

type Props = {
  snapshot: XraySummary
  onVisitor: (session: XraySession) => void
  onCountry: (country: string) => void
  onTab: (tab: 'visitors' | 'journeys' | 'commerce' | 'performance' | 'alerts') => void
}

const layers: Array<{ key: RadarLayer; label: string; icon: typeof Globe2 }> = [
  { key: 'all', label: 'Tous les signaux', icon: Globe2 },
  { key: 'active', label: 'Présence live', icon: Signal },
  { key: 'intent', label: 'Haute intention', icon: Target },
  { key: 'commerce', label: 'Commerce', icon: ShoppingCart },
  { key: 'risk', label: 'Friction / risques', icon: CircleAlert },
]

export function radarCategory(session: XraySession): Exclude<RadarLayer, 'all' | 'active'> | 'presence' {
  if (session.errors + session.apiFailures + session.resourceErrors > 0 || session.scores.friction.value >= 30) return 'risk'
  if (session.orders + session.checkoutsCompleted + session.bookingsConfirmed > 0 || ['cart', 'checkout', 'booking', 'order'].includes(session.intent)) return 'commerce'
  if (session.scores.intent.value >= 70) return 'intent'
  return 'presence'
}

function matchLayer(session: XraySession, layer: RadarLayer) {
  if (layer === 'all') return true
  if (layer === 'active') return session.active
  return radarCategory(session) === layer
}

function labelCountry(code: string | null) {
  if (!code || code === '??') return 'Non géolocalisé'
  const value = code.toUpperCase()
  try {
    return new Intl.DisplayNames(['fr'], { type: 'region' }).of(value) || value
  } catch {
    return value
  }
}

function flag(code: string | null | undefined) {
  if (!code || !/^[A-Z]{2}$/.test(code.toUpperCase())) return '🌐'
  return String.fromCodePoint(...code.toUpperCase().split('').map((letter) => letter.charCodeAt(0) + 127397))
}

export function GlobalRadarCommand({ snapshot, onVisitor, onCountry, onTab }: Props) {
  const [layer, setLayer] = useState<RadarLayer>('all')
  const [display, setDisplay] = useState<RadarDisplay>('clusters')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [towerCode, setTowerCode] = useState('all')
  const [feedOpen, setFeedOpen] = useState<'signals' | 'towers'>('signals')

  const sessions = snapshot.sessionsLive
  const countries = useMemo(() => {
    const groups = new Map<string, { code: string; count: number; active: number; known: number; risk: number; commerce: number }>()
    for (const session of sessions) {
      const code = session.network.countryCode?.toUpperCase() || '??'
      const current = groups.get(code) || { code, count: 0, active: 0, known: 0, risk: 0, commerce: 0 }
      current.count += 1
      if (session.active) current.active += 1
      if (session.known) current.known += 1
      if (radarCategory(session) === 'risk') current.risk += 1
      if (radarCategory(session) === 'commerce') current.commerce += 1
      groups.set(code, current)
    }
    return [...groups.values()].sort((a, b) => b.active - a.active || b.count - a.count)
  }, [sessions])

  const visible = useMemo(() => sessions.filter((session) => matchLayer(session, layer) &&
    (towerCode === 'all' || (session.network.countryCode?.toUpperCase() || '??') === towerCode)),
    [sessions, layer, towerCode])
  const selected = selectedKey ? sessions.find((session) => session.sessionKey === selectedKey) || null : null
  const activeVisible = visible.filter((session) => session.active).length
  const riskVisible = visible.filter((session) => radarCategory(session) === 'risk').length
  const knownVisible = visible.filter((session) => session.known).length
  const statusText = snapshot.truncated ? 'Échantillon plafonné' : 'Télémétrie observée'

  return <section className={styles.command} aria-label="Global Intelligence Command Center">
    <header className={styles.header}>
      <div>
        <div className={styles.eyebrow}><Radar size={15}/> GLOBAL INTELLIGENCE NETWORK <span className={styles.dot}/><span>OPERATIONAL SIGNALS</span></div>
        <h2>La planète, vos visiteurs, chaque signal.</h2>
        <p>Carte géographique réelle et tours de contrôle virtuelles, connectées à la télémétrie Marketplace. Les positions approximatives et non disponibles sont explicitement identifiées.</p>
      </div>
      <div className={styles.headerRight}>
        <div className={styles.readout}><span>ÉTAT DU FLUX</span><strong><span className={styles.dot}/>{statusText}</strong><small>Snapshot : {new Date(snapshot.generatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</small></div>
        <Link href="/angelcare-marketplace/admin/live-map" className={styles.openLink}>Spatial Operations <ArrowUpRight size={16}/></Link>
      </div>
    </header>

    <div className={styles.pulseStrip}>
      <Pulse icon={UsersRound} label="Actifs dans la fenêtre" value={snapshot.activeNow.toLocaleString('fr-FR')} tint="blue" />
      <Pulse icon={Globe2} label="Pays observés" value={snapshot.countries.filter((country) => country.code !== '??').length.toLocaleString('fr-FR')} tint="violet" />
      <Pulse icon={Fingerprint} label="Identités connues" value={snapshot.known.toLocaleString('fr-FR')} tint="mint" />
      <Pulse icon={Target} label="Intentions fortes" value={sessions.filter((session) => session.scores.intent.value >= 70).length.toLocaleString('fr-FR')} tint="gold" />
      <Pulse icon={Zap} label="Incidents techniques" value={(snapshot.apiFailures + snapshot.errors + snapshot.resourceErrors).toLocaleString('fr-FR')} tint="coral" />
    </div>

    <div className={styles.controls}>
      <div className={styles.layerControls} aria-label="Couches radar">
        {layers.map(({ key, label, icon: Icon }) => <button key={key} type="button" className={layer === key ? styles.activeFilter : ''} onClick={() => setLayer(key)} aria-pressed={layer === key}><Icon size={14}/>{label}</button>)}
      </div>
      <div className={styles.displayControls}>
        <Layers3 size={15}/>
        <label htmlFor="global-radar-render">Vue géographique</label>
        <select id="global-radar-render" value={display} onChange={(event) => setDisplay(event.target.value as RadarDisplay)}><option value="clusters">Clusters</option><option value="points">Individuel</option><option value="heat">Densité</option></select>
        {towerCode !== 'all' ? <button type="button" onClick={() => setTowerCode('all')}>Effacer {towerCode} ×</button> : null}
      </div>
    </div>

    <div className={styles.mainGrid}>
      <div className={styles.mapFrame}>
        <div className={styles.mapTop}>
          <div><span className={styles.mapEyebrow}><MapPinned size={14}/> WORLD RADAR / LIVE TELEMETRY</span><strong>{visible.length} sessions dans le périmètre</strong></div>
          <div className={styles.liveIndicator}><span className={styles.dot}/>{activeVisible} actives · {riskVisible} signaux de risque</div>
        </div>
        <div className={styles.mapCanvas}>
          <GlobalRadarMap sessions={visible} display={display} selectedKey={selectedKey} onSelect={(session) => { setSelectedKey(session.sessionKey); onVisitor(session) }}/>
          <div className={styles.mapOverlay}><span><span className={styles.legendDot} data-color="blue"/>Présence</span><span><span className={styles.legendDot} data-color="violet"/>Intention</span><span><span className={styles.legendDot} data-color="mint"/>Commerce</span><span><span className={styles.legendDot} data-color="coral"/>Risque</span></div>
        </div>
        <div className={styles.mapBottom}>
          <div className={styles.mappingNote}><ShieldCheck size={14}/> <span>Coordonnées observées si disponibles ; sinon centroïde du pays indiqué comme approximation. Aucune localisation inventée.</span></div>
          <span>{snapshot.truncated ? 'PÉRIMÈTRE PLAFONNÉ' : 'FENÊTRE D’ANALYSE'} · {snapshot.windowMinutes} MIN</span>
        </div>
        {selected ? <div className={styles.selectedStrip}><span>SESSION SÉLECTIONNÉE</span><strong>{flag(selected.network.countryCode)} {selected.network.city || labelCountry(selected.network.countryCode)} · {selected.known ? 'Identité connue' : 'Anonyme'} · {selected.intent}</strong><button type="button" onClick={() => onVisitor(selected)}>Ouvrir dossier <ArrowRight size={14}/></button></div> : null}
      </div>

      <aside className={styles.intelligencePanel}>
        <div className={styles.panelModes}>
          <button className={feedOpen === 'signals' ? styles.currentMode : ''} onClick={() => setFeedOpen('signals')}><Activity size={15}/> Radar de signaux</button>
          <button className={feedOpen === 'towers' ? styles.currentMode : ''} onClick={() => setFeedOpen('towers')}><RadioTower size={15}/> Tours mondiales</button>
        </div>
        {feedOpen === 'signals' ? <>
          <div className={styles.panelHeading}><div><span>FLUX ÉVÉNEMENTIEL RÉEL</span><h3>Ce qui se passe, maintenant</h3></div><div className={styles.feedCount}>{snapshot.feed.length} événements</div></div>
          <div className={styles.signalFeed}>
            {snapshot.feed.length === 0 ? <div className={styles.empty}><Signal size={24}/><strong>Aucun événement dans la fenêtre</strong><span>Les signaux apparaissent uniquement lorsqu’ils sont capturés.</span></div> : snapshot.feed.slice(0, 28).map((event) => {
              const session = sessions.find((candidate) => candidate.sessionKey === event.sessionKey)
              return <button type="button" key={event.id} disabled={!session} onClick={() => { if (session) { setSelectedKey(session.sessionKey); onVisitor(session) } }} className={styles.feedRow}>
                <span className={styles.feedGlyph}>{flag(event.countryCode)}</span>
                <span className={styles.feedNarrative}><strong>{event.label || event.kind}</strong><small>{event.pathname || 'Route non renseignée'}</small></span>
                <span className={styles.feedMeta}><time>{new Date(event.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</time><em>{event.intent}</em></span>
              </button>
            })}
          </div>
        </> : <>
          <div className={styles.panelHeading}><div><span>TOURS VIRTUELLES PAR TERRITOIRE</span><h3>Présence & pression géographique</h3></div><div className={styles.feedCount}>{countries.length} zones</div></div>
          <div className={styles.towerFeed}>{countries.length === 0 ? <div className={styles.empty}><Globe2 size={24}/><strong>Aucun pays observé</strong><span>Les tours s'alimentent uniquement depuis les sessions réelles.</span></div> : countries.slice(0, 14).map((country) => <button key={country.code} type="button" onClick={() => { setTowerCode(country.code); onCountry(country.code) }} className={`${styles.towerRow} ${towerCode === country.code ? styles.towerActive : ''}`}>
            <span className={styles.towerFlag}>{flag(country.code)}</span>
            <span className={styles.towerInfo}><strong>{labelCountry(country.code)}</strong><small>{country.active} live · {country.known} identifiés · {country.risk} risques</small><i><b style={{width:`${Math.round((country.active / Math.max(1, snapshot.activeNow)) * 100)}%`}}/></i></span>
            <strong className={styles.towerCount}>{country.count}</strong>
            <ArrowUpRight size={14}/>
          </button>)}</div>
        </>}
        <div className={styles.panelFoot}><span><Eye size={14}/> {knownVisible} identifiés dans le filtre</span><button onClick={() => onTab('visitors')}>Visitor 360 <ArrowRight size={14}/></button></div>
      </aside>
    </div>

    <div className={styles.routeDeck}>
      <CommandLink icon={Compass} title="Journey Intelligence" body="Parcours réels, transitions et sorties" action={() => onTab('journeys')} accent="violet"/>
      <CommandLink icon={ShoppingCart} title="Commerce Command" body="Checkout, réservations et conversions" action={() => onTab('commerce')} accent="mint"/>
      <CommandLink icon={MousePointer2} title="Experience & Friction" body="Erreurs, abandons et friction détectée" action={() => onTab('alerts')} accent="coral"/>
      <CommandLink icon={Activity} title="Technical Observatory" body="Performance Web, API et stabilité" action={() => onTab('performance')} accent="blue"/>
    </div>
    <div className={styles.secondaryLinks}><Link href="/angelcare-marketplace/admin/analytics/territories">Territory Analytics <ArrowUpRight size={13}/></Link><Link href="/angelcare-marketplace/admin/analytics/trust">Trust & Security <ArrowUpRight size={13}/></Link><Link href="/angelcare-marketplace/admin/analytics/data-quality">Data Quality Authority <ArrowUpRight size={13}/></Link></div>
  </section>
}

function Pulse({ icon: Icon, label, value, tint }: { icon: typeof Globe2; label: string; value: string; tint: string }) {
  return <div className={styles.pulse} data-tint={tint}><div className={styles.pulseIcon}><Icon size={18}/></div><div><small>{label}</small><strong>{value}</strong></div></div>
}

function CommandLink({ icon: Icon, title, body, accent, action }: { icon: typeof Globe2; title: string; body: string; accent: string; action: () => void }) {
  return <button type="button" className={styles.commandLink} data-accent={accent} onClick={action}><div className={styles.commandLinkIcon}><Icon size={20}/></div><div><strong>{title}</strong><span>{body}</span></div><ArrowUpRight size={17}/></button>
}
