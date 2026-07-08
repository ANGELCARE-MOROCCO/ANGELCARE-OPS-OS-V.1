'use client'

import type { ReactNode } from 'react'
import type { Angelcare360ConversationParticipantRecord, Angelcare360ConversationRecord, Angelcare360MessageRecord } from '@/types/angelcare360/communications'

type Props = {
  conversation: Angelcare360ConversationRecord & { participant_count?: number; message_count?: number; unread_count?: number }
  participants: Angelcare360ConversationParticipantRecord[]
  messages: Array<Angelcare360MessageRecord & { recipient_count?: number; read_count?: number }>
  children?: ReactNode
}

export default function Angelcare360ConversationDetail({ conversation, participants, messages, children }: Props) {
  return (
    <div style={stackStyle}>
      <div style={gridStyle}>
        <article style={cardStyle}>
          <div style={labelStyle}>Sujet</div>
          <div style={valueStyle}>{conversation.subject}</div>
          <div style={mutedStyle}>{conversation.conversation_code}</div>
        </article>
        <article style={cardStyle}>
          <div style={labelStyle}>Participants</div>
          <div style={valueStyle}>{participants.length}</div>
          <div style={mutedStyle}>messages: {conversation.message_count || messages.length}</div>
        </article>
        <article style={cardStyle}>
          <div style={labelStyle}>Statut</div>
          <div style={valueStyle}>{conversation.status}</div>
          <div style={mutedStyle}>non lus: {conversation.unread_count || 0}</div>
        </article>
      </div>

      <section style={sectionCardStyle}>
        <h3 style={sectionTitleStyle}>Participants</h3>
        <ul style={listStyle}>
          {participants.map((participant) => (
            <li key={participant.id} style={listItemStyle}>
              <strong>{participant.participant_role || 'participant'}</strong>
              <span>{participant.participant_app_user_id || participant.participant_student_id || participant.participant_parent_id || participant.participant_staff_id || '—'}</span>
            </li>
          ))}
        </ul>
      </section>

      <section style={sectionCardStyle}>
        <h3 style={sectionTitleStyle}>Messages</h3>
        <div style={messageListStyle}>
          {messages.map((message) => (
            <article key={message.id} style={messageCardStyle}>
              <div style={messageHeaderStyle}>
                <strong>{message.subject}</strong>
                <span>{message.status}</span>
              </div>
              <p style={messageBodyStyle}>{message.body}</p>
              <div style={messageFooterStyle}>
                <span>Destinataires: {message.recipient_count || 0}</span>
                <span>Lus: {message.read_count || 0}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {children ? <div>{children}</div> : null}
    </div>
  )
}

const stackStyle: React.CSSProperties = { display: 'grid', gap: 16 }
const gridStyle: React.CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }
const cardStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 16, borderRadius: 20, border: '1px solid #dbe4ef', background: '#fff' }
const labelStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 900 }
const valueStyle: React.CSSProperties = { color: '#0f172a', fontSize: 18, fontWeight: 900 }
const mutedStyle: React.CSSProperties = { color: '#475569', lineHeight: 1.6, fontWeight: 600 }
const sectionCardStyle: React.CSSProperties = { display: 'grid', gap: 12, padding: 18, borderRadius: 22, border: '1px solid #dbe4ef', background: '#fff' }
const sectionTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 16, fontWeight: 900 }
const listStyle: React.CSSProperties = { margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }
const listItemStyle: React.CSSProperties = { display: 'grid', gap: 4, color: '#334155' }
const messageListStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const messageCardStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 14, borderRadius: 18, border: '1px solid #e2e8f0', background: '#f8fafc' }
const messageHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }
const messageBodyStyle: React.CSSProperties = { margin: 0, color: '#334155', lineHeight: 1.65 }
const messageFooterStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 12, color: '#64748b', fontSize: 12, fontWeight: 700 }
