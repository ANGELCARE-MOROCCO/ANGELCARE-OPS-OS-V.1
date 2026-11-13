import type { Data } from '@puckeditor/core'
import type { SanilaWorldPageState, SanilaWorldRelease, SanilaWorldState, SanilaWorldTheme } from '../sanila-admin/types'
import { SANILA_PAGE_BLUEPRINTS } from '../sanila-public/pageBlueprints'
import { SANILA_WORLD_KEY } from './contract'

export const SANILA_LOCKED_ROUTES = new Set(['demonstration','contact','creer-mon-etablissement','connexion'])
const SYSTEM: Array<[string,string,SanilaWorldTheme['layout'],string,string,string,string]> = [
  ['sanila-signature','SANILA Signature','institutional','#ffffff','#10243f','#315d9c','#edf3fb'],
  ['editorial-ivory','Editorial Ivory','editorial','#fbf8f3','#302820','#ad7142','#f3e9dc'],
  ['atlantic-command','Atlantic Command','institutional','#f4f8fc','#142e4c','#1f7695','#e1eff6'],
  ['rose-atrium','Rose Atrium','panorama','#fff8fa','#392538','#bd4a78','#fbe2ec'],
  ['botanical-campus','Botanical Campus','minimal','#f6fbf5','#233e34','#237b60','#ddefe5'],
  ['chromatic-bento','Chromatic Bento','bento','#fffbf6','#32263c','#a04c99','#f4e6f5'],
  ['signal-night','Signal Night','kinetic','#15182c','#f6f3ff','#f2bc6f','#272c47'],
  ['sandstone-study','Sandstone Study','editorial','#fdf3e7','#432f2b','#ad664e','#f5dec9'],
]
export const SANILA_DEFAULT_THEMES: Record<string,SanilaWorldTheme> = Object.fromEntries(
  SYSTEM.map(([key,name,layout,paper,ink,accent,soft]) => [key,{key,name,layout,colors:{paper,ink,accent,soft},system:true,archivedAt:null}])
)
export const SANILA_DEFAULT_THEME_KEY='sanila-signature'
const LIMIT=3_000_000
const SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*){0,2}$/
const KEY=/^[a-z][a-z0-9-]{2,63}$/
const COLOR=/^#[0-9a-fA-F]{6}$/
function luminance(hex:string){const val=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4));return val[0]*0.2126+val[1]*0.7152+val[2]*0.0722}
function contrast(a:string,b:string){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)}
const COMPONENTS=new Set(['SanilaHero','SanilaEditorial','SanilaFeatureGrid','SanilaProcess','SanilaProof','SanilaCTA','SanilaWorkflowBridge','SanilaImage'])
const reserved=new Set(['sanila','api','admin','demo-access','_next','login'])
const err=(message:string):never=>{throw new Error(message)}
const record=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{}
function text(v:unknown,max=200){const s=String(v??'').trim();if(s.length>max)err('Champ trop long.');return s}
function safeUrl(value:unknown):string {
  const s=text(value,500)
  if(!s)return ''
  if(s.startsWith('#'))return s
  if(s.startsWith('/')&&!s.startsWith('//')&&!s.includes('..')&&!/[<>"'\\\r\n]/.test(s)&&
    (s.startsWith('/angelcare-marketplace/')||s.startsWith('/sanila/')||s.startsWith('/api/angelcare-marketplace/media/')||/^\/angelcare-360-[a-z-]+\//.test(s)))return s
  if(s.startsWith('https://'))return s
  return err('URL non autorisée : '+s.slice(0,80))
}
export function validateSanilaSlug(v:unknown):string{
  const slug=text(v,95).toLowerCase()
  if(!SLUG.test(slug)||reserved.has(slug.split('/')[0]))err('Slug SANILA invalide.')
  return slug
}
export function validateSanilaDocument(v:unknown):Data {
  const doc=record(v); const content=doc.content
  if(!Array.isArray(content)||content.length>80)err('Document Puck invalide ou supérieur à 80 sections.')
  const normalized=content.map((item:unknown,index:number)=>{
    const row=record(item);if(!COMPONENTS.has(String(row.type)))err('Composant SANILA non autorisé.')
    const props=record(row.props)
    const clean:Record<string,unknown>={id:text(props.id||'sanila-'+index,120)}
    for(const key of ['eyebrow','title','body','label','tone','href','src','alt']){
      if(props[key]!==undefined)clean[key]=key==='href'||key==='src'?safeUrl(props[key]):text(props[key],key==='body'?6000:500)
    }
    if(props.items!==undefined){
      if(!Array.isArray(props.items)||props.items.length>24)err('Collection de sections invalide.')
      clean.items=props.items.map((x:unknown)=>({title:text(record(x).title,200),body:text(record(x).body,1000)}))
    }
    return {type:String(row.type),props:clean}
  })
  const result={root:{props:{}},content:normalized} as Data
  if(JSON.stringify(result).length>160_000)err('Page trop volumineuse.')
  return result
}
export function validateSanilaTheme(v:unknown,existing:Record<string,SanilaWorldTheme>={}):SanilaWorldTheme{
  const a=record(v);const key=text(a.key,64);if(!KEY.test(key))err('Clé de thème invalide.')
  if(existing[key]?.system)err('Les thèmes système sont protégés : dupliquez le thème.')
  const colors=record(a.colors)
  const c=(k:string)=>{const v=text(colors[k],7);if(!COLOR.test(v))err('Couleur '+k+' invalide.');return v}
  const layout=String(a.layout)
  if(!['editorial','bento','institutional','panorama','minimal','kinetic'].includes(layout))err('Architecture visuelle inconnue.')
  const paper=c('paper'),ink=c('ink'),accent=c('accent'),soft=c('soft')
  if(contrast(paper,ink)<4.5)err('Texte du thème insuffisamment contrasté.')
  return {key,name:text(a.name,120)||key,layout:layout as SanilaWorldTheme['layout'],colors:{paper,ink,accent,soft},system:false,archivedAt:null}
}
export function sanilaSourceState():SanilaWorldState {
  const pages=Object.fromEntries(SANILA_PAGE_BLUEPRINTS.map(p=>[p.slug,{
    slug:p.slug,title:p.title,nav:p.nav,status:'source' as const,updatedAt:null,data:null,publishedData:null,deletedAt:null,pausedAt:null,isCustom:false,
    seo:{title:p.title,description:p.subtitle,noindex:false},themeKey:null,showInNav:false,
  }]))
  return {version:1,worldKey:SANILA_WORLD_KEY,status:'source',revision:0,sourceFingerprint:null,importedAt:null,importedBy:null,
    packageName:null,shell:{header:true,footer:true,navigation:true},publishedShell:{header:true,footer:true,navigation:true},
    workflows:{demo:true,contact:true,onboarding:true,protectedDemoAccess:true},pages,
    themes:{...SANILA_DEFAULT_THEMES},publishedThemes:{...SANILA_DEFAULT_THEMES},themeKey:SANILA_DEFAULT_THEME_KEY,publishedThemeKey:SANILA_DEFAULT_THEME_KEY,
    navigation:[],publishedNavigation:[],releases:[],publishedAt:null,publishedBy:null}
}
export function normalizeSanilaState(value:unknown):SanilaWorldState{
  const src=sanilaSourceState(),v=record(value)
  const pages=record(v.pages)
  const mergedPages={...src.pages} as Record<string,SanilaWorldPageState>
  for(const [slug,raw] of Object.entries(pages))if(SLUG.test(slug)&&!reserved.has(slug.split('/')[0])){
    const p=record(raw),fallback=mergedPages[slug]
    mergedPages[slug]={...(fallback||{slug,title:slug,nav:slug,status:'draft',updatedAt:null,data:null,isCustom:true}),
      ...p,slug} as SanilaWorldPageState
  }
  const themes={...SANILA_DEFAULT_THEMES}
  for(const [key,theme] of Object.entries(record(v.themes)))if(!themes[key]&&KEY.test(key)){
    try {themes[key]=validateSanilaTheme({...record(theme),key})}catch{/* ignore corrupt optional theme */}
    if(themes[key])themes[key].archivedAt=typeof record(theme).archivedAt==='string'?String(record(theme).archivedAt):null
  }
  const next={...src,...v,pages:mergedPages,themes,shell:{...src.shell,...record(v.shell)},
    publishedShell:{...src.publishedShell,...record(v.publishedShell)},
    workflows:{...src.workflows,...record(v.workflows)},
    themeKey:themes[String(v.themeKey)]?String(v.themeKey):SANILA_DEFAULT_THEME_KEY,
    publishedThemeKey:themes[String(v.publishedThemeKey)]?String(v.publishedThemeKey):SANILA_DEFAULT_THEME_KEY,
    publishedThemes:v.publishedThemes&&typeof v.publishedThemes==='object'&&!Array.isArray(v.publishedThemes)
      ?v.publishedThemes as Record<string,SanilaWorldTheme>:{...SANILA_DEFAULT_THEMES},
    navigation:Array.isArray(v.navigation)?v.navigation as SanilaWorldState['navigation']:[],
    publishedNavigation:Array.isArray(v.publishedNavigation)?v.publishedNavigation as SanilaWorldState['publishedNavigation']:[],
    releases:Array.isArray(v.releases)?(v.releases as SanilaWorldRelease[]).slice(-4):[]
  } as SanilaWorldState
  next.version=1;next.worldKey=SANILA_WORLD_KEY
  return next
}
type Action='create_page'|'duplicate_page'|'save_page'|'edit_page'|'trash_page'|'restore_page'|'pause_page'|'resume_page'|'upsert_theme'|'duplicate_theme'|'trash_theme'|'restore_theme'|'set_theme'|'set_navigation'|'set_shell'|'register_import'|'import_bundle'|'publish'|'rollback'
function draftPage(p:SanilaWorldPageState,now:string):SanilaWorldPageState{return {...p,status:'draft',updatedAt:now}}
export function applySanilaWorldAction(value:SanilaWorldState,action:Action,payload:Record<string,unknown>,actor:string,now:string):SanilaWorldState {
  const next=normalizeSanilaState(value),pages=next.pages,themes=next.themes!
  const slug=()=>validateSanilaSlug(payload.slug)
  const page=(s:string)=>pages[s]||err('Page SANILA introuvable.')
  switch(action){
    case 'create_page':{
      const s=slug();if(pages[s])err('Le slug existe déjà.')
      const title=text(payload.title,200)||err('Titre obligatoire.')
      pages[s]={slug:s,title,nav:text(payload.nav,80)||title,status:'draft',updatedAt:now,data:null,publishedData:null,
        themeKey:null,showInNav:false,isCustom:true,deletedAt:null,pausedAt:null,seo:{title,description:'',noindex:false}};break
    }
    case 'duplicate_page':{
      const s=slug(),source=page(validateSanilaSlug(payload.sourceSlug))
      if(pages[s])err('Le slug existe déjà.')
      pages[s]={...JSON.parse(JSON.stringify(source)),slug:s,title:text(payload.title,200)||source.title+' — copie',nav:text(payload.nav,80)||source.nav,
        data:source.data||source.publishedData||null,publishedData:null,status:'draft',isCustom:true,deletedAt:null,pausedAt:null,updatedAt:now};break
    }
    case 'save_page':case 'edit_page':{
      const s=slug(),old=page(s)
      if(SANILA_LOCKED_ROUTES.has(s))err('Page métier protégée : dupliquez avant édition.')
      if(old.deletedAt)err('Restaurer cette page avant de la modifier.')
      const data=payload.data===undefined?old.data:validateSanilaDocument(payload.data)
      const meta=record(payload.seo)
      const seo=payload.seo===undefined?old.seo:{title:text(meta.title,160),description:text(meta.description,300),noindex:meta.noindex===true}
      const themeKey=payload.themeKey===undefined?old.themeKey:(payload.themeKey===null?null:text(payload.themeKey,64))
      if(themeKey&&(!themes[themeKey]||themes[themeKey].archivedAt))err('Thème introuvable ou désactivé.')
      pages[s]={...draftPage(old,now),data,seo,themeKey,
        title:payload.title===undefined?old.title:text(payload.title,200),
        nav:payload.nav===undefined?old.nav:text(payload.nav,100),
        showInNav:payload.showInNav===undefined?old.showInNav:payload.showInNav===true};break
    }
    case 'trash_page':{
      const s=slug();if(!page(s).isCustom||SANILA_LOCKED_ROUTES.has(s))err('Page système protégée : clonage autorisé, suppression interdite.')
      pages[s]={...page(s),status:'trashed',deletedAt:now,pausedAt:null,updatedAt:now,publishedData:null};break
    }
    case 'restore_page':{
      const s=slug();if(!page(s).deletedAt)err('Page non supprimée.')
      pages[s]={...page(s),status:'draft',deletedAt:null,pausedAt:null,updatedAt:now};break
    }
    case 'pause_page':{
      const s=slug(),p=page(s)
      if(!p.isCustom||p.deletedAt)err('Page système ou supprimée : pause indisponible.')
      pages[s]={...p,pausedAt:now,updatedAt:now};break
    }
    case 'resume_page':{
      const s=slug(),p=page(s)
      if(!p.isCustom||!p.pausedAt)err('Page non suspendue.')
      pages[s]={...p,pausedAt:null,updatedAt:now};break
    }
    case 'upsert_theme':{const item=validateSanilaTheme(payload.theme,themes);themes[item.key]=item;break}
    case 'duplicate_theme':{
      const src=themes[text(payload.sourceKey,64)]||err('Thème source introuvable.')
      const key=text(payload.key,64);if(themes[key])err('Le thème existe déjà.')
      themes[key]=validateSanilaTheme({...src,key,name:text(payload.name,100)||src.name+' — copie',system:false},themes);break
    }
    case 'trash_theme':{
      const key=text(payload.key,64),item=themes[key]
      if(!item||item.system)err('Thème système protégé.')
      if(next.themeKey===key||next.publishedThemeKey===key||Object.values(pages).some(p=>!p.deletedAt&&(p.themeKey===key||p.publishedThemeKey===key)))err('Ce thème est encore assigné. Réaffectez-le avant suppression.')
      themes[key]={...item,archivedAt:now};break
    }
    case 'restore_theme':{
      const key=text(payload.key,64),item=themes[key];if(!item||item.system)err('Thème introuvable.')
      themes[key]={...item,archivedAt:null};break
    }
    case 'set_theme':{const key=text(payload.key,64);if(!themes[key]||themes[key].archivedAt)err('Thème indisponible.');next.themeKey=key;break}
    case 'set_navigation':{
      const items=payload.navigation
      if(!Array.isArray(items)||items.length>30)err('Navigation invalide.')
      const seen=new Set<string>()
      next.navigation=items.map(v=>{const a=record(v),s=validateSanilaSlug(a.slug);if(seen.has(s)||!pages[s]||pages[s].deletedAt)err('Navigation : route inconnue ou doublon.');seen.add(s);return {slug:s,label:text(a.label,70)}});break
    }
    case 'set_shell':{
      const shell=record(payload.shell)
      next.shell={header:shell.header!==false,footer:shell.footer!==false,navigation:shell.navigation!==false};break
    }
    case 'register_import':err('Enregistrement de nom uniquement désactivé. Importez un manifeste avec les vraies pages et thèmes.')
    case 'import_bundle':{
      const manifest=record(payload.bundle)
      if(manifest.format!=='sanila-world-package'||manifest.version!==1)err('Manifest SANILA v1 requis.')
      const importedPages=manifest.pages,importedThemes=manifest.themes
      if(!Array.isArray(importedPages)||!Array.isArray(importedThemes)||importedPages.length>60||importedThemes.length>30)err('Dimensions du package invalides.')
      for(const input of importedThemes){const theme=validateSanilaTheme(input,themes);themes[theme.key]=theme}
      for(const input of importedPages){
        const item=record(input),s=validateSanilaSlug(item.slug)
        if(SANILA_LOCKED_ROUTES.has(s))err('Ce package tente de remplacer un parcours protégé : '+s)
        const prior=pages[s];if(prior?.deletedAt)err('Restaurez cette page avant import : '+s)
        const data=validateSanilaDocument(item.data)
        const title=text(item.title,200)||s;const meta=record(item.seo)
        pages[s]={...prior,slug:s,title,nav:text(item.nav,100)||title,isCustom:prior?.isCustom??!SANILA_PAGE_BLUEPRINTS.some(p=>p.slug===s),
          data,publishedData:prior?.publishedData||null,status:'draft',deletedAt:null,pausedAt:null,updatedAt:now,showInNav:item.showInNav===true,
          seo:{title:text(meta.title,160)||title,description:text(meta.description,300),noindex:meta.noindex===true},
          themeKey:typeof item.themeKey==='string'&&themes[item.themeKey]&&!themes[item.themeKey].archivedAt?item.themeKey:prior?.themeKey||null}
      }
      next.importedAt=now;next.importedBy=actor;next.packageName=text(payload.packageName,200)||'SANILA package'
      next.sourceFingerprint=text(payload.fingerprint,128)||null;break
    }
    case 'publish':{
      const past:SanilaWorldRelease={revision:next.revision,publishedAt:next.publishedAt||now,
        pages:JSON.parse(JSON.stringify(pages)),themes:JSON.parse(JSON.stringify(next.publishedThemes||SANILA_DEFAULT_THEMES)),themeKey:next.publishedThemeKey||SANILA_DEFAULT_THEME_KEY,
        nav:[...(next.publishedNavigation||[])],shell:{...(next.publishedShell||next.shell)}}
      next.releases=[...(next.releases||[]),past].slice(-4)
      for(const [s,p] of Object.entries(pages)){
        if(!p.deletedAt&&p.data&&!SANILA_LOCKED_ROUTES.has(s))pages[s]={...p,publishedData:validateSanilaDocument(p.data),publishedThemeKey:p.themeKey||null,status:'published'}
      }
      next.publishedThemeKey=next.themeKey
      next.publishedThemes=JSON.parse(JSON.stringify(themes))
      const navigation=[...(next.navigation||[]),...Object.values(pages).filter(p=>p.showInNav&&!p.deletedAt).map(p=>({slug:p.slug,label:p.nav}))]
      const seen=new Set<string>()
      next.publishedNavigation=navigation.filter(n=>{
        const target=pages[n.slug]
        if(seen.has(n.slug)||!target||target.deletedAt||target.pausedAt||(!target.publishedData&&!SANILA_LOCKED_ROUTES.has(n.slug)))return false
        seen.add(n.slug);return true
      }).slice(0,30)
      next.publishedShell={...next.shell}
      next.publishedAt=now;next.publishedBy=actor;break
    }
    case 'rollback':{
      const desired=Number(payload.revision),release=(next.releases||[]).find(r=>r.revision===desired)
      if(!release)err('Révision publiée introuvable.')
      next.pages=JSON.parse(JSON.stringify(release.pages));next.themeKey=release.themeKey;next.publishedThemeKey=release.themeKey
      next.themes=JSON.parse(JSON.stringify(release.themes||SANILA_DEFAULT_THEMES))
      next.publishedThemes=JSON.parse(JSON.stringify(release.themes||SANILA_DEFAULT_THEMES))
      next.navigation=[...release.nav];next.publishedNavigation=[...release.nav];next.shell={...release.shell};next.publishedShell={...release.shell}
      next.publishedAt=now;next.publishedBy=actor;break
    }
    default:err('Opération SANILA inconnue.')
  }
  next.revision=value.revision+1
  next.status=action==='publish'||action==='rollback'?'published':'draft'
  if(JSON.stringify(next).length>LIMIT)err('Taille du Public World supérieure à 3 MB. Réduire le contenu ou les versions.')
  return next
}
