'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Activity,
  AlertTriangle,
  BadgeDollarSign,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  CloudCog,
  Code2,
  Cpu,
  DatabaseZap,
  Gauge,
  GitBranch,
  Layers3,
  PackageCheck,
  Plus,
  Send,
  RefreshCcw,
  ScanSearch,
  Settings2,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  Wrench,
  XCircle,
} from 'lucide-react'
import type {
  PackageVersionRecord,
  ProductAddonRecord,
  ProductDependencyRecord,
  ProductFeatureRecord,
  ProductKernelItemType,
  ProductKernelSnapshot,
  ProductMeterRecord,
  ProductModuleRecord,
  PriceBookEntryRecord,
  PriceBookRecord,
  ScannerFindingRecord,
} from '@/types/angelcare360/operator/product-kernel'
import SovereignPortal from '../sovereign/SovereignPortal'
import ProductKernelGovernancePortal, { type GovernanceTarget } from './ProductKernelGovernancePortal'
import TenantIdentityAccessCommand from '../tenant-access/TenantIdentityAccessCommand'
import styles from './ProductKernelStudio.module.css'

export type ProductKernelMode = 'catalogue' | 'modules' | 'features' | 'addons' | 'meters' | 'packages' | 'pricing' | 'compatibility' | 'deployments' | 'scanner' | 'versions'
type PortalState =
  | { kind: 'module'; record?: ProductModuleRecord }
  | { kind: 'feature'; record?: ProductFeatureRecord; moduleId?: string }
  | { kind: 'addon'; record?: ProductAddonRecord }
  | { kind: 'meter'; record?: ProductMeterRecord }
  | { kind: 'package'; record?: PackageVersionRecord }
  | { kind: 'package-items'; record: PackageVersionRecord }
  | { kind: 'package-clone'; record: PackageVersionRecord }
  | { kind: 'price-book'; record?: PriceBookRecord }
  | { kind: 'price-entry'; record?: PriceBookEntryRecord; priceBookId?: string }
  | { kind: 'dependency'; record?: ProductDependencyRecord }
  | { kind: 'finding'; record: ScannerFindingRecord }
  | { kind: 'assign-package' }
  | { kind: 'governance'; target: GovernanceTarget }
  | null

type Option = { value: string; label: string }

const MODES: Array<{ id: ProductKernelMode; label: string; icon: typeof Layers3 }> = [
  { id: 'catalogue', label: 'Catalogue vivant', icon: Layers3 },
  { id: 'modules', label: 'Module Factory', icon: Boxes },
  { id: 'features', label: 'Feature Lab', icon: Cpu },
  { id: 'addons', label: 'Add-ons', icon: Plus },
  { id: 'meters', label: 'Capacités & Top-ups', icon: Gauge },
  { id: 'packages', label: 'Package Composer', icon: PackageCheck },
  { id: 'pricing', label: 'Tarification', icon: CircleDollarSign },
  { id: 'compatibility', label: 'Compatibilité', icon: GitBranch },
  { id: 'deployments', label: 'Déploiements tenants', icon: CloudCog },
  { id: 'scanner', label: 'Scanner & Diagnostic', icon: ScanSearch },
  { id: 'versions', label: 'Versions & Publication', icon: Send },
]

const SCENE_TABS: Record<ProductKernelMode, Array<{ id: string; label: string }>> = {
  catalogue: [{ id: 'portfolio', label: 'Portfolio produit' }, { id: 'commercial', label: 'Commercial' }, { id: 'readiness', label: 'Readiness' }, { id: 'risk', label: 'Risques' }, { id: 'lifecycle', label: 'Lifecycle' }],
  modules: [{ id: 'all', label: 'Tous' }, { id: 'draft', label: 'Drafts' }, { id: 'review', label: 'En revue' }, { id: 'published', label: 'Published' }, { id: 'deprecated', label: 'Deprecated' }, { id: 'retired', label: 'Retired' }],
  features: [{ id: 'all', label: 'Toutes' }, { id: 'basic', label: 'Basic' }, { id: 'standard', label: 'Standard' }, { id: 'premium', label: 'Premium' }, { id: 'configuration', label: 'Config requise' }, { id: 'internal', label: 'Interne' }],
  addons: [{ id: 'all', label: 'Tous' }, { id: 'capability', label: 'Capabilities' }, { id: 'capacity', label: 'Capacity' }, { id: 'service', label: 'Services' }, { id: 'support', label: 'Support' }, { id: 'implementation', label: 'Implementation' }],
  meters: [{ id: 'all', label: 'Tous' }, { id: 'capacity', label: 'Capacity' }, { id: 'seat', label: 'Seats' }, { id: 'storage', label: 'Storage' }, { id: 'transaction', label: 'Transactions' }, { id: 'topup', label: 'Top-up enabled' }],
  packages: [{ id: 'all', label: 'Tous' }, { id: 'draft', label: 'Drafts' }, { id: 'review', label: 'Validation' }, { id: 'published', label: 'Published' }, { id: 'migration', label: 'Migration plans' }, { id: 'retired', label: 'Retired' }],
  pricing: [{ id: 'all', label: 'Tous les price books' }, { id: 'draft', label: 'Drafts' }, { id: 'approved', label: 'Approved' }, { id: 'active', label: 'Active' }, { id: 'scheduled', label: 'Scheduled' }, { id: 'expired', label: 'Expired' }],
  compatibility: [{ id: 'topology', label: 'Topologie' }, { id: 'requires', label: 'Requires' }, { id: 'conflicts', label: 'Conflicts' }, { id: 'orphans', label: 'Orphans' }, { id: 'validation', label: 'Validation' }],
  deployments: [{ id: 'fleet', label: 'Fleet' }, { id: 'drift', label: 'Drift' }, { id: 'pending', label: 'Pending compilation' }, { id: 'overrides', label: 'Overrides' }, { id: 'scheduled', label: 'Scheduled changes' }, { id: 'suspended', label: 'Suspended' }],
  scanner: [{ id: 'run', label: 'Run scanner' }, { id: 'open', label: 'Latest findings' }, { id: 'module', label: 'Modules' }, { id: 'feature', label: 'Features' }, { id: 'orphan', label: 'Orphans' }, { id: 'history', label: 'Scan history' }],
  versions: [{ id: 'timeline', label: 'Timeline' }, { id: 'draft', label: 'Drafts' }, { id: 'published', label: 'Published' }, { id: 'deprecated', label: 'Deprecated' }, { id: 'retired', label: 'Retired' }, { id: 'comparison', label: 'Comparaison' }],
}

