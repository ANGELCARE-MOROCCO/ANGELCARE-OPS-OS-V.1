'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Command, Search, X } from 'lucide-react'
import { FLASHCARDS_STUDIO_ALL_ITEMS } from '@/lib/flashcards-os/studio-navigation'
import styles from './flashcards-studio-2030.module.css'

export default function FlashcardsCommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  useEffect(() => { if (!open) setQuery('') }, [open])
  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    return FLASHCARDS_STUDIO_ALL_ITEMS.filter((item) => !q || `${item.label} ${item.shortLabel} ${item.description}`.toLowerCase().includes(q)).slice(0, 14)
  }, [query])
  if (!open) return null
  return <div className={styles.paletteBackdrop} role="presentation" onMouseDown={onClose}>
    <section className={styles.palette} role="dialog" aria-modal="true" aria-label="Palette de commandes Flashcards OS" onMouseDown={(event: any) => event.stopPropagation()}>
      <header><Command size={18}/><input autoFocus value={query} onChange={(event: any) => setQuery(event.target.value)} placeholder="Ouvrir un atelier, créer, rechercher…"/><button type="button" onClick={onClose}><X size={17}/></button></header>
      <div className={styles.paletteResults}>{items.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={onClose}><span data-accent={item.accent}><Icon size={17}/></span><div><strong>{item.label}</strong><small>{item.description}</small></div></Link> })}</div>
      <footer><span><Search size={13}/> Recherche produit</span><span>↵ ouvrir</span><span>ESC fermer</span></footer>
    </section>
  </div>
}
