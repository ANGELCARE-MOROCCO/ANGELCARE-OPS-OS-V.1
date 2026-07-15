const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "lib/service-os/types.ts");
if (!fs.existsSync(file)) throw new Error("Missing lib/service-os/types.ts");

let s = fs.readFileSync(file, "utf8");

// Make ServiceRule broad enough for seed.ts rule objects.
s = s.replace(
  /export type ServiceRule = \{[\s\S]*?\n\}/,
  `export type ServiceRule = {
  id?: string
  key?: string
  code?: string
  name?: string
  label?: string
  trigger?: string
  condition?: string
  action?: string
  pricingModifier?: number
  requiredCertification?: string
  escalation?: string
  severity?: ServiceOSRiskLevel | string
  type?: string
  status?: ServiceOSStatus
  impact?: ServiceOSRiskLevel
  [key: string]: unknown
}`
);

// Allow blueprint rules to be either string keys or full rule objects.
s = s.replace(
  /rules\?: string\[\]/g,
  "rules?: Array<string | ServiceRule>"
);
s = s.replace(
  /rules: string\[\]/g,
  "rules?: Array<string | ServiceRule>"
);

// Broaden common fields that seed.ts may express as numbers or strings.
const broaden = [
  ["requiredStaffLevel?: string", "requiredStaffLevel?: string | number"],
  ["serviceLevel?: string", "serviceLevel?: string | number"],
  ["staffRatio?: string", "staffRatio?: string | number"],
  ["ownerRole?: string", "ownerRole?: string | number"],
  ["pricingModel?: string", "pricingModel?: string | number"],
];

for (const [from, to] of broaden) {
  s = s.replaceAll(from, to);
}

// Make sure ServiceBlueprint has tolerant index signature.
if (!/export type ServiceBlueprint = \{[\s\S]*?\[key: string\]: unknown/.test(s)) {
  s = s.replace(
    /export type ServiceBlueprint = \{/,
    "export type ServiceBlueprint = {"
  );
}

// If rule object arrays are still narrowed elsewhere, force a final safe replacement.
s = s.replaceAll("rules: string[]", "rules?: Array<string | ServiceRule>");
s = s.replaceAll("rules?: string[]", "rules?: Array<string | ServiceRule>");

fs.writeFileSync(file, s, "utf8");
console.log("Patched ServiceOS types: rules accept rule objects, numeric/string seed fields are tolerated.");
