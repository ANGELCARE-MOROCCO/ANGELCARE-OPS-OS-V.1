import { redirect } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import Angelcare360PeopleHub from '@/components/angelcare360/people/Angelcare360PeopleHub'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360EmergencyContacts } from '@/lib/angelcare360/server/people'
import { createEmergencyContactPeopleConfig } from '@/data/angelcare360/people-pages'

export const dynamic = 'force-dynamic'

export default async function Angelcare360EmergencyContactsPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  if (
    !context.access.canSeePeopleData &&
    !context.permissions.has('eleves.view') &&
    !context.permissions.has('personnel.view') &&
    context.access.accessLevel !== 'super_admin'
  ) {
    return (
      <Angelcare360ErrorState
        title="Accès aux contacts d’urgence verrouillé"
        description="Votre rôle ne permet pas encore de gérer les contacts d’urgence."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  const contacts = await listAngelcare360EmergencyContacts({ schoolId: context.school.id })
  const config = createEmergencyContactPeopleConfig({ schoolId: context.school.id })
  const canCreate = context.access.accessLevel === 'super_admin' || context.permissions.has('eleves.update') || context.permissions.has('personnel.update')
  const canUpdate = canCreate

  const contextRow = (
    <Angelcare360AdministrationContextRow
      items={[
        { label: 'Établissement', value: context.school.name },
        { label: 'Année active', value: context.academicYear?.label || 'Non définie' },
        { label: 'Contacts', value: String(contacts.length) },
        { label: 'Liés aux élèves', value: String(contacts.filter((row) => row.contactable_type === 'student').length) },
      ]}
    />
  )

  return (
    <Angelcare360PeopleHub
      config={config}
      rows={contacts as Array<Record<string, unknown>>}
      contextRow={contextRow}
      canCreate={canCreate}
      canUpdate={canUpdate}
      createDisabledReason="La création d’un contact d’urgence est réservée aux rôles autorisés."
      updateDisabledReason="La modification d’un contact d’urgence est réservée aux rôles autorisés."
    />
  )
}
