
'use client'
import { useMemo, useState } from 'react'
import styles from './CommunicationCommand.module.css'

export default function TemplateRenderStudio({ templateKey, variablesSchema }: { templateKey: string; variablesSchema: Record<string, unknown> }) {
  const initial = useMemo(() => JSON.stringify(Object.fromEntries(Object.keys(variablesSchema || {}).map((key) => [key, ''])), null, 2), [variablesSchema])
  const [variables, setVariables] = useState(initial === '{}' ? '{\n  \"example\": \"Valeur de prévisualisation\"\n}' : initial)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  async function render() {
    setError(null); setResult(null)
    let parsed: Record<string, unknown>
    try { parsed = JSON.parse(variables) } catch { setError('Le JSON des variables est invalide.'); return }
    setPending(true)
    try {
      const response = await fetch('/api/angelcare360/communication-command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'template.render', payload: { templateKey, variables: parsed } }) })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.ok) { setError(data?.error || 'Prévisualisation impossible.'); return }
      setResult(data)
    } finally { setPending(false) }
  }
  return <section className={styles.studio}><div className={styles.studioHead}><div><h3>Render & Variable Safety Lab</h3><p>Prévisualisation par l’autorité RPC réelle. Aucun message n’est envoyé.</p></div></div><div className={styles.studioBody}><label className={styles.fieldFull}><span className={styles.label}>Variables JSON</span><textarea className={styles.textarea} value={variables} onChange={e=>setVariables(e.target.value)} spellCheck={false}/><span className={styles.helper}>Toute variable inconnue ou non résolue reste visible dans le résultat du moteur ; cette action n’effectue aucun dispatch.</span></label>{result?<pre className={styles.codeBlock}>{JSON.stringify(result,null,2)}</pre>:null}{error?<div className={styles.feedback} data-error="true">{error}</div>:null}</div><div className={styles.studioFooter}><button className={styles.button} type="button" onClick={()=>void render()} disabled={pending}>{pending?'Rendu…':'Prévisualiser avec le moteur réel'}</button></div></section>
}
