import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import styles from './commercial-core.module.css'

export type CommercialModule = 'services' | 'sales' | 'billing'

const modules: Array<{
  key: CommercialModule
  href: string
  name: string
  ownership: string
  outcome: string
}> = [
  {
    key: 'services',
    href: '/services',
    name: 'Services',
    ownership: 'Offre & capacité',
    outcome: 'Définit ce qu’ANGELCARE vend et peut livrer.',
  },
  {
    key: 'sales',
    href: '/sales',
    name: 'Sales',
    ownership: 'Conversion & commandes',
    outcome: 'Transforme le besoin client en commande exécutable.',
  },
  {
    key: 'billing',
    href: '/billing',
    name: 'Billing',
    ownership: 'Facturation & recouvrement',
    outcome: 'Contrôle les factures, échéances et encaissements.',
  },
]

export function CommercialCoreBar({ active }: { active: CommercialModule }) {
  return (
    <section className={styles.coreBar} aria-label="SANILA Commercial Core">
      <div className={styles.coreIdentity}>
        <div className={styles.logoPlate}>
          <Image src="/logo.png" alt="ANGELCARE" width={220} height={72} className={styles.logo} priority />
        </div>
        <div>
          <span className={styles.coreEyebrow}>ANGELCARE SANILA OS</span>
          <strong className={styles.coreTitle}>Commercial Core</strong>
          <span className={styles.coreSub}>Services · Sales · Billing</span>
        </div>
      </div>
      <nav className={styles.moduleSwitch} aria-label="Navigation du noyau commercial">
        {modules.map((module) => (
          <Link
            key={module.key}
            href={module.href}
            className={module.key === active ? styles.moduleActive : styles.moduleLink}
            aria-current={module.key === active ? 'page' : undefined}
          >
            <span>{module.name}</span>
            <small>{module.ownership}</small>
          </Link>
        ))}
      </nav>
      <div className={styles.ownershipCard}>
        <span>Responsabilité du module</span>
        <strong>{modules.find((module) => module.key === active)?.outcome}</strong>
      </div>
    </section>
  )
}

export function CommandHeader({
  eyebrow,
  title,
  description,
  actions,
  aside,
  source,
}: {
  eyebrow: ReactNode
  title: ReactNode
  description: ReactNode
  actions?: ReactNode
  aside?: ReactNode
  source?: ReactNode
}) {
  return (
    <section className={styles.commandHeader}>
      <div className={styles.commandMain}>
        <span className={styles.commandEyebrow}>{eyebrow}</span>
        <h1>{title}</h1>
        <div className={styles.commandDescription}>{description}</div>
        {actions ? <div className={styles.commandActions}>{actions}</div> : null}
        {source ? <div className={styles.sourceLine}>{source}</div> : null}
      </div>
      {aside ? <aside className={styles.commandAside}>{aside}</aside> : null}
    </section>
  )
}

export function MetricStrip({ children }: { children: ReactNode }) {
  return <section className={styles.metricStrip}>{children}</section>
}

export function Metric({ label, value, context, tone = 'neutral' }: {
  label: ReactNode
  value: ReactNode
  context?: ReactNode
  tone?: 'neutral' | 'good' | 'attention' | 'risk'
}) {
  return (
    <article className={styles.metric} data-tone={tone}>
      <span>{label}</span>
      <strong>{value}</strong>
      {context ? <small>{context}</small> : null}
    </article>
  )
}

export function WorkspaceNav({ items, activeHref }: {
  items: Array<{ href: string; label: string; description?: string }>
  activeHref?: string
}) {
  return (
    <nav className={styles.workspaceNav} aria-label="Navigation du module">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={activeHref === item.href ? styles.workspaceActive : styles.workspaceLink}
        >
          <strong>{item.label}</strong>
          {item.description ? <small>{item.description}</small> : null}
        </Link>
      ))}
    </nav>
  )
}

export function Status({ children, tone = 'neutral' }: {
  children: ReactNode
  tone?: 'neutral' | 'good' | 'attention' | 'risk' | 'info'
}) {
  return <span className={styles.status} data-tone={tone}>{children}</span>
}

export function ActionLink({ href, children, primary = false }: {
  href: string
  children: ReactNode
  primary?: boolean
}) {
  return <Link href={href} className={primary ? styles.actionPrimary : styles.actionSecondary}>{children}</Link>
}

export function TruthNotice({ title, children, tone = 'info' }: {
  title: ReactNode
  children: ReactNode
  tone?: 'info' | 'attention' | 'risk'
}) {
  return (
    <section className={styles.truthNotice} data-tone={tone}>
      <strong>{title}</strong>
      <div>{children}</div>
    </section>
  )
}

export function SectionHeading({ eyebrow, title, description, actions }: {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className={styles.sectionHeading}>
      <div>
        {eyebrow ? <span>{eyebrow}</span> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className={styles.sectionActions}>{actions}</div> : null}
    </header>
  )
}

export function EmptyState({ title, description, action }: {
  title: ReactNode
  description: ReactNode
  action?: ReactNode
}) {
  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyMark}>AC</span>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
        {action ? <div>{action}</div> : null}
      </div>
    </div>
  )
}

export { styles as commercialCoreStyles }
