import { createHash } from 'node:crypto'
import { STUDIO_SOURCE_DESCRIPTORS,getStudioSourceDescriptor } from '@/angelcare-marketplace/studio-source-registry/registry'
import type { StudioSourceReference } from '@/angelcare-marketplace/studio-source-registry/types'

export const STUDIO_CACHE_ROOT_TAG='acm:studio:p12'
export const STUDIO_ASSIGNMENT_CACHE_TAG='acm:studio:p12:assignments'
export const STUDIO_DEPENDENCY_SOURCE_IDS=[...STUDIO_SOURCE_DESCRIPTORS.map(row=>row.id),'homepage.placements','content.template_revisions','studio.pages','studio.assignments'] as const
const safe=(value:string)=>value.trim().toLowerCase().replace(/[^a-z0-9._:-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')
export function studioCacheTag(...parts:(string|null|undefined)[]){const raw=[STUDIO_CACHE_ROOT_TAG,...parts.filter(Boolean).map(v=>safe(String(v)))].join(':');return raw.length<=220?raw:`${STUDIO_CACHE_ROOT_TAG}:sha256:${createHash('sha256').update(raw).digest('hex')}`}
export const studioSourceFamilyTag=(sourceId:string)=>studioCacheTag('source',sourceId)
export const studioSourceEntityTag=(reference:StudioSourceReference)=>studioCacheTag('source',reference.sourceId,reference.entityId)
export const studioTemplateTag=(templateId:string)=>studioCacheTag('template',templateId)
export const studioTemplateRevisionTag=(revisionId:string)=>studioCacheTag('template-revision',revisionId)
export const studioPageTag=(pageId:string)=>studioCacheTag('page',pageId)
export function isStudioDependencySource(sourceId:string){return Boolean(getStudioSourceDescriptor(sourceId))||['homepage.placements','content.template_revisions','studio.pages','studio.assignments'].includes(sourceId)}
export const LEGACY_EDGE_TARGET_TYPES:Record<string,string[]>={'media.assets':['media_asset'],'content.templates':['template'],'content.pages':['page'],'content.symbols':['symbol']}
