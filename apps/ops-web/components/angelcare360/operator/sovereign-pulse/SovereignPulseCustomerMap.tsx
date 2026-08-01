'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Building2,
  CalendarClock,
  Crosshair,
  Layers3,
  MapPinned,
  RadioTower,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import type {
  SovereignPulseCustomerNode,
  SovereignPulseMode,
  SovereignPulsePrivacy,
  SovereignPulseSnapshot,
} from '@/types/angelcare360/operator/sovereign-pulse'
import styles from './SovereignPulseCustomerMap.module.css'

const MOROCCO_CENTER: [number, number] = [31.7917, -7.0926]
const NETWORK_HUB: [number, number] = [33.9716, -6.8498]

const STATE_LABELS: Record<SovereignPulseCustomerNode['state'], string> = {
  healthy: 'Healthy',
  onboarding: 'Onboarding',
  attention: 'Attention',
  intervention: 'Recovery',
  inactive: 'Inactive',
}

const STATE_COLORS: Record<SovereignPulseCustomerNode['state'], string> = {
  healthy: '#10b981',
  onboarding: '#3b82f6',
  attention: '#f59e0b',
  intervention: '#e31c4b',
  inactive: '#94a3b8',
}

type LeafletRuntime = Record<string, any>
type LeafletMap = Record<string, any>
type LeafletLayerGroup = Record<string, any>
type CustomerFilter = 'all' | SovereignPulseCustomerNode['state']

