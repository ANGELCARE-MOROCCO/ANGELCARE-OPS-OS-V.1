"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { RevenueCommandCenterSidebar } from "@/components/revenue-command-center/RevenueCommandCenterSidebar";
import "./revenue-command-experience.css";

const SIDEBAR_STORAGE_KEY = "angelcare.revenue-command.sidebar.v2";

export default function RevenueCommandUnifiedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "collapsed");
    } catch {
      setCollapsed(false);
    }
  }, []);

  useEffect(() => {
    setOverlayOpen(false);
  }, [pathname]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "collapsed" : "expanded");
      } catch {
        // The shell remains usable when browser storage is unavailable.
      }
      return next;
    });
  }

  return (
    <div
      data-revenue-command-experience="premium-v2"
      data-rcc-sidebar-state={collapsed ? "collapsed" : "expanded"}
      className="rcc-sovereignty-shell"
    >
      <a href="#revenue-command-content" className="rcc-sovereignty-skip-link">
        Aller au contenu principal
      </a>

      <RevenueCommandCenterSidebar
        collapsed={collapsed}
        overlayOpen={overlayOpen}
        onToggleCollapsed={toggleCollapsed}
        onOpenOverlay={() => setOverlayOpen(true)}
        onCloseOverlay={() => setOverlayOpen(false)}
      />

      <div className="rcc-sovereignty-stage">
        <div id="revenue-command-content" className="rcc-sovereignty-content">
          {children}
        </div>
      </div>
    </div>
  );
}
