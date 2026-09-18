import type { CmsBlockType } from './types'
import { studioBlockContract } from '../studio-universal/block-contracts'

export type BlockFieldKind = 'text' | 'textarea' | 'richtext' | 'media' | 'link' | 'items' | 'commerce' | 'symbol' | 'select'
export interface BlockFieldDefinition {
  key: string
  label: string
  kind: BlockFieldKind
  required?: boolean
  translatable?: boolean
  help?: string
}
export interface BlockDefinition {
  type: CmsBlockType
  schemaVersion: number
  name: string
  purpose: string
  category: 'content' | 'commerce' | 'conversion' | 'trust' | 'media' | 'structural' | 'reusable'
  editor: 'hero'|'copy'|'items'|'faq'|'timeline'|'cta'|'form'|'media'|'commerce'|'structural'|'symbol'
  allowedKeys: string[]
  fields: BlockFieldDefinition[]
  defaults: Record<string, unknown>
  validation: { required: string[] }
  requiresCta: boolean
  sensitive: boolean
  designCapabilities: string[]
  accessibility: string[]
  seoEffects: string[]
  bindings: string[]
  nesting: { canHaveChildren: boolean; allowedParents: 'root_or_structural' | 'structural_only' | 'none'; slots?: string[] }
  analyticsHooks: string[]
  runtimeStatus: 'ready'
  editorStatus: 'ready'
}

const labels: Record<string,string> = {
  eyebrow:'Eyebrow',title:'Titre',lead:'Introduction',body:'Corps éditorial',aside:'Encadré',primaryCtaLabel:'Libellé principal',primaryCtaHref:'Destination principale',secondaryCtaLabel:'Libellé secondaire',secondaryCtaHref:'Destination secondaire',mediaUrl:'Média legacy',mediaAssetId:'Asset Media Library',items:'Éléments',steps:'Étapes',ctaLabel:'Libellé CTA',ctaHref:'Destination CTA',categoryKey:'Catégorie',collectionKey:'Collection',itemRefs:'Produits',posterUrl:'Poster vidéo',source:'Source',sourceNote:'Note source',audience:'Audience',successMessage:'Message succès',symbolId:'Symbole',direction:'Direction',gap:'Espacement',maxWidth:'Largeur',surface:'Surface',ratio:'Ratio',columnsDesktop:'Colonnes desktop'
}
const inferKind=(key:string):BlockFieldKind=>key==='mediaAssetId'?'media':key.toLowerCase().includes('href')?'link':key==='items'||key==='steps'?'items':['categoryKey','collectionKey','itemRefs'].includes(key)?'commerce':key==='symbolId'?'symbol':['body','lead','aside'].includes(key)?'textarea':'text'
const fields=(keys:string[],required:string[]=[]):BlockFieldDefinition[]=>keys.map(key=>({key,label:labels[key]||key,kind:inferKind(key),required:required.includes(key),translatable:['eyebrow','title','lead','body','aside','ctaLabel','primaryCtaLabel','secondaryCtaLabel'].includes(key)}))
const design=['layout','spacing','alignment','surface','responsiveVisibility']
const a11y=['semanticStructure','keyboardSafe','contrastSafe']
const d=(type:CmsBlockType,name:string,purpose:string,editor:BlockDefinition['editor'],allowedKeys:string[],options:Partial<Pick<BlockDefinition,'category'|'requiresCta'|'sensitive'|'defaults'|'bindings'|'seoEffects'|'nesting'|'accessibility'|'designCapabilities'|'analyticsHooks'|'validation'>>={}):BlockDefinition=>{
  const required=options.validation?.required||(['hero','split_hero','video_hero'].includes(type)?['title']:[])
  return {type,schemaVersion:2,name,purpose,editor,allowedKeys,fields:fields(allowedKeys,required),defaults:options.defaults||{},validation:{required},category:options.category||'content',requiresCta:Boolean(options.requiresCta),sensitive:Boolean(options.sensitive),designCapabilities:options.designCapabilities||design,accessibility:options.accessibility||a11y,seoEffects:options.seoEffects||[],bindings:options.bindings||[],nesting:options.nesting||{canHaveChildren:false,allowedParents:'root_or_structural'},analyticsHooks:options.analyticsHooks||[],runtimeStatus:'ready',editorStatus:'ready'}
}

export const STRUCTURAL_BLOCK_TYPES = new Set<CmsBlockType>(['section','container','stack','columns','grid'])

