'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import styles from './PresenceZoneBFrame.module.css'

type Props = { children: React.ReactNode }
type Density = 'comfortable' | 'compact'

const nav = [
  { label: "Aujourd’hui", hint: 'École en direct', href: '/angelcare-360-command-center/presences' },
  { label: 'Classes', hint: 'Murs de présence', href: '/angelcare-360-command-center/presences/classes' },
  { label: 'Élèves', hint: 'Suivi individuel', href: '/angelcare-360-command-center/presences/eleves' },
  { label: 'Absences', hint: 'Vérification', href: '/angelcare-360-command-center/presences/absences' },
  { label: 'Retards', hint: 'Arrivées tardives', href: '/angelcare-360-command-center/presences/retards' },
  { label: 'Justifications', hint: 'Décisions', href: '/angelcare-360-command-center/presences/justifications' },
  { label: 'Historique', hint: 'Intégrité', href: '/angelcare-360-command-center/presences/audit' },
]

const paletteItems = [
  ['AU', "Présences aujourd’hui", '/angelcare-360-command-center/presences'],
  ['JR', 'Ouvrir le journal du jour', '/angelcare-360-command-center/presences/jour'],
  ['CL', 'Voir les classes', '/angelcare-360-command-center/presences/classes'],
  ['EL', 'Rechercher un élève', '/angelcare-360-command-center/presences/eleves'],
  ['AB', 'Absences à vérifier', '/angelcare-360-command-center/presences/absences'],
  ['RT', 'Retards', '/angelcare-360-command-center/presences/retards'],
  ['JU', 'Justifications à examiner', '/angelcare-360-command-center/presences/justifications'],
  ['HI', 'Historique des présences', '/angelcare-360-command-center/presences/audit'],
] as const

function pageTitle(pathname: string) {
  if (pathname.includes('/justifications/')) return 'Décision de justification'
  if (pathname.endsWith('/justifications')) return 'Justifications & preuves'
  if (pathname.includes('/classes/')) return 'Dossier de présence de classe'
  if (pathname.endsWith('/classes')) return 'Classes & présence'
  if (pathname.endsWith('/eleves')) return 'Présence par élève'
  if (pathname.endsWith('/absences')) return 'Absences à vérifier'
  if (pathname.endsWith('/retards')) return 'Retards & arrivées'
  if (pathname.endsWith('/audit')) return 'Historique & intégrité'
  if (pathname.endsWith('/jour')) return 'Journée en direct'
  return 'Présences'
}

export default function PresenceZoneBFrame({ children }: Props) {
  const pathname = usePathname() || '/angelcare-360-command-center/presences'
  const [density, setDensity] = useState<Density>('comfortable')
  const [focusMode, setFocusMode] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteSearch, setPaletteSearch] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sanila.presence.zoneb.preferences')
      if (saved) {
        const parsed = JSON.parse(saved) as { density?: Density; focusMode?: boolean }
        if (parsed.density === 'compact' || parsed.density === 'comfortable') setDensity(parsed.density)
        if (typeof parsed.focusMode === 'boolean') setFocusMode(parsed.focusMode)
      }
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem('sanila.presence.zoneb.preferences', JSON.stringify({ density, focusMode })) } catch {}
  }, [density, focusMode])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); setPaletteOpen(true)
      }
      if (event.key === 'Escape' && paletteOpen) setPaletteOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [paletteOpen])

  const filtered = useMemo(() => {
    const q = paletteSearch.trim().toLowerCase()
    return q ? paletteItems.filter((item) => item[1].toLowerCase().includes(q)) : paletteItems
  }, [paletteSearch])

  return (
    <section className={styles.shell} data-zone-b-frame>
      <header className={styles.zoneHeader}>
        <div className={styles.headerMain}>
          <div className={styles.headerCopy}>
            <span className={styles.eyebrow}>Zone B · School Day Presence Command</span>
            <h1 className={styles.title}>{pageTitle(pathname)}</h1>
            <p className={styles.subtitle}>Le poste de commandement vivant de la journée scolaire : arrivées, présence réelle, absences, retards, sorties, justifications, clôture et historique — sans exposer la complexité technique au personnel de l’établissement.</p>
          </div>
          <div className={styles.headerTools}>
            <button className={density === 'compact' ? styles.toolButtonActive : styles.toolButton} type="button" onClick={() => setDensity((value) => value === 'compact' ? 'comfortable' : 'compact')} aria-pressed={density === 'compact'}>{density === 'compact' ? 'Densité compacte' : 'Densité confort'}</button>
            <button className={focusMode ? styles.toolButtonActive : styles.toolButton} type="button" onClick={() => setFocusMode((value) => !value)} aria-pressed={focusMode}>{focusMode ? 'Mode accueil actif' : 'Mode accueil'}</button>
            <button className={styles.toolButton} type="button" onClick={() => setPaletteOpen(true)}>Commandes <span className={styles.kbd}>⌘K</span></button>
          </div>
        </div>
        <nav className={styles.rail} aria-label="Navigation Présences">
          {nav.map((item) => {
            const active = item.href === '/angelcare-360-command-center/presences' ? pathname === item.href || pathname.endsWith('/jour') : pathname === item.href || pathname.startsWith(`${item.href}/`)
            return <Link key={item.href} href={item.href} className={active ? styles.railActive : styles.railLink} aria-current={active ? 'page' : undefined}><span className={styles.railLabel}>{item.label}</span><span className={styles.railHint}>{item.hint}</span></Link>
          })}
        </nav>
      </header>

      <div className={styles.content} data-density={density} data-focus={focusMode ? 'true' : 'false'}>{children}</div>
      <button className={styles.focusMode} type="button" onClick={() => setFocusMode((value) => !value)}>{focusMode ? 'Quitter mode accueil' : 'Mode accueil rapide'}</button>

      {paletteOpen ? (
        <div className={styles.paletteBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPaletteOpen(false) }}>
          <div className={styles.palette} role="dialog" aria-modal="true" aria-label="Commandes Présences">
            <div className={styles.paletteHeader}><span className={styles.paletteIcon}>⌘</span><input autoFocus className={styles.paletteInput} placeholder="Rechercher une commande Présences…" value={paletteSearch} onChange={(event) => setPaletteSearch(event.target.value)} /><span className={styles.kbd}>ESC</span></div>
            <div className={styles.paletteBody}>{filtered.map(([icon,label,href]) => <Link key={href} href={href} className={styles.paletteItem} onClick={() => setPaletteOpen(false)}><span className={styles.paletteIcon}>{icon}</span><span><span className={styles.paletteLabel}>{label}</span><span className={styles.paletteHint}>Ouvrir dans Zone B</span></span><span className={styles.paletteKey}>↵</span></Link>)}</div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
