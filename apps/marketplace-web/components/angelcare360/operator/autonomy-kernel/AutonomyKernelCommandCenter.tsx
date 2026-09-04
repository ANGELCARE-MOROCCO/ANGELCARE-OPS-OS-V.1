'use client'

import { useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  Boxes,
  Braces,
  CheckCircle2,
  ChevronRight,
  Database,
  FileCheck2,
  Gauge,
  GitBranch,
  Layers3,
  LockKeyhole,
  Network,
  PlayCircle,
  RefreshCw,
  Rocket,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import SanilaLogo from '@/components/brand/SanilaLogo'
import type {
  AutonomyKernelOperation,
  AutonomyKernelScene,
  AutonomyKernelSnapshot,
  KernelCertificationControl,
} from '@/types/angelcare360/operator/autonomy-kernel'
import styles from './AutonomyKernelCommandCenter.module.css'

type Props = {
  initialSnapshot: AutonomyKernelSnapshot
  activeScene: AutonomyKernelScene
}

type OperationDraft = {
  operation: AutonomyKernelOperation
  title: string
  description: string
  payload: Record<string, unknown>
}

const SCENES: Array<{ key: AutonomyKernelScene; index: string; label: string; subtitle: string; icon: typeof Activity }> = [
  { key: 'command', index: '01', label: 'Autonomy Command', subtitle: 'État, exceptions et changesets', icon: Activity },
  { key: 'metadata', index: '02', label: 'Metadata & Schemas', subtitle: 'Modèles, formulaires et validation', icon: Braces },
  { key: 'workflows', index: '03', label: 'Workflow Engine', subtitle: 'États, transitions, SLA', icon: GitBranch },
  { key: 'policies', index: '04', label: 'Policy & Rules', subtitle: 'Conditions, actions et autorité', icon: SlidersHorizontal },
  { key: 'entitlements', index: '05', label: 'Entitlement Compiler', subtitle: 'Droits effectifs et provisioning', icon: Layers3 },
  { key: 'metering', index: '06', label: 'Metering & Capacity', subtitle: 'Mesure, seuils et forecast', icon: Gauge },
  { key: 'extensions', index: '07', label: 'Extensions & Versions', subtitle: 'Manifests, releases et compatibilité', icon: Boxes },
  { key: 'reliability', index: '08', label: 'Reliability & Certification', subtitle: 'Preuves, recovery et production gate', icon: ShieldCheck },
]

const DEFAULT_OPERATION: OperationDraft = {
  operation: 'create_changeset',
  title: 'Nouveau changeset gouverné',
  description: 'Définir le changement, l’impact et le rollback avant approbation.',
  payload: { title: '', domain: 'platform', change_json: {}, impact_json: {}, rollback_json: {}, validation_json: {} },
}

export default function AutonomyKernelCommandCenter({ initialSnapshot, activeScene }: Props) {
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [drawer, setDrawer] = useState<OperationDraft | null>(null)
  const [selected, setSelected] = useState<{ type: string; data: Record<string, unknown> } | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const scene = SCENES.find((item) => item.key === activeScene) || SCENES[0]
  const mandatory = snapshot.certification_controls.filter((item) => item.criticality === 'mandatory')
  const passed = mandatory.filter((item) => item.status === 'passed').length
  const certificationPct = mandatory.length ? Math.round((passed / mandatory.length) * 100) : 0

  async function refresh() {
    setBusy(true)
    setFeedback(null)
    try {
      const response = await fetch('/api/angelcare360/operator/autonomy-kernel', { cache: 'no-store' })
      const result = await response.json() as { ok?: boolean; snapshot?: AutonomyKernelSnapshot; error?: string }
      if (!response.ok || !result.snapshot) throw new Error(result.error || 'Rafraîchissement impossible.')
      setSnapshot(result.snapshot)
      setFeedback('Snapshot Autonomy Kernel synchronisé.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Erreur de synchronisation.')
    } finally {
      setBusy(false)
    }
  }

  async function execute(draft: OperationDraft) {
    setBusy(true)
    setFeedback(null)
    try {
      const response = await fetch('/api/angelcare360/operator/autonomy-kernel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: draft.operation, payload: draft.payload }),
      })
      const result = await response.json() as { ok?: boolean; error?: string }
      if (!response.ok || result.ok === false) throw new Error(result.error || 'Opération refusée.')
      setDrawer(null)
      setFeedback(`${draft.title} exécuté avec succès.`)
      await refresh()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Erreur d’exécution.')
    } finally {
      setBusy(false)
    }
  }

  function openOperation(operation: AutonomyKernelOperation, title: string, description: string, payload: Record<string, unknown>) {
    setDrawer({ operation, title, description, payload })
  }

  return (
    <section className={styles.kernel} data-motion="finite">
      <header className={styles.crown}>
        <div className={styles.crownIdentity}>
          <SanilaLogo variant="white" width={152} height={54} className={styles.inverseLogo} priority />
          <div>
            <span className={styles.eyebrow}>SANILA OS · TEN-YEAR AUTONOMY KERNEL</span>
            <h1>Configurable Platform Authority</h1>
            <p>Transformer l’évolution ordinaire du SaaS en configuration versionnée, gouvernée, mesurée et réversible.</p>
          </div>
        </div>
        <div className={styles.crownState}>
          <div className={styles.certificationDial} data-certified={snapshot.production_certified ? 'yes' : 'no'}>
            <strong>{certificationPct}%</strong>
            <span>production evidence</span>
          </div>
          <div className={styles.crownFacts}>
            <div><span>Certification</span><strong>{snapshot.production_certified ? 'CERTIFIÉE' : 'NON CERTIFIÉE'}</strong></div>
            <div><span>Snapshot</span><strong>{new Date(snapshot.generated_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</strong></div>
            <div><span>Mode</span><strong>Gouverné / versionné</strong></div>
          </div>
        </div>
        <div className={styles.crownActions}>
          <button type="button" onClick={() => setDrawer(DEFAULT_OPERATION)} className={styles.primaryButton}><Rocket size={16} />Créer un changeset</button>
          <button type="button" onClick={refresh} disabled={busy} className={styles.secondaryButton}><RefreshCw size={16} />Synchroniser</button>
          <Link href="/angelcare-360-operator/tenants-product?view=packages" className={styles.secondaryButton}><Layers3 size={16} />Product Studio</Link>
        </div>
      </header>

      <nav className={styles.sceneRail} aria-label="Autonomy Kernel workspaces">
        {SCENES.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.key} href={`/angelcare-360-operator/platform/autonomy-kernel?view=${item.key}`} className={item.key === activeScene ? styles.sceneActive : styles.sceneLink}>
              <span className={styles.sceneIndex}>{item.index}</span>
              <Icon size={17} />
              <span><strong>{item.label}</strong><small>{item.subtitle}</small></span>
            </Link>
          )
        })}
      </nav>

      {feedback ? <div className={styles.feedback}><Activity size={15} />{feedback}<button type="button" onClick={() => setFeedback(null)} aria-label="Fermer"><X size={14} /></button></div> : null}

      <div className={styles.operatingHeader}>
        <div><span>{scene.index} · {scene.label}</span><h2>{scene.subtitle}</h2></div>
        <div className={styles.truthBadge} data-certified={snapshot.production_certified ? 'yes' : 'no'}>
          <ShieldCheck size={17} />
          <span>{snapshot.certification_reason}</span>
        </div>
      </div>

      {activeScene === 'command' ? <CommandScene snapshot={snapshot} onSelect={setSelected} onOpen={openOperation} /> : null}
      {activeScene === 'metadata' ? <MetadataScene snapshot={snapshot} onSelect={setSelected} onOpen={openOperation} /> : null}
      {activeScene === 'workflows' ? <WorkflowScene snapshot={snapshot} onSelect={setSelected} onOpen={openOperation} /> : null}
      {activeScene === 'policies' ? <PolicyScene snapshot={snapshot} onSelect={setSelected} onOpen={openOperation} /> : null}
      {activeScene === 'entitlements' ? <EntitlementScene snapshot={snapshot} onSelect={setSelected} onOpen={openOperation} /> : null}
      {activeScene === 'metering' ? <MeteringScene snapshot={snapshot} onSelect={setSelected} onOpen={openOperation} /> : null}
      {activeScene === 'extensions' ? <ExtensionsScene snapshot={snapshot} onSelect={setSelected} onOpen={openOperation} /> : null}
      {activeScene === 'reliability' ? <ReliabilityScene snapshot={snapshot} onSelect={setSelected} onOpen={openOperation} /> : null}

      <KernelRunway snapshot={snapshot} onSelect={setSelected} />
      {selected ? <Inspector selection={selected} onClose={() => setSelected(null)} onOpen={openOperation} /> : null}
      {drawer ? <OperationDrawer draft={drawer} setDraft={setDrawer} onClose={() => setDrawer(null)} onExecute={execute} busy={busy} snapshot={snapshot} /> : null}
    </section>
  )
}

