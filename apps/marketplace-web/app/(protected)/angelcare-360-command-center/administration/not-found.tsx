import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export default function Angelcare360AdministrationNotFound() {
  return (
    <Angelcare360EmptyState
      title="Section d’administration introuvable"
      description="La page demandée n’existe pas encore dans le périmètre d’administration du command center."
      actionLabel="Retour au hub"
      actionHref="/angelcare-360-command-center/administration"
    />
  )
}
