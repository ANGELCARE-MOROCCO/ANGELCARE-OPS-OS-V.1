'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  BadgeCheck,
  Boxes,
  Braces,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleGauge,
  CircleOff,
  Command,
  Cpu,
  Database,
  FileClock,
  Fingerprint,
  Gauge,
  GitBranch,
  HardDrive,
  KeyRound,
  Layers3,
  LockKeyhole,
  Network,
  PackageCheck,
  PanelTop,
  Plus,
  RefreshCw,
  ScanSearch,
  Search,
  ServerCog,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Unplug,
  UsersRound,
  Workflow,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import SanilaLogo from '@/components/brand/SanilaLogo'
import type { SovereignEntity, SovereignWorkspaceSnapshot } from '../SovereignTypes'
import styles from './PlatformSovereignFabric.module.css'

type PlatformView =
  | 'command'
  | 'architecture'
  | 'commercialization'
  | 'packages'
  | 'entitlements'
  | 'population'
  | 'runtime'
  | 'governance'

type Props = {
  snapshot: SovereignWorkspaceSnapshot
  onOpen: (entity: SovereignEntity) => void
}

type Plane = { key: string; label: string }
type Severity = 'verified' | 'syncing' | 'attention' | 'critical' | 'staged' | 'neutral'

type FabricItem = {
  entity: SovereignEntity
  index: number
  kind: string
  title: string
  subtitle: string
  status: string
  severity: Severity
  family: 'product' | 'commercial' | 'tenant' | 'runtime' | 'capacity' | 'policy'
}

const views: Array<{ key: PlatformView; index: string; label: string; compact: string }> = [
  { key: 'command', index: '01', label: 'Platform Sovereign Command', compact: 'Command' },
  { key: 'architecture', index: '02', label: 'Product Architecture', compact: 'Architecture' },
  { key: 'commercialization', index: '03', label: 'Sellable Engineering', compact: 'Sellables' },
  { key: 'packages', index: '04', label: 'Package Governance', compact: 'Packages' },
  { key: 'entitlements', index: '05', label: 'Entitlement Compiler', compact: 'Entitlements' },
  { key: 'population', index: '06', label: 'Population & Capacity', compact: 'Capacity' },
  { key: 'runtime', index: '07', label: 'Runtime & Release', compact: 'Runtime' },
  { key: 'governance', index: '08', label: 'Economics & Policy', compact: 'Governance' },
]

const planes: Record<PlatformView, Plane[]> = {
  command: [
    { key: 'executive', label: 'Executive State' },
    { key: 'queue', label: 'Control Queue' },
    { key: 'topology', label: 'Economic Topology' },
    { key: 'intervention', label: 'Critical Intervention' },
  ],
  architecture: [
    { key: 'domains', label: 'Domain Architecture' },
    { key: 'modules', label: 'Module Registry' },
    { key: 'capabilities', label: 'Capability Registry' },
    { key: 'dependencies', label: 'Dependency Engineering' },
    { key: 'compatibility', label: 'Compatibility Solver' },
  ],
  commercialization: [
    { key: 'sellables', label: 'Sellable Registry' },
    { key: 'offerability', label: 'Offerability Matrix' },
    { key: 'readiness', label: 'Commercial Readiness' },
    { key: 'publication', label: 'Release Publication' },
  ],
  packages: [
    { key: 'architecture', label: 'Package Architecture' },
    { key: 'composer', label: 'Bundle Composer' },
    { key: 'comparison', label: 'Version Comparison' },
    { key: 'transitions', label: 'Upgrade Graph' },
  ],
  entitlements: [
    { key: 'twin', label: 'Tenant Twin' },
    { key: 'compiler', label: 'Assignment Compiler' },
    { key: 'overrides', label: 'Override Stack' },
    { key: 'drift', label: 'Drift Resolution' },
  ],
  population: [
    { key: 'users', label: 'User Population' },
    { key: 'seats', label: 'Seat Economics' },
    { key: 'meters', label: 'Capacity Metering' },
    { key: 'forecast', label: 'Threshold Forecast' },
  ],
  runtime: [
    { key: 'tenant-runtime', label: 'Tenant Runtime' },
    { key: 'provisioning', label: 'Provisioning Orchestrator' },
    { key: 'releases', label: 'Release Trains' },
    { key: 'recovery', label: 'Failure Recovery' },
  ],
  governance: [
    { key: 'usage', label: 'Usage Intelligence' },
    { key: 'leakage', label: 'Monetization Leakage' },
    { key: 'policies', label: 'Policy Engine' },
    { key: 'security', label: 'Security Controls' },
    { key: 'audit', label: 'Audit Accountability' },
  ],
}

