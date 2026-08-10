'use client'

type Props = {
  assignments: Array<Record<string, any>>
}

export default function Angelcare360ClaimAssignmentsWorkspace({ assignments }: Props) {
  return (
    <div style={listStyle}>
      {assignments.length ? assignments.map((assignment, index) => (
        <article key={String(assignment.id || index)} style={cardStyle}>
          <strong>{String(assignment.subject || assignment.reclamation_code || 'Ticket')}</strong>
          <div style={footerStyle}>
            <span>{String(assignment.assigned_staff_id || 'Non assignée')}</span>
            <span>{String(assignment.status || '—')}</span>
          </div>
        </article>
      )) : (
        <div style={emptyStyle}>Aucune assignation disponible.</div>
      )}
    </div>
  )
}

const listStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const cardStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 14, borderRadius: 18, border: '1px solid #e2e8f0', background: '#fff' }
const footerStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 12, color: '#64748b', fontSize: 12, fontWeight: 700 }
const emptyStyle: React.CSSProperties = { padding: 16, borderRadius: 18, border: '1px dashed #cbd5e1', color: '#475569', fontWeight: 700 }
