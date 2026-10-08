import type { MarketplacePermission } from '../domain/types'

export interface MarketplaceAccessWorkspace {
  key: string
  label: string
  mission: string
  route: string
  domains: readonly string[]
}

export const MARKETPLACE_ACCESS_WORKSPACES = [
  { key:'workspace.commerce_revenue', label:'Commerce & Revenue', route:'/angelcare-marketplace/admin/catalog', mission:'Catalogue, commerce, pipeline, conversion, commandes, paiements et Wallet.', domains:['catalog','commercial','conversion','orders','payments','wallet','commerce','crm','development','quote_basket'] },
  { key:'workspace.customers', label:'Customers', route:'/angelcare-marketplace/admin/customers', mission:'Dossiers clients, familles, service, historique et relation client.', domains:['family','customers','customer','backoffice'] },
  { key:'workspace.operations', label:'Operations', route:'/angelcare-marketplace/admin/operations/fulfillment', mission:'Fulfillment, territoires, parcours, incidents, preuves, recovery et reconciliation opérationnelle.', domains:['operations','territories','territory_health','territory_overrides','territory_readiness','territory_settings','journey','journeys'] },
  { key:'workspace.supply', label:'Supply', route:'/angelcare-marketplace/admin/providers', mission:'Providers, vendors, capacité, eligibility, qualité et settlement.', domains:['providers','vendors'] },
  { key:'workspace.partners', label:'Partners', route:'/angelcare-marketplace/admin/partner-os', mission:'Partner OS, organisations B2B, onboarding tenant et exploitation partenaire.', domains:['partner_os','b2b'] },
  { key:'workspace.academy', label:'Academy', route:'/angelcare-marketplace/admin/academy', mission:'Programmes, cours, cohortes, sessions, attendance, assessment, remediation et certification.', domains:['academy'] },
  { key:'workspace.experience', label:'Experience', route:'/angelcare-marketplace/admin/homepage', mission:'Homepage, Live Experience, Footer, navigation, contenu, merchandising et localisation.', domains:['homepage','live_experience','popup','broadcast','emergency_broadcast','audience','experiment','proof_widget','footer','localization','cms','media','merchandising','navigation','publication','seo','category_native','category_native_import','categories','experience_schema','archetype'] },
  { key:'workspace.growth', label:'Growth', route:'/angelcare-marketplace/admin/growth', mission:'Acquisition, activation, conversion, rétention, referral, promotions et expérimentations Growth.', domains:['growth'] },
  { key:'workspace.finance', label:'Finance', route:'/angelcare-marketplace/admin/finance', mission:'Pricing, marge, invoice readiness, exceptions et rapprochement financier.', domains:['finance'] },
  { key:'workspace.trust_quality', label:'Trust & Quality', route:'/angelcare-marketplace/admin/trust', mission:'Trust, qualité, complaints, investigations, conformité, QA et remédiation.', domains:['trust','quality','complaints','compliance','qa','sensitive_content'] },
  { key:'workspace.intelligence', label:'Intelligence & Analytics', route:'/angelcare-marketplace/admin/intelligence', mission:'Intelligence, analytics, signaux, décisions et actions exécutives.', domains:['intelligence','analytics'] },
  { key:'workspace.platform_security', label:'Platform & Security', route:'/angelcare-marketplace/admin/security', mission:'Sécurité, performance, incidents, backup/recovery et fiabilité plateforme.', domains:['security','performance','backup','recovery_test'] },
  { key:'workspace.launch_governance', label:'Launch & Governance', route:'/angelcare-marketplace/admin/launch', mission:'Readiness, release dossiers, gates, activation, rollback et vérification post-release.', domains:['launch','readiness'] },
] as const satisfies readonly MarketplaceAccessWorkspace[]

export const MARKETPLACE_ACCESS_WORKSPACE_BY_KEY = new Map(MARKETPLACE_ACCESS_WORKSPACES.map((workspace) => [workspace.key, workspace]))

const DOMAIN_TO_ACCESS_KEY = new Map<string,string>()
for (const workspace of MARKETPLACE_ACCESS_WORKSPACES) {
  for (const domain of workspace.domains) DOMAIN_TO_ACCESS_KEY.set(domain, workspace.key)
}

const SENSITIVE_PERMISSION_MARKERS = [
  'certificates.revoke',
  'sensitive_approve',
  'approvals.override',
  'finance.exceptions.approve',
  'finance.price_books.approve',
  'launch.approve',
  'launch.release.approve',
  'launch.rollback_authorize',
  'launch.waivers.approve',
  'localization.sensitive.approve',
  'operating_kernel.approve',
  'operations.closure.approve',
  'operations.reconciliation.approve',
  'territories.approve_live',
  'territories.approve_soft_launch',
  'territory_overrides.approve',
  'territory_overrides.rollback',
  'trust.badges.revoke',
  'wallet.adjusted',
] as const

export function isSensitiveWorkspacePermission(permission: MarketplacePermission): boolean {
  return SENSITIVE_PERMISSION_MARKERS.some((marker) => permission.includes(marker))
}

export function accessWorkspaceKeyForPermission(permission: MarketplacePermission): string | null {
  const domain = permission.split('.')[1] || ''
  return DOMAIN_TO_ACCESS_KEY.get(domain) || null
}

export function accessWorkspaceKeyForOperatingWorkspace(workspaceKey: string): string | null {
  if (MARKETPLACE_ACCESS_WORKSPACE_BY_KEY.has(workspaceKey as Parameters<typeof MARKETPLACE_ACCESS_WORKSPACE_BY_KEY.has>[0])) return workspaceKey
  const domain = workspaceKey.split('.')[0] || ''
  if (domain === 'platform_performance') return 'workspace.platform_security'
  if (domain === 'experience') return 'workspace.experience'
  return DOMAIN_TO_ACCESS_KEY.get(domain) || null
}
