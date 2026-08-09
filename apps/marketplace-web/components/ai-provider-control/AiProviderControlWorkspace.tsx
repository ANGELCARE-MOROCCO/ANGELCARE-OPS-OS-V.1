'use client'

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type MouseEvent, type ReactNode } from 'react'
import {
  Activity, AlertTriangle, Archive, ArrowRightLeft, BadgeCheck, BarChart3, Bolt,
  Boxes, BrainCircuit, CheckCircle2, ChevronRight, CircleDollarSign, CloudCog,
  Database, Gauge, GitBranch, History, KeyRound, Layers3, Loader2, LockKeyhole,
  Network, PauseCircle, PlayCircle, Plus, RefreshCw, Route, Save, Search, ServerCog,
  Settings2, ShieldCheck, SlidersHorizontal, Sparkles, TestTube2, TimerReset,
  TriangleAlert, UsersRound, WalletCards, X, Zap,
} from 'lucide-react'
import type { AiProviderQuotaPolicy, AiProviderSnapshot, JsonRecord } from '@/lib/ai-provider-control/types'
import RevenueSovereigntyWorkspace from './RevenueSovereigntyWorkspace'
import AcCapitalAiControlWorkspace from './AcCapitalAiControlWorkspace'
import styles from './ai-provider-control.module.css'

type TabKey = 'command' | 'capital' | 'revenue' | 'command-policies' | 'schedules' | 'reuse' | 'dossiers' | 'credentials' | 'assignments' | 'routing' | 'capacity' | 'models' | 'grounding' | 'usage' | 'costs' | 'incidents' | 'versions' | 'audit' | 'simulation'
type Actor = { id: string; name: string; role: string }
type ModalKey = 'dossier' | 'credential' | 'assignment' | 'quota' | 'model' | 'routing' | null

const tabs: Array<{ key: TabKey; label: string; icon: typeof Activity }> = [
  { key: 'command', label: 'Commandement', icon: Gauge },
  { key: 'capital', label: 'AC Capital AI', icon: BrainCircuit },
  { key: 'revenue', label: 'Revenue AI', icon: Sparkles },
  { key: 'command-policies', label: 'Politiques commandes', icon: ShieldCheck },
  { key: 'schedules', label: 'Schedules', icon: TimerReset },
  { key: 'reuse', label: 'Réutilisation & économies', icon: RefreshCw },
  { key: 'dossiers', label: 'Dossiers fournisseurs', icon: CloudCog },
  { key: 'credentials', label: 'Secrets & credentials', icon: KeyRound },
  { key: 'assignments', label: 'Affectations modules', icon: Boxes },
  { key: 'routing', label: 'Routage & failover', icon: GitBranch },
  { key: 'capacity', label: 'Capacité & quotas', icon: SlidersHorizontal },
  { key: 'models', label: 'Modèles', icon: BrainCircuit },
  { key: 'grounding', label: 'Grounding', icon: Search },
  { key: 'usage', label: 'Consommation', icon: BarChart3 },
  { key: 'costs', label: 'Coûts', icon: CircleDollarSign },
  { key: 'incidents', label: 'Incidents', icon: AlertTriangle },
  { key: 'versions', label: 'Versions', icon: History },
  { key: 'audit', label: 'Audit', icon: ShieldCheck },
  { key: 'simulation', label: 'Simulation', icon: TestTube2 },
]

const modules = [
  { key: 'revenue_os', label: 'Revenue Command OS' },
  { key: 'marketing_ai', label: 'Marketing Director AI' },
  { key: 'marketing_autopilot', label: 'Marketing Operations Autopilot' },
  { key: 'ac_capital_os', label: 'AC CAPITAL OS' },
]

const number = (value: unknown) => Number(value || 0)
const shortId = (value: unknown) => String(value || '').slice(0, 8)
const formatNumber = (value: unknown) => new Intl.NumberFormat('fr-FR').format(number(value))
const formatDate = (value: unknown) => value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(String(value))) : '—'
const text = (value: unknown) => String(value ?? '')
const statusClass = (status: unknown) => {
  const value = text(status).toLowerCase()
  if (['operating', 'healthy', 'active', 'ready', 'completed', 'published', 'validated'].includes(value)) return styles.good
  if (['limited', 'testing', 'standby', 'draft', 'warning', 'deferred'].includes(value)) return styles.warn
  if (['failed', 'revoked', 'suspended', 'critical', 'blocked'].includes(value)) return styles.bad
  return styles.neutral
}

function CardTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return <div className={styles.cardTitle}><div><span>{eyebrow}</span><h2>{title}</h2></div>{action}</div>
}

function Empty({ title, body }: { title: string; body: string }) {
  return <div className={styles.empty}><Archive size={26}/><strong>{title}</strong><p>{body}</p></div>
}

function Stat({ icon: Icon, label, value, detail, tone = 'blue' }: { icon: typeof Activity; label: string; value: string; detail: string; tone?: string }) {
  return <article className={`${styles.stat} ${styles[`tone_${tone}`] || ''}`}><div className={styles.statIcon}><Icon size={20}/></div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>
}

