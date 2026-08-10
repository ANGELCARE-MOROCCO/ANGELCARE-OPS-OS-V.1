'use client'
import styles from '@/components/angelcare360/zone-b-presence/PresenceZoneBFrame.module.css'
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){return <div className={styles.page}><section className={styles.crown}><div><h2 className={styles.crownTitle}>Présences momentanément indisponibles</h2><p className={styles.crownSub}>La vue n’a pas pu être chargée correctement. Aucun état de présence n’a été modifié.</p></div><div><button className={styles.primaryButton} onClick={reset}>Réessayer</button></div></section></div>}
