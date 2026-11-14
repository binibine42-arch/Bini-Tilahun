import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import http from 'http';
import { type Db, MongoClient } from 'mongodb';
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

interface MongoVisitDoc {
  _id: string;
  visitorType: string;
  deviceType: string;
  sourceChannel: string;
  interestArea: string;
  dateKey: string;
  isUniqueSession: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MongoDailyStatDoc {
  _id: string;
  dateKey: string;
  views: number;
  uniqueVisitors: number;
  updatedAt: Date;
}

interface MongoOverviewStatDoc {
  _id: string;
  totalViews: number;
  uniqueVisitors: number;
  updatedAt: Date;
}

interface MongoLeadDoc {
  _id: string;
  phone: string;
  name: string;
  note: string;
  visitorType: string;
  sourceUrl: string;
  createdAt: Date;
}

interface MongoPortfolioItemDoc {
  _id: string;
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
  createdAt: Date;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

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

// --- MongoDB Client Singleton ---
let cachedMongoClientPromise: Promise<MongoClient> | null = null;
let mongoIndexesInitialized = false;

function getMongoConfig() {
  const uri = (process.env.MONGODB_URI ?? '').trim();
  const dbName =
    (process.env.MONGODB_DB_NAME ?? 'biniyam_portfolio').trim() ||
    'biniyam_portfolio';
  const configured = Boolean(
    uri &&
      !uri.startsWith('MY_') &&
      (uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'))
  );
  return { configured, uri, dbName };
}

async function getMongoDb(): Promise<Db | null> {
  const cfg = getMongoConfig();
  if (!cfg.configured) return null;

  try {
    if (!cachedMongoClientPromise) {
      const client = new MongoClient(cfg.uri, {
        serverSelectionTimeoutMS: 5000,
      });
      cachedMongoClientPromise = client.connect();
    }
    const client = await cachedMongoClientPromise;
    const db = client.db(cfg.dbName);

    if (!mongoIndexesInitialized) {
      mongoIndexesInitialized = true;
      await Promise.all([
        db.collection<MongoVisitDoc>('visits').createIndex({ createdAt: -1 }),
        db
          .collection<MongoDailyStatDoc>('dailyStats')
          .createIndex({ dateKey: -1 }, { unique: true }),
        db.collection<MongoLeadDoc>('leads').createIndex({ createdAt: -1 }),
        db
          .collection<MongoPortfolioItemDoc>('portfolioItems')
          .createIndex({ createdAt: -1 }),
      ]).catch(() => {
        mongoIndexesInitialized = false;
      });
    }

    return db;
  } catch (err) {
    cachedMongoClientPromise = null;
    mongoIndexesInitialized = false;
    throw err;
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

function loadLeads(): VisitorLead[] {
  try {
    if (fs.existsSync(LEADS_FILE)) {
      const raw = fs.readFileSync(LEADS_FILE, 'utf-8');
      return JSON.parse(raw) as VisitorLead[];
    }
  } catch {
    // Fallback to empty array if file unreadable
  }
  return [];
}

function saveLeads(leads: VisitorLead[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
  } catch {
    // Ignore disk write errors in read-only environments; memory store persists for session
  }
}

let leadsStore: VisitorLead[] = loadLeads();

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

  app.use(express.json({ limit: '15mb' }));

  // --- Owner Passcode Verification ---
  app.post('/api/owner/verify', (req, res) => {
    const key = String(req.body?.ownerKey ?? '');
    if (!isValidOwnerKey(key)) {
      res.status(401).json({ error: 'Invalid owner passcode.' });
      return;
    }
    res.json({ ok: true });
  });

  // --- MongoDB Status ---
  app.get('/api/mongodb/status', async (_req, res) => {
    const cfg = getMongoConfig();
    if (!cfg.configured) {
      res.json({
        configured: false,
        connected: false,
        database: cfg.dbName,
      });
      return;
    }
    try {
      const db = await getMongoDb();
      if (db) {
        await db.command({ ping: 1 });
        res.json({
          configured: true,
          connected: true,
          database: cfg.dbName,
        });
        return;
      }
      res.json({
        configured: true,
        connected: false,
        database: cfg.dbName,
      });
    } catch (err) {
      const rawMsg =
        err instanceof Error ? err.message : 'Unable to connect to MongoDB.';
      const friendlyMsg =
        rawMsg.includes('alert number 80') ||
        rawMsg.includes('tlsv1 alert internal error')
          ? 'MongoDB Atlas rejected the TLS connection. In Atlas → Security → Network Access, add 0.0.0.0/0 (Allow Access from Anywhere) so Cloud Run can connect.'
          : rawMsg;
      res.json({
        configured: true,
        connected: false,
        database: cfg.dbName,
        error: friendlyMsg,
      });
    }
  });

  // --- MongoDB Page Visit Analytics ---
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
      const db = await getMongoDb();
      if (!db) {
        res.status(202).json({ ok: true, visitId, persisted: false });
        return;
      }

      const now = new Date();
      const existing = await db
        .collection<MongoVisitDoc>('visits')
        .findOne({ _id: visitId });

      if (!existing) {
        await db.collection<MongoVisitDoc>('visits').insertOne({
          _id: visitId,
          visitorType,
          deviceType,
          sourceChannel,
          interestArea,
          dateKey,
          isUniqueSession,
          createdAt: now,
          updatedAt: now,
        });

        await Promise.all([
          db.collection<MongoDailyStatDoc>('dailyStats').updateOne(
            { _id: dateKey },
            {
              $setOnInsert: { dateKey },
              $inc: {
                views: 1,
                uniqueVisitors: isUniqueSession ? 1 : 0,
              },
              $set: { updatedAt: now },
            },
            { upsert: true }
          ),
          db.collection<MongoOverviewStatDoc>('stats').updateOne(
            { _id: 'overview' },
            {
              $inc: {
                totalViews: 1,
                uniqueVisitors: isUniqueSession ? 1 : 0,
              },
              $set: { updatedAt: now },
            },
            { upsert: true }
          ),
        ]);
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

    const updates: Partial<MongoVisitDoc> = { updatedAt: new Date() };
    if (
      req.body?.visitorType &&
      ALLOWED_VISITOR_TYPES.has(String(req.body.visitorType))
    ) {
      updates.visitorType = String(req.body.visitorType);
    }
    if (
      req.body?.interestArea &&
      ALLOWED_INTERESTS.has(String(req.body.interestArea))
    ) {
      updates.interestArea = String(req.body.interestArea);
    }

    try {
      const db = await getMongoDb();
      if (!db) {
        res.json({ ok: true, persisted: false });
        return;
      }
      await db
        .collection<MongoVisitDoc>('visits')
        .updateOne({ _id: visitId }, { $set: updates });
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
    const emptySnapshot = {
      totalViews: 0,
      totalUniqueVisitors: 0,
      todayViews: 0,
      todayUniqueVisitors: 0,
      dailyStats: [],
      recentVisits: [],
      visitorTypeCounts: {},
      deviceCounts: {},
      sourceCounts: {},
      interestCounts: {},
    };

    try {
      const db = await getMongoDb();
      if (!db) {
        res.json(emptySnapshot);
        return;
      }

      const [
        overviewDoc,
        dailyDocs,
        recentDocs,
        visitorAgg,
        deviceAgg,
        sourceAgg,
        interestAgg,
      ] = await Promise.all([
        db
          .collection<MongoOverviewStatDoc>('stats')
          .findOne({ _id: 'overview' }),
        db
          .collection<MongoDailyStatDoc>('dailyStats')
          .find({})
          .sort({ dateKey: -1 })
          .limit(14)
          .toArray(),
        db
          .collection<MongoVisitDoc>('visits')
          .find({})
          .sort({ createdAt: -1 })
          .limit(30)
          .toArray(),
        db
          .collection<MongoVisitDoc>('visits')
          .aggregate<{ _id: string; count: number }>([
            { $group: { _id: '$visitorType', count: { $sum: 1 } } },
          ])
          .toArray(),
        db
          .collection<MongoVisitDoc>('visits')
          .aggregate<{ _id: string; count: number }>([
            { $group: { _id: '$deviceType', count: { $sum: 1 } } },
          ])
          .toArray(),
        db
          .collection<MongoVisitDoc>('visits')
          .aggregate<{ _id: string; count: number }>([
            { $group: { _id: '$sourceChannel', count: { $sum: 1 } } },
          ])
          .toArray(),
        db
          .collection<MongoVisitDoc>('visits')
          .aggregate<{ _id: string; count: number }>([
            { $group: { _id: '$interestArea', count: { $sum: 1 } } },
          ])
          .toArray(),
      ]);

      const toCountMap = (rows: Array<{ _id: string; count: number }>) => {
        const out: Record<string, number> = {};
        for (const r of rows) {
          if (r._id) out[r._id] = r.count;
        }
        return out;
      };

      const dailyStats = dailyDocs.map((d) => ({
        dateKey: d.dateKey,
        views: Number(d.views ?? 0),
        uniqueVisitors: Number(d.uniqueVisitors ?? 0),
      }));

      const todayEntry = dailyStats.find((d) => d.dateKey === todayKey);

      res.json({
        totalViews: Math.max(
          Number(overviewDoc?.totalViews ?? 0),
          recentDocs.length
        ),
        totalUniqueVisitors: Number(overviewDoc?.uniqueVisitors ?? 0),
        todayViews: todayEntry?.views ?? 0,
        todayUniqueVisitors: todayEntry?.uniqueVisitors ?? 0,
        dailyStats,
        recentVisits: recentDocs.map((v) => ({
          id: v._id,
          visitorType: v.visitorType || 'General Visitor',
          deviceType: v.deviceType || 'Desktop',
          sourceChannel: v.sourceChannel || 'Direct Link',
          interestArea: v.interestArea || 'All Works',
          dateKey: v.dateKey || todayKey,
          isUniqueSession: Boolean(v.isUniqueSession),
          createdAt:
            v.createdAt instanceof Date
              ? v.createdAt.toISOString()
              : new Date().toISOString(),
        })),
        visitorTypeCounts: toCountMap(visitorAgg),
        deviceCounts: toCountMap(deviceAgg),
        sourceCounts: toCountMap(sourceAgg),
        interestCounts: toCountMap(interestAgg),
      });
    } catch (err) {
      res.status(502).json({
        error:
          err instanceof Error
            ? err.message
            : 'Unable to query MongoDB analytics.',
      });
    }
  });

  // --- MongoDB Leads (Visitor Callback Numbers) ---
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

    const now = new Date();
    const id = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const entry: VisitorLead = {
      id,
      phone: rawPhone,
      name: name || 'Portfolio Visitor',
      note,
      visitorType,
      sourceUrl,
      createdAt: now.toISOString(),
    };

    try {
      const db = await getMongoDb();
      if (db) {
        await db.collection<MongoLeadDoc>('leads').insertOne({
          _id: id,
          phone: entry.phone,
          name: entry.name,
          note: entry.note,
          visitorType: entry.visitorType,
          sourceUrl: entry.sourceUrl,
          createdAt: now,
        });
      }
    } catch {
      // Backup store still saves below if MongoDB is temporarily unreachable
    }

    leadsStore = [entry, ...leadsStore].slice(0, 500);
    saveLeads(leadsStore);

    res.status(201).json({ ok: true, id: entry.id, createdAt: entry.createdAt });
  });

  app.get('/api/leads', async (req, res) => {
    const ownerKey = String(req.header('x-owner-key') ?? '');
    if (!isValidOwnerKey(ownerKey)) {
      res.status(401).json({ error: 'Owner verification required.' });
      return;
    }

    try {
      const db = await getMongoDb();
      if (db) {
        const docs = await db
          .collection<MongoLeadDoc>('leads')
          .find({})
          .sort({ createdAt: -1 })
          .limit(100)
          .toArray();

        if (docs.length > 0 || leadsStore.length === 0) {
          res.json({
            leads: docs.map((d) => ({
              id: d._id,
              phone: d.phone,
              name: d.name,
              note: d.note,
              visitorType: d.visitorType || 'General Visitor',
              sourceUrl: d.sourceUrl || '',
              createdAt:
                d.createdAt instanceof Date
                  ? d.createdAt.toISOString()
                  : new Date().toISOString(),
            })),
          });
          return;
        }
      }
    } catch {
      // Fallback to local leadsStore
    }

    res.json({ leads: leadsStore });
  });

  // --- MongoDB Dynamic Portfolio Items (Uploaded via Cloudinary) ---
  app.get('/api/portfolio-items', async (_req, res) => {
    try {
      const db = await getMongoDb();
      if (!db) {
        res.json({ items: [] });
        return;
      }

      const docs = await db
        .collection<MongoPortfolioItemDoc>('portfolioItems')
        .find({})
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();

      res.json({
        items: docs.map((d) => ({
          id: d._id,
          title: d.title,
          subtitle: d.subtitle,
          category: d.category,
          categoryLabel: d.categoryLabel,
          year: d.year,
          medium: d.medium,
          description: d.description,
          image: d.image,
          thumbnail: d.thumbnail || d.image,
          cloudinaryPublicId: d.cloudinaryPublicId,
        })),
      });
    } catch {
      res.json({ items: [] });
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
    ) as MongoPortfolioItemDoc['category'];
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

    try {
      const db = await getMongoDb();
      if (!db) {
        res.status(503).json({
          error:
            'MongoDB is not connected yet. Add MONGODB_URI to .env or AI Studio Secrets to save uploaded artworks.',
        });
        return;
      }

      const id = `art_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date();
      await db.collection<MongoPortfolioItemDoc>('portfolioItems').insertOne({
        _id: id,
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
        createdAt: now,
      });

      res.status(201).json({
        item: {
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
        },
      });
    } catch (err) {
      res.status(502).json({
        error:
          err instanceof Error
            ? err.message
            : 'Unable to save portfolio item to MongoDB.',
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
    res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
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
