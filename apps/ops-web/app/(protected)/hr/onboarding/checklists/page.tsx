import ChecklistLibraryClient from "./ChecklistLibraryClient";
import { getOnboardingWorkspace } from "@/lib/hr-onboarding/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OnboardingChecklistsPage() {
  const workspace = await getOnboardingWorkspace();
  return <ChecklistLibraryClient initialChecklists={workspace.checklists} canManage={workspace.capabilities.canManageChecklists} />;
}
