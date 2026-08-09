import { redirect } from 'next/navigation'
import {
  loadCarelinkMobileMissionContext,
  loadCarelinkMobileWorkspace,
} from '@/lib/carelink/mobile-adapter'
import { CareLinkMobileAccessError } from '@/lib/carelink/mobile-auth'

function isSafeCareLinkNext(next: string) {
  return next.startsWith('/carelink') && !next.startsWith('//') && !next.includes('://')
}

function getAccessErrorMessage(error: unknown) {
  if (error instanceof CareLinkMobileAccessError) return error.message
  if (error instanceof Error) return error.message
  return 'CareLink mobile login required.'
}

function redirectToMobileLogin(error: unknown, next = '/carelink'): never {
  const safeNext = isSafeCareLinkNext(next) ? next : '/carelink'
  const message = getAccessErrorMessage(error)

  redirect(`/carelink/login?error=${encodeURIComponent(message)}&next=${encodeURIComponent(safeNext)}`)
}

export async function loadCarelinkMobileWorkspaceOrRedirect() {
  try {
    return await loadCarelinkMobileWorkspace()
  } catch (error) {
    console.error(
      '[CareLink mobile workspace access rejected]',
      getAccessErrorMessage(error)
    )

    redirectToMobileLogin(error, '/carelink')
  }
}

export async function loadCarelinkMobileMissionContextOrRedirect(id: string | number) {
  const next = `/carelink/missions/${id}`

  try {
    return await loadCarelinkMobileMissionContext(id)
  } catch (error) {
    console.error(
      '[CareLink mobile mission access rejected]',
      getAccessErrorMessage(error)
    )

    redirectToMobileLogin(error, next)
  }
}
