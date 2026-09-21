import {createHash} from 'node:crypto'
import {getStudioActionDescriptor} from '@/angelcare-marketplace/studio-action-registry/registry'
import {getStudioWorkflowDescriptor} from '@/angelcare-marketplace/studio-workflows/registry'
import {PUBLIC_EXPERIENCE_BINDING_BY_KEY} from './typed-bindings'
import {PUBLIC_EXPERIENCE_DOCTRINE_RECIPES} from './doctrine-recipes'
import {evaluateDetailThemeCompatibility,evaluateStorefrontThemeCompatibility} from './compatibility'
import type {PublicExperienceCompileResult,PublicExperienceMasterDomain,PublicExperienceThemeManifest} from './types'
import type {StorefrontKey} from '@/angelcare-marketplace/catalog-discovery/types'
import {PUBLIC_EXPERIENCE_WORLD_FACTORY_ENGINE_VERSION,PUBLIC_EXPERIENCE_WORLD_FACTORY_SCHEMA_VERSION} from './world-factory/types'

const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex')
const wildcard=(key:string)=>key.endsWith('.*')
function bindingCovered(key:string,manifest:PublicExperienceThemeManifest){if(manifest.requiredBindings.includes(key)||manifest.optionalBindings.includes(key))return true;return [...manifest.requiredBindings,...manifest.optionalBindings].some(pattern=>wildcard(pattern)&&key.startsWith(pattern.slice(0,-1)))}

export function compilePublicExperienceTheme(input:{manifest:PublicExperienceThemeManifest;masterDomain?:PublicExperienceMasterDomain|null;doctrineKeys?:string[];storefrontKey?:StorefrontKey|null}):PublicExperienceCompileResult{
 const {manifest}=input,blockers:string[]=[],warnings:string[]=[];let doctrines=input.doctrineKeys||[]
 if(manifest.themeKind==='detail'){
  const domain=input.masterDomain||manifest.acceptedMasterDomains[0]||null;if(!domain)blockers.push('Master domain detail absent.')
  const compatibility=domain?evaluateDetailThemeCompatibility({manifest,scope:'master_domain',key:domain,masterDomain:domain}):{compatible:false,reasons:['Master domain absent.'],warnings:[]};blockers.push(...compatibility.reasons);warnings.push(...compatibility.warnings)
  if(!doctrines.length)doctrines=manifest.acceptedDoctrineKeys.length?[...manifest.acceptedDoctrineKeys]:PUBLIC_EXPERIENCE_DOCTRINE_RECIPES.filter(row=>row.masterDomain===domain).map(row=>row.doctrineKey)
 }else if(input.storefrontKey){const c=evaluateStorefrontThemeCompatibility({manifest,storefrontKey:input.storefrontKey});blockers.push(...c.reasons);warnings.push(...c.warnings)}
 const recipes=PUBLIC_EXPERIENCE_DOCTRINE_RECIPES.filter(row=>doctrines.includes(row.doctrineKey));const requiredBindings=[...new Set(recipes.flatMap(row=>row.requiredBindings))]
 const resolvedBindings=requiredBindings.filter(key=>bindingCovered(key,manifest)||PUBLIC_EXPERIENCE_BINDING_BY_KEY.has(key)&&manifest.requiredCapabilities.includes('public-experience-360'))
 const missingBindings=requiredBindings.filter(key=>!resolvedBindings.includes(key));if(missingBindings.length)blockers.push(`Bindings requis non couverts: ${missingBindings.join(', ')}`)
 const requiredActions=[...new Set(recipes.flatMap(row=>row.requiredActions).concat(manifest.requiredActions))],resolvedActions=requiredActions.filter(id=>Boolean(getStudioActionDescriptor(id))),missingActions=requiredActions.filter(id=>!resolvedActions.includes(id));if(missingActions.length)blockers.push(`Actions inconnues: ${missingActions.join(', ')}`)
 const requiredWorkflows=[...new Set(recipes.flatMap(row=>row.requiredWorkflows).concat(manifest.requiredWorkflows))],resolvedWorkflows=requiredWorkflows.filter(id=>Boolean(getStudioWorkflowDescriptor(id))),missingWorkflows=requiredWorkflows.filter(id=>!resolvedWorkflows.includes(id));if(missingWorkflows.length)blockers.push(`Workflows inconnus: ${missingWorkflows.join(', ')}`)
 if(manifest.factory){if(manifest.factory.engineVersion!==PUBLIC_EXPERIENCE_WORLD_FACTORY_ENGINE_VERSION||manifest.factory.schemaVersion!==PUBLIC_EXPERIENCE_WORLD_FACTORY_SCHEMA_VERSION)blockers.push('World Factory version incompatible.');if(manifest.factory.certification.blockers.length)blockers.push(...manifest.factory.certification.blockers.map(row=>`World Factory: ${row}`));if(!manifest.factory.certification.productionEligible)warnings.push('World Factory certifié en mode review uniquement; publication production bloquée tant que la fidélité stricte n’est pas validée.')}
 if(!manifest.structuralFingerprint)warnings.push('Structural fingerprint absent.');if(!manifest.visualFingerprint)warnings.push('Visual fingerprint absent.');if(!manifest.slots.length)warnings.push('Aucun slot sémantique déclaré.')
 const total=Math.max(1,requiredBindings.length+requiredActions.length+requiredWorkflows.length+4),done=resolvedBindings.length+resolvedActions.length+resolvedWorkflows.length+(manifest.structuralFingerprint?1:0)+(manifest.visualFingerprint?1:0)+(manifest.responsiveContract==='desktop-mobile-native'?1:0)+(manifest.fallbackContract==='native-fallback'?1:0),score=Math.max(0,Math.min(100,Math.round(done/total*100)))
 return{compatible:blockers.length===0,score,level:blockers.length?'BLOCKED':warnings.length?'WATCH':'READY',blockers,warnings,resolvedBindings,missingBindings,actions:{required:requiredActions,resolved:resolvedActions,missing:missingActions},workflows:{required:requiredWorkflows,resolved:resolvedWorkflows,missing:missingWorkflows},doctrines,structuralFingerprint:manifest.structuralFingerprint,manifestFingerprint:hash(manifest)}
}
