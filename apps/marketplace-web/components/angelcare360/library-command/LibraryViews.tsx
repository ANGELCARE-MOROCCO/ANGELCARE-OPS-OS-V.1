import Link from 'next/link'
import type { LibraryBook, LibraryBorrower, LibraryCopy, LibraryLoan, LibrarySnapshot } from '@/types/angelcare360/library-circulation'
import { BarcodeLookup, BookStudio, CopyStudio, LibraryDrawer, LoanStudio, LossCancelStudio, ReturnStudio } from './LibraryActions'
import { EmptyState, StatusPill, formatDate, formatMoney } from './LibraryCommandShell'
import styles from './LibraryCommand.module.css'

const BASE = '/angelcare-360-command-center/bibliotheque'

function tone(value: string): 'good' | 'warn' | 'bad' | 'neutral' {
  if (['available', 'returned', 'active', 'eligible'].includes(value)) return 'good'
  if (['overdue', 'lost', 'damaged', 'inactive'].includes(value)) return 'bad'
  if (['loaned', 'reserved', 'open', 'attention'].includes(value)) return 'warn'
  return 'neutral'
}
function normalize(value?: string | null) { return (value || '').toLocaleLowerCase('fr') }
function matches(query: string, values: Array<string | null | undefined>) {
  const q = normalize(query).trim()
  if (!q) return true
  return values.some(value => normalize(value).includes(q))
}

function Integrity({ snapshot }: { snapshot: LibrarySnapshot }) {
  const i = snapshot.integrity
  const totalIssues = i.duplicateActiveLoans + i.activeLoanCopyStateMismatch + i.loanedCopiesWithoutActiveLoan + i.invalidBorrowers + i.barcodeDuplicates
  return (
    <section className={styles.integrity} data-safe={String(i.installed && i.safeForCirculation)}>
      <div className={styles.integritySignal}><span>{i.installed && i.safeForCirculation ? '✓' : '!'}</span></div>
      <div className={styles.integrityCopy}>
        <StatusPill value={i.installed && i.safeForCirculation ? 'Circulation sûre' : 'Mutation verrouillée'} tone={i.installed && i.safeForCirculation ? 'good' : 'warn'} />
        <strong>{i.installed ? 'Garde-fou transactionnel Bibliothèque détecté' : 'Autorité de circulation indisponible'}</strong>
        <p>{i.installed
          ? i.safeForCirculation
            ? 'Prêt, retour, perte et annulation passent exclusivement par les RPC atomiques de production.'
            : `${totalIssues} incohérence(s) empêchent toute nouvelle mutation de circulation. Aucune correction locale n’est supposée.`
          : i.message || 'Les mutations restent verrouillées jusqu’au rétablissement de l’autorité existante.'}</p>
      </div>
      <div className={styles.integrityGrid}>
        <div><span>Doublons prêt actif</span><b>{i.duplicateActiveLoans}</b></div>
        <div><span>État prêt/copie</span><b>{i.activeLoanCopyStateMismatch}</b></div>
        <div><span>Copies prêtées orphelines</span><b>{i.loanedCopiesWithoutActiveLoan}</b></div>
        <div><span>Emprunteurs invalides</span><b>{i.invalidBorrowers}</b></div>
        <div><span>Codes-barres dupliqués</span><b>{i.barcodeDuplicates}</b></div>
      </div>
    </section>
  )
}

function AuthorityTruth({ snapshot }: { snapshot: LibrarySnapshot }) {
  return <section className={styles.authorityPanel}>
    <div className={styles.sectionHeader}><div><span className={styles.sectionEyebrow}>Capability truth</span><h2 className={styles.sectionTitle}>Autorités réellement disponibles</h2><p className={styles.sectionCopy}>SANILA n’invente aucun workflow absent du schéma ou des RPC de production.</p></div></div>
    <div className={styles.authorityGrid}>
      <div data-state="on"><span>Prêt</span><strong>Atomique</strong><small>angelcare360_library_create_loan_v1</small></div>
      <div data-state="on"><span>Retour</span><strong>Atomique</strong><small>état du prêt + état physique de copie</small></div>
      <div data-state="off"><span>Renouvellement</span><strong>Non prouvé</strong><small>aucun RPC de renouvellement dans le schéma frais</small></div>
      <div data-state="off"><span>Réservations</span><strong>État seulement</strong><small>{snapshot.metrics.reserved} copie(s) marquée(s) « reserved » · aucune file d’attente autoritaire</small></div>
      <div data-state="off"><span>Relances externes</span><strong>Messagerie</strong><small>Bibliothèque ne revendique aucune livraison email/SMS/WhatsApp</small></div>
      <div data-state="off"><span>Pénalités</span><strong>Valeur enregistrée</strong><small>jamais présentée comme facture Finance</small></div>
    </div>
  </section>
}

function ReadinessRail({ snapshot }: { snapshot: LibrarySnapshot }) {
  const m = snapshot.metrics
  return <section className={styles.readinessRail} aria-label="État opérationnel de la bibliothèque">
    <div><span>Collection</span><strong>{m.works}</strong><small>titres actifs</small></div>
    <div><span>Disponibles</span><strong className={styles.good}>{m.available}</strong><small>sur {m.copies} exemplaires</small></div>
    <div><span>Circulation</span><strong>{m.circulating}</strong><small>prêts actifs</small></div>
    <div data-tone={m.dueToday ? 'warn' : 'good'}><span>Retour aujourd’hui</span><strong>{m.dueToday}</strong><small>échéances du jour</small></div>
    <div data-tone={m.overdue ? 'bad' : 'good'}><span>Retards</span><strong>{m.overdue}</strong><small>{m.borrowersWithOverdue} membre(s) concerné(s)</small></div>
    <div data-tone={m.damaged + m.lost ? 'bad' : 'good'}><span>Exceptions</span><strong>{m.damaged + m.lost}</strong><small>{m.damaged} endommagé(s) · {m.lost} perdu(s)</small></div>
  </section>
}

