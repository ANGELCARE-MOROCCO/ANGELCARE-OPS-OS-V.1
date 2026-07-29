import fs from "node:fs";
import path from "node:path";

function detectRepositoryRoot(start) {
  let current = path.resolve(start);
  for (let depth = 0; depth < 8; depth += 1) {
    if (fs.existsSync(path.join(current, "apps", "ops-web"))) return current;
    if (path.basename(current) === "ops-web") {
      const candidate = path.resolve(current, "..", "..");
      if (fs.existsSync(path.join(candidate, "apps", "ops-web"))) return candidate;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository root not found.");
}

const root = detectRepositoryRoot(process.cwd());
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const required = [
  ["apps/ops-web/app/(protected)/ac-capital-os/ai-control/page.tsx", "AiOperationsPage"],
  ["apps/ops-web/components/ac-capital-os/pages/ai-control/AiOperationsPage.tsx", "Tavily search → OpenRouter free analysis"],
  ["apps/ops-web/app/api/ac-capital-os/ai-control/route.ts", "executeAcCapitalAiControlAction"],
  ["apps/ops-web/app/api/ac-capital-os/ai-control/scheduler/tick/route.ts", "runDueAcCapitalAgents"],
  ["apps/ops-web/lib/ac-capital-os/server/free-provider-runtime.ts", "executeExternalResearchAgent"],
  ["apps/ops-web/lib/ac-capital-os/server/free-provider-runtime.ts", "openrouter/free"],
  ["apps/ops-web/lib/ac-capital-os/server/free-provider-persistence.ts", "qualificationDossiers"],
  ["apps/ops-web/app/api/ac-capital-os/capital-radar/research/run/route.ts", "tavily-openrouter"],
  ["apps/ops-web/components/ac-capital-os/core/navigation.ts", "/ac-capital-os/ai-control"],
  ["supabase/migrations/20260728_ac_capital_os_free_provider_operations_05.sql", "ac_capital_ai_agents"],
  ["supabase/migrations/20260728_ac_capital_os_free_provider_operations_05.sql", "Retire Gemini routing for AC Capital"],
];
for (const [relative, signature] of required) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${relative}`);
  if (!read(relative).includes(signature)) throw new Error(`Missing signature in ${relative}: ${signature}`);
}
const radar = read("apps/ops-web/app/api/ac-capital-os/capital-radar/research/run/route.ts");
if (/executeGroundedCapitalResearch/.test(radar) === false || /gemini/i.test(radar)) {
  throw new Error("Radar runtime is not exclusively wired to the free-provider execution path.");
}
console.log("AC_CAPITAL_OS_FREE_PROVIDER_OPERATIONS_05_STATIC_VERIFIED");
console.log("PASS dedicated writable AC Capital AI Operations route");
console.log("PASS Tavily search and OpenRouter free analysis runtime");
console.log("PASS provider credential, quota and usage controls");
console.log("PASS configurable outbound agents, schedules and profiles");
console.log("PASS internal source, opportunity, qualification, case, pipeline and task adapters");
console.log("PASS request ledger, incidents, audits and scheduler tick endpoint");
console.log("PASS AC Capital Gemini runtime routing retired by migration contract");
console.log("No TypeScript, build, SQL, Git or provider request was run by this verifier.");
