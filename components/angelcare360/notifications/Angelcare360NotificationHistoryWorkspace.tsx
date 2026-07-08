'use client'

import type { Angelcare360NotificationRecord } from '@/types/angelcare360/communications'

type Props = {
  notifications: Angelcare360NotificationRecord[]
}

export default function Angelcare360NotificationHistoryWorkspace({ notifications }: Props) {
  return (
    <div style={listStyle}>
      {notifications.length ? notifications.map((notification) => (
        <article key={notification.id} style={cardStyle}>
          <div style={headerStyle}>
            <strong>{notification.notification_code}</strong>
            <span>{notification.status}</span>
          </div>
          <p style={bodyStyle}>{notification.title}</p>
          <div style={footerStyle}>
            <span>Destinataire: {notification.recipient_role || notification.recipient_app_user_id || '—'}</span>
            <span>{notification.sent_at || 'Non envoyée'}</span>
          </div>
        </article>
      )) : (
        <div style={emptyStyle}>Aucun historique de notification disponible.</div>
      )}
    </div>
  )
}

const listStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const cardStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 14, borderRadius: 18, border: '1px solid #e2e8f0', background: '#fff' }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }
const bodyStyle: React.CSSProperties = { margin: 0, color: '#334155', lineHeight: 1.65 }
const footerStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 12, color: '#64748b', fontSize: 12, fontWeight: 700 }
const emptyStyle: React.CSSProperties = { padding: 16, borderRadius: 18, border: '1px dashed #cbd5e1', color: '#475569', fontWeight: 700 }

