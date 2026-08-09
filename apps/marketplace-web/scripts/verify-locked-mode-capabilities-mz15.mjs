import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const require=createRequire(import.meta.url); let ts; try{ts=require("typescript")}catch{ts=require("/usr/local/lib/node_modules/typescript")}
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),".."); const read=r=>fs.readFileSync(path.join(root,r),"utf8"); const assert=(c,m)=>{if(!c)throw new Error(m)};
const files=["components/whatsapp-os/CorporateStationAdmin.tsx","components/whatsapp-os/WhatsAppGovernanceControlPlane.tsx","lib/desktop-stations/server.ts","lib/whatsapp-desktop/control-plane-server.ts","lib/whatsapp-desktop/control-plane.ts","lib/desktop/release.ts"];
for(const f of files) assert(fs.existsSync(path.join(root,f)),`MISSING:${f}`);
const admin=read(files[0]); assert(!admin.includes("Corporate Locked bloque AC+"),"LOCKED_AUTO_BLOCK_WARNING_PRESENT"); assert(admin.includes("AC+ et Écrans restent disponibles uniquement selon les autorisations"),"LOCKED_INDEPENDENCE_INFO_MISSING"); assert(!admin.includes('e.target.value==="locked"?{ac_plus_enabled:false,split_enabled:false}'),"LOCKED_MODE_STILL_MUTATES_CAPABILITIES");
const drawer=read(files[1]); assert(!drawer.includes("Bloqué par Locked"),"DRAWER_LOCKED_BLOCK_LABEL_PRESENT"); assert(!drawer.includes('disabled={locked'),"DRAWER_LOCKED_DISABLE_PRESENT"); assert(!drawer.includes('desired_mode: event.target.value, ...(event.target.value === "locked"'),"DRAWER_LOCKED_MUTATION_PRESENT");
const station=read(files[2]); for(const marker of ['ac_plus_allowed_modes: ["standard", "focus", "locked"]','split_allowed_modes: ["standard", "focus", "locked"]']) assert(station.includes(marker),`STATION_POLICY_MARKER_MISSING:${marker}`);
const desiredServer=read(files[3]); assert(!desiredServer.includes('desiredMode === "locked" ? false'),"DESIRED_STATE_LOCKED_FORCE_OFF_PRESENT");
const desired=read(files[4]); assert(!desired.includes('policy?.mode !== "locked"'),"NORMALIZATION_LOCKED_FORCE_OFF_PRESENT"); assert(desired.includes('"1.7.3"'),"MINIMUM_DESKTOP_VERSION_NOT_1_7_3");
const release=read(files[5]); for(const marker of ['version: "1.7.3"','contract: "11.3.0"','buildNumber: 173']) assert(release.includes(marker),`RELEASE_MARKER_MISSING:${marker}`);
for(const f of files){const out=ts.transpileModule(read(f),{fileName:f,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.Preserve,isolatedModules:true}}); const errs=(out.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error); assert(!errs.length,`TYPESCRIPT_ISOLATED_ERROR:${f}:${errs.map(d=>ts.flattenDiagnosticMessageText(d.messageText," ")).join(" | ")}`)}
console.log("MZ15_WEB_LOCKED_MODE_CAPABILITY_INDEPENDENCE_VERIFIED");
