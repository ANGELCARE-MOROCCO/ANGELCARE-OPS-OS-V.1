'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { BadgeDollarSign, Download, FileText, RefreshCcw, RotateCcw, Truck, UserRound } from 'lucide-react'
import type { DocumentTemplateKey, EnterpriseTimelineEvent, OrderMegaDossier } from '../types'
import styles from '../enterprise-command.module.css'
import { OrderInlineOperations } from './OrderInlineOperations'

type Envelope<T> = { data: T }
const txt = (record: Record<string, unknown> | null | undefined, key: string) => String(record?.[key] ?? '')
const obj = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
const money = (value: unknown) => `${Number(value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh`

export function OrderMegaCommand({ orderId }: { orderId: string }) {
  const [data, setData] = useState<OrderMegaDossier | null>(null)
  const [tab, setTab] = useState('Command')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function reload() {
    const response = await fetch(`/api/angelcare-marketplace/admin/enterprise-command/orders/${orderId}`, { cache: 'no-store' })
    const payload = await response.json() as Envelope<OrderMegaDossier> & { error?: { message?: string } }
    if (response.ok && 'data' in payload) { setData(payload.data); setError('') }
    else setError(payload.error?.message || 'Commande indisponible.')
  }
  useEffect(() => { void reload() }, [orderId])

  const financial = useMemo(() => obj(data?.order.financial_status), [data])
  const fulfillment = useMemo(() => obj(data?.order.fulfillment_status), [data])
  const scheduling = useMemo(() => obj(data?.order.scheduling), [data])
  const total = Number(financial.grand_total || financial.total || financial.total_amount || 0)
  const paymentStatus = String(financial.payment_status || data?.payments?.[0]?.status || '—')

  async function transition(status: string) {
    setBusy(true); setNotice('')
    try {
      const response = await fetch(`/api/angelcare-marketplace/admin/orders/${orderId}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status, reason: `Order Command OS · ${status}` }) })
      const payload = await response.json() as { error?: { message?: string } }
      if (response.ok) { setNotice(`Commande passée à ${status}.`); await reload() }
      else setNotice(payload.error?.message || 'Transition impossible.')
    } finally { setBusy(false) }
  }

  async function pdf(templateKey: DocumentTemplateKey = 'order_summary') {
    const response = await fetch('/api/angelcare-marketplace/admin/enterprise-command/documents/export', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ objectType: 'order', objectId: orderId, templateKey }) })
    if (!response.ok) { setNotice('Document indisponible.'); return }
    const blob = await response.blob(); const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(blob); anchor.download = `${data?.enterpriseReference || 'ORDER'}_${templateKey}.pdf`; anchor.click(); URL.revokeObjectURL(anchor.href)
  }

  const tabs = ['Command', 'Operate', 'Items', 'Payment', 'Fulfillment', 'Documents', 'Communications', 'Incidents', 'Refunds', 'Timeline', 'Relations']

  return <div className={styles.command}>
    <section className={styles.hero}>
      <div className={styles.panelTitle}>
        <div><div className={styles.eyebrow}>Enterprise Order Command OS</div><h1 className={styles.title}>{data ? txt(data.order, 'title') : 'Order Command'}</h1><p className={styles.lead}>{data?.enterpriseReference} · {data ? txt(data.customer, 'display_name') : ''} · {money(total)}</p></div>
        <div className={styles.toolbar}><button className={styles.buttonSecondary} onClick={reload}><RefreshCcw size={14} /></button><button className={styles.button} onClick={() => pdf('order_summary')}><Download size={14} />Order Pack</button></div>
      </div>
      {data ? <div className={styles.phaseRail}>{data.phaseReferences.map((phase) => <div key={phase.phase} className={`${styles.phase} ${phase.status === 'current' ? styles.phaseCurrent : phase.status === 'completed' ? styles.phaseDone : ''}`}><strong>{phase.label}</strong><small>{phase.reference}</small></div>)}</div> : null}
    </section>

    {data ? <div className={styles.metricGrid}>
      <Metric icon={<BadgeDollarSign size={15} />} label="Montant" value={money(total)} />
      <Metric label="Paiement" value={paymentStatus} />
      <Metric icon={<Truck size={15} />} label="Fulfillment" value={String(fulfillment.status || txt(data.order, 'status'))} />
      <Metric icon={<UserRound size={15} />} label="Client" value={txt(data.customer, 'display_name') || '—'} />
    </div> : null}

    {error ? <div className={styles.error}>{error}</div> : !data ? <div className={styles.panel}>Chargement de la commande…</div> : <>
      <div className={styles.tabs}>{tabs.map((name) => <button key={name} className={`${styles.tab} ${tab === name ? styles.tabActive : ''}`} onClick={() => setTab(name)}>{name}</button>)}</div>

      {tab === 'Command' ? <div className={styles.grid2}>
        <div className={styles.panel}>
          <div className={styles.panelTitle}><h3>Order authority</h3><span className={styles.chip}>{txt(data.order, 'status')}</span></div>
          <div className={styles.grid3}>
            <Metric label="Type" value={txt(data.order, 'journey_type') || '—'} />
            <Metric label="Lignes" value={data.lines.length} />
            <Metric label="Paiements" value={data.payments.length} />
            <Metric label="Factures" value={data.invoices.length} />
            <Metric label="Remboursements" value={data.refunds.length} />
            <Metric label="Documents" value={data.documents.length} />
          </div>
          <div className={styles.rowActions} style={{ marginTop: 16 }}>
            <button className={styles.buttonSecondary} disabled={busy} onClick={() => transition('in_preparation')}>Préparation</button>
            <button className={styles.buttonSecondary} disabled={busy} onClick={() => transition('in_progress')}>En exécution</button>
            <button className={styles.button} disabled={busy} onClick={() => transition('completed')}>Clôturer</button>
            <button className={styles.buttonDanger} disabled={busy} onClick={() => transition('recovery')}>Recovery</button>
            <button className={styles.buttonDanger} disabled={busy} onClick={() => transition('cancelled')}>Annuler</button>
          </div>
          {notice ? <div className={styles.notice} style={{ marginTop: 12 }}>{notice}</div> : null}
          <div className={styles.rowActions} style={{ marginTop: 12 }}>
            <button className={styles.buttonSecondary} onClick={() => setTab('Operate')}>Opérer lignes / planning / finance</button>
            <Link className={styles.buttonSecondary} href={`/angelcare-marketplace/admin/payments?order=${orderId}`}>Payment Command</Link>
            <Link className={styles.buttonSecondary} href={`/angelcare-marketplace/admin/finance/invoices?order=${orderId}`}>Facturer</Link>
            <Link className={styles.buttonSecondary} href={`/angelcare-marketplace/admin/orders/new?customer=${txt(data.customer, 'id')}&sourceOrder=${orderId}`}><RotateCcw size={13} />Reorder / replacement</Link>
          </div>
        </div>
        <div className={styles.panel}>
          <div className={styles.panelTitle}><h3>Customer & execution context</h3></div>
          <p><strong>{txt(data.customer, 'display_name')}</strong><br />{txt(data.customer, 'email')}<br />{txt(data.customer, 'phone')}</p>
          <div className={styles.grid3}>
            <Metric label="Planning" value={String(txt(data.order, 'scheduled_start_at') || scheduling.starts_at || scheduling.scheduled_at || '—')} />
            <Metric label="Provider" value={String(fulfillment.provider_name || fulfillment.provider_reference || '—')} />
            <Metric label="Territoire" value={txt(data.order, 'territory_id') || '—'} />
          </div>
          {data.customer ? <Link className={styles.buttonSecondary} style={{ marginTop: 12 }} href={`/angelcare-marketplace/admin/customers/${txt(data.customer, 'id')}/command`}>Mega Client Dossier</Link> : null}
        </div>
      </div> : null}

      {tab === 'Operate' ? <OrderInlineOperations data={data} onReload={reload} /> : null}
      {tab === 'Items' ? <RecordTable title="Lignes de commande" data={data.lines} /> : null}
      {tab === 'Payment' ? <div className={styles.grid2}><PaymentTable data={data.payments} /><RecordTable title="Factures & reçus" data={[...data.invoices, ...data.receipts]} /></div> : null}
      {tab === 'Fulfillment' ? <div className={styles.grid2}><RecordTable title="Participants / Providers" data={data.participants} /><RecordTable title="Actions fulfillment" data={data.actions} /><div className={styles.panel}><h3>Fiche d’exécution</h3><p className={styles.muted}>Document opérationnel avec phases codifiées et références de mission.</p><button className={styles.button} onClick={() => pdf('fulfillment_sheet')}><FileText size={14} />Fiche Fulfillment PDF</button></div></div> : null}
      {tab === 'Documents' ? <div className={styles.grid2}><div className={styles.panel}><h3>Document Factory</h3><p className={styles.muted}>Order Pack et fiche fulfillment générés à partir de l’état courant.</p><div className={styles.rowActions}><button className={styles.button} onClick={() => pdf('order_summary')}><FileText size={14} />Order Pack</button><button className={styles.buttonSecondary} onClick={() => pdf('fulfillment_sheet')}>Fulfillment Sheet</button><Link className={styles.buttonSecondary} href="/angelcare-marketplace/admin/documents">Template Studio</Link></div></div><RecordTable title="Documents existants" data={data.documents} /></div> : null}
      {tab === 'Refunds' ? <RecordTable title="Remboursements" data={data.refunds} /> : null}
      {tab === 'Timeline' ? <div className={styles.panel}><div className={styles.timeline}>{data.timeline.map((event) => <TimelineEvent event={event} key={event.id} />)}</div></div> : null}
      {tab === 'Relations' ? <RecordTable title="Relations objets" data={data.relations} /> : null}
      {tab === 'Communications' ? <RecordTable title="Communications" data={data.notifications} /> : null}
      {tab === 'Incidents' ? <RecordTable title="Incidents / événements" data={data.events.filter((event) => /incident|blocked|failure|risk|recovery/i.test(`${event.event_type || ''} ${event.status || ''} ${event.label || ''}`))} /> : null}
    </>}
  </div>
}

function Metric({ label, value, icon }: { label: string; value: unknown; icon?: React.ReactNode }) { return <div className={styles.metric}>{icon}<strong style={{ fontSize: 18 }}>{String(value)}</strong><span>{label}</span></div> }
function TimelineEvent({ event }: { event: EnterpriseTimelineEvent }) {
  const changes = event.before && event.after ? Object.keys(event.after).filter((key) => String(event.before?.[key] ?? '') !== String(event.after?.[key] ?? '')).slice(0, 12) : []
  const human = (value: unknown) => {
    if (value == null || value === '') return '—'
    if (typeof value === 'object') return Array.isArray(value) ? `${value.length} élément(s)` : 'État structuré'
    return String(value).slice(0, 120)
  }
  return <div className={styles.event}><i className={styles.eventDot} /><div><strong>{event.title}</strong><div className={styles.muted}>{new Date(event.occurredAt).toLocaleString('fr-FR')} · {event.status || event.source}</div>{event.description ? <div>{event.description}</div> : null}{changes.length ? <details style={{ marginTop: 7 }}><summary className={styles.muted} style={{ cursor: 'pointer', fontWeight: 800 }}>Voir {changes.length} changement(s)</summary><div className={styles.tableWrap} style={{ marginTop: 7 }}><table className={styles.table}><tbody>{changes.map((key) => <tr key={key}><td><strong>{key.replaceAll('_', ' ')}</strong></td><td>{human(event.before?.[key])}</td><td>→</td><td>{human(event.after?.[key])}</td></tr>)}</tbody></table></div></details> : null}</div></div>
}

function PaymentTable({ data }: { data: Record<string, unknown>[] }) { return <div className={styles.panel}><div className={styles.panelTitle}><h3>Paiements</h3><span className={styles.chip}>{data.length}</span></div>{data.length ? <div className={styles.tableWrap}><table className={styles.table}><tbody>{data.map((record, index) => <tr key={txt(record, 'id') || String(index)}><td><strong>{txt(record, 'public_reference') || 'Paiement'}</strong><br /><span className={styles.muted}>{txt(record, 'status')} · {money(record.expected_amount || record.captured_amount)}</span></td><td style={{ textAlign: 'right' }}>{record.id ? <Link className={styles.buttonSecondary} href={`/angelcare-marketplace/admin/payments/${String(record.id)}/command`}>Finance dossier</Link> : null}</td></tr>)}</tbody></table></div> : <p className={styles.muted}>Aucun paiement.</p>}</div> }
function RecordTable({ title, data }: { title: string; data: Record<string, unknown>[] }) { return <div className={styles.panel}><div className={styles.panelTitle}><h3>{title}</h3><span className={styles.chip}>{data.length}</span></div>{data.length ? <div className={styles.tableWrap}><table className={styles.table}><tbody>{data.slice(0, 50).map((record, index) => <tr key={String(record.id || index)}><td><strong>{String(record.public_reference || record.title || record.name || record.status || record.action_type || 'Objet')}</strong><br /><span className={styles.muted}>{String(record.status || record.quantity || record.amount || record.created_at || '')}</span></td></tr>)}</tbody></table></div> : <p className={styles.muted}>Aucun élément.</p>}</div> }