type Props = {
  nodes: SovereignPulseCustomerNode[]
  privacy: SovereignPulsePrivacy
  mode: SovereignPulseMode
  onInspect: (node: SovereignPulseCustomerNode) => void
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function protectedLabel(node: SovereignPulseCustomerNode, privacy: SovereignPulsePrivacy) {
  if (privacy === 'visitor_safe') return `Client ${node.code.slice(-3)}`
  if (privacy === 'team_safe') return node.code
  return node.label
}

function renewalLabel(days: number | null | undefined) {
  if (typeof days !== 'number' || !Number.isFinite(days)) return 'Horizon non renseigné'
  if (days < 0) return `${Math.abs(days)} j dépassé`
  if (days === 0) return 'Aujourd’hui'
  if (days === 1) return 'Demain'
  return `${days} jours`
}

function markerSize(node: SovereignPulseCustomerNode) {
  const valueFactor = Math.log10(Math.max(10, node.value || 10))
  return Math.round(Math.max(44, Math.min(76, 40 + valueFactor * 7)))
}

function markerHtml(node: SovereignPulseCustomerNode, selected: boolean, privacy: SovereignPulsePrivacy, soleNode: boolean) {
  const size = markerSize(node)
  const beaconSize = soleNode ? 176 : selected ? 148 : Math.max(112, size + 54)
  const markerLabel = privacy === 'visitor_safe' ? node.code.slice(-3) : node.code
  const selectedClass = selected ? ' ac-sp-map-beacon--selected' : ''
  const soleClass = soleNode ? ' ac-sp-map-beacon--sole' : ''
  return `<div class="ac-sp-map-beacon ac-sp-map-beacon--${node.state}${selectedClass}${soleClass}" style="--beacon-size:${beaconSize}px;--marker-size:${size}px;--marker-color:${STATE_COLORS[node.state]}"><i class="ac-sp-map-radar-ring ac-sp-map-radar-ring--one"></i><i class="ac-sp-map-radar-ring ac-sp-map-radar-ring--two"></i><b class="ac-sp-map-radar-orbit"></b><em class="ac-sp-map-radar-sweep"></em><div class="ac-sp-map-marker"><span>${escapeHtml(markerLabel)}</span><strong>${Math.round(node.health)}</strong><small>SIGNAL</small></div></div>`
}

function tooltipHtml(node: SovereignPulseCustomerNode, privacy: SovereignPulsePrivacy) {
  return `<div class="ac-sp-map-tooltip"><span>${escapeHtml(node.code)} · ${escapeHtml(node.city)}</span><strong>${escapeHtml(protectedLabel(node, privacy))}</strong><small>${escapeHtml(node.segment)} · Santé ${Math.round(node.health)}/100</small></div>`
}

function SovereignPulseCustomerMap({ nodes, privacy, mode, onInspect }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const leafletRef = useRef<LeafletRuntime | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const layerGroupRef = useRef<LeafletLayerGroup | null>(null)
  const inspectRef = useRef(onInspect)
  const refreshControllerRef = useRef<AbortController | null>(null)
  const initialModeRef = useRef(mode)
  const [mapReady, setMapReady] = useState(false)
  const [capturedNodes, setCapturedNodes] = useState<SovereignPulseCustomerNode[]>(nodes)
  const [capturedAt, setCapturedAt] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<CustomerFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(nodes.length === 1 ? nodes[0].id : null)
  const [resetNonce, setResetNonce] = useState(0)
  const [networkVisible, setNetworkVisible] = useState(true)

  useEffect(() => { inspectRef.current = onInspect }, [onInspect])

  const filteredNodes = useMemo(
    () => capturedNodes.filter((node) => filter === 'all' || node.state === filter),
    [capturedNodes, filter],
  )

  const selectedNode = useMemo(
    () => capturedNodes.find((node) => node.id === selectedId) || null,
    [capturedNodes, selectedId],
  )

  useEffect(() => {
    if (capturedNodes.length === 1) {
      setSelectedId(capturedNodes[0].id)
      return
    }
    if (selectedId && !capturedNodes.some((node) => node.id === selectedId)) setSelectedId(null)
  }, [capturedNodes, selectedId])

  const renewalWatch = useMemo(
    () => capturedNodes
      .filter((node) => typeof node.renewalDays === 'number' && Number.isFinite(node.renewalDays))
      .sort((a, b) => (a.renewalDays || 0) - (b.renewalDays || 0))
      .slice(0, mode === 'wall' ? 3 : 4),
    [capturedNodes, mode],
  )

  const tileUrl = process.env.NEXT_PUBLIC_OSM_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

  useEffect(() => {
    let cancelled = false
    let resizeTimer: number | null = null
    let settleTimerOne: number | null = null
    let settleTimerTwo: number | null = null

    async function initialise() {
      if (!containerRef.current || mapRef.current) return
      const imported = await import('leaflet')
      const container = containerRef.current
      if (cancelled || !container) return
      const L = (imported.default || imported) as LeafletRuntime
      leafletRef.current = L

      const map = L.map(container, {
        center: MOROCCO_CENTER,
        zoom: 5.5,
        minZoom: 4,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: initialModeRef.current !== 'wall',
        dragging: initialModeRef.current !== 'wall',
        doubleClickZoom: initialModeRef.current !== 'wall',
        keyboard: initialModeRef.current !== 'wall',
        preferCanvas: true,
        fadeAnimation: false,
        zoomAnimation: false,
        markerZoomAnimation: false,
      })

      L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        maxZoom: 19,
        updateWhenIdle: true,
        updateWhenZooming: false,
        keepBuffer: 1,
      }).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)
      L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map)
      const layers = L.layerGroup().addTo(map)

      mapRef.current = map
      layerGroupRef.current = layers
      settleTimerOne = window.setTimeout(() => map.invalidateSize({ animate: false }), 80)
      settleTimerTwo = window.setTimeout(() => map.invalidateSize({ animate: false }), 420)
      setMapReady(true)

      const onResize = () => {
        if (resizeTimer !== null) window.clearTimeout(resizeTimer)
        resizeTimer = window.setTimeout(() => map.invalidateSize({ animate: false }), 180)
      }
      window.addEventListener('resize', onResize)
      ;(map as LeafletMap).__angelcareOnResize = onResize
    }

    void initialise()

    return () => {
      cancelled = true
      if (resizeTimer !== null) window.clearTimeout(resizeTimer)
      if (settleTimerOne !== null) window.clearTimeout(settleTimerOne)
      if (settleTimerTwo !== null) window.clearTimeout(settleTimerTwo)
      const onResize = mapRef.current?.__angelcareOnResize
      if (onResize) window.removeEventListener('resize', onResize)
      refreshControllerRef.current?.abort()
      refreshControllerRef.current = null
      layerGroupRef.current?.clearLayers?.()
      mapRef.current?.remove?.()
      layerGroupRef.current = null
      mapRef.current = null
      leafletRef.current = null
      setMapReady(false)
    }
  }, [tileUrl])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return
    const interactive = mode !== 'wall'
    for (const handler of ['scrollWheelZoom', 'dragging', 'doubleClickZoom', 'keyboard']) {
      const controller = map[handler]
      if (!controller) continue
      if (interactive) controller.enable?.()
      else controller.disable?.()
    }
  }, [mapReady, mode])

  const renderMapLayers = useCallback(() => {
    const L = leafletRef.current
    const map = mapRef.current
    const layers = layerGroupRef.current
    if (!L || !map || !layers) return

    layers.clearLayers()

    if (networkVisible) {
      filteredNodes.forEach((node) => {
        L.polyline([NETWORK_HUB, [node.latitude, node.longitude]], {
          color: STATE_COLORS[node.state],
          weight: selectedId === node.id ? 1.7 : 0.8,
          opacity: selectedId === node.id ? 0.48 : 0.16,
          dashArray: selectedId === node.id ? '8 10' : '3 11',
          lineCap: 'round',
          interactive: false,
        }).addTo(layers)
      })
    }

    const soleNode = filteredNodes.length === 1

    filteredNodes.forEach((node) => {
      const selected = selectedId === node.id
      const size = markerSize(node)
      const beaconSize = soleNode ? 176 : selected ? 148 : Math.max(112, size + 54)
      const radius = soleNode
        ? Math.max(18000, Math.min(42000, 22000 + node.openCases * 3500 + (100 - node.health) * 180))
        : selected
          ? Math.max(9000, Math.min(38000, 9000 + node.openCases * 4500 + (100 - node.health) * 280))
          : Math.max(4500, Math.min(11000, 5000 + (100 - node.health) * 55))

      L.circle([node.latitude, node.longitude], {
        radius,
        color: STATE_COLORS[node.state],
        weight: soleNode || selected ? 2 : 1,
        opacity: soleNode || selected ? 0.56 : 0.22,
        fillColor: STATE_COLORS[node.state],
        fillOpacity: soleNode || selected ? 0.10 : 0.025,
        dashArray: soleNode || selected ? '8 10' : '3 10',
        className: `ac-sp-map-georadar ac-sp-map-georadar--${node.state}${soleNode ? ' ac-sp-map-georadar--sole' : ''}`,
        interactive: false,
      }).addTo(layers)

      L.circle([node.latitude, node.longitude], {
        radius: radius * 0.52,
        color: STATE_COLORS[node.state],
        weight: 1,
        opacity: soleNode || selected ? 0.42 : 0.14,
        fillOpacity: 0,
        dashArray: '2 8',
        className: 'ac-sp-map-georadar ac-sp-map-georadar--inner',
        interactive: false,
      }).addTo(layers)

      const icon = L.divIcon({
        className: 'ac-sp-map-marker-host',
        iconSize: [beaconSize, beaconSize],
        iconAnchor: [beaconSize / 2, beaconSize / 2],
        tooltipAnchor: [0, -(size / 2 + 12)],
        html: markerHtml(node, selected, privacy, soleNode),
      })

      const marker = L.marker([node.latitude, node.longitude], {
        icon,
        riseOnHover: true,
        riseOffset: selected ? 1000 : node.state === 'intervention' ? 500 : 0,
        keyboard: mode !== 'wall',
        title: protectedLabel(node, privacy),
        alt: protectedLabel(node, privacy),
      }).addTo(layers)

      marker.bindTooltip(tooltipHtml(node, privacy), {
        direction: 'top',
        opacity: 1,
        className: 'ac-sp-map-tooltip-host',
      })
      marker.on('click', () => {
        setSelectedId(node.id)
        inspectRef.current(node)
      })
    })

    if (!filteredNodes.length) {
      map.setView(MOROCCO_CENTER, 5.5, { animate: false })
      return
    }

    const selected = selectedId ? filteredNodes.find((node) => node.id === selectedId) : null
    if (filteredNodes.length === 1) {
      const node = filteredNodes[0]
      map.setView([node.latitude, node.longitude], mode === 'wall' ? 8.6 : 9.4, { animate: false })
      return
    }
    if (selected) {
      map.setView([selected.latitude, selected.longitude], Math.max(8, map.getZoom()), { animate: false })
      return
    }

    const bounds = L.latLngBounds(filteredNodes.map((node) => [node.latitude, node.longitude]))
    map.fitBounds(bounds.pad(0.24), {
      animate: false,
      maxZoom: 8,
      paddingTopLeft: [58, 68],
      paddingBottomRight: [58, 82],
    })
  }, [filteredNodes, mode, networkVisible, privacy, resetNonce, selectedId])

  useEffect(() => { if (mapReady) renderMapLayers() }, [mapReady, renderMapLayers])

  const refreshMapCapture = useCallback(async () => {
    if (refreshing) return
    refreshControllerRef.current?.abort()
    const controller = new AbortController()
    refreshControllerRef.current = controller
    setRefreshing(true)

    try {
      const response = await fetch('/api/angelcare360/operator/sovereign-pulse', {
        cache: 'no-store',
        signal: controller.signal,
      })
      if (!response.ok) throw new Error('Map snapshot refresh failed')
      const snapshot = await response.json() as SovereignPulseSnapshot
      const nextNodes = Array.isArray(snapshot.customerNodes) ? snapshot.customerNodes : []
      setCapturedNodes(nextNodes)
      setCapturedAt(new Date(snapshot.generatedAt || Date.now()))
      setFilter('all')
      setSelectedId(nextNodes.length === 1 ? nextNodes[0].id : null)
      setResetNonce((value) => value + 1)
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        // The last stable map capture remains visible when refresh fails.
      }
    } finally {
      if (refreshControllerRef.current === controller) refreshControllerRef.current = null
      setRefreshing(false)
    }
  }, [refreshing])

  const handleSelect = (node: SovereignPulseCustomerNode) => {
    setSelectedId(node.id)
    onInspect(node)
  }

  const atRiskCount = capturedNodes.filter((node) => node.state === 'attention' || node.state === 'intervention').length
  const exactLocations = capturedNodes.filter((node) => node.locationPrecision === 'exact').length

  return (
    <div className={styles.mapCommand} data-mode={mode} data-single={capturedNodes.length === 1}>
      <div ref={containerRef} className={styles.mapCanvas} aria-label="Carte OpenStreetMap des clients AngelCare" />

      <div className={styles.mapAtmosphere} aria-hidden="true"><i /><i /><i /></div>
      <div className={styles.mapScan} aria-hidden="true" />

      <div className={styles.livePlate}>
        <div className={styles.liveIdentity}>
          <span><RadioTower size={13} /> OSM SNAPSHOT</span>
          <strong>{filteredNodes.length}</strong>
          <small>capture {capturedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</small>
        </div>
        <div className={styles.liveMetrics}>
          <div><ShieldCheck size={14} /><span>{capturedNodes.length - atRiskCount}</span><small>sous contrôle</small></div>
          <div><Sparkles size={14} /><span>{atRiskCount}</span><small>à surveiller</small></div>
          <div><Crosshair size={14} /><span>{exactLocations}</span><small>positions exactes</small></div>
        </div>
      </div>

      <div className={styles.filterDeck}>
        <div className={styles.filterTitle}><Layers3 size={14} /><span>Situation client</span></div>
        <div className={styles.filterPills}>
          {(['all', 'healthy', 'onboarding', 'attention', 'intervention'] as CustomerFilter[]).map((state) => (
            <button
              key={state}
              type="button"
              data-active={filter === state}
              data-state={state}
              onClick={() => {
                setSelectedId(null)
                setFilter(state)
              }}
            >
              <i />
              {state === 'all' ? 'Tous' : STATE_LABELS[state]}
              <strong>{state === 'all' ? capturedNodes.length : capturedNodes.filter((node) => node.state === state).length}</strong>
            </button>
          ))}
        </div>
        <div className={styles.mapActions}>
          <button type="button" onClick={() => void refreshMapCapture()} disabled={refreshing} title="Recharger uniquement les données client de la carte">
            <RefreshCw size={14} className={refreshing ? styles.spin : ''} /> {refreshing ? 'Capture…' : 'Rafraîchir'}
          </button>
          <button type="button" onClick={() => { setSelectedId(capturedNodes.length === 1 ? capturedNodes[0].id : null); setResetNonce((value) => value + 1) }}><RotateCcw size={14} /> Recentrer</button>
          <button type="button" data-active={networkVisible} onClick={() => setNetworkVisible((value) => !value)}><RadioTower size={14} /> Réseau</button>
        </div>
      </div>

      <div className={styles.renewalDeck}>
        <div className={styles.renewalTitle}>
          <CalendarClock size={15} />
          <div><span>Renewal horizon</span><strong>Échéances prioritaires</strong></div>
        </div>
        <div className={styles.renewalRows}>
          {renewalWatch.length ? renewalWatch.map((node) => (
            <button key={node.id} type="button" data-state={node.state} onClick={() => handleSelect(node)}>
              <i />
              <div><strong>{protectedLabel(node, privacy)}</strong><span>{node.city} · {node.code}</span></div>
              <em>{renewalLabel(node.renewalDays)}</em>
            </button>
          )) : <div className={styles.noRenewal}><CalendarClock size={16} /><span>Aucune échéance géolocalisée disponible.</span></div>}
        </div>
      </div>

      <div className={styles.selectedDeck} data-open={Boolean(selectedNode)}>
        {selectedNode ? (
          <>
            <div className={styles.selectedCrown} data-state={selectedNode.state}>
              <MapPinned size={17} />
              <div><span>{selectedNode.code} · {selectedNode.city}</span><strong>{protectedLabel(selectedNode, privacy)}</strong></div>
              <em>{selectedNode.health}</em>
            </div>
            <div className={styles.selectedGrid}>
              <div><span>État</span><strong>{STATE_LABELS[selectedNode.state]}</strong></div>
              <div><span>Renouvellement</span><strong>{renewalLabel(selectedNode.renewalDays)}</strong></div>
              <div><span>Cases</span><strong>{selectedNode.openCases}</strong></div>
              <div><span>Position</span><strong>{selectedNode.locationPrecision === 'exact' ? 'Exacte' : 'Ville'}</strong></div>
            </div>
            <button type="button" onClick={() => onInspect(selectedNode)}><Building2 size={14} /> Ouvrir le dossier client</button>
          </>
        ) : (
          <div className={styles.selectedEmpty}><MapPinned size={18} /><span>Sélectionnez une implantation pour ouvrir sa situation.</span></div>
        )}
      </div>

      <div className={styles.mapLegend}>
        {(['healthy', 'onboarding', 'attention', 'intervention', 'inactive'] as SovereignPulseCustomerNode['state'][]).map((state) => (
          <span key={state}><i style={{ background: STATE_COLORS[state] }} />{STATE_LABELS[state]}</span>
        ))}
        <em>© OpenStreetMap contributors</em>
      </div>
    </div>
  )
}

function sameMapProps(previous: Props, next: Props) {
  return previous.privacy === next.privacy
    && previous.mode === next.mode
    && previous.onInspect === next.onInspect
}

export default memo(SovereignPulseCustomerMap, sameMapProps)
