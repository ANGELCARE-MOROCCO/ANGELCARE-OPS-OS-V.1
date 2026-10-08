import { redirect } from 'next/navigation'
import TenantMfaChallengeClient from '@/components/angelcare360/access/TenantMfaChallengeClient'
import { getCurrentAppUser } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'
export default async function TenantMfaPage() {
  const user = await getCurrentAppUser()
  if ((user as { __demo?: boolean } | null)?.__demo === true) redirect('/angelcare-360-command-center')
  return <TenantMfaChallengeClient />
}
