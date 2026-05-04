import { HrModulePage } from '@/components/hr-v2-max/HrMaxShell'
import { getHrMaximumSnapshot } from '@/lib/hr-v2-max/sync'

export default async function Page() {
  const snapshot = await getHrMaximumSnapshot()
  return <HrModulePage title='Management Memos' subtitle='Staff notifications, pushed reminders, urgent memos and management communication control.' icon='file' rows={snapshot.notifications.rows} route=/hr/{route} />
}
