"use client"

import { useState } from 'react'
import { CheckCircle2, ClipboardPlus, CreditCard, ShoppingBag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import styles from '../../design-system/marketplace.module.css'
import { Button, Card, PageHeader } from '../../design-system/ui'

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

type CustomerOption = { id: string; public_reference: string; display_name: string; email: string | null }

export function ManualOrderCommand({ customers }: { customers: CustomerOption[] }) {
  const router = useRouter()
  const [customerId, setCustomerId] = useState(customers[0]?.id || '')
  const [title, setTitle] = useState('')
  const [journeyType, setJourneyType] = useState('product_order')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('manual_verified')
  const [providerReference, setProviderReference] = useState('')
  const [scheduledStartAt, setScheduledStartAt] = useState('')
  const [scheduledEndAt, setScheduledEndAt] = useState('')
  const [notes, setNotes] = useState('')
  const [createPayment, setCreatePayment] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function createOrder() {
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await request<{ order: Record<string, unknown>; payment: Record<string, unknown> | null }>('/api/angelcare-marketplace/admin/orders', {
        method: 'POST',
        body: JSON.stringify({
          action: 'manual_create',
          customerId,
          title,
          journeyType,
          amount: Number(amount || 0),
          paymentMethod,
          providerReference: providerReference || null,
          scheduledStartAt: scheduledStartAt || null,
          scheduledEndAt: scheduledEndAt || null,
          notes: notes || null,
          createPayment,
        }),
      })
      setSuccess(`Commande ${String(result.order.public_reference || '')} créée${result.payment ? ` · paiement ${String(result.payment.public_reference || '')} créé` : ''}.`)
      setTitle('')
      setAmount('')
      setProviderReference('')
      setNotes('')
      router.refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Création impossible.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="MANUAL COMMERCE ENTRY"
        title="Créer une commande depuis l’administration"
        description="Le centre opérateur peut créer une vraie commande canonique, la rattacher à un client, générer son paiement et l’envoyer immédiatement dans le même Journey Command que les commandes venant du storefront."
      />

      {error ? <div className={styles.noticeDanger} style={{ marginBottom: 14 }}>{error}</div> : null}
      {success ? <div className={styles.noticeSuccess} style={{ marginBottom: 14 }}><CheckCircle2 size={16} /> {success}</div> : null}

      <Card title="Nouvelle commande" subtitle="Cette création ne contourne pas le modèle Commerce : elle crée un Journey canonique et, si demandé, son Payment Intent.">
        <div className={styles.formGrid}>
          <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.fieldLabel}>Client</label>
            <select className={styles.selectField} value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
              {customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.display_name} · {customer.public_reference} · {customer.email || 'Sans email'}</option>)}
            </select>
          </div>
          <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Titre commercial</label><input className={styles.textField} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex. Pack garde enfant samedi" /></div>
          <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Type de Journey</label><select className={styles.selectField} value={journeyType} onChange={(event) => setJourneyType(event.target.value)}><option value="product_order">Produit</option><option value="kit_order">Kit</option><option value="family_booking">Booking famille</option><option value="recurring_service">Service récurrent</option><option value="academy_enrollment">Academy</option><option value="b2b_quotation">Devis B2B</option><option value="hospitality_programme">Hospitality</option><option value="corporate_benefit">Corporate</option><option value="partner_activation">Partner</option><option value="quality_assessment">Quality</option></select></div>
          <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Montant (Dh)</label><input className={styles.textField} type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></div>
          <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Méthode de paiement</label><select className={styles.selectField} value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}><option value="manual_verified">Vérification manuelle</option><option value="bank_transfer">Virement</option><option value="cash_on_delivery">Espèces / livraison</option><option value="pay_at_location">Paiement sur place</option><option value="invoice">Facture</option></select></div>
          <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Début prévu</label><input className={styles.textField} type="datetime-local" value={scheduledStartAt} onChange={(event) => setScheduledStartAt(event.target.value)} /></div>
          <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Fin prévue</label><input className={styles.textField} type="datetime-local" value={scheduledEndAt} onChange={(event) => setScheduledEndAt(event.target.value)} /></div>
          <div className={styles.fieldGroup}><label className={styles.fieldLabel}>Référence paiement externe</label><input className={styles.textField} value={providerReference} onChange={(event) => setProviderReference(event.target.value)} /></div>
          <div className={styles.fieldGroup} style={{ gridColumn: '1 / -1' }}><label className={styles.fieldLabel}>Note opérateur</label><textarea className={styles.textArea} value={notes} onChange={(event) => setNotes(event.target.value)} /></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}><input type="checkbox" checked={createPayment} onChange={(event) => setCreatePayment(event.target.checked)} /> Créer automatiquement le Payment Intent associé</label>
          <div className={styles.pageActions}><Button disabled={busy || !customerId || !title} onClick={() => void createOrder()}><ClipboardPlus size={15} /> Créer la commande</Button></div>
        </div>
      </Card>

      <div className={styles.gridTwo} style={{ marginTop: 16 }}>
        <Card title="Ce que cette action crée" subtitle="Pas une ligne locale isolée : le commerce reste cohérent.">
          <div className={styles.list}>
            <div className={styles.listItem}><ShoppingBag size={16} /><div className={styles.listItemContent}><strong>Journey canonique</strong><p>La commande apparaît dans Enterprise Orders, Journey Command et les vues de fulfillment.</p></div></div>
            <div className={styles.listItem}><CreditCard size={16} /><div className={styles.listItemContent}><strong>Payment Intent</strong><p>Si activé, le paiement est créé dans Payment Command et peut ensuite être vérifié, capturé ou remboursé.</p></div></div>
          </div>
        </Card>
        <Card title="Après création" subtitle="Le dossier reste pilotable dans les centres existants.">
          <p style={{ color: '#65748a', fontSize: 12, lineHeight: 1.6 }}>La commande ne saute aucune étape : le statut commercial, le paiement, le fulfillment et les événements restent attachés au même objet canonique.</p>
        </Card>
      </div>
    </div>
  )
}
