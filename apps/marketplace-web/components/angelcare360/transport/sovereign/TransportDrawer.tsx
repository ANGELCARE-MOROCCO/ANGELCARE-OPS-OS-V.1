'use client'

import { useEffect, useId, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import styles from './TransportSovereign.module.css'

export default function TransportDrawer({ trigger, title, eyebrow = 'Transport & Sécurité', children }: { trigger: string; title: string; eyebrow?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return <>
    <button type="button" className={styles.drawerTrigger} onClick={() => setOpen(true)}>{trigger}</button>
    {open ? <div className={styles.drawerLayer} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className={styles.drawerHeader}>
          <div><span>{eyebrow}</span><h2 id={titleId}>{title}</h2></div>
          <button type="button" className={styles.drawerClose} aria-label="Fermer" onClick={() => setOpen(false)}><X size={18}/></button>
        </header>
        <div className={styles.drawerBody}>{children}</div>
      </aside>
    </div> : null}
  </>
}