export default function ProductKernelStudio({ initialSnapshot, initialMode = 'catalogue' }: { initialSnapshot: ProductKernelSnapshot; initialMode?: ProductKernelMode }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [mode, setMode] = useState<ProductKernelMode>(initialMode)
  const [portal, setPortal] = useState<PortalState>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [sceneTab, setSceneTab] = useState(SCENE_TABS[initialMode][0]?.id || 'all')

  useEffect(() => {
    setMode(initialMode)
    setPortal(null)
    setQuery('')
    setSceneTab(SCENE_TABS[initialMode][0]?.id || 'all')
  }, [initialMode])
  const publishedModules = snapshot.modules.filter((item) => item.status === 'published')
  const publishedPackages = snapshot.packageVersions.filter((item) => item.status === 'published')
  const activeSnapshots = snapshot.entitlementSnapshots.filter((item) => item.status === 'active')
  const openFindings = snapshot.scannerFindings.filter((item) => item.status === 'open')
  const moduleOptions = snapshot.modules.map((item) => ({ value: item.id, label: `${item.name} · ${item.module_key}` }))

  const filteredModules = useMemo(() => snapshot.modules.filter((item) => {
    const matchesQuery = `${item.name} ${item.module_key} ${item.description || ''}`.toLowerCase().includes(query.toLowerCase())
    const matchesTab = mode !== 'modules' || sceneTab === 'all' || item.status === sceneTab
    return matchesQuery && matchesTab
  }), [snapshot.modules, query, mode, sceneTab])

  async function refresh(scope = '') {
    const response = await fetch(`/api/angelcare360/operator/product-kernel${scope}`, { cache: 'no-store' })
    const result = await response.json()
    if (!response.ok || !result.ok) throw new Error(result.error || 'Impossible de recharger le Product Kernel.')
    setSnapshot(result.snapshot)
  }

  async function execute(operation: string, payload: Record<string, unknown>, close = true) {
    setBusy(true); setMessage(null)
    try {
      const response = await fetch('/api/angelcare360/operator/product-kernel', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ operation, payload }),
      })
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error(result.error || 'La commande Product Kernel a échoué.')
      await refresh()
      setMessage('Commande exécutée et synchronisée.')
      if (close) setPortal(null)
      return result
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erreur Product Kernel.')
      throw error
    } finally { setBusy(false) }
  }

  async function runScanner() {
    setBusy(true); setMessage('Scanner natif en cours…')
    try {
      const response = await fetch('/api/angelcare360/operator/product-kernel', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ operation: 'scan.run', payload: {} }) })
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error(result.error || 'Le scanner natif a échoué.')
      await refresh()
      setMessage(`${result.summary?.findings || 0} suggestion(s) générée(s) depuis le repository.`)
      setMode('scanner')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Le scanner a échoué.') }
    finally { setBusy(false) }
  }

  return (
    <main className={styles.kernel}>
      <section className={styles.commandHeader}>
        <div>
          <span>AngelCare 360 · Product, Monetization & Tenant Entitlement Kernel</span>
          <h1>Engineering Studio</h1>
          <p>Transformer les capacités réelles du Customer Command Center en modules, fonctionnalités, add-ons, capacités, packages versionnés et entitlements tenant synchronisés.</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" onClick={runScanner} disabled={busy}><BrainCircuit size={18} /> Scanner le produit natif</button>
          <button type="button" data-primary onClick={() => setPortal({ kind: 'package' })}><Sparkles size={18} /> Composer un package</button>
        </div>
      </section>

      {message ? <div className={styles.message} data-error={/échoué|erreur|impossible/i.test(message)}>{message}</div> : null}

      <section className={styles.integrityRibbon}>
        <Signal label="Modules catalogués" value={String(snapshot.modules.length)} detail={`${publishedModules.length} publiés`} tone="product" />
        <Signal label="Fonctionnalités" value={String(snapshot.features.length)} detail="Contrôlées par module" tone="product" />
        <Signal label="Add-ons" value={String(snapshot.addons.length)} detail="Monétisables séparément" tone="commercial" />
        <Signal label="Capacités" value={String(snapshot.meters.length)} detail="Top-ups et limites" tone="capacity" />
        <Signal label="Packages publiés" value={String(publishedPackages.length)} detail={`${snapshot.packageVersions.length} versions`} tone="commercial" />
        <Signal label="Tenants compilés" value={String(activeSnapshots.length)} detail="Snapshots actifs" tone="success" />
        <Signal label="Findings scanner" value={String(openFindings.length)} detail={snapshot.scannerRuns[0]?.status || 'Jamais exécuté'} tone={openFindings.length ? 'warning' : 'neutral'} />
        <Signal label="Sources" value={snapshot.sourceState} detail={`${snapshot.sources.filter((item) => item.state === 'complete').length}/${snapshot.sources.length} disponibles`} tone={snapshot.sourceState === 'complete' ? 'success' : 'warning'} />
      </section>



      <div className={styles.workspace}>
        <aside className={styles.contextRail}>
          <div className={styles.searchBox}><ScanSearch size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher module, feature, package…" /></div>
          <div className={styles.contextBlock}>
            <span>Pipeline de vérité</span>
            {['Repository réel', 'Catalogue canonique', 'Package publié', 'Abonnement client', 'Snapshot entitlement', 'Runtime tenant'].map((item, index) => <div key={item}><b>{String(index + 1).padStart(2, '0')}</b><strong>{item}</strong>{index < 5 ? <ChevronRight size={13} /> : <CheckCircle2 size={14} />}</div>)}
          </div>
          <div className={styles.contextBlock}>
            <span>Contrôles critiques</span>
            <p><ShieldCheck size={15} /> Aucun publish sans items et validation.</p>
            <p><DatabaseZap size={15} /> Compilation vers feature flags et usage limits existants.</p>
            <p><Code2 size={15} /> Scanner déterministe; aucun provider IA externe.</p>
          </div>
        </aside>

        <section className={styles.activeScene}>
          <SceneContextBar mode={mode} active={sceneTab} onChange={setSceneTab} snapshot={snapshot} />
          {mode === 'catalogue' ? <CatalogueScene snapshot={snapshot} modules={filteredModules} onModule={(record) => setPortal({ kind: 'governance', target: { target: 'entity', entityKind: 'module', record } })} onFeature={(record) => setPortal({ kind: 'governance', target: { target: 'entity', entityKind: 'feature', record } })} /> : null}
          {mode === 'modules' ? <ModuleFactoryScene snapshot={snapshot} modules={filteredModules} onCreate={() => setPortal({ kind: 'module' })} onOpen={(record) => setPortal({ kind: 'governance', target: { target: 'entity', entityKind: 'module', record } })} /> : null}
          {mode === 'features' ? <FeatureLabScene snapshot={snapshot} filter={sceneTab} onCreate={() => setPortal({ kind: 'feature' })} onOpen={(record) => setPortal({ kind: 'governance', target: { target: 'entity', entityKind: 'feature', record } })} /> : null}
          {mode === 'addons' ? <AddonScene snapshot={snapshot} filter={sceneTab} onCreate={() => setPortal({ kind: 'addon' })} onOpen={(record) => setPortal({ kind: 'governance', target: { target: 'entity', entityKind: 'addon', record } })} /> : null}
          {mode === 'meters' ? <MeterScene snapshot={snapshot} filter={sceneTab} onCreate={() => setPortal({ kind: 'meter' })} onOpen={(record) => setPortal({ kind: 'governance', target: { target: 'entity', entityKind: 'meter', record } })} /> : null}
          {mode === 'packages' ? <PackageScene snapshot={snapshot} filter={sceneTab} onCreate={() => setPortal({ kind: 'package' })} onOpen={(record) => setPortal({ kind: 'governance', target: { target: 'package', record } })} onItems={(record) => setPortal({ kind: 'package-items', record })} onPublish={(record) => execute('package-version.publish', { id: record.id })} onRetire={(record) => execute('package-version.status', { id: record.id, status: 'retired' })} /> : null}
          {mode === 'pricing' ? <PricingScene snapshot={snapshot} filter={sceneTab} onBook={(record) => setPortal({ kind: 'governance', target: { target: 'price-book', record } })} onCreateBook={() => setPortal({ kind: 'price-book' })} onEntry={(record, priceBookId) => setPortal({ kind: 'price-entry', record, priceBookId })} /> : null}
          {mode === 'compatibility' ? <CompatibilityScene snapshot={snapshot} filter={sceneTab} onCreate={() => setPortal({ kind: 'dependency' })} onOpen={(record) => setPortal({ kind: 'dependency', record })} onDelete={(record) => execute('dependency.delete', { id: record.id })} /> : null}
          {mode === 'deployments' ? <DeploymentScene snapshot={snapshot} filter={sceneTab} onAssign={() => setPortal({ kind: 'assign-package' })} onCompile={(row) => execute('entitlements.compile', { clientId: row.client_id, tenantId: row.tenant_id, subscriptionId: row.id, packageVersionId: row.package_version_id })} onBulkCompile={(subscriptionIds) => execute('entitlements.bulk-compile', { subscriptionIds })} /> : null}
          {mode === 'scanner' ? <ScannerScene snapshot={snapshot} filter={sceneTab} busy={busy} onScan={runScanner} onFinding={(record) => setPortal({ kind: 'finding', record })} /> : null}
          {mode === 'versions' ? <VersionScene snapshot={snapshot} filter={sceneTab} onOpen={(record) => setPortal({ kind: 'governance', target: { target: 'package', record } })} /> : null}
        </section>

        <aside className={styles.intelligenceRail}>
          <h2>Product Intelligence</h2>
          <Intelligence title="Readiness commerciale" value={`${publishedModules.length}/${snapshot.modules.length || 0}`} detail="Modules publiés sur le catalogue." tone={publishedModules.length === snapshot.modules.length && snapshot.modules.length ? 'success' : 'warning'} />
          <Intelligence title="Synchronisation runtime" value={`${activeSnapshots.length}`} detail="Tenants avec snapshot entitlement actif." tone={activeSnapshots.length ? 'success' : 'neutral'} />
          <Intelligence title="Drift à traiter" value={String(snapshot.scannerFindings.filter((item) => item.finding_type === 'drift' && item.status === 'open').length)} detail="Écarts package / entitlement / runtime." tone="warning" />
          <Intelligence title="Packages sans contenu" value={String(snapshot.packageVersions.filter((version) => !snapshot.packageItems.some((item) => item.package_version_id === version.id)).length)} detail="Impossible à publier avant composition." tone="critical" />
          <div className={styles.nextAction}>
            <span>Prochaine action recommandée</span>
            <strong>{openFindings.length ? 'Qualifier les findings du scanner et adopter les modules prêts.' : snapshot.packageVersions.length ? 'Compiler les entitlements des tenants actifs.' : 'Créer le premier package versionné.'}</strong>
          </div>
        </aside>
      </div>

      <ProductActionDock mode={mode} busy={busy} onCreate={() => {
        if (mode === 'modules') setPortal({ kind: 'module' })
        else if (mode === 'features') setPortal({ kind: 'feature' })
        else if (mode === 'addons') setPortal({ kind: 'addon' })
        else if (mode === 'meters') setPortal({ kind: 'meter' })
        else if (mode === 'packages') setPortal({ kind: 'package' })
        else if (mode === 'pricing') setPortal({ kind: 'price-book' })
        else if (mode === 'compatibility') setPortal({ kind: 'dependency' })
        else if (mode === 'deployments') setPortal({ kind: 'assign-package' })
        else if (mode === 'scanner') runScanner()
        else setPortal({ kind: 'package' })
      }} onScan={runScanner} onAssign={() => setPortal({ kind: 'assign-package' })} />

      <ProductKernelPortal
        portal={portal}
        snapshot={snapshot}
        moduleOptions={moduleOptions}
        busy={busy}
        onClose={() => setPortal(null)}
        onExecute={execute}
        onNavigate={setPortal}
      />
    </main>
  )
}

function SceneContextBar({ mode, active, onChange, snapshot }: { mode: ProductKernelMode; active: string; onChange: (value: string) => void; snapshot: ProductKernelSnapshot }) {
  const count = (id: string) => {
    if (mode === 'modules') return id === 'all' ? snapshot.modules.length : snapshot.modules.filter((item) => item.status === id).length
    if (mode === 'packages') return id === 'all' ? snapshot.packageVersions.length : id === 'review' ? snapshot.packageVersions.filter((item) => ['scanned','commercial_review','operational_review','approved'].includes(item.status)).length : snapshot.packageVersions.filter((item) => item.status === id).length
    if (mode === 'pricing') return id === 'all' ? snapshot.priceBooks.length : snapshot.priceBooks.filter((item) => item.status === id).length
    if (mode === 'deployments') {
      if (id === 'pending') return snapshot.legacy.subscriptions.filter((item) => !snapshot.entitlementSnapshots.some((row) => row.subscription_id === item.id && row.status === 'active')).length
      if (id === 'drift') return snapshot.scannerFindings.filter((item) => item.finding_type === 'drift' && item.status === 'open').length
      if (id === 'overrides') return snapshot.overrides.filter((item) => item.status === 'active').length
      if (id === 'scheduled') return 0
      return snapshot.legacy.subscriptions.length
    }
    if (mode === 'scanner') return id === 'history' ? snapshot.scannerRuns.length : id === 'open' ? snapshot.scannerFindings.filter((item) => item.status === 'open').length : snapshot.scannerFindings.filter((item) => item.finding_type === id || item.classification === id).length
    return 0
  }
  return <nav className={styles.sceneContextBar} aria-label={`Navigation secondaire ${mode}`}>{SCENE_TABS[mode].map((tab) => <button type="button" key={tab.id} data-active={active === tab.id} onClick={() => onChange(tab.id)}><span>{tab.label}</span>{count(tab.id) ? <b>{count(tab.id)}</b> : null}</button>)}</nav>
}

function ProductActionDock({ mode, busy, onCreate, onScan, onAssign }: { mode: ProductKernelMode; busy: boolean; onCreate: () => void; onScan: () => void; onAssign: () => void }) {
  const label: Record<ProductKernelMode, string> = {
    catalogue: 'Composer un package', modules: 'Créer un module', features: 'Créer une fonctionnalité', addons: 'Créer un add-on', meters: 'Créer une capacité', packages: 'Composer un package', pricing: 'Créer un price book', compatibility: 'Créer une règle', deployments: 'Affecter un package', scanner: 'Relancer le scanner', versions: 'Créer une nouvelle version',
  }
  return <div className={styles.actionDock}><div><span>Action contextuelle</span><strong>{label[mode]}</strong></div><div><button type="button" onClick={onScan} disabled={busy}><ScanSearch size={15} /> Scanner</button>{mode === 'deployments' ? <button type="button" onClick={onAssign}><PackageCheck size={15} /> Affecter</button> : null}<button type="button" data-primary onClick={onCreate} disabled={busy}><Plus size={15} /> {label[mode]}</button></div></div>
}

function Signal({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  return <div className={styles.signal} data-tone={tone}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
}
function Intelligence({ title, value, detail, tone }: { title: string; value: string; detail: string; tone: string }) {
  return <div className={styles.intelligence} data-tone={tone}><span>{title}</span><strong>{value}</strong><p>{detail}</p></div>
}

function SceneHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <header className={styles.sceneHeader}><div><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>{action}</header>
}

function CatalogueScene({ snapshot, modules, onModule, onFeature }: { snapshot: ProductKernelSnapshot; modules: ProductModuleRecord[]; onModule: (record: ProductModuleRecord) => void; onFeature: (record: ProductFeatureRecord) => void }) {
  return <div className={styles.sceneStack}>
    <SceneHeader eyebrow="Canonical Product Graph" title="Catalogue des capacités sellables" description="Chaque module relie routes customer, APIs, permissions, fonctionnalités, capacités, packages et déploiements réels." />
    <div className={styles.catalogueGrid}>{modules.map((module) => {
      const features = snapshot.features.filter((item) => item.module_id === module.id)
      const packageCount = new Set(snapshot.packageItems.filter((item) => item.item_type === 'module' && item.item_id === module.id).map((item) => item.package_version_id)).size
      return <article key={module.id} className={styles.moduleCard} data-status={module.status}>
        <button type="button" className={styles.cardOpen} onClick={() => onModule(module)} aria-label={`Configurer ${module.name}`} />
        <div className={styles.cardTop}><span>{module.category}</span><Status value={module.status} /></div>
        <h3>{module.name}</h3><p>{module.commercial_summary || module.description || 'Description commerciale à qualifier.'}</p>
        <div className={styles.cardMetrics}><div><strong>{features.length}</strong><span>features</span></div><div><strong>{packageCount}</strong><span>packages</span></div><div><strong>{module.version}</strong><span>version</span></div></div>
        <div className={styles.featureChips}>{features.slice(0, 5).map((feature) => <button key={feature.id} type="button" onClick={(event) => { event.stopPropagation(); onFeature(feature) }}>{feature.name}</button>)}{features.length > 5 ? <span>+{features.length - 5}</span> : null}</div>
        <footer><span>{module.runtime_maturity}</span><span>{module.sellability}</span></footer>
      </article>
    })}</div>
    {!modules.length ? <Empty title="Catalogue vide" detail="Lancez le scanner natif pour découvrir les capacités déjà présentes dans le repository." /> : null}
  </div>
}