type SceneProps = {
  snapshot: AutonomyKernelSnapshot
  onSelect: (selection: { type: string; data: Record<string, unknown> }) => void
  onOpen: (operation: AutonomyKernelOperation, title: string, description: string, payload: Record<string, unknown>) => void
}

function SectionHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className={styles.sectionHeader}><div><span>{eyebrow}</span><h3>{title}</h3><p>{description}</p></div>{action}</div>
}

function CommandScene({ snapshot, onSelect, onOpen }: SceneProps) {
  const exceptions = [
    ...snapshot.provisioning_jobs.filter((item) => ['failed', 'dead_letter'].includes(item.status)).map((item) => ({ type: 'Provisioning', title: item.job_code, detail: item.operation, tone: 'critical', data: item as unknown as Record<string, unknown> })),
    ...snapshot.capacity_snapshots.filter((item) => Number(item.pressure_pct || 0) >= 90).map((item) => ({ type: 'Capacity', title: item.meter_key, detail: `${Number(item.pressure_pct || 0).toFixed(1)}% · ${item.state}`, tone: 'warning', data: item as unknown as Record<string, unknown> })),
    ...snapshot.certification_controls.filter((item) => item.criticality === 'mandatory' && item.status !== 'passed').map((item) => ({ type: 'Certification', title: item.control_name, detail: item.status, tone: item.status === 'failed' ? 'critical' : 'warning', data: item as unknown as Record<string, unknown> })),
  ].slice(0, 10)

  const pipeline = [
    { label: 'Draft change', value: snapshot.changesets.filter((item) => item.status === 'draft').length, detail: 'Impact et rollback à compléter' },
    { label: 'Submitted', value: snapshot.changesets.filter((item) => item.status === 'submitted').length, detail: 'Décision d’autorité attendue' },
    { label: 'Approved', value: snapshot.changesets.filter((item) => item.status === 'approved').length, detail: 'Planification possible' },
    { label: 'Executing', value: snapshot.changesets.filter((item) => ['scheduled', 'executing'].includes(item.status)).length, detail: 'Release sous contrôle' },
    { label: 'Verified', value: snapshot.changesets.filter((item) => item.status === 'verified').length, detail: 'Preuve et audit fermés' },
  ]

  return (
    <div className={styles.commandGrid}>
      <aside className={styles.queuePanel}>
        <SectionHeader eyebrow="CONTROL & EXCEPTION QUEUE" title="Interventions obligatoires" description="Échecs, pression, preuves manquantes et décisions non résolues." />
        <div className={styles.queueList}>
          {exceptions.length ? exceptions.map((item, index) => (
            <button key={`${item.type}-${index}`} type="button" className={styles.queueItem} data-tone={item.tone} onClick={() => onSelect({ type: item.type, data: item.data })}>
              <span>{item.type}</span><strong>{item.title}</strong><small>{item.detail}</small><ChevronRight size={16} />
            </button>
          )) : <div className={styles.emptyState}><CheckCircle2 size={22} /><strong>Aucune exception active</strong><span>Les contrôles n’ont détecté aucun blocage sur ce snapshot.</span></div>}
        </div>
      </aside>

      <main className={styles.controlCanvas}>
        <SectionHeader eyebrow="AUTONOMY CONTROL PLANE" title="Configuration-to-runtime governance" description="Chaque évolution suit une chaîne explicable : définition, validation, décision, exécution, vérification et preuve." action={<button type="button" className={styles.inlineButton} onClick={() => onOpen('create_changeset', 'Créer un changeset', 'Structurer un changement avant toute mutation.', DEFAULT_OPERATION.payload)}>+ Changeset</button>} />
        <div className={styles.engineFlow}>
          {[
            ['Define', 'Metadata / policy / workflow'],
            ['Validate', 'Schema / dependency / compatibility'],
            ['Approve', 'Authority and evidence'],
            ['Compile', 'Effective tenant truth'],
            ['Provision', 'Durable jobs and retries'],
            ['Verify', 'Runtime, capacity and certification'],
          ].map(([label, detail], index) => (
            <div key={label} className={styles.engineNode}><span>{String(index + 1).padStart(2, '0')}</span><strong>{label}</strong><small>{detail}</small>{index < 5 ? <ArrowRight size={16} /> : null}</div>
          ))}
        </div>
        <div className={styles.metricMatrix}>
          {snapshot.metrics.map((metric) => <article key={metric.key} data-tone={metric.tone}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small></article>)}
        </div>
        <div className={styles.changePipeline}>
          {pipeline.map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.detail}</small></article>)}
        </div>
      </main>

      <aside className={styles.insightPanel}>
        <SectionHeader eyebrow="CERTIFICATION TRUTH" title="Production gate" description="Le système reste NON CERTIFIÉ tant que chaque contrôle obligatoire n’a pas une preuve valide." />
        <CertificationRing snapshot={snapshot} />
        <div className={styles.freshnessList}>
          {snapshot.freshness.map((item) => <div key={item.source} data-state={item.state}><span>{item.source}</span><strong>{item.state}</strong><small>{item.latest_at ? new Date(item.latest_at).toLocaleString('fr-FR') : 'Aucune preuve'}</small></div>)}
        </div>
      </aside>
    </div>
  )
}

