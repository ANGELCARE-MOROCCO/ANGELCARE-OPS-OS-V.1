'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Copy,
  Edit3,
  GitCompare,
  Layers3,
  RefreshCcw,
  Send,
  ShieldCheck,
  Trash2,
  Wrench,
} from 'lucide-react'
import type {
  PackageVersionRecord,
  PriceBookRecord,
  ProductAddonRecord,
  ProductFeatureRecord,
  ProductKernelSnapshot,
  ProductMeterRecord,
  ProductModuleRecord,
} from '@/types/angelcare360/operator/product-kernel'
import SovereignPortal from '../sovereign/SovereignPortal'
import styles from './ProductKernelStudio.module.css'

export type GovernedEntityKind = 'module' | 'feature' | 'addon' | 'meter'
export type GovernedEntityRecord = ProductModuleRecord | ProductFeatureRecord | ProductAddonRecord | ProductMeterRecord
export type GovernanceTarget =
  | { target: 'entity'; entityKind: GovernedEntityKind; record: GovernedEntityRecord }
  | { target: 'package'; record: PackageVersionRecord }
  | { target: 'price-book'; record: PriceBookRecord }

const ENTITY_LABELS: Record<GovernedEntityKind, string> = {
  module: 'Module', feature: 'Fonctionnalité', addon: 'Add-on', meter: 'Capacité',
}
const CHANGE_SCOPES = [
  ['catalogue_only', 'Catalogue uniquement'],
  ['new_sales_only', 'Nouvelles ventes uniquement'],
  ['selected_subscriptions', 'Abonnements sélectionnés'],
  ['existing_at_renewal', 'Clients existants au renouvellement'],
  ['all_active_subscriptions', 'Tous les abonnements actifs'],
  ['scheduled', 'Planifier pour une date future'],
  ['immediate_authorized', 'Application immédiate autorisée'],
] as const

