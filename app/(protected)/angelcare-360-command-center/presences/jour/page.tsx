import { redirect } from 'next/navigation'
import { ANGELCARE360_ATTENDANCE_NAVIGATION } from '@/data/angelcare360/attendance-navigation'
import Angelcare360AttendancePageShell from '@/components/angelcare360/attendance/Angelcare360AttendancePageShell'
import Angelcare360DailyAttendanceBoard from '@/components/angelcare360/attendance/Angelcare360DailyAttendanceBoard'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { getAngelcare360DailyAttendanceState } from '@/lib/angelcare360/server/attendance'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

export default async function Angelcare360AttendanceDayPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string }>
}) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const params = (await searchParams) || {}
  const dayState = await getAngelcare360DailyAttendanceState({ schoolId: context.school.id, date: params.date || null })
  if (!dayState) {
    return (
      <Angelcare360EmptyState
        title="Présence du jour indisponible"
        description="Aucun établissement actif n’a pu être résolu pour ouvrir la présence du jour."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  return (
    <Angelcare360AttendancePageShell
      title="Présence du jour"
      subtitle="Ouverture des sessions quotidiennes, complétude des feuilles et suivi des écarts du jour."
      badge="Phase 6"
      statusLabel={`${dayState.totalCompletionRate}% de complétude`}
      contextRow={
        <>
          <Badge label={`Date: ${dayState.selectedDate}`} />
          <Badge label={`Établissement: ${dayState.activeSchoolName || '—'}`} />
          <Badge label={`Année: ${dayState.activeAcademicYearLabel || 'Non résolue'}`} />
        </>
      }
      navigationItems={ANGELCARE360_ATTENDANCE_NAVIGATION}
    >
      <Angelcare360DailyAttendanceBoard
        schoolId={context.school.id}
        academicYearId={context.academicYear?.id || ''}
        dayState={dayState}
        canCreateSession={context.permissions.has('presences.create') || context.access.accessLevel === 'super_admin'}
        canApproveSession={context.permissions.has('presences.approve') || context.access.accessLevel === 'super_admin'}
      />
    </Angelcare360AttendancePageShell>
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
