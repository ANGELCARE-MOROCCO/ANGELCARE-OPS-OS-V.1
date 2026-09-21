import 'server-only'
import type { MarketplacePermission } from '@/angelcare-marketplace/domain/types'
import { hasMarketplacePermission } from '@/angelcare-marketplace/auth/context'
import { MarketplaceError } from '@/angelcare-marketplace/server/errors'
import { validateStudioPageJson } from '@/angelcare-marketplace/studio-universal/page-json'
import { studioPublicationGate } from '@/angelcare-marketplace/studio-universal/publication-gate'
import { inspectStudioTrust } from '@/angelcare-marketplace/studio-trust-inspector/analyzer'
import { validateStudioSourceReference } from '@/angelcare-marketplace/studio-source-registry/resolver'
import { STUDIO_ASSIGNMENT_SCOPE_PERMISSION,STUDIO_POLICY_MODE_PERMISSION,STUDIO_POLICY_RULES } from './registry'
import { STUDIO_POLICY_SCHEMA_VERSION,type StudioAssignmentPolicyInput,type StudioDocumentPolicyInput,type StudioPolicyFinding,type StudioPolicyReport } from './types'
import { studioPolicyDecision } from './classification'

const pass=(ruleId:StudioPolicyFinding['ruleId'],message:string,source:string):StudioPolicyFinding=>({ruleId,state:'PASS',message,remediation:'Aucune action requise.',source})
const warn=(ruleId:StudioPolicyFinding['ruleId'],message:string,remediation:string,source:string):StudioPolicyFinding=>({ruleId,state:'WARN',message,remediation,source})
const block=(ruleId:StudioPolicyFinding['ruleId'],message:string,remediation:string,source:string):StudioPolicyFinding=>({ruleId,state:'BLOCK',message,remediation,source})
function result(mode:StudioPolicyReport['mode'],findings:StudioPolicyFinding[],input:{requestId?:string|null;page?:StudioPolicyReport['page'];fallback?:boolean}={}):StudioPolicyReport{
 const blockers=findings.filter(x=>x.state==='BLOCK'),warnings=findings.filter(x=>x.state==='WARN'),fallback=Boolean(input.fallback&&blockers.length)
 return{schemaVersion:STUDIO_POLICY_SCHEMA_VERSION,mode,decision:fallback&&blockers.length?'FALLBACK':studioPolicyDecision(mode,blockers.length),generatedAt:new Date().toISOString(),requestId:input.requestId||null,page:input.page||null,findings,blockers,warnings,fallbackEligible:fallback,fallbackReason:fallback?'POLICY_BLOCKER':null,summary:{rules:STUDIO_POLICY_RULES.length,passed:findings.filter(x=>x.state==='PASS').length,warnings:warnings.length,blockers:blockers.length},invariants:{existingRbacAuthority:true,existingPublicationAuthority:true,existingAuditLedger:true,noShadowPolicyStore:true,noNewAdminWorkspace:true,draftAllowsIncompleteWork:true,publishFailsClosed:true,publicRuntimeFallsBack:true}}
}
function permissionFinding(permission:MarketplacePermission,granted:boolean){return granted?pass('RBAC_PERMISSION',`Permission ${permission} accordée.`,'Marketplace RBAC'):block('RBAC_PERMISSION',`Permission ${permission} absente.`,`Accorder ${permission} via l’autorité RBAC Marketplace.`,'Marketplace RBAC')}
function territoryFinding(contextTerritory:string|null,pageTerritory:string|null){if(contextTerritory&&pageTerritory&&contextTerritory!==pageTerritory)return block('TERRITORY_SCOPE','La page est hors du périmètre territorial de la session.','Utiliser un compte ou territoire autorisé.','Marketplace territory context');return pass('TERRITORY_SCOPE',pageTerritory?'Territoire de page compatible avec la session.':'Page globale compatible avec la session.','Marketplace territory context')}
function documentFinding(data:StudioDocumentPolicyInput['data']){try{validateStudioPageJson(data);return pass('DOCUMENT_INTEGRITY','Document Puck valide et métadonnées gouvernées.','Studio page JSON')}catch(error){return block('DOCUMENT_INTEGRITY',error instanceof Error?error.message:'Document Studio invalide.','Corriger le document ou les métadonnées Studio avant de continuer.','Studio page JSON')}}
export async function evaluateStudioDocumentPolicy(input:StudioDocumentPolicyInput):Promise<StudioPolicyReport>{
 const findings:StudioPolicyFinding[]=[];const permission=STUDIO_POLICY_MODE_PERMISSION[input.mode]!
 findings.push(permissionFinding(permission,hasMarketplacePermission(input.context,permission)))
 findings.push(hasMarketplacePermission(input.context,input.mode==='draft'?'marketplace.cms.blocks.manage':permission)?pass('MUTATION_AUTHORITY','Autorité de mutation conforme au mode demandé.','Marketplace RBAC'):block('MUTATION_AUTHORITY','Autorité de mutation insuffisante.','Utiliser la permission métier correspondant à cette opération.','Marketplace RBAC'))
 findings.push(documentFinding(input.data));findings.push(territoryFinding(input.context.territoryId,input.page.territoryId))
 if(input.mode==='draft')findings.push(pass('ROUTE_SAFETY','Schémas URL dangereux et clés JSON interdites refusés par le validateur Studio.','Studio page JSON'))
 const pubGate=studioPublicationGate(input.data)
 if(input.mode==='draft'){
  findings.push(warn('SOURCE_REFERENCE_VALIDITY','Les références canoniques complètes seront exigées au preview/publish.','Utiliser P02 pour remplacer les références manquantes avant publication.','P01/P02'))
  findings.push(warn('PAGE_LIFECYCLE',`Brouillon autorisé dans l’état ${input.page.status}.`,'Soumettre puis approuver avant publication.','Experience Core'))
  findings.push(pass('TEMPLATE_INTEGRITY','Aucun template public n’est exécuté lors d’un simple enregistrement de brouillon.','P04/P08'))
  findings.push(pass('BINDING_INTEGRITY','Les bindings peuvent rester incomplets en brouillon tant que leur syntaxe est valide.','P05'))
  findings.push(pass('DYNAMIC_SOURCE_INTEGRITY','Les recettes peuvent rester incomplètes en brouillon tant que leur syntaxe est valide.','P06'))
  findings.push(pass('ACTION_INTEGRITY','Les actions peuvent être finalisées avant preview/publish.','P03'))
  findings.push(pass('WORKFLOW_INTEGRITY','Les workflows peuvent être finalisés avant preview/publish.','P07'))
  return result('draft',findings,{requestId:input.requestId,page:input.page})
 }
 const trust=await inspectStudioTrust({data:input.data,locale:input.page.locale,pageId:input.page.pageId,pageRoute:input.pageRoute||`/angelcare-marketplace/${input.page.locale}/${input.page.slug}`},input.context)
 const badSources=trust.sources.filter(x=>x.severity==='blocker'||(input.mode==='publish'&&x.publicationAware&&x.status!=='VALID'))
 findings.push(badSources.length?block('SOURCE_REFERENCE_VALIDITY',`${badSources.length} référence(s) canonique(s) non publiable(s).`,'Corriger les références via P02 ou publier les ressources nécessaires.','P01/P02'):pass('SOURCE_REFERENCE_VALIDITY','Références canoniques compatibles avec ce mode.','P01/P02'))
 if(input.mode==='publish'){
  const lifecycle=['approved','scheduled'].includes(input.page.status)
  findings.push(lifecycle?pass('PAGE_LIFECYCLE',`État ${input.page.status} autorisé à publier.`,'Experience Core'):block('PAGE_LIFECYCLE',`État ${input.page.status} non publiable.`,'Soumettre, revoir et approuver la page avant publication.','Experience Core'))
 }else findings.push(pass('PAGE_LIFECYCLE',`Preview sécurisé autorisé pour l’état ${input.page.status}.`,'Experience Core'))
 const runtimeBad=trust.runtime.requested&&trust.runtime.severity==='blocker'
 findings.push(runtimeBad?block('TEMPLATE_INTEGRITY',trust.runtime.note,'Corriger l’assignation ou le template publié.','P04/P08'):pass('TEMPLATE_INTEGRITY','Aucun blocker de template/runtime détecté pour le document courant.','P04/P08'))
 const bindingBad=trust.bindings.filter(x=>x.severity==='blocker').length
 findings.push(bindingBad?block('BINDING_INTEGRITY',`${bindingBad} binding(s) invalide(s).`,'Corriger les bindings P05.','P05'):pass('BINDING_INTEGRITY','Bindings live compatibles.','P05'))
 const dynamicBad=trust.dynamicSources.filter(x=>x.severity==='blocker').length
 findings.push(dynamicBad?block('DYNAMIC_SOURCE_INTEGRITY',`${dynamicBad} source(s) dynamique(s) bloquante(s).`,'Corriger les recettes P06.','P06'):pass('DYNAMIC_SOURCE_INTEGRITY','Sources dynamiques compatibles.','P06'))
 const actionBad=trust.actions.filter(x=>x.severity==='blocker').length
 findings.push(actionBad?block('ACTION_INTEGRITY',`${actionBad} action(s) structurée(s) bloquante(s).`,'Corriger les actions via P03/P02.','P03'):pass('ACTION_INTEGRITY','Actions structurées valides.','P03'))
 const workflowBad=trust.workflows.filter(x=>x.severity==='blocker').length
 findings.push(workflowBad?block('WORKFLOW_INTEGRITY',`${workflowBad} workflow(s) bloquant(s).`,'Corriger les workflows P07.','P07'):pass('WORKFLOW_INTEGRITY','Workflows natifs valides.','P07'))
 if(pubGate.pass)findings.push(pass('ROUTE_SAFETY','Aucun controlled island/review blocker non résolu.','Studio publication gate'))
 else findings.push(block('ROUTE_SAFETY',`Publication gate: ${pubGate.blockers.join(', ')}.`,'Résoudre les controlled islands et blocs nécessitant revue.','Studio publication gate'))
 return result(input.mode,findings,{requestId:input.requestId,page:input.page})
}
export async function evaluateStudioTemplateAssignmentPolicy(input:StudioAssignmentPolicyInput):Promise<StudioPolicyReport>{
 const findings:StudioPolicyFinding[]=[];const permission=STUDIO_ASSIGNMENT_SCOPE_PERMISSION[input.input.scope]
 findings.push(permissionFinding(permission,hasMarketplacePermission(input.context,permission)))
 findings.push(hasMarketplacePermission(input.context,permission)?pass('MUTATION_AUTHORITY',`Mutation ${input.input.scope} autorisée.`,'Marketplace RBAC'):block('MUTATION_AUTHORITY','Écriture d’assignation non autorisée.',`Permission requise: ${permission}.`,'Marketplace RBAC'))
 findings.push(pass('DOCUMENT_INTEGRITY','Aucun document Puck n’est muté par cette opération.','P04'))
 if(input.input.template){const v=await validateStudioSourceReference(input.input.template,{context:{locale:input.context.locale,territoryId:input.context.territoryId}},input.context);findings.push(v.status==='VALID'?pass('TEMPLATE_INTEGRITY','Template canonique sélectionné et visible.','P01/P04'):block('TEMPLATE_INTEGRITY',`Template invalide: ${v.status}.`,'Sélectionner un template Experience Core valide et publié.','P01/P04'))}else findings.push(pass('TEMPLATE_INTEGRITY','Suppression d’assignation autorisée sans template cible.','P04'))
 const expected={exact_item:'catalog.items',collection:'homepage.collections',experience_schema:'experience.schemas',category:'catalog.categories'} as const
 const source=expected[input.input.scope as keyof typeof expected]
 if(source){const target=input.input.target;if(!target||target.sourceId!==source)findings.push(block('SOURCE_REFERENCE_VALIDITY',`La portée ${input.input.scope} exige ${source}.`,`Choisir la cible via le picker ${source}.`,'P01/P02/P04'));else{const v=await validateStudioSourceReference(target,{context:{locale:input.context.locale,territoryId:input.context.territoryId}},input.context);findings.push(['VALID','NOT_PUBLISHED'].includes(v.status)?pass('SOURCE_REFERENCE_VALIDITY','Cible canonique existante.','P01/P04'):block('SOURCE_REFERENCE_VALIDITY',`Cible invalide: ${v.status}.`,'Choisir une cible canonique valide.','P01/P04'))}}else findings.push(pass('SOURCE_REFERENCE_VALIDITY','Portée configurationnelle sans cible P01 directe.','P04'))
 findings.push(pass('PAGE_LIFECYCLE','L’assignation n’altère pas le cycle de vie des pages CMS.','Experience Core'))
 findings.push(pass('BINDING_INTEGRITY','Bindings contrôlés lors du runtime P05.','P05'));findings.push(pass('DYNAMIC_SOURCE_INTEGRITY','Sources dynamiques contrôlées lors du runtime P06.','P06'));findings.push(pass('ACTION_INTEGRITY','Actions contrôlées lors du runtime P03/P08.','P03'));findings.push(pass('WORKFLOW_INTEGRITY','Workflows contrôlés lors du runtime P07/P08.','P07'));findings.push(pass('ROUTE_SAFETY','Aucune URL libre n’est écrite par l’assignation P04.','P04'));findings.push(pass('TERRITORY_SCOPE','La validation P01 applique le contexte territorial de la session.','P01'))
 return result('template_assignment',findings,{requestId:input.requestId})
}
export function assertStudioPolicy(report:StudioPolicyReport){if(report.decision==='BLOCK')throw new MarketplaceError('NOT_READY',`Politique P11 bloquante: ${report.blockers.map(x=>`${x.ruleId}: ${x.message}`).join(' | ')}`)}
