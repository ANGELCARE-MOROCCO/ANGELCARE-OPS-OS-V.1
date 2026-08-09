import type { ContentCommandNavigationGroup } from "../content-command-navigation"

export type ContentCommandExperienceMode = "executive" | "production" | "focus" | "audit"
export type ContentCommandDensity = "comfortable" | "compact"
export type ContentCommandSidebarMode = "expanded" | "compact" | "focus-hidden"

export type ContentCommandRecentRoute = {
  href: string
  label: string
  visitedAt: number
}

export type ContentCommandShellPreferences = {
  sidebarMode: ContentCommandSidebarMode
  expandedGroups: ContentCommandNavigationGroup[]
  favorites: string[]
  recentRoutes: ContentCommandRecentRoute[]
  mode: ContentCommandExperienceMode
  density: ContentCommandDensity
}
