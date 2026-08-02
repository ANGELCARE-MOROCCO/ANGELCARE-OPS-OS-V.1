import type { Angelcare360ModuleRecord } from '@/types/angelcare360/module'
import type { Angelcare360RuntimeEntitlements } from '@/types/angelcare360/entitlements'
import { getAngelcare360RouteBinding } from '@/data/angelcare360/product-constitution'
export const ANGELCARE360_REGISTRY_MODULE_MAP:Record<string,string|null>={
 'cockpit-direction':null,administration:'administration',people:'people',admissions:'admissions',presences:'attendance',academique:'academics',finance:'finance',paie:'payroll',transport:'transport',bibliotheque:'library',inventaire:'inventory',messagerie:'communications',reclamations:'communications',rapports:'reports',
}
const PERMISSION_RULES:Array<[RegExp,string]>=[[/^(?:admissions)\./,'admissions'],[/^(?:eleves|parents|enseignants|personnel|people)\./,'people'],[/^(?:classes|matieres|annees_scolaires|parametres|securite|audit|administration)\./,'administration'],[/^(?:presences|attendance)\./,'attendance'],[/^(?:academics|emploi_du_temps|examens|bulletins|devoirs)\./,'academics'],[/^(?:finance|paiements)\./,'finance'],[/^paie\./,'payroll'],[/^transport\./,'transport'],[/^bibliotheque\./,'library'],[/^inventaire\./,'inventory'],[/^(?:messagerie|notifications|reclamations|communication)\./,'communications'],[/^(?:rapports|exports|documents)\./,'reports']]
export function getAngelcare360ModuleKeyForPath(pathname:string):string|null{return getAngelcare360RouteBinding(pathname)?.entitlementModuleKey||null}
export function getAngelcare360CanonicalModuleKeyForPath(pathname:string):string|null{return getAngelcare360RouteBinding(pathname)?.moduleKey||null}
export function getAngelcare360ModuleKeyForPermission(permissionKey:string):string|null{for(const [pattern,key] of PERMISSION_RULES)if(pattern.test(permissionKey))return key;return null}
const ALIASES:Record<string,string[]>={claims:['claims','communications'],reports:['reports','intelligence'],communications:['communications'],administration:['administration','core_foundation']}
export function isAngelcare360ModuleEnabled(runtime:Angelcare360RuntimeEntitlements|null|undefined,moduleKey:string|null){if(!moduleKey||!runtime?.enforced)return true;return (ALIASES[moduleKey]||[moduleKey]).some(key=>runtime.enabledModules.includes(key))}
export function filterAngelcare360ModulesByEntitlement(modules:Angelcare360ModuleRecord[],runtime:Angelcare360RuntimeEntitlements|null|undefined){if(!runtime?.enforced)return modules;return modules.filter(module=>isAngelcare360ModuleEnabled(runtime,ANGELCARE360_REGISTRY_MODULE_MAP[module.id]??null))}
