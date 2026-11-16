import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(file)=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const studio=read('angelcare-marketplace/orders360/create-order/CommercialOrderStudio.tsx');
const css=read('angelcare-marketplace/orders360/create-order/commercial-order-studio.module.css');
const api=read('angelcare-marketplace/orders360/create-order/commercial-order-api.ts');
const launcher=read('angelcare-marketplace/orders360/create-order/CommercialOrderLauncher.tsx');
const workspace=read('angelcare-marketplace/orders360/Workspace.tsx');
const sql=read('supabase/migrations/20261116080000_angelcare_commercial_order_studio_r8.sql');

test('R8 stays scoped to Orders 360 and retains the existing canonical API',()=>{
 assert.match(workspace,/CommercialOrderLauncher as AssistedOrderComposer/);
 assert.match(launcher,/CommercialOrderStudio/);
 assert.match(api,/angelcare_marketplace_commercial_r7_submit/);
 assert.match(sql,/angelcare_marketplace_receive_assisted/);
 assert.doesNotMatch(css,/\.adminShell|\.globalNav|\.footerStudio/);
});
test('modal supports operator fullscreen, readable typography, narrow pads and permanent summary',()=>{
 for(const c of ['data-maximized={maximized}','Agrandir le studio','s.modeGuide','s.customerJourney','s.advancedTabs','s.rightCol'])assert.ok(studio.includes(c),c);
 assert.match(css,/width:calc\(100vw - 20px\)/);
 assert.match(css,/height:calc\(100dvh - 20px\)/);
 assert.match(css,/\.modal\[data-maximized=true\]/);
 assert.match(css,/\.rightCol\{display:flex;grid-column:1\/-1/);
 assert.match(css,/font-size:13px/);
 assert.match(css,/#10244a/i);
 assert.match(css,/#e70d68/i);
});
test('six commercial modes have tailored guides and contextual contract entry',()=>{
 for(const mode of ['quick','expert','quote','subscription','b2b','renewal'])assert.match(studio,new RegExp(' '+mode+':\\['));
 for(const field of ['legalEntity','purchaseOrder','billingContact','quoteValidity','billingCycle','renewalReason','commercialContextReady'])assert.ok(studio.includes(field),field);
 assert.match(api,/Raison sociale B2B requise/);
 assert.match(api,/date de validité du devis/);
 assert.match(api,/motif du renouvellement/);
});
test('service and physical item configuration are distinct',()=>{
 for(const k of ['chosenIsPhysical','variant','deliveryMethod','personalization','beneficiaryName','ageBand'])assert.ok(studio.includes(k),k);
 assert.match(studio,/isPhysicalItem\(item\)/);
 assert.match(studio,/chosenIsPhysical\?/);
});
test('catalogue removes fixed 80-item limit and quote lines use stable identifiers',()=>{
 assert.match(studio,/matchingItems\.slice\(0,searchLimit\)/);
 assert.match(studio,/setSearchLimit\(v=>v\+24\)/);
 assert.doesNotMatch(studio,/Math\.min\(searchLimit,80\)/);
 assert.match(studio,/q\.lineId===line\.id/);
 assert.match(sql,/'lineId',line->>'id'/);
 assert.match(sql,/'commercialContext',coalesce/);
});
test('canonical order submission retains independent approval and rollback semantics',()=>{
 assert.match(sql,/R7_COMMERCIAL_APPROVAL_REQUIRED/);
 assert.match(sql,/R7_STALE_DRAFT_VERSION/);
 assert.match(sql,/R8_B2B_LEGAL_ENTITY_REQUIRED/);
 assert.match(sql,/R8_QUOTE_VALIDITY_REQUIRED/);
 assert.match(sql,/R8_RENEWAL_REASON_REQUIRED/);
 assert.match(sql,/begin;[\s\S]*commit;/);
 assert.match(studio,/navigateFirstBlocker/);
 assert.match(studio,/role="dialog" aria-modal="true"/);
});
