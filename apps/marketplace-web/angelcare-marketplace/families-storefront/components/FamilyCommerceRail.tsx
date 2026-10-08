'use client'
import { useRef, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { CatalogLocale } from '@/angelcare-marketplace/catalog-discovery/types'
import { familyWords } from '../experience'
import styles from './families-storefront.module.css'
export function FamilyCommerceRail({ children, label, locale = 'fr' }: { children: ReactNode; label: string; locale?: CatalogLocale }) {
  const rail = useRef<HTMLDivElement>(null)
  const drag = useRef({ pointer: -1, x: 0, scroll: 0, moved: false })
  const move = (direction: number) => {
    const element = rail.current
    if (!element) return
    element.scrollBy({ left: direction * (locale === 'ar' ? -1 : 1) * element.clientWidth * .8, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }
  const finish = () => {
    if (drag.current.pointer < 0) return
    const element = rail.current
    if (element?.hasPointerCapture(drag.current.pointer)) element.releasePointerCapture(drag.current.pointer)
    drag.current.pointer = -1
  }
  return <div className={styles.railShell}>
    <div className={styles.railControls}>
      <button type="button" onClick={() => move(-1)} aria-label={label + ' · ' + familyWords(['Précédent', 'Previous', 'السابق'], locale)}><ChevronLeft /></button>
      <button type="button" onClick={() => move(1)} aria-label={label + ' · ' + familyWords(['Suivant', 'Next', 'التالي'], locale)}><ChevronRight /></button>
    </div>
    <div className={styles.commerceRail} ref={rail} tabIndex={0} role="region" aria-label={label}
      onKeyDown={event => {
        if (event.target !== event.currentTarget) return
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1) }
      }}
      onPointerDown={event => {
        drag.current.moved = false
        if (event.pointerType !== 'mouse' || event.button !== 0 || (event.target as HTMLElement).closest('button,input,select')) return
        drag.current = { pointer: event.pointerId, x: event.clientX, scroll: event.currentTarget.scrollLeft, moved: false }
      }}
      onPointerMove={event => {
        const state = drag.current
        if (state.pointer !== event.pointerId || !rail.current) return
        const delta = event.clientX - state.x
        if (!state.moved && Math.abs(delta) < 6) return
        if (!state.moved) { state.moved = true; rail.current.setPointerCapture(event.pointerId) }
        rail.current.scrollLeft = state.scroll - delta
        event.preventDefault()
      }}
      onPointerLeave={() => { if (!drag.current.moved) drag.current.pointer = -1 }}
      onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}
      onDragStart={event => event.preventDefault()}
      onClickCapture={event => { if (drag.current.moved) { event.preventDefault(); event.stopPropagation(); drag.current.moved = false } }}
    >{children}</div>
  </div>
}
