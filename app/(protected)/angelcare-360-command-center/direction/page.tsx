import { redirect } from 'next/navigation'
import Angelcare360DirectionCockpit from '@/components/angelcare360/direction/Angelcare360DirectionCockpit'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import { getAngelcare360DirectionCockpitData } from '@/lib/angelcare360/server/direction'

export const dynamic = 'force-dynamic'

export default async function Angelcare360DirectionPage() {
  const data = await getAngelcare360DirectionCockpitData()

  if (!data) {
    return (
      <Angelcare360EmptyState
        title="Cockpit de Direction indisponible"
        description="Aucun établissement actif n’a pu être résolu pour afficher la vue direction."
        actionLabel="Retour au command center"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  if (!data.school.id) redirect('/angelcare-360-command-center')

  return <Angelcare360DirectionCockpit data={data} />
}
