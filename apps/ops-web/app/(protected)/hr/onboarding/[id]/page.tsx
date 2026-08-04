import OnboardingCommandCenter from "../_components/OnboardingCommandCenter";
import { getOnboardingWorkspace } from "@/lib/hr-onboarding/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: Promise<{ id: string }> };

export default async function OnboardingDetailPage({ params }: Props) {
  const { id } = await params;
  const workspace = await getOnboardingWorkspace(id);
  return <OnboardingCommandCenter initialData={workspace} />;
}
