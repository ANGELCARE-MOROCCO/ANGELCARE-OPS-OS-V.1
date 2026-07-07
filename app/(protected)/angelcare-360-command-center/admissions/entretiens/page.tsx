import { redirect } from 'next/navigation'
import Angelcare360AdmissionsFollowUpsWorkspace from '@/components/angelcare360/admissions/Angelcare360AdmissionsFollowUpsWorkspace'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import { getAngelcare360AccessContext, listAngelcare360AdmissionFollowUps } from '@/lib/angelcare360/server'

export const dynamic = 'force-dynamic'

export default async function Angelcare360AdmissionsFollowUpsPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center/admissions')

  const items = await listAngelcare360AdmissionFollowUps({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null })

  return (
    <Angelcare360AdmissionsFollowUpsWorkspace
      contextRow={(
        <Angelcare360AdministrationContextRow
          items={[
            { label: 'Établissement actif', value: context.school.name },
            { label: 'Année active', value: context.academicYear?.label || 'Non définie' },
            { label: 'Suivis', value: String(items.length) },
          ]}
        />
      )}
      title="Entretiens / suivis"
      subtitle="Prochaines actions, retards et rappels sur les demandes comme sur les dossiers."
      items={items.map((item) => ({
        id: String(item.id),
        kind: item.kind as 'lead' | 'application',
        title: String(item.title || 'Sans titre'),
        subtitle: String(item.subtitle || ''),
        next_action: item.next_action ? String(item.next_action) : null,
        next_action_at: item.next_action_at ? String(item.next_action_at) : null,
        responsible_staff_name: item.responsible_staff_name ? String(item.responsible_staff_name) : null,
        status: item.status ? String(item.status) : null,
        detail_href: String(item.detail_href || '#'),
      }))}
      schoolId={context.school.id}
      canUpdate={context.permissions.has('admissions.update') || context.access.accessLevel === 'super_admin'}
      disabledReason="Vous n’avez pas la permission de modifier les suivis d’admission."
    />
  )
}
