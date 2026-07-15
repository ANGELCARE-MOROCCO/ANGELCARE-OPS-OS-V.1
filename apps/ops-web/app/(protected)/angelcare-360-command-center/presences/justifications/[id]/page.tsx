import { redirect } from 'next/navigation'
import { ANGELCARE360_ATTENDANCE_NAVIGATION } from '@/data/angelcare360/attendance-navigation'
import Angelcare360AttendancePageShell from '@/components/angelcare360/attendance/Angelcare360AttendancePageShell'
import Angelcare360JustificationsWorkspace from '@/components/angelcare360/attendance/Angelcare360JustificationsWorkspace'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360AttendanceJustifications } from '@/lib/angelcare360/server/attendance'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

export default async function Angelcare360AttendanceJustificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const resolvedParams = await params
  const items = await listAngelcare360AttendanceJustifications({ schoolId: context.school.id })
  const selected = items.find((item) => item.id === resolvedParams.id) || null

  if (!selected) {
    return (
      <Angelcare360EmptyState
        title="Justificatif introuvable"
        description="Le justificatif demandé n’a pas pu être retrouvé."
        actionLabel="Retour aux justifications"
        actionHref="/angelcare-360-command-center/presences/justifications"
      />
    )
  }

  return (
    <Angelcare360AttendancePageShell
      title="Justification"
      subtitle="Détail et traitement du justificatif sélectionné."
      badge="Disponible"
      statusLabel={selected.status}
      contextRow={
        <>
          <Badge label={`Élève: ${selected.student_full_name || '—'}`} />
          <Badge label={`Décision: ${selected.decision}`} />
        </>
      }
      navigationItems={ANGELCARE360_ATTENDANCE_NAVIGATION}
    >
      <Angelcare360JustificationsWorkspace
        schoolId={context.school.id}
        items={items}
        selectedId={resolvedParams.id}
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
