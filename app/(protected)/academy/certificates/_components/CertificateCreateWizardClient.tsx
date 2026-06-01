'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

export type OptionRow = {
  id: string
  label: string
  sub?: string
  meta?: Record<string, string>
}

type WizardProps = {
  trainees: OptionRow[]
  courses: OptionRow[]
  groups: OptionRow[]
  trainers: OptionRow[]
  defaultCertificateNumber: string
  saveAction: (formData: FormData) => Promise<void>
}

type CertificateFormState = {
  certificateName: string
  certificateType: string
  certificateNumber: string
  recipientId: string
  manualRecipientName: string
  courseId: string
  groupId: string
  trainerId: string
  cin: string
  completionDate: string
  specializationFr: string
  specializationEn: string
  specializationAr: string
  trainingTypeFr: string
  trainingTypeAr: string
  totalHours: string
  founderName: string
  directorName: string
  founderTitle: string
  directorTitle: string
  certificateRefLabel: string
  status: string
  notes: string
}

const today = new Date().toISOString().slice(0, 10)

function optionLabel(rows: OptionRow[], id: string, fallback = '') {
  return rows.find((row) => String(row.id) === String(id))?.label || fallback
}

function formatDate(input: string) {
  if (!input) return today
  try {
    const date = new Date(`${input}T00:00:00`)
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' })
  } catch {
    return input
  }
}

function makePreviewQr(payload: string) {
  // Preview-only QR texture. The saved certificate still receives a real QR from the server action.
  const seed = payload.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return Array.from({ length: 49 }, (_, index) => ((seed + index * 7 + Math.floor(index / 3)) % 5) < 2)
}

