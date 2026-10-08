'use client'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './AcademicZoneAChrome.module.css'

type Size = 'drawer' | 'chamber' | 'wide'
type TriggerKind = 'primary' | 'secondary' | 'quiet'

type BaseProps = {
  title: string
  eyebrow?: string
  description?: string
  size?: Size
  children: ReactNode
  footer?: ReactNode
}

type TriggerProps = BaseProps & {
  triggerLabel: string
  triggerKind?: TriggerKind
  defaultOpen?: boolean
}

type ControlledProps = BaseProps & {
  open: boolean
  onClose: () => void
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function getFocusable(container: HTMLElement | null) {
  if (!container) return []
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((node) => {
    if (node.getAttribute('aria-hidden') === 'true') return false
    const style = globalThis.getComputedStyle?.(node)
    return style ? style.visibility !== 'hidden' && style.display !== 'none' : true
  })
}

function useOverlayLifecycle(open: boolean, panelRef: React.RefObject<HTMLElement | null>, requestClose: () => void) {
  const previousFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const siblings = [...document.body.children].filter((element) => !element.hasAttribute('data-zone-a-overlay-root')) as HTMLElement[]
    const previousStates = siblings.map((element) => ({
      element,
      inert: element.inert,
      ariaHidden: element.getAttribute('aria-hidden'),
    }))
    for (const element of siblings) {
      element.inert = true
      element.setAttribute('aria-hidden', 'true')
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        requestClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = getFocusable(panelRef.current)
      if (!focusable.length) {
        event.preventDefault()
        panelRef.current?.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || !panelRef.current?.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown, true)
      for (const state of previousStates) {
        state.element.inert = state.inert
        if (state.ariaHidden === null) state.element.removeAttribute('aria-hidden')
        else state.element.setAttribute('aria-hidden', state.ariaHidden)
      }
      previousFocus.current?.focus({ preventScroll: true })
    }
  }, [open, panelRef, requestClose])
}

function Overlay({ open, onClose, title, eyebrow = 'Command surface', description, size = 'drawer', children, footer }: ControlledProps) {
  const [dirty, setDirty] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [closeConfirm, setCloseConfirm] = useState(false)
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLElement | null>(null)

  useEffect(() => setMounted(true), [])
  useEffect(() => {
    if (!open) return
    setDirty(false)
    setCloseConfirm(false)
    const timer = globalThis.setTimeout(() => {
      const target = getFocusable(panelRef.current)[0] || panelRef.current
      target?.focus({ preventScroll: true })
    }, 35)
    return () => globalThis.clearTimeout(timer)
  }, [open])

  const forceClose = useCallback(() => {
    setCloseConfirm(false)
    setDirty(false)
    onClose()
  }, [onClose])

  const requestClose = useCallback(() => {
    if (dirty) {
      setCloseConfirm(true)
      return
    }
    forceClose()
  }, [dirty, forceClose])

  useOverlayLifecycle(open, panelRef, requestClose)

  if (!mounted || !open) return null

  return createPortal(
    <div className={styles.overlayRoot} role="presentation" data-zone-a-overlay="true" data-zone-a-overlay-root="true">
      <button type="button" aria-label="Fermer" className={styles.overlayBackdrop} onClick={requestClose} />
      <section
        ref={panelRef}
        className={styles.overlayPanel}
        data-size={size}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onInputCapture={() => setDirty(true)}
        onChangeCapture={() => setDirty(true)}
      >
        <header className={styles.overlayHeader}>
          <div>
            <span>{eyebrow}</span>
            <h2 id={titleId}>{title}</h2>
            {description ? <p id={descriptionId}>{description}</p> : null}
          </div>
          <div className={styles.overlayHeaderActions}>
            {dirty ? <span className={styles.dirtyPill}>Modification en cours</span> : null}
            <button type="button" className={styles.closeButton} onClick={requestClose} aria-label="Fermer la surface">×</button>
          </div>
        </header>
        <div className={styles.overlayCommandStrip} aria-label="Garanties de la surface">
          <span>Contexte conservé</span>
          <span>Focus clavier contenu</span>
          <span>Échap pour fermer</span>
          <span>Historique préservé</span>
        </div>
        <div className={styles.overlayBody}>{children}</div>
        {footer ? <footer className={styles.overlayFooter}>{footer}</footer> : null}

        {closeConfirm ? (
          <div className={styles.closeGuard} role="alertdialog" aria-modal="true" aria-label="Modifications non enregistrées">
            <div className={styles.closeGuardCard}>
              <span>Protection du travail</span>
              <strong>Des modifications ne sont pas encore confirmées.</strong>
              <p>Vous pouvez continuer à travailler ou fermer cette surface sans enregistrer les changements saisis.</p>
              <div>
                <button type="button" autoFocus onClick={() => setCloseConfirm(false)}>Continuer</button>
                <button type="button" data-danger="true" onClick={forceClose}>Fermer sans enregistrer</button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>,
    document.body,
  )
}

export function AcademicZoneAOverlay(props: ControlledProps) {
  return <Overlay {...props} />
}

export default function AcademicZoneACommandDrawer({ triggerLabel, triggerKind = 'primary', defaultOpen = false, ...overlayProps }: TriggerProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <>
      <button type="button" className={styles.drawerTrigger} data-kind={triggerKind} onClick={() => setOpen(true)}>
        <span>{triggerLabel}</span>
        <b aria-hidden="true">↗</b>
      </button>
      <Overlay {...overlayProps} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
