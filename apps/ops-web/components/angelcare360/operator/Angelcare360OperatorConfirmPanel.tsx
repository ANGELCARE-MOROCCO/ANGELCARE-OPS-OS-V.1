'use client'
import { ShieldAlert } from 'lucide-react'
import Angelcare360OperatorActionButton from './Angelcare360OperatorActionButton'
import styles from './Angelcare360OperatorExperience.module.css'

type Props = { title: string; message: string; confirmLabel?: string; onConfirm: () => void; busy?: boolean; tone?: 'warning' | 'danger' }
export default function Angelcare360OperatorConfirmPanel({ title, message, confirmLabel = 'Confirmer', onConfirm, busy, tone = 'warning' }: Props) {
  return <div className={`${styles.confirmPanel} ${tone === 'danger' ? styles.confirmPanelDanger : ''}`}><span className={styles.confirmIcon}><ShieldAlert size={17} /></span><div><div className={styles.confirmTitle}>{title}</div><div className={styles.confirmMessage}>{message}</div></div><Angelcare360OperatorActionButton label={confirmLabel} tone={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy} /></div>
}
