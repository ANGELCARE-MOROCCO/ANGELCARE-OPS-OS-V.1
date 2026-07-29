import path from "node:path";
import { assertIncludes, detectRoots, routes } from "./_lib.mjs";
const { repoRoot, opsRoot }=detectRoots();
for(const [,folder,component] of routes){const file=path.join(opsRoot,"components","ac-capital-os","pages",folder,`${component}.tsx`);assertIncludes(file,"Drawer",repoRoot);assertIncludes(file,"FactGrid",repoRoot)}
console.log("MZ15_SPECIALIZED_DRAWERS_VERIFIED");
