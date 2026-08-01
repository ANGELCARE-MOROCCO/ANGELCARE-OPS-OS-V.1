import type { Angelcare360ModuleRecord } from '@/types/angelcare360/module'
import type { Angelcare360RuntimeEntitlements } from '@/types/angelcare360/entitlements'

export const ANGELCARE360_REGISTRY_MODULE_MAP: Record<string, string | null> = {
  'cockpit-direction': null,
  admissions: 'admissions',
  eleves: 'people',
  parents: 'people',
  enseignants: 'people',
  personnel: 'people',
  'classes-sections': 'administration',
  matieres: 'administration',
  'annees-scolaires': 'administration',
  presences: 'attendance',
  academique: 'academics',
  'emploi-du-temps': 'academics',
  devoirs: 'academics',
  'examens-notes': 'academics',
  bulletins: 'academics',
  'frais-paiements': 'finance',
  comptabilite: 'finance',
  paie: 'payroll',
  transport: 'transport',
  bibliotheque: 'library',
  inventaire: 'inventory',
  messagerie: 'communications',
  notifications: 'communications',
  reclamations: 'communications',
  rapports: 'reports',
  exports: 'reports',
  documents: 'reports',
  administration: 'administration',
  parametres: 'administration',
  'roles-permissions': 'administration',
  'audit-securite': 'administration',
}

const PATH_RULES: Array<[RegExp, string | null]> = [
  [/^\/angelcare-360-command-center(?:\/direction)?\/?$/, null],
  [/\/admissions(?:\/|$)/, 'admissions'],
  [/\/(?:eleves|parents|enseignants|personnel|people)(?:\/|$)/, 'people'],
  [/\/(?:classes-sections|matieres|annees-scolaires|administration|parametres|roles-permissions|audit-securite)(?:\/|$)/, 'administration'],
  [/\/presences(?:\/|$)/, 'attendance'],
  [/\/(?:academique|emploi-du-temps|devoirs|examens|bulletins)(?:\/|$)/, 'academics'],
  [/\/finance(?:\/|$)/, 'finance'],
  [/\/paie(?:\/|$)/, 'payroll'],
  [/\/transport(?:\/|$)/, 'transport'],
  [/\/bibliotheque(?:\/|$)/, 'library'],
  [/\/inventaire(?:\/|$)/, 'inventory'],
  [/\/(?:messagerie|notifications|reclamations)(?:\/|$)/, 'communications'],
  [/\/(?:rapports|exports|documents)(?:\/|$)/, 'reports'],
]

const PERMISSION_RULES: Array<[RegExp, string]> = [
  [/^(?:admissions)\./, 'admissions'],
  [/^(?:eleves|parents|enseignants|personnel)\./, 'people'],
  [/^(?:classes|matieres|annees_scolaires|parametres|securite|audit)\./, 'administration'],
  [/^(?:presences|attendance)\./, 'attendance'],
  [/^(?:academics|emploi_du_temps|examens|bulletins|devoirs)\./, 'academics'],
  [/^(?:finance|paiements)\./, 'finance'],
  [/^paie\./, 'payroll'],
  [/^transport\./, 'transport'],
  [/^bibliotheque\./, 'library'],
  [/^inventaire\./, 'inventory'],
  [/^(?:messagerie|notifications|reclamations|communication)\./, 'communications'],
  [/^(?:rapports|exports|documents)\./, 'reports'],
]

export function getAngelcare360ModuleKeyForPath(pathname: string): string | null {
  for (const [pattern, moduleKey] of PATH_RULES) {
    if (pattern.test(pathname)) return moduleKey
  }
  return null
}

export function getAngelcare360ModuleKeyForPermission(permissionKey: string): string | null {
  for (const [pattern, moduleKey] of PERMISSION_RULES) {
    if (pattern.test(permissionKey)) return moduleKey
  }
  return null
}

export function isAngelcare360ModuleEnabled(runtime: Angelcare360RuntimeEntitlements | null | undefined, moduleKey: string | null) {
  if (!moduleKey || !runtime?.enforced) return true
  return runtime.enabledModules.includes(moduleKey)
}

export function filterAngelcare360ModulesByEntitlement(
  modules: Angelcare360ModuleRecord[],
  runtime: Angelcare360RuntimeEntitlements | null | undefined,
) {
  if (!runtime?.enforced) return modules
  return modules.filter((module) => isAngelcare360ModuleEnabled(runtime, ANGELCARE360_REGISTRY_MODULE_MAP[module.id] ?? null))
}
