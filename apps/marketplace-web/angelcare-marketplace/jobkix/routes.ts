import { isLocale, type Locale } from './contracts';
export type Audience = 'public' | 'auth' | 'candidate' | 'hirer' | 'admin';
export interface ScreenContract { id: string; name: string; path: string; audience: Audience; blueprintPages: readonly number[] }
/** Locked numbering: 27 public + 8 authentication + 14 candidate + 16 hirer + 8 native admin. */
export const SCREENS: readonly ScreenContract[] = [
  { id: 'P00', name: 'JOBKIX Homepage', path: '', audience: 'public', blueprintPages: [6,8,25] },
  { id: 'P01', name: 'Global Job Search Pro Max', path: 'jobs', audience: 'public', blueprintPages: [8,16,17] },
  { id: 'P02', name: 'Job Detail Pro Max', path: 'jobs/:id', audience: 'public', blueprintPages: [9,12,13] },
  { id: 'P03', name: 'All Employment Sectors', path: 'sectors', audience: 'public', blueprintPages: [6,16,17] },
  { id: 'P04', name: 'Sector Detail World', path: 'sectors/:slug', audience: 'public', blueprintPages: [6,16,17] },
  { id: 'P05', name: 'All Professions', path: 'professions', audience: 'public', blueprintPages: [6,16,17] },
  { id: 'P06', name: 'Profession Detail World', path: 'professions/:slug', audience: 'public', blueprintPages: [6,16,17] },
  { id: 'P07', name: 'Global Countries Directory', path: 'countries', audience: 'public', blueprintPages: [6,16,17] },
  { id: 'P08', name: 'Country Careers World', path: 'countries/:country', audience: 'public', blueprintPages: [6,16,17] },
  { id: 'P09', name: 'City & Region Careers World', path: 'countries/:country/:city', audience: 'public', blueprintPages: [6,16,17] },
  { id: 'P10', name: 'Careers Abroad Pro', path: 'abroad', audience: 'public', blueprintPages: [6,16,17] },
  { id: 'P11', name: 'Employer Directory', path: 'employers', audience: 'public', blueprintPages: [6,21,23] },
  { id: 'P12', name: 'Employer Public Profile Pro', path: 'employers/:id', audience: 'public', blueprintPages: [6,21,23] },
  { id: 'P13', name: 'Salaries & Compensation', path: 'salaries', audience: 'public', blueprintPages: [6,23,24] },
  { id: 'P14', name: 'Workplace Reviews', path: 'reviews', audience: 'public', blueprintPages: [6,23,24] },
  { id: 'P15', name: 'Career Resources Library', path: 'resources', audience: 'public', blueprintPages: [6,23,25] },
  { id: 'P16', name: 'Career Guide Detail', path: 'resources/:slug', audience: 'public', blueprintPages: [6,23,25] },
  { id: 'P17', name: 'For Jobseekers', path: 'for-jobseekers', audience: 'public', blueprintPages: [10,11,12] },
  { id: 'P18', name: 'For Employers', path: 'for-employers', audience: 'public', blueprintPages: [14,15] },
  { id: 'P19', name: 'How JOBKIX Works', path: 'how-it-works', audience: 'public', blueprintPages: [4,12,14] },
  { id: 'P20', name: 'Trust & Safety Center', path: 'trust', audience: 'public', blueprintPages: [21,22,23,24] },
  { id: 'P21', name: 'Help & Support Center', path: 'help', audience: 'public', blueprintPages: [23,25,34] },
  { id: 'P22', name: 'Help Article Detail', path: 'help/:slug', audience: 'public', blueprintPages: [23,25,34] },
  { id: 'P23', name: 'Contact & Assistance', path: 'contact', audience: 'public', blueprintPages: [23,25,34] },
  { id: 'P24', name: 'About JOBKIX', path: 'about', audience: 'public', blueprintPages: [2,4,23] },
  { id: 'P25', name: 'Report a Problem', path: 'report', audience: 'public', blueprintPages: [21,23,34] },
  { id: 'P26', name: 'Legal & Policy Front', path: 'legal/:document?', audience: 'public', blueprintPages: [7,21,22,26] },
  { id: 'A01', name: 'Candidate Sign-up', path: 'candidate/sign-up', audience: 'auth', blueprintPages: [10,12] },
  { id: 'A02', name: 'Candidate Sign-in', path: 'candidate/sign-in', audience: 'auth', blueprintPages: [10,12] },
  { id: 'A03', name: 'Hirer Sign-up', path: 'hirer/sign-up', audience: 'auth', blueprintPages: [14,15] },
  { id: 'A04', name: 'Hirer Sign-in', path: 'hirer/sign-in', audience: 'auth', blueprintPages: [14,15] },
  { id: 'A05', name: 'Email Confirmation & Callback', path: 'auth/confirmation', audience: 'auth', blueprintPages: [10,34] },
  { id: 'A06', name: 'Recovery Request', path: 'auth/recovery', audience: 'auth', blueprintPages: [10,34] },
  { id: 'A07', name: 'Reset & Session Recovery', path: 'auth/reset', audience: 'auth', blueprintPages: [10,34] },
  { id: 'A08', name: 'Progressive Onboarding, Invitations & Context', path: 'onboarding', audience: 'auth', blueprintPages: [10,14,21] },
  { id: 'C01', name: 'Dashboard', path: 'career', audience: 'candidate', blueprintPages: [11] },
  { id: 'C02', name: 'Discovery', path: 'career/discovery', audience: 'candidate', blueprintPages: [8,11] },
  { id: 'C03', name: 'Saved Jobs & Collections', path: 'career/saved', audience: 'candidate', blueprintPages: [11] },
  { id: 'C04', name: 'Applications', path: 'career/applications', audience: 'candidate', blueprintPages: [11,12] },
  { id: 'C05', name: 'Application Detail & Timeline', path: 'career/applications/:id', audience: 'candidate', blueprintPages: [12,13] },
  { id: 'C06', name: 'Career Passport', path: 'career/passport', audience: 'candidate', blueprintPages: [11,21] },
  { id: 'C07', name: 'CV & Portfolio', path: 'career/cv', audience: 'candidate', blueprintPages: [11,12,21] },
  { id: 'C08', name: 'Interviews & Calendar', path: 'career/interviews', audience: 'candidate', blueprintPages: [12,13] },
  { id: 'C09', name: 'Inbox', path: 'career/inbox', audience: 'candidate', blueprintPages: [11,25] },
  { id: 'C10', name: 'Alerts & Saved Searches', path: 'career/alerts', audience: 'candidate', blueprintPages: [11,25] },
  { id: 'C11', name: 'Visibility & Privacy', path: 'career/privacy', audience: 'candidate', blueprintPages: [21,22] },
  { id: 'C12', name: 'Career Insights', path: 'career/insights', audience: 'candidate', blueprintPages: [11] },
  { id: 'C13', name: 'Account & Security', path: 'career/settings', audience: 'candidate', blueprintPages: [11,21,22] },
  { id: 'C14', name: 'Help & Support', path: 'career/help', audience: 'candidate', blueprintPages: [11,23] },
  { id: 'H01', name: 'Dashboard', path: 'hiring', audience: 'hirer', blueprintPages: [15] },
  { id: 'H02', name: 'Vacancies', path: 'hiring/vacancies', audience: 'hirer', blueprintPages: [15,20] },
  { id: 'H03', name: 'Create / Publish Vacancy', path: 'hiring/vacancies/new', audience: 'hirer', blueprintPages: [14,15,20] },
  { id: 'H04', name: 'Vacancy Management', path: 'hiring/vacancies/:id', audience: 'hirer', blueprintPages: [15,20] },
  { id: 'H05', name: 'Applications Inbox', path: 'hiring/applications', audience: 'hirer', blueprintPages: [15,21] },
  { id: 'H06', name: 'Pipeline & Comparison', path: 'hiring/pipeline', audience: 'hirer', blueprintPages: [15,20,34] },
  { id: 'H07', name: 'Opt-in Talent Search', path: 'hiring/talent', audience: 'hirer', blueprintPages: [15,21] },
  { id: 'H08', name: 'Talent Pools', path: 'hiring/pools', audience: 'hirer', blueprintPages: [15,21] },
  { id: 'H09', name: 'Interviews & Evaluations', path: 'hiring/interviews', audience: 'hirer', blueprintPages: [12,15,21] },
  { id: 'H10', name: 'Offers & Hiring Decisions', path: 'hiring/offers', audience: 'hirer', blueprintPages: [13,15,20] },
  { id: 'H11', name: 'Messaging', path: 'hiring/inbox', audience: 'hirer', blueprintPages: [15,25] },
  { id: 'H12', name: 'Team & Permissions', path: 'hiring/team', audience: 'hirer', blueprintPages: [14,15,21] },
  { id: 'H13', name: 'Organization & Branches', path: 'hiring/organization', audience: 'hirer', blueprintPages: [14,15,21] },
  { id: 'H14', name: 'Verification', path: 'hiring/verification', audience: 'hirer', blueprintPages: [14,23,24] },
  { id: 'H15', name: 'Analytics', path: 'hiring/analytics', audience: 'hirer', blueprintPages: [15,27,32] },
  { id: 'H16', name: 'Settings & Security', path: 'hiring/settings', audience: 'hirer', blueprintPages: [15,21,22] },
  ...['Employer Verification','Vacancy Moderation','Reports & Appeals','Reviews & Salary Moderation','Taxonomy','Content & Editorial','Health & Incidents','Audit & Governance'].map((name, i) => ({ id: `D${String(i + 1).padStart(2, '0')}`, name, path: ['verification','vacancies','cases','reputation','taxonomy','editorial','health','audit'][i], audience: 'admin' as const, blueprintPages: [23,24,25] })),
];
export function href(locale: Locale, path = '', params?: URLSearchParams): string {
  const base = `/jobkix/${locale}${path ? '/' + path : ''}`;
  return base + (params?.size ? '?' + params.toString() : '');
}
export function safeReturnTo(input: unknown, locale: Locale, fallback = 'career'): string {
  if (typeof input !== 'string' || input.length > 2048 || /[\\\u0000-\u0020]/.test(input)) return href(locale, fallback);
  try {
    const parsed = new URL(input, 'https://jobkix.invalid');
    if (parsed.origin !== 'https://jobkix.invalid' || !parsed.pathname.startsWith(`/jobkix/${locale}/`)) return href(locale, fallback);
    // Reject encoded path separators and browser-normalized alternate authorities.
    if (/%(?:2f|5c|00|0a|0d)/i.test(parsed.pathname) || input.startsWith('//')) return href(locale, fallback);
    return parsed.pathname + parsed.search + parsed.hash;
  } catch { return href(locale, fallback); }
}
export function switchLocale(input: string, locale: Locale): string {
  const parsed = new URL(input, 'https://jobkix.invalid');
  const pieces = parsed.pathname.split('/');
  if (pieces[1] !== 'jobkix' || !isLocale(pieces[2])) return href(locale);
  pieces[2] = locale;
  for (const key of ['next','returnTo']) {
    const value = parsed.searchParams.get(key);
    if (value?.startsWith('/jobkix/')) {
      const nested = new URL(value, 'https://jobkix.invalid');
      const path = nested.pathname.split('/');
      if (nested.origin === 'https://jobkix.invalid' && isLocale(path[2])) {
        path[2] = locale;
        parsed.searchParams.set(key, path.join('/') + nested.search + nested.hash);
      }
    }
  }
  return pieces.join('/') + parsed.search + parsed.hash;
}
export function resolveScreen(segments: readonly string[]): { screen: ScreenContract; params: Record<string, string> } | null {
  // Literal routes win over parameter routes (e.g. vacancies/new).
  const sorted = [...SCREENS].filter(s => s.audience !== 'admin').sort((a,b) => a.path.split(':').length - b.path.split(':').length);
  for (const screen of sorted) {
    const parts = screen.path ? screen.path.split('/') : [];
    const minimum = parts.filter(p => !p.endsWith('?')).length;
    if (segments.length < minimum || segments.length > parts.length) continue;
    const params: Record<string, string> = {};
    let match = true;
    for (let i = 0; i < parts.length; i++) {
      const expected = parts[i], actual = segments[i];
      if (expected.startsWith(':')) {
        if (actual) params[expected.slice(1).replace(/\?$/, '')] = actual;
        else if (!expected.endsWith('?')) match = false;
      } else if (expected !== actual) match = false;
    }
    if (match) return { screen, params };
  }
  return null;
}
