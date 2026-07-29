import { run, read, hasAll } from "./content-experience-bulk1-verifier-lib.mjs"
run("Bulk 1 uses existing governed actions for in-place lifecycle progression", () => {
  const text = read("components/market-os/content-command/experience-bulk1/Bulk1DossierWorkspace.tsx")
  hasAll(text, ["update_task", "update_mission_status", "record_human_review", "update_publication_package", "await refresh()"], "Governed actions")
})
