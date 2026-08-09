'use client'

import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  Activity, AlertTriangle, BadgeCheck, Ban, CalendarClock, CheckCircle2,
  CircleDollarSign, Clock3, DatabaseZap, Gauge, History, Loader2, PauseCircle,
  PlayCircle, Plus, RefreshCw, Repeat2, Save, ShieldCheck, Sparkles, TimerReset,
  X, Zap,
} from 'lucide-react'
import type {
  AiProviderCommandPolicy,
  AiProviderCommandSchedule,
  AiProviderSnapshot,
  JsonRecord,
} from '@/lib/ai-provider-control/types'
import styles from './ai-provider-control.module.css'

type Mode = 'overview' | 'policies' | 'schedules' | 'reuse'
type Action = (action: string, payload: JsonRecord, success: string) => Promise<unknown>

type Props = {
  mode: Mode
  snapshot: AiProviderSnapshot | null
  busy: string
  onAction: Action
}

const money = (value: unknown) => new Intl.NumberFormat('fr-FR', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 4,
}).format(Number(value || 0))
const number = (value: unknown) => new Intl.NumberFormat('fr-FR').format(Number(value || 0))
const date = (value: unknown) => value
  ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(String(value)))
  : '—'

function Title({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return <div className={styles.cardTitle}><div><span>{eyebrow}</span><h2>{title}</h2></div>{children}</div>
}

function MiniStat({ icon: Icon, label, value, detail, tone = 'blue' }: {
  icon: typeof Activity; label: string; value: string; detail: string; tone?: string
}) {
  return <article className={`${styles.stat} ${styles[`tone_${tone}`] || ''}`}>
    <div className={styles.statIcon}><Icon size={20}/></div>
    <div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
  </article>
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className={styles.field}><span>{label}</span>{children}{hint ? <small>{hint}</small> : null}</label>
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className={styles.modalBackdrop} onMouseDown={(event) => { if (event.currentTarget === event.target) onClose() }}>
    <section className={styles.modal} role="dialog" aria-modal="true" aria-label={title}>
      <header><div><span>AI SOVEREIGNTY · REVENUE OS</span><h2>{title}</h2></div><button type="button" onClick={onClose} aria-label="Fermer"><X size={20}/></button></header>
      {children}
    </section>
  </div>
}

export default function RevenueSovereigntyWorkspace({ mode, snapshot, busy, onAction }: Props) {
  const [policyModal, setPolicyModal] = useState<AiProviderCommandPolicy | 'new' | null>(null)
  const [scheduleModal, setScheduleModal] = useState<AiProviderCommandSchedule | 'new' | null>(null)

  const revenuePolicies = useMemo(
    () => (snapshot?.commandPolicies || []).filter((item) => item.module_key === 'revenue_os'),
    [snapshot],
  )
  const revenueSchedules = useMemo(
    () => (snapshot?.schedules || []).filter((item) => item.module_key === 'revenue_os'),
    [snapshot],
  )
  const revenueRequests = useMemo(
    () => (snapshot?.governedRequests || []).filter((item) => item.module_key === 'revenue_os'),
    [snapshot],
  )
  const revenueCache = useMemo(
    () => (snapshot?.structuredCache || []).filter((item) => item.module_key === 'revenue_os'),
    [snapshot],
  )
  const revenueQuota = useMemo(
    () => (snapshot?.quotas || []).find((item) => item.scope_type === 'module' && item.scope_key === 'revenue_os'),
    [snapshot],
  )
  const revenueRollups = useMemo(() => {
    const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0)
    const weekStart = new Date(dayStart); weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))
    const usage = (snapshot?.usage || []).filter((item) => item.module_key === 'revenue_os')
    const today = usage.filter((item) => new Date(item.occurred_at) >= dayStart)
    const week = usage.filter((item) => new Date(item.occurred_at) >= weekStart)
    const reuse = (snapshot?.reuseEvents || []).filter((item) => item.module_key === 'revenue_os')
    const sum = (rows: JsonRecord[], key: string) => rows.reduce((total, item) => total + Number(item[key] || 0), 0)
    return {
      todayRequests: today.reduce((total, item) => total + Number(item.request_count || 0), 0),
      weekRequests: week.reduce((total, item) => total + Number(item.request_count || 0), 0),
      weekInputTokens: week.reduce((total, item) => total + Number(item.input_tokens || 0), 0),
      weekOutputTokens: week.reduce((total, item) => total + Number(item.output_tokens || 0), 0),
      weekCostUsd: week.reduce((total, item) => total + Number(item.estimated_cost_usd || 0), 0),
      cacheHits: revenueRequests.filter((item) => item.decision === 'REUSE_CACHED').length,
      joinedRequests: revenueRequests.filter((item) => item.decision === 'JOIN_IN_FLIGHT').length,
      blockedRequests: revenueRequests.filter((item) => ['blocked','deferred','failed'].includes(item.status) || item.decision.startsWith('BLOCK_')).length,
      avoidedRequests: sum(reuse, 'avoided_requests'),
      avoidedTokens: sum(reuse, 'avoided_input_tokens') + sum(reuse, 'avoided_output_tokens'),
      avoidedCostUsd: sum(reuse, 'avoided_cost_usd'),
      activeSchedules: revenueSchedules.filter((item) => item.enabled && item.status === 'active').length,
      suspendedCommands: revenuePolicies.filter((item) => !item.enabled || item.ai_mode === 'ai_prohibited').length,
    }
  }, [snapshot, revenuePolicies, revenueRequests, revenueSchedules])

  const dayLimit = Number(revenueQuota?.max_requests_per_day || 0)
  const weekLimit = Number(revenueQuota?.max_requests_per_week || 0)
  const dayRemaining = dayLimit ? Math.max(0, dayLimit - Number(revenueRollups.todayRequests || 0)) : null
  const weekRemaining = weekLimit ? Math.max(0, weekLimit - Number(revenueRollups.weekRequests || 0)) : null

  if (mode === 'overview') return <>
    <div className={styles.sovereigntyBanner}>
      <div><span>REVENUE OS · CENTRAL AI AUTHORITY</span><h2>Consommation, répétition et économies sous contrôle</h2><p>Chaque demande Revenue OS passe par préflight, politique de commande, déduplication, budget journalier/hebdomadaire et routage fournisseur avant tout appel Gemini.</p></div>
      <a href="/revenue-command-os/gemini-resources"><Sparkles size={16}/> Voir côté Revenue OS</a>
    </div>
    <div className={styles.statsGrid}>
      <MiniStat icon={Activity} label="Aujourd’hui" value={number(revenueRollups.todayRequests)} detail={dayRemaining === null ? 'Aucun plafond journalier' : `${number(dayRemaining)} requêtes restantes`} />
      <MiniStat icon={CalendarClock} label="Cette semaine" value={number(revenueRollups.weekRequests)} detail={weekRemaining === null ? 'Plafond hebdomadaire non défini' : `${number(weekRemaining)} requêtes restantes`} tone="navy" />
      <MiniStat icon={Repeat2} label="Demandes évitées" value={number(revenueRollups.avoidedRequests)} detail={`${number(revenueRollups.cacheHits)} cache · ${number(revenueRollups.joinedRequests)} jointes`} tone="green" />
      <MiniStat icon={CircleDollarSign} label="Coût évité" value={money(revenueRollups.avoidedCostUsd)} detail={`${number(revenueRollups.avoidedTokens)} tokens évités`} tone="orange" />
    </div>
    <div className={styles.twoColumnsWide}>
      <article className={styles.panel}>
        <Title eyebrow="REVENUE COMMAND POLICIES" title="Enveloppes d’exécution par capacité"><button className={styles.primaryButton} onClick={() => setPolicyModal('new')}><Plus size={16}/> Nouvelle politique</button></Title>
        <div className={styles.sovereigntyPolicyList}>{revenuePolicies.length ? revenuePolicies.slice(0, 10).map((policy) => <button key={policy.id} type="button" onClick={() => setPolicyModal(policy)}>
          <span className={policy.enabled ? styles.good : styles.bad}>{policy.enabled ? 'active' : 'suspendue'}</span>
          <div><strong>{policy.command_code}</strong><small>{policy.workspace_key} · {policy.ai_mode} · cache {policy.cache_mode}</small></div>
          <dl><div><dt>Jour</dt><dd>{policy.max_runs_per_day ?? '—'}</dd></div><div><dt>Semaine</dt><dd>{policy.max_runs_per_week ?? '—'}</dd></div><div><dt>Intervalle</dt><dd>{number(policy.minimum_interval_seconds)} s</dd></div></dl>
        </button>) : <div className={styles.empty}><ShieldCheck size={25}/><strong>Aucune politique Revenue publiée</strong><p>Publiez les enveloppes avant d’autoriser de nouveaux appels IA.</p></div>}</div>
      </article>
      <article className={styles.panel}>
        <Title eyebrow="LIVE GOVERNED REQUESTS" title="Dernières décisions du gateway" />
        <div className={styles.requestLedger}>{revenueRequests.length ? revenueRequests.slice(0, 12).map((request) => <div key={request.id}>
          <span className={request.decision === 'EXECUTE_NEW' ? styles.warn : request.decision === 'REUSE_CACHED' || request.decision === 'JOIN_IN_FLIGHT' ? styles.good : styles.bad}>{request.decision}</span>
          <div><strong>{request.command_code || request.capability}</strong><small>{request.workspace_key} · {request.model_code || request.requested_model || 'routage'} · {date(request.created_at)}</small></div>
          <div className={styles.requestCost}><strong>{money(request.actual_cost_usd || request.estimated_cost_usd)}</strong><small>{number(request.actual_input_tokens + request.actual_output_tokens)} tokens</small></div>
          {['queued','running','joined'].includes(request.status) ? <button className={styles.requestCancel} disabled={busy === 'cancel_governed_request'} onClick={() => { const reason = window.prompt('Motif d’annulation'); if (reason) void onAction('cancel_governed_request', { id: request.id, reason }, 'Demande gouvernée annulée et budget libéré.') }}><X size={13}/> Annuler</button> : null}
        </div>) : <div className={styles.empty}><DatabaseZap size={25}/><strong>Aucune demande gouvernée</strong><p>Après migration Phase 5, toute exécution Revenue apparaîtra ici avec sa décision réelle.</p></div>}</div>
      </article>
    </div>
    <div className={styles.statsGridCompact}>
      <MiniStat icon={PlayCircle} label="Schedules actifs" value={number(revenueRollups.activeSchedules)} detail={`${revenueSchedules.length} planification(s) Revenue`} tone="green" />
      <MiniStat icon={PauseCircle} label="Commandes suspendues" value={number(revenueRollups.suspendedCommands)} detail="Protection après erreur ou décision" tone="red" />
      <MiniStat icon={Ban} label="Demandes bloquées" value={number(revenueRollups.blockedRequests)} detail="Aucun appel fournisseur consommé" tone="red" />
      <MiniStat icon={Gauge} label="Coût semaine" value={money(revenueRollups.weekCostUsd)} detail={`${number(Number(revenueRollups.weekInputTokens || 0) + Number(revenueRollups.weekOutputTokens || 0))} tokens`} tone="navy" />
    </div>
    {policyModal ? <PolicyModal initial={policyModal === 'new' ? null : policyModal} busy={busy === 'save_command_policy'} onClose={() => setPolicyModal(null)} onSave={async (payload) => { await onAction('save_command_policy', payload, 'Politique Revenue publiée.'); setPolicyModal(null) }}/>: null}
  </>

  if (mode === 'policies') return <article className={styles.panel}>
    <Title eyebrow="PER-COMMAND OPERATING ENVELOPES" title="Politiques IA Revenue OS"><button className={styles.primaryButton} onClick={() => setPolicyModal('new')}><Plus size={16}/> Politique</button></Title>
    <div className={styles.tableWrap}><table><thead><tr><th>Commande</th><th>Workspace</th><th>Mode IA</th><th>Fréquence</th><th>Tokens/run</th><th>Coût</th><th>Cache/doublon</th><th>État</th><th>Action</th></tr></thead><tbody>{revenuePolicies.map((policy) => <tr key={policy.id}>
      <td><strong>{policy.command_code}</strong><small>{policy.approval_class}</small></td><td>{policy.workspace_key}</td><td>{policy.ai_mode}</td><td><strong>{policy.max_runs_per_day ?? '—'} / jour</strong><small>{policy.max_runs_per_week ?? '—'} / semaine · min {number(policy.minimum_interval_seconds)} s</small></td><td>{number(policy.max_input_tokens_per_run)} in<br/>{number(policy.max_output_tokens_per_run)} out</td><td><strong>{money(policy.max_cost_usd_per_run)}</strong><small>{money(policy.max_cost_usd_per_week)} / semaine</small></td><td>{policy.cache_mode}<small>{number(policy.cache_ttl_seconds)} s · doublon {number(policy.duplicate_window_seconds)} s</small></td><td><span className={policy.enabled ? styles.good : styles.bad}>{policy.enabled ? 'active' : 'suspendue'}</span></td><td><button className={styles.secondaryButton} onClick={() => setPolicyModal(policy)}>Modifier</button></td>
    </tr>)}</tbody></table></div>
    {!revenuePolicies.length ? <div className={styles.empty}><ShieldCheck size={25}/><strong>Aucune politique Revenue</strong><p>La migration fournit un socle conservateur; publiez ensuite les enveloppes adaptées.</p></div> : null}
    {policyModal ? <PolicyModal initial={policyModal === 'new' ? null : policyModal} busy={busy === 'save_command_policy'} onClose={() => setPolicyModal(null)} onSave={async (payload) => { await onAction('save_command_policy', payload, 'Politique Revenue publiée.'); setPolicyModal(null) }}/>: null}
  </article>

  if (mode === 'schedules') return <article className={styles.panel}>
    <Title eyebrow="SCHEDULED COMMAND GOVERNANCE" title="Planifications Revenue OS"><button className={styles.primaryButton} onClick={() => setScheduleModal('new')}><Plus size={16}/> Planification</button></Title>
    <div className={styles.scheduleGrid}>{revenueSchedules.map((schedule) => <article key={schedule.id}>
      <header><div><span>{schedule.schedule_format}</span><h3>{schedule.command_code}</h3><p>{schedule.schedule_key}</p></div><span className={schedule.status === 'active' ? styles.good : schedule.status === 'paused' ? styles.warn : styles.bad}>{schedule.status}</span></header>
      <dl><div><dt>Expression</dt><dd>{schedule.schedule_expression}</dd></div><div><dt>Fuseau</dt><dd>{schedule.timezone}</dd></div><div><dt>Jour/semaine</dt><dd>{schedule.max_runs_per_day ?? '—'} / {schedule.max_runs_per_week ?? '—'}</dd></div><div><dt>Fraîcheur</dt><dd>{number(schedule.freshness_seconds)} s</dd></div><div><dt>Coût estimé</dt><dd>{money(schedule.estimated_cost_usd)}</dd></div><div><dt>Prochain run</dt><dd>{date(schedule.next_run_at)}</dd></div></dl>
      <div className={styles.scheduleActions}><button className={styles.secondaryButton} onClick={() => setScheduleModal(schedule)}>Configurer</button>{schedule.status === 'active' ? <button className={styles.secondaryButton} disabled={busy === 'set_schedule_status'} onClick={() => void onAction('set_schedule_status', { id: schedule.id, status: 'paused' }, 'Planification mise en pause.')}><PauseCircle size={15}/> Pause</button> : <button className={styles.primaryButton} disabled={busy === 'set_schedule_status'} onClick={() => void onAction('set_schedule_status', { id: schedule.id, status: 'active' }, 'Planification activée.')}><PlayCircle size={15}/> Activer</button>}</div>
    </article>)}</div>
    {!revenueSchedules.length ? <div className={styles.empty}><CalendarClock size={25}/><strong>Aucune planification Revenue</strong><p>Créez une cadence uniquement pour les commandes dont la fraîcheur, le budget et les dépendances sont maîtrisés.</p></div> : null}
    {scheduleModal ? <ScheduleModal initial={scheduleModal === 'new' ? null : scheduleModal} busy={busy === 'save_schedule'} onClose={() => setScheduleModal(null)} onSave={async (payload) => { await onAction('save_schedule', payload, 'Planification Revenue publiée.'); setScheduleModal(null) }}/>: null}
  </article>

  return <article className={styles.panel}>
    <Title eyebrow="REUSE, DEDUPLICATION & SAVINGS" title="Résultats structurés réutilisables" />
    <div className={styles.statsGridCompact}>
      <MiniStat icon={Repeat2} label="Cache hits" value={number(revenueRollups.cacheHits)} detail="Réponses structurées réutilisées" tone="green" />
      <MiniStat icon={Zap} label="Jointures in-flight" value={number(revenueRollups.joinedRequests)} detail="Appels concurrents fusionnés" tone="blue" />
      <MiniStat icon={DatabaseZap} label="Tokens évités" value={number(revenueRollups.avoidedTokens)} detail="Économie de contexte et sortie" tone="navy" />
      <MiniStat icon={CircleDollarSign} label="Coût évité" value={money(revenueRollups.avoidedCostUsd)} detail="Économie estimée centralisée" tone="orange" />
    </div>
    <div className={styles.tableWrap}><table><thead><tr><th>Fingerprint</th><th>Commande</th><th>Modèle</th><th>Créé/expiration</th><th>Réutilisation</th><th>Économie</th><th>État</th><th>Action</th></tr></thead><tbody>{revenueCache.map((item) => <tr key={item.id}>
      <td><code>{item.request_fingerprint.slice(0, 14)}…</code><small>{item.workspace_key}</small></td><td><strong>{item.command_code || item.capability}</strong><small>{item.prompt_version || 'prompt versionné'}</small></td><td>{item.provider_type}<small>{item.model_code}</small></td><td>{date(item.created_at)}<small>expire {date(item.expires_at)}</small></td><td><strong>{number(item.reuse_count)}</strong><small>dernier {date(item.updated_at)}</small></td><td>{money(item.avoided_cost_usd)}<small>{number(item.avoided_input_tokens + item.avoided_output_tokens)} tokens</small></td><td><span className={!item.invalidated_at ? styles.good : styles.bad}>{item.invalidated_at ? 'invalidé' : item.validation_status}</span></td><td><button className={styles.secondaryButton} disabled={!!item.invalidated_at || busy === 'invalidate_cache'} onClick={() => { const reason = window.prompt('Motif obligatoire d’invalidation'); if (reason) void onAction('invalidate_cache', { requestFingerprint: item.request_fingerprint, reason }, 'Résultat cache invalidé.')}}><RefreshCw size={14}/> Invalider</button></td>
    </tr>)}</tbody></table></div>
    {!revenueCache.length ? <div className={styles.empty}><Repeat2 size={25}/><strong>Aucun résultat réutilisable</strong><p>Les résultats validés apparaîtront après les premières exécutions gouvernées.</p></div> : null}
  </article>
}

