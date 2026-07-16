import * as Keychain from 'react-native-keychain'
import type {AppSession} from '../../store/sessionStore'

const CARELINK_SESSION_SERVICE = 'angelcare.carelink.android.session'

export type CareLinkStoredSession = {
  session: AppSession
  token: string
  expiresAt: string | null
  savedAt: string
}

function isSessionExpired(expiresAt: string | null | undefined) {
  if (!expiresAt) return false
  const timestamp = new Date(expiresAt).getTime()
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp <= Date.now() : false
}

function parseStoredSession(payload: string | undefined | null): CareLinkStoredSession | null {
  if (!payload) return null

  try {
    const parsed = JSON.parse(payload) as Partial<CareLinkStoredSession>
    const token = typeof parsed.token === 'string' ? parsed.token.trim() : ''
    const session = parsed.session && typeof parsed.session === 'object' ? parsed.session as AppSession : null
    const expiresAt = typeof parsed.expiresAt === 'string' && parsed.expiresAt.trim() ? parsed.expiresAt : null

    if (!token || !session) return null
    if (isSessionExpired(expiresAt)) return null

    return {
      session: {
        identifier: session.identifier || '',
        agentName: session.agentName || session.identifier || 'CareLink Agent',
        role: session.role || 'CareLink Agent',
        accessStatus: session.accessStatus,
        token,
        expiresAt,
        raw: session.raw,
      },
      token,
      expiresAt,
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export async function saveCareLinkSession(session: AppSession, token: string, expiresAt?: string | null) {
  const bundle: CareLinkStoredSession = {
    session: {
      ...session,
      token,
      expiresAt: expiresAt || null,
    },
    token,
    expiresAt: expiresAt || null,
    savedAt: new Date().toISOString(),
  }

  await Keychain.setGenericPassword('carelink', JSON.stringify(bundle), {
    service: CARELINK_SESSION_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  })

  return bundle
}

export async function loadCareLinkSession() {
  const credentials = await Keychain.getGenericPassword({service: CARELINK_SESSION_SERVICE})
  if (!credentials || credentials === false) return null

  const session = parseStoredSession(credentials.password)
  if (!session) {
    await clearCareLinkSession()
    return null
  }

  return session
}

export async function clearCareLinkSession() {
  try {
    await Keychain.resetGenericPassword({service: CARELINK_SESSION_SERVICE})
  } catch {
    // Ignore keychain cleanup failures.
  }
}
