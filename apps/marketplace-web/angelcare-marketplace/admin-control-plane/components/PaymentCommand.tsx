"use client"

import { useMemo, useState } from 'react'
import { BadgeDollarSign, CheckCircle2, CircleAlert, CreditCard, FilePlus2, RefreshCcw, Search, XCircle } from 'lucide-react'
import type { AdminPaymentDossier, AdminPaymentSummary } from '../types'
import styles from '../../design-system/marketplace.module.css'
import { Button, Card, MetricCard, PageHeader, StatePanel, StatusChip } from '../../design-system/ui'
import { useGovernedAction } from '../../shells/GovernedActionProvider'

type Envelope<T> = { data: T }

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
  })
  const payload = await response.json() as Envelope<T> | { error?: { message?: string } }
  if (!response.ok || !('data' in payload)) throw new Error('error' in payload ? payload.error?.message || 'Action impossible.' : 'Action impossible.')
  return payload.data
}

const money = (value: number) => `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh`

export function PaymentCommand({ initial, canCreate, canManage, canRefund }: { initial: AdminPaymentSummary; canCreate: boolean; canManage: boolean; canRefund: boolean }) {
  const requestAction = useGovernedAction()
  const [summary, setSummary] = useState(initial)
  const [selected, setSelected] = useState<AdminPaymentDossier | null>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const [customerId, setCustomerId] = useState('')
  const [orderId, setOrderId] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('manual_verified')
  const [providerReference, setProviderReference] = useState('')
  const [note, setNote] = useState('')

  const [captureAmount, setCaptureAmount] = useState('')
  const [captureReference, setCaptureReference] = useState('')
  const [actionReason, setActionReason] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')

  const filtered = useMemo(() => summary.payments.filter((payment) => {
    const haystack = `${payment.public_reference} ${payment.customer_name} ${payment.customer_reference || ''} ${payment.order_reference || ''} ${payment.order_title || ''}`.toLowerCase()
    return (!query || haystack.includes(query.toLowerCase())) && (status === 'all' || payment.status === status)
  }), [summary.payments, query, status])

  async function refresh() {
    const next = await request<AdminPaymentSummary>('/api/angelcare-marketplace/admin/payments')
    setSummary(next)
  }

  async function openPayment(id: string) {
    setBusy(true)
    setError(null)
    try {
      setSelected(await request<AdminPaymentDossier>(`/api/angelcare-marketplace/admin/payments/${id}`))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible de charger le paiement.')
    } finally {
      setBusy(false)
    }
  }

  async function createManualPayment() {
    setBusy(true)
    setError(null)
    try {
      const result = await request<AdminPaymentDossier>('/api/angelcare-marketplace/admin/payments', {
        method: 'POST',
        body: JSON.stringify({
          action: 'manual_create',
          customerId,
          orderId: orderId || null,
          amount: Number(amount),
          method,
          providerReference: providerReference || null,
          note: note || null,
        }),
      })
      setSelected(result)
      setNotice('Paiement manuel créé dans le registre.')
      setCreateOpen(false)
      setCustomerId('')
      setOrderId('')
      setAmount('')
      setProviderReference('')
      setNote('')
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Création du paiement impossible.')
    } finally {
      setBusy(false)
    }
  }

  async function mutatePayment(action: 'capture' | 'failed' | 'cancelled') {
    if (!selected) return
    const governedReason = await requestAction({ title: action === 'capture' ? 'Capturer le paiement' : action === 'failed' ? 'Déclarer un échec' : 'Annuler le paiement', objectLabel: selected.payment.public_reference, currentState: selected.payment.status, nextState: action, consequence: action === 'capture' ? 'La capture devient une écriture financière persistante.' : 'Le parcours de paiement actif est interrompu.', permission: 'marketplace.finance.exceptions.approve', danger: action !== 'capture' })
    if (!governedReason) return
    setBusy(true)
    setError(null)
    try {
      const result = await request<AdminPaymentDossier>(`/api/angelcare-marketplace/admin/payments/${selected.payment.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          action,
          amount: action === 'capture' && captureAmount ? Number(captureAmount) : undefined,
          providerReference: captureReference || null,
          reason: `${actionReason || `Action opérateur : ${action}`} · ${governedReason}`,
        }),
      })
      setSelected(result)
      setNotice(action === 'capture' ? 'Capture enregistrée.' : action === 'failed' ? 'Paiement déclaré en échec.' : 'Paiement annulé.')
      setCaptureAmount('')
      setCaptureReference('')
      setActionReason('')
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Action paiement impossible.')
    } finally {
      setBusy(false)
    }
  }

  async function refundPayment() {
    if (!selected) return
    const governedReason = await requestAction({ title: 'Autoriser le remboursement', objectLabel: selected.payment.public_reference, currentState: selected.payment.status, nextState: 'partially_refunded / refunded', consequence: 'Le moteur répartit le remboursement entre Wallet et contribution externe et conserve l’idempotence.', permission: 'marketplace.finance.exceptions.approve', danger: true, reversibility: 'Aucune annulation de remboursement n’est exposée.' })
    if (!governedReason) return
    setBusy(true)
    setError(null)
    try {
      await request<Record<string, unknown>>(`/api/angelcare-marketplace/admin/payments/${selected.payment.id}/refund`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(refundAmount),
          reason: `${refundReason} · ${governedReason}`,
          idempotencyKey: `admin-refund:${selected.payment.id}:${refundAmount}:${Date.now()}`,
        }),
      })
      setRefundAmount('')
      setRefundReason('')
      setNotice('Remboursement enregistré.')
      await refresh()
      await openPayment(selected.payment.id)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Remboursement impossible.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="PAYMENT COMMAND"
        title="Paiements, vérification et remboursements"
        description="Registre financier opérateur réel : créer un paiement manuel, le vérifier, capturer partiellement ou totalement, suivre les tentatives et déclencher un remboursement depuis le même dossier."
        actions={<Button disabled={!canCreate} onClick={() => setCreateOpen((value) => !value)}><FilePlus2 size={16} /> Enregistrer un paiement</Button>}
      />

      {error ? <div className={styles.noticeDanger} style={{ marginBottom: 14 }}>{error}</div> : null}
      {notice ? <div className={styles.noticeSuccess} style={{ marginBottom: 14 }}><CheckCircle2 size={16} /> {notice}</div> : null}

      <div className={styles.metricGrid}>
        <MetricCard label="Paiements" value={summary.total} hint="Intentions et opérations persistantes" icon={<CreditCard size={16} />} />
        <MetricCard label="À traiter" value={summary.pending} hint="Non capturés ou en cours" icon={<CircleAlert size={16} />} />
        <MetricCard label="Capturé" value={money(summary.capturedVolume)} hint={`${summary.captured} dossiers capturés`} icon={<BadgeDollarSign size={16} />} />
        <MetricCard label="Remboursé" value={money(summary.refundedVolume)} hint={`${summary.refunded} dossiers totalement remboursés`} icon={<RefreshCcw size={16} />} />
      </div>

      {createOpen ? (
        <Card title="Enregistrer un paiement manuel" subtitle="Pour espèces, virement, paiement sur place ou toute preuve vérifiée hors prestataire automatique.">
          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}><label className={styles.fieldLabel}>ID client</label><input className={styles.textField} value={customerId} onChange={(event) => setCustomerId(event.target.value)} placeholder="UUID du dossier client" /></div>
            <div className={styles.fieldGroup}><label className={styles.fieldLabel}>ID commande (optionnel)</label><input className={styles.textField} value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="UUID du Journey" /></div>
            <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Montant (Dh)</label><input className={styles.textField} type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></div>
            <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Méthode</label><select className={styles.selectField} value={method} onChange={(event) => setMethod(event.target.value)}><option value="manual_verified">Vérifié manuellement</option><option value="bank_transfer">Virement</option><option value="cash_on_delivery">Espèces / livraison</option><option value="pay_at_location">Paiement sur place</option><option value="invoice">Facture</option></select></div>
            <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Référence externe</label><input className={styles.textField} value={providerReference} onChange={(event) => setProviderReference(event.target.value)} /></div>
            <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Note / preuve</label><input className={styles.textField} value={note} onChange={(event) => setNote(event.target.value)} /></div>
            <div className={styles.pageActions}><Button disabled={busy || !customerId || !amount} onClick={() => void createManualPayment()}><FilePlus2 size={15} /> Créer le paiement</Button></div>
          </div>
        </Card>
      ) : null}

      <div className={styles.gridTwo} style={{ marginTop: 16 }}>
        <Card title="Registre des paiements" subtitle={`${filtered.length} paiement(s) affiché(s).`}>
          <div className={styles.toolbar}>
            <div style={{ flex: '1 1 260px', position: 'relative' }}><Search size={15} style={{ position: 'absolute', left: 11, top: 12, color: '#65748a' }} /><input className={styles.searchField} style={{ paddingLeft: 34 }} placeholder="Référence, client, commande…" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
            <select className={styles.selectField} value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tous les statuts</option><option value="pending">En attente</option><option value="authorized">Autorisé</option><option value="captured">Capturé</option><option value="partially_captured">Partiel</option><option value="failed">Échec</option><option value="cancelled">Annulé</option><option value="refunded">Remboursé</option><option value="partially_refunded">Remboursé partiellement</option><option value="disputed">Litige</option><option value="reconciliation_pending">Réconciliation</option></select>
          </div>
          {filtered.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}><thead><tr><th>Paiement</th><th>Client</th><th>Commande</th><th>Montant</th><th>Statut</th><th>Mis à jour</th></tr></thead><tbody>
                {filtered.map((payment) => <tr key={payment.id} onClick={() => void openPayment(payment.id)} style={{ cursor: 'pointer' }}><td><div className={styles.tablePrimary}>{payment.public_reference}</div><div className={styles.tableSecondary}>{payment.selected_method || 'Méthode non définie'}</div></td><td><div className={styles.tablePrimary}>{payment.customer_name}</div><div className={styles.tableSecondary}>{payment.customer_reference || '—'}</div></td><td>{payment.order_reference || '—'}<div className={styles.tableSecondary}>{payment.order_title || 'Paiement autonome'}</div></td><td>{money(payment.expected_amount)}<div className={styles.tableSecondary}>capturé {money(payment.captured_amount)}</div></td><td><StatusChip status={payment.status} /></td><td>{new Date(payment.updated_at).toLocaleString('fr-FR')}</td></tr>)}
              </tbody></table>
            </div>
          ) : <StatePanel type="empty" title="Aucun paiement" text="Le registre est vide pour le filtre courant." />}
        </Card>

        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          {selected ? (
            <Card title={selected.payment.public_reference} subtitle={`${selected.payment.customer_name} · ${selected.payment.order_title || 'Paiement autonome'}`}>
              <div className={styles.pageActions} style={{ marginBottom: 12 }}><a className={styles.secondaryButton} href={`/angelcare-marketplace/admin/payments/${selected.payment.id}/command`}>Ouvrir Finance Mega Dossier</a></div>
              <div className={styles.detailMeta}>
                <div><span className={styles.metricLabel}>Attendu</span><strong>{money(selected.payment.expected_amount)}</strong></div>
                <div><span className={styles.metricLabel}>Capturé</span><strong>{money(selected.payment.captured_amount)}</strong></div>
                <div><span className={styles.metricLabel}>Remboursé</span><strong>{money(selected.payment.refunded_amount)}</strong></div>
              </div>
              <div className={styles.notice} style={{ marginTop: 14 }}><ShieldIcon /><span>Les captures et remboursements sont journalisés comme événements financiers ; pas d’édition directe du montant capturé.</span></div>
              <div className={styles.formGrid} style={{ marginTop: 14 }}>
                <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Montant à capturer</label><input className={styles.textField} type="number" min="0.01" step="0.01" value={captureAmount} onChange={(event) => setCaptureAmount(event.target.value)} placeholder="Vide = tout le restant" /></div>
                <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Référence vérifiée</label><input className={styles.textField} value={captureReference} onChange={(event) => setCaptureReference(event.target.value)} /></div>
                <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}><label className={styles.fieldLabel}>Motif / preuve</label><textarea className={styles.textArea} value={actionReason} onChange={(event) => setActionReason(event.target.value)} /></div>
              </div>
              <div className={styles.pageActions} style={{ justifyContent: 'flex-start', marginTop: 12 }}>
                <Button disabled={!canManage || busy || ['captured', 'refunded', 'partially_refunded'].includes(selected.payment.status)} onClick={() => void mutatePayment('capture')}><CheckCircle2 size={15} /> Capturer</Button>
                <Button variant="secondary" disabled={!canManage || busy || ['captured', 'refunded', 'partially_refunded', 'failed', 'cancelled'].includes(selected.payment.status)} onClick={() => void mutatePayment('failed')}><XCircle size={15} /> Déclarer échec</Button>
                <Button variant="danger" disabled={!canManage || busy || ['captured', 'refunded', 'partially_refunded', 'failed', 'cancelled'].includes(selected.payment.status)} onClick={() => void mutatePayment('cancelled')}>Annuler</Button>
              </div>
              <div className={styles.noticeWarning} style={{ marginTop: 14 }}>
                <RefreshCcw size={16} />
                <span>Le remboursement utilise le moteur financier existant. Il restaure la part Wallet et transmet la part externe au prestataire lorsqu’il est configuré.</span>
              </div>
              <div className={styles.formGrid} style={{ marginTop: 12 }}>
                <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Montant à rembourser</label><input className={styles.textField} type="number" min="0.01" step="0.01" value={refundAmount} onChange={(event) => setRefundAmount(event.target.value)} placeholder="Montant total" /></div>
                <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Motif du remboursement</label><input className={styles.textField} value={refundReason} onChange={(event) => setRefundReason(event.target.value)} /></div>
                <div className={styles.pageActions}><Button variant="danger" disabled={!canRefund || busy || !refundAmount || !refundReason || !['captured','partially_refunded'].includes(selected.payment.status)} onClick={() => void refundPayment()}><RefreshCcw size={15} /> Rembourser</Button></div>
              </div>
              <div className={styles.list} style={{ marginTop: 16 }}>
                <div className={styles.listItem}><CreditCard size={16} /><div className={styles.listItemContent}><strong>Tentatives</strong><p>{selected.attempts.length} tentative(s) enregistrée(s).</p></div></div>
                {selected.attempts.map((attempt) => <div className={styles.listItem} key={String(attempt.id)}><CreditCard size={15} /><div className={styles.listItemContent}><strong>{String(attempt.method_kind || '—')} · {money(Number(attempt.amount || 0))}</strong><p>{String(attempt.status || '—')} · {String(attempt.provider_reference || 'Sans référence')}</p></div></div>)}
                {selected.refunds.map((refund) => <div className={styles.listItem} key={String(refund.id)}><RefreshCcw size={15} /><div className={styles.listItemContent}><strong>{String(refund.public_reference || 'Remboursement')} · {money(Number(refund.requested_amount || 0))}</strong><p>{String(refund.status || '—')} · {String(refund.reason || '—')}</p></div></div>)}
              </div>
            </Card>
          ) : <StatePanel type="empty" title="Sélectionnez un paiement" text="Le dossier de droite expose les tentatives, captures et remboursements du paiement sélectionné." />}
        </div>
      </div>
    </div>
  )
}

function ShieldIcon() {
  return <BadgeDollarSign size={16} />
}
