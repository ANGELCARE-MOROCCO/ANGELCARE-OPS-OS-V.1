"use client"

import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Crosshair,
  Expand,
  Gauge,
  Layers3,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Minus,
  MousePointer2,
  Pentagon,
  Plus,
  RefreshCw,
  Route,
  Search,
  ShieldAlert,
  Target,
  Users,
  X,
} from "lucide-react"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react"
import type {
  TerritoryMapDatum,
  TerritoryMapGeocodeResult,
  TerritoryMapGeometryDraft,
  TerritoryMapLayer,
  TerritoryMapRisk,
} from "./contracts"
import styles from "./territory-live-map.module.css"

type Props = {
  territories: TerritoryMapDatum[]
  layer: TerritoryMapLayer
  showLabels: boolean
  loading: boolean
  selectedTerritoryId?: string
  lastSynchronizedAt?: string
  onLayerChange: (layer: TerritoryMapLayer) => void
  onShowLabelsChange: (value: boolean) => void
  onRefresh: () => void | Promise<void>
  onTerritoryOpen: (territoryId: string) => void
  onCreateGeometry: (draft: TerritoryMapGeometryDraft) => void | Promise<void>
  onUpdateGeometry: (territoryId: string, draft: TerritoryMapGeometryDraft) => void | Promise<void>
}

type LeafletMap = any
type LeafletNamespace = any

type DrawMode = "radius" | "polygon" | null

type ResolvedPoint = {
  latitude: number
  longitude: number
  result: TerritoryMapGeocodeResult | null
  source: "record" | "geocoder"
}

const MOROCCO_CENTER: [number, number] = [31.7917, -7.0926]
const MOROCCO_BOUNDS: [[number, number], [number, number]] = [
  [20.65, -17.2],
  [36.1, -0.7],
]

const TILE_URL =
  process.env.NEXT_PUBLIC_AMBASSADOR_MAP_TILE_URL ||
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

const TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_AMBASSADOR_MAP_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributeurs'

const LAYERS: Array<{
  value: TerritoryMapLayer
  label: string
  shortLabel: string
  icon: typeof Target
}> = [
  { value: "coverage", label: "Couverture mesurée", shortLabel: "Couverture", icon: Target },
  { value: "workload", label: "Pression de charge", shortLabel: "Capacité", icon: Gauge },
  { value: "ambassadors", label: "Réseau déployé", shortLabel: "Ambassadeurs", icon: Users },
  { value: "missions", label: "Missions ouvertes", shortLabel: "Missions", icon: Route },
  { value: "leads", label: "Contribution commerciale", shortLabel: "Leads", icon: Building2 },
  { value: "conversion", label: "Conversion territoriale", shortLabel: "Conversion", icon: CheckCircle2 },
  { value: "potential", label: "Potentiel adressable", shortLabel: "Potentiel", icon: MapIcon },
  { value: "risk", label: "Risques opérationnels", shortLabel: "Risques", icon: ShieldAlert },
]

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value))
}

function safeNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function formatNumber(value: number, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits }).format(value)
}