function ModuleFactoryScene({ snapshot, modules, onCreate, onOpen }: { snapshot: ProductKernelSnapshot; modules: ProductModuleRecord[]; onCreate: () => void; onOpen: (record: ProductModuleRecord) => void }) {
  return <div className={styles.sceneStack}><SceneHeader eyebrow="Module Factory" title="Ingénierie des modules monétisables" description="Définir identité commerciale, maturité runtime, routes, support, configuration, régions et publication." action={<button data-primary type="button" onClick={onCreate}><Plus size={16} /> Nouveau module</button>} />
    <div className={styles.matrix}><div className={styles.matrixHead}><span>Module</span><span>Maturité</span><span>Sellabilité</span><span>Features</span><span>Packages</span><span>État</span></div>{modules.map((module) => <button key={module.id} type="button" onClick={() => onOpen(module)}><strong>{module.name}<small>{module.module_key}</small></strong><span>{module.runtime_maturity}</span><span>{module.sellability}</span><span>{snapshot.features.filter((item) => item.module_id === module.id).length}</span><span>{snapshot.packageItems.filter((item) => item.item_type === 'module' && item.item_id === module.id).length}</span><Status value={module.status} /></button>)}</div>
  </div>
}

function FeatureLabScene({ snapshot, filter, onCreate, onOpen }: { snapshot: ProductKernelSnapshot; filter: string; onCreate: () => void; onOpen: (record: ProductFeatureRecord) => void }) {
  return <div className={styles.sceneStack}><SceneHeader eyebrow="Feature Lab" title="Fonctionnalités, profondeur et configuration" description="Qualifier chaque capacité par niveau, dépendance, permission, route, configuration et modèle commercial." action={<button data-primary type="button" onClick={onCreate}><Plus size={16} /> Nouvelle feature</button>} />
    <div className={styles.featureBoard}>{snapshot.modules.map((module) => <section key={module.id}><header><strong>{module.name}</strong><span>{snapshot.features.filter((item) => item.module_id === module.id).length} features</span></header>{snapshot.features.filter((item) => item.module_id === module.id && (filter === 'all' || (filter === 'configuration' ? item.configuration_required : filter === 'internal' ? item.sellability === 'internal_only' : item.feature_tier === filter))).map((feature) => <button key={feature.id} type="button" onClick={() => onOpen(feature)}><div><strong>{feature.name}</strong><small>{feature.feature_key}</small></div><span>{feature.feature_tier}</span><span>{feature.sellability}</span><Status value={feature.status} /></button>)}</section>)}</div>
  </div>
}

function AddonScene({ snapshot, filter, onCreate, onOpen }: { snapshot: ProductKernelSnapshot; filter: string; onCreate: () => void; onOpen: (record: ProductAddonRecord) => void }) {
  return <div className={styles.sceneStack}><SceneHeader eyebrow="Add-on Market" title="Extensions, services et options monétisables" description="Capacités, support, implémentation, intégrations et extensions vendues séparément." action={<button data-primary type="button" onClick={onCreate}><Plus size={16} /> Créer un add-on</button>} />
    <div className={styles.addonGrid}>{snapshot.addons.filter((addon) => filter === 'all' || addon.addon_type === filter).map((addon) => <button type="button" key={addon.id} onClick={() => onOpen(addon)}><div><span>{addon.addon_type}</span><Status value={addon.status} /></div><h3>{addon.name}</h3><p>{addon.description || 'Description à compléter.'}</p><strong>{Number(addon.list_price || 0).toLocaleString('fr-FR')} {addon.currency}</strong><small>{addon.billing_model} · {addon.unit || 'capacité'}</small></button>)}</div>
    {!snapshot.addons.length ? <Empty title="Aucun add-on" detail="Créez les options de capacité, service, support, implémentation ou intégration vendues hors package." /> : null}
  </div>
}

function MeterScene({ snapshot, filter, onCreate, onOpen }: { snapshot: ProductKernelSnapshot; filter: string; onCreate: () => void; onOpen: (record: ProductMeterRecord) => void }) {
  return <div className={styles.sceneStack}><SceneHeader eyebrow="Capacity Engineering" title="Capacités, compteurs et top-ups" description="Définir l’unité, la source, le seuil, la dureté de limite, le cycle et l’incrément de top-up." action={<button data-primary type="button" onClick={onCreate}><Plus size={16} /> Nouvelle capacité</button>} />
    <div className={styles.meterGrid}>{snapshot.meters.filter((meter) => filter === 'all' || (filter === 'topup' ? meter.topup_enabled : meter.meter_type === filter)).map((meter) => <button type="button" key={meter.id} onClick={() => onOpen(meter)}><Gauge size={22} /><div><span>{meter.meter_type}</span><h3>{meter.name}</h3><p>{meter.description || 'Capacité contrôlée.'}</p></div><div><strong>{meter.topup_increment || '—'} {meter.unit}</strong><small>Seuil {meter.warning_threshold_pct}% · {meter.hard_limit ? 'hard limit' : 'soft limit'}</small></div><Status value={meter.status} /></button>)}</div>
  </div>
}

function PackageScene({ snapshot, filter, onCreate, onOpen, onItems, onPublish, onRetire }: { snapshot: ProductKernelSnapshot; filter: string; onCreate: () => void; onOpen: (record: PackageVersionRecord) => void; onItems: (record: PackageVersionRecord) => void; onPublish: (record: PackageVersionRecord) => void; onRetire: (record: PackageVersionRecord) => void }) {
  return <div className={styles.sceneStack}><SceneHeader eyebrow="Package Composer" title="Packages versionnés et publiables" description="Composer modules, features, add-ons, capacités, support, implémentation, prix et chemins de migration." action={<button data-primary type="button" onClick={onCreate}><Sparkles size={16} /> Composer</button>} />
    <div className={styles.packageGrid}>{snapshot.packageVersions.filter((version) => filter === 'all' || (filter === 'review' ? ['scanned','commercial_review','operational_review','approved'].includes(version.status) : version.status === filter)).map((version) => {
      const items = snapshot.packageItems.filter((item) => item.package_version_id === version.id)
      const published = version.status === 'published'
      return <article key={version.id} data-status={version.status}><div className={styles.packageCrown}><span>{version.version_code}</span><Status value={version.status} /></div><h3>{version.name}</h3><p>{version.description || 'Package à qualifier.'}</p><div className={styles.priceBand}><strong>{Number(version.monthly_price || 0).toLocaleString('fr-FR')} {version.currency}<small>/mois</small></strong><span>{Number(version.annual_price || 0).toLocaleString('fr-FR')} /an</span></div><div className={styles.packageStats}><span>{items.filter((item) => item.item_type === 'module').length} modules</span><span>{items.filter((item) => item.item_type === 'feature').length} features</span><span>{items.filter((item) => item.item_type === 'addon').length} add-ons</span><span>{items.filter((item) => item.item_type === 'meter').length} capacités</span></div><footer><button type="button" onClick={() => onOpen(version)}>Modifier</button><button type="button" onClick={() => onItems(version)}>Composer</button>{!published ? <button type="button" data-primary onClick={() => onPublish(version)} disabled={!items.length}>Publier</button> : <button type="button" onClick={() => onOpen(version)}>Gouverner</button>}</footer></article>
    })}</div>
    {!snapshot.packageVersions.length ? <Empty title="Aucune version package" detail="Créez un package, composez-le avec le catalogue canonique, validez puis publiez." /> : null}
  </div>
}

function PricingScene({ snapshot, filter, onBook, onCreateBook, onEntry }: { snapshot: ProductKernelSnapshot; filter: string; onBook: (record: PriceBookRecord) => void; onCreateBook: () => void; onEntry: (record: PriceBookEntryRecord | undefined, priceBookId?: string) => void }) {
  const itemLabel = (entry: PriceBookEntryRecord) => {
    if (entry.item_type === 'package_version') return snapshot.packageVersions.find((item) => item.id === entry.item_id)?.name || 'Package'
    if (entry.item_type === 'module') return snapshot.modules.find((item) => item.id === entry.item_id)?.name || 'Module'
    if (entry.item_type === 'feature') return snapshot.features.find((item) => item.id === entry.item_id)?.name || 'Feature'
    if (entry.item_type === 'addon') return snapshot.addons.find((item) => item.id === entry.item_id)?.name || 'Add-on'
    return snapshot.meters.find((item) => item.id === entry.item_id)?.name || 'Capacité'
  }
  return <div className={styles.sceneStack}><SceneHeader eyebrow="Price Books" title="Tarification, cycles et règles de volume" description="Séparer la composition produit du tarif, de la région, de la devise et de la période d’effet." action={<button data-primary type="button" onClick={onCreateBook}><Plus size={16} /> Nouveau price book</button>} /><div className={styles.pricingLayout}><section><h3>Catalogues tarifaires</h3>{snapshot.priceBooks.filter((book) => filter === 'all' || book.status === filter).map((book) => <button type="button" key={book.id} onClick={() => onBook(book)}><strong>{book.name}</strong><span>{book.region_code} · {book.currency}</span><Status value={book.status} /></button>)}{!snapshot.priceBooks.length ? <Empty title="Aucun price book" detail="Créez un catalogue régional, puis affectez-y packages, add-ons et top-ups." /> : null}</section><section><h3>Tarifs gouvernés</h3>{snapshot.priceBooks.map((book) => <div key={book.id}><header><strong>{book.name}</strong><button type="button" onClick={() => onEntry(undefined, book.id)}><Plus size={14} /> Ajouter tarif</button></header>{snapshot.priceEntries.filter((entry) => entry.price_book_id === book.id).map((entry) => <button type="button" key={entry.id} onClick={() => onEntry(entry, book.id)}><strong>{itemLabel(entry)}</strong><span>{entry.billing_cycle}</span><span>{Number(entry.unit_price).toLocaleString('fr-FR')} {book.currency}</span></button>)}</div>)}</section></div></div>
}

