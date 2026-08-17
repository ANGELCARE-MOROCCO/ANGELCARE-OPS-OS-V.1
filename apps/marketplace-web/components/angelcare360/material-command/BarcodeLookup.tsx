'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import styles from './MaterialCommand.module.css'
import type { MaterialItem } from '@/types/angelcare360/material-control'

type DetectorCtor = new (options?: { formats?: string[] }) => { detect(source: ImageBitmapSource): Promise<Array<{ rawValue: string }>> }

export function BarcodeLookup({ schoolId }: { schoolId: string }) {
  const [value,setValue] = useState('')
  const [result,setResult] = useState<MaterialItem | null>(null)
  const [message,setMessage] = useState('')
  const [scanning,setScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)

  const stop = () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    streamRef.current?.getTracks().forEach((track)=>track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setScanning(false)
  }
  useEffect(()=>stop,[])

  async function lookup(barcode = value) {
    const clean = barcode.trim()
    if (!clean) { setMessage('Saisissez ou scannez un code-barres.'); return }
    setMessage('Recherche…'); setResult(null)
    const response = await fetch(`/api/angelcare360/inventory-command?mode=barcode&schoolId=${encodeURIComponent(schoolId)}&barcode=${encodeURIComponent(clean)}`, { cache:'no-store' })
    const payload = await response.json().catch(()=>null) as { item?: MaterialItem; error?: string } | null
    if (response.ok && payload?.item) { setResult(payload.item); setMessage('Article identifié dans l’établissement actif.'); setValue(clean) }
    else setMessage(payload?.error || 'Aucun article ne correspond à ce code-barres.')
  }

  async function start() {
    setMessage('')
    const Detector = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector
    if (!Detector || !navigator.mediaDevices?.getUserMedia) { setMessage('Lecture caméra non disponible dans ce navigateur. La saisie manuelle reste disponible.'); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal:'environment' } }, audio:false })
      streamRef.current = stream
      setScanning(true)
      const video = videoRef.current
      if (!video) { stop(); return }
      video.srcObject = stream
      await video.play()
      const detector = new Detector({ formats:['code_128','code_39','ean_13','ean_8','upc_a','upc_e','qr_code'] })
      const tick = async () => {
        if (!streamRef.current || !videoRef.current) return
        try {
          const codes = await detector.detect(videoRef.current)
          const raw = codes[0]?.rawValue?.trim()
          if (raw) { setValue(raw); stop(); await lookup(raw); return }
        } catch { /* camera stays optional; next frame can recover */ }
        frameRef.current = requestAnimationFrame(tick)
      }
      frameRef.current = requestAnimationFrame(tick)
    } catch { setMessage('Accès caméra refusé ou indisponible. Aucun flux caméra n’est conservé; utilisez la saisie manuelle.'); stop() }
  }

  return <section className={styles.scannerPanel}>
    <div className={styles.panelHead}><div><p className={styles.eyebrow}>IDENTITÉ MATÉRIELLE</p><h2>Lecture code-barres</h2><p>La caméra n’est active que pendant cette fenêtre. Aucun flux vidéo n’est stocké.</p></div></div>
    <div className={styles.scannerBody}>
      <div className={styles.search}><input aria-label="Code-barres" value={value} onChange={(e)=>setValue(e.target.value)} onKeyDown={(e)=>{if(e.key==='Enter') void lookup()}} placeholder="Saisir un code-barres…" /></div>
      <div className={styles.scannerActions}><button className={styles.button} onClick={()=>void lookup()}>Rechercher</button>{scanning?<button className={styles.buttonDanger} onClick={stop}>Arrêter la caméra</button>:<button className={styles.buttonGhost} onClick={()=>void start()}>Scanner avec la caméra</button>}</div>
      <video ref={videoRef} className={styles.video} playsInline muted hidden={!scanning} />
      {message ? <div className={styles.notice} data-tone={result?'success':undefined}>{message}</div> : null}
      {result ? <Link className={styles.scanResult} href={result.detailHref}><strong>{result.label}</strong><span>{result.code} · Stock {result.currentStock} {result.unit} · {result.categoryLabel || 'Sans catégorie lisible'}</span></Link> : null}
    </div>
  </section>
}