export const CMS_BLOCK_REGISTRY:BlockDefinition[]=[
 d('hero','Hero de conversion','Positionnement, promesse, média et actions.','hero',['eyebrow','title','lead','primaryCtaLabel','primaryCtaHref','secondaryCtaLabel','secondaryCtaHref','mediaAssetId','mediaUrl'],{category:'conversion',requiresCta:true,seoEffects:['page-h1'],analyticsHooks:['primary_cta','secondary_cta']}),
 d('split_hero','Hero split','Hero éditorial image + copy + actions.','hero',['eyebrow','title','lead','primaryCtaLabel','primaryCtaHref','secondaryCtaLabel','secondaryCtaHref','mediaAssetId','mediaUrl'],{category:'conversion',requiresCta:true,seoEffects:['page-h1']}),
 d('video_hero','Hero vidéo','Hero premium avec média vidéo.','hero',['eyebrow','title','lead','primaryCtaLabel','primaryCtaHref','mediaAssetId','mediaUrl'],{category:'conversion',requiresCta:true,seoEffects:['page-h1']}),
 d('audience_router','Routeur d’audiences','Orienter les audiences vers les univers appropriés.','items',['title','lead','items'],{category:'conversion'}),
 d('service_grid','Architecture de services','Présenter offres et services.','items',['eyebrow','title','lead','items']),
 d('product_grid','Grille produits','Afficher une sélection commerciale administrée.','commerce',['eyebrow','title','lead','itemRefs','categoryKey'],{category:'commerce',bindings:['catalog.items','catalog.categories']}),
 d('collection_rail','Collection commerciale','Afficher une collection ou un rail d’offres.','commerce',['eyebrow','title','lead','collectionKey'],{category:'commerce',bindings:['homepage.collections','catalog.items']}),
 d('category_grid','Grille catégories','Orienter vers des catégories du Marketplace.','items',['eyebrow','title','lead','items'],{category:'commerce',bindings:['catalog.categories']}),
 d('trust_strip','Bande de confiance','Engagements et preuves de confiance.','items',['items','disclaimer'],{category:'trust',sensitive:true}),
 d('proof_grid','Preuves et méthode','Preuves, standards et engagements.','items',['eyebrow','title','lead','items'],{category:'trust',sensitive:true}),
 d('stats','Indicateurs prouvés','Métriques administrées avec source.','items',['eyebrow','title','lead','items','sourceNote'],{category:'trust',sensitive:true}),
 d('editorial','Narration éditoriale','Contenu long et structuré.','copy',['eyebrow','title','lead','body','aside']),
 d('story','Story / cas','Récit structuré avec preuve.','copy',['eyebrow','title','lead','body','mediaAssetId','mediaUrl']),
 d('testimonials','Témoignages','Témoignages vérifiés ou citations approuvées.','items',['eyebrow','title','lead','items'],{category:'trust',sensitive:true}),
 d('partner_logos','Partenaires / logos','Logos et partenaires approuvés.','items',['eyebrow','title','lead','items'],{category:'trust',sensitive:true}),
 d('comparison','Comparaison','Comparer offres, niveaux ou options.','items',['eyebrow','title','lead','items']),
 d('pricing','Pricing','Présenter prix, packages et modèles commerciaux.','items',['eyebrow','title','lead','items'],{category:'commerce'}),
 d('timeline','Parcours et étapes','Expliquer un cycle opérationnel.','timeline',['eyebrow','title','lead','steps']),
 d('process','Process','Méthode ou processus de service.','timeline',['eyebrow','title','lead','steps']),
 d('faq','Questions fréquentes','Réponses administrées.','faq',['eyebrow','title','lead','items'],{seoEffects:['faq-structure']}),
 d('cta_band','Bande d’action','Conversion vers une destination réelle.','cta',['eyebrow','title','lead','ctaLabel','ctaHref','secondaryCtaLabel','secondaryCtaHref'],{category:'conversion',requiresCta:true,analyticsHooks:['primary_cta','secondary_cta']}),
 d('inquiry_form','Formulaire de contact','Créer une inquiry publique persistante.','form',['title','lead','audience','successMessage'],{category:'conversion',sensitive:true,bindings:['public.inquiries']}),
 d('marketplace_entry','Entrée Marketplace','Orienter vers le catalogue.','cta',['eyebrow','title','lead','ctaLabel','ctaHref'],{category:'conversion',requiresCta:true}),
 d('partner_os_entry','Entrée Partner OS','Orienter vers Partner OS.','cta',['eyebrow','title','lead','ctaLabel','ctaHref'],{category:'conversion',requiresCta:true}),
 d('academy_entry','Entrée Academy','Orienter vers Academy.','cta',['eyebrow','title','lead','ctaLabel','ctaHref'],{category:'conversion',requiresCta:true}),
 d('family_story','Parcours famille','Illustrer un parcours famille.','timeline',['eyebrow','title','lead','steps','disclaimer'],{category:'trust',sensitive:true}),
 d('media_gallery','Galerie média','Images administrées, légendes et alt.','media',['eyebrow','title','lead','items'],{category:'media',bindings:['media.assets']}),
 d('video','Vidéo','Contenu vidéo et copy.','media',['eyebrow','title','lead','mediaAssetId','mediaUrl','posterUrl'],{category:'media',bindings:['media.assets']}),
 d('territory_map','Territoires','Présence géographique et destinations.','items',['eyebrow','title','lead','items']),
 d('quote','Citation','Citation ou preuve éditoriale.','copy',['eyebrow','title','body','source'],{category:'trust'}),
 d('download','Téléchargement','Ressource téléchargeable.','cta',['eyebrow','title','lead','ctaLabel','ctaHref'],{category:'conversion',requiresCta:true}),
 d('contact','Contact','Bloc de contact et destination.','cta',['eyebrow','title','lead','ctaLabel','ctaHref'],{category:'conversion',requiresCta:true}),
 d('section','Section','Région sémantique majeure du document.','structural',['surface'],{category:'structural',nesting:{canHaveChildren:true,allowedParents:'root_or_structural',slots:['default']},defaults:{surface:'default'}}),
 d('container','Container','Largeur, rythme et padding gouvernés par le design system.','structural',['maxWidth'],{category:'structural',nesting:{canHaveChildren:true,allowedParents:'structural_only',slots:['default']},defaults:{maxWidth:'xl'}}),
 d('stack','Stack','Composition ordonnée verticale ou horizontale.','structural',['direction','gap'],{category:'structural',nesting:{canHaveChildren:true,allowedParents:'structural_only',slots:['default']},defaults:{direction:'vertical',gap:'4'}}),
 d('columns','Columns','Colonnes responsives avec slots déterministes.','structural',['ratio','gap'],{category:'structural',nesting:{canHaveChildren:true,allowedParents:'structural_only',slots:['column-1','column-2']},defaults:{ratio:'1-1',gap:'4'}}),
 d('grid','Grid','Grille responsive gouvernée.','structural',['columnsDesktop','gap'],{category:'structural',nesting:{canHaveChildren:true,allowedParents:'structural_only',slots:['default']},defaults:{columnsDesktop:3,gap:'4'}}),
 d('symbol','Symbole global','Réutiliser une composition globale versionnée sans duplication.','symbol',['symbolId'],{category:'reusable',bindings:['cms.symbols']})
]

