'use client'

import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Angelcare360ErrorState
      title="Impossible d’afficher les admissions"
      description="Les admissions ne peuvent pas être affichées pour le moment. Aucun dossier n’a été modifié. Réessayez dans quelques instants."
      actionLabel="Réessayer"
      actionHref="/angelcare-360-command-center/admissions"
      onRetry={reset}
    />
  )
}
