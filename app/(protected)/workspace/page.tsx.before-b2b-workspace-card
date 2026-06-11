import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/getUser'
import { getWorkspaceGroupsForUser } from '@/lib/workspace/workspace-modules'
import WorkspaceMegaMenuClient from './WorkspaceMegaMenuClient'

export const dynamic = 'force-dynamic'

function text(value: unknown) {
  return String(value || '').trim()
}

function workspaceDisplayName(user: any) {
  const explicit = [text(user?.first_name), text(user?.last_name)].filter(Boolean).join(' ')
  if (explicit) return explicit

  return (
    text(user?.full_name) ||
    text(user?.display_name) ||
    text(user?.name) ||
    text(user?.username) ||
    text(user?.email) ||
    'System User'
  )
}

export default async function WorkspacePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const groups = getWorkspaceGroupsForUser(user)

  return (
    <WorkspaceMegaMenuClient
      displayName={workspaceDisplayName(user)}
      groups={groups}
    />
  )
}
