import { Boxes, KeyRound, Rocket, Settings2 } from 'lucide-react'
import type { MarketplaceJourney } from '../types'
import styles from '../journey.module.css'
export function PartnerActivationJourney({ journey }: { journey: MarketplaceJourney }) {
  return <section className={styles.typeExperience} data-template="partner"><div className={styles.sectionHeading}><div><span>PARTNER OS ACTIVATION</span><h2>Du plan validé au tenant opérationnel</h2></div><Rocket size={22}/></div><div className={styles.partnerFlow}><article><Boxes/><span>Plan & modules</span><strong>{String(journey.customer_context.plan_label || 'Configuration liée')}</strong></article><article><Settings2/><span>Onboarding</span><strong>{String(journey.fulfillment_status.onboarding_status || 'Préparation')}</strong></article><article><KeyRound/><span>Activation</span><strong>{journey.canonical_object_id ? 'Tenant canonique lié' : 'Aucune activation fictive'}</strong></article></div></section>
}
