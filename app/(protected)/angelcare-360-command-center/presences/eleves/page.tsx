import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ANGELCARE360_ATTENDANCE_NAVIGATION } from '@/data/angelcare360/attendance-navigation'
import Angelcare360AttendancePageShell from '@/components/angelcare360/attendance/Angelcare360AttendancePageShell'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { getAngelcare360StudentAttendanceSummary } from '@/lib/angelcare360/server/attendance'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

export default async function Angelcare360AttendanceStudentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string; status?: string; classId?: string; sectionId?: string; from?: string; to?: string }>
}) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const params = (await searchParams) || {}
  const summary = await getAngelcare360StudentAttendanceSummary({
    schoolId: context.school.id,
    from: params.from || null,
    to: params.to || null,
  })
  if (!summary.ok) {
    return (
      <Angelcare360EmptyState
        title="Synthèse des élèves indisponible"
        description={summary.error || 'La synthèse des présences par élève est temporairement indisponible.'}
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center/presences"
      />
    )
  }

  if (!summary.record) {
    return (
      <Angelcare360EmptyState
        title="Synthèse des élèves vide"
        description="Aucune donnée exploitable n’est disponible pour la période sélectionnée."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center/presences"
      />
    )
  }

  const grouped = groupAttendanceRows(summary.record.rows as unknown as Array<Record<string, unknown>>, params)

  return (
    <Angelcare360AttendancePageShell
      title="Présence par élève"
      subtitle="Vue consolidée des présences, retards, absences et excusés pour chaque élève."
      badge="Phase 6"
      statusLabel={`${grouped.length} élève(s) affiché(s)`}
      contextRow={
        <>
          <Badge label={`Établissement: ${context.school.name}`} />
          <Badge label={`Année: ${context.academicYear?.label || 'Non résolue'}`} />
          <Badge label={`Période: ${params.from || 'Début'} → ${params.to || 'Aujourd’hui'}`} />
        </>
      }
      navigationItems={ANGELCARE360_ATTENDANCE_NAVIGATION}
    >
      <form style={toolbarStyle} method="get">
        <input name="search" defaultValue={params.search || ''} placeholder="Rechercher un élève" style={searchStyle} />
        <input name="from" type="date" defaultValue={params.from || ''} style={searchStyle} />
        <input name="to" type="date" defaultValue={params.to || ''} style={searchStyle} />
        <input name="status" defaultValue={params.status || ''} placeholder="Statut" style={searchStyle} />
        <input name="classId" defaultValue={params.classId || ''} placeholder="ID classe" style={searchStyle} />
        <input name="sectionId" defaultValue={params.sectionId || ''} placeholder="ID section" style={searchStyle} />
        <button type="submit" style={primaryButtonStyle}>
          Filtrer
        </button>
        <Link href="/angelcare-360-command-center/presences/eleves" style={secondaryButtonStyle}>
          Réinitialiser
        </Link>
      </form>

      {grouped.length === 0 ? (
        <Angelcare360EmptyState
          title="Aucune présence élève"
          description="Aucune ligne de présence ne correspond aux filtres sélectionnés."
          actionLabel="Réinitialiser"
          actionHref="/angelcare-360-command-center/presences/eleves"
        />
      ) : (
        <section style={tableShellStyle}>
          <div style={tableHeaderStyle}>
            <div>Élève</div>
            <div>Classe</div>
            <div>Présent</div>
            <div>Absent</div>
            <div>Retard</div>
            <div>Excusé</div>
            <div>Dossier</div>
          </div>
          {grouped.map((item) => (
            <div key={item.studentId} style={tableRowStyle}>
              <div style={cellStrongStyle}>
                {item.studentName}
                <div style={cellMutedStyle}>{item.studentCode || '—'}</div>
              </div>
              <div style={cellStrongStyle}>{item.classLabel}</div>
              <div style={cellStrongStyle}>{item.present}</div>
              <div style={cellStrongStyle}>{item.absent}</div>
              <div style={cellStrongStyle}>{item.late}</div>
              <div style={cellStrongStyle}>{item.excused}</div>
              <div>
                <Link href={`/angelcare-360-command-center/eleves/${item.studentId}`} style={rowLinkStyle}>
                  Ouvrir le dossier
                </Link>
              </div>
            </div>
          ))}
        </section>
      )}
    </Angelcare360AttendancePageShell>
  )
}

type GroupedAttendance = {
  studentId: string
  studentName: string
  studentCode: string | null
  classLabel: string
  present: number
  absent: number
  late: number
  excused: number
}

function groupAttendanceRows(rows: Array<Record<string, unknown>>, params: Record<string, string | undefined>) {
  const search = (params.search || '').trim().toLowerCase()
  const status = (params.status || '').trim().toLowerCase()
  const classId = (params.classId || '').trim()
  const sectionId = (params.sectionId || '').trim()
  const map = new Map<string, GroupedAttendance>()

  for (const row of rows) {
    const session = (row.session as Record<string, unknown> | undefined) || {}
    const sessionClass = session.class as Record<string, unknown> | undefined
    const sessionSection = session.section as Record<string, unknown> | undefined
    if (classId && String(session.class_id || '') !== classId) continue
    if (sectionId && String(session.section_id || '') !== sectionId) continue
    if (status && String(row.attendance_status || '').toLowerCase() !== status) continue

    const studentId = String(row.student_id || '')
    const studentName = String(row.student_full_name || '—')
    const studentCode = row.student_code ? String(row.student_code) : null
    const className = String(row.class_name || sessionClass?.name || '—')
    const sectionName = String(row.section_name || sessionSection?.name || '')
    const classLabel = sectionName ? `${className} · ${sectionName}` : className

    const current = map.get(studentId) || {
      studentId,
      studentName,
      studentCode,
      classLabel,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    }

    const attendanceStatus = String(row.attendance_status || '')
    if (attendanceStatus === 'present') current.present += 1
    if (attendanceStatus === 'absent') current.absent += 1
    if (attendanceStatus === 'late') current.late += 1
    if (attendanceStatus === 'excused' || attendanceStatus === 'justified') current.excused += 1
    map.set(studentId, current)

    if (search) {
      const haystack = `${studentName} ${studentCode || ''} ${classLabel}`.toLowerCase()
      if (!haystack.includes(search)) {
        map.delete(studentId)
      }
    }
  }

  return Array.from(map.values()).sort((left, right) => left.studentName.localeCompare(right.studentName, 'fr'))
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
  gridTemplateColumns: '2fr 1.4fr repeat(4, 0.7fr) 1fr',
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
  gridTemplateColumns: '2fr 1.4fr repeat(4, 0.7fr) 1fr',
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