export default function AiProviderControlWorkspace({ actor }: { actor: Actor }) {
  const [snapshot, setSnapshot] = useState<AiProviderSnapshot | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('command')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [modal, setModal] = useState<ModalKey>(null)
  const [simulation, setSimulation] = useState<unknown>(null)
  const [usageWindow, setUsageWindow] = useState<'day' | 'week' | 'month'>('day')
  const [editingQuota, setEditingQuota] = useState<AiProviderQuotaPolicy | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/ai-provider-control/snapshot', { cache: 'no-store' })
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error(result.error || 'SNAPSHOT_FAILED')
      setSnapshot(result.data)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de charger le Control Plane.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  async function act(action: string, payload: JsonRecord, success: string) {
    setBusy(action); setError(''); setNotice('')
    try {
      const response = await fetch('/api/ai-provider-control/action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      })
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error(result.error || 'ACTION_FAILED')
      setNotice(success)
      if (action === 'simulate_route') setSimulation(result.data)
      else { setModal(null); setEditingQuota(null); await load() }
      return result.data
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Action impossible.')
      throw cause
    } finally { setBusy('') }
  }

  const dossierName = useCallback((id: unknown) => snapshot?.dossiers.find((item) => item.id === id)?.name || `Dossier ${shortId(id)}`, [snapshot])
  const poolName = useCallback((id: unknown) => snapshot?.pools.find((item) => item.id === id)?.project_name || `Pool ${shortId(id)}`, [snapshot])
  const assignmentName = useCallback((id: unknown) => {
    const assignment = snapshot?.assignments.find((item) => item.id === id)
    return assignment ? `${modules.find((item) => item.key === assignment.module_key)?.label || assignment.module_key} · ${dossierName(assignment.dossier_id)}` : `Affectation ${shortId(id)}`
  }, [dossierName, snapshot])

  const usageByHour = useMemo(() => {
    const buckets = new Map<number, number>()
    for (let hour = 0; hour < 24; hour++) buckets.set(hour, 0)
    for (const row of snapshot?.usage || []) {
      const date = new Date(row.occurred_at)
      if (date.toDateString() === new Date().toDateString()) buckets.set(date.getHours(), (buckets.get(date.getHours()) || 0) + row.request_count)
    }
    return [...buckets.entries()].map(([hour, value]) => ({ label: `${String(hour).padStart(2, '0')}h`, value }))
  }, [snapshot])

  const maxHour = Math.max(1, ...usageByHour.map((item) => item.value))
  const filteredUsage = useMemo(() => {
    const nowDate = new Date()
    const start = new Date(nowDate)
    if (usageWindow === 'day') start.setHours(0, 0, 0, 0)
    if (usageWindow === 'week') start.setDate(nowDate.getDate() - 7)
    if (usageWindow === 'month') { start.setDate(1); start.setHours(0, 0, 0, 0) }
    return (snapshot?.usage || []).filter((row) => new Date(row.occurred_at) >= start)
  }, [snapshot, usageWindow])
  const usageWindowMetrics = useMemo(() => ({
    requests: filteredUsage.reduce((sum, row) => sum + row.request_count, 0),
    grounded: filteredUsage.reduce((sum, row) => sum + row.grounded_request_count, 0),
    inputTokens: filteredUsage.reduce((sum, row) => sum + row.input_tokens, 0),
    outputTokens: filteredUsage.reduce((sum, row) => sum + row.output_tokens, 0),
  }), [filteredUsage])
  const emergencyMode = text(snapshot?.emergency?.mode || 'normal')

  if (loading && !snapshot) return <main className={styles.loading}><Loader2 className={styles.spin}/><strong>Initialisation du AI Provider Control Plane</strong><span>Résolution des dossiers, pools, credentials, routage et budgets…</span></main>

  return <main className={styles.root}>
    <header className={styles.hero}>
      <div className={styles.heroBrand}>
        <div className={styles.brandMark}><Network size={30}/></div>
        <div><span className={styles.kicker}>SANILA AI PROVIDER SOVEREIGN CONTROL PLANE</span><h1>Autorité centrale sur chaque ressource IA</h1><p>Connectez plusieurs comptes Gemini, attribuez-les aux OS ANGELCARE, déployez une nouvelle credential sans redeployer Vercel et gouvernez chaque requête en temps réel.</p></div>
      </div>
      <div className={styles.heroControls}>
        <div className={styles.operator}><span>Autorité connectée</span><strong>{actor.name}</strong><small>{actor.role}</small></div>
        <button className={styles.heroButton} onClick={() => void load()} disabled={loading}><RefreshCw size={17} className={loading ? styles.spin : ''}/> Actualiser</button>
      </div>
      <div className={styles.heroMetrics}>
        <div><span>Dossiers actifs</span><strong>{snapshot?.rollups.activeDossiers || 0}</strong><small>{snapshot?.dossiers.length || 0} enregistrés</small></div>
        <div><span>Requêtes aujourd’hui</span><strong>{formatNumber(snapshot?.rollups.todayRequests)}</strong><small>{formatNumber(snapshot?.rollups.todayGroundedRequests)} grounded</small></div>
        <div><span>Credentials actives</span><strong>{snapshot?.rollups.activeCredentials || 0}</strong><small>Secrets jamais exposés au navigateur</small></div>
        <div><span>État souverain</span><strong className={emergencyMode === 'normal' ? styles.heroGood : styles.heroDanger}>{emergencyMode === 'normal' ? 'OPÉRATIONNEL' : emergencyMode.toUpperCase()}</strong><small>Contrôle global instantané</small></div>
      </div>
    </header>

    <nav className={styles.nav} aria-label="Navigation du contrôle fournisseurs IA">
      {tabs.map(({ key, label, icon: Icon }) => <button key={key} className={activeTab === key ? styles.navActive : ''} onClick={() => setActiveTab(key)}><Icon size={16}/><span>{label}</span></button>)}
    </nav>

    {(error || notice) && <section className={`${styles.message} ${error ? styles.messageError : styles.messageSuccess}`}><div>{error ? <TriangleAlert size={19}/> : <CheckCircle2 size={19}/>}<strong>{error || notice}</strong></div><button onClick={() => { setError(''); setNotice('') }}><X size={17}/></button></section>}

    <section className={styles.workspace}>
      {activeTab === 'command' && <>
        <div className={styles.statsGrid}>
          <Stat icon={CloudCog} label="Fournisseurs" value={formatNumber(snapshot?.dossiers.length)} detail={`${snapshot?.rollups.activeDossiers || 0} capables de servir une requête`} tone="navy"/>
          <Stat icon={Activity} label="Consommation du jour" value={formatNumber(snapshot?.rollups.todayRequests)} detail={`${formatNumber(snapshot?.rollups.todayInputTokens)} tokens entrants`} tone="blue"/>
          <Stat icon={AlertTriangle} label="Échecs du jour" value={formatNumber(snapshot?.rollups.todayFailures)} detail={`${snapshot?.incidents.filter((item) => item.status !== 'resolved').length || 0} incidents ouverts`} tone="red"/>
          <Stat icon={LockKeyhole} label="Vault" value={formatNumber(snapshot?.credentials.length)} detail="Versions chiffrées et write-only" tone="green"/>
        </div>
        <div className={styles.twoColumns}>
          <article className={styles.panel}>
            <CardTitle eyebrow="SUPPLY MAP" title="Chaîne d’approvisionnement IA" action={<button className={styles.textButton} onClick={() => setActiveTab('assignments')}>Gérer <ChevronRight size={15}/></button>}/>
            <div className={styles.supplyMap}>
              {modules.map((module) => {
                const matches = snapshot?.assignments.filter((item) => item.module_key === module.key && item.enabled) || []
                return <div className={styles.supplyRow} key={module.key}><div className={styles.moduleNode}><Boxes size={18}/><div><strong>{module.label}</strong><span>{matches.length ? `${matches.length} route(s)` : 'Aucune route active'}</span></div></div><ArrowRightLeft size={18}/><div className={styles.providerStack}>{matches.length ? matches.map((assignment) => <span key={assignment.id} className={statusClass(assignment.assignment_mode)}>{dossierName(assignment.dossier_id)} · {assignment.assignment_mode}</span>) : <span className={styles.bad}>NON ALIMENTÉ</span>}</div></div>
              })}
            </div>
          </article>
          <article className={styles.panel}>
            <CardTitle eyebrow="INTERVENTION" title="Contrôle d’urgence"/>
            <div className={styles.emergencyBox}>
              <div className={styles.emergencyState}><span>Mode actuel</span><strong>{emergencyMode.toUpperCase()}</strong><small>Les appels en cours terminent; les nouvelles acquisitions suivent cette règle.</small></div>
              <div className={styles.emergencyActions}>
                <button className={styles.dangerButton} disabled={busy === 'set_emergency'} onClick={() => void act('set_emergency', { scopeKey: '*', mode: 'paused', reason: 'Pause globale depuis le commandement administrateur' }, 'Tous les nouveaux appels IA sont suspendus.') }><PauseCircle size={17}/> Pause globale</button>
                <button className={styles.secondaryButton} disabled={busy === 'set_emergency'} onClick={() => void act('set_emergency', { scopeKey: '*', mode: 'manual_only', reason: 'Mode manuel administrateur' }, 'Les exécutions automatiques sont suspendues; le manuel reste autorisé.') }><UsersRound size={17}/> Manuel uniquement</button>
                <button className={styles.primaryButton} disabled={busy === 'set_emergency'} onClick={() => void act('set_emergency', { scopeKey: '*', mode: 'normal', reason: 'Reprise contrôlée' }, 'Opération IA normale rétablie.') }><PlayCircle size={17}/> Reprendre</button>
              </div>
            </div>
          </article>
        </div>
        <div className={styles.twoColumnsWide}>
          <article className={styles.panel}>
            <CardTitle eyebrow="24 HEURES" title="Intensité réelle des requêtes"/>
            <div className={styles.hourChart}>{usageByHour.map((item) => <div key={item.label} className={styles.hourBar}><div style={{ height: `${Math.max(3, item.value / maxHour * 100)}%` }}><span>{item.value || ''}</span></div><small>{item.label}</small></div>)}</div>
          </article>
          <article className={styles.panel}>
            <CardTitle eyebrow="DÉCISIONS" title="Interventions prioritaires"/>
            <div className={styles.decisionList}>
              {!snapshot?.credentials.some((item) => item.status === 'active') && <div><KeyRound size={18}/><p><strong>Aucune credential active</strong><span>Tester puis activer une clé dans un dossier fournisseur.</span></p><button onClick={() => setModal('credential')}>Corriger</button></div>}
              {modules.filter((module) => !snapshot?.assignments.some((item) => item.module_key === module.key && item.enabled)).map((module) => <div key={module.key}><Route size={18}/><p><strong>{module.label} non alimenté</strong><span>Aucun dossier n’est affecté à ce module.</span></p><button onClick={() => setModal('assignment')}>Affecter</button></div>)}
              {!snapshot?.quotas.length && <div><Gauge size={18}/><p><strong>Aucune limite SANILA publiée</strong><span>Le fournisseur peut être sollicité sans plafond interne central.</span></p><button onClick={() => { setEditingQuota(null); setModal('quota') }}>Gouverner</button></div>}
              {!!snapshot?.credentials.some((item) => item.status === 'active') && modules.every((module) => !!snapshot?.assignments.some((item) => item.module_key === module.key && item.enabled)) && !!snapshot?.quotas.length && <div className={styles.allGood}><BadgeCheck size={20}/><p><strong>Chaîne de contrôle cohérente</strong><span>Credentials, affectations et budgets centraux sont en place.</span></p></div>}
            </div>
          </article>
        </div>
      </>}

      {activeTab === 'capital' && <AcCapitalAiControlWorkspace snapshot={snapshot} busy={busy === 'apply_ac_capital_single_model_profile'} onApply={(payload) => void act('apply_ac_capital_single_model_profile', payload, 'Profil AC Capital à modèle unique appliqué et activé.')} />}
      {activeTab === 'revenue' && <RevenueSovereigntyWorkspace mode="overview" snapshot={snapshot} busy={busy} onAction={act} />}
      {activeTab === 'command-policies' && <RevenueSovereigntyWorkspace mode="policies" snapshot={snapshot} busy={busy} onAction={act} />}
      {activeTab === 'schedules' && <RevenueSovereigntyWorkspace mode="schedules" snapshot={snapshot} busy={busy} onAction={act} />}
      {activeTab === 'reuse' && <RevenueSovereigntyWorkspace mode="reuse" snapshot={snapshot} busy={busy} onAction={act} />}

      {activeTab === 'dossiers' && <article className={styles.panel}>
        <CardTitle eyebrow="PROVIDER DOSSIERS" title="Portefeuille fournisseurs" action={<button className={styles.primaryButton} onClick={() => setModal('dossier')}><Plus size={17}/> Nouveau dossier</button>}/>
        <div className={styles.dossierGrid}>{snapshot?.dossiers.length ? snapshot.dossiers.map((dossier) => {
          const dossierPools = snapshot.pools.filter((item) => item.dossier_id === dossier.id)
          const dossierCredentials = snapshot.credentials.filter((item) => item.dossier_id === dossier.id)
          const dossierAssignments = snapshot.assignments.filter((item) => item.dossier_id === dossier.id && item.enabled)
          return <article className={styles.dossier} key={dossier.id}>
            <div className={styles.dossierTop}><div className={styles.dossierLogo}><Sparkles size={22}/></div><div><span>{dossier.provider_type.toUpperCase()} · {dossier.environment}</span><h3>{dossier.name}</h3><p>{dossier.account_label || dossier.code}</p></div><span className={statusClass(dossier.status)}>{dossier.status}</span></div>
            <div className={styles.dossierFacts}><div><span>Capacity pools</span><strong>{dossierPools.length}</strong></div><div><span>Credentials</span><strong>{dossierCredentials.length}</strong></div><div><span>Modules alimentés</span><strong>{dossierAssignments.length}</strong></div><div><span>Billing</span><strong>{dossier.billing_tier}</strong></div></div>
            <div className={styles.dossierRoute}>{dossierAssignments.length ? dossierAssignments.map((assignment) => <span key={assignment.id}>{modules.find((item) => item.key === assignment.module_key)?.label || assignment.module_key} · {assignment.assignment_mode}</span>) : <span>Aucun module attribué</span>}</div>
            <div className={styles.dossierActions}><button onClick={() => { setActiveTab('credentials'); setNotice(`Dossier sélectionné : ${dossier.name}`) }}><KeyRound size={15}/> Credentials</button><button onClick={() => setModal('assignment')}><Route size={15}/> Affecter</button><button onClick={() => { setEditingQuota(null); setModal('quota') }}><Gauge size={15}/> Quota</button></div>
          </article>
        }) : <Empty title="Aucun dossier fournisseur" body="Créez le premier dossier Gemini, son projet de capacité et sa relation de facturation."/>}</div>
      </article>}

      {activeTab === 'credentials' && <article className={styles.panel}>
        <CardTitle eyebrow="ENCRYPTED VAULT" title="Credentials et rotations" action={<button className={styles.primaryButton} onClick={() => setModal('credential')}><Plus size={17}/> Ajouter une credential</button>}/>
        <div className={styles.securityNotice}><LockKeyhole size={22}/><div><strong>Entrée write-only</strong><span>Les clés sont chiffrées dans Supabase Vault. L’interface ne reçoit jamais le secret déchiffré; seul le gateway serveur peut le résoudre à l’exécution.</span></div></div>
        <div className={styles.tableWrap}><table><thead><tr><th>Dossier</th><th>Version</th><th>Type</th><th>Empreinte</th><th>Validation</th><th>Dernier succès</th><th>État</th><th>Actions</th></tr></thead><tbody>{snapshot?.credentials.map((credential) => <tr key={credential.id}><td><strong>{dossierName(credential.dossier_id)}</strong><small>{poolName(credential.capacity_pool_id)}</small></td><td>V{credential.version_number}</td><td>{credential.key_type}</td><td><code>{credential.fingerprint.slice(0, 12)}…••••{credential.secret_suffix}</code></td><td>{formatDate(credential.validated_at)}</td><td>{formatDate(credential.last_success_at)}</td><td><span className={statusClass(credential.status)}>{credential.status}</span></td><td><div className={styles.rowActions}><button disabled={busy === 'test_credential'} onClick={() => void act('test_credential', { credentialId: credential.id, model: snapshot.models.find((item) => item.dossier_id === credential.dossier_id && item.enabled && item.primary_for_capability)?.model_code || snapshot.models.find((item) => item.dossier_id === credential.dossier_id && item.enabled)?.model_code || '' }, 'Credential testée avec succès.') }><TestTube2 size={15}/> Tester</button><button disabled={busy === 'activate_credential' || !['validated', 'standby', 'active'].includes(credential.status)} title={!['validated', 'standby', 'active'].includes(credential.status) ? 'Testez et validez la credential avant activation.' : 'Activer cette credential'} onClick={() => void act('activate_credential', { credentialId: credential.id }, 'Credential activée pour les nouvelles requêtes.') }><Bolt size={15}/> Activer</button></div></td></tr>)}</tbody></table></div>
        {!snapshot?.credentials.length && <Empty title="Aucune credential" body="Ajoutez une clé Gemini au Vault, testez-la, puis activez-la sans redeployer Vercel."/>}
      </article>}

      {activeTab === 'assignments' && <article className={styles.panel}>
        <CardTitle eyebrow="MODULE SUPPLY MATRIX" title="Affectations opérationnelles" action={<button className={styles.primaryButton} onClick={() => setModal('assignment')}><Plus size={17}/> Nouvelle affectation</button>}/>
        <div className={styles.matrix}><div className={styles.matrixHeader}><span>Module SANILA</span>{snapshot?.dossiers.map((dossier) => <strong key={dossier.id}>{dossier.name}</strong>)}</div>{modules.map((module) => <div className={styles.matrixRow} key={module.key}><div><Boxes size={18}/><strong>{module.label}</strong><small>{module.key}</small></div>{snapshot?.dossiers.map((dossier) => { const match = snapshot.assignments.find((item) => item.module_key === module.key && item.dossier_id === dossier.id && item.enabled); return <span key={dossier.id} className={match ? statusClass(match.assignment_mode) : styles.matrixDisabled}>{match ? match.assignment_mode : 'disabled'}</span> })}</div>)}</div>
      </article>}

      {activeTab === 'routing' && <article className={styles.panel}>
        <CardTitle eyebrow="RUNTIME ROUTING" title="Routage, priorité et failover" action={<button className={styles.primaryButton} onClick={() => setModal('routing')}><Plus size={17}/> Règle de routage</button>}/>
        <div className={styles.routeCards}>{snapshot?.routingRules.length ? snapshot.routingRules.map((rule) => <article key={text(rule.id)}><div><Route size={20}/><span className={statusClass(rule.enabled ? 'active' : 'suspended')}>{rule.enabled ? 'active' : 'disabled'}</span></div><h3>{modules.find((item) => item.key === rule.module_key)?.label || text(rule.module_key)}</h3><p>Capacité : <strong>{text(rule.capability)}</strong></p><dl><div><dt>Mode</dt><dd>{text(rule.routing_mode)}</dd></div><div><dt>Primaire</dt><dd>{assignmentName(rule.primary_assignment_id)}</dd></div><div><dt>Sticky mission</dt><dd>{rule.sticky_mission ? 'Oui' : 'Non'}</dd></div><div><dt>Failovers</dt><dd>{Array.isArray(rule.fallback_assignment_ids) ? rule.fallback_assignment_ids.length : 0}</dd></div></dl></article>) : <Empty title="Aucune règle explicite" body="Le gateway utilisera la priorité des affectations. Publiez une règle pour verrouiller le comportement de failover."/>}</div>
      </article>}

      {activeTab === 'capacity' && <article className={styles.panel}>
        <CardTitle eyebrow="LIVE CAPACITY STUDIO" title="Plafonds SANILA et réserves" action={<button className={styles.primaryButton} onClick={() => { setEditingQuota(null); setModal('quota') }}><Plus size={17}/> Politique de quota</button>}/>
        <div className={styles.quotaGrid}>{snapshot?.quotas.length ? snapshot.quotas.map((quota) => {
          const consumed = quota.scope_type === 'global' ? snapshot.rollups.todayRequests : quota.scope_type === 'module' ? snapshot.usage.filter((row) => row.module_key === quota.scope_key && new Date(row.occurred_at).toDateString() === new Date().toDateString()).reduce((sum, row) => sum + row.request_count, 0) : 0
          const limit = quota.max_requests_per_day || 0; const ratio = limit ? Math.min(100, consumed / limit * 100) : 0
          return <article key={quota.id}><div className={styles.quotaTop}><div><span>{quota.scope_type}</span><h3>{quota.scope_key === '*' ? 'Plateforme globale' : modules.find((item) => item.key === quota.scope_key)?.label || quota.scope_key}</h3></div><span className={quota.hard_limit ? styles.bad : styles.warn}>{quota.hard_limit ? 'HARD' : 'SOFT'}</span></div><div className={styles.quotaProgress}><div style={{ width: `${ratio}%` }}/></div><div className={styles.quotaNumbers}><strong>{formatNumber(consumed)}</strong><span>/ {limit ? formatNumber(limit) : 'illimité'} requêtes aujourd’hui</span></div><dl><div><dt>Minute</dt><dd>{quota.max_requests_per_minute ?? '—'}</dd></div><div><dt>Heure</dt><dd>{quota.max_requests_per_hour ?? '—'}</dd></div><div><dt>Semaine</dt><dd>{quota.max_requests_per_week ?? '—'}</dd></div><div><dt>Mois</dt><dd>{quota.max_requests_per_month ?? '—'}</dd></div><div><dt>Coût semaine</dt><dd>{quota.max_estimated_cost_usd_per_week ?? '—'} USD</dd></div><div><dt>Concurrence</dt><dd>{quota.max_concurrent_requests ?? '—'}</dd></div><div><dt>Grounding/jour</dt><dd>{quota.max_grounded_requests_per_day ?? '—'}</dd></div><div><dt>Réserve</dt><dd>{quota.emergency_reserve_requests}</dd></div></dl><button className={styles.secondaryButton} onClick={() => { setEditingQuota(quota); setModal('quota') }}><Settings2 size={16}/> Reconfigurer instantanément</button></article>
        }) : <Empty title="Aucun plafond interne" body="Définissez la capacité globale, puis les allocations par module ou capacity pool."/>}</div>
      </article>}

      {activeTab === 'models' && <article className={styles.panel}>
        <CardTitle eyebrow="MODEL CATALOG" title="Capacités et modèles autorisés" action={<button className={styles.primaryButton} onClick={() => setModal('model')}><Plus size={17}/> Ajouter un modèle</button>}/>
        <div className={styles.tableWrap}><table><thead><tr><th>Dossier</th><th>Modèle</th><th>Capacité</th><th>Grounding</th><th>Sortie max</th><th>Position</th><th>État</th></tr></thead><tbody>{snapshot?.models.map((model) => <tr key={model.id}><td>{dossierName(model.dossier_id)}</td><td><strong>{model.display_name}</strong><small>{model.model_code}</small></td><td>{model.capability}</td><td>{model.grounding_allowed ? <span className={styles.good}>Autorisé</span> : <span className={styles.neutral}>Bloqué</span>}</td><td>{model.max_output_tokens ? formatNumber(model.max_output_tokens) : '—'}</td><td>{model.primary_for_capability ? 'Primaire' : 'Éligible'}</td><td><span className={statusClass(model.enabled ? 'active' : 'suspended')}>{model.enabled ? 'active' : 'disabled'}</span></td></tr>)}</tbody></table></div>
        {!snapshot?.models.length && <Empty title="Catalogue vide" body="Ajoutez les modèles que chaque dossier peut réellement utiliser."/>}
      </article>}

      {activeTab === 'grounding' && <article className={styles.panel}>
        <CardTitle eyebrow="GROUNDING GOVERNANCE" title="Recherche, preuves et consommation séparée"/>
        <div className={styles.groundingHero}><Search size={26}/><div><h3>Le grounding est une capacité gouvernée, pas un réglage global aveugle.</h3><p>Il n’est autorisé que si le modèle, le dossier, l’affectation et la capacité demandée le permettent simultanément.</p></div></div>
        <div className={styles.groundingGrid}>{snapshot?.models.filter((item) => item.grounding_allowed).map((model) => <article key={model.id}><strong>{model.display_name}</strong><span>{dossierName(model.dossier_id)}</span><p>{model.capability}</p><div><BadgeCheck size={16}/> Grounding autorisé</div></article>)}</div>
        {!snapshot?.models.some((item) => item.grounding_allowed) && <Empty title="Grounding non autorisé" body="Ajoutez un modèle compatible et activez explicitement le grounding dans sa politique."/>}
      </article>}

      {activeTab === 'usage' && <article className={styles.panel}>
        <CardTitle eyebrow="REQUEST LEDGER" title="Consommation détaillée" action={<div className={styles.segmentControl}>{([['day','Aujourd’hui'],['week','7 jours'],['month','Ce mois']] as const).map(([key,label]) => <button key={key} className={usageWindow === key ? styles.segmentActive : ''} onClick={() => setUsageWindow(key)}>{label}</button>)}</div>}/>
        <div className={styles.statsGridCompact}><Stat icon={Activity} label="Requêtes" value={formatNumber(usageWindowMetrics.requests)} detail={usageWindow === 'day' ? 'Aujourd’hui' : usageWindow === 'week' ? '7 derniers jours' : 'Mois en cours'} tone="blue"/><Stat icon={Search} label="Grounded" value={formatNumber(usageWindowMetrics.grounded)} detail="Recherche gouvernée" tone="navy"/><Stat icon={BrainCircuit} label="Tokens entrants" value={formatNumber(usageWindowMetrics.inputTokens)} detail="Mesurés par SANILA" tone="green"/><Stat icon={Zap} label="Tokens sortants" value={formatNumber(usageWindowMetrics.outputTokens)} detail="Mesurés par SANILA" tone="orange"/></div>
        <div className={styles.tableWrap}><table><thead><tr><th>Heure</th><th>Module</th><th>Dossier</th><th>Modèle</th><th>Capacité</th><th>Req.</th><th>Tokens</th><th>Latence</th><th>Résultat</th></tr></thead><tbody>{filteredUsage.map((row) => <tr key={row.id}><td>{formatDate(row.occurred_at)}</td><td>{modules.find((item) => item.key === row.module_key)?.label || row.module_key}</td><td>{dossierName(row.dossier_id)}</td><td>{row.model_code || '—'}</td><td>{row.capability}</td><td>{row.request_count}{row.grounded_request_count ? ' · G' : ''}</td><td>{formatNumber(row.total_tokens)}</td><td>{row.latency_ms ? `${row.latency_ms} ms` : '—'}</td><td><span className={statusClass(row.outcome)}>{row.outcome}</span></td></tr>)}</tbody></table></div>
        {!filteredUsage.length && <Empty title="Aucune requête gouvernée" body="Les appels passeront ici dès que Revenue OS ou Marketing AI utilisera une affectation active."/>}
      </article>}

      {activeTab === 'costs' && <article className={styles.panel}>
        <CardTitle eyebrow="FINANCIAL GOVERNANCE" title="Coûts estimés et réconciliation"/>
        <div className={styles.costHero}><WalletCards size={32}/><div><span>Dépense estimée enregistrée</span><strong>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(snapshot?.usage.reduce((sum, row) => sum + row.estimated_cost_usd, 0) || 0)}</strong><p>Mesure SANILA uniquement. Le rapprochement fournisseur reste identifié séparément dans chaque dossier.</p></div></div>
        <div className={styles.dossierGrid}>{snapshot?.dossiers.map((dossier) => { const rows = snapshot.usage.filter((item) => item.dossier_id === dossier.id); const cost = rows.reduce((sum, row) => sum + row.estimated_cost_usd, 0); return <article className={styles.costCard} key={dossier.id}><span>{dossier.billing_tier}</span><h3>{dossier.name}</h3><strong>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(cost)}</strong><p>{formatNumber(rows.reduce((sum, row) => sum + row.request_count, 0))} requêtes mesurées</p><div className={statusClass(dossier.reconciliation_state)}>{dossier.reconciliation_state}</div></article> })}</div>
      </article>}

      {activeTab === 'incidents' && <article className={styles.panel}>
        <CardTitle eyebrow="HEALTH & INCIDENTS" title="Santé, cooldowns et erreurs fournisseur"/>
        <div className={styles.twoColumns}>
          <div><h3 className={styles.sectionLabel}>Derniers contrôles de santé</h3><div className={styles.timeline}>{snapshot?.healthChecks.map((item) => <div key={text(item.id)}><span className={statusClass(item.status)}><Activity size={14}/></span><p><strong>{text(item.status)} · {text(item.model_code)}</strong><small>{formatDate(item.checked_at)} · {number(item.latency_ms)} ms</small></p></div>)}</div>{!snapshot?.healthChecks.length && <Empty title="Aucun contrôle" body="Testez une credential pour enregistrer sa santé."/>}</div>
          <div><h3 className={styles.sectionLabel}>Incidents ouverts</h3><div className={styles.timeline}>{snapshot?.incidents.map((item) => <div key={text(item.id)}><span className={statusClass(item.severity)}><AlertTriangle size={14}/></span><p><strong>{text(item.title)}</strong><small>{text(item.status)} · {formatDate(item.created_at)}</small></p></div>)}</div>{!snapshot?.incidents.length && <Empty title="Aucun incident" body="Aucune anomalie de routage, credential ou quota enregistrée."/>}</div>
        </div>
      </article>}

      {activeTab === 'versions' && <article className={styles.panel}>
        <CardTitle eyebrow="CONFIGURATION RELEASES" title="Versions, publication et preuve" action={<button className={styles.primaryButton} disabled={busy === 'publish_configuration'} onClick={() => void act('publish_configuration', { reason: 'Publication depuis le Control Plane' }, 'Nouvelle version de configuration publiée.') }><Save size={17}/> Publier la configuration</button>}/>
        <div className={styles.versionList}>{snapshot?.configVersions.map((version) => <article key={text(version.id)}><div><span>V{number(version.version_number)}</span><h3>{text(version.version_code)}</h3><p>{text(version.reason)}</p></div><dl><div><dt>État</dt><dd>{text(version.status)}</dd></div><div><dt>Publié</dt><dd>{formatDate(version.published_at)}</dd></div><div><dt>Checksum</dt><dd><code>{text(version.checksum).slice(0, 16)}…</code></dd></div></dl><button className={styles.secondaryButton} disabled={busy === 'rollback_configuration'} onClick={() => { if (window.confirm(`Restaurer ${text(version.version_code)} pour toutes les nouvelles requêtes ?`)) void act('rollback_configuration', { versionId: version.id, reason: `Rollback vers ${text(version.version_code)}` }, `Configuration restaurée depuis ${text(version.version_code)}.`) }}><TimerReset size={16}/> Restaurer cette version</button></article>)}</div>
        {!snapshot?.configVersions.length && <Empty title="Aucune version publiée" body="Publiez un snapshot complet après configuration des dossiers, affectations, modèles et quotas."/>}
      </article>}

      {activeTab === 'audit' && <article className={styles.panel}>
        <CardTitle eyebrow="IMMUTABLE GOVERNANCE LEDGER" title="Audit des décisions administratives"/>
        <div className={styles.tableWrap}><table><thead><tr><th>Date</th><th>Action</th><th>Entité</th><th>Autorité</th><th>Référence</th></tr></thead><tbody>{snapshot?.audit.map((item) => <tr key={text(item.id)}><td>{formatDate(item.created_at)}</td><td><strong>{text(item.action_key)}</strong></td><td>{text(item.entity_type)}</td><td>{text(item.actor_name)}</td><td><code>{shortId(item.entity_id)}</code></td></tr>)}</tbody></table></div>
      </article>}

      {activeTab === 'simulation' && <article className={styles.panel}>
        <CardTitle eyebrow="ZERO-CONSUMPTION LAB" title="Simuler un routage avant publication"/>
        <SimulationForm busy={busy === 'simulate_route'} onSubmit={(payload) => void act('simulate_route', payload, 'Simulation terminée sans appel Gemini.')} />
        {simulation != null && <pre className={styles.simulationResult}>{JSON.stringify(simulation, null, 2)}</pre>}
      </article>}
    </section>

    {modal && <Modal title={{ dossier: 'Créer un dossier fournisseur', credential: 'Ajouter une credential chiffrée', assignment: 'Affecter un fournisseur à un module', quota: 'Publier une politique de capacité', model: 'Ajouter une capacité modèle', routing: 'Configurer le routage' }[modal]} onClose={() => { setModal(null); setEditingQuota(null) }}>
      {modal === 'dossier' && <DossierForm busy={busy === 'create_dossier'} onSubmit={(payload) => void act('create_dossier', payload, 'Dossier fournisseur et capacity pool créés.')}/>}
      {modal === 'credential' && <CredentialForm snapshot={snapshot} busy={busy === 'store_credential'} onSubmit={(payload) => void act('store_credential', payload, 'Credential chiffrée et versionnée dans le Vault.')}/>}
      {modal === 'assignment' && <AssignmentForm snapshot={snapshot} busy={busy === 'save_assignment'} onSubmit={(payload) => void act('save_assignment', payload, 'Affectation module publiée pour les nouvelles requêtes.')}/>}
      {modal === 'quota' && <QuotaForm snapshot={snapshot} initial={editingQuota} busy={busy === 'save_quota'} onSubmit={(payload) => void act('save_quota', payload, 'Politique de capacité publiée instantanément.')}/>}
      {modal === 'model' && <ModelForm snapshot={snapshot} busy={busy === 'save_model'} onSubmit={(payload) => void act('save_model', payload, 'Modèle ajouté au catalogue du dossier.')}/>}
      {modal === 'routing' && <RoutingForm snapshot={snapshot} busy={busy === 'save_routing'} onSubmit={(payload) => void act('save_routing', payload, 'Règle de routage publiée.')}/>}
    </Modal>}
  </main>
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className={styles.modalBackdrop} onMouseDown={(event: MouseEvent<HTMLDivElement>) => { if (event.currentTarget === event.target) onClose() }}><section className={styles.modal} role="dialog" aria-modal="true" aria-label={title}><header><div><span>AI PROVIDER CONTROL</span><h2>{title}</h2></div><button onClick={onClose} aria-label="Fermer"><X size={20}/></button></header>{children}</section></div>
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) { return <label className={styles.field}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label> }
function Submit({ busy, label }: { busy: boolean; label: string }) { return <button className={styles.primaryButton} type="submit" disabled={busy}>{busy ? <Loader2 size={17} className={styles.spin}/> : <Save size={17}/>} {label}</button> }

