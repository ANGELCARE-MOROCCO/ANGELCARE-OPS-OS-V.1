'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { resolveOperatorExperience } from './Angelcare360OperatorExperience'
import {
  OperatorDecisionIcon,
  OperatorDistrictIcon,
  OperatorEvidenceIcon,
  OperatorMissionIcon,
} from './Angelcare360OperatorIcons'
import styles from './Angelcare360OperatorExperience.module.css'

type Props = {
  title: string
  subtitle: string
  badge?: string
  statusLabel?: string
  primaryAction?: ReactNode
  secondaryActions?: ReactNode
  contextRow?: ReactNode
  children: ReactNode
}

export default function Angelcare360OperatorPageShell({
  title,
  subtitle,
  badge,
  statusLabel,
  primaryAction,
  secondaryActions,
  contextRow,
  children,
}: Props) {
  const pathname = usePathname() || '/angelcare-360-operator'
  const profile = resolveOperatorExperience(pathname)

  return (
    <section className={styles.pageShell}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.heroMeta}>
            <span className={styles.heroBadge}>{badge || profile.districtLabel}</span>
            {statusLabel ? <span className={styles.heroStatus}>{statusLabel}</span> : null}
          </div>
          <h1 className={styles.heroTitle}>{title}</h1>
          <p className={styles.heroSubtitle}>{subtitle}</p>
          {primaryAction || secondaryActions ? (
            <div className={styles.heroActions}>
              {primaryAction}
              {secondaryActions}
            </div>
          ) : (
            <div className={styles.heroActions}>
              {profile.quickLinks.slice(0, 2).map((link) => (
                <Link key={link.href} href={link.href} className={styles.actionButton + ' ' + styles.actionSecondary}>
                  {link.label}<ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className={styles.heroSignature} aria-hidden="true">
          <div className={styles.signatureCore}>
            <span className={styles.signatureMark}><OperatorDistrictIcon district={profile.district} /></span>
          </div>
          <span className={styles.signatureLabel}>{profile.routeLabel}</span>
        </div>
      </header>

      <section className={styles.missionGrid} aria-label="Cadre de décision de la page">
        <article className={styles.missionCell}>
          <span className={styles.missionIcon}><OperatorMissionIcon size={15} aria-hidden="true" /></span>
          <span className={styles.missionLabel}>Mission</span>
          <span className={styles.missionText}>{profile.mission}</span>
        </article>
        <article className={styles.missionCell}>
          <span className={styles.missionIcon}><OperatorDecisionIcon size={15} aria-hidden="true" /></span>
          <span className={styles.missionLabel}>Décision clé</span>
          <span className={styles.missionText}>{profile.decision}</span>
        </article>
        <article className={styles.missionCell}>
          <span className={styles.missionIcon}><OperatorEvidenceIcon size={15} aria-hidden="true" /></span>
          <span className={styles.missionLabel}>Preuve attendue</span>
          <span className={styles.missionText}>{profile.evidence}</span>
        </article>
      </section>

      {contextRow ? <div className={styles.contextRow}>{contextRow}</div> : null}
      <div className={styles.content}>{children}</div>
    </section>
  )
}