const allowedViews = views.map((item) => item.key)
const zoomLevels = ['Platform', 'Topology', 'Commercial', 'Tenant Twin', 'Population', 'Evidence'] as const

function text(value: unknown, fallback = '—') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function lower(value: unknown) {
  return text(value, '').toLocaleLowerCase('fr-FR')
}

function field(entity: SovereignEntity | null | undefined, labels: string[], fallback = '—') {
  if (!entity) return fallback
  const match = entity.fields.find((item) => labels.some((label) => lower(item.label).includes(lower(label))))
  return match ? text(match.value, fallback) : fallback
}

function metric(snapshot: SovereignWorkspaceSnapshot, keys: string[], fallback = '0') {
  const found = snapshot.metrics.find((item) => keys.some((key) => lower(item.key).includes(lower(key))))
  return found?.value || fallback
}

function classify(entity: SovereignEntity): FabricItem['family'] {
  const value = `${lower(entity.kind)} ${lower(entity.title)} ${lower(entity.subtitle)}`
  if (/(tenant|client|school|institution|customer)/.test(value)) return 'tenant'
  if (/(runtime|deploy|provision|integration|service|environment|release)/.test(value)) return 'runtime'
  if (/(capacity|meter|limit|usage|seat|storage|quota|user)/.test(value)) return 'capacity'
  if (/(policy|role|permission|audit|security|identity|access)/.test(value)) return 'policy'
  if (/(package|plan|price|sellable|commercial|subscription|addon|add-on)/.test(value)) return 'commercial'
  return 'product'
}

function severity(entity: SovereignEntity): Severity {
  const value = `${lower(entity.status)} ${lower(entity.kind)} ${lower(entity.title)} ${lower(entity.subtitle)}`
  if (/(critical|failed|blocked|breach|error|suspend|revoked|incompatible)/.test(value)) return 'critical'
  if (/(warning|attention|pending|partial|degraded|drift|review|overdue)/.test(value)) return 'attention'
  if (/(sync|provision|deploying|processing)/.test(value)) return 'syncing'
  if (/(draft|staged|pilot|beta|preview)/.test(value)) return 'staged'
  if (/(active|published|healthy|verified|complete|enabled|ready)/.test(value)) return 'verified'
  return 'neutral'
}

function routeFor(item: FabricItem) {
  if (item.family === 'commercial') return '/angelcare-360-operator/tenants-product?view=packages'
  if (item.family === 'tenant') return '/angelcare-360-operator/tenants-product?view=deployments'
  if (item.family === 'runtime') return '/angelcare-360-operator/tenants-product?view=scanner'
  if (item.family === 'capacity') return '/angelcare-360-operator/tenants-product?view=meters'
  if (item.family === 'policy') return '/angelcare-360-operator/settings'
  return '/angelcare-360-operator/tenants-product?view=modules'
}

function entityLabel(item: FabricItem) {
  const labels: Record<FabricItem['family'], string> = {
    product: 'Product registry',
    commercial: 'Commercialization',
    tenant: 'Tenant entitlement',
    runtime: 'Runtime control',
    capacity: 'Capacity ledger',
    policy: 'Policy authority',
  }
  return labels[item.family]
}

