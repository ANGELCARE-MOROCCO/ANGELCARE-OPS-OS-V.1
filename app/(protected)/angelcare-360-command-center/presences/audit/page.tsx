import { redirect } from 'next/navigation'
import { ANGELCARE360_ATTENDANCE_NAVIGATION } from '@/data/angelcare360/attendance-navigation'
import Angelcare360AttendancePageShell from '@/components/angelcare360/attendance/Angelcare360AttendancePageShell'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360AttendanceAuditEvents } from '@/lib/angelcare360/server/attendance'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

export default async function Angelcare360AttendanceAuditPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const events = await listAngelcare360AttendanceAuditEvents({ schoolId: context.school.id, filters: { module: 'attendance' } })

  return (
    <Angelcare360AttendancePageShell
      title="Audit présences"
      subtitle="Traçabilité des sessions, saisies, justifications et conflits du quotidien."
      badge="Disponible"
      statusLabel={`${events.length} événement(s)`}
      contextRow={
        <>
          <Badge label={`Établissement: ${context.school.name}`} />
          <Badge label={`Année: ${context.academicYear?.label || 'Non résolue'}`} />
        </>
      }
      navigationItems={ANGELCARE360_ATTENDANCE_NAVIGATION}
    >
      {events.length === 0 ? (
        <Angelcare360EmptyState
          title="Aucun audit de présence"
          description="Les opérations de présence apparaîtront ici après les premières opérations."
        />
      ) : (
        <section style={tableShellStyle}>
          <div style={tableHeaderStyle}>
            <div>Date</div>
            <div>Module</div>
            <div>Action</div>
            <div>Entité</div>
            <div>Sévérité</div>
          </div>
          {events.map((event) => (
            <div key={event.id} style={tableRowStyle}>
              <div style={cellStrongStyle}>{event.created_at}</div>
              <div style={cellStrongStyle}>{event.module}</div>
              <div style={cellStrongStyle}>{event.action}</div>
              <div style={cellStrongStyle}>{event.entity_type || '—'}</div>
              <div style={cellStrongStyle}>{event.severity}</div>
            </div>
          ))}
        </section>
      )}
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

const tableShellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
}

const tableHeaderStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.2fr 1fr 1fr 1fr 0.7fr',
  gap: 10,
  padding: '0 8px',
  color: '#64748b',
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
}

const tableRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.2fr 1fr 1fr 1fr 0.7fr',
  gap: 10,
  padding: 12,
  borderRadius: 18,
  border: '1px solid #dbe4ef',
  background: '#fff',
  alignItems: 'start',
}

const cellStrongStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 800,
}
