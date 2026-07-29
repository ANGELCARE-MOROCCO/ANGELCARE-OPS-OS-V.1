import { run, read, assert } from "./content-experience-bulk1-verifier-lib.mjs"
run("Commandement, My Work and Dossier use distinct spatial systems", () => {
  const command = read("components/market-os/content-command/experience-bulk1/Bulk1CommandementWorkspace.tsx")
  const dossier = read("components/market-os/content-command/experience-bulk1/Bulk1DossierWorkspace.tsx")
  for (const token of ["three-horizon", "generic dashboard", "GenericWorkspace"]) assert(!command.includes(token), `Generic command anatomy marker detected: ${token}`)
  assert(command.includes("ImmediateCommand") && command.includes("LifecycleFlow") && command.includes("MyWorkDesk"), "Commandement distinct composition missing")
  assert(dossier.includes("LifecycleSpine") && dossier.includes("ActiveStageWorkspace") && dossier.includes("ContextRail"), "Dossier distinct composition missing")
})
