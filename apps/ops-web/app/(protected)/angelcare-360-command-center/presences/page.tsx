import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ANGELCARE360_ATTENDANCE_NAVIGATION } from '@/data/angelcare360/attendance-navigation'
import Angelcare360AttendancePageShell from '@/components/angelcare360/attendance/Angelcare360AttendancePageShell'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { getAngelcare360AttendanceOverview } from '@/lib/angelcare360/server/attendance'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

export default async function Angelcare360PresencesPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const overview = await getAngelcare360AttendanceOverview({ schoolId: context.school.id })
  if (!overview) {
    return (
      <Angelcare360EmptyState
        title="Vue des présences indisponible"
        description="Aucun établissement actif n’a pu être résolu pour alimenter le cockpit Présences."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  const contextRow = (
    <>
      <Badge label={`Établissement: ${context.school.name}`} />
      <Badge label={`Année: ${overview.activeAcademicYearLabel || 'Non résolue'}`} />
      <Badge label={`Sessions aujourd’hui: ${overview.todaySessions}`} />
      <Badge label={`Complétude: ${overview.completionRate}%`} />
    </>
  )

  return (
    <Angelcare360AttendancePageShell
      title="Présences & Vie scolaire"
      subtitle="Pilotage quotidien des présences, retards, absences et justifications avec une traçabilité complète."
      badge="Disponible"
      statusLabel={`${overview.activeStudents} élève(s) actifs`}
      contextRow={contextRow}
      navigationItems={ANGELCARE360_ATTENDANCE_NAVIGATION}
    >
      <section style={kpiGridStyle}>
        {[
          ['Élèves attendus', overview.expectedStudents],
          ['Présents', overview.presentCount],
          ['Absents', overview.absentCount],
          ['Retards', overview.lateCount],
          ['Excusés', overview.excusedCount],
          ['Justifications en attente', overview.pendingJustifications],
        ].map(([label, value]) => (
          <article key={String(label)} style={kpiCardStyle}>
            <div style={kpiLabelStyle}>{label}</div>
            <div style={kpiValueStyle}>{String(value)}</div>
          </article>
        ))}
      </section>

      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Vue d’ensemble</div>
            <h2 style={panelTitleStyle}>Raccourcis opérationnels</h2>
          </div>
          <div style={panelMetaStyle}>{overview.todaySessions} session(s) ouverte(s)</div>
        </div>
        <div style={quickLinksStyle}>
          {[
            ['Présence du jour', '/angelcare-360-command-center/presences/jour'],
            ['Feuilles par classe', '/angelcare-360-command-center/presences/classes'],
            ['Présence par élève', '/angelcare-360-command-center/presences/eleves'],
            ['Retards', '/angelcare-360-command-center/presences/retards'],
            ['Absences', '/angelcare-360-command-center/presences/absences'],
            ['Justifications', '/angelcare-360-command-center/presences/justifications'],
            ['Emploi du temps', '/angelcare-360-command-center/emploi-du-temps'],
            ['Audit présences', '/angelcare-360-command-center/presences/audit'],
          ].map(([label, href]) => (
            <Link key={String(href)} href={String(href)} style={quickLinkStyle}>
              {String(label)}
            </Link>
          ))}
        </div>
      </section>

      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Risque / contrôle</div>
            <h2 style={panelTitleStyle}>Points de vigilance</h2>
          </div>
        </div>
        {overview.risks.length > 0 ? (
          <ul style={riskListStyle}>
            {overview.risks.map((risk) => (
              <li key={risk} style={riskItemStyle}>
                {risk}
              </li>
            ))}
          </ul>
        ) : (
          <Angelcare360EmptyState title="Aucun risque bloquant" description="La journée paraît structurée et les feuilles de présence sont en place." />
        )}
      </section>
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

const kpiGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
}

const kpiCardStyle: React.CSSProperties = {
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 14px 40px rgba(15,23,42,.05)',
  padding: 18,
}

const kpiLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
}

const kpiValueStyle: React.CSSProperties = {
  marginTop: 10,
  color: '#0f172a',
  fontSize: 28,
  lineHeight: 1,
  fontWeight: 950,
}

const panelStyle: React.CSSProperties = {
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 16px 44px rgba(15,23,42,.05)',
  padding: 18,
}

const panelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
  marginBottom: 16,
}

const panelEyebrowStyle: React.CSSProperties = {
  color: '#2563eb',
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontSize: 12,
  fontWeight: 900,
}

const panelTitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#0f172a',
  fontSize: 20,
  fontWeight: 950,
}

const panelMetaStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 13,
  fontWeight: 700,
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

const riskListStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: 'grid',
  gap: 6,
  color: '#78350f',
  fontWeight: 600,
}

const riskItemStyle: React.CSSProperties = {
  lineHeight: 1.5,
}
