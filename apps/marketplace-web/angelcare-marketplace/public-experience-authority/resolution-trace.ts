import 'server-only'
import {randomUUID} from 'node:crypto'
import {getAdaptiveExperience} from '@/angelcare-marketplace/category-native-experience/repository'
import {resolveStudioTemplateForCatalogItem} from '@/angelcare-marketplace/studio-template-assignment/resolver'
import {getPublicExperienceThemeManifest} from './repository'
import {resolvePublicExperienceDetailTemplate} from './detail-resolver'
import {buildPublicExperience360} from './public-experience-360'
import {evaluatePublicExperienceTruth} from './truth-firewall'
import {compilePublicExperienceTheme} from './theme-compiler'
import type {PublicExperienceResolutionStep,PublicExperienceResolutionTrace} from './types'

export async function buildPublicExperienceResolutionTrace(input:{slug:string;locale:'fr'|'en'|'ar';collectionId?:string|null;placementId?:string|null}):Promise<PublicExperienceResolutionTrace|null>{
 const experience=await getAdaptiveExperience({locale:input.locale,slug:input.slug});if(!experience)return null
 const legacy=await resolveStudioTemplateForCatalogItem({slug:input.slug,locale:input.locale,collectionId:input.collectionId||null,placementId:input.placementId||null})
 const authority=await resolvePublicExperienceDetailTemplate({experience,legacyResolution:legacy})
 const data360=await buildPublicExperience360(experience),truth=evaluatePublicExperienceTruth(data360)
 const steps:PublicExperienceResolutionStep[]=(authority.resolution?.provenance||[]).map(row=>({scope:row.scope,status:row.status==='VALID'&&authority.resolution?.matchedScope===row.scope?'WINNER':row.status==='VALID'?'VALID':row.status==='MISS'?'MISS':'BLOCKED',authority:row.authority,detail:row.detail,templateId:row.assignment?.template?.entityId||null}))
 if(authority.source!=='P04_SPECIFIC'&&authority.source!=='P04_LEGACY')steps.push({scope:authority.source.replace('PEA_','').toLowerCase(),status:'WINNER',authority:'Public Experience Authority',detail:`Résolution ${authority.source}.`,templateId:authority.resolution?.templateId||null})
 let compile=null;if(authority.resolution?.templateId){const manifest=await getPublicExperienceThemeManifest(authority.resolution.templateId);if(manifest)compile=compilePublicExperienceTheme({manifest,masterDomain:authority.context.masterDomain,doctrineKeys:[authority.context.doctrineKey]})}
 return{traceId:`pea_${randomUUID()}`,generatedAt:new Date().toISOString(),slug:input.slug,locale:input.locale,context:authority.context,source:authority.source,templateId:authority.resolution?.templateId||null,templateKey:authority.resolution?.templateKey||null,templateRevisionId:authority.resolution?.templateRevisionId||null,steps,compile,truth,experience360:data360}
}
