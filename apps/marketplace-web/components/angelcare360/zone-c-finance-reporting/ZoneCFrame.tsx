'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react'
import ZoneCIcon from './ZoneCIcon'
import ZoneCPageExperience from './ZoneCPageExperience'
import ZoneCOverlay from './ZoneCOverlay'
import { ZoneCTruthBadges } from './ZoneCTruthBadges'
import { commandPaletteItems, descriptors, financeNav, reportsNav, resolveZoneCSurface, type ZoneCDomain } from './zone-c-registry'
import styles from './ZoneCFrame.module.css'

type Density = 'comfortable' | 'compact'
type Props = { children: ReactNode; domain: ZoneCDomain }

export default function ZoneCFrame({ children, domain }: Props) {
  const pathname = usePathname() || (domain === 'finance' ? '/angelcare-360-command-center/finance' : '/angelcare-360-command-center/rapports')
  const surface = resolveZoneCSurface(pathname)
  const descriptor = descriptors[surface]
  const nav = domain === 'finance' ? financeNav : reportsNav
  const [density, setDensity] = useState<Density>('comfortable')
  const [focusMode, setFocusMode] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteSearch, setPaletteSearch] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sanila.zone-c.finance-reporting.preferences')
      if (!saved) return
      const parsed = JSON.parse(saved) as { density?: Density; focusMode?: boolean }
      if (parsed.density === 'compact' || parsed.density === 'comfortable') setDensity(parsed.density)
      if (typeof parsed.focusMode === 'boolean') setFocusMode(parsed.focusMode)
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem('sanila.zone-c.finance-reporting.preferences', JSON.stringify({ density, focusMode })) } catch {}
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

  const filteredPalette = useMemo(() => {
    const q = paletteSearch.trim().toLowerCase()
    return q ? commandPaletteItems.filter((item) => item[1].toLowerCase().includes(q)) : commandPaletteItems
  }, [paletteSearch])

  const oppositeHref = domain === 'finance' ? '/angelcare-360-command-center/rapports' : '/angelcare-360-command-center/finance'
  const oppositeLabel = domain === 'finance' ? 'Reporting Studio' : 'Finance Control Tower'

  return <section className={styles.shell} data-zone-c-frame data-domain={domain} data-density={density} data-focus={focusMode?'true':'false'}>
    <header className={styles.zoneHeader}>
      <div className={styles.headerOrbit} aria-hidden="true"><span/><span/><span/></div>
      <div className={styles.headerMain}>
        <div className={styles.headerCopy}>
          <span className={styles.eyebrow}>ZONE C · SOVEREIGN FINANCE & REPORTING COMMAND</span>
          <div className={styles.titleLine}><span className={styles.titleIcon}><ZoneCIcon name={domain === 'finance' ? 'finance' : 'report'}/></span><div><h1 className={styles.title}>{descriptor.title}</h1><span className={styles.signatureName}>{descriptor.signature}</span></div></div>
          <p className={styles.subtitle}>{descriptor.subtitle}</p>
          <ZoneCTruthBadges domain={domain}/>
        </div>
        <div className={styles.headerTools}>
          <button className={density === 'compact' ? styles.toolButtonActive : styles.toolButton} type="button" onClick={()=>setDensity((value)=>value==='compact'?'comfortable':'compact')} aria-pressed={density==='compact'}><ZoneCIcon name="statement"/>{density === 'compact' ? 'Densité compacte' : 'Densité confort'}</button>
          <button className={focusMode ? styles.toolButtonActive : styles.toolButton} type="button" onClick={()=>setFocusMode((value)=>!value)} aria-pressed={focusMode}><ZoneCIcon name="shield"/>{focusMode ? 'Mode focus actif' : 'Mode focus'}</button>
          <button className={styles.toolButton} type="button" onClick={()=>setPaletteOpen(true)}><ZoneCIcon name="command"/>Commandes <span className={styles.kbd}>⌘K</span></button>
          <Link className={styles.bridgeButton} href={oppositeHref}>{oppositeLabel}<ZoneCIcon name="arrow"/></Link>
        </div>
      </div>

      <nav className={styles.rail} aria-label={domain === 'finance' ? 'Navigation Finance Zone C' : 'Navigation Reporting Zone C'}>
        {nav.map((item) => {
          const active = item.href === (domain === 'finance' ? '/angelcare-360-command-center/finance' : '/angelcare-360-command-center/rapports')
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`)
          return <Link key={item.href} href={item.href} className={active ? styles.railActive : styles.railLink} aria-current={active?'page':undefined}><span className={styles.railLabel}>{item.label}</span><span className={styles.railHint}>{item.hint}</span></Link>
        })}
      </nav>
    </header>

    <main className={styles.content}><ZoneCPageExperience>{children}</ZoneCPageExperience></main>

    <ZoneCOverlay open={paletteOpen} kind="focus" eyebrow="Zone C · Navigation rapide" title="Commandes Finance & Reporting" description="Rechercher une vue financière ou reporting sans perdre le contexte de travail." onClose={()=>setPaletteOpen(false)}>
      <div className={styles.palette} aria-label="Commandes Finance et Reporting">
        <div className={styles.paletteHeader}><span className={styles.paletteIcon}><ZoneCIcon name="search"/></span><input data-autofocus autoFocus className={styles.paletteInput} placeholder="Rechercher Finance, facture, paiement, rapport…" value={paletteSearch} onChange={(event: ChangeEvent<HTMLInputElement>)=>setPaletteSearch(event.target.value)}/><span className={styles.kbd}>ESC</span></div>
        <div className={styles.paletteBody}>{filteredPalette.map(([icon,label,href])=><Link key={href} href={href} className={styles.paletteItem} onClick={()=>setPaletteOpen(false)}><span className={styles.paletteGlyph}>{icon}</span><span><strong>{label}</strong><small>{href.includes('/rapports')?'Reporting Studio':'Finance Control Tower'}</small></span><span className={styles.paletteKey}>↵</span></Link>)}</div>
      </div>
    </ZoneCOverlay>
  </section>
}
