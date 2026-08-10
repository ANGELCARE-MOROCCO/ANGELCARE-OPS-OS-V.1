'use client'

import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Angelcare360ErrorState
      title="Impossible d’afficher les admissions"
      description={error.message || 'Une erreur est survenue pendant le chargement du module admissions.'}
      actionLabel="Réessayer"
      onRetry={reset}
    />
  )
}
