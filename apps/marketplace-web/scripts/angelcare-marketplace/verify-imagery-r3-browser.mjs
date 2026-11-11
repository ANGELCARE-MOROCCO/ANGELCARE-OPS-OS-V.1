import assert from "node:assert/strict";
import { createRequire } from "node:module";
const requireFromSEO = createRequire(new URL("../seo-power-ci/package.json", import.meta.url));
const puppeteer = requireFromSEO("puppeteer-core");

const origin = process.env.IMAGERY_R3_CANDIDATE_ORIGIN;
const chrome = process.env.CHROME_PATH;
assert.ok(origin?.startsWith("http://127.0.0.1:"), "Use a local CI candidate origin.");
assert.ok(chrome, "Chrome browser is required for real runtime testing.");
const slot = "home.visual.living-commerce-homepage.2.care";
const kitsSlot = "home.visual.living-commerce-homepage.2.kits";
const selector = '[data-imagery-slot="' + slot + '"]';
const browser = await puppeteer.launch({
  executablePath: chrome, headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
let executed = 0;
async function testCase(name, fn, reduced = false) {
  const page = await browser.newPage();
  page.setDefaultTimeout(18000);
  try {
    if (reduced) await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
    const response = await page.goto(origin + "/angelcare-imagery-r3-ci?case=" + name,
      { waitUntil: "domcontentloaded", timeout: 30000 });
    assert.equal(response?.status(), 200, "The CI-only candidate fixture must be running.");
    const chosenSelector = name === "badges-kits"
      ? '[data-imagery-slot="' + kitsSlot + '"]' : selector;
    await page.waitForSelector(chosenSelector + '[data-imagery-count]', { timeout: 20000 });
    const count = await page.$eval(chosenSelector, el => Number(el.getAttribute("data-imagery-count")));
    await fn(page, count);
    executed++;
    console.log("IMAGERY_R3_BROWSER_PASS=" + name);
  } finally { await page.close(); }
}
async function waitFrame(page, expected) {
  await page.waitForFunction(([selector, expected]) => {
    const el = document.querySelector(selector);
    return el && Number(el.getAttribute("data-imagery-frame")) === expected;
  }, { timeout: 14000 }, [selector, expected]);
}
try {
  // A real React component hydrates after the original editorial image.
  await testCase("three", async (page, count) => {
    assert.equal(count, 3);
    assert.equal(await page.$("[data-r3-external-controls]"), null,
      "Arrows must be absent when the admin Visitor controls toggle is off.");
    await page.hover("[data-r3-promotion-link]"); // Hovering over a link cannot freeze autoplay.
    await waitFrame(page, 2);
    const readable = await page.$eval(selector, el =>
      !!el.querySelector("img") && el.getAttribute("data-imagery-count") === "3");
    assert.equal(readable, true);
  });
  await testCase("failed-second", async (page, count) => {
    assert.equal(count, 3);
    await waitFrame(page, 3); // Broken second image is skipped by the real browser runtime.
    const failed = await page.$eval(selector,
      el => Number(el.getAttribute("data-imagery-failed")));
    assert.ok(failed >= 1, "Decode failure must become observable React state.");
  });
  await testCase("broken-original", async (page, count) => {
    assert.equal(count, 3);
    await page.waitForFunction(sel => {
      const el = document.querySelector(sel);
      return el && !!el.querySelector("img[class*=current]");
    }, { timeout: 15000 }, selector);
    assert.equal(await page.$(selector) !== null, true,
      "The wrapper must not remove published imagery after the original image fails.");
  });
  await testCase("all-failed", async (page, count) => {
    assert.equal(count, 3);
    await page.waitForFunction(sel => Number(
      document.querySelector(sel)?.getAttribute("data-imagery-failed")) === 3,
      { timeout: 15000 }, selector);
    const state = await page.$eval(selector, el => ({
      visible: getComputedStyle(el).display !== "none",
      fallback: [...el.querySelectorAll("img")].some(img => img.naturalWidth > 0),
    }));
    assert.equal(state.visible && state.fallback, true,
      "All-image failure must retain the good original fallback.");
  });
  await testCase("twelve", async (page, count) => {
    assert.equal(count, 12);
    await waitFrame(page, 2);
  });
  await testCase("three-controls", async (page, count) => {
    assert.equal(count, 3);
    await new Promise(resolve => setTimeout(resolve, 1850));
    const first = await page.$eval(selector, el => el.getAttribute("data-imagery-frame"));
    assert.equal(first, "1", "Reduced-motion preference must suppress forced animation.");
    await page.click('[data-r3-external-controls] button[aria-label="Next image"]');
    await waitFrame(page, 2);
    const nav = await page.$eval("[data-r3-promotion-link]", el => el.getAttribute("href"));
    assert.equal(nav, "/angelcare-marketplace/fr/home-services",
      "Manual navigation cannot replace the promotion destination.");
  }, true);

  // Regression for the actual production failure: homepage promotional text
  // rules MUST NOT color the entire absolute badge layer above an image.
  for (const name of ["badges-empty", "badges-care", "badges-kits"]) {
    await testCase(name, async (page, count) => {
      assert.equal(count, 3);
      const active = name === "badges-kits" ? kitsSlot : slot;
      const art = '[data-imagery-slot="' + active + '"][data-imagery-art]';
      await page.waitForSelector(art + ' > span[aria-hidden="true"]', { timeout: 15000 });
      await page.waitForFunction(sel => {
        const el = document.querySelector(sel);
        return !!el?.querySelector('img[class*="current"]');
      }, { timeout: 15000 }, art);
      const styles = await page.$eval(art, el => {
        const layer = [...el.children].find(child =>
          child.tagName === "SPAN" && child.getAttribute("aria-hidden") === "true" &&
          (!!child.querySelector("[data-shape]") || child.className.includes("badges"))
        );
        return {
          layerBackground: layer ? getComputedStyle(layer).backgroundColor : "missing",
          badgeBackground: layer?.querySelector("[data-shape]")
            ? getComputedStyle(layer.querySelector("[data-shape]")).backgroundColor : null,
          currentVisible: [...el.querySelectorAll("img")].some(img =>
            img.className.includes("current") && img.naturalWidth > 0
          ),
        };
      });
      assert.ok(["rgba(0, 0, 0, 0)", "transparent"].includes(styles.layerBackground),
        name + ": badges overlay MUST be transparent, got " + styles.layerBackground);
      assert.equal(styles.currentVisible, true, name + ": image must remain visible");
      if (name !== "badges-empty") {
        assert.equal(styles.badgeBackground, "rgb(190, 18, 60)",
          "The badge chip itself should keep its own colored background.");
      }
      const label = await page.$eval("[data-r3-promo-label]",
        el => getComputedStyle(el).backgroundColor);
      assert.equal(label, name === "badges-kits" ? "rgb(255, 209, 51)" : "rgb(244, 45, 120)",
        name + ": editorial promotional label colors must remain intact");
      await page.hover("[data-r3-promotion-link]");
      await page.waitForFunction(([sel, first]) =>
        Number(document.querySelector(sel)?.getAttribute("data-imagery-frame")) !== first,
        { timeout: 7500 }, [art, 1]);
    });
  }
  console.log("IMAGERY_R3_BROWSER_EXECUTED=" + executed);
  assert.equal(executed, 9);
} finally { await browser.close(); }
