import Link from 'next/link'
import { SearchX } from 'lucide-react'
import styles from '@/components/angelcare360/claims/TrustResolutionOS.module.css'

export default function Angelcare360ClaimNotFound() {
  return <main className={styles.statePage}><section className={styles.stateCard}><div className={styles.stateIcon}><SearchX /></div><h1>Dossier introuvable dans cet établissement.</h1><p>La référence demandée n’est pas accessible dans le périmètre courant. Aucune donnée d’un autre tenant n’est exposée.</p><div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}><Link className={styles.primaryButton} href="/angelcare-360-command-center/reclamations/tickets">Retour aux dossiers</Link></div></section></main>
}