export function KnowledgeAtrium({ snapshot }: { snapshot: LibrarySnapshot }) {
  const m = snapshot.metrics
  return (
    <div className={styles.stack}>
      <section className={styles.hero}>
        <div className={styles.heroGrid}>
          <div className={styles.heroLead}>
            <div>
              <div className={styles.heroKicker}>Library Operations Cockpit · état réel de la collection</div>
              <h2 className={styles.heroHeadline}>Une bibliothèque qui sait ce qu’elle possède, ce qui circule, qui détient chaque copie et ce qui exige une action aujourd’hui.</h2>
              <p className={styles.heroCopy}>SANILA distingue l’identité bibliographique, l’exemplaire physique, l’emprunteur et le prêt transactionnel. La disponibilité est reconstruite depuis les états réellement persistés — jamais depuis un compteur décoratif.</p>
            </div>
            <div className={styles.heroActions}>
              <Link className={styles.button} href={`${BASE}/prets`}>Ouvrir le Circulation Desk</Link>
              <Link className={`${styles.button} ${styles.buttonSecondary}`} href={`${BASE}/exemplaires`}>Localiser un exemplaire</Link>
              <Link className={`${styles.button} ${styles.buttonSecondary}`} href={`${BASE}/retards`}>Traiter les retards</Link>
            </div>
          </div>
          <aside className={styles.instrument}>
            <div className={styles.instrumentTitle}>Collection Pulse</div>
            <div className={styles.instrumentMetric}><span>Titres sans disponibilité</span><strong className={m.titlesUnavailable ? styles.warn : styles.good}>{m.titlesUnavailable}</strong></div>
            <div className={styles.instrumentMetric}><span>Retours enregistrés aujourd’hui</span><strong>{m.returnedToday}</strong></div>
            <div className={styles.instrumentMetric}><span>Membres en circulation</span><strong>{m.activeBorrowers}</strong></div>
            <div className={styles.instrumentMetric}><span>Copies sans rayon enregistré</span><strong className={m.copiesWithoutShelf ? styles.warn : ''}>{m.copiesWithoutShelf}</strong></div>
            <div className={styles.instrumentMetric}><span>État « réservé » observé</span><strong>{m.reserved}</strong></div>
          </aside>
        </div>
      </section>

      <ReadinessRail snapshot={snapshot} />

      <div className={styles.commandGrid}>
        <section className={styles.watchtower}>
          <div className={styles.sectionHeader}><div><span className={styles.sectionEyebrow}>Library Watchtower</span><h2 className={styles.sectionTitle}>À traiter maintenant</h2><p className={styles.sectionCopy}>Ordonné par retard, perte/dégradation, échéance du jour, responsabilité de membre et disponibilité réelle.</p></div><Link href={`${BASE}/retards`}>Retards →</Link></div>
          {snapshot.interventions.length ? <div className={styles.interventionList}>{snapshot.interventions.slice(0, 9).map(item => <Link className={styles.interventionCard} data-tone={item.tone} key={item.id} href={item.href}><span className={styles.interventionMark}>{item.kind === 'overdue' ? 'R' : item.kind === 'copy_exception' ? 'E' : item.kind === 'due_today' ? 'J' : '•'}</span><div><strong>{item.title}</strong><p>{item.detail}</p></div><span className={styles.chevron}>→</span></Link>)}</div> : <EmptyState title="Aucune intervention prioritaire" copy="Aucun retard, incident matériel ou autre signal factuel ne nécessite actuellement d’action prioritaire." />}
        </section>

        <aside className={styles.todayPanel}>
          <div className={styles.sectionHeader}><div><span className={styles.sectionEyebrow}>Today Circulation</span><h2 className={styles.sectionTitle}>Mouvements du jour</h2></div></div>
          {snapshot.todayEvents.length ? <div className={styles.todayTimeline}>{snapshot.todayEvents.slice(0, 10).map(event => <Link key={event.id} href={event.href} data-tone={event.tone}><time>{new Intl.DateTimeFormat('fr-MA', { hour: '2-digit', minute: '2-digit' }).format(new Date(event.at))}</time><span className={styles.todayDot}/><div><strong>{event.title}</strong><p>{event.detail}</p></div></Link>)}</div> : <EmptyState title="Aucune circulation aujourd’hui" copy="Aucun prêt, retour ou événement de circulation n’a encore été enregistré aujourd’hui." />}
        </aside>
      </div>

      <div className={styles.gridTwo}>
        <section className={styles.panel}>
          <div className={styles.sectionHeader}><div><span className={styles.sectionEyebrow}>Collection Map</span><h2 className={styles.sectionTitle}>Constellation de collection</h2><p className={styles.sectionCopy}>Chaque catégorie reflète les ouvrages et exemplaires réellement enregistrés.</p></div><Link href={`${BASE}/livres`}>Catalogue complet →</Link></div>
          {snapshot.categories.length ? <div className={styles.constellation}>{snapshot.categories.slice(0, 9).map(category => <Link key={category.label} href={`${BASE}/livres?category=${encodeURIComponent(category.label)}`} className={styles.category}><div><div className={styles.categoryName}>{category.label}</div><div className={styles.bookAuthor}>{category.works} titre(s) · {category.copies} exemplaire(s)</div></div><div className={styles.categoryStats}><div><strong className={styles.good}>{category.available}</strong><span>disponibles</span></div><div><strong>{category.activeLoans}</strong><span>circulent</span></div><div><strong className={category.overdue ? styles.bad : ''}>{category.overdue}</strong><span>retards</span></div><div><strong className={category.damaged + category.lost ? styles.bad : ''}>{category.damaged + category.lost}</strong><span>exceptions</span></div></div></Link>)}</div> : <EmptyState title="Collection non classée" copy="Les catégories apparaîtront à mesure que les ouvrages sont enregistrés." />}
        </section>
        <div className={styles.stack}><Integrity snapshot={snapshot} /><BarcodeLookup compact /></div>
      </div>

      <AuthorityTruth snapshot={snapshot} />
    </div>
  )
}

