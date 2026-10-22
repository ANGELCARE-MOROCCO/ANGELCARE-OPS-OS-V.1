/** Actual SQL command/storage boundary with isolated initial identities/media. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),test=require('node:test'),assert=require('node:assert/strict');
const {createDatabase,id}=require('./local-database.cjs');
test('registered packaged scenes retain native edition save/read/review/publication protections',async t=>{
 const fixture=await createDatabase(),{db,execute}=fixture,register=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../docs/jobkix/asset-register.json')));
 const admin=(action,payload,version=0,key=crypto.randomUUID())=>execute('service_role',null,'jobkix_admin_command',{p_actor:id(99001),p_action:action,p_payload:{note:'Isolated packaged media command verification; no live publication.',...payload},p_expected_version:version,p_idempotency_key:key});
 const section=scene=>({id:'opening',title:'Isolated editorial opening',body:'Isolated factual content for native edition persistence checks.',paragraphs:[],items:[],media:{source:'editorial',id:scene,alt:'Isolated editorial description',desktopFocal:{x:52,y:65},mobileFocal:{x:50,y:60}}});
 let created;
 try{
  await t.test('every registered scene saves and reloads exact stable media data through existing commands',async()=>{
   for(const scene of register){const result=await admin('editorial.create',{slug:'isolated-packaged-'+scene.id,kind:'country',locale:'en',title:'Isolated location edition',summary:'Isolated verification only.',author:'Fixture reviewer',provenance:'Isolated test authorship; no human/native review claim.',sections:[section(scene.id)]});
    const rows=await execute('service_role',null,'jobkix_admin_read',{p_actor:id(99001),p_collection:'editorial',p_purpose:'Isolated private saved-edition reload and preview boundary verification.',p_id:result.id,p_page:1});assert.equal(rows.length,1);assert.deepEqual(rows[0].sections,[section(scene.id)]);assert.equal(rows[0].status,'draft');
    const publicValue=await execute('anon',null,'jobkix_public_editorial',{p_slug:'isolated-packaged-'+scene.id,p_locale:'en'});assert.equal(publicValue,null);if(scene.id==='destination-toronto')created={...result,slug:'isolated-packaged-'+scene.id};
   }
  });
  await t.test('unknown scenes, unsafe media, duplicate section IDs and out-of-range focal values are rejected',async()=>{
   for(const sections of [[section('unknown-scene')],[{...section('destination-toronto'),media:{...section('destination-toronto').media,id:'https://unsafe.invalid/image'}}],[section('destination-toronto'),section('destination-london')],[{...section('destination-toronto'),media:{...section('destination-toronto').media,desktopFocal:{x:101,y:50}}}]])await assert.rejects(admin('editorial.create',{slug:'isolated-invalid-'+crypto.randomUUID(),kind:'country',locale:'en',title:'Isolated invalid',summary:'',author:'Fixture reviewer',provenance:'Isolated tests',sections}),/INVALID_INPUT/);
  });
  await t.test('review and publication remain bound to exact saved content hashes',async()=>{
   await assert.rejects(admin('editorial.publish',{id:created.id,contentHash:created.contentHash},created.version),/INVALID_TRANSITION/);
   await assert.rejects(admin('editorial.review',{id:created.id,contentHash:'0'.repeat(64)},created.version),/VERSION_CONFLICT/);
   await admin('editorial.review',{id:created.id,contentHash:created.contentHash},created.version);await admin('editorial.publish',{id:created.id,contentHash:created.contentHash},created.version);
   const published=await execute('anon',null,'jobkix_public_editorial',{p_slug:created.slug,p_locale:'en'});assert.equal(published.sections[0].media.id,'destination-toronto');assert.equal(published.sections[0].media.desktopFocal.x,52);
   const changed=await admin('editorial.save',{id:created.id,locale:'en',title:'Isolated changed edition',summary:'New draft only.',author:'Fixture reviewer',provenance:'Isolated source revision',sections:[section('destination-london')]},created.version);
   assert.equal(changed.state,'draft');const stillPublished=await execute('anon',null,'jobkix_public_editorial',{p_slug:created.slug,p_locale:'en'});assert.equal(stillPublished.sections[0].media.id,'destination-toronto');
  });
  await t.test('public and public-identity roles cannot invoke native administrative mutation or validation helpers',async()=>{
   for(const role of ['anon','authenticated'])await assert.rejects(execute(role,fixture.ids.candidate,'jobkix_admin_command',{p_actor:id(99001),p_action:'editorial.review',p_payload:{id:created.id,note:'Isolated forbidden administration attempt.'},p_expected_version:created.version,p_idempotency_key:crypto.randomUUID()}),/permission denied/);
   await assert.rejects(execute('authenticated',fixture.ids.candidate,'jobkix_editorial_sections',{p_sections:[section('destination-toronto')]}),/permission denied/);
  });
 }finally{await db.close();}
});
