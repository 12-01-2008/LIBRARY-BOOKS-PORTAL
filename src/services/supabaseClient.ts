import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseClientConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  !SUPABASE_URL.includes('your-project-id') &&
  !SUPABASE_ANON_KEY.includes('your-anon-key')
);

// Client-side fetch proxy handler ensuring browser requests succeed even with test domains
const clientFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const urlStr = input.toString();
  // If URL is the test/dummy domain or local, rewrite to /api/supabase-proxy
  if (urlStr.includes('abcdefgh.supabase.co') || !urlStr.startsWith('https://')) {
    const parsed = new URL(urlStr);
    const proxyUrl = `/api/supabase-proxy${parsed.pathname}${parsed.search}`;
    return fetch(proxyUrl, init);
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(input, { ...init, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch {
    const parsed = new URL(urlStr);
    const proxyUrl = `/api/supabase-proxy${parsed.pathname}${parsed.search}`;
    return fetch(proxyUrl, init);
  }
};

export const supabase: SupabaseClient | null = isSupabaseClientConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        fetch: clientFetch
      }
    })
  : null;
