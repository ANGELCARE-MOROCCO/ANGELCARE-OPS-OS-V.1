const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),ts=require(path.join(root,'node_modules/typescript'));
const policy=require(path.join(root,'lib/email-os-core/operational-mailboxes.ts'));
async function scenario({available=true,demo=false,acknowledged=true}={}){
 const sent=[];let stored={id:'message',status:'queued',mailbox_key:'B2B',mailbox_email:'b2b@angelcarehub.ma',recipient_emails:['controlled@example.com'],subject:'Controlled routing test',body_text:'Test',attempt_count:0};
 const db={from(table){const q={select(){return q},eq(){return q},in(){return q},limit(){return q},insert(){return q},update(patch){if(table==='angelcare360_operator_email_messages')stored={...stored,...patch};return q},maybeSingle:async()=>({data:table==='angelcare360_operator_email_messages'?stored:null,error:null}),single:async()=>({data:stored,error:null}),then(resolve,reject){return Promise.resolve({data:[],error:null}).then(resolve,reject)}};return q}};
 const mailboxes=[{key:'B2B',email:'b2b@angelcarehub.ma',mailboxId:'b2b'},...(available?[{key:'IT_SUPPORT',email:'it.support@angelcarehub.ma',mailboxId:'it'}]:[])];
 const mocks={
  '@/lib/supabase/server':{createServiceClient:async()=>db},
  '@/lib/email-os-core/multi-mailbox-resolver':{listEmailOSMultiMailboxesFromDb:async()=>mailboxes,listEmailOSMultiMailboxes:()=>[],mailboxIdFromEmail:x=>x},
  '@/lib/email-os-core/send-mail':{sendEmailOSDirect:async input=>{sent.push(input);return{info:{messageId:'controlled-receipt',bridge:true,accepted:acknowledged?input.toEmail.split(','):[],rejected:[]}}}},
  './access':{requireAngelcare360OperatorPermission:async()=>({user:{id:'actor'}})},
  './audit':{writeOperatorAuditLog:async()=>{}},
  './shared':{asString:(v,f='')=>typeof v==='string'?v:f,asStringArray:v=>Array.isArray(v)?v:[v],getOperatorClient:async()=>db,toRecord:v=>v&&typeof v==='object'?v:{},safeList:async()=>[]},
  '@/lib/sanila-demo/safety':{assertExternalSideEffectAllowed:async()=>({allowed:!demo,code:'SANILA_MASTER_DEMO_SAFE_MODE'})},
  '@/lib/email-os-core/operational-mailboxes':policy,
  '@/lib/email-os-core/delivery-receipt':require(path.join(root,'lib/email-os-core/delivery-receipt.ts')),
 };
 const source=fs.readFileSync(path.join(root,'lib/angelcare360/operator/email-command.ts'),'utf8');
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};
 new Function('require','module','exports',js)(name=>Object.hasOwn(mocks,name)?mocks[name]:require(name),module,module.exports);
 const outcome=await module.exports.executeEmailCommandOperation('message.send',{id:'message'});
 return{outcome,sent,stored};
}
async function bridgeScenario({active=true,demo=false,acknowledged=true}={}){
 const sent=[],ledger=[];
 const identity={smtp:{host:'smtp.example.com',port:587,user:'it.support@angelcarehub.ma',from:'it.support@angelcarehub.ma',pass:'fixture-only'},credential:{status:active?'active':'suspended'},provider:{status:'active'}};
 const mocks={
  '@/lib/email-os-core/multi-mailbox-resolver':{mailboxIdFromEmail:x=>x,resolveEmailOSMailboxIdentityFromDb:async()=>identity},
  '@/lib/email-os-core/send-mail':{sendEmailOSDirect:async input=>{sent.push(input);return{info:{accepted:acknowledged?[input.toEmail]:[],rejected:[],messageId:'controlled'}}}},
  '@/lib/angelcare360/email/correspondence-ledger':{recordOutboundEmailCommand:async input=>ledger.push(input)},
  '@/lib/angelcare360/branding/email-template':{renderAngelcare360BrandedEmail:async()=>({html:'<p>Fixture</p>'})},
  '@/lib/sanila-demo/safety':{assertExternalSideEffectAllowed:async()=>({allowed:!demo,context:{configId:'fixture'},code:'SANILA_MASTER_DEMO_SAFE_MODE'})},
  '@/lib/email-os-core/operational-mailboxes':policy,
  '@/lib/email-os-core/delivery-receipt':require(path.join(root,'lib/email-os-core/delivery-receipt.ts')),
 };
 const source=fs.readFileSync(path.join(root,'lib/angelcare360/email/email-os-bridge.ts'),'utf8');
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};new Function('require','module','exports',js)(name=>mocks[name]||require(name),module,module.exports);
 process.env.EMAIL_OS_BRIDGE_URL='https://fixture.example.com';process.env.EMAIL_OS_BRIDGE_TOKEN='fixture-only';process.env.B2B_EMAIL='b2b@angelcarehub.ma';
 const configured=await module.exports.isAngelcare360EmailBridgeAvailable();
 const outcome=await module.exports.sendAngelcare360Email({templateKey:'onboarding',subject:'Fixture',body:'Fixture',toEmail:'controlled@example.com'});
 return{configured,outcome,sent,ledger};
}
(async()=>{
 const real=await scenario();assert.equal(real.outcome.ok,true);assert.equal(real.sent.length,1);assert.equal(real.sent[0].fromEmail,'it.support@angelcarehub.ma');assert.equal(real.stored.mailbox_key,'IT_SUPPORT');assert.equal(real.stored.sender_email,'it.support@angelcarehub.ma');
 const missing=await scenario({available:false});assert.equal(missing.outcome.ok,false);assert.equal(missing.sent.length,0);
 const demo=await scenario({demo:true});assert.equal(demo.outcome.simulated,true);assert.equal(demo.sent.length,0);assert.equal(demo.stored.delivery_state,'simulated_demo_safe');
 const unconfirmed=await scenario({acknowledged:false});assert.equal(unconfirmed.outcome.ok,false);assert.equal(unconfirmed.stored.status,'waiting_internal');assert.equal(unconfirmed.stored.delivery_state,'delivery_unknown');assert.equal(unconfirmed.stored.next_retry_at,null);
 console.log('SANILA_SEND_ROUTING=4/4 scenarios PASS; actual send operation tested with mocked transport; no network or email');
 const bridge=await bridgeScenario();assert.equal(bridge.configured,true);assert.equal(bridge.sent[0].fromEmail,'it.support@angelcarehub.ma');assert.equal(bridge.ledger[0].mailboxKey,'IT_SUPPORT');assert.equal(bridge.outcome.ok,true);
 const inactive=await bridgeScenario({active:false});assert.equal(inactive.configured,false);assert.equal(inactive.outcome.ok,false);assert.equal(inactive.sent.length,0);
 const unknown=await bridgeScenario({acknowledged:false});assert.equal(unknown.outcome.ok,false);assert.equal(unknown.ledger[0].status,'failed');
 const demoBridge=await bridgeScenario({demo:true});assert.equal(demoBridge.outcome.locked,true);assert.equal(demoBridge.sent.length,0);
 console.log('SANILA_BRIDGE=4/4 scenarios PASS; native database configuration, sender, acceptance and demo guard verified with mocks');
})().catch(e=>{console.error(e);process.exitCode=1});