function DossierForm({ busy, onSubmit }: { busy: boolean; onSubmit: (payload: JsonRecord) => void }) {
  return <form className={styles.form} onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); onSubmit(Object.fromEntries(data.entries())) }}><div className={styles.formGrid}><Field label="Fournisseur"><select name="providerType" defaultValue="openrouter"><option value="openrouter">OpenRouter — intelligence multi-modèle</option><option value="tavily">Tavily — recherche et extraction</option><option value="manual">Manual / aucun provider</option><option value="gemini">Gemini — compatibilité historique seulement</option></select></Field><Field label="Nom du dossier"><input name="name" required placeholder="OpenRouter Marketing Production"/></Field><Field label="Code"><input name="code" placeholder="OPENROUTER_MARKETING_PROD"/></Field><Field label="Libellé du compte"><input name="accountLabel" placeholder="Compte intelligence SANILA"/></Field><Field label="ID projet fournisseur"><input name="externalProjectId" placeholder="angelcare-market-ai"/></Field><Field label="Nom du capacity pool"><input name="projectName" placeholder="Marketing AI Capacity"/></Field><Field label="Tier de facturation"><select name="billingTier" defaultValue="paid"><option value="free">Free</option><option value="paid">Paid</option><option value="enterprise">Enterprise</option></select></Field><Field label="RPM fournisseur"><input type="number" name="providerRpm" min="0" placeholder="20"/></Field><Field label="TPM fournisseur"><input type="number" name="providerTpm" min="0" placeholder="250000"/></Field><Field label="RPD fournisseur"><input type="number" name="providerRpd" min="0" placeholder="500"/></Field><Field label="Research RPD fournisseur"><input type="number" name="providerGroundedRpd" min="0" placeholder="100"/></Field></div><div className={styles.formFooter}><p>Les limites provider restent informatives; SANILA applique ensuite ses quotas, autorités et fallbacks par capacité.</p><Submit busy={busy} label="Créer le dossier"/></div></form>
}

