import Link from 'next/link'
import Angelcare360CommunicationHub from '@/components/angelcare360/communication/Angelcare360CommunicationHub'
import Angelcare360CommunicationPageShell from '@/components/angelcare360/communication/Angelcare360CommunicationPageShell'
import { ANGELCARE360_COMMUNICATION_NAVIGATION } from '@/data/angelcare360/communication-navigation'
import { getAngelcare360CommunicationOverview } from '@/lib/angelcare360/server/communication'
import { getAngelcare360CommunicationContext, badgeStyle, primaryLinkStyle, secondaryLinkStyle } from './_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360MessageriePage() {
  const context = await getAngelcare360CommunicationContext()
  const overview = await getAngelcare360CommunicationOverview({ schoolId: context.school.id })

  return (
    <Angelcare360CommunicationPageShell
      title="Messagerie, Notifications & Réclamations"
      subtitle="Le cockpit communication suit les conversations, annonces, modèles, audiences et verrouillages des canaux externes sans faux envoi."
      badge="Phase 12"
      statusLabel={overview.risks.length > 0 ? `${overview.risks.length} risque(s)` : 'Socle communication prêt'}
      contextRow={
        <>
          <Badge label={`Établissement: ${overview.schoolName}`} />
          <Badge label={`Conversations: ${overview.conversationsCount}`} />
          <Badge label={`Non lus: ${overview.unreadCount}`} />
          <Badge label={`Modèles: ${overview.templatesCount}`} />
        </>
      }
      navigation={<Navigation items={ANGELCARE360_COMMUNICATION_NAVIGATION} />}
      primaryAction={<Link href="/angelcare-360-command-center/messagerie/conversations" style={primaryLinkStyle}>Ouvrir les conversations</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/messagerie/audit" style={secondaryLinkStyle}>Audit messagerie</Link>}
    >
      <Angelcare360CommunicationHub overview={overview} />
    </Angelcare360CommunicationPageShell>
  )
}

function Badge({ label }: { label: string }) {
  return <span style={badgeStyle}>{label}</span>
}

function Navigation({ items }: { items: typeof ANGELCARE360_COMMUNICATION_NAVIGATION }) {
  return (
    <div style={navStyle}>
      {items.map((item) => (
        <Link key={item.key} href={item.href} style={navItemStyle}>
          <span style={navLabelStyle}>{item.label}</span>
          <span style={navSummaryStyle}>{item.summary}</span>
          {item.badge ? <span style={navBadgeStyle}>{item.badge}</span> : null}
        </Link>
      ))}
    </div>
  )
}

const navStyle: React.CSSProperties = { display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }
const navItemStyle: React.CSSProperties = { display: 'grid', gap: 6, alignContent: 'start', padding: 16, borderRadius: 20, border: '1px solid #dbe4ef', background: '#fff', textDecoration: 'none', color: '#0f172a', boxShadow: '0 12px 28px rgba(15,23,42,.04)' }
const navLabelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 900 }
const navSummaryStyle: React.CSSProperties = { color: '#475569', lineHeight: 1.5, fontSize: 13, fontWeight: 600 }
const navBadgeStyle: React.CSSProperties = { display: 'inline-flex', width: 'fit-content', borderRadius: 999, padding: '4px 8px', background: '#eff6ff', color: '#1d4ed8', fontSize: 11, fontWeight: 900 }

