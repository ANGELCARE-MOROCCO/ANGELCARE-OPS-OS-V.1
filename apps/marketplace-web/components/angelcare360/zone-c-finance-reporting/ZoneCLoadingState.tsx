import styles from './ZoneCFrame.module.css'

export default function ZoneCLoadingState({ domain }: { domain: 'finance' | 'reports' }) {
  return <div className={styles.loadingState} aria-live="polite" aria-label={domain === 'finance' ? 'Chargement de la Finance' : 'Chargement des Rapports'}>
    <div className={styles.loadingCrown}><span/><div><i/><i/><i/></div></div>
    <div className={styles.loadingRail}>{Array.from({length:6},(_,i)=><span key={i}/>)}</div>
    <div className={styles.loadingGrid}>{Array.from({length:domain==='finance'?8:6},(_,i)=><div key={i}><span/><i/><i/></div>)}</div>
    <p>{domain === 'finance' ? 'Lecture des registres financiers autorisés…' : 'Lecture du catalogue et des demandes de rapports…'}</p>
  </div>
}
