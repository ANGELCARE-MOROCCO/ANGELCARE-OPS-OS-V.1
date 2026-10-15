import { array, object, text, type Data, type DceRecord } from './types'
export interface AccessContext {action:'use'|'download'|'print'|'contribute';audience:string;authenticated:boolean;now?:string;customerId?:string;grants?:DceRecord[]}
export function inspectAccess(resource:DceRecord,policy:DceRecord|undefined,context:AccessContext){
 const now=Date.parse(context.now||new Date().toISOString()),definition=resource.data,p=policy?.data||{},trace:Data[]=[]
 const stop=(reason:string)=>({allowed:false,reason,trace,policyId:policy?.id||null,authority:'native',checkedAt:new Date(now).toISOString()})
 trace.push({source:'experience',key:resource.key,revision:resource.revision,action:context.action})
 if(resource.lifecycle==='archived')return stop('RESOURCE_ARCHIVED')
 if(policy){trace.push({source:'policy',key:policy.key,revision:policy.revision});if(policy.lifecycle==='archived')return stop('POLICY_ARCHIVED');if(p.expiresAt&&(!Number.isFinite(Date.parse(text(p.expiresAt)))||Date.parse(text(p.expiresAt))<=now))return stop('POLICY_EXPIRED');if(Array.isArray(p.audiences)&&!p.audiences.includes(context.audience))return stop('AUDIENCE_EXCLUDED')}
 const action=context.action;if(action==='download'&&definition.downloadAllowed!==true||action==='print'&&definition.printAllowed!==true)return stop('OUTPUT_DISABLED')
 const rule=text(p[action])||(action==='use'?text(definition.visibility)||'free':action==='contribute'?'account':'permitted')
 trace.push({source:'effective_rule',rule,action})
 // An unknown/legacy/corrupted rule is NOT an implicit permission grant.
 // These values mirror the existing native policy editor; fail closed without UI changes.
 const supported:Record<AccessContext['action'],readonly string[]>={
  use:['free','account','native_entitlement','rewarded','disabled'],
  download:['permitted','account','native_entitlement','disabled'],
  print:['permitted','account','native_entitlement','disabled'],
  contribute:['account','moderated','disabled']
 }
 if(!supported[action].includes(rule))return stop('UNSUPPORTED_ACCESS_RULE')
 if(rule==='disabled')return stop('ACTION_DISABLED');if(['account','moderated'].includes(rule)&&!context.authenticated)return stop('NATIVE_ACCOUNT_REQUIRED')
 if(rule==='native_entitlement'||rule==='rewarded'){
  const eligible=(context.grants||[]).filter(g=>g.kind==='grant'&&g.lifecycle!=='archived'&&g.data.revoked!==true&&(!g.data.expiresAt||Date.parse(text(g.data.expiresAt))>now)&&g.data.resourceId===resource.id&&(!context.customerId||g.data.customerId===context.customerId)&&text(g.data.nativeReceiptId)&&['native_order','native_academy','native_subscription','verified_provider_reward'].includes(text(g.data.issuer)))
  trace.push({source:'recognized_receipts',count:eligible.length,receipts:eligible.map(g=>({id:g.id,issuer:text(g.data.issuer),expiresAt:g.data.expiresAt||null}))})
  if(!context.authenticated)return stop('NATIVE_ACCOUNT_REQUIRED');if(!eligible.length)return stop(rule==='rewarded'?'VERIFIED_REWARD_RECEIPT_REQUIRED':'NATIVE_ENTITLEMENT_REQUIRED')
 }
 return{allowed:true,reason:'PERMITTED',trace,policyId:policy?.id||null,authority:rule==='native_entitlement'||rule==='rewarded'?'recognized_issuer':'definition_policy',checkedAt:new Date(now).toISOString()}
}

export function effectiveAccess(resource:DceRecord,policies:DceRecord[],context:AccessContext){
 const targets:Record<string,string>={world:'',family:resource.family||'',topic:resource.topic||'',template:text(resource.data.templateId),experience:resource.id},ranks=['world','family','topic','template','experience']
 const applicable=policies.filter(p=>p.kind==='access_policy'&&p.lifecycle!=='archived'&&(p.id===resource.data.accessPolicyId||p.data.scope==='world'||targets[text(p.data.scope)]&&targets[text(p.data.scope)]===text(p.data.targetId))).sort((a,b)=>ranks.indexOf(text(a.data.scope))-ranks.indexOf(text(b.data.scope))||a.id.localeCompare(b.id))
 const decisions=applicable.map(policy=>({policy,decision:inspectAccess(resource,policy,context)})),blocked=decisions.find(d=>!d.decision.allowed),base=inspectAccess(resource,undefined,context)
 const result=blocked?.decision||(!base.allowed?base:decisions.at(-1)?.decision||base)
 return {...result,trace:[...decisions.flatMap(d=>d.decision.trace.map(t=>({...t,policyTitle:d.policy.title,scope:text(d.policy.data.scope)||'direct'}))),...(!decisions.length?base.trace:[])],matchedPolicies:applicable.map(p=>({id:p.id,title:p.title,scope:p.data.scope||'direct',revision:p.revision})),inheritance:'All applicable restrictions are enforced; a child policy cannot relax a parent exclusion.'}
}
