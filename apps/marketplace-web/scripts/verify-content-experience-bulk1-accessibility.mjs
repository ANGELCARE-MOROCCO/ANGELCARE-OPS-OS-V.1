import { run, read, hasAll } from "./content-experience-bulk1-verifier-lib.mjs"
run("Bulk 1 exposes semantic navigation, dialogs, live regions and focus-safe controls", () => {
  const command = read("components/market-os/content-command/experience-bulk1/Bulk1CommandementWorkspace.tsx")
  const dossier = read("components/market-os/content-command/experience-bulk1/Bulk1DossierWorkspace.tsx")
  hasAll(command, ["role=\"tablist\"", "aria-selected", "aria-live=\"polite\"", "aria-pressed"], "Command accessibility")
  hasAll(dossier, ["role=\"dialog\"", "aria-modal=\"true\"", "aria-current", "aria-label=\"Cycle de vie du dossier\"", "aria-live=\"polite\""], "Dossier accessibility")
})
