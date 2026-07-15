import { redirect } from 'next/navigation'
import {
  loadCarelinkMobileMissionContext,
  loadCarelinkMobileWorkspace,
} from '@/lib/carelink/mobile-adapter'
import { CareLinkMobileAccessError } from '@/lib/carelink/mobile-auth'

function redirectToMobileLogin(error: unknown): never {
  const message =
    error instanceof CareLinkMobileAccessError
      ? error.message
      : 'CareLink mobile login required.'

  redirect(`/carelink/login?error=${encodeURIComponent(message)}`)
}

export async function loadCarelinkMobileWorkspaceOrRedirect() {
  try {
    return await loadCarelinkMobileWorkspace()
  } catch (error) {
    if (error instanceof CareLinkMobileAccessError) {
      redirectToMobileLogin(error)
    }
    throw error
  }
}

export async function loadCarelinkMobileMissionContextOrRedirect(id: string | number) {
  try {
    return await loadCarelinkMobileMissionContext(id)
  } catch (error) {
    if (error instanceof CareLinkMobileAccessError) {
      redirectToMobileLogin(error)
    }
    throw error
  }
}
