import type { ScannerContact, ScannerFact, ScannerPageExtraction, ScannerSignal } from './types'

const ROLE_TERMS = [
  'chief executive officer','ceo','managing director','directeur général','directrice générale','direction générale',
  'general manager','hotel manager','directeur hôtel','directrice hôtel','operations director','operations manager',
  'directeur des opérations','directrice des opérations','responsable opérations','human resources','hr director','hr manager',
  'directeur ressources humaines','directrice ressources humaines','responsable rh','procurement','purchasing manager',
  'directeur achats','directrice achats','responsable achats','finance director','chief financial officer','cfo',
  'directeur financier','directrice financière','marketing director','sales director','commercial director',
  'directeur commercial','directrice commerciale','partnerships','partenariats','principal','headteacher','school director',
  'directeur pédagogique','directrice pédagogique','clinic director','medical director','pediatrician','pédiatre',
]

const MOROCCAN_CITIES = ['Casablanca','Rabat','Salé','Temara','Kénitra','Tanger','Tétouan','Fès','Meknès','Marrakech','Agadir','Oujda','Mohammedia','El Jadida']

const LINK_CATEGORIES: Array<{ key: string; score: number; terms: string[] }> = [
  { key: 'leadership', score: 100, terms: ['team','leadership','management','direction','equipe','équipe','gouvernance','who-we-are'] },
  { key: 'contact', score: 95, terms: ['contact','nous-contacter','contact-us','coordonnees','coordonnées'] },
  { key: 'locations', score: 92, terms: ['locations','sites','branches','agences','campus','hotels','properties','implantations'] },
  { key: 'services', score: 90, terms: ['services','solutions','programs','programmes','offers','offres','activities','activités'] },
  { key: 'partnerships', score: 88, terms: ['partners','partenaires','partnership','partenariat','suppliers','fournisseurs','procurement','achats'] },
  { key: 'news', score: 78, terms: ['news','actualites','actualités','press','presse','blog','events','evenements','événements'] },
  { key: 'careers', score: 72, terms: ['career','careers','jobs','emploi','recrutement','join-us'] },
  { key: 'about', score: 68, terms: ['about','a-propos','à-propos','notre-histoire','company','institution'] },
  { key: 'legal', score: 40, terms: ['legal','mentions-legales','mentions-légales','privacy','confidentialite'] },
]

function decodeEntities(value: string) {
  const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç' }
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (m, key) => named[key.toLowerCase()] ?? m)
}

export function cleanText(value: unknown, max = 4000) {
  return decodeEntities(String(value || ''))
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function stripDangerousHtml(html: string) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|canvas|template)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
}

function stripTags(html: string) {
  return cleanText(stripDangerousHtml(html).replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>|<\/li>|<\/div>|<\/section>|<\/article>|<\/h[1-6]>/gi, '\n').replace(/<[^>]+>/g, ' '), 120000)
}

function attr(tag: string, name: string) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))
  return cleanText(match?.[1] || match?.[2] || match?.[3] || '', 2000) || null
}

function metaContent(html: string, key: string) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const name = attr(tag, 'name') || attr(tag, 'property')
    if (name?.toLowerCase() === key.toLowerCase()) return attr(tag, 'content')
  }
  return null
}

function extractJsonLd(html: string) {
  const values: any[] = []
  const regex = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(html))) {
    try {
      const parsed = JSON.parse(decodeEntities(match[1]).trim())
      const list = Array.isArray(parsed) ? parsed : [parsed]
      for (const item of list) {
        if (Array.isArray(item?.['@graph'])) values.push(...item['@graph'])
        else values.push(item)
      }
    } catch {
      // Invalid publisher JSON-LD is ignored but never treated as verified evidence.
    }
  }
  return values.filter(Boolean)
}

function schemaOrganization(items: any[]) {
  return items.find((item) => {
    const type = Array.isArray(item?.['@type']) ? item['@type'].join(' ') : String(item?.['@type'] || '')
    return /Organization|Corporation|LocalBusiness|Hotel|School|EducationalOrganization|MedicalOrganization|Hospital|EventVenue|ProfessionalService/i.test(type)
  }) || {}
}

