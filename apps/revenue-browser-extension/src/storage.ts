import type { StoredSession } from './types.js'
const SESSION_KEY = 'angelcare.extension.session'
const INSTALLATION_KEY = 'angelcare.extension.installation'
export async function getInstallationId(): Promise<string> {
  const row = await chrome.storage.local.get(INSTALLATION_KEY)
  if (row[INSTALLATION_KEY]) return row[INSTALLATION_KEY]
  const value = crypto.randomUUID()
  await chrome.storage.local.set({ [INSTALLATION_KEY]: value })
  return value
}
export async function getSession(): Promise<StoredSession | null> {
  const row = await chrome.storage.local.get(SESSION_KEY)
  return row[SESSION_KEY] || null
}
export async function setSession(value: StoredSession | null) {
  if (!value) await chrome.storage.local.remove(SESSION_KEY)
  else await chrome.storage.local.set({ [SESSION_KEY]: value })
}
