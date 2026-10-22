/** Disposable, loopback-only fixture setup through the actual SQL commands.
 * Never imported by app routes. This is not an administrative production tool. */
const crypto=require('node:crypto'),assert=require('node:assert/strict');
async function freshVacancy(fixture,index){
 assert.equal(fixture.databaseOrigin,'http://127.0.0.1:4181');
 assert.equal(fixture.origin,'http://localhost:3180');
 const organizationId=index===1?fixture.ids.institution:fixture.ids.household,user=fixture.sessions.find(session=>session.user.id===fixture.ids.hirer),country=index===1?'CA':'GB';
 const payload=Buffer.from(JSON.stringify({role:'service_role',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),head=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),base=head+'.'+payload;
 const service=base+'.'+crypto.createHmac('sha256','public-isolated-jobkix-fixture-signature-only').update(base).digest('base64url');
 async function rpc(name,args,token=user.access_token){const reply=await fetch(fixture.databaseOrigin+'/rest/v1/rpc/'+name,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(args)}),body=await reply.json();assert.equal(reply.status,200,JSON.stringify(body));return body;}
 const command=(action,body,version=0)=>rpc('jobkix_command',{p_action:action,p_payload:body,p_expected_version:version,p_idempotency_key:crypto.randomUUID()});
 const content={organizationId,title:'ISOLATED connected verification '+crypto.randomUUID().slice(0,8),settingId:index===1?'nurseries':'households',occupationId:index===1?'early-childhood-educator':'nanny',originalLocale:'en',country,city:index===1?'Toronto':'London',description:'Synthetic vacancy for browser/API/SQL verification only. This is not a real employment advertisement.',duties:['Plan appropriate professional activities','Communicate with the hiring team'],requirements:['Relevant professional experience'],benefits:['Declared work schedule'],workSchedule:'full_time',contractType:'permanent',workLocation:'on_site',liveIn:false,hoursPerWeek:35,languages:['en'],ageCohorts:['preschool'],compensation:{minimum:20,maximum:25,currency:index===1?'CAD':'GBP',unit:'hour'},overseasApplicants:'yes',sponsorship:'unknown',relocation:'unknown',requiredDocument:true,questions:[{id:crypto.randomUUID(),label:'Describe your relevant experience — isolated verification',kind:'text',required:true,maxLength:1000}]};
 let vacancy=await command('vacancy.create',content);
 vacancy=await command('vacancy.save',{...content,id:vacancy.id},vacancy.version);
 vacancy=await command('vacancy.submit_review',{id:vacancy.id},vacancy.version);
 await rpc('jobkix_admin_command',{p_actor:'30000000-0000-4000-8000-000000000900',p_action:'vacancy.approve',p_payload:{id:vacancy.id,note:'ISOLATED verification fixture only'},p_expected_version:vacancy.version,p_idempotency_key:crypto.randomUUID()},service);
 vacancy=await command('vacancy.publish',{id:vacancy.id,expiresAt:new Date(Date.now()+30*86400000).toISOString()},vacancy.version);
 return {...vacancy,organizationId};
}
module.exports={freshVacancy};
