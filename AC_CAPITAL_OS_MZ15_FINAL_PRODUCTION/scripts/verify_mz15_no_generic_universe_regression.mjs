import path from "node:path";
import { assert, detectRoots, read, routes } from "./_lib.mjs";
const { opsRoot } = detectRoots();
for (const [route, folder, component] of routes) {
  const wrapper = route ? path.join(opsRoot,"app","(protected)","ac-capital-os",route,"page.tsx") : path.join(opsRoot,"app","(protected)","ac-capital-os","page.tsx");
  const page = path.join(opsRoot,"components","ac-capital-os","pages",folder,`${component}.tsx`);
  for (const file of [wrapper,page]) {
    const source = read(file);
    assert(!source.includes("components/ac-capital-os/universe"), `${file} imports legacy MZ14 universe`);
    assert(!source.includes("workspaceKey=\"" + folder + "\" />"), `${file} appears to be a universal-key façade`);
  }
}
console.log("MZ15_NO_GENERIC_UNIVERSE_REGRESSION_VERIFIED");
