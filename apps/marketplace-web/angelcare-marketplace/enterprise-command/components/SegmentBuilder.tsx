'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BadgePercent, Copy, Download, Play, Save, Search, Trash2, UsersRound } from 'lucide-react'
import type { SegmentPreview } from '../types'
import type { SavedSegmentRecord } from '../sovereign-repository'
import styles from '../enterprise-command.module.css'

type Row = Record<string, unknown>
type Envelope<T> = { data: T }
type Rule = { id: string; field: string; operator: string; value: string }
type RuleGroup = { id: string; operator: 'and' | 'or'; rules: Rule[] }

const RULE_FIELDS = [
  ['city', 'Ville'], ['orderCount', 'Nombre commandes'], ['capturedRevenue', 'Revenu capturé'],
  ['averageOrderValue', 'Panier moyen'], ['walletBalance', 'AngelCare Credit'],
  ['activeSubscriptions', 'Abonnements actifs'], ['bookingCount', 'Bookings'],
  ['inactivityDays', 'Jours inactivité'], ['acquisitionSources', 'Source acquisition'],
  ['purchasedProductIds', 'Produit acheté'], ['premium', 'Premium'], ['status', 'Statut'],
  ['accountKind', 'Type client'],
] as const
const TEXT_FIELDS = new Set(['city', 'acquisitionSources', 'purchasedProductIds', 'status', 'accountKind'])
const BOOL_FIELDS = new Set(['premium'])
const isRow = (value: unknown): value is Row => Boolean(value && typeof value === 'object' && !Array.isArray(value))

