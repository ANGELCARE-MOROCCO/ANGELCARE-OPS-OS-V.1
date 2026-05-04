import {
  advanceFollowupCadence,
  completeFollowupWithOutcome,
  convertFollowupToAppointment,
  convertFollowupToTask,
  escalateFollowup,
  snoozeFollowup,
} from './followupDeepActions'

export default function FollowupDeepExecutionPanel({ followup }: { followup: any }) {
  return (
    <section style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <h3 style={titleStyle}>{followup.title || 'Follow-up'}</h3>
          <p style={subtitleStyle}>Channel: {followup.channel || 'call'} • Cadence step: {followup.cadence_step || 1} • Recovery: {followup.recovery_status || 'normal'}</p>
        </div>
        <span style={badgeStyle}>{followup.status || 'pending'}</span>
      </div>

      <div style={gridStyle}>
        <form action={completeFollowupWithOutcome} style={cardStyle}>
          <input type="hidden" name="followup_id" value={followup.id} />
          <strong>Complete with outcome</strong>
          <select name="outcome" required style={inputStyle}>
            <option value="">Select outcome</option>
            <option value="converted">Converted</option>
            <option value="answered">Answered</option>
            <option value="no_answer">No answer</option>
            <option value="rejected">Rejected</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="manager_needed">Manager needed</option>
          </select>
          <textarea name="note" rows={3} placeholder="Outcome note..." style={inputStyle} />
          <button type="submit" style={buttonStyle}>Complete</button>
        </form>

        <form action={convertFollowupToTask} style={cardStyle}>
          <input type="hidden" name="followup_id" value={followup.id} />
          <strong>Convert to task</strong>
          <input name="title" placeholder="Task title" style={inputStyle} />
          <input name="due_at" type="datetime-local" style={inputStyle} />
          <button type="submit" style={buttonStyle}>Create Task</button>
        </form>

        <form action={convertFollowupToAppointment} style={cardStyle}>
          <input type="hidden" name="followup_id" value={followup.id} />
          <strong>Convert to appointment</strong>
          <input name="title" placeholder="Appointment title" style={inputStyle} />
          <input name="scheduled_at" type="datetime-local" required style={inputStyle} />
          <textarea name="notes" rows={2} placeholder="Appointment notes..." style={inputStyle} />
          <button type="submit" style={buttonStyle}>Create Appointment</button>
        </form>

        <form action={escalateFollowup} style={cardStyle}>
          <input type="hidden" name="followup_id" value={followup.id} />
          <strong>Escalate recovery</strong>
          <textarea name="reason" rows={4} required placeholder="Why should manager intervene?" style={inputStyle} />
          <button type="submit" style={dangerButtonStyle}>Escalate</button>
        </form>
      </div>

      <div style={controlRowStyle}>
        <form action={advanceFollowupCadence}>
          <input type="hidden" name="followup_id" value={followup.id} />
          <button type="submit" style={buttonStyle}>Advance Cadence</button>
        </form>

        {[2, 24, 72].map((hours) => (
          <form key={hours} action={snoozeFollowup}>
            <input type="hidden" name="followup_id" value={followup.id} />
            <input type="hidden" name="hours" value={hours} />
            <button type="submit" style={lightButtonStyle}>{hours === 2 ? '+2h' : hours === 24 ? '+1 day' : '+3 days'}</button>
          </form>
        ))}
      </div>
    </section>
  )
}

const panelStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #dbe3ee',
  borderRadius: 22,
  padding: 18,
  boxShadow: '0 14px 28px rgba(15,23,42,.05)',
  display: 'grid',
  gap: 14,
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 14,
  alignItems: 'flex-start',
}

const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 18, fontWeight: 950 }
const subtitleStyle: React.CSSProperties = { margin: '6px 0 0', color: '#64748b', fontWeight: 750, lineHeight: 1.5 }

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  padding: '6px 9px',
  borderRadius: 999,
  background: '#eef2ff',
  color: '#3730a3',
  border: '1px solid #c7d2fe',
  fontSize: 11,
  fontWeight: 950,
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
  gap: 12,
  alignItems: 'start',
}

const cardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  padding: 14,
  borderRadius: 18,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  color: '#0f172a',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 12,
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 750,
}

const baseButton: React.CSSProperties = {
  border: 'none',
  borderRadius: 13,
  padding: '12px 14px',
  fontWeight: 950,
  cursor: 'pointer',
}

const buttonStyle: React.CSSProperties = { ...baseButton, background: '#0f172a', color: '#fff' }
const dangerButtonStyle: React.CSSProperties = { ...baseButton, background: '#dc2626', color: '#fff' }
const lightButtonStyle: React.CSSProperties = { ...baseButton, background: '#fff', color: '#0f172a', border: '1px solid #dbe3ee' }

const controlRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  flexWrap: 'wrap',
}