function CredentialForm({ snapshot, busy, onSubmit }: { snapshot: AiProviderSnapshot | null; busy: boolean; onSubmit: (payload: JsonRecord) => void }) {
  return <form className={styles.form} onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); onSubmit(Object.fromEntries(data.entries())) }}><div className={styles.securityNotice}><ShieldCheck size={20}/><div><strong>Secret write-only</strong><span>Après validation, seule l’empreinte restera visible.</span></div></div><div className={styles.formGrid}><Field label="Dossier"><select name="dossierId" required>{snapshot?.dossiers.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></Field><Field label="Capacity pool"><select name="capacityPoolId"><option value="">Automatique</option>{snapshot?.pools.map((item) => <option value={item.id} key={item.id}>{item.project_name}</option>)}</select></Field><Field label="Type de clé"><select name="keyType" defaultValue="auth_key"><option value="auth_key">Provider Auth Key</option><option value="standard_key">Standard API Key</option></select></Field><Field label="Secret fournisseur" hint="Le secret est envoyé uniquement au serveur puis chiffré dans Vault."><input type="password" name="secret" required autoComplete="new-password" placeholder="Coller la clé ici"/></Field></div><div className={styles.formFooter}><p>La credential sera créée en état « testing » avant activation.</p><Submit busy={busy} label="Chiffrer et versionner"/></div></form>
}

