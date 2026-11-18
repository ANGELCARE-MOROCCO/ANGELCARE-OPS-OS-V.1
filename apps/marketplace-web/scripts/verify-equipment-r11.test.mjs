import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=name=>readFileSync(new URL("../angelcare-marketplace/establishments-world/"+name,import.meta.url),"utf8");
const route=src("Experience.tsx");
const hero=src("EquipmentHeroR11.tsx");
const hcss=src("EquipmentHeroR11.module.css");
const explorer=src("OfferExplorer.tsx");
const ecss=src("EquipmentExplorerR11.module.css");
const commerce=src("commercial.module.css");
const r10=src("EquipmentExperienceR10.tsx");
const model=src("model.ts");

test("R11 exact hero -> native explorer -> R10 body -> project enquiry without cross-specialty rewrites",()=>{
 const h=route.indexOf("<EquipmentHeroR11");
 const x=route.indexOf("<NativeExplorer");
 const r=route.indexOf("<EquipmentExperienceR10");
 const q=route.indexOf("<ProjectEnquiry");
 assert.ok(h>=0 && x>h && r>x && q>r);
 assert.ok(route.includes('view==="produits"?"R11":view==="conseil"&&!legacyConseil?"R6":"R5"'));
 for(const p of ["<PartnerJourney","<CommercialJourney","<ProjectEnquiry"])assert.ok(route.includes(p),p);
 assert.ok(route.includes("<PartnerR2Hero") || route.includes("<PartnerHero"),"approved Partner OS hero must remain active");
 assert.ok(!route.includes('<EquipmentHeroR8'),"R8 hero should be rollback only; R11 is active");
 assert.ok(route.includes('onExploreOffers={() => scrollTo("ew-native-explorer")}'));
 assert.ok(route.includes('onExploreDomains={() => scrollTo("r10-explore")}'));
});
test("R11 hero keeps R7.1 approved managed media, interactive authentic scenes and FR EN AR",()=>{
 assert.match(hero,/name="products-hero-r71"/);
 assert.match(hero,/data-equipment-hero-version="r11"/);
 for(const s of ["fr:","en:","ar:","onExploreDomain(current.domain)","onExploreOffers","onExploreDomains","aria-pressed={index===i}","onClick={()=>choose(index-1)}","onClick={()=>choose(index+1)}"])assert.ok(hero.includes(s),s);
 for(const v of ["products-hero-r71","welcome.png","os-team.png","uniforms.png"])assert.ok(hero.includes(v),v);
 assert.ok(hero.includes("ManagedImage"));
 assert.ok(hcss.includes(".universeRail"));
 assert.ok(hcss.includes(".thumbnails"));
 assert.ok(hcss.includes(".sceneHotspot"));
 assert.ok(hcss.includes("@media(max-width:760px)"));
 assert.ok(hcss.includes("prefers-reduced-motion"));
 assert.ok(!hero.includes("fetch("));
});
test("hero scenes navigate directly into the real R10 domain studio",()=>{
 assert.ok(route.includes('new CustomEvent("angelcare:equipment-open-domain"'));
 assert.ok(r10.includes('addEventListener("angelcare:equipment-open-domain"'));
 assert.ok(r10.includes("showDomain(id)"));
 assert.ok(r10.includes('removeEventListener("angelcare:equipment-open-domain"'));
});
test("equipment-only native explorer keeps published authority and the original actions",()=>{
 assert.ok(explorer.includes('equipmentR11 = view === "produits"'));
 assert.ok(explorer.includes('data-equipment-r11={equipmentR11?"true":"false"}'));
 assert.ok(explorer.includes("filterOffers(experience.items"));
 assert.ok(explorer.includes('useSessionValue('));
 for(const v of ["select(item.id, \"compare\")","select(item.id, \"saved\")","offerSelection(item, locale)","onDetail(item)","price(item, locale)","availabilityLabel(item, locale)","businessItemHref(","nativeAction(item, locale"])assert.ok(explorer.includes(v),v);
 assert.ok(model.includes("publicFacets"));
 assert.ok(model.includes("decodeFilters"));
 assert.ok(!explorer.includes("Math.random"));
});
test("published-only search suggestions and category tiles, advanced filters, 4 column and list mode",()=>{
 for(const v of ["suggestionsVisible","item.public_reference","item.media_url","categoryVisuals","compareExpanded","data-r11-mode={displayMode}","data-r11-filters={filtersOpen?\"open\":\"closed\"}","setDisplayMode(\"list\")","aria-expanded={filtersOpen}","displayMode===\"grid\"","displayMode===\"list\""])assert.ok(explorer.includes(v),v);
 for(const v of [".commerceMasthead",".searchCommand",".categoryVisuals",".suggestionPanel","[data-offer-id]","[data-native-grid]",".compareEntry",".comparisonStudio","[data-r11-mode=list]","[data-r11-filters=open]","repeat(4,minmax(0,1fr))"])assert.ok(ecss.includes(v),v);
 assert.ok(ecss.includes("@media(max-width:540px)"));
 assert.ok(ecss.includes("prefers-reduced-motion"));
});
test("premium equipment inspector uses real published image and native project actions",()=>{
 assert.ok(route.includes('data-equipment-inspector={equipmentR11?"r11":undefined}'));
 assert.ok(route.includes("item.media_url"));
 assert.ok(route.includes("setZoomed"));
 for(const v of [".equipmentInspectorR11[open]",".inspectorZoomR11","object-fit:contain","grid-template-columns:minmax(280px,1.1fr)"])assert.ok(commerce.includes(v),v);
 assert.ok(route.includes("offerSelection(detail, locale)"));
 assert.ok(route.includes("businessItemHref(item, locale, territory)"));
 assert.ok(route.includes("blocked(item) && !selected"));
});


test("R11 catalogue editorial copy has explicit French English Arabic parity",()=>{
 const dictionary=src("equipment-r11-copy.ts");
 for(const lang of ["fr:","en:","ar:"])assert.ok(dictionary.includes(lang),lang);
 for(const key of ["masthead:","headline:","intro:","searchTitle:","searchPlaceholder:","categoryLabel:","showCompare:"])assert.equal(dictionary.split(key).length-1,3,key);
 assert.ok(explorer.includes("EQUIPMENT_R11_COPY[locale]"));
 assert.ok(explorer.includes("r11text.headline"));
 assert.ok(explorer.includes("r11text.searchPlaceholder"));
 assert.ok(explorer.includes("r11text.categoryTitle"));
});