export default function CertificateCreateWizardClient({ trainees, courses, groups, trainers, defaultCertificateNumber, saveAction }: WizardProps) {
  const [step, setStep] = useState<number>(1)
  const [form, setForm] = useState<CertificateFormState>({
    certificateName: 'Attestation de réussite',
    certificateType: 'attestation_reussite',
    certificateNumber: defaultCertificateNumber,
    recipientId: trainees[0]?.id || '',
    manualRecipientName: '',
    courseId: courses[0]?.id || '',
    groupId: groups[0]?.id || '',
    trainerId: trainers[0]?.id || '',
    cin: 'GA207954',
    completionDate: today,
    specializationFr: "Techniques d'accompagnement et animation de base pour enfants de 06 mois à 06 ans dans différents milieux",
    specializationEn: 'Early child care techniques and basic early learning methods applied for children from 06 months to 06 years old in different environments',
    specializationAr: 'تقنيات الرعاية الأساسية و التنشيط الخاص بالأطفال من سن 6 أشهر إلى 6 سنوات في بيئات مختلفة',
    trainingTypeFr: 'Théorique + Pratique',
    trainingTypeAr: 'نظري + عملي',
    totalHours: '15',
    founderName: 'PAMELA P.JACOSALEM',
    directorName: 'AISSAOUI ILYASS',
    founderTitle: 'Fondatrice & Experte en petite enfance.',
    directorTitle: 'Direction.',
    certificateRefLabel: defaultCertificateNumber,
    status: 'issued',
    notes: '',
  })

  const selectedRecipient = optionLabel(trainees, form.recipientId, '')
  const recipientName = (form.manualRecipientName || selectedRecipient || 'KARIMA JARRAH').toUpperCase()
  const courseName = optionLabel(courses, form.courseId, 'Formation professionnelle petite enfance')
  const groupName = optionLabel(groups, form.groupId, 'Session Academy')
  const trainerName = optionLabel(trainers, form.trainerId, form.directorName)
  const displayDate = formatDate(form.completionDate)

  const qrPayload = useMemo(
    () => `ANGELCARE-ACADEMY-CERTIFICATE:${form.certificateNumber}:${form.recipientId || form.manualRecipientName || 'manual'}:${form.completionDate}`,
    [form.certificateNumber, form.recipientId, form.manualRecipientName, form.completionDate],
  )
  const qrCells = useMemo(() => makePreviewQr(qrPayload), [qrPayload])

  function patch<K extends keyof CertificateFormState>(key: K, value: CertificateFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const steps = [
    ['Certificate Details', 'Name, trainee & program'],
    ['Design', 'Official modern template'],
    ['Recipients', 'Recipient and issuance'],
    ['Settings', 'Verification and QR'],
    ['Review', 'Save or publish'],
  ] as const

  const hiddenPayload = {
    ...form,
    recipientName,
    courseName,
    groupName,
    trainerName,
    displayDate,
    qrPayload,
    templateKey: 'angelcare_standard_modern_landscape',
  }

  return <div className="certModalBackdrop">
    <div className="certModal">
      <div className="certTopbar">
        <div>
          <h1>Create New Certificate</h1>
          <p>Official AngelCare Academy certificate builder. Every editable field updates the preview live.</p>
        </div>
        <div className="certTopActions">
          <button type="submit" form="certificate-wizard-form" name="intent" value="draft">▣ Save as Draft</button>
          <button onClick={() => setStep(Math.max(1, step - 1))} type="button">Back</button>
          <button onClick={() => setStep(Math.min(5, step + 1))} type="button" className="primary">Next: {step < 5 ? steps[step][0] : 'Publish'} →</button>
          <Link href="/academy/certificates" aria-label="Close certificate builder">×</Link>
        </div>
      </div>

      <div className="stepper">
        {steps.map(([title, sub], index) => <button key={title} type="button" onClick={() => setStep(index + 1)} className={step === index + 1 ? 'active' : ''}>
          <span>{index + 1}</span><strong>{title}</strong><small>{sub}</small>
        </button>)}
      </div>

      <form id="certificate-wizard-form" action={saveAction} className="certGrid">
        <input type="hidden" name="template_key" value="angelcare_standard_modern_landscape" />
        <input type="hidden" name="preview_payload" value={JSON.stringify(hiddenPayload)} />

        <section className="certCard formPanel">
          <h2>Certificate Prefill Fields</h2>
          <p className="muted">Only the approved Modern AngelCare template is available. Users can edit certificate text safely without breaking the design.</p>

          <label>Certificate Name <input name="certificate_name" value={form.certificateName} onChange={(event) => patch('certificateName', event.target.value)} /></label>
          <div className="two">
            <label>Certificate Type <select name="certificate_type" value={form.certificateType} onChange={(event) => patch('certificateType', event.target.value)}><option value="attestation_reussite">Attestation de réussite</option><option value="certificate_completion">Certificate of Completion</option><option value="diploma">Diploma</option></select></label>
            <label>Status <select name="status" value={form.status} onChange={(event) => patch('status', event.target.value)}><option value="issued">Issued</option><option value="draft">Draft</option><option value="pending">Pending</option></select></label>
          </div>
          <label>Live Trainee <select name="trainee_id" value={form.recipientId} onChange={(event) => patch('recipientId', event.target.value)}><option value="">Manual recipient</option>{trainees.map((trainee) => <option key={trainee.id} value={trainee.id}>{trainee.label}</option>)}</select></label>
          <label>Manual Recipient Name <input name="manual_recipient_name" value={form.manualRecipientName} onChange={(event) => patch('manualRecipientName', event.target.value)} placeholder="Only used if no trainee selected" /></label>
          <label>Related Program <select name="course_id" value={form.courseId} onChange={(event) => patch('courseId', event.target.value)}><option value="">Select program</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.label}</option>)}</select></label>
          <div className="two"><label>Group / Session <select name="group_id" value={form.groupId} onChange={(event) => patch('groupId', event.target.value)}><option value="">No group</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.label}</option>)}</select></label><label>Trainer / Director <select name="trainer_id" value={form.trainerId} onChange={(event) => patch('trainerId', event.target.value)}><option value="">Manual</option>{trainers.map((trainer) => <option key={trainer.id} value={trainer.id}>{trainer.label}</option>)}</select></label></div>
          <div className="two"><label>C.I.N <input name="cin" value={form.cin} onChange={(event) => patch('cin', event.target.value)} /></label><label>Completion Date <input type="date" name="completion_date" value={form.completionDate} onChange={(event) => patch('completionDate', event.target.value)} /></label></div>
          <label>Certificate Reference <input name="certificate_number" value={form.certificateNumber} onChange={(event) => { patch('certificateNumber', event.target.value); patch('certificateRefLabel', event.target.value) }} /></label>
          <div className="templateLock"><span>▧</span><b>Modern</b><small>Official AngelCare template locked. Motifs, seal, bilingual layout and signature zones are preserved.</small></div>
        </section>

        <section className="certCard contentPanel">
          <h2>Live Certificate Text</h2>
          <label>French speciality <textarea name="specialization_fr" value={form.specializationFr} onChange={(event) => patch('specializationFr', event.target.value)} /></label>
          <label>English small text <textarea name="specialization_en" value={form.specializationEn} onChange={(event) => patch('specializationEn', event.target.value)} /></label>
          <label>Arabic speciality <textarea dir="rtl" name="specialization_ar" value={form.specializationAr} onChange={(event) => patch('specializationAr', event.target.value)} /></label>
          <div className="two"><label>Training Type FR <input name="training_type_fr" value={form.trainingTypeFr} onChange={(event) => patch('trainingTypeFr', event.target.value)} /></label><label>Training Type AR <input dir="rtl" name="training_type_ar" value={form.trainingTypeAr} onChange={(event) => patch('trainingTypeAr', event.target.value)} /></label></div>
          <div className="two"><label>Total Hours <input name="total_hours" value={form.totalHours} onChange={(event) => patch('totalHours', event.target.value)} /></label><label>Footer Ref <input name="certificate_ref_label" value={form.certificateRefLabel} onChange={(event) => patch('certificateRefLabel', event.target.value)} /></label></div>
          <div className="two"><label>Founder Name <input name="founder_name" value={form.founderName} onChange={(event) => patch('founderName', event.target.value)} /></label><label>Director Name <input name="director_name" value={form.directorName || trainerName} onChange={(event) => patch('directorName', event.target.value)} /></label></div>
          <label>Internal notes <textarea name="notes" value={form.notes} onChange={(event) => patch('notes', event.target.value)} placeholder="Internal evidence, manager note, issuance context..." /></label>
          <div className="saveBox"><button type="submit" name="intent" value="issued">Create Certificate + Sync Academy</button><button type="submit" name="intent" value="draft">Save Draft</button></div>
        </section>

        <section className="certCard previewPanel">
          <div className="previewHead"><div><h2>Certificate Preview</h2><p>Protected zones prevent overlap. Preview uses the same geometry as the print/PDF renderer.</p></div><button type="button" onClick={() => window.print()}>Full Preview ↗</button></div>
          <div className="certificateShell">
            <div className="certificateCanvas">
              <div className="cornerPattern cornerTopLeft" />
              <div className="cornerPattern cornerTopRight" />
              <div className="cornerPattern cornerBottomLeft" />
              <div className="cornerPattern cornerBottomRight" />

              <header className="certHeader">
                <div className="angelLogo">ANGEL CARE<small>Preschool & Kindergarten</small></div>
                <h3>{form.certificateName}</h3>
                <h4>{recipientName}</h4>
              </header>

              <main className="certBodySafe">
                <section className="frZone">
                  <p className="identity"><b>Carte d'identité nationale C.I.N°:</b><small>*MOROCCAN IDENTIFICATION CARD N°:</small></p>
                  <p>pour sa participation et son excellente performance durant la formation professionnel accompli le:</p>
                  <ul>
                    <li>Spécialité : {form.specializationFr}.</li>
                    <li>Type de formation: {form.trainingTypeFr}.</li>
                    <li>Heures totales: {form.totalHours} heures.</li>
                  </ul>
                  <small className="englishLine">SPECIALITY: {form.specializationEn}. TYPE OF TRAINING: {form.trainingTypeFr}. TOTAL HOURS: {form.totalHours} HOURS.</small>
                </section>

                <section className="centerZone">
                  <strong>*{form.cin || 'GA207954'}*</strong>
                  <strong>*{displayDate}*</strong>
                </section>

                <section className="arZone" dir="rtl">
                  <p>الحاملة للبطاقة الوطنية المغربية رقم:</p>
                  <p>لمشاركتها وأدائها الممتاز خلال التدريب المهني المكتمل في:</p>
                  <ul>
                    <li>التخصص: {form.specializationAr}</li>
                    <li>نوع التدريب: {form.trainingTypeAr}</li>
                    <li>مجموع الساعات: {form.totalHours} ساعة</li>
                  </ul>
                </section>
              </main>

              <div className="sealZone"><div className="goldSeal">FORMATION<br/><b>SUCCÈS</b><small>CERTIFICAT ACADEMY</small></div></div>

              <footer className="footerSafe">
                <section className="signature"><i /><b>{form.founderName}</b><span>{form.founderTitle}</span></section>
                <section className="verificationBlock">
                  <div className="qrGrid" aria-label="Preview QR code">{qrCells.map((filled, index) => <i key={index} className={filled ? 'filled' : ''} />)}</div>
                  <b>{form.certificateRefLabel}</b>
                  <span>QR vérification live</span>
                </section>
                <section className="signature"><i /><b>{form.directorName || trainerName}</b><span>{form.directorTitle}</span></section>
              </footer>
            </div>
          </div>
          <div className="summary"><b>Live sync</b><span>Recipient: {recipientName}</span><span>Program: {courseName}</span><span>Session: {groupName}</span><span>Ref: {form.certificateNumber}</span></div>
        </section>
      </form>
    </div>
    <style jsx>{styles}</style>
  </div>
}