export function CatalogueEditorial({ snapshot, category, query = '', status = 'active' }: { snapshot: LibrarySnapshot; category?: string | null; query?: string; status?: string }) {
  const books = snapshot.books.filter(book => (!category || (book.category || 'Non classé') === category) && (status === 'all' || book.status === status) && matches(query, [book.title, book.author, book.bookCode, book.isbn, book.category, book.publisher]))
  return <div className={styles.stack}>
    <div className={styles.commandToolbar}>
      <form className={styles.filterForm} method="get">
        <input className={styles.search} name="q" defaultValue={query} placeholder="Titre, auteur, ISBN, code, catégorie…" />
        <select className={styles.selectCompact} name="status" defaultValue={status}><option value="active">Titres actifs</option><option value="all">Tous les cycles</option><option value="inactive">Inactifs</option><option value="archived">Archivés</option></select>
        {category ? <input type="hidden" name="category" value={category} /> : null}
        <button className={`${styles.button} ${styles.buttonSecondary}`} type="submit">Filtrer</button>
      </form>
      <LibraryDrawer label="Nouvel ouvrage" title="Enregistrer un ouvrage"><BookStudio /></LibraryDrawer>
    </div>
    <div className={styles.registrySummary}><strong>{books.length}</strong><span>ouvrage(s) dans cette vue</span>{category ? <span className={styles.contextPill}>{category}</span> : null}</div>
    {books.length ? <div className={styles.catalogueGrid}>{books.map(book => <Link className={styles.bookCard} key={book.id} href={`${BASE}/livres/${book.id}`}><div className={styles.bookCode}>{book.bookCode} · {book.language.toUpperCase()}</div><div className={styles.bookTitle}>{book.title}</div><div className={styles.bookAuthor}>{book.author || 'Auteur non renseigné'}{book.category ? ` · ${book.category}` : ''}</div><div className={styles.bookStats}><div><strong>{book.copyCount}</strong><span>copies</span></div><div><strong className={book.availableCount ? styles.good : styles.bad}>{book.availableCount}</strong><span>disponibles</span></div><div><strong>{book.activeLoanCount}</strong><span>circulent</span></div><div><strong className={book.overdueCount ? styles.bad : ''}>{book.overdueCount}</strong><span>retards</span></div></div><footer><StatusPill value={book.status} tone={book.status === 'active' ? 'good' : 'neutral'} /><span>{book.lastCirculatedAt ? `Dernière circulation ${formatDate(book.lastCirculatedAt)}` : 'Aucune circulation'}</span></footer></Link>)}</div> : <EmptyState title="Aucun ouvrage dans cette vue" copy="Modifiez la recherche ou les filtres, ou enregistrez un nouvel ouvrage." />}
  </div>
}

function DossierNav({ items }: { items: Array<[string,string]> }) {
  return <nav className={styles.dossierNav} aria-label="Navigation dans le dossier">{items.map(([href,label]) => <a key={href} href={href}>{label}</a>)}</nav>
}

export function WorkPortrait({ snapshot, book, copies, loans }: { snapshot: LibrarySnapshot; book: LibraryBook; copies: LibraryCopy[]; loans: LibraryLoan[] }) {
  return <div className={styles.stack}>
    <section className={styles.dossierHero}>
      <div className={styles.dossierHeroLead}><span className={styles.eyebrow}>Bibliographic & Circulation Dossier · {book.bookCode}</span><h2>{book.title}</h2><p>{book.author || 'Auteur non renseigné'}{book.publisher ? ` · ${book.publisher}` : ''}</p><div className={styles.dossierActions}><LibraryDrawer label="Modifier l’ouvrage" title="Dossier éditorial" kind="secondary"><BookStudio book={book} /></LibraryDrawer><LibraryDrawer label="Ajouter un exemplaire" title="Nouvel exemplaire physique"><CopyStudio books={snapshot.books} initialBookId={book.id} /></LibraryDrawer></div></div>
      <div className={styles.dossierMetrics}><div><span>Exemplaires</span><strong>{book.copyCount}</strong></div><div><span>Disponibles</span><strong className={styles.good}>{book.availableCount}</strong></div><div><span>En circulation</span><strong>{book.activeLoanCount}</strong></div><div><span>Retards</span><strong className={book.overdueCount ? styles.bad : ''}>{book.overdueCount}</strong></div></div>
    </section>
    <DossierNav items={[["#overview","Vue catalogue"],["#copies","Exemplaires"],["#circulation","Circulation"],["#authority","Autorités"],["#audit","Audit"]]} />
    <section id="overview" className={styles.dossierSection}><div className={styles.sectionHeader}><div><span className={styles.sectionEyebrow}>Catalogue truth</span><h2 className={styles.sectionTitle}>Identité éditoriale</h2></div></div><div className={styles.factGrid}><div><span>ISBN</span><strong>{book.isbn || 'Non renseigné'}</strong></div><div><span>Catégorie</span><strong>{book.category || 'Non classé'}</strong></div><div><span>Langue</span><strong>{book.language.toUpperCase()}</strong></div><div><span>Éditeur</span><strong>{book.publisher || 'Non renseigné'}</strong></div><div><span>Circulations historiques</span><strong>{book.circulationCount}</strong></div><div><span>Dernière circulation</span><strong>{formatDate(book.lastCirculatedAt)}</strong></div></div></section>
    <section id="copies" className={styles.dossierSection}><div className={styles.sectionHeader}><div><span className={styles.sectionEyebrow}>Physical collection</span><h2 className={styles.sectionTitle}>Exemplaires physiques</h2><p className={styles.sectionCopy}>Œuvre et copie restent séparées : chaque exemplaire conserve son propre état, code-barres, condition, rayon et historique.</p></div></div>{copies.length ? <div className={styles.copyGrid}>{copies.map(copy => <Link href={`${BASE}/exemplaires/${copy.id}`} className={styles.copyCard} key={copy.id}><div className={styles.copyCardHead}><div><div className={styles.copyCode}>{copy.copyCode}</div><div className={styles.entitySub}>{copy.shelfLocation || 'Rayon non renseigné'} · {copy.condition}</div></div><StatusPill value={copy.status} tone={tone(copy.status)} /></div><div className={styles.metaList}><div className={styles.metaRow}><span>Code-barres</span><strong>{copy.barcode || '—'}</strong></div><div className={styles.metaRow}><span>Détenteur actuel</span><strong>{copy.borrowerName || 'Aucun'}</strong></div><div className={styles.metaRow}><span>Échéance</span><strong>{formatDate(copy.dueAt)}</strong></div></div></Link>)}</div> : <EmptyState title="Aucun exemplaire physique" copy="Le titre existe au catalogue mais aucune copie physique n’est enregistrée." />}</section>
    <section id="circulation" className={styles.dossierSection}><div className={styles.sectionHeader}><div><span className={styles.sectionEyebrow}>Circulation memory</span><h2 className={styles.sectionTitle}>Mémoire de circulation</h2></div></div>{loans.length ? <LoanTable loans={loans} /> : <EmptyState title="Aucune circulation historique" copy="Aucun prêt n’est encore associé aux exemplaires de cet ouvrage." />}</section>
    <section id="authority" className={styles.dossierSection}><AuthorityTruth snapshot={snapshot} /></section>
    <section id="audit" className={styles.dossierSection}><p className={styles.truthNote}>Les événements de modification sont conservés dans l’audit central AngelCare 360. Utilisez Collection Forensics pour l’exploration institutionnelle complète.</p></section>
  </div>
}

