import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';

interface VisitorLead {
  id: string;
  phone: string;
  name: string;
  note: string;
  sourceUrl: string;
  createdAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

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
  const normalized = key.replace(/[^0-9]/g, '');
  return (
    normalized === '7669' ||
    normalized === '0992947669' ||
    normalized === '251992947669'
  );
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = 3000;
  const hmrDisabled = process.env.DISABLE_HMR === 'true';

  app.use(express.json());

  app.post('/api/leads', (req, res) => {
    const rawPhone = String(req.body?.phone ?? '').trim();
    const name = String(req.body?.name ?? '').trim().slice(0, 80);
    const note = String(req.body?.note ?? '').trim().slice(0, 300);
    const sourceUrl = String(req.body?.sourceUrl ?? '').trim().slice(0, 300);

    const digits = rawPhone.replace(/[^0-9+]/g, '');
    if (digits.length < 7 || digits.length > 20) {
      res.status(400).json({ error: 'Please enter a valid phone number.' });
      return;
    }

    const entry: VisitorLead = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      phone: rawPhone,
      name: name || 'Portfolio Visitor',
      note,
      sourceUrl,
      createdAt: new Date().toISOString(),
    };

    leadsStore = [entry, ...leadsStore].slice(0, 500);
    saveLeads(leadsStore);

    res.status(201).json({ ok: true, id: entry.id, createdAt: entry.createdAt });
  });

  app.get('/api/leads', (req, res) => {
    const ownerKey = String(req.header('x-owner-key') ?? '');
    if (!isValidOwnerKey(ownerKey)) {
      res.status(401).json({ error: 'Owner verification required.' });
      return;
    }
    res.json({ leads: leadsStore });
  });

  app.use('/assets', (_req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
    next();
  });

  if (process.env.NODE_ENV !== 'production') {
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
