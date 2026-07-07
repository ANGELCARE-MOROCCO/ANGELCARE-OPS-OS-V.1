import { redirect } from 'next/navigation'
import Angelcare360AdmissionsAuditWorkspace from '@/components/angelcare360/admissions/Angelcare360AdmissionsAuditWorkspace'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import { getAngelcare360AccessContext, listAngelcare360AdmissionsAuditEvents } from '@/lib/angelcare360/server'

export const dynamic = 'force-dynamic'

export default async function Angelcare360AdmissionsAuditPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center/admissions')

  const events = await listAngelcare360AdmissionsAuditEvents({ schoolId: context.school.id, filter: { module: 'admissions' } })

  return (
    <Angelcare360AdmissionsAuditWorkspace
      contextRow={(
        <Angelcare360AdministrationContextRow
          items={[
            { label: 'Établissement actif', value: context.school.name },
            { label: 'Année active', value: context.academicYear?.label || 'Non définie' },
            { label: 'Événements', value: String(events.length) },
          ]}
        />
      )}
      title="Audit admissions"
      subtitle="Traçabilité des mutations, décisions et conversions du module Admissions."
      events={events}
    />
  )
}
