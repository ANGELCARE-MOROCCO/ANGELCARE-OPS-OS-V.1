import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const root="angelcare-marketplace/";
const world=root+"business-worlds/";
const component=read(world+"HospitalitySignatureR2.tsx");
const copy=read(world+"hospitality-r2-content.ts");
const css=read(world+"hospitality-r2.module.css");
const legacy=read(world+"Hospitality.tsx");
const assigned=read(world+"AssignedCommerce.tsx");
const business=read(world+"BusinessWorlds.tsx");
const commerce=read(world+"Commerce.tsx");
const merch=read(world+"merchandising.ts");
const repository=read(world+"repository.ts");
const route=read("app/angelcare-marketplace/[locale]/hospitality/page.tsx");
const storefront=read(root+"catalog-discovery/components/Storefront.tsx");
const slots=JSON.parse(read(root+"marketplace-imagery/hospitality-r2-slots.json"));
const registry=read(root+"marketplace-imagery/registry.ts");
const preview=read(root+"marketplace-imagery/establishments-r12-preview.ts");
const model=read(root+"marketplace-imagery/model.ts");
const seeds=JSON.parse(read(root+"marketplace-imagery/slot-seeds.json"));
const id=x=>"hospitality.hospitality-r2."+x;
test("all 14 visually distinct chapters mount with premium native journey and genuine B2B conversion",()=>{
 assert.equal([...component.matchAll(/data-hospitality-chapter="(\d+)"/g)].length,14);
 assert.deepEqual([...component.matchAll(/data-hospitality-chapter="(\d+)"/g)].map(m=>m[1]),Array.from({length:14},(_,i)=>String(i+1).padStart(2,"0")));
 for(const value of ["heroScenes","compareGrid","benefitGrid","signatureGrid","propertyFrame","ageRail","atlasGrid","dayStage","operationGrid","economicsGrid","trustVisual","stepsGrid","world-offers","world-enquiry"])assert.ok(component.includes(value)||css.includes("."+value),value);
 assert.ok(legacy.includes('export function Hospitality(){return <HospitalitySignatureR2 mode="native"/>;}'));
 assert.ok(business.includes("hospitality: Hospitality"));
 assert.ok(component.includes('sourceRoute={'));
 assert.ok(component.includes('<Enquiry world="hospitality"'));
 assert.ok(component.includes('brief={summary.slice(0,1900)}'));
});
test("published Studio assignment retains its authored template and the same R2 executive experience",()=>{
 assert.ok(assigned.includes('experience.key === "hospitality" ? <HospitalitySignatureR2 mode="published"/> : null'));
 assert.ok(assigned.includes("<CommercialOpening />"));
 assert.ok(assigned.includes("<CommerceCatalogue />"));
 assert.ok(assigned.includes("<ProjectSummary />"));
 assert.ok(storefront.includes("StudioPublishedDataRenderer data={world.data}"));
 assert.ok(storefront.includes("<AssignedBusinessCommerce experience={experience}"));
 assert.ok(route.includes("publicVerticalSnapshot('hospitality')"));
 assert.ok(route.includes("storefrontExperience({locale,key:'hospitality',territoryCode})"));
});
test("canonical atomic membership and professional commerce authorities are untouched",()=>{
 for(const fragment of [
   'hospitality: ["hospitality-kids-programme"]',
   'if (categories.includes(world)) return "canonical_membership"',
   '["hotel", "resort", "hospitality"]',
   '"hotel-travel-childcare"',
   '"hospitality-kids-programme"',
   '"event-venue-programme"',
   '"custom-managed-solution"',
 ])assert.ok(merch.includes(fragment),fragment);
 assert.ok(repository.includes('angelcare_marketplace_catalog_item_categories'));
 assert.ok(repository.includes('angelcare_marketplace_catalog_discovery_v'));
 assert.ok(repository.includes('eq("status", "published")'));
 for(const name of ["CommerceCatalogue","BusinessOfferCard","SelectionFeedback","CommercialOpening","ProjectSummary"])assert.ok(commerce.includes("export function "+name));
 assert.ok(commerce.includes('businessItemHref(item, locale, experience.territoryCode)'));
 assert.ok(commerce.includes('nativeAction(item, locale, experience.territoryCode)'));
 assert.ok(commerce.includes('selections.select(item.id, "compare")'));
});
test("30 exact Imagery Studio descriptors, all original media fallbacks and existing seeds survive",()=>{
 assert.equal(slots.length,30);
 assert.equal(new Set(slots.map(x=>x.id)).size,slots.length);
 for(const x of slots){
  assert.ok(x.id.startsWith("hospitality.hospitality-r2."),x.id);
  assert.ok(/^\/angelcare-marketplace\/storefront-imagery-r3\/hospitality\/[\w-]+\.webp$/.test(x.source),x.id);
  assert.equal(x.owner,"editable");
  assert.equal(x.sequence,true);
  assert.ok(x.section.startsWith("Hospitality Signature R2"));
 }
 for(const k of ["hero.main","hero.inset.kids","hero.inset.family","comparison.standard","comparison.signature","world.kids","world.guest","world.concierge","world.seasons","property.city","property.resort","property.season","age.3-6","age.7-12","age.13-16","operations.main","trust.family"]) assert.ok(slots.some(x=>x.id===id(k)),k);
 assert.equal(slots.filter(x=>x.id.includes(".atlas.")).length,8);
 assert.equal(slots.filter(x=>x.id.includes(".day.")).length,5);
 assert.ok(registry.includes("hospitalityR2 from './hospitality-r2-slots.json'"));
 assert.ok(registry.includes("hospitalityById.get(id)"));
 assert.ok(registry.includes("page==='hospitality'?hospitalityR2 as Slot[]"));
 assert.ok(seeds.filter(x=>x.id.startsWith("hospitality.")).length>=15);
 assert.ok(model.includes("Object.keys(x.slots).length > 600"));
});
test("managed slideshow controls are never nested within interactive selection buttons",()=>{
 assert.ok(component.includes('<article key={v.id} className={s.ageCard}'));
 assert.ok(component.includes('<article key={v.id} data-selected={concepts.includes(v.id)} className={s.atlasCard}>'));
 assert.ok(!component.includes('<button type="button" key={v.id} className={s.ageCard}'));
 assert.ok(!component.includes('<button type="button" key={v.id} data-selected={concepts.includes(v.id)} className={s.atlasCard}'));
 assert.ok(css.includes(":global([data-imagery-art])>img"));
 assert.ok(css.includes("object-fit:cover"));
 assert.ok(css.includes("@media(max-width:600px)"));
 assert.ok(css.includes("@media(prefers-reduced-motion:reduce)"));
});
test("exact conditional image selection only runs in the existing admin iframe preview",()=>{
 assert.ok(preview.includes('page==="hospitality"&&resolveSlot(page,selected)'));
 assert.ok(preview.includes('params.set("imageryPlacement",selected)'));
 assert.ok(component.includes('params.get("imageryPreview")!=="1"'));
 for(const v of ["property","age","day"])assert.ok(component.includes('hospitality-r2\\.'+v+'\\.'),v);
 assert.ok(component.includes("setProperty(index)"));
 assert.ok(component.includes("setAge(index)"));
 assert.ok(component.includes("setMoment(index)"));
});
test("source brochure's age bands, eight creative concepts, six steps and multilingual parity are implemented",()=>{
 assert.ok(copy.includes('id:"3-6"'));
 assert.ok(copy.includes('id:"7-12"'));
 assert.ok(copy.includes('id:"13-16"'));
 assert.equal([...copy.matchAll(/id:"(discovery|nature|animation|workshops|play|environment|celebration|kidsclub)"/g)].length,8);
 assert.equal([...copy.matchAll(/title:h\("0[1-6] · /g)].length,6);
 assert.ok(copy.includes('export const h=(fr:string,en:string,ar:string)'));
 assert.ok(component.includes('dir={locale==="ar"?"rtl":"ltr"}'));
 assert.ok(css.includes(".world[dir=rtl]"));
 for(const s of ["h(\"Transformez votre hôtel","h(\"Une expérience plus riche","h(\"Des standards visibles","h(\"Comparez, sélectionnez"]){
  assert.ok(copy.includes(s),s);
 }
});
test("commercial calculator is explicitly assumption-based and cannot invent ROI or rates",()=>{
 assert.ok(component.includes('days*families'));
 assert.ok(copy.includes("Aucun tarif, revenu, taux d'occupation"));
 assert.ok(copy.includes("No pricing, revenue, occupancy uplift"));
 assert.ok(copy.includes("No partner logo or outcome claim without verification"));
 assert.ok(component.includes('max={90}'));
 assert.ok(component.includes('max={60}'));
});