function AssignmentForm({ snapshot, busy, onSubmit }: { snapshot: AiProviderSnapshot | null; busy: boolean; onSubmit: (payload: JsonRecord) => void }) {
  return <form className={styles.form} onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); onSubmit({ ...Object.fromEntries(data.entries()), enabled: true, capabilityAllowlist: text(data.get('capabilityAllowlist')).split(',').map((item) => item.trim()).filter(Boolean) }) }}><div className={styles.formGrid}><Field label="Module SANILA"><select name="moduleKey">{modules.map((item) => <option value={item.key} key={item.key}>{item.label}</option>)}</select></Field><Field label="Dossier fournisseur"><select name="dossierId">{snapshot?.dossiers.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></Field><Field label="Capacity pool"><select name="capacityPoolId"><option value="">Pool actif du dossier</option>{snapshot?.pools.map((item) => <option value={item.id} key={item.id}>{item.project_name}</option>)}</select></Field><Field label="Mode"><select name="assignmentMode" defaultValue="primary"><option value="primary">Primary</option><option value="secondary">Secondary</option><option value="failover">Failover</option><option value="emergency_reserve">Emergency reserve</option><option value="sandbox">Sandbox</option><option value="manual">Manual only</option></select></Field><Field label="Priorité"><input type="number" name="priority" defaultValue="100" min="1"/></Field><Field label="Modèle primaire"><input name="primaryModel" placeholder="openai/gpt-4.1-mini ou anthropic/claude-sonnet-4"/></Field><Field label="Modèle fallback"><input name="fallbackModel" placeholder="Fallback OpenRouter approuvé"/></Field><Field label="Capacités autorisées"><input name="capabilityAllowlist" placeholder="structured_strategy,grounded_research"/></Field></div><div className={styles.formFooter}><p>Plus le nombre de priorité est bas, plus l’affectation est privilégiée.</p><Submit busy={busy} label="Publier l’affectation"/></div></form>
}

