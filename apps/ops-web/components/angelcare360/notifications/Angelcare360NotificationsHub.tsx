'use client'

import Link from 'next/link'
import type { Angelcare360NotificationOverviewRecord } from '@/types/angelcare360/communications'
import Angelcare360NotificationsRiskPanel from './Angelcare360NotificationsRiskPanel'
import {
  ANGELCARE360_COLORS,
  angelcare360MetricCardStyle,
  angelcare360PageShellStyle,
} from '@/components/angelcare360/ui/Angelcare360VisualSystem'

type Props = {
  overview: Angelcare360NotificationOverviewRecord
}

export default function Angelcare360NotificationsHub({ overview }: Props) {
  return (
    <section style={stackStyle}>
      <div style={gridStyle}>
        <Metric label="Notifications" value={overview.totalNotifications} />
        <Metric label="Non lues" value={overview.unreadNotifications} />
        <Metric label="Bloquées" value={overview.blockedExternalCount} />
        <Metric label="Planifiées" value={overview.scheduledCount} />
        <Metric label="Canaux prêtes" value={[overview.channelReadiness.email, overview.channelReadiness.sms, overview.channelReadiness.whatsapp, overview.channelReadiness.push].filter((item) => item.status === 'ready_later').length} />
      </div>

      <div style={actionsRowStyle}>
        <Link href="/angelcare-360-command-center/notifications/internes" style={primaryActionStyle}>Créer une notification</Link>
        <Link href="/angelcare-360-command-center/notifications/canaux" style={secondaryActionStyle}>Canaux</Link>
        <Link href="/angelcare-360-command-center/notifications/historique" style={secondaryActionStyle}>Historique</Link>
      </div>

      <Angelcare360NotificationsRiskPanel risks={overview.risks} />
    </section>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article style={metricStyle}>
      <div style={metricLabelStyle}>{label}</div>
      <div style={metricValueStyle}>{value}</div>
    </article>
  )
}

const stackStyle: React.CSSProperties = { ...angelcare360PageShellStyle }
const gridStyle: React.CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }
const metricStyle: React.CSSProperties = { ...angelcare360MetricCardStyle, display: 'grid', gap: 6, padding: 16, borderRadius: 22 }
const metricLabelStyle: React.CSSProperties = { color: ANGELCARE360_COLORS.slateMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 900 }
const metricValueStyle: React.CSSProperties = { color: ANGELCARE360_COLORS.navy, fontSize: 24, fontWeight: 950 }
const actionsRowStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10 }
const primaryActionStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderStyle: 'solid', borderColor: ANGELCARE360_COLORS.navy, background: `linear-gradient(180deg, ${ANGELCARE360_COLORS.navy} 0%, ${ANGELCARE360_COLORS.navyDeep} 100%)`, color: ANGELCARE360_COLORS.white, padding: '10px 14px', textDecoration: 'none', fontWeight: 800 }
const secondaryActionStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderStyle: 'solid', borderColor: ANGELCARE360_COLORS.borderStrong, background: `linear-gradient(180deg, ${ANGELCARE360_COLORS.white} 0%, ${ANGELCARE360_COLORS.background} 100%)`, color: ANGELCARE360_COLORS.navy, padding: '10px 14px', textDecoration: 'none', fontWeight: 800 }
