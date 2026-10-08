'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { CheckCircle2, FilePlus2, Search, ShoppingBag, X } from 'lucide-react'
import type { QuoteBasket } from '../../marketplace-core/types'
import type { CommercialQuote, Opportunity } from '../types'
import styles from '../../customer-commerce/customer-commerce.module.css'

type Envelope<T> = { data: T }

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers || {}) } })
  const payload = await response.json() as Envelope<T> | { error?: { message?: string } }
  if (!response.ok || !('data' in payload)) throw new Error('error' in payload ? payload.error?.message || 'Action impossible.' : 'Action impossible.')
  return payload.data
}

const quoteTargets = ['draft', 'internal_review', 'submitted', 'negotiation', 'accepted', 'rejected', 'expired', 'cancelled']

export function QuoteRegistry({
  quotes,
  opportunities,
  baskets,
  canManage,
  canApprove,
}: {
  quotes: CommercialQuote[]
  opportunities: Opportunity[]
  baskets: QuoteBasket[]
  canManage: boolean
  canApprove: boolean
}) {
  const [opportunityId, setOpportunityId] = useState(opportunities[0]?.id || '')
  const [subtotal, setSubtotal] = useState('')
  const [discount, setDiscount] = useState('0')
  const [tax, setTax] = useState('0')
  const [validUntil, setValidUntil] = useState('')
  const [terms, setTerms] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [local, setLocal] = useState(quotes)
  const [selectedId, setSelectedId] = useState(quotes[0]?.id || '')
  const [decisionKind, setDecisionKind] = useState<'status' | 'approval' | ''>('')
  const [decision, setDecision] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const selected = local.find((quote) => quote.id === selectedId) || null
  const filtered = useMemo(() => local.filter((quote) => (statusFilter === 'all' || quote.quote_status === statusFilter) && (!query || `${quote.public_reference} ${quote.opportunity_id} ${quote.quote_status}`.toLowerCase().includes(query.toLowerCase()))), [local, query, statusFilter])

  async function createQuote() {
    if (!canManage) return
    setBusy(true); setError(null); setMessage(null)
    const subtotalValue = Number(subtotal || 0)
    const discountValue = Number(discount || 0)
    const taxValue = Number(tax || 0)
    try {
      const created = await request<CommercialQuote>('/api/angelcare-marketplace/crm/quotes', {
        method: 'POST',
        body: JSON.stringify({ opportunity_id: opportunityId, subtotal: subtotalValue, discount_total: discountValue, tax_total: taxValue, grand_total: Math.max(0, subtotalValue - discountValue + taxValue), valid_until: validUntil || null, terms: terms || null }),
      })
      setLocal((current) => [created, ...current]); setSelectedId(created.id); setSubtotal(''); setDiscount('0'); setTax('0'); setTerms(''); setMessage(`Devis ${created.public_reference} créé.`)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Création impossible.') }
    finally { setBusy(false) }
  }

  async function applyDecision() {
    if (!selected || !decision || !reason.trim()) return
    if (decisionKind === 'status' && !canManage) return
    if (decisionKind === 'approval' && !canApprove) return
    setBusy(true); setError(null); setMessage(null)
    try {
      const updated = await request<CommercialQuote>(decisionKind === 'approval' ? `/api/angelcare-marketplace/crm/quotes/${selected.id}/approval` : `/api/angelcare-marketplace/crm/quotes/${selected.id}/transition`, {
        method: 'POST',
        body: JSON.stringify(decisionKind === 'approval' ? { decision, reason: reason.trim() } : { target: decision, reason: reason.trim() }),
      })
      setLocal((current) => current.map((quote) => quote.id === updated.id ? updated : quote))
      setMessage(`${updated.public_reference} mis à jour.`)
      setDecisionKind(''); setDecision(''); setReason('')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Décision impossible.') }
    finally { setBusy(false) }
  }

  const statuses = [...new Set(local.map((quote) => quote.quote_status))]
  return <main className={styles.orderWorkspace}>
    <header className={styles.orderWorkspaceHeader}><div><span className={styles.eyebrow}>QUOTE & PROOF COMMAND</span><h1>Devis & paniers de devis</h1><p>Versions commerciales, montants persistants, approbations et configurations restent reliés aux opportunités réelles.</p></div><div className={styles.orderHeaderActions}><a className={styles.secondaryButton} href="#quote-baskets">Paniers de devis</a><a className={styles.primaryButton} href="#new-quote">Nouveau devis</a></div></header>
    {message ? <div className={styles.orderNotice} role="status"><CheckCircle2 size={15}/> {message}</div> : null}{error ? <div className={styles.error} role="alert">{error}</div> : null}
    <section className={styles.orderMetricGrid}>
      <Metric label="Devis" value={local.length} hint="Versions réelles" icon={<FilePlus2/>} />
      <Metric label="En approbation" value={local.filter((quote) => ['pending', 'not_requested'].includes(quote.approval_status) && ['internal_review', 'submitted'].includes(quote.quote_status)).length} hint="À traiter" icon={<FilePlus2/>} tone="warning" />
      <Metric label="Acceptés" value={local.filter((quote) => quote.quote_status === 'accepted').length} hint="Conversion" icon={<CheckCircle2/>} />
      <Metric label="Paniers devis" value={baskets.length} hint="Configurations persistantes" icon={<ShoppingBag/>} />
      <Metric label="Expirés" value={local.filter((quote) => quote.quote_status === 'expired').length} hint="Historique" icon={<X/>} tone="danger" />
      <Metric label="Rejetés" value={local.filter((quote) => quote.approval_status === 'rejected' || quote.quote_status === 'rejected').length} hint="Décisions" icon={<X/>} tone="danger" />
    </section>
    <div className={styles.orderCommandGrid}>
      <section className={styles.orderRegistryPanel}>
        <div className={styles.orderPanelHeader}><div><h2>Devis versionnés & preuve commerciale</h2><p>Remises, totaux, validité, statut et approbation.</p></div><span className={styles.status}>{filtered.length} affichés</span></div>
        <div className={styles.orderFilters}><label className={styles.orderSearch}><Search size={15}/><span className="sr-only">Rechercher</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Référence, opportunité, statut…" /></label><label><span className="sr-only">Statut</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Tous statuts</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label><button className={styles.secondaryButton} onClick={() => { setQuery(''); setStatusFilter('all') }}>Réinitialiser</button></div>
        <div className={styles.orderTableWrap}><table className={styles.orderTable}><thead><tr><th>Référence</th><th>Opportunité</th><th>Version</th><th>Statut</th><th>Grand total</th><th>Approbation</th><th>Valide jusqu’au</th></tr></thead><tbody>{filtered.map((quote) => <tr key={quote.id} data-selected={selectedId === quote.id} onClick={() => setSelectedId(quote.id)}><td><button className={styles.orderReferenceButton}>{quote.public_reference}</button></td><td>{opportunities.find((item) => item.id === quote.opportunity_id)?.name || quote.opportunity_id}</td><td>v{quote.version}</td><td><span className={styles.status} data-state={quote.quote_status}>{quote.quote_status}</span></td><td><strong>{quote.grand_total.toLocaleString('fr-FR')} {quote.currency_label}</strong><small>{quote.subtotal.toLocaleString('fr-FR')} − {quote.discount_total.toLocaleString('fr-FR')} + {quote.tax_total.toLocaleString('fr-FR')}</small></td><td><span className={styles.status} data-state={quote.approval_status}>{quote.approval_status}</span></td><td>{quote.valid_until || 'Sans date'}</td></tr>)}</tbody></table>{!filtered.length ? <div className={styles.emptyState}>Aucun devis ne correspond aux filtres.</div> : null}</div>
        <div id="quote-baskets" className={styles.orderPanelHeader}><div><h2>Paniers de devis & configurations</h2><p>Lignes, prix, montants et expiration persistent jusqu’à qualification.</p></div><span className={styles.status}>{baskets.length}</span></div>
        <div className={styles.orderTableWrap}><table className={styles.orderTable}><thead><tr><th>Référence</th><th>Contexte</th><th>Lignes</th><th>Statut prix</th><th>Total</th><th>Expiration</th></tr></thead><tbody>{baskets.map((basket) => <tr key={basket.id}><td><strong>{basket.public_reference}</strong></td><td>{basket.tenant_id ? 'Tenant' : basket.family_account_id ? 'Famille' : 'Public'}</td><td>{basket.items?.length || 0}</td><td><span className={styles.status} data-state={basket.basket_status}>{basket.basket_status}</span></td><td>{basket.grand_total.toLocaleString('fr-FR')} {basket.currency_label}</td><td>{basket.expires_at ? new Date(basket.expires_at).toLocaleString('fr-FR') : 'Ouvert'}</td></tr>)}</tbody></table>{!baskets.length ? <div className={styles.emptyState}>Aucun panier de devis réel.</div> : null}</div>
      </section>
      <aside className={styles.orderContextRail}>
        <section>{selected ? <><div className={styles.orderRailHeading}><div><span>Devis sélectionné</span><h2>{selected.public_reference}</h2></div><FilePlus2 size={19}/></div><dl className={styles.orderFacts}><div><dt>Statut</dt><dd>{selected.quote_status}</dd></div><div><dt>Approbation</dt><dd>{selected.approval_status}</dd></div><div><dt>Version</dt><dd>{selected.version}</dd></div><div><dt>Total</dt><dd>{selected.grand_total.toLocaleString('fr-FR')} {selected.currency_label}</dd></div></dl><h3>Lifecycle</h3><div className={styles.orderTransitionGrid}>{quoteTargets.map((target) => <button key={target} className={['rejected', 'cancelled'].includes(target) ? styles.dangerButton : styles.secondaryButton} disabled={!canManage || selected.quote_status === target} onClick={() => { setDecisionKind('status'); setDecision(target) }}>{target.replaceAll('_', ' ')}</button>)}</div><h3 style={{ marginTop: 16 }}>Approbation</h3><div className={styles.orderTransitionGrid}><button className={styles.secondaryButton} disabled={!canApprove} onClick={() => { setDecisionKind('approval'); setDecision('approved') }}>Approuver</button><button className={styles.dangerButton} disabled={!canApprove} onClick={() => { setDecisionKind('approval'); setDecision('rejected') }}>Rejeter</button></div></> : <div className={styles.emptyState}>Sélectionnez un devis.</div>}</section>
        <section id="new-quote"><h3>Créer un devis</h3><div className={styles.bookingForm}><label><span>Opportunité</span><select value={opportunityId} onChange={(event) => setOpportunityId(event.target.value)}>{opportunities.map((item) => <option value={item.id} key={item.id}>{item.public_reference} · {item.name}</option>)}</select></label><label><span>Sous-total</span><input type="number" min="0" value={subtotal} onChange={(event) => setSubtotal(event.target.value)} /></label><label><span>Remise</span><input type="number" min="0" value={discount} onChange={(event) => setDiscount(event.target.value)} /></label><label><span>Taxe</span><input type="number" min="0" value={tax} onChange={(event) => setTax(event.target.value)} /></label><label><span>Valide jusqu’au</span><input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} /></label><label><span>Termes</span><input value={terms} onChange={(event) => setTerms(event.target.value)} /></label><button className={styles.primaryButton} disabled={busy || !canManage || !opportunityId} title={!canManage ? 'Permission marketplace.crm.quotes.manage requise' : undefined} onClick={() => void createQuote()}>{busy ? 'Création…' : 'Créer le devis'}</button></div></section>
        <section><h3>Continuité</h3><Link className={styles.secondaryButton} href="/angelcare-marketplace/admin/conversion/quotations">Conversion B2B</Link><Link className={styles.secondaryButton} href="/angelcare-marketplace/admin/verticals">B2B & partenaires</Link></section>
      </aside>
    </div>
    {selected && decisionKind && decision ? <div className={styles.orderModalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setDecisionKind('') }}><section className={styles.orderModal} role="dialog" aria-modal="true" aria-labelledby="quote-decision"><header><div><span>{decisionKind === 'approval' ? 'Décision d’approbation' : 'Transition de devis'}</span><h2 id="quote-decision">{selected.public_reference} → {decision}</h2></div><button aria-label="Fermer" onClick={() => setDecisionKind('')}><X size={18}/></button></header><div className={styles.orderDecisionSummary}><div><span>Statut actuel</span><strong>{decisionKind === 'approval' ? selected.approval_status : selected.quote_status}</strong></div><div><span>Décision</span><strong>{decision}</strong></div></div><p>L’autorité serveur valide le lifecycle. Un devis ne peut être accepté sans approbation réelle.</p><label><span>Motif obligatoire</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} /></label>{error ? <div className={styles.error}>{error}</div> : null}<footer><button className={styles.secondaryButton} disabled={busy} onClick={() => setDecisionKind('')}>Retour</button><button className={['rejected', 'cancelled'].includes(decision) ? styles.dangerButton : styles.primaryButton} disabled={busy || !reason.trim()} onClick={() => void applyDecision()}>{busy ? 'Application…' : 'Confirmer'}</button></footer></section></div> : null}
  </main>
}

function Metric({ label, value, hint, icon, tone = 'neutral' }: { label: string; value: number; hint: string; icon: React.ReactNode; tone?: string }) { return <article data-tone={tone}><div>{icon}<span>{label}</span></div><strong>{value.toLocaleString('fr-FR')}</strong><small>{hint}</small></article> }
