import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const desktopRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const projectRoot=path.resolve(desktopRoot,"../..");
const opsRoot=path.join(projectRoot,"apps","ops-web");
const read=(relative,base=desktopRoot)=>{const file=path.join(base,relative);if(!fs.existsSync(file))throw new Error(`Missing Mega ZIP 6 file: ${path.relative(projectRoot,file)}`);return fs.readFileSync(file,"utf8")};
const has=(content,needle,label)=>{if(!content.includes(needle))throw new Error(`Missing Mega ZIP 6 contract: ${label} (${needle})`)};
const packageJson=JSON.parse(read("package.json"));
if(packageJson.version!=="1.5.0")throw new Error("Mega ZIP 6 must set ANGELCARE Desktop version 1.5.0.");
if(!packageJson.scripts?.verify?.includes("verify-mega-zip-6.mjs"))throw new Error("Mega ZIP 6 verifier is not wired into npm run verify.");
const defaults=JSON.parse(read("config/defaults.json"));
if(defaults.desktopContractVersion!=="6.0.0")throw new Error("Desktop contract version must be 6.0.0.");
if(defaults.corporateBrowserPartition!=="persist:angelcare-corporate-browser")throw new Error("Corporate browser partition must be isolated.");
const desktopFiles=["src/runtime/station-controller.cjs","src/runtime/station-policy.cjs","src/runtime/station-unlock.cjs","src/runtime/corporate-browser.cjs","src/unlock-preload.cjs","src/unlock/index.html","src/unlock/styles.css","src/unlock/unlock.js","src/newtab/index.html","src/newtab/styles.css","src/newtab/newtab.js"];
for(const file of desktopFiles)read(file);
const opsFiles=[
 "lib/desktop-stations/types.ts","lib/desktop-stations/server.ts","components/whatsapp-os/CorporateStationAdmin.tsx",
 "app/api/desktop-stations/admin/overview/route.ts","app/api/desktop-stations/policies/effective/route.ts",
 "app/api/desktop-stations/policies/route.ts","app/api/desktop-stations/browser-policies/route.ts","app/api/desktop-stations/assignments/route.ts",
 "app/api/desktop-stations/unlock/credentials/route.ts","app/api/desktop-stations/unlock/recovery-codes/route.ts","app/api/desktop-stations/unlock/verify/route.ts",
 "app/api/desktop-stations/runtime/heartbeat/route.ts","app/api/desktop-stations/runtime/events/route.ts","app/api/desktop-stations/commands/route.ts",
 "app/api/desktop-stations/commands/[id]/acknowledge/route.ts","app/api/desktop-stations/tab-templates/route.ts","app/api/desktop-stations/url/validate/route.ts",
 "supabase/migrations/20260721_desktop_corporate_station_os_mega_zip6.sql","supabase/rollbacks/20260721_desktop_corporate_station_os_mega_zip6.rollback.sql"
];for(const file of opsFiles)read(file,opsRoot);
const main=read("src/main.cjs"),config=read("src/runtime/config.cjs"),preload=read("src/preload.cjs"),browser=read("src/runtime/corporate-browser.cjs"),policy=read("src/runtime/station-policy.cjs"),unlock=read("src/runtime/station-unlock.cjs"),station=read("src/runtime/station-controller.cjs"),shell=read("src/shell/shell.js"),shellHtml=read("src/shell/index.html"),forge=read("forge.config.cjs"),migration=read("supabase/migrations/20260721_desktop_corporate_station_os_mega_zip6.sql",opsRoot),admin=read("components/whatsapp-os/CorporateStationAdmin.tsx",opsRoot);
for(const [content,needle,label] of [
 [browser,'persist:angelcare-corporate-browser','separate corporate partition'],[browser,'angelcare-system','protected ANGELCARE tab'],[browser,'whatsapp-system','protected WhatsApp tab'],[browser,'createTab','tab creation'],[browser,'closeTab','tab closure'],[browser,'reopenClosed','closed-tab restoration'],[browser,'clamp(value, 0.6, 2)','60 to 200 percent zoom'],[policy,'BLOCKED_SCHEMES','dangerous scheme policy'],[policy,'evaluateUrl','URL normalization and enforcement'],[station,'ENTER_LOCKED_MODE','remote locked mode'],[station,'processedCommandIds','command replay prevention'],[station,'pendingEvents','offline event queue'],[station,'flushPendingEvents','offline event reconciliation'],[station,'acknowledgeCommand','command acknowledgement'],[unlock,'crypto.scryptSync','hashed PIN verifier'],[unlock,'lockoutUntil','unlock lockout'],[unlock,'verifyOffline','offline recovery'],[preload,'corporateTabs: Object.freeze','allowlisted corporate IPC'],[preload,'station: Object.freeze','allowlisted station IPC'],[main,'createStationController','native station controller integration'],[main,'stationAuthorizedQuit','quit bypass protection'],[shell,'renderTabs','corporate tab UI'],[shellHtml,'id="address-input"','address/search bar'],[admin,'Postes & Mode Corporate','admin station workspace'],[migration,'desktop_station_unlock_credentials','credential table'],[migration,'desktop_station_policy_versions','policy versioning'],[migration,'desktop_station_commands','station commands'],[migration,'desktop_station_effective_policy_id','deterministic policy resolution'],[forge,'LoadBrowserProcessSpecificV8Snapshot]: false','startup fuse stabilization'],[config,'!app.isPackaged || process.env.NODE_ENV === "development"','production URL logic'],[main,'saas_load_request_failed','guarded SaaS load failure'],[main,'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/','WhatsApp standards user agent'],[main,'y: toolbarHeight + yWithinSaas','horizontal toolbar bounds']])has(content,needle,label);
const forbidden=["nodeIntegration: true","contextIsolation: false","allowRunningInsecureContent: true","executeJavaScript(","rejectUnauthorized: false","webSecurity: false","ipcRenderer: ipcRenderer"];
for(const needle of forbidden)if([main,preload,browser,policy,unlock,station].join("\n").includes(needle))throw new Error(`Forbidden Mega ZIP 6 pattern detected: ${needle}`);
for(const needle of ["querySelector('[data-testid","click()","sendMessage","cookie export","cookies.get({ domain: \".whatsapp.com\" })"])if([browser,station,unlock].join("\n").includes(needle))throw new Error(`WhatsApp automation or cookie-export pattern detected: ${needle}`);
for(const file of ["src/main.cjs","src/preload.cjs","src/shell-preload.cjs","src/runtime/station-controller.cjs","src/runtime/station-policy.cjs","src/runtime/station-unlock.cjs","src/runtime/corporate-browser.cjs","src/unlock-preload.cjs","src/unlock/unlock.js","src/newtab/newtab.js"]){const result=spawnSync(process.execPath,["--check",path.join(desktopRoot,file)],{encoding:"utf8"});if(result.status!==0)throw new Error(`Node syntax failed for ${file}:\n${result.stderr}`)}
const policySmoke=spawnSync(process.execPath,[path.join(desktopRoot,"scripts","smoke-corporate-policy.mjs")],{encoding:"utf8"});if(policySmoke.status!==0)throw new Error(`Corporate policy smoke failed:
${policySmoke.stdout}
${policySmoke.stderr}`);
console.log("ANGELCARE Desktop Mega ZIP 6 Corporate Station OS 1.5.0 verified.");
console.log("Corporate tabs, station modes, native unlock, policy APIs, migration, remote commands, recovery and cumulative stabilizations are present.");