export default function ProductKernelGovernancePortal({ target, snapshot, busy, onClose, onExecute, onEdit, onCompose }: {
  target: GovernanceTarget
  snapshot: ProductKernelSnapshot
  busy: boolean
  onClose: () => void
  onExecute: (operation: string, payload: Record<string, unknown>, close?: boolean) => Promise<unknown>
  onEdit: () => void
  onCompose?: () => void
}) {
  const [reason, setReason] = useState('')
  const [scope, setScope] = useState('catalogue_only')
  const [effectiveAt, setEffectiveAt] = useState('')
  const [strategy, setStrategy] = useState('archive')
  const [replacementId, setReplacementId] = useState('')
  const [confirm, setConfirm] = useState(false)
  const seeded = Boolean(target.record.is_seeded)

  const commonPayload = { reason, changeScope: scope, effectiveAt: effectiveAt || undefined }

  if (target.target === 'entity') {
    const { entityKind, record } = target
    const label = ENTITY_LABELS[entityKind]
    const packageItems = snapshot.packageItems.filter((item) => item.item_type === entityKind && item.item_id === record.id)
    const dependencies = snapshot.dependencies.filter((item) => (item.source_type === entityKind && item.source_id === record.id) || (item.target_type === entityKind && item.target_id === record.id))
    const relatedCount = entityKind === 'module'
      ? snapshot.features.filter((item) => item.module_id === record.id).length
      : entityKind === 'addon'
        ? snapshot.subscriptionAddons.filter((item) => item.addon_id === record.id).length
        : entityKind === 'meter'
          ? snapshot.topups.filter((item) => item.meter_id === record.id).length
          : snapshot.addons.filter((item) => item.feature_id === record.id).length
    const replacements = (entityKind === 'module' ? snapshot.modules : entityKind === 'feature' ? snapshot.features : entityKind === 'addon' ? snapshot.addons : snapshot.meters).filter((item) => item.id !== record.id)

    return <SovereignPortal open title={record.name} eyebrow={`${label} · Contrôle administrateur`} subtitle="Contrôle complet: modifier, activer, suspendre, remplacer, archiver ou supprimer avec impact, historique et synchronisation." size="mission" tone="tenant" breadcrumbs={['Tenants & Produit', label, record.name]} onClose={onClose}
      sidecar={<div className={styles.governanceSidecar}><span>Version</span><strong>{record.version}</strong><span>État</span><strong>{record.status}</strong><span>Packages</span><strong>{packageItems.length}</strong><span>Dépendances</span><strong>{dependencies.length}</strong><span>Relations</span><strong>{relatedCount}</strong></div>}
      footer={<div className={styles.portalFooterActions}><button type="button" onClick={onClose}>Fermer</button><button type="button" data-primary onClick={onEdit}><Edit3 size={15}/> Modifier maintenant</button><button type="button" disabled={busy} onClick={() => onExecute(`${entityKind}.clone`, { id: record.id, reason: reason || 'Copie administrateur optionnelle' })}><Copy size={15}/> Dupliquer</button></div>}>
      <div className={styles.governanceCanvas}>
        {seeded ? <section className={styles.adminAuthorityBanner}><ShieldCheck size={22}/><div><strong>Configuration initiale AngelCare — entièrement modifiable</strong><p>Ce seed n’est ni obligatoire ni protégé. Vous pouvez le renommer, le reconfigurer, le remplacer, l’archiver ou le supprimer.</p></div></section> : null}
        <section className={styles.impactPanel}><header><GitCompare size={20}/><div><span>Impact actuel</span><h3>Relations synchronisées</h3></div></header><div className={styles.impactGrid}><article><strong>{packageItems.length}</strong><span>packages</span></article><article><strong>{dependencies.length}</strong><span>dépendances</span></article><article><strong>{relatedCount}</strong><span>relations</span></article><article><strong>{record.status}</strong><span>état</span></article></div></section>
        <section className={styles.lifecyclePanel}><header><div><span>Contrôle du cycle</span><h3>Activation et état commercial</h3></div><RefreshCcw size={22}/></header><label><span>Justification</span><textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} /></label><div className={styles.lifecycleActions}><button type="button" disabled={busy} onClick={() => onExecute(`${entityKind}.published`, { id: record.id, status: 'published', reason: reason || 'Activation administrateur' })}>Activer / Publier</button><button type="button" disabled={busy || !reason} onClick={() => onExecute(`${entityKind}.suspended`, { id: record.id, status: 'suspended', reason })}>Suspendre</button><button type="button" disabled={busy || !reason} onClick={() => onExecute(`${entityKind}.deprecated`, { id: record.id, status: 'deprecated', reason })}>Déprécier</button><button type="button" disabled={busy || !reason} onClick={() => onExecute(`${entityKind}.draft`, { id: record.id, status: 'draft', reason })}>Réouvrir en brouillon</button></div></section>
        <RemovalChamber busy={busy} entityLabel={label} strategy={strategy} setStrategy={setStrategy} replacementId={replacementId} setReplacementId={setReplacementId} replacements={replacements.map((item) => ({ id: item.id, name: item.name }))} scope={scope} setScope={setScope} effectiveAt={effectiveAt} setEffectiveAt={setEffectiveAt} reason={reason} setReason={setReason} confirm={confirm} setConfirm={setConfirm} onExecute={() => onExecute(`${entityKind}.admin-remove`, { id: record.id, strategy, replacementId: replacementId || undefined, ...commonPayload })} />
      </div>
    </SovereignPortal>
  }

  if (target.target === 'package') {
    const record = target.record
    const items = snapshot.packageItems.filter((item) => item.package_version_id === record.id)
    const subscriptions = snapshot.legacy.subscriptions.filter((item) => item.package_version_id === record.id)
    const replacements = snapshot.packageVersions.filter((item) => item.id !== record.id && item.status !== 'archived')
    return <SovereignPortal open title={record.name} eyebrow="Package · Contrôle administrateur" subtitle="Modifier directement le package, ses prix et sa composition; choisir précisément la portée client avant synchronisation." size="mission" tone="tenant" breadcrumbs={['Package Composer', record.version_code]} onClose={onClose}
      sidecar={<div className={styles.governanceSidecar}><span>Version</span><strong>{record.version_code}</strong><span>État</span><strong>{record.status}</strong><span>Items</span><strong>{items.length}</strong><span>Abonnements</span><strong>{subscriptions.length}</strong><span>MRR</span><strong>{Number(record.monthly_price || 0).toLocaleString('fr-FR')} Dh</strong></div>}
      footer={<div className={styles.portalFooterActions}><button type="button" onClick={onClose}>Fermer</button><button type="button" data-primary onClick={onEdit}><Edit3 size={15}/> Modifier prix & métadonnées</button><button type="button" onClick={onCompose}><Layers3 size={15}/> Modifier composition</button><button type="button" disabled={busy} onClick={() => onExecute('package-version.clone', { id: record.id, reason: reason || 'Duplication administrateur optionnelle' })}><Copy size={15}/> Dupliquer</button></div>}>
      <div className={styles.governanceCanvas}>
        {seeded ? <section className={styles.adminAuthorityBanner}><ShieldCheck size={22}/><div><strong>Package initial entièrement modifiable</strong><p>Essential, Professional, Enterprise ou tout autre seed peut être renommé, repricé, recomposé, remplacé, archivé ou supprimé.</p></div></section> : null}
        <section className={styles.releaseReadiness} data-ready><header><CheckCircle2 size={24}/><div><span>Contrôle direct</span><h3>Aucun verrou de publication</h3></div></header><div><span>Les révisions et l’audit sont créés automatiquement en arrière-plan.</span></div></section>
        <section className={styles.impactPanel}><header><GitCompare size={20}/><div><span>Composition & clients</span><h3>Impact en temps réel</h3></div></header><div className={styles.impactGrid}><article><strong>{items.filter((item) => item.item_type === 'module').length}</strong><span>modules</span></article><article><strong>{items.filter((item) => item.item_type === 'feature').length}</strong><span>features</span></article><article><strong>{subscriptions.length}</strong><span>abonnements</span></article><article><strong>{Number(record.annual_price || 0).toLocaleString('fr-FR')} Dh</strong><span>annuel</span></article></div></section>
        <RemovalChamber busy={busy} entityLabel="package" strategy={strategy} setStrategy={setStrategy} replacementId={replacementId} setReplacementId={setReplacementId} replacements={replacements.map((item) => ({ id: item.id, name: `${item.name} · ${item.version_code}` }))} scope={scope} setScope={setScope} effectiveAt={effectiveAt} setEffectiveAt={setEffectiveAt} reason={reason} setReason={setReason} confirm={confirm} setConfirm={setConfirm} onExecute={() => onExecute('package-version.admin-remove', { id: record.id, strategy, replacementId: replacementId || undefined, selectedSubscriptionIds: subscriptions.map((item) => String(item.id)), ...commonPayload })} />
      </div>
    </SovereignPortal>
  }

  const book = target.record
  const entries = snapshot.priceEntries.filter((entry) => entry.price_book_id === book.id)
  return <SovereignPortal open title={book.name} eyebrow="Price Book · Contrôle administrateur" subtitle="Modifier prix, devise, région et période, y compris sur un catalogue actif, avec révision et portée d’application." size="mission" tone="tenant" breadcrumbs={['Tarification', book.price_book_code]} onClose={onClose}
    sidecar={<div className={styles.governanceSidecar}><span>Version</span><strong>{book.version_code || 'v1'}</strong><span>Région</span><strong>{book.region_code}</strong><span>Devise</span><strong>{book.currency}</strong><span>Entrées</span><strong>{entries.length}</strong><span>État</span><strong>{book.status}</strong></div>}
    footer={<div className={styles.portalFooterActions}><button type="button" onClick={onClose}>Fermer</button><button type="button" data-primary onClick={onEdit}><Edit3 size={15}/> Modifier maintenant</button><button type="button" disabled={busy} onClick={() => onExecute('price-book.clone', { id: book.id, reason: reason || 'Duplication optionnelle' })}><Copy size={15}/> Dupliquer</button></div>}>
    <div className={styles.governanceCanvas}>
      {seeded ? <section className={styles.adminAuthorityBanner}><ShieldCheck size={22}/><div><strong>Catalogue tarifaire initial entièrement modifiable</strong><p>Le seed ne bloque ni prix, ni devise, ni dates, ni suppression administrateur.</p></div></section> : null}
      <section className={styles.impactPanel}><header><GitCompare size={20}/><div><span>Architecture tarifaire</span><h3>{entries.length} tarif(s)</h3></div></header><div className={styles.impactGrid}><article><strong>{entries.filter((entry) => entry.billing_cycle === 'monthly').length}</strong><span>mensuels</span></article><article><strong>{entries.filter((entry) => entry.billing_cycle === 'annual').length}</strong><span>annuels</span></article><article><strong>{book.region_code}</strong><span>région</span></article><article><strong>{book.currency}</strong><span>devise</span></article></div></section>
      <RemovalChamber busy={busy} entityLabel="price book" strategy={strategy} setStrategy={setStrategy} replacementId={replacementId} setReplacementId={setReplacementId} replacements={[]} scope={scope} setScope={setScope} effectiveAt={effectiveAt} setEffectiveAt={setEffectiveAt} reason={reason} setReason={setReason} confirm={confirm} setConfirm={setConfirm} onExecute={() => onExecute('price-book.admin-remove', { id: book.id, strategy, ...commonPayload })} />
    </div>
  </SovereignPortal>
}

