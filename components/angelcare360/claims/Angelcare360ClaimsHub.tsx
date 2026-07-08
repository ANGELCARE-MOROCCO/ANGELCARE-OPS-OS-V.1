'use client'

import Link from 'next/link'
import type { Angelcare360ClaimsOverviewRecord } from '@/types/angelcare360/communications'
import Angelcare360ClaimsRiskPanel from './Angelcare360ClaimsRiskPanel'

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

const stackStyle: React.CSSProperties = { display: 'grid', gap: 16 }
const gridStyle: React.CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }
const metricStyle: React.CSSProperties = { display: 'grid', gap: 6, padding: 16, borderRadius: 20, border: '1px solid #dbe4ef', background: '#fff' }
const metricLabelStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 900 }
const metricValueStyle: React.CSSProperties = { color: '#0f172a', fontSize: 24, fontWeight: 950 }
const actionsRowStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10 }
const primaryActionStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 14, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', padding: '10px 14px', textDecoration: 'none', fontWeight: 800 }
const secondaryActionStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 14, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', padding: '10px 14px', textDecoration: 'none', fontWeight: 800 }

