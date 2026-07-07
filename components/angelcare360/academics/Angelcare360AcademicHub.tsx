import Link from 'next/link'
import type { Angelcare360AcademicOverviewRecord } from '@/types/angelcare360/academics'
import Angelcare360AcademicRiskPanel from './Angelcare360AcademicRiskPanel'

type Angelcare360AcademicHubProps = {
  overview: Angelcare360AcademicOverviewRecord
  canCreateLessons?: boolean
  canCreateAssignments?: boolean
  canCreateExams?: boolean
  canOpenBulletins?: boolean
}

export default function Angelcare360AcademicHub({
  overview,
  canCreateLessons = false,
  canCreateAssignments = false,
  canCreateExams = false,
  canOpenBulletins = false,
}: Angelcare360AcademicHubProps) {
  const metrics = [
    ['Cours planifiés', overview.lessonPlannedCount],
    ['Cours réalisés', overview.lessonCompletedCount],
    ['Devoirs publiés', overview.assignmentPublishedCount],
    ['Soumissions en attente', overview.pendingSubmissionCount],
    ['Examens programmés', overview.examScheduledCount],
    ['Notes saisies', overview.markCount],
    ['Bulletins brouillon', overview.reportCardDraftCount],
    ['Bulletins publiés', overview.reportCardPublishedCount],
  ]

  return (
    <section style={shellStyle}>
      <section style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>Académique & Évaluations</div>
          <h1 style={titleStyle}>Cockpit académique</h1>
          <p style={subtitleStyle}>
            Le moteur académique orchestre les cours, devoirs, examens, notes, moyennes, bulletins et appréciations avec un audit serveur sur chaque mutation critique.
          </p>
        </div>
        <div style={actionRowStyle}>
          <Link href="/angelcare-360-command-center/academique/cours" style={linkStyle}>Ouvrir les cours</Link>
          <Link href="/angelcare-360-command-center/academique/examens" style={linkStyle}>Ouvrir les examens</Link>
          <Link href="/angelcare-360-command-center/academique/bulletins" style={primaryLinkStyle}>Ouvrir les bulletins</Link>
        </div>
      </section>

      <section style={kpiGridStyle}>
        {metrics.map(([label, value]) => (
          <article key={String(label)} style={kpiCardStyle}>
            <div style={kpiLabelStyle}>{label}</div>
            <div style={kpiValueStyle}>{String(value)}</div>
          </article>
        ))}
      </section>

      <section style={quickGridStyle}>
        <QuickLink href="/angelcare-360-command-center/academique/cours" label="Créer un cours" disabled={!canCreateLessons} />
        <QuickLink href="/angelcare-360-command-center/academique/devoirs" label="Créer un devoir" disabled={!canCreateAssignments} />
        <QuickLink href="/angelcare-360-command-center/academique/examens" label="Créer un examen" disabled={!canCreateExams} />
        <QuickLink href="/angelcare-360-command-center/academique/bulletins" label="Ouvrir les bulletins" disabled={!canOpenBulletins} />
      </section>

      <Angelcare360AcademicRiskPanel risks={overview.risks} />
    </section>
  )
}

function QuickLink({ href, label, disabled }: { href: string; label: string; disabled: boolean }) {
  return (
    <Link
      href={disabled ? '#' : href}
      aria-disabled={disabled || undefined}
      title={disabled ? 'Action verrouillée par permission ou configuration.' : label}
      style={disabled ? disabledQuickLinkStyle : quickLinkStyle}
      onClick={(event) => {
        if (disabled) event.preventDefault()
      }}
    >
      {label}
    </Link>
  )
}

const shellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
}

const heroStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
  flexWrap: 'wrap',
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 20,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const eyebrowStyle: React.CSSProperties = {
  color: '#2563eb',
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  fontSize: 12,
  fontWeight: 900,
}

const titleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#0f172a',
  fontSize: 28,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: '10px 0 0',
  color: '#475569',
  lineHeight: 1.65,
  fontWeight: 600,
  maxWidth: 920,
}

const actionRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const linkStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 800,
}

const primaryLinkStyle: React.CSSProperties = {
  border: '1px solid #0f172a',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#0f172a',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 800,
}

const kpiGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
}

const kpiCardStyle: React.CSSProperties = {
  borderRadius: 20,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 16,
}

const kpiLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 900,
}

const kpiValueStyle: React.CSSProperties = {
  marginTop: 10,
  color: '#0f172a',
  fontSize: 24,
  lineHeight: 1.1,
  fontWeight: 950,
}

const quickGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
}

const quickLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 18,
  border: '1px solid #cbd5e1',
  padding: '14px 16px',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 850,
}

const disabledQuickLinkStyle: React.CSSProperties = {
  ...quickLinkStyle,
  cursor: 'not-allowed',
  color: '#94a3b8',
  background: '#f8fafc',
}
