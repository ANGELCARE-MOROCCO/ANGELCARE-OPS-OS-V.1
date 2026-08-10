'use client'

import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import styles from './PresenceZoneBFrame.module.css'

type Props = {
  open: boolean
  kind?: 'drawer' | 'chamber'
  eyebrow: string
  title: string
  description?: string
  dirty?: boolean
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}

export default function PresenceOverlay({ open, kind='drawer', eyebrow, title, description, dirty=false, onClose, children, footer }: Props) {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const [guardOpen, setGuardOpen] = useState(false)

  const requestClose = () => dirty ? setGuardOpen(true) : onClose()

  useEffect(() => {
    if (!open) return
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const root = document.querySelector<HTMLElement>('[data-zone-b-frame]')
    const previousOverflow = document.body.style.overflow
    const previousAria = root ? root.getAttribute('aria-hidden') : null
    const rootWithInert = root as (HTMLElement & { inert?: boolean }) | null
    const previousInert = rootWithInert?.inert
    document.body.style.overflow = 'hidden'
    if (root) root.setAttribute('aria-hidden','true')
    if (rootWithInert) rootWithInert.inert = true

    const frame = requestAnimationFrame(() => {
      const first = overlayRef.current?.querySelector<HTMLElement>('[data-autofocus],button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')
      first?.focus()
    })

    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); requestClose(); return }
      if (event.key !== 'Tab') return
      const focusables = Array.from(overlayRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])') || []).filter((node) => !node.hasAttribute('hidden'))
      if (!focusables.length) { event.preventDefault(); overlayRef.current?.focus(); return }
      const first = focusables[0], last = focusables[focusables.length-1], current = document.activeElement
      if (event.shiftKey && current === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && current === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', keyHandler)
    return () => {
      cancelAnimationFrame(frame); document.removeEventListener('keydown', keyHandler); document.body.style.overflow = previousOverflow
      if (root) { if (previousAria === null) root.removeAttribute('aria-hidden'); else root.setAttribute('aria-hidden', previousAria) }
      if (rootWithInert) rootWithInert.inert = Boolean(previousInert)
      previousFocus.current?.focus?.()
    }
  }, [open, dirty])

  useEffect(() => { if (!open) setGuardOpen(false) }, [open])
  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className={styles.overlayBackdrop} data-kind={kind} onMouseDown={(event) => { if (event.target === event.currentTarget) requestClose() }}>
      <div ref={overlayRef} className={styles.overlay} data-kind={kind} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        <header className={styles.overlayHeader}><div><div className={styles.overlayEyebrow}>{eyebrow}</div><h2 className={styles.overlayTitle}>{title}</h2>{description ? <p className={styles.overlayDescription}>{description}</p> : null}</div><button data-autofocus className={styles.closeButton} type="button" onClick={requestClose} aria-label="Fermer">×</button></header>
        <div className={styles.overlayBody}>{guardOpen ? <div className={styles.confirmGuard}><div className={styles.confirmTitle}>Modifications non enregistrées</div><div className={styles.confirmText}>Fermer maintenant abandonnera les changements préparés dans cette surface.</div><div><button className={styles.dangerButton} type="button" onClick={() => { setGuardOpen(false); onClose() }}>Abandonner et fermer</button> <button className={styles.secondaryButton} type="button" onClick={() => setGuardOpen(false)}>Continuer</button></div></div> : null}{children}</div>
        {footer ? <footer className={styles.overlayFooter}>{footer}</footer> : null}
      </div>
    </div>, document.body)
}
