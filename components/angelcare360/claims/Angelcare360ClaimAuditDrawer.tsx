'use client'

import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'

type Props = {
  events: Angelcare360AuditRecord[]
}

export default function Angelcare360ClaimAuditDrawer({ events }: Props) {
  return (
    <div style={tableWrapStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Action</th>
            <th style={thStyle}>Entité</th>
            <th style={thStyle}>Gravité</th>
          </tr>
        </thead>
        <tbody>
          {events.length ? events.map((event) => (
            <tr key={event.id}>
              <td style={tdStyle}>{event.created_at}</td>
              <td style={tdStyle}>{event.action}</td>
              <td style={tdStyle}>{event.entity_type || '—'}</td>
              <td style={tdStyle}>{event.severity}</td>
            </tr>
          )) : (
            <tr>
              <td style={emptyStyle} colSpan={4}>Aucun événement d’audit réclamations.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

const tableWrapStyle: React.CSSProperties = { overflowX: 'auto', borderRadius: 18, border: '1px solid #e2e8f0' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 780 }
const thStyle: React.CSSProperties = { padding: '12px 14px', background: '#f8fafc', color: '#0f172a', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 900, borderBottom: '1px solid #e2e8f0', textAlign: 'left' }
const tdStyle: React.CSSProperties = { padding: '12px 14px', color: '#334155', verticalAlign: 'top', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }
const emptyStyle: React.CSSProperties = { ...tdStyle, textAlign: 'center' }