function PolicyModal({ initial, busy, onClose, onSave }: { initial: AiProviderCommandPolicy | null; busy: boolean; onClose: () => void; onSave: (payload: JsonRecord) => Promise<void> }) {
  return <Modal title={initial ? `Politique · ${initial.command_code}` : 'Nouvelle politique Revenue'} onClose={onClose}>
    <form className={styles.form} onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); void onSave({ ...Object.fromEntries(data.entries()), moduleKey: 'revenue_os', manualAllowed: data.get('manualAllowed') === 'on', scheduledAllowed: data.get('scheduledAllowed') === 'on', forceRefreshAllowed: data.get('forceRefreshAllowed') === 'on', enabled: data.get('enabled') === 'on' }) }}>
      <div className={styles.formGrid}>
        <Field label="Workspace"><input name="workspaceKey" required defaultValue={initial?.workspace_key || 'strategy-engine'}/></Field>
        <Field label="Commande"><input name="commandCode" required defaultValue={initial?.command_code || 'REVENUE_'}/></Field>
        <Field label="Mode IA"><select name="aiMode" defaultValue={initial?.ai_mode || 'ai_required'}><option value="deterministic">Deterministic</option><option value="ai_optional">AI optional</option><option value="ai_recommended">AI recommended</option><option value="ai_required">AI required</option><option value="ai_prohibited">AI prohibited</option></select></Field>
        <Field label="Approbation"><select name="approvalClass" defaultValue={initial?.approval_class || 'none'}><option value="none">Aucune</option><option value="manager">Manager</option><option value="executive">Executive</option><option value="break_glass">Break glass</option></select></Field>
        <Field label="Intervalle minimum (s)"><input type="number" min="0" name="minimumIntervalSeconds" defaultValue={initial?.minimum_interval_seconds ?? 900}/></Field>
        <Field label="Runs / jour"><input type="number" min="0" name="maxRunsPerDay" defaultValue={initial?.max_runs_per_day ?? 5}/></Field>
        <Field label="Runs / semaine"><input type="number" min="0" name="maxRunsPerWeek" defaultValue={initial?.max_runs_per_week ?? 20}/></Field>
        <Field label="Runs / mois"><input type="number" min="0" name="maxRunsPerMonth" defaultValue={initial?.max_runs_per_month ?? 60}/></Field>
        <Field label="Tokens entrants / run"><input type="number" min="0" name="maxInputTokensPerRun" defaultValue={initial?.max_input_tokens_per_run ?? 30000}/></Field>
        <Field label="Tokens sortants / run"><input type="number" min="0" name="maxOutputTokensPerRun" defaultValue={initial?.max_output_tokens_per_run ?? 6000}/></Field>
        <Field label="Coût max / run USD"><input type="number" step="0.0001" min="0" name="maxCostUsdPerRun" defaultValue={initial?.max_cost_usd_per_run ?? 0.05}/></Field>
        <Field label="Coût max / jour USD"><input type="number" step="0.0001" min="0" name="maxCostUsdPerDay" defaultValue={initial?.max_cost_usd_per_day ?? 0.2}/></Field>
        <Field label="Coût max / semaine USD"><input type="number" step="0.0001" min="0" name="maxCostUsdPerWeek" defaultValue={initial?.max_cost_usd_per_week ?? 0.8}/></Field>
        <Field label="Cache"><select name="cacheMode" defaultValue={initial?.cache_mode || 'until_source_changes'}><option value="no_cache">No cache</option><option value="short">Short</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="until_source_changes">Until source changes</option></select></Field>
        <Field label="TTL cache (s)"><input type="number" min="0" name="cacheTtlSeconds" defaultValue={initial?.cache_ttl_seconds ?? 21600}/></Field>
        <Field label="Fenêtre doublon (s)"><input type="number" min="0" name="duplicateWindowSeconds" defaultValue={initial?.duplicate_window_seconds ?? 900}/></Field>
        <Field label="Retries maximum"><input type="number" min="0" name="maxRetries" defaultValue={initial?.max_retries ?? 1}/></Field>
        <Field label="Cooldown échec (s)"><input type="number" min="0" name="cooldownAfterFailureSeconds" defaultValue={initial?.cooldown_after_failure_seconds ?? 900}/></Field>
        <Field label="Suspension après N échecs"><input type="number" min="0" name="consecutiveFailureSuspendThreshold" defaultValue={initial?.consecutive_failure_suspend_threshold ?? 3}/></Field>
        <Field label="Providers autorisés" hint="Séparés par virgules"><input name="allowedProviderTypes" defaultValue={initial?.allowed_provider_types?.join(',') || 'gemini'}/></Field>
        <Field label="Modèles autorisés" hint="Vide = routage central"><input name="allowedModels" defaultValue={initial?.allowed_models?.join(',') || ''}/></Field>
        <Field label="Triggers autorisés" hint="manual,scheduled,retry,forced_refresh"><input name="allowedTriggerTypes" defaultValue={initial?.allowed_trigger_types?.join(',') || 'manual'}/></Field>
        <label className={styles.check}><input type="checkbox" name="manualAllowed" defaultChecked={initial?.manual_allowed ?? true}/><span>Exécution manuelle</span></label>
        <label className={styles.check}><input type="checkbox" name="scheduledAllowed" defaultChecked={initial?.scheduled_allowed ?? false}/><span>Exécution planifiée</span></label>
        <label className={styles.check}><input type="checkbox" name="forceRefreshAllowed" defaultChecked={initial?.force_refresh_allowed ?? false}/><span>Force refresh autorisé</span></label>
        <label className={styles.check}><input type="checkbox" name="enabled" defaultChecked={initial?.enabled ?? true}/><span>Politique active</span></label>
      </div>
      <div className={styles.formFooter}><p>Le gateway applique cette enveloppe avant toute consommation fournisseur.</p><button className={styles.primaryButton} type="submit" disabled={busy}>{busy ? <Loader2 className={styles.spin} size={16}/> : <Save size={16}/>} Publier</button></div>
    </form>
  </Modal>
}

