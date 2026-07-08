import { redirect } from 'next/navigation'
import { ANGELCARE360_ATTENDANCE_NAVIGATION } from '@/data/angelcare360/attendance-navigation'
import Angelcare360AttendancePageShell from '@/components/angelcare360/attendance/Angelcare360AttendancePageShell'
import Angelcare360ClassAttendanceSheet from '@/components/angelcare360/attendance/Angelcare360ClassAttendanceSheet'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360ClassAttendanceSheet } from '@/lib/angelcare360/server/attendance'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

export default async function Angelcare360AttendanceClassDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ date?: string; sectionId?: string }>
}) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const resolvedParams = await params
  const resolvedSearch = (await searchParams) || {}
  const date = resolvedSearch.date || new Date().toISOString().slice(0, 10)
  const sheet = await listAngelcare360ClassAttendanceSheet({
    schoolId: context.school.id,
    classId: resolvedParams.id,
    date,
    sectionId: resolvedSearch.sectionId || null,
  })

  if (!sheet) {
    return (
      <Angelcare360EmptyState
        title="Feuille de classe indisponible"
        description="La feuille de présence demandée n’a pas pu être résolue."
        actionLabel="Retour aux classes"
        actionHref="/angelcare-360-command-center/presences/classes"
      />
    )
  }

  return (
    <Angelcare360AttendancePageShell
      title="Feuille de classe"
      subtitle="Saisie opérationnelle des présences, retards et justifications pour cette classe."
      badge="Disponible"
      statusLabel={sheet.isClosed ? 'Session clôturée' : 'Session ouverte ou à ouvrir'}
      contextRow={
        <>
          <Badge label={`Date: ${date}`} />
          <Badge label={`Classe: ${sheet.session?.class_name || resolvedParams.id}`} />
          <Badge label={`Complétude: ${sheet.completionRate}%`} />
        </>
      }
      navigationItems={ANGELCARE360_ATTENDANCE_NAVIGATION}
    >
      <Angelcare360ClassAttendanceSheet
        schoolId={context.school.id}
        classId={resolvedParams.id}
        date={date}
        sheet={sheet}
        canUpdate={context.permissions.has('presences.update') || context.access.accessLevel === 'super_admin'}
        canApprove={context.permissions.has('presences.approve') || context.access.accessLevel === 'super_admin'}
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
