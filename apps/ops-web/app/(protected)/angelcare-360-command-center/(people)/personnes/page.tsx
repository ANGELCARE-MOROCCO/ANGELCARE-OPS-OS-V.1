import { redirect } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { getAngelcare360PeopleOverview } from '@/lib/angelcare360/server/people'
import Angelcare360PeopleOverviewWorkspace from '@/components/angelcare360/people/Angelcare360PeopleOverviewWorkspace'

export const dynamic = 'force-dynamic'

export default async function Angelcare360PeopleOverviewPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  if (!context.access.canSeePeopleData && context.access.accessLevel !== 'super_admin' && !context.permissions.has('eleves.view')) {
    return (
      <Angelcare360ErrorState
        title="Accès aux personnes verrouillé"
        description="Votre rôle ne permet pas encore d’accéder au cockpit des dossiers humains."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  const overview = await getAngelcare360PeopleOverview({ schoolId: context.school.id })
  if (!overview) {
    return (
      <Angelcare360ErrorState
        title="Vue d’ensemble indisponible"
        description="Aucun établissement actif n’a pu être résolu pour alimenter le cockpit des personnes."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  return <Angelcare360PeopleOverviewWorkspace overview={overview} />
}

