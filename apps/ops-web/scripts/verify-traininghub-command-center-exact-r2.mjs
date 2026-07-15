import fs from 'node:fs'
const required = ['app/traininghub/page.tsx','components/traininghub/internal/TrainingHubCommandCenterExactVisualMatchR2.tsx','app/api/traininghub/internal/command-center/route.ts']
const rows = required.map(file => ({ file, ok: fs.existsSync(file) }))
console.table(rows)
if (rows.some(r => !r.ok)) process.exit(1)
const component = fs.readFileSync('components/traininghub/internal/TrainingHubCommandCenterExactVisualMatchR2.tsx','utf8')
const concepts = ['Pilotez vos partenaires, revenus, sessions, certificats, demandes, risques et opérations en temps réel.','Vue d’ensemble','Score de santé globale','Chaîne opérationnelle','Centre de commandement opérationnel','Portefeuille partenaires — Pipeline','Suivi commercial — Conversion','Planning — Sessions à venir','SLA & Risques','Alertes prioritaires','Actions recommandées']
const missing = concepts.filter(c => !component.includes(c))
if (missing.length) { console.error('Missing:', missing); process.exit(1) }
console.log('TrainingHub Command Center Exact Visual Match R2 verification PASSED.')