function CertificationRing({ snapshot }: { snapshot: AutonomyKernelSnapshot }) {
  const mandatory = snapshot.certification_controls.filter((item) => item.criticality === 'mandatory')
  const passed = mandatory.filter((item) => item.status === 'passed').length
  const pct = mandatory.length ? Math.round(passed / mandatory.length * 100) : 0
  return <div className={styles.certRing} style={{ '--certification': `${pct * 3.6}deg` } as CSSProperties}><div><strong>{pct}%</strong><span>{passed}/{mandatory.length} mandatory</span></div></div>
}

function MetadataScene({ snapshot, onSelect, onOpen }: SceneProps) {
  return (
    <div className={styles.splitScene}>
      <section className={styles.primaryPanel}>
        <SectionHeader eyebrow="METADATA REGISTRY" title="Canonical definitions and immutable versions" description="Les formulaires, champs, validations et compatibilités deviennent des données gouvernées plutôt que du JSX codé." action={<button type="button" className={styles.inlineButton} onClick={() => onOpen('create_metadata_definition', 'Créer une définition', 'Enregistrer un nouveau type configurable.', { key: '', name: '', domain: 'operations', entity_type: '', description: '', owner_role: 'operator_admin' })}>+ Définition</button>} />
        <div className={styles.registryTable}>
          <div className={styles.tableHead}><span>Canonical code</span><span>Entity</span><span>Version</span><span>Lifecycle</span><span>Owner</span></div>
          {snapshot.metadata_definitions.map((item) => <button type="button" key={item.id} className={styles.tableRow} onClick={() => onSelect({ type: 'Metadata definition', data: item as unknown as Record<string, unknown> })}><strong>{item.key}</strong><span>{item.entity_type}</span><span>v{item.current_version}</span><span data-status={item.lifecycle_status}>{item.lifecycle_status}</span><span>{item.owner_role || '—'}</span></button>)}
          {!snapshot.metadata_definitions.length ? <div className={styles.emptyState}><Database size={22} /><strong>Registry vide</strong><span>Créez la première définition pour commencer à externaliser la configuration métier.</span></div> : null}
        </div>
      </section>
      <aside className={styles.secondaryPanel}>
        <SectionHeader eyebrow="SCHEMA RELEASE" title="Publish a governed version" description="Le checksum et les dates effectives rendent chaque évolution reconstructible." />
        <button type="button" className={styles.commandCard} disabled={!snapshot.metadata_definitions.length} onClick={() => onOpen('publish_metadata_version', 'Publier une version de schéma', 'Définir structure, rendu, validation et compatibilité.', { definition_id: snapshot.metadata_definitions[0]?.id || '', schema_json: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } }, ui_schema_json: {}, validation_json: {}, compatibility_json: {}, publish_now: true })}><Braces size={20} /><span><strong>Schema version studio</strong><small>JSON Schema · UI Schema · Validation · Compatibility</small></span><ArrowRight size={16} /></button>
        <div className={styles.versionStack}>{snapshot.metadata_versions.slice(0, 8).map((item) => <button type="button" key={item.id} onClick={() => onSelect({ type: 'Metadata version', data: item as unknown as Record<string, unknown> })}><span>v{item.version_number}</span><strong>{item.status}</strong><small>{item.checksum.slice(0, 12)}</small></button>)}</div>
      </aside>
    </div>
  )
}

function WorkflowScene({ snapshot, onSelect, onOpen }: SceneProps) {
  return (
    <div className={styles.workflowScene}>
      <section className={styles.primaryPanel}>
        <SectionHeader eyebrow="VERSIONED WORKFLOW ENGINE" title="States, transitions, guards, SLA and automation" description="Les cycles métier sont versionnés afin que les dossiers historiques conservent leurs règles d’origine." action={<button type="button" className={styles.inlineButton} onClick={() => onOpen('create_workflow_definition', 'Créer un workflow', 'Définir le domaine et le type d’entité piloté.', { key: '', name: '', domain: 'service', entity_type: 'service_request' })}>+ Workflow</button>} />
        <div className={styles.workflowRail}>
          {['Received', 'Qualified', 'Approved', 'Executing', 'Verified', 'Closed'].map((state, index) => <div key={state}><span>{String(index + 1).padStart(2, '0')}</span><strong>{state}</strong><small>{index === 0 ? 'Entry' : index === 5 ? 'Evidence locked' : 'Role + guard + SLA'}</small>{index < 5 ? <ArrowRight size={16} /> : null}</div>)}
        </div>
        <div className={styles.definitionGrid}>{snapshot.workflow_definitions.map((item) => <button type="button" key={item.id} onClick={() => onSelect({ type: 'Workflow', data: item as unknown as Record<string, unknown> })}><GitBranch size={18} /><span><strong>{item.name}</strong><small>{item.key} · {item.entity_type}</small></span><em>v{item.current_version}</em></button>)}</div>
      </section>
      <aside className={styles.secondaryPanel}>
        <SectionHeader eyebrow="TRANSITION CONTRACT" title="No blind status changes" description="Une transition ne passe que si l’état source, la garde, le rôle et la preuve sont valides." />
        <button type="button" className={styles.commandCard} disabled={!snapshot.workflow_definitions.length} onClick={() => onOpen('publish_workflow_version', 'Publier une version workflow', 'Créer états, transitions, SLA et automatisations.', { definition_id: snapshot.workflow_definitions[0]?.id || '', states_json: [{ key: 'draft', label: 'Draft' }, { key: 'approved', label: 'Approved' }], transitions_json: [{ key: 'approve', from: 'draft', to: 'approved', guard: { operator: 'exists', path: 'evidence' } }], sla_json: {}, automation_json: [], publish_now: true })}><PlayCircle size={20} /><span><strong>Workflow version studio</strong><small>Guards déterministes et transitions auditées</small></span><ArrowRight size={16} /></button>
        <button type="button" className={styles.commandCard} disabled={!snapshot.workflow_versions.length} onClick={() => onOpen('start_workflow_instance', 'Démarrer une instance', 'Lier un sujet métier à une version immuable.', { workflow_version_id: snapshot.workflow_versions[0]?.id || '', subject_type: '', subject_id: '', initial_state: '', context_json: {} })}><GitBranch size={20} /><span><strong>Start governed instance</strong><small>Version binding and append-only start event</small></span><ArrowRight size={16} /></button>
        <div className={styles.controlNote}><LockKeyhole size={18} /><div><strong>Historical reconstruction</strong><span>Les instances restent attachées à leur version de workflow.</span></div></div>
      </aside>
    </div>
  )
}

