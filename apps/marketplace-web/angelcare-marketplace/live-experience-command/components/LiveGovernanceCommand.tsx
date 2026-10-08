'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, FlaskConical, History, MapPin, Settings2, ShieldCheck, UsersRound } from 'lucide-react'
import type { LiveGovernanceMode } from '../repository'
import { useGovernedAction } from '../../shells/GovernedActionProvider'
import styles from '../live-governance.module.css'

type Row = Record<string, unknown>
type GovernanceMode = Exclude<LiveGovernanceMode, 'history'>

const text = (value: unknown) => typeof value === 'string' ? value : String(value ?? '')
const record = (value: unknown): Row => value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {}
const list = (value: string) => value.split(',').map((entry) => entry.trim()).filter(Boolean)
const listValue = (value: unknown) => Array.isArray(value) ? value.map(String).join(', ') : ''

const definitions: Record<LiveGovernanceMode, { eyebrow: string; title: string; copy: string; icon: typeof UsersRound }> = {
  audiences: { eyebrow: 'AUDIENCE AUTHORITY', title: 'Audiences persistantes', copy: 'Villes, types de clients et statut premium restent explicites et auditables.', icon: UsersRound },
  placements: { eyebrow: 'PLACEMENT AUTHORITY', title: 'Placements gouvernés', copy: 'Surface, famille, route, locale et priorité contrôlent où l’expérience peut vivre.', icon: MapPin },
  schedules: { eyebrow: 'SCHEDULE AUTHORITY', title: 'Programmation sans collision', copy: 'Fenêtres, timezone et récurrence utilisent la protection de chevauchement du repository.', icon: CalendarClock },
  experiments: { eyebrow: 'EXPERIMENT AUTHORITY', title: 'Variantes, allocation et décision', copy: 'Allocation déterministe, preuve et winner restent séparés des statistiques non prouvées.', icon: FlaskConical },
  history: { eyebrow: 'IMMUTABLE HISTORY', title: 'Historique immuable', copy: 'Versions et événements d’audit sont consultables sans mutation.', icon: History },
  settings: { eyebrow: 'CAPABILITY GOVERNANCE', title: 'Capacités Live Experience', copy: 'Activer ou retirer les patterns autorisés sans modifier le code métier.', icon: Settings2 },
}

const lifecycle: Record<GovernanceMode, Record<string, string[]>> = {
  audiences: { draft: ['review', 'active', 'archived'], review: ['active', 'draft', 'archived'], active: ['paused', 'archived'], paused: ['active', 'archived'], archived: [] },
  placements: { draft: ['review', 'active', 'archived'], review: ['active', 'draft', 'archived'], active: ['paused', 'archived'], paused: ['active', 'archived'], archived: [] },
  schedules: { draft: ['scheduled', 'cancelled'], scheduled: ['active', 'paused', 'cancelled'], active: ['paused', 'completed', 'cancelled'], paused: ['active', 'cancelled'], completed: ['archived'], cancelled: ['archived'], archived: [] },
  experiments: { draft: ['ready', 'closed'], ready: ['running', 'draft', 'closed'], running: ['paused', 'significance_review', 'closed'], paused: ['running', 'significance_review', 'closed'], significance_review: ['winner', 'running', 'closed'], winner: ['closed'], closed: [] },
  settings: { active: ['inactive'], inactive: ['active'] },
}

const tabs: Array<{ mode: LiveGovernanceMode; label: string }> = [
  { mode: 'audiences', label: 'Audiences' }, { mode: 'placements', label: 'Placements' },
  { mode: 'schedules', label: 'Schedules' }, { mode: 'experiments', label: 'Experiments' },
  { mode: 'history', label: 'Historique' }, { mode: 'settings', label: 'Settings' },
]

