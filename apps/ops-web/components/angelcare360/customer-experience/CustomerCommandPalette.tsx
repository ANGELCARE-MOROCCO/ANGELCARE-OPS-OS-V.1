'use client'

import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ANGELCARE360_ROUTE_BINDINGS } from '@/data/angelcare360/product-constitution'
import CustomerOverlayPortal from './CustomerOverlayPortal'
import styles from './CustomerCommandPalette.module.css'

const EVENT_NAME = 'angelcare360:command-palette'

export function openCustomerCommandPalette() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENT_NAME))
}

export default function CustomerCommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const openPalette = () => setOpen(true)
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
      }
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener(EVENT_NAME, openPalette)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener(EVENT_NAME, openPalette)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => { document.body.style.overflow = previous }
  }, [open])

  const routes = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const unique = new Map<string, (typeof ANGELCARE360_ROUTE_BINDINGS)[number]>()
    for (const route of ANGELCARE360_ROUTE_BINDINGS) {
      if (route.detail || route.route.includes('[')) continue
      if (!unique.has(route.route)) unique.set(route.route, route)
    }
    return [...unique.values()]
      .filter((route) => !normalized || `${route.label} ${route.moduleKey} ${route.capabilityKey}`.toLowerCase().includes(normalized))
      .slice(0, 24)
  }, [query])

  if (!open) return null

  return <CustomerOverlayPortal>
    <div className={styles.backdrop} role="presentation" onMouseDown={() => setOpen(false)}>
      <section className={styles.palette} role="dialog" aria-modal="true" aria-label="Recherche AngelCare 360" onMouseDown={(event) => event.stopPropagation()}>
        <header className={styles.header}>
          <Search size={20} />
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un espace, une capacité ou une opération…" aria-label="Rechercher dans AngelCare 360" />
          <button type="button" onClick={() => setOpen(false)} aria-label="Fermer la recherche"><X size={18} /></button>
        </header>
        <div className={styles.results}>
          {routes.length ? routes.map((route) => <Link key={route.route} href={route.route} onClick={() => setOpen(false)}>
            <span className={styles.module}>{route.moduleKey.replaceAll('_', ' ')}</span>
            <strong>{route.label}</strong>
            <small>{route.capabilityKey.replaceAll('.', ' · ')}</small>
          </Link>) : <div className={styles.empty}><strong>Aucun espace correspondant</strong><span>Vérifiez le terme recherché ou utilisez la navigation principale.</span></div>}
        </div>
        <footer className={styles.footer}><span>⌘ K pour ouvrir</span><span>Échap pour fermer</span><span>{routes.length} résultats</span></footer>
      </section>
    </div>
  </CustomerOverlayPortal>
}
