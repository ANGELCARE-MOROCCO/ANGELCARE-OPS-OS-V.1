#!/usr/bin/env node
/**
 * Fix duplicate object literal keys in:
 * app/api/revenue-command-center/partnership-programs/route.ts
 *
 * Error:
 * An object literal cannot have multiple properties with the same name:
 * contract_terms / eligibility_requirements / publish_review
 */

const fs = require("fs");
const path = require("path");

const target = path.join(
  process.cwd(),
  "app/api/revenue-command-center/partnership-programs/route.ts"
);

if (!fs.existsSync(target)) {
  console.error("File not found:", target);
  process.exit(1);
}

let code = fs.readFileSync(target, "utf8");
const backup = target + ".before-duplicate-fields-fix.bak";
if (!fs.existsSync(backup)) fs.writeFileSync(backup, code);

function dedupePayloadBlock(source) {
  const lines = source.split("\n");
  const seenStack = [];
  const output = [];

  for (const line of lines) {
    const trimmed = line.trim();

    const match = trimmed.match(/^([A-Za-z0-9_]+)\s*:/);
    if (
      match &&
      [
        "offers",
        "pricing_rules",
        "contract_terms",
        "eligibility_requirements",
        "publish_review",
        "updated_at",
      ].includes(match[1])
    ) {
      const key = match[1];
      if (seenStack.includes(key)) {
        continue;
      }
      seenStack.push(key);
    }

    output.push(line);
  }

  return output.join("\n");
}

code = dedupePayloadBlock(code);

// Ensure the canonical advanced fields exist once.
if (!code.includes("pricing_rules: body.pricing_rules || body.pricingRules || []")) {
  code = code.replace(
    /offers:\s*body\.offers\s*\|\|\s*\[\],/,
    `offers: body.offers || [],
    pricing_rules: body.pricing_rules || body.pricingRules || [],
    contract_terms: body.contract_terms || body.contractTerms || [],
    eligibility_requirements: body.eligibility_requirements || body.eligibilityRequirements || [],
    publish_review: body.publish_review || body.publishReview || {},`
  );
}

fs.writeFileSync(target, code);
console.log("✅ Fixed duplicate fields in partnership-programs route.");
console.log("Backup:", backup);
