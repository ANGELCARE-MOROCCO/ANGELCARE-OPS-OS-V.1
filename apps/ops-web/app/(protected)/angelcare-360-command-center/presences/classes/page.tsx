import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ANGELCARE360_ATTENDANCE_NAVIGATION } from '@/data/angelcare360/attendance-navigation'
import Angelcare360AttendancePageShell from '@/components/angelcare360/attendance/Angelcare360AttendancePageShell'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360AttendanceDayClasses } from '@/lib/angelcare360/server/attendance'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

export default async function Angelcare360AttendanceClassesPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string }>
}) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const query = (await searchParams) || {}
  const date = query.date || new Date().toISOString().slice(0, 10)
  const rows = await listAngelcare360AttendanceDayClasses({ schoolId: context.school.id, date })

  return (
    <Angelcare360AttendancePageShell
      title="Feuilles par classe"
      subtitle="Vue structurée des classes, des feuilles ouvertes et du niveau de complétude pour la date sélectionnée."
      badge="Disponible"
      statusLabel={`${rows.length} classe(s) affichée(s)`}
      contextRow={
        <>
          <Badge label={`Date: ${date}`} />
          <Badge label={`Établissement: ${context.school.name}`} />
          <Badge label={`Année: ${context.academicYear?.label || 'Non résolue'}`} />
        </>
      }
      navigationItems={ANGELCARE360_ATTENDANCE_NAVIGATION}
    >
      <section style={toolbarStyle}>
        <Link href="/angelcare-360-command-center/presences/jour" style={toolbarLinkStyle}>
          Ouvrir la présence du jour
        </Link>
        <Link href="/angelcare-360-command-center/presences/eleves" style={toolbarLinkStyle}>
          Voir la présence par élève
        </Link>
      </section>

      {rows.length === 0 ? (
        <Angelcare360EmptyState
          title="Aucune feuille de classe"
          description="Aucune classe n’est disponible pour la date sélectionnée."
          actionLabel="Retour à la présence du jour"
          actionHref="/angelcare-360-command-center/presences/jour"
        />
      ) : (
        <section style={tableShellStyle}>
          <div style={tableHeaderStyle}>
            <div>Classe</div>
            <div>Session</div>
            <div>Attendus</div>
            <div>Marqués</div>
            <div>Complétude</div>
            <div>Action</div>
          </div>
          {rows.map((row) => (
            <div key={`${row.classId}-${row.sectionId || 'all'}`} style={tableRowStyle}>
              {(() => {
                const isClosed = ['closed', 'completed', 'locked'].includes(String(row.sessionStatus || '').toLowerCase())
                return (
                  <>
              <div style={cellStrongStyle}>
                {row.className}
                <div style={cellMutedStyle}>{row.sectionName || 'Section non précisée'}</div>
              </div>
              <div style={cellStrongStyle}>{row.hasSession ? (isClosed ? 'Clôturée' : 'Ouverte') : 'Manquante'}</div>
              <div style={cellStrongStyle}>{row.expectedStudents}</div>
              <div style={cellStrongStyle}>{row.markedStudents}</div>
              <div style={cellStrongStyle}>{row.completionRate}%</div>
              <div>
                <Link href={`/angelcare-360-command-center/presences/classes/${row.classId}?date=${date}${row.sectionId ? `&sectionId=${row.sectionId}` : ''}`} style={rowLinkStyle}>
                  Ouvrir la feuille
                </Link>
              </div>
                  </>
                )
              })()}
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

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const toolbarLinkStyle: React.CSSProperties = {
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

const tableShellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
}

const tableHeaderStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
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
  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
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

const cellMutedStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 600,
}

const rowLinkStyle: React.CSSProperties = {
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
