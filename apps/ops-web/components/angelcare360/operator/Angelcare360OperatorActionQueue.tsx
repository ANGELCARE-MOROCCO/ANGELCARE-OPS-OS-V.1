import type { ReactNode } from 'react'
import styles from './Angelcare360OperatorExperience.module.css'

type Item = { title: string; detail?: string; tone?: 'info' | 'warning' | 'critical'; action?: ReactNode }
type Props = { title: string; items: Item[] }

export default function Angelcare360OperatorActionQueue({ title, items }: Props) {
  return (
    <section className={styles.intelligencePanel}>
      <div>
        <div className={styles.panelEyebrow}>File priorisée</div>
        <h2 className={styles.panelTitle}>{title}</h2>
      </div>
      <div className={styles.queueList}>
        {items.map((item) => (
          <article key={`${item.title}-${item.detail || 'item'}`} className={styles.queueItem}>
            <span className={`${styles.queueSignal} ${item.tone === 'critical' ? styles.queueSignalCritical : item.tone === 'warning' ? styles.queueSignalWarning : ''}`} aria-hidden="true" />
            <div>
              <div className={styles.queueTitle}>{item.title}</div>
              {item.detail ? <div className={styles.queueDetail}>{item.detail}</div> : null}
              {item.action ? <div className={styles.actionToolbar}>{item.action}</div> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
