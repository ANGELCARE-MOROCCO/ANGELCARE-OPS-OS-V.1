import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
import { nextPlayableIndex, reconcilePublishedImagery } from "../../angelcare-marketplace/marketplace-imagery/public-runtime-contract.ts";

const A="11111111-1111-4111-8111-111111111111";
const B="22222222-2222-4222-8222-222222222222";
const C="33333333-3333-4333-8333-333333333333";
const D="44444444-4444-4444-8444-444444444444";
const url=(id)=>"/api/angelcare-marketplace/media/"+id+"/asset.png";
const valid=(src,id)=>src===url(id);
const media=(id,overrides={})=>({
 id,status:"active",mime_type:"image/png",public_url:url(id),
 rights_expires_at:null,metadata:{status:"ready"},...overrides
});
const scene=(id,overrides={})=>({
 id,assetId:id,src:url(id),mobile:"",mobileAssetId:"",enabled:true,
 alt:"",focal:{x:50,y:50},mobileFocal:{x:50,y:50},
 fit:"cover",zoom:1,mobileZoom:1,duration:0,...overrides
});
const placement=(images)=>({mode:"slideshow",images,hidden:false,
 autoplay:true,loop:true,interval:3000,transition:"fade",
 speed:400,controls:true,slowZoom:false,badgesEnabled:false,badges:[]});
