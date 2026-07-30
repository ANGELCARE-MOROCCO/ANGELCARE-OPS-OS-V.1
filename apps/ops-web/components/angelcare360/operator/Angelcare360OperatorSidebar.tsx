'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import type { Angelcare360OperatorNavigationSection } from '@/types/angelcare360/operator'
import { OperatorNavigationIcon } from './Angelcare360OperatorIcons'
import styles from './Angelcare360OperatorExperience.module.css'

type Props = {
  sections: Angelcare360OperatorNavigationSection[]
  pathname: string
  open: boolean
  onClose: () => void
  showCloseButton: boolean
}

export default function Angelcare360OperatorSidebar({ sections, pathname, open, onClose, showCloseButton }: Props) {
  if (!open) return null

  return (
    <aside className={styles.sidebar} aria-label="Navigation AngelCare 360 Operator">
      <div className={styles.sidebarBrand}>
        <span className={styles.brandSignal} aria-hidden="true" />
        <span className={styles.brandEyebrow}>Quartier général SaaS</span>
        <span className={styles.brandTitle}>ANGELCARE 360<br />OPERATOR</span>
        <span className={styles.brandSubtitle}>Clients, tenants, revenu récurrent et qualité de service.</span>
      </div>

      <div className={styles.sidebarTop}>
        <div>
          <div className={styles.sidebarTopTitle}>Univers opérateur</div>
          <div className={styles.sidebarTopMeta}>{sections.reduce((total, section) => total + section.items.length, 0)} instruments de pilotage</div>
        </div>
        {showCloseButton ? (
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fermer la navigation">
            <X size={17} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <nav className={styles.nav}>
        {sections.map((section) => (
          <section key={section.group} className={styles.navGroup} aria-label={section.label}>
            <div className={styles.navGroupHeader} title={section.summary}>
              <span className={styles.navGroupLabel}>{section.label}</span>
              <span className={styles.navGroupCount}>{String(section.items.length).padStart(2, '0')}</span>
            </div>
            <div className={styles.navItems}>
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/angelcare-360-operator' && pathname.startsWith(`${item.href}/`))
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={onClose}
                    aria-current={isActive ? 'page' : undefined}
                    className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                    title={item.summary}
                  >
                    <span className={styles.navIcon}><OperatorNavigationIcon itemKey={item.key} /></span>
                    <span className={styles.navLabel}>{item.label}</span>
                    {item.badge ? <span className={styles.navBadge}>{item.badge}</span> : null}
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </nav>
    </aside>
  )
}
