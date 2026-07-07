import { redirect } from 'next/navigation'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import Angelcare360AdminAuditExplorer from '@/components/angelcare360/administration/Angelcare360AdminAuditExplorer'
import { getAngelcare360AdministrationContext, listAngelcare360AdminAuditEvents } from '@/lib/angelcare360/server'

export const dynamic = 'force-dynamic'

export default async function Angelcare360AuditPage() {
  const state = await getAngelcare360AdministrationContext()
  if (!state?.context?.school || !state.overview) redirect('/angelcare-360-command-center/administration')

  const events = await listAngelcare360AdminAuditEvents({ schoolId: state.context.school.id })
  const moduleOptions = Array.from(new Set(events.map((event) => event.module).filter(Boolean))).map((value) => ({ label: String(value), value: String(value) }))
  const actionOptions = Array.from(new Set(events.map((event) => event.action).filter(Boolean))).map((value) => ({ label: String(value), value: String(value) }))
  const severityOptions = Array.from(new Set(events.map((event) => event.severity).filter(Boolean))).map((value) => ({ label: String(value), value: String(value) }))

  return (
    <Angelcare360AdminAuditExplorer
      title="Audit administration"
      subtitle="Journal des mutations, actions critiques et événements sensibles du setup."
      badge="Sécurité"
      contextRow={(
        <Angelcare360AdministrationContextRow
          items={[
            { label: 'Établissement actif', value: state.overview.currentSchool?.name || state.context.school.name },
            { label: 'Année active', value: state.overview.currentAcademicYear?.label || 'Non définie' },
            { label: 'Événements', value: String(events.length) },
          ]}
        />
      )}
      events={events}
      moduleOptions={moduleOptions}
      actionOptions={actionOptions}
      severityOptions={severityOptions}
      disabledExportReason="L’export d’audit sera activé après la phase de conformité et de formats PDF."
    />
  )
}

