import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'

export default function NotFound() {
  return (
    <Angelcare360ErrorState
      title="Espace opérateur introuvable"
      description="Vérifiez vos droits opérateur ou le lien demandé."
      actionLabel="Retourner au cockpit"
      actionHref="/angelcare-360-operator"
    />
  )
}
