import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { galleryURL, imageReferenceIssue, publicHost } from "../../angelcare-marketplace/marketplace-imagery/asset-url.ts";
const asset = "123e4567-e89b-42d3-a456-426614174000";
const other = "123e4567-e89b-42d3-a456-426614174001";
const path = "/api/angelcare-marketplace/media/" + asset + "/angelcare-hero-9d3e2a10.png";
test("official native media route and all image variants", () => {
  for (const suffix of ["","?variant=desktop","?variant=tablet","?variant=mobile","?variant=square"]) {
    assert.equal(galleryURL(path + suffix),true);
    assert.equal(imageReferenceIssue(path + suffix,asset),null);
  }
});
test("native HTTPS route and matching identity",()=>{
  assert.equal(imageReferenceIssue("https://my.angelcarehub.com"+path,asset),null);
  assert.match(imageReferenceIssue(path,other),/does not belong/);
  assert.match(imageReferenceIssue(path,"bad-id"),/asset ID/);
});
test("never allow arbitrary API paths, traversal or unsafe media variants",()=>{
  const rejected=[
    "/api/angelcare-marketplace/admin/media",
    "/api/angelcare-marketplace/media/invalid/image.png",
    "/api/angelcare-marketplace/media/"+asset,
    path+"?token=secret",path+"?variant=bad",path+"?variant=mobile&admin=true",path+"#fragment",
    "//evil.example/image.png",
    "/api%2Fangelcare-marketplace%2Fmedia%2F"+asset+"%2Fimage.png",
    "/api/angelcare-marketplace/media/"+asset+"/%2e%2e%2fsecret.png",
    "/api/angelcare-marketplace/media/"+asset+"/../secret.png",
    "/api/angelcare-marketplace/media/"+asset+"/file%20name.png"
  ];
  for(const uri of rejected)assert.equal(galleryURL(uri),false,uri);
});
test("keep preexisting safe editorial images and HTTPS vault/CDN media",()=>{
  assert.equal(galleryURL("/assets/editorial/hero.png"),true);
  assert.equal(galleryURL("/images/home.jpg"),true);
  assert.equal(imageReferenceIssue("https://cdn.example.org/images/hero.png",asset),null);
});
test("reject unsupported schemes and malformed URLs",()=>{
  for(const uri of [
    "http://cdn.example.org/image.png","javascript:alert(1)","data:image/svg+xml,abc",
    "https://user:pass@cdn.example.org/image.png","https://cdn.example.org/image.png#fragment",
    "https://cdn.example.org/image.png%0A","/assets/../admin.json"
  ])assert.equal(galleryURL(uri),false,uri);
  assert.match(imageReferenceIssue(undefined,asset),/delivery URL/);
  assert.equal(galleryURL(null),false);
});
test("public hostname security contract unchanged",()=>{
  assert.equal(publicHost("MY.ANGELCAREHUB.COM"),"my.angelcarehub.com");
  assert.throws(()=>publicHost("https://my.angelcarehub.com"));
});
test("edit, upload, mobile, twelve-image and authoritative service guards are wired",()=>{
  const dir=new URL("../../angelcare-marketplace/marketplace-imagery/",import.meta.url);
  const model=readFileSync(new URL("model.ts",dir),"utf8");
  const studio=readFileSync(new URL("Studio.tsx",dir),"utf8");
  const service=readFileSync(new URL("service.ts",dir),"utf8");
  assert.match(model,/imageReferenceIssue\(a\.src,\s*a\.assetId\)/);
  assert.match(model,/imageReferenceIssue\(a\.mobile,\s*a\.mobileAssetId\)/);
  assert.match(model,/v\.images\.length > 12/);
  assert.match(studio,/imageReferenceIssue\(asset\?\.url,\s*asset\?\.id\)/);
  assert.match(studio,/imageReferenceIssue\(asset\.url,\s*asset\.id\)/);
  assert.match(service,/imageReferenceIssue\(a\.url,\s*id\)/);
  assert.match(service,/assets\.get\(image\.assetId\)\?\.url !== image\.src/);
  assert.match(service,/assets\.get\(image\.mobileAssetId\)\?\.url !== image\.mobile/);
});
