/** Actual Next development server + disposable SQL/Auth/storage protocol adapters.
 * These adapters are verification utilities, never application/production handlers.
 */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const {createDatabase}=require('./local-database.cjs');
const root=path.resolve(__dirname,'../..'),port=3180,databasePort=4181,origin='http://localhost:'+port;
const secret='public-isolated-jobkix-fixture-signature-only';
function token(role,user=null){const head=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),payload=Buffer.from(JSON.stringify({aud:'authenticated',role,sub:user?.id,iss:'http://127.0.0.1:'+databasePort+'/auth/v1',email:user?.email,exp:Math.floor(Date.now()/1000)+86400,iat:Math.floor(Date.now()/1000)})).toString('base64url'),base=head+'.'+payload;return base+'.'+crypto.createHmac('sha256',secret).update(base).digest('base64url');}
function decode(value){const [head,payload,signature]=value.split('.');if(!head||!payload||!signature)throw Error('FIXTURE_AUTH_REQUIRED');const expected=crypto.createHmac('sha256',secret).update(head+'.'+payload).digest('base64url');if(expected.length!==signature.length||!crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(signature)))throw Error('FIXTURE_AUTH_REQUIRED');const claims=JSON.parse(Buffer.from(payload,'base64url'));if(claims.exp<Date.now()/1000||!['anon','authenticated','service_role'].includes(claims.role))throw Error('FIXTURE_AUTH_REQUIRED');return claims;}
function identifier(value){if(!/^[a-z_][a-z0-9_]*$/.test(value))throw Error('FIXTURE_UNSUPPORTED_IDENTIFIER');return '"'+value+'"';}
function field(value){if(value==='snapshot->vacancy->>title')return "snapshot->'vacancy'->>'title'";return identifier(value);}
function parts(value){let depth=0,start=0,result=[];for(let i=0;i<value.length;i++){if(value[i]==='(')depth++;if(value[i]===')')depth--;if(value[i]===','&&!depth){result.push(value.slice(start,i));start=i+1;}}result.push(value.slice(start));return result;}
function predicate(raw,values){if(raw.startsWith('and(')||raw.startsWith('or(')){const logic=raw.startsWith('and')?'and':'or',body=raw.slice(logic.length+1,-1);return '('+parts(body).map(item=>predicate(item,values)).join(' '+logic+' ')+')';}const match=raw.match(/^([a-z_][a-z0-9_]*(?:->vacancy->>title)?)\.(not\.)?(eq|neq|gt|gte|lt|lte|is|in|ilike)\.(.*)$/s);if(!match)throw Error('FIXTURE_UNSUPPORTED_FILTER');const [,key,neg,operation,value]=match,column=field(key);let sql;
 if(operation==='is'){if(!['null','true','false'].includes(value))throw Error('FIXTURE_UNSUPPORTED_FILTER');sql=column+' is '+value;}
 else if(operation==='in'){if(!value.startsWith('(')||!value.endsWith(')'))throw Error('FIXTURE_UNSUPPORTED_FILTER');const list=parts(value.slice(1,-1)).map(v=>v.replace(/^"|"$/g,''));if(!list.length)sql='false';else sql=column+' in ('+list.map(item=>{values.push(item);return '$'+values.length;}).join(',')+')';}
 else{values.push(value);sql=column+' '+({eq:'=',neq:'<>',gt:'>',gte:'>=',lt:'<',lte:'<=',ilike:'ilike'}[operation])+' $'+values.length;}
 return neg?'not ('+sql+')':sql;
}
async function body(request){let data=Buffer.alloc(0);for await(const chunk of request){data=Buffer.concat([data,chunk]);if(data.length>22000000)throw Error('FIXTURE_INPUT_TOO_LARGE');}return data;}
function json(response,status,value,headers={}){response.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':origin,...headers});response.end(JSON.stringify(value));}
(async()=>{
 const fixture=await createDatabase({documentPagination:process.argv.includes('--document-pagination')}),anonKey=token('anon'),serviceKey=token('service_role'),requests=[],state={failure:null,delay:0},sessions=fixture.users.map(user=>({user:{id:user.id,email:user.email,email_confirmed_at:'2026-10-01T00:00:00Z',created_at:'2026-10-01T00:00:00Z',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email',providers:['email']},user_metadata:{full_name:user.name}},access_token:token('authenticated',user),token_type:'bearer',refresh_token:'isolated-refresh-'+user.id,expires_in:86400,expires_at:Math.floor(Date.now()/1000)+86400}));
 const server=http.createServer(async(request,response)=>{const url=new URL(request.url,'http://127.0.0.1:'+databasePort),started=Date.now();try{
  if(request.method==='OPTIONS'){response.writeHead(204,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info,prefer,range','Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS'});response.end();return;}
  if(url.pathname==='/__test__/status'){json(response,200,{fixture:'ISOLATED_LOCAL_POSTGRESQL',ids:fixture.ids,requests:requests.slice(-100)});return;}
  if(url.pathname==='/__test__/control'&&request.method==='POST'){const input=JSON.parse(await body(request));state.failure=typeof input.failure==='string'?input.failure:null;state.delay=Number.isInteger(input.delay)&&input.delay>=0&&input.delay<=15000?input.delay:0;json(response,200,{ok:true});return;}
  const bearer=(request.headers.authorization||'').replace(/^Bearer /,''),claims=decode(bearer||anonKey);
  if(url.pathname.startsWith('/auth/v1/')){
   const session=sessions.find(s=>s.user.id===claims.sub);
   if(url.pathname==='/auth/v1/user'&&session){json(response,200,session.user);return;}
   if(url.pathname==='/auth/v1/logout'){json(response,200,{});return;}
   if(url.pathname==='/auth/v1/token'&&request.method==='POST'){const input=JSON.parse(await body(request)),selected=sessions.find(s=>s.user.email===input.email&&input.password==='fixture-passphrase-only'||s.refresh_token===input.refresh_token);if(!selected){json(response,400,{error:'invalid_grant',error_description:'Isolated fixture credentials required'});return;}json(response,200,selected);return;}
   json(response,401,{msg:'Isolated fixture session required'});return;
  }
  if(url.pathname.startsWith('/storage/v1/')){
   if(claims.role!=='service_role')throw Error('FIXTURE_AUTH_REQUIRED');
   if(url.pathname.startsWith('/storage/v1/bucket/')){json(response,200,{id:'jobkix-private-documents',name:'jobkix-private-documents',public:false});return;}
   const prefix='/storage/v1/object/jobkix-private-documents/';if(!url.pathname.startsWith(prefix))throw Error('FIXTURE_UNSUPPORTED_STORAGE');const key=decodeURIComponent(url.pathname.slice(prefix.length));if(!/^[a-f0-9-]{36}\/[a-f0-9-]{36}\/original$/.test(key))throw Error('FIXTURE_UNSUPPORTED_STORAGE');
   if(request.method==='POST'){if(fixture.storage.has(key)){json(response,409,{message:'Already exists'});return;}fixture.storage.set(key,{bytes:await body(request),mime:request.headers['content-type']});json(response,200,{Key:'jobkix-private-documents/'+key});return;}
   const object=fixture.storage.get(key);if(!object){json(response,404,{message:'Object missing'});return;}response.writeHead(200,{'Content-Type':object.mime,'Content-Length':object.bytes.length});response.end(object.bytes);return;
  }
  if(state.delay)await new Promise(resolve=>setTimeout(resolve,state.delay));
  if(state.failure&&url.pathname.includes(state.failure)){json(response,503,{message:'ISOLATED_DEPENDENCY_FAILURE',code:'FIXTURE_DEPENDENCY'});return;}
  if(url.pathname.startsWith('/rest/v1/rpc/')){
   const name=url.pathname.slice('/rest/v1/rpc/'.length);if(!/^jobkix_[a-z0-9_]+$/.test(name)||request.method!=='POST')throw Error('FIXTURE_UNSUPPORTED_RPC');const args=JSON.parse(await body(request));for(const key of Object.keys(args))identifier(key);
   const result=await fixture.execute(claims.role,claims.sub||null,name,args);json(response,200,result);requests.push({path:url.pathname,role:claims.role,actor:claims.sub||null,status:200,ms:Date.now()-started});return;
  }
  if(url.pathname.startsWith('/rest/v1/')){
   const table=url.pathname.slice('/rest/v1/'.length);if(!/^jobkix_[a-z0-9_]+$/.test(table)){json(response,404,{message:'Native shared authority unavailable in this isolated adapter',code:'PGRST205'});return;}
   if(!['GET','HEAD'].includes(request.method))throw Error('FIXTURE_DIRECT_MUTATION_REFUSED');
   const values=[],filters=[];for(const [key,value] of url.searchParams){if(['select','order','limit','offset'].includes(key))continue;if(key==='or'||key==='and'){filters.push(predicate(key+value,values));continue;}filters.push(predicate(key+'.'+value,values));}
   const columns=url.searchParams.get('select')||'*',projection=columns==='*'?'*':columns.split(',').map(field).join(','),where=filters.length?' where '+filters.join(' and '):'',order=url.searchParams.get('order'),ordering=order?' order by '+order.split(',').map(part=>{const [column,direction='asc',nulls]=part.split('.');if(!['asc','desc'].includes(direction)||nulls&&!['nullsfirst','nullslast'].includes(nulls))throw Error('FIXTURE_UNSUPPORTED_ORDER');return field(column)+' '+direction+(nulls?' nulls '+(nulls==='nullsfirst'?'first':'last'):'');}).join(','):'',limit=Number(url.searchParams.get('limit')||1000),offset=Number(url.searchParams.get('offset')||0);if(!Number.isInteger(limit)||limit<0||limit>10000||!Number.isInteger(offset)||offset<0)throw Error('FIXTURE_UNSUPPORTED_RANGE');
   const result=await fixture.db.transaction(async tx=>{await tx.exec('set local role '+claims.role);if(claims.sub)await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[claims.sub]);const total=Number((await tx.query('select count(*) total from public.'+identifier(table)+where,values)).rows[0].total),rows=(await tx.query('select '+projection+' from public.'+identifier(table)+where+ordering+' limit '+limit+' offset '+offset,values)).rows;return {total,rows};});
   const headers={'Content-Range':result.rows.length?offset+'-'+(offset+result.rows.length-1)+'/'+result.total:'*/'+result.total};if((request.headers.accept||'').includes('vnd.pgrst.object')){if(result.rows.length!==1){json(response,406,{code:'PGRST116',message:'Cannot coerce the result to a single JSON object',details:'The result contains '+result.rows.length+' rows'},headers);return;}json(response,200,result.rows[0],headers);}else json(response,200,result.rows,headers);return;
  }
  json(response,404,{message:'Unknown isolated fixture protocol'});
 }catch(error){requests.push({path:url.pathname,status:400,error:error.message,ms:Date.now()-started});json(response,error.message==='FIXTURE_AUTH_REQUIRED'?401:400,{message:error.message,code:error.code||'FIXTURE_PROTOCOL_ERROR'});}});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(databasePort,'127.0.0.1',resolve);});
 const verificationDir='/private/tmp/jobkix-source-20261020/runtime';fs.mkdirSync(verificationDir,{recursive:true});
 fs.writeFileSync(path.join(verificationDir,'fixture-session.json'),JSON.stringify({origin,databaseOrigin:'http://127.0.0.1:'+databasePort,ids:fixture.ids,sessions,description:'SYNTHETIC TEST TOKENS ONLY; not production credentials'},null,2));
 const protectedConfig=['next-env.d.ts','tsconfig.json','tsconfig.vercel-production.json','next.config.ts'],baseline=Object.fromEntries(protectedConfig.map(name=>[name,fs.readFileSync(path.join(root,name))]));for(const [name,bytes] of Object.entries(baseline))fs.writeFileSync(path.join(verificationDir,name),bytes);
 const child=spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'dev','--webpack','--hostname','127.0.0.1','--port',String(port)],{cwd:root,env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:'+databasePort,NEXT_PUBLIC_SUPABASE_ANON_KEY:anonKey,SUPABASE_SERVICE_ROLE_KEY:serviceKey,JOBKIX_PUBLIC_ORIGIN:'',JOBKIX_TRUSTED_CLIENT_IP_HEADER:'x-real-ip',JOBKIX_GUEST_CASE_SECRET:'isolated-local-guest-fixture-secret-2026',JOBKIX_OPERATIONS_SECRET:'isolated-local-operations-fixture-secret-2026',NEXT_TELEMETRY_DISABLED:'1',NODE_OPTIONS:(process.env.NODE_OPTIONS||'')+' --require='+path.join(root,'scripts/jobkix/local-network.cjs')},stdio:'inherit'});
 console.log('ISOLATED_JOBKIX_RUNTIME='+origin+'; real Next dev + actual PostgreSQL; synthetic Auth/storage adapters; no hosted-service certification.');
 let stopping=false;function stop(){if(stopping)return;stopping=true;child.kill('SIGTERM');}process.on('SIGINT',stop);process.on('SIGTERM',stop);
 child.on('exit',async code=>{for(const [name,original] of Object.entries(baseline)){const file=path.join(root,name),current=fs.readFileSync(file);if(current.equals(original))continue;const expected=Buffer.from(original.toString().replace('./.next/types/routes.d.ts','./.next/dev/types/routes.d.ts'));if(name==='next-env.d.ts'&&current.equals(expected)){fs.writeFileSync(file,original);console.log('RESTORED_NEXT_GENERATED_DECLARATION='+name);}else console.error('PROTECTED_CONFIG_CHANGED_REVIEW_REQUIRED='+name);}await new Promise(resolve=>server.close(resolve));await fixture.db.close();process.exitCode=code||0;});
})().catch(error=>{console.error(error);process.exitCode=1;});
