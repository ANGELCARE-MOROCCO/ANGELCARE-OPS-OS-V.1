import { ClipboardCheck, FileSearch, ShieldCheck, Target } from 'lucide-react'
import type { MarketplaceJourney } from '../types'
import styles from '../journey.module.css'
export function QualityAssessmentJourney({ journey }: { journey: MarketplaceJourney }) {
  return <section className={styles.typeExperience} data-template="quality"><div className={styles.sectionHeading}><div><span>QUALITY CHECK 360 JOURNEY</span><h2>Portée, preuves, évaluation et actions</h2></div><ShieldCheck size={22}/></div><div className={styles.qualityFlow}><article><Target/><span>Périmètre</span><strong>{String(journey.customer_context.scope_label || 'À confirmer')}</strong></article><article><FileSearch/><span>Preuves</span><strong>{String(journey.fulfillment_status.evidence_readiness || 'Collecte gouvernée')}</strong></article><article><ClipboardCheck/><span>Rapport</span><strong>{journey.documents.some((document) => document.document_type === 'assessment_report') ? 'Publié' : 'Non publié'}</strong></article></div></section>
}