function unique(values: Array<string | null | undefined>, max = 100) {
  return [...new Set(values.map((value) => cleanText(value, 600)).filter(Boolean) as string[])].slice(0, max)
}

function extractEmails(text: string) {
  return unique((text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []).map((email) => email.toLowerCase()), 40)
}

function extractPhones(text: string) {
  return unique((text.match(/(?:\+?212|0)[\s().-]*(?:5|6|7)[\d\s().-]{7,14}/g) || []).map((phone) => phone.replace(/\s+/g, ' ').trim()), 30)
}

function detectCity(text: string) {
  const folded = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return MOROCCAN_CITIES.find((city) => folded.includes(city.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())) || null
}

function classifyLink(url: URL, label: string) {
  const haystack = `${url.pathname} ${label}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  for (const category of LINK_CATEGORIES) if (category.terms.some((term) => haystack.includes(term.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))) return { category: category.key, score: category.score }
  return { category: 'other', score: 10 }
}

function extractLinks(html: string, pageUrl: URL) {
  const links: Array<{ url: string; label: string; category: string; score: number }> = []
  const regex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(html))) {
    const href = attr(match[1], 'href')
    if (!href || /^(mailto:|tel:|javascript:|#)/i.test(href)) continue
    try {
      const resolved = new URL(href, pageUrl)
      if (!['http:', 'https:'].includes(resolved.protocol) || resolved.origin !== pageUrl.origin) continue
      resolved.hash = ''
      const label = cleanText(match[2].replace(/<[^>]+>/g, ' '), 200)
      const classified = classifyLink(resolved, label)
      links.push({ url: resolved.toString(), label, ...classified })
    } catch {
      // Ignore malformed publisher URLs.
    }
  }
  return [...new Map(links.sort((a, b) => b.score - a.score).map((item) => [item.url, item])).values()].slice(0, 80)
}

function extractSocialLinks(html: string, pageUrl: URL) {
  const hosts = ['linkedin.com','facebook.com','instagram.com','youtube.com','x.com','twitter.com','tiktok.com']
  const output: string[] = []
  for (const tag of html.match(/<a\b[^>]*>/gi) || []) {
    const href = attr(tag, 'href')
    if (!href) continue
    try {
      const url = new URL(href, pageUrl)
      if (hosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) output.push(url.toString())
    } catch {}
  }
  return unique(output, 20)
}

function roleHypothesis(role: string) {
  const value = role.toLowerCase()
  if (/chief executive|ceo|managing director|directeur général|directrice générale|direction générale|principal|school director/.test(value)) return 'economic_buyer'
  if (/finance|cfo|financier/.test(value)) return 'financial_approver'
  if (/procurement|purchasing|achats|fournisseur/.test(value)) return 'procurement'
  if (/operations|opérations|hotel manager|general manager/.test(value)) return 'operational_owner'
  if (/human resources|hr |ressources humaines|responsable rh/.test(value)) return 'commercial_sponsor'
  if (/partnership|partenariat|commercial|sales|marketing/.test(value)) return 'influencer'
  return null
}

function extractContacts(html: string, pageUrl: URL, pageText: string) {
  const contacts: ScannerContact[] = []
  const segments = (stripDangerousHtml(html).match(/<(?:article|section|li|div)\b[^>]*>[\s\S]{20,900}?<\/(?:article|section|li|div)>/gi) || []).slice(0, 2500)
  for (const segment of segments) {
    const text = cleanText(segment.replace(/<[^>]+>/g, ' '), 700)
    const lower = text.toLowerCase()
    const role = ROLE_TERMS.find((term) => lower.includes(term))
    if (!role) continue
    const emails = extractEmails(text)
    const phones = extractPhones(text)
    const roleEscaped = role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const nameSource = text
      .replace(new RegExp(roleEscaped, 'ig'), ' ')
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig, ' ')
      .replace(/(?:\+?212|0)[\s().-]*(?:5|6|7)[\d\s().-]{7,14}/g, ' ')
      .replace(/\b(?:direction|management|leadership|équipe|equipe|team|contact)\b/ig, ' ')
    const nameCandidates = nameSource.match(/\b(?:[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ'’-]{1,})(?:\s+(?:El|Al|Ben|Bint|De|Du|La|Le|[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ'’-]{1,})){1,4}\b/g) || []
    const name = nameCandidates.find((candidate) => !/^(Notre|Our|The|Les|Des)\b/i.test(candidate)) || null
    if (!name && !emails.length && !phones.length) continue
    contacts.push({
      name,
      role: cleanText(text.match(new RegExp(`.{0,70}(${role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}).{0,70}`, 'i'))?.[0] || role, 180),
      department: /human resources|ressources humaines|\brh\b/i.test(text) ? 'Human Resources' : /finance|cfo|financier/i.test(text) ? 'Finance' : /operations|opérations/i.test(text) ? 'Operations' : /commercial|sales|marketing|partnership/i.test(text) ? 'Commercial' : null,
      email: emails[0] || null,
      phone: phones[0] || null,
      sourceUrl: pageUrl.toString(),
      confidence: name ? 0.78 : 0.62,
      buyingRoleHypothesis: roleHypothesis(role),
      metadata: { evidenceExcerpt: text.slice(0, 350) },
    })
  }
  for (const email of extractEmails(pageText)) {
    if (!contacts.some((contact) => contact.email === email)) contacts.push({ name: null, role: null, department: null, email, phone: null, sourceUrl: pageUrl.toString(), confidence: 0.72, metadata: { source: 'page_email' } })
  }
  return contacts.slice(0, 40)
}

const SIGNAL_RULES: Array<{ type: ScannerSignal['signalType']; key: string; label: string; pattern: RegExp; interpretation: string }> = [
  { type: 'growth', key: 'new_location', label: 'Expansion géographique', pattern: /new (?:location|branch|site|property|campus)|nouveau (?:site|campus|centre|bureau|hotel|hôtel)|ouverture prochaine/i, interpretation: 'Une ouverture ou expansion peut créer un besoin de lancement, staffing, formation ou programme multi-site.' },
  { type: 'growth', key: 'recruitment_growth', label: 'Recrutement actif', pattern: /we are hiring|join our team|recrutement|offres d'emploi|carrières|careers/i, interpretation: 'Le recrutement peut signaler une phase de croissance et une ouverture aux solutions RH ou opérationnelles.' },
  { type: 'need', key: 'family_positioning', label: 'Positionnement familles', pattern: /family friendly|family-friendly|familles|enfants|kids|children|parents|parental/i, interpretation: 'Le positionnement familial rend pertinentes les offres de garde, animation, programmes enfants et expérience parent.' },
  { type: 'need', key: 'events_activity', label: 'Activité événementielle', pattern: /events|événements|seminars|séminaires|conferences|conférences|weddings|mariages/i, interpretation: 'Une activité événementielle récurrente peut justifier une solution childcare ou kids experience sur site.' },
  { type: 'buying', key: 'partnership_opening', label: 'Ouverture partenariats', pattern: /partnership|partenariat|become a partner|devenir partenaire|suppliers|fournisseurs|procurement|appel d'offres/i, interpretation: 'Un canal de partenariat ou achats public fournit une voie d’entrée commerciale structurée.' },
  { type: 'buying', key: 'contact_cta', label: 'Canal de prise de contact', pattern: /request a quote|demander un devis|contact us|contactez-nous|book a meeting|prendre rendez-vous/i, interpretation: 'Un parcours de contact ou devis visible augmente la capacité d’activation commerciale.' },
  { type: 'positioning', key: 'premium_positioning', label: 'Positionnement premium', pattern: /premium|luxury|luxe|five-star|5-star|haut de gamme|excellence/i, interpretation: 'Le positionnement premium peut soutenir une offre ANGELCARE à forte exigence qualité et expérience.' },
  { type: 'operational', key: 'multi_site', label: 'Structure multi-site', pattern: /our locations|nos sites|nos établissements|our properties|campuses|branches|agences|network|réseau/i, interpretation: 'Une organisation multi-site augmente le potentiel de déploiement progressif ou national.' },
  { type: 'risk', key: 'current_childcare_offer', label: 'Offre enfants déjà structurée', pattern: /kids club|club enfants|childcare service|service de garde|nursery service|crèche interne/i, interpretation: 'Une offre existante peut être un concurrent, un besoin de renforcement ou une opportunité d’externalisation.' },
]

function extractSignals(text: string, pageUrl: URL) {
  const signals: ScannerSignal[] = []
  for (const rule of SIGNAL_RULES) {
    const match = text.match(rule.pattern)
    if (!match) continue
    const index = match.index || 0
    const excerpt = cleanText(text.slice(Math.max(0, index - 120), index + 260), 420)
    signals.push({ signalType: rule.type, signalKey: rule.key, label: rule.label, evidence: excerpt, sourceUrl: pageUrl.toString(), confidence: 0.72, commercialInterpretation: rule.interpretation })
  }
  return signals
}

function extractServices(text: string) {
  const catalogue = [
    ['hospitality','hotel','hôtel','resort','hébergement'],['education','school','école','crèche','nursery','preschool','maternelle'],
    ['healthcare','clinic','clinique','hospital','hôpital','pediatric','pédiatr'],['events','events','événements','conferences','séminaires'],
    ['corporate','employee benefits','avantages salariés','workplace','ressources humaines'],['training','training','formation','academy','académie'],
    ['childcare','childcare','garde d’enfants','babysitting','kids club','club enfants'],['transport','transport','shuttle','navette'],
  ]
  const lower = text.toLowerCase()
  return catalogue.filter(([, ...terms]) => terms.some((term) => lower.includes(term))).map(([label]) => label)
}

function pageType(url: URL, title: string, text: string) {
  const hay = `${url.pathname} ${title} ${text.slice(0, 800)}`.toLowerCase()
  if (/team|leadership|management|direction|equipe|équipe/.test(hay)) return 'leadership'
  if (/contact|coordonn/.test(hay)) return 'contact'
  if (/location|site|branch|campus|property|implantation/.test(hay)) return 'locations'
  if (/service|solution|programme|program|offre|activity|activité/.test(hay)) return 'services'
  if (/news|actualit|press|presse|blog|event|événement/.test(hay)) return 'news'
  if (/career|job|emploi|recrut/.test(hay)) return 'careers'
  if (/partner|partenariat|supplier|fournisseur|procurement|achat/.test(hay)) return 'partnerships'
  if (/about|a-propos|à-propos|history|histoire/.test(hay)) return 'about'
  return url.pathname === '/' || !url.pathname ? 'homepage' : 'content'
}

function sourceFact(fieldKey: string, value: unknown, pageUrl: URL, title: string, method: string, confidence: number, excerpt?: string | null): ScannerFact | null {
  const text = cleanText(value, 2000)
  return text ? { fieldKey, value: text, normalizedValue: text, sourceUrl: pageUrl.toString(), sourceTitle: title, evidenceExcerpt: excerpt || text.slice(0, 350), extractionMethod: method, confidence, validationState: 'detected' } : null
}

export function parseBusinessHtml(input: { html: string; url: string; status?: number | null; contentType?: string | null }): ScannerPageExtraction {
  const pageUrl = new URL(input.url)
  const html = input.html.slice(0, 1_500_000)
  const text = stripTags(html)
  const jsonLd = extractJsonLd(html)
  const schema = schemaOrganization(jsonLd)
  const title = cleanText(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || metaContent(html, 'og:title') || '', 300) || null
  const description = cleanText(schema.description || metaContent(html, 'description') || metaContent(html, 'og:description') || '', 1800) || null
  const schemaAddress = typeof schema.address === 'string' ? schema.address : [schema.address?.streetAddress, schema.address?.addressLocality, schema.address?.addressRegion, schema.address?.postalCode].filter(Boolean).join(', ')
  const emails = unique([schema.email, ...extractEmails(text)], 40)
  const phones = unique([schema.telephone, ...extractPhones(text)], 30)
  const name = cleanText(schema.name || metaContent(html, 'og:site_name') || title?.split(/[|–—-]/)[0] || '', 300) || null
  const legalName = cleanText(schema.legalName || text.match(/\b[A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-öø-ÿ0-9&'’. -]{2,80}\s+(?:SARL|S\.A\.?|SA|SAS|LLC|LTD|LIMITED|INC)\b/i)?.[0] || '', 300) || null
  const city = cleanText(schema.address?.addressLocality || detectCity(`${schemaAddress} ${text.slice(-5000)}`) || '', 120) || null
  const address = cleanText(schemaAddress || text.match(/(?:Adresse|Address)\s*[:：-]?\s*([^\n]{8,220})/i)?.[1] || '', 500) || null
  const socialLinks = extractSocialLinks(html, pageUrl)
  const internalLinks = extractLinks(html, pageUrl)
  const contacts = extractContacts(html, pageUrl, text)
  const signals = extractSignals(text, pageUrl)
  const services = extractServices(`${description || ''} ${text}`)
  const pType = pageType(pageUrl, title || '', text)
  const facts = [
    sourceFact('organization.name', name, pageUrl, title || '', schema.name ? 'json_ld' : 'page_identity', schema.name ? 0.96 : 0.78),
    sourceFact('organization.legalName', legalName, pageUrl, title || '', schema.legalName ? 'json_ld' : 'legal_pattern', schema.legalName ? 0.96 : 0.7),
    sourceFact('organization.description', description, pageUrl, title || '', schema.description ? 'json_ld' : 'meta_description', schema.description ? 0.92 : 0.78),
    sourceFact('organization.address', address, pageUrl, title || '', schemaAddress ? 'json_ld' : 'address_pattern', schemaAddress ? 0.94 : 0.68),
    sourceFact('organization.city', city, pageUrl, title || '', schema.address?.addressLocality ? 'json_ld' : 'territory_detection', schema.address?.addressLocality ? 0.95 : 0.72),
    ...emails.map((email) => sourceFact('organization.email', email, pageUrl, title || '', schema.email === email ? 'json_ld' : 'email_pattern', schema.email === email ? 0.96 : 0.84)),
    ...phones.map((phone) => sourceFact('organization.phone', phone, pageUrl, title || '', schema.telephone === phone ? 'json_ld' : 'phone_pattern', schema.telephone === phone ? 0.96 : 0.82)),
    ...services.map((service) => sourceFact('organization.service', service, pageUrl, title || '', 'service_taxonomy', 0.68)),
  ].filter(Boolean) as ScannerFact[]
  const branches = pType === 'locations' || internalLinks.filter((link) => link.category === 'locations').length > 1
    ? [{ name, city, address, sourceUrl: pageUrl.toString() }]
    : []
  return {
    page: { url: pageUrl.toString(), title, pageType: pType, status: 'fetched', httpStatus: input.status ?? null, contentType: input.contentType ?? 'text/html', textLength: text.length, metadata: { jsonLdTypes: unique(jsonLd.map((item) => Array.isArray(item?.['@type']) ? item['@type'].join(',') : item?.['@type']), 20) } },
    organization: { name, legalName, description, address, city, email: emails[0] || null, phone: phones[0] || null, website: pageUrl.origin, domain: pageUrl.hostname.replace(/^www\./, ''), socialLinks, category: schema['@type'] || null },
    facts,
    contacts,
    signals,
    services,
    internalLinks,
    branches,
    textSummary: cleanText(text, 5000),
  }
}
