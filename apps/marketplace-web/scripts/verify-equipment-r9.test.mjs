import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=(name)=>readFileSync(new URL('../angelcare-marketplace/establishments-world/'+name,import.meta.url),'utf8');
const host=source('Experience.tsx');
const r8=source('EquipmentExperienceR8.tsx');
const r9=source('EquipmentExperienceR9.tsx');
const studio=source('EquipmentR9DomainStudio.tsx');
const css=source('EquipmentR9DomainStudio.module.css');
const cssPage=source('EquipmentExperienceR9.module.css');
const hero=source('EquipmentHeroR8.tsx');
const domainData=source('equipment-r8-data.ts');
const programs=source('equipment-r9-programs.ts');
const domainIds=[...domainData.matchAll(/\{id:"([^"]+)",art:/g)].map(m=>m[1]);
const defs=[...programs.matchAll(/\{id:"([^"]+)",layout:"([^"]+)"/g)].map(m=>({id:m[1],layout:m[2]}));

test('22 real domains, 22 different experience layouts, six commercial families',()=>{
 assert.equal(domainIds.length,22);
 assert.equal(defs.length,22);
 assert.equal(new Set(domainIds).size,22);
 assert.equal(new Set(defs.map(d=>d.id)).size,22);
 assert.equal(new Set(defs.map(d=>d.layout)).size,22);
 for(const d of defs)assert.ok(domainIds.includes(d.id),d.id);
 assert.equal((domainData.match(/\{id:"(?:welcome|learning|parents|operations|routines|identity)",number:/g)||[]).length,6);
 for(const field of ['headline','promise','scenario','priority','choices','criteria','recommendations','interaction','cta'])assert.ok(programs.includes(field+':'),field);
});
test('22 distinct compositions have unique renderers and contextual interactions',()=>{
 for(const d of defs)assert.ok(studio.includes('case "'+d.layout+'"'),d.layout);
 for(const name of ['onChooseRelated','onExplore','onContact','onPref','pref.quantity','pref.age','pref.note','data-layout={program.layout}'])assert.ok(studio.includes(name),name);
 assert.ok(!studio.includes('fetch('));
 assert.ok(!studio.includes('localStorage'));
});
test('protected hero, native explorer, enquiry and sibling journeys survive',()=>{
 const heroAt=host.indexOf('<EquipmentHeroR8');
 const explorerAt=host.indexOf('<NativeExplorer');
 const bodyAt=host.indexOf('<EquipmentExperienceR10');
 const enquiryAt=host.indexOf('<ProjectEnquiry');
 assert.ok(heroAt>=0&&explorerAt>heroAt&&bodyAt>explorerAt&&enquiryAt>bodyAt);
 assert.ok(host.includes('data-establishments-journey={view==="produits"?"R10":"R5"}'));
 for(const value of ['<PartnerJourney','<CommercialJourney','onBriefChange={setEquipmentR9Brief}','view === "produits" ? equipmentR9Brief : ""'])assert.ok(host.includes(value),value);
 assert.match(hero,/data-equipment-hero-version="r8"/);
});
test('domain navigation keeps R8 structure and native project selection intact',()=>{
 for(const value of ['domainExperience?:ReactNode','onOpenDomain?:(domain:EquipmentDomain)=>void','if(onOpenDomain){onOpenDomain(domain);return}','{domainExperience}'])assert.ok(r8.includes(value),value);
 for(const value of ['return customDomainExperience;','onSelect(equipmentDomainSelection(selectedDomain))','selectedKeys.has','id="r8-domains"'])assert.ok(r9.includes(value),value);
 assert.ok(!r9.includes('<EquipmentExperienceR8'),"R9 must not duplicate R8 legacy journey");
});
test('recoverable bounded preferences enrich brief, without inventing orders',()=>{
 for(const value of ['raw.length>18000','Number.isInteger(pref.choice)','slice(0,180)','slice(0,2200)','export function equipmentR9Brief'])assert.ok(programs.includes(value),value);
 for(const value of ['sessionStorage.getItem(storageKey(storageScope))','sessionStorage.setItem(storageKey(storageScope),','onBriefChange(selectedBrief)'])assert.ok(r9.includes(value),value);
 assert.ok(r9.includes('onSelect(equipmentDomainSelection(selectedDomain))'));
});
test('native PNG media, clear editorial caveats and responsive unique presentation',()=>{
 assert.ok(r9.includes('establishments-r2/'));
 assert.ok(programs.includes('aucune commande confirmée'));
 for(const value of ['Mise en situation indicative','Offres, tarifs et délais restent soumis','Aucune variante, disponibilité'])assert.ok(studio.includes(value),value);
 for(const cls of ['flashcardBoard','staffBoard','receptionRoom','printableDesk','technicalLibrary','moodGrid','storageShelves','awardsGallery','unboxingCase'])assert.ok(css.includes('.'+cls),cls);
 for(const cls of ['r9Masthead','familyChapter','atlasGrid','diagnosticFields','r9Project'])assert.ok(cssPage.includes('.'+cls),cls);
});
