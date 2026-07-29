"use client";

import AngelCareLogo from "@/components/brand/AngelCareLogo";
import { Activity, Database, LockKeyhole, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./core.module.css";

function InstitutionalHeader({
  title,
  eyebrow,
  onClose,
  mode,
}: {
  title: string;
  eyebrow: string;
  onClose: () => void;
  mode: "dialog" | "drawer";
}) {
  return (
    <header className={styles.overlayHeader}>
      <div className={styles.overlayIdentity}>
        <div className={styles.overlayLogo}>
          <AngelCareLogo size="sm" />
        </div>
        <div>
          <span>ANGELCARE · AC CAPITAL OS</span>
          <strong>{eyebrow}</strong>
          <h2>{title}</h2>
        </div>
      </div>
      <div className={styles.overlayAuthority}>
        <div><ShieldCheck size={14} /><span>Controlled</span></div>
        <div><Database size={14} /><span>Evidence logged</span></div>
        <div><LockKeyhole size={14} /><span>Human authority</span></div>
        <button aria-label={`Close ${mode}`} onClick={onClose}><X size={20} /></button>
      </div>
    </header>
  );
}

function ExecutionRail() {
  return (
    <div className={styles.executionRail} aria-label="Controlled command lifecycle">
      <span><i>01</i> Validate</span>
      <span><i>02</i> Execute</span>
      <span><i>03</i> Persist</span>
      <span><i>04</i> Evidence</span>
      <span><i>05</i> Next action</span>
    </div>
  );
}

function useOverlayLifecycle(open: boolean, onClose: () => void, focusTarget: React.RefObject<HTMLElement | null>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open || !mounted) return;

    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.dataset.acCapitalOverlay = "open";
    focusTarget.current?.focus();

    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", listener);

    return () => {
      window.removeEventListener("keydown", listener);
      document.body.style.overflow = previousOverflow;
      delete document.body.dataset.acCapitalOverlay;
      previous?.focus();
    };
  }, [focusTarget, mounted, onClose, open]);

  return mounted;
}

export function Dialog({
  open,
  title,
  eyebrow,
  children,
  footer,
  onClose,
  wide = false,
}: {
  open: boolean;
  title: string;
  eyebrow: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const mounted = useOverlayLifecycle(open, onClose, panelRef);

  if (!open || !mounted) return null;

  return createPortal(
    <div className={styles.overlay} role="presentation" onMouseDown={onClose}>
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`${styles.dialog} ${wide ? styles.dialogWide : ""}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <InstitutionalHeader title={title} eyebrow={eyebrow} onClose={onClose} mode="dialog" />
        <ExecutionRail />
        <div className={styles.dialogBody}><div className={styles.dialogCanvas}>{children}</div></div>
        {footer ? (
          <footer className={styles.overlayFooter}>
            <div><Activity size={16} /><span>Completion, warning or failure evidence will appear in the Command Activity Center.</span></div>
            <div>{footer}</div>
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({
  open,
  title,
  eyebrow,
  children,
  footer,
  onClose,
}: {
  open: boolean;
  title: string;
  eyebrow: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const mounted = useOverlayLifecycle(open, onClose, panelRef);

  if (!open || !mounted) return null;

  return createPortal(
    <div className={styles.overlay} role="presentation" onMouseDown={onClose}>
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={styles.drawer}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <InstitutionalHeader title={title} eyebrow={eyebrow} onClose={onClose} mode="drawer" />
        <div className={styles.drawerContext}>
          <ShieldCheck size={16} />
          <div><strong>Inspection mode</strong><span>Review status, authority, evidence and connected records before acting.</span></div>
        </div>
        <div className={styles.drawerBody}>{children}</div>
        {footer ? <footer className={styles.drawerFooter}>{footer}</footer> : null}
      </aside>
    </div>,
    document.body,
  );
}
