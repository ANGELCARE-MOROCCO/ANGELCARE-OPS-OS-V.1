"use client"

import * as React from "react"
import { Command, Search, X } from "lucide-react"
import styles from "./content-command-shell.module.css"

export type ContentCommandSearchResult = {
  id: string
  type: "Contenu" | "Tâche" | "Asset" | "Brief" | "Workspace" | "Action"
  title: string
  detail: string
  href?: string
  action?: () => void
  provenance: "Workspace" | "Données locales" | "Action shell"
}

type ContentCommandCommandPaletteProps = {
  open: boolean
  results: ContentCommandSearchResult[]
  query: string
  onQueryChange: (value: string) => void
  onClose: () => void
  onSelect: (result: ContentCommandSearchResult) => void
}

export default function ContentCommandCommandPalette({
  open,
  results,
  query,
  onQueryChange,
  onClose,
  onSelect,
}: ContentCommandCommandPaletteProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const dialogRef = React.useRef<HTMLElement>(null)
  const previousFocusRef = React.useRef<HTMLElement | null>(null)
  const [activeIndex, setActiveIndex] = React.useState(0)

  React.useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.style.overflow = "hidden"
    window.setTimeout(() => inputRef.current?.focus(), 20)
    return () => {
      document.body.style.overflow = previousOverflow
      previousFocusRef.current?.focus()
    }
  }, [open])

  React.useEffect(() => {
    setActiveIndex(0)
  }, [query, results.length])

  React.useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key === "ArrowDown") {
        event.preventDefault()
        setActiveIndex((index) => (results.length ? (index + 1) % results.length : 0))
        return
      }
      if (event.key === "ArrowUp") {
        event.preventDefault()
        setActiveIndex((index) => (results.length ? (index - 1 + results.length) % results.length : 0))
        return
      }
      if (event.key === "Tab") {
        const dialog = dialogRef.current
        if (!dialog) return
        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
          ),
        )
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
        return
      }
      if (event.key === "Enter" && results[activeIndex]) {
        event.preventDefault()
        onSelect(results[activeIndex])
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [activeIndex, onClose, onSelect, open, results])

  if (!open) return null

  return (
    <div className={styles.paletteBackdrop} role="presentation" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className={styles.palette}
        role="dialog"
        aria-modal="true"
        aria-label="Recherche et commande Content Command"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.paletteHeader}>
          <div>
            <span className={styles.paletteHeaderIcon}><Command aria-hidden="true" /></span>
            <span><strong>Command Palette</strong><small>Navigation, recherche et actions autorisées</small></span>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer la recherche">
            <X aria-hidden="true" />
          </button>
        </header>

        <label className={styles.paletteSearch}>
          <Search aria-hidden="true" />
          <span className={styles.srOnly}>Rechercher</span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Workspace, contenu, tâche, asset, brief ou commande…"
            aria-controls="cc-command-results"
            aria-activedescendant={results[activeIndex] ? `cc-command-result-${activeIndex}` : undefined}
          />
          <kbd>ESC</kbd>
        </label>

        <div className={styles.paletteStatus} aria-live="polite">
          <span>{results.length} résultat{results.length === 1 ? "" : "s"}</span>
          <span>↑ ↓ naviguer · Entrée ouvrir</span>
        </div>

        <div id="cc-command-results" className={styles.paletteResults} role="listbox">
          {results.map((result, index) => (
            <button
              key={`${result.type}-${result.id}`}
              id={`cc-command-result-${index}`}
              type="button"
              className={`${styles.paletteResult} ${index === activeIndex ? styles.paletteResultActive : ""}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => onSelect(result)}
              role="option"
              aria-selected={index === activeIndex}
            >
              <span className={styles.resultType}>{result.type}</span>
              <span className={styles.resultCopy}>
                <strong>{result.title}</strong>
                <small>{result.detail}</small>
              </span>
              <span className={styles.resultProvenance}>{result.provenance}</span>
            </button>
          ))}
          {results.length === 0 ? (
            <div className={styles.paletteEmpty}>
              <Search aria-hidden="true" />
              <strong>Aucun résultat</strong>
              <p>Modifiez la recherche ou parcourez les divisions depuis la sidebar souveraine.</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
