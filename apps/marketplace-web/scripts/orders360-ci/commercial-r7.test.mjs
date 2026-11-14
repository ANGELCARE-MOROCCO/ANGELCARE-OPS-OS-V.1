import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root="apps/marketplace-web/";
const read=(p)=>readFileSync(root+p,"utf8");
const ui=read("angelcare-marketplace/orders360/create-order/CommercialOrderStudio.tsx");
const css=read("angelcare-marketplace/orders360/create-order/commercial-order-studio.module.css");
const api=read("angelcare-marketplace/orders360/create-order/commercial-order-api.ts");
const sql=read("supabase/migrations/20261114115500_angelcare_commercial_order_studio_r7.sql");
const workspace=read("angelcare-marketplace/orders360/Workspace.tsx");
const launcher=read("angelcare-marketplace/orders360/create-order/CommercialOrderLauncher.tsx");
const original=read("angelcare-marketplace/customer-commerce/components/AssistedOrderComposer.tsx");
test("Orders 360 is the only changed consumer of the new modal",()=>{
 assert.match(workspace,/CommercialOrderLauncher as AssistedOrderComposer/);
 assert.match(launcher,/Orders 360 only/);
 assert.match(original,/ASSISTED ORDER COMPOSER/);
});
test("Approved modal composition: six modes, eight functional sections, customer/cart/summary",()=>{
 for(const v of ["quick","expert","quote","subscription","b2b","renewal"])assert.ok(ui.includes('id:"'+v+'"'),v);
 for(const v of ["customer","basket","configuration","planning","pricing","payment","contracts","validation"])assert.ok(ui.includes('id:"'+v+'"'),v);
 for(const v of ["customerCol","centerCol","rightCol","headerActions","modes","tabs","grandTotal","footerActions","lineConfig","rightChecks"])
  assert.ok(ui.includes("s."+v),v);
 assert.match(css,/grid-template-columns:minmax\(240px,23%\) minmax\(0,1fr\) minmax\(280px,26%\)/);
 assert.match(css,/background:linear-gradient\(130deg,#017552,#005b40\)/);
});
test("Every critical UI action hits a guarded server authority",()=>{
 for(const v of ["save","quote","request-approval","approve","submit"])
  assert.ok(api.includes('action==="'+v+'"'),v);
 for(const v of ["requireMarketplaceApiContext","requireCustomerSameOrigin","hasMarketplacePermission","ctx.tenantId","ctx.territoryId"])
  assert.ok(api.includes(v),v);
 assert.match(api,/customerAccountId/);
 assert.match(ui,/lastSaved\.current/);
 assert.match(ui,/submissionKey\.current/);
 assert.match(ui,/Importer panier/);
 assert.match(ui,/Modèles/);
 assert.match(ui,/importPriorOrder/);
 assert.match(ui,/applyTemplate/);
 assert.match(ui,/sourceOrderId/);
 assert.match(ui,/recurringReady/);
 assert.match(sql,/R7_RENEWAL_SOURCE_REQUIRED/);
 assert.match(sql,/R7_RECURRENCE_REQUIRED/);
 assert.match(api,/customerOrders/);
 assert.match(api,/orderLines/);
 assert.match(api,/mediaFor/);
});
test("Backend preserves canonical order and payment authority",()=>{
 for(const v of ["angelcare_marketplace_receive_assisted","angelcare_marketplace_order_lines","angelcare_marketplace_journeys",
  "angelcare_marketplace_commercial_r7_save","angelcare_marketplace_commercial_r7_review",
  "angelcare_marketplace_commercial_r7_submit","angelcare_marketplace_commercial_r7_quote",
  "R7_SELF_APPROVAL_FORBIDDEN","R7_COMMERCIAL_APPROVAL_REQUIRED","R7_PAYMENT_METHOD_REQUIRED"])
  assert.ok(sql.includes(v),v);
 assert.match(sql,/for update/);
 assert.match(sql,/order_id is null then raise exception/);
 assert.match(sql,/status='submitted',submitted_order_id=order_id/);
 assert.match(sql,/paymentMode','none'/);
 assert.doesNotMatch(sql,/drop table|truncate table|delete from public\.angelcare_marketplace_journeys/i);
});
test("Migration is paired, additive, service-role only and transactional",()=>{
 assert.match(sql,/^begin;/m);assert.match(sql,/^commit;/m);
 assert.equal((sql.match(/\$\$/g)||[]).length,8);
 assert.match(sql,/enable row level security/);
 assert.match(sql,/revoke all on function/);
 assert.match(sql,/grant execute on function/);
});
