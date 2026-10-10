'use client'
import Link from '@/angelcare-marketplace/navigation-care-orbit/CareOrbitLink'
import { ArrowRight, Heart, ImageIcon, LoaderCircle } from 'lucide-react'
import type { CatalogLocale, DiscoveryItem } from '@/angelcare-marketplace/catalog-discovery/types'
import { familyAction, familyAvailability, familyAvailable, familyDetailHref, familyPrice, familyWords } from '../experience'
import styles from './families-storefront.module.css'
export function FamilyOfferCard({ item, locale, saved, pending, onSave }: { item: DiscoveryItem; locale: CatalogLocale; saved: boolean; pending: boolean; onSave: (item: DiscoveryItem) => void }) {
  const href = familyDetailHref(locale, item)
  const configuration = item.metadata.experience_configuration
  const fields = configuration && typeof configuration === 'object' && !Array.isArray(configuration) ? configuration as Record<string, unknown> : {}
  const configuredDetails = ['age_range', 'duration', 'language', 'format', 'delivery_mode'].map(key => fields[key]).filter((value): value is string => typeof value === 'string' && value.length > 0).slice(0, 2)
  const details = configuredDetails.length ? configuredDetails : Array.isArray(item.metadata.family_card_details) ? item.metadata.family_card_details.filter((value): value is string => typeof value === 'string').slice(0, 2) : []
  return <article className={styles.offerCard} data-family-offer={item.id}>
    <div className={styles.offerMedia} data-kind={item.kind}><Link href={href}>{item.media_url ? <img src={item.media_url} alt={item.name} width={600} height={450} loading="lazy" /> : <div className={styles.missingMedia}><ImageIcon /><span>{familyWords(['Découvrir l’offre', 'Explore the offer', 'اكتشفوا العرض'], locale)}</span></div>}</Link>
      <button type="button" className={styles.saveButton} disabled={pending} onClick={() => onSave(item)} aria-pressed={saved} aria-label={(saved ? familyWords(['Retirer des favoris : ', 'Remove from saved: ', 'إزالة من المحفوظات: '], locale) : familyWords(['Enregistrer : ', 'Save: ', 'حفظ: '], locale)) + item.name}>{pending ? <LoaderCircle size={17} /> : <Heart size={17} fill={saved ? 'currentColor' : 'none'} />}</button>
      {item.featured ? <span className={styles.featuredBadge}>{familyWords(['À découvrir', 'Featured', 'اكتشفوا'], locale)}</span> : null}
    </div>
    <div className={styles.offerBody}><span className={styles.offerStatus} data-available={familyAvailable(item)}>{familyAvailability(item, locale)}</span><Link href={href}><h3>{item.name}</h3></Link><p>{item.short_description}</p>
      {details.length ? <div className={styles.offerAttributes}>{details.map((detail, index) => <span key={index}>{detail.replaceAll('|', ' · ')}</span>)}</div> : null}
      <div className={styles.offerFoot}><strong>{familyPrice(item, locale)}</strong><Link href={href}>{familyAction(item, locale)}<ArrowRight size={14} /></Link></div>
    </div>
  </article>
}
