import 'server-only'
import { resolveRevenueOsActor, requireRevenueOsPermission } from '../access'
import type { MegaActor } from './types'

export async function megaActor(permission?: string, payload?: unknown): Promise<MegaActor> {
  const actor = await resolveRevenueOsActor(permission, {
    payload,
    aliases: permission === 'revenue_os.mega_production.view' ? ['revenue_os.view'] : [],
  })

  return { ...actor, tenantId: actor.tenantUuid } as MegaActor
}

export function requirePermission(actor: MegaActor, permission: string): void {
  requireRevenueOsPermission(actor, permission)
}
