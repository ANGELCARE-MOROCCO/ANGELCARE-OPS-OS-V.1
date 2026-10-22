/** Loopback-only private fixtures through actual canonical commands. No publication. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
async function studioSelectionFixture(){
 const fixture=JSON.parse(fs.readFileSync('/private/tmp/jobkix-source-20261020/runtime/fixture-session.json'));
 assert.equal(fixture.origin,'http://localhost:3180');assert.equal(fixture.databaseOrigin,'http://127.0.0.1:4181');
 const actor=fixture.sessions.find(row=>row.user.id===fixture.ids.hirer),headers={Authorization:'Bearer '+actor.access_token,'Content-Type':'application/json'},file='/private/tmp/jobkix-source-20261020/runtime/studio-selection-fixture.json';
 async function rpc(name,args){const response=await fetch(fixture.databaseOrigin+'/rest/v1/rpc/'+name,{method:'POST',headers,body:JSON.stringify(args)}),body=await response.json();assert.equal(response.status,200,JSON.stringify(body));return body;}
 async function visible(table,id){const response=await fetch(fixture.databaseOrigin+'/rest/v1/'+table+'?select=id&id=eq.'+id,{headers});assert.equal(response.status,200);return (await response.json()).length===1;}
 if(fs.existsSync(file)){const previous=JSON.parse(fs.readFileSync(file));if(previous.ready&&await visible('jobkix_organizations',previous.organizations.at(-1))&&await visible('jobkix_sites',previous.sites.at(-1))&&await visible('jobkix_vacancies',previous.vacancies.at(-1))&&await visible('jobkix_talent_pools',previous.pools.at(-1)))return previous;}
 const run=crypto.randomUUID(),state={run,ready:false,organization:fixture.ids.institution,organizations:[],sites:[],vacancies:[],pools:[],publicTotalBefore:(await rpc('jobkix_search',{p_filters:{}})).total};
 const save=()=>fs.writeFileSync(file,JSON.stringify(state,null,2)+'\n');save();
 async function command(action,payload,index,workspace=false){return rpc(workspace?'jobkix_workspace_command':'jobkix_command',{p_action:action,p_payload:payload,p_expected_version:0,p_idempotency_key:run+':'+action+':'+index});}
 for(let index=1;index<=250;index++){
  const number=String(index).padStart(4,'0');
  const org=await command('organization.create',{kind:'institution',publicName:'ISOLATED Selector organization '+number,country:'CA',city:'Toronto',originalLocale:'en'},index);state.organizations.push(org.id);
  const site=await command('site.create',{organizationId:state.organization,label:'ISOLATED Selector site '+number,country:'CA',region:'',city:'Toronto',timezone:'America/Toronto'},index,true);state.sites.push(site.id);
  const vacancy=await command('vacancy.create',{organizationId:state.organization,siteId:site.id,title:'ISOLATED Selector private vacancy '+number,settingId:'nurseries',occupationId:'nanny',country:'CA',region:'',city:'Toronto',originalLocale:'en',description:'ISOLATED PRIVATE SELECTOR FIXTURE. No real employer or published vacancy claim.',workSchedule:'full_time',contractType:'permanent',workLocation:'on_site',liveIn:false},index);state.vacancies.push(vacancy.id);
  const pool=await command('pool.create',{organizationId:state.organization,name:'ISOLATED Selector pool '+number},index,true);state.pools.push(pool.id);save();if(index%25===0)console.log('PRIVATE_SELECTOR_FIXTURES='+index+' per collection');
 }
 state.publicTotalAfter=(await rpc('jobkix_search',{p_filters:{}})).total;assert.equal(state.publicTotalAfter,state.publicTotalBefore,'Private selection fixtures must not enter public discovery');state.ready=true;save();return state;
}
module.exports={studioSelectionFixture};
if(require.main===module)studioSelectionFixture().then(state=>console.log(JSON.stringify({privateRecordsPerCollection:state.organizations.length,publicDiscoveryUnchanged:state.publicTotalBefore===state.publicTotalAfter}))).catch(error=>{console.error(error);process.exitCode=1;});