function ScheduleModal({ initial, busy, onClose, onSave }: { initial: AiProviderCommandSchedule | null; busy: boolean; onClose: () => void; onSave: (payload: JsonRecord) => Promise<void> }) {
  return <Modal title={initial ? `Planification · ${initial.schedule_key}` : 'Nouvelle planification Revenue'} onClose={onClose}>
    <form className={styles.form} onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); void onSave({ ...Object.fromEntries(data.entries()), moduleKey: 'revenue_os', enabled: data.get('enabled') === 'on', approvalRequired: data.get('approvalRequired') === 'on' }) }}>
      <div className={styles.formGrid}>
        <Field label="Clé planification"><input name="scheduleKey" required defaultValue={initial?.schedule_key || 'REVENUE-'}/></Field>
        <Field label="Workspace"><input name="workspaceKey" required defaultValue={initial?.workspace_key || 'strategy-engine'}/></Field>
        <Field label="Commande"><input name="commandCode" required defaultValue={initial?.command_code || 'REVENUE_'}/></Field>
        <Field label="Format"><select name="scheduleFormat" defaultValue={initial?.schedule_format || 'cron'}><option value="cron">Cron</option><option value="rrule">RRULE</option><option value="interval">Interval</option></select></Field>
        <Field label="Expression"><input name="scheduleExpression" required defaultValue={initial?.schedule_expression || '0 8 * * 1-5'}/></Field>
        <Field label="Fuseau"><input name="timezone" defaultValue={initial?.timezone || 'Africa/Casablanca'}/></Field>
        <Field label="Priorité"><input type="number" name="priority" defaultValue={initial?.priority ?? 100}/></Field>
        <Field label="Fraîcheur minimum (s)"><input type="number" min="0" name="freshnessSeconds" defaultValue={initial?.freshness_seconds ?? 21600}/></Field>
        <Field label="Fenêtre doublon (s)"><input type="number" min="0" name="duplicateWindowSeconds" defaultValue={initial?.duplicate_window_seconds ?? 900}/></Field>
        <Field label="Runs / jour"><input type="number" min="0" name="maxRunsPerDay" defaultValue={initial?.max_runs_per_day ?? 1}/></Field>
        <Field label="Runs / semaine"><input type="number" min="0" name="maxRunsPerWeek" defaultValue={initial?.max_runs_per_week ?? 5}/></Field>
        <Field label="Tokens entrants estimés"><input type="number" min="0" name="estimatedInputTokens" defaultValue={initial?.estimated_input_tokens ?? 12000}/></Field>
        <Field label="Tokens sortants estimés"><input type="number" min="0" name="estimatedOutputTokens" defaultValue={initial?.estimated_output_tokens ?? 2500}/></Field>
        <Field label="Coût estimé USD"><input type="number" step="0.0001" min="0" name="estimatedCostUsd" defaultValue={initial?.estimated_cost_usd ?? 0.02}/></Field>
        <Field label="Prochain run"><input type="datetime-local" name="nextRunAt" defaultValue={initial?.next_run_at ? new Date(initial.next_run_at).toISOString().slice(0,16) : ''}/></Field>
        <label className={styles.check}><input type="checkbox" name="approvalRequired" defaultChecked={initial?.approval_required ?? false}/><span>Approbation requise</span></label>
        <label className={styles.check}><input type="checkbox" name="enabled" defaultChecked={initial?.enabled ?? false}/><span>Activer la planification</span></label>
      </div>
      <div className={styles.formFooter}><p>La planification reste bloquée si le résultat est encore frais, si une exécution équivalente existe ou si le budget est épuisé.</p><button className={styles.primaryButton} type="submit" disabled={busy}>{busy ? <Loader2 className={styles.spin} size={16}/> : <Save size={16}/>} Publier</button></div>
    </form>
  </Modal>
}
