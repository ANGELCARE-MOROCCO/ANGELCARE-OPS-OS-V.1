"use client"

import { useEffect } from 'react'
import styles from '@/angelcare-marketplace/design-system/marketplace.module.css'
import { Button, ButtonLink, StatePanel } from '@/angelcare-marketplace/design-system/ui'

export default function MarketplaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('ANGELCARE Marketplace route error', error.digest || error.name)
  }, [error])

  return (
    <div className={styles.scope}>
      <div className={styles.publicMain}>
        <StatePanel
          type="error"
          title="La route n’a pas pu être chargée"
          text="Aucun détail technique sensible n’est exposé. Réessayez, puis utilisez la préparation de fondation ou le support interne si le blocage persiste."
          actions={
            <>
              <Button type="button" onClick={reset}>Réessayer</Button>
              <ButtonLink href="/angelcare-marketplace" variant="secondary">Retour à l’entrée publique</ButtonLink>
            </>
          }
        />
      </div>
    </div>
  )
}
