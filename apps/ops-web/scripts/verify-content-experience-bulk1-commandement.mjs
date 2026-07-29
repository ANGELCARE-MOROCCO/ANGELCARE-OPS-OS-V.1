import { run, read, hasAll } from "./content-experience-bulk1-verifier-lib.mjs"
run("Commandement 360 implements sovereign orientation horizons", () => {
  const text = read("components/market-os/content-command/experience-bulk1/Bulk1CommandementWorkspace.tsx")
  hasAll(text, ["À faire maintenant", "HORIZON A", "HORIZON B", "HORIZON C", "LifecycleFlow", "AuthorityRisk", "ResumeContinuity", "Comprendre. Décider. Faire avancer."], "Commandement")
})
