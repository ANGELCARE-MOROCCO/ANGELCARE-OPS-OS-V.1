'use client'

import Link from 'next/link'
import { useMemo, useState, type ChangeEvent, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, DatabaseZap, Gauge, GitBranch, Play, RefreshCcw, ShieldCheck, Workflow, X } from 'lucide-react'
import type { ProductRealityCommandRequest, ProductRealityOperationDefinition, ProductRealityQueueItem, ProductRealitySnapshot } from '@/types/angelcare360/product-reality'
import styles from './ProductRealityControlCenter.module.css'

type Props = { initialSnapshot: ProductRealitySnapshot }
type CommandDraft = { operationKey: string; entityId: string; reason: string; payload: string }
const EMPTY_DRAFT: CommandDraft = { operationKey: '', entityId: '', reason: '', payload: '{}' }

function severity(value: string) {
  if (/critical|failed|blocked/i.test(value)) return 'critical'
  if (/warning|attention|pending|requested|validating|executing/i.test(value)) return 'warning'
  if (/success|completed|operational|active/i.test(value)) return 'success'
  return 'neutral'
}

export default function ProductRealityControlCenter({ initialSnapshot }: Props) {
  const router = useRouter()
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [selectedDomain, setSelectedDomain] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState<CommandDraft>(EMPTY_DRAFT)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const operations = useMemo(() => snapshot.operationDefinitions.filter((item: ProductRealityOperationDefinition) => {
    const domain = selectedDomain === 'all' || item.domain === selectedDomain
    const text = `${item.operationKey} ${item.label} ${item.description}`.toLowerCase()
    return domain && text.includes(query.toLowerCase())
  }), [snapshot.operationDefinitions, selectedDomain, query])

  async function refresh() {
    setBusy(true)
    setNotice('Synchronisation de la réalité produit…')
    try {
      const schoolId = snapshot.selectedSchoolId || ''
      const response = await fetch(`/api/angelcare360/product-reality?authority=operator&schoolId=${encodeURIComponent(schoolId)}`, { cache: 'no-store' })
      const body = await response.json()
      if (!response.ok || !body.ok) throw new Error(body.error || 'Synchronisation impossible.')
      setSnapshot(body.snapshot)
      setNotice('Réalité produit synchronisée.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Synchronisation impossible.')
    } finally { setBusy(false) }
  }

  async function execute() {
    if (!draft.operationKey) return
    setBusy(true)
    setNotice('Validation entitlement, policy, capacité et mutation…')
    try {
      const payload = draft.payload.trim() ? JSON.parse(draft.payload) : {}
      const request: ProductRealityCommandRequest = {
        authority: 'operator',
        schoolId: snapshot.selectedSchoolId || null,
        operationKey: draft.operationKey,
        entityId: draft.entityId || null,
        reason: draft.reason || null,
        idempotencyKey: `operator:${draft.operationKey}:${draft.entityId || 'new'}:${JSON.stringify(payload)}`,
        payload,
      }
      const response = await fetch('/api/angelcare360/product-reality', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request) })
      const body = await response.json()
      if (!response.ok || !body.ok) throw new Error(body.error || body.message || 'Exécution refusée.')
      setNotice(body.message || 'Exécution terminée.')
      setDraft(EMPTY_DRAFT)
      await refresh()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Exécution impossible.')
    } finally { setBusy(false) }
  }

  return <main className={styles.page}>
    <header className={styles.crown}>
      <div>
        <span>ANGELCARE 360 · PRODUCT REALITY AUTHORITY</span>
        <h1>Runtime authority, lifecycle execution & historical truth</h1>
        <p>Le Product Kernel, les entitlements, les policies et les mutations opérationnelles sont contrôlés dans un seul plan d’autorité, sans moteur parallèle.</p>
      </div>
      <div className={styles.crownActions}>
        <label className={styles.tenantSelector}><span>Tenant gouverné</span><select value={snapshot.selectedSchoolId || ''} onChange={(event: ChangeEvent<HTMLSelectElement>) => router.push(`/angelcare-360-operator/tenants-product/reality?schoolId=${encodeURIComponent(event.target.value)}`)}>{(snapshot.operatorTenants || []).map((tenant) => <option key={tenant.tenantId} value={tenant.schoolId}>{tenant.label} · {tenant.status}</option>)}</select></label>
        <Link href="/angelcare-360-operator/tenants-product/constitution">Constitution produit</Link>
        <Link href="/angelcare-360-operator/tenants-product">Packages & pricing</Link>
        <button type="button" onClick={refresh} disabled={busy}><RefreshCcw size={17}/>{busy ? 'Synchronisation…' : 'Synchroniser'}</button>
      </div>
    </header>

    <section className={styles.authorityBand}>
      <article data-tone={snapshot.productRuntimeAuthority.enforced ? 'success' : 'critical'}><ShieldCheck/><span>Runtime authority</span><strong>{snapshot.productRuntimeAuthority.enforced ? 'ENFORCÉE' : 'NON ENFORCÉE'}</strong><small>{snapshot.entitlementState}</small></article>
      <article><DatabaseZap/><span>Package effectif</span><strong>{snapshot.productRuntimeAuthority.packageVersion || 'Non affecté'}</strong><small>Snapshot #{snapshot.productRuntimeAuthority.snapshotVersion || '—'}</small></article>
      <article><GitBranch/><span>Operations actives</span><strong>{snapshot.productRuntimeAuthority.enabledOperations}</strong><small>{snapshot.productRuntimeAuthority.enabledCapabilities} capabilities</small></article>
      <article><Gauge/><span>Mètres runtime</span><strong>{snapshot.productRuntimeAuthority.meteredLimits}</strong><small>{snapshot.productRuntimeAuthority.enabledModules} modules actifs</small></article>
    </section>

    <section className={styles.workspace}>
      <aside className={styles.domainRail}>
        <div className={styles.railTitle}><Workflow size={18}/><span>Domain maturity</span></div>
        <button type="button" data-active={selectedDomain === 'all'} onClick={() => setSelectedDomain('all')}><strong>Tous les domaines</strong><small>{snapshot.domainMaturity.length}</small></button>
        {snapshot.domainMaturity.map((item: ProductRealitySnapshot['domainMaturity'][number]) => <button type="button" key={item.key} data-active={selectedDomain === item.key} data-state={item.state} onClick={() => setSelectedDomain(item.key)}><strong>{item.label}</strong><span>{item.configuredPolicies} policy · {item.activeWorkflows} workflow</span><small>{item.openExceptions + item.pendingExecutions} ouvert</small></button>)}
      </aside>

      <section className={styles.mainCanvas}>
        <div className={styles.canvasHeader}><div><span>Shared execution fabric</span><h2>Operations registry & controlled execution</h2></div><input value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder="Rechercher opération, lifecycle, publication…"/></div>
        <div className={styles.operationGrid}>
          {operations.map((item: ProductRealityOperationDefinition) => <button type="button" key={item.operationKey} data-selected={draft.operationKey === item.operationKey} onClick={() => setDraft({ ...EMPTY_DRAFT, operationKey: item.operationKey })}>
            <span>{item.domain}</span><strong>{item.label}</strong><p>{item.description}</p><footer><code>{item.operationKey}</code><em>{item.operatorOnly ? 'Operator only' : item.requiresApproval ? 'Approbation' : 'Direct gouverné'}</em></footer>
          </button>)}
        </div>
      </section>

      <aside className={styles.queueRail}>
        <div className={styles.railTitle}><AlertTriangle size={18}/><span>Intervention queue</span></div>
        {snapshot.queues.length ? snapshot.queues.slice(0, 18).map((item: ProductRealityQueueItem) => <article key={`${item.domain}:${item.id}`} data-tone={severity(item.severity)}><span>{item.domain}</span><strong>{item.title}</strong><p>{item.detail || 'Aucun détail complémentaire.'}</p><footer><em>{item.status}</em>{item.operationKey ? <button type="button" onClick={() => setDraft({ ...EMPTY_DRAFT, operationKey: item.operationKey || '', entityId: item.entityId || item.id })}>Traiter <ArrowRight size={13}/></button> : null}</footer></article>) : <div className={styles.empty}><CheckCircle2 size={25}/><strong>Aucune intervention ouverte</strong><span>Les exceptions, approvals et corrections sont sous contrôle.</span></div>}
      </aside>
    </section>

    <section className={styles.runway}>
      <div><Activity size={18}/><span>Execution runway</span><strong>{notice || 'Sélectionnez une opération pour exécuter une mutation gouvernée.'}</strong></div>
      <div className={styles.recent}>{snapshot.recentExecutions.slice(0, 5).map((item: Record<string, unknown>) => <span key={String(item.id)} data-tone={severity(String(item.state))}>{String(item.operation_key)} · {String(item.state)}</span>)}</div>
    </section>

    {draft.operationKey ? <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => !busy && setDraft(EMPTY_DRAFT)}><section className={styles.commandChamber} role="dialog" aria-modal="true" aria-label="Exécuter une opération" onMouseDown={(event: MouseEvent<HTMLElement>) => event.stopPropagation()}>
      <header><div><span>CONTROLLED MUTATION</span><h2>{snapshot.operationDefinitions.find((item: ProductRealityOperationDefinition) => item.operationKey === draft.operationKey)?.label || draft.operationKey}</h2><p>{draft.operationKey}</p></div><button type="button" onClick={() => setDraft(EMPTY_DRAFT)} disabled={busy}><X/></button></header>
      <div className={styles.form}>
        <label>Identifiant de l’entité<input value={draft.entityId} onChange={(event: ChangeEvent<HTMLInputElement>) => setDraft((current: CommandDraft) => ({ ...current, entityId: event.target.value }))} placeholder="UUID ou vide pour création"/></label>
        <label>Motif gouverné<textarea value={draft.reason} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDraft((current: CommandDraft) => ({ ...current, reason: event.target.value }))} placeholder="Raison, preuve et impact attendu"/></label>
        <label>Payload JSON<textarea className={styles.code} value={draft.payload} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDraft((current: CommandDraft) => ({ ...current, payload: event.target.value }))}/></label>
      </div>
      <footer><span>Entitlement, permission, policy, capacité, idempotence, mutation et audit sont contrôlés côté serveur.</span><button type="button" onClick={execute} disabled={busy}><Play size={16}/>{busy ? 'Exécution…' : 'Valider et exécuter'}</button></footer>
    </section></div> : null}
  </main>
}
