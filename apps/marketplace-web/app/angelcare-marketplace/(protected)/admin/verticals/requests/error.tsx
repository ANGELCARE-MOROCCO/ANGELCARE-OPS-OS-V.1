'use client'
export default function ErrorPage({reset}:{reset:()=>void}){return <section role="alert" style={{padding:40}}><h2>Le registre de réception ne peut pas être chargé.</h2><p>Vérifiez la connexion et la migration Operational Reception R1. Aucun résultat vide n’est présenté comme une lecture réussie.</p><button onClick={reset}>Réessayer</button></section>}
