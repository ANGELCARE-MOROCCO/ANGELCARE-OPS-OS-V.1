import Link from 'next/link'
import { ArrowLeft, CalendarDays, CircleDollarSign, MapPin, ShieldCheck } from 'lucide-react'
import { journeyAccent, journeyTypeLabels, statusLabels } from '../content'
import type { MarketplaceJourney } from '../types'
import styles from '../journey.module.css'

export function JourneyHero({ journey }: { journey: MarketplaceJourney }) {
  const locale = journey.locale
  const financialLabel = typeof journey.financial_status.label === 'string' ? journey.financial_status.label : 'Finance liée'
  return <section className={styles.journeyHero} data-accent={journeyAccent[journey.journey_type]}>
    <div className={styles.journeyHeroTop}><Link href={`/angelcare-marketplace/${locale}/account`}><ArrowLeft size={16}/> Mon ANGELCARE</Link><span>{journey.public_reference}</span></div>
    <div className={styles.journeyHeroGrid}><div><span className={styles.journeyEyebrow}>{journeyTypeLabels[locale][journey.journey_type]}</span><h1>{journey.title}</h1><p>{journey.subtitle || 'Un parcours gouverné reliant votre demande aux autorités ANGELCARE responsables.'}</p><div className={styles.journeyStatusRow}><strong>{statusLabels[locale][journey.status]}</strong><span>{journey.current_authority}</span><span>Risque {journey.risk_level}</span></div></div>
      <div className={styles.journeyProgress}><div className={styles.progressRing} style={{ '--progress': `${journey.completion_percent * 3.6}deg` } as React.CSSProperties}><div><strong>{journey.completion_percent}%</strong><span>progression prouvée</span></div></div></div>
    </div>
    <div className={styles.journeyHeroFacts}><article><CalendarDays size={18}/><div><span>Prochaine échéance</span><strong>{journey.next_action_due_at ? new Date(journey.next_action_due_at).toLocaleString(locale) : 'À confirmer'}</strong></div></article><article><MapPin size={18}/><div><span>Territoire</span><strong>{journey.territory_id ? 'Périmètre confirmé' : 'À qualifier'}</strong></div></article><article><CircleDollarSign size={18}/><div><span>Finance</span><strong>{financialLabel}</strong></div></article><article><ShieldCheck size={18}/><div><span>Autorité</span><strong>{journey.current_authority}</strong></div></article></div>
  </section>
}
