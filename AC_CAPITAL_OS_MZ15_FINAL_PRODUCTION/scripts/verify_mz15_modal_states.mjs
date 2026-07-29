import path from "node:path";
import { assertIncludes, detectRoots, routes } from "./_lib.mjs";
const { repoRoot, opsRoot }=detectRoots();
for(const [,folder,component] of routes){const file=path.join(opsRoot,"components","ac-capital-os","pages",folder,`${component}.tsx`);for(const token of ["useAction","ActionFeedback","Dialog"]){assertIncludes(file,token,repoRoot)}}
const action=path.join(opsRoot,"components","ac-capital-os","core","useAction.ts");
for(const token of ["validating","submitting","success","error","approval-required","disabled"]){assertIncludes(action,token,repoRoot)}
console.log("MZ15_MODAL_ASYNC_STATES_VERIFIED");
