import 'server-only'
import type { MarketplaceRequestContext } from '@/angelcare-marketplace/domain/types'
import { getPageDetail, listDependencyEdges, listPreviewSessions, listSymbols, listTemplates, updatePage } from '@/angelcare-marketplace/experience-builder/repository'
import { auditStudioPerformance } from './performance'
import { cmsBlocksToPuckData } from './puck-bridge'
import { studioRuntimeParityReport } from './runtime-parity'
import { studioPublicationGate } from './publication-gate'

export async function loadStudioGovernance(pageId:string){
  const [detail,templates,symbols,dependencies,previews]=await Promise.all([
    getPageDetail(pageId),listTemplates(),listSymbols(),listDependencyEdges({pageId}),listPreviewSessions(pageId),
  ])
  const data=cmsBlocksToPuckData(detail.blocks,{title:detail.page.title,locale:detail.page.locale,pageId:detail.page.id})
  const performance=auditStudioPerformance(data)
  const parity=studioRuntimeParityReport()
  const publicationGate=studioPublicationGate(data)
  const page=detail.page
  const blockers:string[]=[]
  if(!page.title?.trim()) blockers.push('TITLE_MISSING')
  if(!page.slug?.trim()) blockers.push('SLUG_MISSING')
  blockers.push(...publicationGate.blockers)
  if(!parity.pass) blockers.push('RUNTIME_PARITY')
  return {
    page:{id:page.id,title:page.title,slug:page.slug,locale:page.locale,status:page.status,currentVersion:page.current_version,publishedVersion:page.published_version,seoTitle:page.seo_title||'',seoDescription:page.seo_description||''},
    templates:templates.map(row=>({id:row.id,name:row.name,status:row.status,category:row.category,updatedAt:row.updated_at})),
    symbols:symbols.map(row=>({id:row.id,name:row.name,status:row.status,policy:row.propagation_policy,updatedAt:row.updated_at})),
    dependencies:dependencies.map(row=>({id:row.id,targetType:row.target_type,targetId:row.target_id,dependencyType:'reference',createdAt:row.created_at})),
    previews:previews.map(row=>({id:row.id,expiresAt:row.expires_at,revokedAt:row.revoked_at||null,version:row.version_number})),
    performance,parity,publicationGate,blockers:Array.from(new Set(blockers)),healthy:blockers.length===0,
  }
}

export async function updateStudioSeo(input:{pageId:string;seoTitle?:string;seoDescription?:string;context:MarketplaceRequestContext;requestId:string}){
  const patch:Record<string,unknown>={}
  if(typeof input.seoTitle==='string') patch.seo_title=input.seoTitle.trim().slice(0,240)||null
  if(typeof input.seoDescription==='string') patch.seo_description=input.seoDescription.trim().slice(0,500)||null
  return updatePage({pageId:input.pageId,patch,changeSummary:'SEO page mis à jour depuis AngelCare Marketplace Studio',context:input.context,requestId:input.requestId})
}
