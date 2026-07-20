import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
const defaults = JSON.parse(fs.readFileSync(path.join(root, "config", "defaults.json"), "utf8"));
const policy = require(path.join(root, "src", "runtime", "url-policy.cjs"));

const production = policy.parseHttpUrl(defaults.productionAppUrl);
const development = policy.parseHttpUrl(defaults.developmentAppUrl, { allowLocalHttp: true });
const allowedHosts = policy.parseAllowedHosts("", production);

if (!policy.isAllowedAppNavigation(`${production.origin}/email-os`, {
  isDevelopment: false,
  allowedHosts,
})) {
  throw new Error("Production URL policy smoke test failed.");
}

if (policy.isAllowedAppNavigation("http://example.com", {
  isDevelopment: false,
  allowedHosts,
})) {
  throw new Error("Insecure production navigation was incorrectly allowed.");
}

if (!policy.isAllowedAppNavigation(`${development.origin}/login`, {
  isDevelopment: true,
  allowedHosts: [development.hostname],
})) {
  throw new Error("Local development URL policy smoke test failed.");
}

console.log("ANGELCARE Desktop configuration smoke test passed.");
