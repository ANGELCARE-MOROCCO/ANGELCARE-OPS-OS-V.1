'use client'

import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'

export default function Error({ reset }: { reset: () => void }) {
  return (
    <Angelcare360ErrorState
      title="Vue Emploi du temps indisponible"
      description="Une erreur contrôlée a empêché le chargement de l’emploi du temps."
      onRetry={reset}
    />
  )
}