function QuotaForm({ snapshot, initial, busy, onSubmit }: { snapshot: AiProviderSnapshot | null; initial: AiProviderQuotaPolicy | null; busy: boolean; onSubmit: (payload: JsonRecord) => void }) {
  const [scope, setScope] = useState(initial?.scope_type || 'global')
  const scopeOptions = scope === 'module' ? modules : scope === 'dossier' ? snapshot?.dossiers.map((item) => ({ key: item.id, label: item.name })) || [] : scope === 'capacity_pool' ? snapshot?.pools.map((item) => ({ key: item.id, label: item.project_name })) || [] : [{ key: '*', label: 'Plateforme globale' }]
  const value = (numberValue: number | null | undefined) => numberValue == null ? undefined : numberValue
  return <form className={styles.form} onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); onSubmit({ ...Object.fromEntries(data.entries()), hardLimit: data.get('hardLimit') === 'on', enabled: true }) }}><div className={styles.formGrid}><Field label="Portée"><select name="scopeType" value={scope} onChange={(event: ChangeEvent<HTMLSelectElement>) => setScope(event.target.value)}><option value="global">Global</option><option value="module">Module</option><option value="dossier">Dossier</option><option value="capacity_pool">Capacity pool</option></select></Field><Field label="Cible"><select name="scopeKey" defaultValue={initial?.scope_key || scopeOptions[0]?.key}>{scopeOptions.map((item) => <option value={item.key} key={item.key}>{item.label}</option>)}</select></Field><Field label="Requêtes / minute"><input type="number" name="maxRequestsPerMinute" min="0" defaultValue={value(initial?.max_requests_per_minute)} placeholder="1"/></Field><Field label="Requêtes / heure"><input type="number" name="maxRequestsPerHour" min="0" defaultValue={value(initial?.max_requests_per_hour)} placeholder="2"/></Field><Field label="Requêtes / jour"><input type="number" name="maxRequestsPerDay" min="0" defaultValue={value(initial?.max_requests_per_day)} placeholder="5"/></Field><Field label="Requêtes / semaine"><input type="number" name="maxRequestsPerWeek" min="0" defaultValue={value(initial?.max_requests_per_week)} placeholder="20"/></Field><Field label="Requêtes / mois"><input type="number" name="maxRequestsPerMonth" min="0" defaultValue={value(initial?.max_requests_per_month)} placeholder="50"/></Field><Field label="Grounding / jour"><input type="number" name="maxGroundedRequestsPerDay" min="0" defaultValue={value(initial?.max_grounded_requests_per_day)} placeholder="1"/></Field><Field label="Concurrence"><input type="number" name="maxConcurrentRequests" min="1" defaultValue={value(initial?.max_concurrent_requests)} placeholder="1"/></Field><Field label="Tokens entrants / jour"><input type="number" name="maxInputTokensPerDay" min="0" defaultValue={value(initial?.max_input_tokens_per_day)} placeholder="50000"/></Field><Field label="Tokens entrants / semaine"><input type="number" name="maxInputTokensPerWeek" min="0" defaultValue={value(initial?.max_input_tokens_per_week)} placeholder="200000"/></Field><Field label="Tokens sortants / jour"><input type="number" name="maxOutputTokensPerDay" min="0" defaultValue={value(initial?.max_output_tokens_per_day)} placeholder="10000"/></Field><Field label="Tokens sortants / semaine"><input type="number" name="maxOutputTokensPerWeek" min="0" defaultValue={value(initial?.max_output_tokens_per_week)} placeholder="40000"/></Field><Field label="Tokens totaux / semaine"><input type="number" name="maxTotalTokensPerWeek" min="0" defaultValue={value(initial?.max_total_tokens_per_week)} placeholder="240000"/></Field><Field label="Coût max / jour USD"><input type="number" step="0.0001" name="maxEstimatedCostUsdPerDay" min="0" defaultValue={value(initial?.max_estimated_cost_usd_per_day)} placeholder="0.20"/></Field><Field label="Coût max / semaine USD"><input type="number" step="0.0001" name="maxEstimatedCostUsdPerWeek" min="0" defaultValue={value(initial?.max_estimated_cost_usd_per_week)} placeholder="0.80"/></Field><Field label="Coût max / mois USD"><input type="number" step="0.0001" name="maxEstimatedCostUsdPerMonth" min="0" defaultValue={value(initial?.max_estimated_cost_usd_per_month)} placeholder="3.00"/></Field><Field label="Réserve urgence"><input type="number" name="emergencyReserveRequests" min="0" defaultValue={initial?.emergency_reserve_requests ?? 0}/></Field><Field label="Seuil d’alerte %"><input type="number" name="softThresholdPercent" min="1" max="100" defaultValue={initial?.soft_threshold_percent ?? 80}/></Field><Field label="Fuseau reset"><input name="resetTimezone" defaultValue={initial?.reset_timezone || 'Africa/Casablanca'}/></Field><label className={styles.check}><input type="checkbox" name="hardLimit" defaultChecked={initial?.hard_limit ?? true}/><span>Blocage dur après épuisement</span></label></div><div className={styles.formFooter}><p>{initial ? 'Cette politique remplacera instantanément la version active pour les nouvelles requêtes.' : 'Les nouvelles requêtes respectent la politique immédiatement après publication.'}</p><Submit busy={busy} label={initial ? 'Publier la reconfiguration' : 'Publier la capacité'}/></div></form>
}

