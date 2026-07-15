import type { InterventionsState, InterventionTemplate } from './types'
import { addMinutes } from './format'

const now = new Date('2026-05-30T09:00:00+01:00')
const iso = (d: Date) => d.toISOString()

export const INTERVENTION_TEMPLATES: InterventionTemplate[] = [
  { id: 'tpl-doctor-home', name: 'Consultation médicale à domicile', category: 'Médecin', requiredRole: 'Médecin', durationMinutes: 45, basePriceMad: 450, checklist: ['Confirmer identité bénéficiaire', 'Évaluation générale', 'Note médicale opérationnelle', 'Recommandations famille'], equipment: ['Tensiomètre', 'Oxymètre', 'Kit diagnostic'], riskLevel: 'Modéré', requiredDocuments: ['Consentement', 'Ordonnance si disponible'], slaMinutes: 120 },
  { id: 'tpl-general-assessment', name: 'Évaluation générale', category: 'Médecin', requiredRole: 'Médecin', durationMinutes: 60, basePriceMad: 520, checklist: ['Constantes', 'Évaluation autonomie', 'Plan de suivi', 'Compte rendu'], equipment: ['Tensiomètre', 'Glycomètre'], riskLevel: 'Modéré', requiredDocuments: ['Consentement'], slaMinutes: 240 },
  { id: 'tpl-post-op', name: 'Suivi post-opératoire', category: 'Infirmier', requiredRole: 'Infirmier', durationMinutes: 50, basePriceMad: 320, checklist: ['Vérifier ordonnance', 'Contrôle plaie', 'Pansement si requis', 'Alerte complication'], equipment: ['Kit pansement stérile', 'Gants', 'Désinfectant'], riskLevel: 'Élevé', requiredDocuments: ['Ordonnance', 'Consentement'], slaMinutes: 180 },
  { id: 'tpl-injection', name: 'Injection', category: 'Infirmier', requiredRole: 'Infirmier', durationMinutes: 25, basePriceMad: 180, checklist: ['Vérifier ordonnance', 'Vérifier produit', 'Injection', 'Surveillance courte'], equipment: ['Kit injection', 'Collecteur DASRI'], riskLevel: 'Modéré', requiredDocuments: ['Ordonnance'], slaMinutes: 180 },
  { id: 'tpl-pansement', name: 'Pansement', category: 'Infirmier', requiredRole: 'Infirmier', durationMinutes: 35, basePriceMad: 220, checklist: ['Préparer champ', 'Nettoyer zone', 'Pansement', 'Photo/document si autorisé'], equipment: ['Kit pansement', 'Désinfectant', 'Gants'], riskLevel: 'Modéré', requiredDocuments: ['Ordonnance si soin prescrit'], slaMinutes: 240 },
  { id: 'tpl-sample', name: 'Prélèvement', category: 'Infirmier', requiredRole: 'Infirmier', durationMinutes: 30, basePriceMad: 260, checklist: ['Vérifier identité', 'Étiquetage tubes', 'Prélèvement', 'Chaîne transport laboratoire'], equipment: ['Kit prélèvement', 'Glacière légère'], riskLevel: 'Modéré', requiredDocuments: ['Prescription'], slaMinutes: 180 },
  { id: 'tpl-monitoring', name: 'Surveillance tension/glycémie', category: 'Infirmier', requiredRole: 'Infirmier', durationMinutes: 30, basePriceMad: 200, checklist: ['Tension', 'Glycémie', 'Symptômes', 'Alerte si seuil dépassé'], equipment: ['Tensiomètre', 'Glycomètre'], riskLevel: 'Faible', requiredDocuments: [], slaMinutes: 360 },
  { id: 'tpl-adult-hygiene', name: 'Aide toilette', category: 'Adult care', requiredRole: 'Aide-soignant', durationMinutes: 60, basePriceMad: 180, checklist: ['Respect intimité', 'Aide toilette', 'Prévention chute', 'Retour famille'], equipment: ['Kit hygiène', 'Gants'], riskLevel: 'Faible', requiredDocuments: ['Consentement famille'], slaMinutes: 480 },
  { id: 'tpl-daily-support', name: 'Accompagnement quotidien', category: 'Adult care', requiredRole: 'Auxiliaire de vie', durationMinutes: 120, basePriceMad: 300, checklist: ['Arrivée domicile', 'Aide mobilité', 'Accompagnement', 'Compte rendu famille'], equipment: [], riskLevel: 'Faible', requiredDocuments: ['Contrat service'], slaMinutes: 720 },
  { id: 'tpl-elder-watch', name: 'Surveillance personne âgée', category: 'Adult care', requiredRole: 'Aide-soignant', durationMinutes: 90, basePriceMad: 260, checklist: ['Présence', 'Hydratation', 'Mobilité', 'Signalement risque'], equipment: ['Téléphone urgence'], riskLevel: 'Modéré', requiredDocuments: ['Consentement famille'], slaMinutes: 360 },
  { id: 'tpl-mobility', name: 'Aide mobilité', category: 'Adult care', requiredRole: 'Aide-soignant', durationMinutes: 45, basePriceMad: 160, checklist: ['Évaluer environnement', 'Assistance déplacement', 'Prévention chute'], equipment: ['Déambulateur si requis'], riskLevel: 'Modéré', requiredDocuments: [], slaMinutes: 360 },
  { id: 'tpl-equipment-delivery', name: 'Livraison matériel médical', category: 'Équipement', requiredRole: 'Technicien Équipement', durationMinutes: 45, basePriceMad: 250, checklist: ['Vérifier matériel', 'Livraison', 'Installation simple', 'Signature réception'], equipment: ['Bon équipement'], riskLevel: 'Faible', requiredDocuments: ['Bon de livraison'], slaMinutes: 480 },
  { id: 'tpl-med-bed', name: 'Installation lit médicalisé', category: 'Équipement', requiredRole: 'Technicien Équipement', durationMinutes: 90, basePriceMad: 600, checklist: ['Contrôle accès', 'Installation', 'Test sécurité', 'Brief famille'], equipment: ['Lit médicalisé', 'Kit outils'], riskLevel: 'Modéré', requiredDocuments: ['Bon équipement'], slaMinutes: 720 },
  { id: 'tpl-wheelchair', name: 'Installation fauteuil roulant', category: 'Équipement', requiredRole: 'Technicien Équipement', durationMinutes: 45, basePriceMad: 220, checklist: ['Contrôle fauteuil', 'Réglages', 'Consignes usage', 'Signature'], equipment: ['Fauteuil roulant'], riskLevel: 'Faible', requiredDocuments: ['Bon équipement'], slaMinutes: 480 },
  { id: 'tpl-maintenance', name: 'Maintenance équipement', category: 'Équipement', requiredRole: 'Technicien Équipement', durationMinutes: 75, basePriceMad: 350, checklist: ['Diagnostic', 'Maintenance', 'Test', 'Historique mouvement'], equipment: ['Kit maintenance'], riskLevel: 'Modéré', requiredDocuments: ['Fiche équipement'], slaMinutes: 720 },
  { id: 'tpl-recovery', name: 'Récupération équipement', category: 'Équipement', requiredRole: 'Chauffeur', durationMinutes: 45, basePriceMad: 180, checklist: ['Confirmer adresse', 'Récupérer équipement', 'État retour', 'Mouvement dépôt'], equipment: ['Bon retour'], riskLevel: 'Faible', requiredDocuments: ['Bon retour'], slaMinutes: 720 },
  { id: 'tpl-partner-school', name: 'Intervention partenaire crèche/école/entreprise', category: 'Partenaire', requiredRole: 'Coordinateur', durationMinutes: 120, basePriceMad: 900, checklist: ['Brief partenaire', 'Contrôle présence', 'Exécution service', 'Rapport institution'], equipment: ['Kit partenaire'], riskLevel: 'Modéré', requiredDocuments: ['Convention partenaire'], slaMinutes: 1440 },
]