export function SegmentBuilder({ canManage = true, canActivate = true }: { canManage?: boolean; canActivate?: boolean }) {
  const [status, setStatus] = useState('active')
  const [kind, setKind] = useState('')
  const [premium, setPremium] = useState(false)
  const [minOrders, setMinOrders] = useState(0)
  const [minRevenue, setMinRevenue] = useState(0)
  const [minAov, setMinAov] = useState(0)
  const [minWallet, setMinWallet] = useState(0)
  const [inactiveDays, setInactiveDays] = useState(0)
  const [city, setCity] = useState('')
  const [productId, setProductId] = useState('')
  const [bookingStatus, setBookingStatus] = useState('')
  const [subscriptionStatus, setSubscriptionStatus] = useState('')
  const [acquisitionSource, setAcquisitionSource] = useState('')
  const [data, setData] = useState<SegmentPreview | null>(null)
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saved, setSaved] = useState<SavedSegmentRecord[]>([])
  const [catalog, setCatalog] = useState<Row[]>([])
  const [promoPercent, setPromoPercent] = useState(10)
  const [notice, setNotice] = useState('')
  const [groupOperator, setGroupOperator] = useState<'and' | 'or'>('and')
  const [groups, setGroups] = useState<RuleGroup[]>([])
  const [pendingArchive, setPendingArchive] = useState<SavedSegmentRecord | null>(null)

  function filters() {
    return {
      status, accountKind: kind, premium, minOrders, minRevenue, minAov, minWallet, inactiveDays,
      city, productId, bookingStatus, subscriptionStatus, acquisitionSource, groupOperator,
      groups: groups.map((group) => ({
        operator: group.operator,
        rules: group.rules.map((rule) => ({
          field: rule.field,
          operator: rule.operator,
          value: BOOL_FIELDS.has(rule.field) ? rule.value === 'true' : TEXT_FIELDS.has(rule.field) ? rule.value : Number(rule.value || 0),
        })),
      })),
      limit: 5000,
    }
  }

  async function loadSaved() {
    try {
      const [savedResponse, controlResponse] = await Promise.all([
        fetch('/api/angelcare-marketplace/admin/enterprise-command/segments/saved', { cache: 'no-store' }),
        fetch('/api/angelcare-marketplace/admin/enterprise-control', { cache: 'no-store' }),
      ])
      const savedPayload = await savedResponse.json() as Envelope<SavedSegmentRecord[]>
      const controlPayload = await controlResponse.json() as Envelope<{ catalog: Row[] }>
      if (savedResponse.ok) setSaved(savedPayload.data || [])
      if (controlResponse.ok) setCatalog(controlPayload.data?.catalog || [])
    } catch { setNotice('Les segments enregistrés ou le catalogue ne sont pas disponibles.') }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => { void loadSaved() }, 0)
    return () => window.clearTimeout(timeout)
  }, [])

  async function run(nextFilters: Record<string, unknown> = filters()) {
    setBusy(true); setNotice('')
    try {
      const response = await fetch('/api/angelcare-marketplace/admin/enterprise-command/segments', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(nextFilters),
      })
      const payload = await response.json() as Envelope<SegmentPreview> & { error?: { message?: string } }
      if (response.ok) setData(payload.data)
      else setNotice(payload.error?.message || 'Prévisualisation impossible.')
    } finally { setBusy(false) }
  }

  function apply(nextFilters: Record<string, unknown>) {
    setStatus(String(nextFilters.status || ''))
    setKind(String(nextFilters.accountKind || ''))
    setPremium(nextFilters.premium === true)
    setMinOrders(Number(nextFilters.minOrders || 0)); setMinRevenue(Number(nextFilters.minRevenue || 0))
    setMinAov(Number(nextFilters.minAov || 0)); setMinWallet(Number(nextFilters.minWallet || 0))
    setInactiveDays(Number(nextFilters.inactiveDays || 0)); setCity(String(nextFilters.city || ''))
    setProductId(String(nextFilters.productId || '')); setBookingStatus(String(nextFilters.bookingStatus || ''))
    setSubscriptionStatus(String(nextFilters.subscriptionStatus || '')); setAcquisitionSource(String(nextFilters.acquisitionSource || ''))
    setGroupOperator(String(nextFilters.groupOperator) === 'or' ? 'or' : 'and')
    const rawGroups = Array.isArray(nextFilters.groups) ? nextFilters.groups : []
    setGroups(rawGroups.filter(isRow).map((group) => ({
      id: crypto.randomUUID(),
      operator: String(group.operator) === 'or' ? 'or' : 'and',
      rules: (Array.isArray(group.rules) ? group.rules : []).filter(isRow).map((rule) => ({
        id: crypto.randomUUID(), field: String(rule.field || 'orderCount'),
        operator: String(rule.operator || 'gte'), value: String(rule.value ?? ''),
      })),
    })))
    void run(nextFilters)
  }

  function addGroup() { setGroups((current) => [...current, { id: crypto.randomUUID(), operator: 'and', rules: [{ id: crypto.randomUUID(), field: 'orderCount', operator: 'gte', value: '1' }] }]) }
  function addRule(groupId: string) { setGroups((current) => current.map((group) => group.id === groupId ? { ...group, rules: [...group.rules, { id: crypto.randomUUID(), field: 'orderCount', operator: 'gte', value: '1' }] } : group)) }
  function updateGroup(groupId: string, patch: Partial<RuleGroup>) { setGroups((current) => current.map((group) => group.id === groupId ? { ...group, ...patch } : group)) }
  function updateRule(groupId: string, ruleId: string, patch: Partial<Rule>) { setGroups((current) => current.map((group) => group.id === groupId ? { ...group, rules: group.rules.map((rule) => rule.id === ruleId ? { ...rule, ...patch } : rule) } : group)) }
  function removeRule(groupId: string, ruleId: string) { setGroups((current) => current.map((group) => group.id === groupId ? { ...group, rules: group.rules.filter((rule) => rule.id !== ruleId) } : group).filter((group) => group.rules.length)) }

  async function saveSegment() {
    if (!canManage || !name.trim()) return
    setBusy(true); setNotice('')
    try {
      const response = await fetch('/api/angelcare-marketplace/admin/enterprise-command/segments/saved', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, description, filters: filters() }),
      })
      const payload = await response.json().catch(() => ({})) as { error?: { message?: string } }
      setNotice(response.ok ? 'Segment enregistré, recalculé et memberships persistés.' : payload.error?.message || 'Enregistrement impossible.')
      if (response.ok) { setName(''); setDescription(''); await loadSaved() }
    } finally { setBusy(false) }
  }

  async function archiveSegment() {
    if (!canManage || !pendingArchive) return
    setBusy(true); setNotice('')
    try {
      const response = await fetch(`/api/angelcare-marketplace/admin/enterprise-command/segments/saved/${pendingArchive.id}`, { method: 'DELETE' })
      setNotice(response.ok ? 'Segment archivé avec sa trace d’audit.' : 'Archivage impossible.')
      if (response.ok) { setPendingArchive(null); await loadSaved() }
    } finally { setBusy(false) }
  }

  async function createPromotion(segment: SavedSegmentRecord) {
    if (!canActivate) return
    setBusy(true); setNotice('')
    try {
      const response = await fetch('/api/angelcare-marketplace/admin/promotions', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ promotionKey: `segment-${segment.id}-${Date.now()}`, name: `Audience · ${segment.name}`, promotionType: 'percent', value: promoPercent, automatic: true, status: 'draft', targets: [{ targetType: 'segment', targetValue: segment.id }] }),
      })
      setNotice(response.ok ? `Promotion brouillon ${promoPercent}% créée pour ${segment.public_reference}.` : 'Création promotion impossible.')
    } finally { setBusy(false) }
  }

  function duplicate(segment: SavedSegmentRecord) {
    apply(segment.filters)
    setName(`${segment.name} · copie`); setDescription(segment.description || '')
    setNotice('Configuration dupliquée localement. Enregistrez pour créer le nouveau segment.')
  }

  function exportCsv() {
    if (!data) return
    const header = ['reference', 'name', 'email', 'city', 'order_count', 'captured_revenue_dh', 'aov_dh', 'angelcare_credit_dh', 'active_subscriptions', 'bookings', 'acquisition_sources', 'last_order_at']
    const quote = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
    const lines = data.customers.map((customer) => [customer.reference, customer.name, customer.email, customer.city, customer.orderCount, customer.capturedRevenue, customer.averageOrderValue, customer.walletBalance, customer.activeSubscriptions, customer.bookingCount, customer.acquisitionSources.join('|'), customer.lastOrderAt].map(quote).join(','))
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(blob); anchor.download = 'ANGELCARE_CUSTOMER_SEGMENT.csv'; anchor.click(); URL.revokeObjectURL(anchor.href)
  }

  return <div className={styles.command}>
    <section className={styles.hero}><div className={styles.eyebrow}>MOTEUR D’AUDIENCE INDUSTRIEL</div><h1 className={styles.title}>Segments persistants, calcul batch et activation commerciale</h1><p className={styles.lead}>Le calcul agrège commandes, paiements, Credit, réservations et abonnements. Un segment sauvegardé matérialise ses memberships et peut cibler une promotion brouillon autorisée.</p></section>
    <div className={styles.grid2}>
      <section className={styles.panel}>
        <div className={styles.grid3}>
          <F label="Statut"><select className={styles.select} value={status} onChange={(event) => setStatus(event.target.value)}><option value="active">Active</option><option value="">Tous</option></select></F>
          <F label="Type"><select className={styles.select} value={kind} onChange={(event) => setKind(event.target.value)}><option value="">Tous</option><option value="family">Family</option><option value="individual">Individual</option><option value="organization">Organization</option></select></F>
          <F label="Commandes minimum"><input className={styles.input} type="number" min={0} value={minOrders} onChange={(event) => setMinOrders(Number(event.target.value))}/></F>
          <F label="Revenu minimum"><input className={styles.input} type="number" min={0} value={minRevenue} onChange={(event) => setMinRevenue(Number(event.target.value))}/></F>
          <F label="Panier moyen minimum"><input className={styles.input} type="number" min={0} value={minAov} onChange={(event) => setMinAov(Number(event.target.value))}/></F>
          <F label="Credit minimum"><input className={styles.input} type="number" min={0} value={minWallet} onChange={(event) => setMinWallet(Number(event.target.value))}/></F>
          <F label="Inactif depuis (jours)"><input className={styles.input} type="number" min={0} value={inactiveDays} onChange={(event) => setInactiveDays(Number(event.target.value))}/></F>
          <F label="Ville"><input className={styles.input} value={city} onChange={(event) => setCity(event.target.value)} placeholder="Casablanca"/></F>
          <F label="Produit acheté"><select className={styles.select} value={productId} onChange={(event) => setProductId(event.target.value)}><option value="">Tous</option>{catalog.slice(0, 1500).map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.name || item.name_fr || item.item_key)}</option>)}</select></F>
          <F label="Statut booking"><input className={styles.input} value={bookingStatus} onChange={(event) => setBookingStatus(event.target.value)} placeholder="completed"/></F>
          <F label="Statut abonnement"><input className={styles.input} value={subscriptionStatus} onChange={(event) => setSubscriptionStatus(event.target.value)} placeholder="active"/></F>
          <F label="Source acquisition"><input className={styles.input} value={acquisitionSource} onChange={(event) => setAcquisitionSource(event.target.value)} placeholder="customer_checkout"/></F>
          <F label="Premium"><label className={styles.checkRow}><input type="checkbox" checked={premium} onChange={(event) => setPremium(event.target.checked)}/>Premium uniquement</label></F>
        </div>
        <section className={styles.ruleBuilder}>
          <div className={styles.panelTitle}><div><h3>Groupes de règles avancées</h3><p className={styles.muted}>Combinez des groupes AND/OR. Les règles sont évaluées côté serveur sur le profil commercial agrégé.</p></div><div className={styles.toolbar}><select className={styles.select} style={{ width: 180 }} value={groupOperator} onChange={(event) => setGroupOperator(event.target.value === 'or' ? 'or' : 'and')}><option value="and">Tous les groupes (AND)</option><option value="or">Au moins un groupe (OR)</option></select><button type="button" className={styles.buttonSecondary} onClick={addGroup}>+ Groupe</button></div></div>
          {groups.map((group, index) => <div className={styles.ruleGroup} key={group.id}><div className={styles.ruleGroupHeader}><strong>Groupe {index + 1}</strong><select className={styles.select} value={group.operator} onChange={(event) => updateGroup(group.id, { operator: event.target.value === 'or' ? 'or' : 'and' })}><option value="and">Toutes les règles</option><option value="or">Au moins une règle</option></select></div>{group.rules.map((rule) => <div className={styles.ruleRow} key={rule.id}><select className={styles.select} value={rule.field} onChange={(event) => updateRule(group.id, rule.id, { field: event.target.value, operator: BOOL_FIELDS.has(event.target.value) ? 'true' : TEXT_FIELDS.has(event.target.value) ? 'contains' : 'gte', value: BOOL_FIELDS.has(event.target.value) ? 'true' : '' })}>{RULE_FIELDS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><select className={styles.select} value={rule.operator} onChange={(event) => updateRule(group.id, rule.id, { operator: event.target.value })}>{BOOL_FIELDS.has(rule.field) ? <><option value="true">Oui</option><option value="false">Non</option></> : TEXT_FIELDS.has(rule.field) ? <><option value="contains">contient</option><option value="eq">égal</option><option value="neq">différent</option></> : <><option value="gte">≥</option><option value="lte">≤</option><option value="gt">&gt;</option><option value="lt">&lt;</option><option value="eq">=</option></>}</select>{rule.field === 'purchasedProductIds' ? <select className={styles.select} value={rule.value} onChange={(event) => updateRule(group.id, rule.id, { value: event.target.value })}><option value="">Produit…</option>{catalog.slice(0, 1500).map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.name || item.name_fr || item.item_key)}</option>)}</select> : BOOL_FIELDS.has(rule.field) ? <span className={styles.chip}>{rule.operator === 'true' ? 'Oui' : 'Non'}</span> : <input className={styles.input} type={TEXT_FIELDS.has(rule.field) ? 'text' : 'number'} value={rule.value} onChange={(event) => updateRule(group.id, rule.id, { value: event.target.value })}/>}<button type="button" aria-label="Supprimer la règle" className={styles.buttonDanger} onClick={() => removeRule(group.id, rule.id)}>×</button></div>)}<button type="button" className={styles.buttonSecondary} onClick={() => addRule(group.id)}>+ Règle</button></div>)}
          {!groups.length ? <p className={styles.muted}>Aucun groupe avancé : les filtres standards s’appliquent.</p> : null}
        </section>
        <div className={styles.rowActions}><button type="button" className={styles.button} disabled={busy} onClick={() => void run()}><Search size={14}/>{busy ? 'Calcul…' : 'Prévisualiser'}</button><input className={styles.input} style={{ maxWidth: 220 }} placeholder="Nom du segment" value={name} onChange={(event) => setName(event.target.value)}/><input className={styles.input} style={{ maxWidth: 280 }} placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)}/><button type="button" className={styles.buttonSecondary} title={!canManage ? 'Permission marketplace.admin.access requise' : undefined} disabled={!canManage || busy || !name.trim()} onClick={() => void saveSegment()}><Save size={14}/>Sauvegarder</button></div>
        {notice ? <div className={styles.notice}>{notice}</div> : null}
      </section>
      <section className={styles.panel}>
        <div className={styles.panelTitle}><h3>Segments enregistrés</h3><span className={styles.chip}>{saved.length}</span></div>
        <F label="Promotion segment (%)"><input className={styles.input} type="number" min="0" max="100" value={promoPercent} onChange={(event) => setPromoPercent(Number(event.target.value))}/></F>
        {saved.map((segment) => <div className={styles.savedSegmentRow} key={segment.id}><div><strong>{segment.name}</strong><div className={styles.muted}>{segment.public_reference} · {segment.last_snapshot_count} memberships · {segment.status}</div></div><div className={styles.rowActions}><button type="button" className={styles.buttonSecondary} onClick={() => apply(segment.filters)}><Play size={12}/>Recalculer</button><button type="button" className={styles.buttonSecondary} disabled={!canManage || busy} onClick={() => duplicate(segment)}><Copy size={12}/>Dupliquer</button><button type="button" className={styles.buttonSecondary} title={!canActivate ? 'Permission marketplace.merchandising.manage requise' : undefined} disabled={!canActivate || busy} onClick={() => void createPromotion(segment)}><BadgePercent size={12}/>Créer promo brouillon</button><button type="button" aria-label={`Archiver ${segment.name}`} title={!canManage ? 'Permission marketplace.admin.access requise' : 'Archiver'} className={styles.buttonDanger} disabled={!canManage || busy} onClick={() => setPendingArchive(segment)}><Trash2 size={12}/></button></div></div>)}
        {!saved.length ? <p className={styles.muted}>Aucun segment persistant.</p> : null}
      </section>
    </div>
    {data ? <section className={styles.panel}><div className={styles.panelTitle}><div><h3><UsersRound size={16}/> {data.total} clients correspondants</h3><span className={styles.muted}>{data.evaluated} comptes évalués{data.truncated ? ' · limite de sécurité atteinte' : ''}</span></div><button type="button" className={styles.buttonSecondary} onClick={exportCsv}><Download size={14}/>Exporter ce résultat CSV</button></div><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Client</th><th>Commandes</th><th>Revenu</th><th>Panier</th><th>Credit</th><th>Abonn.</th><th>Bookings</th><th>Dernière</th><th/></tr></thead><tbody>{data.customers.map((customer) => <tr key={customer.id}><td><strong>{customer.name}</strong><br/><span className={styles.muted}>{customer.reference} · {customer.email}</span></td><td>{customer.orderCount}</td><td>{customer.capturedRevenue.toLocaleString('fr-FR')} Dh</td><td>{customer.averageOrderValue.toLocaleString('fr-FR')} Dh</td><td>{customer.walletBalance.toLocaleString('fr-FR')} Dh</td><td>{customer.activeSubscriptions}</td><td>{customer.bookingCount}</td><td>{customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString('fr-FR') : '—'}</td><td><Link className={styles.buttonSecondary} href={`/angelcare-marketplace/admin/customers/${customer.id}`}>Client 360</Link></td></tr>)}</tbody></table></div></section> : null}
    {pendingArchive ? <dialog className={styles.governedModal} open aria-labelledby="segment-archive-title"><div className={styles.governedModalBody}><div className={styles.eyebrow}>CYCLE DE VIE D’AUDIENCE</div><h3 id="segment-archive-title">Archiver {pendingArchive.name} ?</h3><div className={styles.grid3}><Metric label="Référence" value={pendingArchive.public_reference}/><Metric label="Membres du dernier calcul" value={pendingArchive.last_snapshot_count}/><Metric label="État proposé" value="archived"/></div><p className={styles.muted}>Le segment sort du registre actif. Les promotions déjà créées ne sont pas supprimées automatiquement et doivent être gouvernées dans Marketing.</p><div className={styles.rowActions}><button type="button" className={styles.buttonSecondary} disabled={busy} onClick={() => setPendingArchive(null)}>Annuler</button><button type="button" className={styles.buttonDanger} disabled={busy} onClick={() => void archiveSegment()}>{busy ? 'Archivage…' : 'Confirmer l’archivage'}</button></div></div></dialog> : null}
  </div>
}

function F({ label, children }: { label: string; children: React.ReactNode }) { return <div className={styles.field}><label>{label}</label>{children}</div> }
function Metric({ label, value }: { label: string; value: unknown }) { return <div className={styles.metric}><strong>{String(value)}</strong><span>{label}</span></div> }
