import { run, read, assert, hasAll } from "./content-experience-bulk1-verifier-lib.mjs"
run("No fabricated KPI, AI authority or local-only completion is introduced", () => {
  const derivations = read("components/market-os/content-command/experience-bulk1/bulk1-derivations.ts")
  const command = read("components/market-os/content-command/experience-bulk1/Bulk1CommandementWorkspace.tsx")
  hasAll(derivations, ["Aucun score n’est inventé", "contrôles déterministes"], "Data honesty wording")
  for (const forbidden of ["Math.random", "fakeKpi", "mockSuccess", "simulatedLive", "localStorage.setItem(\"business"]) assert(!`${derivations}\n${command}`.includes(forbidden), `Fabricated state marker detected: ${forbidden}`)
})
