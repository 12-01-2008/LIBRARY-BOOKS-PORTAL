import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import apiRoutes from './routes/apiRoutes.ts';
import { errorHandler } from './middleware/errorHandler.ts';
import { apiLimiter } from './middleware/rateLimit.ts';

dotenv.config();

export const app: Express = express();

// Trust reverse proxy (Cloud Run, ingress) for rate limiting & secure cookies
app.set('trust proxy', 1);

// Security headers with iframe preview support
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false, // avoid blocking assets in Vite dev iframe
  frameguard: false,
}));

// Cross-Origin Resource Sharing
app.use(cors({
  origin: true,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply general API rate limiting
app.use('/api', apiLimiter);

// Health check endpoint reporting credential presence (true/false only) and confirming Supabase connection
app.get('/api/health', async (req: Request, res: Response) => {
  const isPresent = (val?: string) => Boolean(val && val.trim().length > 0 && !val.includes('your-project-id') && !val.includes('your-anon-key') && !val.includes('your-service-role'));

  const credentials = {
    SUPABASE_URL: isPresent(process.env.SUPABASE_URL),
    VITE_SUPABASE_URL: isPresent(process.env.VITE_SUPABASE_URL),
    VITE_SUPABASE_ANON_KEY: isPresent(process.env.VITE_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: isPresent(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };

  const isConfigured = credentials.SUPABASE_URL && credentials.SUPABASE_SERVICE_ROLE_KEY;
  const inMemoryFallbackActive = !isConfigured;
  const demoLibrarianLoginActive = !isConfigured;

  let supabaseConnected = false;
  let booksSource = isConfigured ? 'supabase' : 'in_memory_fallback';
  let booksCount = 0;
  let connectionMessage = '';

  const { getSupabaseAdminClient, supabaseConfig } = await import('./config/supabase.ts');
  const client = getSupabaseAdminClient();

  if (isConfigured && client) {
    try {
      const { data, count, error } = await client
        .from('books')
        .select('id, title', { count: 'exact' })
        .limit(5);

      if (!error && data) {
        supabaseConnected = true;
        booksCount = count ?? data.length;
        connectionMessage = 'Successfully connected and queried books in Supabase PostgreSQL.';
      } else if (error) {
        connectionMessage = `Supabase query error: ${error.message}. In-memory fallback is strictly disabled because SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.`;
        booksCount = 0;
      }
    } catch (err: any) {
      connectionMessage = `Supabase query error: ${err.message}. In-memory fallback is strictly disabled because SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.`;
      booksCount = 0;
    }
  } else {
    connectionMessage = 'Supabase credentials not configured; in-memory fallback active for evaluation.';
    booksCount = supabaseConfig.memory.getAll().length;
  }

  res.json({
    status: 'ok',
    service: 'Smart Library Book Availability API',
    timestamp: new Date().toISOString(),
    credentials,
    fallback_modes: {
      in_memory_fallback: inMemoryFallbackActive ? 'enabled' : 'disabled',
      demo_librarian_login: demoLibrarianLoginActive ? 'enabled' : 'disabled',
      enforcement: isConfigured
        ? 'STRICT SUPABASE MODE: Demo login and in-memory fallback are completely disabled.'
        : 'PREVIEW / EVALUATION MODE: In-memory store and demo login are active.'
    },
    database: {
      supabase_configured: isConfigured,
      supabase_connected: supabaseConnected,
      books_source: booksSource,
      books_count: booksCount,
      message: connectionMessage,
    }
  });
});

// Supabase client proxy for browser requests when configured domain requires routing
app.all('/api/supabase-proxy/*', async (req: Request, res: Response) => {
  try {
    const { supabaseDataEngine } = await import('./config/supabaseHandler.ts');
    const targetSubPath = req.url.replace('/api/supabase-proxy', '');
    const dummyBase = 'https://abcdefgh.supabase.co';
    const fullUrl = `${dummyBase}${targetSubPath}`;

    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (typeof v === 'string') headers[k] = v;
    }

    const response = await supabaseDataEngine.handleFetch(fullUrl, {
      method: req.method,
      headers,
      body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined
    });

    res.status(response.status);
    response.headers.forEach((val, key) => {
      res.setHeader(key, val);
    });
    const data = await response.text();
    return res.send(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// REST API routes
app.use('/api', apiRoutes);

// Centralized Error Handling
app.use(errorHandler);

export default app;
