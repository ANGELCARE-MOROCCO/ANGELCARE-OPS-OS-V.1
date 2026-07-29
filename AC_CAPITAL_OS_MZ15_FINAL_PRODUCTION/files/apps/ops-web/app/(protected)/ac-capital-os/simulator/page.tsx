import { SimulatorPage } from "@/components/ac-capital-os/pages/simulator/SimulatorPage";
import { getCapitalActorContext } from "@/lib/ac-capital-os/server/actor-context";

export const dynamic = "force-dynamic";

export default async function Page() {
  const actor = await getCapitalActorContext();
  return <SimulatorPage actor={actor} />;
}