function PolicyScene({ snapshot, onSelect, onOpen }: SceneProps) {
  return (
    <div className={styles.policyScene}>
      <section className={styles.primaryPanel}>
        <SectionHeader eyebrow="DETERMINISTIC POLICY ENGINE" title="Explainable conditions and governed actions" description="Les doctrines deviennent des règles configurables avec entrée, résultat, preuve, autorité et exception." action={<button type="button" className={styles.inlineButton} onClick={() => onOpen('create_policy_definition', 'Créer une politique', 'Définir le domaine et le périmètre de décision.', { key: '', name: '', domain: 'tenant-governance', scope_type: 'tenant' })}>+ Politique</button>} />
        <div className={styles.policyFlow}>
          <article><span>WHEN</span><strong>capacity.pressure ≥ 90</strong><small>Condition versionnée</small></article>
          <ArrowRight size={20} />
          <article><span>AND</span><strong>tenant.status = active</strong><small>Context evaluation</small></article>
          <ArrowRight size={20} />
          <article><span>THEN</span><strong>Create intervention signal</strong><small>Controlled action</small></article>
          <ArrowRight size={20} />
          <article><span>AUTHORITY</span><strong>Operator approval</strong><small>Audit evidence</small></article>
        </div>
        <div className={styles.definitionGrid}>{snapshot.policy_definitions.map((item) => <button type="button" key={item.id} onClick={() => onSelect({ type: 'Policy', data: item as unknown as Record<string, unknown> })}><Settings2 size={18} /><span><strong>{item.name}</strong><small>{item.key} · {item.scope_type}</small></span><em>v{item.current_version}</em></button>)}</div>
      </section>
      <aside className={styles.secondaryPanel}>
        <SectionHeader eyebrow="RULE RELEASE" title="Conditions, actions and authority" description="L’évaluateur supporte exists, eq, neq, gt, gte, lt, lte, in, contains, and, or et not." />
        <button type="button" className={styles.commandCard} disabled={!snapshot.policy_definitions.length} onClick={() => onOpen('publish_policy_version', 'Publier une politique', 'Configurer la condition, les actions et l’autorité.', { definition_id: snapshot.policy_definitions[0]?.id || '', condition_json: { operator: 'gte', path: 'capacity.pressure_pct', value: 90 }, actions_json: [{ type: 'create_signal', severity: 'warning' }], authority_json: { role: 'operator_admin' }, exception_json: {}, publish_now: true })}><SlidersHorizontal size={20} /><span><strong>Policy version studio</strong><small>Simulation before publication</small></span><ArrowRight size={16} /></button>
        <div className={styles.controlNote}><FileCheck2 size={18} /><div><strong>Evidence-first evaluation</strong><span>Chaque résultat conserve l’entrée, la sortie, la version et les preuves.</span></div></div>
      </aside>
    </div>
  )
}

function EntitlementScene({ snapshot, onSelect, onOpen }: SceneProps) {
  const jobs = snapshot.provisioning_jobs.slice(0, 12)
  return (
    <div className={styles.entitlementScene}>
      <section className={styles.primaryPanel}>
        <SectionHeader eyebrow="EFFECTIVE ENTITLEMENT TRUTH" title="Contract → assignment → snapshot → runtime verification" description="Le kernel enveloppe le compilateur canonique Product Kernel sans dupliquer les règles d’entitlement." action={<Link href="/angelcare-360-operator/tenants-product?view=deployments" className={styles.inlineButton}>Ouvrir Product Studio</Link>} />
        <div className={styles.entitlementTwin}>
          {[
            ['CONTRACTED', 'Commercial source of truth', 'contract'],
            ['ASSIGNED', 'Package, add-ons, overrides', 'assigned'],
            ['COMPILED', 'Canonical effective snapshot', 'compiled'],
            ['PROVISIONED', 'Durable job execution', 'provisioned'],
            ['VERIFIED', 'Runtime and customer availability', 'verified'],
          ].map(([label, detail, state], index) => <article key={label} data-state={state}><span>{String(index + 1).padStart(2, '0')}</span><strong>{label}</strong><small>{detail}</small>{index < 4 ? <ArrowRight size={16} /> : null}</article>)}
        </div>
        <div className={styles.jobTable}>
          <div className={styles.tableHead}><span>Job</span><span>Operation</span><span>Status</span><span>Attempts</span><span>Next attempt</span></div>
          {jobs.map((item) => <button type="button" key={item.id} className={styles.tableRow} onClick={() => onSelect({ type: 'Provisioning job', data: item as unknown as Record<string, unknown> })}><strong>{item.job_code}</strong><span>{item.operation}</span><span data-status={item.status}>{item.status}</span><span>{item.attempts}/{item.max_attempts}</span><span>{item.next_attempt_at ? new Date(item.next_attempt_at).toLocaleString('fr-FR') : '—'}</span></button>)}
          {!jobs.length ? <div className={styles.emptyState}><Network size={22} /><strong>Aucun job provisioning</strong><span>Les compilations futures créeront des jobs idempotents et vérifiables.</span></div> : null}
        </div>
      </section>
      <aside className={styles.secondaryPanel}>
        <SectionHeader eyebrow="DURABLE EXECUTION" title="Retry, dead-letter and outbox" description="Les échecs ne disparaissent pas : ils sont relancés, expliqués ou isolés." />
        <div className={styles.statusStack}>
          {['queued', 'running', 'verification', 'completed', 'failed', 'dead_letter'].map((status) => <div key={status}><span>{status}</span><strong>{snapshot.provisioning_jobs.filter((item) => item.status === status).length}</strong></div>)}
        </div>
        <button type="button" className={styles.commandCard} onClick={() => onOpen('queue_provisioning_job', 'Créer un job de vérification', 'Créer un job idempotent rattaché à un snapshot compilé.', { tenant_id: '', entitlement_snapshot_id: '', operation: 'verify_compiled_entitlements', idempotency_key: '', max_attempts: 5, payload_json: {} })}><Network size={20} /><span><strong>Provisioning queue</strong><small>Job durable avec retry contrôlé</small></span><ArrowRight size={16} /></button>
      </aside>
    </div>
  )
}

