import { readdir, readFile } from "fs/promises";
import path from "path";
import { factoryJsonError, factoryJsonOk } from "@/lib/saas-factory/phase4-live-options";

export const dynamic = "force-dynamic";

const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

const OPTION_PATTERNS = [
  { key: "hardcoded_city", regex: /\b(Casablanca|Rabat|Marrakech|Tanger|F[eè]s|Agadir)\b/g },
  { key: "hardcoded_department", regex: /\b(Operations|Academy|Revenue|Market|Finance|Human Resources|HR)\b/g },
  { key: "hardcoded_status_array", regex: /(const|let|var)\s+\w*(status|statuses|cities|departments|categories)\w*\s*=\s*\[/gi },
  { key: "select_without_factory", regex: /<select[\s>]/g },
];

async function walk(dir: string, output: string[] = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, output);
    } else if (SCAN_EXTENSIONS.has(path.extname(entry.name))) {
      output.push(full);
    }
  }
  return output;
}

export async function GET() {
  try {
    const roots = ["app", "components", "lib"].map((item) => path.join(process.cwd(), item));
    const files: string[] = [];

    for (const root of roots) {
      try {
        files.push(...(await walk(root)));
      } catch {
        // root may not exist in some installs
      }
    }

    const findings: Array<{
      file: string;
      type: string;
      count: number;
      preview: string;
    }> = [];

    for (const file of files) {
      const content = await readFile(file, "utf8");
      for (const pattern of OPTION_PATTERNS) {
        const matches = content.match(pattern.regex);
        if (matches?.length) {
          findings.push({
            file: path.relative(process.cwd(), file),
            type: pattern.key,
            count: matches.length,
            preview: matches.slice(0, 5).join(", "),
          });
        }
      }
    }

    const grouped = findings.reduce<Record<string, number>>((acc, finding) => {
      acc[finding.type] = (acc[finding.type] ?? 0) + finding.count;
      return acc;
    }, {});

    return factoryJsonOk({
      scannedFiles: files.length,
      findingCount: findings.length,
      grouped,
      findings: findings.slice(0, 500),
    });
  } catch (error) {
    return factoryJsonError(error instanceof Error ? error.message : String(error));
  }
}