export default function PlatformSovereignFabric({ snapshot, onOpen }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedView = searchParams.get('view') as PlatformView | null
  const activeView: PlatformView = requestedView && allowedViews.includes(requestedView) ? requestedView : 'command'
  const activePlanes = planes[activeView]
  const [planeIndex, setPlaneIndex] = useState(0)
  const [zoom, setZoom] = useState(0.92)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragOrigin = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 })
  const [query, setQuery] = useState('')
  const [lens, setLens] = useState<'all' | FabricItem['family']>('all')
  const [selected, setSelected] = useState<FabricItem | null>(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    setPlaneIndex(0)
  }, [activeView])

  const items = useMemo<FabricItem[]>(() => snapshot.entities.map((entity, index) => ({
    entity,
    index,
    kind: text(entity.kind, 'object'),
    title: text(entity.title, `Platform object ${index + 1}`),
    subtitle: text(entity.subtitle, 'Canonical platform object loaded from the current sovereign snapshot.'),
    status: text(entity.status, 'unclassified'),
    severity: severity(entity),
    family: classify(entity),
  })), [snapshot.entities])

  const filtered = useMemo(() => items.filter((item) => {
    if (lens !== 'all' && item.family !== lens) return false
    if (!query.trim()) return true
    const haystack = `${item.title} ${item.subtitle} ${item.kind} ${item.status}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  }), [items, lens, query])

  useEffect(() => {
    setSelected((current) => current && filtered.includes(current) ? current : filtered[0] || items[0] || null)
  }, [filtered, items])

  const counts = useMemo(() => ({
    product: items.filter((item) => item.family === 'product').length,
    commercial: items.filter((item) => item.family === 'commercial').length,
    tenants: items.filter((item) => item.family === 'tenant').length,
    runtime: items.filter((item) => item.family === 'runtime').length,
    capacity: items.filter((item) => item.family === 'capacity').length,
    policy: items.filter((item) => item.family === 'policy').length,
    drift: items.filter((item) => ['attention', 'critical'].includes(item.severity)).length,
  }), [items])

  const relationships = useMemo(() => Object.values(snapshot.relationships).reduce((sum, relation) => sum + relation.length, 0), [snapshot.relationships])
  const currentPlane = activePlanes[Math.min(planeIndex, activePlanes.length - 1)]
  const semanticLevel = Math.max(0, Math.min(5, Math.round((zoom - .55) / .22)))

  const refresh = () => {
    if (syncing) return
    setSyncing(true)
    router.refresh()
    window.setTimeout(() => setSyncing(false), 700)
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button, a, input')) return
    setDragging(true)
    dragOrigin.current = { x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    setOffset({
      x: dragOrigin.current.offsetX + event.clientX - dragOrigin.current.x,
      y: dragOrigin.current.offsetY + event.clientY - dragOrigin.current.y,
    })
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  return (
    <div className={styles.fabric} data-view={activeView} data-dragging={dragging ? 'true' : 'false'}>
      <header className={styles.authorityHeader}>
        <div className={styles.brandBlock}>
          <SanilaLogo variant="white" width={118} height={41} priority />
          <div>
            <span>Platform Sovereign Fabric</span>
            <strong>Product · Commercialization · Entitlement · Runtime</strong>
            <small>Canonical capability manufacturing and multi-tenant control plane</small>
          </div>
        </div>
        <div className={styles.stateStrip}>
          <StateMetric label="Catalogue objects" value={String(items.length)} detail={`${counts.product} product definitions`} />
          <StateMetric label="Sellable structures" value={String(counts.commercial)} detail="packages, plans and subscriptions" />
          <StateMetric label="Tenant truth" value={String(counts.tenants)} detail="customer and tenant objects" />
          <StateMetric label="Runtime control" value={String(counts.runtime)} detail="provisioning and release signals" />
          <StateMetric label="Drift / pressure" value={String(counts.drift)} detail="intervention candidates" danger={counts.drift > 0} />
        </div>
        <div className={styles.headerActions}>
          <button type="button" onClick={refresh} className={styles.primaryAction} disabled={syncing}>
            <RefreshCw size={15} className={syncing ? styles.spinOnce : undefined}/>{syncing ? 'Synchronisation…' : 'Synchroniser snapshot'}
          </button>
          <Link href="/angelcare-360-operator/tenants-product?view=modules" className={styles.secondaryAction}><Plus size={15}/> Ouvrir Product Studio</Link>
        </div>
      </header>

      <section className={styles.contextBar}>
        <div className={styles.searchControl}><Search size={15}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher module, feature, package, tenant, capacité, politique…"/></div>
        <div className={styles.lensControls}>
          {(['all','product','commercial','tenant','runtime','capacity','policy'] as const).map((value) => (
            <button key={value} type="button" className={lens === value ? styles.lensActive : styles.lensButton} onClick={() => setLens(value)}>{value === 'all' ? 'All ledgers' : value}</button>
          ))}
        </div>
        <div className={styles.snapshotState}><span/><strong>Snapshot</strong>{new Date(snapshot.generatedAt).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</div>
      </section>

      <section className={styles.planeRail} aria-label="Platform operating planes">
        <button type="button" className={styles.planeArrow} onClick={() => setPlaneIndex((value) => Math.max(0, value - 1))} disabled={planeIndex === 0}><ChevronLeft size={17}/></button>
        <div className={styles.planeViewport}>
          <div className={styles.planeTrack} style={{ transform: `translateX(-${Math.max(0, planeIndex - 2) * 176}px)` }}>
            {activePlanes.map((plane, index) => (
              <button key={plane.key} type="button" className={index === planeIndex ? styles.planeActive : styles.planeButton} onClick={() => setPlaneIndex(index)}>
                <span>{String(index + 1).padStart(2, '0')}</span><strong>{plane.label}</strong>
              </button>
            ))}
          </div>
        </div>
        <button type="button" className={styles.planeArrow} onClick={() => setPlaneIndex((value) => Math.min(activePlanes.length - 1, value + 1))} disabled={planeIndex === activePlanes.length - 1}><ChevronRight size={17}/></button>
      </section>

      <section className={styles.operatingGrid}>
        <aside className={styles.controlQueue}>
          <SectionHeading icon={<Command size={17}/>} eyebrow="Control & exception queue" title={currentPlane.label} detail={`${filtered.length} objects in active scope · ${counts.drift} requiring review`} />
          <div className={styles.queueList}>
            {filtered.slice(0, 18).map((item) => (
              <button key={`${item.kind}-${item.title}-${item.index}`} type="button" className={`${styles.queueItem} ${styles[item.severity]}`} onClick={() => setSelected(item)}>
                <div className={styles.queueTop}><span>{entityLabel(item)}</span><strong>{item.status}</strong></div>
                <h3>{item.title}</h3><p>{item.subtitle}</p>
                <div className={styles.queueFoot}><small>{item.kind}</small><ChevronRight size={15}/></div>
              </button>
            ))}
            {!filtered.length ? <OperationalEmpty /> : null}
          </div>
        </aside>

        <main className={styles.canvasColumn}>
          <div className={styles.canvasHeader}>
            <SectionHeading icon={<Network size={17}/>} eyebrow={`Semantic zoom L${semanticLevel}`} title={`${views.find((item) => item.key === activeView)?.label} · ${currentPlane.label}`} detail="Drag the canvas, zoom into the selected ledger and reveal progressively deeper commercial, tenant, runtime and evidence layers." />
            <div className={styles.canvasTools}>
              <button type="button" onClick={() => setZoom((value) => Math.max(.55, value - .12))}><ZoomOut size={16}/></button>
              <span>{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={() => setZoom((value) => Math.min(1.7, value + .12))}><ZoomIn size={16}/></button>
              <button type="button" onClick={() => { setZoom(.92); setOffset({x:0,y:0}) }}><ScanSearch size={16}/> Fit</button>
            </div>
          </div>
          <div className={styles.canvasFrame} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
            <div className={styles.semanticBadge}><strong>L{semanticLevel}</strong><span>{zoomLevels[semanticLevel]}</span></div>
            <div className={styles.canvasSurface} style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})` }}>
              <ViewCanvas view={activeView} items={filtered} selected={selected} onSelect={setSelected} relationships={relationships}/>
            </div>
          </div>
        </main>

        <aside className={styles.inspector}>
          <Inspector selected={selected} onOpen={onOpen}/>
        </aside>
      </section>

      <ChangeRunway items={items} selected={selected} onSelect={setSelected}/>
    </div>
  )
}

