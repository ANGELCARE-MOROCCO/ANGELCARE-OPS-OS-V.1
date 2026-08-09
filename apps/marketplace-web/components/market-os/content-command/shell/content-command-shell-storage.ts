import {
  contentCommandNavigationGroups,
  type ContentCommandNavigationGroup,
} from "../content-command-navigation"
import type {
  ContentCommandDensity,
  ContentCommandExperienceMode,
  ContentCommandRecentRoute,
  ContentCommandSidebarMode,
  ContentCommandShellPreferences,
} from "./content-command-shell-types"

const PREFIX = "angelcare:sanila:market-os:content-command:shell"

export const CONTENT_COMMAND_SHELL_STORAGE = {
  sidebarMode: `${PREFIX}:sidebar-mode`,
  expandedGroups: `${PREFIX}:groups`,
  favorites: `${PREFIX}:favorites`,
  recentRoutes: `${PREFIX}:recent-routes`,
  mode: `${PREFIX}:experience-mode`,
  density: `${PREFIX}:density`,
} as const

const SIDEBAR_MODES: readonly ContentCommandSidebarMode[] = ["expanded", "compact", "focus-hidden"]
const EXPERIENCE_MODES: readonly ContentCommandExperienceMode[] = ["executive", "production", "focus", "audit"]
const DENSITY_MODES: readonly ContentCommandDensity[] = ["comfortable", "compact"]
const GROUP_KEYS = new Set(contentCommandNavigationGroups.map((group) => group.key))

export const DEFAULT_CONTENT_COMMAND_PREFERENCES: ContentCommandShellPreferences = {
  sidebarMode: "expanded",
  expandedGroups: contentCommandNavigationGroups
    .filter((group) => group.defaultExpanded)
    .map((group) => group.key),
  favorites: [],
  recentRoutes: [],
  mode: "executive",
  density: "comfortable",
}

function readString(key: string): string | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function readArray(key: string): unknown[] {
  const raw = readString(key)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function isRecentRoute(value: unknown): value is ContentCommandRecentRoute {
  if (!value || typeof value !== "object") return false
  const candidate = value as Partial<ContentCommandRecentRoute>
  return (
    typeof candidate.href === "string" &&
    typeof candidate.label === "string" &&
    typeof candidate.visitedAt === "number"
  )
}

export function readContentCommandShellPreferences(): ContentCommandShellPreferences {
  const sidebarModeValue = readString(CONTENT_COMMAND_SHELL_STORAGE.sidebarMode)
  const modeValue = readString(CONTENT_COMMAND_SHELL_STORAGE.mode)
  const densityValue = readString(CONTENT_COMMAND_SHELL_STORAGE.density)

  const expandedGroups = readArray(CONTENT_COMMAND_SHELL_STORAGE.expandedGroups).filter(
    (value): value is ContentCommandNavigationGroup =>
      typeof value === "string" && GROUP_KEYS.has(value as ContentCommandNavigationGroup),
  )

  const favorites = readArray(CONTENT_COMMAND_SHELL_STORAGE.favorites).filter(
    (value): value is string => typeof value === "string",
  )

  const recentRoutes = readArray(CONTENT_COMMAND_SHELL_STORAGE.recentRoutes)
    .filter(isRecentRoute)
    .slice(0, 8)

  return {
    sidebarMode:
      sidebarModeValue && SIDEBAR_MODES.includes(sidebarModeValue as ContentCommandSidebarMode)
        ? (sidebarModeValue as ContentCommandSidebarMode)
        : DEFAULT_CONTENT_COMMAND_PREFERENCES.sidebarMode,
    expandedGroups:
      expandedGroups.length > 0
        ? expandedGroups
        : DEFAULT_CONTENT_COMMAND_PREFERENCES.expandedGroups,
    favorites: Array.from(new Set(favorites)).slice(0, 8),
    recentRoutes,
    mode:
      modeValue && EXPERIENCE_MODES.includes(modeValue as ContentCommandExperienceMode)
        ? (modeValue as ContentCommandExperienceMode)
        : DEFAULT_CONTENT_COMMAND_PREFERENCES.mode,
    density:
      densityValue && DENSITY_MODES.includes(densityValue as ContentCommandDensity)
        ? (densityValue as ContentCommandDensity)
        : DEFAULT_CONTENT_COMMAND_PREFERENCES.density,
  }
}

export function writeContentCommandShellPreference(
  key: keyof typeof CONTENT_COMMAND_SHELL_STORAGE,
  value: string | string[] | ContentCommandRecentRoute[],
): void {
  if (typeof window === "undefined") return
  try {
    const storageKey = CONTENT_COMMAND_SHELL_STORAGE[key]
    const serialized = typeof value === "string" ? value : JSON.stringify(value)
    window.localStorage.setItem(storageKey, serialized)
  } catch {
    // Preference persistence must never prevent the workspace from operating.
  }
}
