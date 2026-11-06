process.env.KIDFLIX_INTERACTIVE_SIGNING_SECRET='kidflix-local-test-only-signing-secret-'.repeat(3);
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),Module=require('module'),{randomBytes}=require('crypto');
const ts=require(process.env.KIDFLIX_QA_TYPESCRIPT||'typescript'),{PGlite}=require(process.env.KIDFLIX_QA_PGLITE||'@electric-sql/pglite');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},fileName:file}).outputText,file);
(async()=>{
 const app=path.resolve(__dirname,'../..'),db=new PGlite(),objects=new Map();let failAssetOnce=false;
 await db.exec(`create role anon;create role authenticated;create role service_role;
 create table ac_kidflix_interactive_packages(id uuid primary key,scope_key text,owner_actor_id text,family_key text,locale text,manifest jsonb,checksum_sha256 text,entry_path text,original_storage_path text,file_index jsonb,state text,record_id uuid,release_id uuid);
 create table ac_dce_releases(id uuid primary key,record_id uuid,tenant_id text,territory_id text,state text,manifest jsonb,snapshot jsonb);
 create table ac_dce_records(id uuid primary key,kind text,family text,key text,tenant_id text,territory_id text);
 `);
 await db.exec(fs.readFileSync(app+'/angelcare-marketplace/digital-customer-experience/database/INSTALL_KIDFLIX_DELIVERY_R2.sql','utf8'));
 class Query{
  constructor(table){this.table=table;this.mode='select';this.where=[];this.params=[];this.limitN=0;this.returnSingle=false;this.maybe=false}
  select(){return this}insert(value){this.mode='insert';this.value=value;return this}update(value){this.mode='update';this.value=value;return this}delete(){this.mode='delete';return this}
  eq(k,v){this.params.push(v);this.where.push('"'+k+'"=$'+this.params.length);return this}is(k,v){this.where.push('"'+k+'" is '+(v===null?'null':'not null'));return this}neq(k,v){this.params.push(v);this.where.push('"'+k+'"<>$'+this.params.length);return this}
  in(k,vs){this.params.push(vs);this.where.push('"'+k+'"=any($'+this.params.length+')');return this}order(){return this}limit(n){this.limitN=n;return this}single(){this.returnSingle=true;return this}maybeSingle(){this.returnSingle=true;this.maybe=true;return this}
  then(resolve,reject){return this.run().then(resolve,reject)}
  async run(){try{let sql,args=[...this.params],where=this.where.length?' where '+this.where.join(' and '):'';
   const value=v=>v&&typeof v==='object'&&!Array.isArray(v)?JSON.stringify(v):v;
   if(this.mode==='insert'){const keys=Object.keys(this.value);args=keys.map(k=>value(this.value[k]));sql='insert into '+this.table+'('+keys.map(k=>'"'+k+'"').join(',')+') values('+keys.map((_,i)=>'$'+(i+1)).join(',')+') returning *';}
   else if(this.mode==='update'){const keys=Object.keys(this.value),start=args.length;args.push(...keys.map(k=>value(this.value[k])));sql='update '+this.table+' set '+keys.map((k,i)=>'"'+k+'"=$'+(start+i+1)).join(',')+where+' returning *';}
   else if(this.mode==='delete')sql='delete from '+this.table+where+' returning *';else sql='select * from '+this.table+where+(this.limitN?' limit '+this.limitN:'');
   const r=await db.query(sql,args);if(this.returnSingle){if(!r.rows.length&&!this.maybe)return {data:null,error:{code:'PGRST116',message:'No rows'}};return{data:r.rows[0]||null,error:null};}return {data:r.rows,error:null};
  }catch(e){return {data:null,error:{code:e.code,message:e.message}}}}
 }
 const adapter={from:t=>new Query(t),rpc:async(name,args={})=>{try{const entries=Object.entries(args);const r=await db.query('select '+name+'('+entries.map(([k],i)=>k+'=>$'+(i+1)).join(',')+') as value',entries.map(([,v])=>v));return {data:r.rows[0].value,error:null}}catch(e){return{data:null,error:{message:e.message,code:e.code}}}},storage:{from:()=>({upload:async(key,bytes,opts)=>{if(failAssetOnce&&key.includes('/files/')){failAssetOnce=false;return{error:{message:'Simulated interruption'}}}if(objects.has(key)&&!opts.upsert)return{error:{message:'Already exists'}};objects.set(key,Buffer.from(bytes));return{error:null}},download:async key=>objects.has(key)?{data:new Blob([objects.get(key)]),error:null}:{data:null,error:{message:'Missing'}},remove:async keys=>{keys.forEach(k=>objects.delete(k));return{error:null}}})}};
 const load=Module._load;Module._load=function(name,parent,...rest){if(name==='server-only')return {};if(name==='@/lib/supabase/server')return{createServiceClient:async()=>adapter};if(name.endsWith('/digital-customer-experience/repository'))return{authorize:()=>{},scopeKey:c=>(c.tenantId||'~')+'|'+(c.territoryId||'~'),record:async()=>null};return load.call(this,name,parent,...rest)};
 const {beginImport,putImportChunk,advanceImport,importStatus,cancelImport,IMPORT_CHUNK_BYTES}=require(app+'/angelcare-marketplace/kidflix/interactive/import-session.ts');const {rebuildPackageArchive,sha256}=require(app+'/angelcare-marketplace/kidflix/interactive/package.ts');
 const manifest={contract:'KIDFLIX_UNIVERSAL_INTERACTIVE',family_key:'visual-cards',target_locale:'fr',required_locales:['fr'],title:'Alphabet',runtime:{kind:'sandboxed-web-app',entry:'index.html'},branding:{provider:'kidflix-host',official_logo_required:true,copyright_required:true},copyright:{holder:'AngelCare',license:'Owned'},audience:{age_min:1,age_max:6}};
 const files=[{path:'kidflix.manifest.json',bytes:Buffer.from(JSON.stringify(manifest))},{path:'index.html',bytes:Buffer.from('<!doctype html><html><head></head><body>Alphabet</body></html>')},{path:'large.bin',bytes:randomBytes(5*1024*1024)},...Array.from({length:28},(_,i)=>({path:'asset-'+i+'.txt',bytes:Buffer.from('Original asset '+i)}))];const archive=rebuildPackageArchive(files),c={tenantId:'tenant',territoryId:'territory',actor:{id:'operator'}};let checks=0;
 async function test(name,fn){await fn();checks++;console.log('PASS '+name)}
 let s=await beginImport(c,{checksum:sha256(archive),size:archive.length,family:'visual-cards',locale:'fr'});
 await test('same checksum, actor and target reuse the import session',async()=>assert.equal((await beginImport(c,{checksum:sha256(archive),size:archive.length,family:'visual-cards',locale:'fr'})).id,s.id));
 await test('server does not process an incomplete upload',async()=>await assert.rejects(advanceImport(c,s.id),/TRANSFER_INCOMPLETE/));
 await test('chunk checksum is enforced',async()=>await assert.rejects(putImportChunk(c,s.id,0,archive.subarray(0,IMPORT_CHUNK_BYTES),'0'.repeat(64)),/INTEGRITY/));
 await test('a different actor cannot resume another import',async()=>await assert.rejects(importStatus({...c,actor:{id:'other'}},s.id),/NOT_FOUND/));
 for(let i=0;i<s.chunkCount;i++){const part=archive.subarray(i*IMPORT_CHUNK_BYTES,Math.min(archive.length,(i+1)*IMPORT_CHUNK_BYTES));await putImportChunk(c,s.id,i,part,sha256(part));}
 await test('repeated uploaded chunk is safe and receipts persist',async()=>{const part=archive.subarray(0,IMPORT_CHUNK_BYTES);await putImportChunk(c,s.id,0,part,sha256(part));assert.equal((await importStatus(c,s.id)).received.length,2)});
 await test('processing failure is recorded for retry',async()=>{failAssetOnce=true;await assert.rejects(advanceImport(c,s.id),/UPLOAD_FAILED/);assert.equal((await importStatus(c,s.id)).state,'failed')});
 let first;await test('retry reuses immutable uploads and advances a bounded cursor',async()=>{first=await advanceImport(c,s.id);assert.equal(first.cursor,24);assert.equal(first.state,'processing')});
 let done;await test('another request resumes extraction to completion',async()=>{done=await advanceImport(c,s.id);assert.equal(done.state,'validated');assert.equal(done.package.fileCount,undefined);assert.equal(done.package.files.length,files.length);assert.equal(done.package.checksum,sha256(archive))});
 await test('completed imports can be resumed without reuploading',async()=>{const again=await advanceImport(c,s.id);assert.equal(again.package.id,done.package.id);assert.equal((await db.query('select count(*)::int n from ac_kidflix_interactive_packages')).rows[0].n,1)});
 await test('redundant chunks are removed while the original archive remains',async()=>{assert(![...objects.keys()].some(k=>k.includes('/chunks/')));assert([...objects.keys()].some(k=>k.endsWith('/original.zip')))});
 await test('a validated project cannot be cancelled or erased',async()=>await assert.rejects(cancelImport(c,s.id),/PRESERVED/));
 await db.exec(`update ac_kidflix_import_sessions set state='failed',cursor=0`);
 await test('crash between package finalization and session completion is recoverable',async()=>{const recovered=await advanceImport(c,s.id);assert.equal(recovered.state,'validated');assert.equal(recovered.package.id,done.package.id)});
 const partial=await beginImport(c,{checksum:'c'.repeat(64),size:archive.length,family:'visual-cards',locale:'fr'});const part=archive.subarray(0,IMPORT_CHUNK_BYTES);await putImportChunk(c,partial.id,0,part,sha256(part));
 await test('cancelled partial upload cleans staged bytes',async()=>{await cancelImport(c,partial.id);assert.equal((await importStatus(c,partial.id)).state,'cancelled');assert(![...objects.keys()].some(k=>k.includes(partial.packageId)))});
 await db.close();console.log(JSON.stringify({contract:'KIDFLIX_IMPORT_SESSION_R2',checksPassed:checks}));
})().catch(e=>{console.error(e);process.exitCode=1});
