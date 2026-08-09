from pathlib import Path
import re

FILES = [
    "components/carelink/ops/CareLinkOpsProductionDashboard.tsx",
    "components/carelink/ops/dispatch/CareLinkDispatchControlCenter.tsx",
    "components/carelink/ops/dispatch/CareLinkDispatchWorkspacePage.tsx",
    "components/carelink/ops/missions/CareLinkMissionControlCenter.tsx",
    "components/carelink/ops/enterprise/CareLinkOpsEnterpriseWorkspace.tsx",
    "components/carelink/ops/agents/CareLinkAgentsCommandWorkspace.tsx",
]

def remove_first_aside_or_shared_sidebar(s: str):
    if "<CareLinkOpsApprovedSidebar />" in s:
        return s.replace("<CareLinkOpsApprovedSidebar />", "", 1), 1

    s2, count = re.subn(r"<aside\b[\s\S]*?</aside>", "", s, count=1)
    return s2, count

def clean_imports(s: str):
    s = s.replace("import { CareLinkOpsApprovedSidebar } from '@/components/carelink/ops/CareLinkOpsApprovedSidebar'\n", "")
    s = s.replace("import { CARELINK_OPS_NAV } from '@/lib/carelink/constants'\n", "")
    return s

def clean_offsets(s: str):
    replacements = {
        "pl-[220px]": "",
        "pl-72": "",
        "pl-[18rem]": "",
        "pl-[280px]": "",
        "pl-[300px]": "",
        "ml-[220px]": "",
        "ml-72": "",
        "ml-[18rem]": "",
        "ml-[280px]": "",
        "ml-[300px]": "",
        "left-[220px]": "left-0",
        "left-72": "left-0",
        "left-[18rem]": "left-0",
    }
    for old, new in replacements.items():
        s = s.replace(old, new)
    return s

for file in FILES:
    p = Path(file)
    if not p.exists():
        print(f"skip missing {file}")
        continue

    backup = p.with_suffix(p.suffix + ".before-single-layout-sidebar")
    if not backup.exists():
        backup.write_text(p.read_text())

    s = p.read_text()
    s, count = remove_first_aside_or_shared_sidebar(s)
    s = clean_imports(s)
    s = clean_offsets(s)

    # Remove old unused nav arrays that existed only for sidebars.
    s = re.sub(r"const\s+navItems\s*=\s*\[[\s\S]*?\]\s*(?:as const)?", "const navItems = []", s, count=1)
    s = re.sub(r"const\s+primaryNav\s*=\s*\[[\s\S]*?\]\s*(?:as const)?", "const primaryNav = []", s, count=1)
    s = re.sub(r"const\s+enterpriseNav\s*=\s*CARELINK_OPS_NAV", "const enterpriseNav = []", s, count=1)

    p.write_text(s)
    print(f"{file}: sidebar removed={count}")
