'use client'

import {
  Activity,
  BadgeCheck,
  BrainCircuit,
  CheckCircle2,
  Gauge,
  Globe2,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  Route,
  Search,
  ServerCog,
  TriangleAlert,
  Zap,
} from 'lucide-react'
import type { AiProviderSnapshot, JsonRecord } from '@/lib/ai-provider-control/types'
import styles from './ai-provider-control.module.css'

const MODEL_CODE = 'gemini-2.5-flash'
const PROVIDER_GROUNDED_RPD = 500

const text = (value: unknown) => String(value ?? '')
const number = (value: unknown) => Number(value || 0)
const formatNumber = (value: unknown) => new Intl.NumberFormat('fr-FR').format(number(value))
const formatDate = (value: unknown) => value
  ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(String(value)))
  : '—'
const record = (value: unknown): JsonRecord => value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}

function tone(status: unknown) {
  const value = text(status).toLowerCase()
  if (['completed', 'active', 'operating', 'execute_new', 'validated', 'ready'].includes(value)) return styles.good
  if (['running', 'testing', 'queued', 'joined', 'standby'].includes(value)) return styles.warn
  if (['failed', 'blocked', 'suspended', 'revoked'].includes(value)) return styles.bad
  return styles.neutral
}

function Stat({ icon: Icon, label, value, detail }: { icon: typeof Activity; label: string; value: string; detail: string }) {
  return <article className={styles.stat}>
    <div className={styles.statIcon}><Icon size={20}/></div>
    <div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
  </article>
}

