'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Command, Eye, EyeOff, Search, ShieldCheck, WalletCards } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import styles from './PayrollZoneDFrame.module.css'

type Props = {
  title: string
  eyebrow: string
  description: string
  badge?: string
  actions?: ReactNode
  children: ReactNode
}

const NAV = [
  ['/angelcare-360-command-center/paie', 'Cockpit'],
  ['/angelcare-360-command-center/paie/periodes', 'Périodes'],
  ['/angelcare-360-command-center/paie/dossiers', 'Dossiers'],
  ['/angelcare-360-command-center/paie/elements', 'Éléments'],
  ['/angelcare-360-command-center/paie/primes', 'Primes'],
  ['/angelcare-360-command-center/paie/retenues', 'Retenues'],
  ['/angelcare-360-command-center/paie/avances', 'Avances'],
  ['/angelcare-360-command-center/paie/ajustements', 'Ajustements'],
  ['/angelcare-360-command-center/paie/remboursements', 'Remboursements'],
  ['/angelcare-360-command-center/paie/validation', 'Validation'],
  ['/angelcare-360-command-center/paie/paiements', 'Paiements'],
  ['/angelcare-360-command-center/paie/historique-personnel', 'Historique'],
  ['/angelcare-360-command-center/paie/conformite', 'Conformité'],
  ['/angelcare-360-command-center/paie/audit', 'Audit'],
] as const

export default function PayrollZoneDFrame({ title, eyebrow, description, badge, actions, children }: Props) {
  const pathname = usePathname()
  const [discreet, setDiscreet] = useState(false)
  const [compact, setCompact] = useState(false)
  const [palette, setPalette] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const saved = window.localStorage.getItem('ac360-zone-d-preferences')
    if (!saved) return
    try {
      const parsed = JSON.parse(saved) as { discreet?: boolean; compact?: boolean }
      setDiscreet(Boolean(parsed.discreet))
      setCompact(Boolean(parsed.compact))
    } catch {}
  }, [])

  useEffect(() => {
    window.localStorage.setItem('ac360-zone-d-preferences', JSON.stringify({ discreet, compact }))
  }, [discreet, compact])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPalette(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return needle ? NAV.filter(([, label]) => label.toLowerCase().includes(needle)) : NAV.slice(0, 8)
  }, [query])

  return (
    <main className={`${styles.root} ${compact ? styles.compact : ''}`} data-discreet={discreet ? 'true' : 'false'}>
      <section className={styles.crown}>
        <div className={styles.crownIdentity}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <div className={styles.titleRow}>
            <h1>{title}</h1>
            {badge ? <span className={styles.badge}><ShieldCheck size={14}/>{badge}</span> : null}
          </div>
          <p>{description}</p>
        </div>
        <div className={styles.crownActions}>
          <button className={styles.utilityButton} onClick={() => setPalette(true)}><Command size={17}/>⌘K</button>
          <button className={styles.utilityButton} onClick={() => setCompact(value => !value)}>{compact ? 'Confort' : 'Compact'}</button>
          <button className={styles.utilityButton} onClick={() => setDiscreet(value => !value)}>{discreet ? <Eye size={17}/> : <EyeOff size={17}/>} {discreet ? 'Afficher montants' : 'Masquer montants'}</button>
          {actions}
        </div>
      </section>

      <nav className={styles.commandRail} aria-label="Navigation Paie">
        {NAV.map(([href, label]) => {
          const active = href === '/angelcare-360-command-center/paie' ? pathname === href : pathname.startsWith(href)
          return <Link key={href} href={href} className={active ? styles.navActive : undefined}>{label}</Link>
        })}
      </nav>

      {children}

      {palette ? (
        <div className={styles.paletteBackdrop} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setPalette(false) }}>
          <section className={styles.palette} role="dialog" aria-modal="true" aria-label="Palette de commandes Paie">
            <header><Command size={20}/><strong>Commande Paie</strong><button onClick={() => setPalette(false)}>Fermer</button></header>
            <label className={styles.searchBox}><Search size={18}/><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher une section de paie…" /></label>
            <div className={styles.paletteResults}>{results.map(([href, label]) => <Link key={href} href={href} onClick={() => setPalette(false)}><WalletCards size={16}/><span>{label}</span></Link>)}</div>
          </section>
        </div>
      ) : null}
    </main>
  )
}
