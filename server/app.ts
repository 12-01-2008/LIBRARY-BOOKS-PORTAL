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

  let supabaseConnected = false;
  let booksSource = 'in_memory_fallback';
  let booksCount = 0;
  let connectionMessage = '';

  const { getSupabaseAdminClient, supabaseConfig } = await import('./config/supabase.ts');
  const client = getSupabaseAdminClient();

  if (client) {
    try {
      const { data, count, error } = await client
        .from('books')
        .select('id, title', { count: 'exact' })
        .limit(5);

      if (!error && data) {
        supabaseConnected = true;
        booksSource = 'supabase';
        booksCount = count ?? data.length;
        connectionMessage = 'Successfully queried books table in Supabase PostgreSQL.';
      } else if (error) {
        connectionMessage = `Supabase query error: ${error.message}`;
        booksCount = supabaseConfig.memory.getAll().length;
      }
    } catch (err: any) {
      connectionMessage = `Supabase query threw: ${err.message}`;
      booksCount = supabaseConfig.memory.getAll().length;
    }
  } else {
    connectionMessage = 'Supabase client credentials not active; using in-memory store.';
    booksCount = supabaseConfig.memory.getAll().length;
  }

  res.json({
    status: 'ok',
    service: 'Smart Library Book Availability API',
    timestamp: new Date().toISOString(),
    credentials,
    database: {
      supabase_connected: supabaseConnected,
      books_source: booksSource,
      books_count: booksCount,
      message: connectionMessage,
    }
  });
});

// REST API routes
app.use('/api', apiRoutes);

// Centralized Error Handling
app.use(errorHandler);

export default app;
