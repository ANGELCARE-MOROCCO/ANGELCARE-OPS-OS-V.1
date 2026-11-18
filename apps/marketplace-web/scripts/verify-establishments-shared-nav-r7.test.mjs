import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const base="angelcare-marketplace/establishments-world/";
const host=read(base+"Experience.tsx");
const tabCss=read(base+"EstablishmentsSpecialitiesR7.module.css");
const commercial=read(base+"commercial.module.css");
const partner=read(base+"partner/partner.module.css");
const locale=read(base+"partner/messages.json");
const view=read(base+"content.ts");
const route=read(base+"partner/LocaleEntry.tsx");
test("one shared three-button bar across all specialties in stable commercial order",()=>{
 assert.match(host,/data-establishments-specialities="R7"/);
 assert.match(host,/VIEWS\.map\(\(item\) =>/);
 assert.ok(!host.includes('label: "Concierge & programmes"'),"Partner OS cannot rename or reorder the three tabs");
 assert.match(view,/key: "conseil"/);
 assert.match(view,/key: "partner-os"/);
 assert.match(view,/key: "produits"/);
 assert.equal((view.match(/key: "(conseil|partner-os|produits)"/g)||[]).length,3);
 assert.ok(host.indexOf('key: "conseil"')<host.indexOf('key: "partner-os"') || view.indexOf('key: "conseil"')<view.indexOf('key: "partner-os"'));
});
test("active state, keyboard semantics and original hash navigation remain native",()=>{
 for(const value of [
   'className={tabs.rail}',
   'className={tabs.tab}',
   'className={tabs.icon}',
   'className={tabs.label}',
   'aria-current={view === item.key ? "page" : undefined}',
   'onClick={(event) => navigate(event, item.key)}',
   'partnerOnly && item.key !== "partner-os"',
   'history.pushState(',
   'if(locale!=="fr")window.dispatchEvent(new Event("hashchange"))'
 ]) assert.ok(host.includes(value),value);
 assert.ok(route.includes('hash.startsWith("#conseil-archive")?"legacy":"modern"'));
 assert.ok(host.includes("setReview(true)"));
 assert.ok(host.includes("contact({ subject: copy.contact })"));
});
test("approved smaller uniform desktop menu with hot-pink active segment",()=>{
 for(const value of [
   'grid-template-columns: repeat(3,minmax(0,1fr))',
   'min-height: 40px',
   'font-size: 12px',
   '.tab[aria-current="page"]',
   'linear-gradient(110deg,#fa2991',
   'color: #fff',
   '.tab:hover:not([aria-current="page"])',
   '.tab:focus-visible',
   '.icon'
 ]) assert.ok(tabCss.includes(value),value);
 assert.ok(commercial.includes('[data-establishments-specialities="R7"]'));
 assert.ok(!partner.includes('border-bottom: 3px solid transparent'),"Partner OS must not force its old underline navigation");
});
test("mobile shows all three equal touch-friendly segments, without horizontal legacy scrolling",()=>{
 for(const value of [
   '@media(max-width:760px)',
   '@media(max-width:390px)',
   'min-height:58px',
   'display:flex;flex-direction:column',
   'text-wrap:balance',
   '.rail[dir="rtl"]',
   'prefers-reduced-motion'
 ]) assert.ok(tabCss.includes(value),value);
 assert.ok(commercial.includes('flex-wrap:wrap'));
 assert.ok(!partner.includes('>div:first-child{min-width:max-content}'));
 assert.ok(host.includes('dir={locale === "ar" ? "rtl" : "ltr"}'));
});
test("FR EN AR retain original labels and distinct protected storefront experiences",()=>{
 for(const value of ["Conseil & programmes","Produits & équipements","Partner OS"])assert.ok(view.includes(value));
 for(const value of ["\"Conseil & programmes\"","\"Produits & équipements\"","\"Partner OS\""])assert.ok(locale.includes(value));
 for(const value of ["<ConseilExperienceR6","<PartnerR2Hero","<EquipmentHeroR11","<EquipmentExperienceR10","<NativeExplorer","<ProjectEnquiry"])assert.ok(host.includes(value),value);
 assert.ok(!host.includes("<EstablishmentsSpecialitiesR7"),"Only the approved shared button group should change");
});
