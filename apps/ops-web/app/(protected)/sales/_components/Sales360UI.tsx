'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import styles from './Sales360.module.css'

export { styles }

export type Tone = 'navy' | 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'violet'

export function formatDh(value: number | string | null | undefined) {
  const amount = Number(value || 0)
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number.isFinite(amount) ? amount : 0)} Dh`
}

export function formatDate(value?: string | null, withTime = false) {
  if (!value) return 'Non renseignée'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('fr-FR', withTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' }
  ).format(date)
}

export function statusLabel(value?: string | null) {
  const key = String(value || '').toLowerCase()
  const labels: Record<string, string> = {
    draft: 'Brouillon', quoted: 'Devis émis', confirmed: 'Confirmée', paid: 'Réglée',
    cancelled: 'Annulée', delivered: 'Livrée', assigned: 'Assignée', active: 'Actif',
    lead: 'Prospect', vip: 'VIP', risk: 'À risque', inactive: 'Inactif', archived: 'Archivé',
    unpaid: 'Non réglée', partial: 'Partielle', pending: 'En attente',
    not_started: 'Non démarré', prepared: 'Préparé', handoff_ready: 'Handoff prêt',
    blocked: 'Bloqué', completed: 'Terminé', issued: 'Émis', open: 'Ouvert', done: 'Terminé',
  }
  return labels[key] || (value ? String(value).replaceAll('_', ' ') : 'Non défini')
}

export function toneForStatus(value?: string | null): Tone {
  const key = String(value || '').toLowerCase()
  if (['paid', 'confirmed', 'delivered', 'active', 'completed', 'done', 'handoff_ready'].includes(key)) return 'green'
  if (['quoted', 'pending', 'partial', 'prepared', 'lead'].includes(key)) return 'amber'
  if (['cancelled', 'blocked', 'risk', 'inactive', 'archived', 'unpaid'].includes(key)) return 'red'
  if (['vip'].includes(key)) return 'violet'
  if (['draft', 'not_started', 'open'].includes(key)) return 'blue'
  return 'slate'
}

const iconPaths: Record<string, ReactNode> = {
  command: <><path d="M4 5.5h16M4 12h10M4 18.5h16"/><path d="M17 9v6M14 12h6"/></>,
  client: <><circle cx="12" cy="8" r="3.2"/><path d="M5.2 20a6.8 6.8 0 0 1 13.6 0"/></>,
  order: <><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></>,
  money: <><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 9h.01M17 15h.01"/><circle cx="12" cy="12" r="2.5"/></>,
  document: <><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></>,
  handoff: <><path d="M4 12h11M11 8l4 4-4 4"/><path d="M15 5h5v14h-5"/></>,
  alert: <><path d="M12 3 2.8 20h18.4z"/><path d="M12 9v4M12 17h.01"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  filter: <><path d="M4 6h16M7 12h10M10 18h4"/></>,
  refresh: <><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M18.5 10A7 7 0 0 0 6 7.5L4 12M5.5 14A7 7 0 0 0 18 16.5L20 12"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1z"/></>,
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
  shield: <><path d="M12 3 20 6v6c0 5-3.3 8-8 9-4.7-1-8-4-8-9V6z"/><path d="m9 12 2 2 4-5"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  arrow: <path d="m9 18 6-6-6-6"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  technical: <><path d="M8 9 4 12l4 3M16 9l4 3-4 3M14 5l-4 14"/></>,
  service: <><path d="M7 3h10v6H7zM4 15h6v6H4zM14 15h6v6h-6z"/><path d="M12 9v3M7 12h10M7 12v3M17 12v3"/></>,
}

export function Icon({ name, size = 20, className = '' }: { name: string; size?: number; className?: string }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name] || iconPaths.command}</svg>
}

export function SalesHero({ eyebrow, title, text, actions, aside, technical = false }: {
  eyebrow: string; title: string; text: string; actions?: ReactNode; aside?: ReactNode; technical?: boolean
}) {
  return <section className={`${styles.hero} ${technical ? styles.heroTechnical : ''}`}>
    <div className={styles.heroMain}>
      <div className={styles.brandLine}>
        <span className={styles.logoPlate}><img src="/logo.png" alt="ANGELCARE" /></span>
        <span><b>ANGELCARE SANILA OS</b><small>{eyebrow}</small></span>
      </div>
      <h1>{title}</h1>
      <p>{text}</p>
      {actions ? <div className={styles.heroActions}>{actions}</div> : null}
    </div>
    {aside ? <div className={styles.heroAside}>{aside}</div> : null}
  </section>
}

export function HeroStat({ label, value, detail, tone = 'blue' }: { label: string; value: ReactNode; detail?: string; tone?: Tone }) {
  return <div className={`${styles.heroStat} ${styles[`tone_${tone}`]}`}>
    <small>{label}</small><strong>{value}</strong>{detail ? <span>{detail}</span> : null}
  </div>
}

export function MetricTile({ label, value, detail, icon = 'chart', tone = 'blue', onClick }: {
  label: string; value: ReactNode; detail?: string; icon?: string; tone?: Tone; onClick?: () => void
}) {
  const content = <>
    <span className={styles.metricIcon}><Icon name={icon} size={19}/></span>
    <span className={styles.metricCopy}><small>{label}</small><strong>{value}</strong>{detail ? <em>{detail}</em> : null}</span>
  </>
  if (onClick) return <button type="button" onClick={onClick} className={`${styles.metricTile} ${styles[`tone_${tone}`]}`}>{content}</button>
  return <div className={`${styles.metricTile} ${styles[`tone_${tone}`]}`}>{content}</div>
}

export function Panel({ title, subtitle, action, children, className = '' }: {
  title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string
}) {
  return <section className={`${styles.panel} ${className}`}>
    <header className={styles.panelHeader}><div><h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div>{action}</header>
    <div className={styles.panelBody}>{children}</div>
  </section>
}

export function Pill({ children, tone = 'slate' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`${styles.pill} ${styles[`tone_${tone}`]}`}>{children}</span>
}

export function ActionLink({ href, children, tone = 'navy', icon = 'arrow', target }: {
  href: string; children: ReactNode; tone?: Tone | 'light'; icon?: string; target?: string
}) {
  return <Link href={href} target={target} className={`${styles.actionButton} ${tone === 'light' ? styles.actionLight : styles[`action_${tone}`]}`}>
    <span>{children}</span><Icon name={icon} size={17}/>
  </Link>
}

export function ActionButton({ children, tone = 'light', icon, onClick, disabled = false, type = 'button' }: {
  children: ReactNode; tone?: Tone | 'light'; icon?: string; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit'
}) {
  return <button type={type} disabled={disabled} onClick={onClick} className={`${styles.actionButton} ${tone === 'light' ? styles.actionLight : styles[`action_${tone}`]}`}>
    <span>{children}</span>{icon ? <Icon name={icon} size={17}/> : null}
  </button>
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return <div className={styles.emptyState}><span><Icon name="command" size={25}/></span><div><strong>{title}</strong><p>{text}</p>{action}</div></div>
}

export function Notice({ title, text, tone = 'blue', icon = 'shield' }: { title: string; text: string; tone?: Tone; icon?: string }) {
  return <div className={`${styles.notice} ${styles[`tone_${tone}`]}`}><span><Icon name={icon} size={20}/></span><div><strong>{title}</strong><p>{text}</p></div></div>
}

export function Field({ label, hint, children, wide = false }: { label: string; hint?: string; children: ReactNode; wide?: boolean }) {
  return <label className={`${styles.field} ${wide ? styles.fieldWide : ''}`}><span>{label}</span>{children}{hint ? <small>{hint}</small> : null}</label>
}

export function ContinuityRibbon({ items }: { items: Array<{ label: string; value: string; tone?: Tone; href?: string }> }) {
  return <div className={styles.continuityRibbon}>{items.map((item, index) => {
    const content = <><span className={`${styles.continuityDot} ${styles[`tone_${item.tone || 'slate'}`]}`}>{index + 1}</span><div><small>{item.label}</small><strong>{item.value}</strong></div></>
    return item.href ? <Link key={`${item.label}-${index}`} href={item.href} className={styles.continuityItem}>{content}</Link> : <div key={`${item.label}-${index}`} className={styles.continuityItem}>{content}</div>
  })}</div>
}

export function CommercialNav({ active }: { active: 'command' | 'clients' | 'orders' | 'management' | 'configuration' | 'technical' }) {
  const links = [
    { key: 'command', label: 'Command Center', href: '/sales' },
    { key: 'clients', label: 'Clients', href: '/sales/clients' },
    { key: 'orders', label: 'Commandes', href: '/sales/orders' },
    { key: 'management', label: 'Management', href: '/sales/management' },
    { key: 'configuration', label: 'Configuration', href: '/sales/configuration' },
  ]
  return <nav className={styles.subnav}>{links.map(link => <Link key={link.key} href={link.href} className={active === link.key ? styles.subnavActive : ''}>{link.label}</Link>)}</nav>
}

export function Drawer({ open, title, subtitle, onClose, children }: { open: boolean; title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  if (!open) return null
  return <div className={styles.drawerLayer} role="dialog" aria-modal="true">
    <button className={styles.drawerBackdrop} onClick={onClose} aria-label="Fermer" />
    <aside className={styles.drawer}>
      <header><div><h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div><button type="button" onClick={onClose} className={styles.iconButton}><Icon name="close"/></button></header>
      <div className={styles.drawerBody}>{children}</div>
    </aside>
  </div>
}

export function SourceBadge({ children, tone = 'blue' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`${styles.sourceBadge} ${styles[`tone_${tone}`]}`}><span className={styles.sourceDot}/>{children}</span>
}

export function LoadingState({ label = 'Chargement du périmètre commercial…' }: { label?: string }) {
  return <div className={styles.loadingState}><span/><span/><span/><p>{label}</p></div>
}
