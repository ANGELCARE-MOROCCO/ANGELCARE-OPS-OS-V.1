'use client'

import ZoneCIcon from './ZoneCIcon'
import styles from './ZoneCFrame.module.css'

export default function ZoneCErrorState({ domain, reset }: { domain: 'finance' | 'reports'; reset: () => void }) {
  return <section className={styles.errorState} role="alert">
    <span className={styles.errorIcon}><ZoneCIcon name="warning"/></span>
    <div><span>{domain === 'finance' ? 'FINANCE · CHARGEMENT INTERROMPU' : 'REPORTING · CHARGEMENT INTERROMPU'}</span><h2>{domain === 'finance' ? 'Impossible de charger cette vue financière.' : 'Impossible de charger cette vue de reporting.'}</h2><p>Les écritures existantes n’ont pas été modifiées. Réessayez la lecture ; si l’erreur persiste, revenez à la vue principale du module.</p><div><button type="button" onClick={reset}>Réessayer</button><a href={domain === 'finance' ? '/angelcare-360-command-center/finance' : '/angelcare-360-command-center/rapports'}>Revenir au cockpit</a></div></div>
  </section>
}
