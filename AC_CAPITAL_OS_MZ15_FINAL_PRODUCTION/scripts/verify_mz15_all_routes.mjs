import path from "node:path";
import { assertFile, assertIncludes, detectRoots, routes } from "./_lib.mjs";
const { repoRoot, opsRoot } = detectRoots();
for (const [route, folder, component] of routes) {
  const page = route ? path.join(opsRoot, "app", "(protected)", "ac-capital-os", route, "page.tsx") : path.join(opsRoot, "app", "(protected)", "ac-capital-os", "page.tsx");
  assertFile(page, repoRoot); assertIncludes(page, component, repoRoot); assertIncludes(page, "getCapitalActorContext", repoRoot);
  assertFile(path.join(opsRoot, "components", "ac-capital-os", "pages", folder, `${component}.tsx`), repoRoot);
}
console.log("MZ15_ALL_18_PROTECTED_ROUTES_VERIFIED");
