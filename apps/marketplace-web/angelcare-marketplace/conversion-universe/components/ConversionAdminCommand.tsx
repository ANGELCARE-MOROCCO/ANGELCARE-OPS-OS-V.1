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

const accessLinks = [
  ['Sessions', '/angelcare-marketplace/admin/conversion/sessions'],
  ['Paniers', '/angelcare-marketplace/admin/conversion/baskets'],
  ['Bookings', '/angelcare-marketplace/admin/conversion/bookings'],
  ['Inscriptions', '/angelcare-marketplace/admin/conversion/enrollments'],
  ['Quotations', '/angelcare-marketplace/admin/conversion/quotations'],
  ['Consentements', '/angelcare-marketplace/admin/conversion/consents'],
  ['Holds', '/angelcare-marketplace/admin/conversion/holds'],
  ['Exceptions', '/angelcare-marketplace/admin/conversion/exceptions'],
  ['Abandonnement', '/angelcare-marketplace/admin/conversion/abandonment'],
] as const

export function ConversionAdminCommand({ summary, sessions }: { summary: ConversionAdminSummary; sessions: ConversionSession[] }) {
  const metrics = [
    ['Sessions actives', summary.activeSessions, 'Parcours ouverts', Gauge, 'neutral'],
    ['Prêtes à confirmer', summary.readyForConfirmation, 'ready', BadgeCheck, 'success'],
    ['Transmises aujourd’hui', summary.submittedToday, 'submitted', ArrowRight, 'neutral'],
    ['Holds expirants', summary.expiringHolds, '< 30 min', Clock3, 'warning'],
    ['Sur devis', summary.quoteRequired, 'quote_required', FileText, 'purple'],
    ['Échecs', summary.failedSessions, 'failed', AlertTriangle, 'danger'],
    ['Abandons', summary.abandoned, 'expired', UsersRound, 'warning'],
    ['Exceptions critiques', summary.criticalExceptions, 'high / critical', AlertTriangle, 'danger'],
  ] as const

  return <main className={styles.conversionCommandRoot}>
    <header className={styles.conversionCommandHeader}>
      <div><h1>Conversion Command Authority</h1><p>Sessions, paniers, disponibilité, prix, consentements, exceptions et résultats dans un cockpit gouverné.</p></div>
      <div><Link href="/angelcare-marketplace/admin/conversion/exceptions">Exceptions & récupération</Link><Link href="/angelcare-marketplace/admin/conversion/sessions">Ouvrir sessions</Link></div>
    </header>
    <section className={styles.conversionCommandMetrics}>{metrics.map(([label, value, hint, Icon, tone]) => <article key={label} data-tone={tone}><div><Icon size={15}/><span>{label}</span></div><strong>{value.toLocaleString('fr-FR')}</strong><small>{hint}</small></article>)}</section>
    <div className={styles.conversionCommandLayout}>
      <div className={styles.conversionCommandMain}>
        <section className={styles.conversionCommandPanel}>
          <header><div><h2>Six lignes de conversion spécialisées</h2><p>Du clic Marketplace au handover canonique.</p></div></header>
          <div className={styles.conversionLaneGrid}>{Object.entries(laneMeta).map(([key, meta]) => { const Icon = meta.icon; const count = summary.conversionByJourney.find((entry) => entry.journey === key)?.count || 0; return <Link href={`/angelcare-marketplace/admin/conversion/sessions?journey=${key}`} key={key}><span>{key}</span><Icon size={18}/><strong>{meta.label}</strong><b>{count.toLocaleString('fr-FR')}</b></Link> })}</div>
        </section>
        <section className={styles.conversionCommandPanel}>
          <header><div><h2>Dernières sessions</h2><p>Sessions réelles, sans promesse de résultat fabriquée.</p></div><Link href="/angelcare-marketplace/admin/conversion/sessions">Tout ouvrir <ArrowRight size={14}/></Link></header>
          <div className={styles.conversionCommandTable}><table><thead><tr><th>Référence</th><th>Parcours</th><th>Offre</th><th>Statut</th><th>Dernière activité</th></tr></thead><tbody>{sessions.slice(0, 12).map((session) => <tr key={session.id}><td><Link href={`/angelcare-marketplace/admin/conversion/sessions/${session.id}`}>{session.public_reference}</Link><small>{session.session_key.slice(0, 8)}</small></td><td>{session.journey.replaceAll('_', ' ')}</td><td><strong>{session.item?.name || session.catalog_item_id}</strong><small>{session.item?.public_reference}</small></td><td><span data-status={session.status}>{session.status}</span></td><td>{new Date(session.last_activity_at).toLocaleString('fr-FR')}</td></tr>)}</tbody></table>{!sessions.length ? <div>Aucune session réelle.</div> : null}</div>
        </section>
      </div>
      <aside className={styles.conversionCommandRail}>
        <section><h2>Accès conversion</h2>{accessLinks.map(([label, href]) => <Link href={href} key={href}>{label}<ArrowRight size={14}/></Link>)}</section>
        <section><span>PRINCIPE DE VÉRITÉ</span><p>Prix, disponibilité, consentements, exceptions et outcome restent prouvés par la session. Aucun résultat n’est annoncé avant confirmation réelle.</p></section>
        <section><span>INTERVENTION</span><h3>Traiter les exceptions</h3><p>{summary.criticalExceptions} exception(s) critique(s) et {summary.failedSessions} session(s) en échec.</p><Link href="/angelcare-marketplace/admin/conversion/exceptions"><RefreshCcw size={14}/> Ouvrir la file</Link></section>
      </aside>
    </div>
  </main>
}
