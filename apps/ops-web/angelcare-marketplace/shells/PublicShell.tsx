import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import styles from '../design-system/marketplace.module.css'
import { ButtonLink } from '../design-system/ui'

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.publicShell}>
      <header className={styles.publicHeader}>
        <div className={styles.headerInner}>
          <Link href="/angelcare-marketplace" className={styles.brand} aria-label="ANGELCARE Marketplace">
            <Image
              src="/logo.png"
              alt="ANGELCARE"
              width={180}
              height={62}
              className={styles.brandLogo}
              priority
            />
            <span className={styles.brandDivider} aria-hidden="true" />
            <span className={styles.brandProduct}>
              <strong>Marketplace 360</strong>
              <span>Écosystème Kids 360 gouverné</span>
            </span>
          </Link>
          <nav className={styles.publicNav} aria-label="Navigation publique">
            <Link href="#constitution" className={styles.navLink}>Constitution</Link>
            <Link href="#readiness" className={styles.navLink}>Préparation</Link>
            <span className={styles.localeBadge} title="Fondation trilingue prête">FR · EN · AR</span>
            <ButtonLink href="/angelcare-marketplace/workspace">
              Espace sécurisé <ArrowUpRight size={15} />
            </ButtonLink>
          </nav>
        </div>
      </header>
      <main className={styles.publicMain}>{children}</main>
      <footer className={styles.publicFooter}>
        <div className={styles.publicFooterInner}>
          <span>© 2026 ANGELCARE — Marketplace Build 360</span>
          <span>Mega ZIP 01 · Fondation technique, visuelle et de gouvernance</span>
        </div>
      </footer>
    </div>
  )
}
