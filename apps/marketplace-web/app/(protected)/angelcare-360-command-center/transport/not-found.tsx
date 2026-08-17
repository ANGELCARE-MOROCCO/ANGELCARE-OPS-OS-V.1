import Link from 'next/link'
import styles from '@/components/angelcare360/transport-command/TransportCommand.module.css'
export default function NotFound(){return <div className={styles.universe}><main className={styles.shell}><section className={styles.truthBox}><h1>Dossier Transport introuvable</h1><p>La ressource demandée n’existe pas dans l’autorité Transport active.</p><Link className={styles.navLink} href="/angelcare-360-command-center/transport">Retour au Mobility Command</Link></section></main></div>}
