import {
  completeTaskWithOutcome,
  convertTaskToFollowup,
  escalateTaskDeep,
  markTaskBlocked,
  snoozeTask,
} from './taskDeepActions'

export default function TaskDeepExecutionPanel({ task }: { task: any }) {
  return (
    <section style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>Deep Execution Controls</h2>
          <p style={subtitleStyle}>Outcome, blocker, snooze, escalation, and follow-up conversion without leaving this task.</p>
        </div>
        <span style={badgeStyle}>EXECUTION MODE</span>
      </div>

      <div style={gridStyle}>
        <form action={completeTaskWithOutcome} style={cardStyle}>
          <input type="hidden" name="task_id" value={task.id} />
          <strong>Complete with outcome</strong>
          <select name="outcome" required style={inputStyle}>
            <option value="">Select outcome</option>
            <option value="success">Success</option>
            <option value="converted">Converted</option>
            <option value="no_answer">No answer</option>
            <option value="rejected">Rejected</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="needs_manager">Needs manager</option>
          </select>
          <textarea name="note" rows={3} placeholder="Outcome note..." style={inputStyle} />
          <button type="submit" style={buttonStyle}>Complete Task</button>
        </form>

        <form action={markTaskBlocked} style={cardStyle}>
          <input type="hidden" name="task_id" value={task.id} />
          <strong>Mark blocked</strong>
          <textarea name="blocker" rows={4} required placeholder="What is blocking this task?" style={inputStyle} />
          <button type="submit" style={warningButtonStyle}>Mark Blocked</button>
        </form>

        <form action={escalateTaskDeep} style={cardStyle}>
          <input type="hidden" name="task_id" value={task.id} />
          <strong>Escalate</strong>
          <textarea name="reason" rows={4} required placeholder="Why should manager intervene?" style={inputStyle} />
          <button type="submit" style={dangerButtonStyle}>Escalate</button>
        </form>

        <form action={convertTaskToFollowup} style={cardStyle}>
          <input type="hidden" name="task_id" value={task.id} />
          <strong>Convert to follow-up</strong>
          <input name="title" placeholder="Follow-up title" style={inputStyle} />
          <input name="due_at" type="datetime-local" style={inputStyle} />
          <button type="submit" style={buttonStyle}>Create Follow-up</button>
        </form>
      </div>

      <div style={snoozeStyle}>
        <strong>Snooze task</strong>
        {[2, 24, 72].map((hours) => (
          <form key={hours} action={snoozeTask}>
            <input type="hidden" name="task_id" value={task.id} />
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
  borderRadius: 24,
  padding: 20,
  boxShadow: '0 18px 38px rgba(15,23,42,.06)',
  display: 'grid',
  gap: 16,
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 14,
  alignItems: 'flex-start',
}

const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 20, fontWeight: 950 }
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
const warningButtonStyle: React.CSSProperties = { ...baseButton, background: '#d97706', color: '#fff' }
const lightButtonStyle: React.CSSProperties = { ...baseButton, background: '#fff', color: '#0f172a', border: '1px solid #dbe3ee' }

const snoozeStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  flexWrap: 'wrap',
  paddingTop: 4,
}
