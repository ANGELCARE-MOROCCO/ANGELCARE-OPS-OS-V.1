import { replayActivationEvent } from './controlActivationActions'

export default function ActivationReplayControls({ event }: { event: any }) {
  return (
    <form action={replayActivationEvent} style={wrapStyle}>
      <input type="hidden" name="event_id" value={event.id} />
      <div>
        <strong>{event.title || event.event_type || 'Activation event'}</strong>
        <p>{event.message || event.action_taken || 'No event message.'}</p>
      </div>
      <button type="submit" style={buttonStyle}>Replay → Task</button>
    </form>
  )
}

const wrapStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  padding: 14,
  borderRadius: 16,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  color: '#0f172a',
}

const buttonStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: 12,
  padding: '11px 13px',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 950,
  cursor: 'pointer',
}
