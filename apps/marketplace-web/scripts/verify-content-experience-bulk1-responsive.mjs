import { run, read, hasAll } from "./content-experience-bulk1-verifier-lib.mjs"
run("Bulk 1 defines desktop, laptop, tablet, mobile and reduced-motion behavior", () => {
  const css = read("components/market-os/content-command/experience-bulk1/bulk1-experience.module.css")
  hasAll(css, ["@media(max-width:1280px)", "@media(max-width:980px)", "@media(max-width:680px)", "prefers-reduced-motion", "overflow"], "Responsive CSS")
})
