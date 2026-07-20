import type { ModuleRuntime } from './types.js'
const loaders: Record<string, () => Promise<{ default: ModuleRuntime }>> = {
  revenue_b2b: () => import('./revenue-b2b.js'),
  capital_command: () => import('./capital-command.js'),
  market_os: () => import('./market-os.js'),
  ambassadors: () => import('./ambassadors.js'),
  campaign_lifecycle: () => import('./campaign-lifecycle.js'),
  seo_blog: () => import('./seo-blog.js'),
}
export async function loadAssignedModule(key: string) {
  const loader = loaders[key]
  if (!loader) throw new Error(`UNKNOWN_MODULE_${key}`)
  return (await loader()).default
}
