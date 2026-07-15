const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "lib/service-os/types.ts");
if (!fs.existsSync(file)) throw new Error("Missing lib/service-os/types.ts");

let s = fs.readFileSync(file, "utf8");

const replacements = [
  ["  modules: string[]", "  modules?: string[]"],
  ["  cities: string[]", "  cities?: string[]"],
  ["  workflows: ServiceWorkflowStep[]", "  workflows?: ServiceWorkflowStep[]"],
  ["  defaultWorkflow: string[]", "  defaultWorkflow?: string[]"],
  ["  rules: string[]", "  rules?: string[]"],
  ["  cityDeployments: ServiceCityDeployment[]", "  cityDeployments?: ServiceCityDeployment[]"],
  ["  requiredDocuments: string[]", "  requiredDocuments?: string[]"],
  ["  requiredCertifications: string[]", "  requiredCertifications?: string[]"],
  ["  addons: string[]", "  addons?: string[]"],
  ["  automationRules: string[]", "  automationRules?: string[]"],
  ["  riskFlags: string[]", "  riskFlags?: string[]"],
];

for (const [from, to] of replacements) {
  s = s.replace(from, to);
}

fs.writeFileSync(file, s, "utf8");
console.log("Patched ServiceBlueprint enterprise arrays to optional fields.");
