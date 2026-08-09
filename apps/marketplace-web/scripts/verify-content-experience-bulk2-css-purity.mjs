import {assert,read,pass} from "./_bulk2-verifier-helpers.mjs";
const css=read("components/market-os/content-command/experience-bulk2/bulk2-experience.module.css");
assert(!/@media[^{}]*prefers-reduced-motion[^{}]*\{\s*\*/s.test(css),"Reduced-motion selector is not locally scoped");
const refs=new Set(); const re=/styles(?:\.|\[\"?)([A-Za-z_][\w-]*)/g;
for(const file of ["Bulk2Shared.tsx","Bulk2ObservatoryWorkspace.tsx","Bulk2StrategyWorkspace.tsx","Bulk2BriefingWorkspace.tsx","Bulk2PlanningWorkspace.tsx","Bulk2BrandGovernanceWorkspace.tsx"]){let m;const s=read(`components/market-os/content-command/experience-bulk2/${file}`);while((m=re.exec(s))) refs.add(m[1]);}
const classes=new Set([...css.matchAll(/\.([A-Za-z_][\w-]*)/g)].map(m=>m[1]));
const missing=[...refs].filter(x=>!classes.has(x)&&!x.includes("${"));assert(!missing.length,`Missing CSS classes: ${missing.join(", ")}`);
pass(`${refs.size} static CSS-module references resolve and reduced motion is locally scoped`);
