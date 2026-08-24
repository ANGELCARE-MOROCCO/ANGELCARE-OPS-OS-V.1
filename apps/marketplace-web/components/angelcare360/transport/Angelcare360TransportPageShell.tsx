import type { ReactNode } from 'react'
import Angelcare360TransportNavigation from './Angelcare360TransportNavigation'
import type { Angelcare360TransportNavigationItem } from '@/data/angelcare360/transport-navigation'
import styles from './sovereign/TransportSovereign.module.css'

type Props = {
  title: string
  subtitle: string
  badge?: string
  statusLabel?: string
  primaryAction?: ReactNode
  secondaryActions?: ReactNode
  contextRow?: ReactNode
  navigationItems: Angelcare360TransportNavigationItem[]
  children: ReactNode
}

export default function Angelcare360TransportPageShell({
  title,
  subtitle,
  badge,
  statusLabel,
  primaryAction,
  secondaryActions,
  contextRow,
  navigationItems,
  children,
}: Props) {
  return (
    <section className={styles.scope} data-sanila-transport-surface="sovereign">
      <div className={styles.shell}>
        <header className={styles.transportMasthead}>
          <div className={styles.transportHeading}>
            <span className={styles.eyebrow}>{badge || 'Transport & Sécurité'}</span>
            <h1 className={styles.transportTitle}>{title}</h1>
            <p className={styles.transportSubtitle}>{subtitle}</p>
          </div>
          {(statusLabel || secondaryActions || primaryAction) ? (
            <div className={styles.transportCommandRail}>
              {statusLabel ? <span className={styles.transportStatus}>{statusLabel}</span> : null}
              <div className={styles.transportActions}>{secondaryActions}{primaryAction}</div>
            </div>
          ) : null}
        </header>

        {contextRow ? <div className={styles.transportContext}>{contextRow}</div> : null}

        <div className={styles.transportLocalNavigation}>
          <Angelcare360TransportNavigation items={navigationItems} />
        </div>

        <div className={styles.transportWorkspace}>{children}</div>
      </div>
    </section>
  )
}
