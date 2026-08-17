import Link from 'next/link'
import type { LibraryBook, LibraryCopy, LibraryLoan, LibrarySnapshot } from '@/types/angelcare360/library-circulation'
import { BarcodeLookup, BookStudio, CopyStudio, LoanStudio, LossCancelStudio, ReturnStudio } from './LibraryActions'
import { EmptyState, StatusPill, formatDate, formatMoney } from './LibraryCommandShell'
import styles from './LibraryCommand.module.css'

const BASE = '/angelcare-360-command-center/bibliotheque'

function tone(value: string): 'good' | 'warn' | 'bad' | 'neutral' {
  if (['available', 'returned', 'active'].includes(value)) return 'good'
  if (['overdue', 'lost', 'damaged'].includes(value)) return 'bad'
  if (['loaned', 'reserved', 'open'].includes(value)) return 'warn'
  return 'neutral'
}

function Integrity({ snapshot }: { snapshot: LibrarySnapshot }) {
  const i = snapshot.integrity
  return (
    <div className={styles.integrity}>
      <StatusPill value={i.installed && i.safeForCirculation ? 'Circulation sûre' : 'Mutation verrouillée'} tone={i.installed && i.safeForCirculation ? 'good' : 'warn'} />
      <div>
        <strong>{i.installed ? 'Garde-fou transactionnel détecté' : 'Garde-fou SQL non installé'}</strong>
        <p>{i.installed
          ? i.safeForCirculation
            ? 'Prêt, retour, perte et annulation utilisent l’autorité atomique de circulation.'
            : `L’intégrité courante bloque les mutations : ${i.duplicateActiveLoans} doublon(s), ${i.activeLoanCopyStateMismatch} incohérence(s) prêt/exemplaire, ${i.loanedCopiesWithoutActiveLoan} exemplaire(s) prêté(s) sans prêt actif.`
          : i.message || 'Appliquez le SQL Bibliothèque réconcilié avant toute mutation de circulation.'}</p>
      </div>
    </div>
  )
}