export const INTERVENTION_SEED_STATE: InterventionsState = {
  templates: INTERVENTION_TEMPLATES,
  staff: [
    { id: 'stf-001', fullName: 'Dr. Salma Benkirane', role: 'Médecin', phone: '+212 661 20 30 40', city: 'Rabat', zone: 'Agdal', availability: 'Disponible', workload: 62, certifications: ['Médecine générale', 'Urgence légère'], expiresAt: '2027-02-01', emergencyEligible: true, skills: ['consultation', 'post-op', 'triage'] },
    { id: 'stf-002', fullName: 'Youssef El Amrani', role: 'Infirmier', phone: '+212 662 44 18 90', city: 'Témara', zone: 'Centre', availability: 'Occupé', workload: 78, certifications: ['Soins infirmiers', 'Prélèvements'], expiresAt: '2026-12-18', emergencyEligible: true, skills: ['injection', 'pansement', 'prélèvement'] },
    { id: 'stf-003', fullName: 'Nadia Alaoui', role: 'Aide-soignant', phone: '+212 663 77 12 08', city: 'Salé', zone: 'Hay Salam', availability: 'Disponible', workload: 41, certifications: ['Adult care', 'Prévention chute'], expiresAt: '2026-09-10', emergencyEligible: false, skills: ['aide toilette', 'mobilité', 'surveillance'] },
    { id: 'stf-004', fullName: 'Karim Bennis', role: 'Technicien Équipement', phone: '+212 664 21 78 11', city: 'Casablanca', zone: 'Maarif', availability: 'Urgence seulement', workload: 58, certifications: ['Matériel médical', 'Maintenance'], expiresAt: '2027-01-15', emergencyEligible: true, skills: ['lit médicalisé', 'fauteuil roulant', 'maintenance'] },
    { id: 'stf-005', fullName: 'Hicham Tazi', role: 'Chauffeur', phone: '+212 665 19 41 55', city: 'Rabat', zone: 'Souissi', availability: 'Disponible', workload: 36, certifications: ['Transport léger'], emergencyEligible: true, skills: ['tournée', 'récupération équipement'] },
  ],
  locations: [
    { id: 'loc-001', name: 'Domicile Mme El Idrissi', type: 'Domicile patient', city: 'Rabat', zone: 'Agdal', address: 'Rue Oued Sebou, Agdal, Rabat', accessNotes: 'Ascenseur, appeler la fille 10 min avant.', linkedPatient: 'Mme Amina El Idrissi' },
    { id: 'loc-002', name: 'Domicile M. Bennani', type: 'Domicile patient', city: 'Témara', zone: 'Centre', address: 'Avenue Hassan II, Témara', accessNotes: 'Villa avec gardien, code communiqué par famille.', linkedPatient: 'M. Abdel Bennani' },
    { id: 'loc-003', name: 'Crèche Les Petits Anges', type: 'Crèche / école partenaire', city: 'Salé', zone: 'Tabriquet', address: 'Avenue des Écoles, Salé', accessNotes: 'Demander direction avant accès salles.', linkedPatient: 'Partenaire B2B' },
  ],
  requests: [
    { id: 'req-001', reference: 'DEM-260530-001', patientName: 'Mme Amina El Idrissi', contactName: 'Sara El Idrissi', phone: '+212 661 11 22 33', city: 'Rabat', zone: 'Agdal', address: 'Rue Oued Sebou, Agdal', category: 'Médecin', templateId: 'tpl-doctor-home', requestedAt: iso(addMinutes(now, -80)), preferredWindow: 'Aujourd’hui 11:00 - 13:00', riskLevel: 'Élevé', status: 'À trier', estimatedAmountMad: 450, source: 'Téléphone', notes: 'Fièvre légère et fatigue, famille demande consultation rapide.', consentStatus: 'À collecter' },
    { id: 'req-002', reference: 'DEM-260530-002', patientName: 'M. Abdel Bennani', contactName: 'Omar Bennani', phone: '+212 662 98 88 71', city: 'Témara', zone: 'Centre', address: 'Avenue Hassan II, Témara', category: 'Infirmier', templateId: 'tpl-pansement', requestedAt: iso(addMinutes(now, -140)), preferredWindow: 'Aujourd’hui 15:00 - 17:00', riskLevel: 'Modéré', status: 'Validée', estimatedAmountMad: 220, source: 'WhatsApp', notes: 'Pansement post-opératoire, ordonnance disponible.', consentStatus: 'Collecté' },
    { id: 'req-003', reference: 'DEM-260530-003', patientName: 'Crèche Les Petits Anges', contactName: 'Directrice crèche', phone: '+212 663 44 55 66', city: 'Salé', zone: 'Tabriquet', address: 'Avenue des Écoles, Salé', category: 'Partenaire', templateId: 'tpl-partner-school', requestedAt: iso(addMinutes(now, -240)), preferredWindow: 'Demain 09:00 - 11:00', riskLevel: 'Modéré', status: 'En attente devis', estimatedAmountMad: 900, source: 'Partenaire', notes: 'Intervention partenaire crèche avec rapport institution.', consentStatus: 'Non requis' },
  ],
  orders: [
    { id: 'ord-001', reference: 'ORD-260530-001', requestId: 'req-002', patientName: 'M. Abdel Bennani', city: 'Témara', zone: 'Centre', category: 'Infirmier', status: 'Planifiée', riskLevel: 'Modéré', assignedStaffIds: ['stf-002'], appointmentId: 'apt-001', routeId: 'rte-001', requiredEquipment: ['Kit pansement', 'Désinfectant'], checklist: ['Vérifier ordonnance', 'Nettoyer zone', 'Pansement', 'Compte rendu famille'], billingStatus: 'Facturable', amountMad: 220, slaDueAt: iso(addMinutes(now, 300)), createdAt: iso(addMinutes(now, -120)) },
    { id: 'ord-002', reference: 'ORD-260530-002', requestId: 'req-001', patientName: 'Mme Amina El Idrissi', city: 'Rabat', zone: 'Agdal', category: 'Médecin', status: 'À assigner', riskLevel: 'Élevé', assignedStaffIds: [], requiredEquipment: ['Tensiomètre', 'Oxymètre'], checklist: ['Confirmer identité', 'Évaluation générale', 'Compte rendu'], billingStatus: 'Non facturé', amountMad: 450, slaDueAt: iso(addMinutes(now, 120)), createdAt: iso(addMinutes(now, -40)) },
  ],
  appointments: [
    { id: 'apt-001', orderId: 'ord-001', reference: 'RDV-260530-001', startsAt: iso(addMinutes(now, 360)), endsAt: iso(addMinutes(now, 410)), status: 'Planifiée', staffIds: ['stf-002'], locationId: 'loc-002', routeId: 'rte-001' },
  ],
  routes: [
    { id: 'rte-001', name: 'Tournée infirmière Témara - PM', date: '2026-05-30', city: 'Témara', zone: 'Centre', staffId: 'stf-002', driverId: 'stf-005', status: 'Planifiée', stopIds: ['stop-001'] },
  ],
  routeStops: [
    { id: 'stop-001', routeId: 'rte-001', orderId: 'ord-001', sequence: 1, plannedTime: iso(addMinutes(now, 360)), status: 'Planifiée', notes: 'Appeler Omar avant arrivée.' },
  ],
  equipment: [
    { id: 'eq-001', name: 'Tensiomètre Omron Pro', type: 'Diagnostic', serial: 'AC-TENS-014', status: 'Disponible', city: 'Rabat', zone: 'Dépôt Agdal', nextMaintenanceAt: '2026-08-15' },
    { id: 'eq-002', name: 'Kit pansement stérile', type: 'Consommable', status: 'Réservé', city: 'Témara', zone: 'Centre', assignedOrderId: 'ord-001' },
    { id: 'eq-003', name: 'Lit médicalisé électrique', type: 'Matériel médical', serial: 'AC-LIT-006', status: 'En maintenance', city: 'Casablanca', zone: 'Dépôt Maarif', nextMaintenanceAt: '2026-06-03' },
    { id: 'eq-004', name: 'Fauteuil roulant pliable', type: 'Mobilité', serial: 'AC-FR-019', status: 'Disponible', city: 'Rabat', zone: 'Dépôt Souissi' },
  ],
  incidents: [
    { id: 'inc-001', orderId: 'ord-002', title: 'Risque SLA consultation urgente', riskLevel: 'Élevé', status: 'Ouvert', owner: 'Coordinateur Dispatch', createdAt: iso(addMinutes(now, -20)) },
  ],
  invoices: [
    { id: 'inv-001', orderId: 'ord-001', reference: 'FAC-260530-001', patientName: 'M. Abdel Bennani', amountMad: 220, paidMad: 0, status: 'Émise', dueAt: '2026-06-02' },
  ],
  audits: [
    { id: 'aud-001', at: iso(addMinutes(now, -140)), actor: 'Support Client', role: 'Support', entityType: 'request', entityId: 'req-002', event: 'request created', summary: 'Demande pansement créée depuis WhatsApp.', riskLevel: 'Modéré' },
    { id: 'aud-002', at: iso(addMinutes(now, -120)), actor: 'Coordinateur Dispatch', role: 'Dispatch', entityType: 'order', entityId: 'ord-001', event: 'order created', summary: 'Ordre d’intervention créé et planifié.', riskLevel: 'Modéré' },
    { id: 'aud-003', at: iso(addMinutes(now, -40)), actor: 'Superviseur Médical', role: 'Superviseur', entityType: 'order', entityId: 'ord-002', event: 'request converted', summary: 'Consultation à domicile convertie en ordre urgent.', riskLevel: 'Élevé' },
  ],
}
