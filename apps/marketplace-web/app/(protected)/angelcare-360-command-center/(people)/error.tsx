'use client'

import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'

export default function Angelcare360PeopleError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <Angelcare360ErrorState
      title="La section personnes est indisponible"
      description="Les dossiers ne peuvent pas être affichés pour le moment. Aucune information n’a été modifiée. Réessayez dans quelques instants."
      actionLabel="Réessayer"
      actionHref="/angelcare-360-command-center/personnes"
      onRetry={reset}
    />
  )
}
