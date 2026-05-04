import {
  createFixNowFollowup,
  createFixNowTask,
  createManagerOverride,
  forceInsightClosed,
} from './controlActivationActions'

export function InsightFixNowPanel({ insight, users = [] }: { insight: any; users?: any[] }) {
  return (
    <section style={boxStyle}>
      <div style={headStyle}>
        <strong>{insight.title || 'Decision insight'}</strong>
        <span style={badgeStyle}>{insight.severity || 'info'}</span>
      </div>
      <p style={textStyle}>{insight.message || insight.recommendation || 'No insight message.'}</p>

      <div style={gridStyle}>
        <form action={createFixNowTask} style={formStyle}>
          <input type="hidden" name="related_type" value={insight.related_type || 'decision_insight'} />
          <input type="hidden" name="related_id" value={insight.related_id || insight.id} />
          <input name="title" defaultValue={`Fix: ${insight.title || 'Decision insight'}`} style={inputStyle} />
          <input name="description" defaultValue={insight.recommendation || insight.message || ''} style={inputStyle} />
          <select name="target_user_id" style={inputStyle}>
            <option value="">Assign to me / manager</option>
            {users.map((u: any) => <option key={u.id} value={u.id}>{u.full_name || u.username} — {u.role}</option>)}
          </select>
          <input type="hidden" name="priority" value={insight.severity === 'critical' ? 'critical' : 'high'} />
          <input type="hidden" name="due_hours" value={insight.severity === 'critical' ? 12 : 24} />
          <button type="submit" style={buttonStyle}>Fix Now → Task</button>
        </form>

        <form action={createFixNowFollowup} style={formStyle}>
          <input type="hidden" name="related_type" value={insight.related_type || 'decision_insight'} />
          <input type="hidden" name="related_id" value={insight.related_id || insight.id} />
          <input name="title" defaultValue={`Follow-up: ${insight.title || 'Decision insight'}`} style={inputStyle} />
          <select name="target_user_id" style={inputStyle}>
            <option value="">Owner / manager</option>
            {users.map((u: any) => <option key={u.id} value={u.id}>{u.full_name || u.username} — {u.role}</option>)}
          </select>
          <input type="hidden" name="priority" value={insight.severity === 'critical' ? 'critical' : 'high'} />
          <input type="hidden" name="due_hours" value={24} />
          <button type="submit" style={buttonStyle}>Fix Now → Follow-up</button>
        </form>

        <form action={forceInsightClosed} style={formStyle}>
          <input type="hidden" name="id" value={insight.id} />
          <button type="submit" style={lightButtonStyle}>Force Close Insight</button>
        </form>
      </div>
    </section>
  )
}

export function ManagerOverridePanel({ relatedType = '', relatedId = '', users = [] }: { relatedType?: string; relatedId?: string; users?: any[] }) {
  return (
    <section style={panelStyle}>
      <h3 style={titleStyle}>Manager Override</h3>
      <p style={textStyle}>Create a direct command action without adding a new route.</p>
      <form action={createManagerOverride} style={formStyle}>
        <input type="hidden" name="related_type" value={relatedType} />
        <input type="hidden" name="related_id" value={relatedId} />
        <input name="title" required placeholder="Override title" style={inputStyle} />
        <textarea name="description" rows={3} placeholder="Instruction / decision / expected result..." style={inputStyle} />
        <select name="override_type" defaultValue="manager_override" style={inputStyle}>
          <option value="manager_override">Manager override</option>
          <option value="reassignment_order">Reassignment order</option>
          <option value="urgent_recovery">Urgent recovery</option>
          <option value="priority_shift">Priority shift</option>
        </select>
        <select name="severity" defaultValue="medium" style={inputStyle}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <select name="target_user_id" style={inputStyle}>
          <option value="">No specific user</option>
          {users.map((u: any) => <option key={u.id} value={u.id}>{u.full_name || u.username} — {u.role}</option>)}
        </select>
        <input name="due_at" type="datetime-local" style={inputStyle} />
        <button type="submit" style={buttonStyle}>Create Override</button>
      </form>
    </section>
  )
}

const boxStyle: React.CSSProperties = { padding: 16, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', gap: 12, color: '#0f172a' }
const panelStyle: React.CSSProperties = { padding: 18, borderRadius: 22, background: '#fff', border: '1px solid #dbe3ee', boxShadow: '0 14px 28px rgba(15,23,42,.05)', display: 'grid', gap: 10 }
const headStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }
const badgeStyle: React.CSSProperties = { padding: '6px 9px', borderRadius: 999, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', fontSize: 11, fontWeight: 950 }
const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 18, fontWeight: 950 }
const textStyle: React.CSSProperties = { margin: 0, color: '#64748b', lineHeight: 1.5, fontWeight: 750 }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'start' }
const formStyle: React.CSSProperties = { display: 'grid', gap: 8 }
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: 11, borderRadius: 12, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 750 }
const buttonBase: React.CSSProperties = { border: 'none', borderRadius: 12, padding: '11px 13px', fontWeight: 950, cursor: 'pointer' }
const buttonStyle: React.CSSProperties = { ...buttonBase, background: '#0f172a', color: '#fff' }
const lightButtonStyle: React.CSSProperties = { ...buttonBase, background: '#fff', color: '#0f172a', border: '1px solid #dbe3ee' }
