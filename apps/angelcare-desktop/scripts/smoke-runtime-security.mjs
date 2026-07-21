import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { sanitizeFilename, sanitizeUrl, sanitizeValue, canonicalJson } = require("../src/runtime/security.cjs");
const { compareVersions, validateManifest } = require("../src/runtime/update-manager.cjs");
const { createStoredZip } = require("../src/runtime/diagnostics.cjs");

assert.equal(sanitizeFilename("../../evil.exe"), "evil.exe");
assert.equal(sanitizeUrl("https://web.whatsapp.com/send?phone=2126&text=secret"), "https://web.whatsapp.com/send");
assert.equal(sanitizeValue({ accessToken: "abc", nested: { password: "x" } }).accessToken, "[REDACTED]");
assert.equal(canonicalJson({ b: 2, a: 1 }), '{"a":1,"b":2}');
assert.equal(compareVersions("1.4.0", "1.3.0"), 1);
assert.equal(compareVersions("1.4.0", "1.4.0"), 0);
const runtime = { releaseChannel: "stable", updateAllowedHosts: ["opsmanagement.angelcarehub.com"] };
const manifest = validateManifest({ version: "1.4.1", channel: "stable", platforms: { [process.platform]: { [process.arch]: { url: "https://opsmanagement.angelcarehub.com/update.bin", sha256: "a".repeat(64), size: 10 } } } }, runtime, "1.4.0");
assert.equal(manifest.newer, true);
const zip = createStoredZip([{ name: "test.txt", data: "ok" }]);
assert.equal(zip.readUInt32LE(0), 0x04034b50);
console.log("ANGELCARE Desktop Mega ZIP 5 runtime security smoke test passed.");
