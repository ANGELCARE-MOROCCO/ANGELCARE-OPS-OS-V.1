const fs = require("fs");
const path = require("path");

const root = process.cwd();
const compatFile = path.join(root, "lib/service-os/compat.ts");
const typesFile = path.join(root, "lib/service-os/types.ts");

if (!fs.existsSync(compatFile)) throw new Error("Missing lib/service-os/compat.ts");
if (!fs.existsSync(typesFile)) throw new Error("Missing lib/service-os/types.ts");

let compat = fs.readFileSync(compatFile, "utf8");

const deploymentBlock = `export const angelCareCityDeployments = [
  {
    id: "city-rabat-hybrid-care",
    blueprintCode: "S.H",
    serviceCode: "S.H",
    city: "Rabat",
    active: true,
    demandScore: 92,
    riskScore: 18,
    capacity: 85,
    capacityScore: 85,
    staffAvailable: 24,
    launchPriority: "high",
    notes: "Premium family, school support and hybrid home-care demand.",
  },
  {
    id: "city-casablanca-special-needs",
    blueprintCode: "S.SN",
    serviceCode: "S.SN",
    city: "Casablanca",
    active: true,
    demandScore: 96,
    riskScore: 34,
    capacity: 68,
    capacityScore: 68,
    staffAvailable: 31,
    launchPriority: "critical",
    notes: "High-volume institutional and special-needs market.",
  },
  {
    id: "city-marrakech-tourism-family",
    blueprintCode: "S.TF",
    serviceCode: "S.TF",
    city: "Marrakech",
    active: false,
    demandScore: 74,
    riskScore: 28,
    capacity: 42,
    capacityScore: 42,
    staffAvailable: 9,
    launchPriority: "medium",
    notes: "Tourism, hotel-family and temporary care opportunity.",
  },
]`;

compat = compat.replace(/export const angelCareCityDeployments = \[[\s\S]*?\]\s*$/m, deploymentBlock);
if (!compat.includes('blueprintCode: "S.H"')) {
  compat += "\n\n" + deploymentBlock + "\n";
}
fs.writeFileSync(compatFile, compat, "utf8");
console.log("patched lib/service-os/compat.ts city deployments");

let types = fs.readFileSync(typesFile, "utf8");

types = types.replace(
  /export type ServiceCityDeployment = \{[\s\S]*?\n\}/,
  `export type ServiceCityDeployment = {
  id?: string
  blueprintCode?: string
  serviceCode?: string
  city: string
  active: boolean
  capacity?: number
  capacityScore?: number
  demandScore?: number
  riskScore?: number
  launchPriority?: ServiceOSRiskLevel | string
  staffAvailable?: number
  notes?: string
}`
);

fs.writeFileSync(typesFile, types, "utf8");
console.log("patched lib/service-os/types.ts ServiceCityDeployment");
console.log("ServiceOS Fix 32 applied.");
