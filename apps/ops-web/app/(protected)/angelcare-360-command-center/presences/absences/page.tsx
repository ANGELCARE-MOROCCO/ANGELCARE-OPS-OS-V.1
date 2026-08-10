import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ANGELCARE360_ATTENDANCE_NAVIGATION } from '@/data/angelcare360/attendance-navigation'
import Angelcare360AttendancePageShell from '@/components/angelcare360/attendance/Angelcare360AttendancePageShell'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360AbsenceRecords } from '@/lib/angelcare360/server/attendance'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

export default async function Angelcare360AttendanceAbsencesPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; classId?: string; studentId?: string; from?: string; to?: string }>
}) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const query = (await searchParams) || {}
  const rows = await listAngelcare360AbsenceRecords({
    schoolId: context.school.id,
    classId: query.classId || null,
    studentId: query.studentId || null,
    from: query.from || null,
    to: query.to || null,
  })

  if (!Array.isArray(rows)) {
    return (
      <Angelcare360EmptyState
        title="Absences indisponibles"
        description="La liste des absences n’a pas pu être chargée."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center/presences"
      />
    )
  }

  return (
    <Angelcare360AttendancePageShell
      title="Absences"
      subtitle="Registre des absences avec visibilité immédiate sur l’état des justifications."
      badge="Disponible"
      statusLabel={`${rows.length} absence(s)`}
      contextRow={
        <>
          <Badge label={`Établissement: ${context.school.name}`} />
          <Badge label={`Année: ${context.academicYear?.label || 'Non résolue'}`} />
        </>
      }
      navigationItems={ANGELCARE360_ATTENDANCE_NAVIGATION}
    >
      <form style={toolbarStyle} method="get">
        <input name="from" type="date" defaultValue={query.from || ''} style={searchStyle} />
        <input name="to" type="date" defaultValue={query.to || ''} style={searchStyle} />
        <input name="classId" defaultValue={query.classId || ''} placeholder="ID classe" style={searchStyle} />
        <input name="studentId" defaultValue={query.studentId || ''} placeholder="ID élève" style={searchStyle} />
        <button type="submit" style={primaryButtonStyle}>
          Filtrer
        </button>
        <Link href="/angelcare-360-command-center/presences/absences" style={secondaryButtonStyle}>
          Réinitialiser
        </Link>
      </form>

      {rows.length === 0 ? (
        <Angelcare360EmptyState
          title="Aucune absence"
          description="Aucune absence ne correspond aux filtres sélectionnés."
          actionLabel="Réinitialiser"
          actionHref="/angelcare-360-command-center/presences/absences"
        />
      ) : (
        <section style={tableShellStyle}>
          <div style={tableHeaderStyle}>
            <div>Élève</div>
            <div>Classe</div>
            <div>Date</div>
            <div>Minutes</div>
            <div>Justification</div>
            <div>Action</div>
          </div>
          {rows.map((row) => (
            <div key={row.id} style={tableRowStyle}>
              <div style={cellStrongStyle}>
                {row.student_full_name || '—'}
                <div style={cellMutedStyle}>{row.student_code || '—'}</div>
              </div>
              <div style={cellStrongStyle}>
                {row.class_name || '—'}
                <div style={cellMutedStyle}>{row.section_name || '—'}</div>
              </div>
              <div style={cellStrongStyle}>{row.session_date || '—'}</div>
              <div style={cellStrongStyle}>{row.minutes_late ?? 0}</div>
              <div style={cellStrongStyle}>{row.justification_status || 'Aucune'}</div>
              <div>
                <Link href="/angelcare-360-command-center/presences/justifications" style={rowLinkStyle}>
                  Traiter
                </Link>
              </div>
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
  alignItems: 'center',
}

const searchStyle: React.CSSProperties = {
  minWidth: 160,
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  padding: '10px 12px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 700,
}

const primaryButtonStyle: React.CSSProperties = {
  border: '1px solid #0f172a',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 850,
  cursor: 'pointer',
}

const secondaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  border: '1px solid #cbd5e1',
  borderRadius: 14,
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
  gridTemplateColumns: '2fr 1.3fr 1fr 0.8fr 1fr 1fr',
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
  gridTemplateColumns: '2fr 1.3fr 1fr 0.8fr 1fr 1fr',
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