export default function AcCapitalAiControlWorkspace({
  snapshot,
  busy,
  onApply,
}: {
  snapshot: AiProviderSnapshot | null
  busy: boolean
  onApply: (payload: JsonRecord) => void
}) {
  const assignment = [...(snapshot?.assignments || [])]
    .filter((row) => row.module_key === 'ac_capital_os' && row.enabled)
    .sort((left, right) => left.priority - right.priority)[0]
  const dossier = snapshot?.dossiers.find((row) => row.id === assignment?.dossier_id)
  const pool = snapshot?.pools.find((row) => row.id === assignment?.capacity_pool_id)
  const activeCredential = snapshot?.credentials.find((row) => row.dossier_id === assignment?.dossier_id && row.status === 'active')
  const quota = snapshot?.quotas.find((row) => row.scope_type === 'module' && row.scope_key === 'ac_capital_os' && row.enabled)
  const routes = (snapshot?.routingRules || []).filter((row) => row.module_key === 'ac_capital_os')
  const policies = (snapshot?.commandPolicies || []).filter((row) => row.module_key === 'ac_capital_os')
  const modelRows = (snapshot?.models || []).filter((row) => row.dossier_id === assignment?.dossier_id && row.model_code === MODEL_CODE)
  const today = new Date().toDateString()
  const usageToday = (snapshot?.usage || []).filter((row) => row.module_key === 'ac_capital_os' && new Date(row.occurred_at).toDateString() === today)
  const groundedToday = usageToday.reduce((sum, row) => sum + row.grounded_request_count, 0)
  const requestToday = usageToday.reduce((sum, row) => sum + row.request_count, 0)
  const remainingGrounded = Math.max(0, Number(pool?.provider_grounded_rpd || PROVIDER_GROUNDED_RPD) - groundedToday)
  const latestRequests = (snapshot?.governedRequests || []).filter((row) => row.module_key === 'ac_capital_os').slice(0, 12)
  const latestLogs = (snapshot?.acCapitalProviderLogs || []).slice(0, 12)
  const profileAligned = Boolean(
    assignment
    && assignment.primary_model === MODEL_CODE
    && !assignment.fallback_model
    && assignment.capability_allowlist.includes('grounded_research')
    && assignment.capability_allowlist.includes('structured_content')
    && modelRows.some((row) => row.capability === 'grounded_research' && row.grounding_allowed && row.enabled)
    && modelRows.some((row) => row.capability === 'structured_content' && row.enabled)
    && routes.filter((row) => ['grounded_research', 'structured_content'].includes(text(row.capability))).every((row) => row.routing_mode === 'exclusive' && row.enabled)
    && policies.length >= 2
    && policies.every((row) => row.allowed_models.length === 1 && row.allowed_models[0] === MODEL_CODE && row.enabled)
  )

  return <div>
    <section className={styles.sovereigntyBanner}>
      <div>
        <span>AC CAPITAL OS · SINGLE MODEL AUTHORITY</span>
        <h2>Un seul modèle, une seule route, une seule vérité opérationnelle</h2>
        <p>Gemini 2.5 Flash alimente la recherche Google, l’analyse et la rédaction AC Capital. Aucun fallback modèle n’est utilisé. Les écritures internes restent actives; toute action externe reste verrouillée.</p>
      </div>
      <button className={styles.primaryButton} disabled={busy} onClick={() => onApply({ modelCode: MODEL_CODE })}>
        {busy ? <RefreshCw size={17} className={styles.spin}/> : <Zap size={17}/>} Appliquer et activer le profil unique
      </button>
    </section>

    <div className={styles.statsGrid}>
      <Stat icon={BrainCircuit} label="Modèle AC Capital" value={assignment?.primary_model || 'Non configuré'} detail={assignment?.fallback_model ? `Fallback: ${assignment.fallback_model}` : 'Aucun fallback modèle'}/>
      <Stat icon={KeyRound} label="Credential active" value={activeCredential ? `V${activeCredential.version_number}` : 'Absente'} detail={activeCredential ? `•••• ${activeCredential.secret_suffix}` : 'Activation requise dans Secrets & credentials'}/>
      <Stat icon={Search} label="Grounding aujourd’hui" value={`${formatNumber(groundedToday)} / ${formatNumber(pool?.provider_grounded_rpd || PROVIDER_GROUNDED_RPD)}`} detail={`${formatNumber(remainingGrounded)} disponibles selon le plafond fournisseur déclaré`}/>
      <Stat icon={Activity} label="Requêtes aujourd’hui" value={formatNumber(requestToday)} detail={`${latestRequests.filter((row) => row.status === 'failed' || row.status === 'blocked').length} échec(s) visibles dans le ledger`}/>
    </div>

    <div className={styles.twoColumnsWide}>
      <section className={styles.panel}>
        <div className={styles.cardTitle}><div><span>CONFIGURATION EFFECTIVE</span><h2>État réel du profil AC Capital</h2></div><span className={profileAligned ? styles.good : styles.bad}>{profileAligned ? 'ALIGNÉ' : 'À APPLIQUER'}</span></div>
        <div className={styles.decisionList}>
          <div><BrainCircuit size={18}/><p><strong>Modèle unique</strong><span>{assignment?.primary_model || 'Aucun'} · fallback {assignment?.fallback_model || 'désactivé'}</span></p><span className={assignment?.primary_model === MODEL_CODE && !assignment?.fallback_model ? styles.good : styles.bad}>{assignment?.primary_model === MODEL_CODE && !assignment?.fallback_model ? 'OK' : 'NON'}</span></div>
          <div><Globe2 size={18}/><p><strong>Google Search grounding</strong><span>Capacité grounded_research sur {MODEL_CODE}</span></p><span className={modelRows.some((row) => row.capability === 'grounded_research' && row.grounding_allowed) ? styles.good : styles.bad}>{modelRows.some((row) => row.capability === 'grounded_research' && row.grounding_allowed) ? 'ACTIF' : 'INACTIF'}</span></div>
          <div><Route size={18}/><p><strong>Routage exclusif</strong><span>{routes.length} règle(s) AC Capital · aucune route de fallback modèle</span></p><span className={routes.length >= 2 && routes.every((row) => row.routing_mode === 'exclusive') ? styles.good : styles.warn}>{routes.length >= 2 && routes.every((row) => row.routing_mode === 'exclusive') ? 'VERROUILLÉ' : 'À ALIGNER'}</span></div>
          <div><ServerCog size={18}/><p><strong>Écritures internes</strong><span>Sources, opportunités et brouillons de rapports sont persistés dans AC Capital</span></p><span className={styles.good}>ACTIVES</span></div>
          <div><LockKeyhole size={18}/><p><strong>Actions externes</strong><span>Outreach, soumission, communication et publication externe</span></p><span className={styles.good}>VERROUILLÉES</span></div>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.cardTitle}><div><span>PROVIDER & QUOTA TRUTH</span><h2>Dossier, pool et limites</h2></div></div>
        <div className={styles.routeCards}>
          <article><div><BadgeCheck size={20}/><span className={tone(dossier?.status)}>{dossier?.status || 'missing'}</span></div><h3>{dossier?.name || 'Dossier absent'}</h3><p>Tier: <strong>{dossier?.billing_tier || '—'}</strong></p><dl><div><dt>Provider</dt><dd>{dossier?.provider_type || '—'}</dd></div><div><dt>Credential</dt><dd>{activeCredential?.status || 'absente'}</dd></div><div><dt>Pool</dt><dd>{pool?.project_name || '—'}</dd></div><div><dt>Grounded RPD</dt><dd>{pool?.provider_grounded_rpd ?? '—'}</dd></div></dl></article>
          <article><div><Gauge size={20}/><span className={quota?.enabled ? styles.good : styles.bad}>{quota?.enabled ? 'active' : 'missing'}</span></div><h3>Quota interne SANILA</h3><p>Portée: <strong>ac_capital_os</strong></p><dl><div><dt>Minute</dt><dd>{quota?.max_requests_per_minute ?? '—'}</dd></div><div><dt>Jour</dt><dd>{quota?.max_requests_per_day ?? '—'}</dd></div><div><dt>Grounded/jour</dt><dd>{quota?.max_grounded_requests_per_day ?? '—'}</dd></div><div><dt>Concurrence</dt><dd>{quota?.max_concurrent_requests ?? '—'}</dd></div></dl></article>
        </div>
      </section>
    </div>

    <section className={styles.panel}>
      <div className={styles.cardTitle}><div><span>REQUEST ACTIVITY EXPLORER</span><h2>Demandes gouvernées AC Capital</h2></div></div>
      <div className={styles.tableWrap}><table><thead><tr><th>Heure</th><th>Commande</th><th>Décision</th><th>Statut</th><th>Modèle</th><th>HTTP / erreur</th><th>Tokens</th></tr></thead><tbody>
        {latestRequests.map((row) => <tr key={row.id}><td>{formatDate(row.created_at)}</td><td>{row.command_code}</td><td><span className={tone(row.decision)}>{row.decision}</span></td><td><span className={tone(row.status)}>{row.status}</span></td><td>{row.model_code || '—'}</td><td>{text(record(row.metadata).httpStatus || record(row.metadata).providerHttpStatus) || '—'}<small>{row.error_message || row.error_code || 'Aucune erreur'}</small></td><td>{formatNumber(row.actual_input_tokens + row.actual_output_tokens)}</td></tr>)}
        {!latestRequests.length ? <tr><td colSpan={7}>Aucune demande AC Capital enregistrée.</td></tr> : null}
      </tbody></table></div>
    </section>

    <section className={styles.panel}>
      <div className={styles.cardTitle}><div><span>AC CAPITAL EXECUTION LOGS</span><h2>Requêtes, résultats et activités Radar</h2></div></div>
      <div className={styles.tableWrap}><table><thead><tr><th>Heure</th><th>Agent</th><th>Mode</th><th>Statut</th><th>Modèle / requête</th><th>Résultat</th></tr></thead><tbody>
        {latestLogs.map((row) => {
          const response = record(row.response_payload)
          return <tr key={text(row.id)}><td>{formatDate(row.created_at)}</td><td>{text(row.agent_key) || '—'}</td><td>{text(row.execution_mode)}</td><td><span className={tone(row.status)}>{text(row.status)}</span></td><td>{text(response.model) || '—'}<small>{text(response.requestId) || 'Aucun request ID'}</small></td><td>{row.warning ? <><TriangleAlert size={13}/> {text(row.warning)}</> : `${formatNumber(response.sourceCount)} sources · ${formatNumber(response.opportunityCount)} opportunités`}</td></tr>
        })}
        {!latestLogs.length ? <tr><td colSpan={6}>Aucun log live enregistré. Le prochain Radar apparaîtra ici avec sa requête et son résultat.</td></tr> : null}
      </tbody></table></div>
    </section>
  </div>
}
