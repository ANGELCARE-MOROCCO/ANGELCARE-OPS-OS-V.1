import { DatabaseZap } from 'lucide-react'

import { ButtonLink } from '../design-system/ui'
import styles from '../design-system/marketplace.module.css'

export function FoundationUnavailable({
  title = 'Fondation de données à activer',
  message = 'La migration additive Mega ZIP 01 n’est pas encore appliquée dans cet environnement. Le code reste protégé et aucune donnée artificielle ne remplace la persistance attendue.',
}: {
  title?: string
  message?: string
}) {
  return (
    <section className={styles.card}>
      <div>
        <div className={styles.errorState}>
          <div>
            <span className={styles.stateIcon}>
              <DatabaseZap size={26} />
            </span>

            <h2 className={styles.stateTitle}>{title}</h2>
            <p className={styles.stateText}>{message}</p>

            <div className={styles.stateActions}>
              <ButtonLink href="/angelcare-marketplace/admin/readiness">
                Voir les contrôles de préparation
              </ButtonLink>

              <ButtonLink
                href="/angelcare-marketplace"
                variant="secondary"
              >
                Retour à l’entrée publique
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
