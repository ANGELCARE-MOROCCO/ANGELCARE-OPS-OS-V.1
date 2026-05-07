import type { EmailOsAccount } from './accounts'

export async function syncMailbox(account: EmailOsAccount, options: Record<string, unknown> = {}) {
  return {
    ok: true,
    mode: 'safe-build-stub',
    account: account?.email || null,
    synced: 0,
    options,
  }
}
