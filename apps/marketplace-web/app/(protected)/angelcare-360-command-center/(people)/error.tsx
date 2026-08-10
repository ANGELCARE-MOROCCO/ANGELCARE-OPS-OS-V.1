'use client'

import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'

export default function Angelcare360PeopleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <Angelcare360ErrorState
      title="La section personnes est indisponible"
      description={error.message || 'Une erreur a empêché le chargement des dossiers humains.'}
      actionLabel="Réessayer"
      onRetry={reset}
    />
  )
}
