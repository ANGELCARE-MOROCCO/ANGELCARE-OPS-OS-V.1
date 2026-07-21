import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const directory = path.resolve(process.argv[2] || path.join(root, "out", "make"));
if (!fs.existsSync(directory)) { console.error(`Artifact directory not found: ${directory}`); process.exit(1); }
const files = [];
function walk(dir) { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const full = path.join(dir, entry.name); if (entry.isDirectory()) walk(full); else if (!entry.name.endsWith(".sha256") && !entry.name.endsWith("CHECKSUMS.sha256")) files.push(full); } }
walk(directory);
const lines = files.sort().map((file) => `${crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex")}  ${path.relative(directory, file).replace(/\\/g, "/")}`);
const output = path.join(directory, "CHECKSUMS.sha256");
fs.writeFileSync(output, `${lines.join("\n")}\n`);
console.log(`Wrote ${lines.length} checksums to ${output}`);
