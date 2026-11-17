import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const root="angelcare-marketplace/establishments-world/";
const route=read("app/angelcare-marketplace/[locale]/establishments/page.tsx");
const entry=read(root+"partner/LocaleEntry.tsx");
const switcher=read(root+"partner/locale-navigation.ts");
const host=read(root+"Experience.tsx");
const body=read(root+"EquipmentExperienceR10.tsx");
const domainModel=read(root+"equipment-r8-data.ts");
const content=read(root+"equipment-r111-content.ts");
const scene=read(root+"EquipmentR9DomainStudio.tsx");
const sceneCopy=read(root+"equipment-r111-scene.ts");
const ui=read(root+"equipment-r111-ui.ts");
const mobile=read(root+"EquipmentMobileR111.tsx");
const mobileCss=read(root+"EquipmentMobileR111.module.css");
const css=read(root+"commercial.module.css");
const r10Css=read(root+"EquipmentExperienceR10.module.css");
const domainIds=[...domainModel.matchAll(/\{id:"([^"]+)",art:/g)].map(x=>x[1]);

test("canonical FR EN AR equipment route with preserved Partner OS and legacy Conseil",()=>{
 assert.match(route,/const modernCatalogue = await prepareBusinessStorefront/);
 assert.match(route,/if\(locale==="fr"\)return modern/);
 assert.match(route,/<PartnerLocaleEntry/);
 assert.match(route,/modern=\{modern\}/);
 assert.match(route,/legacy=\{legacy\}/);
 assert.match(route,/initialView=\{locale==="fr"\?undefined:"produits"\}/);
 assert.match(entry,/hash.startsWith\("#conseil"\)\?"legacy":"modern"/);
 assert.match(entry,/hash.startsWith\("#partner-os"\)\?"partner"/);
 assert.match(entry,/chapter==="partner"\?partner:chapter==="legacy"\?legacy:modern/);
 for(const k of ["territoryCode","getPublishedSurface","publicVerticalSnapshot","EstablishmentsExperience"])assert.ok(route.includes(k));
});
test("language switch keeps equipment deep-links and local chapter, including territory query",()=>{
 assert.match(switcher,/if\(established\)/);
 assert.match(switcher,/chapter\|\|"#produits"/);
 assert.match(switcher,/const query=search.startsWith/);
 assert.match(switcher,/const chapter=hash.startsWith/);
 assert.ok(switcher.includes("partner-os"));
 assert.ok(!switcher.includes('if (!dedicated && !legacy) return'));
});
test("source-authoritative 22 brochure domain IDs and program options cover EN/AR",()=>{
 assert.equal(domainIds.length,22);
 assert.equal(new Set(domainIds).size,22);
 for(const id of domainIds){
  assert.ok(content.includes('"'+id+'":{name:'),id+" missing from EN/AR");
  assert.ok(content.split('"'+id+'":{name:').length>=3,id+" must have both languages");
 }
 for(const k of ["localDomain(","localProgram(","localTheme(","localStory(","localGoal(","localHotspot(","localDomainLabel("])assert.ok(content.includes(k),k);
 for(const k of ["localizedDomains=useMemo","localizedStories=useMemo","localizedThemes=useMemo","localizedGoals=useMemo","localizedHotspots=useMemo"])assert.ok(body.includes(k),k);
 assert.ok(body.includes("localProgram(R9_PROGRAMS.find"));
 assert.ok(body.includes("onSelect(equipmentDomainSelection(activeDomain))"));
});
test("all R10 visual text is localizable without replacing native commerce",()=>{
 assert.ok(ui.includes("equipmentUi("));
 assert.ok(ui.includes("translations[fr]"));
 assert.ok(body.includes("equipmentUi(locale,"));
 assert.ok(body.includes("localDomainLabel("));
 assert.ok(body.includes("locale===\"ar\"?\"rtl\":\"ltr\""));
 for(const k of ["r10-explore","r10-stories","r10-map","r10-universes","r10-atlas","r10-collection","r10-domain-experience"])assert.ok(body.includes(k),k);
 for(const k of ["sessionStorage.setItem","localStorage.setItem(ideas(storageScope)","onExplore","onReview","onContact","onBriefChange(brief)"])assert.ok(body.includes(k),k);
});
test("22 interactive demo scenes render localized captions and related domain names",()=>{
 const layouts=[...read(root+"equipment-r9-programs.ts").matchAll(/\{id:"([^"]+)",layout:"([^"]+)"/g)];
 assert.equal(layouts.length,22);
 for(const [,id,layout] of layouts)assert.ok(scene.includes('case "'+layout+'"'),id);
 assert.ok(scene.includes("SceneLocalizedText"));
 assert.ok(scene.includes("sceneUi("));
 assert.ok(scene.includes("localDomain(d,locale)"));
 assert.ok(sceneCopy.includes("sceneUiCoverage"));
 assert.ok(!scene.includes("Math.random"));
});
test("premium mobile navigation operates native actions and supports RTL and safe-area",()=>{
 for(const phrase of ['onExplore','onProducts','onWorlds','onIdeas','onProject','locale==="ar"?"rtl":"ltr"'])assert.ok(mobile.includes(phrase),phrase);
 for(const phrase of ['onExplore={()=>scrollTo("r10-explore")}','onProducts={()=>scrollTo("ew-native-explorer")}','onWorlds={()=>scrollTo("r10-universes")}','onIdeas={()=>scrollTo("r10-collection")}','onProject={()=>setReview(true)}'])assert.ok(host.includes(phrase),phrase);
 assert.ok(host.includes('dir={locale === "ar" ? "rtl" : "ltr"}'));
 assert.ok(mobileCss.includes("safe-area-inset-bottom"));
 assert.ok(mobileCss.includes("position:fixed"));
 assert.ok(css.includes('.world[data-view="produits"]'));
 assert.ok(r10Css.includes('@media(max-width:780px)'));
});
