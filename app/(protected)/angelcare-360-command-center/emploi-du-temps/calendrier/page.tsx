import { redirect } from 'next/navigation'
import { ANGELCARE360_TIMETABLE_NAVIGATION } from '@/data/angelcare360/timetable-navigation'
import Angelcare360TimetablePageShell from '@/components/angelcare360/timetable/Angelcare360TimetablePageShell'
import Angelcare360TimetableWorkspace from '@/components/angelcare360/timetable/Angelcare360TimetableWorkspace'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360SchoolCalendarEvents, listAngelcare360TimetableSlots } from '@/lib/angelcare360/server/timetable'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

export default async function Angelcare360SchoolCalendarPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const [slots, events] = await Promise.all([
    listAngelcare360TimetableSlots({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null }),
    listAngelcare360SchoolCalendarEvents({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null }),
  ])

  return (
    <Angelcare360TimetablePageShell
      title="Calendrier scolaire"
      subtitle="Évènements, congés, activités et repères scolaires à jour."
      badge="Disponible"
      statusLabel={`${events.length} évènement(s)`}
      contextRow={<Badge label={`Établissement: ${context.school.name}`} />}
      navigationItems={ANGELCARE360_TIMETABLE_NAVIGATION}
    >
      {events.length === 0 ? (
        <Angelcare360EmptyState title="Aucun évènement" description="Le calendrier scolaire ne contient encore aucun évènement planifié." />
      ) : null}
      <Angelcare360TimetableWorkspace
        schoolId={context.school.id}
        academicYearId={context.academicYear?.id || ''}
        slots={slots}
        events={events}
        canCreate={context.permissions.has('emploi_du_temps.create') || context.access.accessLevel === 'super_admin'}
        canUpdate={context.permissions.has('emploi_du_temps.update') || context.access.accessLevel === 'super_admin'}
      />
    </Angelcare360TimetablePageShell>
  )
}

function Badge({ label }: { label: string }) {
  return <span style={badgeStyle}>{label}</span>
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '6px 10px',
  background: '#eff6ff',
  color: '#1e40af',
  fontSize: 12,
  fontWeight: 900,
}
