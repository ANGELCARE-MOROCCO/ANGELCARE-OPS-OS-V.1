'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, BadgeCheck, Minus, PackageCheck, Plus, ShieldCheck, ShoppingBag, Trash2 } from 'lucide-react'
import type { CatalogLocale, DiscoveryItem } from '../../catalog-discovery/types'
import styles from '../conversion.module.css'

type BasketItem = {
  id: string
  catalog_item_id: string
  quantity: number
  unit_price: number | null
  line_total: number | null
  price_status?: string
  availability_status?: string
  catalog_item?: { slug?: string; name_fr?: string; name_en?: string; name_ar?: string; kind?: string; currency_label?: string }
}
type Basket = { id: string; public_reference: string; basket_kind: string; currency_label: string; subtotal: number; grand_total: number; pricing_status?: string; items: BasketItem[] }
type Envelope<T> = { data: T }

function visitorReference() {
  const name = 'ac_marketplace_visitor'
  const current = document.cookie.split('; ').find(entry => entry.startsWith(`${name}=`))?.split('=')[1]
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

export function BasketExperience({ locale, initialItem = null, kind = 'transactional' }: { locale: CatalogLocale; initialItem?: DiscoveryItem | null; kind?: 'transactional' | 'quotation' }) {
  const [basket, setBasket] = useState<Basket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const visitor = useRef('')
  const seeded = useRef(false)

  async function refresh() {
    const data = await json<Basket>(`/api/angelcare-marketplace/conversion/basket?locale=${locale}&kind=${kind}`, { headers: { 'x-marketplace-visitor': visitor.current } })
    setBasket(data)
    return data
  }

  useEffect(() => {
    visitor.current = visitorReference()
    let cancelled = false
    async function load() {
      try {
        const current = await refresh()
        if (initialItem && !seeded.current && !current.items?.some(line => line.catalog_item_id === initialItem.id)) {
          seeded.current = true
          await json(`/api/angelcare-marketplace/conversion/basket/${current.id}/items`, {
            method: 'POST',
            body: JSON.stringify({ visitorReference: visitor.current, itemSlug: initialItem.slug, locale, quantity: 1, configuration: {} }),
          })
          await refresh()
        }
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Impossible de charger le panier.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [initialItem, kind, locale])

  async function remove(itemId: string) {
    if (!basket) return
    try {
      await json(`/api/angelcare-marketplace/conversion/basket/${basket.id}/items`, { method: 'DELETE', body: JSON.stringify({ visitorReference: visitor.current, itemId }) })
      await refresh()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Suppression impossible.') }
  }

  const quoteRequired = basket?.items?.some(item => item.unit_price === null || item.price_status === 'quote_required')
  return <main className={styles.basketRoot} dir={locale === 'ar' ? 'rtl' : 'ltr'} data-kind={kind}>
    <section className={styles.basketHero}><div><span>{kind === 'quotation' ? 'ANGELCARE QUOTE BASKET' : 'ANGELCARE SECURE BASKET'}</span><h1>{kind === 'quotation' ? (locale === 'fr' ? 'Composez une demande multi-solutions' : locale === 'ar' ? 'أنشئ طلبًا متعدد الحلول' : 'Build a multi-solution request') : (locale === 'fr' ? 'Votre sélection, prête à être revérifiée' : locale === 'ar' ? 'اختياراتك جاهزة لإعادة التحقق' : 'Your selection, ready for revalidation')}</h1><p>{locale === 'fr' ? 'Chaque ligne conserve son autorité de prix, de disponibilité et de confiance. Aucun montant ou stock n’est inventé.' : locale === 'ar' ? 'يحتفظ كل عنصر بمرجعية السعر والتوفر والثقة. لا يتم اختلاق أي مبلغ أو مخزون.' : 'Every line preserves its price, availability and trust authority. No amount or stock is fabricated.'}</p></div><div><ShoppingBag size={48}/><strong>{basket?.items?.length || 0}</strong><span>{locale === 'fr' ? 'offres sélectionnées' : locale === 'ar' ? 'عروض مختارة' : 'selected offers'}</span></div></section>
    {error ? <div className={styles.errorBanner}>{error}</div> : null}
    <section className={styles.basketLayout} aria-busy={loading}>
      <div className={styles.basketLines}>
        <header><span>SELECTION</span><h2>{kind === 'quotation' ? 'Périmètre de proposition' : 'Articles et services'}</h2></header>
        {loading ? <div className={styles.loadingState}>Chargement du panier gouverné…</div> : null}
        {!loading && !basket?.items?.length ? <div className={styles.emptyBasket}><PackageCheck size={52}/><h3>{locale === 'fr' ? 'Votre sélection est vide' : locale === 'ar' ? 'اختياراتك فارغة' : 'Your selection is empty'}</h3><p>{locale === 'fr' ? 'Ajoutez des offres publiées depuis le catalogue.' : locale === 'ar' ? 'أضف عروضًا منشورة من الكتالوج.' : 'Add published offers from the catalog.'}</p><Link href={`/angelcare-marketplace/${locale}/marketplace`}>Explorer le Marketplace <ArrowRight size={17}/></Link></div> : null}
        {basket?.items?.map(line => {
          const name = locale === 'ar' ? line.catalog_item?.name_ar : locale === 'en' ? line.catalog_item?.name_en : line.catalog_item?.name_fr
          return <article className={styles.basketLine} key={line.id}><div className={styles.lineVisual}><PackageCheck size={30}/></div><div className={styles.lineCopy}><span>{line.catalog_item?.kind || 'marketplace'}</span><h3>{name || line.catalog_item_id}</h3><div><BadgeCheck size={14}/>{line.availability_status || 'availability recheck required'}</div></div><div className={styles.quantityControl}><button type="button" disabled><Minus size={14}/></button><strong>{line.quantity}</strong><button type="button" disabled><Plus size={14}/></button></div><div className={styles.linePrice}><strong>{line.unit_price === null ? (locale === 'fr' ? 'Sur devis' : locale === 'ar' ? 'حسب العرض' : 'Quote') : `${new Intl.NumberFormat(locale).format(line.line_total || 0)} ${basket.currency_label}`}</strong><small>{line.price_status || 'snapshot'}</small></div><button className={styles.removeLine} type="button" onClick={() => void remove(line.id)} aria-label="Retirer"><Trash2 size={17}/></button></article>
        })}
      </div>
      <aside className={styles.basketSummary}><span>COMMERCIAL CONTROL</span><h2>{locale === 'fr' ? 'Résumé de décision' : locale === 'ar' ? 'ملخص القرار' : 'Decision summary'}</h2><div><small>Sous-total connu</small><strong>{new Intl.NumberFormat(locale).format(basket?.subtotal || 0)} {basket?.currency_label || 'Dh'}</strong></div>{quoteRequired ? <p className={styles.quoteNotice}><ShieldCheck size={18}/>{locale === 'fr' ? 'Certaines lignes exigent une proposition qualifiée. Aucun total final ne sera affiché avant validation.' : locale === 'ar' ? 'تتطلب بعض العناصر عرضًا مؤهلاً. لن يتم عرض إجمالي نهائي قبل التحقق.' : 'Some lines require a qualified proposal. No final total will be displayed before validation.'}</p> : null}<ul><li><BadgeCheck size={15}/>Prix revérifié avant confirmation</li><li><BadgeCheck size={15}/>Disponibilité et capacité revérifiées</li><li><BadgeCheck size={15}/>Consentements versionnés</li></ul>{basket?.items?.length ? <Link href={`/angelcare-marketplace/${locale}/checkout?basket=${basket.id}&kind=${kind}`}>{kind === 'quotation' ? (locale === 'fr' ? 'Préparer la demande' : 'Prepare request') : (locale === 'fr' ? 'Passer à la vérification' : 'Proceed to review')}<ArrowRight size={18}/></Link> : <button disabled>Panier vide</button>}<Link className={styles.continueShopping} href={`/angelcare-marketplace/${locale}/marketplace`}>Continuer l’exploration</Link></aside>
    </section>
  </main>
}
