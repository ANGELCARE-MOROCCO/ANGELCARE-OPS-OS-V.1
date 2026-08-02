import { AcademyEnrollmentJourney } from './AcademyEnrollmentJourney'
import { B2BQuotationJourney } from './B2BQuotationJourney'
import { FamilyBookingJourney } from './FamilyBookingJourney'
import { PartnerActivationJourney } from './PartnerActivationJourney'
import { ProductOrderJourney } from './ProductOrderJourney'
import { QualityAssessmentJourney } from './QualityAssessmentJourney'
import { DocumentVault } from './DocumentVault'
import { JourneyActionPanel } from './JourneyActionPanel'
import { JourneyHero } from './JourneyHero'
import { JourneyTimeline } from './JourneyTimeline'
import { NotificationCenter } from './NotificationCenter'
import { RecoveryPanel } from './RecoveryPanel'
import type { MarketplaceJourney } from '../types'
import styles from '../journey.module.css'

export function JourneyExperience({ journey }: { journey: MarketplaceJourney }) {
  const typeSpecific = journey.journey_type === 'product_order' || journey.journey_type === 'kit_order'
    ? <ProductOrderJourney journey={journey}/>
    : journey.journey_type === 'family_booking' || journey.journey_type === 'recurring_service'
      ? <FamilyBookingJourney journey={journey}/>
      : journey.journey_type === 'academy_enrollment'
        ? <AcademyEnrollmentJourney journey={journey}/>
        : journey.journey_type === 'partner_activation'
          ? <PartnerActivationJourney journey={journey}/>
          : journey.journey_type === 'quality_assessment'
            ? <QualityAssessmentJourney journey={journey}/>
            : <B2BQuotationJourney journey={journey}/>
  return <main className={styles.journeyShell} dir={journey.locale === 'ar' ? 'rtl' : 'ltr'}>
    <JourneyHero journey={journey}/>
    <div className={styles.journeyLayout}><div className={styles.journeyMain}><JourneyActionPanel journeyId={journey.id} actions={journey.actions}/>{typeSpecific}<JourneyTimeline events={journey.events} locale={journey.locale}/><DocumentVault documents={journey.documents}/></div><aside className={styles.journeyAside}><NotificationCenter notifications={journey.notifications}/><RecoveryPanel journeyId={journey.id} cases={journey.recovery_cases}/></aside></div>
  </main>
}