function MeteringScene({ snapshot, onSelect, onOpen }: SceneProps) {
  return (
    <div className={styles.meteringScene}>
      <section className={styles.primaryPanel}>
        <SectionHeader eyebrow="METERING & CAPACITY ENGINE" title="Trusted consumption, pressure and commercial signals" description="Chaque capacité possède unité, source, allowance, seuils, forecast, fraîcheur et confiance." action={<div className={styles.headerActions}><button type="button" className={styles.inlineButton} onClick={() => onOpen('create_meter_definition', 'Créer un compteur', 'Définir unité, source, allowance et seuils.', { meter_key: '', name: '', unit: 'units', aggregation_method: 'sum', reset_schedule: 'monthly', measurement_source: '', default_included_quantity: 0, soft_limit_pct: 70, warning_limit_pct: 90, critical_limit_pct: 95, hard_limit_pct: 100 })}>+ Compteur</button><button type="button" className={styles.inlineButton} onClick={() => onOpen('record_meter_sample', 'Enregistrer une mesure', 'Ajouter un échantillon idempotent puis recalculer la pression.', { tenant_id: '', meter_key: snapshot.meter_definitions[0]?.meter_key || '', quantity: 0, source: 'operator_manual', confidence_pct: 100, dimensions_json: {} })}>+ Mesure</button></div>} />
        <div className={styles.capacityField}>
          {snapshot.capacity_snapshots.slice(0, 16).map((item) => {
            const pressure = Math.min(140, Number(item.pressure_pct || 0))
            return <button type="button" key={item.id} className={styles.capacityUnit} data-state={item.state} onClick={() => onSelect({ type: 'Capacity snapshot', data: item as unknown as Record<string, unknown> })}><div><span>{item.meter_key}</span><strong>{pressure.toFixed(1)}%</strong></div><div className={styles.capacityTrack}><i style={{ width: `${Math.min(100, pressure)}%` }} /></div><small>{Number(item.consumed_quantity || 0).toLocaleString('fr-FR')} / {Number(item.included_quantity || 0).toLocaleString('fr-FR')} · forecast {Number(item.forecast_quantity || 0).toLocaleString('fr-FR')}</small></button>
          })}
          {!snapshot.capacity_snapshots.length ? <div className={styles.emptyState}><Gauge size={22} /><strong>Aucun snapshot capacité</strong><span>Publiez des définitions de compteurs puis injectez les premières mesures fiables.</span></div> : null}
        </div>
      </section>
      <aside className={styles.secondaryPanel}>
        <SectionHeader eyebrow="CAPACITY LEDGER" title="Meter definitions" description="Les compteurs rendent les limites, top-ups, overages et expansion mesurables." />
        <div className={styles.meterList}>{snapshot.meter_definitions.map((item) => <button type="button" key={item.id} onClick={() => onSelect({ type: 'Meter definition', data: item as unknown as Record<string, unknown> })}><Gauge size={17} /><span><strong>{item.name}</strong><small>{item.meter_key} · {item.unit} · {item.measurement_source}</small></span></button>)}</div>
        <div className={styles.thresholdLegend}><span data-threshold="watch">70% Watch</span><span data-threshold="warning">90% Warning</span><span data-threshold="critical">95% Critical</span><span data-threshold="blocked">100% Hard limit</span></div>
      </aside>
    </div>
  )
}

function ExtensionsScene({ snapshot, onSelect, onOpen }: SceneProps) {
  return (
    <div className={styles.extensionScene}>
      <section className={styles.primaryPanel}>
        <SectionHeader eyebrow="GOVERNED EXTENSION REGISTRY" title="Modules evolve without destabilizing the core" description="Routes, permissions, jobs, reports et compatibilité sont déclarés dans un manifest versionné." action={<button type="button" className={styles.inlineButton} onClick={() => onOpen('register_extension', 'Enregistrer une extension', 'Déclarer un module interne avec ses contrats.', { extension_key: '', name: '', description: '', current_version: '0.1.0', manifest_json: { minimum_core_version: '1.0.0', routes: [], jobs: [], permissions: [] }, platform_context_json: { core_version: '1.0.0', permissions: [] } })}>+ Extension</button>} />
        <div className={styles.extensionRegistry}>
          {snapshot.extensions.map((item) => <button type="button" key={item.id} data-compatibility={item.compatibility_status} onClick={() => onSelect({ type: 'Extension manifest', data: item as unknown as Record<string, unknown> })}><div><Boxes size={18} /><span><strong>{item.name}</strong><small>{item.extension_key}</small></span></div><em>v{item.current_version}</em><span>{item.compatibility_status}</span></button>)}
          {!snapshot.extensions.length ? <div className={styles.emptyState}><Boxes size={22} /><strong>Aucune extension gouvernée</strong><span>Le registry est prêt à recevoir des modules internes sans modifier le noyau.</span></div> : null}
        </div>
        <div className={styles.releaseChannels}>{['Internal', 'Pilot', 'Limited', 'General availability', 'Maintenance', 'Deprecated'].map((item, index) => <article key={item}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong><small>{index < 3 ? 'Controlled cohort' : index === 3 ? 'Production release' : 'Lifecycle governance'}</small></article>)}</div>
      </section>
      <aside className={styles.secondaryPanel}>
        <SectionHeader eyebrow="VERSION & RELEASE" title="Compatibility before publication" description="Une extension ne peut pas être publiée sans vérifier core, permissions, routes, jobs et rollback." />
        <button type="button" className={styles.commandCard} onClick={() => onOpen('create_release_candidate', 'Créer une release candidate', 'Préparer canal, scope, rollout, vérification et rollback.', { name: '', version: '1.0.0', channel: 'internal', scope_json: {}, rollout_json: { cohort: 'internal' }, rollback_json: {}, verification_json: {} })}><Rocket size={20} /><span><strong>Release candidate</strong><small>Impact, cohort and rollback required</small></span><ArrowRight size={16} /></button>
        <div className={styles.controlNote}><GitBranch size={18} /><div><strong>Version governance</strong><span>Les releases sont séparées des manifests et des assignments tenant.</span></div></div>
      </aside>
    </div>
  )
}

function ReliabilityScene({ snapshot, onSelect, onOpen }: SceneProps) {
  const controlsByDomain = useMemo(() => {
    return snapshot.certification_controls.reduce<Record<string, KernelCertificationControl[]>>((acc, item) => {
      acc[item.domain] = [...(acc[item.domain] || []), item]
      return acc
    }, {})
  }, [snapshot.certification_controls])

  return (
    <div className={styles.reliabilityScene}>
      <section className={styles.primaryPanel}>
        <SectionHeader eyebrow="PRODUCTION CERTIFICATION LEDGER" title="Evidence decides readiness—not visual completion" description="Chaque contrôle obligatoire doit être prouvé, daté, attribué et renouvelé avant certification." />
        <div className={styles.certificationBanner} data-certified={snapshot.production_certified ? 'yes' : 'no'}><ShieldCheck size={34} /><div><span>Current production verdict</span><strong>{snapshot.production_certified ? 'PRODUCTION DEEP CERTIFIED' : 'NOT YET PRODUCTION CERTIFIED'}</strong><p>{snapshot.certification_reason}</p></div></div>
        <div className={styles.controlDomains}>
          {Object.entries(controlsByDomain).map(([domain, controls]) => <article key={domain}><header><span>{domain}</span><strong>{controls.filter((item) => item.status === 'passed').length}/{controls.length}</strong></header>{controls.map((item) => <button type="button" key={item.id} data-status={item.status} onClick={() => onSelect({ type: 'Certification control', data: item as unknown as Record<string, unknown> })}><span>{item.control_key}</span><strong>{item.control_name}</strong><small>{item.evidence_required}</small><em>{item.status}</em></button>)}</article>)}
        </div>
      </section>
      <aside className={styles.secondaryPanel}>
        <SectionHeader eyebrow="RECOVERY REHEARSAL" title="RPO/RTO must be demonstrated" description="Les backups ne comptent que si une restauration a été répétée et mesurée." />
        <button type="button" className={styles.commandCard} onClick={() => onOpen('create_recovery_rehearsal', 'Planifier une répétition', 'Définir le périmètre et les objectifs RPO/RTO.', { scope: 'database-restore', target_rpo_minutes: 15, target_rto_minutes: 60, evidence_json: {} })}><RefreshCw size={20} /><span><strong>New recovery rehearsal</strong><small>Backup restore · queue recovery · disaster plan</small></span><ArrowRight size={16} /></button>
        <button type="button" className={styles.commandCard} onClick={() => onOpen('create_runbook', 'Créer un runbook', 'Définir étapes opératoires et rollback.', { runbook_key: '', name: '', domain: 'reliability', owner_role: 'operator_admin', steps_json: [{ order: 1, action: 'verify' }], rollback_json: {} })}><FileCheck2 size={20} /><span><strong>Runbook registry</strong><small>Executable steps and rollback doctrine</small></span><ArrowRight size={16} /></button>
        <div className={styles.rehearsalList}>{snapshot.recovery_rehearsals.map((item) => <button type="button" key={item.id} onClick={() => onSelect({ type: 'Recovery rehearsal', data: item as unknown as Record<string, unknown> })}><span>{item.rehearsal_code}</span><strong>{item.scope}</strong><small>RPO {item.actual_rpo_minutes ?? '—'}/{item.target_rpo_minutes ?? '—'} min · RTO {item.actual_rto_minutes ?? '—'}/{item.target_rto_minutes ?? '—'} min</small><em data-status={item.status}>{item.status}</em></button>)}</div>
        <button type="button" className={styles.commandCard} disabled={!snapshot.certification_controls.length} onClick={() => onOpen('record_control_evidence', 'Enregistrer une preuve', 'Mettre à jour un contrôle avec preuve et expiration.', { control_id: snapshot.certification_controls[0]?.id || '', status: 'in_progress', evidence_json: {}, evidence_uri: '', expires_at: '' })}><FileCheck2 size={20} /><span><strong>Record control evidence</strong><small>No green status without traceable proof</small></span><ArrowRight size={16} /></button>
      </aside>
    </div>
  )
}

