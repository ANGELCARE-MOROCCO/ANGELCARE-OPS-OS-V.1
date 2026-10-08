'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AcademicZoneAOverlay } from './AcademicZoneACommandDrawer'
import styles from './AcademicZoneAChrome.module.css'

export type ZoneAQuickCommandAction = {
  label: string
  href: string
  detail: string
}

export default function AcademicZoneAQuickCommand({
  label,
  title,
  eyebrow,
  description,
  actions,
}: {
  label: string
  title: string
  eyebrow: string
  description: string
  actions: ZoneAQuickCommandAction[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" className={styles.quickCommandTrigger} onClick={() => setOpen(true)}>
        <span>{eyebrow}</span>
        <strong>{label}</strong>
      </button>
      <AcademicZoneAOverlay
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        eyebrow={eyebrow}
        description={description}
        size="drawer"
      >
        <div className={styles.quickCommandBody}>
          {actions.map((action) => (
            <Link key={action.href} href={action.href} className={styles.quickCommandAction} onClick={() => setOpen(false)}>
              <span>{action.label}</span>
              <small>{action.detail}</small>
            </Link>
          ))}
        </div>
      </AcademicZoneAOverlay>
    </>
  )
}
