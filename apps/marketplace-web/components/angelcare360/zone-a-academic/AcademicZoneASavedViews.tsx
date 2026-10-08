'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import styles from './AcademicZoneAChrome.module.css'

type SavedView = { id: string; label: string; href: string }
const STORAGE_KEY = 'angelcare360.zoneA.savedViews.v1'

function readSavedViews(): SavedView[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed)
      ? parsed.filter((item): item is SavedView => Boolean(item && typeof item.id === 'string' && typeof item.label === 'string' && typeof item.href === 'string')).slice(0, 6)
      : []
  } catch {
    return []
  }
}

export default function AcademicZoneASavedViews() {
  const [views, setViews] = useState<SavedView[]>([])
  const [currentHref, setCurrentHref] = useState('')

  useEffect(() => {
    setViews(readSavedViews())
    setCurrentHref(`${window.location.pathname}${window.location.search}`)
  }, [])

  const alreadySaved = useMemo(() => views.some((item) => item.href === currentHref), [views, currentHref])

  function saveCurrent() {
    if (!currentHref || alreadySaved) return
    const routeLabel = document.querySelector('h1')?.textContent?.trim() || 'Vue académique'
    const next = [{ id: `${Date.now()}`, label: routeLabel, href: currentHref }, ...views].slice(0, 6)
    setViews(next)
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* local preference only */ }
  }

  function removeView(id: string) {
    const next = views.filter((item) => item.id !== id)
    setViews(next)
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* local preference only */ }
  }

  return (
    <aside className={styles.savedViews} aria-label="Vues académiques enregistrées">
      <div className={styles.savedViewsHead}>
        <div><span>MES VUES</span><strong>Contexte de travail</strong></div>
        <button type="button" onClick={saveCurrent} disabled={!currentHref || alreadySaved}>{alreadySaved ? 'Vue enregistrée' : 'Enregistrer cette vue'}</button>
      </div>
      {views.length ? (
        <div className={styles.savedViewsList}>
          {views.map((view) => (
            <span key={view.id} className={styles.savedViewChip}>
              <Link href={view.href}>{view.label}</Link>
              <button type="button" aria-label={`Retirer ${view.label}`} onClick={() => removeView(view.id)}>×</button>
            </span>
          ))}
        </div>
      ) : <p>Aucune vue enregistrée sur cet appareil. Les préférences restent locales et ne créent aucune donnée serveur.</p>}
    </aside>
  )
}