function CompatibilityScene({ snapshot, filter, onCreate, onOpen, onDelete }: { snapshot: ProductKernelSnapshot; filter: string; onCreate: () => void; onOpen: (record: ProductDependencyRecord) => void; onDelete: (record: ProductDependencyRecord) => void }) {
  const orphanFeatures = snapshot.features.filter((feature) => !snapshot.modules.some((module) => module.id === feature.module_id))
  const unpublishedInPublished = snapshot.packageItems.filter((item) => {
    const version = snapshot.packageVersions.find((row) => row.id === item.package_version_id)
    if (version?.status !== 'published') return false
    const source = item.item_type === 'module' ? snapshot.modules : item.item_type === 'feature' ? snapshot.features : item.item_type === 'addon' ? snapshot.addons : snapshot.meters
    return source.find((row) => row.id === item.item_id)?.status !== 'published'
  })
  const label = (type: string, id: string) => {
    const list = type === 'module' ? snapshot.modules : type === 'feature' ? snapshot.features : type === 'addon' ? snapshot.addons : snapshot.meters
    return list.find((item) => item.id === id)?.name || `${type} inconnu`
  }
  const emptyPackages = snapshot.packageVersions.filter((version) => !snapshot.packageItems.some((item) => item.package_version_id === version.id)).length
  return <div className={styles.sceneStack}><SceneHeader eyebrow="Compatibility Matrix" title="Dépendances, conflits et publication sûre" description="Détecter les orphelins, éléments non publiés, dépendances absentes et packages incohérents." action={<button data-primary type="button" onClick={onCreate}><GitBranch size={16} /> Nouvelle règle</button>} /><div className={styles.compatibilityGrid}><Diagnostic title="Features orphelines" value={orphanFeatures.length} detail="Feature sans module canonique." good={orphanFeatures.length === 0} /><Diagnostic title="Items non publiés" value={unpublishedInPublished.length} detail="Contenu draft dans un package publié." good={unpublishedInPublished.length === 0} /><Diagnostic title="Dépendances déclarées" value={snapshot.dependencies.length} detail="Requires, conflicts, recommends, meters." good={snapshot.dependencies.length > 0} /><Diagnostic title="Packages vides" value={emptyPackages} detail="Version sans composition." good={emptyPackages === 0} /></div><div className={styles.dependencyMap}>{snapshot.dependencies.map((dependency) => <div key={dependency.id}><button type="button" onClick={() => onOpen(dependency)}><GitBranch size={16} /><strong>{label(dependency.source_type, dependency.source_id)}</strong><span>{dependency.relation_type}</span><strong>{label(dependency.target_type, dependency.target_id)}</strong><small>{dependency.reason || 'Règle de compatibilité.'}</small></button><button type="button" aria-label="Supprimer la règle" onClick={() => onDelete(dependency)}>×</button></div>)}</div></div>
}

