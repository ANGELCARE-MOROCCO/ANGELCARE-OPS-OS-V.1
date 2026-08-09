import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
export const repoRoot=process.env.BULK2_REPO_ROOT||path.resolve(process.cwd(),"..","..");
export const opsRoot=path.join(repoRoot,"apps","ops-web");
export function p(rel){return path.join(opsRoot,rel)}
export function read(rel){const file=p(rel); if(!fs.existsSync(file)) throw new Error(`Missing file: ${rel}`); return fs.readFileSync(file,"utf8")}
export function assert(ok,msg){if(!ok) throw new Error(msg)}
export function contains(rel,tokens){const s=read(rel); for(const t of tokens) assert(s.includes(t),`${rel} missing contract token: ${t}`)}
export function forbids(rel,tokens){const s=read(rel); for(const t of tokens) assert(!s.includes(t),`${rel} contains prohibited token: ${t}`)}
export function exists(rel){assert(fs.existsSync(p(rel)),`Missing: ${rel}`)}
export function sha(file){return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex")}
export function pass(msg){console.log(`PASS — ${msg}`)}
