import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const root="angelcare-marketplace/";
const manifest=JSON.parse(read(root+"marketplace-imagery/hospitality-r2-slots.json"));
const key=(s)=>s.id.replace(/^hospitality\.hospitality-r2\./,"");
const byKey=new Map(manifest.map(s=>[key(s),s]));
const entry=read(root+"business-worlds/HospitalitySignatureR2.tsx");
const storefront=read(root+"business-worlds/HospitalityExecutiveR3.tsx");
const content=read(root+"business-worlds/hospitality-r2-content.ts");
const registry=read(root+"marketplace-imagery/registry.ts");
const studio=read(root+"marketplace-imagery/Studio.tsx");
const runtime=read(root+"marketplace-imagery/Runtime.tsx");
const managed=read(root+"marketplace-imagery/ManagedImage.tsx");
const preview=read(root+"marketplace-imagery/establishments-r12-preview.ts");
const commerce=read(root+"business-worlds/Commerce.tsx");
const assigned=read(root+"business-worlds/AssignedCommerce.tsx");
const css=read(root+"business-worlds/hospitality-executive-r3.module.css");

const active=[
 "hero.main","hero.inset.kids","hero.inset.family",
 "comparison.signature",
 ..."kids guest concierge seasons".split(" ").map(x=>"world."+x),
 ..."city resort season".split(" ").map(x=>"property."+x),
 ..."3-6 7-12 13-16".split(" ").map(x=>"age."+x),
 ..."discovery nature animation workshops play environment celebration kidsclub".split(" ").map(x=>"atlas."+x),
 ..."arrival discover create parents departure".split(" ").map(x=>"day."+x),
 "operations.main","trust.family",
 ..."city resort season".split(" ").map(x=>"model."+x)
];

test("Hospitality has exact, stable, fully editable image slots and no anonymous wildcards",()=>{
 assert.equal(manifest.length,33);
 assert.equal(new Set(manifest.map(s=>s.id)).size,33);
 assert.equal(active.length,32);
 assert.deepEqual([...byKey.keys()].filter(k=>!active.includes(k)),["comparison.standard"]);
 for(const k of active){const slot=byKey.get(k);assert.ok(slot,"Missing active slot: "+k);
  assert.equal(slot.id,"hospitality.hospitality-r2."+k);
  assert.equal(slot.owner,"editable");
  assert.equal(slot.sequence,true);
  assert.ok(slot.section&&slot.label,"Missing human-readable chapter or label for "+k);
  assert.match(slot.source,/^\/angelcare-marketplace\/storefront-imagery-r3\/hospitality\/[a-z0-9-]+\.webp$/);
 }
 assert.match(byKey.get("comparison.standard").section,/Archived/);
 assert.match(registry,/hospitalityById/);
 assert.match(registry,/page==='hospitality'\?hospitalityR2 as Slot\[\]/);
});

test("Every new editorial photo is a real ManagedImage with exact per-scene slot, never a bare DOM image or CSS URL",()=>{
 assert.match(entry,/<ManagedImage slot=\{"hospitality-r2\."\+slot\}/);
 assert.match(storefront,/<ManagedImage slot=\{"hospitality-r2\."\+slot\}/);
 assert.ok(entry.includes('<Art name="hospitality" slot="hero.main" priority/>'));
 assert.ok(entry.includes('<Art name="games" slot="hero.inset.kids"/>'));
 assert.ok(entry.includes('<Art name="family" slot="hero.inset.family"/>'));
 for(const expression of [
  'slot="comparison.signature"',
  'slot={"world."+selectedWorld.key}',
  'slot={"day."+selectedMoment.id}',
  'slot={"property."+selectedProperty.id}',
  'slot={"age."+v.id}',
  'slot={"atlas."+v.id}',
  'slot="operations.main"',
  'slot={"model."+v.id}',
  'slot="trust.family"'
 ])assert.ok(storefront.includes(expression),"Unmanaged R3 imagery scene: "+expression);
 assert.ok(!/<img\b|backgroundImage\s*:|srcSet\s*=/.test(storefront),"An unmanaged image was introduced");
 assert.ok(!/url\s*\(/i.test(css),"Unexpected hardcoded CSS image");
 assert.ok(managed.includes("resolveSlot(page,key)"));
 assert.ok(managed.includes("return <Artwork {...props} slot={key}"));
 assert.ok(entry.includes('mode==="native"?<>'),"Approved native hero control changed");
});

test("All dynamic experiences are independently addressable in existing Imagery Studio preview",()=>{
 assert.match(preview,/page==="hospitality"&&resolveSlot\(page,selected\)/);
 assert.match(preview,/params\.set\("imageryPlacement",selected\)/);
 for(const id of ["kids","guest","concierge","seasons"])assert.ok(content.includes('key:"'+id+'"'));
 for(const id of ["city","resort","season","3-6","7-12","13-16","arrival","discover","create","parents","departure"])assert.ok(content.includes('id:"'+id+'"'));
 assert.match(storefront,/hospitality\\\.hospitality-r2\\\.world/,"Direct world preview case missing");
 assert.match(storefront,/H\.worldCollection\.findIndex/);
 assert.match(storefront,/setWorld\(i\)/);
 for(const state of ["property","age","day"]){assert.ok(storefront.includes("hospitality\\.hospitality-r2\\."+state),"Missing "+state+" preview selection");}
 assert.match(storefront,/params\.get\("imageryPreview"\)!=="1"/);
 assert.match(runtime,/data-imagery-slot/);
 assert.match(runtime,/MutationObserver\(reveal\)/);
});

test("Studio retains native vault pickers, all 12 slides, mobile framing, badges, draft and publish rights",()=>{
 for(const token of ['NativeImagePicker','angelcare_imagery_save','angelcare_imagery_publish','mobileFocal','badgesEnabled','Math.max(1, 12 - images.length)','previewLocale','imageryPlacementPreviewUrl','pageSlots(page)'])assert.ok(studio.includes(token),token);
 assert.match(studio,/12 - images\.length/);
 assert.match(studio,/descriptor\?\.sequence \? 12 : 1/);
 assert.match(runtime,/setting\?\.mode !== "slideshow"/);
 assert.match(runtime,/prefers-reduced-motion/);
 assert.match(runtime,/nextPlayableIndex/);
 assert.match(runtime,/ctx\.config/);
});

test("Native commerce images remain catalogue-owned and published template authority stays protected",()=>{
 assert.match(commerce,/Photo src=\{item\.media_url\} alt=\{item\.name\} contain/);
 assert.ok(!commerce.includes('ManagedImage slot={"hospitality-r2."'));
 assert.match(assigned,/HospitalitySignatureR2 mode="published"/);
 assert.match(entry,/mode==="native"\?<>/);
 assert.match(storefront,/mode==="native"\?<Enquiry/);
});
