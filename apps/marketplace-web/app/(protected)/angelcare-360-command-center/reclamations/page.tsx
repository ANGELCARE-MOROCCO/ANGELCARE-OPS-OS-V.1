import Link from 'next/link'
import Angelcare360ClaimsHub from '@/components/angelcare360/claims/Angelcare360ClaimsHub'
import Angelcare360ClaimsPageShell from '@/components/angelcare360/claims/Angelcare360ClaimsPageShell'
import { ANGELCARE360_CLAIMS_NAVIGATION } from '@/data/angelcare360/claims-navigation'
import { getAngelcare360ClaimsOverview } from '@/lib/angelcare360/server/claims'
import { getAngelcare360ClaimsContext, badgeStyle, primaryLinkStyle, secondaryLinkStyle } from './_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ClaimsPage() {
  const context = await getAngelcare360ClaimsContext()
  const overview = await getAngelcare360ClaimsOverview({ schoolId: context.school.id })

  return (
    <Angelcare360ClaimsPageShell
      title="Messagerie, Notifications & Réclamations"
      subtitle="Le cockpit réclamations suit les tickets, les assignations, les priorités et les résolutions auditées."
      badge="Disponible"
      statusLabel={overview.urgentOpenTickets > 0 ? `${overview.urgentOpenTickets} urgent(s)` : 'Flux contrôlé'}
      contextRow={
        <>
          <Badge label={`Établissement: ${overview.schoolName}`} />
          <Badge label={`Tickets: ${overview.totalTickets}`} />
          <Badge label={`Sans assignation: ${overview.unassignedTickets}`} />
          <Badge label={`Urgents: ${overview.urgentTickets}`} />
        </>
      }
      navigation={<Navigation items={ANGELCARE360_CLAIMS_NAVIGATION} />}
      primaryAction={<Link href="/angelcare-360-command-center/reclamations/tickets" style={primaryLinkStyle}>Ouvrir les tickets</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/reclamations/audit" style={secondaryLinkStyle}>Audit réclamations</Link>}
    >
      <Angelcare360ClaimsHub overview={overview} />
    </Angelcare360ClaimsPageShell>
  )
}

function Badge({ label }: { label: string }) {
  return <span style={badgeStyle}>{label}</span>
}

function Navigation({ items }: { items: typeof ANGELCARE360_CLAIMS_NAVIGATION }) {
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
const navBadgeStyle: React.CSSProperties = { display: 'inline-flex', width: 'fit-content', borderRadius: 999, padding: '4px 8px', background: '#fff7ed', color: '#c2410c', fontSize: 11, fontWeight: 900 }

