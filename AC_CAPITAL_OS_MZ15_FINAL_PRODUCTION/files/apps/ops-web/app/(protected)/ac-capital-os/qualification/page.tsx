import { QualificationPage } from "@/components/ac-capital-os/pages/qualification/QualificationPage";
import { getCapitalActorContext } from "@/lib/ac-capital-os/server/actor-context";

export const dynamic = "force-dynamic";

export default async function Page() {
  const actor = await getCapitalActorContext();
  return <QualificationPage actor={actor} />;
}
