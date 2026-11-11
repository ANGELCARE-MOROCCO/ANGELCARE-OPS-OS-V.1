import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeNativeAsset, assetIssue, addUniqueAssets, mediaPassesClientFilters, reorderAsset, publishedSafe } from "../../angelcare-marketplace/kidflix/native-media-vault-contract.ts";
const base = (id, other = {}) => normalizeNativeAsset({
 id, title: "Montessori image " + id, fileName:"image.png", url:"/api/angelcare-marketplace/media/"+id+"/image.png", mime:"image/png",
 status:"active", rights:"approved", expiresAt:null, optimizationStatus:"ready", width:1200, height:1200, alt:"Wooden learning toys",
 ...other,
});
const filters = {orientation:"",ratio:"",category:"",collection:"",language:"",tag:"",uploader:"",used:"",dateRange:"",readyOnly:false,hasAlt:false,publishedSafe:false,unusedOnly:false};
test("normalize native media metadata and eligibility without inventing status",()=>{
 const a=base("123",{metadata:{tags:["montessori"], width:1200,height:1200},usageCount:4});
 assert.equal(a.width,1200);
 assert.deepEqual(a.tags,["montessori"]);
 assert.equal(a.usageCount,4);
 assert.equal(assetIssue(a),"");
 assert.equal(publishedSafe(a),true);
 assert.equal(publishedSafe(base("not-approved",{rights:"unverified"})),false);
 assert.match(assetIssue(base("expired",{expiresAt:"2024-01-01"})),/expired/i);
 assert.match(assetIssue(base("unsafe",{url:"javascript:alert(1)"})),/unsupported/i);
});
test("selection enforces capacity, deduplication and retains selection order",()=>{
 const a=base("one"), b=base("two"), c=base("three");
 assert.deepEqual(addUniqueAssets([a],[a,b,c],2).map(x=>x.id),["one","two"]);
 assert.deepEqual(addUniqueAssets([], [a,b,c],3,["two"]).map(x=>x.id),["one","three"]);
 assert.deepEqual(reorderAsset([a,b,c],0,2).map(x=>x.id),["two","three","one"]);
 assert.deepEqual(reorderAsset([a,b],1,8),[a,b]);
});
test("filters use real metadata and exclude unknown fields from strict toggles",()=>{
 const a=base("a",{category:"Early learning",collection:"School",tags:["Montessori"],language:"fr",usageCount:0});
 assert.equal(mediaPassesClientFilters(a,{...filters,category:"early",tag:"mont"}),true);
 assert.equal(mediaPassesClientFilters(a,{...filters,orientation:"landscape"}),false);
 assert.equal(mediaPassesClientFilters(a,{...filters,ratio:"1:1",unusedOnly:true,readyOnly:true,publishedSafe:true}),true);
 assert.equal(mediaPassesClientFilters(base("no-usage"),{...filters,unusedOnly:true}),false);
});
test("existing consumers and sequence editors retain native picker contracts", async()=>{
 const { readFileSync }=await import("node:fs");
 const { fileURLToPath }=await import("node:url");
 const root=new URL("../../angelcare-marketplace/",import.meta.url);
 const code=p=>readFileSync(fileURLToPath(new URL(p,root)),"utf8");
 const shared=code("kidflix/StudioPickers.tsx");
 assert.match(shared,/export function NativeImagePicker/);
 assert.match(shared,/NativeMediaVaultChooser/);
 for(const p of ["marketplace-imagery/Studio.tsx","kidflix/imagery/Studio.tsx"])
  assert.match(code(p),/onSelectMany=/);
});
