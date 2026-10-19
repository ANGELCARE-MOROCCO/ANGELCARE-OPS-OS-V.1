"use client";
import { lazy, Suspense, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { tr, type Tri } from "../types";
import { T, useUI } from "./ui";
import s from "./workspace.module.css";
const Production = lazy(() =>
    import("./ProductionDesk").then((m) => ({ default: m.ProductionDesk })),
  ),
  Team = lazy(() =>
    import("./ProfessionalTeam").then((m) => ({ default: m.EditorialDesk })),
  ),
  Strategy = lazy(() =>
    import("./StrategyDesk").then((m) => ({ default: m.StrategyDesk })),
  ),
  Service = lazy(() =>
    import("./ServiceDesk").then((m) => ({ default: m.ServiceDesk })),
  ),
  Retention = lazy(() =>
    import("./RetentionDesk").then((m) => ({ default: m.RetentionDesk })),
  ),
  Control = lazy(() =>
    import("./ProfessionalControl").then((m) => ({
      default: m.ProfessionalControl,
    })),
  ),
  Policies = lazy(() =>
    import("./OperationalPolicies").then((m) => ({ default: m.PolicyDesk })),
  );
const LABELS: Record<string, Tri> = {
  native: ["Current workspace", "Workspace actuel", "مساحة العمل الحالية"],
  production: ["Production studio", "Studio de production", "استوديو الإنتاج"],
  team: ["Team and reviews", "Équipe et revues", "الفريق والمراجعات"],
  strategy: [
    "Funnels and retention",
    "Entonnoirs et rétention",
    "المسارات والاحتفاظ",
  ],
  service: ["Service operations", "Opérations de service", "عمليات الخدمة"],
  retention: [
    "Retention and disposal",
    "Conservation et suppression",
    "الاحتفاظ والحذف",
  ],
  control: ["Operating control centre", "Centre de contrôle", "مركز التحكم"],
  governance: [
    "Editorial governance",
    "Gouvernance éditoriale",
    "حوكمة التحرير",
  ],
};
export function ProfessionalWorkspace({
  module,
  children,
}: {
  module: string;
  children: ReactNode;
}) {
  const { boot, locale } = useUI(),
    [tab, setTab] = useState("native"),
    params = useSearchParams(),
    explicit = params?.get("workspace") || "";
  let extra: string[] = [];
  if (module === "media") extra = ["production"];
  if (module === "publication") extra = ["team"];
  if (["performance", "audience"].includes(module)) extra = ["strategy"];
  if (module === "messages" && boot.actor.rights.moderate) extra = ["service"];
  if (module === "utilities")
    extra = ["control", ...(boot.actor.rights.purge ? ["retention"] : [])];
  if (module === "settings" && boot.actor.rights.publish)
    extra = ["governance"];
  if (!extra.length) return <>{children}</>;
  const selected = explicit || tab;
  const active = ["native", ...extra].includes(selected) ? selected : "native";
  return (
    <>
      <div className={s.tabs}>
        {["native", ...extra].map((key) => (
          <button
            key={key}
            className={s.tab}
            aria-pressed={active === key}
            onClick={() => {
              setTab(key);
              if (explicit) {
                const u = new URL(location.href);
                u.searchParams.delete("workspace");
                history.replaceState(null, "", u);
              }
            }}
          >
            {tr(LABELS[key], locale)}
          </button>
        ))}
      </div>
      <Suspense
        fallback={
          <div className={s.loading} role="status">
            <span className={s.spinner} />
            <T
              v={[
                "Opening operating workspace…",
                "Ouverture de l’espace opérationnel…",
                "فتح مساحة التشغيل…",
              ]}
            />
          </div>
        }
      >
        {active === "native" ? (
          children
        ) : active === "production" ? (
          <Production />
        ) : active === "team" ? (
          <Team />
        ) : active === "strategy" ? (
          <Strategy audience={module === "audience"} />
        ) : active === "service" ? (
          <Service />
        ) : active === "retention" ? (
          <Retention />
        ) : active === "control" ? (
          <Control />
        ) : (
          <Policies kind="editorial_policy" />
        )}
      </Suspense>
    </>
  );
}
