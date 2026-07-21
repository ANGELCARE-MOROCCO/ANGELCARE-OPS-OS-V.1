import type { WorkspaceSession } from './workspace-types.js'

const KEY = 'angelcare.b2b.active-workspace.v9'
const LEGACY_KEYS = ['angelcare.b2b.active-workspace.v6']

export async function loadWorkspaceSession(): Promise<WorkspaceSession | null> {
  const row = await chrome.storage.local.get([KEY, ...LEGACY_KEYS])
  if (row[KEY]) return row[KEY]
  const legacy = LEGACY_KEYS.map((key) => row[key]).find(Boolean) || null
  if (legacy) { await chrome.storage.local.set({ [KEY]: { ...legacy, activeAccountId: legacy.activeAccountId || legacy.prospectId, contextVersion: 9 } }); await chrome.storage.local.remove(LEGACY_KEYS) }
  return legacy ? { ...legacy, activeAccountId: legacy.activeAccountId || legacy.prospectId, contextVersion: 9 } : null
}

export async function saveWorkspaceSession(value: WorkspaceSession | null) {
  if (!value) await chrome.storage.local.remove([KEY, ...LEGACY_KEYS])
  else await chrome.storage.local.set({ [KEY]: { ...value, activeAccountId: value.activeAccountId || value.prospectId, contextVersion: 9 } })
}

export function subscribeWorkspaceSession(listener: (value: WorkspaceSession | null) => void) {
  const callback = (changes: Record<string, any>, area: string) => {
    if (area !== 'local' || !changes[KEY]) return
    listener(changes[KEY].newValue || null)
  }
  chrome.storage.onChanged.addListener(callback)
  return () => chrome.storage.onChanged.removeListener(callback)
}
