'use client'

import { AlertTriangle, RotateCcw } from 'lucide-react'
import styles from '@/components/angelcare360/claims/TrustResolutionOS.module.css'

export default function Angelcare360ClaimsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className={styles.statePage}><section className={styles.stateCard}><div className={styles.stateIcon}><AlertTriangle /></div><h1>Le centre de résolution n’a pas pu charger cette vue.</h1><p>Le dossier et les données existantes ne sont pas modifiés. Réessayez la lecture ; si l’erreur persiste, l’audit et les permissions de l’établissement restent les autorités à vérifier.</p><div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}><button className={styles.primaryButton} type="button" onClick={reset}><RotateCcw size={14} />Réessayer</button></div></section></main>
}
