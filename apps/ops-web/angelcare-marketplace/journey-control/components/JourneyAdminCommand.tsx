import Link from 'next/link'
import { AlertTriangle, ArrowRight, BellOff, CalendarClock, CircleGauge, LifeBuoy, ListTodo, ShieldAlert } from 'lucide-react'
import { journeyTypeLabels, statusLabels } from '../content'
import type { JourneyAdminSummary } from '../types'
import styles from '../journey.module.css'

export function JourneyAdminCommand({ data }: { data: JourneyAdminSummary }) {
  return <main className={styles.adminShell}>
    <section className={styles.adminHero}><div><span>ANGELCARE JOURNEY COMMAND · POST-CONVERSION AUTHORITY</span><h1>Orders, requests, fulfillment & customer journey control.</h1><p>Pilotez les handovers, actions, délais, preuves, communications et récupérations sans dupliquer les autorités Finance, CRM, Academy, Operations ou Partner OS.</p><div className={styles.adminHeroActions}><Link href="/angelcare-marketplace/admin/journeys/action-center">Ouvrir Action Center <ArrowRight size={17}/></Link><Link href="/angelcare-marketplace/admin/journeys/recovery">Recovery Command</Link></div></div><div className={styles.adminPulse}><CircleGauge size={28}/><strong>{data.total}</strong><span>parcours gouvernés</span></div></section>
    <section className={styles.adminMetricGrid}><article><ListTodo/><span>À traiter</span><strong>{data.requiringAction}</strong><small>actions ouvertes</small></article><article><CalendarClock/><span>En retard</span><strong>{data.late}</strong><small>échéances dépassées</small></article><article><ShieldAlert/><span>Bloqués</span><strong>{data.blocked}</strong><small>interventions requises</small></article><article><LifeBuoy/><span>Recovery</span><strong>{data.recovery}</strong><small>dossiers actifs</small></article><article><BellOff/><span>Notifications</span><strong>{data.failedNotifications}</strong><small>échecs à reprendre</small></article></section>
    <section className={styles.adminBoard}>
      <div className={styles.sectionHeading}><div><span>LIVE JOURNEY PORTFOLIO</span><h2>Parcours nécessitant une décision</h2></div><Link href="/angelcare-marketplace/admin/journeys/analytics">Analytics <ArrowRight size={15}/></Link></div>
      <div className={styles.adminJourneyTable}><div className={styles.adminTableHead}><span>Parcours</span><span>Type</span><span>Statut</span><span>Autorité</span><span>Risque</span><span>Action</span></div>{data.journeys.slice(0, 30).map((journey) => <Link href={`/angelcare-marketplace/admin/journeys/${journey.id}`} className={styles.adminTableRow} key={journey.id}><div><strong>{journey.title}</strong><small>{journey.public_reference}</small></div><span>{journeyTypeLabels.fr[journey.journey_type]}</span><span>{statusLabels.fr[journey.status]}</span><span>{journey.current_authority}</span><span data-risk={journey.risk_level}>{journey.risk_level}</span><span>{journey.next_action_label || 'Ouvrir le dossier'} <ArrowRight size={14}/></span></Link>)}{!data.journeys.length ? <div className={styles.emptyState}>Aucun parcours n’est encore matérialisé depuis Conversion Universe.</div> : null}</div>
    </section>
    <section className={styles.adminLanes}>{data.byType.map((entry) => <Link href={`/angelcare-marketplace/admin/journeys?journeyType=${entry.journey_type}`} key={entry.journey_type}><AlertTriangle size={17}/><span>{journeyTypeLabels.fr[entry.journey_type]}</span><strong>{entry.count}</strong></Link>)}</section>
  </main>
}
