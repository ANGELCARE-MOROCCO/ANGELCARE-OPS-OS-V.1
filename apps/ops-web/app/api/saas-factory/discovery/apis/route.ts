import { readdir } from "fs/promises";
import path from "path";
import { jsonError, jsonOk } from "@/lib/saas-factory/phase3-runtime";

export const dynamic = "force-dynamic";

async function walk(dir: string, root = dir): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const output: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      output.push(...await walk(full, root));
    } else if (/route\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      output.push(full.replace(root, "").replace(/\\/g, "/"));
    }
  }
  return output;
}

export async function GET() {
  try {
    const apiDir = path.join(process.cwd(), "app", "api");
    const files = await walk(apiDir);
    const apis = files.map((file) => {
      const endpoint = `/api${file}`
        .replace(/\/route\.(tsx|ts|jsx|js)$/, "")
        .replace(/\/+/g, "/");
      return {
        file: `app/api${file}`,
        endpoint,
      };
    });

    return jsonOk({
      count: apis.length,
      apis,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : String(error));
  }
}
