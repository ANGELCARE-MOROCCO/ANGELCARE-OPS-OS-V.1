import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=name=>readFileSync(new URL("../angelcare-marketplace/establishments-world/"+name,import.meta.url),"utf8");
const host=read("Experience.tsx");
const page=read("EquipmentExperienceR10.tsx");
const styles=read("EquipmentExperienceR10.module.css");
const domains=read("equipment-r8-data.ts");
const programming=read("equipment-r9-programs.ts");
const editorial=read("equipment-r10-editorial.ts");
const demo=read("EquipmentR9DomainStudio.tsx");
const idList=[...domains.matchAll(/\{id:"([^"]+)",art:/g)].map(x=>x[1]);
const layoutList=[...programming.matchAll(/\{id:"([^"]+)",layout:"([^"]+)"/g)].map(x=>x[2]);

test("R10 only changes equipment body; hero/explorer/enquiry remain in identical order",()=>{
 const head=Math.max(host.indexOf("<EquipmentHeroR11"),host.indexOf("<EquipmentHeroR8"));
 const catalog=host.indexOf("<NativeExplorer");
 const body=host.indexOf("<EquipmentExperienceR10");
 const enquiry=host.indexOf("<ProjectEnquiry");
 assert.ok(head>=0&&catalog>head&&body>catalog&&enquiry>body);
 assert.ok(host.includes('data-establishments-journey={view==="produits"?"R11"')||host.includes('data-establishments-journey={view==="produits"?"R10":"R5"}'));
 for(const protectedFeature of ["<PartnerJourney","<CommercialJourney","<ProjectEnquiry","onBriefChange={setEquipmentR9Brief}","storageScope={experience.territoryCode||"])assert.ok(host.includes(protectedFeature),protectedFeature);
});
test("clear discover by space, by goal and by domain, with no mandatory form",()=>{
 for(const mode of ['"spaces"','"goals"','"domains"'])assert.ok(page.includes(mode),mode);
 for(const feature of ["r10-explore","r10-stories","r10-map","r10-universes","r10-atlas","r10-collection","r10-domain-experience"])assert.ok(page.includes(feature),feature);
 assert.ok(page.includes('role="tablist"'));
 assert.ok(page.includes('role="tabpanel"'));
 assert.ok(page.includes('aria-selected={entry==="spaces"}'));
 assert.ok(page.includes('goalFocus'));
 assert.ok(page.includes('className={c.goalDetail}'));
 assert.ok(page.includes('className={c.mapTiles}'));
 assert.ok(page.includes('aria-pressed={activeMap===i}'));
 assert.ok(styles.includes('.goalDetail'));
 assert.ok(styles.includes('.mapZone'));
 assert.ok(page.includes('const saveRelated=()=>{if(activeDomain)toggleIdea(activeDomain.id)}'));
 assert.ok(!page.includes("<EquipmentExperienceR9"),"must not stack 22 old journeys");
});
test("six visually differentiated universes, four transformation stories and map hotspots",()=>{
 for(const name of ["welcome","learning","parents","operations","routines","identity"])assert.ok(editorial.includes(name+":{color:"),name);
 assert.equal((editorial.match(/\{id:"(?:school-opening|new-class|team-rhythm|school-moments)"/g)||[]).length,4);
 assert.equal((editorial.match(/\{id:"(?:reception|class-visuals|parent-communication|staff-tools|activity-boxes|graduation)",label:/g)||[]).length,6);
 for(const c of ["universeGrid","storyHero","mapPin","mapComposition","spaceCard","goalsGrid","atlasGrid"])assert.ok(styles.includes("."+c),c);
});
test("twenty-two real brochure domains remain discoverable with 22 distinct optional demos",()=>{
 assert.equal(idList.length,22);
 assert.equal(new Set(idList).size,22);
 assert.equal(layoutList.length,22);
 assert.equal(new Set(layoutList).size,22);
 assert.equal((editorial.match(/":\{headline:/g)||[]).length,22);
 for(const layout of layoutList)assert.ok(demo.includes('case "'+layout+'"'),layout);
 assert.ok(demo.includes("export function R9InteractiveScene("));
 assert.ok(page.includes("<R9InteractiveScene"));
 assert.ok(page.includes("activeDomain&&activeProgram"));
});
test("discovery, save, native selection, catalogue and enquiry remain independently meaningful",()=>{
 for(const x of ["toggleIdea(d.id)","showDomain(d.id)","onSelect(equipmentDomainSelection(activeDomain,locale))","onExplore","onReview","onContact","sessionStorage.setItem","equipmentR9Brief","history.replaceState"])assert.ok(page.includes(x),x);
 assert.ok(page.includes("savedIdeas"));
 assert.ok(page.includes("selectedDomainIds"));
 assert.ok(page.includes("onBriefChange(brief)"));
 assert.ok(!page.includes("fetch("));
 assert.ok(!page.includes("supabase"));
 assert.ok(page.includes("localStorage.getItem(ideas(storageScope))"));
 assert.ok(page.includes("localStorage.setItem(ideas(storageScope)"));
 assert.ok(!page.includes("localStorage.setItem(key("),"No personal notes or contact information may be persisted to localStorage");
});
test("full journey is visually saturated, responsive and honors reduced motion",()=>{
 for(const x of ["#ff765e","#e9b33e","#ea0b68","#0b2854","@media(max-width:780px)","@media(prefers-reduced-motion:reduce)"])assert.ok(styles.includes(x),x);
 for(const x of ["Mise en situation indicative","disponibilité","offres publiées"])assert.ok((page+" "+demo).toLowerCase().includes(x.toLowerCase()),x);
});