export function CopyFleet({ snapshot, query = '', status = 'all' }: { snapshot: LibrarySnapshot; query?: string; status?: string }) {
  const copies = snapshot.copies.filter(copy => (status === 'all' || copy.status === status) && matches(query, [copy.copyCode, copy.barcode, copy.bookTitle, copy.bookCode, copy.shelfLocation, copy.borrowerName]))
  return <div className={styles.stack}>
    <div className={styles.commandToolbar}><form className={styles.filterForm} method="get"><input className={styles.search} name="q" defaultValue={query} placeholder="Code exemplaire, code-barres, titre, rayon, emprunteur…" /><select className={styles.selectCompact} name="status" defaultValue={status}><option value="all">Tous les états</option><option value="available">Disponibles</option><option value="loaned">Prêtés</option><option value="damaged">Endommagés</option><option value="lost">Perdus</option><option value="reserved">Réservés · observés</option><option value="archived">Archivés</option></select><button className={`${styles.button} ${styles.buttonSecondary}`} type="submit">Filtrer</button></form><LibraryDrawer label="Nouvel exemplaire" title="Enregistrer un exemplaire"><CopyStudio books={snapshot.books} /></LibraryDrawer></div>
    <div className={styles.gridTwo}><div>{copies.length ? <><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Exemplaire</th><th>Ouvrage</th><th>Rayon enregistré</th><th>Condition</th><th>État</th><th>Détenteur</th></tr></thead><tbody>{copies.map(copy => <tr key={copy.id}><td><Link className={styles.entityLink} href={`${BASE}/exemplaires/${copy.id}`}>{copy.copyCode}</Link><small>{copy.barcode || 'Sans code-barres'}</small></td><td><Link className={styles.entityLink} href={`${BASE}/livres/${copy.bookId}`}>{copy.bookTitle}</Link><small>{copy.bookCode}</small></td><td>{copy.shelfLocation || '—'}</td><td>{copy.condition}</td><td><StatusPill value={copy.status} tone={tone(copy.status)} /></td><td>{copy.borrowerName || '—'}{copy.dueAt ? <small>Échéance {formatDate(copy.dueAt)}</small> : null}</td></tr>)}</tbody></table></div><div className={styles.mobileCards}>{copies.map(copy => <Link href={`${BASE}/exemplaires/${copy.id}`} className={styles.mobileEntityCard} key={copy.id}><header><div><span>{copy.copyCode}</span><strong>{copy.bookTitle}</strong></div><StatusPill value={copy.status} tone={tone(copy.status)} /></header><dl><div><dt>Rayon</dt><dd>{copy.shelfLocation || 'Non renseigné'}</dd></div><div><dt>Condition</dt><dd>{copy.condition}</dd></div><div><dt>Détenteur</dt><dd>{copy.borrowerName || 'Aucun'}</dd></div></dl></Link>)}</div></> : <EmptyState title="Aucun exemplaire dans cette vue" copy="Modifiez la recherche ou les filtres, ou enregistrez une nouvelle copie physique." />}</div><div className={styles.sticky}><BarcodeLookup /><div className={styles.truthCard}><strong>Localisation</strong><p>Le champ « rayon » est une localisation textuelle enregistrée. SANILA ne revendique aucune localisation physique temps réel, RFID ou IoT.</p></div></div></div>
  </div>
}

