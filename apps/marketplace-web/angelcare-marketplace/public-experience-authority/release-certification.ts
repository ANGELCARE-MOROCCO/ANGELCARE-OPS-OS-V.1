import 'server-only'
import {buildPublicExperienceResolutionTrace} from './resolution-trace'
import {buildPublicExperienceStateMatrix} from './state-matrix'
import {simulatePublicExperienceAction} from './action-simulator'
import {getPublicExperienceThemeManifest} from './repository'
import {isCanonicalBuiltinWorld} from './canonical-worlds'
import type {PublicExperienceReleaseCertification,PublicExperienceReleaseGate} from './types'

const gate=(key:string,label:string,state:PublicExperienceReleaseGate['state'],detail:string):PublicExperienceReleaseGate=>({key,label,state,detail})
const truthDecision=(trace:NonNullable<Awaited<ReturnType<typeof buildPublicExperienceResolutionTrace>>>,key:string)=>trace.truth.decisions.find(row=>row.key===key)

/** Read-only release certificate for one real public entity. No cart/order/booking/enrollment mutation is executed. */
export async function certifyPublicExperienceEntity(input:{slug:string;locale:'fr'|'en'|'ar';collectionId?:string|null;placementId?:string|null}):Promise<PublicExperienceReleaseCertification|null>{
 const trace=await buildPublicExperienceResolutionTrace(input);if(!trace)return null
 const matrix=buildPublicExperienceStateMatrix(trace.experience360),manifest=trace.templateId?await getPublicExperienceThemeManifest(trace.templateId):null,builtin=isCanonicalBuiltinWorld(trace.templateId),simulations=trace.experience360.actions.map(row=>simulatePublicExperienceAction({actionId:row.actionId,workflowId:row.workflowId,target:trace.experience360.identity.id}))
 const gates:PublicExperienceReleaseGate[]=[]
 gates.push(gate('canonical-360','PublicExperience360',trace.experience360.identity.id&&trace.experience360.classification.schemaKey?'PASS':'BLOCKED',`${trace.experience360.sourceAuthorities.length} autorités publiques-safe.`))
 gates.push(gate('resolution','Résolution publique',trace.source&&trace.experience360.classification.doctrineKey?'PASS':'BLOCKED',`${trace.source} · ${trace.templateKey||'Category-Native'}.`))
 gates.push(gate('theme-compile','Compatibilité thème',trace.compile?trace.compile.compatible?'PASS':'BLOCKED':'WATCH',trace.compile?`${trace.compile.score}% · ${trace.compile.blockers.length} blocker(s).`:'Renderer natif: aucun manifest Pro Max à compiler.'))
 gates.push(gate('truth','Truth Firewall',trace.truth.level==='BLOCKED'?'BLOCKED':'PASS',`${trace.truth.provenClaims} claims prouvés; ${trace.truth.blockedClaims} bloqués.`))
 const price=truthDecision(trace,'price'),availability=truthDecision(trace,'availability');gates.push(gate('commerce-truth','Prix & disponibilité',price?.state==='PROVEN'&&availability?.state==='PROVEN'?'PASS':price?.state==='ABSENT'&&trace.experience360.pricing.mode==='quote_only'?'PASS':'WATCH',`${price?.reason||'prix inconnu'} · ${availability?.reason||'disponibilité inconnue'}`))
 const unknown=simulations.filter(row=>row.status==='UNKNOWN'),blockedActions=simulations.filter(row=>row.status==='BLOCKED');gates.push(gate('actions','Actions canoniques',unknown.length?'BLOCKED':blockedActions.length?'BLOCKED':simulations.length?'PASS':'WATCH',simulations.length?`${simulations.length} action(s), ${unknown.length} inconnue(s), ${blockedActions.length} bloquée(s).`:'Aucune action transactionnelle requise pour ce dossier.'))
 const missingDestination=simulations.filter(row=>row.status==='READY'&&!row.adminDestination);gates.push(gate('admin-handoff','Handoff admin',missingDestination.length?'WATCH':simulations.length?'PASS':'WATCH',missingDestination.length?`${missingDestination.length} action(s) sans destination admin explicite.`:'Chaque action READY expose son moteur/destination.'))
 gates.push(gate('state-matrix','State Matrix',matrix.blocked?'BLOCKED':matrix.watch?'WATCH':'PASS',`${matrix.pass} PASS · ${matrix.watch} WATCH · ${matrix.blocked} BLOCKED.`))
 gates.push(gate('mobile','Contrat mobile',manifest?.responsiveContract==='desktop-mobile-native'||builtin?'PASS':manifest?'BLOCKED':'WATCH',manifest?.responsiveContract||'Native renderer responsive contract.'))
 gates.push(gate('fallback','Fallback natif',manifest?.fallbackContract==='native-fallback'||builtin?'PASS':manifest?'BLOCKED':'PASS',manifest?.fallbackContract||'Category-Native reste le fallback canonique.'))
 gates.push(gate('seo','Canonical route / SEO',manifest?.seoContract==='canonical-route-owned'||builtin?'PASS':manifest?'BLOCKED':'PASS',manifest?.seoContract||'La route canonique conserve URL/SEO.'))
 gates.push(gate('visual-fingerprint','Empreinte visuelle',manifest?.visualFingerprint&&manifest?.structuralFingerprint?'PASS':builtin?'PASS':'WATCH',manifest?.visualFingerprint?`${manifest.visualFingerprint.slice(0,18)}…`:'Pas d’empreinte world dédiée (renderer natif).'))
 const relationCount=trace.experience360.relations.length;gates.push(gate('relations','Relation graph',relationCount?'PASS':'WATCH',`${relationCount} relation(s) publiques-safe détectée(s).`))
 const domain=trace.experience360.classification.masterDomain,ext=trace.experience360.domainExtension as Record<string,unknown>;if(domain==='b2c_service_family')gates.push(gate('provider-safe','Provider public-safe',Array.isArray((ext.service as any)?.providers)&&((ext.service as any).providers as unknown[]).length?'PASS':'WATCH','Aucun provider n’est inventé; seuls les providers préférés + éligibles + actifs sont projetés.'));if(domain==='academy_admission')gates.push(gate('academy-safe','Academy public-safe',(ext.academy as any)?.course?'PASS':'WATCH','Le cours Academy est lié uniquement par catalog_item_id; fallback aux champs publics si aucun lien canonique.'))
 const blocked=gates.filter(row=>row.state==='BLOCKED').length,watch=gates.filter(row=>row.state==='WATCH').length,pass=gates.filter(row=>row.state==='PASS').length
 return{generatedAt:new Date().toISOString(),level:blocked?'BLOCKED':watch?'WATCH':'READY',entitySlug:trace.slug,templateId:trace.templateId,templateKey:trace.templateKey,source:trace.source,gates,pass,watch,blocked,productionEligible:blocked===0,transactionActions:simulations}
}
