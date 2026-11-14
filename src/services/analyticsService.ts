import { PortfolioProject } from '../data/portfolioData';

export type VisitorType =
  | 'General Visitor'
  | 'Client Hiring Designer'
  | 'Brand / Business Owner'
  | 'Author / Publisher'
  | 'Event Organizer'
  | 'Creative Peer';

export type DeviceType = 'Mobile' | 'Tablet' | 'Desktop';

export type SourceChannel =
  | 'Telegram'
  | 'TikTok'
  | 'Instagram / Social'
  | 'Search'
  | 'Direct Link';

export type InterestArea =
  | 'All Works'
  | 'Book Covers'
  | 'Posters'
  | 'Logos & Identity'
  | 'Print & Merch'
  | 'Contact & Callback';

export const VISITOR_TYPES: VisitorType[] = [
  'Client Hiring Designer',
  'Brand / Business Owner',
  'Author / Publisher',
  'Event Organizer',
  'Creative Peer',
  'General Visitor',
];

export interface VisitRecordItem {
  id: string;
  visitorType: VisitorType;
  deviceType: DeviceType;
  sourceChannel: SourceChannel;
  interestArea: InterestArea;
  dateKey: string;
  isUniqueSession: boolean;
  createdAt: string;
}

export interface DailyStatItem {
  dateKey: string;
  views: number;
  uniqueVisitors: number;
}

export interface LeadRecordItem {
  id: string;
  phone: string;
  name: string;
  note: string;
  visitorType: VisitorType;
  sourceUrl: string;
  createdAt: string;
}

export interface AnalyticsSnapshot {
  totalViews: number;
  totalUniqueVisitors: number;
  todayViews: number;
  todayUniqueVisitors: number;
  dailyStats: DailyStatItem[];
  recentVisits: VisitRecordItem[];
  visitorTypeCounts: Record<string, number>;
  deviceCounts: Record<string, number>;
  sourceCounts: Record<string, number>;
  interestCounts: Record<string, number>;
}

export interface MongoStatus {
  configured: boolean;
  connected: boolean;
  database: string;
  error?: string;
}

const SESSION_VISIT_ID_KEY = 'biniyam_active_visit_id_v1';
const LAST_UNIQUE_DATE_KEY = 'biniyam_last_unique_date_v1';
const VISITOR_TYPE_KEY = 'biniyam_visitor_type_v1';

let activeVisitIdMemory: string | null = null;

export function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateDocId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

function detectDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'Desktop';
  const ua = navigator.userAgent.toLowerCase();
  const width = window.innerWidth;
  if (
    /ipad|tablet|playbook|silk/.test(ua) ||
    (width >= 640 && width < 1024 && 'ontouchstart' in window)
  ) {
    return 'Tablet';
  }
  if (
    /mobi|android|iphone|ipod|blackberry|iemobile|opera mini/.test(ua) ||
    width < 640
  ) {
    return 'Mobile';
  }
  return 'Desktop';
}

function detectSourceChannel(): SourceChannel {
  if (typeof window === 'undefined') return 'Direct Link';
  const params = new URLSearchParams(window.location.search);
  const utm = (
    params.get('source') ||
    params.get('utm_source') ||
    params.get('ref') ||
    ''
  ).toLowerCase();
  const ref = (document.referrer || '').toLowerCase();
  const ua = navigator.userAgent.toLowerCase();

  if (
    utm.includes('telegram') ||
    ref.includes('t.me') ||
    ref.includes('telegram') ||
    ua.includes('telegram')
  ) {
    return 'Telegram';
  }
  if (
    utm.includes('tiktok') ||
    ref.includes('tiktok') ||
    ua.includes('tiktok')
  ) {
    return 'TikTok';
  }
  if (
    utm.includes('instagram') ||
    utm.includes('facebook') ||
    utm.includes('whatsapp') ||
    ref.includes('instagram') ||
    ref.includes('facebook') ||
    ref.includes('l.instagram')
  ) {
    return 'Instagram / Social';
  }
  if (
    ref.includes('google.') ||
    ref.includes('bing.') ||
    ref.includes('duckduckgo')
  ) {
    return 'Search';
  }
  return 'Direct Link';
}

export function getSavedVisitorType(): VisitorType {
  try {
    const saved = window.localStorage.getItem(
      VISITOR_TYPE_KEY
    ) as VisitorType | null;
    if (saved && VISITOR_TYPES.includes(saved)) return saved;
  } catch {
    // Ignore storage read errors
  }
  return 'General Visitor';
}

const OWNER_KEY_STORAGE = 'biniyam_admin_key_v1';

export function getSavedOwnerKey(): string | null {
  try {
    return window.sessionStorage.getItem(OWNER_KEY_STORAGE);
  } catch {
    return null;
  }
}

export function clearSavedOwnerKey(): void {
  try {
    window.sessionStorage.removeItem(OWNER_KEY_STORAGE);
  } catch {
    // Ignore storage error
  }
}

