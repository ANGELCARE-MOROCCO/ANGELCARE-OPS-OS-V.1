'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Boxes, ChevronRight, Database, FileKey2, Gauge, Layers3, Plus, RefreshCcw, Route, Settings2, ShieldCheck, Wrench, Workflow, PackageCheck, Tags, Activity, Save, X } from 'lucide-react'
import type { ProductConstitutionSnapshot } from '@/types/angelcare360/product-constitution'
import styles from './ProductConstitutionStudio.module.css'

type Kind = keyof ProductConstitutionSnapshot
type Row = Record<string, unknown>
type Tab = { key: Kind; label: string; description: string; icon: typeof Boxes; writable: boolean }

const TABS: Tab[] = [
  { key: 'modules', label: 'Modules', description: 'Catalogue versionné principal', icon: Layers3, writable: false },
  { key: 'features', label: 'Features', description: 'Fonctions du Product Kernel', icon: Boxes, writable: false },
  { key: 'addons', label: 'Add-ons', description: 'Extensions fonctionnelles', icon: Plus, writable: false },
  { key: 'meters', label: 'Mètres', description: 'Capacités et usages', icon: Gauge, writable: false },
  { key: 'packageVersions', label: 'Packages', description: 'Versions commerciales', icon: PackageCheck, writable: false },
  { key: 'priceBooks', label: 'Price books', description: 'Tarification versionnée', icon: Tags, writable: false },
  { key: 'domains', label: 'Domaines', description: 'Architecture produit', icon: Layers3, writable: true },
  { key: 'capabilities', label: 'Capabilities', description: 'Sous-modules gouvernés', icon: Boxes, writable: true },
  { key: 'services', label: 'Services', description: 'Implémentation et support', icon: Wrench, writable: true },
  { key: 'topupOffers', label: 'Top-ups', description: 'Extensions de capacité', icon: Gauge, writable: true },
  { key: 'routeBindings', label: 'Routes', description: '168 surfaces customer', icon: Route, writable: true },
  { key: 'operationBindings', label: 'Opérations', description: 'Actions et permissions', icon: Activity, writable: true },
  { key: 'billingProfiles', label: 'Facturation', description: 'Modèles de billing', icon: Database, writable: true },
  { key: 'configurationOwnership', label: 'Configuration', description: 'Propriété et portée', icon: Settings2, writable: true },
  { key: 'provisioningBlueprints', label: 'Provisioning', description: 'Activation idempotente', icon: Workflow, writable: true },
  { key: 'visibilityRules', label: 'Visibilité', description: 'États tenant explicables', icon: ShieldCheck, writable: true },
  { key: 'legacyMappings', label: 'Migration legacy', description: 'Compatibilité contrôlée', icon: FileKey2, writable: true },
]

