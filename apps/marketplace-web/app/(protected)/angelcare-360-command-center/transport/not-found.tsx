import Link from 'next/link'
import styles from '@/components/angelcare360/transport/sovereign/TransportSovereign.module.css'

export default function NotFound() {
  return <div className={styles.scope}>
    <section className={styles.truthBox}>
      <div className={styles.sectionKicker}>Transport & Sécurité</div>
      <h1>Dossier Transport introuvable</h1>
      <p>La ressource demandée n’existe pas dans l’autorité Transport active de cet établissement.</p>
      <Link className={styles.navLink} href="/angelcare-360-command-center/transport">Retour au cockpit Transport</Link>
    </section>
  </div>
}
