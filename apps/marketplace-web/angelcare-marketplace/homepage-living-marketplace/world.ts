import type { Data } from '@puckeditor/core'

export const LIVING_MARKETPLACE_WORLD_ID = 'ac.homepage.living-marketplace.hyper-commerce.02' as const
export const LIVING_MARKETPLACE_WORLD_REVISION = 2 as const
export const LIVING_MARKETPLACE_COMPONENT_TYPE = 'ac_home_pro_max_living_world_02' as const
export const LIVING_MARKETPLACE_REFERENCE_IMAGE = '/angelcare-marketplace/studio/homepage-pro-max/world-01-reference.png' as const
export const LIVING_MARKETPLACE_REFERENCE_SHA256 = '37a379977685225be5313d10b73ca12c4c0621daccce7ea5cb03ea992f4c7f6d' as const

/** Recognise both Puck and canonical persisted selectors, never a root marker alone. */
export function isLivingMarketplaceComponent(component: { type?: unknown; props?: unknown }): boolean {
  const props = component.props && typeof component.props === 'object'
    ? component.props as Record<string, unknown> : {}
  if (props.hidden === true) return false
  return component.type === LIVING_MARKETPLACE_COMPONENT_TYPE || (
    component.type === 'homepage_world' && props.worldId === LIVING_MARKETPLACE_WORLD_ID
  )
}

export function livingMarketplaceComponentInData(data: Data) {
  return data.content?.find(isLivingMarketplaceComponent) || null
}

export type LivingMarketplaceInsertMode = 'replace' | 'append'

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export function buildLivingMarketplaceWorld02Data(current?: Data, mode: LivingMarketplaceInsertMode = 'replace'): Data {
  const root = current?.root ? clone(current.root) : ({ props: {} } as Data['root'])
  const rootProps = ((root?.props || {}) as Record<string, unknown>)
  const preservedRootProps: Record<string, unknown> = {}
  for (const key of ['title', 'locale', 'pageId'] as const) {
    const value = rootProps[key]
    if (typeof value === 'string' && value) preservedRootProps[key] = value
  }
  const marker = {
    worldId: LIVING_MARKETPLACE_WORLD_ID,
    revision: LIVING_MARKETPLACE_WORLD_REVISION,
    visualAuthority: 'source-owned',
    dataAuthority: 'canonical-marketplace-runtime',
    shellBoundary: 'global-header-nav-footer-untouched',
    referenceSha256: LIVING_MARKETPLACE_REFERENCE_SHA256,
  }
  const component = {
    type: LIVING_MARKETPLACE_COMPONENT_TYPE,
    props: {
      id: 'home-living-marketplace-world-02',
      worldId: LIVING_MARKETPLACE_WORLD_ID,
      worldRevision: LIVING_MARKETPLACE_WORLD_REVISION,
      referenceImage: LIVING_MARKETPLACE_REFERENCE_IMAGE,
      density: 'maximum',
      compositionMode: 'hardcoded-source-owned',
      dataMode: 'canonical-live',
      shellMode: 'body-only',
      hidden: false,
      locked: true,
      responsive: { mobileVisible: true, tabletVisible: true, desktopVisible: true },
    },
  }
  const existing = Array.isArray(current?.content) ? clone(current!.content) : []
  const content = mode === 'append' ? [...existing, component] : [component]
  const nextRoot = mode === 'replace'
    ? ({ props: { ...preservedRootProps, __homepageLivingMarketplaceWorld: marker } } as Data['root'])
    : ({ ...root, props: { ...rootProps, __homepageLivingMarketplaceWorld: marker } } as Data['root'])
  return { content, root: nextRoot } as Data
}

export const LIVING_MARKETPLACE_WORLD_02 = {
  id: LIVING_MARKETPLACE_WORLD_ID,
  label: 'AngelCare Living Marketplace — Hyper-Commerce 02',
  description: 'Homepage World 02 · 24 expériences commerciales distinctes · découverte interactive · médias complets · FR/EN/AR · catalogue canonique · parcours existants.',
  experienceVersion: 'r4-complete',
  revision: LIVING_MARKETPLACE_WORLD_REVISION,
  componentType: LIVING_MARKETPLACE_COMPONENT_TYPE,
  referenceImage: LIVING_MARKETPLACE_REFERENCE_IMAGE,
  referenceSha256: LIVING_MARKETPLACE_REFERENCE_SHA256,
  build: buildLivingMarketplaceWorld02Data,
} as const
