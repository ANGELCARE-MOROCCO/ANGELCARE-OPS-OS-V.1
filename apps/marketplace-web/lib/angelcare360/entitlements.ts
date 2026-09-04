import type { Angelcare360ModuleRecord } from '@/types/angelcare360/module'
import type { Angelcare360RuntimeEntitlements } from '@/types/angelcare360/entitlements'
import { getAngelcare360RouteBinding } from '@/data/angelcare360/product-constitution'
import { ANGELCARE360_WORKSPACE_ENTITLEMENT_REGISTRY, getAngelcare360WorkspaceEntitlementKey } from '@/lib/angelcare360/workspace-entitlement-registry'
import { decideAngelcare360EntitlementKey } from '@/lib/angelcare360/runtime-entitlement-authority'
export { ANGELCARE360_WORKSPACE_ENTITLEMENT_REGISTRY }
const PERMISSION_RULES:Array<[RegExp,string]>=[[/^(?:admissions)\./,'admissions'],[/^(?:eleves|parents|enseignants|personnel|people)\./,'people'],[/^(?:classes|matieres|annees_scolaires|parametres|securite|audit|administration)\./,'administration'],[/^(?:presences|attendance)\./,'attendance'],[/^(?:academics|emploi_du_temps|examens|bulletins|devoirs)\./,'academics'],[/^(?:finance|paiements)\./,'finance'],[/^paie\./,'payroll'],[/^transport\./,'transport'],[/^bibliotheque\./,'library'],[/^inventaire\./,'inventory'],[/^(?:messagerie|notifications|reclamations|communication)\./,'communications'],[/^(?:rapports|exports|documents)\./,'reports']]
export function getAngelcare360ModuleKeyForPath(pathname:string):string|null{return getAngelcare360RouteBinding(pathname)?.entitlementModuleKey||null}
export function getAngelcare360CanonicalModuleKeyForPath(pathname:string):string|null{return getAngelcare360RouteBinding(pathname)?.moduleKey||null}
export function getAngelcare360ModuleKeyForPermission(permissionKey:string):string|null{for(const [pattern,key] of PERMISSION_RULES)if(pattern.test(permissionKey))return key;return null}
const ALIASES:Record<string,string[]>={claims:['claims','communications'],reports:['reports','intelligence'],communications:['communications'],administration:['administration','core_foundation']}
export function isAngelcare360ModuleEnabled(runtime:Angelcare360RuntimeEntitlements|null|undefined,moduleKey:string|null){if(!moduleKey||!runtime?.enforced)return true;return (ALIASES[moduleKey]||[moduleKey]).some(key=>runtime.enabledModules.includes(key))}
export function filterAngelcare360ModulesByEntitlement(modules:Angelcare360ModuleRecord[],runtime:Angelcare360RuntimeEntitlements|null|undefined){if(!runtime?.enforced)return modules;return modules.filter(module=>isAngelcare360ModuleEnabled(runtime,getAngelcare360WorkspaceEntitlementKey(module.id)))}

function isRuntimeKeyEnabled(
  runtime: Angelcare360RuntimeEntitlements | null | undefined,
  key: string | null | undefined,
  enabled: string[],
  restricted: Array<{ key: string; state: string }>,
) {
  if (!key || !runtime?.enforced) return true
  return decideAngelcare360EntitlementKey(key, enabled, restricted).allowed
}

export function isAngelcare360CapabilityEnabled(
  runtime: Angelcare360RuntimeEntitlements | null | undefined,
  capabilityKey: string | null | undefined,
) {
  return isRuntimeKeyEnabled(
    runtime,
    capabilityKey,
    runtime?.enabledCapabilities || [],
    runtime?.restrictedCapabilities || [],
  )
}

export function isAngelcare360FeatureEnabled(
  runtime: Angelcare360RuntimeEntitlements | null | undefined,
  featureKey: string | null | undefined,
) {
  return isRuntimeKeyEnabled(
    runtime,
    featureKey,
    runtime?.enabledFeatures || [],
    runtime?.restrictedFeatures || [],
  )
}

export function isAngelcare360ServiceEnabled(
  runtime: Angelcare360RuntimeEntitlements | null | undefined,
  serviceKey: string | null | undefined,
) {
  return isRuntimeKeyEnabled(
    runtime,
    serviceKey,
    runtime?.enabledServices || [],
    runtime?.restrictedServices || [],
  )
}

export function isAngelcare360OperationEnabled(
  runtime: Angelcare360RuntimeEntitlements | null | undefined,
  operationKey: string | null | undefined,
) {
  return isRuntimeKeyEnabled(
    runtime,
    operationKey,
    runtime?.enabledOperations || [],
    runtime?.restrictedOperations || [],
  )
}
