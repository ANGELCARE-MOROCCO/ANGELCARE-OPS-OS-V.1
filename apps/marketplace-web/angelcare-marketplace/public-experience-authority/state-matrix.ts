import type {PublicExperience360,PublicExperienceStateMatrix,PublicExperienceStateProbe} from './types'
const p=(key:string,label:string,state:PublicExperienceStateProbe['state'],description:string,expectedFallback:string|null=null):PublicExperienceStateProbe=>({key,label,state,description,expectedFallback})
export function buildPublicExperienceStateMatrix(data:PublicExperience360):PublicExperienceStateMatrix{const probes=[
 p('full-data','Données complètes','PASS','Rendu normal avec toutes les autorités disponibles.'),
 p('no-reviews','Sans avis',data.reviews.count?'PASS':'WATCH',data.reviews.count?'Avis disponibles.':'Le thème doit masquer note/avis sans espace cassé.','hide-review-surfaces'),
 p('no-promotion','Sans promotion','PASS','Aucun faux discount/countdown ne doit apparaître.','hide-promotion-surfaces'),
 p('unavailable','Indisponible',data.availability.status==='unavailable'?'WATCH':'PASS','Les CTA transactionnels doivent refléter la disponibilité.','disable-or-alternate-action'),
 p('no-stock-capacity','Sans quantité publique',data.availability.availableQuantity===null?'WATCH':'PASS','Interdiction de fabriquer une rareté numérique.','hide-scarcity-copy'),
 p('no-media','Sans média',data.media.length?'PASS':'WATCH','Utiliser placeholder de marque gouverné, jamais URL cassée.','brand-placeholder'),
 p('policy-blocked','Policy blocked','PASS','P11 doit bloquer le world et revenir au fallback natif si nécessaire.','native-fallback'),
 p('stale-reference','Référence stale','PASS','P02/P11 doivent exposer et bloquer une référence révoquée.','native-fallback'),
 p('source-failure','Source dynamique en échec','PASS','P06 doit appliquer empty policy / fallback sans casser la route.','configured-empty-policy'),
 p('mobile','Mobile 390px','PASS','Contrat mobile-native obligatoire; aucun horizontal overflow.','native-fallback'),
];return{generatedAt:new Date().toISOString(),entitySlug:data.identity.slug,probes,pass:probes.filter(x=>x.state==='PASS').length,watch:probes.filter(x=>x.state==='WATCH').length,blocked:probes.filter(x=>x.state==='BLOCKED').length}}