export function CopyDossier({ snapshot, copy, book, loans }: { snapshot: LibrarySnapshot; copy: LibraryCopy; book: LibraryBook | null; loans: LibraryLoan[] }) {
  return <div className={styles.stack}>
    <section className={styles.dossierHero}><div className={styles.dossierHeroLead}><span className={styles.eyebrow}>Copy Control Dossier</span><h2>{copy.copyCode}</h2><p>{copy.bookTitle} · {copy.author || 'Auteur non renseigné'}</p><div className={styles.dossierActions}><LibraryDrawer label="Modifier l’exemplaire" title={`Exemplaire ${copy.copyCode}`} kind="secondary"><CopyStudio books={snapshot.books} copy={copy} /></LibraryDrawer>{book ? <Link className={`${styles.button} ${styles.buttonSecondary}`} href={`${BASE}/livres/${book.id}`}>Ouvrir l’ouvrage</Link> : null}{copy.activeLoanId ? <Link className={styles.button} href={`${BASE}/prets/${copy.activeLoanId}`}>Ouvrir le prêt actif</Link> : null}</div></div><div className={styles.copyIdentity}><StatusPill value={copy.status} tone={tone(copy.status)} /><div><span>Détenteur</span><strong>{copy.borrowerName || 'Aucun'}</strong></div><div><span>Échéance</span><strong>{formatDate(copy.dueAt)}</strong></div></div></section>
    <DossierNav items={[["#state","État actuel"],["#identity","Identité physique"],["#circulation","Circulation"],["#governance","Gouvernance"]]} />
    <section id="state" className={styles.dossierSection}><div className={styles.factGrid}><div><span>État</span><strong>{copy.status}</strong></div><div><span>Condition</span><strong>{copy.condition}</strong></div><div><span>Rayon enregistré</span><strong>{copy.shelfLocation || 'Non renseigné'}</strong></div><div><span>Code-barres</span><strong>{copy.barcode || 'Non renseigné'}</strong></div><div><span>Acquisition</span><strong>{formatDate(copy.acquisitionDate)}</strong></div><div><span>Dernière activité connue</span><strong>{formatDate(copy.lastActivityAt, true)}</strong></div></div>{copy.status === 'reserved' ? <div className={styles.warningChamber}><strong>Réservation observée, autorité absente</strong><p>Le schéma autorise l’état « reserved » mais ne contient aucune table ni RPC de réservation Bibliothèque. SANILA ne crée, ne réordonne et ne libère donc aucune réservation depuis cette interface.</p></div> : null}</section>
    <section id="identity" className={styles.dossierSection}><p className={styles.truthNote}>L’exemplaire est l’autorité physique. Le titre bibliographique reste séparé, et le code-barres est protégé par l’unicité de production lorsqu’il est renseigné.</p></section>
    <section id="circulation" className={styles.dossierSection}><div className={styles.sectionHeader}><div><span className={styles.sectionEyebrow}>Copy chronology</span><h2 className={styles.sectionTitle}>Historique de circulation</h2></div></div>{loans.length ? <LoanTable loans={loans} /> : <EmptyState title="Aucun prêt historique" copy="Cet exemplaire n’a pas encore de circulation enregistrée." />}</section>
    <section id="governance" className={styles.dossierSection}><div className={styles.truthCard}><strong>Disponibilité souveraine</strong><p>Une copie n’est considérée disponible que si son état persistant le dit et qu’aucun prêt actif ne la verrouille. Les états « perdu », « endommagé », « réservé » et « archivé » restent indisponibles.</p></div></section>
  </div>
}

export function AvailabilityAtlas({ snapshot, query = '' }: { snapshot: LibrarySnapshot; query?: string }) {
  const books = snapshot.books.filter(book => matches(query, [book.title, book.author, book.bookCode, book.isbn, book.category]))
  const unavailable = books.filter(book => book.status === 'active' && book.copyCount > 0 && book.availableCount === 0)
  return <div className={styles.stack}>
    <div className={styles.commandToolbar}><form className={styles.filterForm} method="get"><input className={styles.search} name="q" defaultValue={query} placeholder="Titre, auteur, ISBN, code…" /><button className={`${styles.button} ${styles.buttonSecondary}`} type="submit">Rechercher</button></form></div>
    <ReadinessRail snapshot={snapshot} />
    <div className={styles.gridTwo}><section className={styles.panel}><div className={styles.sectionHeader}><div><span className={styles.sectionEyebrow}>Availability Atlas</span><h2 className={styles.sectionTitle}>Disponibilité par œuvre</h2><p className={styles.sectionCopy}>Disponibilité calculée depuis les copies physiques et les prêts actifs.</p></div></div><div className={styles.availabilityGrid}>{books.map(book => <Link className={styles.availabilityCard} key={book.id} href={`${BASE}/livres/${book.id}`} data-available={String(book.availableCount > 0)}><div><span>{book.bookCode}</span><strong>{book.title}</strong><small>{book.author || 'Auteur non renseigné'}</small></div><div className={styles.availabilityGauge}><strong>{book.availableCount}</strong><span>/ {book.copyCount} disponibles</span></div></Link>)}</div></section><aside className={styles.stack}><BarcodeLookup /><section className={styles.panel}><div className={styles.sectionHeader}><div><span className={styles.sectionEyebrow}>No availability</span><h2 className={styles.sectionTitle}>Titres sans copie disponible</h2></div></div>{unavailable.length ? <div className={styles.compactList}>{unavailable.slice(0, 12).map(book => <Link href={`${BASE}/livres/${book.id}`} key={book.id}><div><strong>{book.title}</strong><span>{book.copyCount} copie(s) · {book.activeLoanCount} prêt(s) actif(s)</span></div><b>{book.overdueCount ? `${book.overdueCount} retard(s)` : 'indisponible'}</b></Link>)}</div> : <EmptyState title="Aucun titre totalement indisponible" copy="Chaque titre actif possédant des exemplaires conserve au moins une copie disponible." />}</section></aside></div>
    <AuthorityTruth snapshot={snapshot} />
  </div>
}

