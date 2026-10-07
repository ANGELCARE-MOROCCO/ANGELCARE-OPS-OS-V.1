'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import styles from './living-marketplace.module.css'

/** Native touch scrolling; mouse drag starts only after movement, preserving clicks. */
export function CommerceRail({ children, label, locale = 'fr', compact = false, className = '' }: {
  children: ReactNode; label: string; locale?: 'fr' | 'en' | 'ar'; compact?: boolean; className?: string
}) {
  const rail = useRef<HTMLDivElement>(null)
  const gesture = useRef({ x: 0, scroll: 0, pointer: -1, moved: false })
  const suppressClick = useRef(false)
  const [position, setPosition] = useState({ start: true, end: true, progress: 0 })
  useEffect(() => {
    const el = rail.current
    if (!el) return
    const update = () => {
      const total = Math.max(0, el.scrollWidth - el.clientWidth)
      const current = Math.abs(el.scrollLeft)
      setPosition({ start: current < 2, end: total - current < 2, progress: total ? current / total : 0 })
    }
    const observer = new ResizeObserver(update)
    observer.observe(el)
    for (const child of el.children) observer.observe(child)
    el.addEventListener('scroll', update, { passive: true })
    update()
    return () => { observer.disconnect(); el.removeEventListener('scroll', update) }
  }, [children])
  const move = (direction: -1 | 1) => {
    const el = rail.current
    if (!el) return
    const rtl = getComputedStyle(el).direction === 'rtl'
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: direction * (rtl ? -1 : 1) * Math.max(180, el.clientWidth * .8), behavior: reduced ? 'auto' : 'smooth' })
  }
  const end = () => {
    const el = rail.current, drag = gesture.current
    if (drag.pointer < 0) return
    if (el?.hasPointerCapture(drag.pointer)) el.releasePointerCapture(drag.pointer)
    if (drag.moved) suppressClick.current = true
    drag.pointer = -1
    drag.moved = false
    if (el) delete el.dataset.dragging
  }
  const previous = locale === 'ar' ? 'السابق' : locale === 'en' ? 'Previous' : 'Précédent'
  const next = locale === 'ar' ? 'التالي' : locale === 'en' ? 'Next' : 'Suivant'
  return <div className={styles.railShell} data-compact={compact || undefined}>
    <div className={styles.railToolbar}>
      <span>{locale === 'fr' ? 'Glissez pour explorer' : locale === 'en' ? 'Swipe to explore' : 'مرّر للاستكشاف'}</span>
      <div><button type="button" disabled={position.start} onClick={() => move(-1)} aria-label={`${label} · ${previous}`}>{locale === 'ar' ? <ChevronRight/> : <ChevronLeft/>}</button><button type="button" disabled={position.end} onClick={() => move(1)} aria-label={`${label} · ${next}`}>{locale === 'ar' ? <ChevronLeft/> : <ChevronRight/>}</button></div>
    </div>
    <div className={`${styles.commerceRail} ${className}`} ref={rail} tabIndex={0} role="region" aria-label={label}
      onDragStart={event => event.preventDefault()}
      onKeyDown={event => {
        if (event.target !== event.currentTarget) return
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault()
          const rtl = locale === 'ar'
          move(event.key === 'ArrowRight' ? (rtl ? -1 : 1) : (rtl ? 1 : -1))
        }
      }}
      onPointerDown={event => {
        suppressClick.current = false
        if (event.pointerType !== 'mouse' || event.button !== 0 || (event.target as HTMLElement).closest('button,input,select,textarea,summary')) return
        gesture.current = { x: event.clientX, scroll: event.currentTarget.scrollLeft, pointer: event.pointerId, moved: false }
      }}
      onPointerMove={event => {
        const drag = gesture.current
        if (drag.pointer !== event.pointerId) return
        const delta = event.clientX - drag.x
        if (!drag.moved && Math.abs(delta) < 6) return
        if (!drag.moved) {
          drag.moved = true
          event.currentTarget.setPointerCapture(event.pointerId)
          event.currentTarget.dataset.dragging = 'true'
        }
        event.preventDefault()
        event.currentTarget.scrollLeft = drag.scroll - delta
      }}
      onPointerUp={end} onPointerCancel={end}
      onPointerLeave={() => { if (!gesture.current.moved) gesture.current.pointer = -1 }}
      onClickCapture={event => {
        if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false }
      }}>
      {children}
    </div>
    <div className={styles.railProgress} aria-hidden="true"><span style={{ transform: `translateX(${(locale === 'ar' ? -1 : 1) * position.progress * 300}%)` }}/></div>
  </div>
}
