#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path.cwd()

def read(path: str) -> tuple[Path, str]:
    p = ROOT / path
    if not p.exists():
        print(f"SKIP missing {path}")
        return p, ""
    return p, p.read_text()

def write(p: Path, old: str, new: str):
    if not old:
        return
    if new != old:
        p.write_text(new)
        print(f"FIXED {p.relative_to(ROOT)}")
    else:
        print(f"OK no change {p.relative_to(ROOT)}")

# 1) Supabase builder .catch() issue in revenue v10 bulk/seed
for rel in [
    "app/api/revenue-command-center/v10/bulk/route.ts",
    "app/api/revenue-command-center/v10/seed/route.ts",
]:
    p, s = read(rel)
    if not s:
        continue

    # Most generated files use one-line: await supabase.from(LOGS).insert(...).throwOnError().catch(() => {})
    s2 = re.sub(
        r"await\s+(.+?\.throwOnError\(\))\.catch\(\(\)\s*=>\s*\{\}\)",
        r"try { await \1 } catch {}",
        s,
        flags=re.S,
    )
    s2 = s2.replace(".throwOnError().catch(() => {})", ".throwOnError()")
    write(p, s, s2)

# 2) auditEmailAction object -> string payload
p, s = read("app/api/users/mailbox-permissions/bulk/route.ts")
if s:
    s2 = re.sub(
        r"await\s+auditEmailAction\(\s*(\{[\s\S]*?\})\s*\)",
        r"await auditEmailAction(JSON.stringify(\1))",
        s,
    )
    write(p, s, s2)

# 3) HR implicit any id callback parameters
p, s = read("components/hr-production/HRProductionWorkspace.tsx")
if s:
    s2 = s
    s2 = re.sub(r"\((id)\)\s*=>", r"(\1: string) =>", s2)
    s2 = re.sub(r"\((id)\)\s*=>", r"(\1: string) =>", s2)
    write(p, s, s2)

# 4) campaign generic casts: convert expression as T[] -> as unknown as T[]
p, s = read("components/market-os/campaign-execution-v2.tsx")
if s:
    s2 = s
    s2 = re.sub(r"(\[[^\]]+\]|\w+)\s+as\s+T\[\]", r"\1 as unknown as T[]", s2)
    s2 = re.sub(r"\(([^()]+)\s+as\s+T\[\]\)", r"(\1 as unknown as T[])", s2)
    # Specific common shape: read<T>(key, fallback) using array union
    s2 = s2.replace(") as T[]", ") as unknown as T[]")
    write(p, s, s2)

# 5) EmailOsAccount missing export in lib/email-os/accounts.ts
p, s = read("lib/email-os/accounts.ts")
if s and "export type EmailOsAccount" not in s:
    addition = """
export type EmailOsAccount = {
  id?: string | null
  email_address?: string | null
  email?: string | null
  receive_enabled?: boolean | null
  send_enabled?: boolean | null
  [key: string]: unknown
}
"""
    write(p, s, s.rstrip() + "\n" + addition + "\n")

# 6) mailparser declaration
types_dir = ROOT / "types"
types_dir.mkdir(exist_ok=True)
decl = types_dir / "mailparser.d.ts"
if not decl.exists():
    decl.write_text("declare module 'mailparser';\n")
    print("FIXED types/mailparser.d.ts")
else:
    print("OK types/mailparser.d.ts exists")

# 7) lib/imap.ts Date|string toISOString safety
p, s = read("lib/imap.ts")
if s:
    s2 = s
    # Add helper if absent
    if "function toIsoStringSafe" not in s2:
        s2 = s2.replace(
            "import",
            "function toIsoStringSafe(value: string | Date | null | undefined) {\n"
            "  if (!value) return new Date().toISOString()\n"
            "  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()\n"
            "}\n\nimport",
            1,
        )
    # Replace common .date.toISOString() / date.toISOString()
    s2 = re.sub(r"(\w+)\.date\.toISOString\(\)", r"toIsoStringSafe(\1.date)", s2)
    s2 = re.sub(r"(\w+)\.toISOString\(\)", r"toIsoStringSafe(\1)", s2)
    write(p, s, s2)

print("\nDone. Now run:")
print("rm -rf .next")
print("npx tsc --noEmit --pretty false > ts-errors.txt 2>&1")
print("npm run build")