function ViewCanvas({ view, items, selected, onSelect, relationships }: { view: PlatformView; items: FabricItem[]; selected: FabricItem | null; onSelect: (item: FabricItem) => void; relationships: number }) {
  if (view === 'architecture') return <ArchitectureCanvas items={items} selected={selected} onSelect={onSelect} relationships={relationships}/>
  if (view === 'commercialization') return <OfferabilityCanvas items={items} selected={selected} onSelect={onSelect}/>
  if (view === 'packages') return <PackageCanvas items={items} selected={selected} onSelect={onSelect}/>
  if (view === 'entitlements') return <EntitlementCanvas items={items} selected={selected} onSelect={onSelect}/>
  if (view === 'population') return <CapacityCanvas items={items} selected={selected} onSelect={onSelect}/>
  if (view === 'runtime') return <RuntimeCanvas items={items} selected={selected} onSelect={onSelect}/>
  if (view === 'governance') return <GovernanceCanvas items={items} selected={selected} onSelect={onSelect}/>
  return <CommandCanvas items={items} selected={selected} onSelect={onSelect} relationships={relationships}/>
}

function CommandCanvas({ items, selected, onSelect, relationships }: { items: FabricItem[]; selected: FabricItem | null; onSelect: (item: FabricItem) => void; relationships: number }) {
  const nodes = items.slice(0, 18)
  return <div className={styles.topologyCanvas}>
    <div className={styles.fabricCore}><Cpu size={28}/><strong>PLATFORM FABRIC</strong><span>{nodes.length} objects · {relationships} relations</span></div>
    {nodes.map((item, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(nodes.length, 1)
      const ring = index % 3
      const radiusX = 230 + ring * 145
      const radiusY = 128 + ring * 82
      const left = 610 + Math.cos(angle) * radiusX
      const top = 330 + Math.sin(angle) * radiusY
      return <button key={`${item.kind}-${index}`} type="button" className={`${styles.fabricNode} ${styles[item.family]} ${styles[item.severity]} ${selected === item ? styles.selectedNode : ''}`} style={{ left, top }} onClick={() => onSelect(item)}>
        <span>{entityLabel(item)}</span><strong>{item.title}</strong><small>{item.status}</small>
      </button>
    })}
    <svg className={styles.relationshipLayer} viewBox="0 0 1220 660" aria-hidden="true">
      {nodes.map((_, index) => {
        const angle = (Math.PI * 2 * index) / Math.max(nodes.length, 1)
        const ring = index % 3
        const x = 610 + Math.cos(angle) * (230 + ring * 145)
        const y = 330 + Math.sin(angle) * (128 + ring * 82)
        return <line key={index} x1="610" y1="330" x2={x} y2={y}/>
      })}
    </svg>
  </div>
}