const SYSTEM_FIELDS = new Set(['id', 'created_at', 'updated_at', 'archived_at', 'published_at', 'deprecated_at', 'retired_at'])
const FIELD_LABELS: Record<string, string> = {
  domain_key: 'Clé du domaine', capability_key: 'Clé de capability', module_id: 'Module parent', service_code: 'Code service',
  topup_code: 'Code top-up', meter_id: 'Mètre associé', route_path: 'Route customer', source_path: 'Fichier source',
  module_key: 'Module', entitlement_module_key: 'Module d’entitlement', feature_key: 'Feature', permission_key: 'Permission',
  visibility_rule_key: 'Règle de visibilité', provisioning_blueprint_key: 'Blueprint de provisioning', operation_key: 'Clé opération',
  operation_name: 'Opération', audit_event: 'Événement d’audit', mutation_endpoints: 'Endpoints de mutation', source_confidence: 'Niveau de preuve',
  billing_model: 'Modèle de facturation', billing_cycle: 'Cycle', tax_treatment: 'Traitement fiscal', item_type: 'Type d’item', item_key: 'Item',
  owner_role: 'Autorité de configuration', scope_type: 'Portée', blueprint_key: 'Clé blueprint', idempotency_key_template: 'Clé d’idempotence',
  rollback_steps: 'Étapes de rollback', rule_key: 'Clé de règle', customer_action: 'Action customer', mapping_key: 'Clé de migration',
  legacy_type: 'Type legacy', legacy_key: 'Clé legacy', canonical_type: 'Type canonique', canonical_key: 'Clé canonique',
  migration_state: 'État de migration', list_price: 'Prix catalogue', currency: 'Devise technique', increment: 'Incrément',
  maximum_purchases: 'Achats maximum', validity_days: 'Validité en jours', approval_required: 'Approbation requise',
  package_policy: 'Politique package', configuration_schema: 'Schéma de configuration', sort_order: 'Ordre', runtime_maturity: 'Maturité runtime',
}
const ENUMS: Record<string, string[]> = {
  status: ['draft', 'review', 'published', 'suspended', 'deprecated', 'retired', 'archived'],
  sellability: ['core_platform', 'included_by_default', 'package_included', 'separately_sellable', 'optional_addon', 'capacity_based', 'usage_based', 'enterprise_only', 'controlled_pilot', 'beta', 'custom_quotation', 'internal_only', 'deprecated', 'retired'],
  billing_model: ['not_separately_billable', 'included_in_package', 'fixed_recurring', 'fixed_one_time', 'per_institution', 'per_site', 'per_active_student', 'per_staff_member', 'per_named_user', 'per_active_user', 'per_administrator_seat', 'usage_based', 'topup', 'custom_quotation'],
  billing_cycle: ['one_time', 'monthly', 'quarterly', 'annual', 'usage'],
  behavior: ['render', 'read_only', 'setup', 'locked', 'upgrade', 'redirect_parent', 'hide', 'enable_module', 'allocate_capacity'],
  state: ['available', 'configuration_required', 'provisioning_pending', 'temporarily_suspended', 'capacity_reached', 'dependency_unavailable', 'not_included', 'upgrade_available', 'deprecated', 'migration_required', 'retired'],
  owner_role: ['angelcare_operator', 'tenant_owner', 'tenant_administrator', 'institution_administrator', 'module_administrator', 'finance_administrator', 'hr_administrator', 'academic_administrator', 'operational_user', 'automatically_derived', 'integration_controlled'],
  scope_type: ['platform', 'package', 'tenant', 'institution', 'site', 'academic_year', 'class', 'user', 'temporary_override'],
  migration_state: ['discovered', 'mapped', 'validated', 'migrated', 'retired'],
}
const DEFAULTS: Partial<Record<Kind, Row>> = {
  domains: { domain_key: '', name: '', description: '', status: 'draft', sort_order: 0, version: '1.0.0' },
  capabilities: { capability_key: '', module_id: '', name: '', description: '', status: 'draft', sellability: 'package_included', runtime_maturity: 'operational', version: '1.0.0', sort_order: 0, configuration_schema: {} },
  services: { service_code: '', name: '', description: '', service_type: 'implementation', billing_model: 'fixed_one_time', status: 'draft', currency: 'MAD', list_price: 0, configuration_schema: {} },
  topupOffers: { topup_code: '', meter_id: '', name: '', increment: 1, status: 'draft', maximum_purchases: null, validity_days: null, approval_required: false, provisioning_action: 'allocate_capacity', package_policy: {} },
  routeBindings: { route_path: '', source_path: '', domain_key: '', module_key: '', entitlement_module_key: '', capability_key: '', feature_key: '', permission_key: '', visibility_rule_key: 'visibility.available', provisioning_blueprint_key: '', label: '', detail_route: false, status: 'draft' },
  operationBindings: { operation_key: '', route_path: '', feature_key: '', operation_name: 'view', permission_key: '', audit_event: '', mutation_endpoints: [], source_confidence: 'operator_governed', status: 'draft' },
  billingProfiles: { item_type: 'module', item_key: '', billing_model: 'included_in_package', unit: '', currency: 'MAD', tax_treatment: 'standard', billing_cycle: null, minimum_quantity: null, maximum_quantity: null, included_allowance: null, status: 'draft' },
  configurationOwnership: { configuration_key: '', item_type: 'module', item_key: '', owner_role: 'tenant_administrator', scope_type: 'tenant', schema: {}, status: 'draft' },
  provisioningBlueprints: { blueprint_key: '', item_type: 'module', item_key: '', behavior: 'enable_module', steps: [], idempotency_key_template: '', rollback_steps: [], status: 'draft' },
  visibilityRules: { rule_key: '', state: 'available', behavior: 'render', label: '', explanation: '', customer_action: '', priority: 100, status: 'draft' },
  legacyMappings: { mapping_key: '', legacy_type: '', legacy_key: '', canonical_type: '', canonical_key: '', migration_state: 'mapped', notes: '' },
}

