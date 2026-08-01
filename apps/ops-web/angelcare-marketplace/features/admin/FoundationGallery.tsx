import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  LockKeyhole,
} from 'lucide-react'
import styles from '../../design-system/marketplace.module.css'
import {
  Button,
  ButtonLink,
  Card,
  PageHeader,
  StatusChip,
} from '../../design-system/ui'

export function FoundationGallery() {
  return (
    <>
      <PageHeader
        eyebrow="Design system gouverné"
        title="Inventaire visuel et états"
        description="Cette route démontre les primitives du socle. Les valeurs affichées sont explicitement des exemples de composants, jamais des métriques de production."
      />
      <div className={styles.stack}>
        <Card title="Actions et hiérarchie" subtitle="Exemples de composants — aucune action commerciale simulée">
          <div className={styles.inline}>
            <Button type="button">Action principale</Button>
            <Button type="button" variant="secondary">Action secondaire</Button>
            <Button type="button" variant="quiet">Action discrète</Button>
            <Button type="button" variant="danger">Action sensible</Button>
            <Button type="button" disabled>Action indisponible</Button>
          </div>
        </Card>
        <Card title="États contractuels" subtitle="Chaque domaine précisera ses transitions autorisées">
          <div className={styles.inline}>
            {['ready', 'in_progress', 'not_started', 'blocked', 'disabled', 'archived', 'permission_denied'].map((status) => (
              <StatusChip key={status} status={status} />
            ))}
          </div>
        </Card>
        <div className={styles.gridTwo}>
          <Card title="Messages opérationnels">
            <div className={styles.stack}>
              <div className={styles.noticeSuccess}><CheckCircle2 size={18} /><div><strong>Succès.</strong> L’action est confirmée et la prochaine étape est identifiable.</div></div>
              <div className={styles.noticeWarning}><AlertTriangle size={18} /><div><strong>Attention.</strong> Une condition bloque l’activation complète.</div></div>
              <div className={styles.noticeDanger}><LockKeyhole size={18} /><div><strong>Accès refusé.</strong> Le rôle ne permet pas cette action.</div></div>
              <div className={styles.notice}><LoaderCircle size={18} /><div><strong>Traitement.</strong> Le système conserve un état lisible pendant l’attente.</div></div>
            </div>
          </Card>
          <Card title="Formulaire et validation">
            <div className={styles.stack}>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Libellé métier *</span>
                <input className={styles.textField} placeholder="Texte business lisible" />
                <span className={styles.fieldHelp}>Aide concise expliquant l’usage et le format.</span>
              </label>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Décision</span>
                <select className={styles.selectField}><option>Sélection contrôlée</option></select>
              </label>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Justification</span>
                <textarea className={styles.textArea} />
                <span className={styles.fieldError}>Exemple d’erreur associée au champ.</span>
              </label>
            </div>
          </Card>
        </div>
        <Card title="Prévisualisation arabe RTL" subtitle="Le logo n’est pas inversé ; la lecture, les alignements et l’ordre des actions s’adaptent.">
          <div className={styles.rtlPreview} dir="rtl" lang="ar">
            <h2 className={styles.pageTitle}>منصة ANGELCARE الموثوقة لخدمات الأطفال</h2>
            <p className={styles.pageDescription}>
              بنية جاهزة للغة العربية، مع وضوح في الصلاحيات والحالة والخطوة التالية دون كشف أي تفاصيل تقنية للمستخدم.
            </p>
            <div className={styles.heroActions}>
              <Button type="button">الإجراء الرئيسي</Button>
              <ButtonLink href="/angelcare-marketplace/admin/foundation-ui" variant="secondary">الإجراء الثانوي</ButtonLink>
            </div>
          </div>
        </Card>
        <Card title="Chargement documenté" subtitle="Skeletons calmes, sans inventer le résultat à venir.">
          <div className={styles.stack}>
            <div className={styles.skeleton} style={{ width: '36%', height: 18 }} />
            <div className={styles.skeleton} style={{ width: '88%', height: 12 }} />
            <div className={styles.skeleton} style={{ width: '74%', height: 12 }} />
            <div className={styles.skeleton} style={{ width: '100%', height: 96 }} />
          </div>
        </Card>
      </div>
    </>
  )
}
