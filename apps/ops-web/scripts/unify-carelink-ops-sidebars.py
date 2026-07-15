from pathlib import Path
import re

FILES = [
    "components/carelink/ops/CareLinkOpsProductionDashboard.tsx",
    "components/carelink/ops/dispatch/CareLinkDispatchControlCenter.tsx",
    "components/carelink/ops/dispatch/CareLinkDispatchWorkspacePage.tsx",
    "components/carelink/ops/missions/CareLinkMissionControlCenter.tsx",
    "components/carelink/ops/enterprise/CareLinkOpsEnterpriseWorkspace.tsx",
]

IMPORT_LINE = "import { CareLinkOpsApprovedSidebar } from '@/components/carelink/ops/CareLinkOpsApprovedSidebar'"

def add_import_safely(s: str) -> str:
    # Repair known bad nested import first.
    s = s.replace(
        "import type {\nimport { CareLinkOpsApprovedSidebar } from '@/components/carelink/ops/CareLinkOpsApprovedSidebar'\n",
        "import { CareLinkOpsApprovedSidebar } from '@/components/carelink/ops/CareLinkOpsApprovedSidebar'\nimport type {\n",
    )

    if "CareLinkOpsApprovedSidebar" in s:
        return s

    lines = s.splitlines()
    insert_at = 0

    # Put after all normal import lines, but never inside import type block.
    in_type_block = False
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("import type {") and not stripped.endswith("} from"):
            in_type_block = True
        if in_type_block and stripped.startswith("} from"):
            in_type_block = False
            insert_at = i + 1
            continue
        if not in_type_block and stripped.startswith("import "):
            insert_at = i + 1

    lines.insert(insert_at, IMPORT_LINE)
    return "\n".join(lines)

def replace_first_aside(s: str) -> tuple[str, int]:
    # Replace first top-level-ish aside block. These components use a single sidebar aside.
    return re.subn(r"<aside\b[\s\S]*?</aside>", "<CareLinkOpsApprovedSidebar />", s, count=1)

def normalize_offsets(s: str) -> str:
    replacements = {
        "pl-72": "pl-[220px]",
        "ml-72": "ml-[220px]",
        "left-72": "left-[220px]",
        "w-72": "w-[220px]",
        "pl-[18rem]": "pl-[220px]",
        "ml-[18rem]": "ml-[220px]",
        "left-[18rem]": "left-[220px]",
        "pl-[280px]": "pl-[220px]",
        "ml-[280px]": "ml-[220px]",
        "pl-[300px]": "pl-[220px]",
        "ml-[300px]": "ml-[220px]",
    }
    for old, new in replacements.items():
        s = s.replace(old, new)
    return s

def remove_local_nav_arrays(s: str) -> str:
    # Remove/neutralize hardcoded nav arrays that are no longer used.
    s = re.sub(
        r"const\s+navItems\s*=\s*\[[\s\S]*?\]\s*(?:as const)?",
        "const navItems = []",
        s,
        count=1,
    )
    s = re.sub(
        r"const\s+primaryNav\s*=\s*\[[\s\S]*?\]\s*(?:as const)?",
        "const primaryNav = []",
        s,
        count=1,
    )
    s = re.sub(
        r"const\s+enterpriseNav\s*=\s*\[[\s\S]*?\]\s*(?:as const)?",
        "const enterpriseNav = []",
        s,
        count=1,
    )
    return s

for file in FILES:
    p = Path(file)
    if not p.exists():
        print(f"skip missing {file}")
        continue

    backup = p.with_suffix(p.suffix + ".before-sidebar-unify-final")
    if not backup.exists():
        backup.write_text(p.read_text())

    s = p.read_text()
    s = add_import_safely(s)
    s = remove_local_nav_arrays(s)
    s, count = replace_first_aside(s)
    s = normalize_offsets(s)
    p.write_text(s)

    print(f"{file}: aside replaced={count}")
