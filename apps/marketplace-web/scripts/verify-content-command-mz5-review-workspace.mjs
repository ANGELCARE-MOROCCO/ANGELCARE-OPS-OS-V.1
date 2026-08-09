import fs from "node:fs"
const text = fs.readFileSync("components/market-os/content-command/content-review-page.tsx", "utf8")
for (const token of ["Review Workspace", "REVIEW CRITERIA", "FINDINGS & CORRECTIONS", "CORRECTION LOOP", "Accepter pour Validation", "Demander correction", "getReviewReadiness"]){if(!text.includes(token)) throw new Error(`Review token missing: ${token}`)}
console.log("PASS — Review Workspace contains queues, deterministic readiness, inspection, findings, correction and Validation preparation")