const careSlot = "home.visual.living-commerce-homepage.2.care";
const config=(images)=>({version:1,slots:{[careSlot]:placement(images)}});
test("one and twelve images are retained without mutation or reordering",()=>{
 for(const n of [1,12]){
  const originals=Array.from({length:n},(_,i)=>scene(
   i<4?[A,B,C,D][i]:"55555555-5555-4555-8555-"+String(i).padStart(12,"0")));
  const records=originals.map(s=>media(s.assetId));
  const saved=config(originals);
  const snapshot=JSON.stringify(saved);
  const resolved=reconcilePublishedImagery(saved,records,valid);
  assert.equal(resolved.rejected,0);
  assert.equal(resolved.config.slots["home.visual.living-commerce-homepage.2.care"].images.length,n);
  assert.deepEqual(resolved.config.slots["home.visual.living-commerce-homepage.2.care"].images.map(i=>i.id),originals.map(i=>i.id));
  assert.equal(JSON.stringify(saved),snapshot);
 }
});
test("expired, failed, non-image and missing assets are safely excluded",()=>{
 const saved=config([scene(A),scene(B),scene(C),scene(D)]);
 const records=[media(A),media(B,{rights_expires_at:"2020-01-01T00:00:00Z"}),
  media(C,{metadata:{status:"failed"}}),media(D,{mime_type:"application/pdf"})];
 const r=reconcilePublishedImagery(saved,records,valid,Date.parse("2026-11-10T00:00:00Z"));
 assert.equal(r.rejected,3);
 assert.deepEqual(r.config.slots["home.visual.living-commerce-homepage.2.care"].images.map(i=>i.assetId),[A]);
});
test("a missing optional mobile variant falls back to authorized desktop without removing the scene",()=>{
 const saved=config([scene(A,{mobile:url(B),mobileAssetId:B})]);
 const r=reconcilePublishedImagery(saved,[media(A)],valid);
 const image=r.config.slots["home.visual.living-commerce-homepage.2.care"].images[0];
 assert.equal(image.src,url(A));
 assert.equal(image.mobile,"");
 assert.equal(image.mobileAssetId,"");
 assert.equal(r.mobileFallbacks,1);
});
test("stale saved URLs resolve to the current authorized native URL by UUID",()=>{
 const saved=config([scene(A,{src:"https://old.example/hero.png"})]);
 const r=reconcilePublishedImagery(saved,[media(A)],valid);
 assert.equal(r.config.slots["home.visual.living-commerce-homepage.2.care"].images[0].src,url(A));
 assert.equal(r.refreshed,1);
 assert.equal(saved.slots["home.visual.living-commerce-homepage.2.care"].images[0].src,"https://old.example/hero.png");
});
test("invalid new URLs and spoofed native IDs never reach the browser",()=>{
 const saved=config([scene(A),scene(B)]);
 const r=reconcilePublishedImagery(saved,[media(A,{public_url:"/api/admin/leak.png"}),media(B,{id:A})],valid);
 assert.equal(r.rejected,2);
 assert.equal(Object.keys(r.config.slots).length,0);
});
test("failed slides are skipped, all-failed never loops, optional nonloop ends",()=>{
 const frames=[{id:A},{id:B},{id:C},{id:D}];
 assert.equal(nextPlayableIndex(frames,0,new Set([B,C])),3);
 assert.equal(nextPlayableIndex(frames,3,new Set([B,C])),0);
 assert.equal(nextPlayableIndex(frames,2,new Set([A,B]),-1,false),null);
 assert.equal(nextPlayableIndex(frames,0,new Set([B,C,D])),0);
 assert.equal(nextPlayableIndex(frames,0,new Set([A,B,C,D])),null);
 assert.equal(nextPlayableIndex(frames,3,new Set(),1,false),null);
 assert.equal(nextPlayableIndex(frames,0,new Set([B,C,D]),1,false),null);
});
test("real runtime retains a prior decoded frame, decouples original failure and exposes a fallback",()=>{
 const root=new URL("../../angelcare-marketplace/marketplace-imagery/",import.meta.url);
 const runtime=readFileSync(new URL("Runtime.tsx",root),"utf8");
 const service=readFileSync(new URL("service.ts",root),"utf8");
 const css=readFileSync(new URL("imagery.module.css",root),"utf8");
 const homepage=readFileSync(new URL("../homepage-living-marketplace/immersive/LivingCommerceHomepage.tsx",root),"utf8");
 assert.match(runtime,/unavailable\.current\.add\(image\.id\)/);
 assert.match(runtime,/const lastGood = readyRef\.current/);
 assert.match(runtime,/if \(!images\.length\) props\.onError\?\.\(event\)/);
 assert.match(runtime,/nextPlayableIndex\(/);
 assert.match(runtime,/className=\{s\.unavailable\}/);
 assert.match(css,/\.unavailable\s*\{/);
 assert.match(service,/reconcilePublishedImagery\(/);
 assert.match(homepage,/nativeHeroRotates/);
});


test("the real care promotion is seeded as a slideshow-capable production placement",()=>{
 const root=new URL("../../angelcare-marketplace/marketplace-imagery/",import.meta.url);
 const seeds=require(new URL("slot-seeds.json",root));
 const rules=require(new URL("slot-rules.json",root));
 const live=seeds.find(s=>s.id===careSlot);
 assert.ok(live,"the care placement must be registered, not invented by tests");
 assert.equal(live.sequence,true);
 assert.equal(live.source,"/angelcare-marketplace/families-world-r2/care.jpg");
 assert.ok(rules.some(r=>r.key==="visual.living-commerce-homepage.2" &&
    r.pages.includes("home") && r.sequence===true && r.dynamic===true));
});
test("public delivery reports precisely how many images reach each real placement",()=>{
 const published=config([scene(A),scene(B),scene(C)]);
 const result=reconcilePublishedImagery(published,[media(A),media(C)],valid);
 assert.deepEqual(result.slotCounts[careSlot],{
  published:3, enabledPublished:3, delivered:2,
  enabledDelivered:2,rejected:1,mobileFallbacks:0
 });
});
test("P0 wrappers preserve managed images and linked promotions have outside-link controls",()=>{
 const root=new URL("../../angelcare-marketplace/",import.meta.url);
 for(const f of ["homepage-living-marketplace/immersive/ExperienceUI.tsx","storefront-immersive/ExperienceUI.tsx"]){
  const wrapper=readFileSync(new URL(f,root),"utf8");
  assert.match(wrapper,/const managed =/);
  assert.match(wrapper,/\(!failed \|\| managed\)/);
 }
 const home=readFileSync(new URL("homepage-living-marketplace/immersive/LivingCommerceHomepage.tsx",root),"utf8");
 assert.match(home,/data-imagery-promotion=\{slot\}/);
 assert.match(home,/angelcare-imagery-navigate/);
 const runtime=readFileSync(new URL("marketplace-imagery/Runtime.tsx",root),"utf8");
 assert.match(runtime,/data-imagery-failed=\{failedCount\}/);
 assert.match(runtime,/data-imagery-delivery-status=\{deliveryStatus\}/);
 assert.match(runtime,/window\.addEventListener\("angelcare-imagery-navigate"/);
 assert.match(runtime,/retrying/);
 const shell=readFileSync(new URL("public-universe/components/GlobalPublicShell.tsx",root),"utf8");
 assert.match(shell,/data-imagery-homepage-renderer/);
});
