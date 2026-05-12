const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "lib/service-os/engine.ts");
if (!fs.existsSync(file)) throw new Error("Missing lib/service-os/engine.ts");

let s = fs.readFileSync(file, "utf8");

if (!s.includes("type NormalizedServiceBlueprint")) {
  s = s.replace(
    'import type { PricingInput, PricingResult, ServiceBlueprint, ServiceMission } from "./types"',
    'import type { PricingInput, PricingResult, ServiceBlueprint, ServiceMission, ServiceWorkflowStep, ServiceCityDeployment } from "./types"\n\ntype NormalizedServiceBlueprint = ServiceBlueprint & {\n  modules: string[]\n  cities: string[]\n  workflows: ServiceWorkflowStep[]\n  defaultWorkflow: string[]\n  rules: string[]\n  cityDeployments: ServiceCityDeployment[]\n  requiredDocuments: string[]\n  requiredCertifications: string[]\n  addons: string[]\n  automationRules: string[]\n  riskFlags: string[]\n}'
  );
}

if (!s.includes("function asStringArray")) {
  s = s.replace(
    'function normalizeCode(value: unknown): string {\n  return asText(value).toLowerCase().replace("#", "").trim()\n}\n',
    'function normalizeCode(value: unknown): string {\n  return asText(value).toLowerCase().replace("#", "").trim()\n}\n\nfunction asStringArray(value: unknown): string[] {\n  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []\n}\n\nfunction asWorkflowArray(value: unknown): ServiceWorkflowStep[] {\n  return Array.isArray(value) ? value as ServiceWorkflowStep[] : []\n}\n\nfunction asDeploymentArray(value: unknown): ServiceCityDeployment[] {\n  return Array.isArray(value) ? value as ServiceCityDeployment[] : []\n}\n\nfunction normalizeBlueprint(bp: ServiceBlueprint): NormalizedServiceBlueprint {\n  return {\n    ...bp,\n    modules: asStringArray(bp.modules),\n    cities: asStringArray(bp.cities),\n    workflows: asWorkflowArray(bp.workflows),\n    defaultWorkflow: asStringArray(bp.defaultWorkflow),\n    rules: asStringArray(bp.rules),\n    cityDeployments: asDeploymentArray(bp.cityDeployments),\n    requiredDocuments: asStringArray(bp.requiredDocuments),\n    requiredCertifications: asStringArray(bp.requiredCertifications),\n    addons: asStringArray(bp.addons),\n    automationRules: asStringArray(bp.automationRules),\n    riskFlags: asStringArray(bp.riskFlags),\n  }\n}\n'
  );
}

s = s.replace(
  /export function getServiceBlueprints\(\) \{\s*return angelCareServiceBlueprints as ServiceBlueprint\[\]\s*\}/,
  'export function getServiceBlueprints(): NormalizedServiceBlueprint[] {\n  return (angelCareServiceBlueprints as ServiceBlueprint[]).map(normalizeBlueprint)\n}'
);

fs.writeFileSync(file, s, "utf8");
console.log("patched lib/service-os/engine.ts: getServiceBlueprints now returns normalized blueprints with required arrays");
