import { run, read, assert, listStyleRefs, listCssClasses } from "./content-experience-bulk1-verifier-lib.mjs"
run("Bulk 1 CSS Modules are pure and every reference resolves", () => {
  const css = read("components/market-os/content-command/experience-bulk1/bulk1-experience.module.css")
  const classes = listCssClasses(css)
  for (const file of ["Bulk1CommandementWorkspace.tsx", "Bulk1DossierWorkspace.tsx"]) {
    const text = read(`components/market-os/content-command/experience-bulk1/${file}`)
    for (const ref of listStyleRefs(text)) assert(classes.has(ref), `${file}: unresolved CSS class ${ref}`)
  }
  assert(!/@media[^{}]*prefers-reduced-motion[^{}]*\{\s*\*/s.test(css), "Unscoped reduced-motion selector detected")
})
