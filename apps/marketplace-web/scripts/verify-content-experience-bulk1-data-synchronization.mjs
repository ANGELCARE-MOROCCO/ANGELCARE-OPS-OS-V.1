import { run, read, hasAll } from "./content-experience-bulk1-verifier-lib.mjs"
run("Mutations refresh the authoritative snapshot before UI completion", () => {
  const command = read("components/market-os/content-command/experience-bulk1/Bulk1CommandementWorkspace.tsx")
  const dossier = read("components/market-os/content-command/experience-bulk1/Bulk1DossierWorkspace.tsx")
  hasAll(command, ["await headquartersAction", "await refresh()"], "Command synchronization")
  hasAll(dossier, ["await headquartersAction", "await refresh()", "snapshot autoritaire"], "Dossier synchronization")
})
