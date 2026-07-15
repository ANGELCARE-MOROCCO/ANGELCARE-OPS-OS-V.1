'use client'

import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'

export default function Angelcare360AdministrationError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <Angelcare360ErrorState
      title="Le plan d’administration n’a pas pu être chargé"
      description={error.message || 'Une erreur contrôlée a interrompu le rendu de la section Administration.'}
      actionLabel="Retour à l’administration"
      actionHref="/angelcare-360-command-center/administration"
      onRetry={reset}
    />
  )
}

