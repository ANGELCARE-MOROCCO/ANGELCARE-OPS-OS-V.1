'use client'

import Link from 'next/link'
import { Bell, Command, Menu, ShieldCheck } from 'lucide-react'
import SanilaLogo from '@/components/brand/SanilaLogo'
import type { Angelcare360AccessProfile, Angelcare360SessionUser } from '@/types/angelcare360/module'
import type { Angelcare360OperatorExperienceProfile } from './Angelcare360OperatorExperience'
import styles from './Angelcare360OperatorExperience.module.css'

type Props = {
  user: Angelcare360SessionUser
  access: Angelcare360AccessProfile
  pathname: string
  profile: Angelcare360OperatorExperienceProfile
  onToggleSidebar: () => void
  onOpenCommand: () => void
  showMenuButton: boolean
}

export default function Angelcare360OperatorHeader({
  user,
  access,
  profile,
  onToggleSidebar,
  onOpenCommand,
  showMenuButton,
}: Props) {
  const displayName = user.full_name || user.name || user.email || 'Opérateur AngelCare'
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'AC'

  return (
    <header className={styles.header}>
      <div className={styles.headerIdentity}>
        {showMenuButton ? (
          <button type="button" className={`${styles.iconButton} ${styles.menuButton}`} onClick={onToggleSidebar} aria-label="Ouvrir la navigation opérateur">
            <Menu size={18} aria-hidden="true" />
          </button>
        ) : null}
        <Link href="/angelcare-360-operator" className={styles.headerBrandLink} aria-label="Retour au commandement SANILA Operator">
          <SanilaLogo variant="normal" width={118} height={41} priority />
          <span className={styles.headerBrandCopy}>
            <span className={styles.headerProduct}>SANILA OPERATING SYSTEM</span>
            <span className={styles.headerRoute}>{profile.districtLabel} · {profile.routeLabel}</span>
          </span>
        </Link>
      </div>

      <button type="button" className={styles.commandButton} onClick={onOpenCommand} aria-label="Ouvrir le centre de commande">
        <Command size={17} aria-hidden="true" />
        <span className={styles.commandText}>Rechercher un espace ou lancer une navigation opérateur</span>
        <span className={styles.commandKey}>⌘ K</span>
      </button>

      <div className={styles.headerActions}>
        <Link className={styles.iconButton} href="/angelcare-360-operator/service-operations" aria-label="Ouvrir les alertes et opérations de service">
          <Bell size={17} aria-hidden="true" />
        </Link>
        <Link className={styles.iconButton} href="/angelcare-360-operator/audit" aria-label="Ouvrir l’audit opérateur">
          <ShieldCheck size={17} aria-hidden="true" />
        </Link>
        <div className={styles.sessionChip} title={`${displayName} · ${access.summary}`}>
          <span className={styles.avatar}>{initials}</span>
          <span className={styles.sessionText}>
            <span className={styles.sessionName}>{displayName}</span>
            <span className={styles.sessionRole}>{access.summary}</span>
          </span>
        </div>
      </div>
    </header>
  )
}
