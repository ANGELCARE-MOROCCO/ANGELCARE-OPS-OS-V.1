import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
for (const directory of ["out", ".webpack"]) {
  await fs.rm(path.join(root, directory), { recursive: true, force: true });
}
console.log("ANGELCARE Desktop build output removed.");
