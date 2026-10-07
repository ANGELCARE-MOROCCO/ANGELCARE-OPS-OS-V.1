'use client'
import { useSyncExternalStore } from 'react'
import type { CatalogLocale } from '@/angelcare-marketplace/catalog-discovery/types'
import styles from './families-storefront.module.css'
const listeners = new Set<() => void>()
let tick = 0
let interval: ReturnType<typeof setInterval> | undefined
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  if (!interval) {
    tick = Math.floor(Date.now() / 1000)
    interval = setInterval(() => { tick = Math.floor(Date.now() / 1000); listeners.forEach(notify => notify()) }, 1000)
  }
  return () => { listeners.delete(listener); if (!listeners.size) { clearInterval(interval); interval = undefined } }
}
const snapshot = () => tick
const serverSnapshot = () => 0
export function FamilyRefreshCountdown({ locale, label, note }: { locale: CatalogLocale; label: string; note: string }) {
  const now = useSyncExternalStore(subscribe, snapshot, serverSnapshot)
  const seconds = 86400 - now % 86400
  const pad = (number: number) => String(number).padStart(2, '0')
  const value = now ? pad(Math.floor(seconds / 3600)) + ':' + pad(Math.floor(seconds % 3600 / 60)) + ':' + pad(seconds % 60) : '—:—:—'
  return <div className={styles.refreshClock} dir={locale === 'ar' ? 'rtl' : 'ltr'}><span>{label}</span><strong aria-live="off">{value}</strong><small>{note}</small></div>
}
