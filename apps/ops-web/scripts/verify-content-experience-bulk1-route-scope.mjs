import { run, read, hasAll } from "./content-experience-bulk1-verifier-lib.mjs"
run("Bulk 1 route scope remains Commandement and Dossier 360", () => {
  const dashboard = read("components/market-os/content-command/headquarters/DashboardWorkspace.tsx")
  const dossier = read("components/market-os/content-command/headquarters/DossierWorkspace.tsx")
  hasAll(dashboard, ["Bulk1CommandementWorkspace"], "Dashboard wrapper")
  hasAll(dossier, ["Bulk1DossierWorkspace", "dossierId", "compatibilityMode"], "Dossier wrapper")
})