export function KnowledgeAtrium({ snapshot }: { snapshot: LibrarySnapshot }) {
  const recent = snapshot.loans.slice(0, 8)
  const attention = [
    snapshot.metrics.dueToday ? { n: snapshot.metrics.dueToday, title: 'Échéances aujourd’hui', copy: 'Prêts dont le retour est attendu avant la fin de journée.' } : null,
    snapshot.metrics.overdue ? { n: snapshot.metrics.overdue, title: 'Retours en retard', copy: 'Circulations dont l’échéance enregistrée est dépassée.' } : null,
    snapshot.metrics.damaged + snapshot.metrics.lost ? { n: snapshot.metrics.damaged + snapshot.metrics.lost, title: 'Exemplaires indisponibles', copy: 'Copies endommagées ou perdues nécessitant un suivi institutionnel.' } : null,
    snapshot.metrics.copiesWithoutShelf ? { n: snapshot.metrics.copiesWithoutShelf, title: 'Localisation manquante', copy: 'Exemplaires actifs sans rayon/localisation renseigné.' } : null,
  ].filter(Boolean) as Array<{n:number;title:string;copy:string}>

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroGrid}>
          <div className={styles.heroLead}>
            <div>
              <div className={styles.heroKicker}>Knowledge Atrium · état réel de la collection</div>
              <h2 className={styles.heroHeadline}>Une bibliothèque qui sait ce qu’elle possède, ce qui circule et ce qui doit revenir.</h2>
              <p className={styles.heroCopy}>SANILA distingue l’œuvre intellectuelle, l’exemplaire physique et le prêt. La disponibilité est reconstruite depuis les copies et la circulation réelle — jamais depuis un compteur décoratif.</p>
            </div>
            <div className={styles.pulseLine}>
              <div className={styles.pulseItem}><strong>{snapshot.metrics.works}</strong><span>Œuvres actives</span></div>
              <div className={styles.pulseItem}><strong>{snapshot.metrics.copies}</strong><span>Exemplaires</span></div>
              <div className={styles.pulseItem}><strong className={styles.good}>{snapshot.metrics.available}</strong><span>Disponibles</span></div>
              <div className={styles.pulseItem}><strong className={snapshot.metrics.overdue ? styles.bad : styles.good}>{snapshot.metrics.overdue}</strong><span>En retard</span></div>
            </div>
          </div>
          <aside className={styles.instrument}>
            <div className={styles.instrumentTitle}>Collection Pulse</div>
            <div className={styles.instrumentMetric}><span>En circulation</span><strong>{snapshot.metrics.circulating}</strong></div>
            <div className={styles.instrumentMetric}><span>Retours aujourd’hui</span><strong>{snapshot.metrics.returnedToday}</strong></div>
            <div className={styles.instrumentMetric}><span>Endommagés</span><strong className={snapshot.metrics.damaged ? styles.bad : ''}>{snapshot.metrics.damaged}</strong></div>
            <div className={styles.instrumentMetric}><span>Perdus</span><strong className={snapshot.metrics.lost ? styles.bad : ''}>{snapshot.metrics.lost}</strong></div>
            <div className={styles.instrumentMetric}><span>Réservés · état factuel</span><strong>{snapshot.metrics.reserved}</strong></div>
          </aside>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.gridTwo}>
          <div className={styles.panel}>
            <div className={styles.sectionHeader}><div><h2 className={styles.sectionTitle}>Constellation de collection</h2><p className={styles.sectionCopy}>Les catégories émergent depuis les ouvrages réellement enregistrés.</p></div></div>
            {snapshot.categories.length ? <div className={styles.constellation}>{snapshot.categories.slice(0, 9).map(category => (
              <Link key={category.label} href={`${BASE}/livres?category=${encodeURIComponent(category.label)}`} className={styles.category}>
                <div><div className={styles.categoryName}>{category.label}</div><div className={styles.bookAuthor}>{category.works} œuvre{category.works > 1 ? 's' : ''} · {category.copies} exemplaire{category.copies > 1 ? 's' : ''}</div></div>
                <div className={styles.categoryStats}>
                  <div className={styles.micro}><strong className={styles.good}>{category.available}</strong>disponibles</div>
                  <div className={styles.micro}><strong>{category.activeLoans}</strong>circulent</div>
                  <div className={styles.micro}><strong className={category.overdue ? styles.bad : ''}>{category.overdue}</strong>retards</div>
                  <div className={styles.micro}><strong className={category.damaged + category.lost ? styles.bad : ''}>{category.damaged + category.lost}</strong>exceptions</div>
                </div>
              </Link>
            ))}</div> : <EmptyState title="Collection non classée" copy="Les catégories apparaîtront ici à partir des ouvrages réellement enregistrés." />}
          </div>
          <div className={styles.panel}>
            <div className={styles.sectionHeader}><div><h2 className={styles.sectionTitle}>À traiter aujourd’hui</h2><p className={styles.sectionCopy}>Attention opérationnelle dérivée uniquement des dates et états existants.</p></div></div>
            {attention.length ? <div className={styles.attention}>{attention.map((item, index) => (
              <div className={styles.attentionItem} key={item.title}><div className={styles.attentionIndex}>{item.n}</div><div><strong>{item.title}</strong><p>{item.copy}</p></div></div>
            ))}</div> : <EmptyState title="Aucun signal prioritaire" copy="La circulation enregistrée ne présente actuellement aucun retard, incident matériel ou localisation manquante." />}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.gridTwo}>
          <div className={styles.panel}>
            <div className={styles.sectionHeader}><div><h2 className={styles.sectionTitle}>Ruban de circulation</h2><p className={styles.sectionCopy}>Les derniers prêts et retours donnent une lecture vivante de la collection sans faux temps réel.</p></div><Link className={`${styles.button} ${styles.buttonSecondary}`} href={`${BASE}/prets`}>Circulation complète</Link></div>
            {recent.length ? <div className={styles.ribbon}>{recent.map(loan => (
              <Link key={loan.id} href={`${BASE}/prets/${loan.id}`} className={styles.ribbonItem + ' ' + styles.entityLink}>
                <div className={styles.ribbonTime}>{formatDate(loan.returnedAt || loan.loanedAt, true).split(' ')[0]}</div>
                <div><div className={styles.ribbonTitle}>{loan.bookTitle}</div><div className={styles.ribbonMeta}>{loan.copyCode} · {loan.borrowerName} · échéance {formatDate(loan.dueAt)}</div></div>
                <StatusPill value={loan.effectiveStatus} tone={tone(loan.effectiveStatus)} />
              </Link>
            ))}</div> : <EmptyState title="Aucune circulation enregistrée" copy="Les prêts apparaîtront ici dès qu’un exemplaire sera confié à un élève ou un membre du personnel." />}
          </div>
          <div>
            <Integrity snapshot={snapshot} />
            <div style={{height:12}} />
            <BarcodeLookup compact />
          </div>
        </div>
      </section>
    </>
  )
}

