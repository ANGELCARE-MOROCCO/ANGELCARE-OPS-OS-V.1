import type { ReactNode } from "react";
import HRModuleShell from "@/components/hr-shell/HRModuleShell";
import { loadHRShellIdentity } from "@/lib/hr-shell/identity";
import { loadHRShellSnapshot } from "@/lib/hr-shell/snapshot";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export default async function HRModuleLayout({ children }: { children: ReactNode }) {
  const [identity, snapshot] = await Promise.all([
    loadHRShellIdentity(),
    loadHRShellSnapshot(),
  ]);
  return <HRModuleShell identity={identity} snapshot={snapshot}>{children}</HRModuleShell>;
}
