/** Read-only development route compilation before frozen-source browser tests.
 * GET is used even for POST-only APIs; 401/403/405/503 are recorded as-is.
 * No worker invocation, mutation, live data, production build or deployment. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),fixture=JSON.parse(fs.readFileSync('/private/tmp/jobkix-source-20261020/runtime/fixture-session.json')),base=new URL(fixture.origin);
if(base.protocol!=='http:'||!['localhost','127.0.0.1'].includes(base.hostname)||base.port!=='3180')throw Error('ISOLATED_RUNTIME_REQUIRED');
const routes=[];function visit(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())visit(file);else if(entry.name==='route.ts')routes.push('/'+path.relative(path.join(root,'app'),path.dirname(file)).split(path.sep).join('/').replace('[action]','invalid').replace('[id]','00000000-0000-4000-8000-000000000000'));}}
visit(path.join(root,'app/api/jobkix'));
(async()=>{const results=[];for(const route of routes){const started=Date.now(),response=await fetch(fixture.origin+route,{method:'GET',signal:AbortSignal.timeout(300000)});await response.arrayBuffer();results.push({path:route,method:'GET',status:response.status,durationMs:Date.now()-started});console.log('WARMED='+route+' HTTP='+response.status);}fs.writeFileSync(path.join(root,'docs/jobkix/evidence/browser/development-warmup.json'),JSON.stringify({scope:'Read-only on-demand development compilation, not functional acceptance or production performance',results},null,2)+'\n');})().catch(e=>{console.error(e);process.exitCode=1;});
