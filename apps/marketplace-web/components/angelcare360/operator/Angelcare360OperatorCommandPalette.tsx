'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CornerDownLeft, Search } from 'lucide-react'
import { ANGELCARE360_OPERATOR_NAVIGATION } from '@/data/angelcare360/operator-navigation'
import { OperatorNavigationIcon } from './Angelcare360OperatorIcons'
import OperatorOverlayPortal from './OperatorOverlayPortal'
import styles from './Angelcare360OperatorExperience.module.css'

type Props = {
  open: boolean
  onClose: () => void
  pathname: string
}

const items = ANGELCARE360_OPERATOR_NAVIGATION.flatMap((section) =>
  section.items.map((item) => ({ ...item, groupLabel: section.label })),
)

export default function Angelcare360OperatorCommandPalette({ open, onClose, pathname }: Props) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const normalized = normalize(query)
    if (!normalized) {
      const current = items.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
      const ordered = current ? [current, ...items.filter((item) => item.key !== current.key)] : items
      return ordered.slice(0, 12)
    }

    return items
      .map((item) => ({
        item,
        score: scoreResult(normalized, normalize(`${item.label} ${item.summary} ${item.groupLabel}`)),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item)
      .slice(0, 14)
  }, [pathname, query])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActiveIndex(0)
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 20)
    return () => window.clearTimeout(timeout)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((current) => Math.min(current + 1, Math.max(results.length - 1, 0)))
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((current) => Math.max(current - 1, 0))
      }
      if (event.key === 'Enter' && results[activeIndex]) {
        const anchor = document.querySelector<HTMLAnchorElement>(`[data-command-index="${activeIndex}"]`)
        anchor?.click()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeIndex, onClose, open, results])

  useEffect(() => setActiveIndex(0), [query])

  if (!open) return null

  return (
    <OperatorOverlayPortal>
      <div className={styles.paletteOverlay} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.palette}
        role="dialog"
        aria-modal="true"
        aria-label="Centre de commande AngelCare 360 Operator"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.paletteHeader}>
          <Search size={19} aria-hidden="true" />
          <input
            ref={inputRef}
            className={styles.paletteInput}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Trouver un client, un espace ou une mission opérateur…"
            aria-label="Rechercher dans le backoffice opérateur"
          />
          <span className={styles.paletteEsc}>ESC</span>
        </div>

        <div className={styles.paletteBody}>
          <div className={styles.paletteGroupLabel}>{query ? 'Résultats de navigation' : 'Accès opérateur immédiat'}</div>
          {results.length ? (
            results.map((item, index) => (
              <Link
                key={item.key}
                href={item.href}
                data-command-index={index}
                className={`${styles.paletteItem} ${index === activeIndex ? styles.paletteItemActive : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={onClose}
              >
                <span className={styles.paletteItemIcon}><OperatorNavigationIcon itemKey={item.key} size={18} /></span>
                <span>
                  <span className={styles.paletteItemLabel}>{item.label}</span>
                  <span className={styles.paletteItemSummary}>{item.groupLabel} · {item.summary}</span>
                </span>
                <ArrowRight className={styles.paletteArrow} size={16} aria-hidden="true" />
              </Link>
            ))
          ) : (
            <div className={styles.paletteEmpty}>Aucun espace ne correspond à cette recherche.</div>
          )}
        </div>

        <footer className={styles.paletteFooter}>
          <span>↑ ↓ pour parcourir</span>
          <span><CornerDownLeft size={11} aria-hidden="true" /> Entrée pour ouvrir</span>
          <span>Échap pour fermer</span>
        </footer>
      </section>
      </div>
    </OperatorOverlayPortal>
  )
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function scoreResult(query: string, value: string) {
  if (value === query) return 100
  if (value.startsWith(query)) return 80
  if (value.includes(query)) return 55
  const terms = query.split(/\s+/).filter(Boolean)
  const matched = terms.filter((term) => value.includes(term)).length
  return matched ? matched * 12 : 0
}
