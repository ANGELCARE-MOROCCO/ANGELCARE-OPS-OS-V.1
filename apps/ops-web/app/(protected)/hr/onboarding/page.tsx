import OnboardingCommandCenter from "./_components/OnboardingCommandCenter";
import { getOnboardingWorkspace } from "@/lib/hr-onboarding/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OnboardingPage() {
  const workspace = await getOnboardingWorkspace();
  return <OnboardingCommandCenter initialData={workspace} />;
}