function title(row: Row) { return String(row.name || row.label || row.route_path || row.operation_key || row.capability_key || row.module_key || row.mapping_key || row.service_code || row.topup_code || 'Enregistrement') }
function fieldLabel(key: string) { return FIELD_LABELS[key] || key.replaceAll('_', ' ').replace(/^./, (value) => value.toUpperCase()) }
function editableFields(record: Row) { return Object.keys(record).filter((key) => !SYSTEM_FIELDS.has(key)).sort((a, b) => Number(['name','label','description','status'].includes(b)) - Number(['name','label','description','status'].includes(a))) }
function serializeValue(value: unknown) { return value && typeof value === 'object' ? JSON.stringify(value, null, 2) : value == null ? '' : String(value) }
function parseValue(original: unknown, value: string) {
  if (typeof original === 'boolean') return value === 'true'
  if (typeof original === 'number') return value === '' ? null : Number(value)
  if (original && typeof original === 'object') return value.trim() ? JSON.parse(value) : Array.isArray(original) ? [] : {}
  return value === '' ? null : value
}

export default function ProductConstitutionStudio({ initialSnapshot }: { initialSnapshot: ProductConstitutionSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [kind, setKind] = useState<Kind>('domains')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Row | null>(null)
  const [status, setStatus] = useState('')
  const tab = TABS.find((item) => item.key === kind) || TABS[0]
  const rows = useMemo(() => snapshot[kind].filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase())), [snapshot, kind, query])

  async function refresh() {
    setStatus('Synchronisation…')
    const response = await fetch('/api/angelcare360/operator/product-constitution', { cache: 'no-store' })
    const body = await response.json()
    if (!response.ok || !body.ok) throw new Error(body.error)
    setSnapshot(body.snapshot)
    setStatus('Source de vérité synchronisée.')
  }
  async function save(record: Row) {
    const id = String(record.id || '')
    const copy = { ...record }
    for (const key of [...SYSTEM_FIELDS, 'id']) delete copy[key]
    setStatus('Validation et écriture auditée…')
    const response = await fetch('/api/angelcare360/operator/product-constitution', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ operation: 'record.upsert', payload: { kind, id, record: copy } }) })
    const body = await response.json()
    if (!response.ok || !body.ok) throw new Error(body.error)
    await refresh()
    setEditing(null)
    setStatus('Définition enregistrée et révision créée.')
  }

  return <main className={styles.page}>
    <header className={styles.header}>
      <div><span>ANGELCARE 360 · PRODUCT CONSTITUTION</span><h1>Catalogue, sellables, entitlements & customer visibility</h1><p>Source de vérité gouvernée pour les domaines, modules, capabilities, opérations, services, mètres, top-ups, facturation, provisioning et migration legacy.</p></div>
      <div><Link href="/angelcare-360-operator/tenants-product">Product Kernel principal</Link><button type="button" onClick={() => refresh().catch((error) => setStatus(error.message))}><RefreshCcw size={17}/>Synchroniser</button><button type="button" data-primary disabled={!tab.writable} onClick={() => setEditing({ ...(DEFAULTS[kind] || { status: 'draft' }) })}><Plus size={17}/>Créer</button></div>
    </header>
    <section className={styles.stats}><article><strong>{snapshot.domains.length}</strong><span>domaines</span></article><article><strong>{snapshot.capabilities.length}</strong><span>capabilities</span></article><article><strong>{snapshot.routeBindings.length}</strong><span>routes classifiées</span></article><article><strong>{snapshot.operationBindings.length}</strong><span>opérations gouvernées</span></article><article><strong>{snapshot.topupOffers.length}</strong><span>top-ups</span></article></section>
    <nav className={styles.tabs}>{TABS.map((item) => { const Icon = item.icon; return <button type="button" key={item.key} data-active={kind === item.key} onClick={() => { setKind(item.key); setEditing(null); setStatus('') }}><Icon size={16}/><span>{item.label}</span><small>{snapshot[item.key].length}</small></button> })}</nav>
    <section className={styles.work}>
      <aside><div className={styles.context}><strong>{tab.label}</strong><span>{tab.description}</span><small>{tab.writable ? 'Autorité éditable et auditée' : 'Gouverné dans le Product Kernel principal'}</small></div><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher dans la source de vérité…"/><div className={styles.list}>{rows.map((row, index) => <button type="button" key={String(row.id || row.route_path || row.operation_key || row.capability_key || row.mapping_key || index)} onClick={() => setEditing(row)}><strong>{title(row)}</strong><span>{String(row.status || row.sellability || row.module_key || row.operation_name || row.legacy_type || '')}</span><ChevronRight size={15}/></button>)}</div></aside>
      <div className={styles.canvas}>{editing ? <RecordEditor kind={kind} record={editing} writable={tab.writable} snapshot={snapshot} onSave={save} onCancel={() => setEditing(null)}/> : <div className={styles.empty}><Layers3 size={36}/><h2>{tab.label}</h2><p>Sélectionnez un enregistrement pour inspecter sa définition, sa portée, son lifecycle et ses relations. Les familles éditables utilisent des champs structurés; aucun code n’est requis.</p>{!tab.writable ? <Link href="/angelcare-360-operator/tenants-product">Ouvrir l’autorité Product Kernel</Link> : null}</div>}</div>
      <aside className={styles.authority}><strong>Contrôle constitutionnel</strong><div><span>Famille</span><b>{tab.label}</b></div><div><span>Enregistrements</span><b>{snapshot[kind].length}</b></div><div><span>Écriture</span><b>{tab.writable ? 'Auditée' : 'Product Kernel'}</b></div><div><span>Preuve</span><b>Révision + audit</b></div>{status ? <p>{status}</p> : null}</aside>
    </section>
  </main>
}

