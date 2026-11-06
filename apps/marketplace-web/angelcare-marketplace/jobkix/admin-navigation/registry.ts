import { ADMIN_AREAS } from '../admin-contract';
import { WORKSPACES, operatorHref } from '../admin/global-operations/contracts';
import { SUPPLY_SECTIONS } from '../supply/contracts';
export const JOBKIX_ADMIN_ROOT='/angelcare-marketplace/admin/jobkix';
export const JOBKIX_HUB_PATH=JOBKIX_ADMIN_ROOT+'/workspaces';
export type JobkixAdminGroup='operations'|'native'|'specialist';
export interface JobkixAdminEntry { id:string;href:string;title:string;description:string;group:JobkixAdminGroup;workspace:string;requiresMedia?:boolean;links:{title:string;href:string}[] }
const nativeDescriptions:Record<string,string>={verification:'Employeurs, identité et éléments de vérification.',vacancies:'Offres, revue, modération et décisions de publication.',cases:'Signalements, suivi des dossiers et recours.',reputation:'Avis, rémunérations et contrôles de réputation.',taxonomy:'Professions, compétences et taxonomie professionnelle.',editorial:'Contenus, traductions, éditions et publication.',health:'Files opérationnelles, livraisons et incidents.',audit:'Traçabilité, preuves et gouvernance.'};
const supplyLabels:Record<string,string>={overview:'Vue d’ensemble',countries:'Pays',sources:'Sources & API',missions:'Missions',bucket:'Offres collectées',review:'Revue & validation',publications:'Publications',audit:'Audit',feeds:'Flux RSS & Atom',schedules:'Planification',imports:'Imports CSV'};
/** Uses native route contracts. No replacement route or new authorization authority. */
export function jobkixAdminCatalogue(locale:'fr'|'en'|'ar'='fr'):JobkixAdminEntry[]{return [
 ...WORKSPACES.map(w=>({id:'ops.'+w.slug,href:operatorHref(w.slug),title:w.name,description:w.subtitle,group:'operations' as const,workspace:'jobkix.'+w.primary,links:w.tabs.map(tab=>({title:tab[0],href:operatorHref(w.slug,tab[0])}))})),
 ...ADMIN_AREAS.map(a=>({id:'native.'+a.slug,href:JOBKIX_ADMIN_ROOT+'/'+a.slug,title:a.name[locale],description:nativeDescriptions[a.slug],group:'native' as const,workspace:a.workspace,links:[]})),
 {id:'specialist.supply',href:JOBKIX_ADMIN_ROOT+'/strategic-supply',title:'Strategic Supply Command',description:'Acquisition externe, sources, collecte, revue et publication des offres.',group:'specialist',workspace:'jobkix.vacancies',links:SUPPLY_SECTIONS.map(section=>({title:supplyLabels[section]||section,href:JOBKIX_ADMIN_ROOT+'/strategic-supply/'+section}))},
 {id:'specialist.hero',href:JOBKIX_ADMIN_ROOT+'/hero-studio',title:'Hero & Slideshow Studio',description:'Images des pages publiques, scènes, cadrages et diaporamas JOBKIX.',group:'specialist',workspace:'jobkix.editorial',requiresMedia:true,links:[]},
];}
export interface JobkixNavigationAccess {admin:boolean;workspaces:ReadonlySet<string>;mediaView:boolean}
export function filterJobkixAdminEntries(entries:readonly JobkixAdminEntry[],access:JobkixNavigationAccess):JobkixAdminEntry[]{return access.admin?entries.filter(e=>access.workspaces.has(e.workspace)&&(!e.requiresMedia||access.mediaView)):[];}
