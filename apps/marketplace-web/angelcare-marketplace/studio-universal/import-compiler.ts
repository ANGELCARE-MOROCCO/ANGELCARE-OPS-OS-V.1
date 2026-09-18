'use client'

import type { ComponentData, Data } from '@puckeditor/core'
import { analyzeStudioAccessibility, analyzeStudioSeo, analyzeStudioShell } from './accessibility'
import { detectedCapabilities } from './capability-registry'
import { computeStudioElementStyle, parseStudioCss, safeCssDeclaration, studioDesignPropertySupported } from './css-fidelity'
import { detectStudioInteractions, interactionComponentForElement, interactionItems } from './interaction-adapters'
import { studioContrastReview } from './contrast'
import type { StudioCssEvidence, StudioFidelityScores, StudioImportCandidate, StudioOwnershipRecord } from './types'

const clean=(value:string)=>value.replace(/\s+/g,' ').trim()
const text=(node:Element)=>clean(node.textContent||'')
const stableHash=(input:string)=>{let h1=0x811c9dc5,h2=0x9e3779b9;for(let i=0;i<input.length;i++){const c=input.charCodeAt(i);h1=Math.imul(h1^c,16777619);h2=Math.imul(h2^c,2246822519)}return `${(h1>>>0).toString(16).padStart(8,'0')}${(h2>>>0).toString(16).padStart(8,'0')}`}
const id=(prefix:string,index:number,fingerprint:string)=>`${prefix}-${fingerprint.slice(0,8)}-${String(index+1).padStart(3,'0')}`

function stripDangerous(doc:Document){
  doc.querySelectorAll('script,noscript,iframe[allow],object,embed').forEach(node=>node.remove())
  doc.querySelectorAll('*').forEach(node=>{
    for(const attr of Array.from(node.attributes)){
      const name=attr.name.toLowerCase(),value=attr.value.trim().toLowerCase()
      if(name.startsWith('on')||value.startsWith('javascript:'))node.removeAttribute(attr.name)
      if((name==='href'||name==='src'||name==='action')&&value.startsWith('data:text/html'))node.removeAttribute(attr.name)
      if(name==='formaction'||name==='action')node.removeAttribute(attr.name)
    }
  })
}