function DeploymentScene({ snapshot, filter, onAssign, onCompile, onBulkCompile }: { snapshot: ProductKernelSnapshot; filter: string; onAssign: () => void; onCompile: (subscription: Record<string, unknown>) => void; onBulkCompile: (subscriptionIds: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([])
  const rows = snapshot.legacy.subscriptions.filter((subscription) => {
    const active = snapshot.entitlementSnapshots.find((row) => row.subscription_id === subscription.id && row.status === 'active')
    if (filter === 'pending') return !active
    if (filter === 'suspended') return ['suspended','cancelled','expired'].includes(String(subscription.status))
    if (filter === 'drift') return snapshot.scannerFindings.some((finding) => finding.finding_type === 'drift' && finding.status === 'open' && String(finding.suggestion?.subscriptionId || '') === String(subscription.id))
    if (filter === 'overrides') return snapshot.overrides.some((override) => override.status === 'active' && override.tenant_id === subscription.tenant_id)
    return true
  })
  const allSelected = rows.length > 0 && rows.every((row) => selected.includes(String(row.id)))
  return <div className={styles.sceneStack}>
    <SceneHeader eyebrow="Tenant Fleet Operations" title="Contracté, compilé et runtime synchronisé" description="Piloter la flotte, compiler en masse, détecter le drift, gouverner les overrides et restaurer les baselines." action={<div className={styles.inlineActions}><button type="button" onClick={() => setSelected(allSelected ? [] : rows.map((row) => String(row.id)))}>{allSelected ? 'Désélectionner' : 'Sélectionner la vue'}</button><button type="button" disabled={!selected.length} onClick={() => onBulkCompile(selected)}><RefreshCcw size={15} /> Compiler {selected.length || ''}</button><button data-primary type="button" onClick={onAssign}><PackageCheck size={16} /> Affecter un package</button></div>} />
    <div className={styles.fleetSummary}><div><span>Abonnements visibles</span><strong>{rows.length}</strong></div><div><span>Snapshots actifs</span><strong>{snapshot.entitlementSnapshots.filter((item) => item.status === 'active').length}</strong></div><div><span>Overrides actifs</span><strong>{snapshot.overrides.filter((item) => item.status === 'active').length}</strong></div><div><span>Compilation en attente</span><strong>{snapshot.legacy.subscriptions.filter((item) => !snapshot.entitlementSnapshots.some((row) => row.subscription_id === item.id && row.status === 'active')).length}</strong></div></div>
    <div className={styles.deploymentTable}><div className={styles.deploymentHead}><span>Sélection</span><span>Client / Tenant</span><span>Abonnement</span><span>Package</span><span>Entitlement</span><span>Runtime</span><span>Commande</span></div>{rows.map((subscription) => {
      const tenant = snapshot.legacy.tenants.find((row) => row.id === subscription.tenant_id)
      const client = snapshot.legacy.clients.find((row) => row.id === subscription.client_id)
      const packageVersion = snapshot.packageVersions.find((row) => row.id === subscription.package_version_id)
      const active = snapshot.entitlementSnapshots.find((row) => row.subscription_id === subscription.id && row.status === 'active')
      const runtimeFlags = snapshot.legacy.featureFlags.filter((row) => row.tenant_id === subscription.tenant_id)
      const entitlementCount = active ? snapshot.entitlementItems.filter((item) => item.snapshot_id === active.id).length : 0
      const drift = active ? Math.abs(entitlementCount - runtimeFlags.length) : 0
      return <div key={String(subscription.id)} data-drift={drift > 0}><label className={styles.rowSelect}><input type="checkbox" checked={selected.includes(String(subscription.id))} onChange={(event) => setSelected((current) => event.target.checked ? [...new Set([...current, String(subscription.id)])] : current.filter((id) => id !== String(subscription.id)))} /><span /></label><strong>{String(client?.display_name || 'Client')}<small>{String(tenant?.tenant_slug || 'Tenant non lié')}</small></strong><span>{String(subscription.subscription_code || '—')}<small>{String(subscription.status || '')}</small></span><span>{packageVersion?.name || 'Non affecté'}<small>{packageVersion?.version_code || ''}</small></span><span>{active ? `${entitlementCount} items` : 'Non compilé'}<small>{active?.compiled_at ? new Date(active.compiled_at).toLocaleDateString('fr-FR') : ''}</small></span><span data-warning={drift > 0}>{runtimeFlags.length} flags<small>{drift ? `${drift} écart(s)` : 'synchronisé'}</small></span><button type="button" disabled={!packageVersion || !tenant} onClick={() => onCompile(subscription)}><RefreshCcw size={14} /> Compiler</button></div>
    })}</div>
    {!rows.length ? <Empty title="Aucun déploiement dans cette vue" detail="Changez le filtre ou affectez un package publié à un abonnement actif." /> : null}
    <TenantIdentityAccessCommand compact title="Administrateurs, rôles & sécurité tenant" />
  </div>
}

function ScannerScene({ snapshot, filter, busy, onScan, onFinding }: { snapshot: ProductKernelSnapshot; filter: string; busy: boolean; onScan: () => void; onFinding: (record: ScannerFindingRecord) => void }) {
  const run = snapshot.scannerRuns[0]
  return <div className={styles.sceneStack}><SceneHeader eyebrow="Native Product Intelligence Scanner" title="Le repository devient un catalogue explicable" description="Scan déterministe des routes customer, APIs, permissions et migrations. Aucun provider IA externe; chaque suggestion conserve ses preuves." action={<button data-primary type="button" disabled={busy} onClick={onScan}><ScanSearch size={16} /> {busy ? 'Analyse…' : 'Relancer le scan'}</button>} />
    {run ? <div className={styles.scanSummary}><div><BrainCircuit size={24} /><span>Dernier run</span><strong>{run.status}</strong></div><div><span>Signature</span><strong>{run.repository_signature?.slice(0, 16) || '—'}</strong></div><div><span>Modules</span><strong>{String(run.summary?.modules || 0)}</strong></div><div><span>Features</span><strong>{String(run.summary?.features || 0)}</strong></div><div><span>Findings</span><strong>{String(run.summary?.findings || 0)}</strong></div></div> : <Empty title="Scanner jamais exécuté" detail="Lancez le scanner pour transformer le repository réel en suggestions cataloguables." />}
    <div className={styles.findingBoard}>{snapshot.scannerFindings.filter((item) => filter === 'run' || filter === 'history' ? false : filter === 'open' ? item.status === 'open' : item.finding_type === filter || item.classification === filter).map((finding) => <button key={finding.id} type="button" onClick={() => onFinding(finding)} data-classification={finding.classification}><div><span>{finding.finding_type}</span><strong>{finding.title}</strong><p>{finding.description || 'Suggestion native.'}</p></div><div><strong>{finding.confidence}%</strong><small>{finding.classification}</small><ChevronRight size={16} /></div></button>)}</div>
  </div>
}

function VersionScene({ snapshot, filter, onOpen }: { snapshot: ProductKernelSnapshot; filter: string; onOpen: (record: PackageVersionRecord) => void }) {
  return <div className={styles.sceneStack}><SceneHeader eyebrow="Publication Control" title="Versions, impact et gouvernance" description="Les abonnements restent pinés à leur version; toute migration doit être planifiée, simulée et auditée." /><div className={styles.versionTimeline}>{snapshot.packageVersions.filter((version) => ['timeline','comparison'].includes(filter) || version.status === filter).map((version) => <button type="button" key={version.id} onClick={() => onOpen(version)}><span>{version.version_code}</span><div><h3>{version.name}</h3><p>{version.target_segment || 'Segment non défini'} · {version.support_tier} · {version.implementation_tier}</p></div><Status value={version.status} /><strong>{new Date(version.updated_at).toLocaleDateString('fr-FR')}</strong></button>)}</div></div>
}

function Diagnostic({ title, value, detail, good }: { title: string; value: number; detail: string; good: boolean }) { return <div data-good={good}><span>{good ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}{title}</span><strong>{value}</strong><p>{detail}</p></div> }
function Status({ value }: { value: string }) { return <span className={styles.status} data-value={value}>{value.replaceAll('_', ' ')}</span> }
function Empty({ title, detail }: { title: string; detail: string }) { return <div className={styles.empty}><DatabaseZap size={25} /><strong>{title}</strong><p>{detail}</p></div> }

function ProductKernelPortal({ portal, snapshot, moduleOptions, busy, onClose, onExecute, onNavigate }: { portal: PortalState; snapshot: ProductKernelSnapshot; moduleOptions: Option[]; busy: boolean; onClose: () => void; onExecute: (operation: string, payload: Record<string, unknown>, close?: boolean) => Promise<unknown>; onNavigate: (portal: PortalState) => void }) {
  if (!portal) return null
  if (portal.kind === 'governance') return <ProductKernelGovernancePortal target={portal.target} snapshot={snapshot} busy={busy} onClose={onClose} onExecute={onExecute} onEdit={() => {
    if (portal.target.target === 'entity') onNavigate({ kind: portal.target.entityKind, record: portal.target.record as never })
    else if (portal.target.target === 'package') onNavigate({ kind: 'package', record: portal.target.record })
    else onNavigate({ kind: 'price-book', record: portal.target.record })
  }} onCompose={portal.target.target === 'package' ? () => onNavigate({ kind: 'package-items', record: portal.target.record as PackageVersionRecord }) : undefined} />
  if (portal.kind === 'module') return <EntityFormPortal open title={portal.record ? `Configurer ${portal.record.name}` : 'Créer un module sellable'} eyebrow="Module Factory" initial={portal.record ? moduleForm(portal.record) : moduleForm()} fields={moduleFields} busy={busy} onClose={onClose} onSubmit={(values) => onExecute(portal.record ? 'module.update' : 'module.create', portal.record ? { ...values, id: portal.record.id } : values)} sidecar={<ModuleSidecar />} adminControl={Boolean(portal.record)} subscriptions={snapshot.legacy.subscriptions} />
  if (portal.kind === 'feature') return <EntityFormPortal open title={portal.record ? `Configurer ${portal.record.name}` : 'Créer une fonctionnalité'} eyebrow="Feature Lab" initial={portal.record ? featureForm(portal.record) : { moduleId: portal.moduleId || '', featureKey: '', name: '', version: '1.0.0', description: '', featureTier: 'standard', status: 'draft', sellability: 'included', runtimeMaturity: 'unverified', customerRoute: '', apiRoute: '', permissionKeys: '', configurationRequired: 'false' }} fields={featureFields(moduleOptions)} busy={busy} onClose={onClose} onSubmit={(values) => onExecute(portal.record ? 'feature.update' : 'feature.create', portal.record ? { ...values, id: portal.record.id } : values)} sidecar={<FeatureSidecar />} adminControl={Boolean(portal.record)} subscriptions={snapshot.legacy.subscriptions} />
  if (portal.kind === 'addon') return <EntityFormPortal open title={portal.record ? `Configurer ${portal.record.name}` : 'Créer un add-on'} eyebrow="Add-on Market" initial={portal.record ? addonForm(portal.record) : addonForm()} fields={addonFields(moduleOptions)} busy={busy} onClose={onClose} onSubmit={(values) => onExecute(portal.record ? 'addon.update' : 'addon.create', portal.record ? { ...values, id: portal.record.id } : values)} sidecar={<AddonSidecar />} adminControl={Boolean(portal.record)} subscriptions={snapshot.legacy.subscriptions} />
  if (portal.kind === 'meter') return <EntityFormPortal open title={portal.record ? `Configurer ${portal.record.name}` : 'Créer une capacité'} eyebrow="Capacity Engineering" initial={portal.record ? meterForm(portal.record) : meterForm()} fields={meterFields} busy={busy} onClose={onClose} onSubmit={(values) => onExecute(portal.record ? 'meter.update' : 'meter.create', portal.record ? { ...values, id: portal.record.id } : values)} sidecar={<MeterSidecar />} adminControl={Boolean(portal.record)} subscriptions={snapshot.legacy.subscriptions} />
  if (portal.kind === 'package') return <EntityFormPortal open size="mission" title={portal.record ? `Configurer ${portal.record.name}` : 'Composer une version package'} eyebrow="Package Composer" initial={portal.record ? packageForm(portal.record) : packageForm()} fields={packageFields(snapshot.legacy.packages.map((item) => ({ value: String(item.id), label: String(item.name || item.package_code) })))} busy={busy} onClose={onClose} onSubmit={(values) => onExecute(portal.record ? 'package-version.update' : 'package-version.create', portal.record ? { ...values, id: portal.record.id } : values)} sidecar={<PackageSidecar />} adminControl={Boolean(portal.record)} subscriptions={snapshot.legacy.subscriptions.filter((item) => !portal.record || item.package_version_id === portal.record.id)} />
  if (portal.kind === 'package-items') return <PackageItemsPortal record={portal.record} snapshot={snapshot} busy={busy} readOnly={false} onClose={onClose} onExecute={onExecute} />
  if (portal.kind === 'package-clone') return <PackageClonePortal record={portal.record} busy={busy} onClose={onClose} onExecute={onExecute} />
  if (portal.kind === 'price-book') return <EntityFormPortal open title={portal.record ? `Configurer ${portal.record.name}` : 'Créer un catalogue tarifaire'} eyebrow="Price Book Control" initial={portal.record ? priceBookForm(portal.record) : priceBookForm()} fields={priceBookFields} busy={busy} onClose={onClose} onSubmit={(values) => onExecute(portal.record ? 'price-book.update' : 'price-book.create', portal.record ? { ...values, id: portal.record.id } : values)} sidecar={<PriceBookSidecar />} adminControl={Boolean(portal.record)} subscriptions={snapshot.legacy.subscriptions} />
  if (portal.kind === 'price-entry') return <PriceEntryPortal record={portal.record} priceBookId={portal.priceBookId} snapshot={snapshot} busy={busy} onClose={onClose} onExecute={onExecute} />
  if (portal.kind === 'dependency') return <DependencyPortal record={portal.record} snapshot={snapshot} busy={busy} onClose={onClose} onExecute={onExecute} />
  if (portal.kind === 'finding') return <FindingPortal record={portal.record} modules={snapshot.modules} busy={busy} onClose={onClose} onExecute={onExecute} />
  if (portal.kind === 'assign-package') return <AssignPackagePortal snapshot={snapshot} busy={busy} onClose={onClose} onExecute={onExecute} />
  return null
}

type Field = { name: string; label: string; kind?: 'text' | 'textarea' | 'select' | 'number' | 'date'; options?: Option[]; required?: boolean; help?: string; readOnly?: boolean; advanced?: boolean }
function EntityFormPortal({ open, title, eyebrow, initial, fields, busy, onClose, onSubmit, sidecar, size = 'operational', adminControl = false, subscriptions = [] }: { open: boolean; title: string; eyebrow: string; initial: Record<string, string>; fields: Field[]; busy: boolean; onClose: () => void; onSubmit: (values: Record<string, unknown>) => Promise<unknown>; sidecar: ReactNode; size?: 'operational' | 'mission'; adminControl?: boolean; subscriptions?: Array<Record<string, unknown>> }) {
  const [values, setValues] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [changeScope, setChangeScope] = useState('catalogue_only')
  const [effectiveAt, setEffectiveAt] = useState('')
  const [reason, setReason] = useState('')
  const [selectedSubscriptionIds, setSelectedSubscriptionIds] = useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const dirty = JSON.stringify(values) !== JSON.stringify(initial) || Boolean(reason || effectiveAt || selectedSubscriptionIds.length)
  const toggleSubscription = (id: string) => setSelectedSubscriptionIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  return <SovereignPortal open={open} title={title} eyebrow={eyebrow} subtitle={adminControl ? 'Contrôle administrateur direct: les valeurs existantes sont préchargées, l’historique est capturé automatiquement et la portée de synchronisation reste sous votre autorité.' : 'Configuration contrôlée: privilégiez les sélections et presets; le texte libre reste limité à la justification commerciale ou opérationnelle.'} size={size} tone="tenant" breadcrumbs={['Tenants & Produit', eyebrow]} dirty={dirty} onClose={onClose} sidecar={sidecar} footer={<div className={styles.portalFooterActions}><button type="button" onClick={onClose}>Annuler</button><button type="button" data-primary disabled={busy || (adminControl && !reason)} onClick={async () => { setError(null); try { await onSubmit({ ...values, changeScope, effectiveAt: effectiveAt || undefined, reason, selectedSubscriptionIds }) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Erreur') } }}>{busy ? 'Synchronisation…' : adminControl ? 'Enregistrer, auditer et synchroniser' : 'Enregistrer'}</button></div>}>
    {error ? <div className={styles.formError}><XCircle size={17} />{error}</div> : null}
    {adminControl ? <section className={styles.adminEditControl}><header><ShieldCheck size={20}/><div><span>Portée du changement</span><h3>Vous gardez le contrôle</h3></div></header><div className={styles.adminControlGrid}><label><span>Application</span><select value={changeScope} onChange={(event) => setChangeScope(event.target.value)}><option value="catalogue_only">Catalogue uniquement</option><option value="new_sales_only">Nouvelles ventes uniquement</option><option value="selected_subscriptions">Abonnements sélectionnés</option><option value="existing_at_renewal">Clients existants au renouvellement</option><option value="all_active_subscriptions">Tous les abonnements actifs</option><option value="scheduled">Planifier à une date</option><option value="immediate_authorized">Application immédiate autorisée</option></select></label>{changeScope === 'scheduled' ? <label><span>Date d’effet</span><input type="datetime-local" value={effectiveAt} onChange={(event) => setEffectiveAt(event.target.value)} /></label> : null}<label data-wide><span>Justification obligatoire</span><textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Pourquoi ce changement est-il nécessaire ?" /></label></div>{changeScope === 'selected_subscriptions' ? <div className={styles.subscriptionScopeList}>{subscriptions.length ? subscriptions.map((subscription) => { const id = String(subscription.id || ''); return <label key={id}><input type="checkbox" checked={selectedSubscriptionIds.includes(id)} onChange={() => toggleSubscription(id)} /><span>{String(subscription.subscription_code || subscription.id)} · {String(subscription.status || '—')}</span></label> }) : <p>Aucun abonnement associé.</p>}</div> : null}</section> : null}
    <div className={styles.formGrid}>{fields.filter((field) => !field.advanced).map((field) => <label key={field.name} data-wide={field.kind === 'textarea'}><span>{field.label}{field.required ? ' *' : ''}</span>{field.kind === 'textarea' ? <textarea rows={5} readOnly={field.readOnly} value={values[field.name] || ''} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} /> : field.kind === 'select' ? <select disabled={field.readOnly} value={values[field.name] || ''} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}><option value="">Sélectionner…</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input readOnly={field.readOnly} type={field.kind === 'number' ? 'number' : field.kind === 'date' ? 'date' : 'text'} value={values[field.name] || ''} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} />}{field.help ? <small>{field.help}</small> : null}</label>)}</div>
    {fields.some((field) => field.advanced) ? <section className={styles.advancedConfiguration}><button type="button" onClick={() => setShowAdvanced((value) => !value)}>{showAdvanced ? 'Masquer la configuration technique' : 'Afficher la configuration technique avancée'}</button>{showAdvanced ? <div className={styles.formGrid}>{fields.filter((field) => field.advanced).map((field) => <label key={field.name} data-wide={field.kind === 'textarea'}><span>{field.label}</span>{field.kind === 'textarea' ? <textarea rows={4} readOnly={field.readOnly} value={values[field.name] || ''} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} /> : field.kind === 'select' ? <select disabled={field.readOnly} value={values[field.name] || ''} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}><option value="">Sélectionner…</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input readOnly={field.readOnly} type={field.kind === 'number' ? 'number' : field.kind === 'date' ? 'date' : 'text'} value={values[field.name] || ''} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} />}{field.help ? <small>{field.help}</small> : null}</label>)}</div> : null}</section> : null}
  </SovereignPortal>
}

function PackageItemsPortal({ record, snapshot, busy, readOnly: _readOnly, onClose, onExecute }: { record: PackageVersionRecord; snapshot: ProductKernelSnapshot; busy: boolean; readOnly: boolean; onClose: () => void; onExecute: (operation: string, payload: Record<string, unknown>, close?: boolean) => Promise<unknown> }) {
  const [type, setType] = useState<'module' | 'feature' | 'addon' | 'meter'>('module')
  const [itemId, setItemId] = useState('')
  const [inclusionType, setInclusionType] = useState('included')
  const [quantity, setQuantity] = useState('')
  const [changeScope, setChangeScope] = useState('catalogue_only')
  const [reason, setReason] = useState('')
  const [selectedSubscriptionIds, setSelectedSubscriptionIds] = useState<string[]>([])
  const [workingPackageId, setWorkingPackageId] = useState(record.id)
  const items = snapshot.packageItems.filter((item) => item.package_version_id === workingPackageId)
  const subscriptions = snapshot.legacy.subscriptions.filter((item) => item.package_version_id === workingPackageId || item.package_version_id === record.id)
  const source = type === 'module' ? snapshot.modules : type === 'feature' ? snapshot.features : type === 'addon' ? snapshot.addons : snapshot.meters
  const labelFor = (row: { item_type: string; item_id: string }) => {
    const list = row.item_type === 'module' ? snapshot.modules : row.item_type === 'feature' ? snapshot.features : row.item_type === 'addon' ? snapshot.addons : snapshot.meters
    return list.find((item) => item.id === row.item_id)?.name || 'Élément'
  }
  const toggleSubscription = (id: string) => setSelectedSubscriptionIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const changePayload = { changeScope, reason, selectedSubscriptionIds }
  return <SovereignPortal open title={`Composer ${record.name}`} eyebrow="Package Composition Canvas" subtitle="Composition totalement modifiable, y compris pour un package publié ou seedé. L’historique, l’impact et la synchronisation sont gérés automatiquement." size="full" tone="tenant" breadcrumbs={['Package Composer', record.version_code]} onClose={onClose} footer={<div className={styles.portalFooterActions}><button type="button" onClick={onClose}>Fermer</button><button data-primary type="button" disabled={!items.length || busy || !reason} onClick={() => onExecute('package-version.publish', { id: record.id, reason })}>Activer / Publier</button></div>}>
    <section className={styles.adminEditControl}><header><ShieldCheck size={20}/><div><span>Portée composition</span><h3>Choisir les clients impactés</h3></div></header><div className={styles.adminControlGrid}><label><span>Application</span><select value={changeScope} onChange={(event) => setChangeScope(event.target.value)}><option value="catalogue_only">Catalogue uniquement</option><option value="new_sales_only">Nouvelles ventes uniquement</option><option value="selected_subscriptions">Abonnements sélectionnés</option><option value="existing_at_renewal">Au renouvellement</option><option value="all_active_subscriptions">Tous les actifs</option><option value="immediate_authorized">Immédiat autorisé</option></select></label><label data-wide><span>Justification *</span><textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} /></label></div>{changeScope === 'selected_subscriptions' ? <div className={styles.subscriptionScopeList}>{subscriptions.map((subscription) => { const id = String(subscription.id); return <label key={id}><input type="checkbox" checked={selectedSubscriptionIds.includes(id)} onChange={() => toggleSubscription(id)} /><span>{String(subscription.subscription_code || id)}</span></label> })}</div> : null}</section>
    <div className={styles.composerLayout}><section className={styles.composerLibrary}><h3>Catalogue disponible</h3><div className={styles.segmented}>{(['module','feature','addon','meter'] as const).map((item) => <button key={item} type="button" data-active={type === item} onClick={() => { setType(item); setItemId('') }}>{item}</button>)}</div><select value={itemId} onChange={(event) => setItemId(event.target.value)}><option value="">Sélectionner l’élément…</option>{source.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select value={inclusionType} onChange={(event) => setInclusionType(event.target.value)}><option value="included">Inclus</option><option value="required">Obligatoire</option><option value="optional">Optionnel</option><option value="excluded">Exclu</option></select>{type === 'meter' || type === 'addon' ? <input type="number" placeholder="Quantité incluse" value={quantity} onChange={(event) => setQuantity(event.target.value)} /> : null}<button data-primary type="button" disabled={!itemId || busy || !reason} onClick={async () => { const result = await onExecute('package-item.upsert', { packageVersionId: workingPackageId, itemType: type, itemId, inclusionType, quantity: quantity || null, ...changePayload }, false) as { packageVersionId?: string }; if (result.packageVersionId) setWorkingPackageId(result.packageVersionId); setItemId(''); setQuantity('') }}><Plus size={15} /> Ajouter au package</button></section><section className={styles.composerCanvas}><h3>Composition active</h3>{items.map((item) => <div key={item.id}><span>{item.item_type}</span><strong>{labelFor(item)}</strong><small>{item.inclusion_type}{item.quantity ? ` · ${item.quantity}` : ''}</small><button type="button" disabled={!reason} onClick={async () => { const result = await onExecute('package-item.delete', { id: item.id, ...changePayload }, false) as { packageVersionId?: string }; if (result.packageVersionId) setWorkingPackageId(result.packageVersionId) }}>Retirer</button></div>)}{!items.length ? <Empty title="Canvas vide" detail="Sélectionnez des éléments depuis le catalogue canonique." /> : null}</section><aside className={styles.composerImpact}><h3>Impact package</h3><p><strong>{items.filter((item) => item.item_type === 'module').length}</strong> modules</p><p><strong>{items.filter((item) => item.item_type === 'feature').length}</strong> features</p><p><strong>{items.filter((item) => item.item_type === 'addon').length}</strong> add-ons</p><p><strong>{items.filter((item) => item.item_type === 'meter').length}</strong> capacités</p><p><strong>{subscriptions.length}</strong> abonnements concernés</p><div><AlertTriangle size={17} /><span>Chaque modification crée une révision et applique la portée choisie.</span></div></aside></div>
  </SovereignPortal>
}


function PackageClonePortal({ record, busy, onClose, onExecute }: { record: PackageVersionRecord; busy: boolean; onClose: () => void; onExecute: (operation: string, payload: Record<string, unknown>, close?: boolean) => Promise<unknown> }) {
  const [versionCode, setVersionCode] = useState(`${record.version_code.replace(/-V\d+$/i, '')}-V${record.version_number + 1}`)
  const [name, setName] = useState(record.name)
  const [effectiveFrom, setEffectiveFrom] = useState('')
  return <SovereignPortal open title={`Créer une nouvelle version de ${record.name}`} eyebrow="Package Version Governance" subtitle="La duplication est optionnelle. Elle crée une variante indépendante lorsque vous ne souhaitez pas modifier directement la version actuelle." size="mission" tone="commercial" breadcrumbs={['Package Composer', record.version_code, 'Nouvelle version']} onClose={onClose} footer={<div className={styles.portalFooterActions}><button type="button" onClick={onClose}>Annuler</button><button data-primary type="button" disabled={busy || !versionCode || !name} onClick={() => onExecute('package-version.clone', { id: record.id, versionCode, name, effectiveFrom })}>{busy ? 'Clonage…' : 'Cloner et ouvrir la version'}</button></div>} sidecar={<div className={styles.sidecarContent}><PackageCheck size={22}/><h3>Impact de version</h3><p>La version actuelle reste disponible. Vous pourrez ensuite choisir précisément quels abonnements migrer vers la copie.</p></div>}>
    <div className={styles.formGrid}><label><span>Nouveau code version *</span><input value={versionCode} onChange={(event) => setVersionCode(event.target.value)} /></label><label><span>Nom *</span><input value={name} onChange={(event) => setName(event.target.value)} /></label><label><span>Date d’effet</span><input type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} /></label></div>
  </SovereignPortal>
}

