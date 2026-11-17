import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {EQUIPMENT_DOMAINS,EQUIPMENT_FAMILIES,equipmentDomainSelection} from '../angelcare-marketplace/establishments-world/equipment-r8-data.ts';

const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const experience=read('angelcare-marketplace/establishments-world/Experience.tsx');
const journey=read('angelcare-marketplace/establishments-world/EquipmentExperienceR8.tsx');
const css=read('angelcare-marketplace/establishments-world/EquipmentExperienceR8.module.css');
const model=read('angelcare-marketplace/establishments-world/model.ts');
const hero=read('angelcare-marketplace/establishments-world/EquipmentHeroR8.tsx');
const legacyHero=read('angelcare-marketplace/establishments-world/EquipmentHeroR71.tsx');
const assets=read('angelcare-marketplace/establishments-world/media.ts');

test('R8 uses exact 22 catalog domain names, one unique indexed key each',()=>{
 assert.equal(EQUIPMENT_DOMAINS.length,22);
 assert.equal(EQUIPMENT_FAMILIES.length,6);
 assert.equal(new Set(EQUIPMENT_DOMAINS.map(d=>d.id)).size,22);
 assert.deepEqual(EQUIPMENT_DOMAINS.map(d=>d.number),Array.from({length:22},(_,i)=>i+1));
 assert.ok(EQUIPMENT_DOMAINS.every(d=>EQUIPMENT_FAMILIES.some(f=>f.id===d.group)));
 assert.ok(EQUIPMENT_DOMAINS.every(d=>d.short&&d.pain&&d.solution&&d.examples.length>=3));
});
test('editorial domains never masquerade as native published sellable offers',()=>{
 for(const d of EQUIPMENT_DOMAINS){const selection=equipmentDomainSelection(d);assert.equal(selection.kind,'intent');assert.equal(selection.key,'intent:equipment-domain:'+d.id);assert.match(selection.detail,/options et disponibilité à confirmer/)}
 assert.match(journey,/Aucune commande, réservation ou disponibilité/);
 assert.match(journey,/Les offres, prix, options/);
});
test('native hero, public explorer, enquiry, partner and shared header remain protected',()=>{
 assert.ok(experience.includes("<EquipmentHeroR11")||experience.includes("<EquipmentHeroR8"));
 assert.match(experience,/<NativeExplorer/);
 assert.match(experience,/<ProjectEnquiry/);
 assert.match(experience,/<PartnerJourney/);
 assert.ok(experience.includes("<EquipmentExperienceR10")||experience.includes("<EquipmentExperienceR9")||experience.includes("<EquipmentExperienceR8"),"equipment component must remain wired");
 assert.ok(experience.includes('view==="produits"?"R11":"R5"')||experience.includes('view==="produits"?"R10":"R5"')||experience.includes('view==="produits"?"R9":"R5"')||experience.includes('view==="produits"?"R8":"R5"'),"equipment journey must be versioned");
 assert.match(hero,/data-equipment-hero-version="r8"/);
 assert.match(legacyHero,/data-equipment-hero-version="r7.1"/);
 assert.match(hero,/onExploreDomains/);
 assert.match(hero,/onExploreOffers/);
});
test('six different interactive visual families and immersive guided gallery',()=>{
 for(const cls of ['quickNav','families','familyGrid','domains','domainGrid','showroom','showroomGallery','hotspot','galleryPrev','galleryNext','galleryDots','project','domainDialog','ctaTwin'])assert.match(css,new RegExp('\\.'+cls+'\\{'),cls);
 assert.match(journey,/data-equipment-experience="R8"/);
 assert.match(journey,/aria-pressed=\{family==="all"\}/);
 assert.match(journey,/aria-current=\{i===slide/);
 assert.match(journey,/onSelect\(equipmentDomainSelection\(domain\)\)/);
});
test('project selections remain available across session reload without undermining native offer quota',()=>{
 assert.match(model,/intent:equipment-domain:/);
 assert.match(model,/equipmentDomainSelection\((?:domain|localDomain\(domain,locale\))\)/);
 assert.match(model,/localDomain\(domain,locale\)/);
 assert.match(model,/otherCount>=8/);
 assert.match(model,/equipmentCount>=22/);
 assert.match(model,/\.slice\(0, 30\)/);
});
test('all imagery names used by new page correspond to managed native art',()=>{
 const art=new Set([...assets.matchAll(/^\s*"?([\w-]+)"?:\s*"[\w-]+",?$/gm)].map(m=>m[1]));
 for(const family of EQUIPMENT_FAMILIES)assert.ok(art.has(family.image),family.image);
 for(const domain of EQUIPMENT_DOMAINS){
  assert.ok(art.has(domain.image),domain.image);
    assert.ok(existsSync(new URL('../public/angelcare-marketplace/establishments-r2/'+domain.art+'.png',import.meta.url)),domain.art);
 }
 for(const name of ['welcome','classroom','parents','administration','activities','uniforms','products-hero'])assert.ok(art.has(name),name);
});
