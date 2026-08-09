import { CalendarCheck, ClipboardCheck, HeartHandshake, ShieldCheck } from 'lucide-react'
import type { MarketplaceJourney } from '../types'
import styles from '../journey.module.css'
export function FamilyBookingJourney({ journey }: { journey: MarketplaceJourney }) {
  const assigned = typeof journey.fulfillment_status.provider_display_name === 'string' ? journey.fulfillment_status.provider_display_name : null
  return <section className={styles.typeExperience} data-template="family-booking"><div className={styles.sectionHeading}><div><span>FAMILY SERVICE READINESS</span><h2>Votre service, préparé avec précision</h2></div><HeartHandshake size={22}/></div><div className={styles.readinessGrid}><article><CalendarCheck/><span>Planning</span><strong>{journey.scheduled_start_at ? new Date(journey.scheduled_start_at).toLocaleString(journey.locale) : 'Confirmation en cours'}</strong></article><article><ShieldCheck/><span>Équipe</span><strong>{assigned || 'Visible après autorisation opérationnelle'}</strong></article><article><ClipboardCheck/><span>Instructions</span><strong>{journey.actions.some((action) => action.action_key.includes('instruction') && action.status === 'open') ? 'Accusé requis' : 'À jour'}</strong></article></div></section>
}
