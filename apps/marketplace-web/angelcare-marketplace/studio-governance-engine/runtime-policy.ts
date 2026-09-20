import type { Data } from '@puckeditor/core'
import { validateStudioPageJson } from '@/angelcare-marketplace/studio-universal/page-json'
import type { StudioRuntimePolicyInput,StudioPolicyFinding,StudioPolicyReport } from './types'
import { STUDIO_POLICY_RULE_IDS,STUDIO_POLICY_SCHEMA_VERSION } from './types'
import { studioPolicyDecision } from './classification'
const pass=(ruleId:StudioPolicyFinding['ruleId'],message:string,source:string):StudioPolicyFinding=>({ruleId,state:'PASS',message,remediation:'Aucune action requise.',source})
const block=(ruleId:StudioPolicyFinding['ruleId'],message:string,remediation:string,source:string):StudioPolicyFinding=>({ruleId,state:'BLOCK',message,remediation,source})
export function evaluateStudioRuntimePolicy(input:StudioRuntimePolicyInput):StudioPolicyReport{
 const findings:StudioPolicyFinding[]=[]
 findings.push(pass('RBAC_PERMISSION','Runtime public sans privilège administratif; seules les autorités publiques canoniques sont utilisées.','Marketplace public runtime'))
 findings.push(pass('MUTATION_AUTHORITY','Le runtime P11 est read-only.','P11'))
 try{validateStudioPageJson(input.data);findings.push(pass('DOCUMENT_INTEGRITY','Document Studio valide.','Studio page JSON'))}catch(error){findings.push(block('DOCUMENT_INTEGRITY',error instanceof Error?error.message:'Document Studio invalide.','Corriger ou republier le template Studio.','Studio page JSON'))}
 findings.push(pass('SOURCE_REFERENCE_VALIDITY','Les références publiques ont déjà été préflightées par P01/P08.','P01/P08'))
 findings.push(pass('PAGE_LIFECYCLE','Le runtime utilise uniquement une révision de template publiée.','Experience Core'))
 if(input.templateRevisionId&&input.matchedScope)findings.push(pass('TEMPLATE_INTEGRITY',`Révision publiée ${input.templateRevisionId} résolue via ${input.matchedScope}.`,'P04/P08'))
 else findings.push(block('TEMPLATE_INTEGRITY','Révision publiée ou provenance de template absente.','Revenir au renderer Category-Native et corriger l’assignation.','P04/P08'))
 findings.push(input.bindingBlockers===0?pass('BINDING_INTEGRITY','Aucun blocker de binding live.','P05'):block('BINDING_INTEGRITY',`${input.bindingBlockers} blocker(s) de binding live.`,'Corriger les bindings avant rendu Studio.','P05'))
 findings.push(input.dynamicBlockers===0?pass('DYNAMIC_SOURCE_INTEGRITY','Aucun blocker de source dynamique.','P06'):block('DYNAMIC_SOURCE_INTEGRITY',`${input.dynamicBlockers} blocker(s) de source dynamique.`,'Corriger les recettes dynamiques avant rendu Studio.','P06'))
 findings.push(input.preflightBlockers===0?pass('ACTION_INTEGRITY','Actions structurées préflightées.','P03/P08'):block('ACTION_INTEGRITY',`${input.preflightBlockers} blocker(s) de preflight action/workflow.`,'Corriger les actions structurées.','P03/P08'))
 findings.push(input.preflightBlockers===0?pass('WORKFLOW_INTEGRITY','Workflows natifs préflightés.','P07/P08'):block('WORKFLOW_INTEGRITY','Workflow public non sûr détecté.','Corriger la configuration du workflow.','P07/P08'))
 findings.push(input.attributionSafe?pass('ROUTE_SAFETY','Navigation et attribution respectent les invariants URL/PII.','P03/P09'):block('ROUTE_SAFETY','Invariant de route/attribution non satisfait.','Utiliser uniquement les routes structurées et l’attribution P09.','P03/P09'))
 findings.push(pass('TERRITORY_SCOPE',input.territoryId?'Contexte territorial explicitement borné.':'Contexte global autorisé par le runtime public.','Marketplace territory context'))
 const blockers=findings.filter(x=>x.state==='BLOCK'),warnings=findings.filter(x=>x.state==='WARN')
 return{schemaVersion:STUDIO_POLICY_SCHEMA_VERSION,mode:'public_runtime',decision:studioPolicyDecision('public_runtime',blockers.length),generatedAt:new Date().toISOString(),requestId:null,page:null,findings,blockers,warnings,fallbackEligible:blockers.length>0,fallbackReason:blockers.length?'POLICY_BLOCKER':null,summary:{rules:STUDIO_POLICY_RULE_IDS.length,passed:findings.filter(x=>x.state==='PASS').length,warnings:warnings.length,blockers:blockers.length},invariants:{existingRbacAuthority:true,existingPublicationAuthority:true,existingAuditLedger:true,noShadowPolicyStore:true,noNewAdminWorkspace:true,draftAllowsIncompleteWork:true,publishFailsClosed:true,publicRuntimeFallsBack:true}}
}
