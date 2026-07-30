'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import styles from './Angelcare360OperatorExperience.module.css'

type Props = {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  variant?: 'default' | 'finance' | 'commercial' | 'support' | 'infrastructure' | 'governance' | 'danger'
}

export default function Angelcare360OperatorDrawer({ open, title, subtitle, onClose, children, footer, variant = 'default' }: Props) {
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose, open])

  if (!open) return null

  return (
    <div className={styles.drawerOverlay} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.drawer}
        data-variant={variant}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.drawerHeader}>
          <div>
            <div className={styles.drawerEyebrow}>Chambre d’action opérateur</div>
            <h3 className={styles.drawerTitle}>{title}</h3>
            {subtitle ? <p className={styles.drawerSubtitle}>{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} className={styles.drawerClose} aria-label="Fermer la chambre d’action">
            <X size={19} aria-hidden="true" />
          </button>
        </header>
        <div className={styles.drawerBody}>{children}</div>
        {footer ? <footer className={styles.drawerFooter}>{footer}</footer> : null}
      </section>
    </div>
  )
}
