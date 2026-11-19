import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const dir="angelcare-marketplace/kidflix/detail/";
const player=read(dir+"UniversalInteractivePlayer.tsx");
const controls=read(dir+"interactive-player-controls.module.css");
const rails=read(dir+"DiscoveryRails.tsx");
const cards=read(dir+"detail.module.css");
const entry=read(dir+"Detail.tsx");
const api=read("app/api/kidflix/experience/[key]/engagement/route.ts");
const love=read(dir+"love-server.ts");
const catalogue=read("angelcare-marketplace/kidflix/catalogue.ts");
const source=read("angelcare-marketplace/kidflix/server.ts");

test("the identical published interactive iframe and bridge remain intact",()=>{
 for(const sourcePart of [
  "sandbox=\"allow-scripts\"","referrerPolicy=\"no-referrer\"","allow=\"fullscreen\"",
  "key={src}","ref={frame}","const src=valid?","e.source!==frame.current?.contentWindow",
  "e.origin!=='null'","e.data?.contract!=='kidflix.interactive.bridge.1'",
  "e.data?.channel!==channel","case 'ready'","case 'progress'","case 'save'",
  "case 'answer'","case 'complete'","case 'error'","action:'restore'"
 ])assert.ok(player.includes(sourcePart),"Security or learning contract changed: "+sourcePart);
 assert.match(entry,/<UniversalInteractivePlayer/);
 assert.ok(!player.includes("frame.current?.src="),"Changing viewing mode must never reload the iframe");
 assert.ok(!player.includes("contentDocument"),"Never inspect untrusted iframe");
});

test("zoom, fit and viewport geometry are host-owned, bounded and reversible",()=>{
 assert.match(player,/const \[zoom,setZoom\]=useState\(1\)/);
 assert.match(player,/Math\.max\(\.75/);
 assert.match(player,/Math\.min\(2,/);
 assert.match(player,/setZoom\(1\);viewport\.current\?\.scrollTo/);
 assert.match(player,/new ResizeObserver\(measure\)/);
 assert.match(player,/transformOrigin:'top left'/);
 assert.match(player,/height:Math\.ceil\(size\.height\*zoom\)/);
 assert.match(player,/width:Math\.ceil\(size\.width\*zoom\)/);
 assert.ok(controls.includes("overflow:auto"),"Zoom content must be reachable by scrolling");
 assert.ok(!/iframe\s*\{/.test(controls),"Do not globally style other iframe players");
 assert.ok(!/setReload\(/.test(player.match(/const toggleFullscreen=[\s\S]*?const src=/)?.[0]||""),"Changing mode must never reload resource");
});

test("mobile landscape tries native fullscreen and orientation, degrades safely and exits",()=>{
 for(const token of ["requestFullscreen()","document.exitFullscreen()","screen.orientation.lock('landscape')","screen.orientation.unlock","fullscreenchange","setLandscape(false)","fallbackLandscape","document.body.style.overflow='hidden'"])assert.ok(player.includes(token),token);
 assert.match(controls,/@media\(max-width:900px\).*\.landscape/);
 assert.match(controls, /@media\(max-width:900px\) and \(orientation:portrait\)/);
 assert.match(controls, /\.rotated\{/);
 assert.match(controls, /:fullscreen/);
 assert.match(controls, /prefers-reduced-motion/);
 for(const label of ["'Zoom in','Agrandir','تكبير'","'Zoom out','Réduire','تصغير'","'Landscape','Paysage','أفقي'"])assert.ok(player.includes(label),label);
});

test("only 'Practise this skill differently' receives richer cards and lazy engagement",()=>{
 assert.ok(rails.includes('skillVariant={shelf==="skill"}'));
 assert.ok(rails.includes("className={`${s.resourceCard} ${skillVariant?s.skillCard:\"\"}`}"));
 assert.ok(rails.includes("skillVariant?<SkillCardMetrics item={item} locale={locale}/>:null"));
 assert.match(rails,/new IntersectionObserver\(entries/);
 assert.match(rails,/new AbortController\(\)/);
 assert.match(rails,/\/engagement\?locale=/);
 assert.ok(rails.includes("item.loveCount"));
 assert.ok(rails.includes("item.releaseId"));
 assert.match(cards,/\.reference \.shelf_skill \.rail \.skillCard/);
 assert.match(cards,/\.reference \.shelf_skill \.skillMetrics/);
 assert.ok(!cards.includes(".shelf_family .skillCard"));
 assert.ok(!cards.includes(".shelf_topic .skillCard"));
 assert.ok(rails.includes('emitVisitor(m.key, locale, m.releaseId, "recommendation_open")'));
 assert.ok(rails.includes('guest.toggle(item.key)'),"Existing bookmark semantics must not change");
});

test("displayed likes and views are real, release-gated, privacy-safe and never invented",()=>{
 assert.match(catalogue,/loveCount\?: number/);
 assert.match(source,/typeof row\.love_total === "number"/);
 assert.match(love,/ac_kidflix_love/);
 assert.match(api,/ac_kidflix_public_engagement_v1/);
 assert.match(api,/getExperience\(host, locale, key\)/);
 assert.match(api,/threshold: 5/);
 assert.ok(rails.includes("v.available!==true||v.threshold!==5"));
 assert.ok(rails.includes('views===null?"<5"'));
 assert.ok(rails.includes("setViews(undefined)"));
 assert.ok(!rails.includes("Math.random()"));
});

test("no non-target KidFlix files or editorial URLs are altered by this upgrade",()=>{
 assert.match(entry,/<DiscoveryRails m=\{m\} locale=\{locale\}/);
 assert.ok(!player.includes("window.location.href="));
 assert.match(rails,/className=\{s\.cardCTA\}/);
 assert.ok(controls.includes(".shell"));
});
