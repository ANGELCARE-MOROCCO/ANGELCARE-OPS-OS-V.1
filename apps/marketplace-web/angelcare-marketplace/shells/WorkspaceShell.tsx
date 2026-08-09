import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  CircleUserRound,
  Grid2X2,
  Home,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import type { MarketplaceRequestContext } from '../domain/types'
import styles from '../design-system/marketplace.module.css'

export function WorkspaceShell({
  context,
  children,
}: {
  context: MarketplaceRequestContext
  children: ReactNode
}) {
  const canAdmin = context.permissions.includes('marketplace.admin.access')
  return (
    <div className={styles.workspaceFrame}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarBrand}>
            <Image src="/logo.png" alt="ANGELCARE" width={170} height={58} />
            <span>Marketplace 360</span>
          </div>
        </div>
        <nav className={styles.sidebarNav} aria-label="Espace Marketplace">
          <div className={styles.navGroup}>
            <div className={styles.navGroupLabel}>Mon espace</div>
            <Link href="/angelcare-marketplace/workspace" className={styles.sideNavLink}>
              <span className={styles.sideNavIcon}><Home size={15} /></span>
              Vue d’ensemble
            </Link>
            <Link href="/angelcare-marketplace/account" className={styles.sideNavLink}>
              <span className={styles.sideNavIcon}><CircleUserRound size={15} /></span>
              Identité & accès
            </Link>
          </div>
          {canAdmin ? (
            <div className={styles.navGroup}>
              <div className={styles.navGroupLabel}>Gouvernance</div>
              <Link href="/angelcare-marketplace/admin" className={styles.sideNavLink}>
                <span className={styles.sideNavIcon}><ShieldCheck size={15} /></span>
                Master Backoffice
              </Link>
            </div>
          ) : null}
          <div className={styles.navGroup}>
            <div className={styles.navGroupLabel}>Écosystème</div>
            <Link href="/angelcare-marketplace" className={styles.sideNavLink}>
              <span className={styles.sideNavIcon}><Grid2X2 size={15} /></span>
              Entrée Marketplace
            </Link>
            <Link href="/logout" className={styles.sideNavLink}>
              <span className={styles.sideNavIcon}><LogOut size={15} /></span>
              Se déconnecter
            </Link>
          </div>
        </nav>
        <div className={styles.sidebarFooter}>
          <div className={styles.identityCard}>
            <div className={styles.identityName}>{context.actor.displayName}</div>
            <div className={styles.identityMeta}>
              {context.roleKeys.join(' · ')}<br />
              Locale : {context.locale.toUpperCase()}
            </div>
          </div>
        </div>
      </aside>
      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <span className={styles.topbarTitle}>Espace sécurisé ANGELCARE Marketplace</span>
          <div className={styles.topbarMeta}>
            <span className={styles.scopeBadge}>{context.tenantId || 'Compte ANGELCARE'}</span>
            <span className={styles.scopeBadge}>{context.locale.toUpperCase()}</span>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </section>
    </div>
  )
}
