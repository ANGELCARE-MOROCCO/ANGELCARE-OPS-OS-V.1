import { redirect } from 'next/navigation'
import { getSystemControlContext } from '@/app/api/system-control/_shared'
import SystemOfflineMinimalNotice from '@/components/ceo-system-control/SystemOfflineMinimalNotice'

export const dynamic = 'force-dynamic'

export default async function SystemOfflinePage() {
  const context = await getSystemControlContext()

  if (context.authorized && context.state.isSystemOnline) {
    redirect('/ceo/system-control')
  }

  return (
    <SystemOfflineMinimalNotice
      resumeAt={context.state.resumeAt}
      isAuthorized={context.authorized}
    />
  )
}
