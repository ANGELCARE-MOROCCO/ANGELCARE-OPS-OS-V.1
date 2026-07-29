import path from "node:path";
import { assert, assertFile, detectRoots, read, routes } from "./_lib.mjs";
const { repoRoot, opsRoot } = detectRoots();
const seen = new Set();
for (const [, folder, component] of routes) {
  const dir = path.join(opsRoot, "components", "ac-capital-os", "pages", folder);
  const page = path.join(dir, `${component}.tsx`); const css = path.join(dir, `${folder}.module.css`);
  assertFile(page, repoRoot); assertFile(css, repoRoot); assert(!seen.has(page), `duplicate dedicated component: ${page}`); seen.add(page);
  const source = read(page); assert(!source.includes("CapitalUniverseClient"), `${folder} still uses MZ14 universal façade`);
  assert(source.includes(`./${folder}.module.css`), `${folder} lacks its own CSS module`);
}
assert(seen.size === 18, `expected 18 dedicated page components, got ${seen.size}`);
console.log("MZ15_DEDICATED_PAGE_ARCHITECTURE_VERIFIED");
