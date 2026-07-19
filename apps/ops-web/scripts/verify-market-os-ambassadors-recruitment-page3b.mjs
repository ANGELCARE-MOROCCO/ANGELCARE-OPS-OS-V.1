import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "components", "market-os", "ambassadors", "routes", "AmbassadorRecruitmentRoute.tsx");
let failures = 0;

function check(condition, message) {
  if (condition) console.log(`OK ${message}`);
  else { console.error(`FAIL ${message}`); failures += 1; }
}

check(fs.existsSync(target), "AmbassadorRecruitmentRoute.tsx exists");
if (fs.existsSync(target)) {
  const source = fs.readFileSync(target, "utf8");
  for (const token of [
    'data-ambassador-recruitment-route="real-sync-premium-v3"',
    "snapshot",
    "source.recruitment",
    "onNewCandidate",
    "/api/market-os/ambassadors/recruitment/stage",
    "/api/market-os/ambassadors/recruitment/${encodeURIComponent(id)}",
    "PipelineColumn",
    "CandidateDrawer",
    "InterviewModal",
    "Nouveaux candidats",
    "Préqualification",
    "Entretiens à venir",
    "Risques & documents",
    "Tous les candidats",
  ]) check(source.includes(token), `route contains ${token}`);

  for (const forbidden of [
    "buildDemoCandidates",
    "countFallback",
    "demo-1",
    "Amina Belkadi",
    "Mehdi Tahiri",
    "Nadia Rahmani",
    "Aucun candidat réel synchronisé",
    "Aucun jeu démo ni seed n’est injecté",
  ]) check(!source.includes(forbidden), `route does not contain ${forbidden}`);

  check(source.includes("useState<AnyRecord | null>(null)"), "candidate drawer starts with no fake selected dossier");
  check(source.includes("min-h-screen w-full"), "route fills available workspace width");
  check(!source.includes('mx-auto max-w-[1760px]'), "route has no centered max-width wrapper");
}

if (failures) {
  console.error(`Recruitment Page 3B verification failed with ${failures} issue(s).`);
  process.exit(1);
}
console.log("Ambassador Recruitment Page 3B verification passed.");
