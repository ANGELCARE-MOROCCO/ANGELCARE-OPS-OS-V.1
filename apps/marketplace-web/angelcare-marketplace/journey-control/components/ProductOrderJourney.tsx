import { Box, CheckCircle2, PackageCheck, Truck } from 'lucide-react'
import type { MarketplaceJourney } from '../types'
import styles from '../journey.module.css'
export function ProductOrderJourney({ journey }: { journey: MarketplaceJourney }) {
  const status = journey.fulfillment_status
  return <section className={styles.typeExperience} data-template="product-order"><div className={styles.sectionHeading}><div><span>ORDER FULFILLMENT</span><h2>De la préparation à la réception</h2></div><PackageCheck size={22}/></div><div className={styles.fulfillmentRail}><article data-active="true"><Box/><strong>Commande enregistrée</strong><span>Référence canonique sécurisée</span></article><article data-active={Boolean(status.prepared)}><PackageCheck/><strong>Préparation</strong><span>{status.prepared ? 'Confirmée par l’autorité stock' : 'En attente de preuve'}</span></article><article data-active={Boolean(status.shipped)}><Truck/><strong>Expédition / retrait</strong><span>{status.shipped ? 'Pris en charge' : 'Aucun suivi fictif affiché'}</span></article><article data-active={journey.status === 'completed'}><CheckCircle2/><strong>Réception</strong><span>{journey.status === 'completed' ? 'Confirmée' : 'À venir'}</span></article></div></section>
}
