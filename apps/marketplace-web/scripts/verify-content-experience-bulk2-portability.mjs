import {assert,read,pass} from "./_bulk2-verifier-helpers.mjs";
const t=read("tsconfig.market-os-content-experience-bulk2.json");
const forbidden=["/"+"mnt/data","/Users/"+"user","modules"+".d.ts","bulk2"+"_build"];
for(const token of forbidden) assert(!t.includes(token),`Non-portable tsconfig token: ${token}`);
assert(t.includes('"extends": "./tsconfig.json"'),"Bulk 2 tsconfig must extend repository tsconfig");
assert(t.includes('"noEmit": true'),"Bulk 2 tsconfig must be noEmit");
pass("repository-relative Bulk 2 TypeScript configuration is portable");
