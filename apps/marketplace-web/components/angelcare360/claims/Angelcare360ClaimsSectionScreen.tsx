'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { FileClock, Inbox, Radar, ShieldAlert, UserRoundCheck } from 'lucide-react'
import styles from './TrustResolutionOS.module.css'

const NAV = [
  { href: '/angelcare-360-command-center/reclamations', label: 'Observatoire', icon: Radar },
  { href: '/angelcare-360-command-center/reclamations/tickets', label: 'Dossiers', icon: Inbox },
  { href: '/angelcare-360-command-center/reclamations/priorites', label: 'Priorités', icon: ShieldAlert },
  { href: '/angelcare-360-command-center/reclamations/assignations', label: 'Responsabilités', icon: UserRoundCheck },
  { href: '/angelcare-360-command-center/reclamations/audit', label: 'Audit', icon: FileClock },
]

type Props = {
  title: string
  description?: string
  actions?: ReactNode
  activeHref?: string
  eyebrow?: string
  children: ReactNode
}

export default function Angelcare360ClaimsSectionScreen({ title, description, actions, activeHref, eyebrow = 'TRUST RESOLUTION · DEEP WORKSPACE', children }: Props) {
  return (
    <main className={styles.deepPage}>
      <header className={styles.deepHero}>
        <div><div className={styles.eyebrow}>{eyebrow}</div><h1>{title}</h1>{description ? <p>{description}</p> : null}</div>
        {actions ? <div className={styles.deepActions}>{actions}</div> : null}
      </header>
      <nav className={styles.commandNav} aria-label="Navigation Réclamations">
        {NAV.map(({ href, label, icon: Icon }) => <Link key={href} className={styles.navLink} data-active={activeHref === href} href={href}><Icon />{label}</Link>)}
      </nav>
      <div className={styles.deepBody}>{children}</div>
    </main>
  )
}
