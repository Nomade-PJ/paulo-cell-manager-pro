
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const SUPABASE_URL = "https://kpfxdnvngsvckuubyhic.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZnhkbnZuZ3N2Y2t1dWJ5aGljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwODYxNzEsImV4cCI6MjA1OTY2MjE3MX0.Y-OpwT8aUS4nu2KjVEDG9hPvNRVSjwmvIJRo7Zmpb-o";

// Export the supabase client with our enhanced types
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage
  }
});
