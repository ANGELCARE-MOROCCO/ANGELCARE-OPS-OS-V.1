import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root="angelcare-marketplace/establishments-world/";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const host=read(root+"Experience.tsx");
const body=read(root+"ConseilExperienceR6.tsx");
const css=read(root+"ConseilExperienceR6.module.css");
const shared=read(root+"commercial.module.css");
const copy=read(root+"conseil-r6-copy.ts");
const plans=read(root+"conseil-r6-formulas.ts");
const catalogue=read(root+"OfferExplorer.tsx");
const route=read("app/angelcare-marketplace/[locale]/establishments/page.tsx");
const entry=read(root+"partner/LocaleEntry.tsx");
const model=read(root+"model.ts");
const enquiry=read(root+"ProjectEnquiry.tsx");
test("Conseil R6 canonical route, superseding legacy view in FR EN AR",()=>{
 assert.ok(host.includes("<ConseilExperienceR6"));
 assert.ok(host.includes('data-establishments-journey={view==="produits"?"R11":view==="conseil"&&!legacyConseil?"R6":"R5"}'));
 assert.ok(entry.includes('hash.startsWith("#conseil-archive")?"legacy":"modern"'));
 assert.ok(!entry.includes('hash.startsWith("#conseil")?"legacy":"modern"'));
 for(const phrase of ["<PartnerLocaleEntry","modern={modern}","legacy={legacy}","if(locale===\"fr\")return modern"])assert.ok(route.includes(phrase),phrase);
 assert.ok(host.includes('showNative={conseilHasNativeOffers}'));
 assert.ok(host.includes('view!=="conseil" || conseilHasNativeOffers || legacyConseil'));
 assert.ok(host.includes("conseilLegacy"));
 assert.ok(host.includes("view === \"conseil\" ? conseilR6Brief : \"\""));
});
test("All approved protected specialties and canonical form are preserved",()=>{
 for(const phrase of ["<EquipmentHeroR11","<EquipmentExperienceR10","<PartnerR2Hero","<PartnerJourney","<NativeExplorer","<CommercialJourney","<ProjectEnquiry"])assert.ok(host.includes(phrase),phrase);
 assert.ok(enquiry.includes('enquiryEndpoint("establishments")'));
 assert.ok(enquiry.includes('responseReference(payload)'));
 assert.ok(enquiry.includes("values.consent"));
 assert.ok(model.includes("formulaSelection"));
 assert.ok(catalogue.includes('belongsToEstablishmentView(item, view)'));
});
test("Exactly nine brochure programs, three professional pillars and three verified locale datasets",()=>{
 const ids=[...read(root+"content.ts").matchAll(/id: "(eduplay-(?:start|growth|signature)|academy-(?:start|team|excellence)|parenttrust-(?:visibility|performance|360))"/g)].map(x=>x[1]);
 assert.equal(ids.length,9);
 assert.equal(new Set(ids).size,9);
 for(const id of ids){
  assert.ok(plans.includes('"'+id+'":{frequency:'),id+" lacks EN translation");
  assert.ok(plans.split('"'+id+'":{frequency:').length===3,id+" lacks AR translation");
 }
 assert.ok(plans.includes("CONSEIL_R6_FORMULA_LOCALE_COVERAGE={fr:9,en:"));
 for(const family of ["edup","academy","parents"])assert.ok(body.includes(family),family);
});
test("All six original commercial worlds are interactive, not duplicated campaigns",()=>{
 for(const id of ["c6-hero","c6-challenge","c6-diagnostic","c6-programmes","c6-studio","c6-formulas","c6-value","c6-project"])assert.ok(body.includes('id="'+id+'"'),id);
 for(const needle of ["data-conseil-experience=\"R6\"","setDiagnostic","stepAnswer","setActiveFamily","setActiveDay","setActiveSkill","setActiveMoment","formulaSelection","onSelect","onContact","onReview","onBriefChange","valueEnroll*valueTuition"])assert.ok(body.includes(needle)||needle==="stepAnswer"&&body.includes("choose("),needle);
 assert.ok(body.includes("src={campaignAsset(name)}"));
 assert.ok(!body.includes("Math.random"));
 assert.ok(!body.includes("fetch("));
 assert.ok(!body.includes(".webp"));
});
test("FR EN AR copy fully defines all referenced editorial keys",()=>{
 const parts={};
 for(const key of ["fr","en","ar"]){const start=copy.indexOf("const "+key+":Record<string,string>=");assert.ok(start>=0,key);const end=copy.indexOf("\n};",start);parts[key]=copy.slice(start,end);}
 const keys=[...body.matchAll(/\bt\("([A-Za-z0-9]+)"\)/g)].map(x=>x[1]);
 const dynamic=["familyEduTitle","familyEduSubtitle","familyEduLead","familyEduBenefit","familyAcademyTitle","familyAcademySubtitle","familyAcademyLead","familyAcademyBenefit","familyParentTitle","familyParentSubtitle","familyParentLead","familyParentBenefit","parentMoment1","parentMoment2","parentMoment3","parentMoment4","parentMomentText1","parentMomentText2","parentMomentText3","parentMomentText4","skill1","skill2","skill3","skill4","skill5","skill6","labMonday","labTuesday","labWednesday","labThursday","labActivity1","labActivity2","labActivity3","labActivity4","q1","q2","q3","q4","q1a","q1b","q1c","q2a","q2b","q2c","q3a","q3b","q3c","q4a","q4b","q4c","classic1","classic2","classic3","classic4","premium1","premium2","premium3","premium4"];
 for(const language of ["fr","en","ar"])for(const key of new Set([...keys,...dynamic]))assert.ok(parts[language].includes(key+':')||parts[language].includes(key+':"'),language+" missing "+key);
});
test("Distinct visual art direction and mobile accessibility",()=>{
 for(const k of [".heroMedia",".heroInset",".heroOrb",".comparison",".diagPanel",".familyGrid",".studioStage",".formulaGrid",".valueCalculator",".finalSummary",".chapterNav"])assert.ok(css.includes(k),k);
 for(const k of ["@media(max-width:760px)","@media(max-width:425px)",".root[dir=rtl]","prefers-reduced-motion:reduce",":focus-visible"])assert.ok(css.includes(k),k);
 assert.ok(shared.includes('.world[data-view="conseil"]{min-width:0!important'));
 assert.ok(body.includes('dir={locale==="ar"?"rtl":"ltr"}'));
 assert.ok(body.includes("aria-pressed"));
 assert.ok(body.includes("aria-expanded={comparison}"));
});
test("No fake ROI, no fabricated published catalogue offers, no unauthorized submission",()=>{
 assert.ok(copy.includes("Aucun résultat commercial garanti")||copy.includes("No commercial outcome is guaranteed"));
 assert.ok(body.includes("t(\"valueDisclaimer\")"));
 assert.ok(body.includes("t(\"planPrice\")"));
 assert.ok(body.includes("showNative&&"));
 assert.ok(!body.includes("checkout"));
 assert.ok(!body.includes("autopublish"));
 assert.ok(!body.includes("fetch("));
});
