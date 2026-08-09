import type { LocaleCode, SourceAdapterType, TranslationStatus } from './types'
export const SOURCE_LOCALE: LocaleCode = 'fr'
export const SUPPORTED_LOCALES: LocaleCode[] = ['fr','en','ar']
export const RTL_LOCALES = new Set<LocaleCode>(['ar'])
export const SCANNER_ADAPTERS: {key:SourceAdapterType; label:string; required:boolean}[] = [
 {key:'source_ast',label:'Code source AST',required:true},{key:'backend_api',label:'Backend et APIs',required:true},{key:'database_registry',label:'Contenus base autorisés',required:true},{key:'runtime_render',label:'Rendu runtime contrôlé',required:true},{key:'communication_template',label:'Templates de communication',required:true},{key:'seo_metadata',label:'SEO et métadonnées',required:true},{key:'export_header',label:'Exports et rapports',required:false},{key:'content_file',label:'Fichiers de contenu',required:true},
]
export const TRANSLATION_TRANSITIONS: Record<TranslationStatus, TranslationStatus[]> = {
 discovered:['triaged','archived'], triaged:['keyed','rejected','archived'], keyed:['translation_required','draft'], translation_required:['draft','archived'], draft:['translated','rejected'], translated:['in_review','draft'], in_review:['reviewed','rejected','draft'], reviewed:['approved','rejected'], approved:['published','rejected'], published:['stale','archived'], stale:['draft','archived'], rejected:['draft','archived'], archived:[],
}
export const SENSITIVE_TYPES = new Set(['trust','legal','child_safety','pricing','medical_boundary'])
export const BRAND_LOCKS = ['ANGELCARE','Partner OS','ParentTrust','Quality Check 360','AngelCare Kids Specialist','Academy','Territory OS','Master Backoffice']
export const PLACEHOLDER_PATTERN = /\{\{\s*[a-zA-Z0-9_.-]+\s*\}\}|\{[a-zA-Z0-9_.-]+\}/g
export const USER_VISIBLE_PROP_NAMES = new Set(['label','title','description','placeholder','helperText','message','emptyText','errorText','successText','aria-label','alt','caption','tooltip','heading','subheading'])