function formatSync(value?: string): string {
  if (!value) return "Synchronisation en attente"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Synchronisation récente"
  return `Synchronisé à ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function hashString(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

function offsetPoint(latitude: number, longitude: number, id: string, shouldOffset: boolean): [number, number] {
  if (!shouldOffset) return [latitude, longitude]
  const hash = hashString(id)
  const angle = ((hash % 360) * Math.PI) / 180
  const ring = 0.006 + ((hash % 5) * 0.0015)
  const latitudeOffset = Math.sin(angle) * ring
  const longitudeScale = Math.max(0.4, Math.cos((latitude * Math.PI) / 180))
  const longitudeOffset = (Math.cos(angle) * ring) / longitudeScale
  return [latitude + latitudeOffset, longitude + longitudeOffset]
}

function coverageTone(value: number): { color: string; fill: string; label: string; className: string } {
  if (value >= 80) return { color: "#059669", fill: "#10b981", label: "Excellente", className: styles.zoneExcellent }
  if (value >= 60) return { color: "#2563eb", fill: "#3b82f6", label: "Bonne", className: styles.zoneGood }
  if (value >= 40) return { color: "#d97706", fill: "#f59e0b", label: "Moyenne", className: styles.zoneAverage }
  if (value > 0) return { color: "#e11d48", fill: "#f43f5e", label: "Faible", className: styles.zoneLow }
  return { color: "#64748b", fill: "#94a3b8", label: "Non configurée", className: styles.zoneUnconfigured }
}

function riskValue(risk: TerritoryMapRisk): number {
  if (risk === "critical") return 100
  if (risk === "attention") return 68
  if (risk === "unconfigured") return 35
  return 12
}

function layerValue(territory: TerritoryMapDatum, layer: TerritoryMapLayer, maxima: Record<string, number>): number {
  if (layer === "coverage") return territory.coveragePercent
  if (layer === "workload") return territory.workloadPercent
  if (layer === "ambassadors") return (territory.activeAmbassadorCount / Math.max(1, maxima.ambassadors)) * 100
  if (layer === "missions") return (territory.openMissionCount / Math.max(1, maxima.missions)) * 100
  if (layer === "leads") return (territory.leadCount / Math.max(1, maxima.leads)) * 100
  if (layer === "conversion") return territory.conversionRate
  if (layer === "potential") {
    const potential = territory.addressableHouseholds || territory.addressableAccounts
    return (potential / Math.max(1, maxima.potential)) * 100
  }
  return riskValue(territory.risk)
}

function layerTone(territory: TerritoryMapDatum, layer: TerritoryMapLayer, value: number) {
  if (layer === "coverage") return coverageTone(value)
  if (layer === "risk") {
    if (territory.risk === "critical") return { color: "#be123c", fill: "#e11d48", label: "Critique", className: styles.zoneLow }
    if (territory.risk === "attention") return { color: "#b45309", fill: "#f59e0b", label: "Attention", className: styles.zoneAverage }
    if (territory.risk === "unconfigured") return { color: "#64748b", fill: "#94a3b8", label: "À configurer", className: styles.zoneUnconfigured }
    return { color: "#047857", fill: "#10b981", label: "Maîtrisée", className: styles.zoneExcellent }
  }
  if (layer === "workload") {
    if (territory.workloadPercent > 100) return { color: "#be123c", fill: "#e11d48", label: "Surchargée", className: styles.zoneLow }
    if (territory.workloadPercent > 85) return { color: "#b45309", fill: "#f59e0b", label: "Élevée", className: styles.zoneAverage }
    if (territory.workloadPercent >= 60) return { color: "#1d4ed8", fill: "#3b82f6", label: "Optimale", className: styles.zoneGood }
    return { color: "#047857", fill: "#10b981", label: "Disponible", className: styles.zoneExcellent }
  }
  return coverageTone(value)
}

function displayLayerValue(territory: TerritoryMapDatum, layer: TerritoryMapLayer, value: number): string {
  if (layer === "ambassadors") return `${territory.activeAmbassadorCount} ambassadeur(s)`
  if (layer === "missions") return `${territory.openMissionCount} mission(s)`
  if (layer === "leads") return `${territory.leadCount} lead(s)`
  if (layer === "potential") {
    const potential = territory.addressableHouseholds || territory.addressableAccounts
    return potential ? formatNumber(potential, 0) : "À renseigner"
  }
  if (layer === "risk") return layerTone(territory, layer, value).label
  return `${formatNumber(layer === "workload" ? territory.workloadPercent : layer === "conversion" ? territory.conversionRate : territory.coveragePercent)}%`
}

function geometryAreaKm2(points: Array<[number, number]>): number {
  if (points.length < 3) return 0
  const meanLatitude = points.reduce((sum, point) => sum + point[0], 0) / points.length
  const latitudeScale = 111.32
  const longitudeScale = 111.32 * Math.cos((meanLatitude * Math.PI) / 180)
  let area = 0
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]
    const next = points[(index + 1) % points.length]
    const x1 = current[1] * longitudeScale
    const y1 = current[0] * latitudeScale
    const x2 = next[1] * longitudeScale
    const y2 = next[0] * latitudeScale
    area += x1 * y2 - x2 * y1
  }
  return Math.abs(area) / 2
}

function centroid(points: Array<[number, number]>): [number, number] {
  if (!points.length) return MOROCCO_CENTER
  return [
    points.reduce((sum, point) => sum + point[0], 0) / points.length,
    points.reduce((sum, point) => sum + point[1], 0) / points.length,
  ]
}

async function fetchGeocode(params: URLSearchParams, signal?: AbortSignal): Promise<TerritoryMapGeocodeResult[]> {
  const response = await fetch(`/api/market-os/ambassadors/territories/geocode?${params.toString()}`, {
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload?.ok === false) {
    throw new Error(String(payload?.error || "La recherche cartographique a échoué."))
  }
  return Array.isArray(payload?.data?.results) ? payload.data.results : []
}

function popupHtml(territory: TerritoryMapDatum, layer: TerritoryMapLayer, value: number): string {
  const tone = layerTone(territory, layer, value)
  const potential = territory.addressableHouseholds || territory.addressableAccounts
  return `
    <article class="${styles.popupCard}">
      <div class="${styles.popupEyebrow}">Territoire AngelCare</div>
      <div class="${styles.popupTitleRow}">
        <div>
          <strong>${escapeHtml(territory.name)}</strong>
          <span>${escapeHtml([territory.zone, territory.city, territory.region].filter(Boolean).join(" · "))}</span>
        </div>
        <em style="--tone:${tone.color}">${escapeHtml(tone.label)}</em>
      </div>
      <div class="${styles.popupGrid}">
        <div><span>Couverture</span><b>${formatNumber(territory.coveragePercent)}%</b></div>
        <div><span>Ambassadeurs</span><b>${territory.activeAmbassadorCount}</b></div>
        <div><span>Missions</span><b>${territory.openMissionCount}</b></div>
        <div><span>Leads</span><b>${territory.leadCount}</b></div>
        <div><span>Conversion</span><b>${formatNumber(territory.conversionRate)}%</b></div>
        <div><span>Potentiel</span><b>${potential ? formatNumber(potential, 0) : "—"}</b></div>
      </div>
      <div class="${styles.popupFooter}">
        <span>Couche active</span>
        <b>${escapeHtml(displayLayerValue(territory, layer, value))}</b>
      </div>
    </article>
  `
}

export default function TerritoryLiveMap({
  territories,
  layer,
  showLabels,
  loading,
  selectedTerritoryId,
  lastSynchronizedAt,
  onLayerChange,
  onShowLabelsChange,
  onRefresh,
  onTerritoryOpen,
  onCreateGeometry,
  onUpdateGeometry,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const shellRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const leafletRef = useRef<LeafletNamespace | null>(null)
  const territoryLayerRef = useRef<any>(null)
  const draftLayerRef = useRef<any>(null)
  const drawModeRef = useRef<DrawMode>(null)
  const draftPointsRef = useRef<Array<[number, number]>>([])
  const initialFitRef = useRef(false)
  const geocodingRef = useRef(new Set<string>())

  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState("")
  const [resolvedPoints, setResolvedPoints] = useState<Record<string, ResolvedPoint>>({})
  const [notLocatedIds, setNotLocatedIds] = useState<string[]>([])
  const [searchValue, setSearchValue] = useState("")
  const [searchBusy, setSearchBusy] = useState(false)
  const [searchError, setSearchError] = useState("")
  const [searchResult, setSearchResult] = useState<TerritoryMapGeocodeResult | null>(null)
  const [drawMode, setDrawMode] = useState<DrawMode>(null)
  const [draftCenter, setDraftCenter] = useState<[number, number] | null>(null)
  const [draftPoints, setDraftPoints] = useState<Array<[number, number]>>([])
  const [draftRadiusKm, setDraftRadiusKm] = useState(5)
  const [draftAddress, setDraftAddress] = useState<TerritoryMapGeocodeResult | null>(null)
  const [reverseBusy, setReverseBusy] = useState(false)
  const [editingTerritoryId, setEditingTerritoryId] = useState<string | null>(null)
  const [geometryBusy, setGeometryBusy] = useState(false)

  drawModeRef.current = drawMode
  draftPointsRef.current = draftPoints

  const maxima = useMemo(
    () => ({
      ambassadors: Math.max(1, ...territories.map((item) => item.activeAmbassadorCount)),
      missions: Math.max(1, ...territories.map((item) => item.openMissionCount)),
      leads: Math.max(1, ...territories.map((item) => item.leadCount)),
      potential: Math.max(
        1,
        ...territories.map((item) => item.addressableHouseholds || item.addressableAccounts),
      ),
    }),
    [territories],
  )

  const counts = useMemo(
    () => ({
      excellent: territories.filter((item) => item.coveragePercent >= 80).length,
      good: territories.filter((item) => item.coveragePercent >= 60 && item.coveragePercent < 80).length,
      average: territories.filter((item) => item.coveragePercent >= 40 && item.coveragePercent < 60).length,
      low: territories.filter((item) => item.coveragePercent > 0 && item.coveragePercent < 40).length,
      unconfigured: territories.filter((item) => item.coveragePercent <= 0).length,
      pending: territories.filter((item) => item.pendingAssignmentsCount > 0).length,
      risky: territories.filter((item) => item.risk === "critical" || item.risk === "attention").length,
    }),
    [territories],
  )

  const activeLayer = useMemo(
    () => LAYERS.find((item) => item.value === layer) || LAYERS[0],
    [layer],
  )

  const locateFromRecord = useCallback((territory: TerritoryMapDatum): ResolvedPoint | null => {
    if (
      territory.centerLatitude !== null &&
      territory.centerLongitude !== null &&
      Number.isFinite(territory.centerLatitude) &&
      Number.isFinite(territory.centerLongitude)
    ) {
      return {
        latitude: territory.centerLatitude,
        longitude: territory.centerLongitude,
        result: null,
        source: "record",
      }
    }
    return null
  }, [])

  useEffect(() => {
    let cancelled = false
    let map: LeafletMap | null = null

    async function initialize() {
      if (!containerRef.current || mapRef.current) return
      try {
        const imported: any = await import("leaflet")
        if (cancelled || !containerRef.current) return
        const L: LeafletNamespace = imported.default || imported
        leafletRef.current = L

        map = L.map(containerRef.current, {
          zoomControl: false,
          attributionControl: true,
          preferCanvas: true,
          minZoom: 4,
          maxZoom: 19,
          worldCopyJump: false,
        })
        mapRef.current = map
        map.fitBounds(MOROCCO_BOUNDS, { padding: [18, 18], animate: false })

        L.tileLayer(TILE_URL, {
          attribution: TILE_ATTRIBUTION,
          maxZoom: 19,
          minZoom: 3,
          crossOrigin: true,
          updateWhenIdle: true,
          keepBuffer: 3,
        }).addTo(map)

        territoryLayerRef.current = L.layerGroup().addTo(map)
        draftLayerRef.current = L.layerGroup().addTo(map)

        map.on("click", (event: any) => {
          const mode = drawModeRef.current
          if (!mode) return
          const point: [number, number] = [event.latlng.lat, event.latlng.lng]
          if (mode === "radius") {
            setDraftCenter(point)
            setDraftPoints([])
            void reverseGeocode(point)
          } else {
            const next = [...draftPointsRef.current, point]
            setDraftPoints(next)
            setDraftCenter(centroid(next))
            if (next.length === 1) void reverseGeocode(point)
          }
        })

        setMapReady(true)
      } catch (error) {
        setMapError(error instanceof Error ? error.message : "Le moteur cartographique n’a pas pu démarrer.")
      }
    }

    void initialize()

    return () => {
      cancelled = true
      if (map) map.remove()
      mapRef.current = null
      leafletRef.current = null
      territoryLayerRef.current = null
      draftLayerRef.current = null
    }
  }, [])

  const reverseGeocode = useCallback(async (point: [number, number]) => {
    setReverseBusy(true)
    try {
      const params = new URLSearchParams({ lat: String(point[0]), lon: String(point[1]) })
      const results = await fetchGeocode(params)
      setDraftAddress(results[0] || null)
    } catch {
      setDraftAddress(null)
    } finally {
      setReverseBusy(false)
    }
  }, [])

  useEffect(() => {
    const abort = new AbortController()
    const missing = territories.filter((territory) => {
      if (locateFromRecord(territory)) return false
      if (resolvedPoints[territory.id]) return false
      if (geocodingRef.current.has(territory.id)) return false
      return Boolean(territory.city || territory.zone || territory.region)
    })

    if (!missing.length) return () => abort.abort()

    let cancelled = false

    async function resolveMissing() {
      for (const territory of missing) {
        if (cancelled) break
        geocodingRef.current.add(territory.id)
        const query = [territory.zone, territory.city, territory.region, "Maroc"].filter(Boolean).join(", ")
        try {
          const results = await fetchGeocode(
            new URLSearchParams({ q: query, limit: "1", polygon: "0" }),
            abort.signal,
          )
          const result = results[0]
          if (result && !cancelled) {
            setResolvedPoints((current) => ({
              ...current,
              [territory.id]: {
                latitude: result.latitude,
                longitude: result.longitude,
                result,
                source: "geocoder",
              },
            }))
            setNotLocatedIds((current) => current.filter((id) => id !== territory.id))
          } else if (!cancelled) {
            setNotLocatedIds((current) => Array.from(new Set([...current, territory.id])))
          }
        } catch (error) {
          if (!abort.signal.aborted && !cancelled) {
            setNotLocatedIds((current) => Array.from(new Set([...current, territory.id])))
          }
        } finally {
          geocodingRef.current.delete(territory.id)
        }
      }
    }

    void resolveMissing()
    return () => {
      cancelled = true
      abort.abort()
    }
  }, [territories, resolvedPoints, locateFromRecord])

  useEffect(() => {
    const L = leafletRef.current
    const map = mapRef.current
    const group = territoryLayerRef.current
    if (!L || !map || !group || !mapReady) return

    group.clearLayers()
    const bounds: Array<[number, number]> = []

    territories.forEach((territory) => {
      const recordPoint = locateFromRecord(territory)
      const resolvedPoint = recordPoint || resolvedPoints[territory.id]
      if (!resolvedPoint) return

      const [latitude, longitude] = offsetPoint(
        resolvedPoint.latitude,
        resolvedPoint.longitude,
        territory.id,
        resolvedPoint.source === "geocoder",
      )
      bounds.push([latitude, longitude])

      const value = layerValue(territory, layer, maxima)
      const tone = layerTone(territory, layer, value)
      const selected = territory.id === selectedTerritoryId
      const pendingClass = territory.pendingAssignmentsCount > 0 ? ` ${styles.zonePending}` : ""
      const zoneClass = `${tone.className}${pendingClass}${selected ? ` ${styles.zoneSelected}` : ""}`
      const style = {
        color: tone.color,
        fillColor: tone.fill,
        weight: selected ? 4 : territory.pendingAssignmentsCount ? 3 : 2.2,
        opacity: 0.96,
        fillOpacity: layer === "risk" ? 0.25 : 0.2 + clamp(value) / 520,
        dashArray: territory.pendingAssignmentsCount ? "9 7" : territory.risk === "unconfigured" ? "4 7" : undefined,
        className: zoneClass,
      }

      let zoneLayer: any = null
      if (territory.geometryGeoJson) {
        try {
          zoneLayer = L.geoJSON(territory.geometryGeoJson, { style })
        } catch {
          zoneLayer = null
        }
      }
      if (!zoneLayer) {
        const radiusMeters = Math.max(600, safeNumber(territory.radiusKm, 5) * 1000)
        zoneLayer = L.circle([latitude, longitude], { ...style, radius: radiusMeters })
      }

      zoneLayer.bindPopup(popupHtml(territory, layer, value), {
        className: styles.leafletPopup,
        maxWidth: 350,
        minWidth: 310,
        closeButton: true,
      })
      zoneLayer.on("click", () => onTerritoryOpen(territory.id))
      zoneLayer.addTo(group)

      const labelValue = displayLayerValue(territory, layer, value)
      const markerClass = `${styles.cityBeacon} ${selected ? styles.cityBeaconSelected : ""}`
      const marker = L.marker([latitude, longitude], {
        keyboard: true,
        title: `${territory.name} — ${labelValue}`,
        icon: L.divIcon({
          className: "",
          html: `<button type="button" class="${markerClass}" style="--zone-color:${tone.color};--zone-fill:${tone.fill}">
            <span class="${styles.cityBeaconPulse}"></span>
            <span class="${styles.cityBeaconCore}">${territory.activeAmbassadorCount}</span>
            ${showLabels ? `<span class="${styles.cityBeaconLabel}"><b>${escapeHtml(territory.city || territory.name)}</b><em>${escapeHtml(labelValue)}</em></span>` : ""}
            ${territory.pendingAssignmentsCount ? `<i class="${styles.pendingBadge}">${territory.pendingAssignmentsCount}</i>` : ""}
          </button>`,
          iconSize: showLabels ? [190, 58] : [50, 50],
          iconAnchor: showLabels ? [25, 25] : [25, 25],
        }),
      })
      marker.bindTooltip(
        `<strong>${escapeHtml(territory.name)}</strong><br/>${escapeHtml(tone.label)} · ${escapeHtml(labelValue)}`,
        { direction: "top", offset: [0, -18], opacity: 0.98 },
      )
      marker.on("click", () => onTerritoryOpen(territory.id))
      marker.addTo(group)
    })

    if (!initialFitRef.current && bounds.length) {
      initialFitRef.current = true
      map.fitBounds(bounds, { padding: [72, 72], maxZoom: 11, animate: true, duration: 0.8 })
    }
  }, [territories, resolvedPoints, layer, maxima, mapReady, selectedTerritoryId, showLabels, locateFromRecord, onTerritoryOpen])

  useEffect(() => {
    const L = leafletRef.current
    const group = draftLayerRef.current
    if (!L || !group || !mapReady) return
    group.clearLayers()

    if (drawMode === "radius" && draftCenter) {
      L.circle(draftCenter, {
        radius: draftRadiusKm * 1000,
        color: "#1456c3",
        fillColor: "#3b82f6",
        weight: 3,
        dashArray: "10 8",
        fillOpacity: 0.18,
        className: styles.draftZone,
      }).addTo(group)
      L.circleMarker(draftCenter, {
        radius: 8,
        color: "#ffffff",
        weight: 4,
        fillColor: "#1456c3",
        fillOpacity: 1,
      }).addTo(group)
    }

    if (drawMode === "polygon" && draftPoints.length) {
      const closed = draftPoints.length >= 3
      const layerValue = closed ? L.polygon(draftPoints) : L.polyline(draftPoints)
      layerValue.setStyle({
        color: "#1456c3",
        fillColor: "#3b82f6",
        weight: 3,
        dashArray: "10 8",
        fillOpacity: 0.18,
        className: styles.draftZone,
      })
      layerValue.addTo(group)
      draftPoints.forEach((point, index) => {
        L.circleMarker(point, {
          radius: 6,
          color: "#ffffff",
          weight: 3,
          fillColor: index === 0 ? "#bd2634" : "#1456c3",
          fillOpacity: 1,
        }).addTo(group)
      })
    }
  }, [drawMode, draftCenter, draftPoints, draftRadiusKm, mapReady])

  const fitTerritories = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    const points = territories
      .map((territory) => locateFromRecord(territory) || resolvedPoints[territory.id])
      .filter(Boolean)
      .map((point) => [point!.latitude, point!.longitude] as [number, number])
    if (points.length) map.fitBounds(points, { padding: [74, 74], maxZoom: 12, animate: true })
    else map.fitBounds(MOROCCO_BOUNDS, { padding: [18, 18], animate: true })
  }, [territories, resolvedPoints, locateFromRecord])

  const resetMap = useCallback(() => {
    mapRef.current?.fitBounds(MOROCCO_BOUNDS, { padding: [18, 18], animate: true })
  }, [])

  const locateUser = useCallback(() => {
    const map = mapRef.current
    if (!map || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.flyTo([position.coords.latitude, position.coords.longitude], 13, { duration: 0.9 })
      },
      () => setSearchError("La localisation du navigateur n’est pas disponible."),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 },
    )
  }, [])

  const toggleFullscreen = useCallback(async () => {
    const shell = shellRef.current
    if (!shell) return
    if (document.fullscreenElement) await document.exitFullscreen()
    else await shell.requestFullscreen()
    setTimeout(() => mapRef.current?.invalidateSize(), 120)
  }, [])

  const submitSearch = useCallback(async (event: FormEvent) => {
    event.preventDefault()
    const query = searchValue.trim()
    if (!query) return
    setSearchBusy(true)
    setSearchError("")
    try {
      const results = await fetchGeocode(new URLSearchParams({ q: query, limit: "5", polygon: "1" }))
      const first = results[0] || null
      setSearchResult(first)
      if (!first) {
        setSearchError("Aucun lieu marocain correspondant n’a été trouvé.")
        return
      }
      const map = mapRef.current
      if (map) {
        if (first.boundingBox) {
          const [south, north, west, east] = first.boundingBox
          map.fitBounds([[south, west], [north, east]], { padding: [50, 50], maxZoom: 15, animate: true })
        } else {
          map.flyTo([first.latitude, first.longitude], 13, { duration: 0.9 })
        }
      }
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "La recherche cartographique a échoué.")
    } finally {
      setSearchBusy(false)
    }
  }, [searchValue])

  const startDrawing = useCallback((mode: Exclude<DrawMode, null>) => {
    setEditingTerritoryId(null)
    setDrawMode(mode)
    setDraftCenter(null)
    setDraftPoints([])
    setDraftAddress(null)
    setSearchResult(null)
    setSearchError("")
  }, [])

  const cancelDrawing = useCallback(() => {
    setDrawMode(null)
    setDraftCenter(null)
    setDraftPoints([])
    setDraftAddress(null)
    setEditingTerritoryId(null)
    draftLayerRef.current?.clearLayers()
  }, [])

  const startEditingSelected = useCallback(() => {
    const territory = territories.find((item) => item.id === selectedTerritoryId)
    if (!territory) return
    const located = locateFromRecord(territory) || resolvedPoints[territory.id]
    if (!located) {
      setSearchError("Ce territoire doit être localisé avant la modification de son périmètre.")
      return
    }
    setEditingTerritoryId(territory.id)
    setDraftAddress(null)
    if (territory.geometryType === "polygon" && territory.geometryGeoJson) {
      const geometry = (territory.geometryGeoJson as any)?.type === "Feature"
        ? (territory.geometryGeoJson as any)?.geometry
        : territory.geometryGeoJson as any
      const coordinates = geometry?.type === "Polygon" ? geometry?.coordinates?.[0] : null
      if (Array.isArray(coordinates) && coordinates.length >= 4) {
        const points = coordinates.slice(0, -1).map((point: unknown) =>
          Array.isArray(point) ? [safeNumber(point[1]), safeNumber(point[0])] as [number, number] : null,
        ).filter(Boolean) as Array<[number, number]>
        setDrawMode("polygon")
        setDraftPoints(points)
        setDraftCenter(centroid(points))
        return
      }
    }
    setDrawMode("radius")
    setDraftCenter([located.latitude, located.longitude])
    setDraftPoints([])
    setDraftRadiusKm(Math.max(1, territory.radiusKm || 5))
  }, [territories, selectedTerritoryId, locateFromRecord, resolvedPoints])

  const confirmDrawing = useCallback(async () => {
    if (!drawMode || !draftCenter) return
    if (drawMode === "polygon" && draftPoints.length < 3) return

    const areaSquareKm =
      drawMode === "radius"
        ? Math.PI * draftRadiusKm * draftRadiusKm
        : geometryAreaKm2(draftPoints)

    const geometryGeoJson: Record<string, unknown> | null =
      drawMode === "polygon"
        ? {
            type: "Feature",
            properties: { source: "angelcare-territory-studio" },
            geometry: {
              type: "Polygon",
              coordinates: [[...draftPoints.map(([lat, lng]) => [lng, lat]), [draftPoints[0][1], draftPoints[0][0]]]],
            },
          }
        : null

    const draft: TerritoryMapGeometryDraft = {
      geometryType: drawMode,
      centerLatitude: draftCenter[0],
      centerLongitude: draftCenter[1],
      radiusKm: drawMode === "radius" ? draftRadiusKm : 0,
      geometryGeoJson,
      areaSquareKm,
      osmDisplayName: draftAddress?.displayName || searchResult?.displayName || "",
      osmObjectType: draftAddress?.osmType || searchResult?.osmType || "",
      osmObjectId: draftAddress?.osmId || searchResult?.osmId || "",
      address: draftAddress?.address || searchResult?.address || {},
    }
    setGeometryBusy(true)
    try {
      if (editingTerritoryId) await onUpdateGeometry(editingTerritoryId, draft)
      else await onCreateGeometry(draft)
      cancelDrawing()
    } finally {
      setGeometryBusy(false)
    }
  }, [drawMode, draftCenter, draftPoints, draftRadiusKm, draftAddress, searchResult, editingTerritoryId, onUpdateGeometry, onCreateGeometry, cancelDrawing])

  const useSearchAsDraft = useCallback(() => {
    if (!searchResult) return
    const center: [number, number] = [searchResult.latitude, searchResult.longitude]
    setDraftAddress(searchResult)
    if (searchResult.geoJson) {
      const coordinates = (searchResult.geoJson as any)?.coordinates
      const type = (searchResult.geoJson as any)?.type
      if (type === "Polygon" && Array.isArray(coordinates?.[0])) {
        const points = coordinates[0]
          .map((point: unknown) => Array.isArray(point) ? [safeNumber(point[1]), safeNumber(point[0])] as [number, number] : null)
          .filter(Boolean) as Array<[number, number]>
        if (points.length >= 3) {
          setDrawMode("polygon")
          setDraftPoints(points.slice(0, -1))
          setDraftCenter(centroid(points))
          return
        }
      }
    }
    setDrawMode("radius")
    setDraftCenter(center)
    setDraftPoints([])
  }, [searchResult])

  const locatedCount = territories.filter((territory) => locateFromRecord(territory) || resolvedPoints[territory.id]).length

  return (
    <section ref={shellRef} className={styles.shell} data-territory-live-map="openstreetmap-command">
      <header className={styles.header}>
        <div className={styles.headingBlock}>
          <div className={styles.eyebrow}><MapIcon size={15} /> OpenStreetMap · Ambassador OS</div>
          <h2>Couverture du terrain</h2>
          <p>Carte nationale réelle, zones de couverture, capacité, activité et risques opérationnels.</p>
          <div className={styles.legend}>
            {[
              ["Excellente (80%+)", "#10b981", counts.excellent],
              ["Bonne (60–79%)", "#3b82f6", counts.good],
              ["Moyenne (40–59%)", "#f59e0b", counts.average],
              ["Faible (<40%)", "#f43f5e", counts.low],
              ["Non configurée", "#94a3b8", counts.unconfigured],
            ].map(([label, color, count]) => (
              <span key={String(label)}><i style={{ backgroundColor: String(color) }} />{label}<b>{count}</b></span>
            ))}
          </div>
        </div>

        <div className={styles.headerCommands}>
          <form className={styles.search} onSubmit={submitSearch}>
            <Search size={17} />
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Ville, quartier, adresse ou coordonnées…"
              aria-label="Rechercher un lieu au Maroc"
            />
            <button type="submit" disabled={searchBusy || !searchValue.trim()}>
              {searchBusy ? <RefreshCw size={15} className={styles.spin} /> : "Rechercher"}
            </button>
          </form>
          <div className={styles.commandRow}>
            <label className={styles.layerSelect}>
              <Layers3 size={17} />
              <select value={layer} onChange={(event) => onLayerChange(event.target.value as TerritoryMapLayer)}>
                {LAYERS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => startDrawing("radius")} className={styles.primaryCommand}>
              <Crosshair size={17} /> Créer un rayon
            </button>
            <button type="button" onClick={() => startDrawing("polygon")} className={styles.secondaryCommand}>
              <Pentagon size={17} /> Tracer une zone
            </button>
            {selectedTerritoryId ? <button type="button" onClick={startEditingSelected} className={styles.secondaryCommand}><MousePointer2 size={17} /> Modifier la zone</button> : null}
            <button type="button" onClick={toggleFullscreen} className={styles.iconCommand} aria-label="Plein écran">
              <Expand size={18} />
            </button>
          </div>
          {searchError ? <p className={styles.searchError}>{searchError}</p> : null}
          {searchResult ? (
            <div className={styles.searchResult}>
              <div><b>{searchResult.displayName}</b><span>{searchResult.latitude.toFixed(5)}, {searchResult.longitude.toFixed(5)}</span></div>
              <button type="button" onClick={useSearchAsDraft}>Utiliser comme zone</button>
              <button type="button" onClick={() => setSearchResult(null)} aria-label="Fermer"><X size={15} /></button>
            </div>
          ) : null}
        </div>
      </header>

      <div className={styles.mapStage}>
        <div ref={containerRef} className={styles.mapCanvas} aria-label="Carte territoriale interactive du réseau Ambassador au Maroc" />

        {!mapReady && !mapError ? (
          <div className={styles.mapLoading}><RefreshCw size={24} className={styles.spin} /><b>Chargement de la géographie réelle</b><span>Initialisation du fond OpenStreetMap…</span></div>
        ) : null}

        {mapError ? (
          <div className={styles.mapFailure}><AlertTriangle size={28} /><b>Fond cartographique indisponible</b><span>{mapError}</span><button type="button" onClick={() => window.location.reload()}>Réessayer</button></div>
        ) : null}

        <nav className={styles.layerRail} aria-label="Couches territoriales">
          <div className={styles.layerRailTitle}>Couches</div>
          {LAYERS.map(({ value, shortLabel, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onLayerChange(value)}
              className={layer === value ? styles.layerActive : ""}
              title={shortLabel}
            >
              <Icon size={16} /><span>{shortLabel}</span>
            </button>
          ))}
        </nav>

        <div className={styles.mapControls}>
          <button type="button" onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom avant"><Plus size={18} /></button>
          <button type="button" onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom arrière"><Minus size={18} /></button>
          <button type="button" onClick={fitTerritories} aria-label="Voir tous les territoires"><LocateFixed size={18} /></button>
          <button type="button" onClick={locateUser} aria-label="Ma position"><MapPin size={18} /></button>
          <button type="button" onClick={resetMap} aria-label="Vue nationale"><MapIcon size={18} /></button>
          <button type="button" onClick={() => onShowLabelsChange(!showLabels)} className={showLabels ? styles.controlActive : ""} aria-label="Afficher ou masquer les libellés"><MousePointer2 size={18} /></button>
          <button type="button" onClick={() => void onRefresh()} aria-label="Actualiser"><RefreshCw size={18} className={loading ? styles.spin : ""} /></button>
        </div>

        <aside className={styles.sourcePanel}>
          <span>Sources souveraines</span>
          <b>OpenStreetMap + Ambassador OS</b>
          <em>Aucun chiffre injecté · données métier protégées</em>
        </aside>

        <aside className={styles.posturePanel}>
          <div><span>Couche active</span><b>{activeLayer.shortLabel}</b></div>
          <div><span>Territoires localisés</span><b>{locatedCount}/{territories.length}</b></div>
          <div><span>Zones à risque</span><b>{counts.risky}</b></div>
          <div><span>Approbations</span><b>{counts.pending}</b></div>
        </aside>

        {notLocatedIds.length ? (
          <aside className={styles.unlocatedPanel}>
            <AlertTriangle size={16} />
            <div><b>{notLocatedIds.length} territoire(s) non localisé(s)</b><span>Complétez la ville ou définissez une géométrie.</span></div>
          </aside>
        ) : null}

        {!loading && !territories.length ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><MapPin size={30} /></div>
            <b>Votre réseau territorial n’est pas encore configuré</b>
            <span>Le Maroc reste visible. Créez maintenant un rayon réel ou tracez une zone personnalisée.</span>
            <div><button type="button" onClick={() => startDrawing("radius")}><Crosshair size={16} /> Créer une première zone</button><button type="button" onClick={() => startDrawing("polygon")}><Pentagon size={16} /> Tracer un périmètre</button></div>
          </div>
        ) : null}

        {drawMode ? (
          <aside className={styles.drawPanel}>
            <header><div><span>{editingTerritoryId ? "Modification contrôlée" : "Studio géographique"}</span><b>{drawMode === "radius" ? "Rayon opérationnel" : "Polygone personnalisé"}</b></div><button type="button" onClick={cancelDrawing}><X size={16} /></button></header>
            <p>{drawMode === "radius" ? "Cliquez sur la carte pour positionner le centre de la zone." : "Cliquez successivement pour créer les sommets du périmètre."}</p>
            {drawMode === "radius" ? (
              <label><span>Rayon de couverture</span><div><input type="range" min="1" max="50" step="0.5" value={draftRadiusKm} onChange={(event) => setDraftRadiusKm(safeNumber(event.target.value, 5))} /><b>{formatNumber(draftRadiusKm)} km</b></div><em>Surface estimée : {formatNumber(Math.PI * draftRadiusKm * draftRadiusKm)} km²</em></label>
            ) : (
              <div className={styles.drawStats}><span>Sommets <b>{draftPoints.length}</b></span><span>Surface <b>{formatNumber(geometryAreaKm2(draftPoints))} km²</b></span><button type="button" onClick={() => setDraftPoints((current) => current.slice(0, -1))} disabled={!draftPoints.length}>Annuler le dernier point</button></div>
            )}
            <div className={styles.drawLocation}>
              <MapPin size={16} />
              <div><b>{reverseBusy ? "Identification du lieu…" : draftAddress?.displayName || (draftCenter ? `${draftCenter[0].toFixed(5)}, ${draftCenter[1].toFixed(5)}` : "Aucun point sélectionné")}</b><span>{draftCenter ? "Coordonnées réelles capturées" : "Cliquez dans la carte"}</span></div>
            </div>
            <footer><button type="button" onClick={cancelDrawing} disabled={geometryBusy}>Annuler</button><button type="button" onClick={() => void confirmDrawing()} disabled={geometryBusy || !draftCenter || (drawMode === "polygon" && draftPoints.length < 3)}>{geometryBusy ? "Enregistrement…" : editingTerritoryId ? "Enregistrer le périmètre" : "Préparer le dossier territorial"}</button></footer>
          </aside>
        ) : null}

        <footer className={styles.operationalStrip}>
          <div><span className={styles.liveDot} />{formatSync(lastSynchronizedAt)}</div>
          <div><b>{territories.length}</b> territoires visibles</div>
          <div><b>{counts.low + counts.average}</b> sous-couverts</div>
          <div><b>{counts.pending}</b> en approbation</div>
          <div><b>{notLocatedIds.length}</b> non localisés</div>
        </footer>
      </div>
    </section>
  )
}
