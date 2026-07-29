"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import styles from "./core.module.css";

export function Dialog({ open, title, eyebrow, children, footer, onClose, wide = false }: { open: boolean; title: string; eyebrow: string; children: React.ReactNode; footer?: React.ReactNode; onClose: () => void; wide?: boolean }) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const listener = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", listener);
    return () => { window.removeEventListener("keydown", listener); previous?.focus(); };
  }, [open, onClose]);
  if (!open) return null;
  return <div className={styles.overlay} role="presentation" onMouseDown={onClose}><div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={`${styles.dialog} ${wide ? styles.dialogWide : ""}`} onMouseDown={(event) => event.stopPropagation()}><header><div><span>{eyebrow}</span><h2>{title}</h2></div><button aria-label="Close dialog" onClick={onClose}><X size={20} /></button></header><div className={styles.dialogBody}>{children}</div>{footer ? <footer>{footer}</footer> : null}</div></div>;
}

export function Drawer({ open, title, eyebrow, children, footer, onClose }: { open: boolean; title: string; eyebrow: string; children: React.ReactNode; footer?: React.ReactNode; onClose: () => void }) {
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const listener = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", listener);
    return () => { window.removeEventListener("keydown", listener); previous?.focus(); };
  }, [open, onClose]);
  if (!open) return null;
  return <div className={styles.overlay} role="presentation" onMouseDown={onClose}><aside ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={styles.drawer} onMouseDown={(event) => event.stopPropagation()}><header><div><span>{eyebrow}</span><h2>{title}</h2></div><button aria-label="Close drawer" onClick={onClose}><X size={20} /></button></header><div className={styles.drawerBody}>{children}</div>{footer ? <footer>{footer}</footer> : null}</aside></div>;
}