export function CirculationDesk({ snapshot, query = '', state = 'active' }: { snapshot: LibrarySnapshot; query?: string; state?: string }) {
  const loans = snapshot.loans.filter(loan => (state === 'all' || state === 'active' && ['open','active','overdue'].includes(loan.effectiveStatus) && !loan.returnedAt || loan.effectiveStatus === state) && matches(query, [loan.bookTitle, loan.copyCode, loan.borrowerName, loan.borrowerCode, loan.bookCode]))
  return <div className={styles.stack}>
    <ReadinessRail snapshot={snapshot} />
    <div className={styles.commandToolbar}><form className={styles.filterForm} method="get"><input className={styles.search} name="q" defaultValue={query} placeholder="Ouvrage, exemplaire, membre, code…" /><select className={styles.selectCompact} name="state" defaultValue={state}><option value="active">Circulation active</option><option value="all">Tout l’historique</option><option value="overdue">Retards</option><option value="returned">Retournés</option><option value="lost">Perdus</option><option value="cancelled">Annulés</option></select><button className={`${styles.button} ${styles.buttonSecondary}`} type="submit">Filtrer</button></form><LibraryDrawer label="Nouveau prêt" title="Checkout Studio"><LoanStudio copies={snapshot.copies} borrowers={snapshot.borrowers} locked={!snapshot.integrity.safeForCirculation} /></LibraryDrawer></div>
    <div className={styles.gridTwo}><div>{loans.length ? <LoanTable loans={loans} /> : <EmptyState title="Aucun prêt dans cette vue" copy="Modifiez vos filtres ou démarrez un nouveau prêt si l’intégrité le permet." />}</div><aside className={styles.stack}><Integrity snapshot={snapshot} /><div className={styles.truthCard}><strong>Éligibilité membre</strong><p>L’autorité actuelle vérifie l’appartenance à l’établissement et le statut actif. Aucun plafond de prêt, blocage de retard ou politique de renouvellement supplémentaire n’est inventé.</p></div></aside></div>
  </div>
}

export function CirculationChamber({ snapshot, loan }: { snapshot: LibrarySnapshot; loan: LibraryLoan }) {
  const active = ['open', 'active', 'overdue'].includes(loan.effectiveStatus) && !loan.returnedAt
  const memberId = loan.borrowerStudentId || loan.borrowerStaffId
  return <div className={styles.stack}>
    <section className={styles.dossierHero}><div className={styles.dossierHeroLead}><span className={styles.eyebrow}>Circulation Chamber</span><h2>{loan.bookTitle}</h2><p>{loan.copyCode} · {loan.borrowerName}</p><div className={styles.dossierActions}>{memberId ? <Link className={`${styles.button} ${styles.buttonSecondary}`} href={`${BASE}/membres/${memberId}`}>Ouvrir le membre</Link> : null}<Link className={`${styles.button} ${styles.buttonSecondary}`} href={`${BASE}/exemplaires/${loan.copyId}`}>Ouvrir l’exemplaire</Link>{active ? <LibraryDrawer label="Enregistrer le retour" title={`Retour · ${loan.copyCode}`}><ReturnStudio loan={loan} locked={!snapshot.integrity.safeForCirculation} /></LibraryDrawer> : null}{active ? <LibraryDrawer label="Perte / annulation" title="Exception de circulation" kind="danger"><LossCancelStudio loan={loan} locked={!snapshot.integrity.safeForCirculation} /></LibraryDrawer> : null}</div></div><div className={styles.loanStateCard}><StatusPill value={loan.effectiveStatus} tone={tone(loan.effectiveStatus)} /><div><span>Prêté</span><strong>{formatDate(loan.loanedAt, true)}</strong></div><div><span>Échéance</span><strong>{formatDate(loan.dueAt, true)}</strong></div><div><span>Retour</span><strong>{formatDate(loan.returnedAt, true)}</strong></div></div></section>
    <DossierNav items={[["#truth","Vérité de circulation"],["#member","Membre"],["#copy","Exemplaire"],["#financial","Pénalité enregistrée"],["#authority","Autorités"]]} />
    <section id="truth" className={styles.dossierSection}><div className={styles.circulationPath}><div data-done="true"><span>01</span><strong>Prêt confirmé</strong><small>{formatDate(loan.loanedAt, true)}</small></div><div data-done={String(loan.daysOverdue === 0 || Boolean(loan.returnedAt))}><span>02</span><strong>Échéance</strong><small>{loan.daysOverdue ? `${loan.daysOverdue} jour(s) de retard` : formatDate(loan.dueAt)}</small></div><div data-done={String(Boolean(loan.returnedAt))}><span>03</span><strong>{loan.effectiveStatus === 'lost' ? 'Perte enregistrée' : loan.returnedAt ? 'Retour confirmé' : 'Retour attendu'}</strong><small>{formatDate(loan.returnedAt, true)}</small></div></div></section>
    <section id="member" className={styles.dossierSection}><div className={styles.factGrid}><div><span>Emprunteur</span><strong>{loan.borrowerName}</strong></div><div><span>Code</span><strong>{loan.borrowerCode}</strong></div><div><span>Type</span><strong>{loan.borrowerType === 'staff' ? 'Personnel' : 'Élève'}</strong></div></div></section>
    <section id="copy" className={styles.dossierSection}><div className={styles.factGrid}><div><span>Exemplaire</span><strong>{loan.copyCode}</strong></div><div><span>Rayon enregistré</span><strong>{loan.shelfLocation || 'Non renseigné'}</strong></div><div><span>Condition</span><strong>{loan.copyCondition}</strong></div><div><span>État actuel</span><strong>{loan.copyStatus}</strong></div></div></section>
    <section id="financial" className={styles.dossierSection}><div className={styles.warningChamber}><strong>{formatMoney(loan.fineAmount)} · valeur de pénalité enregistrée</strong><p>Cette valeur appartient au champ Bibliothèque. Elle n’est pas présentée comme facture, créance ou paiement Finance et aucun calcul automatique de pénalité n’est introduit par cette interface.</p></div></section>
    <section id="authority" className={styles.dossierSection}><AuthorityTruth snapshot={snapshot} /></section>
  </div>
}

