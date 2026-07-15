import { redirect } from 'next/navigation'
import { ANGELCARE360_ATTENDANCE_NAVIGATION } from '@/data/angelcare360/attendance-navigation'
import Angelcare360AttendancePageShell from '@/components/angelcare360/attendance/Angelcare360AttendancePageShell'
import Angelcare360JustificationsWorkspace from '@/components/angelcare360/attendance/Angelcare360JustificationsWorkspace'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360AttendanceJustifications } from '@/lib/angelcare360/server/attendance'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

export default async function Angelcare360AttendanceJustificationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; search?: string }>
}) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const query = (await searchParams) || {}
  const items = await listAngelcare360AttendanceJustifications({
    schoolId: context.school.id,
    status: query.status || null,
    search: query.search || null,
  })

  if (!Array.isArray(items)) {
    return (
      <Angelcare360EmptyState
        title="Justifications indisponibles"
        description="La liste des justificatifs n’a pas pu être chargée."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center/presences"
      />
    )
  }

  return (
    <Angelcare360AttendancePageShell
      title="Justifications"
      subtitle="Saisie et décision des justificatifs d’absences et de retards."
      badge="Disponible"
      statusLabel={`${items.length} justificatif(s)`}
      contextRow={
        <>
          <Badge label={`Établissement: ${context.school.name}`} />
          <Badge label={`Année: ${context.academicYear?.label || 'Non résolue'}`} />
        </>
      }
      navigationItems={ANGELCARE360_ATTENDANCE_NAVIGATION}
    >
      <Angelcare360JustificationsWorkspace
        schoolId={context.school.id}
        items={items}
        canCreate={context.permissions.has('presences.update') || context.access.accessLevel === 'super_admin'}
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
