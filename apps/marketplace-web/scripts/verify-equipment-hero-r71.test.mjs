import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const source = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const component = source('angelcare-marketplace/establishments-world/EquipmentHeroR71.tsx');
const host = source('angelcare-marketplace/establishments-world/Experience.tsx');
const style = source('angelcare-marketplace/establishments-world/EquipmentHeroR71.module.css');
const media = source('angelcare-marketplace/establishments-world/media.ts');
const registry = JSON.parse(source('angelcare-marketplace/marketplace-imagery/slot-seeds.json'));

const r8Host=host.includes('<EquipmentHeroR8');
const r11Host=host.includes('<EquipmentHeroR11');
test('equipment hero rollover preserves Conseil, Partner OS and original R7.1 rollback',()=>{
 assert.match(host,/view === "partner-os" \? \(\s*<PartnerHero/);
 assert.match(host,/<section className=\{c.hero\} data-establishments-hero>/);
 assert.match(host,/<NativeExplorer[\s\S]*?<CommercialJourney/);
 if(r11Host){
  assert.ok(host.includes('<EquipmentHeroR11'));
  assert.match(host,/<EquipmentExperienceR10/);
 }else if(r8Host){
  assert.match(host,/view === "produits" \? \(\s*<EquipmentHeroR8/);
  assert.match(host,/<EquipmentExperienceR8/);
 }else{
  assert.match(host,/view === "produits" \? \(\s*<EquipmentHeroR71/);
 }
});
test('native hero actions preserve the canonical explorer and enquiry',()=>{
 if(r11Host){
  assert.ok(host.includes('onExploreDomains={() => scrollTo("r10-explore")}'));
  assert.ok(host.includes('onExploreOffers={() => scrollTo("ew-native-explorer")}'));
  const r11=source('angelcare-marketplace/establishments-world/EquipmentHeroR11.tsx');
  assert.match(r11,/onClick=\{onExploreDomains\}/);
  assert.match(r11,/onClick=\{onExploreOffers\}/);
  assert.doesNotMatch(r11,/fetch\(|localStorage|supabase|window\.open/);
 }else if(r8Host){
  assert.ok(host.includes('onExploreDomains={() => scrollTo("r8-domains")}'));
  assert.ok(host.includes('onExploreOffers={() => scrollTo("ew-native-explorer")}'));
  const r8=source('angelcare-marketplace/establishments-world/EquipmentHeroR8.tsx');
  assert.match(r8,/onClick=\{onExploreDomains\}/);
  assert.match(r8,/onClick=\{onExploreOffers\}/);
  assert.doesNotMatch(r8,/fetch\(|localStorage|supabase|window\.open/);
 }else{
  assert.match(host,/onBuildProject=\{\(\) => contact\(\{ subject: copy\.contact \}\)\}/);
  assert.match(host,/onExplore=\{\(\) => scrollTo\("ew-native-explorer"\)\}/);
 }
 assert.match(component,/onClick=\{onBuildProject\}/);
 assert.match(component,/onClick=\{onExplore\}/);
 assert.doesNotMatch(component,/fetch\(|localStorage|supabase|window\.open/);
});
test('approved copy and FR, EN, AR are present',()=>{
  for(const x of ['Votre établissement parle avant même que vous preniez la', 'parole.', 'Construire mon projet', 'Explorer les solutions','Qualité professionnelle','Solutions complètes','Pensé pour la petite enfance', 'fr:', 'en:', 'ar:'])assert.ok(component.includes(x), x);
});
test('R7.1 has an independent native managed-media placement and a verified PNG fallback',()=>{
  assert.match(media, /"products-hero-r71": "equipment-hero-r71"/);
  assert.match(component, /name="products-hero-r71"/);
  const slot=registry.filter(x=>x.id==='establishments.journey-r4.products-hero-r71');
  assert.equal(slot.length,1);
  assert.equal(slot[0].owner,'editable');
  assert.equal(slot[0].source,'/angelcare-marketplace/establishments-r4/equipment-hero-r71-campaign.png');
  assert.ok(existsSync(new URL('../public/angelcare-marketplace/establishments-r4/equipment-hero-r71-campaign.png',import.meta.url)));
});
test('styles are isolated and enforce compact spacing, visible controls and reduced motion',()=>{
  assert.match(component,/EquipmentHeroR71\.module\.css/);
  assert.match(style,/margin: 10px auto 0/);
  assert.match(style,/\.hero \.headline \{/);
  assert.match(style,/\.hero \.projectButton \{/);
  assert.match(style,/\.hero \.exploreButton \{/);
  assert.match(style,/padding: 24px clamp\(22px, 2\.1vw, 35px\) 18px/);
  assert.match(style,/\.projectButton:focus-visible/);
  assert.match(style,/@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(style,/\.localNav|\.catalogue|\.world|\.enquiry|\.footer/);
});
