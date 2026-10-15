import http from 'node:http'
import {createRequire} from 'node:module'
import {readFile,writeFile,mkdir} from 'node:fs/promises'
import path from 'node:path'
import {randomUUID} from 'node:crypto'
import {adapter} from './pg-adapter.mjs'
const require=createRequire(import.meta.url),root=path.resolve(import.meta.dirname,'../..'),out=process.env.DCE_PREVIEW_OUT||'/private/tmp/angelcare-dce-20261014/preview'
const {PGlite}=require(process.env.DCE_PGLITE||'/Users/user/.npm/_npx/2778af9cee32ff87/node_modules/@electric-sql/pglite')
const pg=new PGlite(process.env.DCE_TEST_DATA||'/private/tmp/angelcare-dce-20261014/test-database')
await pg.waitReady
await pg.exec("set time zone 'UTC';do $$begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon;end if;if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated;end if;if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role;end if;end $$;")
await pg.exec(`create table if not exists app_users(id uuid primary key,full_name text,email text,role text,status text,tenant_id text,territory_id text);
 create table if not exists angelcare_marketplace_workspace_access(app_user_id uuid,workspace_key text,enabled boolean,starts_at timestamptz,expires_at timestamptz);
 create table if not exists angelcare_marketplace_media_assets(id uuid primary key,file_name text,asset_key text,mime_type text,public_url text,desktop_url text,size_bytes int,status text,rights_status text,license_type text,rights_expires_at timestamptz,duration_seconds numeric,metadata jsonb default '{}');
 create table if not exists angelcare_marketplace_catalog_discovery_v(id uuid primary key,slug text,item_key text,name_en text,name_fr text,name_ar text,kind text,status text,territory_id text,price_amount numeric,price_mode text,currency_label text,availability_status text);
 create table if not exists angelcare_marketplace_customer_accounts(id uuid primary key,full_name text,email text,status text,tenant_id text,territory_id text);`)
