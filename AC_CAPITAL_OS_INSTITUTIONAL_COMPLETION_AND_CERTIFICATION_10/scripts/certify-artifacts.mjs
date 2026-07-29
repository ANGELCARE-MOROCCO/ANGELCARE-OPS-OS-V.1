#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const base = (process.env.AC_CAPITAL_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const cookie = process.env.AC_CAPITAL_SESSION_COOKIE || "";
const artifactId = process.env.AC_CAPITAL_ARTIFACT_ID || "";
if (!cookie || !artifactId) { console.error("FAIL: Set AC_CAPITAL_SESSION_COOKIE and AC_CAPITAL_ARTIFACT_ID."); process.exit(1); }
const output = path.resolve(process.env.AC_CAPITAL_CERTIFICATION_OUTPUT || "./AC_CAPITAL_IC10_ARTIFACT_EVIDENCE");
await mkdir(output, { recursive: true });
const formats = ["pdf","docx","xlsx","csv","json","zip"];
const results = [];
for (const format of formats) {
  const response = await fetch(`${base}/api/ac-capital-os/artifacts/${artifactId}/download?format=${format}`, { headers: { Cookie: cookie } });
  const bytes = new Uint8Array(await response.arrayBuffer());
  const name = `${artifactId}.${format}`;
  await writeFile(path.join(output, name), bytes);
  let signature = true;
  if (format === "pdf") signature = new TextDecoder().decode(bytes.slice(0,5)) === "%PDF-";
  if (["docx","xlsx","zip"].includes(format)) signature = bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (format === "json") { try { JSON.parse(new TextDecoder().decode(bytes)); } catch { signature = false; } }
  if (format === "csv") signature = new TextDecoder().decode(bytes).includes(",");
  results.push({ format, httpStatus: response.status, byteSize: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), signature, passed: response.ok && bytes.length > 20 && signature });
}
await writeFile(path.join(output, "artifact-certification.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
if (results.some((item) => !item.passed)) process.exit(2);
console.log("AC_CAPITAL_OS_IC10_ARTIFACT_FORMATS_VERIFIED");