export function CatalogueEditorial({ snapshot, category }: { snapshot: LibrarySnapshot; category?: string | null }) {
  const books = category ? snapshot.books.filter(book => (book.category || 'Non classé') === category) : snapshot.books
  return (
    <>
      <div className={styles.toolbar}>
        <Link className={styles.button} href="#book-studio">Nouvel ouvrage</Link>
        <Link className={`${styles.button} ${styles.buttonSecondary}`} href={`${BASE}/exemplaires`}>Voir les exemplaires</Link>
        <span className={styles.micro}>{books.length} ouvrage{books.length > 1 ? 's' : ''}{category ? ` · ${category}` : ''}</span>
      </div>
      {books.length ? <div className={styles.cards}>{books.map(book => (
        <Link className={styles.bookCard} key={book.id} href={`${BASE}/livres/${book.id}`}>
          <div className={styles.bookCode}>{book.bookCode} · {book.language.toUpperCase()}</div>
          <div className={styles.bookTitle}>{book.title}</div>
          <div className={styles.bookAuthor}>{book.author || 'Auteur non renseigné'}{book.category ? ` · ${book.category}` : ''}</div>
          <div className={styles.bookFooter}><div><div className={styles.bigNumber}>{book.availableCount}</div><div className={styles.micro}>disponibles / {book.copyCount}</div></div><StatusPill value={book.status} tone={book.status === 'active' ? 'good' : 'neutral'} /></div>
        </Link>
      ))}</div> : <EmptyState title="Aucun ouvrage dans cette vue" copy="Enregistrez un ouvrage ou modifiez le filtre de catégorie." />}
      <div className={styles.section} id="book-studio"><BookStudio /></div>
    </>
  )
}

