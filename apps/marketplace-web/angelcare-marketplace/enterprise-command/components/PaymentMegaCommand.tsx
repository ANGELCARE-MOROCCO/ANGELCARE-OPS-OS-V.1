'use client'

import Link from 'next/link'
import { useState } from 'react'
import { BadgeDollarSign, CheckCircle2, Download, RefreshCcw, RotateCcw, WalletCards } from 'lucide-react'
import type { AdminPaymentDossier } from '@/angelcare-marketplace/admin-control-plane/types'
import { useGovernedAction } from '@/angelcare-marketplace/shells/GovernedActionProvider'
import styles from '../enterprise-command.module.css'

type Envelope<T> = { data: T }
const money = (value: unknown) => `${Number(value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh`
const txt = (record: Record<string, unknown> | null | undefined, key: string) => String(record?.[key] ?? '')

export function PaymentMegaCommand({ initial, canManage = false, canRefund = false, canExport = false }: { initial: AdminPaymentDossier; canManage?: boolean; canRefund?: boolean; canExport?: boolean }) {
  const requestAction = useGovernedAction()
  const [data, setData] = useState(initial)
  const [reason, setReason] = useState('Régularisation opérateur documentée')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('Remboursement documenté depuis Finance Mega Dossier')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const payment = data.payment

  async function refresh() {
    const response = await fetch(`/api/angelcare-marketplace/admin/payments/${payment.id}`, { cache: 'no-store' })
    if (!response.ok) return
    const payload = await response.json() as Envelope<AdminPaymentDossier>
    if (payload.data) setData(payload.data)
  }

  async function act(action: string) {
    const decisionReason = await requestAction({ title: action === 'capture' ? 'Capturer le paiement' : action === 'failed' ? 'Déclarer le paiement en échec' : 'Annuler le paiement', objectLabel: payment.public_reference, currentState: payment.status, nextState: action === 'capture' ? 'captured / partially_captured' : action, consequence: action === 'capture' ? 'Le montant capturé devient une vérité financière et peut rendre reçus et factures éligibles.' : 'La transaction quitte son parcours de paiement actif.', permission: 'marketplace.finance.exceptions.approve', danger: action !== 'capture' })
    if (!decisionReason) return
    setBusy(true); setNotice('')
    try {
      const response = await fetch(`/api/angelcare-marketplace/admin/payments/${payment.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, reason: `${reason} · ${decisionReason}` }) })
      const payload = await response.json() as Envelope<AdminPaymentDossier> & { error?: { message?: string } }
      if (response.ok && 'data' in payload) { setData(payload.data); setNotice(`Action ${action} appliquée.`) }
      else setNotice(payload.error?.message || 'Action impossible.')
    } finally { setBusy(false) }
  }

  async function refund() {
    if (!refundAmount || !refundReason.trim()) return
    const decisionReason = await requestAction({ title: 'Autoriser le remboursement', objectLabel: payment.public_reference, currentState: `${money(payment.captured_amount)} capturé · ${money(payment.refunded_amount)} remboursé`, nextState: `${money(refundAmount)} supplémentaire remboursé`, consequence: 'Le moteur restaure la part Wallet et traite la part externe selon les autorités configurées.', permission: 'marketplace.finance.exceptions.approve', danger: true, reversibility: 'Un remboursement financier exécuté n’est pas annulable depuis cette autorité.' })
    if (!decisionReason) return
    setBusy(true); setNotice('')
    try {
      const response = await fetch(`/api/angelcare-marketplace/admin/payments/${payment.id}/refund`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ amount: Number(refundAmount), reason: `${refundReason} · ${decisionReason}`, idempotencyKey: `mega-refund:${payment.id}:${refundAmount}:${Date.now()}` }),
      })
      const payload = await response.json().catch(() => ({})) as { error?: { message?: string } }
      if (!response.ok) { setNotice(payload.error?.message || 'Remboursement impossible.'); return }
      setRefundAmount(''); setNotice('Remboursement enregistré.'); await refresh()
    } finally { setBusy(false) }
  }

  async function pdf() {
    if (!canExport) return
    const response = await fetch('/api/angelcare-marketplace/admin/enterprise-command/documents/export', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ objectType: 'payment', objectId: payment.id, templateKey: 'receipt' }) })
    if (!response.ok) return
    const blob = await response.blob(); const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(blob); anchor.download = `${payment.public_reference}.pdf`; anchor.click(); URL.revokeObjectURL(anchor.href)
  }

  const refundable = Math.max(0, Number(payment.captured_amount || 0) - Number(payment.refunded_amount || 0))

  return <div className={styles.command}>
    <section className={styles.hero}><div className={styles.panelTitle}><div><div className={styles.eyebrow}>Finance Object Dossier</div><h1 className={styles.title}>{payment.public_reference}</h1><p className={styles.lead}>{payment.customer_name} · {payment.order_reference || payment.canonical_object_type || 'Transaction autonome'} · {payment.provider_key || payment.selected_method || 'Méthode non définie'}</p></div><div className={styles.toolbar}><button className={styles.button} disabled={!canExport} title={canExport ? undefined : 'Permission marketplace.finance.export requise'} onClick={pdf}><Download size={14} />PDF</button><Link className={styles.buttonSecondary} href="/angelcare-marketplace/admin/payments"><RefreshCcw size={14} />Registre</Link></div></div></section>

    <div className={styles.metricGrid}>
      <Metric label="Attendu" value={money(payment.expected_amount)} icon={<BadgeDollarSign />} />
      <Metric label="Capturé" value={money(payment.captured_amount)} icon={<CheckCircle2 />} />
      <Metric label="Remboursé" value={money(payment.refunded_amount)} icon={<RotateCcw />} />
      <Metric label="Remboursable" value={money(refundable)} icon={<WalletCards />} />
    </div>

    <div className={styles.grid2}>
      <div className={styles.panel}>
        <div className={styles.panelTitle}><h3>Payment authority</h3><span className={styles.chip}>{payment.status}</span></div>
        <div className={styles.grid3}><Info label="Provider" value={`${payment.provider_key || '—'} · ${payment.provider_reference || '—'}`} /><Info label="Méthode" value={payment.selected_method || '—'} /><Info label="Objet" value={`${payment.canonical_object_type || '—'} · ${payment.order_reference || payment.canonical_object_id || '—'}`} /></div>
        <div className={styles.field}><label>Motif opérateur</label><input className={styles.input} value={reason} onChange={(event) => setReason(event.target.value)} /></div>
        <div className={styles.rowActions} style={{ marginTop: 12 }}><button className={styles.button} disabled={!canManage || busy || ['captured', 'refunded', 'partially_refunded'].includes(payment.status)} onClick={() => act('capture')}>Capturer</button><button className={styles.buttonSecondary} disabled={!canManage || busy || ['captured', 'refunded', 'partially_refunded', 'failed', 'cancelled'].includes(payment.status)} onClick={() => act('failed')}>Marquer échec</button><button className={styles.buttonDanger} disabled={!canManage || busy || ['captured', 'refunded', 'partially_refunded', 'failed', 'cancelled'].includes(payment.status)} onClick={() => act('cancelled')}>Annuler</button></div>
        {payment.customer_account_id ? <div className={styles.rowActions} style={{ marginTop: 12 }}><Link className={styles.buttonSecondary} href={`/angelcare-marketplace/admin/customers/${payment.customer_account_id}/command`}>Customer 360</Link>{payment.canonical_object_id ? <Link className={styles.buttonSecondary} href={`/angelcare-marketplace/admin/orders/${payment.canonical_object_id}/command`}>Order Command</Link> : null}</div> : null}
      </div>

      <div className={styles.panel}>
        <div className={styles.panelTitle}><h3>Refund authority</h3><span className={styles.chip}>{money(refundable)}</span></div>
        <div className={styles.grid2} style={{ gridTemplateColumns: '1fr 1fr' }}><div className={styles.field}><label>Montant</label><input className={styles.input} type="number" min="0.01" max={refundable || undefined} step="0.01" value={refundAmount} onChange={(event) => setRefundAmount(event.target.value)} placeholder={refundable ? String(refundable) : '0.00'} /></div><div className={styles.field}><label>Motif</label><input className={styles.input} value={refundReason} onChange={(event) => setRefundReason(event.target.value)} /></div></div>
        <button className={styles.buttonDanger} style={{ marginTop: 12 }} disabled={!canRefund || busy || !refundable || !refundAmount || Number(refundAmount) <= 0 || Number(refundAmount) > refundable} onClick={refund}><RotateCcw size={14} />Rembourser</button>
        {notice ? <div className={styles.notice} style={{ marginTop: 12 }}>{notice}</div> : null}
      </div>
    </div>

    <div className={styles.grid2}>
      <div className={styles.panel}><div className={styles.panelTitle}><h3>Attempts / evidence</h3><span className={styles.chip}>{data.attempts.length}</span></div><Rows data={data.attempts} /></div>
      <div className={styles.panel}><div className={styles.panelTitle}><h3>Refund history</h3><span className={styles.chip}>{data.refunds.length}</span></div><Rows data={data.refunds} /></div>
    </div>
    <div className={styles.panel}><h3>Order context</h3>{data.order ? <Rows data={[data.order]} /> : <p className={styles.muted}>Aucune commande liée.</p>}</div>
  </div>
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className={styles.metric}>{icon}<strong style={{ fontSize: 20 }}>{value}</strong><span>{label}</span></div> }
function Info({ label, value }: { label: string; value: string }) { return <div><strong>{label}</strong><p className={styles.muted}>{value}</p></div> }
function Rows({ data }: { data: Record<string, unknown>[] }) { return data.length ? <div className={styles.tableWrap}><table className={styles.table}><tbody>{data.slice(0, 30).map((record, index) => <tr key={String(record.id || index)}><td><strong>{txt(record, 'public_reference') || txt(record, 'status') || txt(record, 'provider_key') || 'Écriture'}</strong></td><td>{txt(record, 'status') || txt(record, 'amount') || txt(record, 'created_at')}</td></tr>)}</tbody></table></div> : <p className={styles.muted}>Aucune écriture.</p> }
