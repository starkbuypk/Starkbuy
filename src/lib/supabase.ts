import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://yfgxtattyuoovrriirtf.supabase.co';
export const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmZ3h0YXR0eXVvb3ZycmlpcnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MTc4NDgsImV4cCI6MjEwNTI5Mzg0OH0.eguLKkQkmsGpNwtdJAQgFwTYHsjhdVaN6xObAFS7nJA';

function makeClient(): SupabaseClient {
  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    { auth: { storageKey: 'sb-starkbuy-auth' } },
  );
}

// In development Vite re-evaluates modules on HMR; persist the instance
// across reloads so only one GoTrueClient ever exists per page load.
declare const __SUPABASE_CLIENT__: SupabaseClient | undefined;

let client: SupabaseClient;

if (import.meta.hot) {
  // HMR path: reuse the client stored in hot module data
  if (!import.meta.hot.data.client) {
    import.meta.hot.data.client = makeClient();
  }
  client = import.meta.hot.data.client as SupabaseClient;
} else {
  // Production path: module is evaluated exactly once
  client = makeClient();
}

export const supabase = client;
