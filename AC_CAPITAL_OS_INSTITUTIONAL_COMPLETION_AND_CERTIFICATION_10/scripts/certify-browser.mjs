#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { console.error("FAIL: Playwright is not installed in this project. Install/use the project's accepted browser-test dependency before running this optional live certification runner."); process.exit(1); }
const base = (process.env.AC_CAPITAL_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const cookieHeader = process.env.AC_CAPITAL_SESSION_COOKIE || "";
if (!cookieHeader) { console.error("FAIL: Set AC_CAPITAL_SESSION_COOKIE."); process.exit(1); }
const output = path.resolve(process.env.AC_CAPITAL_CERTIFICATION_OUTPUT || "./AC_CAPITAL_IC10_BROWSER_EVIDENCE");
await mkdir(output, { recursive: true });
const routes = ["orchestrator","radar","funders","qualification","data-room","cases","pipeline","approvals","coordinator","artifacts","reports","doctrine","strategy","learning","ai-control","certification"];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 1100 } });
const cookies = cookieHeader.split(/;\s*/).map((part) => { const index = part.indexOf("="); return { name: part.slice(0,index), value: part.slice(index+1), url: base }; }).filter((item) => item.name && item.value);
await context.addCookies(cookies);
const results = [];
for (const key of routes) {
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  const response = await page.goto(`${base}/ac-capital-os/${key}`, { waitUntil: "networkidle", timeout: 60000 });
  const body = await page.locator("body").innerText().catch(() => "");
  const failureTokens = ["Runtime Error","Unhandled Runtime Error","LOAD_FAILED","Cannot read properties of undefined","Application error"];
  const failures = failureTokens.filter((token) => body.includes(token));
  const screenshot = path.join(output, `${key}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  results.push({ key, url: page.url(), httpStatus: response?.status() || 0, title: await page.title(), consoleErrors, failures, screenshot, passed: Boolean(response?.ok()) && failures.length === 0 && consoleErrors.length === 0 });
  await page.close();
}
await browser.close();
await writeFile(path.join(output, "browser-certification.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
if (results.some((item) => !item.passed)) process.exit(2);
console.log("AC_CAPITAL_OS_IC10_BROWSER_ROUTES_VERIFIED");
console.log("NOTE: Human visual-quality, keyboard and workflow-depth evidence must still be recorded in the Certification workspace.");
