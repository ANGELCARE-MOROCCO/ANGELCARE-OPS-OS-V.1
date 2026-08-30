'use client'

import { useMemo, useState } from 'react'
import { Archive, BadgePercent, CalendarClock, Pause, Plus, Save, Search, ShieldCheck, Target } from 'lucide-react'
import type { PromotionRecord, PromotionStatus } from '../types'
import { enterpriseRequest, dateTime } from './client'
import { useGovernedAction } from '../../shells/GovernedActionProvider'
import styles from './promotion-command.module.css'

type TargetType = 'all' | 'item' | 'category' | 'territory' | 'segment'
type PromotionType = PromotionRecord['promotion_type']

const blankPromotion = (): PromotionRecord => ({
  id: '', public_reference: 'BROUILLON NON ENREGISTRÉ', promotion_key: `promotion-${Date.now()}`,
  name: '', description: null, code: null, promotion_type: 'percent', value: 10,
  minimum_order_amount: 0, maximum_discount_amount: null, starts_at: null, ends_at: null,
  usage_limit: null, customer_usage_limit: null, automatic: false, status: 'draft', priority: 100,
  content: {}, created_at: '', updated_at: '', targets: [{ id: '', target_type: 'all', target_value: null }],
})

const statusLabels: Record<PromotionStatus, string> = { draft: 'draft', active: 'active', paused: 'paused', expired: 'expired', archived: 'archived' }