export function ReturnDesk({ snapshot }: { snapshot: LibrarySnapshot }) {
  const active = snapshot.loans.filter(l => ['open', 'active', 'overdue'].includes(l.effectiveStatus) && !l.returnedAt).sort((a,b) => a.dueAt.localeCompare(b.dueAt))
  return <div className={styles.stack}><div className={styles.returnHero}><div><span className={styles.sectionEyebrow}>Return Desk</span><h2>{active.length} retour(s) encore ouverts</h2><p>Les retours sont traités depuis le dossier de circulation pour conserver le contexte emprunteur, échéance, condition et conséquence sur la disponibilité.</p></div><BarcodeLookup compact /></div>{active.length ? <LoanTable loans={active} actionLabel="Ouvrir le retour" /> : <EmptyState title="Aucun prêt à retourner" copy="Aucune circulation active n’est actuellement enregistrée." />}<Integrity snapshot={snapshot} /></div>
}

export function OverdueRecovery({ snapshot }: { snapshot: LibrarySnapshot }) {
  const overdue = snapshot.loans.filter(l => l.effectiveStatus === 'overdue').sort((a,b) => b.daysOverdue - a.daysOverdue)
  const members = snapshot.borrowers.filter(item => item.overdueLoanCount > 0).sort((a,b) => b.overdueLoanCount - a.overdueLoanCount)
  const bands = [['1–3 jours', overdue.filter(l => l.daysOverdue <= 3).length],['4–7 jours', overdue.filter(l => l.daysOverdue >= 4 && l.daysOverdue <= 7).length],['8–14 jours', overdue.filter(l => l.daysOverdue >= 8 && l.daysOverdue <= 14).length],['15–30 jours', overdue.filter(l => l.daysOverdue >= 15 && l.daysOverdue <= 30).length],['30+ jours', overdue.filter(l => l.daysOverdue > 30).length]] as const
  return <div className={styles.stack}><section className={styles.overdueBands}>{bands.map(([label,count]) => <div key={label} data-active={String(count>0)}><strong>{count}</strong><span>{label}</span></div>)}</section><div className={styles.message + ' ' + styles.messageWarn}><strong>Vérité de relance</strong> · Bibliothèque n’affiche jamais « SMS envoyé », « WhatsApp livré » ou « Email envoyé ». Toute communication doit passer par l’autorité Messagerie et son état fournisseur réel.</div><div className={styles.gridTwo}><section>{overdue.length ? <LoanTable loans={overdue} /> : <EmptyState title="Aucun retour en retard" copy="Tous les prêts ouverts restent dans leurs délais enregistrés." />}</section><aside className={styles.panel}><div className={styles.sectionHeader}><div><span className={styles.sectionEyebrow}>Member attention</span><h2 className={styles.sectionTitle}>Membres concernés</h2></div></div>{members.length ? <div className={styles.compactList}>{members.map(member => <Link href={`${BASE}/membres/${member.id}`} key={member.id}><div><strong>{member.fullName}</strong><span>{member.classLabel || member.secondary || (member.type === 'staff' ? 'Personnel' : 'Élève')}</span></div><b>{member.overdueLoanCount} retard(s)</b></Link>)}</div> : <EmptyState title="Aucun membre en retard" copy="Aucun emprunteur ne détient actuellement de prêt au-delà de son échéance." />}</aside></div></div>
}

export function MemberCommand({ snapshot, query = '', type = 'all', attention = false }: { snapshot: LibrarySnapshot; query?: string; type?: string; attention?: boolean }) {
  const members = snapshot.borrowers.filter(member => (type === 'all' || member.type === type) && (!attention || member.overdueLoanCount > 0) && matches(query, [member.fullName, member.code, member.classLabel, member.secondary, ...member.currentTitles]))
  return <div className={styles.stack}><div className={styles.commandToolbar}><form className={styles.filterForm} method="get"><input className={styles.search} name="q" defaultValue={query} placeholder="Nom, code, classe, département, ouvrage…" /><select className={styles.selectCompact} name="type" defaultValue={type}><option value="all">Tous les membres</option><option value="student">Élèves</option><option value="staff">Personnel</option></select><label className={styles.checkFilter}><input type="checkbox" name="attention" value="1" defaultChecked={attention}/><span>Retards uniquement</span></label><button className={`${styles.button} ${styles.buttonSecondary}`} type="submit">Filtrer</button></form></div><div className={styles.memberSummary}><div><span>Membres actifs en circulation</span><strong>{snapshot.metrics.activeBorrowers}</strong></div><div><span>Avec retard</span><strong className={snapshot.metrics.borrowersWithOverdue ? styles.bad : styles.good}>{snapshot.metrics.borrowersWithOverdue}</strong></div><div><span>Règle de plafond</span><strong>Non prouvée</strong><small>aucun plafond inventé</small></div></div>{members.length ? <div className={styles.memberGrid}>{members.map(member => <Link className={styles.memberCard} href={`${BASE}/membres/${member.id}`} key={member.id} data-attention={String(member.overdueLoanCount>0)}><header><div className={styles.memberAvatar}>{member.fullName.slice(0,2).toUpperCase()}</div><div><strong>{member.fullName}</strong><span>{member.code} · {member.type === 'staff' ? 'Personnel' : member.classLabel || 'Élève'}</span></div><StatusPill value={member.eligibility === 'attention' ? 'Attention' : member.eligibility === 'inactive' ? 'Inactif' : 'Actif'} tone={tone(member.eligibility)} /></header><div className={styles.memberStats}><div><b>{member.activeLoanCount}</b><span>actifs</span></div><div><b className={member.overdueLoanCount ? styles.bad : ''}>{member.overdueLoanCount}</b><span>retards</span></div><div><b>{member.totalLoanCount}</b><span>historique</span></div></div>{member.currentTitles.length ? <p>{member.currentTitles.slice(0,3).join(' · ')}</p> : <p>Aucun ouvrage actuellement détenu.</p>}</Link>)}</div> : <EmptyState title="Aucun membre dans cette vue" copy="Modifiez la recherche ou les filtres. Les membres Bibliothèque sont dérivés des élèves et membres du personnel actifs." />}</div>
}

