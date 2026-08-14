'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BadgeDollarSign, CalendarDays, Download, Expand, ExternalLink, FileText, MessageSquareText, Minimize2, ReceiptText, ShoppingBag, WalletCards, X } from 'lucide-react'
import type { CustomerMegaDossier, DocumentTemplateKey, EnterpriseTimelineEvent } from '../types'
import styles from '../enterprise-command.module.css'
import { CustomerInlineOperations } from './CustomerInlineOperations'
import { OrderMegaCommandOverlay } from './OrderMegaCommandOverlay'
import { PaymentMegaCommandOverlay } from './PaymentMegaCommandOverlay'

type Envelope<T> = { data: T }
const txt = (record: Record<string, unknown> | null | undefined, key: string) => String(record?.[key] ?? '')
const money = (value: unknown) => `${Number(value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh`

export function CustomerMegaDossierOverlay({ customerId, onClose }: { customerId: string; onClose: () => void }) {
  const [data, setData] = useState<CustomerMegaDossier | null>(null)
  const [tab, setTab] = useState('360')
  const [error, setError] = useState('')
  const [creditAmount, setCreditAmount] = useState('')
  const [creditDirection, setCreditDirection] = useState('credit')
  const [creditReason, setCreditReason] = useState('Geste commercial documenté')
  const [notice, setNotice] = useState('')
  const [note, setNote] = useState('')
  const [fullscreen, setFullscreen] = useState(false)
  const [nestedOrderId, setNestedOrderId] = useState<string | null>(null)
  const [nestedPaymentId, setNestedPaymentId] = useState<string | null>(null)

  async function reload() {
    const response = await fetch(`/api/angelcare-marketplace/admin/enterprise-command/customers/${customerId}`, { cache: 'no-store' })
    const payload = await response.json() as Envelope<CustomerMegaDossier> & { error?: { message?: string } }
    if (response.ok && 'data' in payload) { setData(payload.data); setError('') }
    else setError(payload.error?.message || 'Dossier indisponible.')
  }

  useEffect(() => { void reload() }, [customerId])

  const tabs = ['360', 'Opérer', 'Famille', 'Commerce', 'Finance', 'CRM', 'Activité', 'Documents']
  const customer = data?.customer || {}
  const wallet = Number(data?.walletAccount?.available_balance || data?.walletAccount?.balance || 0)

  async function exportPdf(templateKey: DocumentTemplateKey) {
    const response = await fetch('/api/angelcare-marketplace/admin/enterprise-command/documents/export', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ objectType: 'customer', objectId: customerId, templateKey }),
    })
    if (!response.ok) { setNotice('Document indisponible.'); return }
    const blob = await response.blob()
    const anchor = document.createElement('a')
    anchor.href = URL.createObjectURL(blob)
    anchor.download = `${data?.enterpriseReference || 'ANGELCARE-CUSTOMER'}_${templateKey}.pdf`
    anchor.click(); URL.revokeObjectURL(anchor.href)
  }

  async function adjustCredit() {
    if (!data?.walletAccount?.id || !creditAmount) return
    setNotice('')
    const response = await fetch(`/api/angelcare-marketplace/admin/wallet/accounts/${String(data.walletAccount.id)}/adjustment`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ amount: Number(creditAmount), direction: creditDirection, bucketKind: 'goodwill', reason: creditReason, idempotencyKey: crypto.randomUUID() }),
    })
    if (response.ok) { setNotice('AngelCare Credit ajusté et journalisé.'); setCreditAmount(''); await reload(); return }
    const payload = await response.json().catch(() => ({ error: { message: 'Ajustement impossible.' } })) as { error?: { message?: string } }
    setNotice(payload.error?.message || 'Ajustement impossible.')
  }

  async function addNote() {
    if (!note.trim()) return
    const response = await fetch(`/api/angelcare-marketplace/backoffice/objects/customer_account/${customerId}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ body: note, visibility: 'internal' }),
    })
    if (response.ok) { setNote(''); setNotice('Note interne ajoutée au dossier.'); await reload() }
    else setNotice('Note impossible.')
  }

  return <div className={styles.overlay}>
    <section className={`${styles.dossier} ${fullscreen ? styles.dossierFullscreen : ''}`} aria-label="Mega dossier client">
      <header className={styles.dossierHeader}>
        <div className={styles.panelTitle}>
          <div>
            <div className={styles.eyebrow}>Customer 360 Command Dossier</div>
            <h2 style={{ margin: '4px 0' }}>{txt(customer, 'display_name') || 'Chargement…'}</h2>
            <div className={styles.muted}>{data?.enterpriseReference} · {txt(customer, 'email')} · {txt(customer, 'phone')}</div>
          </div>
          <div className={styles.toolbar}>
            {data ? <>
              <Link className={styles.button} href={`/angelcare-marketplace/admin/orders/new?customer=${customerId}`}><ShoppingBag size={14} />Créer commande</Link>
              <Link className={styles.buttonSecondary} href={`/angelcare-marketplace/admin/bookings?customer=${customerId}`}><CalendarDays size={14} />Booking</Link>
              <button className={styles.buttonSecondary} onClick={() => exportPdf('customer_dossier')}><Download size={14} />PDF</button>
              <button className={styles.buttonSecondary} onClick={() => setFullscreen((value) => !value)} title={fullscreen ? 'Réduire' : 'Plein écran'}>{fullscreen ? <Minimize2 size={14}/> : <Expand size={14}/>}</button>
              <Link className={styles.buttonSecondary} href={`/angelcare-marketplace/admin/customers/${customerId}/command`}><ExternalLink size={14} /></Link>
            </> : null}
            <button className={styles.buttonSecondary} onClick={onClose}><X size={14} /></button>
          </div>
        </div>
        {data ? <div className={styles.metricGrid}>
          <Metric label="Valeur client nette" value={money(data.intelligence.lifetimeRevenue)} />
          <Metric label="Commandes" value={data.intelligence.orderCount} />
          <Metric label="AngelCare Credit" value={money(wallet)} />
          <Metric label="Demandes / signaux" value={data.intelligence.inquiryCount} />
        </div> : null}
      </header>

      <div style={{ padding: '10px 24px', background: '#fff', borderBottom: '1px solid #dde5ed' }}>
        <div className={styles.tabs}>{tabs.map((name) => <button key={name} className={`${styles.tab} ${tab === name ? styles.tabActive : ''}`} onClick={() => setTab(name)}>{name}</button>)}</div>
      </div>

      <main className={styles.dossierBody}>
        {error ? <div className={styles.error}>{error}</div> : !data ? <div className={styles.panel}>Chargement du dossier complet…</div> : <>
          {tab === '360' ? <div className={styles.grid2}>
            <div className={styles.panel}>
              <div className={styles.panelTitle}><h3>Identité & persona</h3><span className={styles.chip}>{txt(customer, 'account_kind') || 'customer'}</span></div>
              <div className={styles.grid3}>
                <Metric label="Statut" value={txt(customer, 'status') || '—'} />
                <Metric label="Premium" value={customer.premium_status ? 'Oui' : 'Non'} />
                <Metric label="Locale" value={txt(customer, 'preferred_locale') || 'fr'} />
                <Metric label="Famille" value={data.family ? txt(data.family, 'public_reference') : '—'} />
                <Metric label="Enfants" value={data.children.length} />
                <Metric label="Adresses" value={data.addresses.length} />
              </div>
              <div style={{ marginTop: 14 }} className={styles.muted}>Dernière activité : {data.intelligence.lastActivityAt ? new Date(data.intelligence.lastActivityAt).toLocaleString('fr-FR') : '—'} · Dernière commande : {data.intelligence.lastOrderAt ? new Date(data.intelligence.lastOrderAt).toLocaleString('fr-FR') : '—'}</div>
            </div>
            <div className={styles.panel}>
              <div className={styles.panelTitle}><h3>Commercial intelligence</h3><span className={styles.chip}>Live dossier</span></div>
              <div className={styles.grid3}>
                <Metric label="Panier moyen" value={money(data.intelligence.averageOrderValue)} />
                <Metric label="Actives" value={data.intelligence.activeOrderCount} />
                <Metric label="Bookings" value={data.intelligence.bookingCount} />
                <Metric label="Abonnements" value={data.intelligence.subscriptionCount} />
                <Metric label="Saved" value={data.intelligence.savedCount} />
                <Metric label="Récemment vus" value={data.intelligence.recentlyViewedCount} />
              </div>
              {data.intelligence.favoriteCategories.length ? <div style={{ marginTop: 14 }}><div className={styles.muted}>Affinités catégories</div><div className={styles.toolbar} style={{ marginTop: 6 }}>{data.intelligence.favoriteCategories.map((entry) => <span className={styles.chip} key={entry.key}>{entry.label} · {entry.count}</span>)}</div></div> : null}
              {data.intelligence.acquisitionSources.length ? <div style={{ marginTop: 12 }}><div className={styles.muted}>Sources d’acquisition / création</div><div className={styles.toolbar} style={{ marginTop: 6 }}>{data.intelligence.acquisitionSources.map((entry) => <span className={styles.chip} key={entry.source}>{entry.source} · {entry.count}</span>)}</div></div> : null}
              <div className={styles.rowActions} style={{ marginTop: 16 }}>
                <Link className={styles.buttonSecondary} href={`/angelcare-marketplace/admin/commercial?customer=${customerId}`}>CRM / Revenue</Link>
                <Link className={styles.buttonSecondary} href={`/angelcare-marketplace/admin/payments?customer=${customerId}`}>Finance</Link>
                <Link className={styles.buttonSecondary} href={`/angelcare-marketplace/admin/subscriptions?customer=${customerId}`}>Subscriptions</Link>
              </div>
            </div>
          </div> : null}

          {tab === 'Opérer' ? <CustomerInlineOperations data={data} onReload={reload} /> : null}

          {tab === 'Famille' ? <div className={styles.grid2}>
            <RecordList title="Gardiens" data={data.guardians} />
            <RecordList title="Enfants" data={data.children} />
            <RecordList title="Adresses" data={data.addresses} />
            <div className={styles.panel}><h3>Actions famille</h3><p className={styles.muted}>Le dossier canonique famille reste éditable depuis Customer Command; ce Mega Dossier centralise immédiatement son contexte.</p><Link className={styles.button} href={`/angelcare-marketplace/admin/customers?customer=${customerId}`}>Éditer identité / famille</Link></div>
          </div> : null}

          {tab === 'Commerce' ? <div className={styles.grid2}>
            <RecordList title="Commandes" data={data.orders} kind="order" onOpen={(record) => setNestedOrderId(txt(record, 'id'))} />
            <RecordList title="Bookings" data={data.bookings} kind="booking" />
            <RecordList title="Abonnements" data={data.subscriptions} kind="subscription" />
            <RecordList title="Récemment consulté" data={data.recentlyViewed} kind="product" />
            <RecordList title="Saved / favoris" data={data.savedItems} kind="product" />
          </div> : null}

          {tab === 'Finance' ? <div className={styles.command}>
            <div className={styles.panel}>
              <div className={styles.panelTitle}><h3><WalletCards size={16} /> AngelCare Credit authority</h3><span className={styles.chip}>{money(wallet)}</span></div>
              {data.walletAccount ? <>
                <div className={styles.grid3}>
                  <F label="Direction"><select className={styles.select} value={creditDirection} onChange={(event) => setCreditDirection(event.target.value)}><option value="credit">Créditer</option><option value="debit">Débiter</option></select></F>
                  <F label="Montant AC"><input className={styles.input} type="number" min="0.01" step="0.01" value={creditAmount} onChange={(event) => setCreditAmount(event.target.value)} /></F>
                  <F label="Motif"><input className={styles.input} value={creditReason} onChange={(event) => setCreditReason(event.target.value)} /></F>
                </div>
                <div className={styles.rowActions} style={{ marginTop: 12 }}><button className={styles.button} onClick={adjustCredit}>Appliquer écriture Credit</button><button className={styles.buttonSecondary} onClick={() => exportPdf('wallet_statement')}><ReceiptText size={14} />Relevé Credit PDF</button></div>
              </> : <p className={styles.muted}>Aucun Wallet créé pour ce client.</p>}
              {notice ? <div className={styles.notice} style={{ marginTop: 10 }}>{notice}</div> : null}
            </div>
            <div className={styles.grid2}>
              <RecordList title="Paiements" data={data.payments} kind="payment" onOpen={(record) => setNestedPaymentId(txt(record, 'id'))} />
              <RecordList title="Remboursements" data={data.refunds} />
              <RecordList title="Factures" data={data.invoices} kind="invoice" />
              <RecordList title="AngelCare Credit ledger" data={data.walletLedger} />
            </div>
          </div> : null}

          {tab === 'CRM' ? <div className={styles.grid2}>
            <RecordList title="Opportunités" data={data.crmOpportunities} kind="opportunity" />
            <RecordList title="Devis" data={data.crmQuotes} kind="quote" />
            <RecordList title="Demandes" data={data.inquiries} kind="inquiry" />
            <RecordList title="Support" data={data.supportTickets} />
            <div className={styles.panel}><div className={styles.panelTitle}><h3>Actions relation client</h3><MessageSquareText size={16} /></div><div className={styles.rowActions}><Link className={styles.button} href={`/angelcare-marketplace/admin/commercial?customer=${customerId}`}>Ouvrir CRM</Link><Link className={styles.buttonSecondary} href={`/angelcare-marketplace/admin/public-inquiries?customer=${customerId}`}>Inquiries</Link></div></div>
          </div> : null}

          {tab === 'Activité' ? <div className={styles.command}>
            <div className={styles.panel}>
              <div className={styles.panelTitle}><h3>Note interne</h3><span className={styles.chip}>{data.comments.length} notes</span></div>
              <textarea className={styles.textarea} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Observation, engagement, demande client, contexte commercial…" />
              <button className={styles.button} style={{ marginTop: 10 }} onClick={addNote}>Ajouter au dossier</button>
            </div>
            <div className={styles.panel}><div className={styles.timeline}>{data.timeline.map((event) => <TimelineEvent event={event} key={event.id} />)}</div></div>
          </div> : null}

          {tab === 'Documents' ? <div className={styles.grid2}>
            <div className={styles.panel}><div className={styles.panelTitle}><h3>Documents instantanés</h3><FileText size={18} /></div><p className={styles.muted}>Générés depuis le dossier courant, avec la référence humaine et le Template Studio.</p><div className={styles.rowActions}><button className={styles.button} onClick={() => exportPdf('customer_dossier')}><Download size={14} />Dossier Client</button><button className={styles.buttonSecondary} onClick={() => exportPdf('family_dossier')}>Dossier Famille</button><button className={styles.buttonSecondary} onClick={() => exportPdf('wallet_statement')}>Relevé Credit</button></div></div>
            <div className={styles.panel}><h3>Corporate Template Studio</h3><p className={styles.muted}>A4/A3, portrait/paysage, FR/EN/AR, logo existant, header/footer, texte légal et blocs conditionnels.</p><Link className={styles.button} href="/angelcare-marketplace/admin/documents">Ouvrir Document Factory</Link></div>
          </div> : null}
        </>}
      </main>
    </section>
    {nestedOrderId ? <OrderMegaCommandOverlay orderId={nestedOrderId} onClose={() => setNestedOrderId(null)} /> : null}
    {nestedPaymentId ? <PaymentMegaCommandOverlay paymentIntentId={nestedPaymentId} onClose={() => setNestedPaymentId(null)} /> : null}
  </div>
}

function Metric({ label, value }: { label: string; value: unknown }) { return <div className={styles.metric}><strong style={{ fontSize: 17 }}>{String(value)}</strong><span>{label}</span></div> }
function F({ label, children }: { label: string; children: React.ReactNode }) { return <div className={styles.field}><label>{label}</label>{children}</div> }

function TimelineEvent({ event }: { event: EnterpriseTimelineEvent }) {
  const changes = event.before && event.after ? Object.keys(event.after).filter((key) => String(event.before?.[key] ?? '') !== String(event.after?.[key] ?? '')).slice(0, 12) : []
  const human = (value: unknown) => {
    if (value == null || value === '') return '—'
    if (typeof value === 'object') return Array.isArray(value) ? `${value.length} élément(s)` : 'État structuré'
    return String(value).slice(0, 120)
  }
  return <div className={styles.event}><i className={styles.eventDot} /><div><strong>{event.title}</strong><div className={styles.muted}>{new Date(event.occurredAt).toLocaleString('fr-FR')} · {event.status || event.source}</div>{event.description ? <div>{event.description}</div> : null}{changes.length ? <details style={{ marginTop: 7 }}><summary className={styles.muted} style={{ cursor: 'pointer', fontWeight: 800 }}>Voir {changes.length} changement(s)</summary><div className={styles.tableWrap} style={{ marginTop: 7 }}><table className={styles.table}><tbody>{changes.map((key) => <tr key={key}><td><strong>{key.replaceAll('_', ' ')}</strong></td><td>{human(event.before?.[key])}</td><td>→</td><td>{human(event.after?.[key])}</td></tr>)}</tbody></table></div></details> : null}</div></div>
}

function routeFor(kind: string | undefined, record: Record<string, unknown>) {
  const id = txt(record, 'id')
  if (!id) return null
  if (kind === 'order') return `/angelcare-marketplace/admin/orders/${id}/command`
  if (kind === 'payment') return `/angelcare-marketplace/admin/payments/${id}/command`
  if (kind === 'invoice') return `/angelcare-marketplace/admin/finance/invoices?invoice=${id}`
  if (kind === 'booking') return '/angelcare-marketplace/admin/bookings'
  if (kind === 'subscription') return '/angelcare-marketplace/admin/subscriptions'
  if (kind === 'inquiry') return `/angelcare-marketplace/admin/public-inquiries?inquiry=${id}`
  if (kind === 'opportunity') return '/angelcare-marketplace/admin/commercial/opportunities'
  if (kind === 'quote') return '/angelcare-marketplace/admin/commercial/quotes'
  if (kind === 'product') {
    const productId = txt(record, 'catalog_item_id') || txt(record, 'item_id') || id
    return productId ? `/angelcare-marketplace/admin/catalog/items/${productId}/overview` : null
  }
  return null
}

function RecordList({ title, data, kind, onOpen }: { title: string; data: Record<string, unknown>[]; kind?: string; onOpen?: (record: Record<string, unknown>) => void }) {
  return <div className={styles.panel}><div className={styles.panelTitle}><h3>{title}</h3><span className={styles.chip}>{data.length}</span></div>{data.length ? <div className={styles.tableWrap}><table className={styles.table}><tbody>{data.slice(0, 50).map((record, index) => {
    const route = routeFor(kind, record)
    const primary = txt(record, 'public_reference') || txt(record, 'display_name') || txt(record, 'title') || txt(record, 'name') || txt(record, 'status') || `Objet ${index + 1}`
    const secondary = txt(record, 'status') || txt(record, 'email') || txt(record, 'amount') || txt(record, 'created_at')
    return <tr key={txt(record, 'id') || `${primary}-${index}`}><td><strong>{primary}</strong>{secondary ? <><br /><span className={styles.muted}>{secondary}</span></> : null}</td><td style={{ textAlign: 'right' }}>{onOpen ? <button type="button" className={styles.buttonSecondary} onClick={() => onOpen(record)}>Ouvrir dossier</button> : route ? <Link className={styles.buttonSecondary} href={route}>Ouvrir</Link> : null}</td></tr>
  })}</tbody></table></div> : <p className={styles.muted}>Aucun élément.</p>}</div>
}
