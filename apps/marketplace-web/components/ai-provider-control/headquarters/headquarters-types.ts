import type { AiProviderSnapshot, JsonRecord } from '@/lib/ai-provider-control/types'

export type Actor = { id: string; name: string; role: string }
export type WorkspaceKey = 'command' | 'portfolio' | 'vault' | 'supply' | 'routing' | 'capacity' | 'models' | 'revenue' | 'finance' | 'incidents' | 'changes' | 'academy'
export type EntitySelection = { type: string; id: string; label: string; data: JsonRecord } | null
export type ActionFn = (action: string, payload: JsonRecord, success: string) => Promise<unknown>
export type WorkspaceProps = {
  snapshot: AiProviderSnapshot
  actor: Actor
  act: ActionFn
  openEntity: (entity: EntitySelection) => void
  openDialog: (dialog: string, seed?: JsonRecord) => void
}
