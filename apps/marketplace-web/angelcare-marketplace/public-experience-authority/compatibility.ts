import type { StorefrontKey } from '@/angelcare-marketplace/catalog-discovery/types'
import type { PublicExperienceDetailScope, PublicExperienceMasterDomain, PublicExperienceThemeManifest } from './types'
import { publicExperienceDoctrineProfile, publicExperienceMasterDomainProfile, publicExperienceStorefrontProfile } from './registry'

export interface PublicExperienceCompatibilityResult {compatible:boolean;reasons:string[];warnings:string[]}

export function evaluateDetailThemeCompatibility(input:{manifest:PublicExperienceThemeManifest;scope:PublicExperienceDetailScope;key:string;masterDomain?:PublicExperienceMasterDomain|null}):PublicExperienceCompatibilityResult{
  const {manifest,scope,key}=input;const reasons:string[]=[],warnings:string[]=[]
  if(manifest.themeKind!=='detail')reasons.push('Le template n’est pas déclaré comme thème detail.')
  const domain=scope==='master_domain'?key as PublicExperienceMasterDomain:scope==='doctrine'?publicExperienceDoctrineProfile(key)?.masterDomain||input.masterDomain||null:input.masterDomain||null
  if(domain&&!publicExperienceMasterDomainProfile(domain))reasons.push('Master domain inconnu.')
  if(domain&&manifest.acceptedMasterDomains.length&&!manifest.acceptedMasterDomains.includes(domain))reasons.push(`Le thème n’accepte pas le domaine ${domain}.`)
  if(scope==='doctrine'){
    if(!publicExperienceDoctrineProfile(key))reasons.push('Doctrine inconnue.')
    if(manifest.acceptedDoctrineKeys.length&&!manifest.acceptedDoctrineKeys.includes(key))reasons.push(`La doctrine ${key} n’est pas acceptée par ce thème.`)
  }
  if(scope==='business_family'&&manifest.acceptedBusinessFamilyKeys.length&&!manifest.acceptedBusinessFamilyKeys.includes(key))reasons.push(`La famille ${key} n’est pas acceptée explicitement.`)
  if(!manifest.structuralFingerprint)warnings.push('Empreinte structurelle absente.')
  if(!manifest.visualFingerprint)warnings.push('Empreinte visuelle absente.')
  if(manifest.responsiveContract!=='desktop-mobile-native')reasons.push('Contrat responsive incompatible.')
  return{compatible:reasons.length===0,reasons,warnings}
}

export function evaluateStorefrontThemeCompatibility(input:{manifest:PublicExperienceThemeManifest;storefrontKey:StorefrontKey}):PublicExperienceCompatibilityResult{
  const reasons:string[]=[],warnings:string[]=[]
  if(!publicExperienceStorefrontProfile(input.storefrontKey))reasons.push('Storefront inconnu.')
  if(input.manifest.themeKind!=='storefront')reasons.push('Le template n’est pas déclaré comme world storefront.')
  if(input.manifest.acceptedStorefrontKeys.length&&!input.manifest.acceptedStorefrontKeys.includes(input.storefrontKey))reasons.push(`Le storefront ${input.storefrontKey} n’est pas accepté par ce world.`)
  if(!input.manifest.slots.some(slot=>slot.slot==='hero'))warnings.push('Aucun slot hero explicite; le runtime conservera le contenu du template si nécessaire.')
  if(!input.manifest.slots.some(slot=>['featured_items','inventory_items'].includes(slot.slot)))warnings.push('Aucun rail catalogue explicite; le runtime ne forcera aucun inventaire dans un bloc arbitraire.')
  return{compatible:reasons.length===0,reasons,warnings}
}
