'use client'

import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'

export default function Angelcare360CommandCenterError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={pageStyle}>
      <Angelcare360ErrorState
        title="Le cockpit n’a pas pu être chargé"
        description={error.message || 'Une erreur contrôlée a interrompu le rendu du command center.'}
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
