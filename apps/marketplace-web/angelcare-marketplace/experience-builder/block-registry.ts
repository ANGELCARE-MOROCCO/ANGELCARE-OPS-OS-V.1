import type { CmsBlockType } from './types'

export interface BlockDefinition { type:CmsBlockType; name:string; purpose:string; allowedKeys:string[]; requiresCta:boolean; sensitive:boolean; editor:'hero'|'copy'|'items'|'faq'|'timeline'|'cta'|'form'|'media'|'commerce' }
const d=(type:CmsBlockType,name:string,purpose:string,editor:BlockDefinition['editor'],allowedKeys:string[],requiresCta=false,sensitive=false):BlockDefinition=>({type,name,purpose,editor,allowedKeys,requiresCta,sensitive})
export const CMS_BLOCK_REGISTRY:BlockDefinition[]=[
 d('hero','Hero de conversion','Positionnement, promesse, média et actions.','hero',['eyebrow','title','lead','primaryCtaLabel','primaryCtaHref','secondaryCtaLabel','secondaryCtaHref','mediaUrl'],true),
 d('split_hero','Hero split','Hero éditorial image + copy + actions.','hero',['eyebrow','title','lead','primaryCtaLabel','primaryCtaHref','secondaryCtaLabel','secondaryCtaHref','mediaUrl'],true),
 d('video_hero','Hero vidéo','Hero premium avec média vidéo.','hero',['eyebrow','title','lead','primaryCtaLabel','primaryCtaHref','mediaUrl'],true),
 d('audience_router','Routeur d’audiences','Orienter les audiences vers les univers appropriés.','items',['title','lead','items']),
 d('service_grid','Architecture de services','Présenter offres et services.','items',['eyebrow','title','lead','items']),
 d('product_grid','Grille produits','Afficher une sélection commerciale administrée.','commerce',['eyebrow','title','lead','itemRefs','categoryKey']),
 d('collection_rail','Collection commerciale','Afficher une collection ou un rail d’offres.','commerce',['eyebrow','title','lead','collectionKey']),
 d('category_grid','Grille catégories','Orienter vers des catégories du Marketplace.','items',['eyebrow','title','lead','items']),
 d('trust_strip','Bande de confiance','Engagements et preuves de confiance.','items',['items','disclaimer'],false,true),
 d('proof_grid','Preuves et méthode','Preuves, standards et engagements.','items',['eyebrow','title','lead','items'],false,true),
 d('stats','Indicateurs prouvés','Métriques administrées avec source.','items',['eyebrow','title','lead','items','sourceNote'],false,true),
 d('editorial','Narration éditoriale','Contenu long et structuré.','copy',['eyebrow','title','lead','body','aside']),
 d('story','Story / cas','Récit structuré avec preuve.','copy',['eyebrow','title','lead','body','mediaUrl']),
 d('testimonials','Témoignages','Témoignages vérifiés ou citations approuvées.','items',['eyebrow','title','lead','items'],false,true),
 d('partner_logos','Partenaires / logos','Logos et partenaires approuvés.','items',['eyebrow','title','lead','items'],false,true),
 d('comparison','Comparaison','Comparer offres, niveaux ou options.','items',['eyebrow','title','lead','items']),
 d('pricing','Pricing','Présenter prix, packages et modèles commerciaux.','items',['eyebrow','title','lead','items']),
 d('timeline','Parcours et étapes','Expliquer un cycle opérationnel.','timeline',['eyebrow','title','lead','steps']),
 d('process','Process','Méthode ou processus de service.','timeline',['eyebrow','title','lead','steps']),
 d('faq','Questions fréquentes','Réponses administrées.','faq',['eyebrow','title','lead','items']),
 d('cta_band','Bande d’action','Conversion vers une destination réelle.','cta',['eyebrow','title','lead','ctaLabel','ctaHref','secondaryCtaLabel','secondaryCtaHref'],true),
 d('inquiry_form','Formulaire de contact','Créer une inquiry publique persistante.','form',['title','lead','audience','successMessage'],false,true),
 d('marketplace_entry','Entrée Marketplace','Orienter vers le catalogue.','cta',['eyebrow','title','lead','ctaLabel','ctaHref'],true),
 d('partner_os_entry','Entrée Partner OS','Orienter vers Partner OS.','cta',['eyebrow','title','lead','ctaLabel','ctaHref'],true),
 d('academy_entry','Entrée Academy','Orienter vers Academy.','cta',['eyebrow','title','lead','ctaLabel','ctaHref'],true),
 d('family_story','Parcours famille','Illustrer un parcours famille.','timeline',['eyebrow','title','lead','steps','disclaimer'],false,true),
 d('media_gallery','Galerie média','Images administrées, légendes et alt.','media',['eyebrow','title','lead','items']),
 d('video','Vidéo','Contenu vidéo et copy.','media',['eyebrow','title','lead','mediaUrl','posterUrl']),
 d('territory_map','Territoires','Présence géographique et destinations.','items',['eyebrow','title','lead','items']),
 d('quote','Citation','Citation ou preuve éditoriale.','copy',['eyebrow','title','body','source']),
 d('download','Téléchargement','Ressource téléchargeable.','cta',['eyebrow','title','lead','ctaLabel','ctaHref'],true),
 d('contact','Contact','Bloc de contact et destination.','cta',['eyebrow','title','lead','ctaLabel','ctaHref'],true),
]
export function blockDefinition(type:CmsBlockType){const definition=CMS_BLOCK_REGISTRY.find(item=>item.type===type);if(!definition)throw new Error(`Type de bloc non enregistré : ${type}`);return definition}
