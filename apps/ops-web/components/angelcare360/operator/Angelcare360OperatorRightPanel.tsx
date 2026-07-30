import type { ReactNode } from 'react'
import styles from './Angelcare360OperatorExperience.module.css'

type Props = { title: string; subtitle?: string; children: ReactNode }
export default function Angelcare360OperatorRightPanel({ title, subtitle, children }: Props) {
  return <aside className={styles.intelligencePanel}><div><div className={styles.panelEyebrow}>Intelligence contextuelle</div><h2 className={styles.panelTitle}>{title}</h2>{subtitle ? <p className={styles.panelDescription}>{subtitle}</p> : null}</div>{children}</aside>
}