const styles = `
.certModalBackdrop{position:fixed;inset:0;z-index:80;background:rgba(15,23,42,.34);backdrop-filter:blur(14px);display:grid;place-items:center;padding:18px}.certModal{width:min(1920px,calc(100vw - 28px));height:min(1080px,calc(100vh - 28px));background:#f8fafc;border:1px solid #e2e8f0;border-radius:24px;box-shadow:0 35px 120px rgba(15,23,42,.28);overflow:auto;color:#172033}.certTopbar{position:sticky;top:0;z-index:4;background:rgba(255,255,255,.95);backdrop-filter:blur(18px);border-bottom:1px solid #e8edf5;padding:16px 24px;display:flex;justify-content:space-between;gap:18px;align-items:center}.certTopbar h1{margin:0;font-size:26px;letter-spacing:-.04em}.certTopbar p{margin:4px 0 0;color:#64748b;font-weight:800}.certTopActions{display:flex;gap:10px;align-items:center}.certTopActions button,.certTopActions a,.previewHead button{height:44px;border:1px solid #e2e8f0;background:#fff;border-radius:12px;color:#172033;font-weight:950;padding:0 16px;text-decoration:none}.certTopActions .primary{background:#6d4df6;color:#fff;border-color:#6d4df6}.certTopActions a{display:grid;place-items:center;width:44px;padding:0;font-size:24px}.stepper{display:grid;grid-template-columns:repeat(5,1fr);margin:16px 22px;border:1px solid #e8edf5;border-radius:16px;overflow:hidden;background:#fff}.stepper button{border:0;background:#fff;display:grid;grid-template-columns:38px 1fr;gap:8px;align-items:center;text-align:left;padding:15px 18px;color:#64748b}.stepper button span{grid-row:1/3;width:31px;height:31px;border-radius:50%;background:#94a3b8;color:#fff;display:grid;place-items:center;font-weight:950}.stepper button strong{color:#334155}.stepper button small{font-weight:800}.stepper button.active{background:#fbfaff;box-shadow:inset 0 -4px #6d4df6}.stepper button.active span{background:#6d4df6}.stepper button.active strong{color:#6d4df6}.certGrid{display:grid;grid-template-columns:360px 360px minmax(720px,1fr);gap:16px;padding:0 22px 26px}.certCard{background:#fff;border:1px solid #e8edf5;border-radius:18px;padding:20px;box-shadow:0 20px 60px rgba(15,23,42,.045)}.certCard h2{margin:0 0 12px;font-size:19px;letter-spacing:-.03em}.muted{margin:0 0 14px;color:#64748b;font-weight:800}.certCard label{display:grid;gap:7px;margin:0 0 12px;color:#64748b;font-size:12px;font-weight:950}.certCard input,.certCard select,.certCard textarea{width:100%;min-height:42px;border:1px solid #dfe7f2;border-radius:12px;padding:0 13px;background:#fff;color:#172033;font-weight:850;outline:none}.certCard textarea{min-height:74px;padding:11px 13px;resize:vertical}.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}.templateLock{display:grid;place-items:center;text-align:center;border:2px solid #6d4df6;background:#fbfaff;border-radius:16px;padding:14px;color:#6d4df6;gap:4px}.templateLock span{font-size:26px}.templateLock small{color:#64748b;font-weight:800}.saveBox{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.saveBox button{border:1px solid #6d4df6;border-radius:14px;padding:13px;background:#6d4df6;color:#fff;font-weight:950}.saveBox button:last-child{background:#fff;color:#6d4df6}.previewPanel{min-width:0}.previewHead{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}.previewHead h2{margin:0}.previewHead p{margin:4px 0 0;color:#64748b;font-weight:800}.certificateShell{overflow:auto;border-radius:14px}.certificateCanvas{position:relative;width:100%;aspect-ratio:1.414/1;min-width:920px;background:#fff;overflow:hidden;border:5px solid #6d4df6;box-shadow:inset 0 0 0 4px #e8c96a;border-radius:12px;color:#132985;font-family:Georgia,'Times New Roman',serif;padding:0}.cornerPattern{position:absolute;z-index:1;background-color:#6f83c1;background-image:linear-gradient(135deg,rgba(255,255,255,.28) 25%,transparent 25%),linear-gradient(225deg,rgba(255,255,255,.22) 25%,transparent 25%),linear-gradient(45deg,rgba(15,42,130,.65) 25%,transparent 25%),linear-gradient(315deg,rgba(255,255,255,.18) 25%,transparent 25%);background-size:46px 46px;opacity:.98}.cornerTopLeft{left:-115px;top:-115px;width:310px;height:310px;clip-path:polygon(0 0,100% 0,0 100%)}.cornerTopRight{right:-112px;top:-112px;width:310px;height:310px;background-color:#f293ca;clip-path:polygon(100% 0,100% 100%,0 0)}.cornerBottomLeft{left:-92px;bottom:-92px;width:260px;height:260px;background-color:#f293ca;clip-path:polygon(0 0,100% 100%,0 100%)}.cornerBottomRight{right:-92px;bottom:-92px;width:260px;height:260px;clip-path:polygon(100% 0,100% 100%,0 100%)}.certHeader{position:relative;z-index:2;height:31%;display:grid;grid-template-rows:auto auto auto;place-items:center;padding-top:24px}.angelLogo{text-align:center;font-family:Inter,system-ui,sans-serif;font-size:31px;line-height:1;color:#17308c;font-weight:1000;letter-spacing:.02em}.angelLogo small{display:block;font-size:13px;font-weight:850;margin-top:4px;color:#344055}.certHeader h3{font-family:Impact,'Arial Narrow',sans-serif;font-size:34px;letter-spacing:.03em;color:#142a84;margin:20px 0 4px;text-transform:uppercase}.certHeader h4{font-family:Impact,'Arial Narrow',sans-serif;font-size:56px;line-height:.95;letter-spacing:.08em;color:#142a84;margin:0;text-transform:uppercase;max-width:78%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.certBodySafe{position:relative;z-index:2;height:36%;display:grid;grid-template-columns:1fr .58fr 1fr;gap:18px;padding:0 44px;align-items:start}.frZone,.arZone{height:100%;overflow:hidden}.frZone{font-size:16px;line-height:1.16}.frZone p{margin:0 0 8px}.identity b{font-size:18px}.identity small{display:block;font-size:9px;font-weight:900;text-transform:uppercase}.frZone ul{margin:0;padding-left:17px}.frZone li{margin:1px 0}.englishLine{display:block;font-size:8px;line-height:1.05;font-weight:900;text-transform:uppercase;margin-top:4px}.centerZone{display:grid;align-content:start;justify-items:center;gap:28px;padding-top:8px;font-family:Impact,'Arial Narrow',sans-serif;color:#142a84}.centerZone strong{font-size:31px;white-space:nowrap}.arZone{font-family:Arial,sans-serif;font-size:20px;line-height:1.24;text-align:right;font-weight:900;color:#142a84}.arZone p{margin:0 0 8px}.arZone ul{padding-right:18px;margin:0}.sealZone{position:absolute;z-index:3;left:50%;bottom:14.7%;transform:translateX(-50%);width:116px;height:116px;display:grid;place-items:center;pointer-events:none}.goldSeal{width:112px;height:112px;border-radius:50%;background:radial-gradient(circle,#ffe08a 0 37%,#d99f2a 38% 70%,#b97912 71%);display:grid;place-items:center;text-align:center;color:#172033;font:900 11px Inter,system-ui;box-shadow:0 0 0 7px rgba(224,168,62,.75);line-height:1.1}.goldSeal b{font-size:15px}.goldSeal small{font-size:7px}.footerSafe{position:absolute;z-index:4;left:86px;right:86px;bottom:22px;height:13.6%;display:grid;grid-template-columns:minmax(0,1fr) 100px minmax(0,1fr);gap:34px;align-items:end;text-align:center;color:#142a84}.signature i{display:block;width:min(210px,82%);border-top:3px solid #172033;margin:0 auto 8px}.signature b{display:block;font-size:20px;letter-spacing:.08em;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.signature span{display:block;font-size:13px;line-height:1.15}.verificationBlock{align-self:end;justify-self:center;border:1px solid #dbe3ef;background:#fff;border-radius:10px;padding:5px;width:96px;color:#172033;font-family:Inter,system-ui;box-shadow:0 8px 22px rgba(15,23,42,.08)}.qrGrid{width:58px;height:58px;margin:0 auto 4px;display:grid;grid-template-columns:repeat(7,1fr);grid-template-rows:repeat(7,1fr);gap:1px;background:#fff}.qrGrid i{background:#fff}.qrGrid i.filled{background:#111}.verificationBlock b{display:block;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.verificationBlock span{display:block;font-size:7px;color:#64748b}.summary{margin-top:12px;border:1px solid #e8edf5;border-radius:14px;background:#fbfaff;padding:14px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;color:#64748b;font-weight:850}.summary b{color:#172033}.summary span{font-size:12px}@media(max-width:1500px){.certGrid{grid-template-columns:1fr}.certificateShell{overflow:auto}.stepper{grid-template-columns:1fr}.two{grid-template-columns:1fr}}@media print{.certModalBackdrop{position:static;background:#fff;padding:0;display:block}.certModal{width:100%;height:auto;border:0;border-radius:0;box-shadow:none;overflow:visible}.certTopbar,.stepper,.formPanel,.contentPanel,.previewHead,.summary{display:none!important}.certGrid{display:block;padding:0}.certCard{border:0;box-shadow:none;padding:0}.certificateShell{overflow:visible}.certificateCanvas{width:297mm;height:210mm;min-width:0;aspect-ratio:auto;border-radius:0;page-break-inside:avoid}}
`