const byType = new Map<string,BlockDefinition>(CMS_BLOCK_REGISTRY.map((item)=>[String(item.type),item]))
const studioCategory=(group:string):BlockDefinition['category']=>group==='layout'?'structural':group==='commerce'?'commerce':group==='conversion'?'conversion':group==='trust'?'trust':group==='media'?'media':group==='extension'?'reusable':'content'
const studioEditor=(group:string):BlockDefinition['editor']=>group==='layout'?'structural':group==='commerce'?'commerce':group==='media'?'media':group==='conversion'?'cta':'items'
function studioDefinition(type:string):BlockDefinition|null{
  const studio=studioBlockContract(type);if(!studio)return null
  const allowedKeys=[...new Set([...studio.fields,'responsive','hidden','locked','sourceDesign','__studioPuck'])]
  return {type:type as CmsBlockType,schemaVersion:2,name:studio.label,purpose:studio.purpose,category:studioCategory(studio.group),editor:studioEditor(studio.group),allowedKeys,fields:fields(allowedKeys),defaults:{},validation:{required:[]},requiresCta:false,sensitive:false,designCapabilities:design,accessibility:a11y,seoEffects:[],bindings:studio.group==='media'?['media.assets']:studio.group==='commerce'?['catalog.items','catalog.categories','homepage.collections']:[],nesting:{canHaveChildren:Boolean(studio.allowChildren),allowedParents:studio.allowChildren?'root_or_structural':'root_or_structural',slots:studio.allowChildren?['default']:undefined},analyticsHooks:[],runtimeStatus:'ready',editorStatus:'ready'}
}
export function blockDefinition(type:CmsBlockType|string){const definition=byType.get(String(type))||studioDefinition(String(type));if(!definition)throw new Error(`Type de bloc non enregistré : ${type}`);return definition}
export function isStructuralBlock(type:CmsBlockType|string){return STRUCTURAL_BLOCK_TYPES.has(type as CmsBlockType)||Boolean(studioBlockContract(String(type))?.allowChildren)}
export const CMS_BLOCK_REGISTRY_VERSION = 2
