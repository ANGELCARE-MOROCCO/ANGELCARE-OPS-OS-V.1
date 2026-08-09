import { Activity, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import styles from './Angelcare360OperatorExperience.module.css'

type Item = { title: string; detail?: string; timestamp?: string; tone?: 'info' | 'warning' | 'critical' | 'success' }
type Props = { title: string; items: Item[] }

export default function Angelcare360OperatorTimeline({ title, items }: Props) {
  return (
    <section className={styles.intelligencePanel}>
      <div>
        <div className={styles.panelEyebrow}>Chronologie probante</div>
        <h2 className={styles.panelTitle}>{title}</h2>
      </div>
      <div className={styles.timelineList}>
        {items.length ? items.map((item) => (
          <article key={`${item.title}-${item.timestamp || 'time'}`} className={styles.timelineItem}>
            <span className={styles.timelineDot}>{item.tone === 'critical' ? <TriangleAlert size={13} /> : item.tone === 'warning' ? <Activity size={13} /> : item.tone === 'success' ? <CircleCheck size={13} /> : <Info size={13} />}</span>
            <div>
              <div className={styles.timelineTitle}>{item.title}</div>
              {item.detail ? <div className={styles.timelineDetail}>{item.detail}</div> : null}
              {item.timestamp ? <div className={styles.timelineTime}>{formatTimestamp(item.timestamp)}</div> : null}
            </div>
          </article>
        )) : <div className={styles.emptyDescription}>Aucun événement n’est disponible dans cette fenêtre de lecture.</div>}
      </div>
    </section>
  )
}

function formatTimestamp(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
