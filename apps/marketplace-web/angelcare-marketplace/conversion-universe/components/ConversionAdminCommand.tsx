import Link from 'next/link'
import { AlertTriangle, ArrowRight, BadgeCheck, BookOpenCheck, Boxes, CalendarCheck, Clock3, FileText, Gauge, RefreshCcw, ShieldCheck, ShoppingBag, UsersRound } from 'lucide-react'
import type { ConversionAdminSummary, ConversionSession } from '../types'
import styles from '../conversion.module.css'

const laneMeta = {
  service_booking: { label: 'Bookings services', icon: CalendarCheck },
  product_checkout: { label: 'Commandes & paniers', icon: ShoppingBag },
  academy_enrollment: { label: 'Inscriptions Academy', icon: BookOpenCheck },
  b2b_quotation: { label: 'Propositions B2B', icon: FileText },
  partner_subscription: { label: 'Demandes Partner OS', icon: Boxes },
  quality_assessment: { label: 'Quality Check 360', icon: ShieldCheck },
} as const

export function ConversionAdminCommand({ summary, sessions }: { summary: ConversionAdminSummary; sessions: ConversionSession[] }) {
  const metrics = [
    ['Sessions actives', summary.activeSessions, Gauge],
    ['Prêtes à confirmer', summary.readyForConfirmation, BadgeCheck],
    ['Transmises aujourd’hui', summary.submittedToday, ArrowRight],
    ['Holds bientôt expirés', summary.expiringHolds, Clock3],
    ['Sur devis', summary.quoteRequired, FileText],
    ['Échecs', summary.failedSessions, AlertTriangle],
    ['Abandons', summary.abandoned, UsersRound],
    ['Exceptions critiques', summary.criticalExceptions, AlertTriangle],
  ] as const
  return <div className={styles.adminRoot}>
    <section className={styles.adminHero}>
      <div><span>CONVERSION COMMAND AUTHORITY</span><h1>Du clic Marketplace au handover canonique, sans promesse fabriquée.</h1><p>Sessions, paniers, disponibilité, prix, consentements, exceptions et résultats convergent dans un cockpit de conversion gouverné.</p><div className={styles.adminHeroActions}><Link href="/angelcare-marketplace/admin/conversion/sessions">Ouvrir les sessions <ArrowRight size={17}/></Link><Link href="/angelcare-marketplace/admin/conversion/exceptions">Exceptions & récupération <RefreshCcw size={17}/></Link></div></div><div className={styles.adminPulse}><strong>{summary.activeSessions}</strong><span>parcours ouverts</span><i/><small>{summary.submittedToday} transmis aujourd’hui</small></div>
    </section>
    <section className={styles.adminMetrics}>{metrics.map(([label,value,Icon])=><article key={label}><Icon size={19}/><strong>{value}</strong><span>{label}</span></article>)}</section>
    <section className={styles.adminSection}><header><div><span>JOURNEY CONTROL</span><h2>Six lignes de conversion spécialisées</h2></div><Link href="/angelcare-marketplace/admin/conversion/analytics">Voir l’analytics <ArrowRight size={16}/></Link></header><div className={styles.journeyLanes}>{Object.entries(laneMeta).map(([key,meta])=>{const Icon=meta.icon;const count=summary.conversionByJourney.find(entry=>entry.journey===key)?.count||0;return <Link href={`/angelcare-marketplace/admin/conversion/sessions?journey=${key}`} key={key}><Icon size={24}/><span>{key.replaceAll('_',' ')}</span><h3>{meta.label}</h3><strong>{count}</strong><small>sessions enregistrées</small><ArrowRight size={17}/></Link>})}</div></section>
    <section className={styles.adminSection}><header><div><span>LIVE CONVERSION QUEUE</span><h2>Dernières sessions</h2></div><Link href="/angelcare-marketplace/admin/conversion/sessions">Tout ouvrir <ArrowRight size={16}/></Link></header><div className={styles.adminTable}><div className={styles.adminTableHead}><span>Référence</span><span>Parcours</span><span>Offre</span><span>Statut</span><span>Dernière activité</span></div>{sessions.slice(0,12).map(session=><div className={styles.adminTableRow} key={session.id}><div><b>{session.public_reference}</b><small>{session.session_key.slice(0,8)}</small></div><span>{session.journey.replaceAll('_',' ')}</span><div><b>{session.item?.name||session.catalog_item_id}</b><small>{session.item?.public_reference}</small></div><span data-status={session.status}>{session.status}</span><time>{new Date(session.last_activity_at).toLocaleString('fr-FR')}</time></div>)}{!sessions.length?<div className={styles.adminEmpty}>Aucune session réelle.</div>:null}</div></section>
  </div>
}