function cssEvidence(css:string):StudioCssEvidence{
  const parsed=parseStudioCss(css)
  const withoutComments=css.replace(/\/\*[\s\S]*?\*\//g,'')
  const rawDeclarations=(withoutComments.match(/[\w-]+\s*:\s*[^;{}]+/g)||[])
  const parsedDeclarations=parsed.flatMap(rule=>rule.declarations.map(declaration=>({rule,declaration})))
  const preserved=parsedDeclarations.filter(({rule,declaration})=>rule.condition.kind!=='base'||studioDesignPropertySupported(declaration.property)).length
  const mappedReview=parsedDeclarations.filter(({rule,declaration})=>rule.condition.kind==='base'&&!studioDesignPropertySupported(declaration.property)).length
  const unsafe=Math.max(0,rawDeclarations.length-parsedDeclarations.length)
  const unsupportedAtRules=Array.from(new Set((withoutComments.match(/@(layer|keyframes|font-face|property|page|scope|starting-style)\b/gi)||[]).map(value=>value.toLowerCase())))
  const custom=(withoutComments.match(/--[a-z0-9_-]+\s*:/gi)||[]).length
  const media=(withoutComments.match(/@media\b/gi)||[]).length
  const container=(withoutComments.match(/@container\b/gi)||[]).length
  const review=unsafe+mappedReview+unsupportedAtRules.length
  return {rulesTotal:parsed.length,declarationsTotal:rawDeclarations.length,preservedDeclarations:Math.max(0,preserved),normalizedDeclarations:0,reviewDeclarations:review,unexplainedDrops:0,customProperties:custom,mediaQueries:media,containerQueries:container,unsupportedAtRules}
}

function meaningfulElements(doc:Document){return Array.from(doc.body.querySelectorAll('main,section,article,header,footer,nav,div,h1,h2,h3,h4,p,ul,ol,img,picture,video,form,details,dialog,table')).filter(el=>text(el).length>0||el.matches('img,picture,video,form,details,dialog,table'))}
function directText(el:Element){return clean(Array.from(el.childNodes).filter(node=>node.nodeType===Node.TEXT_NODE).map(node=>node.textContent||'').join(' '))}
function heading(el:Element){return clean(el.querySelector('h1,h2,h3,h4,h5,h6')?.textContent||'')}
function paragraph(el:Element){return clean(el.querySelector('p')?.textContent||'')}
function image(el:Element){const node=el.matches('img')?el as HTMLImageElement:el.querySelector('img');return node?{src:node.getAttribute('src')||'',alt:node.getAttribute('alt')||''}:null}
function links(el:Element){return Array.from(el.querySelectorAll('a[href]')).slice(0,8).map(a=>({label:clean(a.textContent||'')||'Action',href:a.getAttribute('href')||'#'}))}
function shellRoot(el:Element){return el.matches('header,nav,footer,[role="banner"],[role="navigation"],[role="contentinfo"]')}

function componentFromElement(el:Element,index:number,sourceFingerprint:string,rules:ReturnType<typeof parseStudioCss>):ComponentData{
  const title=heading(el),lead=paragraph(el),img=image(el),actions=links(el),computed=computeStudioElementStyle(el,rules),nodeId=id('src',index,sourceFingerprint)
  let type=interactionComponentForElement(el)||'studio_text'
  if(type==='studio_text'&&el.matches('header,[class*="hero" i],[id*="hero" i]')&&title)type='hero'
  else if(type==='studio_text'&&(el.matches('picture,img')||(!title&&img)))type='studio_image'
  else if(type==='studio_text'&&el.matches('hr'))type='studio_divider'

  const props:Record<string,unknown>={
    id:id(type,index,sourceFingerprint),title:title||directText(el).slice(0,180),lead,
    body:type==='studio_text'?text(el).slice(0,5000):'',mediaUrl:img?.src||'',mediaAlt:img?.alt||'',
    primaryCtaLabel:actions[0]?.label||'',primaryCtaHref:actions[0]?.href||'',secondaryCtaLabel:actions[1]?.label||'',secondaryCtaHref:actions[1]?.href||'',
    sourceDesign:computed.design,responsive:{mobileVisible:true,tabletVisible:true,desktopVisible:true},
    __studioImported:true,__studioSourceFingerprint:sourceFingerprint,__studioSourceNode:nodeId,__studioOwnership:'ROOT',
    __studioImportedRules:computed.importedRules,__studioInteractionKind:type.startsWith('studio_')?type.replace('studio_',''):undefined,
    __studioReviewRequired:['studio_form','studio_island'].includes(type),
    __studioProvenance:{tagName:el.tagName.toLowerCase(),kind:type,className:el.getAttribute('class')||'',id:el.getAttribute('id')||'',index,sourceSelectorHint:el.getAttribute('id')?`#${el.getAttribute('id')}`:el.getAttribute('class')?`.${(el.getAttribute('class')||'').split(/\s+/)[0]}`:el.tagName.toLowerCase()},
  }
  const adaptedItems=interactionItems(el,type)
  if(adaptedItems.length)props.items=adaptedItems
  if(type==='studio_island'){props.title='Capacité externe à examiner';props.body='Canvas/WebGL ou composant externe détecté. Aucun code source étranger n’est exécuté.'}
  if(type==='studio_form'){props.title=title||'Formulaire importé';props.lead='Structure conservée. La destination externe a été neutralisée et doit être reliée à un workflow AngelCare approuvé.'}
  return {type,props} as ComponentData
}

function topSections(doc:Document,fullPage:boolean){
  const main=doc.querySelector('main')||doc.body
  const direct=Array.from(main.children).filter(el=>!['SCRIPT','STYLE','LINK','META'].includes(el.tagName))
  const protectedDirect=fullPage&&direct.some(el=>!shellRoot(el))?direct.filter(el=>!shellRoot(el)):direct
  if(protectedDirect.length>=2)return protectedDirect
  const sections=Array.from(main.querySelectorAll(':scope > section,:scope > article')).filter(el=>!fullPage||!shellRoot(el))
  return sections.length?sections:[main]
}

function fidelity(sourceNodes:number,owned:number,css:StudioCssEvidence,interactionReview:number,assets:number,resolvedAssets:number,accessibility:number):StudioFidelityScores{
  const pct=(a:number,b:number)=>b?Math.max(0,Math.min(100,Math.round(a/b*100))):100
  const structural=pct(owned,sourceNodes),content=structural
  const visual=Math.max(0,100-Math.min(45,css.reviewDeclarations*3+css.unsupportedAtRules.length*5))
  const responsive=Math.max(0,100-Math.min(30,css.unsupportedAtRules.length*5))
  const interaction=Math.max(0,100-interactionReview*10)
  const editability=Math.max(0,100-interactionReview*6)
  const asset=pct(resolvedAssets,assets)
  return {content,structural,visual,responsive,interaction,editability,accessibility,asset,overall:Math.round((content+structural+visual+responsive+interaction+editability+accessibility+asset)/8)}
}

export function compileUniversalExperience(input:{html:string;css?:string;sourceType:'html'|'url'|'file';sourceLabel:string}):StudioImportCandidate{
  if(typeof DOMParser==='undefined')throw new Error('DOMParser indisponible dans ce runtime.')
  const html=input.html||'',css=input.css||''
  const doc=new DOMParser().parseFromString(html,'text/html')
  const originalHadScript=/<script\b/i.test(html),originalHadHandlers=/\son[a-z]+\s*=/i.test(html)
  const fullPage=/<html\b|<body\b|<main\b/i.test(html)||doc.body.children.length>=4
  const shell=analyzeStudioShell(doc),seo=analyzeStudioSeo(doc),accessibility=analyzeStudioAccessibility(doc)
  stripDangerous(doc)
  const sourceFingerprint=stableHash(`${input.sourceType}\n${input.sourceLabel}\n${html}\n${css}`)
  const documentFingerprint=stableHash(doc.documentElement.outerHTML)
  const roots=topSections(doc,fullPage)
  const parsedCssRules=parseStudioCss(css)
  const components=roots.map((el,index)=>componentFromElement(el,index,sourceFingerprint,parsedCssRules))
  const meaningful=meaningfulElements(doc)
  const ownership:StudioOwnershipRecord[]=meaningful.map((el,index)=>{
    if(fullPage&&shellRoot(el))return {sourceNodeId:id('node',index,sourceFingerprint),disposition:'IGNORED_WITH_REASON',ownerBlockId:null,reason:'Global shell protected by preserve-global-shell policy'}
    const ownerIndex=roots.findIndex(root=>root===el||root.contains(el));const owner=ownerIndex>=0?components[ownerIndex]:null
    return {sourceNodeId:id('node',index,sourceFingerprint),disposition:owner?(roots[ownerIndex]===el?'ROOT':'OWNED'):'REVIEW',ownerBlockId:owner?String(owner.props.id):null,reason:owner?'Owned by reconstructed root':'Meaningful node requires review'}
  })
  const sourceNodeOwners=new Map<string,Set<string>>();for(const row of ownership){if(!row.ownerBlockId)continue;const owners=sourceNodeOwners.get(row.sourceNodeId)||new Set<string>();owners.add(row.ownerBlockId);sourceNodeOwners.set(row.sourceNodeId,owners)}
  const doubleConsumed=[...sourceNodeOwners.values()].filter(owners=>owners.size>1).length
  const unowned=ownership.filter(row=>row.disposition==='REVIEW'||row.disposition==='BLOCKED').length
  const assets=doc.querySelectorAll('img,picture,video,source').length
  const resolvedAssets=Array.from(doc.querySelectorAll('img[src],video[src],source[src],source[srcset]')).length
  const cssReport=cssEvidence(css)
  const interactionRows=detectStudioInteractions(doc)
  const caps=detectedCapabilities({html,css})
  const interactionReview=interactionRows.filter(row=>row.status==='review'||row.status==='island'||row.status==='blocked').length
  const scores=fidelity(meaningful.length,meaningful.length-unowned,cssReport,interactionReview,assets,resolvedAssets,accessibility.score)
  const blockingCodes:string[]=[],reviewCodes:string[]=[],warnings:string[]=[]
  if(doubleConsumed>0)blockingCodes.push('DOUBLE_CONSUMPTION')
  if(unowned>Math.max(3,Math.floor(Math.max(1,meaningful.length)*0.08)))blockingCodes.push('MEANINGFUL_SOURCE_LOSS')
  if(caps.some(cap=>cap.detected&&cap.status==='blocked'&&cap.family!=='security'))blockingCodes.push('BLOCKED_CAPABILITY')
  if(caps.some(cap=>cap.detected&&(cap.status==='review'||cap.status==='island')))reviewCodes.push('ADVANCED_CAPABILITY_REVIEW')
  if(interactionReview)reviewCodes.push('INTERACTION_REVIEW')
  if(cssReport.unsupportedAtRules.length||scores.visual<85)reviewCodes.push('CSS_FIDELITY_REVIEW')
  if(accessibility.critical>0||accessibility.score<90)reviewCodes.push('ACCESSIBILITY_REVIEW')
  const contrastIssues=components.flatMap(component=>{const design=(component.props as any)?.sourceDesign||{};const review=studioContrastReview(String(design.color||''),String(design.backgroundColor||''));return review&&!review.passesNormal?[review]:[]})
  if(contrastIssues.length){reviewCodes.push('SOURCE_CONTRAST_REVIEW');warnings.push(`${contrastIssues.length} bloc(s) source présentent un contraste inférieur à 4.5:1.`)}
  if(shell.detected&&fullPage)reviewCodes.push('GLOBAL_SHELL_PROTECTED')
  if(seo.h1Count!==1)reviewCodes.push('SEO_HEADING_REVIEW')
  if(originalHadScript){warnings.push('Scripts source détectés et supprimés : aucune exécution étrangère.');reviewCodes.push('FOREIGN_SCRIPT_STRIPPED')}
  if(originalHadHandlers){warnings.push('Handlers inline détectés et supprimés.');reviewCodes.push('FOREIGN_EVENT_HANDLER_STRIPPED')}
  if(shell.detected&&fullPage)warnings.push('Header/navigation/footer source détectés : la politique par défaut conserve le shell global AngelCare.')
  const data={content:components,root:{props:{title:doc.title||input.sourceLabel,locale:(accessibility.language||'fr').slice(0,2),direction:accessibility.direction||undefined,__studioSourceFingerprint:sourceFingerprint,__studioImportedCssEvidence:cssReport,__studioShellPolicy:shell.defaultPolicy,__studioSeoEvidence:seo}}} as unknown as Data
  return {format:'angelcare-studio-import-candidate-v1',sourceType:input.sourceType,sourceLabel:input.sourceLabel,sourceFingerprint,documentFingerprint,createdAt:new Date().toISOString(),strategy:fullPage?'full-page':'fragment',data,ownership,interactions:interactionRows,accessibility,seo,shell,capabilities:caps,fidelity:scores,lossBudget:{sourceMeaningfulNodes:meaningful.length,ownedMeaningfulNodes:meaningful.length-unowned,unownedMeaningfulNodes:unowned,doubleConsumedNodes:doubleConsumed,sourceTextZones:doc.querySelectorAll('h1,h2,h3,h4,p,li').length,outputTextZones:components.filter(row=>String((row.props as any)?.title||'')||String((row.props as any)?.body||'')).length,sourceAssets:assets,resolvedAssets,missingAssets:Math.max(0,assets-resolvedAssets),css:cssReport},blockingCodes,reviewCodes:Array.from(new Set(reviewCodes)),warnings,safeToApply:blockingCodes.length===0}
}