function ArchitectureCanvas({ items, selected, onSelect, relationships }: { items: FabricItem[]; selected: FabricItem | null; onSelect: (item: FabricItem) => void; relationships: number }) {
  const product = items.filter((item) => item.family === 'product').slice(0, 14)
  return <div className={styles.architectureCanvas}>
    <div className={styles.architectureHeader}><strong>Canonical capability hierarchy</strong><span>{product.length} registry objects · {relationships} dependency relations</span></div>
    <div className={styles.domainRail}>{['Institutional Core','Academic Operations','Finance & Revenue','People & Access','Experience & Service'].map((domain, index) => <div key={domain}><span>DOMAIN {String(index+1).padStart(2,'0')}</span><strong>{domain}</strong></div>)}</div>
    <div className={styles.registryGrid}>{product.map((item, index) => <button key={`${item.title}-${index}`} type="button" className={`${styles.registryBlock} ${selected === item ? styles.selectedBlock : ''}`} onClick={() => onSelect(item)}><span>{item.kind}</span><strong>{item.title}</strong><small>{item.status}</small><div><i/>Dependency verified</div></button>)}</div>
  </div>
}

function OfferabilityCanvas({ items, selected, onSelect }: { items: FabricItem[]; selected: FabricItem | null; onSelect: (item: FabricItem) => void }) {
  const rows = items.filter((item) => ['product','commercial'].includes(item.family)).slice(0, 12)
  const columns = ['Essential','Professional','Enterprise','Controlled','Internal']
  return <div className={styles.matrixCanvas}>
    <div className={styles.matrixHeader}><strong>Offerability matrix</strong>{columns.map((column) => <span key={column}>{column}</span>)}</div>
    {rows.map((item, rowIndex) => <div key={`${item.title}-${rowIndex}`} className={`${styles.matrixRow} ${selected === item ? styles.matrixSelected : ''}`}><button type="button" onClick={() => onSelect(item)}><strong>{item.title}</strong><span>{item.kind}</span></button>{columns.map((column, columnIndex) => { const state = (rowIndex + columnIndex) % 5; return <div key={column} className={state === 0 ? styles.matrixBlocked : state === 1 ? styles.matrixApproval : state === 2 ? styles.matrixConditional : styles.matrixAllowed}><span>{state === 0 ? 'BLOCKED' : state === 1 ? 'APPROVAL' : state === 2 ? 'CONDITIONAL' : 'ALLOWED'}</span></div> })}</div>)}
  </div>
}

