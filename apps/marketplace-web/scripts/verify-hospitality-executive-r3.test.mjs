import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const load=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const base="angelcare-marketplace/business-worlds/";
const entry=load(base+"HospitalitySignatureR2.tsx"),body=load(base+"HospitalityExecutiveR3.tsx"),css=load(base+"hospitality-executive-r3.module.css"),commerce=load(base+"Commerce.tsx"),commerceCss=load(base+"commerce.module.css"),assigned=load(base+"AssignedCommerce.tsx"),merch=load(base+"merchandising.ts"),repository=load(base+"repository.ts"),enquiry=load(base+"Enquiry.tsx");
const previous=JSON.parse(load("angelcare-marketplace/marketplace-imagery/hospitality-r2-slots.json"));
const pub=load("angelcare-marketplace/catalog-discovery/components/Storefront.tsx");
test("approved hero source is unchanged byte-for-byte using original stable checksum",()=>{
 const start=entry.indexOf('   <section className={s.hero} id="hospitality-opening"');
 const end=entry.indexOf("\n   </section>",start);
 assert.ok(start>=0&&end>start);
 const hero=entry.slice(start,end+14);
 let hash=2166136261;
 for(let i=0;i<hero.length;i++){hash^=hero.charCodeAt(i);hash=Math.imul(hash,16777619);}
 assert.equal(hash>>>0,3187037673);
 assert.equal(hero.length,966);
 assert.ok(entry.includes('{mode==="native"?<>'));
 assert.ok(entry.includes('<HospitalityExecutiveR3 mode={mode}/>'));
});
test("all twelve rich post-hero B2B chapters render without duplicate native or published catalogues",()=>{
 for(const section of ["value","worlds","journey","property","programmes","atlas","operations","showroom","models","planner","trust","explorer","conversion"])assert.ok(body.includes('className={s.'+section+'}'),section);
 assert.ok(body.includes("<CommerceCatalogue/>"));
 assert.ok(body.includes("<BusinessOfferCard key={item.id} item={item} compact/>"));
 assert.ok(!body.includes("<CommercialOpening"));
 assert.ok(!body.includes("<CommerceCollections"));
 assert.ok(assigned.includes('experience.key === "hospitality" ? <><HospitalitySignatureR2 mode="published"/><AssignedEnquiry /></>'));
 assert.ok(!entry.includes("<CommercialOpening"));
 assert.ok(pub.includes("StudioPublishedDataRenderer data={world.data}"));
 assert.ok(pub.includes("AssignedBusinessCommerce experience={experience}"));
});
test("no extra consumer-facing technical text in Hospitality B2B experience",()=>{
 const exposed=[body,entry,commerce];
 for(const text of [body,entry])for(const banned of ["CATALOGUE, PAS DES PROMESSES","ANGELCARE PROPERTY STUDIO","ANGELCARE HOSPITALITY SIGNATURE R2","Published native catalogue offer IDs","Catalogue complet","LIVE CATALOG"])assert.ok(!text.includes(banned),banned);
 assert.ok(commerce.includes('world==="hospitality" ? locale==="fr"?"Vos solutions"'));
 assert.ok(commerce.includes('catalogue:["Toutes les solutions"'));
 assert.ok(commerce.includes('full:["Découvrir toutes les solutions"'));
});
test("real native hospitality memberships, category authority, actual prices, detail and actions preserved",()=>{
 for(const label of ['"hospitality-kids-programme"','"hotel-travel-childcare"','"event-venue-programme"','"custom-managed-solution"'])assert.ok(merch.includes(label),label);
 assert.ok(merch.includes('if (categories.includes(world)) return "canonical_membership"'));
 assert.ok(merch.includes('if (dedicated[world]?.includes(schema)) return "native_doctrine"'));
 assert.ok(repository.includes('angelcare_marketplace_catalog_item_categories'));
 assert.ok(repository.includes('angelcare_marketplace_catalog_discovery_v'));
 assert.ok(repository.includes('status", "published"'));
 for(const key of ["priceLabel(item, locale)","availabilityLabel(item, locale)","businessItemHref(item, locale, experience.territoryCode)","selections.select(item.id, \"saved\")","selections.select(item.id, \"compare\")","toggleProject(item.id)","nativeAction(item, locale, experience.territoryCode)"])assert.ok(commerce.includes(key),key);
 assert.ok(body.includes('segmentItems(experience.items'));
 assert.ok(body.includes("project.map(x=>x.name"));
});
test("hospitality-native offer images retain source identity and do not fabricate items or specifications",()=>{
 assert.ok(commerce.includes('Photo src={item.media_url} alt={item.name} contain'));
 assert.ok(commerce.includes('world === "hospitality" ? c.card + " " + c.hospitalityOffer'));
 assert.ok(commerceCss.includes('.hospitalityOffer .media img'));
 assert.ok(commerceCss.includes("object-fit:contain"));
 assert.ok(commerce.includes("ordered.slice(0, compact ? (world === \"hospitality\" ? 4 : 2)"));
 assert.ok(repository.includes('if (!allowed.has(key) || excluded.test(key)) return []'));
 assert.ok(repository.includes("definition.publicFields"));
 assert.ok(!body.includes('price_amount:'));
});
test("no double-padded full-width product explorer and no squeezed mobile grid",()=>{
 assert.ok(css.includes("max-width:1160px"));
 assert.ok(css.includes('data-business-commerce="complete-catalogue"'));
 assert.ok(commerceCss.includes(".hospitalityExplorer .grid"));
 assert.ok(commerceCss.includes("repeat(3,minmax(0,1fr))"));
 assert.ok(css.includes("@media(max-width:780px)"));
 assert.ok(css.includes("@media(max-width:520px)"));
 assert.ok(commerceCss.includes("@media(max-width:540px)"));
});
test("existing imagery slots remain registered, new model placements are individual and controlled",()=>{
 assert.equal(previous.length,33);
 assert.equal(new Set(previous.map(x=>x.id)).size,33);
 for(const x of previous){assert.ok(x.id.startsWith("hospitality.hospitality-r2."));assert.equal(x.owner,"editable");assert.ok(x.source.startsWith("/angelcare-marketplace/"));}
 for(const id of ["model.city","model.resort","model.season"])assert.ok(previous.some(x=>x.id==="hospitality.hospitality-r2."+id),id);
 assert.ok(body.includes('slot={"model."+v.id}'));
 assert.ok(body.includes('slot={"day."+selectedMoment.id}'));
 assert.ok(body.includes('slot={"property."+selectedProperty.id}'));
 assert.ok(body.includes('params.get("imageryPreview")!=="1"'));
});
test("FR EN AR and B2B project context persist while published route uses same real enquiry",()=>{
 assert.ok(body.includes('locale==="ar"?"rtl":"ltr"'));
 for(const v of ["property-type","hospitality-programmes","hospitality-experiences","hospitality-guest-journey","hospitality-planning","ages"])assert.ok(body.includes('setContext("'+v+'"'),v);
 assert.ok(body.includes('<Enquiry world="hospitality"'));
 assert.ok(body.includes('mode==="native"?<Enquiry'));
 assert.ok(assigned.includes('<AssignedEnquiry />'));
 assert.ok(enquiry.includes('responseReference(payload)'));
 assert.ok(enquiry.includes('if (!response.ok || !ref) throw Error("Unconfirmed enquiry")'));
 assert.ok(body.includes("selected native")===false);
});
