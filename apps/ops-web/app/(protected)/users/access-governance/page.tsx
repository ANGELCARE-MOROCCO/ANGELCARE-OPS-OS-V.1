import { redirect } from 'next/navigation'
import { getCurrentAppUser } from '@/lib/auth/session'
import {
  canApproveUniversalAuthorizationPlan,
  canExecuteUniversalAuthorizationPlan,
  canManageUniversalAuthorizationCommand,
  canViewUniversalAuthorizationCommand,
} from '@/lib/users/access-governance/universal/security'
import GlobalAuthorizationCommandClient from './GlobalAuthorizationCommandClient'

export const dynamic = 'force-dynamic'

export default async function GlobalAuthorizationCommandPage() {
  const actor = await getCurrentAppUser()
  if (!actor || !canViewUniversalAuthorizationCommand(actor)) redirect('/unauthorized')

  return (
    <GlobalAuthorizationCommandClient
      actor={{
        id: String(actor.id),
        name: String(actor.full_name ?? actor.username ?? actor.email ?? 'Authorized actor'),
        role: String(actor.role ?? ''),
      }}
      capabilities={{
        canManage: canManageUniversalAuthorizationCommand(actor),
        canApprove: canApproveUniversalAuthorizationPlan(actor),
        canExecute: canExecuteUniversalAuthorizationPlan(actor),
      }}
    />
  )
}