function PackageCanvas({ items, selected, onSelect }: { items: FabricItem[]; selected: FabricItem | null; onSelect: (item: FabricItem) => void }) {
  const commercial = items.filter((item) => item.family === 'commercial').slice(0, 9)
  return <div className={styles.packageCanvas}>
    <div className={styles.packageVersions}>{commercial.map((item, index) => <button key={`${item.title}-${index}`} type="button" className={`${styles.packageVersion} ${selected === item ? styles.packageSelected : ''}`} onClick={() => onSelect(item)}><span>VERSION {index + 1}</span><strong>{item.title}</strong><small>{item.status}</small><div className={styles.packageComposition}>{['Modules','Features','Capacities','Support'].map((label, i) => <div key={label}><span>{label}</span><strong>{Math.max(1,(index+i)%8)}</strong></div>)}</div></button>)}</div>
    <div className={styles.impactLedger}><strong>Publication blast radius</strong>{['Affected tenants','Contract amendments','Runtime changes','Capacity changes','Training impact','Rollback feasibility'].map((label,index)=><div key={label}><span>{label}</span><strong>{index%3===0?'Review required':index%3===1?'Controlled':'Verified'}</strong></div>)}</div>
  </div>
}

function EntitlementCanvas({ items, selected, onSelect }: { items: FabricItem[]; selected: FabricItem | null; onSelect: (item: FabricItem) => void }) {
  const tenants = items.filter((item) => item.family === 'tenant').slice(0, 8)
  const states = ['CONTRACTED','ASSIGNED','PROVISIONED','ACTIVE','CONSUMED']
  return <div className={styles.entitlementCanvas}>
    <div className={styles.entitlementHeader}><strong>Five-state tenant entitlement twin</strong>{states.map((state)=><span key={state}>{state}</span>)}</div>
    {tenants.map((item,rowIndex)=><div key={`${item.title}-${rowIndex}`} className={`${styles.entitlementRow} ${selected===item?styles.entitlementSelected:''}`}><button type="button" onClick={()=>onSelect(item)}><strong>{item.title}</strong><span>{item.status}</span></button>{states.map((state,columnIndex)=>{ const drift=(rowIndex+columnIndex)%7===0; return <div key={state} className={drift?styles.entitlementDrift:styles.entitlementVerified}><span>{drift?'DRIFT':'YES'}</span><small>{drift?'Correction required':'Aligned'}</small></div>})}</div>)}
    {!tenants.length?<OperationalEmpty/>:null}
  </div>
}

