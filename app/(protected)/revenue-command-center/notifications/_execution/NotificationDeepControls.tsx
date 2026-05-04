import {
  snoozeNotification,
  convertNotificationToTask,
  resolveNotification,
} from './notificationDeepActions'

export default function NotificationDeepControls({ n }: { n: any }) {
  const id = n?.id ? String(n.id) : ''

  if (!id) {
    return null
  }

  return (
    <div style={{ display: 'grid', gap: 8, padding: 10, border: '1px solid #e2e8f0', borderRadius: 14 }}>
      <strong>{n?.title || 'Untitled notification'}</strong>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <form action={resolveNotification}>
          <input type="hidden" name="id" value={id} />
          <button type="submit">Resolve</button>
        </form>

        <form action={convertNotificationToTask}>
          <input type="hidden" name="id" value={id} />
          <input name="title" placeholder="Task title" />
          <button type="submit">→ Task</button>
        </form>

        {[2, 24, 72].map((h) => (
          <form key={h} action={snoozeNotification}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="hours" value={String(h)} />
            <button type="submit">{h === 2 ? '+2h' : h === 24 ? '+1d' : '+3d'}</button>
          </form>
        ))}
      </div>
    </div>
  )
}