function RecordEditor({ kind, record, writable, snapshot, onSave, onCancel }: { kind: Kind; record: Row; writable: boolean; snapshot: ProductConstitutionSnapshot; onSave: (record: Row) => Promise<void>; onCancel: () => void }) {
  const [draft, setDraft] = useState<Row>(record)
  const [error, setError] = useState('')
  const fields = editableFields(draft)
  function change(key: string, value: string) { try { setDraft((current) => ({ ...current, [key]: parseValue(record[key], value) })); setError('') } catch { setDraft((current) => ({ ...current, [key]: value })); setError(`Le champ ${fieldLabel(key)} contient une structure invalide.`) } }
  async function submit() { try { setError(''); await onSave(draft) } catch (problem) { setError(problem instanceof Error ? problem.message : 'La définition ne peut pas être enregistrée.') } }
  return <div className={styles.editor}>
    <header><div><span>{writable ? 'Éditeur gouverné' : 'Inspecteur en lecture seule'}</span><h2>{title(record)}</h2><p>{writable ? 'Les champs système sont protégés. La sauvegarde crée une révision et une preuve d’audit.' : 'Cette famille conserve son lifecycle dans le Product Kernel principal.'}</p></div><button type="button" onClick={onCancel} aria-label="Fermer"><X size={17}/></button></header>
    <div className={styles.form}>{fields.map((key) => <Field key={key} name={key} value={draft[key]} original={record[key]} disabled={!writable} snapshot={snapshot} onChange={(value) => change(key, value)}/>)}</div>
    {error ? <div className={styles.error}>{error}</div> : null}
    <footer><button type="button" onClick={onCancel}>Fermer</button>{writable ? <button type="button" data-primary onClick={submit}><Save size={16}/>Valider et auditer</button> : <Link href="/angelcare-360-operator/tenants-product">Modifier dans Product Kernel</Link>}</footer>
  </div>
}

function Field({ name, value, original, disabled, snapshot, onChange }: { name: string; value: unknown; original: unknown; disabled: boolean; snapshot: ProductConstitutionSnapshot; onChange: (value: string) => void }) {
  const stringValue = serializeValue(value)
  const relation = name === 'module_id' ? snapshot.modules : name === 'meter_id' ? snapshot.meters : null
  if (relation) return <label className={styles.field}><span>{fieldLabel(name)}</span><select disabled={disabled} value={stringValue} onChange={(event) => onChange(event.target.value)}><option value="">Sélectionner…</option>{relation.map((row) => <option key={String(row.id)} value={String(row.id)}>{String(row.name || row.module_key || row.meter_key)}</option>)}</select></label>
  if (ENUMS[name]) return <label className={styles.field}><span>{fieldLabel(name)}</span><select disabled={disabled} value={stringValue} onChange={(event) => onChange(event.target.value)}>{ENUMS[name].map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
  if (typeof original === 'boolean' || typeof value === 'boolean') return <label className={`${styles.field} ${styles.toggle}`}><span>{fieldLabel(name)}</span><input type="checkbox" disabled={disabled} checked={Boolean(value)} onChange={(event) => onChange(String(event.target.checked))}/></label>
  if ((original && typeof original === 'object') || (value && typeof value === 'object')) return <label className={`${styles.field} ${styles.wide}`}><span>{fieldLabel(name)}</span><textarea disabled={disabled} value={stringValue} onChange={(event) => onChange(event.target.value)} spellCheck={false}/><small>Structure contrôlée JSON — aucune exécution de code.</small></label>
  const multiline = /description|explanation|notes|reason|policy|summary/.test(name)
  return <label className={`${styles.field} ${multiline ? styles.wide : ''}`}><span>{fieldLabel(name)}</span>{multiline ? <textarea disabled={disabled} value={stringValue} onChange={(event) => onChange(event.target.value)}/> : <input disabled={disabled} type={typeof original === 'number' || typeof value === 'number' ? 'number' : 'text'} value={stringValue} onChange={(event) => onChange(event.target.value)}/>}</label>
}