export function WorkPortrait({ snapshot, book, copies, loans }: { snapshot: LibrarySnapshot; book: LibraryBook; copies: LibraryCopy[]; loans: LibraryLoan[] }) {
  return (
    <div className={styles.dossier}>
      <aside className={styles.portrait}>
        <div className={styles.eyebrow}>Work Portrait · {book.bookCode}</div>
        <div className={styles.portraitTitle}>{book.title}</div>
        <div className={styles.bookAuthor}>{book.author || 'Auteur non renseigné'}</div>
        <div className={styles.metaList}>
          <div className={styles.metaRow}><span>ISBN</span><strong>{book.isbn || 'Non renseigné'}</strong></div>
          <div className={styles.metaRow}><span>Éditeur</span><strong>{book.publisher || 'Non renseigné'}</strong></div>
          <div className={styles.metaRow}><span>Catégorie</span><strong>{book.category || 'Non classé'}</strong></div>
          <div className={styles.metaRow}><span>Langue</span><strong>{book.language.toUpperCase()}</strong></div>
          <div className={styles.metaRow}><span>Exemplaires</span><strong>{book.copyCount}</strong></div>
          <div className={styles.metaRow}><span>Disponibles</span><strong className={styles.good}>{book.availableCount}</strong></div>
          <div className={styles.metaRow}><span>En retard</span><strong className={book.overdueCount ? styles.bad : ''}>{book.overdueCount}</strong></div>
        </div>
      </aside>
      <div>
        <section className={styles.panel}>
          <div className={styles.sectionHeader}><div><h2 className={styles.sectionTitle}>Exemplaires physiques</h2><p className={styles.sectionCopy}>Chaque copie garde sa propre identité, localisation, condition et trajectoire de circulation.</p></div></div>
          {copies.length ? <div className={styles.copyGrid}>{copies.map(copy => (
            <Link href={`${BASE}/exemplaires/${copy.id}`} className={styles.copyCard + ' ' + styles.entityLink} key={copy.id}>
              <div className={styles.copyCardHead}><div><div className={styles.copyCode}>{copy.copyCode}</div><div className={styles.entitySub}>{copy.shelfLocation || 'Rayon non renseigné'} · {copy.condition}</div></div><StatusPill value={copy.status} tone={tone(copy.status)} /></div>
              <div className={styles.metaList}><div className={styles.metaRow}><span>Code-barres</span><strong>{copy.barcode || '—'}</strong></div><div className={styles.metaRow}><span>Emprunteur</span><strong>{copy.borrowerName || 'Aucun'}</strong></div></div>
            </Link>
          ))}</div> : <EmptyState title="Aucun exemplaire physique" copy="L’œuvre existe au catalogue mais aucun exemplaire n’est encore enregistré." />}
        </section>
        <section className={styles.section}><CopyStudio books={snapshot.books} initialBookId={book.id} /></section>
        <section className={styles.section}><BookStudio book={book} /></section>
        <section className={styles.section + ' ' + styles.panel}>
          <div className={styles.sectionHeader}><div><h2 className={styles.sectionTitle}>Mémoire de circulation</h2><p className={styles.sectionCopy}>Historique factuel des prêts de tous les exemplaires de cette œuvre.</p></div></div>
          {loans.length ? <LoanTable loans={loans} /> : <EmptyState title="Aucune circulation historique" copy="Aucun prêt n’est encore associé aux exemplaires de cet ouvrage." />}
        </section>
      </div>
    </div>
  )
}

export function CopyFleet({ snapshot }: { snapshot: LibrarySnapshot }) {
  return (
    <>
      <div className={styles.split}>
        <div>
          <div className={styles.toolbar}><span className={styles.micro}>{snapshot.copies.length} exemplaires · œuvre ≠ copie physique</span></div>
          {snapshot.copies.length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Exemplaire</th><th>Ouvrage</th><th>Rayon</th><th>Condition</th><th>État</th><th>Emprunteur</th></tr></thead><tbody>{snapshot.copies.map(copy => <tr key={copy.id}>
            <td><Link className={styles.entityLink} href={`${BASE}/exemplaires/${copy.id}`}>{copy.copyCode}</Link><div className={styles.entitySub}>{copy.barcode || 'Sans code-barres'}</div></td>
            <td><Link className={styles.entityLink} href={`${BASE}/livres/${copy.bookId}`}>{copy.bookTitle}</Link><div className={styles.entitySub}>{copy.bookCode}</div></td>
            <td>{copy.shelfLocation || '—'}</td><td>{copy.condition}</td><td><StatusPill value={copy.status} tone={tone(copy.status)} /></td><td>{copy.borrowerName || '—'}{copy.dueAt ? <div className={styles.entitySub}>Échéance {formatDate(copy.dueAt)}</div> : null}</td>
          </tr>)}</tbody></table></div> : <EmptyState title="Aucun exemplaire" copy="Enregistrez d’abord une œuvre puis sa première copie physique." />}
        </div>
        <div className={styles.sticky}><BarcodeLookup /><div style={{height:12}} /><CopyStudio books={snapshot.books} /></div>
      </div>
    </>
  )
}

