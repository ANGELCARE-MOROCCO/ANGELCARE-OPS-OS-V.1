from pathlib import Path

p = Path("app/(protected)/staff-home/page.tsx")
text = p.read_text()

if "getStaffPortalPersona" not in text:
    text = text.replace(
        "import StaffPortalMemoPanel from './_components/StaffPortalMemoPanel'",
        "import StaffPortalMemoPanel from './_components/StaffPortalMemoPanel'\nimport StaffPersonaStrip from './_components/StaffPersonaStrip'\nimport { getStaffPortalPersona } from '@/lib/staff-portal-os/phase3-personalization'"
    )

if "const persona = getStaffPortalPersona(user, data)" not in text:
    text = text.replace(
        "  const data = await getStaffPortalPhase1Data(user)\n",
        "  const data = await getStaffPortalPhase1Data(user)\n  const persona = getStaffPortalPersona(user, data)\n"
    )

if "<StaffPersonaStrip persona={persona} />" not in text:
    text = text.replace(
        "        <section id=\"access-menu\" style={{ marginBottom: 22 }}>",
        "        <StaffPersonaStrip persona={persona} />\n\n        <section id=\"access-menu\" style={{ marginBottom: 22 }}>"
    )

# add recommended phase3 links to myspace if missing by replacing the array in rendered section is risky; instead add to access menu? no need.

p.write_text(text)
print("patched staff-home with Phase 3 persona strip")
