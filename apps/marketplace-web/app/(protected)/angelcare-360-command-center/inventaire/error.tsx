'use client'
import styles from '@/components/angelcare360/material-command/MaterialCommand.module.css'
export default function ErrorState({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className={styles.page}><section className={styles.sectionPage}><div className={styles.sectionHero}><div><p className={styles.eyebrow}>SANILA · INVENTAIRE</p><h1>Le registre matériel n’a pas pu être chargé.</h1><p>Le stock n’a pas été modifié. Réessayez la consultation dans quelques instants.</p></div><button className={styles.button} onClick={reset}>Réessayer</button></div><div className={styles.notice} data-tone="danger">Service temporairement indisponible.{error.digest ? ` Référence support : ${error.digest}` : ''}</div></section></main>
}