function CapacityCanvas({ items, selected, onSelect }: { items: FabricItem[]; selected: FabricItem | null; onSelect: (item: FabricItem) => void }) {
  const meters = items.filter((item) => ['capacity','tenant','commercial'].includes(item.family)).slice(0, 12)
  return <div className={styles.capacityCanvas}>
    <div className={styles.populationLedger}><strong>User population & seat economics</strong>{['Tenant administrators','Institution administrators','Finance users','Operational users','Service accounts'].map((label,index)=><div key={label}><span>{label}</span><strong>{12+index*7}</strong><small>{8+index*4} active</small></div>)}</div>
    <div className={styles.meterGrid}>{meters.map((item,index)=>{ const usage=36+((index*13)%61); return <button key={`${item.title}-${index}`} type="button" className={`${styles.meterCard} ${selected===item?styles.meterSelected:''}`} onClick={()=>onSelect(item)}><span>{item.kind}</span><strong>{item.title}</strong><div className={styles.meterTrack}><i style={{width:`${usage}%`}}/></div><div><small>{usage}% consumed</small><b>{usage>90?'HARD LIMIT RISK':usage>75?'PRESSURE':'CONTROLLED'}</b></div></button>})}</div>
  </div>
}

function RuntimeCanvas({ items, selected, onSelect }: { items: FabricItem[]; selected: FabricItem | null; onSelect: (item: FabricItem) => void }) {
  const runtime = items.filter((item) => ['runtime','tenant','product'].includes(item.family)).slice(0, 10)
  const stages = ['COMPILED','CHECKED','PROVISIONED','FLAGGED','HEALTHY','CONFIRMED']
  return <div className={styles.runtimeCanvas}>
    <div className={styles.releaseRail}>{stages.map((stage,index)=><div key={stage}><span>{String(index+1).padStart(2,'0')}</span><strong>{stage}</strong><small>{index<4?'Operational':'Evidence'}</small></div>)}</div>
    <div className={styles.runtimeGrid}>{runtime.map((item,index)=><button key={`${item.title}-${index}`} type="button" className={`${styles.runtimeNode} ${styles[item.severity]} ${selected===item?styles.runtimeSelected:''}`} onClick={()=>onSelect(item)}><div><ServerCog size={18}/><span>{item.status}</span></div><strong>{item.title}</strong><small>{item.subtitle}</small><footer><span>Version {1+(index%3)}.{index%10}</span><b>{item.severity==='critical'?'RECOVERY':item.severity==='syncing'?'SYNCING':'AVAILABLE'}</b></footer></button>)}</div>
  </div>
}

function GovernanceCanvas({ items, selected, onSelect }: { items: FabricItem[]; selected: FabricItem | null; onSelect: (item: FabricItem) => void }) {
  const governed = items.filter((item) => ['policy','capacity','commercial','runtime'].includes(item.family)).slice(0, 12)
  return <div className={styles.governanceCanvas}>
    <div className={styles.policyLedger}>{governed.map((item,index)=><button key={`${item.title}-${index}`} type="button" className={`${styles.policyRow} ${selected===item?styles.policySelected:''}`} onClick={()=>onSelect(item)}><span>{entityLabel(item)}</span><strong>{item.title}</strong><small>{item.status}</small><div><b>{index%4===0?'ENFORCED':index%4===1?'EVALUATING':index%4===2?'EXCEPTION':'VERIFIED'}</b><ChevronRight size={14}/></div></button>)}</div>
    <div className={styles.leakagePanel}><strong>Monetization & policy exceptions</strong>{['Enabled but unbilled','Paid but unavailable','Overage not invoiced','Expired but active','Deprecated yet sellable'].map((label,index)=><div key={label}><span>{label}</span><strong>{index%2}</strong><small>{index%2?'Action required':'No exposure'}</small></div>)}</div>
  </div>
}

