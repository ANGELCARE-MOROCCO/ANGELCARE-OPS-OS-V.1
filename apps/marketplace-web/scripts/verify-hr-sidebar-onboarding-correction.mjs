import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = {
  shell: path.join(root, "components/hr-shell/HRModuleShell.tsx"),
  nav: path.join(root, "lib/hr-shell/navigation.ts"),
  legacyNav: path.join(root, "lib/hr-production/permissions-navigation.ts"),
  page: path.join(root, "app/(protected)/hr/onboarding/page.tsx"),
  center: path.join(root, "app/(protected)/hr/onboarding/_components/OnboardingCommandCenter.tsx"),
  action: path.join(root, "app/(protected)/hr/onboarding/_actions.ts"),
  recruitment: path.join(root, "lib/hr-recruitment/interviews/server.ts"),
  onboarding: path.join(root, "lib/hr-onboarding/server.ts"),
};

const source = Object.fromEntries(Object.entries(files).map(([key, value]) => [key, fs.readFileSync(value, "utf8")]));
const failures = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

expect((source.shell.match(/<HRSovereignSidebar\b/g) || []).length === 1, "HR shell must render exactly one premium sidebar.");
expect(!source.center.includes("const navGroups"), "Onboarding must not define a duplicate navigation registry.");
expect(!source.center.includes('<aside className="hidden">'), "Onboarding must not render the obsolete hidden sidebar.");

for (const forbidden of ["Personnel", "Postes", "Contrats", "Ouvertures de poste", "Staff registry", "Positions", "Contracts", "Job openings", "Workforce registry"]) {
  expect(!source.nav.includes(`label: "${forbidden}"`) && !source.legacyNav.includes(`label: '${forbidden}'`), `Forbidden top-level navigation label remains: ${forbidden}`);
}
expect(source.nav.includes('label: "Questionnaires"'), "Questionnaires must remain in the premium navigation registry.");
expect(source.page.includes("getInterviewCommandSnapshot"), "Onboarding page must load canonical recruitment snapshot data.");
expect(source.center.includes("candidateQuery") && source.center.includes("selectedCandidateId"), "Modal must provide a canonical candidate selector.");
expect(source.center.includes("interview_id: selectedInterview?.id"), "Modal must submit the selected canonical interview identifier.");
expect(source.center.includes("candidate_id: selectedCandidate.id"), "Modal must submit the selected canonical candidate identifier.");
expect(source.center.includes("opening_id: selectedOpening?.id"), "Modal must submit the canonical opening identifier when available.");
expect(source.center.includes("journeyBlockedByDuplicate"), "Modal must surface duplicate journey protection.");
for (const phase of ["Offer & Acceptance", "Pre-Boarding", "Document Collection", "Orientation", "Training & Setup", "Integration", "Probation & Review"]) {
  expect(source.center.includes(`"${phase}"`), `Lifecycle phase missing: ${phase}`);
}
expect(!source.center.includes("localStorage") && !source.center.includes("sessionStorage"), "Browser storage must not be used.");
expect(source.recruitment.includes("getInterviewCommandSnapshot"), "Canonical interview service must remain the source of truth.");
expect(source.onboarding.includes('executeOperation("journey.create"'), "Existing onboarding creation authority must remain in use.");
expect(source.action.includes("createOnboardingJourney"), "Existing onboarding server action must remain in use.");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("HR sidebar/onboarding static acceptance: PASS");
console.log("Premium sidebar: 1");
console.log("Forbidden top-level navigation entries: absent");
console.log("Canonical candidate/interview/opening selection: present");
console.log("Seven-stage lifecycle and existing creation authority: preserved");
