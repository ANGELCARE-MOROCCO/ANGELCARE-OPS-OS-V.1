'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Building2, CreditCard, ShieldCheck, WalletCards } from 'lucide-react'
import type { CatalogLocale } from '../../catalog-discovery/types'
import type { PaymentMethodKind, PaymentMethodOption, WalletComparison } from '../types'
import styles from '../customer-commerce.module.css'

type Envelope<T> = { data: T }
type PaymentSelection = { paymentIntentId: string; status: string; method: PaymentMethodKind; walletContribution: number }

async function api<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const payload = await response.json() as Envelope<T> | { error?: { message?: string } }
  if (!response.ok || !('data' in payload)) throw new Error('error' in payload ? payload.error?.message || 'Paiement impossible.' : 'Paiement impossible.')
  return payload.data
}

const icon = (kind: PaymentMethodKind) => kind === 'ac_wallet' ? WalletCards : kind === 'bank_transfer' ? Building2 : CreditCard

export function CheckoutPaymentStage({
  locale,
  amount,
  conversionSessionId,
  onBack,
  onComplete,
  onExternalAction,
}: {
  locale: CatalogLocale
  amount: number
  conversionSessionId: string
  onBack: () => void
  onComplete: (result: PaymentSelection) => void
  onExternalAction: (result: PaymentSelection & { customerActionUrl: string }) => Promise<void>
}) {
  const [methods, setMethods] = useState<PaymentMethodOption[]>([])
  const [comparison, setComparison] = useState<WalletComparison | null>(null)
  const [selected, setSelected] = useState<PaymentMethodKind>('card')
  const [walletContribution, setWalletContribution] = useState(0)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancel = false
    Promise.all([
      api<{ methods: PaymentMethodOption[] }>('/api/angelcare-marketplace/checkout/payment-methods', { amount }),
      api<WalletComparison>('/api/angelcare-marketplace/wallet/comparison', { normalPrice: amount }),
    ]).then(([methodResult, current]) => {
      if (cancel) return
      setMethods(methodResult.methods)
      setComparison(current)
      setWalletContribution(Math.min(amount, Math.max(0, current.walletContribution)))
      const walletMethod = methodResult.methods.find((item) => item.kind === 'ac_wallet' && item.eligible)
      const externalMethod = methodResult.methods.find((item) => item.kind !== 'ac_wallet' && item.eligible)
      setSelected(current.externalContribution <= 0 && walletMethod ? 'ac_wallet' : externalMethod?.kind || walletMethod?.kind || 'card')
    }).catch((reason) => {
      if (!cancel) setError(reason instanceof Error ? reason.message : 'Impossible')
    }).finally(() => {
      if (!cancel) setBusy(false)
    })
    return () => { cancel = true }
  }, [amount])

  const option = useMemo(() => methods.find((method) => method.kind === selected) || null, [methods, selected])

  async function confirm() {
    if (!option) return
    setBusy(true)
    setError(null)
    try {
      const appliedWallet = selected === 'ac_wallet' ? amount : option.supportsSplit ? Math.min(walletContribution, amount) : 0
      const result = await api<{ intent: { id: string; status: string }; customerActionUrl: string | null; message: string }>(
        '/api/angelcare-marketplace/payments/intents',
        {
          amount,
          method: selected,
          locale,
          idempotencyKey: crypto.randomUUID(),
          conversionSessionId,
          walletContribution: appliedWallet,
          metadata: { source: 'adaptive_checkout' },
        },
      )
      const selection: PaymentSelection = {
        paymentIntentId: result.intent.id,
        status: result.intent.status,
        method: selected,
        walletContribution: appliedWallet,
      }
      if (result.customerActionUrl) {
        await onExternalAction({ ...selection, customerActionUrl: result.customerActionUrl })
        return
      }
      onComplete(selection)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Paiement impossible.')
    } finally {
      setBusy(false)
    }
  }

  return <section className={styles.panel}><header><div><span className={styles.eyebrow}>03 · PAYMENT ORCHESTRATION</span><h2>{locale === 'fr' ? 'Choisissez comment régler' : locale === 'ar' ? 'اختر طريقة الدفع' : 'Choose how to pay'}</h2><p>{locale === 'fr' ? 'Le serveur détermine les méthodes éligibles et réserve les crédits Wallet avant toute contribution externe.' : locale === 'ar' ? 'يحدد الخادم طرق الدفع المؤهلة ويحجز أرصدة المحفظة قبل أي مساهمة خارجية.' : 'The server determines eligible methods and reserves Wallet credits before external contribution.'}</p></div></header>{error ? <div className={styles.error}>{error}</div> : null}<div className={styles.topupLayout}><div className={styles.paymentMethods}>{methods.map((method) => { const Icon = icon(method.kind); return <button className={styles.paymentMethod} data-active={selected === method.kind} data-eligible={method.eligible} disabled={!method.eligible} key={method.kind} onClick={() => setSelected(method.kind)}><Icon/><div><b>{method.label}</b><small>{method.description}</small></div>{method.reason ? <em>{method.reason}</em> : null}</button> })}</div><aside className={styles.comparison}>{comparison ? <><span className={styles.eyebrow}>LIVE METHOD COMPARISON</span><div className={styles.comparisonGrid}><span>{locale === 'fr' ? 'Paiement standard' : locale === 'ar' ? 'الدفع العادي' : 'Standard payment'}</span><strong>{comparison.normalPrice.toLocaleString(locale)} Dh</strong></div><div className={styles.comparisonGrid}><span>{locale === 'fr' ? 'Avec AC Wallet' : locale === 'ar' ? 'باستخدام محفظة AC' : 'With AC Wallet'}</span><strong data-wallet>{comparison.walletPrice.toLocaleString(locale)} AC</strong></div><div className={styles.comparisonGrid}><span>{locale === 'fr' ? 'Économie immédiate' : locale === 'ar' ? 'التوفير الفوري' : 'Immediate saving'}</span><strong>{comparison.immediateSaving.toLocaleString(locale)} Dh</strong></div><div className={styles.comparisonGrid}><span>{locale === 'fr' ? 'Contribution Wallet disponible' : locale === 'ar' ? 'مساهمة المحفظة المتاحة' : 'Available Wallet contribution'}</span><strong>{comparison.walletContribution.toLocaleString(locale)} AC</strong></div><div className={styles.comparisonGrid}><span>{locale === 'fr' ? 'Contribution externe' : locale === 'ar' ? 'المساهمة الخارجية' : 'External contribution'}</span><strong>{comparison.externalContribution.toLocaleString(locale)} Dh</strong></div>{comparison.priorityLabel ? <div className={styles.savingCallout}><ShieldCheck/>{comparison.priorityLabel}</div> : null}</> : <p>{busy ? '…' : ''}</p>}</aside></div><div className={styles.authActions}><button className={styles.secondaryButton} onClick={onBack}>{locale === 'fr' ? 'Retour' : locale === 'ar' ? 'رجوع' : 'Back'}</button><button className={styles.primaryButton} disabled={busy || !option?.eligible} onClick={() => void confirm()}>{busy ? '…' : locale === 'fr' ? 'Valider le moyen de paiement' : locale === 'ar' ? 'تأكيد طريقة الدفع' : 'Confirm payment method'}<ArrowRight size={16}/></button></div></section>
}
