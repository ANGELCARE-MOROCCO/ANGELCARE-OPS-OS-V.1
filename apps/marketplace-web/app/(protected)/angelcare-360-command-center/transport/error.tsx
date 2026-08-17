'use client'
import styles from '@/components/angelcare360/transport-command/TransportCommand.module.css'
export default function Error({error,reset}:{error:Error&{digest?:string};reset:()=>void}){return <div className={styles.universe}><main className={styles.shell}><section className={styles.truthBox}><h1>Transport indisponible</h1><p>La commande de mobilité n’a pas pu être chargée. Aucune opération de transport n’a été exécutée.</p><p className={styles.subtle}>{error.message}</p><button className={styles.button} onClick={reset}>Réessayer</button></section></main></div>}
