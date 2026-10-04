import type { ComponentData } from '@puckeditor/core'

export const ATOMIC_WORLD_TYPES = [
  'ac_product_world',
  'ac_service_world',
  'ac_academy_world',
  'ac_b2b_world',
] as const

export type AtomicWorldType = typeof ATOMIC_WORLD_TYPES[number]
export type WorldVisualAuthority = 'world-factory' | 'native-fallback' | 'block-runtime'

const atomicWorldTypeSet = new Set<string>(ATOMIC_WORLD_TYPES)

export function nestedWorldComponents(component: ComponentData): ComponentData[] {
  const props = component.props as Record<string, unknown> | undefined
  const content = props?.content
  return Array.isArray(content)
    ? content.filter((row): row is ComponentData => Boolean(row) && typeof row === 'object' && !Array.isArray(row) && typeof (row as ComponentData).type === 'string')
    : []
}

/**
 * Imported World Factory anatomy is structural. A semantic world root with real
 * nested components is a visual composition and must remain the renderer.
 * Runtime data may hydrate those blocks, but may never replace that tree.
 */
export function hasImportedWorldAnatomy(component: ComponentData): boolean {
  return nestedWorldComponents(component).length > 0
}

export function isAtomicWorldType(type: string): type is AtomicWorldType {
  return atomicWorldTypeSet.has(type)
}

export function worldVisualAuthority(type: string, component: ComponentData): WorldVisualAuthority {
  if (!isAtomicWorldType(type)) return 'block-runtime'
  return hasImportedWorldAnatomy(component) ? 'world-factory' : 'native-fallback'
}

export function shouldUseNativeAtomicFallback(type: string, component: ComponentData): boolean {
  return worldVisualAuthority(type, component) === 'native-fallback'
}
