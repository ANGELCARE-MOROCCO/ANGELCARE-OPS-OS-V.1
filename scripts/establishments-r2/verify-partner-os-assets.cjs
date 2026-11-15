/* Release gate: approved scenes must be restored exactly, never replaced silently. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const scenes = [
  ['direction-scene.png', 'cf2b19be80661bd95832c63eb7f17298c7549606', 1536, 1024],
  ['finance-scene.png', '646e838f521a096cb6fa42161452d616f60c6ee7', 1774, 887],
];
let failed = false;
for (const [name, expectedSha, width, height] of scenes) {
  const file = path.join(root, 'apps/marketplace-web/public/angelcare-marketplace/partner-os-r1', name);
  if (!fs.existsSync(file)) { console.error(`MISSING_APPROVED_ASSET ${name}`); failed = true; continue; }
  const bytes = fs.readFileSync(file);
  const sha = crypto.createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
  const valid = bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && bytes.readUInt32BE(16) === width && bytes.readUInt32BE(20) === height && sha === expectedSha;
  console[valid ? 'log' : 'error'](`${valid ? 'PASS' : 'APPROVED_ASSET_MISMATCH'} ${name}`);
  failed ||= !valid;
}
console.log(`PARTNER_OS_APPROVED_ASSETS=${failed ? 'BLOCKED' : 'PASS'}`);
process.exitCode = failed ? 1 : 0;
