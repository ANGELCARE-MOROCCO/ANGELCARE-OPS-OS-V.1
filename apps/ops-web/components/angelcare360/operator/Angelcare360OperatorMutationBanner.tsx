'use client'
import { CheckCircle2, LoaderCircle, TriangleAlert } from 'lucide-react'
import styles from './Angelcare360OperatorExperience.module.css'

type Props = { kind: 'idle' | 'loading' | 'success' | 'error'; message?: string | null }
export default function Angelcare360OperatorMutationBanner({ kind, message }: Props) {
  if (!message || kind === 'idle') return null
  const tone = kind === 'success' ? styles.bannerSuccess : kind === 'error' ? styles.bannerError : styles.bannerLoading
  return <div className={`${styles.banner} ${tone}`} role="status" aria-live="polite"><span className={styles.bannerIcon}>{kind === 'success' ? <CheckCircle2 size={15} /> : kind === 'error' ? <TriangleAlert size={15} /> : <LoaderCircle size={15} />}</span><span>{message}</span></div>
}
