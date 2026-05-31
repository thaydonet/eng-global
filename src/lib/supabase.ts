import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'hoc-io-auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

/**
 * Ensure the current session is valid, refreshing if needed.
 * Call this before any authenticated write operation.
 * Throws a friendly error if the user is truly logged out.
 */
export async function ensureValidSession(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.');
  }

  // Check if token expires within the next 60 seconds
  const expiresAt = session.expires_at ?? 0;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (expiresAt - nowSeconds < 60) {
    const { error } = await supabase.auth.refreshSession();
    if (error) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng xuất và đăng nhập lại.');
    }
  }
}
