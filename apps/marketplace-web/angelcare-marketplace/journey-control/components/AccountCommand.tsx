import Link from 'next/link'
import { ArrowRight, BellRing, CalendarCheck, CheckCircle2, FileText, LifeBuoy, PackageCheck, ShieldCheck, Sparkles } from 'lucide-react'
import { accountCopy, journeyAccent, journeyTypeLabels, statusLabels } from '../content'
import type { CustomerAccountSummary } from '../types'
import styles from '../journey.module.css'

export function AccountCommand({ data }: { data: CustomerAccountSummary }) {
  const copy = accountCopy[data.locale]
  const rtl = data.locale === 'ar'
  return <main className={styles.accountShell} dir={rtl ? 'rtl' : 'ltr'}>
    <section className={styles.accountHero}>
      <div className={styles.heroGlow}/><div className={styles.accountHeroCopy}><span>{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.description}</p>
        <div className={styles.heroActions}><Link className={styles.heroPrimary} href={`/angelcare-marketplace/${data.locale}/account/action-center`}><Sparkles size={18}/>{copy.actions}<ArrowRight size={17}/></Link><Link className={styles.heroSecondary} href={`/angelcare-marketplace/${data.locale}/marketplace`}>Explorer le Marketplace</Link></div>
      </div>
      <div className={styles.commandOrb}><div><ShieldCheck size={27}/><span>ANGELCARE JOURNEY CONTROL</span><strong>{data.counters.active}</strong><small>parcours actifs</small></div></div>
      <div className={styles.heroMetrics}><article><strong>{data.counters.awaitingCustomer}</strong><span>actions requises</span></article><article><strong>{data.counters.upcoming}</strong><span>prochaines dates</span></article><article><strong>{data.counters.documents}</strong><span>documents</span></article><article><strong>{data.counters.recovery}</strong><span>récupérations</span></article></div>
    </section>

    <section className={styles.accountCommandGrid}>
      <div className={styles.accountMain}>
        <section className={styles.nextActionCommand}>
          <div className={styles.sectionHeading}><div><span>NEXT ACTION COMMAND</span><h2>{copy.actions}</h2></div><Link href={`/angelcare-marketplace/${data.locale}/account/action-center`}>Tout ouvrir <ArrowRight size={15}/></Link></div>
          {data.nextActions.length ? <div className={styles.actionRail}>{data.nextActions.slice(0, 4).map((action) => <article className={styles.commandActionCard} key={action.id}><div className={styles.commandActionIcon}><CalendarCheck size={19}/></div><div><span>{action.required_authority}</span><h3>{action.title}</h3><p>{action.description || action.consequence || 'Une action est requise pour poursuivre ce parcours.'}</p>{action.due_at ? <time>Avant le {new Date(action.due_at).toLocaleDateString(data.locale)}</time> : null}</div><ArrowRight size={18}/></article>)}</div> : <div className={styles.successState}><CheckCircle2 size={22}/><div><strong>{copy.empty}</strong><p>ANGELCARE continue de surveiller les autorités et les prochaines échéances.</p></div></div>}
        </section>

        <section className={styles.activeJourneySection}>
          <div className={styles.sectionHeading}><div><span>ACTIVE JOURNEY PORTFOLIO</span><h2>{copy.active}</h2></div><Link href={`/angelcare-marketplace/${data.locale}/account/journeys`}>{copy.allJourneys} <ArrowRight size={15}/></Link></div>
          <div className={styles.journeyPortfolio}>{data.active.length ? data.active.slice(0, 8).map((journey) => <Link href={`/angelcare-marketplace/${data.locale}/account/journeys/${journey.id}`} className={styles.journeyCard} data-accent={journeyAccent[journey.journey_type]} key={journey.id}>
            <div className={styles.journeyCardTop}><span>{journeyTypeLabels[data.locale][journey.journey_type]}</span><small>{journey.public_reference}</small></div><h3>{journey.title}</h3><p>{journey.subtitle || `Autorité actuelle : ${journey.current_authority}`}</p>
            <div className={styles.progressTrack}><span style={{ width: `${journey.completion_percent}%` }}/></div><div className={styles.journeyCardFoot}><strong>{statusLabels[data.locale][journey.status]}</strong><span>{journey.completion_percent}%</span></div>
          </Link>) : <div className={styles.emptyState}>Aucun parcours actif. Votre prochain achat, réservation ou demande apparaîtra ici.</div>}</div>
        </section>
      </div>

      <aside className={styles.accountSide}>
        <section className={styles.upcomingPanel}><div className={styles.sectionHeading}><div><span>TODAY & NEXT</span><h2>{copy.upcoming}</h2></div><CalendarCheck size={20}/></div>{data.upcoming.slice(0, 5).map((journey) => <Link href={`/angelcare-marketplace/${data.locale}/account/journeys/${journey.id}`} key={journey.id}><time>{journey.scheduled_start_at ? new Date(journey.scheduled_start_at).toLocaleDateString(data.locale, { day: '2-digit', month: 'short' }) : '—'}</time><div><strong>{journey.title}</strong><span>{statusLabels[data.locale][journey.status]}</span></div></Link>)}{!data.upcoming.length ? <p>Aucune date confirmée à venir.</p> : null}</section>
        <section className={styles.shortcutPanel}><h2>Accès direct</h2><Link href={`/angelcare-marketplace/${data.locale}/account/orders`}><PackageCheck size={18}/>Commandes</Link><Link href={`/angelcare-marketplace/${data.locale}/account/documents`}><FileText size={18}/>{copy.documents}</Link><Link href={`/angelcare-marketplace/${data.locale}/account/notifications`}><BellRing size={18}/>Notifications</Link><Link href={`/angelcare-marketplace/${data.locale}/account/support`}><LifeBuoy size={18}/>{copy.support}</Link></section>
      </aside>
    </section>
  </main>
}
