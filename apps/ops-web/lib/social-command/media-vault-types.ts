import type { SocialMediaAsset } from "@/lib/social-command/types"

export type MediaVaultLifecycle = "active" | "archived" | "trashed"

export type MediaVaultCategory = {
  id: string
  name: string
  slug: string
  parent_id: string | null
  description: string
  status: MediaVaultLifecycle
  sort_order: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export type MediaVaultCollection = {
  id: string
  name: string
  description: string
  status: MediaVaultLifecycle
  campaign_id: string | null
  sort_order: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export type MediaVaultAsset = SocialMediaAsset & {
  title: string
  description: string
  lifecycle_status: MediaVaultLifecycle
  favorite: boolean
  updated_by: string | null
  updated_at: string
  categories: MediaVaultCategory[]
  collections: MediaVaultCollection[]
}

export type MediaVaultPermissions = {
  view: boolean
  create: boolean
  edit: boolean
  classify: boolean
  archive: boolean
  restore: boolean
  trash: boolean
  hardDelete: boolean
  manageCategories: boolean
  manageCollections: boolean
  actorRole: string
  actorId: string
}

export type MediaVaultStats = {
  active: number
  archived: number
  trashed: number
  ready: number
  images: number
  videos: number
  favorites: number
  categories: number
  collections: number
  bytes: number
}

export type MediaVaultBootstrap = {
  assets: MediaVaultAsset[]
  categories: MediaVaultCategory[]
  collections: MediaVaultCollection[]
  stats: MediaVaultStats
  permissions: MediaVaultPermissions
}
