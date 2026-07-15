export type Angelcare360ToolbarScope = 'all' | 'pilotage' | 'scolarite' | 'gestion' | 'services' | 'gouvernance'

export interface Angelcare360ToolbarState {
  query: string
  scope: Angelcare360ToolbarScope
}

export interface Angelcare360CommandCenterStats {
  mappedModules: number
  activeModules: number
  plannedModules: number
  sectionGroups: number
}

