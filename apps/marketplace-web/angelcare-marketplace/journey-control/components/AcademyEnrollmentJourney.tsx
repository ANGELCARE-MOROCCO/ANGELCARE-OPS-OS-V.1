import { Award, CalendarDays, GraduationCap, Users } from 'lucide-react'
import type { MarketplaceJourney } from '../types'
import styles from '../journey.module.css'
export function AcademyEnrollmentJourney({ journey }: { journey: MarketplaceJourney }) {
  return <section className={styles.typeExperience} data-template="academy"><div className={styles.sectionHeading}><div><span>ACADEMY JOURNEY</span><h2>Inscription, cohorte et certification</h2></div><GraduationCap size={23}/></div><div className={styles.academyGrid}><article><Users/><span>Éligibilité</span><strong>{String(journey.fulfillment_status.eligibility || 'À vérifier')}</strong></article><article><CalendarDays/><span>Cohorte</span><strong>{String(journey.fulfillment_status.cohort_label || 'Affectation en cours')}</strong></article><article><Award/><span>Certification</span><strong>{journey.status === 'completed' ? 'Résultat Academy disponible' : 'Dépend de l’assiduité et de l’évaluation'}</strong></article></div></section>
}
