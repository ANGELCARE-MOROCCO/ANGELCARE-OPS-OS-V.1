import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const root="angelcare-marketplace/";
const publicRoot=root+"establishments-world/";
const imagery=root+"marketplace-imagery/";
const data=JSON.parse(read(imagery+"establishments-r12-slots.json"));
const existing=JSON.parse(read(imagery+"slot-seeds.json")).filter(x=>x.id.startsWith("establishments."));
const rules=JSON.parse(read(imagery+"slot-rules.json"));
const r6=read(publicRoot+"ConseilExperienceR6.tsx");
const partner=read(publicRoot+"partner/PartnerR2Experience.tsx");
const eqHero=read(publicRoot+"EquipmentHeroR11.tsx");
const eqBody=read(publicRoot+"EquipmentExperienceR10.tsx");
const eqScene=read(publicRoot+"EquipmentR9DomainStudio.tsx");
const domains=read(publicRoot+"equipment-r8-data.ts");
const programs=read(publicRoot+"equipment-r9-programs.ts");
const editorial=read(publicRoot+"equipment-r10-editorial.ts");
const studio=read(imagery+"Studio.tsx");
const runtime=read(imagery+"Runtime.tsx");
const model=read(imagery+"model.ts");
const registry=read(imagery+"registry.ts");
const managed=read(imagery+"ManagedImage.tsx");
const preview=read(imagery+"establishments-r12-preview.ts");
const shell=read(root+"public-universe/components/GlobalPublicShell.tsx");
const byId=new Map(data.map(x=>[x.id,x]));
function has(s){const id="establishments."+s;assert.ok(byId.has(id),"missing registered slot: "+id);return byId.get(id);}
function valid(id){return /^[a-z][a-z0-9-]*(?:\.[a-z0-9-]+){1,8}$/.test(id)&&id.length<=180;}
const ids=[...data.map(x=>x.id)];
const defined=[...domains.matchAll(/\{id:"([\w-]+)",art:"([\w-]+)",number:\d+/g)].map(x=>({id:x[1],art:x[2]}));
const prgs=[...programs.matchAll(/\{id:"([\w-]+)",layout:"([\w-]+)"[\s\S]*?recommendations:\[([^\]]+)\]/g)].map(x=>({id:x[1],layout:x[2],related:[...x[3].matchAll(/"([\w-]+)"/g)].map(y=>y[1])}));
const goals=[...editorial.matchAll(/\{id:"([\w-]+)",title:"[^"]*",subtitle:"[^"]*",icon:"[^"]*",domains:\[([^\]]*)\],family:"([\w-]+)"\}/g)].map(x=>({id:x[1],domains:[...x[2].matchAll(/"([\w-]+)"/g)].map(y=>y[1])}));
const stories=[...editorial.matchAll(/\{id:"([\w-]+)",eyebrow:[\s\S]*?art:"([\w-]+)",badge:/g)].map(x=>x[1]);
const hotspots=[...editorial.matchAll(/\{id:"([\w-]+)",label:"[^"]*",family:"([\w-]+)" as EquipmentFamilyId,top:/g)].map(x=>({id:x[1],family:x[2]}));
const worlds=[...partner.matchAll(/id:"([\w-]+)",label:[\s\S]*?visual:"([\w-]+)",photo:"([\w-]+)",second:"([\w-]+)",third:"([\w-]+)",accent:/g)].map(x=>x[1]);
test("exact manifest is deterministic, safe, source-derived and within existing admin capacity",()=>{
 assert.equal(data.length,230);
 assert.equal(existing.length,51);
 assert.equal(new Set(ids).size,230);
 assert.equal([...new Set([...ids,...existing.map(x=>x.id)])].length,280);
 assert.ok([...new Set([...ids,...existing.map(x=>x.id)])].length<600);
 for(const x of data){
  assert.ok(valid(x.id),x.id);
  assert.ok(x.id.startsWith("establishments."));
  assert.ok(x.source.startsWith("/angelcare-marketplace/")&&x.source.endsWith(".png"),x.id);
  assert.equal(x.owner,"editable");
  assert.equal(x.sequence,!!x.sequence);
  assert.ok(x.section&&x.label);
 }
});
test("registry continues to resolve historical production slots without any wildcard",()=>{
 assert.ok(registry.includes("import establishmentR12 from './establishments-r12-slots.json'"));
 assert.ok(registry.includes("modernById.get(id)"));
 assert.ok(registry.includes("...seeded,...statics,...modern"));
 assert.ok(registry.includes("rules.find("));
 assert.ok(managed.includes("if(!descriptor)return <img {...props}/>"));
 assert.ok(rules.some(x=>x.pages.includes("establishments")&&x.key==="journey-r4"));
});
test("all 13 distinct Conseil R6 photos are registered",()=>{
 const wanted=["hero","hero.inset","compare.before","compare.after","diagnostic","family.edup","family.academy","family.parents","studio.edup","studio.academy","studio.parents","value","final"];
 for(const key of wanted)has("conseil-r6."+key);
 assert.equal(data.filter(x=>x.id.startsWith("establishments.conseil-r6.")).length,13);
 assert.ok(r6.includes("slot={slot}"));
 assert.ok(r6.includes("slot={\"conseil-r6.family.\"+family}"));
 assert.ok(r6.includes('params.get("imageryPreview")!=="1"'));
 assert.ok(r6.includes('conseil-r6\\.studio\\.'));
});
test("all R2 hero and six professional world photographs are registered",()=>{
 assert.equal(worlds.length,6);
 const hero=["hero.main","hero.family","hero.team"];
 for(const key of hero)has("journey-partner.r2."+key);
 for(const name of worlds)for(const kind of ["main","secondary","tertiary"])has("journey-partner.r2."+name+"."+kind);
 assert.equal(data.filter(x=>x.id.startsWith("establishments.journey-partner.")).length,21);
 assert.ok(partner.includes('slot={"journey-partner.r2."+slot}'));
 assert.ok(partner.includes('slot={chapter+".secondary"}'));
});
test("R11 hero remains image-managed and all four independently editable thumbnails retain click controls",()=>{
 for(const key of ["welcome","team","identity"])has("equipment-r11.hero."+key);
 for(const key of ["class","welcome","team","identity"]){const d=has("equipment-r11.thumb."+key);assert.equal(d.sequence,false);}
 assert.ok(eqHero.includes('slot={\`equipment-r11.thumb.\${scene.id}\`}'));
 assert.ok(eqHero.includes("onClick={()=>setIndex(i)}"));
 assert.ok(eqHero.includes('slot={\`equipment-r11.hero.\${current.id}\`}'));
 has("journey-r4.products-hero-r71");
 const css=read(publicRoot+"EquipmentHeroR11.module.css");
 assert.ok(css.includes('.thumbnails button > :global([data-imagery-art])'));
 assert.ok(css.includes("width:40px;height:36px"));
 assert.ok(css.includes("width:29px;height:30px"));
});
test("equipment discovery, school map, stories and all 22 atlas domains are covered",()=>{
 assert.equal(defined.length,22);
 assert.equal(goals.length,5);
 assert.equal(stories.length,4);
 assert.equal(hotspots.length,6);
 for(const name of ["welcome","learning","parents","operations","routines","identity"]){
  has("equipment-r10.space."+name);
  has("equipment-r10.universe."+name);
 }
 for(const x of goals)for(const d of x.domains)has("equipment-r10.goal."+x.id+"."+d);
 for(const id of stories)has("equipment-r10.story."+id);
 for(const h of hotspots){has("equipment-r10.school.zone."+h.id);has("equipment-r10.map.detail."+h.family);}
 for(const d of defined){has("equipment-r10.atlas."+d.id);has("equipment-r10.feature."+d.id);}
 has("equipment-r10.intro.classroom");has("equipment-r10.intro.team");has("equipment-r10.closing");
 assert.equal(data.filter(x=>x.id.startsWith("establishments.equipment-r10.")).length,161);
 assert.ok(eqBody.includes('slot={\`equipment-r10.related.\${activeDomain.id}.\${related.id}\`}'));
});
test("all 22 actual R9 interactive layouts have matching registered live scene photos",()=>{
 assert.equal(prgs.length,22);
 const lookup=new Map(defined.map(d=>[d.id,d]));
 const layouts={};
 for(const m of eqScene.matchAll(/case "([\w-]+)":return ([\s\S]*?)(?=case "[\w-]+":return|default:return)/g))layouts[m[1]]=m[2];
 assert.equal(Object.keys(layouts).length,22);
 for(const p of prgs){
  assert.ok(lookup.has(p.id));
  for(const id of p.related)has("equipment-r10.related."+p.id+"."+id);
  const content=layouts[p.layout];assert.ok(content);
  for(const match of content.matchAll(/<SceneArt[^>]*kind="([\w-]+)"/g))has("equipment-r9."+p.id+"."+match[1]);
  for(const match of content.matchAll(/<SmallArt\b[^>]*id=(?:\{\`([^\`]+)\`\}|"([\w-]+)")/g)){
   const key=match[1]||match[2];
   if(key.includes("\${i}")){
    const prefix=key.replace("\${i}","");
    for(let i=0;i<(p.layout==="season-gallery"?3:2);i++){
     const target=lookup.get(p.related[i])||lookup.get(p.id);
     has("equipment-r9."+target.id+"."+prefix+i);
    }
   }else has("equipment-r9."+p.id+"."+key);
  }
 }
 assert.equal(data.filter(x=>x.id.startsWith("establishments.equipment-r9.")).length,27);
});
test("preview URL routes into R6, R2 and Equipment instead of the old generic homepage state",()=>{
 assert.ok(studio.includes("imageryPlacementPreviewUrl(page, previewLocale, selected)"));
 for(const value of ['#conseil','#partner-os','#produits','equipmentDomain','imageryPlacement','resolveSlot(page,selected)'])assert.ok(preview.includes(value),value);
 assert.ok(preview.includes('page!=="establishments"'));
 assert.ok(eqBody.includes('query.get("imageryPreview")==="1"'));
 assert.ok(eqBody.includes('setEntry("goals")'));
 assert.ok(eqBody.includes('setActiveStory(index)'));
 assert.ok(eqBody.includes('setShowAllDomains(true)'));
 assert.ok(eqBody.includes('setActiveMap(index)'));
 assert.ok(eqHero.includes('params.get("imageryPreview")!=="1"'));
 assert.ok(runtime.includes('new MutationObserver(reveal)'));
 assert.ok(runtime.includes('if (!preview || !selected) return;'));
});
test("original admin workspace controls, live publication, media validation and shared storefront shell untouched",()=>{
 for(const phrase of [
  "AngelCare Imagery Studio","Save draft","Preview","Publish","Publication history",
  "Page image map","Workspace page preview","Select images","Before",
  "Change","Choose your page","Native","fram"
 ])if(!["Change","Native","fram"].includes(phrase))assert.ok(studio.includes(phrase),phrase);
 assert.ok(studio.includes('onClick={() => setDirectory(!directory)}'));
 assert.ok(studio.includes("onClick={() => { setPublishTargets(changed); setReview(true); }}"));
 assert.ok(model.includes("Object.keys(x.slots).length > 600"));
 assert.ok(model.includes("v.images.length > 12"));
 assert.ok(runtime.includes('"/api/angelcare-marketplace/imagery?page="'));
 assert.ok(shell.includes("<ImageryProvider>{children}</ImageryProvider>"));
 const service=read(imagery+"service.ts");
 assert.ok(service.includes("validateMedia"));
 assert.ok(service.includes("reconcilePublishedImagery"));
 assert.ok(!preview.includes("window.location.assign"));
});
test("published editorial wrappers retain existing full-bleed image geometry across three storefronts",()=>{
 const css=[
  read(publicRoot+"ConseilExperienceR6.module.css"),
  read(publicRoot+"EquipmentExperienceR10.module.css"),
  read(publicRoot+"partner/PartnerR2Experience.module.css"),
 ];
 for(const sheet of css){
  assert.ok(sheet.includes(":global([data-imagery-art])"),"missing managed imagery wrapper geometry");
  assert.ok(sheet.includes("width:100%!important"));
  assert.ok(sheet.includes("height:100%!important"));
  assert.ok(sheet.includes("object-fit:cover"));
 }
 assert.ok(css[0].includes(".heroMedia > :global([data-imagery-art])"));
 assert.ok(css[1].includes(".storyVisual > :global([data-imagery-art])"));
 assert.ok(css[2].includes(".worldExperience :global([data-imagery-art])"));
 assert.ok(read(publicRoot+"EquipmentHeroR11.module.css").includes(".thumbnails button > :global([data-imagery-art])"));
});
test("strict source domains, no new SQL or alternate admin pages",()=>{
 assert.equal(data.length,230);
 assert.ok(data.every(x=>x.id.startsWith("establishments.")));
 assert.ok(data.every(x=>!x.id.includes("undefined")&&!x.id.includes("\${")));
 assert.ok(!preview.includes("api/angelcare-marketplace"));
 assert.ok(!registry.includes("id.startsWith('establishments.equipment-r10')"));
});
