import Link from 'next/link'
import Angelcare360NotificationsHub from '@/components/angelcare360/notifications/Angelcare360NotificationsHub'
import Angelcare360NotificationsPageShell from '@/components/angelcare360/notifications/Angelcare360NotificationsPageShell'
import { ANGELCARE360_NOTIFICATIONS_NAVIGATION } from '@/data/angelcare360/notifications-navigation'
import { getAngelcare360NotificationOverview } from '@/lib/angelcare360/server/notifications'
import { getAngelcare360NotificationsContext, badgeStyle, primaryLinkStyle, secondaryLinkStyle } from './_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360NotificationsPage() {
  const context = await getAngelcare360NotificationsContext()
  const overview = await getAngelcare360NotificationOverview({ schoolId: context.school.id })

  return (
    <Angelcare360NotificationsPageShell
      title="Notifications"
      subtitle="Le cockpit notifications suit les notifications internes et verrouille les canaux externes tant qu’aucune infrastructure réelle n’est configurée."
      badge="Phase 12"
      statusLabel={overview.blockedExternalCount > 0 ? `${overview.blockedExternalCount} canal(aux) bloqués` : 'Canaux verrouillés'}
      contextRow={
        <>
          <Badge label={`Établissement: ${overview.schoolName}`} />
          <Badge label={`Notifications: ${overview.totalNotifications}`} />
          <Badge label={`Non lues: ${overview.unreadNotifications}`} />
          <Badge label={`En attente: ${overview.scheduledCount}`} />
        </>
      }
      navigation={<Navigation items={ANGELCARE360_NOTIFICATIONS_NAVIGATION} />}
      primaryAction={<Link href="/angelcare-360-command-center/notifications/internes" style={primaryLinkStyle}>Créer une notification</Link>}
      secondaryActions={<Link href="/angelcare-360-command-center/notifications/audit" style={secondaryLinkStyle}>Audit notifications</Link>}
    >
      <Angelcare360NotificationsHub overview={overview} />
    </Angelcare360NotificationsPageShell>
  )
}

function Badge({ label }: { label: string }) {
  return <span style={badgeStyle}>{label}</span>
}

function Navigation({ items }: { items: typeof ANGELCARE360_NOTIFICATIONS_NAVIGATION }) {
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

