#!/usr/bin/env node
// Offline checks of native JOBKIX route coverage, access projection and rendered navigation.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),base=path.join(app,'angelcare-marketplace'),require=createRequire(path.join(app,'package.json')),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
let pathname='/angelcare-marketplace/admin/jobkix/ops/employment';const modules=new Map();
function load(file){if(modules.has(file))return modules.get(file).exports;const m={exports:{}};modules.set(file,m);const source=fs.readFileSync(file,'utf8'),code=ts.transpileModule(source,{fileName:file,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},reportDiagnostics:true});assert.equal(code.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error).length||0,0,file);new Function('require','module','exports',code.outputText)(name=>{
 if(name==='server-only')return{};if(['react','react/jsx-runtime','lucide-react'].includes(name))return require(name);
 if(name==='next/link')return {__esModule:true,default:props=>React.createElement('a',props)};
 if(name==='next/navigation')return {usePathname:()=>pathname};
 if(name.endsWith('.css'))return{__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})};
 if(name==='../design-system/ui')return{cx:(...args)=>args.filter(Boolean).join(' ')};
 if(name.endsWith('/auth/context'))return{hasMarketplacePermission:(c,p)=>c.permissions.includes(p),hasMarketplaceWorkspaceAccess:(c,p)=>c.workspaceKeys.includes(p)};
 if(name==='./native-gate')return{};
 if(name.startsWith('.')){const p=path.resolve(path.dirname(file),name);return load(p+(fs.existsSync(p+'.ts')?'.ts':'.tsx'));}
 throw Error('Unexpected dependency '+name);
 },m,m.exports);return m.exports;}