export function CopyDossier({ snapshot, copy, book, loans }: { snapshot: LibrarySnapshot; copy: LibraryCopy; book: LibraryBook | null; loans: LibraryLoan[] }) {
  return (
    <div className={styles.dossier}>
      <aside className={styles.portrait}>
        <div className={styles.eyebrow}>Copy Fleet · exemplaire physique</div>
        <div className={styles.portraitTitle}>{copy.copyCode}</div>
        <div className={styles.bookAuthor}>{copy.bookTitle}</div>
        <div className={styles.metaList}>
          <div className={styles.metaRow}><span>État</span><strong><StatusPill value={copy.status} tone={tone(copy.status)} /></strong></div>
          <div className={styles.metaRow}><span>Rayon</span><strong>{copy.shelfLocation || 'Non renseigné'}</strong></div>
          <div className={styles.metaRow}><span>Code-barres</span><strong>{copy.barcode || 'Non renseigné'}</strong></div>
          <div className={styles.metaRow}><span>Condition</span><strong>{copy.condition}</strong></div>
          <div className={styles.metaRow}><span>Acquisition</span><strong>{formatDate(copy.acquisitionDate)}</strong></div>
          <div className={styles.metaRow}><span>Emprunteur actuel</span><strong>{copy.borrowerName || 'Aucun'}</strong></div>
        </div>
        {book ? <Link className={`${styles.button} ${styles.buttonSecondary}`} href={`${BASE}/livres/${book.id}`}>Ouvrir l’œuvre</Link> : null}
      </aside>
      <div>
        <CopyStudio books={snapshot.books} copy={copy} />
        <section className={styles.section + ' ' + styles.panel}><div className={styles.sectionHeader}><div><h2 className={styles.sectionTitle}>Chronologie de l’exemplaire</h2><p className={styles.sectionCopy}>Tous les prêts associés à cette copie physique.</p></div></div>{loans.length ? <LoanTable loans={loans} /> : <EmptyState title="Aucun prêt historique" copy="Cet exemplaire n’a pas encore de circulation enregistrée." />}</section>
      </div>
    </div>
  )
}

export function AvailabilityAtlas({ snapshot }: { snapshot: LibrarySnapshot }) {
  return (
    <>
      <div className={styles.gridTwo}>
        <div className={styles.panel}>
          <div className={styles.sectionHeader}><div><h2 className={styles.sectionTitle}>Availability Atlas</h2><p className={styles.sectionCopy}>La disponibilité vient de l’état réel des exemplaires et de leurs prêts actifs.</p></div></div>
          <div className={styles.cards}>{snapshot.books.map(book => (
            <Link className={styles.bookCard} key={book.id} href={`${BASE}/livres/${book.id}`}>
              <div className={styles.bookCode}>{book.bookCode}</div><div className={styles.bookTitle}>{book.title}</div><div className={styles.bookAuthor}>{book.author || 'Auteur non renseigné'}</div>
              <div className={styles.bookFooter}><div><div className={styles.bigNumber + ' ' + (book.availableCount ? styles.good : styles.bad)}>{book.availableCount}</div><div className={styles.micro}>disponibles / {book.copyCount}</div></div><StatusPill value={book.availableCount ? 'Disponible' : 'Indisponible'} tone={book.availableCount ? 'good' : 'bad'} /></div>
            </Link>
          ))}</div>
        </div>
        <div className={styles.sticky}><BarcodeLookup /></div>
      </div>
    </>
  )
}

export function CirculationDesk({ snapshot }: { snapshot: LibrarySnapshot }) {
  const active = snapshot.loans.filter(l => ['open', 'active', 'overdue'].includes(l.effectiveStatus) && !l.returnedAt)
  return (
    <div className={styles.split}>
      <div>
        <div className={styles.pulseLine}>
          <div className={styles.pulseItem}><strong>{active.length}</strong><span>En circulation</span></div>
          <div className={styles.pulseItem}><strong>{snapshot.metrics.dueToday}</strong><span>À rendre aujourd’hui</span></div>
          <div className={styles.pulseItem}><strong className={snapshot.metrics.overdue ? styles.bad : ''}>{snapshot.metrics.overdue}</strong><span>En retard</span></div>
          <div className={styles.pulseItem}><strong>{snapshot.metrics.returnedToday}</strong><span>Retours aujourd’hui</span></div>
        </div>
        <div className={styles.section}>{snapshot.loans.length ? <LoanTable loans={snapshot.loans} /> : <EmptyState title="Aucun prêt enregistré" copy="La circulation apparaîtra ici après le premier prêt certifié." />}</div>
      </div>
      <div className={styles.sticky}><Integrity snapshot={snapshot} /><div style={{height:12}} /><LoanStudio copies={snapshot.copies} borrowers={snapshot.borrowers} locked={!snapshot.integrity.safeForCirculation} /></div>
    </div>
  )
}

