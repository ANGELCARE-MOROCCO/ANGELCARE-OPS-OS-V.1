'use client'
import { useEffect, useRef, useState } from 'react'
import type { DiscoveryItem, StorefrontExperience } from '../../catalog-discovery/types'
import { familyDetailHref } from '../experience'
import { safeStoredIds } from './contract'

export function useGatewaySelections(experience: StorefrontExperience, items: readonly DiscoveryItem[]) {
  const [saved, setSaved] = useState<Set<string>>(() => new Set())
  const [recent, setRecent] = useState<string[]>([])
  const [pending, setPending] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [savedState, setSavedState] = useState<'loading' | 'ready' | 'unavailable'>('loading')
  const busy = useRef(false), changed = useRef(false)
  const recentIds = useRef<string[]>([])
  const key = `angelcare.families.gateway.recent.${experience.territoryCode || 'global'}`
  useEffect(() => {
    const allowed = new Set(items.map(item => item.id))
    try { recentIds.current = safeStoredIds(sessionStorage.getItem(key), allowed) } catch { recentIds.current = [] }
    setRecent(recentIds.current)
    const controller = new AbortController()
    void fetch('/api/angelcare-marketplace/homepage/engagement', { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('saved_unavailable')
        const result = await response.json()
        if (!Array.isArray(result?.data)) throw new Error('saved_invalid')
        if (!controller.signal.aborted) {
          if (!changed.current) setSaved(new Set(result.data.filter((row: { selection_type?: string; catalog_item_id?: unknown }) => row.selection_type === 'saved' && typeof row.catalog_item_id === 'string' && allowed.has(row.catalog_item_id)).map((row: { catalog_item_id: string }) => row.catalog_item_id)))
          setSavedState('ready')
        }
      }).catch(() => { if (!controller.signal.aborted) setSavedState('unavailable') })
    return () => controller.abort()
  }, [items, key])
  const remember = (id: string) => {
    if (!items.some(item => item.id === id)) return
    const next = [id, ...recentIds.current.filter(value => value !== id)].slice(0, 12)
    recentIds.current = next; setRecent(next)
    try { sessionStorage.setItem(key, JSON.stringify(next)) } catch { /* Storage is optional; navigation remains available. */ }
  }
  const onSave = async (item: DiscoveryItem) => {
    if (busy.current) return
    busy.current = true; changed.current = true; setPending(true); setSaveError(false)
    try {
      const active = !saved.has(item.id)
      const response = await fetch('/api/angelcare-marketplace/homepage/engagement', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ event_name: 'families.selection_changed', locale: experience.locale, catalog_item_id: item.id, selection_type: 'saved', active, territory_code: experience.territoryCode || undefined, route: familyDetailHref(experience.locale, item) }) })
      if (!response.ok) throw new Error('save_failed')
      setSaved(current => { const next = new Set(current); if (active) next.add(item.id); else next.delete(item.id); return next }); setSavedState('ready')
    } catch { setSaveError(true) }
    finally { busy.current = false; setPending(false) }
  }
  return { saved, recent, pending, saveError, savedState, onSave, remember, dismissError: () => setSaveError(false) }
}
