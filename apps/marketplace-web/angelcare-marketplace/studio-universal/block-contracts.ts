export type StudioBlockGroup = 'layout' | 'content' | 'media' | 'commerce' | 'discovery' | 'trust' | 'conversion' | 'interactive' | 'extension'

export interface StudioBlockContract {
  type: string
  label: string
  group: StudioBlockGroup
  purpose: string
  runtime: 'native' | 'legacy' | 'adapter' | 'controlled-island'
  fields: readonly string[]
  allowChildren?: boolean
  requiresMedia?: boolean
  requiresReview?: boolean
}

const contract = (type: string, label: string, group: StudioBlockGroup, purpose: string, fields: string[], runtime: StudioBlockContract['runtime'] = 'native', extra: Partial<StudioBlockContract> = {}): StudioBlockContract => ({ type, label, group, purpose, fields, runtime, ...extra })

export const ANGELCARE_STUDIO_BLOCK_CONTRACTS: readonly StudioBlockContract[] = [
  contract('ac_section','Section','layout','Section de page pleine largeur.',['content','backgroundColor','maxWidth','paddingYMobile','paddingYTablet','paddingYDesktop','sourceDesign'],'native',{allowChildren:true}),
  contract('ac_container','Conteneur','layout','Conteneur de largeur maîtrisée.',['content','maxWidth','paddingXMobile','paddingXTablet','paddingXDesktop','sourceDesign'],'native',{allowChildren:true}),
  contract('ac_columns','Colonnes','layout','Composition multi-colonnes responsive.',['content','columnsMobile','columnsTablet','columnsDesktop','gapMobile','gapTablet','gapDesktop','sourceDesign'],'native',{allowChildren:true}),
  contract('ac_grid','Grille','layout','Grille responsive native.',['content','columnsMobile','columnsTablet','columnsDesktop','gapMobile','gapTablet','gapDesktop','sourceDesign'],'native',{allowChildren:true}),
  contract('ac_stack','Stack','layout','Empilement vertical/horizontal responsive.',['content','direction','gapMobile','gapTablet','gapDesktop','sourceDesign'],'native',{allowChildren:true}),
  contract('hero','Hero','content','Promesse, média et actions de conversion.',['eyebrow','title','lead','primaryCtaLabel','primaryAction','primaryCtaHref','secondaryCtaLabel','secondaryAction','secondaryCtaHref','mediaAssetKey','mediaUrl','mediaAlt','sourceDesign'],'legacy',{requiresMedia:true}),
  contract('split_hero','Hero split','content','Hero éditorial image + copy.',['eyebrow','title','lead','primaryCtaLabel','primaryAction','primaryCtaHref','mediaAssetKey','mediaUrl','sourceDesign'],'legacy'),
  contract('audience_router','Routeur d’audiences','discovery','Oriente familles, professionnels et organisations.',['title','lead','items','sourceDesign'],'legacy'),
  contract('service_grid','Services','content','Architecture des services AngelCare.',['eyebrow','title','lead','items','sourceDesign'],'legacy'),
  contract('product_grid','Grille produits & services','commerce','Sélection commerciale réelle.',['eyebrow','title','lead','categoryKey','items','sourceDesign'],'legacy'),
  contract('collection_rail','Collection commerciale','commerce','Collection réelle du Marketplace.',['eyebrow','title','lead','collectionKey','sourceDesign'],'legacy'),
  contract('category_grid','Catégories','discovery','Navigation vers des catégories réelles.',['eyebrow','title','lead','items','sourceDesign'],'legacy'),
  contract('trust_strip','Bande de confiance','trust','Engagements et preuves approuvées.',['title','items','sourceDesign'],'legacy'),
  contract('proof_grid','Preuves','trust','Preuves structurées et vérifiables.',['eyebrow','title','lead','items','sourceDesign'],'legacy'),
  contract('stats','Indicateurs','trust','Métriques explicitement fournies, jamais inventées.',['eyebrow','title','lead','items','sourceDesign'],'legacy'),
  contract('editorial','Éditorial','content','Contenu éditorial structuré.',['eyebrow','title','lead','body','mediaAssetKey','mediaUrl','sourceDesign'],'legacy'),
  contract('story','Story','content','Narration / cas / histoire structurée.',['eyebrow','title','lead','body','mediaAssetKey','mediaUrl','sourceDesign'],'legacy'),
  contract('testimonials','Témoignages','trust','Témoignages uniquement administrés.',['eyebrow','title','lead','items','sourceDesign'],'legacy'),
  contract('partner_logos','Logos partenaires','trust','Logos et partenaires fournis par l’admin.',['eyebrow','title','lead','items','sourceDesign'],'legacy'),
  contract('comparison','Comparaison','content','Comparer des options administrées.',['eyebrow','title','lead','items','sourceDesign'],'legacy'),
  contract('pricing','Pricing','commerce','Prix et packages issus des données fournies.',['eyebrow','title','lead','items','sourceDesign'],'legacy'),
  contract('timeline','Timeline','content','Parcours et étapes.',['eyebrow','title','lead','items','sourceDesign'],'legacy'),
  contract('process','Process','content','Processus de service.',['eyebrow','title','lead','items','sourceDesign'],'legacy'),
  contract('faq','FAQ','interactive','Questions/réponses gouvernées.',['eyebrow','title','lead','items','sourceDesign'],'legacy'),
  contract('cta_band','Bande CTA','conversion','Conversion vers une destination réelle.',['eyebrow','title','lead','primaryCtaLabel','primaryAction','primaryCtaHref','secondaryCtaLabel','secondaryAction','secondaryCtaHref','sourceDesign'],'legacy'),
  contract('inquiry_form','Formulaire','conversion','Point d’entrée vers les workflows AngelCare approuvés.',['title','lead','__studioWorkflow','sourceDesign'],'legacy'),
  contract('media_gallery','Galerie','media','Galerie média du Vault.',['eyebrow','title','lead','items','sourceDesign'],'legacy',{requiresMedia:true}),
  contract('video','Vidéo','media','Média vidéo approuvé.',['eyebrow','title','lead','mediaUrl','mediaAlt','sourceDesign'],'legacy',{requiresMedia:true}),
  contract('quote','Citation','content','Citation éditoriale.',['eyebrow','title','body','sourceDesign'],'legacy'),
  contract('contact','Contact','conversion','Bloc contact.',['eyebrow','title','lead','primaryCtaLabel','primaryAction','primaryCtaHref','sourceDesign'],'legacy'),
  contract('studio_text','Texte riche','content','Texte importé ou créé dans Studio.',['eyebrow','title','lead','body','sourceDesign'],'native'),
  contract('studio_image','Image','media','Image Vault ou URL contrôlée.',['mediaAssetKey','mediaUrl','mediaAlt','sourceDesign'],'native',{requiresMedia:true}),
  contract('studio_button','Bouton','conversion','Action vers une destination explicite.',['primaryCtaLabel','primaryAction','primaryCtaHref','sourceDesign'],'native'),
  contract('studio_divider','Séparateur','layout','Séparateur visuel.',['sourceDesign'],'native'),
  contract('studio_spacer','Espacement','layout','Espacement éditable.',['height','sourceDesign'],'native'),
  contract('studio_accordion','Accordéon','interactive','Accordéon sécurisé sans code étranger.',['title','items','sourceDesign'],'adapter'),
  contract('studio_tabs','Onglets','interactive','Onglets sécurisés sans code étranger.',['title','items','sourceDesign'],'adapter'),
  contract('studio_dialog','Dialog / modal','interactive','Dialog sécurisé reconstruit sans code source étranger.',['title','body','items','primaryCtaLabel','sourceDesign'],'adapter'),
  contract('studio_carousel','Carousel','interactive','Carousel contrôlé et accessible sans dépendance au JS source.',['eyebrow','title','lead','items','sourceDesign'],'adapter'),
  contract('studio_menu','Menu local','interactive','Menu/disclosure local gouverné sans modifier la navigation globale.',['title','items','sourceDesign'],'adapter'),
  contract('studio_form','Formulaire à relier','conversion','Structure de formulaire importée, destination neutralisée jusqu’à un workflow AngelCare approuvé.',['title','lead','items','__studioWorkflow','sourceDesign'],'adapter',{requiresReview:true}),
  contract('studio_island','Îlot contrôlé','extension','Fallback explicite pour capacité externe non reconstructible.',['title','body','sourceDesign'],'controlled-island',{requiresReview:true}),
] as const

export const STUDIO_STRUCTURAL_TYPES = new Set(['ac_section','ac_container','ac_columns','ac_grid','ac_stack'])
export const STUDIO_BLOCK_TYPES = new Set(ANGELCARE_STUDIO_BLOCK_CONTRACTS.map(row => row.type))
export const STUDIO_BLOCK_COUNT = ANGELCARE_STUDIO_BLOCK_CONTRACTS.length
export const STUDIO_STRUCTURAL_COUNT = STUDIO_STRUCTURAL_TYPES.size
export function studioBlockContract(type: string) { return ANGELCARE_STUDIO_BLOCK_CONTRACTS.find(row => row.type === type) || null }
