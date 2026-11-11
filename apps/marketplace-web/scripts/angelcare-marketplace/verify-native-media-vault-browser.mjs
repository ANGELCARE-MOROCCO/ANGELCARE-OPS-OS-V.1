import assert from "node:assert/strict";
import { createRequire } from "node:module";
const requireFromSEO = createRequire(new URL("../seo-power-ci/package.json", import.meta.url));
const puppeteer = requireFromSEO("puppeteer-core");
const origin = process.env.IMAGERY_R3_CANDIDATE_ORIGIN;
const chrome = process.env.CHROME_PATH;
assert.ok(origin?.startsWith("http://127.0.0.1:"), "A local candidate origin is required");
assert.ok(chrome, "Chrome browser must be installed");
const imageIds = [1,2,3,4,5].map(n => "aaaaaaaa-0000-4000-8000-" + String(n).padStart(12,"0"));
const assets = imageIds.map((id,i) => ({
  id, title: ["Care Montessori","Shapes and sorting","Early reading","Montessori kit","Excluded image"][i],
  fileName: ["care.png","shapes.png","reading.png","kit.png","excluded.png"][i],
  mime: "image/png",
  url: i % 2 ? "/angelcare-marketplace/families-world-r2/kits.jpg" : "/angelcare-marketplace/families-world-r2/care.jpg",
  status:"active", rights: i===3 ? "unverified" : "approved",
  processingState:"ready", alt:"Educational activity",
  size: 950000 + i*30000, width:1200, height:1200,
  category: i<2 ? "Learning" : "Stories",
  collection:"Montessori", folderId:"folder-ci", folderName:"Educational assets",
  language:"fr", tags:["preschool","learning"], usageCount:i, updatedAt:"2026-11-10",
}));
const browser=await puppeteer.launch({executablePath:chrome,headless:true,
  args:["--no-sandbox","--disable-dev-shm-usage","--disable-gpu"]});
const page=await browser.newPage();
page.setDefaultTimeout(20000);
try {
  await page.setRequestInterception(true);
  page.on("request", request => {
    const url=new URL(request.url());
    if (url.pathname==="/api/angelcare-marketplace/admin/digital-customer-experience") {
      const search=(url.searchParams.get("q") || "").toLowerCase();
      const rows=assets.filter(a => (a.fileName+" "+a.title).toLowerCase().includes(search));
      void request.respond({status:200,contentType:"application/json",
        body:JSON.stringify({data:{rows,total:rows.length,page:1,pageSize:24}})});
    } else void request.continue();
  });
  const response=await page.goto(origin+"/angelcare-media-vault-ci",{waitUntil:"domcontentloaded",timeout:30000});
  assert.equal(response?.status(),200,"CI-only picker fixture must resolve");
  await page.click("button[title],button"); // first/only button on CI fixture
  await page.waitForSelector('[data-native-media-vault="pro-max"]');
  await page.waitForSelector('article button[aria-label="Select Care Montessori"]');
  const columns=await page.$eval('[data-native-media-vault="pro-max"]',el =>
    ({columns:getComputedStyle(el.querySelector('main')).display,
      filters:!!el.querySelector('aside[aria-label="Media filters"]'),
      inspector:!!el.querySelector('aside'),
      tray:!!el.querySelector('footer')}));
  assert.equal(columns.filters,true);
  assert.equal(columns.inspector,true);
  assert.equal(columns.tray,true);
  const selectAndVerify = async (title, expectedCount) => {
    await page.click('article button[aria-label="Select ' + title + '"]');
    await page.waitForFunction(({title,expectedCount}) => {
      const selected = [...document.querySelectorAll('[data-native-media-vault="pro-max"] footer img')]
        .map(image => image.getAttribute("alt"));
      return selected.length === expectedCount && selected.includes(title);
    }, {timeout:8000}, {title,expectedCount});
    console.log("NATIVE_MEDIA_VAULT_SELECTED=" + title + ":" + expectedCount);
  };
  await selectAndVerify("Care Montessori",1);
  await selectAndVerify("Shapes and sorting",2);
  await selectAndVerify("Early reading",3);
  const selected=await page.$$eval('[data-native-media-vault="pro-max"] footer img',
    imgs => imgs.map(img => img.getAttribute("alt")));
  assert.deepEqual(selected,["Care Montessori","Shapes and sorting","Early reading"]);
  await page.click('button[aria-label="Move Early reading earlier"]');
  const reordered=await page.$$eval('[data-native-media-vault="pro-max"] footer img',
    imgs => imgs.map(img => img.getAttribute("alt")));
  assert.deepEqual(reordered,["Care Montessori","Early reading","Shapes and sorting"]);
  const capacity=await page.$eval('[data-native-media-vault="pro-max"]',el =>
    [...el.querySelectorAll('button[aria-label^="Select "]')].filter(button=>button.disabled).length);
  assert.ok(capacity>=1,"Additional assets must be unavailable at max selection");
  await page.click('button[aria-label="Remove Care Montessori"]');
  await page.click('article button[aria-label="Select Montessori kit"]');
  await page.click('button[class*="confirmButton"]');
  await page.waitForFunction(() =>
    !!document.querySelector("[data-media-picker-accepted]")?.textContent?.includes("000000000004"));
  const accepted=await page.$eval("[data-media-picker-accepted]",el=>el.textContent);
  assert.deepEqual(accepted.split(","),[imageIds[2],imageIds[1],imageIds[3]]);
  assert.equal(await page.$('[data-native-media-vault="pro-max"]'),null,"The dialog closes after confirm");
  console.log("NATIVE_MEDIA_VAULT_BROWSER=PASS");
} finally { await browser.close(); }
