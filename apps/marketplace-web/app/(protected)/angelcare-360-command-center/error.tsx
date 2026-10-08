'use client'

import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'

export default function Angelcare360CommandCenterError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={pageStyle}>
      <Angelcare360ErrorState
        title="L’accueil SANILA n’a pas pu être chargé"
        description="Nous n’avons pas pu afficher cet espace pour le moment. Vos données restent inchangées. Réessayez dans quelques instants."
        actionLabel="Retour à l’accueil"
        actionHref="/angelcare-360-command-center"
        onRetry={reset}
      />
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
}