for(const file of ['01_DCE_ADMIN_R1.sql','04_DCE_ADMIN_R2_INTEGRITY.sql'])await pg.exec(await readFile(path.join(root,'angelcare-marketplace/digital-customer-experience/database',file),'utf8'))
globalThis.__DCE_TEST_DB=adapter(pg)
let repository=require(path.join(out,'repository.cjs'));const model=require(path.join(out,'model.cjs')),registry=require(path.join(out,'registry.cjs')),capabilities=require(path.join(out,'capabilities.cjs'))
const actorId='10000000-0000-4000-8000-000000000001'
const context={actor:{id:actorId,displayName:'DCE Test Operator',email:'operator@example.test',sourceRole:'operator'},roleKeys:[],permissions:['view','manage','publish','moderate','monetize','export','purge'].map(p=>'marketplace.digital_experience.'+p).concat(['marketplace.media.view','marketplace.media.manage','marketplace.crm.view']),assignments:[{scopeType:'global'}],tenantId:null,territoryId:null,locale:'en',workspaceKeys:[]}
await pg.query('insert into app_users values($1,$2,$3,$4,$5,null,null) on conflict do nothing',[actorId,'DCE Test Operator','operator@example.test','admin','active'])
await mkdir(path.join(out,'sources'),{recursive:true})
const image='/angelcare-marketplace/families-world-r2/homework.jpg',media=[{id:'20000000-0000-4000-8000-000000000001',name:'Family reading test image.jpg',mime:'image/jpeg',url:image},{id:'20000000-0000-4000-8000-000000000002',name:'Accessible worksheet test.pdf',mime:'application/pdf',url:'/sources/worksheet.pdf'},{id:'20000000-0000-4000-8000-000000000003',name:'Narration timing test.wav',mime:'audio/wav',url:'/sources/narration.wav'},{id:'20000000-0000-4000-8000-000000000005',name:'Video timing test.webm',mime:'video/webm',url:'/sources/video.webm'},{id:'20000000-0000-4000-8000-000000000004',name:'Caption test.vtt',mime:'text/vtt',url:'/sources/captions.vtt'}]
const {PDFDocument,StandardFonts}=require(path.join(root,'node_modules/pdf-lib'));const pdf=await PDFDocument.create();for(const text of ['Family reading · test sheet 1','School activity · test sheet 2']){const page=pdf.addPage([595,842]);const font=await pdf.embedFont(StandardFonts.Helvetica);page.drawText(text,{x:50,y:760,size:18,font});page.drawText('Isolated DCE output inspection. No customer data.',{x:50,y:710,size:12,font})}await writeFile(path.join(out,'sources/worksheet.pdf'),await pdf.save())
const rate=16000,duration=5,samples=rate*duration,buffer=Buffer.alloc(44+samples*2);buffer.write('RIFF');buffer.writeUInt32LE(buffer.length-8,4);buffer.write('WAVEfmt ',8);buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(1,22);buffer.writeUInt32LE(rate,24);buffer.writeUInt32LE(rate*2,28);buffer.writeUInt16LE(2,32);buffer.writeUInt16LE(16,34);buffer.write('data',36);buffer.writeUInt32LE(samples*2,40);for(let i=0;i<samples;i++)buffer.writeInt16LE(Math.round(Math.sin(2*Math.PI*220*i/rate)*1200),44+i*2);await writeFile(path.join(out,'sources/narration.wav'),buffer)
await writeFile(path.join(out,'sources/captions.vtt'),'WEBVTT\n\n00:00.000 --> 00:03.000\nRead together.\n')
for(const m of media)await pg.query("insert into angelcare_marketplace_media_assets(id,file_name,asset_key,mime_type,public_url,desktop_url,size_bytes,status,rights_status,duration_seconds,metadata) values($1,$2,$2,$3,$4,$4,1000,'active','owned',5,'{}') on conflict do nothing",[m.id,m.name,m.mime,m.url])
const offerId='30000000-0000-4000-8000-000000000001';await pg.query("insert into angelcare_marketplace_catalog_discovery_v(id,slug,item_key,name_en,name_fr,kind,status,price_amount,price_mode,currency_label,availability_status) values($1,'test-school-kit','test-school-kit','Isolated school kit reference','Référence de kit scolaire de test','product','published',null,'quote_only','Dh','configuration_required') on conflict do nothing",[offerId])
let failNextSave=false,failedReleaseQuery=false
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://127.0.0.1');const send=(value,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value))}
 if(url.pathname==='/__test/control'&&req.method==='POST'){let raw='';for await(const chunk of req)raw+=chunk;const v=JSON.parse(raw);if(v.failNextSave)failNextSave=true;if(v.failedReleaseQuery!==undefined)failedReleaseQuery=v.failedReleaseQuery;if(v.permissions)context.permissions=v.permissions;if(v.locale)context.locale=v.locale;return send({ok:true})}
 if(url.pathname==='/__test/state'){const rows=await pg.query('select * from ac_dce_records order by created_at');return send({records:rows.rows,families:registry.FAMILIES,media,offerId})}
 if(url.pathname==='/__test/sql'&&req.method==='POST'){let raw='';for await(const chunk of req)raw+=chunk;const {sql,params=[],exec=false}=JSON.parse(raw);return send(exec?await pg.exec(sql):await pg.query(sql,params))}
 if(url.pathname==='/__test/reload'&&req.method==='POST'){delete require.cache[require.resolve(path.join(out,'repository.cjs'))];repository=require(path.join(out,'repository.cjs'));return send({reloaded:true})}
 if(url.pathname.startsWith('/api/angelcare-marketplace/admin/digital-customer-experience')){
  let result
  if(req.method==='POST'){let raw='';for await(const chunk of req)raw+=chunk;const cmd=JSON.parse(raw);if(failNextSave&&cmd.action==='save'){failNextSave=false;return send({error:{message:'Injected isolated failed save; input retained.',code:'INTERNAL_ERROR'}},503)}result=await repository.command(context,cmd)}else{const input=Object.fromEntries(url.searchParams);if(input.op==='releases'&&failedReleaseQuery)return send({error:{message:'Injected publication register failure.',code:'INTERNAL_ERROR'}},503);result=await repository.read(context,input)}
  return send({data:result})
 }
 const relative=decodeURIComponent(url.pathname).replace(/^\//,'');if(relative.split('/').includes('..')){res.writeHead(400);return res.end()}
 let file=relative.startsWith('sources/')?path.join(out,relative):['client.js','client.css','client.js.map'].includes(relative)?path.join(out,relative):relative.startsWith('angelcare-marketplace/')||relative.startsWith('brand/')?path.join(root,'public',relative):path.join(out,'index.html')
 if(!path.extname(relative))file=path.join(out,'index.html')
 const bytes=await readFile(file);const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.jpg':'image/jpeg','.png':'image/png','.pdf':'application/pdf','.wav':'audio/wav','.vtt':'text/vtt','.mp4':'video/mp4','.webm':'video/webm'}[path.extname(file)]||'application/octet-stream';res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store'});res.end(bytes)
 }catch(e){res.writeHead(e.status||500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{message:e.message,code:e.code,details:e.fieldErrors}}));console.error(e.code||'ERR',e.message)}})
server.listen(Number(process.env.DCE_PREVIEW_PORT||4186),'127.0.0.1',()=>console.log('DCE isolated SQL-backed preview: http://127.0.0.1:'+(process.env.DCE_PREVIEW_PORT||4186)))
