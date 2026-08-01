'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronRight, CloudCog, Gauge, PackageCheck, Plus, RefreshCcw, Settings2, ShieldAlert, ToggleLeft, Wrench } from 'lucide-react'
import type { ProductKernelSnapshot, TenantEntitlementItemRecord } from '@/types/angelcare360/operator/product-kernel'
import SovereignPortal from '../sovereign/SovereignPortal'
import styles from './CustomerProductControlPanel.module.css'

type Action =
  | { kind: 'assign-package' }
  | { kind: 'addon' }
  | { kind: 'topup' }
  | { kind: 'override'; item?: TenantEntitlementItemRecord }
  | { kind: 'troubleshoot' }
  | null

export default function CustomerProductControlPanel({ clientId }: { clientId: string }) {
  const [snapshot, setSnapshot] = useState<ProductKernelSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [action, setAction] = useState<Action>(null)
  const [busy, setBusy] = useState(false)
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState('')

  async function load() {
    setLoading(true); setError(null)
    try {
      const response = await fetch(`/api/angelcare360/operator/product-kernel?clientId=${encodeURIComponent(clientId)}`, { cache: 'no-store' })
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error(result.error || 'Impossible de charger le contrôle produit.')
      setSnapshot(result.snapshot)
      setSelectedSubscriptionId((current) => current || String(result.snapshot.legacy.subscriptions[0]?.id || ''))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Erreur produit.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [clientId])

  async function execute(operation: string, payload: Record<string, unknown>) {
    setBusy(true); setMessage(null)
    try {
      const response = await fetch('/api/angelcare360/operator/product-kernel', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ operation, payload }) })
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error(result.error || 'La commande a échoué.')
      await load(); setAction(null); setMessage('Configuration produit synchronisée.')
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Erreur de synchronisation.') }
    finally { setBusy(false) }
  }

  const context = useMemo(() => {
    const subscription = snapshot?.legacy.subscriptions.find((row) => String(row.id) === selectedSubscriptionId) || snapshot?.legacy.subscriptions[0]
    const tenant = snapshot?.legacy.tenants.find((row) => row.id === subscription?.tenant_id) || snapshot?.legacy.tenants[0]
    const packageVersion = snapshot?.packageVersions.find((row) => row.id === subscription?.package_version_id)
    const activeSnapshot = snapshot?.entitlementSnapshots.find((row) => row.tenant_id === tenant?.id && row.status === 'active')
    const items = activeSnapshot ? snapshot?.entitlementItems.filter((row) => row.snapshot_id === activeSnapshot.id) || [] : []
    const runtimeFlags = snapshot?.legacy.featureFlags.filter((row) => row.tenant_id === tenant?.id) || []
    const runtimeLimits = snapshot?.legacy.usageLimits.filter((row) => row.tenant_id === tenant?.id) || []
    const drift = items.filter((item) => {
      if (item.item_type === 'meter') {
        const runtime = runtimeLimits.find((row) => row.limit_key === item.item_key)
        return !runtime || Number(runtime.allowed_value || 0) !== Number(item.quantity || 0)
      }
      const runtime = runtimeFlags.find((row) => row.feature_key === item.item_key)
      return !runtime || Boolean(runtime.enabled) !== (item.effective_state === 'enabled')
    })
    const subscriptionAddons = snapshot?.subscriptionAddons.filter((row) => row.subscription_id === subscription?.id) || []
    const topups = snapshot?.topups.filter((row) => row.subscription_id === subscription?.id) || []
    const overrides = snapshot?.overrides.filter((row) => row.tenant_id === tenant?.id && row.status === 'active') || []
    return { subscription, tenant, packageVersion, activeSnapshot, items, runtimeFlags, runtimeLimits, drift, subscriptionAddons, topups, overrides }
  }, [snapshot, selectedSubscriptionId])

  if (loading) return <div className={styles.loading}>Chargement du Product Control Kernel…</div>
  if (error || !snapshot) return <div className={styles.error}><AlertTriangle size={18} />{error || 'Product Kernel indisponible.'}<button type="button" onClick={load}>Réessayer</button></div>

  return <section className={styles.controlRoom}>
    {message ? <div className={styles.message} data-error={/erreur|échoué|impossible/i.test(message)}>{message}</div> : null}
    <header className={styles.header}>
      <div><span>Customer Product & Subscription Control</span><h3>Contracté, compilé et réellement livré</h3><p>Le dossier contrôle ici le package, les add-ons, capacités, overrides et écarts runtime sans quitter le contexte client.</p></div>
      <div><label className={styles.subscriptionSelector}><span>Abonnement actif</span><select value={String(context.subscription?.id || '')} onChange={(event) => setSelectedSubscriptionId(event.target.value)}>{snapshot.legacy.subscriptions.map((row) => <option key={String(row.id)} value={String(row.id)}>{String(row.subscription_code)} · {String(row.status)}</option>)}</select></label><button type="button" onClick={() => setAction({ kind: 'troubleshoot' })}><Wrench size={15} /> Diagnostiquer</button><button type="button" data-primary onClick={() => setAction({ kind: 'assign-package' })}><PackageCheck size={15} /> Affecter package</button></div>
    </header>

    <div className={styles.truthRibbon}>
      <Truth label="Package contracté" value={context.packageVersion?.name || 'Non affecté'} detail={context.packageVersion?.version_code || 'Sélection requise'} tone={context.packageVersion ? 'success' : 'warning'} />
      <Truth label="Abonnement" value={String(context.subscription?.subscription_code || 'Absent')} detail={String(context.subscription?.status || 'Source absente')} tone={context.subscription ? 'product' : 'warning'} />
      <Truth label="Tenant" value={String(context.tenant?.tenant_slug || 'Non lié')} detail={String(context.tenant?.status || '')} tone={context.tenant ? 'product' : 'warning'} />
      <Truth label="Snapshot entitlement" value={context.activeSnapshot ? `${context.items.length} items` : 'Non compilé'} detail={context.activeSnapshot?.source_signature?.slice(0, 12) || 'Compilation requise'} tone={context.activeSnapshot ? 'success' : 'warning'} />
      <Truth label="Runtime existant" value={`${context.runtimeFlags.length} flags`} detail={`${context.runtimeLimits.length} limites`} tone="product" />
      <Truth label="Drift" value={String(context.drift.length)} detail="Écarts contracté / runtime" tone={context.drift.length ? 'critical' : 'success'} />
    </div>

    <div className={styles.threePlanes}>
      <aside className={styles.contractPlane}>
        <span>Contracted state</span><h4>{context.packageVersion?.name || 'Package non affecté'}</h4>
        <p>{context.packageVersion?.description || 'Affectez une version publiée pour créer la baseline contractuelle.'}</p>
        <dl><div><dt>Valeur</dt><dd>{Number(context.subscription?.billing_amount_mad || 0).toLocaleString('fr-FR')} Dh</dd></div><div><dt>Cycle</dt><dd>{String(context.subscription?.billing_cycle || '—')}</dd></div><div><dt>Add-ons</dt><dd>{context.subscriptionAddons.length}</dd></div><div><dt>Top-ups</dt><dd>{context.topups.length}</dd></div></dl>
        <div className={styles.planeActions}><button type="button" onClick={() => setAction({ kind: 'addon' })}><Plus size={14} /> Add-on</button><button type="button" onClick={() => setAction({ kind: 'topup' })}><Gauge size={14} /> Top-up</button></div>
      </aside>

      <div className={styles.entitlementPlane}>
        <div className={styles.planeTitle}><div><span>Effective entitlement</span><h4>Capacités compilées</h4></div>{context.subscription && context.tenant && context.packageVersion ? <button type="button" disabled={busy} onClick={() => execute('entitlements.compile', { clientId, tenantId: context.tenant?.id, subscriptionId: context.subscription?.id, packageVersionId: context.packageVersion?.id })}><RefreshCcw size={14} /> Recompiler</button> : null}</div>
        <div className={styles.entitlementList}>{context.items.map((item) => <button type="button" key={item.id} onClick={() => setAction({ kind: 'override', item })} data-state={item.effective_state}><span>{item.item_type === 'meter' ? <Gauge size={15} /> : <ToggleLeft size={15} />}</span><div><strong>{item.item_label}</strong><small>{item.item_key} · origine {item.origin}</small></div><b>{item.quantity ?? ''}</b><em>{item.effective_state}</em><ChevronRight size={14} /></button>)}{!context.items.length ? <div className={styles.empty}>Aucun entitlement compilé. Affectez un package publié puis compilez la baseline tenant.</div> : null}</div>
      </div>

      <aside className={styles.runtimePlane}>
        <span>Actual runtime</span><h4>Synchronisation réelle</h4>
        <div className={styles.runtimeMetrics}><div><strong>{context.runtimeFlags.filter((row) => row.enabled).length}</strong><span>features actives</span></div><div><strong>{context.runtimeLimits.length}</strong><span>limites actives</span></div><div data-alert={context.drift.length > 0}><strong>{context.drift.length}</strong><span>écarts</span></div></div>
        <div className={styles.driftList}>{context.drift.slice(0, 6).map((item) => <div key={item.id}><ShieldAlert size={14} /><span>{item.item_label}</span><strong>{item.effective_state}</strong></div>)}{!context.drift.length ? <div className={styles.synced}><CheckCircle2 size={16} /> Baseline et runtime alignés.</div> : null}</div>
        <button type="button" className={styles.fullAction} onClick={() => setAction({ kind: 'troubleshoot' })}><CloudCog size={15} /> Ouvrir le diagnostic complet</button>
      </aside>
    </div>

    <CustomerProductPortal action={action} snapshot={snapshot} clientId={clientId} context={context} busy={busy} onClose={() => setAction(null)} onExecute={execute} />
  </section>
}

