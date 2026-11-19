'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo } from 'react'
import type { ComponentType } from 'react'
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { XraySession } from './types'
import type { RadarDisplay } from './GlobalRadarCommand'
import styles from './global-intelligence.module.css'

// Country-only signals are summarized in the radar country table, never plotted as
// individual positions. Raw IP-derived coordinates are approximate, never GPS.
const COLORS = { presence: '#2787df', intent: '#9a5cda', commerce: '#19ae86', risk: '#ee6276' }
type Category = keyof typeof COLORS
export type MapPoint = { id: string; lat: number; lng: number; precision: 'observed'; session: XraySession; category: Category }
type Group = { key: string; lat: number; lng: number; members: MapPoint[]; category: Category; precision: 'observed' }

const LeafletMapContainer = MapContainer as unknown as ComponentType<Record<string, unknown>>
const LeafletTileLayer = TileLayer as unknown as ComponentType<Record<string, unknown>>
const LeafletCircleMarker = CircleMarker as unknown as ComponentType<Record<string, unknown>>
const LeafletTooltip = Tooltip as unknown as ComponentType<Record<string, unknown>>

function category(s: XraySession): Category {
  if (s.errors + s.apiFailures + s.resourceErrors > 0 || s.scores.friction.value >= 30) return 'risk'
  if (s.orders + s.checkoutsCompleted + s.bookingsConfirmed > 0 || ['checkout', 'cart', 'booking', 'order'].includes(s.intent)) return 'commerce'
  if (s.scores.intent.value >= 70) return 'intent'
  return 'presence'
}

function point(session: XraySession): MapPoint | null {
  const rawLat = session.network.latitude
  const rawLng = session.network.longitude
  if (typeof rawLat === 'number' && typeof rawLng === 'number' && Number.isFinite(rawLat) && Number.isFinite(rawLng) && Math.abs(rawLat) <= 90 && Math.abs(rawLng) <= 180 && !(rawLat === 0 && rawLng === 0)) {
    return { id: session.sessionKey, lat: rawLat, lng: rawLng, precision: 'observed', session, category: category(session) }
  }
  return null
}

function Frame({ groups }: { groups: Group[] }) {
  const map = useMap()
  const bbox = useMemo(() => groups.map((group) => [group.lat, group.lng] as [number, number]), [groups])
  useEffect(() => {
    if (!bbox.length) { map.setView([18, 5], 2); return }
    if (bbox.length === 1) { map.setView(bbox[0], 4); return }
    map.fitBounds(bbox, { padding: [54, 54], maxZoom: 6 })
  }, [bbox, map])
  return null
}

export function GlobalRadarMap({ sessions, display, selectedKey, onSelect }: {
  sessions: XraySession[]; display: RadarDisplay; selectedKey: string | null; onSelect: (session: XraySession) => void
}) {
  const markers = useMemo(() => sessions.map(point).filter((p): p is MapPoint => Boolean(p)), [sessions])
  const groups = useMemo<Group[]>(() => {
    if (display === 'points') return markers.map((item) => ({ key: item.id, lat: item.lat, lng: item.lng, members: [item], category: item.category, precision: item.precision }))
    const buckets = new Map<string, MapPoint[]>()
    for (const item of markers) {
      const granularity = 2
      const key = `${Math.round(item.lat * granularity) / granularity}:${Math.round(item.lng * granularity) / granularity}`
      buckets.set(key, [...(buckets.get(key) || []), item])
    }
    return [...buckets.entries()].map(([key, members]) => ({
      key, members, lat: members.reduce((sum, item) => sum + item.lat, 0) / members.length,
      lng: members.reduce((sum, item) => sum + item.lng, 0) / members.length,
      category: members.some((item) => item.category === 'risk') ? 'risk' : members.some((item) => item.category === 'commerce') ? 'commerce' : members.some((item) => item.category === 'intent') ? 'intent' : 'presence',
      precision: 'observed',
    }))
  }, [markers, display])
  const unmapped = sessions.length - markers.length

  return <div className={styles.leafletFrame}>
    <LeafletMapContainer center={[18, 5]} zoom={2} minZoom={2} maxZoom={15} scrollWheelZoom={true} className={styles.leafletMap}>
      <LeafletTileLayer attribution="&copy; OpenStreetMap contributors" url={process.env.NEXT_PUBLIC_OSM_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'}/>
      <Frame groups={groups}/>
      {groups.map((group) => {
        const isSelected = group.members.some((member) => member.id === selectedKey)
        return <LeafletCircleMarker key={group.key} center={[group.lat, group.lng]} radius={display === 'heat' ? Math.min(34, 11 + Math.sqrt(group.members.length) * 7) : Math.min(18, 5 + Math.sqrt(group.members.length) * 4)}
          pathOptions={{ color: COLORS[group.category], fillColor: COLORS[group.category], fillOpacity: display === 'heat' ? 0.18 : isSelected ? 0.95 : 0.72, weight: isSelected ? 4 : 2, className: group.members.some((member) => member.session.active) ? 'ac-global-radar-active' : '' }}
          eventHandlers={{ click: () => onSelect(group.members[0].session) }}>
          <LeafletTooltip direction="top" sticky={true}>
            <strong>{group.members.length} signal{group.members.length > 1 ? 'aux' : ''} · {group.category}</strong>
            <div>{group.members[0].session.network.city || group.members[0].session.network.country || 'Localisation limitée'}</div>
            <div>{'Coordonnées IP approximatives, jamais position GPS'}</div>
            <div>{group.members[0].session.currentPage}</div>
          </LeafletTooltip>
        </LeafletCircleMarker>
      })}
    </LeafletMapContainer>
    <div className={styles.mapAccuracy} aria-live="polite"><strong>{markers.length}</strong> sessions cartographiées <span>·</span> <strong>{unmapped}</strong> non localisées</div>
    {markers.length === 0 ? <div className={styles.mapEmpty}>Aucune position cartographiable pour la sélection actuelle. La carte reste réelle ; aucun point n’est simulé.</div> : null}
  </div>
}
