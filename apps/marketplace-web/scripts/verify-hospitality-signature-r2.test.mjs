import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const root="angelcare-marketplace/",world=root+"business-worlds/";
const entry=read(world+"HospitalitySignatureR2.tsx"),executive=read(world+"HospitalityExecutiveR3.tsx"),copy=read(world+"hospitality-r2-content.ts"),css=read(world+"hospitality-executive-r3.module.css"),legacy=read(world+"Hospitality.tsx"),assigned=read(world+"AssignedCommerce.tsx"),business=read(world+"BusinessWorlds.tsx"),commerce=read(world+"Commerce.tsx"),merch=read(world+"merchandising.ts"),repository=read(world+"repository.ts"),route=read("app/angelcare-marketplace/[locale]/hospitality/page.tsx"),storefront=read(root+"catalog-discovery/components/Storefront.tsx"),slots=JSON.parse(read(root+"marketplace-imagery/hospitality-r2-slots.json")),registry=read(root+"marketplace-imagery/registry.ts"),preview=read(root+"marketplace-imagery/establishments-r12-preview.ts"),model=read(root+"marketplace-imagery/model.ts"),seeds=JSON.parse(read(root+"marketplace-imagery/slot-seeds.json")),id=x=>"hospitality.hospitality-r2."+x;
test("Turbopack client directive and original approved hotel hero are protected",()=>{
 assert.ok(legacy.startsWith('"use client";'));
 assert.ok(entry.startsWith('"use client";'));
 assert.ok(executive.startsWith('"use client";'));
 const start=entry.indexOf('   <section className={s.hero} id="hospitality-opening"'),end=entry.indexOf("\n   </section>",start);
 assert.ok(start>0&&end>start);
 const hero=entry.slice(start,end+14);
 let hash=2166136261;for(const ch of hero){hash^=ch.charCodeAt(0);hash=Math.imul(hash,16777619);}
 assert.equal(hash>>>0,3187037673);
 assert.equal(hero.length,966);
 assert.ok(entry.includes('<HospitalityExecutiveR3 mode={mode}/>'));
});
test("the new executive R3 replaces legacy below-hero composition with full native conversion",()=>{
 for(const name of ["value","worlds","journey","property","programmes","atlas","operations","showroom","models","planner","trust","explorer","conversion"])assert.ok(executive.includes('className={s.'+name+'}'),name);
 assert.ok(legacy.includes('export function Hospitality(){return <HospitalitySignatureR2 mode="native"/>;}'));
 assert.ok(business.includes("hospitality: Hospitality"));
 assert.ok(executive.includes('<Enquiry world="hospitality"'));
 assert.ok(executive.includes("brief={summary.slice(0,1900)}"));
 assert.ok(executive.includes("<CommerceCatalogue/>"));
 assert.ok(!executive.includes("<CommercialOpening"));
 assert.ok(!executive.includes("<CommerceCollections"));
});
test("published Studio route remains authoritative with exactly one new hero-free commercial experience",()=>{
 assert.ok(assigned.includes('experience.key === "hospitality" ? <><HospitalitySignatureR2 mode="published"/><AssignedEnquiry /></>'));
 assert.ok(entry.includes('{mode==="native"?<>'));
 assert.ok(!assigned.includes('experience.key === "hospitality" ? <HospitalitySignatureR2 mode="published"/> : null'));
 assert.ok(storefront.includes("StudioPublishedDataRenderer data={world.data}"));
 assert.ok(storefront.includes("<AssignedBusinessCommerce experience={experience}"));
 assert.ok(route.includes("publicVerticalSnapshot('hospitality')"));
 assert.ok(route.includes("storefrontExperience({locale,key:'hospitality',territoryCode})"));
 assert.ok(assigned.includes("brief={brief}"));
});
test("all six commercial selections are preserved in the real enquiry WorldFrame",()=>{
 for(const dimension of ["property-type","hospitality-programmes","hospitality-experiences","ages","hospitality-guest-journey","hospitality-planning"])assert.ok(executive.includes('setContext("'+dimension+'"'),dimension);
 const shared=read(world+"Shared.tsx");
 assert.ok(shared.includes("Object.values(context)"));
 assert.ok(shared.includes("prioritySummary("));
 assert.ok(!executive.includes("setConcepts(prev=>{"));
});
test("all native atomic business category, pricing and action identities remain unchanged",()=>{
 for(const value of ['hospitality: ["hospitality-kids-programme"]','if (categories.includes(world)) return "canonical_membership"','["hotel", "resort", "hospitality"]','"hotel-travel-childcare"','"hospitality-kids-programme"','"event-venue-programme"','"custom-managed-solution"'])assert.ok(merch.includes(value),value);
 assert.ok(repository.includes("angelcare_marketplace_catalog_item_categories"));
 assert.ok(repository.includes("angelcare_marketplace_catalog_discovery_v"));
 assert.ok(repository.includes('eq("status", "published")'));
 for(const fn of ["CommerceCatalogue","BusinessOfferCard","SelectionFeedback","CommercialOpening","ProjectSummary"])assert.ok(commerce.includes("export function "+fn));
 for(const v of ['businessItemHref(item, locale, experience.territoryCode)','nativeAction(item, locale, experience.territoryCode)','selections.select(item.id, "compare")'])assert.ok(commerce.includes(v));
 assert.ok(executive.includes('segmentItems(experience.items'));
 assert.ok(executive.includes('projection(item)?.fields.slice(0,2)'));
});
test("all original 30 hospitality imagery placements and 3 new operating-model images remain native Studio-managed",()=>{
 assert.equal(slots.length,33);
 assert.equal(new Set(slots.map(x=>x.id)).size,33);
 for(const item of slots){assert.ok(item.id.startsWith("hospitality.hospitality-r2."));assert.ok(/^\/angelcare-marketplace\/storefront-imagery-r3\/hospitality\/[\w-]+\.webp$/.test(item.source));assert.equal(item.owner,"editable");assert.equal(item.sequence,true);assert.ok(item.section.startsWith("Hospitality Signature R2")||item.section.startsWith("Hospitality Executive"));}
 for(const k of ["hero.main","hero.inset.kids","hero.inset.family","comparison.standard","comparison.signature","world.kids","world.guest","world.concierge","world.seasons","property.city","property.resort","property.season","age.3-6","age.7-12","age.13-16","operations.main","trust.family","model.city","model.resort","model.season"])assert.ok(slots.some(x=>x.id===id(k)),k);
 assert.equal(slots.filter(x=>x.id.includes(".atlas.")).length,8);
 assert.equal(slots.filter(x=>x.id.includes(".day.")).length,5);
 assert.ok(registry.includes("hospitalityR2 from './hospitality-r2-slots.json'"));
 assert.ok(registry.includes("hospitalityById.get(id)"));
 assert.ok(seeds.filter(x=>x.id.startsWith("hospitality.")).length>=15);
 assert.ok(model.includes("Object.keys(x.slots).length > 600"));
});
test("image slideshows are outside interactive buttons and previews remain private to Studio",()=>{
 assert.ok(executive.includes('<article key={v.id} data-picked={concepts.includes(v.id)}>'));
 assert.ok(executive.includes('<article key={v.id} data-active={age===i}>'));
 assert.ok(!executive.includes('<button type="button" key={v.id} className={s.ageCard}'));
 assert.ok(css.includes(":global([data-imagery-art])"));
 assert.ok(css.includes("object-fit:cover"));
 assert.ok(css.includes("@media(max-width:520px)"));
 assert.ok(css.includes("@media(prefers-reduced-motion:reduce)"));
 assert.ok(preview.includes('page==="hospitality"&&resolveSlot(page,selected)'));
 assert.ok(executive.includes('params.get("imageryPreview")!=="1"'));
 for(const key of ["property","age","day"])assert.ok(executive.includes("hospitality-r2\\."+key+"\\."),key);
});
test("the proposal's exact age bands, eight concepts, six operating steps, all three languages and non-financial scenario remain",()=>{
 for(const age of ['id:"3-6"','id:"7-12"','id:"13-16"'])assert.ok(copy.includes(age));
 assert.equal([...copy.matchAll(/id:"(discovery|nature|animation|workshops|play|environment|celebration|kidsclub)"/g)].length,8);
 assert.equal([...copy.split(" steps:[")[1].matchAll(/title:h\("0[1-6] · /g)].length,6);
 assert.ok(copy.includes('export const h=(fr:string,en:string,ar:string)'));
 assert.ok(executive.includes('dir={locale==="ar"?"rtl":"ltr"}'));
 assert.ok(executive.includes("days*families"));
 assert.ok(executive.includes("max={90}"));
 assert.ok(executive.includes("max={60}"));
 assert.ok(executive.includes("Estimate")||executive.includes("estimate"));
 assert.ok(!executive.includes("ROI"));
});
