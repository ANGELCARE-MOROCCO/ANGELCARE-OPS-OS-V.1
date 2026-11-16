import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EQUIPMENT_DOMAINS,EQUIPMENT_FAMILIES} from '../angelcare-marketplace/establishments-world/equipment-r8-data.ts';
import {R9_PROGRAMS,assertR9Domains,emptyR9State,restoreR9State,equipmentR9Brief} from '../angelcare-marketplace/establishments-world/equipment-r9-programs.ts';
const source=(name)=>readFileSync(new URL('../angelcare-marketplace/establishments-world/'+name,import.meta.url),'utf8');
const host=source('Experience.tsx');
const r8=source('EquipmentExperienceR8.tsx');
const r9=source('EquipmentExperienceR9.tsx');
const studio=source('EquipmentR9DomainStudio.tsx');
const css=source('EquipmentR9DomainStudio.module.css');
const cssPage=source('EquipmentExperienceR9.module.css');
const hero=source('EquipmentHeroR8.tsx');

test('R9 has exactly 22 genuine domain programs, 22 unique visual layouts and six families',()=>{
 assert.equal(EQUIPMENT_DOMAINS.length,22);
 assert.equal(EQUIPMENT_FAMILIES.length,6);
 assert.equal(R9_PROGRAMS.length,22);
 assert.equal(new Set(R9_PROGRAMS.map(x=>x.id)).size,22);
 assert.equal(new Set(R9_PROGRAMS.map(x=>x.layout)).size,22);
 assert.equal(assertR9Domains(),true);
 for(const p of R9_PROGRAMS){
  assert.ok(EQUIPMENT_DOMAINS.some(d=>d.id===p.id));
  assert.equal(p.choices.length,3,p.id);
  assert.equal(p.criteria.length,3,p.id);
  assert.equal(p.recommendations.length,3,p.id);
  for(const property of ['headline','promise','scenario','value','interaction','cta'])assert.ok(p[property].length>12,p.id+' '+property);
 }
});
test('all 22 domain studio layouts render uniquely, not via repeated generic campaigns',()=>{
 for(const p of R9_PROGRAMS)assert.ok(studio.includes('case "'+p.layout+'"'),p.layout);
 assert.ok(studio.includes('onChooseRelated'));
 assert.ok(studio.includes('onExplore'));
 assert.ok(studio.includes('onContact'));
 assert.ok(studio.includes('onPref'));
 assert.ok(studio.includes('pref.quantity'));
 assert.ok(studio.includes('pref.age'));
 assert.ok(studio.includes('pref.note'));
 assert.ok(studio.includes('data-layout={program.layout}'));
 assert.ok(!studio.includes('fetch('),'domain studio must have no independent commerce network API');
 assert.ok(!studio.includes('localStorage'),'native project authority is host');
});
test('the canonical product explorer and R8 approved hero remain in their original order',()=>{
 const h=host.indexOf('<EquipmentHeroR8');
 const explorer=host.indexOf('<NativeExplorer');
 const body=host.indexOf('<EquipmentExperienceR9');
 const enquiry=host.indexOf('<ProjectEnquiry');
 assert.ok(h>=0&&explorer>h&&body>explorer&&enquiry>body);
 assert.ok(host.includes('data-establishments-journey={view==="produits"?"R9":"R5"}'));
 assert.ok(host.includes('<PartnerJourney'));
 assert.ok(host.includes('<CommercialJourney'));
 assert.ok(host.includes('onBriefChange={setEquipmentR9Brief}'));
 assert.ok(host.includes('view === "produits" ? equipmentR9Brief : ""'));
 assert.match(hero,/data-equipment-hero-version="r8"/);
});
test('R8 domain cards use an optional R9 studio slot, never lose native project actions',()=>{
 assert.ok(r8.includes('domainExperience?:ReactNode'));
 assert.ok(r8.includes('onOpenDomain?:(domain:EquipmentDomain)=>void'));
 assert.ok(r8.includes('if(onOpenDomain){onOpenDomain(domain);return}'));
 assert.ok(r8.includes('{domainExperience}'));
 assert.ok(r9.includes('domainExperience={customDomainExperience}'));
 assert.ok(r9.includes('onOpenDomain={chooseDomain}'));
 assert.ok(r9.includes('onSelect(equipmentDomainSelection(selectedDomain))'));
 assert.ok(r9.includes('selectedKeys.has'));
});
test('persisted preferences accept only safe bounded keys and restore from invalid payloads',()=>{
 const blank=emptyR9State();
 assert.deepEqual(restoreR9State('not json'),blank);
 assert.deepEqual(restoreR9State('x'.repeat(18001)),blank);
 const decoded=restoreR9State(JSON.stringify({preferences:{printables:{choice:2,age:'5–6 ans',format:'A4',quantity:'40',note:'abc'},unknown:{choice:1}},needs:{situation:'New school',style:'Warm'}}));
 assert.equal(decoded.preferences.printables.choice,2);
 assert.equal(decoded.preferences.printables.format,'A4');
 assert.ok(!decoded.preferences.unknown);
 assert.equal(decoded.needs.style,'Warm');
 const brief=equipmentR9Brief(['intent:equipment-domain:printables'],decoded);
 assert.match(brief,/Printables/);
 assert.match(brief,/A4/);
 assert.match(brief,/New school/);
 assert.doesNotMatch(brief,/unknown/);
 assert.ok(brief.length<=2200);
});
test('media are native PNG, with explicit editorial caveats and no fake inventory',()=>{
 assert.ok(r9.includes('establishments-r2/'));
 assert.ok(studio.includes('/angelcare-marketplace/establishments-r2/'));
 assert.ok(studio.includes('Mise en situation indicative'));
 assert.ok(studio.includes('Offres, tarifs et délais restent soumis'));
 assert.ok(studio.includes('Aucune variante, disponibilité'));
 assert.ok(r9.includes('aucune commande'));
 assert.ok(css.includes('.flashcardBoard'));
 assert.ok(css.includes('.staffBoard'));
 assert.ok(css.includes('.receptionRoom'));
 assert.ok(css.includes('.printableDesk'));
 assert.ok(css.includes('.technicalLibrary'));
 assert.ok(cssPage.includes('.r9Masthead'));
 assert.ok(cssPage.includes('.familyChapter'));
});
