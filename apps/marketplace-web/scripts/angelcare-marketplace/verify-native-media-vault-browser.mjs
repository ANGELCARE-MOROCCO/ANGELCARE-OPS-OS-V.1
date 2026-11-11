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
// The Media Vault is an approved full desktop workspace. Puppeteer's
// default 800x600 viewport hides the inspector and can scroll an asset
// underneath the sticky selection tray, creating misleading click results.
await page.setViewport({width:1600,height:960,deviceScaleFactor:1});
page.setDefaultTimeout(20000);
try {
  await page.setRequestInterception(true);
  const observedQueries=[];
  page.on("request", request => {
    const url=new URL(request.url());
    if (url.pathname==="/api/angelcare-marketplace/admin/digital-customer-experience") {
      const op=url.searchParams.get("op") || "native";
      observedQueries.push(Object.fromEntries(url.searchParams));
      if(op==="vault_folders") {
        void request.respond({status:200,contentType:"application/json",
          body:JSON.stringify({data:{
            rows:[{id:"folder-ci",name:"Educational assets",parent_id:null,status:"active",item_count:5}],
            total:1,page:1,pageSize:500,complete:true,
          }})});
        return;
      }
      const search=(url.searchParams.get("q") || "").toLowerCase();
      const rows=assets.filter(a => (a.fileName+" "+a.title).toLowerCase().includes(search));
      const pageSize=Number(url.searchParams.get("pageSize") || 100);
      void request.respond({status:200,contentType:"application/json",
        body:JSON.stringify({data:{rows,total:rows.length,inventoryTotal:assets.length,
          page:1,pageSize,matchedBeforePagination:true}})});
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
  const layout = await page.$eval('[data-native-media-vault="pro-max"]',el => {
    const inspector = el.querySelector('aside[class*="inspector"]');
    const tray = el.querySelector('footer');
    return {
      viewport: {width:innerWidth,height:innerHeight},
      inspectorVisible: !!inspector && getComputedStyle(inspector).display !== "none",
      trayVisible: !!tray && getComputedStyle(tray).display !== "none",
    };
  });
  console.log("NATIVE_MEDIA_VAULT_DESKTOP_LAYOUT=" + JSON.stringify(layout));
  assert.equal(layout.inspectorVisible,true,"Desktop inspector must be visibly rendered");
  await page.waitForSelector('select[aria-label="Native folder"] option[value="folder-ci"]');
  const folderLabel=await page.$eval('select[aria-label="Native folder"]', el =>
    [...el.options].find(o=>o.value==="folder-ci")?.textContent);
  assert.match(folderLabel,/Educational assets/,"Real native folder names must appear instead of IDs");
  async function selectWithServerResponse(selector,value,key,expected) {
    const next=page.waitForResponse(response => {
      if(!response.url().includes("/admin/digital-customer-experience")) return false;
      const url=new URL(response.url());
      return url.searchParams.get("op")==="native" &&
        (expected === null ? !url.searchParams.has(key) : url.searchParams.get(key)===expected);
    },{timeout:12000});
    await page.select(selector,value);
    await next;
  }
  for(const size of ["500","100","20","100"])
    await selectWithServerResponse('select[aria-label="Results per page"]',size,"pageSize",size);
  assert.ok(observedQueries.some(x=>x.pageSize==="500" && x.vault==="true"),
    "500 records per page must be requested from the server");
  assert.ok(observedQueries.some(x=>x.pageSize==="20" && x.vault==="true"),
    "20 records per page must be requested from the server");
  await selectWithServerResponse('select[aria-label="Native folder"]',"folder-ci","folderId","folder-ci");
  assert.ok(observedQueries.some(x=>x.folderId==="folder-ci"),
    "Folder must be filtered by canonical native folder ID on server");
  await selectWithServerResponse('select[aria-label="Native folder"]',"","folderId",null);
  await selectWithServerResponse('select[aria-label="Time window"]',"2","recentMinutes","2");
  assert.ok(observedQueries.some(x=>x.recentMinutes==="2"),
    "2-minute relative filter must reach the server");
  await selectWithServerResponse('select[aria-label="Time window"]',"","recentMinutes",null);
  console.log("NATIVE_MEDIA_VAULT_DIRECTORY_PAGES_RECENCY=PASS");
    const selectAndVerify = async (title, expectedCount) => {
    const selector = 'article button[aria-label="Select ' + title + '"]';
    const before = await page.$eval(selector, el => ({
      disabled:el.disabled,
      ineligible:el.closest('article')?.getAttribute('data-ineligible'),
      reason:el.closest('article')?.querySelector('[class*="blockReason"]')?.textContent || "",
    }));
    console.log("NATIVE_MEDIA_VAULT_BEFORE=" + title + ":" + JSON.stringify(before));
    assert.equal(before.disabled,false,title + ": asset must be selectable");
    await page.click(selector);
    try {
      await page.waitForFunction(({title,expectedCount}) => {
        const selected = [...document.querySelectorAll('[data-native-media-vault="pro-max"] footer img')]
          .map(image => image.getAttribute("alt"));
        return selected.length === expectedCount && selected.includes(title);
      }, {timeout:8000}, {title,expectedCount});
    } catch(error) {
      const detail=await page.$eval(selector, el => {
        const rect=el.getBoundingClientRect();
        const hit=document.elementFromPoint(rect.left + rect.width / 2,rect.top + rect.height / 2);
        return {
          disabled:el.disabled,pressed:el.getAttribute('aria-pressed'),
          ineligible:el.closest('article')?.getAttribute('data-ineligible'),
          hitTag:hit?.tagName,hitLabel:hit?.getAttribute('aria-label'),
          selected:[...document.querySelectorAll('[data-native-media-vault="pro-max"] footer img')]
            .map(img=>img.alt),
        };
      });
      console.error("NATIVE_MEDIA_VAULT_CLICK_FAILED=" + title + ":" + JSON.stringify(detail));
      throw error;
    }
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