export function CirculationChamber({ snapshot, loan }: { snapshot: LibrarySnapshot; loan: LibraryLoan }) {
  const active = ['open', 'active', 'overdue'].includes(loan.effectiveStatus) && !loan.returnedAt
  return (
    <div className={styles.dossier}>
      <aside className={styles.portrait}>
        <div className={styles.eyebrow}>Circulation Chamber</div>
        <div className={styles.portraitTitle}>{loan.bookTitle}</div>
        <div className={styles.bookAuthor}>{loan.copyCode} · {loan.borrowerName}</div>
        <div className={styles.loanTimeline}><div className={styles.loanStep} data-done="true">Prêté</div><div className={styles.loanStep} data-done={loan.daysOverdue === 0 || Boolean(loan.returnedAt)}>Échéance</div><div className={styles.loanStep} data-done={Boolean(loan.returnedAt)}>Retour</div></div>
        <div className={styles.metaList}>
          <div className={styles.metaRow}><span>État</span><strong><StatusPill value={loan.effectiveStatus} tone={tone(loan.effectiveStatus)} /></strong></div>
          <div className={styles.metaRow}><span>Emprunteur</span><strong>{loan.borrowerName}</strong></div>
          <div className={styles.metaRow}><span>Type</span><strong>{loan.borrowerType === 'staff' ? 'Personnel' : 'Élève'}</strong></div>
          <div className={styles.metaRow}><span>Prêté le</span><strong>{formatDate(loan.loanedAt, true)}</strong></div>
          <div className={styles.metaRow}><span>Échéance</span><strong>{formatDate(loan.dueAt, true)}</strong></div>
          <div className={styles.metaRow}><span>Retour</span><strong>{formatDate(loan.returnedAt, true)}</strong></div>
          <div className={styles.metaRow}><span>Pénalité enregistrée</span><strong>{formatMoney(loan.fineAmount)}</strong></div>
        </div>
      </aside>
      <div>
        <section className={styles.panel}>
          <div className={styles.sectionHeader}><div><h2 className={styles.sectionTitle}>Vérité de circulation</h2><p className={styles.sectionCopy}>Le montant de pénalité affiché est uniquement la valeur enregistrée dans Bibliothèque ; il n’est pas présenté comme facture Finance.</p></div></div>
          <div className={styles.copyGrid}>
            <div className={styles.copyCard}><div className={styles.micro}>Œuvre</div><div className={styles.bookTitle}>{loan.bookTitle}</div><div className={styles.bookAuthor}>{loan.author || 'Auteur non renseigné'} · {loan.bookCode}</div></div>
            <div className={styles.copyCard}><div className={styles.micro}>Exemplaire</div><div className={styles.bookTitle}>{loan.copyCode}</div><div className={styles.bookAuthor}>{loan.shelfLocation || 'Rayon non renseigné'} · {loan.copyCondition}</div></div>
          </div>
        </section>
        {active ? <><section className={styles.section}><ReturnStudio loan={loan} locked={!snapshot.integrity.safeForCirculation} /></section><section className={styles.section}><LossCancelStudio loan={loan} locked={!snapshot.integrity.safeForCirculation} /></section></> : <section className={styles.section}><EmptyState title="Circulation clôturée" copy={`Ce prêt est dans l’état « ${loan.effectiveStatus} ». L’historique reste consultable et auditable.`} /></section>}
      </div>
    </div>
  )
}

export function ReturnDesk({ snapshot }: { snapshot: LibrarySnapshot }) {
  const active = snapshot.loans.filter(l => ['open', 'active', 'overdue'].includes(l.effectiveStatus) && !l.returnedAt)
  return (
    <div className={styles.split}>
      <div>
        {active.length ? <LoanTable loans={active} actionLabel="Ouvrir le retour" /> : <EmptyState title="Aucun prêt à retourner" copy="Aucune circulation active n’est actuellement enregistrée." />}
      </div>
      <div className={styles.sticky}><BarcodeLookup /><div style={{height:12}} /><Integrity snapshot={snapshot} /></div>
    </div>
  )
}