function Truth({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) { return <div className={styles.truth} data-tone={tone}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div> }

type Context = ReturnType<typeof useContextShape>
function useContextShape(){ return { subscription: undefined as Record<string,unknown>|undefined, tenant: undefined as Record<string,unknown>|undefined, packageVersion: undefined as ProductKernelSnapshot['packageVersions'][number]|undefined, activeSnapshot: undefined as ProductKernelSnapshot['entitlementSnapshots'][number]|undefined, items: [] as TenantEntitlementItemRecord[], runtimeFlags: [] as Array<Record<string,unknown>>, runtimeLimits: [] as Array<Record<string,unknown>>, drift: [] as TenantEntitlementItemRecord[], subscriptionAddons: [] as ProductKernelSnapshot['subscriptionAddons'], topups: [] as ProductKernelSnapshot['topups'], overrides: [] as ProductKernelSnapshot['overrides'] } }

function CustomerProductPortal({ action, snapshot, clientId, context, busy, onClose, onExecute }: { action: Action; snapshot: ProductKernelSnapshot; clientId: string; context: Context; busy: boolean; onClose: () => void; onExecute: (operation: string, payload: Record<string, unknown>) => Promise<void> }) {
  if (!action) return null
  if (action.kind === 'assign-package') return <AssignPortal snapshot={snapshot} clientId={clientId} context={context} busy={busy} onClose={onClose} onExecute={onExecute} />
  if (action.kind === 'addon') return <AddonPortal snapshot={snapshot} context={context} busy={busy} onClose={onClose} onExecute={onExecute} />
  if (action.kind === 'topup') return <TopupPortal snapshot={snapshot} context={context} busy={busy} onClose={onClose} onExecute={onExecute} />
  if (action.kind === 'override') return <OverridePortal clientId={clientId} context={context} item={action.item} busy={busy} onClose={onClose} onExecute={onExecute} />
  return <TroubleshootPortal context={context} busy={busy} clientId={clientId} onClose={onClose} onExecute={onExecute} />
}

function AssignPortal({ snapshot, clientId, context, busy, onClose, onExecute }: { snapshot: ProductKernelSnapshot; clientId: string; context: Context; busy: boolean; onClose: () => void; onExecute: (operation: string, payload: Record<string, unknown>) => Promise<void> }) {
  const [subscriptionId, setSubscriptionId] = useState(String(context.subscription?.id || snapshot.legacy.subscriptions[0]?.id || ''))
  const [packageVersionId, setPackageVersionId] = useState(String(context.packageVersion?.id || ''))
  const [billingCycle, setBillingCycle] = useState(String(context.subscription?.billing_cycle || 'monthly'))
  const version = snapshot.packageVersions.find((row) => row.id === packageVersionId)
  return <SovereignPortal open title="Affecter et compiler un package" eyebrow="Customer Product Control" subtitle="Sélection contrôlée d’une version publiée. Le système met à jour l’abonnement, compile les entitlements et synchronise le runtime legacy." size="mission" tone="tenant" breadcrumbs={['Customer Dossier','Produit & Abonnement']} onClose={onClose} footer={<Footer busy={busy} label="Affecter et synchroniser" onClose={onClose} onSubmit={() => onExecute('subscription.package.assign',{subscriptionId,packageVersionId,billingCycle,compileNow:true})} />} sidecar={<Impact title="Impact prévisualisé" rows={[['Prix',version ? `${Number(billingCycle==='annual'?version.annual_price:version.monthly_price).toLocaleString('fr-FR')} Dh`:'—'],['Modules',String(snapshot.packageItems.filter((row)=>row.package_version_id===packageVersionId&&row.item_type==='module').length)],['Features',String(snapshot.packageItems.filter((row)=>row.package_version_id===packageVersionId&&row.item_type==='feature').length)],['Tenant',String(context.tenant?.tenant_slug||'—')]]} />}>
    <div className={styles.portalForm}><label><span>Abonnement *</span><select value={subscriptionId} onChange={(event)=>setSubscriptionId(event.target.value)}>{snapshot.legacy.subscriptions.map((row)=><option key={String(row.id)} value={String(row.id)}>{String(row.subscription_code)}</option>)}</select></label><label><span>Version package publiée *</span><select value={packageVersionId} onChange={(event)=>setPackageVersionId(event.target.value)}><option value="">Sélectionner…</option>{snapshot.packageVersions.filter((row)=>row.status==='published').map((row)=><option key={row.id} value={row.id}>{row.name} · {row.version_code}</option>)}</select></label><label><span>Cycle</span><select value={billingCycle} onChange={(event)=>setBillingCycle(event.target.value)}><option value="monthly">Mensuel</option><option value="annual">Annuel</option></select></label></div>
  </SovereignPortal>
}
function AddonPortal({ snapshot, context, busy, onClose, onExecute }: { snapshot: ProductKernelSnapshot; context: Context; busy: boolean; onClose: () => void; onExecute: (operation: string, payload: Record<string, unknown>) => Promise<void> }) {
  const [addonId,setAddonId]=useState('');const [quantity,setQuantity]=useState('1');const addon=snapshot.addons.find((row)=>row.id===addonId)
  return <SovereignPortal open title="Ajouter une option au contrat" eyebrow="Add-on Assignment" subtitle="Choisissez une option publiée et une quantité; aucun code ou identifiant technique n’est saisi manuellement." size="operational" tone="commercial" breadcrumbs={['Customer Dossier','Add-ons']} onClose={onClose} footer={<Footer busy={busy} label="Ajouter l’option" onClose={onClose} onSubmit={()=>onExecute('subscription-addon.assign',{subscriptionId:context.subscription?.id,addonId,quantity,unitPrice:addon?.list_price||0})} />} sidecar={<Impact title="Facturation" rows={[['Prix unitaire',addon?`${Number(addon.list_price).toLocaleString('fr-FR')} ${addon.currency}`:'—'],['Modèle',addon?.billing_model||'—'],['Quantité',quantity]]} />}><div className={styles.portalForm}><label><span>Add-on publié *</span><select value={addonId} onChange={(event)=>setAddonId(event.target.value)}><option value="">Sélectionner…</option>{snapshot.addons.filter((row)=>row.status==='published').map((row)=><option key={row.id} value={row.id}>{row.name} · {Number(row.list_price).toLocaleString('fr-FR')} {row.currency}</option>)}</select></label><label><span>Quantité</span><input type="number" min="1" value={quantity} onChange={(event)=>setQuantity(event.target.value)} /></label></div></SovereignPortal>
}
function TopupPortal({ snapshot, context, busy, onClose, onExecute }: { snapshot: ProductKernelSnapshot; context: Context; busy: boolean; onClose: () => void; onExecute: (operation: string, payload: Record<string, unknown>) => Promise<void> }) {
  const [meterId,setMeterId]=useState('');const [quantity,setQuantity]=useState('');const [amount,setAmount]=useState('0');const [reason,setReason]=useState('Croissance du client');const meter=snapshot.meters.find((row)=>row.id===meterId)
  return <SovereignPortal open title="Ajouter un top-up de capacité" eyebrow="Capacity Top-up" subtitle="Extension contrôlée d’une capacité existante avec montant, durée et justification." size="operational" tone="tenant" breadcrumbs={['Customer Dossier','Capacités']} onClose={onClose} footer={<Footer busy={busy} label="Activer le top-up" onClose={onClose} onSubmit={()=>onExecute('topup.assign',{subscriptionId:context.subscription?.id,tenantId:context.tenant?.id,meterId,quantity,amount,reason})} />} sidecar={<Impact title="Effet attendu" rows={[['Capacité',meter?.name||'—'],['Incrément',`${quantity||'—'} ${meter?.unit||''}`],['Montant',`${amount} Dh`]]} />}><div className={styles.portalForm}><label><span>Capacité *</span><select value={meterId} onChange={(event)=>{setMeterId(event.target.value);const selected=snapshot.meters.find((row)=>row.id===event.target.value);setQuantity(String(selected?.topup_increment||''))}}><option value="">Sélectionner…</option>{snapshot.meters.filter((row)=>row.status==='published'&&row.topup_enabled).map((row)=><option key={row.id} value={row.id}>{row.name} · incrément {row.topup_increment||'libre'} {row.unit}</option>)}</select></label><label><span>Quantité *</span><input type="number" value={quantity} onChange={(event)=>setQuantity(event.target.value)} /></label><label><span>Montant Dh</span><input type="number" value={amount} onChange={(event)=>setAmount(event.target.value)} /></label><label data-wide><span>Justification</span><textarea rows={4} value={reason} onChange={(event)=>setReason(event.target.value)} /></label></div></SovereignPortal>
}
function OverridePortal({ clientId, context, item, busy, onClose, onExecute }: { clientId:string;context:Context;item?:TenantEntitlementItemRecord;busy:boolean;onClose:()=>void;onExecute:(operation:string,payload:Record<string,unknown>)=>Promise<void> }) {
  const [state,setState]=useState(item?.effective_state||'enabled');const [quantity,setQuantity]=useState(item?.quantity?String(item.quantity):'');const [reason,setReason]=useState('Exception client autorisée');const [expiresAt,setExpiresAt]=useState('')
  return <SovereignPortal open title={`Contrôler ${item?.item_label||'la capacité'}`} eyebrow="Tenant Override Chamber" subtitle="Enable, disable, suspend, lock ou reconfigurer avec raison, durée et audit. La baseline package reste préservée." size="mission" tone="tenant" breadcrumbs={['Customer Dossier','Entitlements',item?.item_label||'Item']} onClose={onClose} footer={<Footer busy={busy} label="Appliquer et recompiler" onClose={onClose} onSubmit={()=>onExecute('override.apply',{clientId,tenantId:context.tenant?.id,subscriptionId:context.subscription?.id,packageVersionId:context.packageVersion?.id,itemType:item?.item_type,itemId:item?.item_id,itemKey:item?.item_key,overrideState:state,quantityOverride:quantity||null,reason,expiresAt:expiresAt||null})} />} sidecar={<Impact title="Consequence" rows={[['Baseline',item?.effective_state||'—'],['Override',state],['Expiration',expiresAt||'Sans expiration'],['Audit','Obligatoire']]} />}><div className={styles.portalForm}><label><span>État effectif</span><select value={state} onChange={(event)=>setState(event.target.value)}><option value="enabled">Activé</option><option value="disabled">Désactivé</option><option value="suspended">Suspendu</option><option value="locked">Verrouillé</option><option value="requires_configuration">Configuration requise</option></select></label>{item?.item_type==='meter'?<label><span>Quantité override</span><input type="number" value={quantity} onChange={(event)=>setQuantity(event.target.value)} /></label>:null}<label><span>Expiration</span><input type="datetime-local" value={expiresAt} onChange={(event)=>setExpiresAt(event.target.value)} /></label><label data-wide><span>Raison et preuve *</span><textarea rows={5} value={reason} onChange={(event)=>setReason(event.target.value)} /></label></div></SovereignPortal>
}
function TroubleshootPortal({ context, busy, clientId, onClose, onExecute }: { context:Context;busy:boolean;clientId:string;onClose:()=>void;onExecute:(operation:string,payload:Record<string,unknown>)=>Promise<void> }) {
  return <SovereignPortal open title="Diagnostic entitlement & runtime" eyebrow="Product Troubleshooting" subtitle="Comparer la baseline contractuelle, le snapshot compilé et les feature flags / usage limits réellement actifs." size="full" tone="tenant" breadcrumbs={['Customer Dossier','Product Diagnostic']} onClose={onClose} footer={<Footer busy={busy} label="Révoquer les overrides et restaurer" onClose={onClose} onSubmit={()=>onExecute('tenant-baseline.restore',{clientId,tenantId:context.tenant?.id,subscriptionId:context.subscription?.id,packageVersionId:context.packageVersion?.id})} />}><div className={styles.diagnostic}><section><h3>Entitlements attendus</h3>{context.items.map((item)=><div key={item.id}><strong>{item.item_label}</strong><span>{item.effective_state}</span><small>{item.origin}</small></div>)}</section><section><h3>Runtime legacy</h3>{context.runtimeFlags.map((row)=><div key={String(row.id)}><strong>{String(row.feature_label)}</strong><span>{row.enabled?'enabled':'disabled'}</span><small>{String(row.status)}</small></div>)}{context.runtimeLimits.map((row)=><div key={String(row.id)}><strong>{String(row.label)}</strong><span>{String(row.allowed_value)}</span><small>{String(row.status)}</small></div>)}</section><section data-alert={context.drift.length>0}><h3>Drift détecté</h3>{context.drift.map((item)=><div key={item.id}><AlertTriangle size={14}/><strong>{item.item_label}</strong><span>{item.effective_state}</span></div>)}{!context.drift.length?<div><CheckCircle2 size={16}/><strong>Aucun drift</strong><span>Runtime aligné.</span></div>:null}</section></div></SovereignPortal>
}
function Footer({busy,label,onClose,onSubmit}:{busy:boolean;label:string;onClose:()=>void;onSubmit:()=>void|Promise<void>}){return <div className={styles.footer}><button type="button" onClick={onClose}>Annuler</button><button type="button" data-primary disabled={busy} onClick={onSubmit}>{busy?'Synchronisation…':label}</button></div>}
function Impact({title,rows}:{title:string;rows:Array<[string,string]>}){return <div className={styles.impact}><h3>{title}</h3>{rows.map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>}