function ModelForm({ snapshot, busy, onSubmit }: { snapshot: AiProviderSnapshot | null; busy: boolean; onSubmit: (payload: JsonRecord) => void }) {
  return <form className={styles.form} onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); onSubmit({ ...Object.fromEntries(data.entries()), enabled: true, groundingAllowed: data.get('groundingAllowed') === 'on', primaryForCapability: data.get('primaryForCapability') === 'on' }) }}><div className={styles.formGrid}><Field label="Dossier"><select name="dossierId">{snapshot?.dossiers.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></Field><Field label="Code modèle"><input name="modelCode" required placeholder="openai/gpt-4.1-mini ou anthropic/claude-sonnet-4"/></Field><Field label="Nom affiché"><input name="displayName" placeholder="Modèle OpenRouter approuvé"/></Field><Field label="Capacité"><select name="capability"><option value="general">General</option><option value="structured_strategy">Structured strategy</option><option value="structured_content">Structured content</option><option value="grounded_research">Grounded research</option></select></Field><Field label="Sortie maximale"><input type="number" name="maxOutputTokens" min="64" placeholder="4096"/></Field><label className={styles.check}><input type="checkbox" name="groundingAllowed"/><span>Grounding autorisé</span></label><label className={styles.check}><input type="checkbox" name="primaryForCapability"/><span>Primaire pour cette capacité</span></label></div><div className={styles.formFooter}><p>Le catalogue n’accorde aucun accès tant qu’une affectation active ne l’utilise pas.</p><Submit busy={busy} label="Ajouter le modèle"/></div></form>
}

