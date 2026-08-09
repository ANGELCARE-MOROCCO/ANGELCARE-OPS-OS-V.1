import { readdir, readFile } from "fs/promises";
import path from "path";
import { SAAS_FACTORY_PHASE5_ADOPTION_TARGETS } from "./phase5-adoption-map";

export type FactoryFieldFinding = {
  moduleKey: string;
  moduleLabel: string;
  file: string;
  fieldType: string;
  optionGroup: string;
  recommendedComponent: string;
  count: number;
  priority: "critical" | "high" | "normal";
  preview: string[];
  recommendation: string;
};

const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "dist", "build", ".turbo"]);

const FIELD_PATTERNS = [
  {
    fieldType: "city",
    optionGroup: "cities",
    recommendedComponent: "FactoryCitySelect",
    regex: /\b(city|cities|Casablanca|Rabat|Marrakech|Tanger|F[eè]s|Agadir)\b/gi,
  },
  {
    fieldType: "department",
    optionGroup: "departments",
    recommendedComponent: "FactoryDepartmentSelect",
    regex: /\b(department|departments|Operations|Human Resources|Academy|Revenue|Market|Finance|HR)\b/gi,
  },
  {
    fieldType: "service_category",
    optionGroup: "service_categories",
    recommendedComponent: "FactoryServiceCategorySelect",
    regex: /\b(serviceCategory|service_category|service categories|Childcare|Academy Training|Care Service)\b/gi,
  },
  {
    fieldType: "lead_source",
    optionGroup: "lead_sources",
    recommendedComponent: "FactoryOptionSelect",
    regex: /\b(leadSource|lead_source|lead sources|B2B Partnership|Market Activation|Referral|Website)\b/gi,
  },
  {
    fieldType: "task_priority",
    optionGroup: "task_priorities",
    recommendedComponent: "FactoryOptionSelect",
    regex: /\b(priority|Urgent|High|Normal|Low)\b/gi,
  },
  {
    fieldType: "raw_select",
    optionGroup: "unknown",
    recommendedComponent: "FactoryOptionSelect",
    regex: /<select[\s>]/g,
  },
];

async function walk(dir: string, output: string[] = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, output);
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      output.push(full);
    }
  }
  return output;
}

function detectModule(file: string) {
  const normalized = file.replace(/\\/g, "/");
  return (
    SAAS_FACTORY_PHASE5_ADOPTION_TARGETS.find((target) =>
      normalized.includes(target.routePrefix.replace(/^\//, ""))
    ) ??
    SAAS_FACTORY_PHASE5_ADOPTION_TARGETS.find((target) =>
      normalized.toLowerCase().includes(target.moduleKey.toLowerCase().replace(/_/g, "-"))
    )
  );
}

export async function scanFactoryAdoptionCandidates(root = process.cwd()) {
  const roots = ["app", "components"].map((item) => path.join(root, item));
  const files: string[] = [];

  for (const scanRoot of roots) {
    try {
      files.push(...(await walk(scanRoot)));
    } catch {
      // Ignore missing roots.
    }
  }

  const findings: FactoryFieldFinding[] = [];

  for (const file of files) {
    const target = detectModule(path.relative(root, file));
    if (!target) continue;

    const content = await readFile(file, "utf8");

    if (content.includes("FactoryOptionSelect") || content.includes("FactoryCitySelect")) {
      continue;
    }

    for (const pattern of FIELD_PATTERNS) {
      const matches = content.match(pattern.regex);
      if (!matches?.length) continue;

      const targetField = target.priorityFields.find(
        (field) => field.optionGroup === pattern.optionGroup || field.fieldKey === pattern.fieldType
      );

      findings.push({
        moduleKey: target.moduleKey,
        moduleLabel: target.moduleLabel,
        file: path.relative(root, file),
        fieldType: pattern.fieldType,
        optionGroup: pattern.optionGroup,
        recommendedComponent: targetField?.component ?? pattern.recommendedComponent,
        count: matches.length,
        priority: targetField?.priority ?? (pattern.fieldType === "raw_select" ? "normal" : "high"),
        preview: matches.slice(0, 8),
        recommendation:
          targetField?.notes ??
          `Review ${pattern.fieldType} values and replace with ${pattern.recommendedComponent} where safe.`,
      });
    }
  }

  const grouped = findings.reduce<Record<string, number>>((acc, finding) => {
    const key = `${finding.moduleKey}.${finding.fieldType}`;
    acc[key] = (acc[key] ?? 0) + finding.count;
    return acc;
  }, {});

  return {
    scannedFiles: files.length,
    findingCount: findings.length,
    grouped,
    findings,
  };
}
