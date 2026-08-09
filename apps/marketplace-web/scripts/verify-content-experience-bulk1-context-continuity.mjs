import { run, read, hasAll } from "./content-experience-bulk1-verifier-lib.mjs"
run("Persistent content context preserves dossier, stage and return route", () => {
  const context = read("components/market-os/content-command/experience-bulk1/bulk1-context.ts")
  const dossier = read("components/market-os/content-command/experience-bulk1/Bulk1DossierWorkspace.tsx")
  hasAll(context, ["dossierId", "stage", "returnTo", "sessionStorage", "contextualHref"], "Context layer")
  hasAll(dossier, ["writeBulk1Context", "returnTo", "contextualHref"], "Dossier continuity")
})
