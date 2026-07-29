import { RegistryPage } from "@/components/ac-capital-os/pages/registry/RegistryPage";
import { getCapitalActorContext } from "@/lib/ac-capital-os/server/actor-context";

export const dynamic = "force-dynamic";

export default async function Page() {
  const actor = await getCapitalActorContext();
  return <RegistryPage actor={actor} />;
}
