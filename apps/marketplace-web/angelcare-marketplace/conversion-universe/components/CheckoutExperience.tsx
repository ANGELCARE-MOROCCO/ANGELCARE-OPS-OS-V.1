'use client'

import { useEffect, useRef, useState } from 'react'
import { BadgeCheck, Check, MapPin, PackageCheck, ShieldCheck } from 'lucide-react'
import type { CatalogLocale } from '../../catalog-discovery/types'
import type { ConversionOutcome, ConversionPriceSnapshot, ConversionSession } from '../types'
import { CheckoutPaymentStage } from '../../customer-commerce/components/CheckoutPaymentStage'
import styles from '../conversion.module.css'

type Envelope<T> = { data: T }
type BasketItem = { id: string; quantity: number; line_total: number | null; catalog_item?: { name_fr?: string; name_en?: string; name_ar?: string; kind?: string } }
type Basket = { id: string; public_reference: string; basket_kind: string; currency_label: string; subtotal: number; items: BasketItem[] }
type PaymentSelection = { paymentIntentId: string; status: string; method: string; walletContribution: number }

function visitorReference() {
  const name = 'ac_marketplace_visitor'
  const current = document.cookie.split('; ').find((entry) => entry.startsWith(`${name}=`))?.split('=')[1]
  if (current) return decodeURIComponent(current)
  const value = crypto.randomUUID()
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`
  return value
}

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers || {}) } })
  const payload = await response.json() as Envelope<T> | { error?: { message?: string } }
  if (!response.ok || !('data' in payload)) throw new Error('error' in payload ? payload.error?.message || 'Opération impossible.' : 'Opération impossible.')
  return payload.data
}

function stringValue(value: unknown): string { return typeof value === 'string' ? value : '' }
function numberValue(value: unknown): number { const n = Number(value); return Number.isFinite(n) ? n : 0 }
function objectValue(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {} }

export function CheckoutExperience({
  locale,
  basketId,
  kind,
  resumeSessionKey = null,
  resumedPaymentIntentId = null,
  paypalState = null,
}: {
  locale: CatalogLocale
  basketId: string
  kind: 'transactional' | 'quotation'
  resumeSessionKey?: string | null
  resumedPaymentIntentId?: string | null
  paypalState?: string | null
}) {
  const visitor = useRef('')
  const key = useRef(crypto.randomUUID())
  const [step, setStep] = useState(1)
  const [basket, setBasket] = useState<Basket | null>(null)
  const [session, setSession] = useState<ConversionSession | null>(null)
  const [price, setPrice] = useState<ConversionPriceSnapshot | null>(null)
  const [payment, setPayment] = useState<PaymentSelection | null>(null)
  const [outcome, setOutcome] = useState<ConversionOutcome | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(true)
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', city: '', address: '', postalCode: '', deliveryNotes: '' })
  const set = (name: keyof typeof form, value: string) => setForm((current) => ({ ...current, [name]: value }))

  useEffect(() => {
    visitor.current = visitorReference()
    let cancelled = false
    async function load() {
      try {
        const current = await json<Basket>(`/api/angelcare-marketplace/conversion/basket?locale=${locale}&kind=${kind}`, { headers: { 'x-marketplace-visitor': visitor.current } })
        if (current.id !== basketId) throw new Error('Le panier demandé n’est plus le panier actif.')

        const active = resumeSessionKey
          ? await json<ConversionSession>(`/api/angelcare-marketplace/conversion/sessions/${encodeURIComponent(resumeSessionKey)}`, { headers: { 'x-marketplace-visitor': visitor.current } })
          : await json<ConversionSession>(`/api/angelcare-marketplace/conversion/basket/${basketId}/checkout`, { method: 'POST', body: JSON.stringify({ visitorReference: visitor.current, locale, idempotencyKey: `checkout:${key.current}` }) })

        if (active.quote_basket_id && active.quote_basket_id !== basketId) throw new Error('La session de reprise ne correspond pas à ce panier.')
        if (cancelled) return

        setBasket(current)
        setSession(active)
        if (active.priceSnapshot) setPrice(active.priceSnapshot)

        if (resumeSessionKey) {
          const identity = objectValue(active.identity_context)
          const configuration = objectValue(active.configuration)
          const delivery = objectValue(configuration.deliveryAddress)
          const storedPayment = objectValue(configuration.payment)
          setForm({
            fullName: stringValue(identity.fullName),
            email: stringValue(identity.email),
            phone: stringValue(identity.phone),
            city: stringValue(identity.city) || stringValue(delivery.city),
            address: stringValue(delivery.address),
            postalCode: stringValue(delivery.postalCode),
            deliveryNotes: stringValue(delivery.notes),
          })
          const paymentIntentId = resumedPaymentIntentId || stringValue(storedPayment.paymentIntentId)
          const restored = paymentIntentId ? {
            paymentIntentId,
            status: paypalState === 'captured' ? 'captured' : stringValue(storedPayment.status),
            method: stringValue(storedPayment.method) || 'card',
            walletContribution: numberValue(storedPayment.walletContribution),
          } : null
          setPayment(restored)
          if (paypalState === 'cancelled') {
            setError('Paiement PayPal annulé. Choisissez un moyen de paiement pour reprendre.')
            setStep(3)
          } else if (paypalState === 'captured' || ['captured', 'authorized'].includes(restored?.status || '')) {
            setStep(4)
          } else {
            setStep(kind === 'quotation' ? 4 : 3)
          }
        }
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Checkout indisponible.')
      } finally {
        if (!cancelled) setBusy(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [basketId, kind, locale, paypalState, resumeSessionKey, resumedPaymentIntentId])

  async function update(payload: Record<string, unknown>) {
    if (!session) throw new Error('Session indisponible.')
    const data = await json<ConversionSession>(`/api/angelcare-marketplace/conversion/sessions/${session.session_key}`, { method: 'PATCH', body: JSON.stringify({ ...payload, visitorReference: visitor.current }) })
    setSession(data)
    return data
  }

  async function identity() {
    setBusy(true); setError(null)
    try {
      await update({ identity: { ...form, fullName: form.fullName }, configuration: { basketId, deliveryAddress: { city: form.city, address: form.address, postalCode: form.postalCode, notes: form.deliveryNotes } }, status: 'availability_pending' })
      const snapshot = await json<ConversionPriceSnapshot>(`/api/angelcare-marketplace/conversion/sessions/${session?.session_key}/price`, { method: 'POST', body: JSON.stringify({ visitorReference: visitor.current, quantity: basket?.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 1 }) })
      setPrice(snapshot)
      await json(`/api/angelcare-marketplace/conversion/sessions/${session?.session_key}/availability`, { method: 'POST', body: JSON.stringify({ visitorReference: visitor.current, quantity: basket?.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 1, configuration: { basketId, city: form.city } }) })
      setStep(2)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Vérification impossible.') } finally { setBusy(false) }
  }

  async function consents() {
    if (!session) return
    setBusy(true)
    try {
      for (const consentKey of ['marketplace_terms', 'privacy_notice', 'order_or_quote_scope']) await json(`/api/angelcare-marketplace/conversion/sessions/${session.session_key}/consent`, { method: 'POST', body: JSON.stringify({ visitorReference: visitor.current, consentKey, consentVersion: '2026.1', locale, accepted: true, evidence: { basketId } }) })
      await update({ status: 'review' })
      setStep(kind === 'quotation' ? 4 : 3)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Consentement impossible.') } finally { setBusy(false) }
  }

  async function paymentComplete(selection: PaymentSelection) {
    setPayment(selection)
    await update({ configuration: { ...(session?.configuration || {}), payment: { ...selection } }, status: 'review' })
    setStep(4)
  }

  async function paymentExternalAction(selection: PaymentSelection & { customerActionUrl: string }) {
    const stored = { paymentIntentId: selection.paymentIntentId, status: selection.status, method: selection.method, walletContribution: selection.walletContribution }
    setPayment(stored)
    await update({ configuration: { ...(session?.configuration || {}), payment: stored }, status: 'review' })
    window.location.assign(selection.customerActionUrl)
  }

  async function confirm() {
    if (!session) return
    setBusy(true)
    try {
      await update({ status: 'ready', configuration: { ...(session.configuration || {}), payment } })
      const result = await json<ConversionOutcome>(`/api/angelcare-marketplace/conversion/sessions/${session.session_key}/confirm`, { method: 'POST', body: JSON.stringify({ visitorReference: visitor.current, idempotencyKey: `confirm:${session.id}`, paymentIntentId: payment?.paymentIntentId || null }) })
      setOutcome(result)
      setStep(5)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Confirmation impossible.') } finally { setBusy(false) }
  }

  const labels = locale === 'fr' ? ['Identité & livraison', 'Consentements', 'Paiement', 'Révision', 'Confirmation'] : locale === 'ar' ? ['الهوية والتسليم', 'الموافقات', 'الدفع', 'المراجعة', 'التأكيد'] : ['Identity & delivery', 'Consents', 'Payment', 'Review', 'Confirmation']
  const capturedExternal = payment?.status === 'captured'

  return <main className={styles.checkoutRoot} dir={locale === 'ar' ? 'rtl' : 'ltr'} data-kind={kind}><header><div><span>ANGELCARE CHECKOUT & PAYMENT AUTHORITY</span><h1>{kind === 'quotation' ? 'Vérification de la demande de proposition' : 'Vérification de la commande'}</h1><p>Prix, disponibilité, consentements et moyen de paiement sont revérifiés côté serveur. Un retour navigateur ne vaut jamais preuve de paiement.</p></div><div><ShieldCheck size={35}/><b>{basket?.public_reference || '—'}</b><small>Session gouvernée</small></div></header>{error ? <div className={styles.errorBanner}>{error}</div> : null}<nav className={styles.checkoutSteps}>{labels.map((label, index) => <div key={label} data-active={step === index + 1} data-complete={step > index + 1}><span>{step > index + 1 ? <Check size={14}/> : index + 1}</span><b>{label}</b></div>)}</nav><section className={styles.checkoutLayout} aria-busy={busy}><div className={styles.checkoutMain}>{step === 1 ? <section className={styles.stagePanel}><div className={styles.stageHeading}><span>01 · IDENTITY & DELIVERY</span><h2>Responsable et destination</h2></div><div className={styles.identityGrid}><label><span>Nom complet</span><input value={form.fullName} onChange={(event) => set('fullName', event.target.value)}/></label><label><span>Email</span><input type="email" value={form.email} onChange={(event) => set('email', event.target.value)}/></label><label><span>Téléphone</span><input value={form.phone} onChange={(event) => set('phone', event.target.value)}/></label><label><span><MapPin size={16}/>Ville</span><input value={form.city} onChange={(event) => set('city', event.target.value)}/></label><label><span>Adresse</span><input value={form.address} onChange={(event) => set('address', event.target.value)}/></label><label><span>Code postal</span><input value={form.postalCode} onChange={(event) => set('postalCode', event.target.value)}/></label></div><label className={styles.fullField}><span>Instructions</span><textarea rows={3} value={form.deliveryNotes} onChange={(event) => set('deliveryNotes', event.target.value)}/></label><div className={styles.stageActions}><button disabled={!form.fullName || !form.email || !form.city} onClick={() => void identity()}>Revérifier et continuer</button></div></section> : null}{step === 2 ? <section className={styles.stagePanel}><div className={styles.stageHeading}><span>02 · EXPLICIT CONSENT</span><h2>Conditions de commande ou proposition</h2></div><div className={styles.consentCards}><article><BadgeCheck/><div><b>Conditions Marketplace</b><p>Objet, prix, disponibilité et responsabilité de la demande.</p></div></article><article><ShieldCheck/><div><b>Vie privée</b><p>Données strictement nécessaires au parcours, à la sécurité et à l’exécution.</p></div></article><article><PackageCheck/><div><b>Nature de l’issue</b><p>{kind === 'quotation' ? 'Une demande de devis ne constitue pas une vente confirmée.' : 'Une commande n’est confirmée qu’après résultat canonique et paiement éligible.'}</p></div></article></div><div className={styles.stageActions}><button className={styles.secondaryButton} onClick={() => setStep(1)}>Retour</button><button onClick={() => void consents()}>Accepter explicitement</button></div></section> : null}{step === 3 && kind === 'transactional' && session && price ? <CheckoutPaymentStage locale={locale} amount={Number(price.grand_total ?? basket?.subtotal ?? 0)} conversionSessionId={session.id} onBack={() => setStep(2)} onComplete={(value) => void paymentComplete(value)} onExternalAction={(value) => paymentExternalAction(value)}/> : null}{step === 4 ? <section className={styles.stagePanel}><div className={styles.stageHeading}><span>04 · FINAL REVIEW</span><h2>Révision avant engagement</h2></div><div className={styles.reviewGrid}><article><span>Client</span><b>{form.fullName}</b><small>{form.email} · {form.phone}</small></article><article><span>Total revérifié</span><b>{Number(price?.grand_total || basket?.subtotal || 0).toLocaleString(locale)} {basket?.currency_label || 'Dh'}</b><small>{payment ? `${payment.walletContribution.toLocaleString(locale)} AC Wallet · ${payment.method}${capturedExternal ? ' · PayPal confirmé' : ''}` : kind === 'quotation' ? 'Devis requis' : 'Méthode en attente'}</small></article><article><span>Destination</span><b>{form.city}</b><small>{form.address}</small></article></div><div className={styles.stageActions}><button className={styles.secondaryButton} disabled={capturedExternal} onClick={() => setStep(kind === 'quotation' ? 2 : 3)}>Retour</button><button onClick={() => void confirm()}>{kind === 'quotation' ? 'Transmettre la demande' : 'Confirmer l’engagement'}</button></div></section> : null}{step === 5 ? <section className={styles.confirmationPanel}><PackageCheck size={48}/><span>05 · CANONICAL OUTCOME</span><h2>{outcome?.public_reference || 'Résultat enregistré'}</h2><p>Votre demande a été enregistrée dans le parcours ANGELCARE.</p><a href={`/angelcare-marketplace/${locale}/account`}>Ouvrir Mon ANGELCARE</a></section> : null}</div><aside className={styles.checkoutAside}><section><span>Panier</span><b>{basket?.items.length || 0} ligne(s)</b><strong>{Number(price?.grand_total || basket?.subtotal || 0).toLocaleString(locale)} {basket?.currency_label || 'Dh'}</strong></section><section><ShieldCheck/><b>Intégrité transactionnelle</b><small>Prix, disponibilité et paiement sont server-side, idempotents et auditables.</small></section></aside></section></main>
}
