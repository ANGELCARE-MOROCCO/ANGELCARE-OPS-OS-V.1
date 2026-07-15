'use client'

import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'

export default function ErrorState({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Angelcare360ErrorState
      title="Le backoffice opérateur n’a pas pu être chargé."
      description="Vérifiez votre accès opérateur ou réessayez dans quelques instants."
      actionLabel="Réessayer"
      onRetry={reset}
    />
  )
}
