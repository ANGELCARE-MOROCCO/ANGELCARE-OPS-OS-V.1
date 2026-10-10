'use client'
import {useLiveJourneySignals} from '../../live-experience-command/journey-events'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Building2, CreditCard, ShieldCheck, WalletCards } from 'lucide-react'
import type { CatalogLocale } from '../../catalog-discovery/types'
import type { PaymentMethodKind, PaymentMethodOption, WalletComparison } from '../types'
import styles from '../customer-commerce.module.css'
import premium from '../../customer-experience/commerce.module.css'
import {commerceVisitor} from '../../customer-experience/client'
import {commerceCopy} from '../../customer-experience/copy'

type Envelope<T> = { data: T }
type PaymentSelection = { paymentIntentId: string | null; status: string; method: PaymentMethodKind; walletContribution: number }

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
  onComplete: (result: PaymentSelection) => Promise<void>
  onExternalAction: (result: PaymentSelection & { customerActionUrl: string }) => Promise<void>
}) {
  const t=commerceCopy[locale]
  const requestKey=useRef('')
  const lock=useRef(false)
  const [paymentMessage,setPaymentMessage]=useState('')
  const [retry,setRetry]=useState(0)
  const [methods, setMethods] = useState<PaymentMethodOption[]>([])
  const [comparison, setComparison] = useState<WalletComparison | null>(null)
  const [selected, setSelected] = useState<PaymentMethodKind>('card')
  const [walletContribution, setWalletContribution] = useState(0)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useLiveJourneySignals({stage:'payment',error:Boolean(error),walletRequired:comparison?.requiredTopUp||0,walletEligible:Boolean(comparison?.eligible)})
  useEffect(() => {
    let cancel = false
    setBusy(true);setError(null)
    Promise.all([
      api<{ methods: PaymentMethodOption[] }>('/api/angelcare-marketplace/checkout/payment-methods', { amount, conversionSessionId, visitorReference:commerceVisitor() }),
      api<WalletComparison>('/api/angelcare-marketplace/wallet/comparison', { normalPrice: amount }).catch(()=>null),
    ]).then(([methodResult, current]) => {
      if (cancel) return
      setMethods(methodResult.methods)
      setComparison(current)
      setWalletContribution(Math.min(amount, Math.max(0, current?.walletContribution||0)))
      const walletMethod = methodResult.methods.find((item) => item.kind === 'ac_wallet' && item.eligible)
      const externalMethod = methodResult.methods.find((item) => item.kind !== 'ac_wallet' && item.eligible)
      setSelected(current && current.externalContribution <= 0 && walletMethod ? 'ac_wallet' : externalMethod?.kind || walletMethod?.kind || 'card')
    }).catch((reason) => {
      if (!cancel) setError(reason instanceof Error ? reason.message : 'Impossible')
    }).finally(() => {
      if (!cancel) setBusy(false)
    })
    return () => { cancel = true }
  }, [amount,retry])

  const option = useMemo(() => methods.find((method) => method.kind === selected) || null, [methods, selected])

  async function confirm() {
    if (!option?.eligible || lock.current) return
    lock.current=true
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
          idempotencyKey: requestKey.current || (requestKey.current=crypto.randomUUID()),
          conversionSessionId, visitorReference:commerceVisitor(),
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
      setPaymentMessage(result.message)
      await onComplete(selection)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Paiement impossible.')
    } finally {
      lock.current=false
      setBusy(false)
    }
  }

  async function receiveManually(){
    if(lock.current)return;lock.current=true;setBusy(true);setError(null)
    try{await onComplete({paymentIntentId:null,status:'pending',method:selected,walletContribution:0})}
    catch(reason){setError(reason instanceof Error?reason.message:t.retry)}
    finally{lock.current=false;setBusy(false)}
  }
  return <section className={`${styles.panel} ${premium.panel}`} aria-busy={busy} data-ac-payment="true"><header><div><span className={styles.eyebrow}>04 · ANGELCARE PAYMENT</span><h2>{locale === 'fr' ? 'Choisissez comment régler' : locale === 'ar' ? 'اختر طريقة الدفع' : 'Choose how to pay'}</h2><p>{locale === 'fr' ? 'Choisissez parmi les moyens disponibles pour cette demande. Retrouvez clairement la part Wallet et la part à régler.' : locale === 'ar' ? 'اختر من طرق الدفع المتاحة لهذا الطلب. راجع مساهمة المحفظة والمبلغ المتبقي للدفع.' : 'Choose from the methods available for this request. See your Wallet contribution and the amount left to pay.'}</p></div></header>{error ? <div className={premium.error} role="alert">{error}<button className={premium.secondary} disabled={busy} onClick={()=>setRetry(n=>n+1)}>{t.retry}</button></div> : null}<div className={premium.help}><ShieldCheck/><div><strong>{locale==='fr'?'Votre demande avance, même si le paiement attend.':locale==='ar'?'سجّل طلبك حتى لو كان الدفع ينتظر.':'Your request can proceed while payment is pending.'}</strong><p>{locale==='fr'?'Espèces à la livraison, carte à organiser ou crédit à compléter : transmettez votre choix à AngelCare. Aucun paiement n’est annoncé comme reçu sans preuve.':locale==='ar'?'الدفع عند التسليم أو البطاقة أو استكمال الرصيد: أرسل اختيارك إلى أنجلكير. لا نؤكد استلام الدفع دون إثبات.':'Cash on delivery, card follow-up or credit funding: send your preference to AngelCare. Funds are never shown as received without evidence.'}</p><button className={premium.primary} disabled={lock.current} onClick={()=>void receiveManually()}>{locale==='fr'?'Continuer · traitement AngelCare':locale==='ar'?'متابعة · معالجة أنجلكير':'Continue · AngelCare handling'}<ArrowRight size={16}/></button></div></div><div className={styles.topupLayout}><div className={styles.paymentMethods}>{methods.map((method) => { const Icon = icon(method.kind); return <button className={styles.paymentMethod} data-active={selected === method.kind} data-eligible={method.eligible} disabled={busy} aria-pressed={selected===method.kind} key={method.kind} onClick={() => {setSelected(method.kind);requestKey.current=''}}><Icon/><div><b>{method.label}</b><small>{method.description}</small></div>{method.reason ? <em>{method.reason}</em> : null}</button> })}</div><aside className={styles.comparison}>{comparison ? <><span className={styles.eyebrow}>AC WALLET</span><div className={styles.comparisonGrid}><span>{locale === 'fr' ? 'Paiement standard' : locale === 'ar' ? 'الدفع العادي' : 'Standard payment'}</span><strong>{comparison.normalPrice.toLocaleString(locale)} Dh</strong></div><div className={styles.comparisonGrid}><span>{locale === 'fr' ? 'Avec AC Wallet' : locale === 'ar' ? 'باستخدام محفظة AC' : 'With AC Wallet'}</span><strong data-wallet>{comparison.walletPrice.toLocaleString(locale)} AC</strong></div><div className={styles.comparisonGrid}><span>{locale === 'fr' ? 'Économie immédiate' : locale === 'ar' ? 'التوفير الفوري' : 'Immediate saving'}</span><strong>{comparison.immediateSaving.toLocaleString(locale)} Dh</strong></div><div className={styles.comparisonGrid}><span>{locale === 'fr' ? 'Contribution Wallet disponible' : locale === 'ar' ? 'مساهمة المحفظة المتاحة' : 'Available Wallet contribution'}</span><strong>{comparison.walletContribution.toLocaleString(locale)} AC</strong></div><div className={styles.comparisonGrid}><span>{locale === 'fr' ? 'Contribution externe' : locale === 'ar' ? 'المساهمة الخارجية' : 'External contribution'}</span><strong>{comparison.externalContribution.toLocaleString(locale)} Dh</strong></div>{comparison.priorityLabel ? <div className={styles.savingCallout}><ShieldCheck/>{comparison.priorityLabel}</div> : null}</> : <p>{busy ? '…' : ''}</p>}</aside></div>{option?.supportsSplit&&comparison&&comparison.walletContribution>0?<label className={premium.field}><span>{t.wallet}</span><input type="range" min={0} max={Math.min(amount,comparison.walletContribution)} step={1} value={walletContribution} disabled={busy} onChange={e=>{setWalletContribution(Number(e.target.value));requestKey.current=''}}/><span>{walletContribution.toLocaleString(locale)} AC · {Math.max(0,amount-walletContribution).toLocaleString(locale)} Dh</span></label>:null}{paymentMessage?<p role="status">{paymentMessage}</p>:null}<div className={styles.authActions}><button className={styles.secondaryButton} disabled={busy} onClick={onBack}>{locale === 'fr' ? 'Retour' : locale === 'ar' ? 'رجوع' : 'Back'}</button><button className={styles.primaryButton} disabled={busy || !option?.eligible} onClick={() => void confirm()}>{busy ? '…' : locale === 'fr' ? 'Valider le moyen de paiement' : locale === 'ar' ? 'تأكيد طريقة الدفع' : 'Confirm payment method'}<ArrowRight size={16}/></button></div></section>
}
