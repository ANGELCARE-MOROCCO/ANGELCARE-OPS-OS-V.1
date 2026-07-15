const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "lib/service-os/execution-engine.ts");
if (!fs.existsSync(file)) throw new Error("Missing lib/service-os/execution-engine.ts");

let src = fs.readFileSync(file, "utf8");

if (!src.includes("export const serviceMissions")) {
  src += `

export const serviceMissions = getServiceMissions()
`;
}

if (!src.includes("export function getOperationalSnapshot")) {
  src += `

export function getOperationalSnapshot() {
  return getOperationsSnapshot()
}
`;
}

if (!src.includes("export function getEscalations")) {
  src += `

export function getEscalations() {
  return getServiceMissions()
    .filter((mission) => (mission.riskScore ?? 0) >= 45 || mission.status === "incident")
    .map((mission) => ({
      id: \`escalation-\${mission.id}\`,
      missionId: mission.id,
      serviceCode: mission.serviceCode,
      city: mission.city,
      clientName: mission.clientName,
      riskScore: mission.riskScore ?? 0,
      status: mission.status ?? "assigned",
      priority: (mission.riskScore ?? 0) >= 70 ? "critical" : "high",
      action: "Operations manager review required",
    }))
}
`;
}

fs.writeFileSync(file, src, "utf8");
console.log("patched lib/service-os/execution-engine.ts with legacy operations API exports");
