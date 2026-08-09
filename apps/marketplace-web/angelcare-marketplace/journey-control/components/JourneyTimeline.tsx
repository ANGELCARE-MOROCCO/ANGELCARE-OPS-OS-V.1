import { BadgeCheck, CalendarClock, CircleAlert, Clock3, ShieldCheck } from 'lucide-react'
import { statusLabels } from '../content'
import type { CatalogLocale } from '../../catalog-discovery/types'
import type { JourneyEvent, JourneyStatus } from '../types'
import styles from '../journey.module.css'

const iconFor = (status: JourneyStatus) => {
  if (status === 'completed') return BadgeCheck
  if (status === 'blocked' || status === 'recovery') return CircleAlert
  if (status === 'scheduled') return CalendarClock
  if (status === 'in_progress') return ShieldCheck
  return Clock3
}

export function JourneyTimeline({ events, locale }: { events: JourneyEvent[]; locale: CatalogLocale }) {
  return <section className={styles.timelinePanel} aria-labelledby="journey-timeline-title">
    <div className={styles.sectionHeading}>
      <div><span>CHRONOLOGIE DE CONFIANCE</span><h2 id="journey-timeline-title">Ce qui s’est réellement passé</h2></div>
      <strong>{events.length} événement{events.length === 1 ? '' : 's'}</strong>
    </div>
    <div className={styles.timeline}>
      {events.length ? events.map((event) => {
        const Icon = iconFor(event.status)
        return <article className={styles.timelineEvent} key={event.id} data-status={event.status}>
          <div className={styles.timelineIcon}><Icon size={18}/></div>
          <div className={styles.timelineBody}>
            <div className={styles.timelineTop}><h3>{event.title}</h3><time>{new Date(event.occurred_at).toLocaleString(locale)}</time></div>
            {event.description ? <p>{event.description}</p> : null}
            <div className={styles.eventMeta}><span>{statusLabels[locale][event.status]}</span><span>{event.authority_type}</span>{event.authority_object_id ? <span>Preuve liée</span> : null}</div>
          </div>
        </article>
      }) : <div className={styles.emptyState}>La chronologie apparaîtra dès qu’une autorité canonique publiera un événement.</div>}
    </div>
  </section>
}
