export type CustomerOverlayKind =
  | 'quick-peek'
  | 'dossier'
  | 'focus-command'
  | 'nested-command'
  | 'evidence'
  | 'confirmation'
  | 'palette'

export type CustomerOverlayRegistration = {
  id: string
  kind: CustomerOverlayKind
  parentId: string | null
  requestClose: () => void
  trigger: HTMLElement | null
}
