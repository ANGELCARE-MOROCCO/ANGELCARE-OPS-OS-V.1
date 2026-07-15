'use client'

import Link from 'next/link'
import type { Angelcare360ClaimsOverviewRecord } from '@/types/angelcare360/communications'
import Angelcare360ClaimsRiskPanel from './Angelcare360ClaimsRiskPanel'
import {
  ANGELCARE360_COLORS,
  angelcare360MetricCardStyle,
  angelcare360PageShellStyle,
} from '@/components/angelcare360/ui/Angelcare360VisualSystem'

type Props = {
  overview: Angelcare360ClaimsOverviewRecord
}

export default function Angelcare360ClaimsHub({ overview }: Props) {
  return (
    <section style={stackStyle}>
      <div style={gridStyle}>
        <Metric label="Tickets" value={overview.totalTickets} />
        <Metric label="Nouvelles" value={overview.newTickets} />
        <Metric label="Assignées" value={overview.assignedTickets} />
        <Metric label="Urgentes" value={overview.urgentTickets} />
        <Metric label="Sans assignation" value={overview.unassignedTickets} />
      </div>

      <div style={actionsRowStyle}>
        <Link href="/angelcare-360-command-center/reclamations/tickets" style={primaryActionStyle}>Créer un ticket</Link>
        <Link href="/angelcare-360-command-center/reclamations/assignations" style={secondaryActionStyle}>Assignations</Link>
        <Link href="/angelcare-360-command-center/reclamations/priorites" style={secondaryActionStyle}>Priorités</Link>
      </div>

      <Angelcare360ClaimsRiskPanel risks={overview.risks} />
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
