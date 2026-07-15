import { redirect } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import Angelcare360PeopleHub from '@/components/angelcare360/people/Angelcare360PeopleHub'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360Documents } from '@/lib/angelcare360/server/people'
import { createDocumentPeopleConfig } from '@/data/angelcare360/people-pages'

export const dynamic = 'force-dynamic'

export default async function Angelcare360DocumentsPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  if (!context.access.canSeePeopleData && !context.permissions.has('documents.view') && context.access.accessLevel !== 'super_admin') {
    return (
      <Angelcare360ErrorState
        title="Accès aux documents verrouillé"
        description="Votre rôle ne permet pas encore d’accéder aux références documentaires."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  const documents = await listAngelcare360Documents({ schoolId: context.school.id })
  const config = createDocumentPeopleConfig({ schoolId: context.school.id })
  const canCreate = context.access.accessLevel === 'super_admin' || context.permissions.has('documents.create')
  const canUpdate = context.access.accessLevel === 'super_admin' || context.permissions.has('documents.update')

  const contextRow = (
    <Angelcare360AdministrationContextRow
      items={[
        { label: 'Établissement', value: context.school.name },
        { label: 'Année active', value: context.academicYear?.label || 'Non définie' },
        { label: 'Documents', value: String(documents.length) },
        { label: 'À compléter', value: String(documents.filter((row) => row.status === 'requis').length) },
      ]}
    />
  )

  return (
    <Angelcare360PeopleHub
      config={config}
      rows={documents as unknown as Array<Record<string, unknown>>}
      contextRow={contextRow}
      canCreate={canCreate}
      canUpdate={canUpdate}
      createDisabledReason="La création d’une référence documentaire est réservée aux rôles autorisés."
      updateDisabledReason="La modification d’une référence documentaire est réservée aux rôles autorisés."
      extraHeaderActions={
        <button
          type="button"
          disabled
          title="Le téléversement direct de fichiers reste verrouillé. Créez seulement des références documentaires."
          style={disabledButtonStyle}
        >
          Téléversement direct verrouillé
        </button>
      }
    />
  )
}

const disabledButtonStyle: React.CSSProperties = {
  border: '1px dashed #cbd5e1',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#f8fafc',
  color: '#94a3b8',
  fontWeight: 800,
  cursor: 'not-allowed',
}
