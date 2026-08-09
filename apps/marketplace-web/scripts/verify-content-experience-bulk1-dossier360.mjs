import { run, read, hasAll } from "./content-experience-bulk1-verifier-lib.mjs"
run("Continuous Dossier 360 contains crown, spine, active workspace and context rail", () => {
  const text = read("components/market-os/content-command/experience-bulk1/Bulk1DossierWorkspace.tsx")
  hasAll(text, ["dossierCrown", "LifecycleSpine", "ActiveStageWorkspace", "ContextRail", "ACTION DOMINANTE", "HANDOVER CONTEXTUEL", "RequirementInspector"], "Dossier 360")
})
