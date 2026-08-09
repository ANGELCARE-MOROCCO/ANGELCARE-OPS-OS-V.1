import { run, read, hasAll } from "./content-experience-bulk1-verifier-lib.mjs"
run("My Work exposes six deterministic lanes and Focus Station", () => {
  const text = read("components/market-os/content-command/experience-bulk1/Bulk1CommandementWorkspace.tsx")
  hasAll(text, ["Maintenant", "Aujourd’hui", "Retourné", "En attente", "Bloqué", "À venir", "Focus Station", "update_task"], "My Work")
})
