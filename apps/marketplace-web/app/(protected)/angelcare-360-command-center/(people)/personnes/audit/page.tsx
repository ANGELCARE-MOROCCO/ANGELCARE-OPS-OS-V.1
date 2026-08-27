import { redirect } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import Angelcare360PeopleAuditWorkspace from '@/components/angelcare360/people/Angelcare360PeopleAuditWorkspace'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360PeopleAuditEvents } from '@/lib/angelcare360/server/people'
import { createPeopleAuditConfig } from '@/data/angelcare360/people-pages'

export const dynamic = 'force-dynamic'

export default async function Angelcare360PeopleAuditPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  if (!context.access.canSeePeopleData && !context.permissions.has('audit.view') && context.access.accessLevel !== 'super_admin') {
    return (
      <Angelcare360ErrorState
        title="Accès à l’audit verrouillé"
        description="Votre rôle ne permet pas encore de consulter les événements d’audit personnes."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  const events = await listAngelcare360PeopleAuditEvents()
  const config = createPeopleAuditConfig()

  const contextRow = (
    <Angelcare360AdministrationContextRow
      items={[
        { label: 'Établissement', value: context.school.name },
        { label: 'Année active', value: context.academicYear?.label || 'Non définie' },
        { label: 'Événements', value: String(events.length) },
        { label: 'Dernier', value: events[0] ? new Date(events[0].created_at).toLocaleString('fr-FR') : 'Aucun événement' },
      ]}
    />
  )

  return <Angelcare360PeopleAuditWorkspace config={config} events={events} contextRow={contextRow} />
}
