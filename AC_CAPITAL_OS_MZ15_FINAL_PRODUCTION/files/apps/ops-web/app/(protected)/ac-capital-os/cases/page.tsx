import { CasesPage } from "@/components/ac-capital-os/pages/cases/CasesPage";
import { getCapitalActorContext } from "@/lib/ac-capital-os/server/actor-context";

export const dynamic = "force-dynamic";

export default async function Page() {
  const actor = await getCapitalActorContext();
  return <CasesPage actor={actor} />;
}
