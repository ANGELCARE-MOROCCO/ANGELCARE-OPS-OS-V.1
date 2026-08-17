import styles from './CommunicationCommand.module.css'
import CommunicationActionForm from './CommunicationActionForm'
import type { SanilaCommunicationPreference, SanilaReferencePerson } from '@/types/angelcare360/communication-command'

export default function PreferencesCommand({
  preferences,
  guardians,
  staff,
}: {
  preferences: SanilaCommunicationPreference[]
  guardians: SanilaReferencePerson[]
  staff: SanilaReferencePerson[]
}) {
  return (
    <div className={styles.stack}>
      <section className={styles.sectionPanel}>
        <div className={styles.panelHead}>
          <div>
            <p className={styles.eyebrow}>Consent & Preference Governance</p>
            <h2>Préférences destinataires</h2>
            <p>
              Consentement, activation, langue et fenêtres calmes sont visibles comme des faits de gouvernance.
              Ils ne garantissent jamais la disponibilité d’un fournisseur externe.
            </p>
          </div>
          <div className={styles.panelMeta}>{preferences.length} préférence(s)</div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.listTable}>
            <thead>
              <tr>
                <th>Destinataire</th><th>Type</th><th>Canal</th><th>Actif</th><th>Consentement</th><th>Langue</th><th>Heures calmes</th>
              </tr>
            </thead>
            <tbody>
              {preferences.map((p) => (
                <tr key={p.id}>
                  <td>{p.recipient_label || p.recipient_id || '—'}</td>
                  <td>{p.recipient_type}</td>
                  <td>{p.channel}</td>
                  <td>{p.is_enabled ? 'Oui' : 'Non'}</td>
                  <td>{p.consent_status}</td>
                  <td>{p.language_code}</td>
                  <td>{Object.keys(p.quiet_hours_json || {}).length ? JSON.stringify(p.quiet_hours_json) : 'Non défini'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className={styles.grid2}>
        <CommunicationActionForm
          title="Déclarer / mettre à jour une préférence"
          description="Utilise l’autorité RPC existante. Le consentement reste explicite et auditable."
          endpoint="/api/angelcare360/communication-command" action="preference.update"
          submitLabel="Enregistrer la préférence"
          initial={{ recipientType: 'guardian', channel: 'whatsapp', isEnabled: 'true', consentStatus: 'explicit', languageCode: 'fr' }}
          fields={[
            { name: 'recipientType', label: 'Type', kind: 'select', options: [{ label: 'Parent', value: 'guardian' }, { label: 'Personnel', value: 'staff' }] },
            { name: 'recipientId', label: 'Identifiant destinataire', helper: 'Sélectionnez/copiez un identifiant depuis les référentiels affichés dans SANILA.' },
            { name: 'channel', label: 'Canal', kind: 'select', options: [{ label: 'Interne', value: 'internal' }, { label: 'Email', value: 'email' }, { label: 'WhatsApp', value: 'whatsapp' }, { label: 'SMS', value: 'sms' }, { label: 'Push', value: 'push' }] },
            { name: 'isEnabled', label: 'Activé', kind: 'boolean', options: [{ label: 'Oui', value: 'true' }, { label: 'Non', value: 'false' }] },
            { name: 'consentStatus', label: 'Consentement', kind: 'select', options: [{ label: 'Explicite', value: 'explicit' }, { label: 'Implicite', value: 'implicit' }, { label: 'Opt-out', value: 'opted_out' }, { label: 'Bloqué', value: 'blocked' }, { label: 'Inconnu', value: 'unknown' }] },
            { name: 'languageCode', label: 'Langue', kind: 'select', options: [{ label: 'Français', value: 'fr' }, { label: 'Arabe', value: 'ar' }, { label: 'Anglais', value: 'en' }] },
          ]}
        />

        <section className={styles.studio}>
          <div className={styles.studioHead}>
            <div>
              <h3>Référentiels destinataires</h3>
              <p>Repères d’identité disponibles pour construire les préférences sans deviner les UUID.</p>
            </div>
          </div>
          <div className={styles.studioBody}>
            <div className={styles.grid2}>
              <div className={styles.channelCard}>
                <strong>Parents</strong>
                <span>{guardians.slice(0, 12).map((g) => `${g.label} · ${g.id.slice(0, 8)}`).join(' | ') || 'Aucun'}</span>
              </div>
              <div className={styles.channelCard}>
                <strong>Personnel</strong>
                <span>{staff.slice(0, 12).map((s) => `${s.label} · ${s.id.slice(0, 8)}`).join(' | ') || 'Aucun'}</span>
              </div>
            </div>
            <p className={styles.helper}>
              Les heures calmes ci-dessous sont enregistrées comme gouvernance de préférence. Aucun blocage horaire n’est inventé par l’interface.
            </p>
          </div>
        </section>
      </div>

      <CommunicationActionForm
        title="Heures calmes & gouvernance"
        description="Mettre à jour une préférence existante avec une fenêtre calme explicite."
        endpoint="/api/angelcare360/communication-command"
        action="preference.governance"
        submitLabel="Enregistrer la gouvernance"
        fields={[
          { name: 'preferenceId', label: 'Préférence', kind: 'select', required: true, options: preferences.map((p) => ({ label: `${p.recipient_label || p.recipient_type} · ${p.channel}`, value: p.id })) },
          { name: 'quietStart', label: 'Début heures calmes', placeholder: '21:00' },
          { name: 'quietEnd', label: 'Fin heures calmes', placeholder: '07:00' },
          { name: 'timezone', label: 'Fuseau', placeholder: 'Africa/Casablanca' },
        ]}
      />
    </div>
  )
}