function RemovalChamber({ busy, entityLabel, strategy, setStrategy, replacementId, setReplacementId, replacements, scope, setScope, effectiveAt, setEffectiveAt, reason, setReason, confirm, setConfirm, onExecute }: {
  busy: boolean; entityLabel: string; strategy: string; setStrategy: (value: string) => void
  replacementId: string; setReplacementId: (value: string) => void; replacements: Array<{ id: string; name: string }>
  scope: string; setScope: (value: string) => void; effectiveAt: string; setEffectiveAt: (value: string) => void
  reason: string; setReason: (value: string) => void; confirm: boolean; setConfirm: (value: boolean) => void; onExecute: () => void
}) {
  const needsReplacement = strategy === 'replace_and_delete'
  return <section className={styles.dangerZone}><header><Trash2 size={20}/><div><span>Suppression, remplacement & migration</span><h3>Contrôle complet du {entityLabel}</h3></div></header><p>Le système montre les conséquences et préserve l’historique, mais n’impose aucun seed ni verrou permanent à l’administrateur autorisé.</p><div className={styles.adminControlGrid}><label><span>Action</span><select value={strategy} onChange={(event) => setStrategy(event.target.value)}><option value="archive">Archiver en préservant l’historique</option><option value="schedule_retirement">Planifier le retrait</option>{replacements.length ? <option value="replace_and_delete">Remplacer puis supprimer</option> : null}<option value="detach_and_delete">Détacher puis supprimer</option></select></label>{needsReplacement ? <label><span>Remplacement</span><select value={replacementId} onChange={(event) => setReplacementId(event.target.value)}><option value="">Sélectionner…</option>{replacements.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label> : null}<label><span>Portée</span><select value={scope} onChange={(event) => setScope(event.target.value)}>{CHANGE_SCOPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>{scope === 'scheduled' ? <label><span>Date d’effet</span><input type="datetime-local" value={effectiveAt} onChange={(event) => setEffectiveAt(event.target.value)} /></label> : null}<label data-wide><span>Justification obligatoire</span><textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} /></label></div><label className={styles.confirmToggle}><input type="checkbox" checked={confirm} onChange={(event) => setConfirm(event.target.checked)} /><span>Je confirme cette action et son impact sur les packages, abonnements, tenants et entitlements concernés.</span></label><button type="button" data-danger disabled={busy || !confirm || !reason || (needsReplacement && !replacementId)} onClick={onExecute}><Trash2 size={15}/> Exécuter l’action administrateur</button></section>
}