const registry=load(base+'/jobkix/admin-navigation/registry.ts'),access=load(base+'/jobkix/admin-navigation/access.ts'),areas=load(base+'/jobkix/admin-contract.ts').ADMIN_AREAS,ops=load(base+'/jobkix/admin/global-operations/contracts.ts').WORKSPACES,supply=load(base+'/jobkix/supply/contracts.ts').SUPPLY_SECTIONS;
const context=(workspaces=[],extra=[])=>({locale:'fr',workspaceKeys:workspaces,permissions:['marketplace.admin.access',...extra]});let checks=0;async function test(label,fn){await fn();checks++;console.log('[PASS]',label);}
const all=registry.jobkixAdminCatalogue(),full=context(areas.map(a=>a.workspace),['marketplace.media.view']);
await test('All 17 native, operator and detached JOBKIX workspaces are included',()=>{assert.equal(all.length,17);assert.equal(all.filter(e=>e.group==='native').length,8);assert.equal(all.filter(e=>e.group==='operations').length,7);assert.equal(all.filter(e=>e.group==='specialist').length,2);assert.equal(new Set(all.map(e=>e.href)).size,all.length);});
await test('Native admin links derive from the existing D01–D08 contract',()=>{for(const a of areas)assert(all.some(e=>e.href===registry.JOBKIX_ADMIN_ROOT+'/'+a.slug&&e.workspace===a.workspace));});
await test('Operator links use their actual native primary authority',()=>{for(const w of ops){const e=all.find(e=>e.id==='ops.'+w.slug);assert.equal(e.workspace,'jobkix.'+w.primary);assert.equal(e.links.length,w.tabs.length);for(const link of e.links)assert(new URL(link.href,'https://test.invalid').searchParams.get('tab'));}});
await test('All 11 Strategic Supply sections have direct native routes',()=>{const e=all.find(e=>e.id==='specialist.supply');assert.equal(e.links.length,supply.length);for(const section of supply)assert(e.links.some(l=>l.href===registry.JOBKIX_ADMIN_ROOT+'/strategic-supply/'+section));});
await test('RSS, scheduling and CSV imports are no longer detached',()=>{const e=all.find(e=>e.id==='specialist.supply');for(const key of ['feeds','schedules','imports'])assert(e.links.some(l=>l.href.endsWith('/'+key)));});
await test('No JOBKIX grant exposes no workspace or sidebar entry',()=>assert.deepEqual(access.accessibleJobkixAdminEntries(context()),[]));
await test('Base admin access remains mandatory',()=>assert.deepEqual(access.accessibleJobkixAdminEntries({...full,permissions:['marketplace.media.view']}),[]));
await test('Vacancy operator sees matching native, operator and supply workspaces only',()=>assert.deepEqual(access.accessibleJobkixAdminEntries(context(['jobkix.vacancies'])).map(e=>e.id).sort(),['native.vacancies','ops.employment','specialist.supply'].sort()));
await test('Audit authority unlocks only its matching operator views',()=>assert.deepEqual(access.accessibleJobkixAdminEntries(context(['jobkix.audit'])).map(e=>e.id).sort(),['native.audit','ops.executive','ops.intelligence'].sort()));
await test('Hero Studio also requires the existing media view permission',()=>{assert(!access.accessibleJobkixAdminEntries(context(['jobkix.editorial'])).some(e=>e.id==='specialist.hero'));assert(access.accessibleJobkixAdminEntries(context(['jobkix.editorial'],['marketplace.media.view'])).some(e=>e.id==='specialist.hero'));});
await test('Fully authorized context sees all 17 workspaces',()=>assert.equal(access.accessibleJobkixAdminEntries(full).length,17));
await test('Navigation uses local native admin routes only',()=>{for(const e of all)for(const href of [e.href,...e.links.map(l=>l.href)])assert(href.startsWith(registry.JOBKIX_ADMIN_ROOT+'/'));});
const Hub=load(base+'/jobkix/admin-navigation/Hub.tsx').JobkixAdminHub;
await test('Hub renders all authorized workspaces and specialist shortcuts',()=>{const html=renderToStaticMarkup(React.createElement(Hub,{entries:all}));assert.equal((html.match(/data-jobkix-workspace=/g)||[]).length,17);for(const e of all)assert(html.includes(e.href));assert(html.includes('Imports CSV'));assert(html.includes('Hero &amp; Slideshow Studio'));});
await test('Limited hub does not render unauthorized destinations',()=>{const entries=access.accessibleJobkixAdminEntries(context(['jobkix.vacancies'])),html=renderToStaticMarkup(React.createElement(Hub,{entries}));assert(!html.includes('/hero-studio'));assert(!html.includes('/ops/platform'));assert(html.includes('/strategic-supply/imports'));});
const Navigation=load(base+'/shells/AdminNavigation.tsx').AdminNavigation;
await test('Exactly one JOBKIX sidebar entry coexists with the imagery entry',()=>{const html=renderToStaticMarkup(React.createElement(Navigation,{canJobkix:true,canDce:true}));assert.equal((html.match(/href="\/angelcare-marketplace\/admin\/jobkix\/workspaces"/g)||[]).length,1);assert(html.includes('/digital-customer-experience/angelcare-imagery'));assert(html.includes('25 · JOBKIX'));});
await test('JOBKIX sidebar stays selected inside detached workspaces',()=>{for(const route of ['/ops/executive','/hero-studio','/strategic-supply/imports','/vacancies','/workspaces']){pathname=registry.JOBKIX_ADMIN_ROOT+route;const html=renderToStaticMarkup(React.createElement(Navigation,{canJobkix:true}));assert(/href="\/angelcare-marketplace\/admin\/jobkix\/workspaces"[^>]*aria-current="page"/.test(html));}});
await test('Sidebar visibility respects the projected access flag',()=>{const html=renderToStaticMarkup(React.createElement(Navigation,{canJobkix:false}));assert(!html.includes('JOBKIX'));});
await test('Hub route is dedicated, dynamic and guarded by native admin access',()=>{const source=fs.readFileSync(path.join(app,'app/angelcare-marketplace/(protected)/admin/jobkix/workspaces/page.tsx'),'utf8');assert(source.includes("requireMarketplaceAdminPageContext('marketplace.admin.access')"));assert(source.includes("dynamic='force-dynamic'"));assert(source.includes('accessibleJobkixAdminEntries(context)'));});
console.log('JOBKIX_NAVIGATION_CHECKS='+checks);
