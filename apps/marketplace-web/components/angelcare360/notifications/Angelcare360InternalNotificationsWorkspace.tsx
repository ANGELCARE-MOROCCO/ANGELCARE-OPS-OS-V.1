'use client'

import type { Angelcare360NotificationRecord } from '@/types/angelcare360/communications'

type Props = {
  notifications: Angelcare360NotificationRecord[]
}

export default function Angelcare360InternalNotificationsWorkspace({ notifications }: Props) {
  return (
    <div style={listStyle}>
      {notifications.length ? notifications.map((notification) => (
        <article key={notification.id} style={cardStyle}>
          <div style={headerStyle}>
            <strong>{notification.title}</strong>
            <span>{notification.status}</span>
          </div>
          <p style={bodyStyle}>{notification.body}</p>
          <div style={footerStyle}>
            <span>{notification.channel || 'in_app'}</span>
            <span>{notification.read_at ? 'Lue' : 'Non lue'}</span>
          </div>
        </article>
      )) : (
        <div style={emptyStyle}>Aucune notification interne.</div>
      )}
    </div>
  )
}

const listStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const cardStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 14, borderRadius: 18, border: '1px solid #e2e8f0', background: '#f8fafc' }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }
const bodyStyle: React.CSSProperties = { margin: 0, color: '#334155', lineHeight: 1.65 }
const footerStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 12, color: '#64748b', fontSize: 12, fontWeight: 700 }
const emptyStyle: React.CSSProperties = { padding: 16, borderRadius: 18, border: '1px dashed #cbd5e1', color: '#475569', fontWeight: 700 }

