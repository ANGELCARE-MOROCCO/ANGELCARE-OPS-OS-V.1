'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo } from 'react'
import type { ComponentType } from 'react'
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { XraySession } from './types'
import type { RadarDisplay } from './GlobalRadarCommand'
import styles from './global-intelligence.module.css'

// Country-level fallback coordinates are geographic country centroids, never visitor coordinates.
// Anything unavailable remains explicitly unmapped; no random or invented markers.
const COUNTRY_CENTROIDS: Record<string, [number, number]> = {
  MA: [31.8, -7.1], FR: [46.6, 2.2], ES: [40.5, -3.7], PT: [39.6, -8], GB: [54, -2.6], IE: [53.2, -8],
  BE: [50.7, 4.7], NL: [52.2, 5.3], DE: [51.2, 10.4], CH: [46.8, 8.2], IT: [42.8, 12.6], AT: [47.5, 14.6],
  PL: [52, 19.1], SE: [62, 15], NO: [61, 8.5], DK: [56, 9.4], FI: [64, 26], GR: [39, 22], TR: [39, 35],
  US: [39, -98], CA: [56, -106], MX: [23.6, -102.5], BR: [-14.2, -51.9], AR: [-38, -63.6], CL: [-35.7, -71.5],
  CO: [4.6, -74.1], PE: [-9.2, -75], DZ: [28, 2.6], TN: [34, 9.5], EG: [26.8, 30.8], SN: [14.4, -14.5],
  CI: [7.5, -5.5], NG: [9.1, 8.7], ZA: [-29, 24], KE: [0, 37.9], GH: [7.9, -1], ET: [9.1, 40.5],
  SA: [24, 45], AE: [24.3, 54.3], QA: [25.3, 51.2], KW: [29.3, 47.5], BH: [26.1, 50.5], OM: [21.5, 55.9],
  IN: [21, 78], PK: [30.4, 69.3], BD: [23.7, 90.4], LK: [7.9, 80.8], CN: [35.9, 104.2], JP: [36.2, 138.3],
  KR: [36.5, 127.9], SG: [1.35, 103.8], MY: [4.2, 101.9], ID: [-2.5, 118], PH: [12.9, 122.6],
  TH: [15.9, 100.9], VN: [16.2, 107.9], AU: [-25.3, 133.8], NZ: [-41, 174], RU: [61, 105], UA: [49, 32],
}
const COLORS = { presence: '#2787df', intent: '#9a5cda', commerce: '#19ae86', risk: '#ee6276' }
type Category = keyof typeof COLORS
export type MapPoint = { id: string; lat: number; lng: number; precision: 'observed' | 'country'; session: XraySession; category: Category }
type Group = { key: string; lat: number; lng: number; members: MapPoint[]; category: Category; precision: 'observed' | 'country' }

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
  if (typeof rawLat === 'number' && typeof rawLng === 'number' && Number.isFinite(rawLat) && Number.isFinite(rawLng) && Math.abs(rawLat) <= 90 && Math.abs(rawLng) <= 180) {
    return { id: session.sessionKey, lat: rawLat, lng: rawLng, precision: 'observed', session, category: category(session) }
  }
  const centroid = COUNTRY_CENTROIDS[session.network.countryCode?.toUpperCase() || '']
  if (centroid) return { id: session.sessionKey, lat: centroid[0], lng: centroid[1], precision: 'country', session, category: category(session) }
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
      const granularity = item.precision === 'country' ? 1 : 2
      const key = `${Math.round(item.lat * granularity) / granularity}:${Math.round(item.lng * granularity) / granularity}`
      buckets.set(key, [...(buckets.get(key) || []), item])
    }
    return [...buckets.entries()].map(([key, members]) => ({
      key, members, lat: members.reduce((sum, item) => sum + item.lat, 0) / members.length,
      lng: members.reduce((sum, item) => sum + item.lng, 0) / members.length,
      category: members.some((item) => item.category === 'risk') ? 'risk' : members.some((item) => item.category === 'commerce') ? 'commerce' : members.some((item) => item.category === 'intent') ? 'intent' : 'presence',
      precision: members.every((item) => item.precision === 'observed') ? 'observed' : 'country',
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
            <div>{group.precision === 'observed' ? 'Coordonnées observées' : 'Centroïde national — approximation'}</div>
            <div>{group.members[0].session.currentPage}</div>
          </LeafletTooltip>
        </LeafletCircleMarker>
      })}
    </LeafletMapContainer>
    <div className={styles.mapAccuracy} aria-live="polite"><strong>{markers.length}</strong> sessions cartographiées <span>·</span> <strong>{unmapped}</strong> non localisées</div>
    {markers.length === 0 ? <div className={styles.mapEmpty}>Aucune position cartographiable pour la sélection actuelle. La carte reste réelle ; aucun point n’est simulé.</div> : null}
  </div>
}
