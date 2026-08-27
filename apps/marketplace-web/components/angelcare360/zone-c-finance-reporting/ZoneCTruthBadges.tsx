import ZoneCIcon from './ZoneCIcon'
import styles from './ZoneCFrame.module.css'

export function ZoneCTruthBadges({ domain }: { domain: 'finance' | 'reports' }) {
  const badges = domain === 'finance'
    ? [
        ['shield','Registres financiers réels','active'],
        ['shield','FACTURE ≠ PAIEMENT','governed'],
        ['shield','PAIEMENT ≠ AFFECTATION','governed'],
        ['shield','REÇU ≠ PDF','governed'],
        ['lock','PDF non activé','locked'],
        ['lock','Paiement en ligne non activé','locked'],
        ['shield','Relances : orchestration sans faux envoi','governed'],
      ] as const
    : [
        ['shield','Définitions & demandes réelles','active'],
        ['shield','DEMANDE ≠ RAPPORT GÉNÉRÉ','governed'],
        ['lock','Aucun fichier simulé','locked'],
        ['lock','Aucune progression fictive','locked'],
        ['shield','Readiness issue du backend','governed'],
      ] as const

  return <div className={styles.truthBadges} aria-label="Capacités et garde-fous Zone C">
    {badges.map(([icon,label,tone]) => <div className={styles.truthBadge} data-tone={tone} key={label}><ZoneCIcon name={icon} className={styles.truthBadgeIcon}/><span>{label}</span></div>)}
  </div>
}
