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
    } else if (/page\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      output.push(full.replace(root, "").replace(/\\/g, "/"));
    }
  }
  return output;
}

export async function GET() {
  try {
    const appDir = path.join(process.cwd(), "app");
    const pages = await walk(appDir);
    const routes = pages.map((file) => {
      const route = file
        .replace(/\/page\.(tsx|ts|jsx|js)$/, "")
        .replace(/\([^)]*\)\//g, "")
        .replace(/\/+/g, "/") || "/";
      return {
        file: `app${file}`,
        route: route === "" ? "/" : route,
      };
    });

    return jsonOk({
      count: routes.length,
      routes,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : String(error));
  }
}
