'use client'

import { useEffect } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'

const SafeMapContainer = MapContainer as any
const SafeTileLayer = TileLayer as any
const SafeCircleMarker = CircleMarker as any
const SafePopup = Popup as any
import 'leaflet/dist/leaflet.css'

type CityPoint = {
  city: string
  lat: number
  lng: number
  count: number
  active: number
  pending: number
  risk: number
  items: any[]
  color: string
}

function ResizeAndFitMap({ points }: { points: CityPoint[] }) {
  const map = useMap()

  useEffect(() => {
    const refresh = () => {
      map.invalidateSize()

      if (!points.length) {
        map.setView([31.7917, -7.0926], 5)
        return
      }

      const bounds = points.map((point) => [point.lat, point.lng] as [number, number])

      map.fitBounds(bounds, {
        padding: [70, 70],
        maxZoom: 8,
      })
    }

    const timers = [
      window.setTimeout(refresh, 80),
      window.setTimeout(refresh, 350),
      window.setTimeout(refresh, 900),
    ]

    window.addEventListener('resize', refresh)

    return () => {
      timers.forEach(window.clearTimeout)
      window.removeEventListener('resize', refresh)
    }
  }, [map, points])

  return null
}

export default function RecruitmentGeoLeafletMap({
  points,
  selectedCity,
  onSelectCity,
}: {
  points: CityPoint[]
  selectedCity: string
  onSelectCity: (city: string) => void
}) {
  return (
    <div className="h-full w-full overflow-hidden rounded-[34px]">
      <SafeMapContainer
        center={[31.7917, -7.0926]}
        zoom={5}
        scrollWheelZoom
        className="h-full min-h-full w-full"
        style={{ height: '100%', width: '100%' }}
        zoomControl
        attributionControl
      >
        <SafeTileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ResizeAndFitMap points={points} />

        {points.map((point) => {
          const selected = selectedCity === point.city
          const radius = Math.min(48, 18 + point.count * 4)

          return (
            <SafeCircleMarker
              key={point.city}
              center={[point.lat, point.lng]}
              radius={selected ? radius + 7 : radius}
              pathOptions={{
                color: point.color,
                fillColor: point.color,
                fillOpacity: selected ? 0.92 : 0.78,
                weight: selected ? 5 : 3,
              }}
              eventHandlers={{
                click: () => onSelectCity(point.city),
              }}
            >
              <SafePopup>
                <div style={{ minWidth: 210 }}>
                  <p style={{ margin: 0, fontWeight: 900, fontSize: 15 }}>{point.city}</p>
                  <p style={{ margin: '8px 0 0', fontWeight: 800 }}>
                    {point.count} recruitment record(s)
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: 12 }}>
                    Active: {point.active} · Pending: {point.pending} · Risk: {point.risk}
                  </p>
                </div>
              </SafePopup>
            </SafeCircleMarker>
          )
        })}
      </SafeMapContainer>
    </div>
  )
}
