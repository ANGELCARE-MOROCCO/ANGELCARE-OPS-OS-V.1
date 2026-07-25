"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"

export default function ContentCommandCenterError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="cc360-route-state">
      <section className="cc360-error-state">
        <span><AlertTriangle className="h-7 w-7" /></span>
        <div>
          <small>CONTENT COMMAND 360 · ÉTAT PARTIEL</small>
          <h1>Le workspace n’a pas pu être chargé complètement.</h1>
          <p>Les autres zones Market OS restent disponibles. Réessayez le chargement de cette route sans modifier les records existants.</p>
          {error.digest ? <code>Référence : {error.digest}</code> : null}
          <button type="button" onClick={reset}><RefreshCw className="h-4 w-4" /> Réessayer</button>
        </div>
      </section>
    </main>
  )
}
