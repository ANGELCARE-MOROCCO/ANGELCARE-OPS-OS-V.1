import type { WorkspaceSession } from './workspace-types.js'

const KEY = 'angelcare.b2b.active-workspace.v6'

export async function loadWorkspaceSession(): Promise<WorkspaceSession | null> {
  const row = await chrome.storage.local.get(KEY)
  return row[KEY] || null
}

export async function saveWorkspaceSession(value: WorkspaceSession | null) {
  if (!value) await chrome.storage.local.remove(KEY)
  else await chrome.storage.local.set({ [KEY]: value })
}

export function subscribeWorkspaceSession(listener: (value: WorkspaceSession | null) => void) {
  const callback = (changes: Record<string, any>, area: string) => {
    if (area !== 'local' || !changes[KEY]) return
    listener(changes[KEY].newValue || null)
  }
  chrome.storage.onChanged.addListener(callback)
  return () => chrome.storage.onChanged.removeListener(callback)
}
