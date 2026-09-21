import type { StorefrontKey } from '@/angelcare-marketplace/catalog-discovery/types'
import { PUBLIC_EXPERIENCE_AUTHORITY_VERSION, type PublicExperienceAssignmentLifecycle, type PublicExperienceDetailAssignment, type PublicExperienceDetailScope, type PublicExperienceMasterDomain, type PublicExperienceStorefrontAssignment, type PublicExperienceThemeManifest } from './types'
import {normalizeAssignmentLifecycle} from './assignment-lifecycle'
import { PUBLIC_EXPERIENCE_MASTER_DOMAINS, PUBLIC_EXPERIENCE_STOREFRONTS } from './registry'
import {parseWorldFactoryRecord} from './world-factory/serialization'

export const PEA_CONFIG_PREFIX='public-experience.'
export const PEA_THEME_MANIFEST_PREFIX=`${PEA_CONFIG_PREFIX}theme-manifest.`
export const PEA_DETAIL_ASSIGNMENT_PREFIX=`${PEA_CONFIG_PREFIX}detail.`
export const PEA_STOREFRONT_ASSIGNMENT_PREFIX=`${PEA_CONFIG_PREFIX}storefront.`

const rec=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{ }
const text=(value:unknown)=>typeof value==='string'?value.trim():''
const arr=(value:unknown)=>Array.isArray(value)?value.filter((row):row is string=>typeof row==='string'):[]
export const safePublicExperienceKey=(value:unknown)=>text(value).toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,160)

export function themeManifestConfigKey(templateId:string){return `${PEA_THEME_MANIFEST_PREFIX}${safePublicExperienceKey(templateId)}`}
export function detailAssignmentConfigKey(scope:PublicExperienceDetailScope,key:string){return `${PEA_DETAIL_ASSIGNMENT_PREFIX}${scope}.${safePublicExperienceKey(key)}`}
export function storefrontAssignmentConfigKey(key:StorefrontKey){return `${PEA_STOREFRONT_ASSIGNMENT_PREFIX}${safePublicExperienceKey(key)}`}

export function parseThemeManifest(value:unknown):PublicExperienceThemeManifest|null{
  const row=rec(value),themeKind=text(row.themeKind)
  if(row.version!==PUBLIC_EXPERIENCE_AUTHORITY_VERSION||!['detail','storefront'].includes(themeKind))return null
  const acceptedMasterDomains=arr(row.acceptedMasterDomains).filter(key=>PUBLIC_EXPERIENCE_MASTER_DOMAINS.some(domain=>domain.key===key)) as PublicExperienceMasterDomain[]
  const acceptedStorefrontKeys=arr(row.acceptedStorefrontKeys).filter(key=>PUBLIC_EXPERIENCE_STOREFRONTS.some(storefront=>storefront.key===key)) as StorefrontKey[]
  const slots=Array.isArray(row.slots)?row.slots.filter(entry=>entry&&typeof entry==='object'&&!Array.isArray(entry)).map(entry=>{const slot=rec(entry);return{blockId:text(slot.blockId),slot:text(slot.slot) as any,confidence:Number(slot.confidence||0),reason:text(slot.reason)}}).filter(slot=>slot.blockId&&slot.slot):[]
  return{
    version:1,themeKind:themeKind as 'detail'|'storefront',themeName:text(row.themeName),themeVersion:text(row.themeVersion)||'1.0.0',
    acceptedMasterDomains,acceptedDoctrineKeys:arr(row.acceptedDoctrineKeys),acceptedBusinessFamilyKeys:arr(row.acceptedBusinessFamilyKeys),acceptedStorefrontKeys,
    requiredBindings:arr(row.requiredBindings),optionalBindings:arr(row.optionalBindings),requiredActions:arr(row.requiredActions),optionalActions:arr(row.optionalActions),requiredWorkflows:arr(row.requiredWorkflows),requiredCapabilities:arr(row.requiredCapabilities),slots,
    responsiveContract:'desktop-mobile-native',commerceContract:'canonical-only',fallbackContract:'native-fallback',seoContract:'canonical-route-owned',accessibilityContract:'wcag-operational',performanceContract:'bounded-runtime',compatibilityVersion:1,
    structuralFingerprint:text(row.structuralFingerprint),visualFingerprint:text(row.visualFingerprint),sourceLabel:text(row.sourceLabel),importedAt:text(row.importedAt),importedBy:text(row.importedBy)||null,factory:parseWorldFactoryRecord(row.factory),
  }
}

export function parseDetailAssignment(value:unknown):PublicExperienceDetailAssignment|null{
  const row=rec(value),scope=text(row.scope) as PublicExperienceDetailScope,key=safePublicExperienceKey(row.key),templateId=text(row.templateId),masterDomain=text(row.masterDomain) as PublicExperienceMasterDomain
  if(row.version!==1||!['business_family','doctrine','master_domain'].includes(scope)||!key||!templateId)return null
  const lifecycle=normalizeAssignmentLifecycle(rec(row.lifecycle) as Partial<PublicExperienceAssignmentLifecycle>)
  return{version:1,scope,key,masterDomain:PUBLIC_EXPERIENCE_MASTER_DOMAINS.some(domain=>domain.key===masterDomain)?masterDomain:null,templateId,enabled:row.enabled!==false,reason:text(row.reason),updatedAt:text(row.updatedAt),updatedBy:text(row.updatedBy)||null,lifecycle}
}

export function parseStorefrontAssignment(value:unknown):PublicExperienceStorefrontAssignment|null{
  const row=rec(value),key=text(row.storefrontKey) as StorefrontKey,templateId=text(row.templateId)
  if(row.version!==1||!PUBLIC_EXPERIENCE_STOREFRONTS.some(storefront=>storefront.key===key)||!templateId)return null
  const lifecycle=normalizeAssignmentLifecycle(rec(row.lifecycle) as Partial<PublicExperienceAssignmentLifecycle>)
  const density=['premium','commerce','hyper_commerce','festival'].includes(text(row.density))?text(row.density) as any:undefined
  return{version:1,storefrontKey:key,templateId,enabled:row.enabled!==false,reason:text(row.reason),updatedAt:text(row.updatedAt),updatedBy:text(row.updatedBy)||null,lifecycle,density}
}
