'use client'

import { createPortal } from 'react-dom'
import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, ArrowLeft, Expand, Minimize2, X } from 'lucide-react'
import styles from './SovereignExperience.module.css'

export type SovereignPortalSize = 'inspector' | 'operational' | 'mission' | 'full'
export type SovereignPortalTone = 'neutral' | 'commercial' | 'tenant' | 'finance' | 'service' | 'governance' | 'danger'

type Props = {
  open: boolean
  title: string
  eyebrow?: string
  subtitle?: string
  size?: SovereignPortalSize
  tone?: SovereignPortalTone
  breadcrumbs?: string[]
  children: ReactNode
  footer?: ReactNode
  sidecar?: ReactNode
  dirty?: boolean
  onClose: () => void
  onBack?: () => void
}

export default function SovereignPortal({
  open,
  title,
  eyebrow = 'Portail opérationnel souverain',
  subtitle,
  size = 'operational',
  tone = 'neutral',
  breadcrumbs = [],
  children,
  footer,
  sidecar,
  dirty = false,
  onClose,
  onBack,
}: Props) {
  const [mounted, setMounted] = useState(false)
  const [expanded, setExpanded] = useState(size === 'full')
  const [confirmClose, setConfirmClose] = useState(false)
  const titleId = useId()
  const panelRef = useRef<HTMLElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => setMounted(true), [])
  useEffect(() => setExpanded(size === 'full'), [size])

  useEffect(() => {
    if (!open || !mounted) return
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    const previousPadding = document.body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`

    const frame = window.requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>('[data-autofocus],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]')
      first?.focus()
    })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        requestClose()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusables = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])'))
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      window.cancelAnimationFrame(frame)
      document.body.style.overflow = previousOverflow
      document.body.style.paddingRight = previousPadding
      document.removeEventListener('keydown', onKeyDown, true)
      previousFocusRef.current?.focus()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted, dirty])

  function requestClose() {
    if (dirty) {
      setConfirmClose(true)
      return
    }
    onClose()
  }

  if (!open || !mounted) return null

  const portal = (
    <div className={styles.portalRoot} data-tone={tone} role="presentation">
      <button type="button" className={styles.portalBackdrop} aria-label="Fermer" onClick={requestClose} />
      <section
        ref={(node: HTMLElement | null) => { panelRef.current = node }}
        className={styles.portalPanel}
        data-size={expanded ? 'full' : size}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className={styles.portalCrown}>
          <div className={styles.portalCrownControls}>
            {onBack ? (
              <button type="button" className={styles.portalIconButton} onClick={onBack} aria-label="Retour au contexte parent">
                <ArrowLeft size={18} />
              </button>
            ) : null}
            <button type="button" className={styles.portalIconButton} onClick={() => setExpanded((value) => !value)} aria-label={expanded ? 'Réduire le portail' : 'Agrandir le portail'}>
              {expanded ? <Minimize2 size={18} /> : <Expand size={18} />}
            </button>
            <button type="button" className={styles.portalIconButton} onClick={requestClose} aria-label="Fermer le portail">
              <X size={19} />
            </button>
          </div>
          {breadcrumbs.length ? (
            <div className={styles.portalBreadcrumbs}>{breadcrumbs.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div>
          ) : null}
          <div className={styles.portalEyebrow}>{eyebrow}</div>
          <h2 id={titleId} className={styles.portalTitle}>{title}</h2>
          {subtitle ? <p className={styles.portalSubtitle}>{subtitle}</p> : null}
        </header>

        <div className={styles.portalWorkspace} data-sidecar={sidecar ? 'true' : 'false'}>
          <div className={styles.portalBody}>{children}</div>
          {sidecar ? <aside className={styles.portalSidecar}>{sidecar}</aside> : null}
        </div>
        {footer ? <footer className={styles.portalFooter}>{footer}</footer> : null}
      </section>

      {confirmClose ? (
        <div className={styles.unsavedOverlay} role="alertdialog" aria-modal="true" aria-label="Modifications non enregistrées">
          <div className={styles.unsavedDialog}>
            <span className={styles.unsavedIcon}><AlertTriangle size={20} /></span>
            <h3>Quitter sans enregistrer ?</h3>
            <p>Des informations ont été modifiées dans ce portail. Elles seront perdues si vous le fermez maintenant.</p>
            <div className={styles.unsavedActions}>
              <button type="button" onClick={() => setConfirmClose(false)}>Continuer la saisie</button>
              <button type="button" data-danger onClick={() => { setConfirmClose(false); onClose() }}>Quitter sans enregistrer</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )

  return createPortal(portal, document.body)
}
