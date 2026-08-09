import { LockKeyhole } from 'lucide-react'
import styles from './Angelcare360OperatorExperience.module.css'

type Props = { title: string; message: string; note?: string }
export default function Angelcare360OperatorLockedPanel({ title, message, note }: Props) {
  return <section className={styles.lockedPanel}><span className={styles.lockedIcon}><LockKeyhole size={16} /></span><div><div className={styles.lockedTitle}>{title}</div><div className={styles.lockedMessage}>{message}</div>{note ? <div className={styles.lockedNote}>{note}</div> : null}</div></section>
}
