import Link from 'next/link'
import type { ReactNode } from 'react'
import styles from './TrustResolutionSovereign.module.css'

const NAV = [
  ['/angelcare-360-command-center/reclamations','Cockpit'],
  ['/angelcare-360-command-center/reclamations/tickets','Dossiers'],
  ['/angelcare-360-command-center/reclamations/assignations','Responsabilités'],
  ['/angelcare-360-command-center/reclamations/priorites','Priorités'],
  ['/angelcare-360-command-center/reclamations/audit','Audit'],
] as const

export default function TrustResolutionShell({ title, eyebrow, description, children, actions, context }: { title:string; eyebrow:string; description:string; children:ReactNode; actions?:ReactNode; context?:ReactNode }) {
  return <section className={styles.page}>
    <header className={styles.masthead}>
      <div className={styles.mastheadCopy}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        {context ? <div className={styles.contextRow}>{context}</div> : null}
      </div>
      {actions ? <div className={styles.mastheadActions}>{actions}</div> : null}
    </header>
    <nav className={styles.localNav} aria-label="Navigation Réclamations">
      {NAV.map(([href,label]) => <Link key={href} href={href}>{label}</Link>)}
    </nav>
    <div className={styles.workspace}>{children}</div>
  </section>
}
