import { redirect } from 'next/navigation'
import { getCurrentAppUser } from '@/lib/auth/session'
import { requireUnlockedMailboxAccess } from '@/lib/email-os-core/access-governance'
import EmailOSErrorBoundary from '@/components/email-os-core/EmailOSErrorBoundary'
import EmailOSEnterpriseProductionWorkspace from '@/components/email-os-core/EmailOSEnterpriseProductionWorkspace'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ mailboxId: string }> }) {
  const user = await getCurrentAppUser()
  if (!user) {
    redirect('/login')
  }

  const { mailboxId } = await params

  try {
    await requireUnlockedMailboxAccess({
      userId: user.id,
      mailboxId,
      requiredPermission: 'can_read',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Mailbox access denied.'
    redirect(`/email-os/gate?mailboxId=${encodeURIComponent(mailboxId)}&reason=${encodeURIComponent(message)}`)
  }

  return (
    <EmailOSErrorBoundary>
      <EmailOSEnterpriseProductionWorkspace mailboxId={mailboxId} />
    </EmailOSErrorBoundary>
  )
}