function PriceEntryPortal({ record, priceBookId, snapshot, busy, onClose, onExecute }: { record?: PriceBookEntryRecord; priceBookId?: string; snapshot: ProductKernelSnapshot; busy: boolean; onClose: () => void; onExecute: (operation: string, payload: Record<string, unknown>, close?: boolean) => Promise<unknown> }) {
  const [bookId, setBookId] = useState(record?.price_book_id || priceBookId || snapshot.priceBooks[0]?.id || '')
  const [itemType, setItemType] = useState(record?.item_type || 'package_version')
  const [itemId, setItemId] = useState(record?.item_id || '')
  const [billingCycle, setBillingCycle] = useState(record?.billing_cycle || 'monthly')
  const [unitPrice, setUnitPrice] = useState(String(record?.unit_price || 0))
  const [setupFee, setSetupFee] = useState(String(record?.setup_fee || 0))
  const [minimumQuantity, setMinimumQuantity] = useState(record?.minimum_quantity == null ? '' : String(record.minimum_quantity))
  const [maximumQuantity, setMaximumQuantity] = useState(record?.maximum_quantity == null ? '' : String(record.maximum_quantity))
  const [changeScope, setChangeScope] = useState('new_sales_only')
  const [effectiveAt, setEffectiveAt] = useState('')
  const [reason, setReason] = useState('')
  const [selectedSubscriptionIds, setSelectedSubscriptionIds] = useState<string[]>([])
  const source = itemType === 'package_version' ? snapshot.packageVersions : itemType === 'module' ? snapshot.modules : itemType === 'feature' ? snapshot.features : itemType === 'addon' ? snapshot.addons : snapshot.meters
  const toggle = (id: string) => setSelectedSubscriptionIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  return <SovereignPortal open title={record ? 'Modifier le tarif' : 'Ajouter un tarif'} eyebrow="Price Book Entry" subtitle="Prix totalement modifiable avec portée client, date d’effet, impact et historique automatique." size="mission" tone="commercial" breadcrumbs={['Tarification', record ? 'Modifier' : 'Nouveau tarif']} onClose={onClose} footer={<div className={styles.portalFooterActions}><button type="button" onClick={onClose}>Annuler</button>{record ? <button type="button" disabled={busy || !reason} onClick={() => onExecute('price-entry.delete', { id: record.id, reason, changeScope, effectiveAt: effectiveAt || undefined, selectedSubscriptionIds })}>Supprimer</button> : null}<button data-primary type="button" disabled={busy || !bookId || !itemId || !reason || (changeScope === 'selected_subscriptions' && !selectedSubscriptionIds.length)} onClick={() => onExecute('price-entry.upsert', { priceBookId: bookId, itemType, itemId, billingCycle, unitPrice, setupFee, minimumQuantity, maximumQuantity, changeScope, effectiveAt: effectiveAt || undefined, reason, selectedSubscriptionIds })}>{busy ? 'Synchronisation…' : 'Enregistrer le prix et sa portée'}</button></div>} sidecar={<div className={styles.sidecarContent}><CircleDollarSign size={22}/><h3>Contrôle tarifaire</h3><p>Le prix peut s’appliquer aux nouvelles ventes, au renouvellement, à une sélection ou immédiatement selon votre décision.</p></div>}>
    <section className={styles.adminEditControl}><header><ShieldCheck size={20}/><div><span>Portée tarifaire</span><h3>Choisir l’application</h3></div></header><div className={styles.adminControlGrid}><label><span>Application</span><select value={changeScope} onChange={(event) => setChangeScope(event.target.value)}><option value="new_sales_only">Nouvelles ventes uniquement</option><option value="selected_subscriptions">Abonnements sélectionnés</option><option value="existing_at_renewal">Au renouvellement</option><option value="all_active_subscriptions">Tous les actifs</option><option value="scheduled">Planifier</option><option value="immediate_authorized">Immédiat autorisé</option></select></label>{changeScope === 'scheduled' ? <label><span>Date d’effet</span><input type="datetime-local" value={effectiveAt} onChange={(event) => setEffectiveAt(event.target.value)} /></label> : null}<label data-wide><span>Justification *</span><textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} /></label></div>{changeScope === 'selected_subscriptions' ? <div className={styles.subscriptionScopeList}>{snapshot.legacy.subscriptions.map((subscription) => { const id = String(subscription.id); return <label key={id}><input type="checkbox" checked={selectedSubscriptionIds.includes(id)} onChange={() => toggle(id)} /><span>{String(subscription.subscription_code || id)} · {String(subscription.status || '—')}</span></label> })}</div> : null}</section>
    <div className={styles.formGrid}><label><span>Price book *</span><select value={bookId} onChange={(event) => setBookId(event.target.value)}>{snapshot.priceBooks.map((book) => <option key={book.id} value={book.id}>{book.name} · {book.currency}</option>)}</select></label><label><span>Type *</span><select value={itemType} disabled={Boolean(record)} onChange={(event) => { setItemType(event.target.value as PriceBookEntryRecord['item_type']); setItemId('') }}><option value="package_version">Package</option><option value="module">Module</option><option value="feature">Feature</option><option value="addon">Add-on</option><option value="meter">Capacité</option></select></label><label><span>Élément *</span><select value={itemId} disabled={Boolean(record)} onChange={(event) => setItemId(event.target.value)}><option value="">Sélectionner…</option>{source.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>Cycle *</span><select value={billingCycle} onChange={(event) => setBillingCycle(event.target.value)}><option value="one_time">One-time</option><option value="monthly">Mensuel</option><option value="quarterly">Trimestriel</option><option value="annual">Annuel</option><option value="usage">Usage</option></select></label><label><span>Prix unitaire</span><input type="number" value={unitPrice} onChange={(event) => setUnitPrice(event.target.value)} /></label><label><span>Frais setup</span><input type="number" value={setupFee} onChange={(event) => setSetupFee(event.target.value)} /></label><label><span>Quantité minimum</span><input type="number" value={minimumQuantity} onChange={(event) => setMinimumQuantity(event.target.value)} /></label><label><span>Quantité maximum</span><input type="number" value={maximumQuantity} onChange={(event) => setMaximumQuantity(event.target.value)} /></label></div>
  </SovereignPortal>
}