function KernelRunway({ snapshot, onSelect }: { snapshot: AutonomyKernelSnapshot; onSelect: (selection: { type: string; data: Record<string, unknown> }) => void }) {
  const items: Array<{ type: string; label: string; status: string; detail: string; data: Record<string, unknown> }> = [
    ...snapshot.changesets.slice(0, 3).map((item) => ({ type: 'Changeset', label: item.changeset_code, status: item.status, detail: item.title, data: item as unknown as Record<string, unknown> })),
    ...snapshot.provisioning_jobs.filter((item) => item.status !== 'completed').slice(0, 3).map((item) => ({ type: 'Provisioning', label: item.job_code, status: item.status, detail: item.operation, data: item as unknown as Record<string, unknown> })),
    ...snapshot.certification_controls.filter((item) => item.criticality === 'mandatory' && item.status !== 'passed').slice(0, 3).map((item) => ({ type: 'Certification', label: item.control_key, status: item.status, detail: item.control_name, data: item as unknown as Record<string, unknown> })),
  ]
  return <section className={styles.runway}><header><Network size={17} /><div><span>CHANGESET · PROVISIONING · CERTIFICATION RUNWAY</span><strong>Nothing moves without impact, authority, execution and evidence</strong></div></header><div>{items.length ? items.map((item, index) => <button type="button" key={`${item.type}-${item.label}-${index}`} onClick={() => onSelect({ type: item.type, data: item.data })}><span>{item.type}</span><strong>{item.label}</strong><small>{item.detail}</small><em data-status={item.status}>{item.status}</em></button>) : <div className={styles.runwayEmpty}>Aucun changement, job ou contrôle en attente.</div>}</div></section>
}

function Inspector({ selection, onClose, onOpen }: {
  selection: { type: string; data: Record<string, unknown> }
  onClose: () => void
  onOpen: (operation: AutonomyKernelOperation, title: string, description: string, payload: Record<string, unknown>) => void
}) {
  const entries = Object.entries(selection.data).filter(([, value]) => value !== null && value !== undefined).slice(0, 18)
  const id = String(selection.data.id || '')
  const status = String(selection.data.status || '')
  const actions: Array<{ operation: AutonomyKernelOperation; label: string; description: string; payload: Record<string, unknown> }> = []
  if (selection.type === 'Changeset' && status === 'draft') actions.push({ operation: 'submit_changeset', label: 'Soumettre', description: 'Valider impact et rollback puis soumettre à autorité.', payload: { changeset_id: id } })
  if (selection.type === 'Changeset' && status === 'submitted') {
    actions.push({ operation: 'approve_changeset', label: 'Approuver', description: 'Enregistrer une décision d’autorité traçable.', payload: { changeset_id: id, reason: '' } })
    actions.push({ operation: 'reject_changeset', label: 'Rejeter', description: 'Rejeter le changeset avec motif obligatoire.', payload: { changeset_id: id, reason: '' } })
  }
  if (selection.type === 'Changeset' && status === 'approved') actions.push({ operation: 'schedule_changeset', label: 'Planifier', description: 'Définir la date effective avant exécution.', payload: { changeset_id: id, effective_at: '' } })
  if (selection.type === 'Changeset' && status === 'scheduled') actions.push({ operation: 'start_changeset_execution', label: 'Démarrer', description: 'Démarrer l’exécution gouvernée du changeset.', payload: { changeset_id: id } })
  if (selection.type === 'Changeset' && status === 'executing') {
    actions.push({ operation: 'verify_changeset', label: 'Vérifier', description: 'Fermer l’exécution avec preuve structurée.', payload: { changeset_id: id, verification_json: {} } })
    actions.push({ operation: 'rollback_changeset', label: 'Rollback', description: 'Exécuter le plan de retour arrière avec preuve.', payload: { changeset_id: id, reason: '', rollback_evidence_json: {} } })
  }
  if (selection.type === 'Changeset' && status === 'verified') actions.push({ operation: 'rollback_changeset', label: 'Rollback post-vérification', description: 'Revenir en arrière avec autorité et preuve.', payload: { changeset_id: id, reason: '', rollback_evidence_json: {} } })
  if (selection.type === 'Provisioning' && ['failed', 'dead_letter'].includes(status)) actions.push({ operation: 'retry_provisioning_job', label: 'Relancer', description: 'Réinitialiser les tentatives et remettre le job en queue.', payload: { job_id: id } })
  if (selection.type === 'Certification' || selection.type === 'Certification control') actions.push({ operation: 'record_control_evidence', label: 'Ajouter une preuve', description: 'Enregistrer verdict, preuve et expiration.', payload: { control_id: id, status: 'in_progress', evidence_json: {}, evidence_uri: '', expires_at: '' } })
  if (selection.type === 'Recovery rehearsal') actions.push({ operation: 'update_recovery_rehearsal', label: 'Mettre à jour', description: 'Enregistrer résultat et RPO/RTO réels.', payload: { rehearsal_id: id, status: 'running', actual_rpo_minutes: 0, actual_rto_minutes: 0, evidence_json: {} } })
  return <div className={styles.overlay} role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose() }}><aside className={styles.inspector} role="dialog" aria-modal="true" aria-label={`${selection.type} inspector`}><header><div><span>ENGINEERING INSPECTOR</span><h3>{selection.type}</h3></div><button type="button" onClick={onClose} aria-label="Fermer"><X size={18} /></button></header><div className={styles.inspectorBody}>{entries.map(([key, value]) => <div key={key}><span>{key.replaceAll('_', ' ')}</span>{typeof value === 'object' ? <pre>{JSON.stringify(value, null, 2)}</pre> : <strong>{String(value)}</strong>}</div>)}</div><footer>{actions.map((action) => <button type="button" key={action.operation} className={styles.primaryButton} onClick={() => { onClose(); onOpen(action.operation, action.label, action.description, action.payload) }}>{action.label}</button>)}<button type="button" className={styles.secondaryButton} onClick={onClose}>Fermer</button></footer></aside></div>
}

