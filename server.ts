import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import http from 'http';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';

interface VisitorLead {
  id: string;
  phone: string;
  name: string;
  note: string;
  visitorType: string;
  sourceUrl: string;
  createdAt: string;
}

interface VisitRecord {
  id: string;
  visitorType: string;
  deviceType: string;
  sourceChannel: string;
  interestArea: string;
  dateKey: string;
  isUniqueSession: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PortfolioItemPublic {
  id: string;
  title: string;
  subtitle: string;
  category: 'book-covers' | 'posters' | 'branding' | 'print-merch';
  categoryLabel: string;
  year: string;
  medium: string;
  description: string;
  image: string;
  thumbnail: string;
  cloudinaryPublicId: string;
  createdAt?: string;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const SQLITE_DB_PATH = path.resolve(
  process.cwd(),
  (process.env.SQLITE_DB_PATH ?? '').trim() || '.data/portfolio.db'
);
const LEGACY_LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const LEGACY_PORTFOLIO_ITEMS_FILE = path.join(DATA_DIR, 'portfolio-items.json');

const CLOUD_PREFIX_ITEMS = 'biniyam-portfolio-db/items';
const CLOUD_PREFIX_LEADS = 'biniyam-portfolio-db/leads';
const CLOUD_PREFIX_VISITS = 'biniyam-portfolio-db/visits';

const ALLOWED_VISITOR_TYPES = new Set([
  'General Visitor',
  'Client Hiring Designer',
  'Brand / Business Owner',
  'Author / Publisher',
  'Event Organizer',
  'Creative Peer',
]);

const ALLOWED_DEVICE_TYPES = new Set(['Mobile', 'Tablet', 'Desktop']);
const ALLOWED_SOURCES = new Set([
  'Telegram',
  'TikTok',
  'Instagram / Social',
  'Search',
  'Direct Link',
]);
const ALLOWED_INTERESTS = new Set([
  'All Works',
  'Book Covers',
  'Posters',
  'Logos & Identity',
  'Print & Merch',
  'Contact & Callback',
]);
const ALLOWED_CATEGORIES = new Set([
  'book-covers',
  'posters',
  'branding',
  'print-merch',
]);

// --- Built-in SQLite Local Mirror (Node 22 node:sqlite) ---
let sqliteDb: DatabaseSync | null = null;

function getSqliteDb(): DatabaseSync {
  if (sqliteDb) return sqliteDb;

  const dbDir = path.dirname(SQLITE_DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new DatabaseSync(SQLITE_DB_PATH);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY,
      visitor_type TEXT NOT NULL,
      device_type TEXT NOT NULL,
      source_channel TEXT NOT NULL,
      interest_area TEXT NOT NULL,
      date_key TEXT NOT NULL,
      is_unique_session INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_visits_created_at ON visits(created_at DESC);

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL,
      name TEXT NOT NULL,
      note TEXT NOT NULL,
      visitor_type TEXT NOT NULL,
      source_url TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

    CREATE TABLE IF NOT EXISTS portfolio_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      category TEXT NOT NULL,
      category_label TEXT NOT NULL,
      year TEXT NOT NULL,
      medium TEXT NOT NULL,
      description TEXT NOT NULL,
      image TEXT NOT NULL,
      thumbnail TEXT NOT NULL,
      cloudinary_public_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_portfolio_items_created_at ON portfolio_items(created_at DESC);
  `);

  migrateLegacyJsonFiles(db);
  sqliteDb = db;
  return db;
}

function migrateLegacyJsonFiles(db: DatabaseSync): void {
  try {
    if (fs.existsSync(LEGACY_LEADS_FILE)) {
      const raw = fs.readFileSync(LEGACY_LEADS_FILE, 'utf-8');
      const items = JSON.parse(raw) as VisitorLead[];
      if (Array.isArray(items)) {
        const stmt = db.prepare(`
          INSERT OR IGNORE INTO leads (id, phone, name, note, visitor_type, source_url, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        for (const lead of items) {
          if (lead?.id && lead?.phone) {
            stmt.run(
              lead.id,
              lead.phone,
              lead.name || 'Portfolio Visitor',
              lead.note || '',
              lead.visitorType || 'General Visitor',
              lead.sourceUrl || '',
              lead.createdAt || new Date().toISOString()
            );
          }
        }
      }
    }
  } catch {
    // Ignore malformed legacy leads file
  }

  try {
    if (fs.existsSync(LEGACY_PORTFOLIO_ITEMS_FILE)) {
      const raw = fs.readFileSync(LEGACY_PORTFOLIO_ITEMS_FILE, 'utf-8');
      const items = JSON.parse(raw) as PortfolioItemPublic[];
      if (Array.isArray(items)) {
        const stmt = db.prepare(`
          INSERT OR IGNORE INTO portfolio_items (
            id, title, subtitle, category, category_label, year, medium, description, image, thumbnail, cloudinary_public_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const item of items) {
          if (item?.id && item?.title && item?.image) {
            stmt.run(
              item.id,
              item.title,
              item.subtitle || '',
              item.category || 'branding',
              item.categoryLabel || 'Design',
              item.year || '2026',
              item.medium || 'Digital Graphic Design',
              item.description || '',
              item.image,
              item.thumbnail || item.image,
              item.cloudinaryPublicId || '',
              item.createdAt || new Date().toISOString()
            );
          }
        }
      }
    }
  } catch {
    // Ignore malformed legacy portfolio items file
  }
}

function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCloudinaryConfig() {
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME ?? '').trim();
  const apiKey = (process.env.CLOUDINARY_API_KEY ?? '').trim();
  const apiSecret = (process.env.CLOUDINARY_API_SECRET ?? '').trim();
  const configured = Boolean(
    cloudName &&
      apiKey &&
      apiSecret &&
      !cloudName.startsWith('MY_') &&
      !apiKey.startsWith('MY_') &&
      !apiSecret.startsWith('MY_')
  );
  return { configured, cloudName, apiKey, apiSecret };
}

function signCloudinaryParams(
  params: Record<string, string | number>,
  apiSecret: string
): string {
  const toSign =
    Object.keys(params)
      .sort()
      .filter((k) => params[k] !== undefined && params[k] !== '')
      .map((k) => `${k}=${params[k]}`)
      .join('&') + apiSecret;
  return crypto.createHash('sha1').update(toSign).digest('hex');
}

function getCloudinaryBasicAuth(apiKey: string, apiSecret: string): string {
  return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`;
}

// --- Cloudinary Cloud Document Helpers (Persistent across all Cloud Run instances) ---
interface CloudinarySearchResource {
  public_id: string;
  secure_url?: string;
  created_at?: string;
  context?: {
    payload?: string;
    custom?: { payload?: string };
  };
}

interface CloudinarySearchResponse {
  total_count?: number;
  resources?: CloudinarySearchResource[];
  error?: { message?: string };
}

async function saveCloudDoc<T extends object>(
  publicId: string,
  data: T
): Promise<boolean> {
  const cfg = getCloudinaryConfig();
  if (!cfg.configured) return false;

  const jsonStr = JSON.stringify(data);
  const payloadB64 = Buffer.from(jsonStr, 'utf8').toString('base64url');
  const context = `payload=${payloadB64}`;
  const timestamp = Math.floor(Date.now() / 1000);

  const paramsToSign: Record<string, string | number> = {
    context,
    invalidate: 'true',
    overwrite: 'true',
    public_id: publicId,
    timestamp,
  };

  const form = new FormData();
  form.append(
    'file',
    `data:application/json;base64,${Buffer.from(jsonStr, 'utf8').toString('base64')}`
  );
  form.append('public_id', publicId);
  form.append('context', context);
  form.append('overwrite', 'true');
  form.append('invalidate', 'true');
  form.append('timestamp', String(timestamp));
  form.append('api_key', cfg.apiKey);
  form.append('signature', signCloudinaryParams(paramsToSign, cfg.apiSecret));

  const resp = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cfg.cloudName)}/raw/upload`,
    { method: 'POST', body: form }
  );
  return resp.ok;
}

async function deleteCloudDoc(
  publicId: string,
  resourceType: 'raw' | 'image' = 'raw'
): Promise<boolean> {
  const cfg = getCloudinaryConfig();
  if (!cfg.configured || !publicId) return false;

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = { invalidate: 'true', public_id: publicId, timestamp };
  const form = new FormData();
  form.append('public_id', publicId);
  form.append('invalidate', 'true');
  form.append('timestamp', String(timestamp));
  form.append('api_key', cfg.apiKey);
  form.append('signature', signCloudinaryParams(paramsToSign, cfg.apiSecret));

  const resp = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cfg.cloudName)}/${resourceType}/destroy`,
    { method: 'POST', body: form }
  );
  return resp.ok;
}

async function decodeCloudResource<T>(
  resource: CloudinarySearchResource
): Promise<T | null> {
  const rawB64 =
    resource.context?.payload ?? resource.context?.custom?.payload ?? '';
  if (rawB64) {
    try {
      return JSON.parse(
        Buffer.from(rawB64, 'base64url').toString('utf8')
      ) as T;
    } catch {
      // Fallback to fetching raw JSON URL below
    }
  }
  if (resource.secure_url) {
    try {
      const r = await fetch(resource.secure_url);
      if (r.ok) {
        return (await r.json()) as T;
      }
    } catch {
      // Ignore fallback fetch errors
    }
  }
  return null;
}

async function searchCloudDocs<T>(
  prefix: string,
  maxResults = 100
): Promise<{ totalCount: number; docs: T[] } | null> {
  const cfg = getCloudinaryConfig();
  if (!cfg.configured) return null;

  const resp = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cfg.cloudName)}/resources/search`,
    {
      method: 'POST',
      headers: {
        Authorization: getCloudinaryBasicAuth(cfg.apiKey, cfg.apiSecret),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expression: `resource_type:raw AND public_id:${prefix}/*`,
        with_field: ['context'],
        sort_by: [{ created_at: 'desc' }],
        max_results: maxResults,
      }),
    }
  );

  if (!resp.ok) {
    return null;
  }

  const data = (await resp.json()) as CloudinarySearchResponse;
  const resources = Array.isArray(data.resources) ? data.resources : [];
  const docs: T[] = [];
  for (const res of resources) {
    const item = await decodeCloudResource<T>(res);
    if (item !== null) {
      docs.push(item);
    }
  }

  return {
    totalCount: Number(data.total_count ?? resources.length),
    docs,
  };
}

// --- Smart Caches & Recent-Mutation Overlays (eliminates Search indexing lag) ---
const OVERLAY_TTL_MS = 25_000;
const ITEMS_CACHE_TTL_MS = 20_000;
const LEADS_CACHE_TTL_MS = 10_000;
const VISITS_CACHE_TTL_MS = 15_000;
const STATUS_CACHE_TTL_MS = 60_000;

let lastItemsSyncAt = 0;
let inFlightItemsSync: Promise<PortfolioItemPublic[]> | null = null;
const recentCreatedItems = new Map<
  string,
  { item: PortfolioItemPublic; expiresAt: number }
>();
const recentDeletedItemIds = new Map<string, number>();

let lastLeadsSyncAt = 0;
let inFlightLeadsSync: Promise<VisitorLead[]> | null = null;
const recentCreatedLeads = new Map<
  string,
  { lead: VisitorLead; expiresAt: number }
>();

let lastVisitsSyncAt = 0;
let cloudVisitsTotalCount = 0;
let inFlightVisitsSync: Promise<void> | null = null;
const recentUpsertedVisits = new Map<
  string,
  { visit: VisitRecord; expiresAt: number }
>();

let lastCloudStatusCheckAt = 0;
let lastCloudStatusOk = false;
let lastCloudStatusError: string | undefined;

function pruneExpiredMaps() {
  const now = Date.now();
  for (const [k, v] of recentCreatedItems) {
    if (v.expiresAt <= now) recentCreatedItems.delete(k);
  }
  for (const [k, exp] of recentDeletedItemIds) {
    if (exp <= now) recentDeletedItemIds.delete(k);
  }
  for (const [k, v] of recentCreatedLeads) {
    if (v.expiresAt <= now) recentCreatedLeads.delete(k);
  }
  for (const [k, v] of recentUpsertedVisits) {
    if (v.expiresAt <= now) recentUpsertedVisits.delete(k);
  }
}

function readLocalPortfolioItems(): PortfolioItemPublic[] {
  const db = getSqliteDb();
  const rows = db
    .prepare(`
      SELECT id, title, subtitle, category, category_label, year, medium, description, image, thumbnail, cloudinary_public_id, created_at
      FROM portfolio_items
      ORDER BY created_at DESC
      LIMIT 50
    `)
    .all() as Array<{
    id: string;
    title: string;
    subtitle: string;
    category: PortfolioItemPublic['category'];
    category_label: string;
    year: string;
    medium: string;
    description: string;
    image: string;
    thumbnail: string;
    cloudinary_public_id: string;
    created_at: string;
  }>;

  return rows.map((d) => ({
    id: d.id,
    title: d.title,
    subtitle: d.subtitle,
    category: d.category,
    categoryLabel: d.category_label,
    year: d.year,
    medium: d.medium,
    description: d.description,
    image: d.image,
    thumbnail: d.thumbnail || d.image,
    cloudinaryPublicId: d.cloudinary_public_id,
    createdAt: d.created_at,
  }));
}

async function getPortfolioItemsSynced(
  forceRefresh = false
): Promise<PortfolioItemPublic[]> {
  pruneExpiredMaps();
  const cfg = getCloudinaryConfig();
  if (!cfg.configured) {
    return readLocalPortfolioItems();
  }

  const now = Date.now();
  if (!forceRefresh && now - lastItemsSyncAt < ITEMS_CACHE_TTL_MS) {
    return readLocalPortfolioItems();
  }

  if (inFlightItemsSync) {
    return inFlightItemsSync;
  }

  inFlightItemsSync = (async () => {
    try {
      const result = await searchCloudDocs<PortfolioItemPublic>(
        CLOUD_PREFIX_ITEMS,
        100
      );
      if (result) {
        const db = getSqliteDb();
        const mergedMap = new Map<string, PortfolioItemPublic>();

        for (const doc of result.docs) {
          if (doc?.id && !recentDeletedItemIds.has(doc.id)) {
            mergedMap.set(doc.id, doc);
          }
        }
        for (const [id, entry] of recentCreatedItems) {
          if (!recentDeletedItemIds.has(id)) {
            mergedMap.set(id, entry.item);
          }
        }

        const merged = Array.from(mergedMap.values()).sort((a, b) =>
          (b.createdAt || '').localeCompare(a.createdAt || '')
        );

        db.exec('DELETE FROM portfolio_items');
        const insertStmt = db.prepare(`
          INSERT OR REPLACE INTO portfolio_items (
            id, title, subtitle, category, category_label, year, medium, description, image, thumbnail, cloudinary_public_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const item of merged) {
          insertStmt.run(
            item.id,
            item.title,
            item.subtitle,
            item.category,
            item.categoryLabel,
            item.year,
            item.medium,
            item.description,
            item.image,
            item.thumbnail || item.image,
            item.cloudinaryPublicId || '',
            item.createdAt || new Date().toISOString()
          );
        }

        lastItemsSyncAt = Date.now();
        return merged;
      }
    } catch {
      // Fallback to SQLite local mirror on transient network failure
    } finally {
      inFlightItemsSync = null;
    }
    return readLocalPortfolioItems();
  })();

  return inFlightItemsSync;
}

function readLocalLeads(): VisitorLead[] {
  const db = getSqliteDb();
  const rows = db
    .prepare(`
      SELECT id, phone, name, note, visitor_type, source_url, created_at
      FROM leads
      ORDER BY created_at DESC
      LIMIT 100
    `)
    .all() as Array<{
    id: string;
    phone: string;
    name: string;
    note: string;
    visitor_type: string;
    source_url: string;
    created_at: string;
  }>;

  return rows.map((d) => ({
    id: d.id,
    phone: d.phone,
    name: d.name,
    note: d.note,
    visitorType: d.visitor_type || 'General Visitor',
    sourceUrl: d.source_url || '',
    createdAt: d.created_at || new Date().toISOString(),
  }));
}

async function getLeadsSynced(forceRefresh = false): Promise<VisitorLead[]> {
  pruneExpiredMaps();
  const cfg = getCloudinaryConfig();
  if (!cfg.configured) {
    return readLocalLeads();
  }

  const now = Date.now();
  if (!forceRefresh && now - lastLeadsSyncAt < LEADS_CACHE_TTL_MS) {
    return readLocalLeads();
  }

  if (inFlightLeadsSync) {
    return inFlightLeadsSync;
  }

  inFlightLeadsSync = (async () => {
    try {
      const result = await searchCloudDocs<VisitorLead>(CLOUD_PREFIX_LEADS, 100);
      if (result) {
        const db = getSqliteDb();
        const mergedMap = new Map<string, VisitorLead>();

        for (const doc of result.docs) {
          if (doc?.id) mergedMap.set(doc.id, doc);
        }
        for (const [id, entry] of recentCreatedLeads) {
          mergedMap.set(id, entry.lead);
        }

        const merged = Array.from(mergedMap.values()).sort((a, b) =>
          (b.createdAt || '').localeCompare(a.createdAt || '')
        );

        const upsertStmt = db.prepare(`
          INSERT OR REPLACE INTO leads (
            id, phone, name, note, visitor_type, source_url, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        for (const lead of merged) {
          upsertStmt.run(
            lead.id,
            lead.phone,
            lead.name || 'Portfolio Visitor',
            lead.note || '',
            lead.visitorType || 'General Visitor',
            lead.sourceUrl || '',
            lead.createdAt || new Date().toISOString()
          );
        }

        lastLeadsSyncAt = Date.now();
        return merged;
      }
    } catch {
      // Fallback to SQLite local mirror
    } finally {
      inFlightLeadsSync = null;
    }
    return readLocalLeads();
  })();

  return inFlightLeadsSync;
}

async function syncVisitsFromCloud(): Promise<void> {
  pruneExpiredMaps();
  const cfg = getCloudinaryConfig();
  if (!cfg.configured) return;

  const now = Date.now();
  if (now - lastVisitsSyncAt < VISITS_CACHE_TTL_MS) {
    return;
  }

  if (inFlightVisitsSync) {
    return inFlightVisitsSync;
  }

  inFlightVisitsSync = (async () => {
    try {
      const result = await searchCloudDocs<VisitRecord>(
        CLOUD_PREFIX_VISITS,
        500
      );
      if (result) {
        cloudVisitsTotalCount = result.totalCount;
        const db = getSqliteDb();
        const upsertStmt = db.prepare(`
          INSERT OR REPLACE INTO visits (
            id, visitor_type, device_type, source_channel, interest_area, date_key, is_unique_session, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const v of result.docs) {
          if (!v?.id) continue;
          const overlay = recentUpsertedVisits.get(v.id)?.visit;
          const chosen = overlay ?? v;
          upsertStmt.run(
            chosen.id,
            chosen.visitorType || 'General Visitor',
            chosen.deviceType || 'Desktop',
            chosen.sourceChannel || 'Direct Link',
            chosen.interestArea || 'All Works',
            chosen.dateKey || getTodayDateKey(),
            chosen.isUniqueSession ? 1 : 0,
            chosen.createdAt || new Date().toISOString(),
            chosen.updatedAt || chosen.createdAt || new Date().toISOString()
          );
        }

        for (const entry of recentUpsertedVisits.values()) {
          const v = entry.visit;
          upsertStmt.run(
            v.id,
            v.visitorType || 'General Visitor',
            v.deviceType || 'Desktop',
            v.sourceChannel || 'Direct Link',
            v.interestArea || 'All Works',
            v.dateKey || getTodayDateKey(),
            v.isUniqueSession ? 1 : 0,
            v.createdAt || new Date().toISOString(),
            v.updatedAt || new Date().toISOString()
          );
        }

        lastVisitsSyncAt = Date.now();
      }
    } catch {
      // Fallback gracefully to local SQLite
    } finally {
      inFlightVisitsSync = null;
    }
  })();

  return inFlightVisitsSync;
}

const portfolioStreamClients = new Set<express.Response>();

function broadcastPortfolioUpdated() {
  const payload = `event: portfolio-updated\ndata: ${JSON.stringify({
    updatedAt: Date.now(),
  })}\n\n`;
  for (const client of portfolioStreamClients) {
    try {
      client.write(payload);
    } catch {
      portfolioStreamClients.delete(client);
    }
  }
}

function isValidOwnerKey(key: string): boolean {
  const customKey = (process.env.OWNER_ACCESS_KEY ?? '').trim();
  const expected = customKey || '76201212';
  return key.trim() === expected;
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = 3000;
  const hmrDisabled = process.env.DISABLE_HMR === 'true';

  // Initialize SQLite mirror and pre-warm portfolio items from Cloudinary Cloud
  getSqliteDb();
  void getPortfolioItemsSynced(true);

  app.use(express.json({ limit: '15mb' }));

  // --- Owner Passcode Verification (Untouched) ---
  app.post('/api/owner/verify', (req, res) => {
    const key = String(req.body?.ownerKey ?? '');
    if (!isValidOwnerKey(key)) {
      res.status(401).json({ error: 'Invalid owner passcode.' });
      return;
    }
    res.json({ ok: true });
  });

  // --- Cloud + SQLite Database Status ---
  const handleDatabaseStatus = async (
    _req: express.Request,
    res: express.Response
  ) => {
    try {
      const db = getSqliteDb();
      db.prepare('SELECT 1 AS ok').get();

      const cfg = getCloudinaryConfig();
      if (!cfg.configured) {
        res.json({
          configured: true,
          connected: true,
          engine: 'SQLite (Local)',
          database: path.basename(SQLITE_DB_PATH),
        });
        return;
      }

      const now = Date.now();
      if (now - lastCloudStatusCheckAt >= STATUS_CACHE_TTL_MS) {
        try {
          const pingResp = await fetch(
            `https://api.cloudinary.com/v1_1/${encodeURIComponent(cfg.cloudName)}/usage`,
            {
              headers: {
                Authorization: getCloudinaryBasicAuth(cfg.apiKey, cfg.apiSecret),
              },
            }
          );
          lastCloudStatusOk = pingResp.ok;
          lastCloudStatusError = pingResp.ok
            ? undefined
            : `Cloudinary Cloud responded with ${pingResp.status}`;
          lastCloudStatusCheckAt = now;
        } catch (err) {
          lastCloudStatusOk = false;
          lastCloudStatusError =
            err instanceof Error
              ? err.message
              : 'Unable to reach Cloudinary Cloud.';
          lastCloudStatusCheckAt = now;
        }
      }

      res.json({
        configured: true,
        connected: lastCloudStatusOk,
        engine: 'Cloudinary Cloud + SQLite',
        database: `${cfg.cloudName} (Cloud Sync)`,
        error: lastCloudStatusOk ? undefined : lastCloudStatusError,
      });
    } catch (err) {
      res.json({
        configured: true,
        connected: false,
        engine: 'Cloudinary Cloud + SQLite',
        database: path.basename(SQLITE_DB_PATH),
        error:
          err instanceof Error ? err.message : 'Unable to connect to database.',
      });
    }
  };
  app.get('/api/database/status', handleDatabaseStatus);
  app.get('/api/mongodb/status', handleDatabaseStatus);

  // --- Cloud-Backed Page Visit Analytics ---
  app.post('/api/analytics/visit', async (req, res) => {
    const rawVisitId = String(req.body?.visitId ?? '').trim();
    const visitId =
      rawVisitId && /^[a-zA-Z0-9_-]{4,128}$/.test(rawVisitId)
        ? rawVisitId
        : `visit_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const visitorType = ALLOWED_VISITOR_TYPES.has(
      String(req.body?.visitorType ?? '')
    )
      ? String(req.body.visitorType)
      : 'General Visitor';
    const deviceType = ALLOWED_DEVICE_TYPES.has(
      String(req.body?.deviceType ?? '')
    )
      ? String(req.body.deviceType)
      : 'Desktop';
    const sourceChannel = ALLOWED_SOURCES.has(
      String(req.body?.sourceChannel ?? '')
    )
      ? String(req.body.sourceChannel)
      : 'Direct Link';
    const interestArea = ALLOWED_INTERESTS.has(
      String(req.body?.interestArea ?? '')
    )
      ? String(req.body.interestArea)
      : 'All Works';
    const rawDateKey = String(req.body?.dateKey ?? '').trim();
    const dateKey = /^\d{4}-\d{2}-\d{2}$/.test(rawDateKey)
      ? rawDateKey
      : getTodayDateKey();
    const isUniqueSession = Boolean(req.body?.isUniqueSession);

    try {
      const db = getSqliteDb();
      const nowIso = new Date().toISOString();
      const existing = db
        .prepare('SELECT id FROM visits WHERE id = ?')
        .get(visitId) as { id: string } | undefined;

      if (!existing) {
        const visitRecord: VisitRecord = {
          id: visitId,
          visitorType,
          deviceType,
          sourceChannel,
          interestArea,
          dateKey,
          isUniqueSession,
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        db.prepare(`
          INSERT INTO visits (
            id, visitor_type, device_type, source_channel, interest_area, date_key, is_unique_session, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          visitId,
          visitorType,
          deviceType,
          sourceChannel,
          interestArea,
          dateKey,
          isUniqueSession ? 1 : 0,
          nowIso,
          nowIso
        );

        recentUpsertedVisits.set(visitId, {
          visit: visitRecord,
          expiresAt: Date.now() + OVERLAY_TTL_MS,
        });

        await saveCloudDoc(`${CLOUD_PREFIX_VISITS}/${visitId}`, visitRecord).catch(
          () => false
        );
      }

      res.status(201).json({ ok: true, visitId, persisted: true });
    } catch {
      res.status(202).json({ ok: true, visitId, persisted: false });
    }
  });

  app.patch('/api/analytics/visit/:visitId', async (req, res) => {
    const visitId = String(req.params.visitId ?? '').trim();
    if (!/^[a-zA-Z0-9_-]{4,128}$/.test(visitId)) {
      res.status(400).json({ error: 'Invalid visitId.' });
      return;
    }

    const visitorType =
      req.body?.visitorType &&
      ALLOWED_VISITOR_TYPES.has(String(req.body.visitorType))
        ? String(req.body.visitorType)
        : null;
    const interestArea =
      req.body?.interestArea &&
      ALLOWED_INTERESTS.has(String(req.body.interestArea))
        ? String(req.body.interestArea)
        : null;

    try {
      const db = getSqliteDb();
      const nowIso = new Date().toISOString();

      const existingRow = db
        .prepare(`
          SELECT id, visitor_type, device_type, source_channel, interest_area, date_key, is_unique_session, created_at
          FROM visits
          WHERE id = ?
        `)
        .get(visitId) as
        | {
            id: string;
            visitor_type: string;
            device_type: string;
            source_channel: string;
            interest_area: string;
            date_key: string;
            is_unique_session: number;
            created_at: string;
          }
        | undefined;

      const updatedRecord: VisitRecord = {
        id: visitId,
        visitorType:
          visitorType ?? existingRow?.visitor_type ?? 'General Visitor',
        deviceType: existingRow?.device_type ?? 'Desktop',
        sourceChannel: existingRow?.source_channel ?? 'Direct Link',
        interestArea: interestArea ?? existingRow?.interest_area ?? 'All Works',
        dateKey: existingRow?.date_key ?? getTodayDateKey(),
        isUniqueSession: Boolean(existingRow?.is_unique_session ?? 0),
        createdAt: existingRow?.created_at ?? nowIso,
        updatedAt: nowIso,
      };

      db.prepare(`
        INSERT OR REPLACE INTO visits (
          id, visitor_type, device_type, source_channel, interest_area, date_key, is_unique_session, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        updatedRecord.id,
        updatedRecord.visitorType,
        updatedRecord.deviceType,
        updatedRecord.sourceChannel,
        updatedRecord.interestArea,
        updatedRecord.dateKey,
        updatedRecord.isUniqueSession ? 1 : 0,
        updatedRecord.createdAt,
        updatedRecord.updatedAt
      );

      recentUpsertedVisits.set(visitId, {
        visit: updatedRecord,
        expiresAt: Date.now() + OVERLAY_TTL_MS,
      });

      await saveCloudDoc(
        `${CLOUD_PREFIX_VISITS}/${visitId}`,
        updatedRecord
      ).catch(() => false);

      res.json({ ok: true, persisted: true });
    } catch {
      res.json({ ok: true, persisted: false });
    }
  });

  app.get('/api/analytics/summary', async (req, res) => {
    const ownerKey = String(req.header('x-owner-key') ?? '');
    if (!isValidOwnerKey(ownerKey)) {
      res.status(401).json({ error: 'Owner verification required.' });
      return;
    }

    const todayKey = getTodayDateKey();

    try {
      await syncVisitsFromCloud();
      const db = getSqliteDb();

      const totalsRow = db
        .prepare(`
          SELECT COUNT(*) AS total_views, COALESCE(SUM(is_unique_session), 0) AS unique_visitors
          FROM visits
        `)
        .get() as { total_views: number; unique_visitors: number } | undefined;

      const dailyRows = db
        .prepare(`
          SELECT date_key, COUNT(*) AS views, COALESCE(SUM(is_unique_session), 0) AS unique_visitors
          FROM visits
          GROUP BY date_key
          ORDER BY date_key DESC
          LIMIT 14
        `)
        .all() as Array<{
        date_key: string;
        views: number;
        unique_visitors: number;
      }>;

      const recentRows = db
        .prepare(`
          SELECT id, visitor_type, device_type, source_channel, interest_area, date_key, is_unique_session, created_at
          FROM visits
          ORDER BY created_at DESC
          LIMIT 30
        `)
        .all() as Array<{
        id: string;
        visitor_type: string;
        device_type: string;
        source_channel: string;
        interest_area: string;
        date_key: string;
        is_unique_session: number;
        created_at: string;
      }>;

      const groupCounts = (column: string): Record<string, number> => {
        const rows = db
          .prepare(
            `SELECT ${column} AS key_name, COUNT(*) AS cnt FROM visits GROUP BY ${column}`
          )
          .all() as Array<{ key_name: string; cnt: number }>;
        const out: Record<string, number> = {};
        for (const r of rows) {
          if (r.key_name) out[r.key_name] = Number(r.cnt);
        }
        return out;
      };

      const dailyStats = dailyRows.map((d) => ({
        dateKey: d.date_key,
        views: Number(d.views ?? 0),
        uniqueVisitors: Number(d.unique_visitors ?? 0),
      }));

      const todayEntry = dailyStats.find((d) => d.dateKey === todayKey);

      res.json({
        totalViews: Math.max(
          Number(totalsRow?.total_views ?? 0),
          cloudVisitsTotalCount
        ),
        totalUniqueVisitors: Number(totalsRow?.unique_visitors ?? 0),
        todayViews: todayEntry?.views ?? 0,
        todayUniqueVisitors: todayEntry?.uniqueVisitors ?? 0,
        dailyStats,
        recentVisits: recentRows.map((v) => ({
          id: v.id,
          visitorType: v.visitor_type || 'General Visitor',
          deviceType: v.device_type || 'Desktop',
          sourceChannel: v.source_channel || 'Direct Link',
          interestArea: v.interest_area || 'All Works',
          dateKey: v.date_key || todayKey,
          isUniqueSession: Boolean(v.is_unique_session),
          createdAt: v.created_at || new Date().toISOString(),
        })),
        visitorTypeCounts: groupCounts('visitor_type'),
        deviceCounts: groupCounts('device_type'),
        sourceCounts: groupCounts('source_channel'),
        interestCounts: groupCounts('interest_area'),
      });
    } catch (err) {
      res.status(500).json({
        error:
          err instanceof Error ? err.message : 'Unable to query analytics.',
      });
    }
  });

  // --- Cloud-Backed Leads (Visitor Callback Numbers) ---
  app.post('/api/leads', async (req, res) => {
    const rawPhone = String(req.body?.phone ?? '').trim().slice(0, 24);
    const name = String(req.body?.name ?? '').trim().slice(0, 80);
    const note = String(req.body?.note ?? '').trim().slice(0, 300);
    const visitorType = ALLOWED_VISITOR_TYPES.has(
      String(req.body?.visitorType ?? '')
    )
      ? String(req.body.visitorType)
      : 'General Visitor';
    const sourceUrl = String(req.body?.sourceUrl ?? '').trim().slice(0, 300);

    const digits = rawPhone.replace(/[^0-9+]/g, '');
    if (digits.length < 7 || digits.length > 20) {
      res.status(400).json({ error: 'Please enter a valid phone number.' });
      return;
    }

    const nowIso = new Date().toISOString();
    const id = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const displayName = name || 'Portfolio Visitor';

    const leadEntry: VisitorLead = {
      id,
      phone: rawPhone,
      name: displayName,
      note,
      visitorType,
      sourceUrl,
      createdAt: nowIso,
    };

    try {
      const db = getSqliteDb();
      db.prepare(`
        INSERT INTO leads (id, phone, name, note, visitor_type, source_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, rawPhone, displayName, note, visitorType, sourceUrl, nowIso);

      recentCreatedLeads.set(id, {
        lead: leadEntry,
        expiresAt: Date.now() + OVERLAY_TTL_MS,
      });

      const cfg = getCloudinaryConfig();
      if (cfg.configured) {
        await saveCloudDoc(`${CLOUD_PREFIX_LEADS}/${id}`, leadEntry);
      }

      res.status(201).json({ ok: true, id, createdAt: nowIso });
    } catch (err) {
      res.status(500).json({
        error:
          err instanceof Error ? err.message : 'Unable to save phone lead.',
      });
    }
  });

  app.get('/api/leads', async (req, res) => {
    const ownerKey = String(req.header('x-owner-key') ?? '');
    if (!isValidOwnerKey(ownerKey)) {
      res.status(401).json({ error: 'Owner verification required.' });
      return;
    }

    try {
      const leads = await getLeadsSynced();
      res.json({ leads });
    } catch (err) {
      res.status(500).json({
        error:
          err instanceof Error ? err.message : 'Unable to query saved leads.',
      });
    }
  });

  // --- Cloud-Backed Dynamic Portfolio Items + SSE Cross-Device Sync ---
  app.get('/api/portfolio-items/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    res.write(`event: connected\ndata: {}\n\n`);

    portfolioStreamClients.add(res);
    const heartbeat = setInterval(() => {
      try {
        res.write(`: heartbeat\n\n`);
      } catch {
        clearInterval(heartbeat);
        portfolioStreamClients.delete(res);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      portfolioStreamClients.delete(res);
    });
  });

  app.get('/api/portfolio-items', async (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      const items = await getPortfolioItemsSynced();
      res.json({ items });
    } catch (err) {
      res.status(500).json({
        error:
          err instanceof Error
            ? err.message
            : 'Unable to load portfolio items.',
      });
    }
  });

  app.post('/api/portfolio-items', async (req, res) => {
    const ownerKey = String(req.header('x-owner-key') ?? '');
    if (!isValidOwnerKey(ownerKey)) {
      res.status(401).json({ error: 'Owner verification required.' });
      return;
    }

    const title = String(req.body?.title ?? '').trim().slice(0, 100);
    const subtitle = String(req.body?.subtitle ?? '').trim().slice(0, 120);
    const rawCat = String(req.body?.category ?? 'branding');
    const category = (
      ALLOWED_CATEGORIES.has(rawCat) ? rawCat : 'branding'
    ) as PortfolioItemPublic['category'];
    const categoryLabel =
      String(req.body?.categoryLabel ?? 'Design').trim().slice(0, 40) || 'Design';
    const year = String(req.body?.year ?? '2026').trim().slice(0, 10) || '2026';
    const medium =
      String(req.body?.medium ?? 'Digital Graphic Design')
        .trim()
        .slice(0, 60) || 'Digital Graphic Design';
    const description = String(req.body?.description ?? '')
      .trim()
      .slice(0, 500);
    const image = String(req.body?.image ?? '').trim().slice(0, 500);
    const thumbnail = String(req.body?.thumbnail ?? image)
      .trim()
      .slice(0, 500);
    const cloudinaryPublicId = String(req.body?.cloudinaryPublicId ?? '')
      .trim()
      .slice(0, 200);

    if (!title || !subtitle || !description || !image) {
      res
        .status(400)
        .json({ error: 'Title, subtitle, description, and image are required.' });
      return;
    }

    const id = `art_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const nowIso = new Date().toISOString();
    const publicItem: PortfolioItemPublic = {
      id,
      title,
      subtitle,
      category,
      categoryLabel,
      year,
      medium,
      description,
      image,
      thumbnail,
      cloudinaryPublicId,
      createdAt: nowIso,
    };

    try {
      const cfg = getCloudinaryConfig();
      if (cfg.configured) {
        const savedCloud = await saveCloudDoc(
          `${CLOUD_PREFIX_ITEMS}/${id}`,
          publicItem
        );
        if (!savedCloud) {
          res.status(502).json({
            error: 'Unable to persist artwork to Cloudinary Cloud.',
          });
          return;
        }
      }

      const db = getSqliteDb();
      db.prepare(`
        INSERT OR REPLACE INTO portfolio_items (
          id, title, subtitle, category, category_label, year, medium, description, image, thumbnail, cloudinary_public_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        title,
        subtitle,
        category,
        categoryLabel,
        year,
        medium,
        description,
        image,
        thumbnail,
        cloudinaryPublicId,
        nowIso
      );

      recentDeletedItemIds.delete(id);
      recentCreatedItems.set(id, {
        item: publicItem,
        expiresAt: Date.now() + OVERLAY_TTL_MS,
      });
      lastItemsSyncAt = Date.now();
      broadcastPortfolioUpdated();

      res.status(201).json({ item: publicItem });
    } catch (err) {
      res.status(500).json({
        error:
          err instanceof Error
            ? err.message
            : 'Unable to save portfolio item.',
      });
    }
  });

  app.delete('/api/portfolio-items/:id', async (req, res) => {
    const ownerKey = String(req.header('x-owner-key') ?? '');
    if (!isValidOwnerKey(ownerKey)) {
      res.status(401).json({ error: 'Owner verification required.' });
      return;
    }

    const id = String(req.params.id ?? '').trim();
    if (!id) {
      res.status(400).json({ error: 'Missing item id.' });
      return;
    }

    try {
      const db = getSqliteDb();
      const row = db
        .prepare('SELECT cloudinary_public_id FROM portfolio_items WHERE id = ?')
        .get(id) as { cloudinary_public_id?: string } | undefined;

      await deleteCloudDoc(`${CLOUD_PREFIX_ITEMS}/${id}`, 'raw').catch(
        () => false
      );
      if (row?.cloudinary_public_id) {
        await deleteCloudDoc(row.cloudinary_public_id, 'image').catch(
          () => false
        );
      }

      db.prepare('DELETE FROM portfolio_items WHERE id = ?').run(id);
      recentCreatedItems.delete(id);
      recentDeletedItemIds.set(id, Date.now() + OVERLAY_TTL_MS);
      lastItemsSyncAt = Date.now();
      broadcastPortfolioUpdated();

      res.json({ ok: true, id });
    } catch (err) {
      res.status(500).json({
        error:
          err instanceof Error
            ? err.message
            : 'Unable to delete portfolio item.',
      });
    }
  });

  // --- Cloudinary CDN Endpoints (Untouched) ---
  app.get('/api/cloudinary/status', (_req, res) => {
    const cfg = getCloudinaryConfig();
    res.json({
      configured: cfg.configured,
      cloudName: cfg.configured ? cfg.cloudName : null,
    });
  });

  app.post('/api/cloudinary/upload', async (req, res) => {
    const ownerKey = String(req.header('x-owner-key') ?? '');
    if (!isValidOwnerKey(ownerKey)) {
      res.status(401).json({ error: 'Owner verification required.' });
      return;
    }

    const cfg = getCloudinaryConfig();
    if (!cfg.configured) {
      res.status(503).json({
        error:
          'Cloudinary secrets are not configured yet. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in Secrets.',
      });
      return;
    }

    const imageDataUrl = String(req.body?.imageDataUrl ?? '');
    if (!imageDataUrl.startsWith('data:image/')) {
      res.status(400).json({ error: 'Please select a valid image file.' });
      return;
    }

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const folder = 'biniyam-portfolio';
      const paramsToSign = `folder=${folder}&timestamp=${timestamp}${cfg.apiSecret}`;
      const signature = crypto
        .createHash('sha1')
        .update(paramsToSign)
        .digest('hex');

      const form = new FormData();
      form.append('file', imageDataUrl);
      form.append('folder', folder);
      form.append('timestamp', String(timestamp));
      form.append('api_key', cfg.apiKey);
      form.append('signature', signature);

      const uploadResp = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(cfg.cloudName)}/image/upload`,
        {
          method: 'POST',
          body: form,
        }
      );

      const uploadData = (await uploadResp.json()) as {
        secure_url?: string;
        public_id?: string;
        width?: number;
        height?: number;
        format?: string;
        error?: { message?: string };
      };

      if (!uploadResp.ok || !uploadData.secure_url || !uploadData.public_id) {
        res.status(502).json({
          error:
            uploadData.error?.message ||
            'Cloudinary upload failed. Check your Cloudinary credentials.',
        });
        return;
      }

      const secureUrl = uploadData.secure_url;
      const thumbnailUrl = secureUrl.replace(
        '/upload/',
        '/upload/w_800,f_auto,q_auto/'
      );

      res.status(201).json({
        secureUrl,
        thumbnailUrl,
        publicId: uploadData.public_id,
        width: uploadData.width ?? null,
        height: uploadData.height ?? null,
        format: uploadData.format ?? null,
      });
    } catch {
      res.status(500).json({ error: 'Unexpected error uploading to Cloudinary.' });
    }
  });

  app.use('/assets', (_req, res, next) => {
    res.setHeader(
      'Cache-Control',
      'public, max-age=604800, stale-while-revalidate=86400'
    );
    next();
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        port: PORT,
        allowedHosts: ['.run.app'],
        hmr: hmrDisabled ? false : { server: httpServer },
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(
      express.static(distDir, {
        maxAge: '7d',
        etag: true,
      })
    );
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Portfolio server running at http://localhost:${PORT}`);
  });
}

startServer();
