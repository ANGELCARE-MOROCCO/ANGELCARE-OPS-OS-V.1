import type { Angelcare360ModuleSection } from '@/types/angelcare360/module'
import { ANGELCARE360_MODULE_REGISTRY } from './module-registry'
import { filterAngelcare360ModulesByEntitlement } from '@/lib/angelcare360/entitlements'
import type { Angelcare360RuntimeEntitlements } from '@/types/angelcare360/entitlements'
export const ANGELCARE360_NAV_SECTIONS: Omit<Angelcare360ModuleSection,'items'>[]=[
 {group:'Pilotage',label:'Pilotage',summary:'Cockpit et décisions quotidiennes.'},
 {group:'Scolarité',label:'Scolarité',summary:'Personnes, admissions, présence et académique.'},
 {group:'Gestion',label:'Gestion',summary:'Finance scolaire et paie.'},
 {group:'Services',label:'Services',summary:'Transport, ressources, communication et intelligence.'},
 {group:'Gouvernance',label:'Gouvernance',summary:'Fondation, rôles et configuration.'},
]
export function getAngelcare360NavigationSections(runtime?:Angelcare360RuntimeEntitlements|null):Angelcare360ModuleSection[]{const visible=filterAngelcare360ModulesByEntitlement(ANGELCARE360_MODULE_REGISTRY,runtime);return ANGELCARE360_NAV_SECTIONS.map(section=>({...section,items:visible.filter(module=>module.group===section.group)}))}
