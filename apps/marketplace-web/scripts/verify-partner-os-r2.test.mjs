import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const source=(p)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const root="angelcare-marketplace/establishments-world/";
const r2=source(root+"partner/PartnerR2Experience.tsx");
const r2css=source(root+"partner/PartnerR2Experience.module.css");
const os=source(root+"partner/PartnerOS.tsx");
const css=source(root+"partner/partner.module.css");
const data=source(root+"partner/content.ts");
const host=source(root+"Experience.tsx");
const route=source("app/angelcare-marketplace/[locale]/establishments/partner-os/page.tsx");
const media=source(root+"media.ts");
const request=source(root+"ProjectEnquiry.tsx");
const native=source(root+"OfferExplorer.tsx");
const worldIds=["direction","familles","quotidien","equipes","revenus","ecosysteme"];
const moduleIds=["direction","sites","reporting","admissions","crm","parents","communication","planning","operations","rh","formation","qualite","roles","plans","services","facturation","paiements","marketplace","documents","support"];

test("R2 preserves exactly six brochure-backed chapters and 20 source-authoritative modules",()=>{
 const chapters=[...data.slice(0,data.indexOf("export type ChapterKey")).matchAll(/\bkey:\s*"([^"]+)"/g)].map(m=>m[1]);
 const keys=[...data.slice(data.indexOf("export const MODULES:"),data.indexOf("export const SITUATIONS")).matchAll(/\bkey:\s*"([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(chapters,worldIds);assert.deepEqual(keys,moduleIds);
 for(const p of ["export function recommended(","export function partnerBrief(","export function restorePartner("])assert.ok(data.includes(p));
});
test("R2 hero only replaces Partner OS and preserves NativeExplorer directly after hero",()=>{
 assert.ok(host.includes("<PartnerR2Hero"));assert.ok(host.includes("<NativeExplorer"));
 assert.ok(host.indexOf("<PartnerR2Hero")<host.indexOf("<NativeExplorer"));
 assert.ok(host.indexOf("<NativeExplorer")<host.indexOf("<PartnerJourney"));
 for(const p of ['view === "partner-os"','<ProjectEnquiry','<CommercialJourney'])assert.ok(host.includes(p),p);
 for(const p of ['initialView="partner-os"','partnerOnly'])assert.ok(route.includes(p));
});
test("Six distinct interactive problem-solution worlds with source-real module actions",()=>{
 for(const id of worldIds){assert.ok(r2.includes(id+':{'),id);}
 for(const kind of ["command","families","day","people","revenue","network"])assert.ok(r2.includes('visual:"'+kind+'"'),kind);
 for(const p of ['const choice=world.cases[active]','setActive(i)','aria-pressed={active===i}','onOpen(choice.module)','onAdd(choice.module)'])assert.ok(r2.includes(p),p);
 assert.equal([...r2.matchAll(/problem:\[/g)].length,18);
 assert.equal([...r2.matchAll(/change:\[/g)].length,18);
});
test("Searchable 20-module atlas preserves native selection and domain filters",()=>{
 for(const p of ["PartnerR2Atlas","setQuery(e.target.value)","setFamily(id)","MODULES.filter","m.uses.map(t)","m.benefits.map(t)","onOpen(m.key)","onAdd(m.key)","selected.includes(m.key)"])assert.ok(r2.includes(p),p);
 for(const p of ["<PartnerR2Atlas","selected={request.modules}","onOpen={open}","onAdd={toggle}"])assert.ok(os.includes(p),p);
});
test("All old capability content and four functional demo studios remain accessible",()=>{
 for(const p of ["<PartnerR2ModuleSwitcher","items={chapter.modules}","render={(key)=>(","expanded={all || expanded.includes(key)}","onContact={contactModule}","recommended={suggestions.includes(key)}","toggle={toggle}","<AdmissionsScene","<PlanningScene","<TeamScene","<FinanceScene"])assert.ok(os.includes(p),p);
});
test("Project studio retains all saved modules and authentic enquiry",()=>{
 for(const p of ["<PartnerR2ProjectMap","request={request}","onAdd={toggle}","onOpen={open}","request.modules.length","useSessionValue"])assert.ok(os.includes(p),p);
 assert.ok(host.includes("ac.partner.brief.v1:"));
 for(const p of ["partnerBrief(partnerRequest, t)","requestBrief(view, project, experience.territoryCode, t)","<ProjectEnquiry"])assert.ok(host.includes(p),p);
 assert.ok(request.includes("aria-busy"));
 assert.ok(!r2.includes("Math.random()"));assert.ok(!r2.includes("fetch("));
});
test("Published catalogue authority remains; no fabricated orders or prices",()=>{
 for(const p of ["experience={experience}","view={view}","selections={selections}","onDetail={setDetail}"])assert.ok(host.includes(p),p);
 assert.ok(native.includes("offer"));assert.ok(r2.includes("no live operating data"));
 assert.ok(r2.includes("do not activate services or place an order"));
});
test("Managed PNG images from actual repo; stale missing R1 asset paths removed",()=>{
 assert.ok(r2.includes("<ManagedImage"));
 for(const img of ["partner-hero","os-admissions","os-team","os-quotes","os-services","os-overview","os-finance","os-people-followup"])assert.ok(media.includes('"'+img+'"'),img);
 assert.ok(os.includes("campaignAsset(names[kind])"));assert.ok(os.includes("campaignSet(names[kind])"));
 assert.ok(!os.includes("/partner-os-r1/"));assert.ok(!r2.includes(".webp"));
 const nativeBlock=r2.split("const R2_NATIVE_PHOTOS=new Set([")[1]?.split("]);")[0]||"";
 const photoNames=[...nativeBlock.matchAll(/"([^"]+)"/g)].map(x=>x[1]);
 assert.ok(photoNames.length>=18,"fewer than 18 distinct native images");
 assert.equal(photoNames.length,new Set(photoNames).size,"native image duplication");
 for(const photo of photoNames)assert.ok(existsSync(new URL("../public/angelcare-marketplace/establishments-r2/"+photo+".png",import.meta.url)),photo+" missing in repository");
});
test("FR EN AR source parity and RTL for hero, worlds, atlas, project and mobile",()=>{
 assert.ok(r2.includes('locale==="fr"?0:locale==="en"?1:2'));
 assert.ok(r2.includes('dir={locale==="ar"?"rtl":"ltr"}'));
 for(const name of ["PartnerR2Hero","PartnerR2WorldLead","PartnerR2Atlas","PartnerR2ProjectMap","PartnerR2MobileNav"])assert.ok(r2.includes("export function "+name));
 assert.ok(r2.includes('"استكشفوا ٢٠ مجالاً"'));assert.ok(r2.includes('"Explore 20 capabilities"'));
 assert.ok(route.includes('locale = raw === "ar" ? "ar" : raw === "en" ? "en" : "fr"'));
});
test("Mobile removes mandatory 1120px, adds responsive worlds and native safe-area navigation",()=>{
 assert.ok(css.includes("min-width:0!important"));
 for(const p of ["@media(max-width:1180px)","@media(max-width:900px)","@media(max-width:670px)"])assert.ok(css.includes(p)&&r2css.includes(p),p);
 for(const p of ["position:fixed","safe-area-inset-bottom","prefers-reduced-motion:reduce",":focus-visible"])assert.ok(r2css.includes(p),p);
 for(const p of ["<PartnerR2MobileNav","onAtlas={() =>","onProject={() =>"])assert.ok(os.includes(p),p);
});
test("Deep-link recovery and preserved module keyboard interaction",()=>{
 for(const p of ['#partner-os/pos-',"history.pushState","setExpanded","aria-pressed={selected}","prefers-reduced-motion"])assert.ok((os+css+host).includes(p),p);
 for(const p of ["activeKey={moduleTab[chapter.key]}","setModuleTab(previous=>","onSelect={key=>","getElementById(\"pos-module-\"+key)"])assert.ok(os.includes(p),p);
 assert.ok(r2.includes("onSelect:(key:ModuleKey)=>void"));
 for(const p of ['window.addEventListener("hashchange"','window.addEventListener("popstate"'])assert.ok(os.includes(p),p);
});
