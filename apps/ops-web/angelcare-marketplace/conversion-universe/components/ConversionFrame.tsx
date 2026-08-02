'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { BadgeCheck, Check, Clock3, LockKeyhole, MapPin, ShieldCheck, Sparkles } from 'lucide-react'
import type { CatalogLocale, DiscoveryItem } from '../../catalog-discovery/types'
import { conversionCopy, journeyLabel } from '../content'
import type { ConversionJourney, ConversionOutcome, ConversionPriceSnapshot } from '../types'
import styles from '../conversion.module.css'

export function ConversionFrame({
  item,
  locale,
  journey,
  step,
  children,
  sidebar,
  price,
  error,
  busy,
  outcome,
}: {
  item: DiscoveryItem
  locale: CatalogLocale
  journey: ConversionJourney
  step: number
  children: ReactNode
  sidebar?: ReactNode
  price?: ConversionPriceSnapshot | null
  error?: string | null
  busy?: boolean
  outcome?: ConversionOutcome | null
}) {
  const copy = conversionCopy(locale)
  const steps = [copy.configuration, copy.identity, copy.availability, copy.consent, copy.review]
  const priceLabel = price?.status === 'quote_required' || price?.grand_total === null || price?.grand_total === undefined
    ? copy.quote
    : `${new Intl.NumberFormat(locale).format(price.grand_total)} ${price.currency_label}`
  return <main className={styles.conversionRoot} dir={locale === 'ar' ? 'rtl' : 'ltr'} data-journey={journey}>
    <header className={styles.journeyHeader}>
      <Link href={`/angelcare-marketplace/${locale}/marketplace/item/${item.slug}`}>← {locale === 'fr' ? 'Retour à l’offre' : locale === 'ar' ? 'العودة إلى العرض' : 'Back to offer'}</Link>
      <div><LockKeyhole size={15}/><span>{copy.secure}</span><i>SSL · AUDIT · CONSENT</i></div>
    </header>
    <section className={styles.journeyHero}>
      <div className={styles.heroMedia}>{item.media_url ? <img src={item.media_url} alt={item.name}/> : <div><Sparkles size={52}/><strong>ANGELCARE</strong></div>}</div>
      <div className={styles.heroCopy}>
        <span>{journeyLabel(journey, locale)}</span>
        <h1>{item.name}</h1>
        <p>{item.short_description || item.description}</p>
        <div className={styles.heroSignals}><span><MapPin size={15}/>{item.availability_status}</span><span><ShieldCheck size={15}/>{item.trust_labels[0] || 'ANGELCARE Trust'}</span><span><Clock3 size={15}/>{copy.expiry}</span></div>
      </div>
      <div className={styles.heroPrice}><small>{locale === 'fr' ? 'Décision commerciale' : locale === 'ar' ? 'القرار التجاري' : 'Commercial decision'}</small><strong>{priceLabel}</strong><span>{price?.valid_until ? `${locale === 'fr' ? 'Valide jusqu’à' : locale === 'ar' ? 'صالح حتى' : 'Valid until'} ${new Date(price.valid_until).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}` : copy.noPrice}</span></div>
    </section>
    <nav className={styles.progress} aria-label="Progression du parcours">
      {steps.map((label, index) => <div key={label} data-active={index + 1 === step} data-complete={index + 1 < step}><span>{index + 1 < step ? <Check size={14}/> : index + 1}</span><b>{label}</b></div>)}
    </nav>
    {error ? <div className={styles.errorBanner} role="alert">{error}</div> : null}
    {outcome ? <section className={styles.outcomeBanner}><BadgeCheck size={34}/><div><span>{locale === 'fr' ? 'CONVERSION ENREGISTRÉE' : locale === 'ar' ? 'تم تسجيل التحويل' : 'CONVERSION RECORDED'}</span><h2>{outcome.public_reference}</h2><p>{locale === 'fr' ? 'Votre parcours a été remis à l’autorité canonique correspondante.': locale === 'ar' ? 'تم تسليم مسارك إلى السلطة الأساسية المناسبة.' : 'Your journey was handed to the corresponding canonical authority.'}</p></div></section> : null}
    <section className={styles.journeyLayout} aria-busy={busy || false}>
      <div className={styles.journeyMain}>{children}</div>
      <aside className={styles.journeySidebar}>{sidebar}</aside>
    </section>
  </main>
}

export function EvidencePanel({locale,item}:{locale:CatalogLocale;item:DiscoveryItem}) {
  const copy = conversionCopy(locale)
  return <div className={styles.evidencePanel}><span>{copy.evidence}</span><h3>{locale === 'fr' ? 'Ce parcours ne fabrique aucune promesse' : locale === 'ar' ? 'هذا المسار لا يختلق أي وعود' : 'This journey fabricates no promise'}</h3><ul><li><ShieldCheck size={16}/>{locale === 'fr' ? 'Prix relié au catalogue ou au price book actif' : locale === 'ar' ? 'السعر مرتبط بالكتالوج أو بدفتر الأسعار النشط' : 'Price bound to catalog or active price book'}</li><li><BadgeCheck size={16}/>{locale === 'fr' ? 'Disponibilité revérifiée avant confirmation' : locale === 'ar' ? 'إعادة التحقق من التوفر قبل التأكيد' : 'Availability revalidated before confirmation'}</li><li><LockKeyhole size={16}/>{locale === 'fr' ? 'Consentements versionnés et traçables' : locale === 'ar' ? 'موافقات بإصدارات وقابلة للتتبع' : 'Versioned and traceable consents'}</li></ul><small>{item.public_reference}</small></div>
}
