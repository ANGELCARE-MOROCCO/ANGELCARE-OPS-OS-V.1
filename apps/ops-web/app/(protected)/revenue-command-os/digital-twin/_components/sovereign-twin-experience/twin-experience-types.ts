import type { RevenueTwinEditableEntity, RevenueTwinSectionKey } from '@/lib/revenue-command-os/types'

export type TwinEditorOpener = (entity: RevenueTwinEditableEntity, item?: Record<string, unknown>) => void

export type TwinRouteProps = {
  openEditor: TwinEditorOpener
}

export type TwinRouteIdentity = {
  key: RevenueTwinSectionKey
  concept: string
  title: string
  marker: string
}