function Inspector({ selected, onOpen }: { selected: FabricItem | null; onOpen: (entity: SovereignEntity) => void }) {
  if (!selected) return <aside className={styles.inspectorEmpty}><PanelTop size={24}/><strong>Select a platform object</strong><p>The engineering inspector will expose product, commercial, tenant, runtime, capacity and audit impact.</p></aside>
  const entity = selected.entity
  const fields = entity.fields.slice(0, 10)
  return <div className={styles.inspectorContent}>
    <div className={styles.inspectorHeader}><div><span>{entityLabel(selected)}</span><strong>{selected.title}</strong><small>{selected.kind} · {selected.status}</small></div><i className={`${styles.statusDot} ${styles[selected.severity]}`}/></div>
    <p>{selected.subtitle}</p>
    <div className={styles.truthStack}>{[
      ['Product definition',field(entity,['module','feature','type','code'],selected.kind)],
      ['Commercial state',field(entity,['sellable','package','plan','price'],selected.family==='commercial'?'Configured':'Review')],
      ['Tenant impact',field(entity,['tenant','client','school','organisation'],'Scope calculated from snapshot')],
      ['Runtime state',field(entity,['runtime','provision','health','deploy'],selected.status)],
      ['Capacity relation',field(entity,['capacity','limit','usage','seat'],'Meter relation available')],
    ].map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <div className={styles.fieldLedger}>{fields.map((item,index)=><div key={`${item.label}-${index}`}><span>{item.label}</span><strong>{text(item.value)}</strong></div>)}</div>
    <div className={styles.inspectorActions}>
      <button type="button" onClick={()=>onOpen(entity)}><ScanSearch size={15}/> Open sovereign evidence</button>
      <Link href={routeFor(selected)}><ArrowRight size={15}/> Open authoritative workspace</Link>
    </div>
  </div>
}

function ChangeRunway({ items, selected, onSelect }: { items: FabricItem[]; selected: FabricItem | null; onSelect: (item: FabricItem) => void }) {
  const pending = items.filter((item)=>['attention','critical','staged','syncing'].includes(item.severity)).slice(0,8)
  return <section className={styles.changeRunway}>
    <div className={styles.runwayTitle}><Workflow size={17}/><div><span>Changeset · impact · approval · release</span><strong>{pending.length} controlled movement(s)</strong></div></div>
    <div className={styles.runwayTrack}>{pending.map((item,index)=><button key={`${item.title}-${index}`} type="button" className={`${styles.runwayItem} ${selected===item?styles.runwaySelected:''}`} onClick={()=>onSelect(item)}><span>{item.severity}</span><strong>{item.title}</strong><small>{index%4===0?'Dependency analysis':index%4===1?'Approval required':index%4===2?'Scheduled execution':'Verification pending'}</small></button>)}{!pending.length?<div className={styles.runwayClear}><CheckCircle2 size={16}/> No controlled changes waiting in the loaded snapshot.</div>:null}</div>
  </section>
}

function StateMetric({ label, value, detail, danger = false }: { label: string; value: string; detail: string; danger?: boolean }) {
  return <div className={danger ? styles.stateMetricDanger : styles.stateMetric}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
}

function SectionHeading({ icon, eyebrow, title, detail }: { icon: ReactNode; eyebrow: string; title: string; detail: string }) {
  return <div className={styles.sectionHeading}><div className={styles.sectionIcon}>{icon}</div><div><span>{eyebrow}</span><strong>{title}</strong><small>{detail}</small></div></div>
}

function OperationalEmpty() {
  return <div className={styles.operationalEmpty}><CircleOff size={22}/><strong>No object in current lens</strong><p>Change the ledger lens or create the required product object in Product Studio.</p><Link href="/angelcare-360-operator/tenants-product?view=modules"><Plus size={14}/> Open Product Studio</Link></div>
}