export function OverdueRecovery({ snapshot }: { snapshot: LibrarySnapshot }) {
  const overdue = snapshot.loans.filter(l => l.effectiveStatus === 'overdue')
  const bands = [
    ['1–3 jours', overdue.filter(l => l.daysOverdue <= 3).length],
    ['4–7 jours', overdue.filter(l => l.daysOverdue >= 4 && l.daysOverdue <= 7).length],
    ['8–14 jours', overdue.filter(l => l.daysOverdue >= 8 && l.daysOverdue <= 14).length],
    ['15–30 jours', overdue.filter(l => l.daysOverdue >= 15 && l.daysOverdue <= 30).length],
    ['30+ jours', overdue.filter(l => l.daysOverdue > 30).length],
  ] as const
  return (
    <>
      <div className={styles.overdueBands}>{bands.map(([label, count]) => <div className={styles.band} key={label}><strong className={count ? styles.bad : ''}>{count}</strong><span>{label}</span></div>)}</div>
      <div className={`${styles.message} ${styles.messageWarn}`}>Les relances externes ne sont pas présentées comme envoyées ici. Utilisez Messagerie lorsque le canal réel et sa vérité de livraison sont disponibles.</div>
      {overdue.length ? <LoanTable loans={overdue} /> : <EmptyState title="Aucun retour en retard" copy="Tous les prêts actuellement ouverts restent dans leurs délais enregistrés." />}
    </>
  )
}

export function CollectionForensics({ snapshot }: { snapshot: LibrarySnapshot }) {
  return (
    <>
      <Integrity snapshot={snapshot} />
      <section className={styles.section + ' ' + styles.panel}>
        <div className={styles.sectionHeader}><div><h2 className={styles.sectionTitle}>Collection Forensics</h2><p className={styles.sectionCopy}>Chronologie issue de l’autorité d’audit AngelCare 360 — aucune histoire reconstruite artificiellement.</p></div></div>
        {snapshot.audit.length ? <div className={styles.forensics}>{snapshot.audit.map(event => (
          <div className={styles.auditEvent} key={event.id}><div className={styles.auditTime}>{formatDate(event.createdAt, true)}</div><div><div className={styles.auditAction}>{event.action}</div><div className={styles.auditMeta}>{event.entityType || 'entité'} · {event.entityId || '—'} · acteur {event.actorRole || event.actorUserId || 'non résolu'}</div></div><StatusPill value={event.severity} tone={event.severity === 'critical' || event.severity === 'warning' ? 'bad' : 'neutral'} /></div>
        ))}</div> : <EmptyState title="Aucun événement d’audit Bibliothèque" copy="Les futures mutations auditées apparaîtront ici." />}
      </section>
    </>
  )
}

function LoanTable({ loans, actionLabel = 'Ouvrir' }: { loans: LibraryLoan[]; actionLabel?: string }) {
  return (
    <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Ouvrage / exemplaire</th><th>Emprunteur</th><th>Prêt</th><th>Échéance</th><th>État</th><th></th></tr></thead><tbody>{loans.map(loan => (
      <tr key={loan.id}><td><strong>{loan.bookTitle}</strong><div className={styles.entitySub}>{loan.copyCode} · {loan.bookCode}</div></td><td>{loan.borrowerName}<div className={styles.entitySub}>{loan.borrowerType === 'staff' ? 'Personnel' : 'Élève'} · {loan.borrowerCode}</div></td><td>{formatDate(loan.loanedAt)}</td><td>{formatDate(loan.dueAt)}{loan.daysOverdue ? <div className={styles.entitySub + ' ' + styles.bad}>{loan.daysOverdue} j de retard</div> : null}</td><td><StatusPill value={loan.effectiveStatus} tone={tone(loan.effectiveStatus)} /></td><td><Link className={`${styles.button} ${styles.buttonSecondary}`} href={`${BASE}/prets/${loan.id}`}>{actionLabel}</Link></td></tr>
    ))}</tbody></table></div>
  )
}
