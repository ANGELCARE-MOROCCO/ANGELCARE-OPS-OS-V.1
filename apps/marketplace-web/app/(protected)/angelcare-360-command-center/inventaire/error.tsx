'use client'
import styles from '@/components/angelcare360/material-command/MaterialCommand.module.css'
export default function ErrorState({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className={styles.page}><section className={styles.sectionPage}><div className={styles.sectionHero}><div><p className={styles.eyebrow}>SANILA · INTÉGRITÉ D’EXPÉRIENCE</p><h1>Le registre matériel n’a pas pu être chargé.</h1><p>Le stock n’a pas été modifié par cette erreur d’affichage. Réessayez la lecture; si le problème persiste, conservez l’identifiant technique pour le support.</p></div><button className={styles.button} onClick={reset}>Réessayer</button></div><div className={styles.notice} data-tone="danger">{error.message || 'Erreur Inventaire inattendue.'}{error.digest ? ` · Référence ${error.digest}` : ''}</div></section></main>
}
