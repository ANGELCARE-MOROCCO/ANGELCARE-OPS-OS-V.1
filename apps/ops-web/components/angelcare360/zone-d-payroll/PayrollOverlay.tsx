'use client'

import { AlertTriangle, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from './PayrollZoneDFrame.module.css'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  eyebrow: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  kind?: 'drawer' | 'chamber' | 'peek'
  dirty?: boolean
}

export default function PayrollOverlay({ open, onClose, title, eyebrow, description, children, footer, kind = 'drawer', dirty = false }: Props) {
  const surfaceRef = useRef<HTMLElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  const closeNow = useCallback(() => {
    setConfirmDiscard(false)
    onClose()
  }, [onClose])

  const requestClose = useCallback(() => {
    if (dirty) {
      setConfirmDiscard(true)
      return
    }
    closeNow()
  }, [closeNow, dirty])

  useEffect(() => {
    if (!open) {
      setConfirmDiscard(false)
      return
    }
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const appRoot = document.querySelector('main')?.parentElement
    const hadInert = appRoot?.hasAttribute('inert') || false
    if (appRoot) appRoot.setAttribute('inert', '')

    const timer = window.setTimeout(() => {
      const focusRoot = confirmDiscard
        ? surfaceRef.current?.querySelector<HTMLElement>(`.${styles.discardGuardCard}`) || surfaceRef.current
        : surfaceRef.current
      const first = focusRoot?.querySelector<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')
      first?.focus()
    }, 10)

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (confirmDiscard) {
          setConfirmDiscard(false)
          return
        }
        requestClose()
        return
      }
      if (event.key !== 'Tab' || !surfaceRef.current) return
      const focusRoot = confirmDiscard
        ? surfaceRef.current.querySelector<HTMLElement>(`.${styles.discardGuardCard}`) || surfaceRef.current
        : surfaceRef.current
      const focusable = Array.from(focusRoot.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(el => !el.hasAttribute('hidden'))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(timer)
      document.body.style.overflow = previousOverflow
      if (appRoot && !hadInert) appRoot.removeAttribute('inert')
      document.removeEventListener('keydown', onKey)
      openerRef.current?.focus()
    }
  }, [open, confirmDiscard, requestClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className={styles.overlayBackdrop} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) requestClose() }}>
      <section ref={surfaceRef} className={`${styles.overlaySurface} ${styles[`overlay_${kind}`]}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className={styles.overlayHeader}>
          <div><span className={styles.eyebrow}>{eyebrow}</span><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>
          <button className={styles.iconButton} onClick={requestClose} aria-label="Fermer"><X size={18}/></button>
        </header>
        <div className={styles.overlayBody}>{children}</div>
        {footer ? <footer className={styles.overlayFooter}>{footer}</footer> : null}
        {confirmDiscard ? (
          <div className={styles.discardGuard} role="alertdialog" aria-modal="true" aria-labelledby="payroll-discard-title" aria-describedby="payroll-discard-copy">
            <div className={styles.discardGuardCard}>
              <span className={styles.discardIcon}><AlertTriangle size={20}/></span>
              <div>
                <strong id="payroll-discard-title">Modifications non enregistrées</strong>
                <p id="payroll-discard-copy">Fermer maintenant abandonnera les modifications saisies dans cette opération de paie.</p>
              </div>
              <div className={styles.discardActions}>
                <button className={styles.secondaryButton} onClick={() => setConfirmDiscard(false)}>Continuer l’édition</button>
                <button className={styles.dangerButton} onClick={closeNow}>Fermer sans enregistrer</button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>,
    document.body,
  )
}