export function MemberDossier({ snapshot, borrower, loans }: { snapshot: LibrarySnapshot; borrower: LibraryBorrower; loans: LibraryLoan[] }) {
  const active = loans.filter(loan => !loan.returnedAt && ['open','active','overdue'].includes(loan.effectiveStatus))
  const overdue = active.filter(loan => loan.effectiveStatus === 'overdue')
  return <div className={styles.stack}><section className={styles.dossierHero}><div className={styles.dossierHeroLead}><span className={styles.eyebrow}>Library Member Dossier</span><h2>{borrower.fullName}</h2><p>{borrower.type === 'staff' ? 'Personnel' : 'Élève'} · {borrower.code}{borrower.classLabel ? ` · ${borrower.classLabel}` : borrower.secondary ? ` · ${borrower.secondary}` : ''}</p><div className={styles.dossierActions}><Link className={styles.button} href={`${BASE}/prets`}>Nouveau prêt depuis Circulation</Link></div></div><div className={styles.dossierMetrics}><div><span>Prêts actifs</span><strong>{borrower.activeLoanCount}</strong></div><div><span>Retards</span><strong className={borrower.overdueLoanCount ? styles.bad : ''}>{borrower.overdueLoanCount}</strong></div><div><span>Historique</span><strong>{borrower.totalLoanCount}</strong></div><div><span>Perdus</span><strong className={borrower.lostLoanCount ? styles.bad : ''}>{borrower.lostLoanCount}</strong></div></div></section><DossierNav items={[["#current","Prêts actuels"],["#eligibility","Éligibilité"],["#history","Historique"],["#truth","Doctrine"]]} /><section id="current" className={styles.dossierSection}>{active.length ? <LoanTable loans={active} /> : <EmptyState title="Aucun prêt actif" copy="Ce membre ne détient actuellement aucun exemplaire en circulation." />}</section><section id="eligibility" className={styles.dossierSection}><div className={styles.eligibilityCard} data-state={borrower.eligibility}><StatusPill value={borrower.eligibility === 'attention' ? 'Actif · attention' : borrower.eligibility === 'inactive' ? 'Inactif' : 'Actif'} tone={tone(borrower.eligibility)} /><strong>Éligibilité réellement prouvée</strong><p>{borrower.eligibilityReason}</p>{overdue.length ? <small>{overdue.length} prêt(s) sont en retard, mais le schéma actuel ne prouve aucune règle automatique de blocage liée aux retards.</small> : null}</div></section><section id="history" className={styles.dossierSection}>{loans.length ? <LoanTable loans={loans} /> : <EmptyState title="Aucune circulation historique" copy="Ce membre n’a encore aucun prêt Bibliothèque enregistré." />}</section><section id="truth" className={styles.dossierSection}><div className={styles.truthCard}><strong>Aucun scoring comportemental</strong><p>SANILA n’attribue aucun score de « bon » ou « mauvais » emprunteur. Le dossier présente uniquement les prêts, retards, retours et exceptions réellement persistés.</p></div></section></div>
}

export function CollectionForensics({ snapshot }: { snapshot: LibrarySnapshot }) {
  return <div className={styles.stack}><Integrity snapshot={snapshot} /><section className={styles.panel}><div className={styles.sectionHeader}><div><span className={styles.sectionEyebrow}>Collection Forensics</span><h2 className={styles.sectionTitle}>Traçabilité institutionnelle</h2><p className={styles.sectionCopy}>Chronologie issue de l’autorité d’audit AngelCare 360 — aucune histoire reconstruite artificiellement.</p></div></div>{snapshot.audit.length ? <div className={styles.forensics}>{snapshot.audit.map(event => <article className={styles.auditEvent} key={event.id}><time>{formatDate(event.createdAt, true)}</time><span className={styles.auditDot}/><div><strong>{event.action}</strong><p>{event.entityType || 'entité'} · {event.entityId || '—'} · acteur {event.actorRole || event.actorUserId || 'non résolu'}</p></div><StatusPill value={event.severity} tone={event.severity === 'critical' || event.severity === 'warning' ? 'bad' : 'neutral'} /></article>)}</div> : <EmptyState title="Aucun événement d’audit Bibliothèque" copy="Les futures mutations auditées apparaîtront ici." />}</section><AuthorityTruth snapshot={snapshot} /></div>
}

function LoanTable({ loans, actionLabel = 'Ouvrir' }: { loans: LibraryLoan[]; actionLabel?: string }) {
  return <><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Ouvrage / exemplaire</th><th>Emprunteur</th><th>Prêt</th><th>Échéance</th><th>État</th><th></th></tr></thead><tbody>{loans.map(loan => <tr key={loan.id}><td><strong>{loan.bookTitle}</strong><small>{loan.copyCode} · {loan.bookCode}</small></td><td>{loan.borrowerName}<small>{loan.borrowerType === 'staff' ? 'Personnel' : 'Élève'} · {loan.borrowerCode}</small></td><td>{formatDate(loan.loanedAt)}</td><td>{formatDate(loan.dueAt)}{loan.daysOverdue ? <small className={styles.bad}>{loan.daysOverdue} j de retard</small> : null}</td><td><StatusPill value={loan.effectiveStatus} tone={tone(loan.effectiveStatus)} /></td><td><Link className={`${styles.button} ${styles.buttonSecondary}`} href={`${BASE}/prets/${loan.id}`}>{actionLabel}</Link></td></tr>)}</tbody></table></div><div className={styles.mobileCards}>{loans.map(loan => <Link href={`${BASE}/prets/${loan.id}`} className={styles.mobileEntityCard} key={loan.id}><header><div><span>{loan.copyCode}</span><strong>{loan.bookTitle}</strong></div><StatusPill value={loan.effectiveStatus} tone={tone(loan.effectiveStatus)} /></header><dl><div><dt>Emprunteur</dt><dd>{loan.borrowerName}</dd></div><div><dt>Échéance</dt><dd>{formatDate(loan.dueAt)}{loan.daysOverdue ? ` · ${loan.daysOverdue} j retard` : ''}</dd></div></dl></Link>)}</div></>
}
