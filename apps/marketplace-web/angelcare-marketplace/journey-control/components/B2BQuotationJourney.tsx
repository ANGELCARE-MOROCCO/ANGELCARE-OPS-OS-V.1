import { Building2, FileSignature, Milestone, UsersRound } from 'lucide-react'
import type { MarketplaceJourney } from '../types'
import styles from '../journey.module.css'
export function B2BQuotationJourney({ journey }: { journey: MarketplaceJourney }) {
  return <section className={styles.typeExperience} data-template="b2b"><div className={styles.sectionHeading}><div><span>ENTERPRISE DECISION JOURNEY</span><h2>Qualification, proposition et décision</h2></div><Building2 size={22}/></div><div className={styles.enterpriseFlow}><article><UsersRound/><strong>Organisation</strong><span>{journey.crm_account_id ? 'Compte CRM canonique lié' : 'Qualification requise'}</span></article><article><Milestone/><strong>Portée</strong><span>{String(journey.customer_context.scope_label || 'Périmètre en consolidation')}</span></article><article><FileSignature/><strong>Proposition</strong><span>{String(journey.fulfillment_status.proposal_status || 'Préparation commerciale')}</span></article></div></section>
}