async function send(mode: LiveGovernanceMode, method: 'POST' | 'PATCH', body: Row) {
  const response = await fetch(`/api/angelcare-marketplace/admin/live-experience/${mode}`, {
    method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.error?.message || 'Commande refusée')
  return payload.data
}

export function LiveGovernanceCommand({ mode, rows, canManage }: { mode: LiveGovernanceMode; rows: Row[]; canManage: boolean }) {
  const router = useRouter()
  const requestAction = useGovernedAction()
  const definition = definitions[mode]
  const Icon = definition.icon
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState('')
  const [currentStatus, setCurrentStatus] = useState('')
  const [key, setKey] = useState('')
  const [name, setName] = useState('')
  const [family, setFamily] = useState('popup')
  const [campaignId, setCampaignId] = useState('')
  const [cities, setCities] = useState('')
  const [customerKinds, setCustomerKinds] = useState('family')
  const [premiumOnly, setPremiumOnly] = useState(false)
  const [pathname, setPathname] = useState('/angelcare-marketplace/fr/marketplace')
  const [locale, setLocale] = useState('fr')
  const [priority, setPriority] = useState(100)
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [timezone, setTimezone] = useState('Africa/Casablanca')
  const [frequency, setFrequency] = useState('once')
  const [variantA, setVariantA] = useState('Control')
  const [variantB, setVariantB] = useState('Variant B')
  const [weightA, setWeightA] = useState(50)
  const [objective, setObjective] = useState('conversion')
  const [winnerVariant, setWinnerVariant] = useState('')
  const [evidence, setEvidence] = useState('')
  const [capabilityKind, setCapabilityKind] = useState('popup')

  const active = useMemo(() => rows.filter((row) => ['active', 'running', 'scheduled', 'ready'].includes(text(row.status))).length, [rows])
  const statuses = useMemo(() => new Set(rows.map((row) => text(row.status || row.record_type || 'recorded'))), [rows])

  async function execute(method: 'POST' | 'PATCH', body: Row) {
    if (!canManage) { setMessage('Lecture seule · l’autorité Live Experience manage est requise.'); return }
    setBusy(true); setMessage('')
    try {
      await send(mode, method, body)
      setMessage('Commande appliquée et auditée.')
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Échec de la commande.')
    } finally { setBusy(false) }
  }

  function selectRow(row: Row) {
    setEditingId(text(row.id))
    setCurrentStatus(text(row.status))
    setKey(text(row.audience_key || row.placement_key || row.schedule_key || row.experiment_key || row.capability_key))
    setName(text(row.name || row.label || row.description))
    setFamily(text(row.family) || 'popup'); setCampaignId(text(row.campaign_id))
    const definitionRow = record(row.definition)
    setCities(listValue(definitionRow.cities)); setCustomerKinds(listValue(definitionRow.customer_kinds)); setPremiumOnly(definitionRow.premium_only === true)
    const configuration = record(row.configuration)
    setPathname(text(configuration.pathname) || '/angelcare-marketplace/fr/marketplace'); setLocale(text(configuration.locale) || 'fr'); setPriority(Number(configuration.priority || 100))
    setStartsAt(text(row.starts_at).slice(0, 16)); setEndsAt(text(row.ends_at).slice(0, 16)); setTimezone(text(row.timezone) || 'Africa/Casablanca')
    setFrequency(text(record(row.recurrence).frequency) || 'once')
    const variants = Array.isArray(row.variants) ? row.variants.map(record) : []
    setVariantA(text(variants[0]?.label) || 'Control'); setVariantB(text(variants[1]?.label) || 'Variant B'); setWeightA(Number(variants[0]?.weight || 50))
    setObjective(text(row.objective || record(row.allocation).objective) || 'conversion'); setWinnerVariant(text(row.winner_variant)); setEvidence(text(record(row.evidence).note || record(row.evidence).reference))
    setCapabilityKind(text(row.kind) || 'popup')
  }

  function save() {
    if (mode === 'history') return
    let body: Row
    if (mode === 'audiences') body = { id: editingId || undefined, audience_key: key, name, definition: { cities: list(cities), customer_kinds: list(customerKinds), premium_only: premiumOnly }, status: editingId ? currentStatus : 'draft' }
    else if (mode === 'placements') body = { id: editingId || undefined, placement_key: key, label: name, family, configuration: { pathname, locale, priority }, status: editingId ? currentStatus : 'draft' }
    else if (mode === 'schedules') body = { id: editingId || undefined, schedule_key: key, campaign_id: campaignId, starts_at: startsAt || null, ends_at: endsAt || null, timezone, recurrence: { frequency }, status: editingId ? currentStatus : 'scheduled' }
    else if (mode === 'experiments') body = { id: editingId || undefined, experiment_key: key, name, objective, variants: [{ key: 'control', label: variantA, weight: weightA }, { key: 'variant_b', label: variantB, weight: Math.max(0, 100 - weightA) }], allocation: { objective }, control_variant: 'control', starts_at: startsAt || null, ends_at: endsAt || null, winner_variant: winnerVariant || null, evidence: { note: evidence }, status: editingId ? currentStatus : 'draft' }
    else body = { id: editingId || undefined, capability_key: key, kind: capabilityKind, description: name, status: editingId ? currentStatus : 'active' }
    void execute(editingId ? 'PATCH' : 'POST', body)
  }

  async function transition(row: Row, nextStatus: string) {
    if (mode === 'history' || !canManage) return
    const from = text(row.status) || 'draft'
    const label = text(row.name || row.label || row.experiment_key || row.schedule_key || row.audience_key || row.placement_key || row.capability_key || row.id)
    const reason = await requestAction({
      title: `Transition ${mode}`, objectLabel: label, currentState: from, nextState: nextStatus,
      consequence: mode === 'experiments' ? 'Modifie la phase de l’expérimentation et son éligibilité à l’allocation déterministe.' : mode === 'schedules' ? 'Modifie l’exécution programmée; les collisions de fenêtre restent bloquées côté repository.' : 'Modifie la disponibilité de cette autorité Live Experience.',
      reversibility: lifecycle[mode][nextStatus]?.length ? 'Une transition ultérieure autorisée peut modifier cet état.' : 'État terminal selon le lifecycle source.',
      permission: 'workspace live_experience.* + marketplace.live_experience.view', danger: ['closed', 'archived', 'cancelled', 'inactive'].includes(nextStatus),
    })
    if (!reason) return
    await execute('PATCH', { action: 'transition', id: row.id, nextStatus, reason })
  }

  return <main className={styles.shell} data-readonly={!canManage}>
    <section className={styles.hero}><div><span>{definition.eyebrow}</span><h1>{definition.title}</h1><p>{definition.copy}</p></div><aside><Icon/><div><b>{rows.length}</b><small>objets gouvernés</small></div><div><strong>{active}</strong><small>actifs / programmés</small></div></aside></section>
    <nav className={styles.modeTabs} aria-label="Gouvernance Live Experience">{tabs.map((tab) => <Link key={tab.mode} data-active={mode === tab.mode} href={`/angelcare-marketplace/admin/live-experience-command/${tab.mode}`}>{tab.label}</Link>)}</nav>
    {!canManage && mode !== 'history' ? <div className={styles.permissionBanner}><ShieldCheck/>Lecture seule · la mutation reste protégée par l’autorité workspace Live Experience.</div> : null}
    <section className={styles.metricStrip}><article><strong>{rows.length}</strong><span>Total</span></article><article><strong>{active}</strong><span>Actifs</span></article><article><strong>{statuses.size}</strong><span>États observés</span></article><article><strong>{mode === 'history' ? rows.filter((row) => row.record_type === 'audit').length : rows.filter((row) => ['draft', 'review', 'significance_review'].includes(text(row.status))).length}</strong><span>{mode === 'history' ? 'Audits' : 'À décider'}</span></article></section>
    {mode !== 'history' ? <section className={styles.editor}><header><div><span>{editingId ? 'INSPECTEUR / ÉDITION' : 'NOUVELLE AUTORITÉ'}</span><h2>{editingId ? `Modifier ${key}` : `Créer · ${mode}`}</h2></div>{editingId ? <button type="button" onClick={() => { setEditingId(''); setCurrentStatus(''); setKey(''); setName('') }}>Nouvelle</button> : null}</header><div className={styles.form}>
      <label>Clé stable<input disabled={!canManage || Boolean(editingId)} value={key} onChange={(event) => setKey(event.target.value)}/></label>
      {mode !== 'schedules' ? <label>Nom / label<input disabled={!canManage} value={name} onChange={(event) => setName(event.target.value)}/></label> : null}
      {mode === 'audiences' ? <><label>Villes<input disabled={!canManage} value={cities} onChange={(event) => setCities(event.target.value)} placeholder="Casablanca, Rabat"/></label><label>Types clients<input disabled={!canManage} value={customerKinds} onChange={(event) => setCustomerKinds(event.target.value)} placeholder="family, organization"/></label><label className={styles.check}><input disabled={!canManage} type="checkbox" checked={premiumOnly} onChange={(event) => setPremiumOnly(event.target.checked)}/>Premium uniquement</label></> : null}
      {mode === 'placements' ? <><label>Famille<input disabled={!canManage} value={family} onChange={(event) => setFamily(event.target.value)}/></label><label>Route / surface<input disabled={!canManage} value={pathname} onChange={(event) => setPathname(event.target.value)}/></label><label>Locale<select disabled={!canManage} value={locale} onChange={(event) => setLocale(event.target.value)}><option>fr</option><option>en</option><option>ar</option></select></label><label>Priorité<input disabled={!canManage} type="number" value={priority} onChange={(event) => setPriority(Number(event.target.value))}/></label></> : null}
      {mode === 'schedules' ? <><label>Campaign UUID<input disabled={!canManage} value={campaignId} onChange={(event) => setCampaignId(event.target.value)}/></label><label>Fréquence<select disabled={!canManage} value={frequency} onChange={(event) => setFrequency(event.target.value)}><option value="once">Une fois</option><option value="daily">Quotidien</option><option value="weekly">Hebdomadaire</option></select></label><label>Timezone<input disabled={!canManage} value={timezone} onChange={(event) => setTimezone(event.target.value)}/></label><label>Début<input disabled={!canManage} type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)}/></label><label>Fin<input disabled={!canManage} type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)}/></label></> : null}
      {mode === 'experiments' ? <><label>Variante contrôle<input disabled={!canManage} value={variantA} onChange={(event) => setVariantA(event.target.value)}/></label><label>Variante B<input disabled={!canManage} value={variantB} onChange={(event) => setVariantB(event.target.value)}/></label><label>Poids contrôle<input disabled={!canManage} type="number" min="1" max="99" value={weightA} onChange={(event) => setWeightA(Number(event.target.value))}/></label><label>Objectif<input disabled={!canManage} value={objective} onChange={(event) => setObjective(event.target.value)}/></label><label>Début<input disabled={!canManage} type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)}/></label><label>Fin<input disabled={!canManage} type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)}/></label><label>Winner variant<select disabled={!canManage} value={winnerVariant} onChange={(event) => setWinnerVariant(event.target.value)}><option value="">Non décidé</option><option value="control">{variantA}</option><option value="variant_b">{variantB}</option></select></label><label className={styles.wide}>Preuve / décision<textarea disabled={!canManage} value={evidence} onChange={(event) => setEvidence(event.target.value)}/></label></> : null}
      {mode === 'settings' ? <label>Type de capacité<select disabled={!canManage} value={capabilityKind} onChange={(event) => setCapabilityKind(event.target.value)}><option value="popup">Popup</option><option value="banner">Banner</option><option value="rail">Rail</option><option value="announcement">Announcement</option></select></label> : null}
      <button type="button" disabled={busy || !canManage || !key || (mode !== 'schedules' && !name)} onClick={save}>{busy ? 'Enregistrement…' : editingId ? 'Enregistrer les changements' : 'Créer en brouillon'}</button>
    </div></section> : null}
    {message ? <div className={styles.message}>{message}</div> : null}
    <section className={styles.table}><header><strong>Registre source</strong><span>Statut</span><span>Commandes gouvernées</span></header>{rows.map((row, index) => { const id = text(row.id || index); const label = text(row.name || row.label || row.audience_key || row.placement_key || row.schedule_key || row.experiment_key || row.capability_key || row.action || id); const status = text(row.status || row.record_type || 'recorded'); const next = mode === 'history' ? [] : lifecycle[mode][status] || []; return <article key={`${id}-${index}`} onClick={() => mode !== 'history' && selectRow(row)}><div><strong>{label}</strong><small>{text(row.object_type || row.family || row.kind || row.objective || row.created_at || row.updated_at)}</small></div><span>{status}</span><div className={styles.actions}>{mode !== 'history' ? next.map((nextStatus) => <button type="button" key={nextStatus} disabled={busy || !canManage} onClick={(event) => { event.stopPropagation(); void transition(row, nextStatus) }}>{nextStatus}</button>) : <small>{text(row.created_at)}</small>}</div></article> })}{!rows.length ? <div className={styles.empty}>Aucun objet persisté. Créez le premier élément depuis l’éditeur structuré.</div> : null}</section>
  </main>
}