function RoutingForm({ snapshot, busy, onSubmit }: { snapshot: AiProviderSnapshot | null; busy: boolean; onSubmit: (payload: JsonRecord) => void }) {
  return <form className={styles.form} onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); onSubmit({ ...Object.fromEntries(data.entries()), enabled: true, stickyMission: data.get('stickyMission') === 'on', fallbackAssignmentIds: data.getAll('fallbackAssignmentIds') }) }}><div className={styles.formGrid}><Field label="Module"><select name="moduleKey">{modules.map((item) => <option value={item.key} key={item.key}>{item.label}</option>)}</select></Field><Field label="Capacité"><input name="capability" defaultValue="*"/></Field><Field label="Mode"><select name="routingMode"><option value="exclusive">Exclusive</option><option value="primary_fallback">Primary + fallback</option><option value="capacity_aware">Capacity aware</option><option value="cost_aware">Cost aware</option><option value="manual">Manual</option></select></Field><Field label="Affectation primaire"><select name="primaryAssignmentId"><option value="">Priorité automatique</option>{snapshot?.assignments.map((item) => <option value={item.id} key={item.id}>{modules.find((m) => m.key === item.module_key)?.label} · {dossierNameStatic(snapshot, item.dossier_id)} · {item.assignment_mode}</option>)}</select></Field><Field label="Failover(s)"><select name="fallbackAssignmentIds" multiple size={4}>{snapshot?.assignments.map((item) => <option value={item.id} key={item.id}>{modules.find((m) => m.key === item.module_key)?.label} · {dossierNameStatic(snapshot, item.dossier_id)}</option>)}</select></Field><label className={styles.check}><input type="checkbox" name="stickyMission" defaultChecked/><span>Conserver un fournisseur par mission</span></label></div><div className={styles.formFooter}><p>Le failover vers deux clés du même project pool ne crée pas une capacité indépendante.</p><Submit busy={busy} label="Publier le routage"/></div></form>
}

function SimulationForm({ busy, onSubmit }: { busy: boolean; onSubmit: (payload: JsonRecord) => void }) {
  return <form className={`${styles.form} ${styles.simulationForm}`} onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); onSubmit({ ...Object.fromEntries(data.entries()), grounded: data.get('grounded') === 'on' }) }}><div className={styles.formGrid}><Field label="Module"><select name="moduleKey">{modules.map((item) => <option value={item.key} key={item.key}>{item.label}</option>)}</select></Field><Field label="Capacité"><select name="capability"><option value="structured_strategy">Structured strategy</option><option value="structured_content">Structured content</option><option value="grounded_research">Grounded research</option><option value="general">General</option></select></Field><Field label="Modèle demandé"><input name="requestedModel" placeholder="Laisser vide pour routage"/></Field><Field label="Requêtes estimées"><input name="estimatedRequests" type="number" min="1" defaultValue="1"/></Field><label className={styles.check}><input name="grounded" type="checkbox"/><span>Grounding demandé</span></label></div><div className={styles.formFooter}><p>Aucune requête fournisseur n’est consommée par cette simulation.</p><Submit busy={busy} label="Simuler le routage"/></div></form>
}

function dossierNameStatic(snapshot: AiProviderSnapshot | null, id: string) { return snapshot?.dossiers.find((item) => item.id === id)?.name || shortId(id) }
