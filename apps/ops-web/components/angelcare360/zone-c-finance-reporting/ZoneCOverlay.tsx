'use client'

import { createPortal } from 'react-dom'
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import styles from './ZoneCFrame.module.css'

type Props = {
  open: boolean
  kind?: 'drawer' | 'chamber' | 'focus'
  eyebrow: string
  title: string
  description?: string
  dirty?: boolean
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export default function ZoneCOverlay({ open, kind='drawer', eyebrow, title, description, dirty=false, onClose, children, footer }: Props) {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const [guardOpen, setGuardOpen] = useState(false)
  const dirtyRef = useRef(dirty)
  const closeRef = useRef(onClose)
  dirtyRef.current = dirty
  closeRef.current = onClose

  const requestClose = () => dirtyRef.current ? setGuardOpen(true) : closeRef.current()

  useEffect(() => {
    if (!open) return
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const root = document.querySelector<HTMLElement>('[data-zone-c-frame]')
    const bodyOverflow = document.body.style.overflow
    const rootAria = root?.getAttribute('aria-hidden') ?? null
    const inertRoot = root as (HTMLElement & { inert?: boolean }) | null
    const previousInert = inertRoot?.inert
    document.body.style.overflow = 'hidden'
    if (root) root.setAttribute('aria-hidden','true')
    if (inertRoot) inertRoot.inert = true

    const focusFrame = requestAnimationFrame(() => {
      const first = overlayRef.current?.querySelector<HTMLElement>('[data-autofocus],button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')
      first?.focus()
    })

    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        requestClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusables = Array.from(overlayRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])') || []).filter((node) => !node.hasAttribute('hidden') && node.getAttribute('aria-hidden') !== 'true')
      if (!focusables.length) {
        event.preventDefault()
        overlayRef.current?.focus()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const current = document.activeElement
      if (event.shiftKey && current === first) {
        event.preventDefault(); last.focus()
      } else if (!event.shiftKey && current === last) {
        event.preventDefault(); first.focus()
      }
    }
    document.addEventListener('keydown', keyHandler)
    return () => {
      cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', keyHandler)
      document.body.style.overflow = bodyOverflow
      if (root) {
        if (rootAria === null) root.removeAttribute('aria-hidden')
        else root.setAttribute('aria-hidden', rootAria)
      }
      if (inertRoot) inertRoot.inert = Boolean(previousInert)
      previousFocus.current?.focus?.()
    }
  }, [open])

  useEffect(() => { if (!open) setGuardOpen(false) }, [open])
  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className={styles.overlayBackdrop} data-kind={kind} onMouseDown={(event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) requestClose() }}>
      <div ref={overlayRef} className={styles.overlay} data-kind={kind} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        <header className={styles.overlayHeader}>
          <div><div className={styles.overlayEyebrow}>{eyebrow}</div><h2 className={styles.overlayTitle}>{title}</h2>{description ? <p className={styles.overlayDescription}>{description}</p> : null}</div>
          <button data-autofocus className={styles.closeButton} type="button" onClick={requestClose} aria-label="Fermer la surface">×</button>
        </header>
        <div className={styles.overlayBody}>
          {guardOpen ? <div className={styles.confirmGuard}><strong>Modifications locales non confirmées</strong><p>Fermer maintenant abandonnera uniquement les choix préparés dans cette surface. Aucune écriture financière n’est modifiée tant que le flux canonique n’a pas confirmé l’action.</p><div><button className={styles.dangerButton} type="button" onClick={() => { setGuardOpen(false); closeRef.current() }}>Abandonner et fermer</button><button className={styles.secondaryButton} type="button" onClick={() => setGuardOpen(false)}>Continuer</button></div></div> : null}
          {children}
        </div>
        {footer ? <footer className={styles.overlayFooter}>{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  )
}
