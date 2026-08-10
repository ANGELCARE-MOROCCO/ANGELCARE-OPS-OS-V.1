import Link from 'next/link'
import Angelcare360CommunicationSectionScreen from '@/components/angelcare360/communication/Angelcare360CommunicationSectionScreen'
import { getAngelcare360AudienceReadiness } from '@/lib/angelcare360/server/communication'
import { getAngelcare360CommunicationContext, secondaryLinkStyle } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360AudiencesPage() {
  const context = await getAngelcare360CommunicationContext()
  const readiness = await getAngelcare360AudienceReadiness({ schoolId: context.school.id })

  return (
    <Angelcare360CommunicationSectionScreen
      title="Audiences"
      description="Couverture des groupes cibles et lecture de la disponibilité réelle."
      actions={<Link href="/angelcare-360-command-center/messagerie" style={secondaryLinkStyle}>Retour au cockpit</Link>}
    >
      <div style={gridStyle}>
        <Card label="Parents" value={readiness.totalParents} />
        <Card label="Enseignants" value={readiness.totalTeachers} />
        <Card label="Personnel" value={readiness.totalStaff} />
        <Card label="Élèves" value={readiness.totalStudents} />
        <Card label="Classes" value={readiness.totalClasses} />
        <Card label="Sections" value={readiness.totalSections} />
      </div>
      <section style={panelStyle}>
        <div style={headerStyle}>Groupes prêts: {readiness.readyGroups.join(', ') || 'Aucun'}</div>
        <div style={mutedStyle}>Groupes bloqués: {readiness.blockedGroups.join(', ') || 'Aucun'}</div>
      </section>
    </Angelcare360CommunicationSectionScreen>
  )
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <article style={cardStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value}</div>
    </article>
  )
}

const gridStyle: React.CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }
const cardStyle: React.CSSProperties = { display: 'grid', gap: 6, padding: 16, borderRadius: 20, border: '1px solid #dbe4ef', background: '#fff' }
const labelStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 900 }
const valueStyle: React.CSSProperties = { color: '#0f172a', fontSize: 24, fontWeight: 950 }
const panelStyle: React.CSSProperties = { padding: 16, borderRadius: 20, border: '1px solid #dbe4ef', background: '#fff', display: 'grid', gap: 8 }
const headerStyle: React.CSSProperties = { color: '#0f172a', fontWeight: 900 }
const mutedStyle: React.CSSProperties = { color: '#475569', fontWeight: 600, lineHeight: 1.6 }