export function PromotionCommand({ initial, canManage }: { initial: PromotionRecord[]; canManage: boolean }) {
  const requestAction = useGovernedAction()
  const [items, setItems] = useState(initial)
  const [selectedId, setSelectedId] = useState(initial[0]?.id || '')
  const [draft, setDraft] = useState<PromotionRecord | null>(initial[0] || null)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [targetFilter, setTargetFilter] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const filtered = useMemo(() => items.filter((item) => {
    const target = item.targets[0]?.target_type || 'all'
    return (!query || `${item.name} ${item.code || ''} ${item.promotion_key} ${item.public_reference}`.toLowerCase().includes(query.toLowerCase()))
      && (!typeFilter || item.promotion_type === typeFilter)
      && (!statusFilter || item.status === statusFilter)
      && (!targetFilter || target === targetFilter)
  }), [items, query, typeFilter, statusFilter, targetFilter])

  function select(item: PromotionRecord) { setSelectedId(item.id); setDraft(item); setError(''); setNotice('') }
  function patch(values: Partial<PromotionRecord>) { setDraft((current) => current ? { ...current, ...values } : current) }
  function targetPatch(target_type: TargetType, target_value?: string | null) { if (!draft) return; patch({ targets: [{ id: draft.targets[0]?.id || '', target_type, target_value: target_type === 'all' ? null : target_value || null }] }) }

  async function save(nextStatus?: PromotionStatus, reason?: string) {
    if (!draft || !canManage) { setError('Permission marketplace.merchandising.manage requise.'); return }
    if (!draft.name.trim()) { setError('Le nom de la promotion est requis.'); return }
    if (draft.starts_at && draft.ends_at && new Date(draft.ends_at) <= new Date(draft.starts_at)) { setError('La fin doit suivre le début.'); return }
    setBusy(true); setError(''); setNotice('')
    const body = {
      promotionKey: draft.promotion_key, name: draft.name, description: draft.description, code: draft.code,
      promotionType: draft.promotion_type, value: draft.value, minimumOrderAmount: draft.minimum_order_amount,
      maximumDiscountAmount: draft.maximum_discount_amount, startsAt: draft.starts_at, endsAt: draft.ends_at,
      usageLimit: draft.usage_limit, customerUsageLimit: draft.customer_usage_limit, automatic: draft.automatic,
      status: nextStatus || draft.status, priority: draft.priority, content: draft.content, targets: draft.targets.map((target) => ({ targetType: target.target_type, targetValue: target.target_value })),
      reason: reason || null,
    }
    try {
      const result = await enterpriseRequest<PromotionRecord>(draft.id ? `/api/angelcare-marketplace/admin/promotions/${draft.id}` : '/api/angelcare-marketplace/admin/promotions', { method: draft.id ? 'PATCH' : 'POST', body: JSON.stringify(body) })
      setItems((current) => draft.id ? current.map((item) => item.id === result.id ? result : item) : [result, ...current])
      setSelectedId(result.id); setDraft(result); setNotice(`${result.name} · ${result.status} enregistré.`)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Enregistrement impossible.') }
    finally { setBusy(false) }
  }

  async function transition(nextStatus: PromotionStatus) {
    if (!draft || !draft.id || !canManage) return
    const reason = await requestAction({
      title: `Promotion · ${nextStatus}`, objectLabel: `${draft.name} · ${draft.public_reference}`,
      currentState: draft.status, nextState: nextStatus,
      consequence: nextStatus === 'active' ? 'La promotion devient éligible au pricing et aux surfaces publiques selon ses cibles et sa fenêtre.' : nextStatus === 'paused' ? 'La promotion cesse d’être appliquée tant qu’elle reste suspendue.' : 'La promotion sort du registre opératoire actif.',
      reversibility: nextStatus === 'archived' ? 'Aucune restauration explicite n’est exposée par l’autorité actuelle.' : 'Une transition ultérieure peut modifier cet état.',
      permission: 'marketplace.merchandising.manage', danger: nextStatus === 'archived',
    })
    if (reason) await save(nextStatus, reason)
  }

  const target = (draft?.targets[0]?.target_type || 'all') as TargetType
  const targetValue = draft?.targets[0]?.target_value || ''
  const statuses = new Set(items.map((item) => item.status))

  return <main className={styles.root} data-readonly={!canManage}>
    <header className={styles.header}><div><span>MARKETING & PROMOTIONS · PRICING AUTHORITY</span><h1>Promotions — Offres, codes & règles commerciales</h1><p>Valeur, cible, calendrier, limites d’usage, priorité et application automatique dans l’autorité commerciale existante.</p></div><button type="button" disabled={!canManage} onClick={() => { setSelectedId(''); setDraft(blankPromotion()) }}><Plus/>Créer une promotion</button></header>
    {!canManage ? <div className={styles.permission}><ShieldCheck/>Lecture seule · marketplace.merchandising.manage est requise pour créer, modifier ou transitionner.</div> : null}
    <section className={styles.metrics}>
      <article><BadgePercent/><div><strong>{items.length}</strong><span>Promotions</span><small>{items.filter((item) => item.status === 'active').length} actives</small></div></article>
      <article><Target/><div><strong>{items.filter((item) => item.targets[0]?.target_type === 'segment').length}</strong><span>Ciblages segment</span><small>persistants</small></div></article>
      <article><CalendarClock/><div><strong>{items.filter((item) => item.starts_at && new Date(item.starts_at) > new Date()).length}</strong><span>Programmées</span><small>fenêtres futures</small></div></article>
      <article><Pause/><div><strong>{items.filter((item) => item.status === 'paused').length}</strong><span>Suspendues</span><small>hors pricing</small></div></article>
      <article><Archive/><div><strong>{items.filter((item) => item.status === 'archived').length}</strong><span>Archivées</span><small>historique conservé</small></div></article>
      <article><ShieldCheck/><div><strong>{statuses.size}</strong><span>États observés</span><small>source réelle</small></div></article>
    </section>
    {error ? <div className={styles.error}>{error}</div> : null}{notice ? <div className={styles.notice}>{notice}</div> : null}
    <div className={styles.workspace}>
      <section className={styles.registry}><header><div><h2>Registre des promotions</h2><span>{filtered.length} / {items.length}</span></div><div className={styles.filters}><label><Search/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, code, clé, référence…"/></label><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="">Tous types</option>{['percent','fixed','wallet_credit','free_delivery','custom'].map((type) => <option key={type}>{type}</option>)}</select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Tous statuts</option>{Object.keys(statusLabels).map((status) => <option key={status}>{status}</option>)}</select><select value={targetFilter} onChange={(event) => setTargetFilter(event.target.value)}><option value="">Toutes cibles</option>{['all','item','category','territory','segment'].map((value) => <option key={value}>{value}</option>)}</select></div></header><div className={styles.tableWrap}><table><thead><tr><th>Promotion</th><th>Type / valeur</th><th>Cible</th><th>Minimum / plafond</th><th>Période</th><th>Statut</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} data-selected={selectedId === item.id} onClick={() => select(item)}><td><strong>{item.code || item.name}</strong><small>{item.name} · {item.public_reference}</small></td><td>{item.promotion_type} · {item.value}{item.promotion_type === 'percent' ? '%' : ' Dh'}</td><td>{item.targets[0]?.target_type || 'all'}<small>{item.targets[0]?.target_value || 'Tout le Marketplace'}</small></td><td>{item.minimum_order_amount} Dh / {item.maximum_discount_amount == null ? 'sans plafond' : `${item.maximum_discount_amount} Dh`}</td><td>{dateTime(item.starts_at)} → {dateTime(item.ends_at)}</td><td><span className={styles.status} data-status={item.status}>{item.status}</span></td></tr>)}</tbody></table>{!filtered.length ? <div className={styles.empty}>Aucune promotion ne correspond aux filtres.</div> : null}</div></section>
      <aside className={styles.editor}>{draft ? <><header><span>{draft.id ? 'INSPECTEUR PROMOTION' : 'NOUVEAU BROUILLON'}</span><h2>{draft.name || 'Créer une promotion'}</h2><small>{draft.public_reference} · {draft.status}</small></header><fieldset disabled={!canManage || busy}><div className={styles.formGrid}>
        <label>Nom<input value={draft.name} onChange={(event) => patch({ name: event.target.value })}/></label><label>Code client<input value={draft.code || ''} onChange={(event) => patch({ code: event.target.value.toUpperCase() || null })}/></label><label className={styles.wide}>Description publique<textarea value={draft.description || ''} onChange={(event) => patch({ description: event.target.value || null })}/></label>
        <label>Type<select value={draft.promotion_type} onChange={(event) => patch({ promotion_type: event.target.value as PromotionType })}>{['percent','fixed','wallet_credit','free_delivery','custom'].map((type) => <option key={type}>{type}</option>)}</select></label><label>Valeur<input type="number" min="0" value={draft.value} onChange={(event) => patch({ value: Number(event.target.value) })}/></label>
        <label>Cible<select value={target} onChange={(event) => targetPatch(event.target.value as TargetType, targetValue)}>{['all','item','category','territory','segment'].map((value) => <option key={value}>{value}</option>)}</select></label><label>Identifiant cible<input disabled={target === 'all'} value={targetValue} onChange={(event) => targetPatch(target, event.target.value)}/></label>
        <label>Minimum commande<input type="number" min="0" value={draft.minimum_order_amount} onChange={(event) => patch({ minimum_order_amount: Number(event.target.value) })}/></label><label>Remise max.<input type="number" min="0" value={draft.maximum_discount_amount ?? ''} onChange={(event) => patch({ maximum_discount_amount: event.target.value === '' ? null : Number(event.target.value) })}/></label>
        <label>Début<input type="datetime-local" value={draft.starts_at?.slice(0,16) || ''} onChange={(event) => patch({ starts_at: event.target.value ? new Date(event.target.value).toISOString() : null })}/></label><label>Fin<input type="datetime-local" value={draft.ends_at?.slice(0,16) || ''} onChange={(event) => patch({ ends_at: event.target.value ? new Date(event.target.value).toISOString() : null })}/></label>
        <label>Limite globale<input type="number" min="0" value={draft.usage_limit ?? ''} onChange={(event) => patch({ usage_limit: event.target.value === '' ? null : Number(event.target.value) })}/></label><label>Limite / client<input type="number" min="0" value={draft.customer_usage_limit ?? ''} onChange={(event) => patch({ customer_usage_limit: event.target.value === '' ? null : Number(event.target.value) })}/></label>
        <label>Priorité<input type="number" min="1" value={draft.priority} onChange={(event) => patch({ priority: Number(event.target.value) })}/></label><label className={styles.check}><input type="checkbox" checked={draft.automatic} onChange={(event) => patch({ automatic: event.target.checked })}/>Application automatique au pricing</label>
      </div></fieldset><footer><button type="button" disabled={busy || !canManage} onClick={() => void save()}><Save/>Enregistrer</button>{draft.id && draft.status !== 'active' ? <button type="button" disabled={busy || !canManage} onClick={() => void transition('active')}>Activer</button> : null}{draft.id && draft.status === 'active' ? <button type="button" disabled={busy || !canManage} onClick={() => void transition('paused')}>Suspendre</button> : null}{draft.id && draft.status !== 'archived' ? <button type="button" className={styles.danger} disabled={busy || !canManage} onClick={() => void transition('archived')}>Archiver</button> : null}</footer></> : <div className={styles.empty}>Sélectionnez une promotion ou créez un brouillon.</div>}</aside>
    </div>
  </main>
}