function OperationDrawer({ draft, setDraft, onClose, onExecute, busy, snapshot }: {
  draft: OperationDraft
  setDraft: (draft: OperationDraft | null) => void
  onClose: () => void
  onExecute: (draft: OperationDraft) => void
  busy: boolean
  snapshot: AutonomyKernelSnapshot
}) {
  function update(key: string, value: unknown) {
    setDraft({ ...draft, payload: { ...draft.payload, [key]: value } })
  }

  const fields = operationFields(draft.operation, snapshot)
  return <div className={styles.overlay} role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose() }}><aside className={styles.drawer} role="dialog" aria-modal="true" aria-label={draft.title}><header><div><span>AUTONOMY COMMAND CHAMBER</span><h3>{draft.title}</h3><p>{draft.description}</p></div><button type="button" onClick={onClose} aria-label="Fermer"><X size={18} /></button></header><div className={styles.drawerBody}><div className={styles.impactStrip}><ShieldCheck size={18} /><div><strong>Governed mutation</strong><span>Permission, validation, audit and effective data are enforced server-side.</span></div></div><div className={styles.formGrid}>{fields.map((field) => <FormField key={field.key} field={field} value={draft.payload[field.key]} onChange={(value) => update(field.key, value)} />)}</div></div><footer><button type="button" className={styles.secondaryButton} onClick={onClose}>Annuler</button><button type="button" className={styles.primaryButton} disabled={busy} onClick={() => onExecute(draft)}>{busy ? <RefreshCw size={16} /> : <CheckCircle2 size={16} />}{busy ? 'Exécution…' : 'Valider et auditer'}</button></footer></aside></div>
}

type FieldDefinition = { key: string; label: string; type: 'text' | 'number' | 'select' | 'json' | 'date'; options?: Array<{ value: string; label: string }>; wide?: boolean }