function DependencyPortal({ record, snapshot, busy, onClose, onExecute }: { record?: ProductDependencyRecord; snapshot: ProductKernelSnapshot; busy: boolean; onClose: () => void; onExecute: (operation: string, payload: Record<string, unknown>, close?: boolean) => Promise<unknown> }) {
  const [sourceType, setSourceType] = useState<ProductKernelItemType>(record?.source_type || 'module')
  const [sourceId, setSourceId] = useState(record?.source_id || '')
  const [targetType, setTargetType] = useState<ProductKernelItemType>(record?.target_type || 'module')
  const [targetId, setTargetId] = useState(record?.target_id || '')
  const [relationType, setRelationType] = useState(record?.relation_type || 'requires')
  const [requiredState, setRequiredState] = useState(record?.required_state || 'enabled')
  const [reason, setReason] = useState(record?.reason || '')
  const sourceList = sourceType === 'module' ? snapshot.modules : sourceType === 'feature' ? snapshot.features : sourceType === 'addon' ? snapshot.addons : snapshot.meters
  const targetList = targetType === 'module' ? snapshot.modules : targetType === 'feature' ? snapshot.features : targetType === 'addon' ? snapshot.addons : snapshot.meters
  return <SovereignPortal open title={record ? 'Configurer la règle' : 'Créer une règle de compatibilité'} eyebrow="Dependency & Conflict Engine" subtitle="Les règles requires/conflicts/recommends sont exécutées avant publication d’un package." size="mission" tone="tenant" breadcrumbs={['Compatibilité', relationType]} onClose={onClose} footer={<div className={styles.portalFooterActions}><button type="button" onClick={onClose}>Annuler</button><button data-primary type="button" disabled={busy || !sourceId || !targetId || sourceType === targetType && sourceId === targetId} onClick={() => onExecute('dependency.upsert', { sourceType, sourceId, targetType, targetId, relationType, requiredState, reason })}>{busy ? 'Validation…' : 'Enregistrer la règle'}</button></div>} sidecar={<div className={styles.sidecarContent}><GitBranch size={22}/><h3>Publication sûre</h3><p>Une dépendance manquante ou un conflit actif bloque la publication avant tout impact client.</p></div>}>
    <div className={styles.formGrid}><label><span>Type source</span><select value={sourceType} onChange={(event) => { setSourceType(event.target.value as ProductKernelItemType); setSourceId('') }}><option value="module">Module</option><option value="feature">Feature</option><option value="addon">Add-on</option><option value="meter">Capacité</option></select></label><label><span>Source *</span><select value={sourceId} onChange={(event) => setSourceId(event.target.value)}><option value="">Sélectionner…</option>{sourceList.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>Relation</span><select value={relationType} onChange={(event) => setRelationType(event.target.value)}><option value="requires">Requiert</option><option value="conflicts">Conflit avec</option><option value="recommends">Recommande</option><option value="meters">Mesuré par</option><option value="extends">Étend</option></select></label><label><span>Type cible</span><select value={targetType} onChange={(event) => { setTargetType(event.target.value as ProductKernelItemType); setTargetId('') }}><option value="module">Module</option><option value="feature">Feature</option><option value="addon">Add-on</option><option value="meter">Capacité</option></select></label><label><span>Cible *</span><select value={targetId} onChange={(event) => setTargetId(event.target.value)}><option value="">Sélectionner…</option>{targetList.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>État requis</span><select value={requiredState} onChange={(event) => setRequiredState(event.target.value)}><option value="enabled">Activé</option><option value="published">Publié</option><option value="configured">Configuré</option></select></label><label data-wide><span>Justification</span><textarea rows={5} value={reason} onChange={(event) => setReason(event.target.value)} /></label></div>
  </SovereignPortal>
}

function FindingPortal({ record, modules, busy, onClose, onExecute }: { record: ScannerFindingRecord; modules: ProductModuleRecord[]; busy: boolean; onClose: () => void; onExecute: (operation: string, payload: Record<string, unknown>, close?: boolean) => Promise<unknown> }) {
  const [moduleId, setModuleId] = useState('')
  const adoptable = ['module','feature','meter'].includes(record.finding_type)
  return <SovereignPortal open title={record.title} eyebrow="Scanner Finding" subtitle={record.description || 'Suggestion native explicable.'} size="mission" tone="tenant" breadcrumbs={['Scanner & Diagnostic', record.finding_type]} onClose={onClose} footer={<div className={styles.portalFooterActions}><button type="button" onClick={onClose}>Fermer</button>{record.status === 'open' ? <><button type="button" disabled={busy} onClick={() => onExecute('finding.reject', { id: record.id })}>Rejeter</button><button type="button" disabled={busy} onClick={() => onExecute('finding.resolve', { id: record.id })}>Marquer résolu</button><button data-primary type="button" disabled={!adoptable || busy || (record.finding_type === 'feature' && !moduleId)} onClick={() => onExecute('finding.adopt', { id: record.id, moduleId })}>Convertir au catalogue</button></> : <button data-primary type="button" disabled={busy} onClick={() => onExecute('finding.reopen', { id: record.id })}>Rouvrir le finding</button>}</div>} sidecar={<div className={styles.findingSidecar}><span>Classification</span><strong>{record.classification}</strong><span>Confiance</span><strong>{record.confidence}%</strong><span>État</span><strong>{record.status}</strong></div>}>
    <div className={styles.findingDetail}><section><h3>Suggestion structurée</h3><pre>{JSON.stringify(record.suggestion, null, 2)}</pre></section><section><h3>Preuves repository</h3>{record.evidence.map((evidence, index) => <div key={index}><Code2 size={15} /><span>{typeof evidence === 'string' ? evidence : JSON.stringify(evidence)}</span></div>)}</section>{record.finding_type === 'feature' ? <label><span>Module canonique cible</span><select value={moduleId} onChange={(event) => setModuleId(event.target.value)}><option value="">Sélectionner…</option>{modules.map((module) => <option key={module.id} value={module.id}>{module.name}</option>)}</select></label> : null}</div>
  </SovereignPortal>
}

function AssignPackagePortal({ snapshot, busy, onClose, onExecute }: { snapshot: ProductKernelSnapshot; busy: boolean; onClose: () => void; onExecute: (operation: string, payload: Record<string, unknown>, close?: boolean) => Promise<unknown> }) {
  const [subscriptionId, setSubscriptionId] = useState('')
  const [packageVersionId, setPackageVersionId] = useState('')
  const [billingCycle, setBillingCycle] = useState('monthly')
  const subscription = snapshot.legacy.subscriptions.find((row) => row.id === subscriptionId)
  const version = snapshot.packageVersions.find((row) => row.id === packageVersionId)
  return <SovereignPortal open title="Affecter un package publié" eyebrow="Customer Product Control" subtitle="L’affectation met à jour l’abonnement puis compile le package en snapshot tenant et synchronise les feature flags et usage limits existants." size="mission" tone="tenant" breadcrumbs={['Déploiements tenants', 'Affectation package']} onClose={onClose} footer={<div className={styles.portalFooterActions}><button type="button" onClick={onClose}>Annuler</button><button data-primary type="button" disabled={!subscriptionId || !packageVersionId || busy} onClick={() => onExecute('subscription.package.assign', { subscriptionId, packageVersionId, billingCycle, compileNow: true })}>Affecter et compiler</button></div>} sidecar={<div className={styles.assignImpact}><span>Montant proposé</span><strong>{version ? Number(billingCycle === 'annual' ? version.annual_price : version.monthly_price).toLocaleString('fr-FR') : '—'} MAD</strong><span>Tenant</span><strong>{String(snapshot.legacy.tenants.find((row) => row.id === subscription?.tenant_id)?.tenant_slug || '—')}</strong><span>Effet</span><p>Abonnement → package_version_id → entitlement snapshot → feature flags / usage limits.</p></div>}>
    <div className={styles.formGrid}><label><span>Abonnement *</span><select value={subscriptionId} onChange={(event) => setSubscriptionId(event.target.value)}><option value="">Sélectionner…</option>{snapshot.legacy.subscriptions.map((row) => <option key={String(row.id)} value={String(row.id)}>{String(row.subscription_code)} · {String(snapshot.legacy.clients.find((client) => client.id === row.client_id)?.display_name || '')}</option>)}</select></label><label><span>Package publié *</span><select value={packageVersionId} onChange={(event) => setPackageVersionId(event.target.value)}><option value="">Sélectionner…</option>{snapshot.packageVersions.filter((row) => row.status === 'published').map((row) => <option key={row.id} value={row.id}>{row.name} · {row.version_code}</option>)}</select></label><label><span>Cycle de facturation</span><select value={billingCycle} onChange={(event) => setBillingCycle(event.target.value)}><option value="monthly">Mensuel</option><option value="annual">Annuel</option></select></label></div>
  </SovereignPortal>
}

const select = (pairs: Array<[string,string]>): Option[] => pairs.map(([label, value]) => ({ label, value }))
const statuses = select([['Brouillon','draft'],['Revue','review'],['Publié','published'],['Suspendu','suspended'],['Déprécié','deprecated'],['Retiré','retired'],['Archivé','archived']])
const maturity = select([['Opérationnel','operational'],['Configuration requise','configuration_dependent'],['Backend prêt','backend_ready'],['Frontend seul','frontend_only'],['Intégration requise','integration_dependent'],['Verrouillé','locked'],['Déprécié','deprecated'],['Non vérifié','unverified']])
const moduleFields: Field[] = [
  { name:'moduleKey',label:'Référence interne',help:'Générée automatiquement à la création. Modifiable dans la configuration avancée.',advanced:true},{name:'name',label:'Nom commercial',required:true},{name:'shortName',label:'Nom court'},{name:'category',label:'Catégorie',kind:'select',options:select([['Core','core'],['Growth','growth'],['Operations','operations'],['Finance','finance'],['Engagement','engagement'],['Intelligence','intelligence']])},{name:'status',label:'État',kind:'select',options:statuses},{name:'sellability',label:'Sellabilité',kind:'select',options:select([['Interne','internal_only'],['Inclus','included'],['Standalone','standalone'],['Candidat add-on','addon_candidate'],['Sellable client','customer_sellable']])},{name:'runtimeMaturity',label:'Maturité runtime',kind:'select',options:maturity},{name:'version',label:'Version'},{name:'customerRoutePrefix',label:'Route Customer',advanced:true},{name:'apiPrefix',label:'API prefix',advanced:true},{name:'supportOwnerRole',label:'Rôle support',advanced:true},{name:'defaultSupportTier',label:'Support par défaut',kind:'select',options:select([['Standard','standard'],['Priority','priority'],['Dedicated','dedicated']])},{name:'regionAvailability',label:'Régions',help:'MA, FR, AE…',advanced:true},{name:'description',label:'Description produit',kind:'textarea'},{name:'commercialSummary',label:'Promesse commerciale',kind:'textarea'},
]
const featureFields = (modules: Option[]): Field[] => [{name:'moduleId',label:'Module',kind:'select',options:modules,required:true},{name:'featureKey',label:'Référence interne',help:'Générée automatiquement si vide.',advanced:true},{name:'name',label:'Nom',required:true},{name:'version',label:'Version'},{name:'featureTier',label:'Niveau',kind:'select',options:select([['Basic','basic'],['Standard','standard'],['Advanced','advanced'],['Premium','premium'],['Custom','custom']])},{name:'status',label:'État',kind:'select',options:statuses},{name:'sellability',label:'Modèle commercial',kind:'select',options:select([['Interne','internal_only'],['Incluse','included'],['Premium','premium'],['Add-on','addon'],['Sellable','customer_sellable']])},{name:'runtimeMaturity',label:'Maturité',kind:'select',options:maturity},{name:'customerRoute',label:'Route customer',advanced:true},{name:'apiRoute',label:'Route API',advanced:true},{name:'permissionKeys',label:'Permissions',help:'Séparées par virgules',advanced:true},{name:'configurationRequired',label:'Configuration requise',kind:'select',options:select([['Non','false'],['Oui','true']])},{name:'description',label:'Description',kind:'textarea'}]
const addonFields = (modules: Option[]): Field[] => [{name:'addonCode',label:'Référence interne',help:'Générée automatiquement si vide.',advanced:true},{name:'name',label:'Nom commercial',required:true},{name:'version',label:'Version'},{name:'moduleId',label:'Module associé',kind:'select',options:modules},{name:'addonType',label:'Type',kind:'select',options:select([['Capability','capability'],['Service','service'],['Support','support'],['Implementation','implementation'],['Capacity','capacity'],['Integration','integration']])},{name:'billingModel',label:'Facturation',kind:'select',options:select([['One-time','one_time'],['Recurring','recurring'],['Usage','usage'],['Included','included']])},{name:'status',label:'État',kind:'select',options:statuses},{name:'currency',label:'Devise'},{name:'listPrice',label:'Prix catalogue',kind:'number'},{name:'includedQuantity',label:'Quantité incluse',kind:'number'},{name:'unit',label:'Unité'},{name:'regionAvailability',label:'Régions',advanced:true},{name:'description',label:'Description',kind:'textarea'}]
const priceBookFields: Field[] = [{name:'priceBookCode',label:'Référence tarifaire',help:'Générée automatiquement si vide.',advanced:true},{name:'versionCode',label:'Version tarifaire',advanced:true},{name:'name',label:'Nom',required:true},{name:'currency',label:'Devise',kind:'select',options:select([['Dirham marocain','MAD'],['Euro','EUR'],['Dollar US','USD']])},{name:'regionCode',label:'Région',kind:'select',options:select([['Maroc','MA'],['France','FR'],['Émirats','AE'],['Global','GLOBAL']])},{name:'status',label:'État',kind:'select',options:select([['Brouillon','draft'],['Approuvé','approved'],['Planifié','scheduled'],['Actif','active'],['Expiré','expired'],['Retiré','retired'],['Archivé','archived']])},{name:'effectiveFrom',label:'Effet à partir',kind:'date'},{name:'effectiveTo',label:'Fin d’effet',kind:'date'}]
const meterFields: Field[] = [{name:'meterKey',label:'Référence interne',help:'Générée automatiquement si vide.',advanced:true},{name:'name',label:'Nom',required:true},{name:'version',label:'Version'},{name:'unit',label:'Unité',required:true},{name:'meterType',label:'Type',kind:'select',options:select([['Capacity','capacity'],['Usage','usage'],['Seat','seat'],['Storage','storage'],['Transaction','transaction'],['Service','service']])},{name:'resetCycle',label:'Cycle reset',kind:'select',options:select([['Aucun',''],['Mensuel','monthly'],['Annuel','annual']])},{name:'hardLimit',label:'Limite dure',kind:'select',options:select([['Non','false'],['Oui','true']])},{name:'warningThresholdPct',label:'Seuil alerte %',kind:'number'},{name:'topupEnabled',label:'Top-up autorisé',kind:'select',options:select([['Oui','true'],['Non','false']])},{name:'topupIncrement',label:'Incrément top-up',kind:'number'},{name:'status',label:'État',kind:'select',options:statuses},{name:'sourceTable',label:'Table de mesure',advanced:true},{name:'sourceColumn',label:'Colonne de mesure',advanced:true},{name:'description',label:'Description',kind:'textarea'}]
const packageFields = (legacy: Option[]): Field[] => [{name:'packageId',label:'Package legacy lié',kind:'select',options:legacy,advanced:true},{name:'versionCode',label:'Référence de version',help:'Générée automatiquement si vide.',advanced:true},{name:'versionNumber',label:'Numéro version',kind:'number',advanced:true},{name:'name',label:'Nom package',required:true},{name:'targetSegment',label:'Segment cible',kind:'select',options:select([['Starter','starter'],['Growth','growth'],['Scale','scale'],['Enterprise','enterprise'],['Custom','custom']])},{name:'status',label:'État',kind:'select',options:select([['Draft','draft'],['Scanned','scanned'],['Commercial review','commercial_review'],['Operational review','operational_review'],['Approved','approved'],['Published','published'],['Suspended','suspended'],['Deprecated','deprecated'],['Retired','retired'],['Archived','archived']])},{name:'currency',label:'Devise'},{name:'monthlyPrice',label:'Prix mensuel',kind:'number'},{name:'annualPrice',label:'Prix annuel',kind:'number'},{name:'setupFee',label:'Frais setup',kind:'number'},{name:'supportTier',label:'Support',kind:'select',options:select([['Standard','standard'],['Priority','priority'],['Dedicated','dedicated']])},{name:'implementationTier',label:'Implémentation',kind:'select',options:select([['Standard','standard'],['Assisted','assisted'],['Managed','managed']])},{name:'effectiveFrom',label:'Effet à partir',kind:'date'},{name:'effectiveTo',label:'Fin d’effet',kind:'date'},{name:'regionAvailability',label:'Régions',advanced:true},{name:'description',label:'Description commerciale',kind:'textarea'}]

function moduleForm(record?: ProductModuleRecord): Record<string,string> { return record ? { moduleKey:record.module_key,name:record.name,shortName:record.short_name || '',description:record.description || '',commercialSummary:record.commercial_summary || '',category:record.category,status:record.status,sellability:record.sellability,runtimeMaturity:record.runtime_maturity,version:record.version,customerRoutePrefix:record.customer_route_prefix || '',apiPrefix:record.api_prefix || '',supportOwnerRole:record.support_owner_role || '',defaultSupportTier:record.default_support_tier,regionAvailability:(record.region_availability || []).join(',') } : { moduleKey:'',name:'',shortName:'',description:'',commercialSummary:'',category:'core',status:'draft',sellability:'customer_sellable',runtimeMaturity:'unverified',version:'1.0.0',customerRoutePrefix:'',apiPrefix:'',supportOwnerRole:'',defaultSupportTier:'standard',regionAvailability:'MA' } }
function featureForm(record: ProductFeatureRecord): Record<string,string> { return { moduleId:record.module_id,featureKey:record.feature_key,name:record.name,version:record.version || '1.0.0',description:record.description || '',featureTier:record.feature_tier,status:record.status,sellability:record.sellability,runtimeMaturity:record.runtime_maturity,customerRoute:record.customer_route || '',apiRoute:record.api_route || '',permissionKeys:(record.permission_keys || []).join(','),configurationRequired:String(record.configuration_required) } }
function addonForm(record?: ProductAddonRecord): Record<string,string> { return record ? { addonCode:record.addon_code,name:record.name,version:record.version || '1.0.0',description:record.description||'',moduleId:record.module_id||'',addonType:record.addon_type,billingModel:record.billing_model,status:record.status,currency:record.currency,listPrice:String(record.list_price),includedQuantity:record.included_quantity==null?'':String(record.included_quantity),unit:record.unit||'',regionAvailability:(record.region_availability||[]).join(',') } : { addonCode:'',name:'',version:'1.0.0',description:'',moduleId:'',addonType:'capability',billingModel:'recurring',status:'draft',currency:'MAD',listPrice:'0',includedQuantity:'',unit:'',regionAvailability:'MA' } }
function priceBookForm(record?: PriceBookRecord): Record<string,string> { return record ? { priceBookCode:record.price_book_code,versionCode:record.version_code || '1.0',name:record.name,currency:record.currency,regionCode:record.region_code,status:record.status,effectiveFrom:record.effective_from||'',effectiveTo:record.effective_to||'' } : { priceBookCode:'',versionCode:'1.0',name:'',currency:'MAD',regionCode:'MA',status:'draft',effectiveFrom:'',effectiveTo:'' } }
function meterForm(record?: ProductMeterRecord): Record<string,string> { return record ? { meterKey:record.meter_key,name:record.name,version:record.version || '1.0.0',description:record.description || '',unit:record.unit,meterType:record.meter_type,resetCycle:record.reset_cycle || '',hardLimit:String(record.hard_limit),warningThresholdPct:String(record.warning_threshold_pct),topupEnabled:String(record.topup_enabled),topupIncrement:String(record.topup_increment || ''),status:record.status,sourceTable:record.source_table || '',sourceColumn:record.source_column || '' } : { meterKey:'',name:'',version:'1.0.0',description:'',unit:'unités',meterType:'capacity',resetCycle:'',hardLimit:'false',warningThresholdPct:'80',topupEnabled:'true',topupIncrement:'',status:'draft',sourceTable:'',sourceColumn:'' } }
function packageForm(record?: PackageVersionRecord): Record<string,string> { return record ? { packageId:record.package_id || '',versionCode:record.version_code,versionNumber:String(record.version_number),name:record.name,description:record.description || '',targetSegment:record.target_segment || '',status:record.status,currency:record.currency,monthlyPrice:String(record.monthly_price),annualPrice:String(record.annual_price),setupFee:String(record.setup_fee),supportTier:record.support_tier,implementationTier:record.implementation_tier,effectiveFrom:record.effective_from || '',effectiveTo:record.effective_to || '',regionAvailability:(record.region_availability || []).join(',') } : { packageId:'',versionCode:'',versionNumber:'1',name:'',description:'',targetSegment:'growth',status:'draft',currency:'MAD',monthlyPrice:'0',annualPrice:'0',setupFee:'0',supportTier:'standard',implementationTier:'standard',effectiveFrom:'',effectiveTo:'',regionAvailability:'MA' } }
function ModuleSidecar(){ return <div className={styles.sidecarContent}><Wrench size={22}/><h3>Module control plane</h3><p>Le module relie catalogue commercial, route customer, API, permissions, configuration, support, package et runtime.</p><ul><li>Clé stable</li><li>Maturité explicable</li><li>Sellabilité gouvernée</li><li>Publication versionnée</li></ul></div> }
function FeatureSidecar(){ return <div className={styles.sidecarContent}><ToggleLeft size={22}/><h3>Feature depth</h3><p>Une feature peut être incluse, premium, add-on ou interne. Les routes et permissions constituent ses preuves.</p></div> }
function AddonSidecar(){ return <div className={styles.sidecarContent}><BadgeDollarSign size={22}/><h3>Commercial extension</h3><p>Un add-on doit posséder un modèle de facturation, une région, une dépendance et une configuration d’activation.</p></div> }
function MeterSidecar(){ return <div className={styles.sidecarContent}><Gauge size={22}/><h3>Capacity control</h3><p>Les capacités compilent vers les usage limits existants et peuvent recevoir des top-ups contrôlés.</p></div> }
function PriceBookSidecar(){ return <div className={styles.sidecarContent}><CircleDollarSign size={22}/><h3>Tarification régionale</h3><p>Un price book gouverne devise, région, période, cycles et règles de volume indépendamment des packages.</p></div> }
function PackageSidecar(){ return <div className={styles.sidecarContent}><PackageCheck size={22}/><h3>Contrôle total administrateur</h3><p>Prix, composition, support et portée client restent modifiables. Le système crée automatiquement l’historique et prévisualise l’impact.</p></div> }
