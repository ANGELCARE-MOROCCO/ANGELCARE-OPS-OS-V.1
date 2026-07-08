import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ANGELCARE360_TIMETABLE_NAVIGATION } from '@/data/angelcare360/timetable-navigation'
import Angelcare360TimetablePageShell from '@/components/angelcare360/timetable/Angelcare360TimetablePageShell'
import Angelcare360TimetableWorkspace from '@/components/angelcare360/timetable/Angelcare360TimetableWorkspace'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { getAngelcare360TimetableOverview, listAngelcare360SchoolCalendarEvents, listAngelcare360TimetableSlots } from '@/lib/angelcare360/server/timetable'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TimetablePage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const [overview, slots, events] = await Promise.all([
    getAngelcare360TimetableOverview({ schoolId: context.school.id }),
    listAngelcare360TimetableSlots({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null }),
    listAngelcare360SchoolCalendarEvents({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null }),
  ])

  if (!overview) {
    return (
      <Angelcare360EmptyState
        title="Emploi du temps indisponible"
        description="Aucun établissement actif n’a pu être résolu pour alimenter le planning."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  return (
    <Angelcare360TimetablePageShell
      title="Emploi du temps"
      subtitle="Planning hebdomadaire, conflits, créneaux et calendrier scolaire dans un même espace opérationnel."
      badge="Disponible"
      statusLabel={`${overview.slotCount} créneau(x)`}
      contextRow={
        <>
          <Badge label={`Établissement: ${context.school.name}`} />
          <Badge label={`Année: ${overview.activeAcademicYearLabel || 'Non résolue'}`} />
          <Badge label={`Conflits: ${overview.conflictCount}`} />
        </>
      }
      navigationItems={ANGELCARE360_TIMETABLE_NAVIGATION}
    >
      <section style={quickLinksStyle}>
        <Link href="/angelcare-360-command-center/emploi-du-temps/classes" style={quickLinkStyle}>
          Vue par classe
        </Link>
        <Link href="/angelcare-360-command-center/emploi-du-temps/enseignants" style={quickLinkStyle}>
          Vue par enseignant
        </Link>
        <Link href="/angelcare-360-command-center/emploi-du-temps/calendrier" style={quickLinkStyle}>
          Calendrier scolaire
        </Link>
      </section>

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

const quickLinksStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const quickLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  padding: '10px 14px',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 850,
}
