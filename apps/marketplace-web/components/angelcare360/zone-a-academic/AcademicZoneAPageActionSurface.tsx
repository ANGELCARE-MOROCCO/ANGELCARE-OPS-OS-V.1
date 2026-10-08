'use client'

import type { ReactNode } from 'react'
import AcademicZoneACommandDrawer from './AcademicZoneACommandDrawer'
import styles from './AcademicZoneAChrome.module.css'

type SlotMeta = {
  label: string
  title: string
  eyebrow?: string
  description?: string
  size?: 'drawer' | 'chamber' | 'wide'
}

type Props = {
  children: ReactNode
  primarySlot?: SlotMeta | null
  primaryContent?: ReactNode
  secondarySlot?: SlotMeta | null
  secondaryContent?: ReactNode
}

export default function AcademicZoneAPageActionSurface({ children, primarySlot, primaryContent, secondarySlot, secondaryContent }: Props) {
  return (
    <div className={styles.pageActionSurface}>
      {primarySlot || secondarySlot ? (
        <div className={styles.pageActionDock} aria-label="Actions de page">
          <div>
            <span>Commandes contextuelles</span>
            <strong>Agir sans quitter le dossier</strong>
          </div>
          <div className={styles.pageActionButtons}>
            {secondarySlot && secondaryContent ? (
              <AcademicZoneACommandDrawer
                triggerLabel={secondarySlot.label}
                triggerKind="secondary"
                title={secondarySlot.title}
                eyebrow={secondarySlot.eyebrow}
                description={secondarySlot.description}
                size={secondarySlot.size}
              >
                {secondaryContent}
              </AcademicZoneACommandDrawer>
            ) : null}
            {primarySlot && primaryContent ? (
              <AcademicZoneACommandDrawer
                triggerLabel={primarySlot.label}
                title={primarySlot.title}
                eyebrow={primarySlot.eyebrow}
                description={primarySlot.description}
                size={primarySlot.size}
              >
                {primaryContent}
              </AcademicZoneACommandDrawer>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className={styles.operationalCanvas} data-zone-a-content="true">{children}</div>
    </div>
  )
}