function operationFields(operation: AutonomyKernelOperation, snapshot: AutonomyKernelSnapshot): FieldDefinition[] {
  const metadataOptions = snapshot.metadata_definitions.map((item) => ({ value: item.id, label: `${item.key} · ${item.name}` }))
  const workflowOptions = snapshot.workflow_definitions.map((item) => ({ value: item.id, label: `${item.key} · ${item.name}` }))
  const policyOptions = snapshot.policy_definitions.map((item) => ({ value: item.id, label: `${item.key} · ${item.name}` }))
  const meterOptions = snapshot.meter_definitions.map((item) => ({ value: item.meter_key, label: `${item.meter_key} · ${item.name}` }))
  const controlOptions = snapshot.certification_controls.map((item) => ({ value: item.id, label: `${item.control_key} · ${item.control_name}` }))
  const definitions: Partial<Record<AutonomyKernelOperation, FieldDefinition[]>> = {
    create_metadata_definition: [{ key: 'key', label: 'Canonical code', type: 'text' }, { key: 'name', label: 'Name', type: 'text' }, { key: 'domain', label: 'Domain', type: 'text' }, { key: 'entity_type', label: 'Entity type', type: 'text' }, { key: 'owner_role', label: 'Owner role', type: 'text' }, { key: 'description', label: 'Description', type: 'text', wide: true }],
    publish_metadata_version: [{ key: 'definition_id', label: 'Definition', type: 'select', options: metadataOptions }, { key: 'schema_json', label: 'JSON Schema', type: 'json', wide: true }, { key: 'ui_schema_json', label: 'UI Schema', type: 'json', wide: true }, { key: 'validation_json', label: 'Validation', type: 'json', wide: true }, { key: 'compatibility_json', label: 'Compatibility', type: 'json', wide: true }],
    create_workflow_definition: [{ key: 'key', label: 'Workflow code', type: 'text' }, { key: 'name', label: 'Workflow name', type: 'text' }, { key: 'domain', label: 'Domain', type: 'text' }, { key: 'entity_type', label: 'Entity type', type: 'text' }],
    publish_workflow_version: [{ key: 'definition_id', label: 'Workflow', type: 'select', options: workflowOptions }, { key: 'states_json', label: 'States', type: 'json', wide: true }, { key: 'transitions_json', label: 'Transitions and guards', type: 'json', wide: true }, { key: 'sla_json', label: 'SLA contract', type: 'json', wide: true }, { key: 'automation_json', label: 'Automations', type: 'json', wide: true }],
    start_workflow_instance: [{ key: 'workflow_version_id', label: 'Workflow version ID', type: 'text' }, { key: 'subject_type', label: 'Subject type', type: 'text' }, { key: 'subject_id', label: 'Subject ID', type: 'text' }, { key: 'initial_state', label: 'Initial state override', type: 'text' }, { key: 'context_json', label: 'Initial context', type: 'json', wide: true }],
    create_policy_definition: [{ key: 'key', label: 'Policy code', type: 'text' }, { key: 'name', label: 'Policy name', type: 'text' }, { key: 'domain', label: 'Domain', type: 'text' }, { key: 'scope_type', label: 'Scope type', type: 'text' }],
    publish_policy_version: [{ key: 'definition_id', label: 'Policy', type: 'select', options: policyOptions }, { key: 'condition_json', label: 'Condition tree', type: 'json', wide: true }, { key: 'actions_json', label: 'Actions', type: 'json', wide: true }, { key: 'authority_json', label: 'Authority', type: 'json', wide: true }, { key: 'exception_json', label: 'Exceptions', type: 'json', wide: true }],
    create_changeset: [{ key: 'title', label: 'Change title', type: 'text', wide: true }, { key: 'domain', label: 'Domain', type: 'text' }, { key: 'effective_at', label: 'Effective date', type: 'date' }, { key: 'change_json', label: 'Change payload', type: 'json', wide: true }, { key: 'impact_json', label: 'Impact analysis', type: 'json', wide: true }, { key: 'rollback_json', label: 'Rollback plan', type: 'json', wide: true }, { key: 'validation_json', label: 'Validation contract', type: 'json', wide: true }],
    queue_provisioning_job: [{ key: 'tenant_id', label: 'Tenant ID from Product Studio', type: 'text' }, { key: 'entitlement_snapshot_id', label: 'Entitlement snapshot', type: 'text' }, { key: 'operation', label: 'Operation', type: 'text' }, { key: 'idempotency_key', label: 'Idempotency key', type: 'text' }, { key: 'max_attempts', label: 'Max attempts', type: 'number' }, { key: 'payload_json', label: 'Controlled payload', type: 'json', wide: true }],
    create_meter_definition: [{ key: 'meter_key', label: 'Meter code', type: 'text' }, { key: 'name', label: 'Meter name', type: 'text' }, { key: 'unit', label: 'Unit', type: 'text' }, { key: 'aggregation_method', label: 'Aggregation', type: 'select', options: ['sum', 'latest', 'max', 'average'].map((value) => ({ value, label: value })) }, { key: 'reset_schedule', label: 'Reset schedule', type: 'text' }, { key: 'measurement_source', label: 'Measurement source', type: 'text' }, { key: 'default_included_quantity', label: 'Default allowance', type: 'number' }, { key: 'soft_limit_pct', label: 'Soft limit %', type: 'number' }, { key: 'warning_limit_pct', label: 'Warning %', type: 'number' }, { key: 'critical_limit_pct', label: 'Critical %', type: 'number' }, { key: 'hard_limit_pct', label: 'Hard limit %', type: 'number' }],
    record_meter_sample: [{ key: 'tenant_id', label: 'Tenant ID', type: 'text' }, { key: 'meter_key', label: 'Meter', type: 'select', options: meterOptions }, { key: 'quantity', label: 'Quantity', type: 'number' }, { key: 'source', label: 'Measurement source', type: 'text' }, { key: 'confidence_pct', label: 'Confidence %', type: 'number' }, { key: 'dimensions_json', label: 'Dimensions', type: 'json', wide: true }],
    register_extension: [{ key: 'extension_key', label: 'Extension code', type: 'text' }, { key: 'name', label: 'Extension name', type: 'text' }, { key: 'current_version', label: 'Initial version', type: 'text' }, { key: 'description', label: 'Description', type: 'text', wide: true }, { key: 'manifest_json', label: 'Manifest', type: 'json', wide: true }, { key: 'platform_context_json', label: 'Compatibility context', type: 'json', wide: true }],
    create_release_candidate: [{ key: 'name', label: 'Release name', type: 'text' }, { key: 'version', label: 'Version', type: 'text' }, { key: 'channel', label: 'Channel', type: 'select', options: ['internal', 'pilot', 'limited', 'general'].map((value) => ({ value, label: value })) }, { key: 'scope_json', label: 'Scope', type: 'json', wide: true }, { key: 'rollout_json', label: 'Rollout', type: 'json', wide: true }, { key: 'rollback_json', label: 'Rollback', type: 'json', wide: true }, { key: 'verification_json', label: 'Verification', type: 'json', wide: true }],
    create_runbook: [{ key: 'runbook_key', label: 'Runbook code', type: 'text' }, { key: 'name', label: 'Runbook name', type: 'text' }, { key: 'domain', label: 'Domain', type: 'text' }, { key: 'owner_role', label: 'Owner role', type: 'text' }, { key: 'steps_json', label: 'Execution steps', type: 'json', wide: true }, { key: 'rollback_json', label: 'Rollback instructions', type: 'json', wide: true }],
    record_control_evidence: [{ key: 'control_id', label: 'Certification control', type: 'select', options: controlOptions }, { key: 'status', label: 'Evidence verdict', type: 'select', options: ['not_verified', 'in_progress', 'passed', 'failed', 'waived'].map((value) => ({ value, label: value })) }, { key: 'evidence_uri', label: 'Evidence URI', type: 'text', wide: true }, { key: 'expires_at', label: 'Evidence expiry', type: 'date' }, { key: 'evidence_json', label: 'Structured evidence', type: 'json', wide: true }],
    create_recovery_rehearsal: [{ key: 'scope', label: 'Rehearsal scope', type: 'text', wide: true }, { key: 'target_rpo_minutes', label: 'Target RPO minutes', type: 'number' }, { key: 'target_rto_minutes', label: 'Target RTO minutes', type: 'number' }, { key: 'evidence_json', label: 'Plan and evidence requirements', type: 'json', wide: true }],
    submit_changeset: [{ key: 'changeset_id', label: 'Changeset', type: 'text', wide: true }],
    approve_changeset: [{ key: 'changeset_id', label: 'Changeset', type: 'text' }, { key: 'reason', label: 'Approval reason', type: 'text', wide: true }],
    reject_changeset: [{ key: 'changeset_id', label: 'Changeset', type: 'text' }, { key: 'reason', label: 'Rejection reason', type: 'text', wide: true }],
    retry_provisioning_job: [{ key: 'job_id', label: 'Provisioning job', type: 'text', wide: true }],
    schedule_changeset: [{ key: 'changeset_id', label: 'Changeset', type: 'text' }, { key: 'effective_at', label: 'Effective date', type: 'date' }],
    start_changeset_execution: [{ key: 'changeset_id', label: 'Changeset', type: 'text', wide: true }],
    verify_changeset: [{ key: 'changeset_id', label: 'Changeset', type: 'text' }, { key: 'verification_json', label: 'Verification evidence', type: 'json', wide: true }],
    rollback_changeset: [{ key: 'changeset_id', label: 'Changeset', type: 'text' }, { key: 'reason', label: 'Rollback reason', type: 'text', wide: true }, { key: 'rollback_evidence_json', label: 'Rollback evidence', type: 'json', wide: true }],
    update_recovery_rehearsal: [{ key: 'rehearsal_id', label: 'Rehearsal', type: 'text' }, { key: 'status', label: 'Status', type: 'select', options: ['planned', 'running', 'passed', 'failed'].map((value) => ({ value, label: value })) }, { key: 'actual_rpo_minutes', label: 'Actual RPO minutes', type: 'number' }, { key: 'actual_rto_minutes', label: 'Actual RTO minutes', type: 'number' }, { key: 'evidence_json', label: 'Execution evidence', type: 'json', wide: true }],
  }
  return definitions[operation] || [{ key: 'payload_json', label: 'Operation payload', type: 'json', wide: true }]
}

function FormField({ field, value, onChange }: { field: FieldDefinition; value: unknown; onChange: (value: unknown) => void }) {
  const className = field.wide ? styles.fieldWide : styles.field
  if (field.type === 'json') return <label className={className}><span>{field.label}</span><textarea value={JSON.stringify(value ?? {}, null, 2)} onChange={(event) => { try { onChange(JSON.parse(event.target.value)) } catch { onChange(event.target.value) } }} rows={7} spellCheck={false} /></label>
  if (field.type === 'select') return <label className={className}><span>{field.label}</span><select value={String(value ?? '')} onChange={(event) => onChange(event.target.value)}><option value="">Sélectionner…</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
  return <label className={className}><span>{field.label}</span><input type={field.type} value={String(value ?? '')} onChange={(event) => onChange(field.type === 'number' ? Number(event.target.value) : event.target.value)} /></label>
}
