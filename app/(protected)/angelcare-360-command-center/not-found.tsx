import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export default function Angelcare360CommandCenterNotFound() {
  return (
    <Angelcare360EmptyState
      title="Cette section n’existe pas encore"
      description="La route demandée n’est pas disponible dans la phase 1 du command center."
      actionLabel="Retour au cockpit"
      actionHref="/angelcare-360-command-center"
    />
  )
}
