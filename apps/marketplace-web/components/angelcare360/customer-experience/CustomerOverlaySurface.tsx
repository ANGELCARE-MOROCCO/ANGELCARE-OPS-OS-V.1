'use client'

import { AlertTriangle } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import type { CustomerOverlayKind } from '@/types/angelcare360/customer-overlay'
import CustomerOverlayPortal from './CustomerOverlayPortal'
import { useCustomerOverlayKernel } from './CustomerOverlayProvider'
import styles from './CustomerOverlaySurface.module.css'

type Props = {
  kind: CustomerOverlayKind
  children: ReactNode
  onClose?: () => void
  className?: string
  dirty?: boolean
  dismissible?: boolean
  backdropDismiss?: boolean
  ariaLabel?: string
}

const FOCUSABLE = 'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])'

export default function CustomerOverlaySurface({
  kind,
  children,
  onClose,
  className,
  dirty = false,
  dismissible = true,
  backdropDismiss = true,
  ariaLabel,
}: Props) {
  const reactId = useId()
  const id = `ac-overlay-${reactId.replaceAll(':', '')}`
  const kernel = useCustomerOverlayKernel()
  const { register, unregister, topId } = kernel
  const rootRef = useRef<HTMLDivElement | null>(null)
  const discardRef = useRef<HTMLDivElement | null>(null)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const onCloseRef = useRef(onClose)
  const dirtyRef = useRef(dirty)
  const dismissibleRef = useRef(dismissible)
  const confirmDiscardRef = useRef(confirmDiscard)
  onCloseRef.current = onClose
  dirtyRef.current = dirty
  dismissibleRef.current = dismissible
  confirmDiscardRef.current = confirmDiscard

  const requestClose = useCallback(() => {
    if (confirmDiscardRef.current) {
      setConfirmDiscard(false)
      return
    }
    if (!dismissibleRef.current || !onCloseRef.current) return
    if (dirtyRef.current) {
      setConfirmDiscard(true)
      return
    }
    onCloseRef.current()
  }, [])

  useEffect(() => {
    register({
      id,
      kind,
      parentId: topId(),
      requestClose,
      trigger: document.activeElement instanceof HTMLElement ? document.activeElement : null,
    })
    return () => unregister(id)
  }, [id, register, requestClose, topId, unregister])

  const top = kernel.isTop(id)

  useEffect(() => {
    if (!top) return
    const frame = window.requestAnimationFrame(() => {
      const scope = confirmDiscard ? discardRef.current : rootRef.current
      const preferred = scope?.querySelector<HTMLElement>('[data-overlay-autofocus]')
      const first = scope?.querySelector<HTMLElement>(FOCUSABLE)
      ;(preferred || first || rootRef.current)?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [confirmDiscard, top])

  function trapFocus(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!top || event.key !== 'Tab') return
    const scope = confirmDiscard ? discardRef.current : rootRef.current
    if (!scope) return
    const nodes = Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((node) => node.offsetParent !== null)
    if (!nodes.length) {
      event.preventDefault()
      scope.focus()
      return
    }
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  function onBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (!top || !backdropDismiss || event.target !== event.currentTarget) return
    requestClose()
  }

  return <CustomerOverlayPortal>
    <div
      ref={rootRef}
      className={`${styles.surface}${className ? ` ${className}` : ''}`}
      data-customer-overlay-surface="true"
      data-kind={kind}
      data-top={top ? 'true' : 'false'}
      data-overlay-id={id}
      data-overlay-depth={kernel.depthOf(id)}
      aria-label={ariaLabel}
      aria-hidden={top ? undefined : true}
      tabIndex={-1}
      onMouseDown={onBackdrop}
      onKeyDown={trapFocus}
    >
      {children}
      {confirmDiscard ? <div ref={discardRef} className={styles.discardLayer} role="alertdialog" aria-modal="true" aria-labelledby={`${id}-discard-title`} tabIndex={-1}>
        <section className={styles.discardDialog}>
          <div className={styles.discardCrown}>
            <span className={styles.discardIcon}><AlertTriangle size={21}/></span>
            <div><h3 id={`${id}-discard-title`}>Fermer sans enregistrer ?</h3><p>Vous avez commencé à modifier ce dossier. Ces changements seront perdus si vous fermez maintenant.</p></div>
          </div>
          <div className={styles.discardActions}>
            <button type="button" data-overlay-autofocus onClick={() => setConfirmDiscard(false)}>Revenir au dossier</button>
            <button type="button" data-danger="true" onClick={() => { setConfirmDiscard(false); onCloseRef.current?.() }}>Fermer et perdre mes modifications</button>
          </div>
        </section>
      </div> : null}
    </div>
  </CustomerOverlayPortal>
}
