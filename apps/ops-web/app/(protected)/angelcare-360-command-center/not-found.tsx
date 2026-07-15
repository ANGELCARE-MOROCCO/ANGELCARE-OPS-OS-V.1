import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export default function Angelcare360CommandCenterNotFound() {
  return (
    <Angelcare360EmptyState
      title="Cette section n’existe pas encore"
      description="La section demandée n’est pas disponible dans ce périmètre."
      actionLabel="Retour au cockpit"
      actionHref="/angelcare-360-command-center"
    />
  )
}