export async function verifyOwnerPasscode(ownerKey: string): Promise<string> {
  const cleaned = ownerKey.trim();
  const resp = await fetch('/api/owner/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerKey: cleaned }),
  });
  if (!resp.ok) {
    throw new Error('Incorrect admin password.');
  }
  try {
    window.sessionStorage.setItem(OWNER_KEY_STORAGE, cleaned);
  } catch {
    // Ignore storage error
  }
  return cleaned;
}

function getAdminHeaders(): Record<string, string> {
  const ownerKey = getSavedOwnerKey();
  if (!ownerKey) {
    throw new Error('Owner verification required.');
  }
  return {
    'Content-Type': 'application/json',
    'x-owner-key': ownerKey,
  };
}

export async function recordPageVisit(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    const existingSessionVisit =
      window.sessionStorage.getItem(SESSION_VISIT_ID_KEY);
    if (existingSessionVisit) {
      activeVisitIdMemory = existingSessionVisit;
      return existingSessionVisit;
    }
  } catch {
    // Continue if sessionStorage is unavailable
  }

  const visitId = generateDocId('visit');
  activeVisitIdMemory = visitId;

  const dateKey = getTodayDateKey();
  const deviceType = detectDeviceType();
  const sourceChannel = detectSourceChannel();
  const visitorType = getSavedVisitorType();

  let isUniqueSession = true;
  try {
    const lastDate = window.localStorage.getItem(LAST_UNIQUE_DATE_KEY);
    isUniqueSession = lastDate !== dateKey;
    window.localStorage.setItem(LAST_UNIQUE_DATE_KEY, dateKey);
    window.sessionStorage.setItem(SESSION_VISIT_ID_KEY, visitId);
  } catch {
    // Ignore storage quota issues
  }

  try {
    await fetch('/api/analytics/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitId,
        visitorType,
        deviceType,
        sourceChannel,
        interestArea: 'All Works',
        dateKey,
        isUniqueSession,
      }),
    });
  } catch (error) {
    console.warn('Visit telemetry write skipped:', error);
  }

  return visitId;
}

export async function updateVisitProfile(updates: {
  visitorType?: VisitorType;
  interestArea?: InterestArea;
}): Promise<void> {
  if (updates.visitorType) {
    try {
      window.localStorage.setItem(VISITOR_TYPE_KEY, updates.visitorType);
    } catch {
      // Ignore storage error
    }
  }

  let visitId = activeVisitIdMemory;
  if (!visitId) {
    try {
      visitId = window.sessionStorage.getItem(SESSION_VISIT_ID_KEY);
    } catch {
      visitId = null;
    }
  }
  if (!visitId) return;

  try {
    await fetch(`/api/analytics/visit/${encodeURIComponent(visitId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  } catch (error) {
    console.warn('Visit profile update skipped:', error);
  }
}

export async function submitLeadToDatabase(input: {
  phone: string;
  name: string;
  note: string;
  visitorType: VisitorType;
  sourceUrl: string;
}): Promise<string> {
  const resp = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = (await resp.json()) as { id?: string; error?: string };
  if (!resp.ok || !data.id) {
    throw new Error(data.error || 'Unable to save phone number.');
  }
  return data.id;
}

export async function fetchMongoStatus(): Promise<MongoStatus> {
  try {
    const resp = await fetch('/api/mongodb/status');
    return (await resp.json()) as MongoStatus;
  } catch {
    return {
      configured: false,
      connected: false,
      database: 'biniyam_portfolio',
      error: 'Unable to reach server.',
    };
  }
}

export async function fetchAdminAnalytics(): Promise<AnalyticsSnapshot> {
  const headers = getAdminHeaders();
  const resp = await fetch('/api/analytics/summary', { headers });
  const data = (await resp.json()) as AnalyticsSnapshot & { error?: string };
  if (!resp.ok) {
    throw new Error(data.error || 'Unable to load MongoDB analytics.');
  }
  return data;
}

export async function fetchAdminLeads(): Promise<LeadRecordItem[]> {
  const headers = getAdminHeaders();
  const resp = await fetch('/api/leads', { headers });
  const data = (await resp.json()) as {
    leads?: LeadRecordItem[];
    error?: string;
  };
  if (!resp.ok) {
    throw new Error(data.error || 'Unable to load callback leads.');
  }
  return data.leads ?? [];
}

export async function saveCloudinaryPortfolioItem(input: {
  title: string;
  subtitle: string;
  category: PortfolioProject['category'];
  categoryLabel: string;
  year: string;
  medium: string;
  description: string;
  image: string;
  thumbnail: string;
  cloudinaryPublicId: string;
}): Promise<PortfolioProject> {
  const headers = getAdminHeaders();
  const resp = await fetch('/api/portfolio-items', {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
  const data = (await resp.json()) as {
    item?: PortfolioProject;
    error?: string;
  };
  if (!resp.ok || !data.item) {
    throw new Error(data.error || 'Unable to save portfolio item to MongoDB.');
  }
  return data.item;
}

export async function fetchDynamicPortfolioItems(): Promise<PortfolioProject[]> {
  try {
    const resp = await fetch('/api/portfolio-items');
    if (!resp.ok) return [];
    const data = (await resp.json()) as { items?: PortfolioProject[] };
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}
