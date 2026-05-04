import { HrModulePage } from '@/components/hr-v2-max/HrMaxShell'
import { getHrMaximumSnapshot } from '@/lib/hr-v2-max/sync'

export default async function Page() {
  const snapshot = await getHrMaximumSnapshot()
  return <HrModulePage title='Replacement Workflow' subtitle='Replacement tracking for absences, uncovered shifts, field continuity and supervisor escalation.' icon='alert' rows={snapshot.actions.rows} route=/hr/{route} />
}
