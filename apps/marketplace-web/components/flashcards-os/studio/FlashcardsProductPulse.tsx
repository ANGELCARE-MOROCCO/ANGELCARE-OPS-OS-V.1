'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Activity, Pause, Play, RefreshCw } from 'lucide-react'
import styles from './flashcards-studio-2030.module.css'

type PulseEvent = { id: string; label: string; href: string; at: string; tone: string; kind: string }

export default function FlashcardsProductPulse({ hidden = false }: { hidden?: boolean }) {
  const [events, setEvents] = useState<PulseEvent[]>([])
  const [paused, setPaused] = useState(false)
  const [loading, setLoading] = useState(true)
  async function load() {
    setLoading(true)
    try { const response = await fetch('/api/flashcards-os/px/pulse', { cache: 'no-store' }); const payload = await response.json(); setEvents(Array.isArray(payload.events) ? payload.events : []) }
    catch { setEvents([]) }
    finally { setLoading(false) }
  }
  useEffect(() => { load(); const timer = window.setInterval(load, 60000); return () => window.clearInterval(timer) }, [])
  if (hidden) return null
  return <section className={styles.pulseRail} aria-label="Flux produit Flashcards OS">
    <div className={styles.pulseLabel}><Activity size={15}/><span>PRODUCT PULSE</span></div>
    <div className={`${styles.pulseViewport} ${paused ? styles.pulsePaused : ''}`}>
      {loading ? <span className={styles.pulseEmpty}>Synchronisation du flux réel…</span> : events.length ? <div className={styles.pulseTrack}>{[...events, ...events].map((event, index) => <Link href={event.href} key={`${event.id}-${index}`} data-tone={event.tone}><i/><strong>{event.label}</strong><time>{new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }).format(new Date(event.at))}</time></Link>)}</div> : <span className={styles.pulseEmpty}>Aucune activité personnelle récente. Le flux restera vide jusqu’à une action réelle.</span>}
    </div>
    <div className={styles.pulseActions}><button type="button" onClick={() => setPaused((value) => !value)} title={paused ? 'Reprendre' : 'Mettre en pause'}>{paused ? <Play size={14}/> : <Pause size={14}/>}</button><button type="button" onClick={load} title="Actualiser"><RefreshCw size={14}/></button></div>
  </section>
}
