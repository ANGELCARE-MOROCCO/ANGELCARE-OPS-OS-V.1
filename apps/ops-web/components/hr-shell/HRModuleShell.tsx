"use client";

import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import type { HRShellIdentity, HRShellSnapshot } from "@/lib/hr-shell/types";
import HRLiveBroadcastBar from "./HRLiveBroadcastBar";
import HRSovereignSidebar from "./HRSovereignSidebar";
import styles from "./HRSovereignShell.module.css";

export default function HRModuleShell({
  children,
  identity,
  snapshot,
}: {
  children: ReactNode;
  identity: HRShellIdentity;
  snapshot: HRShellSnapshot;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  return (
    <div className={`${styles.shell} ${collapsed ? styles.shellCollapsed : ""}`} data-hr-sovereign-shell="true">
      <HRSovereignSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapsed={() => setCollapsed((current) => !current)}
        onCloseMobile={closeMobile}
        identity={identity}
        snapshot={snapshot}
      />
      <div className={styles.stage}>
        <HRLiveBroadcastBar snapshot={snapshot} onOpenNavigation={() => setMobileOpen(true)} />
        <main className={styles.content} data-hr-shell-content="true">{children}</main>
      </div>
    </div>
  );
}
